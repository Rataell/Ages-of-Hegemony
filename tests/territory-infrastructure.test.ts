import { describe, expect, it } from 'vitest';
import { BuildingTypeSchema, CityIdSchema, DistrictTypeSchema, HexIdSchema, RESOURCE_KEYS, createDefaultRules, type GameState } from '@aoh/game-domain';
import { applyCommand, deriveCityProductionBreakdown, infrastructureStats, maintainPlayer } from '@aoh/game-engine';
import { deepFreeze, playerId } from './helpers.js';
import { cityId, enemyCityId, firstCity, firstPlayer, workers } from './civilization-helpers.js';
import { claim, developRadius, execute, territorialPlanning, type Intent } from './territory-helpers.js';

const newCityId = CityIdSchema.parse('frontier');
const expansion = () => claim(claim(developRadius(territorialPlanning()), '1,0'), '2,0');
const found: Intent = { type: 'FOUND_CITY', cityId: newCityId, hexId: HexIdSchema.parse('2,0'), name: 'Frontier' };
function reject(state: GameState, intent: Intent, code: string) {
  const before = structuredClone(state);
  expect(applyCommand(deepFreeze(state), { ...intent, playerId, expectedVersion: state.version })).toMatchObject({ ok: false, error: { code } });
  expect(state).toEqual(before);
}

describe('territorial improvements', () => {
  it.each([
    ['FARM', '1,0', { food: 5, materials: 0, wealth: 0 }],
    ['LUMBER_CAMP', '-1,1', { food: 1, materials: 3, wealth: 0 }],
    ['QUARRY', '0,1', { food: 0, materials: 4, wealth: 0 }],
    ['MINE', '0,1', { food: 0, materials: 5, wealth: 0 }],
    ['FISHERY', '1,-1', { food: 3, materials: 0, wealth: 1 }],
  ] as const)('builds %s once, pays configured cost and produces its yield', (improvement, id, yieldValue) => {
    const state = claim(territorialPlanning(), id);
    const intent: Intent = { type: 'IMPROVE_HEX', hexId: HexIdSchema.parse(id), improvement };
    const next = execute(deepFreeze(state), intent);
    for (const key of RESOURCE_KEYS) expect(firstPlayer(next).resources[key]).toBe(firstPlayer(state).resources[key] - state.config.territory.improvementCatalog[improvement].cost[key]);
    const assigned = execute(next, { type: 'ASSIGN_WORKED_HEXES', cityId, hexIds: [HexIdSchema.parse(id)] });
    const result = deriveCityProductionBreakdown(firstCity(assigned), firstPlayer(assigned).civilization, assigned.config, assigned.map);
    expect(result.total).toMatchObject({ ...yieldValue, food: yieldValue.food + 2 });
    expect(next.eventLog.at(-1)).toMatchObject({ type: 'HEX_IMPROVED', improvement });
    reject(next, intent, 'ALREADY_IMPROVED');
  });
  it.each(['LUMBER_CAMP', 'QUARRY', 'MINE', 'FISHERY'] as const)('rejects incompatible %s without spending', (improvement) => {
    reject(claim(territorialPlanning(), '1,0'), { type: 'IMPROVE_HEX', hexId: HexIdSchema.parse('1,0'), improvement }, 'INVALID_IMPROVEMENT');
  });
  it('rejects incompatible farm, foreign territory and insufficient materials', () => {
    reject(claim(territorialPlanning(), '0,1'), { type: 'IMPROVE_HEX', hexId: HexIdSchema.parse('0,1'), improvement: 'FARM' }, 'INVALID_IMPROVEMENT');
    reject(territorialPlanning(), { type: 'IMPROVE_HEX', hexId: HexIdSchema.parse('5,0'), improvement: 'LUMBER_CAMP' }, 'HEX_NOT_OWNED');
    const state = claim(territorialPlanning(), '1,0'); firstPlayer(state).resources.materials = 0;
    reject(state, { type: 'IMPROVE_HEX', hexId: HexIdSchema.parse('1,0'), improvement: 'FARM' }, 'INSUFFICIENT_RESOURCES');
  });
  it('permits FARM on a FERTILE hill and requires FISH for FISHERY', () => {
    const state = claim(territorialPlanning(), '1,0');
    const tile = state.map.find((tile) => tile.id === '1,0'); if (!tile) throw new Error('Missing tile');
    tile.terrain = 'HILLS'; tile.features = ['FERTILE'];
    expect(execute(state, { type: 'IMPROVE_HEX', hexId: tile.id, improvement: 'FARM' }).map.find((hex) => hex.id === tile.id)?.improvement).toBe('FARM');
    const coast = claim(territorialPlanning(), '1,-1'); const shore = coast.map.find((hex) => hex.id === '1,-1'); if (!shore) throw new Error('Missing shore');
    shore.features = [];
    reject(coast, { type: 'IMPROVE_HEX', hexId: shore.id, improvement: 'FISHERY' }, 'INVALID_IMPROVEMENT');
  });
});

