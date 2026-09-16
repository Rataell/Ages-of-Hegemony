import { describe, expect, it } from 'vitest';
import { GameRulesConfigSchema, GameStateSchema, createDefaultRules, deserializeGameState, serializeGameState } from '@aoh/game-domain';
import { advancePhase, applyCommand } from '@aoh/game-engine';
import { GameService, playerView } from '../apps/server/src/game-service.js';
import { InMemoryGameRepository } from '../apps/server/src/repository.js';
import { buildDebugInspection } from '../apps/server/src/debug-scenario.js';
import { gameId, playerId, secondPlayerId, unwrap } from './helpers.js';
import { cityGame, cityId, cityInput, enemyCityId, firstCity, firstPlayer, manage, planning, workers } from './civilization-helpers.js';

describe('civilization serialization and invariants', () => {
  it('round trips every new field, including actual maintenance and management events', () => {
    let state = manage(planning(), { type: 'ADOPT_GOVERNMENT', government: 'REPUBLIC' });
    state = manage(state, { type: 'SPECIALIZE_CITY', cityId, specialization: 'ADMINISTRATIVE' });
    state = manage(state, { type: 'DEVELOP_CITY', cityId });
    const restored = unwrap(deserializeGameState(serializeGameState(state)));
    expect(restored).toEqual(state);
    expect(firstPlayer(restored).civilization).toMatchObject({ government: 'REPUBLIC', administrativeCapacity: 5, administrativeLoad: 1 });
    expect(firstCity(restored)).toMatchObject({ population: 2, stability: 60, development: 2, specialization: 'ADMINISTRATIVE', growthProgress: 2, workers: workers(2) });
  });
  it('rejects legacy snapshots explicitly without silently clamping or overwriting them', () => {
    const json = JSON.stringify({ schemaVersion: 1, original: 'untouched' });
    expect(deserializeGameState(json)).toMatchObject({ ok: false, error: { code: 'SNAPSHOT_MIGRATION_REQUIRED' } });
    const result = deserializeGameState(json);
    if (result.ok) throw new Error('Expected compatibility notice');
    expect(result.error.message).toContain('9d63e69');
    expect(deserializeGameState('{"schemaVersion":999}')).toMatchObject({ ok: false, error: { code: 'UNSUPPORTED_SCHEMA' } });
  });
  it.each(['population', 'allocation', 'stability-low', 'stability-high', 'development-low', 'development-high', 'capacity', 'load', 'growth', 'capital', 'status', 'revision-gap'])('rejects the %s invariant violation on load and command input', (kind) => {
    const state = planning(); const city = firstCity(state); const civ = firstPlayer(state).civilization;
    switch (kind) {
      case 'population': city.population = -1; break;
      case 'allocation': city.workers.unassigned = 1; break;
      case 'stability-low': city.stability = -1; break;
      case 'stability-high': city.stability = 101; break;
      case 'development-low': city.development = 0; break;
      case 'development-high': city.development = 6; break;
      case 'capacity': civ.administrativeCapacity = -1; break;
      case 'load': civ.administrativeLoad = -1; break;
      case 'growth': city.growthProgress = 11; break;
      case 'capital': civ.capitalCityId = enemyCityId; break;
      case 'status': civ.administrationStatus = 'OVEREXTENDED'; break;
      case 'revision-gap': state.version = 2; break;
    }
    expect(deserializeGameState(JSON.stringify(state)).ok).toBe(false);
    expect(applyCommand(state, { type: 'DEVELOP_CITY', playerId, cityId, expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'INVALID_STATE' } });
  });
  it('validates rules and isolates nested defaults between matches', () => {
    const a = cityGame(); const b = cityGame();
    a.config.governmentModifiers.MONARCHY.capacityFlat = 99;
    expect(b.config.governmentModifiers.MONARCHY.capacityFlat).toBe(2);
    for (const update of [
      { growthThreshold: 0 }, { foodPerPopulation: -1 }, { growthThreshold: 0.5 },
      { developmentPopulationCaps: [3, 2, 8, 12, 16] },
      { stabilityThresholds: { criticalMax: 40, unstableMax: 39, tenseMax: 59, stableMax: 79 } },
      { administrativeRules: { ...a.config.administrativeRules, developmentStep: 0 } },
    ]) expect(GameRulesConfigSchema.safeParse({ ...createDefaultRules(), ...update }).success).toBe(false);
  });
});

