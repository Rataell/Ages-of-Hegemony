import { describe, expect, it } from 'vitest';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService, type AlphaRoomView } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
const origin='https://alpha.example.test';
function setup(){const repository=new InMemoryAlphaRepository();return {repository,http:new AlphaHttp(new AlphaGameService(repository),new GuestSessions('test-secret-'.repeat(8)),origin,true)};}
function post(body:unknown,cookie='',requestOrigin=origin){return new Request(`${origin}/api/alpha`,{method:'POST',headers:{'Content-Type':'application/json',Origin:requestOrigin,Cookie:cookie},body:JSON.stringify(body)});}
const create={operation:'create',payload:{name:'Mesa remota',displayName:'Ana',preset:'QUICK',seatLimit:2,seed:4,planningSeconds:0}};
async function view(response:Response):Promise<AlphaRoomView>{expect(response.status).toBe(200);const body=await response.json() as {ok:boolean;value:AlphaRoomView};expect(body.ok).toBe(true);return body.value;}
describe('alpha HTTP boundary',()=>{
  it('sets a secure host-only session, rejects cross-origin writes and never puts identity tokens in JSON',async()=>{
    const {http}=setup();expect((await http.handle(post(create,'','https://untrusted.example'),1000)).status).toBe(403);
    const response=await http.handle(post(create),1000),cookie=response.headers.get('set-cookie')!;
    expect(cookie).toContain('__Host-aoh_alpha_session=');expect(cookie).toContain('HttpOnly');expect(cookie).toContain('SameSite=Strict');expect(cookie).toContain('Secure');expect(cookie).not.toContain('Domain=');
    const created=await view(response);expect(JSON.stringify(created)).not.toContain(cookie.split(';')[0]!.split('=')[1]!);
    expect(response.headers.get('cache-control')).toBe('no-store');expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
  it('connects two isolated cookies through create, join, lobby, start and reconnect',async()=>{
    const {http}=setup();const first=await http.handle(post(create),1000),cookieA=first.headers.get('set-cookie')!.split(';')[0]!;let current=await view(first);
    const joined=await http.handle(post({operation:'join',code:current.joinCode,displayName:'Beto'}),2000),cookieB=joined.headers.get('set-cookie')!.split(';')[0]!;current=await view(joined);
    expect(cookieA).not.toBe(cookieB);expect(current.seats).toHaveLength(2);
    for(const [cookie,civilization] of [[cookieA,'aurelia'],[cookieB,'valgard']]){
      current=await view(await http.handle(post({operation:'lobby',gameId:current.id,payload:{type:'CHOOSE_CIVILIZATION',expectedVersion:current.version,civilization}},cookie),3000));
      current=await view(await http.handle(post({operation:'lobby',gameId:current.id,payload:{type:'LOBBY_READY',expectedVersion:current.version,ready:true}},cookie),4000));
    }
    current=await view(await http.handle(post({operation:'lobby',gameId:current.id,payload:{type:'START',expectedVersion:current.version}},cookieA),5000));
    const get=(cookie:string)=>new Request(`${origin}/api/alpha?gameId=${current.id}`,{headers:{Cookie:cookie}});
    const a=await view(await http.handle(get(cookieA),6000)),b=await view(await http.handle(get(cookieB),6000));
    expect(a.selfPlayerId).not.toBe(b.selfPlayerId);expect(a.game!.self.hand).not.toEqual(b.game!.self.hand);
    expect(b.game!.self.playerId).toBe(b.selfPlayerId);
    expect((await http.handle(get(''),6000)).status).toBe(401);
    expect((await http.handle(get(cookieA+'tampered'),6000)).status).toBe(401);
  });
  it('rejects oversized JSON and applies bounded public endpoint rate limits',async()=>{
    const {http}=setup();expect((await http.handle(post({...create,padding:'x'.repeat(17000)}),1000)).status).toBe(400);
    let final:Response|undefined;
    for(let i=0;i<31;i++)final=await http.handle(post({operation:'join',code:'not-a-code',displayName:'Test'}),1000);
    expect(final!.status).toBe(429);expect(final!.headers.get('retry-after')).toBe('60');
    expect((await http.handle(post(create),62000)).status).toBe(200);
  });
  it('rejects extra identity fields instead of treating client player IDs as credentials',async()=>{
    const {http}=setup();expect((await http.handle(post({...create,guestId:'attacker',playerId:'player-1'}),1000)).status).toBe(400);
    expect((await http.handle(post({operation:'command',gameId:'00000000-0000-4000-8000-000000000000',payload:{type:'READY',expectedVersion:0}}),1000)).status).toBe(401);
  });
});