describe('city expansion', () => {
  it('founds a city atomically, preserves capital and includes consumption and administration immediately', () => {
    const state = expansion(); const next = execute(deepFreeze(state), found);
    const player = firstPlayer(next); const city = player.civilization.cities.find((city) => city.id === newCityId);
    expect(city).toMatchObject({ population: 1, stability: 60, development: 1, specialization: null, growthProgress: 0, workers: { ...workers(), unassigned: 1 }, workedHexIds: [], districts: [], buildings: [] });
    expect(player.civilization.capitalCityId).toBe(cityId);
    expect(next.map.find((tile) => tile.id === '2,0')).toMatchObject({ ownerId: playerId, controllerCityId: newCityId });
    for (const key of RESOURCE_KEYS) expect(player.resources[key]).toBe(firstPlayer(state).resources[key] - state.config.territory.foundingCost[key]);
    expect(player.civilization.administrativeLoad).toBe(firstPlayer(state).civilization.administrativeLoad + 1);
    const cycle = maintainPlayer(player, next.config, next.round, next.version, next.map);
    expect(cycle.economy.foodRequired).toBe(3);
    expect(cycle.economy.cities.map((entry) => entry.cityId)).toContain(newCityId);
    expect(next.eventLog.at(-1)).toMatchObject({ type: 'CITY_FOUNDED', cityId: newCityId });
  });
  it.each(['food', 'materials', 'wealth'] as const)('rejects insufficient %s without partial payment', (resource) => {
    const state = expansion(); firstPlayer(state).resources[resource] = 0;
    reject(state, found, 'INSUFFICIENT_RESOURCES');
  });
  it.each([['0,0', 'INVALID_CITY_SITE'], ['1,0', 'CITY_TOO_CLOSE'], ['5,0', 'HEX_NOT_OWNED'], ['-1,0', 'HEX_NOT_OWNED'], ['0,-1', 'HEX_NOT_OWNED']] as const)('rejects invalid founding site %s', (id, code) => {
    reject(expansion(), { ...found, hexId: HexIdSchema.parse(id) }, code);
  });
  it('rejects duplicate city IDs, worked sites and invalid names', () => {
    reject(expansion(), { ...found, cityId }, 'DUPLICATE_CITY');
    const state = execute(expansion(), { type: 'ASSIGN_WORKED_HEXES', cityId, hexIds: [HexIdSchema.parse('2,0')] });
    reject(state, found, 'INVALID_CITY_SITE');
    for (const name of ['', '   ', 'x'.repeat(81)]) reject(expansion(), { ...found, name }, 'INVALID_INPUT');
  });
  it('forbids a second city from working the first city territory', () => {
    const state = execute(expansion(), found);
    const staffed = execute(state, { type: 'ASSIGN_POPULATION', cityId: newCityId, workers: workers(1) });
    reject(staffed, { type: 'ASSIGN_WORKED_HEXES', cityId: newCityId, hexIds: [HexIdSchema.parse('1,0')] }, 'INVALID_WORKED_HEXES');
  });
  it('adds one territorial load per five owned hexes', () => {
    let state = territorialPlanning(); const before = firstPlayer(state).civilization.administrativeLoad;
    for (const id of ['1,0', '0,1', '-1,1']) state = claim(state, id);
    expect(firstPlayer(state).civilization.administrativeLoad).toBe(before);
    state = claim(state, '1,-1');
    expect(firstPlayer(state).civilization.administrativeLoad).toBe(before + 1);
  });
});

