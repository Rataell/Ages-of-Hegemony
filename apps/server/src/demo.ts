import { GameIdSchema, PlayerIdSchema, deserializeGameState, serializeGameState, type RoundPhase } from '@aoh/game-domain';
import { GameService } from './game-service.js';
import { InMemoryGameRepository } from './repository.js';
import type { Result } from '@aoh/shared';

function unwrap<T>(result: Result<T, { message: string }>): T {
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}
const repository = new InMemoryGameRepository();
const service = new GameService(repository);
const gameId = GameIdSchema.parse('demo-game');
const playerId = PlayerIdSchema.parse('player-1');
let state = unwrap(await service.create({ gameId, seed: 42, players: [{ id: playerId, name: 'Jogador 1' }, { id: 'player-2', name: 'Jogador 2' }] }));
state = unwrap(await service.advance(gameId, 'PLANNING', state.version));
const view = unwrap(await service.submit(gameId, { playerId }, { type: 'SUBMIT_ORDER', expectedVersion: state.version, order: { id: 'order-1', playerId, type: 'EXPLORE' } }));
let version = view.version;
for (const phase of ['RESOLUTION', 'REACTION', 'END_ROUND', 'MAINTENANCE'] satisfies RoundPhase[]) {
  state = unwrap(await service.advance(gameId, phase, version));
  version = state.version;
}
const restored = unwrap(deserializeGameState(serializeGameState(state)));
console.log(JSON.stringify({ gameId, round: restored.round, phase: restored.phase, version: restored.version, events: restored.eventLog.map((event) => event.type), note: 'Ordem registrada; efeitos de EXPLORE aguardam especificação.' }, null, 2));
