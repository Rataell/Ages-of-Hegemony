import { createGame } from '@aoh/game-engine';
import { GameIdSchema, PlayerIdSchema, type GameState } from '@aoh/game-domain';
import type { Result } from '@aoh/shared';

export const gameId = GameIdSchema.parse('test-game');
export const playerId = PlayerIdSchema.parse('player-1');
export const secondPlayerId = PlayerIdSchema.parse('player-2');
export const input = (count = 2) => ({ gameId, seed: 42, players: Array.from({ length: count }, (_, i) => ({ id: `player-${i + 1}`, name: `Player ${i + 1}` })) });
export function unwrap<T, E>(result: Result<T, E>): T {
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}
export const game = (): GameState => unwrap(createGame(input()));
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
