import { applyAlphaCommand } from '@aoh/game-engine';
import type { AlphaRoom } from './alpha-room.js';
import { absentForMs, hasLeft, hostGraceMs, removeAbsentMs, stateOf, type Presence } from './alpha-presence.js';

/**
 * Room-level rules of the external alpha. Everything here is a pure function over the saved room (plus the in-process presence), so each rule has a fast test.
 * Canon kept: the host is an administrative role, not the owner of the match; after the start nobody removes a civilization alone (UXDEC-003/004:
 * majority of the active players, civilization goes EM GUARDA, it is never deleted).
 */
export const EXTERNAL_MAX_SEATS=4;
export const maxSeats=():number=>{const configured=Number(process.env.ALPHA_MAX_SEATS);return Number.isInteger(configured)&&configured>=2&&configured<=6?configured:process.env.NODE_ENV==='production'?EXTERNAL_MAX_SEATS:6;};
export const VOTE_TTL_MS=5*60*1000;

export function addNotice(room:AlphaRoom,type:string,text:string,now:number):void{
  const id=(room.notices.at(-1)?.id??0)+1;room.notices.push({id,at:now,type,text});if(room.notices.length>30)room.notices.splice(0,room.notices.length-30);
}
export const seatOfGuest=(room:AlphaRoom,guestId:string)=>room.seats.find(s=>s.guestId===guestId);
export const presenceOf=(room:AlphaRoom,guestId:string,now:number):Presence=>stateOf(room.id,guestId,now);
/** Bots are seats but never administrators: they cannot be host, vote, be removed or be put EM GUARDA. */
export const humanSeats=(room:AlphaRoom)=>room.seats.filter(s=>!s.bot);
const nextPlayerNumber=(room:AlphaRoom)=>{const used=new Set(room.seats.map(s=>s.playerId));for(let n=1;n<=6;n++)if(!used.has(`player-${n}` as never))return n;return room.seats.length+1;};
export const nextPlayerId=(room:AlphaRoom)=>`player-${nextPlayerNumber(room)}`;

/** A safe point: nothing is half-resolved and nobody owes a mandatory decision. Resolution itself is atomic inside one saved command, so it can never be caught mid-way. */
export function safePoint(room:AlphaRoom):{ok:true}|{ok:false;reason:string}{
  const game=room.game;if(!game)return {ok:false,reason:'A partida ainda não começou.'};
  if(game.core.status==='FINISHED')return {ok:false,reason:'A partida já terminou.'};
  if(game.phase!=='PLANNING')return {ok:false,reason:'Só é possível suspender no Planejamento (não durante conflitos ou a Virada de Era).'};
  if(game.players.some(p=>p.pendingChoices.length>0))return {ok:false,reason:'Há uma decisão obrigatória pendente (Repercussão, Encontro ou Pulso). Resolva-a antes de suspender.'};
  if(game.players.some(p=>!p.ambitionsChosen))return {ok:false,reason:'Alguém ainda precisa escolher as ambições.'};
  return {ok:true};
}

/** The host moves to the lowest seat that is present; "leaving on purpose" moves it at once, silence only after the host grace. Returns true when it moved. */
export function maybeTransferHost(room:AlphaRoom,now:number):boolean{
  if(room.closedReason!==null)return false;
  const host=room.seats.find(s=>s.guestId===room.hostGuestId);if(!host)return false;
  const state=presenceOf(room,host.guestId,now);if(state==='ONLINE')return false;
  const explicit=hasLeft(room.id,host.guestId),silentLong=state==='ABSENT'&&absentForMs(room.id,host.guestId,now)>=hostGraceMs();
  if(!explicit&&!silentLong)return false;
  const next=room.seats.find(s=>!s.bot&&s.guestId!==host.guestId&&!room.onGuard.includes(s.playerId)&&presenceOf(room,s.guestId,now)==='ONLINE')??room.seats.find(s=>!s.bot&&s.guestId!==host.guestId&&!room.onGuard.includes(s.playerId)&&presenceOf(room,s.guestId,now)==='RECONNECTING');
  if(!next)return false;
  room.hostGuestId=next.guestId;addNotice(room,'HOST_TRANSFERRED',`${next.name} agora é o anfitrião.`,now);return true;
}

