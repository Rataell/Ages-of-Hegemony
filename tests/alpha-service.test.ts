import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AlphaGameService, type AlphaRoomView } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions, type GuestPrincipal } from '../apps/server/src/guest-session.js';
const principal=():GuestPrincipal=>({guestId:randomUUID()});
async function setup(planningSeconds:0|300=0){
  const repository=new InMemoryAlphaRepository(),service=new AlphaGameService(repository),a=principal(),b=principal();
  const created=await service.create(a,{name:'Mesa de teste',displayName:'Ana',preset:'QUICK',seatLimit:2,seed:123,planningSeconds});
  if(!created.ok)throw new Error(created.error.message);
  const joined=await service.join(b,created.value.joinCode,'Beto');if(!joined.ok)throw new Error(joined.error.message);
  return {repository,service,a,b,view:joined.value};
}
async function start(f:Awaited<ReturnType<typeof setup>>):Promise<AlphaRoomView>{
  let view=f.view;
  for(const [actor,civilization] of [[f.a,'aurelia'],[f.b,'valgard']] as const){
    const chosen=await f.service.lobby(actor,view.id,{type:'CHOOSE_CIVILIZATION',expectedVersion:view.version,civilization},0);if(!chosen.ok)throw new Error(chosen.error.message);view=chosen.value;
    const ready=await f.service.lobby(actor,view.id,{type:'LOBBY_READY',expectedVersion:view.version,ready:true},0);if(!ready.ok)throw new Error(ready.error.message);view=ready.value;
  }
  const started=await f.service.lobby(f.a,view.id,{type:'START',expectedVersion:view.version},1000);if(!started.ok)throw new Error(started.error.message);return started.value;
}
describe('secure guest identity',()=>{
  it('accepts a valid identity after server recreation and rejects expiry, tampering and a different key',()=>{
    const secret='a'.repeat(64),sessions=new GuestSessions(secret),issued=sessions.issue(1000);
    expect(new GuestSessions(secret).resolve(issued.token,2000)).toEqual(issued.principal);
    expect(sessions.resolve(issued.token+'x',2000)).toBeNull();
    expect(sessions.resolve(issued.token.replace(issued.principal.guestId,randomUUID()),2000)).toBeNull();
    expect(new GuestSessions('b'.repeat(64)).resolve(issued.token,2000)).toBeNull();
    expect(sessions.resolve(issued.token,1000+issued.maxAge*1000)).toBeNull();
    expect(()=>new GuestSessions('weak')).toThrow();
  });
});
describe('alpha lobby and authoritative service',()=>{
  it('reconnects the same seat without revealing private guest IDs',async()=>{
    const f=await setup();const joined=await f.service.join(f.b,f.view.joinCode,'Novo nome');
    expect(joined.ok).toBe(true);if(!joined.ok)return;expect(joined.value.seats).toHaveLength(2);
    expect(joined.value.selfPlayerId).toBe(f.view.selfPlayerId);
    expect(JSON.stringify(joined.value)).not.toContain(f.a.guestId);expect(JSON.stringify(joined.value)).not.toContain(f.b.guestId);
    expect((await new AlphaGameService(f.repository).read(f.b,f.view.id,0)).ok).toBe(true);
    expect((await f.service.read(principal(),f.view.id,0)).ok).toBe(false);
    expect((await f.service.join(principal(),f.view.joinCode,'Terceiro')).ok).toBe(false);
  });
  it('requires host, two ready seats and exclusive civilizations',async()=>{
    const f=await setup();
    expect((await f.service.lobby(f.b,f.view.id,{type:'START',expectedVersion:f.view.version},0)).ok).toBe(false);
    expect((await f.service.lobby(f.a,f.view.id,{type:'START',expectedVersion:f.view.version},0)).ok).toBe(false);
    const chosen=await f.service.lobby(f.a,f.view.id,{type:'CHOOSE_CIVILIZATION',civilization:'aurelia',expectedVersion:f.view.version},0);
    if(!chosen.ok)throw new Error(chosen.error.message);
    expect((await f.service.lobby(f.b,f.view.id,{type:'CHOOSE_CIVILIZATION',civilization:'aurelia',expectedVersion:chosen.value.version},0)).ok).toBe(false);
    expect((await f.service.lobby(f.b,f.view.id,{type:'CHOOSE_CIVILIZATION',civilization:'unknown',expectedVersion:chosen.value.version},0)).ok).toBe(false);
  });
  it('resolves player identity server-side, exposes only projections and wins one competing CAS',async()=>{
    const f=await setup(),started=await start(f),game=started.game!;
    const stored=(await f.repository.find(started.id))!;
    const serialized=JSON.stringify(started);
    expect(serialized).not.toContain(stored.game!.privateRng.seed);expect(serialized).not.toContain('strategyDeck');expect(serialized).not.toContain(f.b.guestId);
    const forbidden=await f.service.command(f.b,started.id,{type:'MANAGE',expectedVersion:game.version,command:{type:'DEVELOP_CITY',playerId:game.self.playerId,cityId:game.view.player.civilization.cities[0]!.id,expectedVersion:game.view.version}},2000);
    expect(forbidden.ok).toBe(false);
    const command={type:'CIVILIZATION_ABILITY',expectedVersion:game.version};
    const results=await Promise.all([f.service.command(f.a,started.id,command,2000),f.service.command(f.a,started.id,command,2000)]);
    expect(results.filter(r=>r.ok)).toHaveLength(1);
    expect(results.find(r=>!r.ok)).toMatchObject({ok:false,error:{code:'VERSION_CONFLICT'}});
    expect((await f.repository.find(started.id))!.game!.version).toBe(game.version+1);
  });
  it('uses server deadlines to choose default ambitions and advance, once, under competing polling',async()=>{
    const f=await setup(300),started=await start(f);expect(started.deadline).toBe(301000);
    const early=await f.service.read(f.a,started.id,300999);expect(early.ok&&early.value.game!.view.round).toBe(1);
    const results=await Promise.all([f.service.read(f.a,started.id,301000),f.service.read(f.b,started.id,301000)]);
    expect(results.filter(r=>r.ok)).toHaveLength(1);
    const room=(await f.repository.find(started.id))!;expect(room.game!.core.round).toBe(2);expect(room.deadline).toBe(601000);
    expect(room.game!.players.every(p=>p.ambitionsChosen&&p.ambitions.length===2)).toBe(true);
  });
  it('keeps no-timer matches unchanged regardless of polling time',async()=>{
    const f=await setup(),started=await start(f);const result=await f.service.read(f.a,started.id,999999999);
    expect(result.ok&&result.value.game!.view.round).toBe(1);expect(result.ok&&result.value.deadline).toBeNull();
  });
});
