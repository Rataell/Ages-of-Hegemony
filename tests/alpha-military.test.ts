import { describe, expect, it } from 'vitest';
import { completeRound, readyAll, urban } from './alpha-rounds.js';
import { AlphaStateSchema, PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createGame, migrateSnapshotV3ToV4, resolveBattle, unitSupply, validateMilitaryOrder } from '@aoh/game-engine';
const p1=PlayerIdSchema.parse('p1'),p2=PlayerIdSchema.parse('p2');
function setup():AlphaState {
  const core=createGame({gameId:'military-alpha',seed:41,players:[{id:p1,name:'Primeiro',resources:{food:30,materials:30,wealth:30,knowledge:0,influence:10}},{id:p2,name:'Segundo'}],
    map:Array.from({length:7},(_,q)=>({id:`${q},0`,q,r:0,terrain:q===6?'SEA':'PLAINS'})),
    initialCities:[{id:'c1',ownerId:p1,hexId:'0,0',name:'Aurora'},{id:'c2',ownerId:p2,hexId:'4,0',name:'Merídia'}]});
  if(!core.ok)throw new Error(core.error.message);const migrated=migrateSnapshotV3ToV4(core.value);if(!migrated.ok)throw new Error(migrated.error.message);
  const state=beginAlphaPlanning(migrated.value);state.players.forEach(p=>p.knownHexIds=state.core.map.map(t=>t.id));state.wars=[[p1,p2]];
  return state;
}
describe('alpha military pieces',()=>{
  it('recruits through an owned city, pays real costs, and requires coastal fleet access',()=>{
    const state=readyAll(setup());const result=urban(state,p1,'RECRUIT',{unit:'INFANTRY'},'c1');
    expect(result.ok).toBe(true);if(!result.ok)return;expect(result.value.units[0]?.kind).toBe('INFANTRY');
    expect(result.value.core.players[0]?.resources.materials).toBe(28);expect(state.units).toHaveLength(0);
    result.value.players[0]!.era='EXPANSION';result.value.cities.find(c=>c.cityId==='c1')!.urbanActionsUsed=0;
    expect(urban(result.value,p1,'RECRUIT',{unit:'FLEET'},'c1').ok).toBe(false);
  });
  it('validates every step of paths and excludes foreign pieces',()=>{
    const state=setup();state.units=[{id:'u1',ownerId:p1,kind:'INFANTRY',hexId:state.core.map[0]!.id,recruitedRound:1}];
    expect(()=>validateMilitaryOrder(state,p1,{id:'move1',type:'MOVE',unitIds:['u1'],path:[state.core.map[1]!.id,state.core.map[2]!.id]})).not.toThrow();
    expect(()=>validateMilitaryOrder(state,p1,{id:'move1',type:'MOVE',unitIds:['u1'],path:[state.core.map[2]!.id]})).toThrow();
    expect(()=>validateMilitaryOrder(state,p2,{id:'move1',type:'MOVE',unitIds:['u1'],path:[state.core.map[1]!.id]})).toThrow();
  });
  it('resolves dice, casualties and retreat reproducibly without mutating an earlier snapshot',()=>{
    const first=setup();first.units=[
      ...Array.from({length:4},(_,i)=>({id:`a${i}`,ownerId:p1,kind:'INFANTRY' as const,hexId:first.core.map[2]!.id,recruitedRound:1})),
      ...Array.from({length:4},(_,i)=>({id:`d${i}`,ownerId:p2,kind:'INFANTRY' as const,hexId:first.core.map[3]!.id,recruitedRound:1})),
    ];
    const second=structuredClone(first);const order={id:'attack1',type:'ATTACK' as const,unitIds:['a0','a1','a2','a3'],target:first.core.map[3]!.id,posture:'ASSAULT' as const};
    resolveBattle(first,p1,order);resolveBattle(second,p1,order);expect(first).toEqual(second);
    const battle=first.battles[0]!;expect(battle.attackDice.every(n=>n>=1&&n<=6)).toBe(true);
    expect(battle.attackTotal).toBe(battle.attackStrength+battle.attackModifiers+battle.attackDice[0]+battle.attackDice[1]);
    expect(battle.losses.length).toBeGreaterThan(0);expect(battle.retreat).not.toBeNull();
    expect(first.units.every(u=>!battle.losses.includes(u.id))).toBe(true);expect(AlphaStateSchema.safeParse(first).success).toBe(true);
  });
  it('explains supply status and rejects illegal unit terrain in snapshots',()=>{
    const state=setup();const unit={id:'u1',ownerId:p1,kind:'INFANTRY' as const,hexId:state.core.map[1]!.id,recruitedRound:1};
    expect(unitSupply(state,unit).supplied).toBe(true);
    expect(unitSupply(state,{...unit,hexId:state.core.map[5]!.id}).supplied).toBe(false);
    expect(AlphaStateSchema.safeParse({...state,units:[{...unit,hexId:state.core.map[6]!.id}]}).success).toBe(false);
  });
  it('edits queued movement and resolves it only after all players are ready',()=>{
    let state=setup();state.units=[{id:'u1',ownerId:p1,kind:'INFANTRY',hexId:state.core.map[0]!.id,recruitedRound:1}];
    const queue=applyAlphaCommand(state,p1,{type:'QUEUE_ORDER',expectedVersion:0,order:{id:'move1',type:'MOVE',unitIds:['u1'],path:['1,0']}});
    if(!queue.ok)throw new Error(queue.error.message);state=queue.value;expect(state.units[0]?.hexId).toBe('0,0');
    state=completeRound(state);
    expect(state.units[0]?.hexId).toBe('1,0');expect(state.core.round).toBe(2);
  });
});