describe('new player commands across the server boundary', () => {
  it('persists commands, rejects identity forgery and hides foreign-city existence', async () => {
    const repository = new InMemoryGameRepository(); const service = new GameService(repository);
    unwrap(await service.create(cityInput()));
    const state = unwrap(await service.advance(gameId, 'PLANNING', 0));
    const before = await repository.find(gameId);
    expect(await service.submit(gameId, { playerId }, { type: 'ASSIGN_POPULATION', playerId: secondPlayerId, cityId: enemyCityId, workers: workers(2), expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect(await service.submit(gameId, { playerId }, { type: 'DEVELOP_CITY', playerId, cityId: enemyCityId, expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'CITY_NOT_OWNED' } });
    expect(await repository.find(gameId)).toEqual(before);
    const view = unwrap(await service.submit(gameId, { playerId }, { type: 'ADOPT_GOVERNMENT', playerId, government: 'CONFEDERATION', expectedVersion: state.version }));
    expect(view.player.civilization.government).toBe('CONFEDERATION');
    expect(view.commandPoints).toBe(3);
    expect((await repository.find(gameId))?.version).toBe(state.version + 1);
  });
  it('allows only one competing management write and one development charge', async () => {
    const repository = new InMemoryGameRepository(); const service = new GameService(repository);
    unwrap(await service.create(cityInput()));
    unwrap(await service.advance(gameId, 'PLANNING', 0));
    const command = { type: 'DEVELOP_CITY', playerId, cityId, expectedVersion: 1 };
    const results = await Promise.all([service.submit(gameId, { playerId }, command), service.submit(gameId, { playerId }, command)]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toMatchObject([{ error: { code: 'VERSION_CONFLICT' } }]);
    const saved = await repository.find(gameId);
    if (!saved) throw new Error('Missing saved game');
    expect(firstCity(saved).development).toBe(2);
    expect(firstPlayer(saved).resources.materials).toBe(45);
    expect(GameStateSchema.safeParse(saved).success).toBe(true);
  });
  it('exposes only explicit public fields of visible cities and known governments', () => {
    const state = planning();
    const own = playerView(state, playerId);
    expect(own?.visibleCities).toEqual([]);
    expect(own?.knownGovernments).toEqual([]);
    const visible = playerView(state, playerId, { visibleCityIds: [enemyCityId], knownGovernmentPlayerIds: [secondPlayerId] });
    expect(visible?.visibleCities).toEqual([{ id: enemyCityId, ownerId: secondPlayerId, hexId: '2,0', name: 'Second City', population: 2, development: 1, specialization: null }]);
    expect(visible?.knownGovernments).toEqual([{ playerId: secondPlayerId, government: 'PROTO_GOVERNANCE' }]);
    expect(visible?.visibleCities[0]).not.toHaveProperty('workers');
    expect(visible?.visibleCities[0]).not.toHaveProperty('growthProgress');
    expect(visible).not.toHaveProperty('eventLog');
    expect(visible).not.toHaveProperty('seed');
    expect(visible).not.toHaveProperty('players');
  });
  it('serializes and restores the full demonstration, and the debug UI receives a private projection', async () => {
    const first = await buildDebugInspection(); const second = await buildDebugInspection();
    expect(first).toEqual(second);
    expect(first.view.player.civilization).toMatchObject({ government: 'MONARCHY', administrativeCapacity: 5, administrativeLoad: 1 });
    expect(first.view.player.civilization.cities[0]).toMatchObject({ population: 3, development: 2, specialization: 'AGRARIAN', workers: { producers: 2, unassigned: 1 } });
    expect(first.view.player.resources).toMatchObject({ food: 18, materials: 15 });
    expect(first.view).not.toHaveProperty('eventLog');
    expect(first.trace.at(-1)).toBe('SERIALIZE → RESTORE: identical');
  });
  it('a rejected repeat maintenance cannot produce resources twice', () => {
    const initial = cityGame(); const after = unwrap(advancePhase(initial, 'PLANNING', initial.version));
    const snapshot = serializeGameState(after);
    expect(advancePhase(after, 'PLANNING', initial.version)).toMatchObject({ ok: false, error: { code: 'VERSION_CONFLICT' } });
    expect(serializeGameState(after)).toBe(snapshot);
  });
});
