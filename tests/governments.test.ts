import { describe, expect, it } from 'vitest';
import { CityIdSchema, HexIdSchema, GovernmentTypeSchema, createDefaultRules } from '@aoh/game-domain';
import { applyCommand, commandPoints, deriveAdministration, deriveCityProduction, refreshAdministration } from '@aoh/game-engine';
import { playerId } from './helpers.js';
import { cityGame, cityId, firstCity, firstPlayer, maintain, manage, planning, workers } from './civilization-helpers.js';

describe('government adoption and declarative modifiers', () => {
  it.each(GovernmentTypeSchema.options)('adopts %s once and emits an event', (government) => {
    const state = manage(planning(), { type: 'ADOPT_GOVERNMENT', government });
    expect(firstPlayer(state).civilization.government).toBe(government);
    expect(state.eventLog.at(-1)).toMatchObject({ type: 'GOVERNMENT_ADOPTED', government });
    expect(applyCommand(state, { type: 'ADOPT_GOVERNMENT', government: 'MONARCHY', playerId, expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'GOVERNMENT_ALREADY_ADOPTED' } });
  });
  it('rejects unknown governments and a return to proto governance', () => {
    const state = planning();
    for (const government of ['UNKNOWN', 'PROTO_GOVERNANCE']) expect(applyCommand(state, { type: 'ADOPT_GOVERNMENT', government, playerId, expectedVersion: state.version }).ok).toBe(false);
  });
  it('monarchy increases capacity, stabilizes the capital and amplifies a capital crisis', () => {
    const state = cityGame(); firstPlayer(state).civilization.government = 'MONARCHY';
    const good = maintain(state);
    expect(firstPlayer(good).civilization.administrativeCapacity).toBe(5);
    expect(firstCity(good).stability).toBe(63);
    firstCity(state).stability = 10;
    expect(firstCity(maintain(state)).stability).toBe(8); // +3 capital, -5 crisis
  });
  it('capital crisis affects the state without dependence on city iteration order', () => {
    const state = cityGame(); const player = firstPlayer(state); const capital = firstCity(state);
    const id = CityIdSchema.parse('regional-city'); const hexId = HexIdSchema.parse('3,0');
    state.map.push({ id: hexId, q: 3, r: 0 });
    player.civilization.cities.push({ ...structuredClone(capital), id, hexId });
    player.civilization.government = 'MONARCHY'; capital.stability = 19;
    const normal = maintain(state);
    player.civilization.cities.reverse();
    const reversed = maintain(state);
    const byId = (cities: typeof player.civilization.cities) => [...cities].sort((a, b) => a.id < b.id ? -1 : 1);
    expect(byId(firstPlayer(normal).civilization.cities)).toEqual(byId(firstPlayer(reversed).civilization.cities));
    expect(firstPlayer(normal).civilization.cities.find((city) => city.id === id)?.stability).toBe(55);
  });
  it('republic stabilizes developed cities and loses capacity for unstable cities', () => {
    const state = cityGame(); firstPlayer(state).civilization.government = 'REPUBLIC';
    firstCity(state).development = 3;
    expect(firstCity(maintain(state)).stability).toBe(62);
    firstCity(state).stability = 30;
    expect(deriveAdministration(firstPlayer(state).civilization, state.config).administrativeCapacity).toBe(2);
    expect(state.config.governmentModifiers.REPUBLIC.futureKnowledgeBonusPercent).toBe(10);
  });
  it('oligarchy improves wealth and adds a commercial synergy, with inequality still a hook', () => {
    const state = cityGame(); const player = firstPlayer(state); const city = firstCity(state);
    player.civilization.government = 'OLIGARCHY'; city.population = 10; city.development = 4;
    city.workers = { ...workers(), merchants: 10 };
    expect(deriveCityProduction(city, player.civilization, state.config).wealth).toBe(11);
    city.specialization = 'COMMERCIAL';
    expect(deriveCityProduction(city, player.civilization, state.config).wealth).toBe(25);
    expect(state.config.governmentModifiers.OLIGARCHY.futureInequalityStabilityPenalty).toBeGreaterThan(0);
  });
  it('theocracy increases stability and keeps influence/reform hooks inactive', () => {
    const state = cityGame(); firstPlayer(state).civilization.government = 'THEOCRACY';
    const after = maintain(state);
    expect(firstCity(after).stability).toBe(62);
    expect(firstPlayer(after).resources.influence).toBe(0);
    expect(after.config.governmentModifiers.THEOCRACY.futureReformFlexibilityPenalty).toBeGreaterThan(0);
  });
  it('confederation scales capacity and stability with cities while reducing command points', () => {
    const state = cityGame(); const player = firstPlayer(state);
    const id = CityIdSchema.parse('regional'); const hexId = HexIdSchema.parse('4,0');
    state.map.push({ id: hexId, q: 4, r: 0 });
    player.civilization.cities.push({ ...structuredClone(firstCity(state)), id, hexId });
    player.civilization.government = 'CONFEDERATION';
    const after = maintain(state); const civ = firstPlayer(after).civilization;
    expect(civ.administrativeCapacity).toBe(5);
    expect(civ.cities.map((city) => city.stability)).toEqual([62, 62]);
    expect(commandPoints(civ, state.config)).toBe(3);
    state.config.baseCommandPoints = 0;
    expect(commandPoints(civ, state.config)).toBe(0);
    state.config.governmentModifiers.CONFEDERATION.commandPointsDelta = -2;
    state.config.baseCommandPoints = 7;
    expect(commandPoints(civ, state.config)).toBe(5);
  });
});