describe('districts and buildings', () => {
  it.each(DistrictTypeSchema.options)('builds one %s district, paying configured cost', (district) => {
    const state = territorialPlanning(); const next = execute(state, { type: 'BUILD_DISTRICT', cityId, district });
    expect(firstCity(next).districts).toEqual([{ type: district, builtRound: state.round }]);
    for (const key of RESOURCE_KEYS) expect(firstPlayer(next).resources[key]).toBe(firstPlayer(state).resources[key] - state.config.territory.districts[district].cost[key]);
    expect(next.eventLog.at(-1)).toMatchObject({ type: 'DISTRICT_BUILT', district });
    reject(next, { type: 'BUILD_DISTRICT', cityId, district }, 'DUPLICATE_DISTRICT');
  });
  it('enforces development slots, development prerequisites and ownership', () => {
    const state = execute(territorialPlanning(), { type: 'BUILD_DISTRICT', cityId, district: 'AGRARIAN' });
    reject(state, { type: 'BUILD_DISTRICT', cityId, district: 'CULTURAL' }, 'DISTRICT_LIMIT');
    const developed = execute(state, { type: 'DEVELOP_CITY', cityId });
    expect(firstCity(execute(developed, { type: 'BUILD_DISTRICT', cityId, district: 'CULTURAL' })).districts).toHaveLength(2);
    reject(territorialPlanning(), { type: 'BUILD_DISTRICT', cityId: enemyCityId, district: 'CULTURAL' }, 'CITY_NOT_OWNED');
    const rules = createDefaultRules(); rules.territory.districts.ACADEMIC.minimumDevelopment = 2;
    reject(territorialPlanning(rules), { type: 'BUILD_DISTRICT', cityId, district: 'ACADEMIC' }, 'DEVELOPMENT_REQUIRED');
  });
  it.each([1, 2, 3, 4, 5])('limits development %i to configured district slots', (development) => {
    let state = territorialPlanning();
    for (let level = 1; level < development; level += 1) state = execute(state, { type: 'DEVELOP_CITY', cityId });
    for (const district of DistrictTypeSchema.options.slice(0, development)) state = execute(state, { type: 'BUILD_DISTRICT', cityId, district });
    reject(state, { type: 'BUILD_DISTRICT', cityId, district: 'CULTURAL' }, 'DISTRICT_LIMIT');
  });
  it.each(BuildingTypeSchema.options)('builds %s only with matching district and pays cost once', (building) => {
    const initial = territorialPlanning(); const entry = initial.config.territory.buildings[building];
    reject(initial, { type: 'BUILD_BUILDING', cityId, building }, 'MISSING_DISTRICT');
    const state = execute(territorialPlanning(), { type: 'BUILD_DISTRICT', cityId, district: entry.district });
    const next = execute(state, { type: 'BUILD_BUILDING', cityId, building });
    for (const key of RESOURCE_KEYS) expect(firstPlayer(next).resources[key]).toBe(firstPlayer(state).resources[key] - entry.cost[key]);
    expect(firstCity(next).buildings).toEqual([{ type: building, builtRound: state.round }]);
    expect(next.eventLog.at(-1)).toMatchObject({ type: 'BUILDING_BUILT', building });
    reject(next, { type: 'BUILD_BUILDING', cityId, building }, 'DUPLICATE_BUILDING');
  });
  it.each([
    ['COMMERCIAL', 'MARKET', 'merchants', 'wealth'],
    ['ACADEMIC', 'LIBRARY', 'scholars', 'knowledge'],
    ['INDUSTRIAL', 'WORKSHOP', 'artisans', 'materials'],
  ] as const)('activates %s and %s only with their worker', (district, building, role, resource) => {
    let state = execute(territorialPlanning(), { type: 'BUILD_DISTRICT', cityId, district });
    state = execute(state, { type: 'BUILD_BUILDING', cityId, building });
    const production = (value: GameState) => deriveCityProductionBreakdown(firstCity(value), firstPlayer(value).civilization, value.config, value.map);
    expect(production(state).total[resource]).toBe(0);
    state = execute(state, { type: 'ASSIGN_POPULATION', cityId, workers: { ...workers(1), [role]: 1 } });
    expect(production(state).total[resource]).toBe(3);
    expect(production(state).sources.find((source) => source.source === 'district')?.delta[resource]).toBe(1);
    expect(production(state).sources.find((source) => source.source === 'building')?.delta[resource]).toBe(1);
  });
  it('the ADMINISTRATIVE district still raises the civilization administrative capacity by 1 (the Arquivo left that family in RC5)', () => {
    const before = territorialPlanning(), after = execute(before, { type: 'BUILD_DISTRICT', cityId, district: 'ADMINISTRATIVE' });
    expect(firstPlayer(after).civilization.administrativeCapacity - firstPlayer(before).civilization.administrativeCapacity).toBe(1);
  });
  it.each([['AGRARIAN', 'GRANARY', 'growthThreshold', 8], ['ACADEMIC', 'ARCHIVE', 'administrativeCapacity', 1], ['MILITARY', 'BARRACKS', 'garrisonCapacity', 3]] as const)('applies %s and %s infrastructure effects', (district, building, field, expected) => {
    let state = execute(territorialPlanning(), { type: 'BUILD_DISTRICT', cityId, district });
    state = execute(state, { type: 'BUILD_BUILDING', cityId, building });
    expect(infrastructureStats(firstCity(state), state.config)[field]).toBe(expected);
    if (district === 'MILITARY') {
      expect(firstCity(state).workers.soldiers).toBe(0);
      expect(state.eventLog.slice(-2).map((event) => event.type)).toEqual(['DISTRICT_BUILT', 'BUILDING_BUILT']);
      expect(state).not.toHaveProperty('units');
    }
    if (district === 'AGRARIAN') {
      const withProgress = structuredClone(state); firstCity(withProgress).growthProgress = 5;
      const cycle = maintainPlayer(firstPlayer(withProgress), withProgress.config, withProgress.round, withProgress.version, withProgress.map);
      expect(cycle.player.civilization.cities[0]?.population).toBe(3);
      const unstaffed = execute(state, { type: 'ASSIGN_POPULATION', cityId, workers: { ...workers(), unassigned: 2 } });
      expect(deriveCityProductionBreakdown(firstCity(unstaffed), firstPlayer(unstaffed).civilization, unstaffed.config, unstaffed.map).total.food).toBe(0);
    }
  });
  it('produces cultural influence with no workers and adds bounded specialization synergy', () => {
    let state = execute(territorialPlanning(), { type: 'BUILD_DISTRICT', cityId, district: 'CULTURAL' });
    state = execute(state, { type: 'BUILD_BUILDING', cityId, building: 'CULTURAL_CENTER' });
    state = execute(state, { type: 'SPECIALIZE_CITY', cityId, specialization: 'CULTURAL' });
    const result = maintainPlayer(firstPlayer(state), state.config, state.round, state.version, state.map);
    expect(result.economy.credited.influence).toBe(3);
    expect(result.player.resources.influence - firstPlayer(state).resources.influence).toBe(3);
  });
  it('enforces costs, ownership and building development before writes', () => {
    const poor = territorialPlanning(); firstPlayer(poor).resources.materials = 0;
    reject(poor, { type: 'BUILD_DISTRICT', cityId, district: 'AGRARIAN' }, 'INSUFFICIENT_RESOURCES');
    const rules = createDefaultRules(); rules.territory.buildings.GRANARY.minimumDevelopment = 2;
    const gated = execute(territorialPlanning(rules), { type: 'BUILD_DISTRICT', cityId, district: 'AGRARIAN' });
    reject(gated, { type: 'BUILD_BUILDING', cityId, building: 'GRANARY' }, 'DEVELOPMENT_REQUIRED');
    const state = execute(territorialPlanning(), { type: 'BUILD_DISTRICT', cityId, district: 'AGRARIAN' });
    firstPlayer(state).resources.materials = 0;
    reject(state, { type: 'BUILD_BUILDING', cityId, building: 'GRANARY' }, 'INSUFFICIENT_RESOURCES');
    reject(territorialPlanning(), { type: 'BUILD_BUILDING', cityId: enemyCityId, building: 'GRANARY' }, 'CITY_NOT_OWNED');
  });
});
