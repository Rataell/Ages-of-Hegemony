import { randomBytes, randomUUID } from 'node:crypto';
import { GameIdSchema, PlayerIdSchema, type AlphaError } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';
import { err, ok, type Result } from '@aoh/shared';
import { AlphaRoomSchema, CreateAlphaRoomSchema, LobbyActionSchema, type AlphaRepository, type AlphaRoom } from './alpha-room.js';
import { alphaPlayerView } from './alpha-projection.js';
import type { GuestPrincipal } from './guest-session.js';

export function roomView(room:AlphaRoom,principal:GuestPrincipal){
  const seat=room.seats.find(s=>s.guestId===principal.guestId);if(!seat)return null;
  return {id:room.id,version:room.version,name:room.name,joinCode:room.joinCode,preset:room.preset,worldPreset:room.worldPreset,seed:room.seed,seatLimit:room.seatLimit,planningSeconds:room.planningSeconds,deadline:room.deadline,
    selfPlayerId:seat.playerId,isHost:room.hostGuestId===principal.guestId,
    seats:room.seats.map(s=>({playerId:s.playerId,name:s.name,civilization:s.civilization,ready:s.ready,isHost:s.guestId===room.hostGuestId})),
    game:room.game?alphaPlayerView(room.game,seat.playerId):null};
}
export type AlphaRoomView=NonNullable<ReturnType<typeof roomView>>;
type Response=Result<AlphaRoomView,AlphaError>;
const forbidden=()=>err({code:'FORBIDDEN',message:'Esta sessão não ocupa um lugar na partida.'});
const conflict=()=>err({code:'VERSION_CONFLICT',message:'A partida mudou. Atualize antes de confirmar novamente.'});
export class AlphaGameService {
  constructor(private readonly repository:AlphaRepository){}
  /** Server clock drives deadlines; CAS makes concurrent polling safe. No client time is accepted. */
  private async expire(room:AlphaRoom,now:number):Promise<AlphaRoom|null>{
    if(!room.game||room.deadline===null||now<room.deadline)return room;
    const expected=room.version;
    for(const actor of [...room.game.initiative]){
      const player=room.game.players.find(p=>p.playerId===actor)!;if(player.ready)continue;
      if(!player.ambitionsChosen){
        const chosen=applyAlphaCommand(room.game,actor,{type:'CHOOSE_AMBITIONS',expectedVersion:room.game.version,cardIds:player.ambitions.slice(0,2)});
        if(!chosen.ok)throw new Error(`Alpha timeout failed: ${chosen.error.code}`);room.game=chosen.value;
      }
      const ready=applyAlphaCommand(room.game,actor,{type:'READY',expectedVersion:room.game.version});
      if(!ready.ok)throw new Error(`Alpha timeout failed: ${ready.error.code}`);room.game=ready.value;
    }
    room.version++;room.deadline=room.game.core.status==='FINISHED'?null:now+room.planningSeconds*1000;
    return await this.repository.save(room,expected)?room:null;
  }
  async create(principal:GuestPrincipal,raw:unknown):Promise<Response>{
    const input=CreateAlphaRoomSchema.safeParse(raw);if(!input.success)return err({code:'INVALID_INPUT',message:'Revise nome, jogadores, duração e semente da partida.'});
    const {displayName,...options}=input.data;
    const room=AlphaRoomSchema.parse({...options,id:GameIdSchema.parse(randomUUID()),joinCode:randomBytes(16).toString('base64url'),version:0,hostGuestId:principal.guestId,deadline:null,game:null,
      seats:[{guestId:principal.guestId,playerId:PlayerIdSchema.parse('player-1'),name:displayName,civilization:null,ready:false}]});
    if(!await this.repository.create(room))return err({code:'ALREADY_EXISTS',message:'Não foi possível criar a partida. Tente novamente.'});
    return ok(roomView(room,principal)!);
  }
  async join(principal:GuestPrincipal,code:string,displayName:string):Promise<Response>{
    if(!/^[A-Za-z0-9_-]{22}$/.test(code)||!displayName.trim()||displayName.trim().length>80)return err({code:'INVALID_INPUT',message:'Informe um código de convite válido e seu nome.'});
    const room=await this.repository.findByCode(code);if(!room)return err({code:'NOT_FOUND',message:'Convite não encontrado.'});
    const existing=roomView(room,principal);if(existing)return ok(existing);
    if(room.game||room.seats.length>=room.seatLimit)return err({code:'LOBBY_CLOSED',message:'A partida já começou ou não possui vagas.'});
    const expected=room.version;
    room.seats.push({guestId:principal.guestId,playerId:PlayerIdSchema.parse(`player-${room.seats.length+1}`),name:displayName.trim(),civilization:null,ready:false});room.version++;
    return await this.repository.save(room,expected)?ok(roomView(room,principal)!):conflict();
  }
  async read(principal:GuestPrincipal,id:string,now:number):Promise<Response>{
    const loaded=await this.repository.find(id);if(!loaded)return err({code:'NOT_FOUND',message:'Partida não encontrada.'});
    if(!roomView(loaded,principal))return forbidden();
    const room=await this.expire(loaded,now);return room?ok(roomView(room,principal)!):conflict();
  }
  async lobby(principal:GuestPrincipal,id:string,raw:unknown,now:number):Promise<Response>{
    const parsed=LobbyActionSchema.safeParse(raw);if(!parsed.success)return err({code:'INVALID_INPUT',message:'Decisão de lobby inválida.'});
    const room=await this.repository.find(id);if(!room)return err({code:'NOT_FOUND',message:'Partida não encontrada.'});
    const seat=room.seats.find(s=>s.guestId===principal.guestId);if(!seat)return forbidden();
    if(room.game)return err({code:'LOBBY_CLOSED',message:'A partida já começou.'});
    const command=parsed.data;if(room.version!==command.expectedVersion)return conflict();
    if(command.type==='CHOOSE_CIVILIZATION'){
      if(seat.ready)return err({code:'ALREADY_READY',message:'Desmarque Pronto antes de trocar de civilização.'});
      seat.civilization=command.civilization;
    }else if(command.type==='LOBBY_READY')seat.ready=command.ready;
    else {
      if(room.hostGuestId!==principal.guestId)return forbidden();
      if(room.seats.length<2||room.seats.some(s=>!s.ready||!s.civilization))return err({code:'NOT_READY',message:'Pelo menos duas pessoas precisam escolher civilização e confirmar Pronto.'});
      room.game=beginAlphaPlanning(createAlphaGame({gameId:room.id,seed:room.seed,privateSeed:randomBytes(32).toString('hex'),preset:room.preset,worldPreset:room.worldPreset,players:room.seats.map(s=>({id:s.playerId,name:s.name,civilization:s.civilization!}))}));
      room.game.rules.planningSeconds=room.planningSeconds;
      room.deadline=room.planningSeconds?now+room.planningSeconds*1000:null;
    }
    room.version++;
    const valid=AlphaRoomSchema.safeParse(room);if(!valid.success)return err({code:'INVALID_CHOICE',message:'Escolha uma civilização disponível antes de confirmar Pronto.'});
    return await this.repository.save(valid.data,command.expectedVersion)?ok(roomView(valid.data,principal)!):conflict();
  }
  async command(principal:GuestPrincipal,id:string,raw:unknown,now:number):Promise<Response>{
    const room=await this.repository.find(id);if(!room)return err({code:'NOT_FOUND',message:'Partida não encontrada.'});
    const seat=room.seats.find(s=>s.guestId===principal.guestId);if(!seat)return forbidden();
    if(!room.game)return err({code:'NOT_STARTED',message:'Aguarde o início da partida.'});
    if(room.deadline!==null&&now>=room.deadline){await this.expire(room,now);return conflict();}
    const previousPhase=room.game.phase,previousRound=room.game.core.round;
    const result=applyAlphaCommand(room.game,seat.playerId,raw);if(!result.ok)return result;
    const expected=room.version;room.game=result.value;room.version++;
    if(room.game.core.status==='FINISHED')room.deadline=null;
    else if(room.planningSeconds&&(previousPhase!==room.game.phase||previousRound!==room.game.core.round))room.deadline=now+room.planningSeconds*1000;
    return await this.repository.save(room,expected)?ok(roomView(room,principal)!):conflict();
  }
}
