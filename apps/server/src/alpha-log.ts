/** One JSON line per operational event, for diagnosing a live table. Never carries names, cookies, cards or orders: only ids shortened to 8 chars and counts. */
export type AlphaLogEvent='ROOM_CREATED'|'PLAYER_JOINED'|'PLAYER_LEFT'|'PLAYER_RECONNECTED'|'HOST_TRANSFERRED'|'GAME_STARTED'|'GAME_SUSPENDED'|'GAME_RESUMED'|'GAME_CLOSED'|'PLAYER_REMOVED'|'SEAT_ON_GUARD'|'SSE_CONNECTED'|'SSE_DISCONNECTED'|'COMMAND_REJECTED'|'SAVE_CONFLICT'|'ENGINE_ERROR'|'VOTE_OPENED'|'VOTE_RESOLVED'|'BOT_ADDED'|'BOT_REMOVED'|'BOT_PLAN_STARTED'|'BOT_PLAN_CONFIRMED'|'BOT_COMMAND_REJECTED'|'BOT_DECISION_FALLBACK';
export const short=(id:string|undefined|null)=>id?id.slice(0,8):'-';
export function alphaLog(evt:AlphaLogEvent,fields:Record<string,string|number|boolean|null|undefined>={}):void{
  if(process.env.ALPHA_LOG==='0')return;
  try{console.log(JSON.stringify({t:new Date().toISOString(),svc:'aoh-alpha',evt,...fields}));}catch{/* logging never breaks a request */}
}
