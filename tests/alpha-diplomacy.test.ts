import { describe, expect, it } from 'vitest';
import { completeRound, must, readyAll } from './alpha-rounds.js';
import { AlphaStateSchema, emptyResourcePool, type AlphaCommand, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, atWar, beginAlphaPlanning, createGame, maintainTrade, migrateSnapshotV3ToV4, settleTreaties } from '@aoh/game-engine';

function setup():AlphaState {
  const core=createGame({gameId:'diplomacy-alpha',seed:17,players:[{id:'p1',name:'Um',resources:{food:20,materials:20,wealth:20,knowledge:20,influence:20}},{id:'p2',name:'Dois'},{id:'p3',name:'Três'}],
    map:Array.from({length:9},(_,q)=>({id:`${q},0`,q,r:0,terrain:'PLAINS'})),
    initialCities:[{id:'c1',ownerId:'p1',hexId:'0,0',name:'Um'},{id:'c2',ownerId:'p2',hexId:'4,0',name:'Dois'},{id:'c3',ownerId:'p3',hexId:'8,0',name:'Três'}]});
  if(!core.ok)throw new Error(core.error.message);const migrated=migrateSnapshotV3ToV4(core.value);if(!migrated.ok)throw new Error(migrated.error.message);
  const state=beginAlphaPlanning(migrated.value);
  for(const p of state.players){p.contacts=state.players.filter(o=>o!==p).map(o=>o.playerId);p.knownHexIds=state.core.map.map(t=>t.id);}
  return state;
}
function run(state:AlphaState,index:number,command:Omit<AlphaCommand,'expectedVersion'>):AlphaState {
  const result=applyAlphaCommand(state,state.players[index]!.playerId,{...command,expectedVersion:state.version});
  if(!result.ok)throw new Error(result.error.message);return result.value;
}
function treaty(state:AlphaState,a=0,b=1,type:AlphaState['treaties'][number]['type']='TRADE_AGREEMENT') {
  state.treaties.push({id:`t-${state.treaties.length}`,proposerId:state.players[a]!.playerId,recipientId:state.players[b]!.playerId,type,status:'ACTIVE',deal:{give:emptyResourcePool(),receive:emptyResourcePool()},createdRound:1,expiresRound:4});
}
describe('alpha diplomatic commitments',()=>{
  it('validates both sides before exchanging resources and rejects unaffordable accepted deals atomically',()=>{
    const state=setup();treaty(state);const t=state.treaties[0]!;t.status='ACCEPTED';
    t.deal.give.wealth=5;t.deal.receive.materials=999;
    const opening=state.core.players.map(p=>({...p.resources}));settleTreaties(state);
    expect(t.status).toBe('DECLINED');expect(state.core.players.map(p=>p.resources)).toEqual(opening);
    t.status='ACCEPTED';t.deal.receive.materials=0;settleTreaties(state);
    expect(t.status).toBe('ACTIVE');expect(state.core.players[0]!.resources.wealth).toBe(opening[0]!.wealth-5);
    expect(state.core.players[1]!.resources.wealth).toBe(opening[1]!.wealth+5);
    const after=structuredClone(state);settleTreaties(state);expect(state).toEqual(after);
  });
  it('only allows the recipient to accept, uses configured duration, and keeps client input immutable',()=>{
    let state=setup();state.rules.treatyDuration=7;const original=structuredClone(state);
    const result=applyAlphaCommand(state,state.players[0]!.playerId,{type:'PROPOSE_TREATY',expectedVersion:0,recipientId:state.players[1]!.playerId,treaty:'OPEN_BORDERS',deal:{give:emptyResourcePool(),receive:emptyResourcePool()}});
    if(!result.ok)throw new Error(result.error.message);state=result.value;
    expect(original.treaties).toHaveLength(0);expect(state.treaties[0]!.expiresRound).toBe(8);
    const command={type:'RESPOND_TREATY',expectedVersion:state.version,treatyId:state.treaties[0]!.id,accept:true};
    expect(applyAlphaCommand(state,state.players[2]!.playerId,command).ok).toBe(false);
    expect(applyAlphaCommand(state,state.players[1]!.playerId,command).ok).toBe(true);
  });
  it('calls only direct defensive partners when war is declared',()=>{
    let state=setup();treaty(state,1,2,'DEFENSIVE_PACT');treaty(state,0,2,'NON_AGGRESSION_PACT');
    state=run(state,0,{type:'DECLARE_WAR',targetId:state.players[1]!.playerId} as AlphaCommand);
    expect(atWar(state,state.players[0]!.playerId,state.players[1]!.playerId)).toBe(true);
    expect(atWar(state,state.players[0]!.playerId,state.players[2]!.playerId)).toBe(true);
    expect(state.treaties[1]!.status).toBe('ENDED');expect(state.treaties[0]!.status).toBe('ACTIVE');
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });
  it('pays route income only when the origin city supports trade, and suspends routes when access or peace ends',()=>{
    let state=setup();treaty(state);treaty(state,0,1,'OPEN_BORDERS');
    state.rules.routeIncome=4;state.rules.foreignRouteIncome=3;
    const [a,b]=[state.players[0]!.playerId,state.players[1]!.playerId];const origin=state.core.players[0]!.civilization.cities[0]!.id;
    state.routes.push({id:'route1',ownerId:a,fromCityId:origin,toCityId:state.core.players[1]!.civilization.cities[0]!.id,path:state.core.map.slice(0,5).map(t=>t.id),suspended:false});
    const before=state.core.players.map(p=>p.resources.wealth);maintainTrade(state);
    expect(state.core.players.map(p=>p.resources.wealth)).toEqual(before);
    state=readyAll(state);expect(state.phase).toBe('URBAN_ACTIONS');
    state=must(state,a,{type:'URBAN_ACTION',cityId:origin,action:'SUPPORT_TRADE'});
    expect(state.core.players[0]!.resources.wealth).toBe(before[0]!+4);expect(state.core.players[1]!.resources.wealth).toBe(before[1]!+3);
    expect(state.roundLedgers.find(l=>l.playerId===a)!.trade.wealth).toBe(4);
    state.wars=[[a,b]];maintainTrade(state);
    expect(state.routes[0]!.suspended).toBe(true);
    state.cities.find(c=>c.cityId===origin)!.urbanActionsUsed=0;
    expect(applyAlphaCommand(state,a,{type:'URBAN_ACTION',expectedVersion:state.version,cityId:origin,action:'SUPPORT_TRADE'})).toMatchObject({ok:false,error:{code:'RULE_FAILURE'}});
  });
  it('resolves envoy influence only after ready and prevents repeated farming of one city',()=>{
    let state=setup();const actor=state.players[0]!.playerId;
    state.units=[{id:'envoy',ownerId:actor,kind:'ENVOY',hexId:state.core.map[3]!.id,recruitedRound:1}];
    const command={type:'QUEUE_ORDER',expectedVersion:0,order:{id:'influence',type:'INFLUENCE',unitId:'envoy',target:'4,0'}};
    const result=applyAlphaCommand(state,actor,command);if(!result.ok)throw new Error(result.error.message);state=result.value;
    expect(state.players[0]!.foreignInfluence).toBe(0);
    state=completeRound(state);
    expect(state.players[0]!.foreignInfluence).toBe(1);expect(state.players[0]!.influencedCities).toEqual(['c2']);
    expect(applyAlphaCommand(state,actor,{...command,expectedVersion:state.version}).ok).toBe(false);
    expect(applyAlphaCommand(state,state.players[1]!.playerId,{...command,expectedVersion:state.version}).ok).toBe(false);
  });
});
