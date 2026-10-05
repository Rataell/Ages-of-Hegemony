import { describe, expect, it } from 'vitest';
import { completeRound } from './alpha-rounds.js';
import { AlphaStateSchema, GameStateSchema, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createGame, migrateSnapshotV3ToV4, occupyCity, refreshKnowledge, serializeAlphaState, setAlphaPhase } from '@aoh/game-engine';
function setup():AlphaState {
  const core=createGame({gameId:'capture-alpha',seed:23,players:[{id:'p1',name:'Um',resources:{food:30,materials:30,wealth:20,knowledge:10,influence:20}},{id:'p2',name:'Dois',resources:{food:30,materials:30,wealth:20,knowledge:10,influence:20}}],
    map:Array.from({length:10},(_,q)=>({id:`${q},0`,q,r:0,terrain:'PLAINS'})),
    initialCities:[{id:'c1',ownerId:'p1',hexId:'0,0',name:'Um'},{id:'c2',ownerId:'p2',hexId:'4,0',name:'Dois'},{id:'c3',ownerId:'p2',hexId:'8,0',name:'Três'}]});
  if(!core.ok)throw new Error(core.error.message);const migrated=migrateSnapshotV3ToV4(core.value);if(!migrated.ok)throw new Error(migrated.error.message);
  // Seeds above the canon limits: this scenario tests capture, not storage.
  for(const key of Object.keys(migrated.value.rules.balance.limits.base)){Object.assign(migrated.value.rules.balance.limits.base,{[key]:100});Object.assign(migrated.value.rules.balance.limits.hardCap,{[key]:100});}
  const state=beginAlphaPlanning(migrated.value),city=state.core.players[1]!.civilization.cities[0]!;
  const assigned=applyAlphaCommand(state,state.players[1]!.playerId,{type:'MANAGE',expectedVersion:state.version,command:{type:'ASSIGN_POPULATION',playerId:state.players[1]!.playerId,cityId:city.id,workers:city.workers,expectedVersion:state.core.version}});
  if(!assigned.ok)throw new Error(assigned.error.message);return assigned.value;
}
describe('alpha city capture and integration',()=>{
  it('transfers city authority, relocates the capital and preserves historical economic attribution',()=>{
    const state=setup(),actor=state.players[0]!.playerId,former=state.players[1]!.playerId;
    const cityId=state.core.players[1]!.civilization.capitalCityId!;
    const history=structuredClone(state.core.eventLog);occupyCity(state,actor,cityId);refreshKnowledge(state);
    expect(state.core.players[1]!.civilization.capitalCityId).toBe('c3');
    expect(state.core.players[0]!.civilization.cities.some(c=>c.id===cityId)).toBe(true);
    expect(state.core.map.find(t=>t.id==='4,0')!.ownerId).toBe(actor);
    expect(state.core.eventLog.slice(0,-1)).toEqual(history);
    expect(state.core.eventLog.at(-1)).toMatchObject({type:'CITY_TRANSFERRED',playerId:actor,previousOwnerId:former});
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
    expect(state.occupations[0]).toMatchObject({cityId,occupierId:actor,previousOwnerId:former});
    const invalid=structuredClone(state);invalid.core.eventLog.pop();invalid.core.version--;
    expect(GameStateSchema.safeParse(invalid.core).success).toBe(false);
  });
  it('blocks administration and recruitment until a later-round paid integration through the civic action',()=>{
    let state=setup();const actor=state.players[0]!.playerId,cityId=state.core.players[1]!.civilization.capitalCityId!;
    occupyCity(state,actor,cityId);refreshKnowledge(state);
    expect(applyAlphaCommand(state,actor,{type:'MANAGE',expectedVersion:state.version,command:{type:'ASSIGN_POPULATION',playerId:actor,cityId,workers:state.core.players[1]!.civilization.cities[0]!.workers,expectedVersion:state.core.version}}).ok).toBe(false);
    setAlphaPhase(state,'URBAN_ACTIONS');
    expect(applyAlphaCommand(state,actor,{type:'URBAN_ACTION',expectedVersion:state.version,cityId,action:'RECRUIT',unit:'INFANTRY'}).ok).toBe(false);
    expect(applyAlphaCommand(state,actor,{type:'URBAN_ACTION',expectedVersion:state.version,cityId,action:'CIVIC_ACTION'})).toMatchObject({ok:false,error:{message:expect.stringContaining('rodada seguinte')}});
    setAlphaPhase(state,'PLANNING');state=completeRound(state);setAlphaPhase(state,'URBAN_ACTIONS');
    const before=state.players[0]!.resources.influence,step=state.rules.balance.integrationPerAction,needed=Math.ceil(100/step);
    for(let i=0;i<needed;i++){
      expect(state.occupations).toHaveLength(1);
      const done=applyAlphaCommand(state,actor,{type:'URBAN_ACTION',expectedVersion:state.version,cityId,action:'CIVIC_ACTION'});
      if(!done.ok)throw new Error(done.error.message);state=done.value;state.cities.find(c=>c.cityId===cityId)!.urbanActionsUsed=0;
    }
    expect(state.occupations).toHaveLength(0);
    expect(state.players[0]!.resources.influence).toBe(before-needed*state.rules.integrationCost.influence);
    expect(state.cities.find(c=>c.cityId===cityId)).toMatchObject({status:'OWNED',integration:100});
    expect(applyAlphaCommand(state,actor,{type:'URBAN_ACTION',expectedVersion:state.version,cityId,action:'RECRUIT',unit:'INFANTRY'}).ok).toBe(true);
  });
  it('liberates a previously owned city and accepts history across repeated transfers',()=>{
    const state=setup(),actor=state.players[0]!.playerId,former=state.players[1]!.playerId,cityId=state.core.players[1]!.civilization.capitalCityId!;
    occupyCity(state,actor,cityId);occupyCity(state,former,cityId);refreshKnowledge(state);
    expect(state.occupations).toHaveLength(0);expect(AlphaStateSchema.safeParse(state).success).toBe(true);
    expect(state.core.players[1]!.civilization.cities.some(c=>c.id===cityId)).toBe(true);
  });
  it('rejects forged historical ownership and leaves rejected player commands unchanged',()=>{
    const state=setup(),actor=state.players[0]!.playerId,cityId=state.core.players[1]!.civilization.capitalCityId!;
    occupyCity(state,actor,cityId);const before=serializeAlphaState(state);
    expect(applyAlphaCommand(state,state.players[1]!.playerId,{type:'URBAN_ACTION',expectedVersion:state.version,cityId,action:'CIVIC_ACTION'}).ok).toBe(false);
    expect(serializeAlphaState(state)).toBe(before);
    const transfer=state.core.eventLog.at(-1)!;if(transfer.type==='CITY_TRANSFERRED')transfer.previousOwnerId=actor;
    expect(GameStateSchema.safeParse(state.core).success).toBe(false);
  });
  it('founds outside the administrative radius by consuming a pioneer and the shared founding cost',()=>{
    const state=setup(),actor=state.players[0]!.playerId;
    state.units.push({id:'pioneer',ownerId:actor,kind:'PIONEER',hexId:state.core.map[2]!.id,recruitedRound:1});
    const before={...state.core.players[0]!.resources};
    const result=applyAlphaCommand(state,actor,{type:'SETTLE',expectedVersion:state.version,unitId:'pioneer',name:'Travessia'});
    if(!result.ok)throw new Error(result.error.message);
    expect(result.value.units).toHaveLength(0);expect(state.units).toHaveLength(1);
    const city=result.value.core.players[0]!.civilization.cities.find(c=>c.name==='Travessia')!;
    expect(city.hexId).toBe('2,0');expect(result.value.core.map[2]!.controllerCityId).toBe(city.id);
    expect(result.value.core.players[0]!.resources.food).toBe(before.food-state.core.config.territory.foundingCost.food);
    expect(result.value.players[0]!.spentCommands).toBe(1);expect(AlphaStateSchema.safeParse(result.value).success).toBe(true);
  });
  it('prevents foreign pioneer use, crowded sites and spending a pioneer already committed to an order',()=>{
    const state=setup(),actor=state.players[0]!.playerId;
    state.units.push({id:'pioneer',ownerId:actor,kind:'PIONEER',hexId:state.core.map[1]!.id,recruitedRound:1});
    const command={type:'SETTLE',expectedVersion:state.version,unitId:'pioneer',name:'Travessia'};
    expect(applyAlphaCommand(state,state.players[1]!.playerId,command).ok).toBe(false);
    expect(applyAlphaCommand(state,actor,command).ok).toBe(false);
    state.units[0]!.hexId=state.core.map[2]!.id;
    state.players[0]!.orders=[{id:'explore',type:'EXPLORE',unitId:'pioneer',target:state.core.map[3]!.id,rotation:0}];
    expect(applyAlphaCommand(state,actor,command).ok).toBe(false);
  });
  it('keeps a civilization active after losing its final city and lets a surviving pioneer rebuild',()=>{
    let state=setup();const former=state.players[0]!.playerId,actor=state.players[1]!.playerId,cityId=state.core.players[0]!.civilization.capitalCityId!;
    state.units.push({id:'survivor',ownerId:former,kind:'PIONEER',hexId:state.core.map[2]!.id,recruitedRound:1});
    occupyCity(state,actor,cityId);refreshKnowledge(state);
    expect(state.core.players[0]!.civilization.capitalCityId).toBeNull();expect(state.core.status).toBe('ACTIVE');
    const result=applyAlphaCommand(state,former,{type:'SETTLE',expectedVersion:state.version,unitId:'survivor',name:'Retorno'});
    if(!result.ok)throw new Error(result.error.message);state=result.value;
    expect(state.core.players[0]!.civilization.capitalCityId).toBe(state.core.players[0]!.civilization.cities[0]!.id);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });
});
