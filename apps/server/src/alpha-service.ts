import { randomBytes, randomUUID } from 'node:crypto';
import { CORE10_CHASSIS, GameIdSchema, PlayerIdSchema, figuresOfCivilization, isCore10Chassis, mapSizeAllows, recommendedFigure, recommendedMapSize, type AlphaError, type MatchReportV1 } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame, forceContactSetup } from '@aoh/game-engine';
import { err, ok, type Result } from '@aoh/shared';
import { AlphaRoomSchema, CreateAlphaRoomSchema, LEGACY_ROOM_MESSAGE, LobbyActionSchema, RoomActionSchema, isLegacyRoom, lifecycleOf, type AlphaRepository, type AlphaRoom } from './alpha-room.js';
import { addNotice, eligibleVoters, maxSeats, maybeTransferHost, nextPlayerId, presenceOf, runGuards, safePoint, tallyVote, voteView } from './alpha-lifecycle.js';
import { leave as presenceLeave, touch as presenceTouch } from './alpha-presence.js';
import { publishAlphaEvent } from './alpha-bus.js';
import { alphaLog, short } from './alpha-log.js';
import { botDelayMs, botPersonaFor, confirmBotSeat, planBotSeat } from './alpha-bot.js';
import { alphaPlayerView } from './alpha-projection.js';
import type { GuestPrincipal } from './guest-session.js';
import { reportOf } from './alpha-report.js';
import { playtestEnabled, playtestRecorderFor, UI_KINDS, type UiKind } from './playtest-log.js';

