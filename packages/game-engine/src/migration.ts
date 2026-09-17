import { GameStateSchema, SnapshotV2Schema, createDefaultTerritoryRules, type GameRuleError, type GameState, type HexTile } from '@aoh/game-domain';
import { err, ok, type Result } from '@aoh/shared';
import { refreshAdministration } from './civilization.js';

export function migrateSnapshotV2ToV3(input: unknown): Result<GameState, GameRuleError> {
  const parsed = SnapshotV2Schema.safeParse(input);
  if (!parsed.success) return err({ code: 'INVALID_STATE', message: `Invalid v2 snapshot: ${parsed.error.message}` });
  const old = parsed.data;
  const cities = old.players.flatMap((player) => player.civilization.cities);
  const config = { ...old.config, territory: createDefaultTerritoryRules() };
  const map: HexTile[] = old.map.map((hex) => {
    const city = cities.find((city) => city.hexId === hex.id);
    return { ...hex, terrain: 'UNKNOWN', features: [], ownerId: city?.ownerId ?? null, controllerCityId: city?.id ?? null, improvement: null };
  });
  try {
    const next = { ...old, schemaVersion: 3, config, map, players: old.players.map((player) => ({ ...player, civilization: refreshAdministration({ ...player.civilization, cities: player.civilization.cities.map((city) => ({ ...city, workedHexIds: [], districts: [], buildings: [] })) }, config, map) })) };
    const validated = GameStateSchema.safeParse(next);
    return validated.success ? ok(validated.data) : err({ code: 'INVALID_STATE', message: validated.error.message });
  } catch (error: unknown) {
    if (error instanceof RangeError) return err({ code: 'NUMERIC_OVERFLOW', message: error.message });
    throw error;
  }
}
