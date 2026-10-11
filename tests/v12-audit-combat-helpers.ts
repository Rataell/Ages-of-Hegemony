import { PlayerIdSchema, type AlphaState, type AlphaUnit } from '@aoh/game-domain';
import { beginAlphaPlanning, createGame, migrateSnapshotV3ToV4 } from '@aoh/game-engine';

/**
 * Lane B (v1.2 combat audit) fixtures. Same idea as tests/alpha-arena.ts (a straight line of plains) but with N players, per-hex terrain,
 * and NO free +5 movement effect: the shared arena grants every attacker "test-march" (+5 movement), which hides every movement-cost rule.
 */
export const P1 = PlayerIdSchema.parse('p1'), P2 = PlayerIdSchema.parse('p2'), P3 = PlayerIdSchema.parse('p3');
export type Kind = AlphaUnit['kind'];

export interface LineOptions {
  /** Number of players (2 or 3). */
  players?: 2 | 3;
  /** Cities as [cityId, owner, q]. Defaults: p1 at 0, p2 at 7 (and p3 at 10 when three play). */
  cities?: [string, typeof P1, number][];
  length?: number;
  terrain?: Record<number, string>;
  seed?: number;
  /** Give p1 the +5 movement effect that tests/alpha-arena.ts gives (hides movement-cost rules). Default false. */
  march?: boolean;
}

export function line(options: LineOptions = {}): AlphaState {
  const count = options.players ?? 2, length = options.length ?? 12;
  const ids = [P1, P2, P3].slice(0, count);
  const cities = options.cities ?? ([['c1', P1, 0], ['c2', P2, 7], ...(count === 3 ? [['c3', P3, 10]] : [])] as [string, typeof P1, number][]);
  const core = createGame({
    gameId: `v12-combat-${options.seed ?? 5}`, seed: options.seed ?? 5,
    players: ids.map((id, i) => ({ id, name: `Jogador ${i + 1}`, ...(i === 0 ? { resources: { food: 30, materials: 30, wealth: 30, knowledge: 0, influence: 10 } } : {}) })),
    map: Array.from({ length }, (_, q) => ({ id: `${q},0`, q, r: 0, terrain: (options.terrain?.[q] ?? 'PLAINS') as never })),
    initialCities: cities.map(([id, ownerId, q]) => ({ id, ownerId, hexId: `${q},0`, name: `Cidade ${id}` })),
  });
  if (!core.ok) throw new Error(core.error.message);
  const migrated = migrateSnapshotV3ToV4(core.value);
  if (!migrated.ok) throw new Error(migrated.error.message);
  const state = beginAlphaPlanning(migrated.value);
  state.players.forEach(p => { p.knownHexIds = state.core.map.map(t => t.id); p.ambitionsChosen = true; p.contacts = ids.filter(id => id !== p.playerId); });
  state.units = [];
  state.wars = [];
  if (options.march) state.players[0]!.temporaryEffects = [{ source: 'test-march', effect: { kind: 'MOVEMENT', amount: 2 }, round: state.core.round }];
  return state;
}

let counter = 0;
export function put(state: AlphaState, owner: typeof P1, kind: Kind, q: number, id?: string): AlphaUnit {
  const unit = { id: id ?? `${owner}-${kind.toLowerCase()}-${++counter}`, ownerId: owner, kind, hexId: `${q},0` as never, recruitedRound: 1, carrierId: null } as AlphaUnit;
  state.units.push(unit);
  return unit;
}
export const attackOrder = (units: AlphaUnit[], target: number | string, posture: 'ASSAULT' | 'HOLD' | 'MANEUVER' = 'ASSAULT') =>
  ({ id: 'atk', type: 'ATTACK' as const, unitIds: units.map(u => u.id), target: (typeof target === 'number' ? `${target},0` : target) as never, posture });
export const tryValidate = (fn: () => void): string | null => { try { fn(); return null; } catch (error: unknown) { return error instanceof Error ? error.message : String(error); } };