describe('administrative load and consequences', () => {
  it('derives load from city count, development and population and adds specialization capacity', () => {
    const state = cityGame(); const city = firstCity(state); const civ = firstPlayer(state).civilization;
    city.development = 4; city.population = 10; city.workers = workers(10);
    expect(deriveAdministration(civ, state.config)).toEqual({ administrativeLoad: 4, administrativeCapacity: 3, administrationStatus: 'OVEREXTENDED' });
    city.specialization = 'ADMINISTRATIVE';
    expect(deriveAdministration(civ, state.config)).toEqual({ administrativeLoad: 4, administrativeCapacity: 5, administrationStatus: 'WITHIN_CAPACITY' });
  });
  it('penalizes new non-food production and stability, not accumulated stockpiles', () => {
    const rules = createDefaultRules(); rules.administrativeRules.baseCapacity = 0;
    const state = cityGame(rules); const city = firstCity(state); const player = firstPlayer(state);
    city.workers = { ...workers(), artisans: 2 }; player.resources.materials = 50;
    const after = maintain(state);
    expect(firstPlayer(after).resources.materials).toBe(51); // floor(2 * 90%) = 1
    expect(firstCity(after).stability).toBe(57);
    expect(after.eventLog).toContainEqual(expect.objectContaining({ type: 'ADMINISTRATIVE_OVEREXTENSION', load: 1, capacity: 0 }));
    expect(firstPlayer(after).civilization.administrationStatus).toBe('OVEREXTENDED');
  });
  it('applies overextension from population growth in the same cycle', () => {
    const rules = createDefaultRules(); rules.administrativeRules.baseCapacity = 1; rules.administrativeRules.populationStep = 3;
    const state = cityGame(rules); firstCity(state).growthProgress = 8;
    const after = maintain(state);
    expect(firstCity(after)).toMatchObject({ population: 3, stability: 57 });
    expect(firstPlayer(after).civilization).toMatchObject({ administrativeLoad: 2, administrationStatus: 'OVEREXTENDED' });
  });
  it('refreshes derived administration after stability crosses a government threshold', () => {
    const state = cityGame(); const player = firstPlayer(state); const city = firstCity(state);
    city.stability = 39; city.development = 3; player.civilization.government = 'REPUBLIC';
    player.civilization = refreshAdministration(player.civilization, state.config);
    expect(player.civilization.administrativeCapacity).toBe(2);
    const after = maintain(state);
    expect(firstCity(after).stability).toBe(41);
    expect(firstPlayer(after).civilization.administrativeCapacity).toBe(3);
  });
  it('updates administration immediately on development, specialization and adoption', () => {
    let state = planning();
    state = manage(state, { type: 'DEVELOP_CITY', cityId });
    state = manage(state, { type: 'DEVELOP_CITY', cityId });
    expect(firstPlayer(state).civilization.administrativeLoad).toBe(2);
    state = manage(state, { type: 'SPECIALIZE_CITY', cityId, specialization: 'ADMINISTRATIVE' });
    expect(firstPlayer(state).civilization.administrativeCapacity).toBe(5);
    state = manage(state, { type: 'ADOPT_GOVERNMENT', government: 'MONARCHY' });
    expect(firstPlayer(state).civilization.administrativeCapacity).toBe(7);
  });
});
