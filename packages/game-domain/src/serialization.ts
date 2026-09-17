import { err, ok, type Result } from '@aoh/shared';
import { GameStateSchema, type GameState, type GameRuleError } from './model.js';

export function serializeGameState(state: GameState): string {
  return JSON.stringify(GameStateSchema.parse(state));
}

export function deserializeGameState(json: string): Result<GameState, GameRuleError> {
  try {
    const value: unknown = JSON.parse(json);
    if (typeof value === 'object' && value !== null && 'schemaVersion' in value) {
      if (value.schemaVersion === 1) return err({ code: 'SNAPSHOT_MIGRATION_REQUIRED', message: 'Snapshot v1 belongs to Round 1. Keep the original and load it with commit 9d63e69; v0.3 requires explicit scenario conversion (workers, stability, development, government and rules). No automatic lossy migration is performed.' });
      if (value.schemaVersion === 2) return err({ code: 'SNAPSHOT_MIGRATION_REQUIRED', message: 'Run migrateSnapshotV2ToV3 explicitly and save the converted snapshot; the original remains unchanged.' });
      if (value.schemaVersion !== 3) return err({ code: 'UNSUPPORTED_SCHEMA', message: 'Unsupported snapshot schema; expected schemaVersion 3' });
    }
    const parsed = GameStateSchema.safeParse(value);
    return parsed.success ? ok(parsed.data) : err({ code: 'INVALID_STATE', message: parsed.error.message });
  } catch {
    return err({ code: 'INVALID_STATE', message: 'Invalid JSON snapshot' });
  }
}
