import { describe, expect, it } from 'vitest';
import { completeRound } from './alpha-rounds.js';
import { PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createGame, migrateSnapshotV3ToV4, serializeAlphaState } from '@aoh/game-engine';
function setup(): AlphaState {
  const result=createGame({ gameId:'turn-alpha', seed:7,
    players:[{ id:'p1', name:'Um', resources:{food:100,materials:30,wealth:10,knowledge:0,influence:30} },{id:'p2',name:'Dois'}],
    map:[{id:'0,0',q:0,r:0,terrain:'PLAINS'},{id:'1,0',q:1,r:0,terrain:'PLAINS'},{id:'3,0',q:3,r:0,terrain:'PLAINS'}],
    initialCities:[{id:'c1',ownerId:'p1',hexId:'0,0',name:'Primeira'},{id:'c2',ownerId:'p2',hexId:'3,0',name:'Segunda'}] });
  if(!result.ok)throw new Error(result.error.message);const migrated=migrateSnapshotV3ToV4(result.value);
  if(!migrated.ok)throw new Error(migrated.error.message);return beginAlphaPlanning(migrated.value);
}
const p1=PlayerIdSchema.parse('p1'),p2=PlayerIdSchema.parse('p2');
function ready(state:AlphaState,actor:typeof p1):AlphaState {
  const result=applyAlphaCommand(state,actor,{type:'READY',expectedVersion:state.version});
  if(!result.ok)throw new Error(result.error.message);return result.value;
}
describe('alpha core turn and finish',()=>{
  it('preserves simultaneous planning and rotates explicit initiative after both ready',()=>{
    const initial=setup(); const first=ready(initial,p1);
    const second=completeRound(first);expect(second.core.round).toBe(2);expect(second.phase).toBe('PLANNING');expect(second.core.phase).toBe('PLANNING');
    expect(second.events.some(e=>e.type==='ROUND_STARTED'&&e.round===2)).toBe(true);
    expect(second.initiative).toEqual([p2,p1]);expect(second.players.every(p=>!p.ready)).toBe(true);
  });
  it('finishes at the configured round cap with deterministic tie breaks, regardless of ready arrival order',()=>{
    const first=setup();first.rules.roundLimit=2;
    let a=structuredClone(first),b=structuredClone(first);
    for(let round=0;round<2;round++){a=completeRound(a);b=completeRound(b,{order:[p2,p1]});}
    expect(a.winner).toEqual(b.winner);expect(a.core.status).toBe('FINISHED');expect(a.winner?.reason).toBe('ROUND_LIMIT');
    expect(a.core.round).toBe(2);expect(applyAlphaCommand(a,p1,{type:'READY',expectedVersion:a.version})).toMatchObject({ok:false,error:{code:'NOT_ACTIVE'}});
  });
  it('validates actor, version and ready lock before running legacy commands',()=>{
    const state=setup();const before=serializeAlphaState(state);
    expect(applyAlphaCommand(state,p2,{type:'MANAGE',expectedVersion:state.version,command:{type:'CLAIM_HEX',playerId:p1,cityId:'c1',hexId:'1,0',expectedVersion:state.core.version}})).toMatchObject({ok:false,error:{code:'FORBIDDEN'}});
    expect(applyAlphaCommand(state,p1,{type:'READY',expectedVersion:999})).toMatchObject({ok:false,error:{code:'VERSION_CONFLICT'}});
    const locked=ready(state,p1);expect(applyAlphaCommand(locked,p1,{type:'READY',expectedVersion:locked.version})).toMatchObject({ok:false,error:{code:'ALREADY_READY'}});
    expect(serializeAlphaState(state)).toBe(before);
  });
  it('executes existing management with its real costs and alpha command budget',()=>{
    const state=setup();const influenceBefore=state.core.players[0]!.resources.influence;const result=applyAlphaCommand(state,p1,{type:'MANAGE',expectedVersion:0,command:{type:'CLAIM_HEX',playerId:p1,cityId:'c1',hexId:'1,0',expectedVersion:0}});
    expect(result.ok).toBe(true);if(!result.ok)return;
    expect(result.value.core.players[0]?.resources.influence).toBe(influenceBefore-1);expect(result.value.players[0]?.spentCommands).toBe(1);
    result.value.players[0]!.spentCommands=result.value.rules.actionsPerRound!;
    const before=serializeAlphaState(result.value);
    expect(applyAlphaCommand(result.value,p1,{type:'MANAGE',expectedVersion:result.value.version,command:{type:'ASSIGN_POPULATION',playerId:p1,cityId:'c1',workers:result.value.core.players[0]!.civilization.cities[0]!.workers,expectedVersion:result.value.core.version}})).toMatchObject({ok:true});
    expect(applyAlphaCommand(result.value,p1,{type:'BUILD_ROAD',expectedVersion:result.value.version,hexId:'1,0'})).toMatchObject({ok:false,error:{code:'ACTION_LIMIT',message:'Sem ações principais disponíveis nesta rodada.'}});
    expect(serializeAlphaState(result.value)).toBe(before);
  });
  it('never accepts a scheduler command through the player management envelope',()=>{
    const state=setup();expect(applyAlphaCommand(state,p1,{type:'MANAGE',expectedVersion:0,command:{type:'ADVANCE_PHASE',nextPhase:'RESOLUTION',expectedVersion:state.core.version}})).toMatchObject({ok:false,error:{code:'FORBIDDEN'}});
  });
});
