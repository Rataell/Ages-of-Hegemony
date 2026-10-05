import { randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaAlphaRepository } from './alpha-prisma-repository.js';
import { AlphaGameService } from './alpha-service.js';
import { GuestSessions } from './guest-session.js';
import { AlphaHttp } from './alpha-http.js';
import { PublishingAlphaRepository } from './alpha-bus.js';
import { InMemoryAlphaRepository, type AlphaRoom } from './alpha-room.js';
import { alphaStorageMode, type AlphaStorageMode } from './alpha-storage.js';
export type { AlphaRoomView } from './alpha-service.js';
export type { AlphaPlayerView } from './alpha-projection.js';
const expectedMigrations=['20260919000100_alpha_match','20260920000100_alpha_match_archive'];
const release='alpha-v0.1';
type Runtime={http:AlphaHttp;client:PrismaClient|null;storage:AlphaStorageMode;module:symbol};
/** Development-only memory storage. It lives on globalThis so a hot reload keeps the matches; restarting the process clears them. */
type Memory={rooms:Map<string,AlphaRoom>;secret:string};
/** Identifies this evaluation of the module. In development a hot reload evaluates it again, which rebuilds the HTTP layer over the same database client. */
const moduleToken=Symbol('alpha-runtime');
const processState=globalThis as typeof globalThis&{aohAlphaRuntime?:Runtime;aohAlphaMemory?:Memory};
const memory=():Memory=>processState.aohAlphaMemory??={rooms:new Map<string,AlphaRoom>(),secret:randomBytes(48).toString('base64url')};
function runtime():Runtime {
  const storage=alphaStorageMode(process.env),cached=processState.aohAlphaRuntime;
  // Production keeps one runtime for the life of the process. In development it is rebuilt when this module is reloaded, so recompiled engine and server code takes effect without restarting.
  if(cached&&cached.storage===storage&&(process.env.NODE_ENV==='production'||cached.module===moduleToken))return cached;
  if(storage==='memory'){
    // Zero-config development: real guest sessions (signed cookies, one per browser) over an in-process repository. Never reachable in production.
    const local=memory(),secret=(process.env.ALPHA_SESSION_SECRET??'').length>=32?process.env.ALPHA_SESSION_SECRET!:local.secret;
    const http=new AlphaHttp(new AlphaGameService(new PublishingAlphaRepository(new InMemoryAlphaRepository(local.rooms))),new GuestSessions(secret),process.env.ALPHA_PUBLIC_ORIGIN||'http://127.0.0.1:3001',false);
    return processState.aohAlphaRuntime={client:null,http,storage,module:moduleToken};
  }
  const connectionString=process.env.DATABASE_URL,secret=process.env.ALPHA_SESSION_SECRET,origin=process.env.ALPHA_PUBLIC_ORIGIN;
  if(!connectionString||!secret||!origin)throw new Error('Alpha environment is not configured');
  const sessions=new GuestSessions(secret),client=cached?.client??new PrismaClient({adapter:new PrismaPg({connectionString})});
  const http=new AlphaHttp(new AlphaGameService(new PublishingAlphaRepository(new PrismaAlphaRepository(client))),sessions,origin,process.env.NODE_ENV==='production');
  return processState.aohAlphaRuntime={client,http,storage,module:moduleToken};
}
export async function handleAlphaRequest(request:Request):Promise<Response>{
  try{return await runtime().http.handle(request);}
  catch{return Response.json({ok:false,error:{code:'UNAVAILABLE',message:'Teste online indisponível: banco e sessão de alpha precisam estar configurados no servidor.'}},{status:503,headers:{'Cache-Control':'no-store'}});}
}
export async function alphaHealth():Promise<Response>{
  try{
    if(alphaStorageMode(process.env)==='memory'){runtime();return Response.json({ok:true,service:'ages-of-hegemony-alpha',release,storage:'memory'},{headers:{'Cache-Control':'no-store'}});}
    const client=runtime().client!;await client.$queryRaw`SELECT 1`;
    const rows=await client.$queryRaw<{migration_name:string;finished_at:Date|null;rolled_back_at:Date|null}[]>`SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations`;
    const migration=expectedMigrations.every(name=>rows.some(r=>r.migration_name===name&&r.finished_at!==null&&r.rolled_back_at===null));
    const failed=rows.some(r=>r.finished_at===null&&r.rolled_back_at===null);
    const ready=migration&&!failed;
    return Response.json({ok:ready,service:'ages-of-hegemony-alpha',release,database:true,migration:ready},{status:ready?200:503,headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({ok:false,service:'ages-of-hegemony-alpha',release,database:false,migration:false},{status:503,headers:{'Cache-Control':'no-store'}});}
}
