import { CityIdSchema, GameIdSchema, PlayerIdSchema, deserializeGameState, emptyResourcePool, serializeGameState, type RoundPhase } from '@aoh/game-domain';
import type { Result } from '@aoh/shared';
import { GameService, playerView } from './game-service.js';
import { InMemoryGameRepository } from './repository.js';
import { migrateSnapshotV2ToV3 } from '@aoh/game-engine';
import { snapshotV2 } from './fixtures/snapshot-v2.js';

function unwrap<T>(result: Result<T, { message: string }>): T {
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

// A fresh, deterministic, server-only scenario. No shared match or real user data.
export async function buildDebugInspection() {
  const repository = new InMemoryGameRepository();
  const service = new GameService(repository);
  const gameId = GameIdSchema.parse('civilization-demo');
  const playerId = PlayerIdSchema.parse('player-1');
  const cityId = CityIdSchema.parse('first-city');
  let state = unwrap(await service.create({
    gameId, seed: 42,
    players: [{ id: playerId, name: 'Civilização de demonstração', resources: { ...emptyResourcePool(), food: 10, materials: 20 } }, { id: 'player-2', name: 'Civilização reservada' }],
    map: [{ id: '0,0', q: 0, r: 0 }],
    initialCities: [{ id: cityId, ownerId: playerId, hexId: '0,0', name: 'Aurora' }],
  }));
  const trace = ['CREATE_GAME + INITIAL_CITY'];
  state = unwrap(await service.advance(gameId, 'PLANNING', state.version));
  let view = unwrap(await service.submit(gameId, { playerId }, { type: 'ADOPT_GOVERNMENT', playerId, government: 'MONARCHY', expectedVersion: state.version }));
  trace.push('ADOPT_GOVERNMENT: MONARCHY');
  view = unwrap(await service.submit(gameId, { playerId }, { type: 'ASSIGN_POPULATION', playerId, cityId, workers: { producers: 2, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned: 0 }, expectedVersion: view.version }));
  trace.push('ASSIGN_POPULATION: 2 PRODUCERS');
  // Default threshold 10; two producers generate 4 food and consume 2 per cycle.
  for (let cycle = 0; cycle < 5; cycle += 1) {
    let version = view.version;
    for (const phase of ['RESOLUTION', 'REACTION', 'END_ROUND', 'MAINTENANCE', 'PLANNING'] satisfies RoundPhase[]) {
      state = unwrap(await service.advance(gameId, phase, version));
      version = state.version;
    }
    const projected = playerView(state, playerId);
    if (!projected) throw new Error('Missing demonstration player');
    view = projected;
  }
  trace.push('5 MAINTENANCES: production → consumption → population 3');
  view = unwrap(await service.submit(gameId, { playerId }, { type: 'SPECIALIZE_CITY', playerId, cityId, specialization: 'AGRARIAN', expectedVersion: view.version }));
  trace.push('SPECIALIZE_CITY: AGRARIAN');
  unwrap(await service.submit(gameId, { playerId }, { type: 'DEVELOP_CITY', playerId, cityId, expectedVersion: view.version }));
  trace.push('DEVELOP_CITY: 2 (5 MATERIALS)');
  const saved = await repository.find(gameId);
  if (!saved) throw new Error('Missing demonstration snapshot');
  const restored = unwrap(deserializeGameState(serializeGameState(saved)));
  if (serializeGameState(restored) !== serializeGameState(saved)) throw new Error('Snapshot round-trip changed the state');
  const restoredView = playerView(restored, playerId);
  if (!restoredView) throw new Error('Missing restored player');
  trace.push('SERIALIZE → RESTORE: identical');
  return { view: restoredView, trace };
}

export async function buildTerritoryInspection() {
  const repository = new InMemoryGameRepository(); const service = new GameService(repository);
  const gameId = GameIdSchema.parse('territorial-demo'); const playerId = PlayerIdSchema.parse('player-1');
  const cityId = CityIdSchema.parse('capital');
  let state = unwrap(await service.create({
    gameId, seed: 42,
    players: [{ id: playerId, name: 'Civilização territorial', resources: { ...emptyResourcePool(), food: 30, materials: 50, wealth: 20, influence: 10 } }, { id: 'player-2', name: 'Civilização reservada', resources: { ...emptyResourcePool(), food: 20 } }],
    map: [{ id: '0,0', q: 0, r: 0, terrain: 'PLAINS' }, { id: '1,0', q: 1, r: 0, terrain: 'PLAINS', features: ['RIVER'] }, { id: '0,1', q: 0, r: 1, terrain: 'FOREST', features: ['TIMBER'] }, { id: '2,0', q: 2, r: 0, terrain: 'HILLS', features: ['STONE'] }, { id: '1,-1', q: 1, r: -1, terrain: 'COAST', features: ['FISH'] }, { id: '4,0', q: 4, r: 0, terrain: 'FOREST' }],
    initialCities: [{ id: cityId, ownerId: playerId, hexId: '0,0', name: 'Aurora', workers: { producers: 2, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned: 0 } }, { id: 'hidden-capital', ownerId: 'player-2', hexId: '4,0', name: 'Cidade reservada' }],
  }));
  const trace = ['CREATE_GAME: capital + explicit map'];
  state = unwrap(await service.advance(gameId, 'PLANNING', state.version));
  async function send(command: Record<string, unknown>) {
    unwrap(await service.submit(gameId, { playerId }, { ...command, playerId, expectedVersion: state.version }));
    const saved = await repository.find(gameId); if (!saved) throw new Error('Missing demo game'); state = saved;
  }
  async function maintenanceCycle() {
    for (const phase of ['RESOLUTION', 'REACTION', 'END_ROUND', 'MAINTENANCE', 'PLANNING'] as const) state = unwrap(await service.advance(gameId, phase, state.version));
  }
  await send({ type: 'CLAIM_HEX', cityId, hexId: '1,0' });
  await send({ type: 'ASSIGN_WORKED_HEXES', cityId, hexIds: ['1,0'] });
  await send({ type: 'IMPROVE_HEX', hexId: '1,0', improvement: 'FARM' });
  await send({ type: 'CLAIM_HEX', cityId, hexId: '0,1' });
  await send({ type: 'ASSIGN_WORKED_HEXES', cityId, hexIds: ['1,0', '0,1'] });
  await maintenanceCycle();
  trace.push('CLAIM → WORK → FARM → MAINTENANCE: 5 food + 2 materials');
  await send({ type: 'BUILD_DISTRICT', cityId, district: 'AGRARIAN' });
  await send({ type: 'BUILD_BUILDING', cityId, building: 'GRANARY' });
  await send({ type: 'SPECIALIZE_CITY', cityId, specialization: 'AGRARIAN' });
  await send({ type: 'DEVELOP_CITY', cityId }); await send({ type: 'DEVELOP_CITY', cityId });
  trace.push('AGRARIAN + GRANARY + specialization; development 3 enables radius 2');
  await send({ type: 'CLAIM_HEX', cityId, hexId: '2,0' });
  await send({ type: 'FOUND_CITY', cityId: 'frontier-city', hexId: '2,0', name: 'Fronteira' });
  await maintenanceCycle();
  trace.push('CLAIM EXPANSION → FOUND_CITY → MAINTENANCE → ADMINISTRATION');
  const restored = unwrap(deserializeGameState(serializeGameState(state)));
  if (serializeGameState(restored) !== serializeGameState(state)) throw new Error('v3 round-trip mismatch');
  const view = playerView(restored, playerId); if (!view) throw new Error('Missing player projection');
  const migrated = unwrap(migrateSnapshotV2ToV3(snapshotV2));
  if (serializeGameState(unwrap(deserializeGameState(serializeGameState(migrated)))) !== serializeGameState(migrated)) throw new Error('Migrated round-trip mismatch');
  trace.push('SERIALIZE v3 → RESTORE: identical', 'MIGRATE v2 → v3: UNKNOWN terrain, city center inferred');
  return { view, trace, migration: { from: 2, to: migrated.schemaVersion, terrain: migrated.map[0]?.terrain, controller: migrated.map[0]?.controllerCityId } };
}