/** Engine-side autopilot for civilizations EM GUARDA: confirm each phase without Orders, but only once every active person has confirmed, so people (not guards) drive the pace. */
export function runGuards(room:AlphaRoom):boolean{
  const game=room.game;if(!game||room.onGuard.length===0||game.core.status==='FINISHED')return false;
  let changed=false;
  for(let pass=0;pass<8;pass++){
    const current=room.game!;if(current.core.status==='FINISHED')break;
    const humans=current.players.filter(p=>!room.onGuard.includes(p.playerId));
    if(humans.length===0||humans.some(p=>!p.ready))break;
    const waiting=current.players.find(p=>room.onGuard.includes(p.playerId)&&!p.ready);if(!waiting)break;
    let next=current;
    if(!waiting.ambitionsChosen){const chosen=applyAlphaCommand(next,waiting.playerId,{type:'CHOOSE_AMBITIONS',expectedVersion:next.version,cardIds:waiting.ambitions.slice(0,2)});if(!chosen.ok)break;next=chosen.value;}
    const ready=applyAlphaCommand(next,waiting.playerId,{type:'READY',expectedVersion:next.version});
    if(!ready.ok)break;
    room.game=ready.value;changed=true;
  }
  return changed;
}

/** Players who may vote: seated, not EM GUARDA, not absent. The target of a removal does not vote on their own removal. */
export function eligibleVoters(room:AlphaRoom,now:number):string[]{
  const vote=room.vote;
  return room.seats.filter(s=>!s.bot&&!room.onGuard.includes(s.playerId)&&presenceOf(room,s.guestId,now)!=='ABSENT'&&!(vote?.kind==='REMOVE'&&vote.target===s.playerId)).map(s=>s.playerId);
}
export type VoteOutcome='OPEN'|'APPROVED'|'REJECTED'|'EXPIRED';
/** Simple strict majority of the eligible voters. A removal with fewer than two voters (a 2-person table) additionally needs the target to have been away for UXDEC-003's 10 minutes. */
export function tallyVote(room:AlphaRoom,now:number):VoteOutcome{
  const vote=room.vote;if(!vote)return 'OPEN';
  if(now-vote.createdAt>=VOTE_TTL_MS)return 'EXPIRED';
  const voters=new Set([...eligibleVoters(room,now),...vote.yes]);const eligible=voters.size,needed=Math.floor(eligible/2)+1;
  const yes=vote.yes.filter(id=>voters.has(id)).length,no=vote.no.filter(id=>voters.has(id)).length;
  if(yes>=needed){
    if(vote.kind==='REMOVE'){
      const target=room.seats.find(s=>s.playerId===vote.target);
      if(eligible<2&&target&&absentForMs(room.id,target.guestId,now)<removeAbsentMs())return 'OPEN';
    }
    return 'APPROVED';
  }
  if(no>eligible-needed)return 'REJECTED';
  return 'OPEN';
}
export const voteView=(room:AlphaRoom,selfPlayerId:string,now:number)=>{
  const vote=room.vote;if(!vote)return null;
  const eligible=new Set([...eligibleVoters(room,now),...vote.yes]);
  return {id:vote.id,kind:vote.kind,target:vote.target,proposer:vote.proposer,yes:vote.yes.length,no:vote.no.length,needed:Math.floor(eligible.size/2)+1,eligible:eligible.size,expiresAt:vote.createdAt+VOTE_TTL_MS,mine:vote.yes.includes(selfPlayerId as never)?'YES':vote.no.includes(selfPlayerId as never)?'NO':null,canVote:eligible.has(selfPlayerId)&&!vote.yes.includes(selfPlayerId as never)&&!vote.no.includes(selfPlayerId as never)};
};