export function roomView(room:AlphaRoom,principal:GuestPrincipal,now=Date.now()){
  const seat=room.seats.find(s=>s.guestId===principal.guestId);if(!seat)return null;
  const lifecycle=lifecycleOf(room),safe=room.game?safePoint(room):null;
  return {playtest:playtestEnabled(),id:room.id,version:room.version,name:room.name,joinCode:room.joinCode,preset:room.preset,worldPreset:room.worldPreset,mapSize:room.mapSize,seed:room.seed,seatLimit:room.seatLimit,maxSeats:maxSeats(),actionsPerRound:room.actionsPerRound,revealMap:room.revealMap,planningSeconds:room.planningSeconds,deadline:room.deadline,
    contentVersion:room.contentVersion,legacy:isLegacyRoom(room),legacyMessage:isLegacyRoom(room)?LEGACY_ROOM_MESSAGE:null,
    selfPlayerId:seat.playerId,isHost:room.hostGuestId===principal.guestId,
    lifecycle,suspended:room.suspended,closedReason:room.closedReason,selfOnGuard:room.onGuard.includes(seat.playerId),
    canSuspend:lifecycle==='ACTIVE'&&room.hostGuestId===principal.guestId&&safe?.ok===true,suspendBlock:safe&&!safe.ok?safe.reason:null,
    vote:voteView(room,seat.playerId,now),notices:room.notices.slice(-8),
    seats:room.seats.map(s=>({playerId:s.playerId,name:s.name,civilization:s.civilization,
      // A Figura stays private until everyone confirmed (or the match began): the table reveals all choices at once.
      figureId:s.playerId===seat.playerId||room.game!==null||room.seats.every(other=>other.ready)?s.figureId:null,figureChosen:s.figureId!==null,ready:s.ready,isHost:s.guestId===room.hostGuestId,bot:s.bot,presence:s.bot?'BOT' as const:presenceOf(room,s.guestId,now),onGuard:room.onGuard.includes(s.playerId)})),
    game:room.game?alphaPlayerView(room.game,seat.playerId):null};
}
export type AlphaRoomView=NonNullable<ReturnType<typeof roomView>>;
type Response=Result<AlphaRoomView,AlphaError>;
const forbidden=()=>err({code:'FORBIDDEN',message:'Esta sessão não ocupa um lugar na partida.'});
const conflict=()=>{alphaLog('SAVE_CONFLICT');return err({code:'VERSION_CONFLICT',message:'A partida mudou. Atualize antes de confirmar novamente.'});};
export class AlphaGameService {
  constructor(private readonly repository:AlphaRepository){}
  /** In-process memory of what each bot already planned this phase and which confirmation timers are armed (single instance, like the SSE bus). A restart just replans. */
  private readonly botPlanned=new Set<string>();
  private readonly botScheduled=new Set<string>();
  /**
   * Bots act on the server, from their own seat-redacted view, through canonical commands. Per bot and phase: plan (instant), then confirm after a short
   * presentation delay (none when ALPHA_BOT_DELAY_MS=0). Only while the table is ACTIVE: suspended, closed or finished tables never move.
   */
  private settleBots(room:AlphaRoom,now:number,readyNow:ReadonlySet<string>=new Set()):{timers:{key:string;delay:number}[];changed:boolean;planned:string[]}{
    const out={timers:[] as {key:string;delay:number}[],changed:false,planned:[] as string[]};
    const first=room.game;if(!first||lifecycleOf(room)!=='ACTIVE')return out;
    const bots=room.seats.filter(s=>s.bot);if(!bots.length)return out;
    const prevPhase=first.phase,prevRound=first.core.round,delay=botDelayMs();
    for(let pass=0;pass<16;pass++){
      let progressed=false;
      for(const seat of bots){
        const game=room.game!;if(game.core.status==='FINISHED'||!['PLANNING','ERA_TURN','CONFLICTS'].includes(game.phase))break;
        const me=game.players.find(p=>p.playerId===seat.playerId);if(!me||me.ready)continue;
        const key=`${room.id}:${seat.playerId}:${game.core.round}:${game.phase}`;
        if(!this.botPlanned.has(key)){
          alphaLog('BOT_PLAN_STARTED',{room:short(room.id),seat:seat.playerId,round:game.core.round,phase:game.phase});
          room.game=planBotSeat(room.id,game,seat.playerId,seat.botPersona??'balanced',room.seed).game;
          this.botPlanned.add(key);out.planned.push(key);if(this.botPlanned.size>4096)this.botPlanned.clear();
          progressed=true;out.changed=true;
        }
        if(delay===0||readyNow.has(key)){
          const done=confirmBotSeat(room.id,room.game!,seat.playerId);
          if(done.ok){room.game=done.game;alphaLog('BOT_PLAN_CONFIRMED',{room:short(room.id),seat:seat.playerId,round:game.core.round});progressed=true;out.changed=true;}
        }else if(!this.botScheduled.has(key)){this.botScheduled.add(key);out.timers.push({key,delay});}
      }
      if(!progressed)break;
    }
    if(out.changed){
      runGuards(room);
      const now2=room.game!;
      if(now2.core.status==='FINISHED')room.deadline=null;
      else if(room.planningSeconds&&(prevPhase!==now2.phase||prevRound!==now2.core.round))room.deadline=now+room.planningSeconds*1000;
    }
    return out;
  }
  /** A save that lost the race discards the in-memory plans of that attempt, so the next look replans from the stored room. */
  private unplan(settled:{timers:{key:string;delay:number}[];planned:string[]}):void{for(const key of settled.planned)this.botPlanned.delete(key);for(const t of settled.timers)this.botScheduled.delete(t.key);}
  private armBotTimers(roomId:string,timers:{key:string;delay:number}[]):void{
    for(const timer of timers){
      const handle=setTimeout(()=>{this.botScheduled.delete(timer.key);void this.botReady(roomId,timer.key).catch(()=>undefined);},timer.delay);
      (handle as {unref?:()=>void}).unref?.();
    }
  }
  /** A bot's delayed confirmation: re-read the room (it may have been suspended, closed or advanced) and confirm only if that exact phase is still open. */
  async botReady(roomId:string,key:string):Promise<void>{
    for(let attempt=0;attempt<3;attempt++){
      const room=await this.repository.find(roomId);if(!room||lifecycleOf(room)!=='ACTIVE')return;
      const expected=room.version,settled=this.settleBots(room,Date.now(),new Set([key]));
      if(!settled.changed){this.armBotTimers(roomId,settled.timers);return;}
      room.version=expected+1;
      if(await this.repository.save(room,expected)){this.armBotTimers(roomId,settled.timers);return;}
      this.unplan(settled);
    }
  }
  /** Server clock drives deadlines; CAS makes concurrent polling safe. No client time is accepted. */
  private async expire(room:AlphaRoom,now:number):Promise<AlphaRoom|null>{
    if(!room.game||room.deadline===null||now<room.deadline||room.suspended||room.closedReason!==null)return room;
    const expected=room.version,gameBefore=room.game;
    for(const actor of [...room.game.initiative]){
      const player=room.game.players.find(p=>p.playerId===actor)!;if(player.ready)continue;
      if(!player.ambitionsChosen){
        const chosen=applyAlphaCommand(room.game,actor,{type:'CHOOSE_AMBITIONS',expectedVersion:room.game.version,cardIds:player.ambitions.slice(0,2)});
        if(!chosen.ok)throw new Error(`Alpha timeout failed: ${chosen.error.code}`);room.game=chosen.value;
      }
      const ready=applyAlphaCommand(room.game,actor,{type:'READY',expectedVersion:room.game.version});
      if(!ready.ok)throw new Error(`Alpha timeout failed: ${ready.error.code}`);room.game=ready.value;
    }
    runGuards(room);
    const bots=this.settleBots(room,now);
    playtestRecorderFor(room.id)?.observeTransition(gameBefore,room.game);
    room.version++;room.deadline=room.game.core.status==='FINISHED'?null:now+room.planningSeconds*1000;
    if(await this.repository.save(room,expected)){this.armBotTimers(room.id,bots.timers);return room;}
    this.unplan(bots);return null;
  }
  async create(principal:GuestPrincipal,raw:unknown):Promise<Response>{
    const input=CreateAlphaRoomSchema.safeParse(raw);if(!input.success)return err({code:'INVALID_INPUT',message:'Revise nome, jogadores, duração e semente da partida.'});
    if(input.data.seatLimit>maxSeats())return err({code:'INVALID_INPUT',message:`Neste Alpha a partida comporta de 2 a ${maxSeats()} jogadores.`});
    const {displayName,mapSize:askedSize,...options}=input.data;
    const mapSize=askedSize??recommendedMapSize(options.seatLimit);
    if(!mapSizeAllows(mapSize,options.seatLimit))return err({code:'INVALID_INPUT',message:'Este tamanho de mapa não comporta esse número de jogadores.'});
    const room=AlphaRoomSchema.parse({...options,mapSize,contentVersion:'v1.2',id:GameIdSchema.parse(randomUUID()),joinCode:randomBytes(16).toString('base64url'),version:0,hostGuestId:principal.guestId,deadline:null,game:null,
      seats:[{guestId:principal.guestId,playerId:PlayerIdSchema.parse('player-1'),name:displayName,civilization:null,figureId:null,ready:false,bot:false,botPersona:null}]});
    if(!await this.repository.create(room))return err({code:'ALREADY_EXISTS',message:'Não foi possível criar a partida. Tente novamente.'});
    presenceTouch(room.id,principal.guestId,Date.now());
    alphaLog('ROOM_CREATED',{room:short(room.id),seats:room.seatLimit,preset:room.preset,world:room.worldPreset,size:room.mapSize});
    return ok(roomView(room,principal)!);
  }
  async join(principal:GuestPrincipal,code:string,displayName:string,now=Date.now()):Promise<Response>{
    if(!/^[A-Za-z0-9_-]{22}$/.test(code)||!displayName.trim()||displayName.trim().length>80)return err({code:'INVALID_INPUT',message:'Informe um código de convite válido e seu nome.'});
    const room=await this.repository.findByCode(code);if(!room)return err({code:'NOT_FOUND',message:'Convite não encontrado.'});
    const existing=roomView(room,principal,now);if(existing){presenceTouch(room.id,principal.guestId,now);return ok(existing);}
    if(isLegacyRoom(room))return err({code:'LEGACY_ROOM',message:LEGACY_ROOM_MESSAGE});
    if(room.closedReason!==null)return err({code:'LOBBY_CLOSED',message:'Esta sala foi encerrada.'});
    if(room.game||room.seats.length>=Math.min(room.seatLimit,maxSeats()))return err({code:'LOBBY_CLOSED',message:'A partida já começou ou não possui vagas.'});
    const expected=room.version;
    room.seats.push({guestId:principal.guestId,playerId:PlayerIdSchema.parse(nextPlayerId(room)),name:displayName.trim(),civilization:null,figureId:null,ready:false,bot:false,botPersona:null});room.version++;
    addNotice(room,'PLAYER_JOINED',`${displayName.trim()} entrou na sala.`,now);
    if(!await this.repository.save(room,expected))return conflict();
    presenceTouch(room.id,principal.guestId,now);alphaLog('PLAYER_JOINED',{room:short(room.id),seats:room.seats.length});
    return ok(roomView(room,principal,now)!);
  }
  /** Saves the room after a rule changed it; the CAS decides, nothing is applied twice. */
  private async commit(room:AlphaRoom,expected:number,principal:GuestPrincipal,now:number):Promise<Response>{
    const bots=this.settleBots(room,now);
    room.version=expected+1;
    const valid=AlphaRoomSchema.safeParse(room);if(!valid.success){this.unplan(bots);return err({code:'INVALID_CHOICE',message:'Estado de sala inválido.'});}
    if(await this.repository.save(valid.data,expected)){this.armBotTimers(room.id,bots.timers);return ok(roomView(valid.data,principal,now)!);}
    this.unplan(bots);return conflict();
  }
  /** What happens on every look at the room: the host role follows presence, a decided vote is applied, a deadline that passed is resolved. */
  private async housekeeping(room:AlphaRoom,now:number):Promise<AlphaRoom|null>{
    let changed=false;const expected=room.version;
    if(room.closedReason===null&&maybeTransferHost(room,now)){changed=true;alphaLog('HOST_TRANSFERRED',{room:short(room.id)});}
    if(room.vote){
      const outcome=tallyVote(room,now);
      if(outcome!=='OPEN'){
        const vote=room.vote;room.vote=null;changed=true;
        if(outcome==='APPROVED')this.applyVote(room,vote,now);
        else addNotice(room,'VOTE_CLOSED',outcome==='EXPIRED'?'A votação expirou sem decisão.':'A votação foi recusada.',now);
        alphaLog('VOTE_RESOLVED',{room:short(room.id),kind:vote.kind,outcome});
      }
    }
    const bots=this.settleBots(room,now);if(bots.changed)changed=true;
    if(!changed){this.armBotTimers(room.id,bots.timers);return room;}
    room.version=expected+1;
    if(await this.repository.save(room,expected)){this.armBotTimers(room.id,bots.timers);return room;}
    this.unplan(bots);return null;
  }
  private applyVote(room:AlphaRoom,vote:NonNullable<AlphaRoom['vote']>,now:number):void{
    if(vote.kind==='REMOVE'&&vote.target){
      if(!room.onGuard.includes(vote.target))room.onGuard.push(vote.target);
      const name=room.seats.find(s=>s.playerId===vote.target)?.name??'Uma civilização';
      addNotice(room,'SEAT_ON_GUARD',`${name} ficou EM GUARDA por votação.`,now);
      if(room.game)runGuards(room);
      alphaLog('SEAT_ON_GUARD',{room:short(room.id)});
    }else if(vote.kind==='END'){
      room.closedReason='VOTE';room.deadline=null;room.suspended=false;
      addNotice(room,'GAME_CLOSED','A partida foi encerrada por votação.',now);alphaLog('GAME_CLOSED',{room:short(room.id),by:'vote'});
    }
  }
  /**
   * The Crônica da Partida. Only a seat of the match can read it, and only once the match is definitively FINISHED (a report holds the whole table's figures, so before that
   * it would leak hidden information). It is the stored report; rooms finished before reports existed get one rebuilt in memory, marked RECONSTRUCTED, and nothing is written.
   */
  async readReport(principal:GuestPrincipal,id:string):Promise<Result<MatchReportV1,AlphaError>>{
    const loaded=await this.repository.find(id);if(!loaded)return err({code:'NOT_FOUND',message:'Partida não encontrada.'});
    if(!loaded.seats.some(s=>s.guestId===principal.guestId))return forbidden();
    if(lifecycleOf(loaded)!=='FINISHED')return err({code:'NOT_FINISHED',message:'A Crônica da Partida só fica disponível depois do encerramento definitivo.'});
    const report=reportOf(loaded);
    return report?ok(report):err({code:'REPORT_UNAVAILABLE',message:'Não foi possível montar a Crônica desta partida.'});
  }
  async read(principal:GuestPrincipal,id:string,now:number):Promise<Response>{
    const loaded=await this.repository.find(id);if(!loaded)return err({code:'NOT_FOUND',message:'Partida não encontrada.'});
    const seat=loaded.seats.find(s=>s.guestId===principal.guestId);if(!seat)return forbidden();
    const touched=presenceTouch(id,principal.guestId,now);
    if(touched.returned){alphaLog('PLAYER_RECONNECTED',{room:short(id)});publishAlphaEvent(id,{type:'PRESENCE'});}
    // A V1.1 room is only displayed: no housekeeping, no expiry, no bot timers, nothing is written.
    if(isLegacyRoom(loaded))return ok(roomView(loaded,principal,now)!);
    const settled=await this.housekeeping(loaded,now);if(!settled)return conflict();
    const room=await this.expire(settled,now);return room?ok(roomView(room,principal,now)!):conflict();
  }
  /** Dev playtest only: a person's UI moment goes to the local log. Never changes the game; answers ok either way so the client can tell whether it was recorded. */
  async telemetry(principal:GuestPrincipal,id:string,kind:string,detail:string):Promise<Result<{recorded:boolean},AlphaError>>{
    const room=await this.repository.find(id);if(!room)return err({code:'NOT_FOUND',message:'Partida não encontrada.'});
    const seat=room.seats.find(s=>s.guestId===principal.guestId);if(!seat)return forbidden();
    const recorder=room.game&&(UI_KINDS as readonly string[]).includes(kind)?playtestRecorderFor(room.id):null;
    if(room.game&&recorder)recorder.clientEvent(room.game,seat.playerId,kind as UiKind,detail);
    return ok({recorded:recorder!==null&&room.game!==null&&room.game!==undefined});
  }
  async lobby(principal:GuestPrincipal,id:string,raw:unknown,now:number):Promise<Response>{
    const parsed=LobbyActionSchema.safeParse(raw);if(!parsed.success)return err({code:'INVALID_INPUT',message:'Decisão de lobby inválida.'});
    const room=await this.repository.find(id);if(!room)return err({code:'NOT_FOUND',message:'Partida não encontrada.'});
    const seat=room.seats.find(s=>s.guestId===principal.guestId);if(!seat)return forbidden();
    if(isLegacyRoom(room))return err({code:'LEGACY_ROOM',message:LEGACY_ROOM_MESSAGE});
    if(room.closedReason!==null)return err({code:'LOBBY_CLOSED',message:'Esta sala foi encerrada.'});
    if(room.game)return err({code:'LOBBY_CLOSED',message:'A partida já começou.'});
    const command=parsed.data;if(room.version!==command.expectedVersion)return conflict();
    const isHost=room.hostGuestId===principal.guestId;
    let lobbyBots:{timers:{key:string;delay:number}[];changed:boolean;planned:string[]}={timers:[],changed:false,planned:[]};
    if(command.type==='CHOOSE_CIVILIZATION'){
      if(seat.ready)return err({code:'ALREADY_READY',message:'Desmarque Pronto antes de trocar de civilização.'});
      if(!isCore10Chassis(command.civilization))return err({code:'INVALID_CHOICE',message:'Escolha uma das dez civilizações disponíveis.'});
      if(room.seats.some(other=>other!==seat&&other.civilization===command.civilization))return err({code:'INVALID_CHOICE',message:'Essa civilização já foi escolhida por outro lugar da mesa.'});
      // Picking a civilization offers its three Figuras; the one marked ★ (recommended for beginners) is selected until the player changes it.
      if(seat.civilization!==command.civilization){seat.civilization=command.civilization;seat.figureId=recommendedFigure(command.civilization)?.id??null;}
    }else if(command.type==='CHOOSE_FIGURE'){
      if(seat.ready)return err({code:'ALREADY_READY',message:'Desmarque Pronto antes de trocar de Figura.'});
      if(seat.civilization===null)return err({code:'INVALID_CHOICE',message:'Escolha a civilização antes da Figura.'});
      if(!figuresOfCivilization(seat.civilization).some(figure=>figure.id===command.figureId))return err({code:'INVALID_CHOICE',message:'Essa Figura não pertence à sua civilização.'});
      seat.figureId=command.figureId;
    }else if(command.type==='LOBBY_READY')seat.ready=command.ready;
    else if(command.type==='KICK'){
      if(!isHost)return forbidden();
      const target=room.seats.find(s=>s.playerId===command.playerId);if(!target||target.guestId===room.hostGuestId)return err({code:'INVALID_INPUT',message:'Escolha outra pessoa para remover da sala.'});
      room.seats=room.seats.filter(s=>s!==target);addNotice(room,'PLAYER_REMOVED',`${target.name} foi removido(a) da sala.`,now);alphaLog('PLAYER_REMOVED',{room:short(room.id)});
    }else if(command.type==='SET_SEATS'){
      if(!isHost)return forbidden();
      if(command.seatLimit>maxSeats()||command.seatLimit<Math.max(2,room.seats.length))return err({code:'INVALID_INPUT',message:`Escolha entre ${Math.max(2,room.seats.length)} e ${maxSeats()} lugares.`});
      room.seatLimit=command.seatLimit;
      if(!mapSizeAllows(room.mapSize,room.seatLimit))room.mapSize=recommendedMapSize(room.seatLimit);
    }else if(command.type==='SET_WORLD'){
      if(!isHost)return forbidden();
      const size=command.mapSize??room.mapSize;
      if(!mapSizeAllows(size,room.seatLimit))return err({code:'INVALID_INPUT',message:'Este tamanho de mapa não comporta esse número de lugares.'});
      room.mapSize=size;if(command.worldPreset)room.worldPreset=command.worldPreset;
    }else if(command.type==='ADD_BOT'){
      if(!isHost)return forbidden();
      if(room.seats.length>=Math.min(room.seatLimit,maxSeats()))return err({code:'LOBBY_FULL',message:'Não há lugar vazio para um bot.'});
      const taken=new Set(room.seats.map(s=>s.civilization)),playable=[...CORE10_CHASSIS];
      const start=room.seed%playable.length,civilization=[...playable.slice(start),...playable.slice(0,start)].find(id=>!taken.has(id));
      if(!civilization)return err({code:'NO_CIVILIZATION',message:'Nenhuma civilização livre para o bot.'});
      const botNumber=room.seats.filter(s=>s.bot).length+1;
      // Bots pick their Figura deterministically from the seed, so a replay of the same room draws the same table.
      const offered=figuresOfCivilization(civilization);
      room.seats.push({guestId:randomUUID(),playerId:PlayerIdSchema.parse(nextPlayerId(room)),name:`Bot ${botNumber}`,civilization,figureId:offered[(room.seed+room.seats.length)%offered.length]?.id??null,ready:true,bot:true,botPersona:botPersonaFor(room.seed,room.seats.length)});
      addNotice(room,'BOT_ADDED',`Bot ${botNumber} entrou na sala.`,now);alphaLog('BOT_ADDED',{room:short(room.id),seats:room.seats.length});
    }else if(command.type==='REMOVE_BOT'){
      if(!isHost)return forbidden();
      const target=room.seats.find(s=>s.playerId===command.playerId);if(!target||!target.bot)return err({code:'INVALID_INPUT',message:'Só é possível remover bots por aqui.'});
      room.seats=room.seats.filter(s=>s!==target);addNotice(room,'BOT_REMOVED',`${target.name} saiu da sala.`,now);alphaLog('BOT_REMOVED',{room:short(room.id),seats:room.seats.length});
    }else if(command.type==='CLOSE_ROOM'){
      if(!isHost)return forbidden();
      room.closedReason='HOST';addNotice(room,'GAME_CLOSED','O anfitrião encerrou a sala.',now);alphaLog('GAME_CLOSED',{room:short(room.id),by:'host'});
    }else {
      if(!isHost)return forbidden();
      if(room.seats.length<2||room.seats.length>maxSeats()||room.seats.every(s=>s.bot)||room.seats.some(s=>!s.ready||!s.civilization))return err({code:'NOT_READY',message:'Pelo menos duas pessoas precisam escolher civilização e confirmar Pronto.'});
      const created=createAlphaGame({gameId:room.id,seed:room.seed,privateSeed:randomBytes(32).toString('hex'),preset:room.preset,worldPreset:room.worldPreset,mapSize:room.mapSize,actionsPerRound:room.actionsPerRound,revealMap:room.revealMap,players:room.seats.map(s=>({id:s.playerId,name:s.name,civilization:s.civilization!,figureId:s.figureId}))});
      // Dev-only test scenario (never in production): a legal Contact between the two nearest Pátrias, from the real proximity rule.
      if(process.env.ALPHA_FORCE_CONTACT==='1'&&process.env.NODE_ENV!=='production')forceContactSetup(created);
      room.game=beginAlphaPlanning(created);
      room.game.rules.planningSeconds=room.planningSeconds;
      playtestRecorderFor(room.id)?.start(room.game);
      room.deadline=room.planningSeconds?now+room.planningSeconds*1000:null;
      lobbyBots=this.settleBots(room,now);
      alphaLog('GAME_STARTED',{room:short(room.id),seats:room.seats.length,bots:room.seats.filter(s=>s.bot).length});
    }
    room.version++;
    const valid=AlphaRoomSchema.safeParse(room);if(!valid.success)return err({code:'INVALID_CHOICE',message:'Escolha uma civilização disponível antes de confirmar Pronto.'});
    if(await this.repository.save(valid.data,command.expectedVersion)){this.armBotTimers(room.id,lobbyBots.timers);return ok(roomView(valid.data,principal,now)!);}
    this.unplan(lobbyBots);return conflict();
  }
  async command(principal:GuestPrincipal,id:string,raw:unknown,now:number):Promise<Response>{
    const room=await this.repository.find(id);if(!room)return err({code:'NOT_FOUND',message:'Partida não encontrada.'});
    const seat=room.seats.find(s=>s.guestId===principal.guestId);if(!seat)return forbidden();
    if(isLegacyRoom(room))return err({code:'LEGACY_ROOM',message:LEGACY_ROOM_MESSAGE});
    presenceTouch(id,principal.guestId,now);
    if(!room.game)return err({code:'NOT_STARTED',message:'Aguarde o início da partida.'});
    if(room.closedReason!==null)return err({code:'ROOM_CLOSED',message:'A partida foi encerrada. A mesa fica disponível só para leitura.'});
    if(room.suspended)return err({code:'SUSPENDED',message:'A partida está suspensa. O anfitrião precisa retomá-la.'});
    if(room.onGuard.includes(seat.playerId))return err({code:'ON_GUARD',message:'Sua civilização está EM GUARDA. Reassuma o lugar para voltar a dar Ordens.'});
    if(room.deadline!==null&&now>=room.deadline){await this.expire(room,now);return conflict();}
    const previousPhase=room.game.phase,previousRound=room.game.core.round;
    let result:ReturnType<typeof applyAlphaCommand>;
    try{result=applyAlphaCommand(room.game,seat.playerId,raw);}catch(cause){alphaLog('ENGINE_ERROR',{room:short(room.id),name:cause instanceof Error?cause.name:'Error'});throw cause;}
    playtestRecorderFor(room.id)?.observe(room.game,seat.playerId,raw,result);
    if(!result.ok){alphaLog('COMMAND_REJECTED',{room:short(room.id),code:result.error.code});return result;}
    const expected=room.version;room.game=result.value;room.version++;
    runGuards(room);
    const bots=this.settleBots(room,now);
    if(room.game.core.status==='FINISHED')room.deadline=null;
    else if(room.planningSeconds&&(previousPhase!==room.game.phase||previousRound!==room.game.core.round))room.deadline=now+room.planningSeconds*1000;
    if(await this.repository.save(room,expected)){this.armBotTimers(room.id,bots.timers);return ok(roomView(room,principal,now)!);}
    this.unplan(bots);return conflict();
  }
  /** Room-level actions: leaving, suspending, voting, EM GUARDA, and the social reactions (which are never saved). */
  private readonly cooldown=new Map<string,{reaction:number;ping:number}>();
  async roomAction(principal:GuestPrincipal,id:string,raw:unknown,now:number):Promise<Response>{
    const parsed=RoomActionSchema.safeParse(raw);if(!parsed.success)return err({code:'INVALID_INPUT',message:'Ação de sala inválida.'});
    const room=await this.repository.find(id);if(!room)return err({code:'NOT_FOUND',message:'Partida não encontrada.'});
    const seat=room.seats.find(s=>s.guestId===principal.guestId);if(!seat)return forbidden();
    if(isLegacyRoom(room))return err({code:'LEGACY_ROOM',message:LEGACY_ROOM_MESSAGE});
    const action=parsed.data,expected=room.version,isHost=room.hostGuestId===principal.guestId,life=lifecycleOf(room);
    if(action.type==='LEAVE'){
      // "Sair e poder voltar": nothing about the seat or the civilization changes; only presence (and the host role, if this was the host).
      presenceLeave(id,principal.guestId,now);alphaLog('PLAYER_LEFT',{room:short(id)});
      if(maybeTransferHost(room,now)){alphaLog('HOST_TRANSFERRED',{room:short(id)});return this.commit(room,expected,principal,now);}
      return ok(roomView(room,principal,now)!);
    }
    if(action.type==='REACT'||action.type==='PING'){
      if(life!=='ACTIVE'&&life!=='SUSPENDED'&&life!=='LOBBY')return ok(roomView(room,principal,now)!);
      const last=this.cooldown.get(principal.guestId)??{reaction:0,ping:0},kind=action.type==='REACT'?'reaction':'ping',gap=kind==='reaction'?1500:3000;
      if(now-last[kind]<gap)return ok(roomView(room,principal,now)!);
      this.cooldown.set(principal.guestId,{...last,[kind]:now});if(this.cooldown.size>2048)this.cooldown.clear();
      publishAlphaEvent(id,action.type==='REACT'?{type:'REACTION',playerId:seat.playerId,reaction:action.reaction}:{type:'PING',playerId:seat.playerId,hexId:action.hexId,reaction:action.reaction},now);
      return ok(roomView(room,principal,now)!);
    }
    if(life==='CLOSED'||life==='FINISHED'||life==='LOBBY')return err({code:'NOT_ACTIVE',message:'Esta ação só existe numa partida em andamento.'});
    if(action.type==='SUSPEND'){
      if(!isHost)return forbidden();
      if(room.suspended)return ok(roomView(room,principal,now)!);
      const safe=safePoint(room);if(!safe.ok)return err({code:'NOT_SAFE_POINT',message:safe.reason});
      room.suspended=true;room.deadline=null;room.vote=null;addNotice(room,'GAME_SUSPENDED','Partida suspensa pelo anfitrião.',now);alphaLog('GAME_SUSPENDED',{room:short(id),round:room.game?.core.round??0});
    }else if(action.type==='RESUME'){
      if(!room.suspended)return ok(roomView(room,principal,now)!);
      if(!isHost)return forbidden();
      room.suspended=false;room.deadline=room.planningSeconds?now+room.planningSeconds*1000:null;addNotice(room,'GAME_RESUMED','Partida retomada.',now);alphaLog('GAME_RESUMED',{room:short(id)});
    }else if(action.type==='RESUME_SEAT'){
      if(!room.onGuard.includes(seat.playerId))return ok(roomView(room,principal,now)!);
      room.onGuard=room.onGuard.filter(p=>p!==seat.playerId);addNotice(room,'SEAT_RESUMED',`${seat.name} reassumiu a civilização.`,now);
    }else if(room.suspended){return err({code:'SUSPENDED',message:'A partida está suspensa.'});}
    else if(action.type==='PROPOSE_REMOVE'||action.type==='PROPOSE_END'){
      if(room.vote)return err({code:'VOTE_OPEN',message:'Já existe uma votação em andamento.'});
      if(room.onGuard.includes(seat.playerId))return err({code:'ON_GUARD',message:'Reassuma sua civilização para votar.'});
      let target:AlphaRoom['seats'][number]['playerId']|null=null;
      if(action.type==='PROPOSE_REMOVE'){
        const found=room.seats.find(s=>s.playerId===action.target);
        if(!found||found.playerId===seat.playerId||found.bot)return err({code:'INVALID_INPUT',message:'Escolha outra civilização (bots não são removidos por votação).'});
        if(room.onGuard.includes(found.playerId))return err({code:'ALREADY_ON_GUARD',message:'Essa civilização já está EM GUARDA.'});
        target=found.playerId;
      }
      room.vote={id:randomBytes(6).toString('hex'),kind:action.type==='PROPOSE_REMOVE'?'REMOVE':'END',target,proposer:seat.playerId,yes:[seat.playerId],no:[],createdAt:now};
      addNotice(room,'VOTE_OPENED',action.type==='PROPOSE_REMOVE'?`${seat.name} propôs colocar ${room.seats.find(s=>s.playerId===target)?.name??'uma civilização'} EM GUARDA.`:`${seat.name} propôs encerrar a partida.`,now);
      alphaLog('VOTE_OPENED',{room:short(id),kind:room.vote.kind});
      const outcome=tallyVote(room,now);if(outcome==='APPROVED'){const vote=room.vote;room.vote=null;this.applyVote(room,vote,now);}
    }else if(action.type==='VOTE'){
      const vote=room.vote;if(!vote)return err({code:'NO_VOTE',message:'Não há votação aberta.'});
      if(!eligibleVoters(room,now).includes(seat.playerId))return err({code:'FORBIDDEN',message:'Você não pode votar nesta votação.'});
      if(vote.yes.includes(seat.playerId)||vote.no.includes(seat.playerId))return ok(roomView(room,principal,now)!);
      (action.yes?vote.yes:vote.no).push(seat.playerId);
      const outcome=tallyVote(room,now);
      if(outcome!=='OPEN'){room.vote=null;if(outcome==='APPROVED')this.applyVote(room,vote,now);else addNotice(room,'VOTE_CLOSED','A votação foi recusada.',now);alphaLog('VOTE_RESOLVED',{room:short(id),kind:vote.kind,outcome});}
    }else if(action.type==='CANCEL_VOTE'){
      if(!room.vote||room.vote.proposer!==seat.playerId)return err({code:'FORBIDDEN',message:'Só quem propôs pode cancelar.'});
      room.vote=null;addNotice(room,'VOTE_CLOSED','A votação foi cancelada.',now);
    }
    return this.commit(room,expected,principal,now);
  }
}
