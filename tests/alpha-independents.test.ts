import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, PlayerIdSchema, type AlphaCommand, type AlphaState } from '@aoh/game-domain';
import { INDEPENDENT_RULES, applyAlphaCommand, beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';

const p1 = PlayerIdSchema.parse('p1');

function setup(): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({
    gameId: 'independent-actions', seed: 141, preset: 'STANDARD',
    players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }, { id: 'p3', name: 'Três' }],
  }));
  state.players[0]!.knownHexIds = state.core.map.map(tile => tile.id);
  Object.assign(state.players[0]!.resources, { food: 20, wood: 20, stone: 20, metal: 5, wealth: 20, knowledge: 20, influence: 20 });
  return state;
}

function act(state: AlphaState, peopleId: string, action: Extract<AlphaCommand, { type: 'INDEPENDENT_ACTION' }>['action']): AlphaState {
  const result = applyAlphaCommand(state, p1, { type: 'INDEPENDENT_ACTION', expectedVersion: state.version, peopleId, action });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

describe('independent peoples', () => {
  it('keeps unknown peoples out of the projection and rejects blind actions', () => {
    const state = setup(), people = state.independents[0]!;
    state.players[0]!.knownHexIds = [];
    expect(alphaPlayerView(state, p1)!.independents).toEqual([]);
    expect(applyAlphaCommand(state, p1, { type: 'INDEPENDENT_ACTION', expectedVersion: state.version, peopleId: people.id, action: 'TRADE' })).toMatchObject({ ok: false });
  });

  it('trades atomically at the configured cost and exposes only the viewer influence', () => {
    const state = setup(), people = state.independents[0]!;
    people.influenceByPlayer[state.players[1]!.playerId] = 9;
    const wealth = state.players[0]!.resources.wealth, food = state.players[0]!.resources.food;
    const after = act(state, people.id, 'TRADE');
    expect(after.players[0]!.resources.wealth).toBe(wealth - INDEPENDENT_RULES.tradeCost.wealth);
    expect(after.players[0]!.resources.food).toBe(food + INDEPENDENT_RULES.tradeGain.food);
    const view = alphaPlayerView(after, p1)!.independents.find(entry => entry.id === people.id)!;
    expect(view.yourInfluence).toBe(0);
    expect(view).not.toHaveProperty('influenceByPlayer');
  });

  it('negotiates, influences, protects and integrates a friendly people into a valid city', () => {
    let state = setup(); const peopleId = state.independents[0]!.id;
    state = act(state, peopleId, 'NEGOTIATE');
    expect(state.independents[0]!.attitude).toBe('FRIENDLY');
    for (let index = 0; index < INDEPENDENT_RULES.integrateInfluence; index++) state = act(state, peopleId, 'INFLUENCE');
    state = act(state, peopleId, 'PROTECT');
    expect(state.independents[0]!.protectorId).toBe(p1);
    state = act(state, peopleId, 'INTEGRATE');
    const people = state.independents[0]!;
    const founded = state.core.players[0]!.civilization.cities.find(city => city.hexId === people.hexId)!;
    expect(people.integratedBy).toBe(p1);
    expect(state.cities.find(city => city.cityId === founded.id)).toMatchObject({ currentOwnerId: p1, status: 'OWNED', integration: 100 });
    expect(state.core.map.find(tile => tile.id === people.hexId)).toMatchObject({ ownerId: p1, controllerCityId: founded.id });
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('requires local military strength to conquer and records a harsher settlement', () => {
    let state = setup(); const people = state.independents[1]!;
    expect(applyAlphaCommand(state, p1, { type: 'INDEPENDENT_ACTION', expectedVersion: state.version, peopleId: people.id, action: 'CONQUER' })).toMatchObject({ ok: false });
    state.units.push(
      { id: 'army-1', ownerId: p1, kind: 'GUARD', hexId: people.hexId, recruitedRound: 1 },
      { id: 'army-2', ownerId: p1, kind: 'INFANTRY', hexId: people.hexId, recruitedRound: 1 },
    );
    state = act(state, people.id, 'CONQUER');
    const founded = state.cities.find(city => city.nativeIdentity === people.id)!;
    expect(founded).toMatchObject({ currentOwnerId: p1, mood: 1, localCohesion: 30 });
    expect(state.independents[1]!.integratedBy).toBe(p1);
  });

  it('refuses hostile trade, influence and premature integration without mutating input', () => {
    const state = setup(), people = state.independents[0]!;
    people.attitude = 'HOSTILE';
    for (const action of ['TRADE', 'INFLUENCE', 'INTEGRATE'] as const) {
      const before = JSON.stringify(state);
      expect(applyAlphaCommand(state, p1, { type: 'INDEPENDENT_ACTION', expectedVersion: state.version, peopleId: people.id, action }).ok).toBe(false);
      expect(JSON.stringify(state)).toBe(before);
    }
  });
});
