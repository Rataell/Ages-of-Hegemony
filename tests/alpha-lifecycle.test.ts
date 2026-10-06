import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { AlphaGameService, type AlphaRoomView } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import type { GuestPrincipal } from '../apps/server/src/guest-session.js';
import { resetPresenceForTests, connect, touch } from '../apps/server/src/alpha-presence.js';
import { subscribeAlpha, type AlphaPush } from '../apps/server/src/alpha-bus.js';

const guest=():GuestPrincipal=>({guestId:randomUUID()});
const CIVS=['aurelia','valgard','thalos','ironmark'];
async function table(seats:number){
  const service=new AlphaGameService(new InMemoryAlphaRepository()),people=Array.from({length:seats},guest);
  const created=await service.create(people[0]!,{name:'Mesa',displayName:'P1',preset:'QUICK',seatLimit:seats,seed:7,planningSeconds:0});
  if(!created.ok)throw new Error(created.error.message);
  const view=created.value;
  for(const [i,p] of people.slice(1).entries()){const j=await service.join(p,view.joinCode,`P${i+2}`,0);if(!j.ok)throw new Error(j.error.message);}
  return {service,people,id:view.id,code:view.joinCode};
}
async function start(t:Awaited<ReturnType<typeof table>>){
  for(const [i,p] of t.people.entries()){
    const v=(await t.service.read(p,t.id,0));if(!v.ok)throw new Error(v.error.message);
    const c=await t.service.lobby(p,t.id,{type:'CHOOSE_CIVILIZATION',expectedVersion:v.value.version,civilization:CIVS[i]!},0);if(!c.ok)throw new Error(c.error.message);
    const r=await t.service.lobby(p,t.id,{type:'LOBBY_READY',expectedVersion:c.value.version,ready:true},0);if(!r.ok)throw new Error(r.error.message);
  }
  const v=await t.service.read(t.people[0]!,t.id,0);if(!v.ok)throw new Error('read');
  const s=await t.service.lobby(t.people[0]!,t.id,{type:'START',expectedVersion:v.value.version},0);if(!s.ok)throw new Error(s.error.message);return s.value;
}
const act=(t:Awaited<ReturnType<typeof table>>,i:number,payload:Record<string,unknown>,now=1000)=>t.service.roomAction(t.people[i]!,t.id,payload,now);
beforeEach(()=>{resetPresenceForTests();delete process.env.ALPHA_MAX_SEATS;});

describe('external alpha lobby',()=>{
  it('host kicks, resizes and closes; the kicked seat id is reusable',async()=>{
    const t=await table(3);
    const v=(await t.service.read(t.people[0]!,t.id,0)) as {ok:true;value:AlphaRoomView};
    const kicked=await t.service.lobby(t.people[0]!,t.id,{type:'KICK',expectedVersion:v.value.version,playerId:'player-2'},0);
    expect(kicked.ok&&kicked.value.seats.map(s=>s.playerId)).toEqual(['player-1','player-3']);
    if(!kicked.ok)return;
    expect((await t.service.read(t.people[1]!,t.id,0)).ok).toBe(false);
    const again=await t.service.join(t.people[1]!,t.code,'Volta',0);expect(again.ok&&again.value.selfPlayerId).toBe('player-2');
    const nonHost=await t.service.lobby(t.people[2]!,t.id,{type:'CLOSE_ROOM',expectedVersion:(await t.service.read(t.people[2]!,t.id,0) as {ok:true;value:AlphaRoomView}).value.version},0);
    expect(nonHost.ok).toBe(false);
    const cur=(await t.service.read(t.people[0]!,t.id,0)) as {ok:true;value:AlphaRoomView};
    const closed=await t.service.lobby(t.people[0]!,t.id,{type:'CLOSE_ROOM',expectedVersion:cur.value.version},0);
    expect(closed.ok&&closed.value.lifecycle).toBe('CLOSED');
    expect((await t.service.join(guest(),t.code,'Tarde',0)).ok).toBe(false);
  });
  it('limits seats to the external maximum',async()=>{
    process.env.ALPHA_MAX_SEATS='4';
    const service=new AlphaGameService(new InMemoryAlphaRepository());
    const r=await service.create(guest(),{name:'Mesa',displayName:'A',preset:'QUICK',seatLimit:5,seed:1,planningSeconds:0});
    expect(r.ok).toBe(false);
  });
});

