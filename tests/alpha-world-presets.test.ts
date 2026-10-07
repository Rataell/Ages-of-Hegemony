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
  it('presets are distinct on the same table: sea share ranks CONTINENTAL < MISTO < MAR INTERIOR < ARQUIPÉLAGO', () => {
    const share = Object.fromEntries(PRESETS.map(preset => [preset, SEEDS.reduce((sum, seed) => sum + auditWorld(make(preset, 'STANDARD', 4, seed)).seaShare, 0) / SEEDS.length]));
    expect(share.CONTINENTAL!).toBeLessThan(0.02);
    expect(share.MIXED!).toBeGreaterThan(share.CONTINENTAL!);
    expect(share.INLAND_SEA!).toBeGreaterThan(share.MIXED!);
    expect(share.ARCHIPELAGO!).toBeGreaterThan(0.25);
    expect(share.ARCHIPELAGO!).toBeGreaterThan(share.INLAND_SEA!);
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
          if (preset === 'CONTINENTAL') expect(tiles.some(t => t.terrain === 'SEA' || t.terrain === 'COAST')).toBe(false);
          if (preset === 'INLAND_SEA') region.hexIds.forEach((id, i) => { if (shape.inlandSea.has(id) && !tiles[i]!.features.includes('METAL')) expect(tiles[i]!.terrain).toBe('SEA'); });
        }
      }
    }
  });
});
