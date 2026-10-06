import { publishAlphaEvent } from './alpha-bus.js';
/**
 * Who is at the table right now. In-process (single instance, like the SSE bus): an open SSE stream means ONLINE; no stream but seen within the grace
 * window means RECONNECTING (F5, a network blip); beyond it, ABSENT. Absence is never abandonment: the seat and the civilization stay untouched.
 * After a server restart nobody is known: every guest is treated as last seen at boot, so nobody is declared absent or loses the host role until the grace passes.
 */
export type Presence='ONLINE'|'RECONNECTING'|'ABSENT';
interface Entry{streams:number;lastSeen:number;left:boolean}
const shared=globalThis as typeof globalThis&{aohAlphaPresence?:Map<string,Map<string,Entry>>;aohAlphaBoot?:number};
const rooms=():Map<string,Map<string,Entry>>=>(shared.aohAlphaPresence??=new Map());
const boot=():number=>(shared.aohAlphaBoot??=Date.now());
export const graceMs=():number=>Number(process.env.ALPHA_PRESENCE_GRACE_MS??20000);
export const hostGraceMs=():number=>Number(process.env.ALPHA_HOST_GRACE_MS??60000);
export const removeAbsentMs=():number=>Number(process.env.ALPHA_REMOVE_ABSENT_MS??600000);
function entry(gameId:string,guestId:string):Entry|undefined{return rooms().get(gameId)?.get(guestId);}
function ensure(gameId:string,guestId:string,now:number):Entry{
  const map=rooms().get(gameId)??new Map<string,Entry>();rooms().set(gameId,map);
  let value=map.get(guestId);if(!value){value={streams:0,lastSeen:now,left:false};map.set(guestId,value);}
  return value;
}
/** Any authenticated request from the seat. Returns true when this call changed the public presence (came back from a gap). */
export function touch(gameId:string,guestId:string,now:number):{returned:boolean}{
  const was=stateOf(gameId,guestId,now);
  const value=ensure(gameId,guestId,now);value.lastSeen=now;value.left=false;
  return {returned:was==='ABSENT'};
}
export function connect(gameId:string,guestId:string,now:number):void{const value=ensure(gameId,guestId,now);value.streams++;value.lastSeen=now;value.left=false;publishAlphaEvent(gameId,{type:'PRESENCE'});}
export function disconnect(gameId:string,guestId:string,now:number):void{
  const value=entry(gameId,guestId);if(!value)return;value.streams=Math.max(0,value.streams-1);value.lastSeen=now;
  publishAlphaEvent(gameId,{type:'PRESENCE'});
  // When the grace runs out the others must hear about it without anyone touching the room.
  const timer=setTimeout(()=>publishAlphaEvent(gameId,{type:'PRESENCE'}),graceMs()+250);(timer as {unref?:()=>void}).unref?.();
}
/** "Sair e poder voltar": the person leaves on purpose, so the seat reads as absent at once (and the host role may move). */
export function leave(gameId:string,guestId:string,now:number):void{const value=ensure(gameId,guestId,now);value.left=true;value.streams=0;value.lastSeen=now;publishAlphaEvent(gameId,{type:'PRESENCE'});}
export function stateOf(gameId:string,guestId:string,now:number):Presence{
  const value=entry(gameId,guestId),seen=value?.lastSeen??boot();
  if(value?.left)return 'ABSENT';
  if((value?.streams??0)>0)return 'ONLINE';
  return now-seen<graceMs()?'RECONNECTING':'ABSENT';
}
/** How long the guest has been out of sight (0 while present). */
export function absentForMs(gameId:string,guestId:string,now:number):number{
  const value=entry(gameId,guestId);if(value&&(value.streams>0))return 0;
  return Math.max(0,now-(value?.lastSeen??boot()));
}
export function resetPresenceForTests():void{rooms().clear();delete shared.aohAlphaBoot;}
export function hasLeft(gameId:string,guestId:string):boolean{return entry(gameId,guestId)?.left===true;}