describe('running table lifecycle',()=>{
  it('leaving keeps the seat; the host role moves deterministically and the old host can come back as a guest',async()=>{
    const t=await table(3);await start(t);
    connect(t.id,t.people[1]!.guestId,1000);connect(t.id,t.people[2]!.guestId,1000);connect(t.id,t.people[0]!.guestId,1000);
    const left=await act(t,0,{type:'LEAVE'});
    expect(left.ok&&left.value.isHost).toBe(false);
    const view=await t.service.read(t.people[1]!,t.id,1100);
    expect(view.ok&&view.value.isHost).toBe(true);
    expect(view.ok&&view.value.notices.some(n=>n.type==='HOST_TRANSFERRED')).toBe(true);
    touch(t.id,t.people[0]!.guestId,1200);
    const back=await t.service.read(t.people[0]!,t.id,1200);
    expect(back.ok&&back.value.selfPlayerId).toBe('player-1');expect(back.ok&&back.value.isHost).toBe(false);
    expect(back.ok&&back.value.seats[0]!.onGuard).toBe(false);
  });
  it('suspends only at a safe point and resumes; commands are refused while suspended',async()=>{
    const t=await table(2);await start(t);
    const first=await t.service.read(t.people[0]!,t.id,0);
    if(!first.ok)throw new Error('read');
    // Ambitions are a mandatory decision of round 1: not a safe point yet.
    expect((await act(t,0,{type:'SUSPEND'})).ok).toBe(false);
    for(const [i,p] of t.people.entries()){
      const v=await t.service.read(p,t.id,0);if(!v.ok)throw new Error('r');
      const ids=v.value.game!.self.ambitions.slice(0,2);
      const r=await t.service.command(p,t.id,{type:'CHOOSE_AMBITIONS',expectedVersion:v.value.game!.version,cardIds:ids},0);if(!r.ok)throw new Error(`ambitions ${i}: ${r.error.message}`);
    }
    for(const p of t.people){
      for(let n=0;n<4;n++){const v=await t.service.read(p,t.id,0);if(!v.ok)break;const choice=v.value.game!.self.pendingChoices[0];if(!choice)break;
        const r=await t.service.command(p,t.id,{type:'RESOLVE_CHOICE',expectedVersion:v.value.game!.version,choiceId:choice.id,optionId:choice.options[0]!.id},0);if(!r.ok)break;}
    }
    // A guest cannot suspend.
    const nope=await act(t,1,{type:'SUSPEND'});expect(nope.ok).toBe(false);
    const sus=await act(t,0,{type:'SUSPEND'});
    expect(sus.ok&&sus.value.lifecycle).toBe('SUSPENDED');
    if(!sus.ok)return;
    const v=await t.service.read(t.people[1]!,t.id,0);if(!v.ok)throw new Error('r');
    const blocked=await t.service.command(t.people[1]!,t.id,{type:'READY',expectedVersion:v.value.game!.version},0);
    expect(!blocked.ok&&blocked.error.code).toBe('SUSPENDED');
    expect((await act(t,1,{type:'RESUME'})).ok).toBe(false);
    const res=await act(t,0,{type:'RESUME'});expect(res.ok&&res.value.lifecycle).toBe('ACTIVE');
  });
  it('removal by vote puts a civilization EM GUARDA; a 2-person table cannot remove a present player',async()=>{
    const two=await table(2);await start(two);
    connect(two.id,two.people[0]!.guestId,0);connect(two.id,two.people[1]!.guestId,0);
    const p=await act(two,0,{type:'PROPOSE_REMOVE',target:'player-2'},10);
    expect(p.ok&&p.value.vote?.kind).toBe('REMOVE');expect(p.ok&&p.value.seats[1]!.onGuard).toBe(false);
    resetPresenceForTests();
    const t=await table(3);await start(t);
    for(const x of t.people)connect(t.id,x.guestId,0);
    const prop=await act(t,0,{type:'PROPOSE_REMOVE',target:'player-3'},10);
    expect(prop.ok&&prop.value.vote?.needed).toBe(2);
    const yes=await act(t,1,{type:'VOTE',yes:true},20);
    expect(yes.ok&&yes.value.seats[2]!.onGuard).toBe(true);expect(yes.ok&&yes.value.vote).toBeNull();
    // the removed player's own commands are refused until they resume the seat
    const v=await t.service.read(t.people[2]!,t.id,30);if(!v.ok)throw new Error('r');
    expect(v.value.selfOnGuard).toBe(true);
    const refused=await t.service.command(t.people[2]!,t.id,{type:'READY',expectedVersion:v.value.game!.version},30);expect(!refused.ok&&refused.error.code).toBe('ON_GUARD');
    const back=await act(t,2,{type:'RESUME_SEAT'},40);expect(back.ok&&back.value.selfOnGuard).toBe(false);
  });
  it('ending a running match needs a majority and closes it read-only',async()=>{
    const t=await table(3);await start(t);for(const x of t.people)connect(t.id,x.guestId,0);
    await act(t,0,{type:'PROPOSE_END'},10);
    const a=await act(t,1,{type:'VOTE',yes:true},20);
    expect(a.ok&&a.value.lifecycle).toBe('CLOSED');
    const c=await t.service.command(t.people[0]!,t.id,{type:'READY',expectedVersion:0},30);expect(!c.ok&&c.error.code).toBe('ROOM_CLOSED');
  });
  it('reactions and pings are broadcast, never saved, and rate limited',async()=>{
    const t=await table(2);await start(t);
    const seen:AlphaPush[]=[];const off=subscribeAlpha(t.id,p=>seen.push(p));
    const before=await t.service.read(t.people[0]!,t.id,0);if(!before.ok)throw new Error('r');
    await act(t,0,{type:'REACT',reaction:'APPLAUSE'},5000);await act(t,0,{type:'REACT',reaction:'SURPRISE'},5100);await act(t,0,{type:'PING',hexId:'3,-2'},5200);
    off();
    const events=seen.filter(p=>p.event?.type==='REACTION'||p.event?.type==='PING');
    expect(events.map(e=>e.event!.type)).toEqual(['REACTION','PING']);
    const after=await t.service.read(t.people[0]!,t.id,6000);expect(after.ok&&after.value.version).toBe(before.value.version);
  });
});
