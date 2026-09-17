import { describe, expect, it } from 'vitest';
import { CityIdSchema, GameRulesConfigSchema, GameStateSchema, HexIdSchema, RESOURCE_KEYS, SnapshotV2Schema, createDefaultRules, deserializeGameState, serializeGameState } from '@aoh/game-domain';
import { advancePhase, applyCommand, deriveCityProductionBreakdown, maintainPlayer, migrateSnapshotV2ToV3 } from '@aoh/game-engine';
import { GameService, playerView } from '../apps/server/src/game-service.js';
import { InMemoryGameRepository } from '../apps/server/src/repository.js';
import { buildTerritoryInspection } from '../apps/server/src/debug-scenario.js';
import { snapshotV2 } from '../apps/server/src/fixtures/snapshot-v2.js';
import { deepFreeze, gameId, playerId, secondPlayerId, unwrap } from './helpers.js';
import { cityId, enemyCityId, firstCity, firstPlayer, workers } from './civilization-helpers.js';
import { claim, developRadius, execute, territorialGame, territorialPlanning, territoryInput, type Intent } from './territory-helpers.js';

const intents: Intent[] = [
  { type: 'CLAIM_HEX', cityId, hexId: HexIdSchema.parse('1,0') },
  { type: 'ASSIGN_WORKED_HEXES', cityId, hexIds: [] },
  { type: 'IMPROVE_HEX', hexId: HexIdSchema.parse('0,0'), improvement: 'FARM' },
  { type: 'FOUND_CITY', cityId: CityIdSchema.parse('new-city'), hexId: HexIdSchema.parse('0,0'), name: 'New' },
  { type: 'BUILD_DISTRICT', cityId, district: 'AGRARIAN' },
  { type: 'BUILD_BUILDING', cityId, building: 'GRANARY' },
];

