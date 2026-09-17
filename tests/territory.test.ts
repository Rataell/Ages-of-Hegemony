import { describe, expect, it } from 'vitest';
import { GameRulesConfigSchema, GameStateSchema, HexIdSchema, InitialHexTileSchema, TerrainTypeSchema, createDefaultRules, emptyResourcePool } from '@aoh/game-domain';
import { advancePhase, applyCommand, createGame, deriveCityProduction, tileYieldBreakdown } from '@aoh/game-engine';
import { deepFreeze, playerId, secondPlayerId, unwrap } from './helpers.js';
import { cityId, enemyCityId, firstCity, firstPlayer, workers } from './civilization-helpers.js';
import { claim, developRadius, execute, territorialGame, territorialPlanning, territoryInput } from './territory-helpers.js';

describe('terrain and features', () => {
  const expected = [{ food: 0, materials: 0, wealth: 0 }, { food: 2, materials: 0, wealth: 0 }, { food: 1, materials: 1, wealth: 0 }, { food: 0, materials: 2, wealth: 0 }, { food: 0, materials: 2, wealth: 0 }, { food: 1, materials: 0, wealth: 1 }, { food: 1, materials: 0, wealth: 0 }];
  it.each(TerrainTypeSchema.options)('derives %s base yield deterministically', (terrain) => {
    const tile = InitialHexTileSchema.parse({ id: '0,0', q: 0, r: 0, terrain }); const rules = createDefaultRules();
    expect(tileYieldBreakdown(tile, rules).total).toEqual(expected[TerrainTypeSchema.options.indexOf(terrain)]);
    expect(tileYieldBreakdown(tile, rules)).toEqual(tileYieldBreakdown(tile, rules));
  });
  it.each([['RIVER', 'PLAINS', 'food'], ['FERTILE', 'PLAINS', 'food'], ['TIMBER', 'FOREST', 'materials'], ['STONE', 'HILLS', 'materials'], ['METAL', 'MOUNTAINS', 'materials'], ['FISH', 'COAST', 'food']] as const)('adds %s independently', (feature, terrain, resource) => {
    const tile = InitialHexTileSchema.parse({ id: '0,0', q: 0, r: 0, terrain, features: [feature] });
    expect(tileYieldBreakdown(tile, createDefaultRules()).feature).toEqual({ food: 0, materials: 0, wealth: 0, [resource]: 1 });
  });
  it.each([['FISH', 'PLAINS'], ['TIMBER', 'SEA'], ['STONE', 'FOREST'], ['FERTILE', 'UNKNOWN']])('rejects impossible feature %s on %s', (feature, terrain) => {
    const data = territoryInput();
    expect(createGame({ ...data, map: [...data.map, { id: '10,0', q: 10, r: 0, terrain, features: [feature] }] }).ok).toBe(false);
  });
  it('rejects duplicate features, invalid yields and nonzero UNKNOWN rules', () => {
    const data = territoryInput();
    expect(createGame({ ...data, map: [...data.map, { id: '10,0', q: 10, r: 0, terrain: 'PLAINS', features: ['RIVER', 'RIVER'] }] }).ok).toBe(false);
    for (const value of [-1, 0.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
      const rules = createDefaultRules(); rules.territory.terrainYields.PLAINS.food = value;
      expect(GameRulesConfigSchema.safeParse(rules).success).toBe(false);
    }
    const rules = createDefaultRules(); rules.territory.terrainYields.UNKNOWN.food = 1;
    expect(GameRulesConfigSchema.safeParse(rules).success).toBe(false);
  });
});

describe('claims and ownership', () => {
  it('claims a connected free tile atomically for configured influence', () => {
    const state = deepFreeze(territorialPlanning()); const original = JSON.stringify(state);
    const next = claim(state, '1,0');
    expect(next.map.find((tile) => tile.id === '1,0')).toMatchObject({ ownerId: playerId, controllerCityId: cityId });
    expect(firstPlayer(next).resources.influence).toBe(99);
    expect(next.eventLog.at(-1)).toMatchObject({ type: 'HEX_CLAIMED', cost: { influence: 1 } });
    expect(JSON.stringify(state)).toBe(original);
  });
  it.each([['5,0', 'HEX_NOT_FREE'], ['0,0', 'HEX_NOT_FREE'], ['2,0', 'OUT_OF_RANGE'], ['-1,0', 'INVALID_TERRITORY'], ['0,-1', 'INVALID_TERRITORY'], ['99,99', 'UNKNOWN_HEX']])('rejects claim %s with %s', (hexId, code) => {
    const state = territorialPlanning();
    expect(applyCommand(state, { type: 'CLAIM_HEX', playerId, cityId, hexId, expectedVersion: state.version })).toMatchObject({ ok: false, error: { code } });
  });
  it('requires a connected path even within radius and accepts extension afterwards', () => {
    const state = developRadius(territorialPlanning());
    expect(applyCommand(state, { type: 'CLAIM_HEX', playerId, cityId, hexId: '2,0', expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'DISCONNECTED_TERRITORY' } });
    expect(claim(claim(state, '1,0'), '2,0').map.find((tile) => tile.id === '2,0')?.ownerId).toBe(playerId);
  });
  it('rejects lack of influence and a foreign controlling city without changes', () => {
    const state = territorialPlanning(); firstPlayer(state).resources.influence = 0; const before = JSON.stringify(state);
    expect(applyCommand(state, { type: 'CLAIM_HEX', playerId, cityId, hexId: '1,0', expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'INSUFFICIENT_RESOURCES' } });
    expect(JSON.stringify(state)).toBe(before);
    expect(applyCommand(state, { type: 'CLAIM_HEX', playerId, cityId: enemyCityId, hexId: '1,0', expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'CITY_NOT_OWNED' } });
  });
});

describe('worked territory replaces subsistence', () => {
  it('produces territorial yield instead of double-counting the producer base', () => {
    const state = execute(claim(territorialPlanning(), '1,0'), { type: 'ASSIGN_WORKED_HEXES', cityId, hexIds: [HexIdSchema.parse('1,0')] });
    expect(deriveCityProduction(firstCity(state), firstPlayer(state).civilization, state.config, state.map)).toEqual({ ...emptyResourcePool(), food: 6 }); // one subsistence 2, tile 2+river1+fertile1
    expect(state.eventLog.at(-1)).toMatchObject({ type: 'WORKED_HEXES_ASSIGNED', hexIds: ['1,0'] });
    const cleared = execute(state, { type: 'ASSIGN_WORKED_HEXES', cityId, hexIds: [] });
    expect(deriveCityProduction(firstCity(cleared), firstPlayer(cleared).civilization, cleared.config, cleared.map).food).toBe(4);
  });
  it.each([['1,0', '1,0'], ['0,0', '1,0', '0,1'], ['5,0'], ['99,0'], ['-1,0'], ['0,-1']])('rejects invalid worked set %j', (...hexIds) => {
    const state = claim(claim(territorialPlanning(), '1,0'), '0,1');
    expect(applyCommand(state, { type: 'ASSIGN_WORKED_HEXES', playerId, cityId, hexIds, expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'INVALID_WORKED_HEXES' } });
  });
  it('rejects another city and protects existing work when reassigning producers', () => {
    const state = execute(claim(territorialPlanning(), '1,0'), { type: 'ASSIGN_WORKED_HEXES', cityId, hexIds: [HexIdSchema.parse('1,0')] });
    expect(applyCommand(state, { type: 'ASSIGN_POPULATION', playerId, cityId, workers: workers(0, 2), expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'INVALID_WORKED_HEXES' } });
    expect(applyCommand(state, { type: 'ASSIGN_WORKED_HEXES', playerId: secondPlayerId, cityId: enemyCityId, hexIds: ['1,0'], expectedVersion: state.version }).ok).toBe(false);
  });
  it('rejects snapshots with forged control, out-of-range work or duplicate city work', () => {
    const state = execute(claim(territorialPlanning(), '1,0'), { type: 'ASSIGN_WORKED_HEXES', cityId, hexIds: [HexIdSchema.parse('1,0')] });
    const tile = state.map.find((tile) => tile.id === '1,0'); if (!tile) throw new Error('Missing tile');
    tile.controllerCityId = enemyCityId;
    expect(GameStateSchema.safeParse(state).success).toBe(false);
  });
  it('rejects production overflow without partially advancing or crediting resources', () => {
    const state = execute(claim(territorialPlanning(), '1,0'), { type: 'ASSIGN_WORKED_HEXES', cityId, hexIds: [HexIdSchema.parse('1,0')] });
    state.config.territory.terrainYields.PLAINS.food = Number.MAX_SAFE_INTEGER;
    let ready = state; for (const phase of ['RESOLUTION', 'REACTION', 'END_ROUND', 'MAINTENANCE'] as const) ready = unwrap(advancePhase(ready, phase, ready.version));
    const before = JSON.stringify(ready);
    expect(advancePhase(ready, 'PLANNING', ready.version)).toMatchObject({ ok: false, error: { code: 'NUMERIC_OVERFLOW' } });
    expect(JSON.stringify(ready)).toBe(before);
  });
  it('maintenance is deterministic with the same map and worked assignments', () => {
    const state = territorialGame(); expect(advancePhase(state, 'PLANNING', 0)).toEqual(advancePhase(state, 'PLANNING', 0));
  });
});
