import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaAlphaRepository } from './alpha-prisma-repository.js';
import { AlphaGameService } from './alpha-service.js';
import { GuestSessions } from './guest-session.js';
import { AlphaHttp } from './alpha-http.js';
export type { AlphaRoomView } from './alpha-service.js';
export type { AlphaPlayerView } from './alpha-projection.js';
const expectedMigration='20260919000100_alpha_match';
type Runtime={http:AlphaHttp;client:PrismaClient};
const processState=globalThis as typeof globalThis&{aohAlphaRuntime?:Runtime};
function runtime():Runtime {
  if(processState.aohAlphaRuntime)return processState.aohAlphaRuntime;
  const connectionString=process.env.DATABASE_URL,secret=process.env.ALPHA_SESSION_SECRET,origin=process.env.ALPHA_PUBLIC_ORIGIN;
  if(!connectionString||!secret||!origin)throw new Error('Alpha environment is not configured');
  const sessions=new GuestSessions(secret),client=new PrismaClient({adapter:new PrismaPg({connectionString})});
  const http=new AlphaHttp(new AlphaGameService(new PrismaAlphaRepository(client)),sessions,origin,process.env.NODE_ENV==='production');
  return processState.aohAlphaRuntime={client,http};
}
export async function handleAlphaRequest(request:Request):Promise<Response>{
  try{return await runtime().http.handle(request);}
  catch{return Response.json({ok:false,error:{code:'UNAVAILABLE',message:'Teste online indisponível: banco e sessão de alpha precisam estar configurados no servidor.'}},{status:503,headers:{'Cache-Control':'no-store'}});}
}
export async function alphaHealth():Promise<Response>{
  try{
    const {client}=runtime();await client.$queryRaw`SELECT 1`;
    const rows=await client.$queryRaw<{migration_name:string;finished_at:Date|null;rolled_back_at:Date|null}[]>`SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations`;
    const migration=rows.some(r=>r.migration_name===expectedMigration&&r.finished_at!==null&&r.rolled_back_at===null);
    const failed=rows.some(r=>r.finished_at===null&&r.rolled_back_at===null);
    const ready=migration&&!failed;
    return Response.json({ok:ready,service:'ages-of-hegemony-alpha',database:true,migration:ready},{status:ready?200:503,headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({ok:false,service:'ages-of-hegemony-alpha',database:false,migration:false},{status:503,headers:{'Cache-Control':'no-store'}});}
}
