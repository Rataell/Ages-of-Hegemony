import { z } from 'zod';
import { AlphaGameService } from './alpha-service.js';
import { GuestSessions } from './guest-session.js';
import { subscribeAlpha, type AlphaPush } from './alpha-bus.js';
import { connect as presenceConnect, disconnect as presenceDisconnect } from './alpha-presence.js';
import { alphaLog, short } from './alpha-log.js';
import { maxSeats } from './alpha-lifecycle.js';
import { timingSafeEqual } from 'node:crypto';

const envelope=z.discriminatedUnion('operation',[
  z.strictObject({operation:z.literal('create'),payload:z.unknown(),accessCode:z.string().max(80).optional()}),
  // The invite code is the credential of a join: no Alpha access code is asked of someone who was invited.
  z.strictObject({operation:z.literal('join'),code:z.string().max(22),displayName:z.string().max(80),accessCode:z.string().max(80).optional()}),
  z.strictObject({operation:z.literal('room'),gameId:z.string().uuid(),payload:z.unknown()}),
  z.strictObject({operation:z.literal('lobby'),gameId:z.string().uuid(),payload:z.unknown()}),
  z.strictObject({operation:z.literal('command'),gameId:z.string().uuid(),payload:z.unknown()}),
  z.strictObject({operation:z.literal('telemetry'),gameId:z.string().uuid(),kind:z.string().max(32),detail:z.string().max(40)}),
]);
class AlphaRateLimit {
  private readonly windows=new Map<string,{until:number;count:number}>();
  allow(key:string,maximum:number,now:number):boolean {
    for(const [id,value] of this.windows)if(value.until<=now)this.windows.delete(id);
    const value=this.windows.get(key);
    if(value){if(value.count>=maximum)return false;value.count++;return true;}
    if(this.windows.size>=4096)return false;
    this.windows.set(key,{until:now+60000,count:1});return true;
  }
}
async function readBody(request:Request):Promise<unknown>{
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw new Error('JSON_REQUIRED');
  const reader=request.body?.getReader();if(!reader)throw new Error('BODY_REQUIRED');
  const parts:Uint8Array[]=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384){await reader.cancel();throw new Error('BODY_TOO_LARGE');}parts.push(value);}}
  finally{reader.releaseLock();}
  return JSON.parse(Buffer.concat(parts).toString('utf8')) as unknown;
}
/** Framework-independent HTTP boundary. All mutations require a configured same-origin request. */
export class AlphaHttp {
  private readonly rate=new AlphaRateLimit();
  private readonly origin:string;
  private readonly cookieName:string;
  constructor(private readonly service:AlphaGameService,private readonly sessions:GuestSessions,origin:string,private readonly production:boolean){
    const url=new URL(origin);if(production&&url.protocol!=='https:')throw new Error('Public alpha requires HTTPS');
    this.origin=url.origin;
    this.cookieName=production||url.protocol==='https:'?'__Host-aoh_alpha_session':'aoh_alpha_session';
  }
  private stream(request:Request,gameId:string,guestId:string):Response{
    const encoder=new TextEncoder();let cleanup=()=>{};
    const body=new ReadableStream<Uint8Array>({
      start:controller=>{
        const send=(text:string)=>{try{controller.enqueue(encoder.encode(text));}catch{cleanup();}};
        const push=(message:AlphaPush)=>send(`data: ${JSON.stringify(message)}\n\n`);
        send('retry: 1000\n\n');
        const unsubscribe=subscribeAlpha(gameId,push);
        presenceConnect(gameId,guestId,Date.now());alphaLog('SSE_CONNECTED',{room:short(gameId)});
        const keepalive=setInterval(()=>send(': ping\n\n'),15000);
        let closed=false;
        cleanup=()=>{if(closed)return;closed=true;clearInterval(keepalive);unsubscribe();presenceDisconnect(gameId,guestId,Date.now());alphaLog('SSE_DISCONNECTED',{room:short(gameId)});try{controller.close();}catch{/* already closed */}};
        request.signal.addEventListener('abort',cleanup,{once:true});
        push({gameId,version:-1,at:Date.now()});
      },
      cancel:()=>cleanup(),
    });
    return new Response(body,{headers:{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no','X-Content-Type-Options':'nosniff'}});
  }
  private accessOk(given:string|undefined):boolean{
    const required=process.env.ALPHA_ACCESS_CODE;if(!required)return true;
    // Pasted codes often carry a trailing space or the wrong case: both are forgiven.
    const a=Buffer.from((given??'').trim().toUpperCase()),b=Buffer.from(required.trim().toUpperCase());return a.length===b.length&&timingSafeEqual(a,b);
  }
  /** Who is asking, for rate limits that must not let one noisy client block everyone: the first hop of X-Forwarded-For (behind the platform proxy), else a shared bucket. */
  private clientKey(request:Request):string{
    const forwarded=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    return forwarded&&/^[0-9a-fA-F:.]{3,45}$/.test(forwarded)?forwarded:'local';
  }
  async handle(request:Request,now=Date.now()):Promise<Response>{
    const respond=(body:unknown,status=200,cookie?:string)=>{
      const headers=new Headers({'Cache-Control':'no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'});
      if(cookie)headers.set('Set-Cookie',cookie);
      if(status===429)headers.set('Retry-After','60');
      return Response.json(body,{status,headers});
    };
    const error=(code:string,message:string,status:number)=>respond({ok:false,error:{code,message}},status);
    if(!['GET','POST'].includes(request.method))return error('METHOD_NOT_ALLOWED','Método não disponível.',405);
    const fetchSite=request.headers.get('sec-fetch-site');
    if(fetchSite==='cross-site'||request.method==='POST'&&request.headers.get('origin')!==this.origin)return error('FORBIDDEN','A solicitação precisa partir do endereço oficial desta partida.',403);
    const cookie=request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(`${this.cookieName}=`))?.slice(this.cookieName.length+1);
    let principal=this.sessions.resolve(cookie,now);
    // Reads (the push-driven refreshes of a busy table) have their own, larger allowance; writes keep the tight one.
    const reads=request.method==='GET'||request.headers.get('x-aoh-telemetry')==='1';
    if(!this.rate.allow(principal?`guest:${principal.guestId}${reads?':read':''}`:`anonymous:${this.clientKey(request)}`,principal?(reads?600:120):30,now))return error('RATE_LIMIT','Muitas solicitações. Aguarde um minuto.',429);
    try{
      if(request.method==='GET'){
        // Public: what the entry screen needs before anyone has a session.
        if(new URL(request.url).searchParams.get('info')==='1')return respond({ok:true,value:{accessRequired:Boolean(process.env.ALPHA_ACCESS_CODE),maxSeats:maxSeats()}});
        if(!principal)return error('UNAUTHENTICATED','Entre com seu convite ou crie uma partida.',401);
        const gameId=new URL(request.url).searchParams.get('gameId');
        if(!gameId||!z.string().uuid().safeParse(gameId).success)return error('INVALID_INPUT','Identificador de partida inválido.',400);
        if(new URL(request.url).searchParams.get('stream')==='1'){
          // Shared-table push (SSE): membership is checked like a read; the stream carries only room versions, never state.
          const allowed=await this.service.read(principal,gameId,now);
          if(!allowed.ok)return respond(allowed,allowed.error.code==='FORBIDDEN'?403:404);
          return this.stream(request,gameId,principal.guestId);
        }
        if(new URL(request.url).searchParams.get('report')==='1'){
          // Post-match report: seat membership and FINISHED are checked by the service; it is never part of the live room view.
          const report=await this.service.readReport(principal,gameId);
          return respond(report,report.ok?200:report.error.code==='FORBIDDEN'?403:report.error.code==='NOT_FINISHED'?409:404);
        }
        const result=await this.service.read(principal,gameId,now);return respond(result,result.ok?200:result.error.code==='FORBIDDEN'?403:result.error.code==='VERSION_CONFLICT'?409:404);
      }
      let raw:unknown;try{raw=await readBody(request);}catch{return error('INVALID_INPUT','Envie JSON válido com até 16 KiB.',400);}
      const parsed=envelope.safeParse(raw);if(!parsed.success)return error('INVALID_INPUT','Solicitação inválida.',400);
      const action=parsed.data;
      // Per client, never global: creating rooms is the scarce one; joining with an invite is cheap but still bounded per client and per invite.
      if(action.operation==='create'&&!this.rate.allow(`create:${this.clientKey(request)}`,Number(process.env.ALPHA_CREATE_RATE_PER_MINUTE??6),now))return error('RATE_LIMIT','Muitas salas criadas. Aguarde um minuto.',429);
      if(action.operation==='join'&&(!this.rate.allow(`join:${this.clientKey(request)}`,20,now)||!this.rate.allow(`invite:${action.code}`,40,now)))return error('RATE_LIMIT','Muitas entradas. Aguarde um minuto.',429);
      if(action.operation==='telemetry'){
        if(!principal)return error('UNAUTHENTICATED','Sua sessão expirou. Entre novamente.',401);
        if(!this.rate.allow(`guest:${principal.guestId}:telemetry`,600,now))return error('RATE_LIMIT','Muitas solicitações. Aguarde um minuto.',429);
        return respond(await this.service.telemetry(principal,action.gameId,action.kind,action.detail));
      }
      if(action.operation==='create'&&!this.accessOk(action.accessCode))return error('ACCESS_CODE','Código de acesso do Alpha incorreto.',403);
      let setCookie:string|undefined;
      if(!principal){
        if(action.operation!=='create'&&action.operation!=='join')return error('UNAUTHENTICATED','Sua sessão expirou. Entre novamente.',401);
        const issued=this.sessions.issue(now);principal=issued.principal;
        setCookie=`${this.cookieName}=${issued.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${issued.maxAge}${this.production||this.origin.startsWith('https:')?'; Secure':''}`;
      }
      const result=action.operation==='create'?await this.service.create(principal,action.payload):action.operation==='join'?await this.service.join(principal,action.code,action.displayName,now):action.operation==='room'?await this.service.roomAction(principal,action.gameId,action.payload,now):action.operation==='lobby'?await this.service.lobby(principal,action.gameId,action.payload,now):await this.service.command(principal,action.gameId,action.payload,now);
      const status=result.ok?200:result.error.code==='FORBIDDEN'?403:result.error.code==='NOT_FOUND'?404:result.error.code==='VERSION_CONFLICT'||result.error.code==='LEGACY_ROOM'?409:400;
      return respond(result,status,result.ok?setCookie:undefined);
    }catch(cause:unknown){
      console.error('Alpha request failed',{name:cause instanceof Error?cause.name:'UnknownError'});
      return error('UNAVAILABLE','O servidor não conseguiu concluir a solicitação. Seu comando não foi confirmado; atualize a partida.',503);
    }
  }
}
