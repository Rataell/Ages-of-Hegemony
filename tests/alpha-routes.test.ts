import { describe, expect, it } from 'vitest';
import { type AlphaState } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, establishRoute, maintainTrade } from '@aoh/game-engine';

/** Two civilizations that know the whole map, with an active trade agreement and one international route. */
function setup(): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'routes', seed: 11, preset: 'QUICK', worldPreset: 'CONTINENTAL', players: [{ id: 'p1', name: 'Ana' }, { id: 'p2', name: 'Beto' }] }));
  for (const player of state.players) player.knownHexIds = state.core.map.map(tile => tile.id) as never;
  state.treaties.push({ id: 'treaty-trade', proposerId: 'p1' as never, recipientId: 'p2' as never, type: 'TRADE_AGREEMENT', status: 'ACTIVE', deal: { give: { food: 0, wood: 0, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0 }, receive: { food: 0, wood: 0, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0 } }, createdRound: 1, expiresRound: 9 });
  const [from, to] = state.core.players.map(player => player.civilization.cities[0]!.id);
  establishRoute(state, 'p1' as never, { id: 'route', type: 'TRADE', fromCityId: from!, toCityId: to! });
  return state;
}

describe('trade routes under war and capture', () => {
  it('suspends a route while its parties are at war and restores it at peace', () => {
    const state = setup();
    expect(state.routes[0]!.suspended).toBe(false);
    state.wars.push(['p1', 'p2'] as never);
    maintainTrade(state);
    expect(state.routes[0]!.suspended).toBe(true);
    state.wars = [];
    maintainTrade(state);
    expect(state.routes[0]!.suspended).toBe(false);
  });

  it('suspends a route whose origin city was captured', () => {
    const state = setup();
    const [ana, beto] = state.core.players;
    const city = ana!.civilization.cities[0]!;
    ana!.civilization.cities = []; beto!.civilization.cities.push({ ...city, ownerId: beto!.id });
    maintainTrade(state);
    expect(state.routes[0]!.suspended).toBe(true);
  });
});
