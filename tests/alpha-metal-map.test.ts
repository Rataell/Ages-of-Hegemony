import { describe, expect, it } from 'vitest';
import { MapPresetSchema, alphaRules } from '@aoh/game-domain';
import { createAlphaGame, hexDistance } from '@aoh/game-engine';

const seeds = [1, 7, 23, 42];
const counts = [2, 3, 4, 5, 6];

describe('metal access on generated maps', () => {
  it('gives every starting city a metal deposit within the configured Alpha distance', () => {
    const limit = alphaRules().balance.metalAccessDistance;
    for (const worldPreset of MapPresetSchema.options) for (const count of counts) for (const seed of seeds) {
      const state = createAlphaGame({ gameId: `metal-${worldPreset}-${count}-${seed}`, seed, preset: 'STANDARD', worldPreset, players: Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` })) });
      const deposits = state.core.map.filter(tile => tile.features.includes('METAL'));
      expect(deposits.length, `${worldPreset} ${count} ${seed}`).toBeGreaterThan(0);
      for (const owner of state.core.players) {
        const capital = state.core.map.find(tile => tile.id === owner.civilization.cities[0]!.hexId)!;
        const nearest = Math.min(...deposits.map(deposit => hexDistance(capital, deposit)));
        expect(nearest, `${worldPreset} ${count} ${seed} ${owner.id}`).toBeLessThanOrEqual(limit);
      }
    }
  });

  it('never turns a starting city into sea under any preset', () => {
    for (const worldPreset of MapPresetSchema.options) for (const seed of seeds) {
      const state = createAlphaGame({ gameId: `land-${worldPreset}-${seed}`, seed, preset: 'STANDARD', worldPreset, players: Array.from({ length: 6 }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` })) });
      for (const owner of state.core.players) {
        const capital = state.core.map.find(tile => tile.id === owner.civilization.cities[0]!.hexId)!;
        expect(capital.terrain).not.toBe('SEA');
      }
    }
  });

  it('reports the sixth homeland as the only start without a deposit in its own region', () => {
    const state = createAlphaGame({ gameId: 'metal-home', seed: 5, preset: 'STANDARD', players: Array.from({ length: 6 }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` })) });
    // The capital stands on an outer hex of its Pátria, so the deposit is looked up in the whole homeland Region.
    const own = state.core.players.map(owner => {
      const region = state.regions.find(candidate => candidate.hexIds.includes(owner.civilization.cities[0]!.hexId))!;
      return region.hexIds.some(id => state.core.map.find(tile => tile.id === id)!.features.includes('METAL'));
    });
    expect(own.filter(has => !has)).toHaveLength(1);
    expect(own[5]).toBe(false);
  });
});
