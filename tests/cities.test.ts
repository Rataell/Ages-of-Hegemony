import { describe, expect, it } from 'vitest';
import { CityStateSchema, CitySpecializationSchema, GameStateSchema, createDefaultRules, emptyResourcePool } from '@aoh/game-domain';
import { applyCommand, createGame, deriveCityProduction, populationCap } from '@aoh/game-engine';
import { deepFreeze, playerId, unwrap } from './helpers.js';
import { cityGame, cityId, cityInput, enemyCityId, firstCity, firstPlayer, manage, planning, workers, type ManagementIntent } from './civilization-helpers.js';

describe('city setup and population invariants', () => {
  it('creates an explicit city with a capital and proto governance', () => {
    const state = cityGame();
    expect(firstPlayer(state).civilization).toMatchObject({ government: 'PROTO_GOVERNANCE', capitalCityId: cityId, administrativeLoad: 1, administrativeCapacity: 3 });
    expect(firstCity(state)).toMatchObject({ population: 2, stability: 60, development: 1, foundedRound: 1, specialization: null, growthProgress: 0 });
    expect(CityStateSchema.safeParse(firstCity(state)).success).toBe(true);
  });
  it('rejects duplicate locations, unknown owners, invalid allocations and population caps', () => {
    const data = cityInput();
    const first = data.initialCities[0];
    if (!first) throw new Error('Missing city');
    for (const invalid of [
      { ...data, initialCities: [first, { ...first, id: 'duplicate-location' }] },
      { ...data, initialCities: [{ ...first, ownerId: 'outsider' }] },
      { ...data, initialCities: [{ ...first, population: 3 }] },
      { ...data, initialCities: [{ ...first, population: 4, workers: workers(4) }] },
    ]) expect(createGame(invalid).ok).toBe(false);
  });
  it('assigns all roles and preserves the original state and command', () => {
    const state = planning();
    const command = deepFreeze({ type: 'ASSIGN_POPULATION', playerId, cityId, expectedVersion: state.version, workers: { ...workers(), artisans: 1, scholars: 1 } });
    const original = JSON.stringify(state);
    const updated = unwrap(applyCommand(deepFreeze(state), command));
    expect(firstCity(updated).workers).toEqual(command.workers);
    expect(updated.eventLog.at(-1)).toMatchObject({ type: 'POPULATION_ASSIGNED', cityId });
    expect(JSON.stringify(state)).toBe(original);
  });
  it.each([1, 3])('rejects allocation sum %i for population 2', (amount) => {
    const state = planning();
    expect(applyCommand(state, { type: 'ASSIGN_POPULATION', playerId, cityId, expectedVersion: state.version, workers: workers(amount) })).toMatchObject({ ok: false, error: { code: 'INVALID_ALLOCATION' } });
  });
  it.each([-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid worker count %s', (amount) => {
    const state = planning();
    expect(applyCommand(state, { type: 'ASSIGN_POPULATION', playerId, cityId, expectedVersion: state.version, workers: workers(amount) })).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
  });
  it.each(['ASSIGN_POPULATION', 'DEVELOP_CITY', 'SPECIALIZE_CITY'] as const)('rejects an enemy city for %s', (type) => {
    const state = planning();
    const command = type === 'ASSIGN_POPULATION' ? { type, workers: workers(2) } : type === 'SPECIALIZE_CITY' ? { type, specialization: 'AGRARIAN' } : { type };
    expect(applyCommand(state, { ...command, cityId: enemyCityId, playerId, expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'CITY_NOT_OWNED' } });
  });
});

