import { describe, expect, it } from 'vitest';
import { PlayerIdSchema, REGION_TEMPLATES } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, exploreRegion, hexDistance, hexId, hexNeighbors, serializeAlphaState } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
function setup(count=2) {return beginAlphaPlanning(createAlphaGame({gameId:'world-alpha',seed:23,preset:'QUICK',players:Array.from({length:count},(_,i)=>({id:`p${i+1}`,name:`Pessoa ${i+1}`}))}));}
describe('modular regions and fog of war',()=>{
  it('contains thirty original authored templates and reproducible seeded layouts',()=>{
    expect(REGION_TEMPLATES.filter(r=>r.kind==='HOMELAND')).toHaveLength(6);
    expect(REGION_TEMPLATES.filter(r=>r.kind==='FRONTIER')).toHaveLength(24);
    expect(new Set(REGION_TEMPLATES.map(r=>r.id)).size).toBe(30);
    expect(serializeAlphaState(setup())).toBe(serializeAlphaState(setup()));
  });
  it.each([2,4,6])('supports %i players on a 210-hex modular board without sending it to every client',count=>{
    const state=setup(count);expect(state.core.map).toHaveLength(210);
    const view=alphaPlayerView(state,PlayerIdSchema.parse('p1'))!;
    expect(view.view.visibleTerritory).toHaveLength(7);expect(view.view.visibleCities).toHaveLength(0);
    expect(view).not.toHaveProperty('core');expect(view).not.toHaveProperty('seed');expect(view).not.toHaveProperty('rng');
    expect(view.players[1]).not.toHaveProperty('hand');expect(view.players[1]).not.toHaveProperty('orders');
  });
  it.each([2,4,6])('keeps %i-player homelands within QUICK contact range',count=>{
    const state=setup(count),capitals=state.core.players.map(player=>state.core.map.find(tile=>tile.id===player.civilization.cities[0]!.hexId)!);
    for(const [index,capital] of capitals.entries()){
      const nearest=Math.min(...capitals.filter((_,other)=>other!==index).map(other=>hexDistance(capital,other)));
      expect(nearest).toBeLessThanOrEqual(9);
    }
  });
  it.each([2,4,6])('keeps all %i-player capitals connected by land across Alpha world presets',count=>{
    for(const worldPreset of ['MIXED','INLAND_SEA','ARCHIPELAGO'] as const)for(const seed of [23,42]){
      const state=beginAlphaPlanning(createAlphaGame({gameId:`corridor-${count}-${worldPreset}-${seed}`,seed,preset:'QUICK',worldPreset,players:Array.from({length:count},(_,i)=>({id:`p${i+1}`,name:`Pessoa ${i+1}`}))}));
      const actor=state.players[0]!.playerId,unit=state.units.find(candidate=>candidate.ownerId===actor)!;
      for(const region of state.regions.filter(candidate=>!candidate.revealedBy.includes(actor))){const edge=state.core.map.find(tile=>!region.hexIds.includes(tile.id)&&region.hexIds.some(id=>hexDistance(tile,state.core.map.find(candidate=>candidate.id===id)!)===1));expect(edge).toBeDefined();unit.hexId=edge!.id;exploreRegion(state,actor,{type:'EXPLORE',id:`reveal-${region.id}`,unitId:unit.id,target:region.hexIds[0]!,rotation:0});}
      const capitals=state.core.players.map(player=>player.civilization.cities[0]!.hexId),byId=new Map(state.core.map.map(tile=>[tile.id,tile]));
      const seen=new Set<string>(),queue=[capitals[0]!];
      for(let i=0;i<queue.length;i++){const id=queue[i]!;if(seen.has(id))continue;seen.add(id);const tile=byId.get(id)!;for(const point of hexNeighbors(tile)){const next=byId.get(hexId(point));if(next&&!seen.has(next.id)&&!['SEA','UNKNOWN'].includes(next.terrain))queue.push(next.id);}}
      expect(capitals.every(id=>seen.has(id)),`${worldPreset} seed ${seed}`).toBe(true);
    }
  });
  it('reveals a frontier region to the explorer only and preserves unknown terrain secrecy',()=>{
    const state=setup();const actor=state.players[0]!.playerId;
    const before=alphaPlayerView(state,actor)!,target=before.frontier[0]!.id;
    expect(before.frontier.find(t=>t.id===target)).not.toHaveProperty('terrain');
    const region=state.regions.find(candidate=>candidate.hexIds.includes(target))!,targetTile=state.core.map.find(tile=>tile.id===target)!;
    state.units[0]!.hexId=state.core.map.find(tile=>!region.hexIds.includes(tile.id)&&hexDistance(tile,targetTile)<=1)!.id;
    exploreRegion(state,actor,{type:'EXPLORE',id:'explore1',unitId:state.units[0]!.id,target,rotation:0});
    expect(state.players[0]!.exploredRegions).toBe(1);expect(state.players[0]!.prestige).toBe(1);
    expect(state.players[1]!.knownHexIds).not.toContain(target);
    const after=alphaPlayerView(state,actor)!;expect(after.knownTerritory.length).toBeGreaterThan(0);
    expect(after.knownTerritory[0]).not.toHaveProperty('ownerId');
  });
  it('never rotates previously observed terrain, even before the full region is explored',()=>{
    const state=setup(),actor=state.players[0]!.playerId;
    const region=state.regions.find(r=>r.id==='region-1-0')!;
    const template=REGION_TEMPLATES.find(t=>t.id===region.templateId)!;
    const rotation=[1,2,3,4,5].find(rotation=>template.terrain[1]!==template.terrain[1+rotation])!;
    expect(rotation).toBeDefined();
    const observed=region.hexIds[1]!;
    state.players[1]!.knownHexIds.push(observed);
    state.units[0]!.hexId=state.core.map.find(t=>t.id==='1,0')!.id;
    const before=serializeAlphaState(state);
    expect(()=>exploreRegion(state,actor,{type:'EXPLORE',id:'rotate-known',unitId:state.units[0]!.id,target:region.hexIds[0]!,rotation})).toThrow('terrenos já conhecidos');
    expect(serializeAlphaState(state)).toBe(before);
  });
});
