import { describe, expect, it } from 'vitest';
import { MAP_FOOTPRINT, REGION_TEMPLATES, templateMetalDeposit, type MapPreset, type MapSize } from '@aoh/game-domain';
import { auditWorld, createAlphaGame, rotatedRegionTiles, worldShape } from '@aoh/game-engine';

const PRESETS: MapPreset[] = ['MIXED', 'CONTINENTAL', 'ARCHIPELAGO', 'INLAND_SEA'];
const SIZES = Object.keys(MAP_FOOTPRINT) as MapSize[];
const SEEDS = Array.from({ length: 12 }, (_, i) => i * 7 + 3);
const make = (preset: MapPreset, size: MapSize, count: number, seed: number) =>
  createAlphaGame({ gameId: 'presets', seed, preset: 'QUICK', worldPreset: preset, mapSize: size, players: Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` })) });
const cases = PRESETS.flatMap(preset => SIZES.flatMap(size => [2, 4, 6].filter(n => n <= MAP_FOOTPRINT[size].maxPlayers).map(n => [preset, size, n] as const)));

describe('world presets: structural guarantees (size × preset × 2/4/6 players)', () => {
  it.each(cases)('%s %s %i players: no doomed player, metal within two Regions, board whole', (preset, size, count) => {
    for (const seed of SEEDS) {
      const state = make(preset, size, count, seed), audit = auditWorld(state);
      expect(audit.regions).toBe(MAP_FOOTPRINT[size].regions);
      expect(audit.hexes).toBe(MAP_FOOTPRINT[size].hexes);
      expect(audit.issues, `${preset} ${size} ${count}p seed ${seed}`).toEqual([]);
      for (const patria of audit.patrias) expect(patria.metalRegionDistance!).toBeLessThanOrEqual(2);
      if (preset === 'CONTINENTAL') expect(audit.patrias.every(p => p.landLinked)).toBe(true);
      if (preset === 'INLAND_SEA') expect(audit.largestSea, `seed ${seed}`).toBeGreaterThanOrEqual(12);
    }
  });
  const mean = (preset: MapPreset, pick: (a: ReturnType<typeof auditWorld>) => number, size: MapSize = 'STANDARD', count = 4) => SEEDS.reduce((sum, seed) => sum + pick(auditWorld(make(preset, size, count, seed))), 0) / SEEDS.length;
  const landShare = (a: ReturnType<typeof auditWorld>) => a.landComponents[0]! / a.landComponents.reduce((x, y) => x + y, 0);
  it('presets are distinct on the same table, each by its own structure', () => {
    // CONTINENTAL: one great land mass inside a real ocean border.
    expect(mean('CONTINENTAL', landShare)).toBeGreaterThan(0.95);
    expect(mean('CONTINENTAL', a => a.largestSea)).toBeGreaterThanOrEqual(8);
    // MISTO: one land mass with only the small bays and lakes of the templates.
    expect(mean('MIXED', landShare)).toBeGreaterThan(0.95);
    expect(mean('MIXED', a => a.largestSea)).toBeLessThan(6);
    // MAR INTERIOR: a real connected central sea.
    expect(mean('INLAND_SEA', a => a.largestSea)).toBeGreaterThanOrEqual(14);
    // ARQUIPÉLAGO: several islands, no dominant mainland, lots of water.
    expect(mean('ARCHIPELAGO', landShare)).toBeLessThan(0.8);
    expect(mean('ARCHIPELAGO', a => a.landComponents.length)).toBeGreaterThanOrEqual(3);
    expect(mean('ARCHIPELAGO', a => a.seaShare)).toBeGreaterThan(0.18);
    expect(mean('MIXED', a => a.seaShare)).toBeLessThan(0.1);
  });
  it('CONTINENTAL keeps a functional coast: ocean along the rim, no coast hex inland without water', () => {
    for (const seed of SEEDS) {
      const state = make('CONTINENTAL', 'STANDARD', 4, seed), shape = worldShape('CONTINENTAL', seed, state.regions, 4), tiles = new Map(state.core.map.map(t => [t.id as string, t]));
      const owner = new Map(state.regions.flatMap(r => r.hexIds.map(id => [id as string, r.id] as const)));
      for (const t of state.core.map) if (t.terrain === 'SEA' && !shape.active.has(owner.get(t.id)!)) expect(shape.rim.has(t.id) || shape.nearRim.has(t.id), `${seed} ${t.id}`).toBe(true);
      const coast = state.core.map.filter(t => t.terrain === 'COAST' && !shape.active.has(owner.get(t.id)!));
      const wet = coast.filter(t => t.terrain === 'COAST' && [...shape.rim].some(id => tiles.get(id)!.terrain === 'SEA' && Math.abs(tiles.get(id)!.q - t.q) <= 2 && Math.abs(tiles.get(id)!.r - t.r) <= 2));
      expect(wet.length).toBe(coast.length);
    }
  });
  it('ARQUIPÉLAGO has no artificial land corridor: Pátrias are often apart by land, yet every one reaches the water', () => {
    const linked = SEEDS.map(seed => auditWorld(make('ARCHIPELAGO', 'WIDE', 2, seed)).patrias.every(p => p.landLinked));
    expect(linked.some(x => !x)).toBe(true);
    for (const seed of SEEDS) for (const patria of auditWorld(make('ARCHIPELAGO', 'WIDE', 2, seed)).patrias) expect(patria.waterEdge || patria.landLinked).toBe(true);
  });
  it('turning a hidden Region (all six rotations) never undoes the preset and never loses the metal deposit', () => {
    for (const preset of ['CONTINENTAL', 'INLAND_SEA', 'ARCHIPELAGO'] as const) {
      const state = make(preset, 'STANDARD', 4, 9), shape = worldShape(preset, state.telemetry.seed, state.regions, state.players.length);
      for (const region of state.regions.filter(r => !shape.active.has(r.id))) {
        const template = REGION_TEMPLATES.find(t => t.id === region.templateId)!, hasDeposit = templateMetalDeposit(template) !== null;
        for (let rotation = 0; rotation < 6; rotation++) {
          const tiles = rotatedRegionTiles(state, region, rotation);
          expect(tiles.filter(t => t.features.includes('METAL')).length, `${preset} ${region.id} r${rotation}`).toBe(hasDeposit ? 1 : 0);
          
          if (preset === 'CONTINENTAL') tiles.forEach((t, i) => { if (t.terrain === 'SEA') expect(shape.rim.has(region.hexIds[i]!) || shape.nearRim.has(region.hexIds[i]!), `${region.id} r${rotation}`).toBe(true); });
          if (preset === 'ARCHIPELAGO') region.hexIds.forEach((id, i) => { if (shape.straits.has(id) && !tiles[i]!.features.includes('METAL')) expect(tiles[i]!.terrain).toBe('SEA'); });
          if (preset === 'INLAND_SEA') region.hexIds.forEach((id, i) => { if (shape.inlandSea.has(id) && !tiles[i]!.features.includes('METAL')) expect(tiles[i]!.terrain).toBe('SEA'); });
        }
      }
    }
  });
});
