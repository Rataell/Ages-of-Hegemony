import { describe, expect, it } from 'vitest';
import { PlayerIdSchema, alphaToLegacyResources, type AlphaState } from '@aoh/game-domain';
import {
  alphaCanAfford, alphaCost, alphaDrain, alphaGainLegacy, alphaPay, applyAlphaCommand, beginAlphaPlanning,
  alphaClaimOptions, createAlphaGame, setAlphaPhase,
} from '@aoh/game-engine';
import { urban } from './alpha-rounds.js';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';

const p1 = PlayerIdSchema.parse('p1');
function setup(): AlphaState { return beginAlphaPlanning(createAlphaGame({ gameId: 'resources-alpha', seed: 41, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] })); }
const pool = (state: AlphaState) => state.players[0]!.resources;
const legacy = (state: AlphaState) => state.core.players[0]!.resources;
const inSync = (state: AlphaState) => state.players.every((p, i) => JSON.stringify(alphaToLegacyResources(p.resources)) === JSON.stringify(state.core.players[i]!.resources));

describe('seven-resource authority', () => {
  it('keeps production after a later purchase', () => {
    const state = setup(); setAlphaPhase(state, 'URBAN_ACTIONS');
    expect(inSync(state)).toBe(true);
    const knowledge = pool(state).knowledge;
    const result = urban(state, p1, 'RESEARCH', { advancementId: 'web-writing' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.players[0]!.resources.knowledge).toBe(knowledge - 2);
    expect(inSync(result.value)).toBe(true);
  });

  it('never invents a metal requirement for generic material costs', () => {
    expect(alphaCost({ food: 0, materials: 8, wealth: 0, knowledge: 0, influence: 0 })).toMatchObject({ wood: 4, stone: 4, metal: 0 });
    const available = { food: 0, wood: 1, stone: 2, metal: 0, wealth: 0, knowledge: 0, influence: 0, culture: 0 };
    const taken = alphaCost({ food: 0, materials: 5, wealth: 0, knowledge: 0, influence: 0 }, available);
    expect(taken.wood + taken.stone + taken.metal).toBe(5);
    expect(taken.stone).toBe(2);
    expect(taken.metal).toBe(0);
  });

  it('pays a generic material cost from stone when wood is exhausted', () => {
    const state = setup();
    Object.assign(pool(state), { wood: 0, stone: 10, metal: 0 });
    const cost = { food: 0, materials: 6, wealth: 0, knowledge: 0, influence: 0 };
    expect(alphaCanAfford(state, p1, cost)).toBe(true);
    alphaPay(state, p1, cost);
    expect(pool(state)).toMatchObject({ wood: 0, stone: 4, metal: 0 });
    expect(legacy(state).materials).toBe(4);
  });

  it('rejects an unaffordable payment without changing anything', () => {
    const state = setup();
    const before = JSON.stringify(state.players[0]!.resources);
    expect(() => alphaPay(state, p1, { food: 999, materials: 0, wealth: 0, knowledge: 0, influence: 0 })).toThrow();
    expect(JSON.stringify(state.players[0]!.resources)).toBe(before);
  });

  it('gains legacy-vocabulary income into wood and stone and keeps the legacy view synced', () => {
    const state = setup();
    const { wood, stone, metal } = pool(state);
    alphaGainLegacy(state, p1, { materials: 3, wealth: 2 });
    expect(pool(state)).toMatchObject({ wood: wood + 2, stone: stone + 1, metal });
    expect(inSync(state)).toBe(true);
  });

  it('drains only what is available and reports what was paid', () => {
    const state = setup();
    Object.assign(pool(state), { wealth: 2, wood: 1, stone: 0, metal: 0 });
    const paid = alphaDrain(state, p1, { food: 0, materials: 5, wealth: 9, knowledge: 0, influence: 0 });
    expect(paid).toMatchObject({ wealth: 2, materials: 1 });
    expect(pool(state)).toMatchObject({ wealth: 0, wood: 0 });
    expect(inSync(state)).toBe(true);
  });

  it('makes management read and charge the seven-resource authority', () => {
    const state = setup();
    const city = state.core.players[0]!.civilization.cities[0]!;
    Object.assign(pool(state), { food: 100, wood: 100, stone: 100, metal: 0, wealth: 100, knowledge: 100, influence: 100 });
    Object.assign(legacy(state), { food: 0, materials: 0, wealth: 0, knowledge: 0, influence: 0 });
    const before = { ...pool(state) };
    const hexId = alphaClaimOptions(state, p1)[city.id]![0]!;
    const result = applyAlphaCommand(state, p1, { type: 'MANAGE', expectedVersion: state.version, command: { type: 'CLAIM_HEX', playerId: p1, cityId: city.id, hexId, expectedVersion: state.core.version } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.players[0]!.resources).not.toEqual(before);
    expect(inSync(result.value)).toBe(true);
  });
});

describe('client projection envelope', () => {
  it('announces the v5 schema', () => {
    const state = setup();
    const view = alphaPlayerView(state, p1)!;
    expect(view.schemaVersion).toBe(5);
    expect(view.costs.founding).toEqual(alphaCost(state.core.config.territory.foundingCost, state.players[0]!.resources));
    expect(view.costs.founding).not.toHaveProperty('materials');
    expect(view.costs.projects['archive-of-horizons']).not.toHaveProperty('materials');
    expect(state.schemaVersion).toBe(5);
  });
});
