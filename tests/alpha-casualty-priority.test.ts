import { describe, expect, it } from 'vitest';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame, chooseLosses, defaultCasualtyPriority, resolveBattleWithFaces } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { arena, p1, p2, type Kind } from './alpha-arena.js';
import type { TacticalFace } from '@aoh/game-domain';

// V51B-01 (alternative C): owner-defined casualty priority, read at resolution. Arena field battle at 4,0; defenders belong to p2.
const DEFENDERS: Kind[] = ['INFANTRY', 'GUARD', 'RANGED', 'CAVALRY'];
type Setup = { attackers: Kind[]; attackFaces: TacticalFace; priority?: { order?: Kind[]; byHex?: Record<string, Kind[]> }; attackerPriority?: Kind[]; defenders?: Kind[] };
function battleWith(setup: Setup) {
  const defenders = setup.defenders ?? DEFENDERS;
  const { state, order } = arena({ attackers: setup.attackers, defenders });
  if (setup.priority) Object.assign(state.players[1]!.casualtyPriority, { order: setup.priority.order ?? [], byHex: setup.priority.byHex ?? {} });
  if (setup.attackerPriority) state.players[0]!.casualtyPriority.order = setup.attackerPriority;
  const forced: Record<string, TacticalFace> = {};
  setup.attackers.forEach((_, i) => { forced[`a${i + 1}`] = setup.attackFaces; });
  defenders.forEach((_, i) => { forced[`d${i + 1}`] = 'EMPTY'; });
  resolveBattleWithFaces(state, p1, order, forced);
  return { state, battle: state.battles[0]! };
}
const VICTORY: Pick<Setup, 'attackers' | 'attackFaces'> = { attackers: ['INFANTRY', 'INFANTRY', 'INFANTRY'], attackFaces: 'IMPACT' };
const DECISIVE: Pick<Setup, 'attackers' | 'attackFaces'> = { attackers: ['CAVALRY', 'CAVALRY', 'CAVALRY', 'CAVALRY', 'CAVALRY'], attackFaces: 'IMPACT' };
/** Losses are ids `d<n>`: the n-th defender of the setup. */
const kindsOf = (_state: unknown, ids: string[], defenders: Kind[] = DEFENDERS) => ids.map(id => defenders[Number(id.slice(1)) - 1]);

describe('casualty priority', () => {
  it('without a priority the engine rule is unchanged (weakest first, Cerco last, id tie-break)', () => {
    const { battle } = battleWith({ ...VICTORY });
    expect(battle.outcome).toBe('VICTORY');
    expect(battle.losses).toEqual(['d1']);
    const state = arena({ defenders: ['SIEGE', 'GUARD', 'CAVALRY', 'INFANTRY'] }).state;
    expect(chooseLosses(state, state.units.filter(u => u.ownerId === p2), 3)).toEqual(['d2', 'd4', 'd3']);
  });

  it('one casualty follows the owner priority', () => {
    const { battle, state } = battleWith({ ...VICTORY, priority: { order: ['RANGED', 'GUARD'] } });
    expect(battle.losses).toHaveLength(1);
    expect(kindsOf(state, battle.losses)).toEqual(['RANGED']);
  });

  it('two casualties (decisive) follow the list in order, then fall back to the engine order', () => {
    const decisive = battleWith({ ...DECISIVE, priority: { order: ['CAVALRY', 'GUARD'] } });
    expect(decisive.battle.outcome).toBe('DECISIVE');
    expect(kindsOf(decisive.state, decisive.battle.losses)).toEqual(['CAVALRY', 'GUARD']);
    const incomplete = battleWith({ ...DECISIVE, priority: { order: ['CAVALRY'] } });
    expect(incomplete.battle.losses).toEqual(['d4', 'd1']);
  });

  it('kinds the stack does not have are ignored', () => {
    const { battle, state } = battleWith({ ...VICTORY, priority: { order: ['SIEGE', 'FLEET', 'RANGED'] } });
    expect(kindsOf(state, battle.losses)).toEqual(['RANGED']);
  });

  it('a stack override beats the civilization default', () => {
    const { battle, state } = battleWith({ ...VICTORY, priority: { order: ['RANGED'], byHex: { '4,0': ['GUARD'] } } });
    expect(kindsOf(state, battle.losses)).toEqual(['GUARD']);
  });

  it('a tactical tie costs each side one piece, chosen by each owner priority', () => {
    const attackers: Kind[] = ['INFANTRY', 'GUARD', 'RANGED'];
    const { state, order } = arena({ attackers, defenders: ['INFANTRY', 'GUARD', 'RANGED'], attackPosture: 'HOLD' });
    state.players[0]!.casualtyPriority.order = ['RANGED'];
    state.players[1]!.casualtyPriority.order = ['GUARD'];
    resolveBattleWithFaces(state, p1, order, Object.fromEntries(['a1', 'a2', 'a3', 'd1', 'd2', 'd3'].map(id => [id, 'EMPTY' as TacticalFace])));
    const battle = state.battles[0]!;
    expect(battle.outcome).toBe('TIE');
    expect(battle.losses.slice().sort()).toEqual(['a3', 'd2']);
  });

  it('is deterministic: the same inputs replay to the same record', () => {
    const run = () => battleWith({ ...DECISIVE, priority: { order: ['GUARD', 'RANGED'] } }).battle;
    expect(run()).toEqual(run());
  });

  it('strengthless pieces never jump ahead of fighters', () => {
    const state = arena({ defenders: ['INFANTRY'] }).state;
    state.units.push({ id: 'civ', ownerId: p2, kind: 'PIONEER', hexId: '4,0' as never, recruitedRound: 1 });
    state.players[1]!.casualtyPriority.order = ['PIONEER' as Kind];
    expect(chooseLosses(state, state.units.filter(u => u.ownerId === p2), 1)).toEqual(['d1']);
  });
});

