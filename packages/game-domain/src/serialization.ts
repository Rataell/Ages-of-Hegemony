import { err, ok, type Result } from '@aoh/shared';
import { GameStateSchema, type GameState, type GameRuleError } from './model.js';

export function serializeGameState(state: GameState): string {
  return JSON.stringify(GameStateSchema.parse(state));
}

export function deserializeGameState(json: string): Result<GameState, GameRuleError> {
  try {
    const parsed = GameStateSchema.safeParse(JSON.parse(json) as unknown);
    return parsed.success ? ok(parsed.data) : err({ code: 'INVALID_STATE', message: parsed.error.message });
  } catch {
    return err({ code: 'INVALID_STATE', message: 'Invalid JSON snapshot' });
  }
}
