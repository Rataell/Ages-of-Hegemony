import { PlayerIdSchema, type AlphaUnit, type BattlePosture, type TacticalFace } from '@aoh/game-domain';
import { beginAlphaPlanning, createGame, migrateSnapshotV3ToV4, resolveBattleWithFaces } from '@aoh/game-engine';

export const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
export type Kind = AlphaUnit['kind'];
export interface Arena { attackers?: Kind[]; defenders?: Kind[]; city?: boolean; far?: boolean; terrain?: string; attackPosture?: BattlePosture; defensePosture?: BattlePosture; fort?: { level: string; state: string }; seed?: number }

/** Ten plains in a row. p1's city at 0,0, p2's at 7,0. Field battles at 4,0 (supplied) or 6,0 (attackers unsupplied); city battles at 7,0. */
export function arena(options: Arena = {}) {
  const core = createGame({ gameId: `combat-${options.seed ?? 5}`, seed: options.seed ?? 5, players: [{ id: p1, name: 'Um', resources: { food: 30, materials: 30, wealth: 30, knowledge: 0, influence: 10 } }, { id: p2, name: 'Dois' }],
    map: Array.from({ length: 10 }, (_, q) => ({ id: `${q},0`, q, r: 0, terrain: 'PLAINS' })),
    initialCities: [{ id: 'c1', ownerId: p1, hexId: '0,0', name: 'Aurora' }, { id: 'c2', ownerId: p2, hexId: '7,0', name: 'Fronteira' }] });
  if (!core.ok) throw new Error(core.error.message);
  const migrated = migrateSnapshotV3ToV4(core.value); if (!migrated.ok) throw new Error(migrated.error.message);
  const state = beginAlphaPlanning(migrated.value);
  state.players.forEach(p => { p.knownHexIds = state.core.map.map(t => t.id); });
  state.wars = [[p1, p2]];
  const attackers = options.attackers ?? ['INFANTRY'], defenders = options.defenders ?? ['INFANTRY'];
  const target = options.city ? '7,0' : options.far ? '6,0' : '4,0';
  const from = options.city ? '6,0' : options.far ? '5,0' : '3,0';
  if (options.terrain) state.core.map.find(t => t.id === target)!.terrain = options.terrain as never;
  state.units = [
    ...attackers.map((kind, i) => ({ id: `a${i + 1}`, ownerId: p1, kind, hexId: from as never, recruitedRound: 1 })),
    ...defenders.map((kind, i) => ({ id: `d${i + 1}`, ownerId: p2, kind, hexId: target as never, recruitedRound: 1 })),
  ];
  if (options.city) state.core.map.filter(t => ['1,0', '2,0', '3,0', '4,0', '5,0', '6,0'].includes(t.id)).forEach(t => { t.ownerId = p1; });
  if (options.fort) state.cities.find(c => c.cityId === 'c2')!.fortification = options.fort as never;
  state.players[0]!.temporaryEffects = [{ source: 'test-march', effect: { kind: 'MOVEMENT', amount: 5 }, round: state.core.round }];
  state.players[1]!.defensePosture = options.defensePosture ?? 'HOLD';
  const order = { id: 'atk', type: 'ATTACK' as const, unitIds: attackers.map((_, i) => `a${i + 1}`), target: target as never, posture: options.attackPosture ?? 'ASSAULT' };
  return { state, order, target };
}
export const faces = (face: TacticalFace, ...ids: string[]) => Object.fromEntries(ids.map(id => [id, face])) as Record<string, TacticalFace>;
export const entry = (list: { source: string; amount: number }[], source: string | RegExp) => list.find(item => typeof source === 'string' ? item.source === source : source.test(item.source));
export const amount = (list: { source: string; amount: number }[], source: string | RegExp) => entry(list, source)?.amount ?? 0;
export const fight = (options: Arena, forced?: Record<string, TacticalFace>) => {
  const { state, order } = arena(options);
  resolveBattleWithFaces(state, p1, order, forced);
  return { state, battle: state.battles[0]! };
};

