import { describe, expect, it } from 'vitest';
import { GameStateSchema, createDefaultRules } from '@aoh/game-domain';
import { advancePhase, clampStability, deriveCityProduction, stabilityCategory } from '@aoh/game-engine';
import { deepFreeze } from './helpers.js';
import { cityGame, cycle, firstCity, firstPlayer, maintain, workers } from './civilization-helpers.js';

describe('food and population maintenance', () => {
  it('produces first, pays exactly population consumption and accumulates net surplus', () => {
    const state = cityGame(); const after = maintain(state);
    expect(firstPlayer(after).resources.food).toBe(22);
    expect(firstCity(after).growthProgress).toBe(2);
    expect(after.eventLog).toContainEqual(expect.objectContaining({ type: 'FOOD_CONSUMED', amount: 2 }));
    expect(after.eventLog).toContainEqual(expect.objectContaining({ type: 'RESOURCES_PRODUCED', resources: expect.objectContaining({ food: 4 }) }));
  });
  it('grows at threshold and puts new population in unassigned', () => {
    const state = cityGame(); firstCity(state).growthProgress = 8;
    const after = maintain(state);
    expect(firstCity(after)).toMatchObject({ population: 3, growthProgress: 0, workers: { producers: 2, unassigned: 1 } });
    expect(firstPlayer(after).resources.food).toBe(22); // newborn consumes next maintenance
    expect(after.eventLog).toContainEqual(expect.objectContaining({ type: 'POPULATION_GROWN', amount: 1, population: 3 }));
  });
  it('never grows past development cap and banks at most one threshold', () => {
    const state = cityGame(); const city = firstCity(state);
    city.population = 3; city.workers = workers(3); city.growthProgress = 10;
    let after = maintain(state);
    for (let i = 0; i < 10; i += 1) after = cycle(after);
    expect(firstCity(after)).toMatchObject({ population: 3, growthProgress: 10 });
    expect(GameStateSchema.safeParse(after).success).toBe(true);
  });
  it('pays available food, emits shortage, reduces stability and blocks banked growth without deaths', () => {
    const state = cityGame(); const player = firstPlayer(state); const city = firstCity(state);
    player.resources.food = 1; city.workers = workers(0, 2); city.growthProgress = 10;
    const after = maintain(state);
    expect(firstPlayer(after).resources.food).toBe(0);
    expect(firstCity(after)).toMatchObject({ population: 2, stability: 55, growthProgress: 10 });
    expect(after.eventLog).toContainEqual(expect.objectContaining({ type: 'FOOD_SHORTAGE', required: 2, paid: 1, deficit: 1 }));
    expect(after.eventLog.filter((event) => event.type === 'POPULATION_GROWN')).toHaveLength(0);
  });
  it('does not repeatedly turn old food stocks into growth', () => {
    const state = cityGame(); firstPlayer(state).resources.food = 100;
    firstCity(state).workers = workers(0, 2);
    const after = maintain(state);
    expect(firstCity(after).growthProgress).toBe(0);
    expect(firstPlayer(after).resources.food).toBe(98);
    expect(after.eventLog.filter((event) => event.type === 'FOOD_SHORTAGE')).toHaveLength(0);
  });
  it('honors configured consumption, threshold and per-cycle growth limit', () => {
    const rules = createDefaultRules(); rules.foodPerPopulation = 0; rules.growthThreshold = 2; rules.maxGrowthPerMaintenance = 2;
    const state = cityGame(rules); firstCity(state).development = 2;
    const after = maintain(state);
    expect(firstCity(after)).toMatchObject({ population: 4, growthProgress: 0 });
    expect(firstPlayer(after).resources.food).toBe(24);
  });
  it('is deterministic and immutable, with one atomic revision for many events', () => {
    const state = deepFreeze(cityGame()); const before = JSON.stringify(state);
    const first = maintain(state); const second = maintain(state);
    expect(first).toEqual(second);
    expect(JSON.stringify(state)).toBe(before);
    expect(first.version).toBe(1);
    expect(first.eventLog.slice(1).every((event) => event.version === 1)).toBe(true);
    expect(advancePhase(first, 'PLANNING', first.version)).toMatchObject({ ok: false, error: { code: 'INVALID_PHASE_TRANSITION' } });
  });
  it('rejects unsafe arithmetic atomically rather than producing corrupt resources', () => {
    const state = cityGame(); state.config.productionPerWorker.producers = Number.MAX_SAFE_INTEGER;
    const before = JSON.stringify(state);
    expect(advancePhase(state, 'PLANNING', state.version)).toMatchObject({ ok: false, error: { code: 'NUMERIC_OVERFLOW' } });
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe('stability', () => {
  it.each([[-10, 0], [0, 0], [50, 50], [100, 100], [150, 100]])('clamps %i to %i', (input, output) => expect(clampStability(input)).toBe(output));
  it.each([[0, 'CRITICAL'], [19, 'CRITICAL'], [20, 'UNSTABLE'], [39, 'UNSTABLE'], [40, 'TENSE'], [59, 'TENSE'], [60, 'STABLE'], [79, 'STABLE'], [80, 'PROSPEROUS'], [100, 'PROSPEROUS']] as const)('derives band for %i', (value, band) => expect(stabilityCategory(value, createDefaultRules())).toBe(band));
  it('applies configured positive and negative production modifiers', () => {
    const state = cityGame(); state.config.productionPerWorker.producers = 10;
    const city = firstCity(state);
    city.stability = 80; expect(deriveCityProduction(city, firstPlayer(state).civilization, state.config).food).toBe(22);
    city.stability = 20; expect(deriveCityProduction(city, firstPlayer(state).civilization, state.config).food).toBe(18);
    city.stability = 0; expect(deriveCityProduction(city, firstPlayer(state).civilization, state.config).food).toBe(15);
  });
  it('clamps real maintenance penalties and bonuses', () => {
    const state = cityGame(); const player = firstPlayer(state); const city = firstCity(state);
    city.stability = 2; city.workers = workers(0, 2); player.resources.food = 0;
    expect(firstCity(maintain(state)).stability).toBe(0);
    city.stability = 99; city.workers = workers(2); player.civilization.government = 'THEOCRACY';
    expect(firstCity(maintain(state)).stability).toBe(100);
  });
});