describe('SET_CASUALTY_PRIORITY command', () => {
  const planning = () => {
    const state = beginAlphaPlanning(createAlphaGame({ gameId: 'casualty-cmd', seed: 7, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));
    const home = state.core.players[0]!.civilization.cities[0]!.hexId;
    state.units = [{ id: 'g1', ownerId: p1, kind: 'GUARD', hexId: home as never, recruitedRound: 1 }];
    return { state, home };
  };
  const send = (state: ReturnType<typeof planning>['state'], actor: typeof p1 | typeof p2, command: Record<string, unknown>) => applyAlphaCommand(state, actor, { type: 'SET_CASUALTY_PRIORITY', expectedVersion: state.version, ...command } as never);

  it('stores the list, de-duplicated, as a free action (no Order spent)', () => {
    const { state } = planning();
    const before = JSON.stringify(state.players[0]!.plannedActions);
    const result = send(state, p1, { order: ['RANGED', 'INFANTRY', 'RANGED'] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.players[0]!.casualtyPriority.order).toEqual(['RANGED', 'INFANTRY']);
    expect(JSON.stringify(result.value.players[0]!.plannedActions)).toBe(before);
  });

  it('sets and clears a stack override', () => {
    const { state, home } = planning();
    const set = send(state, p1, { order: ['GUARD'], hexId: home });
    expect(set.ok).toBe(true);
    if (!set.ok) return;
    expect(set.value.players[0]!.casualtyPriority.byHex[home]).toEqual(['GUARD']);
    const cleared = send(set.value, p1, { order: [], hexId: home });
    expect(cleared.ok).toBe(true);
    if (cleared.ok) expect(cleared.value.players[0]!.casualtyPriority.byHex[home]).toBeUndefined();
  });

  it('rejects civil pieces, hexes without own pieces, a confirmed seat and the wrong phase', () => {
    const { state } = planning();
    expect(send(state, p1, { order: ['PIONEER'] }).ok).toBe(false);
    expect(send(state, p1, { order: ['GUARD'], hexId: '999,999' }).ok).toBe(false);
    const confirmed = planning().state; confirmed.players[0]!.ready = true;
    expect(send(confirmed, p1, { order: ['GUARD'] }).ok).toBe(false);
    const other = planning().state; other.phase = 'CONFLICTS';
    expect(send(other, p1, { order: ['GUARD'] }).ok).toBe(false);
  });

  it('projection: the owner sees its priority and the default; rivals never see it', () => {
    const { state } = planning();
    state.players[1]!.casualtyPriority.order = ['SIEGE', 'FLEET', 'RANGED', 'CAVALRY'];
    const mine = alphaPlayerView(state, p1)!;
    expect(mine.casualtyDefault).toEqual(defaultCasualtyPriority(state));
    expect(mine.self.casualtyPriority.order).toEqual([]);
    expect(JSON.stringify(mine).match(/"casualtyPriority"/g)).toHaveLength(1);
    expect(JSON.stringify(mine)).not.toContain('"SIEGE","FLEET","RANGED","CAVALRY"');
  });
});
