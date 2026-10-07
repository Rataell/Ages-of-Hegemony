import { describe, expect, it } from 'vitest';
import { PlayerIdSchema, REGION_TEMPLATES, rotatedTemplateIndex, templateMetalDeposit } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, exploreRegion, hexDistance, hexId, hexNeighbors, regionOrientationFixed, rotatedRegionTiles, serializeAlphaState } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
function setup(count=2) {return beginAlphaPlanning(createAlphaGame({gameId:'world-alpha',seed:23,preset:'QUICK',players:Array.from({length:count},(_,i)=>({id:`p${i+1}`,name:`Pessoa ${i+1}`}))}));}
describe('modular regions and fog of war',()=>{
  it('contains forty-three original authored templates and reproducible seeded layouts',()=>{
    expect(REGION_TEMPLATES.filter(r=>r.kind==='HOMELAND')).toHaveLength(6);
    expect(REGION_TEMPLATES.filter(r=>r.kind==='FRONTIER')).toHaveLength(37);
    expect(new Set(REGION_TEMPLATES.map(r=>r.id)).size).toBe(43);
    expect(serializeAlphaState(setup())).toBe(serializeAlphaState(setup()));
  });
  it.each([2,4,6])('supports %i players on a 210-hex modular board: Pátrias open, frontier closed',count=>{
    const state=setup(count);expect(state.core.map).toHaveLength(210);
    const view=alphaPlayerView(state,PlayerIdSchema.parse('p1'))!;
    // Every Pátria is open and public from the first snapshot; the frontier is closed and carries no terrain.
    expect(view.view.visibleTerritory).toHaveLength(7*count);expect(view.view.visibleCities).toHaveLength(count-1);
    expect(view.board.filter(region=>!region.closed)).toHaveLength(count);expect(view.board.filter(region=>region.closed)).toHaveLength(30-count);
    for(const city of view.view.visibleCities)expect(city.population).toBeNull();
    expect(view).not.toHaveProperty('core');expect(view).not.toHaveProperty('seed');expect(view).not.toHaveProperty('rng');
    expect(view.players[1]).not.toHaveProperty('hand');expect(view.players[1]).not.toHaveProperty('orders');
  });
  it.each([2,4,6])('keeps %i-player homelands within QUICK contact range',count=>{
    const state=setup(count),capitals=state.core.players.map(player=>state.core.map.find(tile=>tile.id===player.civilization.cities[0]!.hexId)!);
    for(const [index,capital] of capitals.entries()){
      const nearest=Math.min(...capitals.filter((_,other)=>other!==index).map(other=>hexDistance(capital,other)));
      expect(nearest).toBeLessThanOrEqual(10);
    }
  });
  it('a Region revealed by anyone is revealed for the whole table, immediately, and never hides again',()=>{
    const state=setup();const actor=state.players[0]!.playerId,other=state.players[1]!.playerId;
    const before=alphaPlayerView(state,actor)!,closed=before.board.find(region=>region.closed&&region.homeOf===null)!,target=closed.hexIds[1]!;
    const peek=alphaPlayerView(state,other)!;
    expect(peek.board.find(region=>region.id===closed.id)!.closed).toBe(true);
    expect(peek.view.visibleTerritory.some(tile=>tile.id===target)).toBe(false);
    const region=state.regions.find(candidate=>candidate.id===closed.id)!,targetTile=state.core.map.find(tile=>tile.id===target)!;
    state.units[0]!.hexId=state.core.map.find(tile=>!region.hexIds.includes(tile.id)&&hexDistance(tile,targetTile)<=1)!.id;
    exploreRegion(state,actor,{type:'EXPLORE',id:'explore1',unitId:state.units[0]!.id,target,rotation:0});
    expect(state.players[0]!.exploredRegions).toBe(1);expect(state.players[0]!.prestige).toBe(1);
    for(const viewer of [actor,other]){
      const view=alphaPlayerView(state,viewer)!;
      expect(view.board.find(candidate=>candidate.id===closed.id)!.closed,String(viewer)).toBe(false);
      for(const id of region.hexIds){const tile=view.view.visibleTerritory.find(candidate=>candidate.id===id);expect(tile,id).toBeDefined();expect(tile!.terrain).not.toBe('UNKNOWN');}
      expect(view.regions.some(candidate=>candidate.id===closed.id)).toBe(true);
    }
    // The table knows the terrain; only the discoverer reads what the discovery held.
    expect(state.players[1]!.knownHexIds).toContain(target);
    expect(alphaPlayerView(state,other)!.regions.find(candidate=>candidate.id===closed.id)!.discovery).toBeNull();
  });
  it('an already open Region is not revealed twice: a later order only notes it',()=>{
    const state=setup(),actor=state.players[0]!.playerId,other=state.players[1]!.playerId;
    const closed=alphaPlayerView(state,actor)!.board.find(region=>region.closed&&region.homeOf===null)!,region=state.regions.find(candidate=>candidate.id===closed.id)!;
    const targetTile=state.core.map.find(tile=>tile.id===region.hexIds[1])!;
    const near=state.core.map.filter(tile=>!region.hexIds.includes(tile.id)&&!['SEA','MOUNTAINS'].includes(tile.terrain)&&!state.units.some(u=>u.hexId===tile.id)&&hexDistance(tile,targetTile)<=1);const unit=state.units.find(candidate=>candidate.ownerId===actor)!;unit.hexId=near[0]!.id;
    exploreRegion(state,actor,{type:'EXPLORE',id:'first',unitId:unit.id,target:region.hexIds[1]!,rotation:0});
    const rival=state.units.find(candidate=>candidate.ownerId===other)!;rival.hexId=near[1]!.id;
    const prestige=state.players[1]!.prestige,rotation=region.rotation;
    // Planned in secret and resolved in turn: the second order finds the Region already on the table and only says so.
    expect(()=>exploreRegion(state,other,{type:'EXPLORE',id:'second',unitId:rival.id,target:region.hexIds[1]!,rotation:3})).not.toThrow();
    expect(region.revealedBy).toEqual([actor]);expect(region.rotation).toBe(rotation);expect(state.players[1]!.prestige).toBe(prestige);
    expect(state.events.some(event=>event.type==='REGION_ALREADY_OPEN'&&event.audience?.includes(other))).toBe(true);
  });
  it.each([0,1,2,3,4,5])('turns terrain and the metal deposit together under rotation %i, deterministically',rotation=>{
    const state=setup();
    // Untouched regions only: preset and corridor overrides stay in place by design.
    const regions=state.regions.filter(region=>{const template=REGION_TEMPLATES.find(t=>t.id===region.templateId)!;
      return !regionOrientationFixed(state,region)&&region.hexIds.every((id,i)=>state.core.map.find(t=>t.id===id)!.terrain===template.terrain[i]);});
    expect(regions.filter(region=>templateMetalDeposit(REGION_TEMPLATES.find(t=>t.id===region.templateId)!)!==null).length).toBeGreaterThan(0);
    for(const region of regions){
      const template=REGION_TEMPLATES.find(t=>t.id===region.templateId)!,deposit=templateMetalDeposit(template);
      const tiles=rotatedRegionTiles(state,region,rotation);
      tiles.forEach((tile,i)=>{
        const source=rotatedTemplateIndex(i,rotation);
        expect(tile.terrain).toBe(template.terrain[source]);
        expect(tile.features.includes('METAL')).toBe(source===deposit);
      });
      expect(tiles.filter(tile=>tile.features.includes('METAL'))).toHaveLength(deposit===null?0:1);
      expect(rotatedRegionTiles(state,region,rotation)).toEqual(tiles);
    }
  });
  it('applies the rotated deposit when a region is explored with a turn',()=>{
    // Find an edge hex from which every observed region hex keeps its content under some turn that moves the deposit.
    const base=setup(),actor=base.players[0]!.playerId;
    let found=false;
    for(const region of base.regions){
      const template=REGION_TEMPLATES.find(t=>t.id===region.templateId)!,deposit=templateMetalDeposit(template);
      if(deposit===null||regionOrientationFixed(base,region)||region.hexIds.some((id,i)=>base.core.map.find(t=>t.id===id)!.terrain!==template.terrain[i]))continue;
      for(const rotation of [1,2,3,4,5]){
        const tiles=rotatedRegionTiles(base,region,rotation);
        const moved=tiles.findIndex(tile=>tile.features.includes('METAL'));
        if(moved===deposit)continue;
        for(const edge of base.core.map.filter(t=>!region.hexIds.includes(t.id))){
          const state=structuredClone(base);
          state.units[0]!.hexId=edge.id;
          for(const player of state.players)player.knownHexIds=player.knownHexIds.filter(id=>!region.hexIds.includes(id));
          try{exploreRegion(state,actor,{type:'EXPLORE',id:'turn',unitId:state.units[0]!.id,target:region.hexIds[1]!,rotation});}catch{continue;}
          expect(state.regions.find(r=>r.id===region.id)!.rotation).toBe(rotation);
          region.hexIds.forEach((id,i)=>{const tile=state.core.map.find(t=>t.id===id)!;expect(tile.terrain).toBe(tiles[i]!.terrain);expect(tile.features).toEqual(tiles[i]!.features);});
          expect(state.core.map.find(t=>t.id===region.hexIds[moved])!.features).toContain('METAL');
          found=true;break;
        }
        if(found)break;
      }
      if(found)break;
    }
    expect(found).toBe(true);
    // A brute-force search over edges; authored features make more turns illegal, so give it room under a parallel run.
  }, 20000);
});