describe('territory command boundary', () => {
  it.each(intents)('enforces phase, version and input validation for $type', (intent) => {
    const state = territorialGame();
    expect(applyCommand(state, { ...intent, playerId, expectedVersion: 0 })).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } });
    const planning = territorialPlanning();
    expect(applyCommand(planning, { ...intent, playerId, expectedVersion: 0 })).toMatchObject({ ok: false, error: { code: 'VERSION_CONFLICT' } });
    expect(applyCommand(planning, { ...intent, playerId, expectedVersion: planning.version, injected: true })).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
  });
  it.each(intents)('rejects identity forgery for $type before persistence', async (intent) => {
    const repository = new InMemoryGameRepository(); const service = new GameService(repository);
    unwrap(await service.create(territoryInput())); const state = unwrap(await service.advance(gameId, 'PLANNING', 0));
    expect(await service.submit(gameId, { playerId: secondPlayerId }, { ...intent, playerId, expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect(await repository.find(gameId)).toEqual(state);
  });
  it('CAS prevents duplicate payment for concurrent claims without defining strategic priority', async () => {
    const repository = new InMemoryGameRepository(); const service = new GameService(repository);
    unwrap(await service.create(territoryInput())); const state = unwrap(await service.advance(gameId, 'PLANNING', 0));
    const command = { type: 'CLAIM_HEX', cityId, hexId: '1,0', playerId, expectedVersion: state.version };
    const results = await Promise.all([service.submit(gameId, { playerId }, command), service.submit(gameId, { playerId }, command)]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toMatchObject([{ error: { code: 'VERSION_CONFLICT' } }]);
    const saved = await repository.find(gameId); if (!saved) throw new Error('Missing saved state');
    expect(firstPlayer(saved).resources.influence).toBe(99);
    expect(saved.eventLog.filter((event) => event.type === 'HEX_CLAIMED')).toHaveLength(1);
    expect(await service.submit(gameId, { playerId }, { ...command, expectedVersion: saved.version })).toMatchObject({ ok: false, error: { code: 'HEX_NOT_FREE' } });
  });
  it('projects visible territory through an explicit allowlist and isolates all references', () => {
    const state = claim(territorialPlanning(), '1,0');
    const view = playerView(state, playerId); if (!view) throw new Error('Missing view');
    expect(view.visibleTerritory.map((tile) => tile.id)).toEqual(['0,0', '1,0']);
    expect(JSON.stringify(view)).not.toContain('Foreign');
    for (const key of ['seed', 'rng', 'eventLog', 'players', 'map']) expect(view).not.toHaveProperty(key);
    const visible = playerView(state, playerId, { visibleCityIds: [], knownGovernmentPlayerIds: [], visibleHexIds: [HexIdSchema.parse('5,0')] });
    expect(visible?.visibleTerritory.find((tile) => tile.id === '5,0')).toMatchObject({ ownerId: secondPlayerId, controllerCityId: enemyCityId, yield: { food: 1, materials: 1, wealth: 0 } });
    expect(visible?.visibleCities).toEqual([]);
    const tile = view.visibleTerritory[1]; if (!tile) throw new Error('Missing tile'); tile.features.push('METAL');
    expect(state.map.find((tile) => tile.id === '1,0')?.features).toEqual(['RIVER', 'FERTILE']);
    if (view.economyPreview) view.economyPreview.closing.food = 0;
    expect(firstPlayer(state).resources.food).toBeGreaterThan(0);
  });
});

describe('exact economic reconciliation', () => {
  it('reconciles every source, rounding step, administrative adjustment and actual credit', () => {
    const rules = createDefaultRules(); rules.administrativeRules.baseCapacity = 0;
    let state = claim(territorialPlanning(rules), '1,-1');
    state = execute(state, { type: 'ASSIGN_WORKED_HEXES', cityId, hexIds: [HexIdSchema.parse('1,-1')] });
    state = execute(state, { type: 'ASSIGN_POPULATION', cityId, workers: { ...workers(1), merchants: 1 } });
    state = execute(state, { type: 'IMPROVE_HEX', hexId: HexIdSchema.parse('1,-1'), improvement: 'FISHERY' });
    state = execute(state, { type: 'BUILD_DISTRICT', cityId, district: 'COMMERCIAL' });
    state = execute(state, { type: 'BUILD_BUILDING', cityId, building: 'MARKET' });
    state = execute(state, { type: 'SPECIALIZE_CITY', cityId, specialization: 'COMMERCIAL' });
    state = execute(state, { type: 'ADOPT_GOVERNMENT', government: 'OLIGARCHY' });
    firstCity(state).stability = 19;
    const player = firstPlayer(state); const result = maintainPlayer(deepFreeze(player), state.config, state.round, state.version, state.map);
    const breakdown = result.economy.cities[0]; if (!breakdown) throw new Error('Missing breakdown');
    expect(breakdown.sources.map((entry) => entry.source)).toEqual(['population', 'terrain', 'feature', 'improvement', 'district', 'building', 'specialization', 'government', 'stability']);
    expect(breakdown.sources.map((entry) => entry.delta.wealth)).toEqual([1, 1, 0, 0, 1, 1, 2, 1, -2]);
    expect(breakdown.total).toMatchObject({ food: 2, wealth: 5 }); // floor(3 * .75), floor(floor(6 * 1.25) * .75)
    expect(result.economy.credited.wealth).toBe(4); // floor(5 * .90)
    for (const key of RESOURCE_KEYS) {
      expect(breakdown.sources.reduce((sum, entry) => sum + entry.delta[key], 0)).toBe(breakdown.total[key]);
      expect(result.economy.gross[key] + result.economy.administrativeAdjustment[key]).toBe(result.economy.credited[key]);
      expect(result.economy.opening[key] + result.economy.credited[key] - (key === 'food' ? result.economy.foodPaid : 0)).toBe(result.player.resources[key]);
      expect(result.economy.opening[key] + result.economy.netChange[key]).toBe(result.economy.closing[key]);
    }
    expect(result.events[0]).toMatchObject({ type: 'RESOURCES_PRODUCED', resources: result.economy.credited, breakdown: result.economy });
    let ready = state;
    for (const phase of ['RESOLUTION', 'REACTION', 'END_ROUND', 'MAINTENANCE'] as const) ready = unwrap(advancePhase(ready, phase, ready.version));
    const next = unwrap(advancePhase(ready, 'PLANNING', ready.version));
    expect(firstPlayer(next).resources).toEqual(result.player.resources);
    expect(playerView(next, playerId)?.lastEconomy?.breakdown?.credited).toEqual(result.economy.credited);
  });
  it.each([1, 2, 3])('rounds small production %i only at explicit modifier boundaries', (amount) => {
    const state = territorialPlanning(); const city = firstCity(state); const player = firstPlayer(state);
    city.workers = { ...workers(), merchants: 2 }; city.stability = 19;
    state.config.productionPerWorker.merchants = amount;
    player.civilization.government = 'OLIGARCHY';
    const result = deriveCityProductionBreakdown(city, player.civilization, state.config, state.map);
    expect(result.total.wealth).toBe(Math.floor(Math.floor(2 * amount * 110 / 100) * 75 / 100));
  });
  it('rejects invalid territorial config and detects summed feature and infrastructure overflow', () => {
    for (const mutate of [
      (rules: ReturnType<typeof createDefaultRules>) => { rules.territory.controlledHexesPerLoad = 0; },
      (rules: ReturnType<typeof createDefaultRules>) => { rules.territory.cityRadii = [2, 1, 2, 2, 3]; },
      (rules: ReturnType<typeof createDefaultRules>) => { rules.territory.districtSlots = [2, 1, 3, 4, 5]; },
      (rules: ReturnType<typeof createDefaultRules>) => { rules.territory.foundingTerrains = ['SEA']; },
      (rules: ReturnType<typeof createDefaultRules>) => { rules.territory.foundingPopulation = 100; },
      (rules: ReturnType<typeof createDefaultRules>) => { rules.territory.improvementCatalog.FARM.yield.food = -1; },
    ]) { const rules = createDefaultRules(); mutate(rules); expect(GameRulesConfigSchema.safeParse(rules).success).toBe(false); }
    let state = claim(territorialPlanning(), '1,0');
    state = execute(state, { type: 'ASSIGN_WORKED_HEXES', cityId, hexIds: [HexIdSchema.parse('1,0')] });
    state.config.territory.featureCatalog.RIVER.yield.food = Number.MAX_SAFE_INTEGER;
    expect(() => maintainPlayer(firstPlayer(state), state.config, state.round, state.version, state.map)).toThrow(RangeError);
    expect(playerView(state, playerId)?.economyError).toContain('safe integer');
    expect(playerView(state, playerId)?.visibleTerritory.find((tile) => tile.id === '1,0')?.yield).toBeNull();
    const rules = createDefaultRules(); rules.territory.districts.ADMINISTRATIVE.administrativeCapacity = Number.MAX_SAFE_INTEGER;
    const before = territorialPlanning(rules);
    expect(applyCommand(before, { type: 'BUILD_DISTRICT', cityId, district: 'ADMINISTRATIVE', playerId, expectedVersion: before.version })).toMatchObject({ ok: false, error: { code: 'NUMERIC_OVERFLOW' } });
    expect(firstCity(before).districts).toEqual([]);
  });
});

describe('snapshot v3 and explicit migration', () => {
  it('round trips territorial ownership, work, improvement, districts, buildings and economic events', () => {
    let state = claim(territorialPlanning(), '1,0');
    state = execute(state, { type: 'ASSIGN_WORKED_HEXES', cityId, hexIds: [HexIdSchema.parse('1,0')] });
    state = execute(state, { type: 'IMPROVE_HEX', hexId: HexIdSchema.parse('1,0'), improvement: 'FARM' });
    state = execute(state, { type: 'BUILD_DISTRICT', cityId, district: 'AGRARIAN' });
    state = execute(state, { type: 'BUILD_BUILDING', cityId, building: 'GRANARY' });
    const restored = unwrap(deserializeGameState(serializeGameState(state)));
    expect(restored.schemaVersion).toBe(3); expect(restored).toEqual(state);
    expect(serializeGameState(restored)).toBe(serializeGameState(state));
  });
  it('migrates real v2 without mutating input or inventing terrain and preserves historic events', () => {
    const original = SnapshotV2Schema.parse(snapshotV2);
    expect(deserializeGameState(JSON.stringify(snapshotV2))).toMatchObject({ ok: false, error: { code: 'SNAPSHOT_MIGRATION_REQUIRED' } });
    const next = unwrap(migrateSnapshotV2ToV3(deepFreeze(snapshotV2)));
    expect(snapshotV2).toEqual(original);
    expect(next.eventLog).toEqual(original.eventLog);
    expect(next.map.every((tile) => tile.terrain === 'UNKNOWN' && tile.features.length === 0 && tile.improvement === null)).toBe(true);
    for (const player of next.players) {
      expect(player.resources).toEqual(original.players.find((old) => old.id === player.id)?.resources);
      for (const city of player.civilization.cities) {
        expect(city).toMatchObject({ workedHexIds: [], districts: [], buildings: [] });
        expect(next.map.find((tile) => tile.id === city.hexId)).toMatchObject({ ownerId: player.id, controllerCityId: city.id });
      }
    }
    for (const tile of next.map.filter((hex) => !next.players.some((player) => player.civilization.cities.some((city) => city.hexId === hex.id)))) expect(tile).toMatchObject({ ownerId: null, controllerCityId: null });
    expect(unwrap(deserializeGameState(serializeGameState(next)))).toEqual(next);
    expect(migrateSnapshotV2ToV3(original)).toEqual(migrateSnapshotV2ToV3(original));
  });
  it('requires explicit v1 conversion, rejects unknown versions and malformed v2', () => {
    expect(deserializeGameState('{"schemaVersion":1}')).toMatchObject({ ok: false, error: { code: 'SNAPSHOT_MIGRATION_REQUIRED', message: expect.stringContaining('9d63e69') } });
    expect(deserializeGameState('{"schemaVersion":99}')).toMatchObject({ ok: false, error: { code: 'UNSUPPORTED_SCHEMA' } });
    for (const value of [{ schemaVersion: 2 }, { ...SnapshotV2Schema.parse(snapshotV2), schemaVersion: 1 }, territorialGame()]) expect(migrateSnapshotV2ToV3(value).ok).toBe(false);
  });
  it.each(['terrain', 'controller', 'work', 'district', 'building', 'improvement'])('rejects malformed v3 %s instead of inventing defaults', (kind) => {
    const state = claim(territorialPlanning(), '1,0'); const city = firstCity(state); const tile = state.map.find((tile) => tile.id === '1,0'); if (!tile) throw new Error('Missing tile');
    switch (kind) {
      case 'terrain': Reflect.deleteProperty(tile, 'terrain'); break;
      case 'controller': tile.controllerCityId = enemyCityId; break;
      case 'work': city.workedHexIds = [tile.id, tile.id]; break;
      case 'district': city.districts = [{ type: 'AGRARIAN', builtRound: 1 }, { type: 'AGRARIAN', builtRound: 1 }]; break;
      case 'building': city.buildings = [{ type: 'LIBRARY', builtRound: 1 }]; break;
      case 'improvement': tile.improvement = 'MINE'; break;
    }
    expect(GameStateSchema.safeParse(state).success).toBe(false);
    expect(deserializeGameState(JSON.stringify(state)).ok).toBe(false);
  });
  it('rejects territorial work outside range and duplicate work by another city', () => {
    const state = claim(claim(developRadius(territorialPlanning()), '1,0'), '2,0');
    firstCity(state).development = 1;
    firstCity(state).workedHexIds = [HexIdSchema.parse('2,0')];
    expect(GameStateSchema.safeParse(state).success).toBe(false);
    const valid = execute(claim(territorialPlanning(), '1,0'), { type: 'ASSIGN_WORKED_HEXES', cityId, hexIds: [HexIdSchema.parse('1,0')] });
    const foreign = valid.players[1]?.civilization.cities[0]; if (!foreign) throw new Error('Missing foreign city');
    foreign.workedHexIds = [HexIdSchema.parse('1,0')];
    expect(GameStateSchema.safeParse(valid).success).toBe(false);
  });
  it('demo proves deterministic expansion, production, v3 restoration and v2 migration', async () => {
    const first = await buildTerritoryInspection(); expect(await buildTerritoryInspection()).toEqual(first);
    expect(first.view.player.civilization.cities).toHaveLength(2);
    expect(first.view.lastEconomy?.breakdown?.cities).toHaveLength(2);
    expect(first.migration).toMatchObject({ from: 2, to: 3, terrain: 'UNKNOWN' });
    expect(first.view).not.toHaveProperty('eventLog');
  });
});
