import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, hexDistance, raidBandView, resolveRaidBands } from '@aoh/game-engine';

const p1 = PlayerIdSchema.parse('p1');

function setup(): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'raid-test', seed: 173, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));
  state.players[0]!.knownHexIds = state.core.map.map(tile => tile.id);
  return state;
}

describe('raid bands', () => {
  it('moves each band once toward the nearest weak target with deterministic replay', () => {
    const state = setup(), capital = state.core.players[0]!.civilization.cities[0]!, center = state.core.map.find(tile => tile.id === capital.hexId)!;
    const origin = state.core.map.filter(tile => !['SEA', 'UNKNOWN'].includes(tile.terrain) && hexDistance(center, tile) === 3).sort((a, b) => a.id.localeCompare(b.id))[0]!;
    state.units = [];
    state.raidBands = [{ id: 'raid-a', hexId: origin.id, strength: 10, lastMovedRound: 0 }];
    const replay = structuredClone(state);
    resolveRaidBands(state); resolveRaidBands(replay);
    expect(state).toEqual(replay);
    expect(hexDistance(state.core.map.find(tile => tile.id === state.raidBands[0]!.hexId)!, center)).toBeLessThan(3);
    expect(state.raidBands[0]!.lastMovedRound).toBe(state.core.round);
    const once = state.raidBands[0]!.hexId; resolveRaidBands(state);
    expect(state.raidBands[0]!.hexId).toBe(once);
  });

  it('attacks an exposed target on contact, removing one weak piece and damaging its city', () => {
    const state = setup(), capital = state.core.players[0]!.civilization.cities[0]!;
    state.units = [{ id: 'victim', ownerId: p1, kind: 'INFANTRY', hexId: capital.hexId, recruitedRound: 1 }];
    state.raidBands = [{ id: 'raid-a', hexId: capital.hexId, strength: 10, lastMovedRound: 0 }];
    const stability = capital.stability;
    resolveRaidBands(state);
    expect(state.units).toHaveLength(0);
    expect(capital.stability).toBe(stability - 10);
    expect(state.events.at(-1)).toMatchObject({ type: 'RAID_ATTACK', audience: [p1] });
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('projects only raid bands on known hexes', () => {
    const state = setup();
    state.players[0]!.knownHexIds = [state.raidBands[0]!.hexId];
    expect(raidBandView(state, p1).map(band => band.id)).toEqual([state.raidBands[0]!.id]);
  });
});
