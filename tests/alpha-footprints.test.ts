import { describe, expect, it } from 'vitest';
import { MAP_FOOTPRINT, REGION_TEMPLATES, layoutBoard, mapSizeAllows, recommendedMapSize, rotatedRegionContent, featureFits, type MapSize } from '@aoh/game-domain';
import { createAlphaGame } from '@aoh/game-engine';

const SIZES = Object.keys(MAP_FOOTPRINT) as MapSize[];
const players = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `Pessoa ${i + 1}` }));

describe('map footprints (Compacto 24 / Padrão 30 / Amplo 43)', () => {
  it('keeps the contract of the three footprints', () => {
    expect(SIZES.map(size => MAP_FOOTPRINT[size].regions)).toEqual([24, 30, 43]);
    expect(SIZES.map(size => MAP_FOOTPRINT[size].hexes)).toEqual([168, 210, 301]);
    expect([2, 3, 4, 5, 6].map(recommendedMapSize)).toEqual(['COMPACT', 'STANDARD', 'STANDARD', 'WIDE', 'WIDE']);
    expect(mapSizeAllows('COMPACT', 5)).toBe(false);
    expect(mapSizeAllows('COMPACT', 4)).toBe(true);
  });
  it.each(SIZES)('%s: contiguous lattice, every Region has seven distinct hexes, six homelands', size => {
    for (const count of [2, 4, MAP_FOOTPRINT[size].maxPlayers]) {
      const board = layoutBoard(count, 11, size);
      expect(board.cells).toHaveLength(MAP_FOOTPRINT[size].regions);
      const hexes = board.cells.flatMap(cell => cell.hexes.map(h => `${h.q},${h.r}`));
      expect(new Set(hexes).size).toBe(MAP_FOOTPRINT[size].hexes);
      expect(new Set(board.homeSlots).size).toBe(6);
      const reach = new Set([board.cells[0]!.id]), queue = [board.cells[0]!.id];
      for (const id of queue) for (const next of board.cells.find(c => c.id === id)!.neighbors) if (!reach.has(next)) { reach.add(next); queue.push(next); }
      expect(reach.size).toBe(board.cells.length);
    }
  });
  it('every authored template is valid under all six rotations', () => {
    expect(REGION_TEMPLATES).toHaveLength(43);
    for (const template of REGION_TEMPLATES) {
      expect(template.terrain).toHaveLength(7);
      expect(template.terrain[0]).toBe('PLAINS');
      expect(template.terrain.some(t => t !== 'SEA')).toBe(true);
      for (let rotation = 0; rotation < 6; rotation++) {
        const content = rotatedRegionContent(template, rotation);
        expect(content.filter(c => c.deposit).length).toBeLessThanOrEqual(1);
        for (const hex of content) if (hex.feature) expect(featureFits(hex.feature, hex.terrain)).toBe(true);
      }
    }
  });
  it.each(SIZES)('%s: createAlphaGame builds exactly the footprint, deterministic by seed', size => {
    for (const count of [2, MAP_FOOTPRINT[size].maxPlayers]) {
      const a = createAlphaGame({ gameId: 'fp', seed: 5, preset: 'QUICK', mapSize: size, players: players(count) });
      const b = createAlphaGame({ gameId: 'fp', seed: 5, preset: 'QUICK', mapSize: size, players: players(count) });
      expect(a.regions).toHaveLength(MAP_FOOTPRINT[size].regions);
      expect(a.core.map).toHaveLength(MAP_FOOTPRINT[size].hexes);
      expect(a.rules.mapSize).toBe(size);
      expect(JSON.stringify(a.regions)).toBe(JSON.stringify(b.regions));
      expect(new Set(a.regions.map(r => r.templateId)).size).toBe(a.regions.length);
    }
  });
  it('Padrão keeps the pre-footprint map for a given seed (default size is STANDARD)', () => {
    const implicit = createAlphaGame({ gameId: 'fp', seed: 5, preset: 'QUICK', players: players(4) });
    const explicit = createAlphaGame({ gameId: 'fp', seed: 5, preset: 'QUICK', mapSize: 'STANDARD', players: players(4) });
    expect(JSON.stringify(implicit.regions)).toBe(JSON.stringify(explicit.regions));
    expect(implicit.regions).toHaveLength(30);
  });
});
