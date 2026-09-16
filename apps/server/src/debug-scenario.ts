import { CityIdSchema, GameIdSchema, PlayerIdSchema, deserializeGameState, emptyResourcePool, serializeGameState, type RoundPhase } from '@aoh/game-domain';
import type { Result } from '@aoh/shared';
import { GameService, playerView } from './game-service.js';
import { InMemoryGameRepository } from './repository.js';

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