describe('development and specialization', () => {
  it('charges the configured cost, increases capacity and emits an event', () => {
    const state = planning();
    const updated = manage(state, { type: 'DEVELOP_CITY', cityId });
    expect(firstCity(updated).development).toBe(2);
    expect(firstPlayer(updated).resources.materials).toBe(firstPlayer(state).resources.materials - 5);
    expect(populationCap(firstCity(updated), updated.config)).toBe(5);
    expect(updated.eventLog.at(-1)).toMatchObject({ type: 'CITY_DEVELOPED', development: 2, cost: { materials: 5 } });
  });
  it('charges all resource types atomically and rejects insufficient funds', () => {
    const rules = createDefaultRules();
    rules.developmentCosts[0] = { food: 1, materials: 2, wealth: 3, knowledge: 4, influence: 5 };
    const state = planning(rules);
    const before = JSON.stringify(state);
    expect(applyCommand(state, { type: 'DEVELOP_CITY', cityId, playerId, expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'INSUFFICIENT_RESOURCES' } });
    expect(JSON.stringify(state)).toBe(before);
    firstPlayer(state).resources = { ...rules.developmentCosts[0] };
    expect(firstPlayer(manage(state, { type: 'DEVELOP_CITY', cityId })).resources).toEqual(emptyResourcePool());
  });
  it('rejects the maximum development and a critical city', () => {
    const state = planning();
    firstCity(state).development = 5;
    expect(applyCommand(state, { type: 'DEVELOP_CITY', cityId, playerId, expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'MAX_DEVELOPMENT' } });
    firstCity(state).development = 1; firstCity(state).stability = 19;
    expect(applyCommand(state, { type: 'DEVELOP_CITY', cityId, playerId, expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'CRITICAL_STABILITY' } });
    state.config.blockDevelopmentAtCritical = false;
    expect(firstCity(manage(state, { type: 'DEVELOP_CITY', cityId })).development).toBe(2);
  });
  it.each(CitySpecializationSchema.options)('allows initial %s and blocks every replacement', (specialization) => {
    const state = manage(planning(), { type: 'SPECIALIZE_CITY', cityId, specialization });
    expect(firstCity(state).specialization).toBe(specialization);
    expect(state.eventLog.at(-1)).toMatchObject({ type: 'CITY_SPECIALIZED', specialization });
    expect(applyCommand(state, { type: 'SPECIALIZE_CITY', cityId, playerId, expectedVersion: state.version, specialization: 'AGRARIAN' })).toMatchObject({ ok: false, error: { code: 'ALREADY_SPECIALIZED' } });
  });
  it('enforces configurable minimum development', () => {
    const rules = createDefaultRules(); rules.specializationMinimumDevelopment = 2;
    const state = planning(rules);
    expect(applyCommand(state, { type: 'SPECIALIZE_CITY', cityId, playerId, expectedVersion: state.version, specialization: 'ACADEMIC' })).toMatchObject({ ok: false, error: { code: 'DEVELOPMENT_REQUIRED' } });
  });
  it.each([
    ['AGRARIAN', 'producers', 'food', 6], ['INDUSTRIAL', 'artisans', 'materials', 4],
    ['COMMERCIAL', 'merchants', 'wealth', 4], ['ACADEMIC', 'scholars', 'knowledge', 4],
  ] as const)('%s modifies the appropriate workers only', (specialization, role, resource, amount) => {
    const state = cityGame(); const city = firstCity(state);
    city.workers = { ...workers(), [role]: 2 }; city.specialization = specialization;
    expect(deriveCityProduction(city, firstPlayer(state).civilization, state.config)).toEqual({ ...emptyResourcePool(), [resource]: amount });
  });
  it('soldiers and unassigned workers have no economic output; future hooks stay dormant', () => {
    const state = cityGame(); const city = firstCity(state);
    city.workers = { ...workers(0, 1), soldiers: 1 };
    for (const specialization of ['MILITARY', 'CULTURAL'] as const) {
      city.specialization = specialization;
      expect(deriveCityProduction(city, firstPlayer(state).civilization, state.config)).toEqual(emptyResourcePool());
    }
  });
});

describe('management phase and concurrency', () => {
  const commands: (ManagementIntent & { playerId: typeof playerId })[] = [
    { type: 'ASSIGN_POPULATION', playerId, cityId, workers: workers(2) },
    { type: 'DEVELOP_CITY', playerId, cityId },
    { type: 'SPECIALIZE_CITY', playerId, cityId, specialization: 'AGRARIAN' },
    { type: 'ADOPT_GOVERNMENT', playerId, government: 'REPUBLIC' },
  ];
  it.each(commands)('rejects stale $type and non-planning mutations', (command) => {
    const state = planning();
    expect(applyCommand(state, { ...command, expectedVersion: 0 })).toMatchObject({ ok: false, error: { code: 'VERSION_CONFLICT' } });
    expect(applyCommand(cityGame(), { ...command, expectedVersion: 0 })).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } });
    const updated = unwrap(applyCommand(state, { ...command, expectedVersion: state.version }));
    expect(updated.version).toBe(state.version + 1);
    expect(GameStateSchema.safeParse(updated).success).toBe(true);
  });
});
