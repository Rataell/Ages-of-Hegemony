import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALPHA_CARDS, AlphaStateSchema } from '@aoh/game-domain';
import { applyAlphaCommand, pendingAttacks, setAlphaPhase } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { completeRound, must } from './alpha-rounds.js';
import { P1, P2, P3, attackOrder, line, put } from './v12-audit-combat-helpers.js';

/**
 * Lane B · what each client sees of a war. IDs (B-nn) match docs/audit/alpha-v1.2-lane-b-combat.md. `it.fails` = REPRO (expected behaviour
 * stated, currently throws). Source-contract tests read the web files as text because the repo has no React test harness for these views.
 */
const web = (file: string) => readFileSync(new URL(`../apps/web/app/alpha/${file}`, import.meta.url), 'utf8');
const reactions = ALPHA_CARDS.filter(card => card.timing === 'REACTION').map(card => card.id);

/** The `game.wars.some(...)` call (up to the closing paren of the predicate) as written in the source. */
const warExpression = (source: string) => { const at = source.indexOf('game.wars.some('); return source.slice(at, source.indexOf(')', source.indexOf('=>', at) + 2) + 2); };

/** Every key path in `value` named `key`. */
function paths(value: unknown, key: string, prefix = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => paths(item, key, `${prefix}[${index}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => [...(k === key ? [`${prefix}.${k}`] : []), ...paths(v, key, `${prefix}.${k}`)]);
  return [];
}
function threeSeats() {
  const state = line({ players: 3, cities: [['c1', P1, 0], ['c2', P2, 4], ['c3', P3, 8]] });
  for (const player of state.players) { state.cards.discarded.push(...player.hand); player.hand = []; }
  return state;
}

describe('B-12 · "at war" is a relation between two civilizations, but the client reads it as "at war with anyone"', () => {
  it('the projection ships the GLOBAL war list to every seat (also wars between others)', () => {
    const state = threeSeats(); state.wars = [[P2, P3]];
    for (const seat of [P1, P2, P3]) expect(alphaPlayerView(state, seat)!.wars).toEqual([[P2, P3]]);
  });
  it.fails('REPRO: alpha-table.tsx hostileTo() checks the war against the viewer (pair must contain self AND the other civilization)', () => {
    const source = web('alpha-table.tsx');
    expect(warExpression(source)).toMatch(/selfId|self\.playerId/); // today: game.wars.some(pair => pair.includes(other)) → B looks "em guerra" with A when B fights C
  });
  it.fails('REPRO: alpha-panels.tsx RelationCard computes war against the viewer (otherwise "Declarar guerra…" disappears for a civilization that fights someone else)', () => {
    const source = web('alpha-panels.tsx');
    expect(warExpression(source)).toMatch(/selfId|self\.playerId|\bself\b/); // today: war=game.wars.some(pair=>pair.includes(otherId))
  });
});

describe('privacy of the order queue and the posture (correct today)', () => {
  it('a rival never receives the queued order, its posture or the defender posture; only the defender is told who hits which hex, and only in CONFLICTS', () => {
    let state = threeSeats(); state.wars = [[P1, P2]];
    const a = put(state, P1, 'INFANTRY', 3, 'a1'); put(state, P2, 'INFANTRY', 4, 'd1');
    state = must(state, P2, { type: 'SET_DEFENSE_POSTURE', posture: 'MANEUVER' });
    state = must(state, P1, { type: 'QUEUE_ORDER', order: { ...attackOrder([a], 4, 'ASSAULT'), id: 'secret-order' } });
    const view = (seat: typeof P1) => alphaPlayerView(state, seat)!;
    expect(JSON.stringify(view(P2))).not.toContain('secret-order');
    expect(JSON.stringify(view(P3))).not.toContain('secret-order');
    expect(view(P2).incomingAttacks).toEqual([]); // not yet: planning
    expect(paths(view(P1), 'defensePosture')).toEqual(['.self.defensePosture']);
    expect(view(P1).self.defensePosture).toBe('HOLD'); // p1's own, not p2's MANEUVER
    expect(paths(view(P3), 'casualtyPriority')).toEqual(['.self.casualtyPriority']);
    setAlphaPhase(state, 'CONFLICTS');
    expect(pendingAttacks(state)).toEqual([{ attackerId: P1, defenderId: P2, target: '4,0', orderId: 'secret-order' }]);
    expect(view(P2).incomingAttacks).toEqual([{ attackerId: P1, target: '4,0' }]);
    expect(view(P3).incomingAttacks).toEqual([]);
    expect(view(P1).incomingAttacks).toEqual([]);
    expect(JSON.stringify(view(P2))).not.toContain('secret-order'); // the defender sees attacker + hex, never the order id, force or posture
    expect(view(P1).orderPreviews['secret-order']!.defender?.posture).toBe('UNKNOWN');
  });
  it('a resolved battle is shown to every seat that sees its hex, with the same record', () => {
    let state = threeSeats(); state.wars = [[P1, P2]];
    const group = Array.from({ length: 3 }, (_, i) => put(state, P1, 'INFANTRY', 3, `a${i + 1}`)); put(state, P2, 'INFANTRY', 4, 'd1');
    state = must(state, P1, { type: 'QUEUE_ORDER', order: attackOrder(group, 4) });
    state = completeRound(state);
    expect(state.battles).toHaveLength(1);
    const seen = [P1, P2, P3].map(seat => alphaPlayerView(state, seat)!.battles);
    expect(seen[0]).toEqual(seen[1]); expect(seen[1]).toEqual(seen[2]);
    expect(seen[0]![0]).toMatchObject({ attackerId: P1, defenderId: P2 });
  });
});

describe('B-13 · CONFLICTS window (characterization)', () => {
  it('UX: a defender with no Reação card in hand is never stopped at CONFLICTS — the attack lands in the same click that closes Planning', () => {
    let state = threeSeats(); state.wars = [[P1, P2]];
    const group = Array.from({ length: 3 }, (_, i) => put(state, P1, 'INFANTRY', 3, `a${i + 1}`)); put(state, P2, 'INFANTRY', 4, 'd1');
    state = must(state, P1, { type: 'QUEUE_ORDER', order: attackOrder(group, 4) });
    for (const seat of [P1, P2, P3]) state = must(state, seat, { type: 'READY' });
    expect(state.core.round).toBe(2); // resolved and the next Planning is already open
    expect(state.battles).toHaveLength(1);
    expect(alphaPlayerView(state, P2)!.incomingAttacks).toEqual([]); // there was never a moment in which p2 was told
  });
  it('with a Reação card the defender (and only the parties) are held at CONFLICTS; SET_DEFENSE_POSTURE and SET_CASUALTY_PRIORITY are refused there', () => {
    let state = threeSeats(); state.wars = [[P1, P2]];
    state.players[1]!.hand = [reactions[0]!]; state.cards.strategyDeck = state.cards.strategyDeck.filter(id => id !== reactions[0]); state.cards.discarded = state.cards.discarded.filter(id => id !== reactions[0]);
    const group = Array.from({ length: 3 }, (_, i) => put(state, P1, 'INFANTRY', 3, `a${i + 1}`)); put(state, P2, 'INFANTRY', 4, 'd1');
    state = must(state, P1, { type: 'QUEUE_ORDER', order: attackOrder(group, 4) });
    for (const seat of [P1, P2, P3]) state = must(state, seat, { type: 'READY' });
    expect(state.phase).toBe('CONFLICTS');
    expect(state.players.map(p => [p.playerId, p.ready])).toEqual([[P1, true], [P2, false], [P3, true]]);
    expect(state.battles).toHaveLength(0);
    expect(alphaPlayerView(state, P2)!.incomingAttacks).toEqual([{ attackerId: P1, target: '4,0' }]);
    for (const command of [{ type: 'SET_DEFENSE_POSTURE', posture: 'MANEUVER' }, { type: 'SET_CASUALTY_PRIORITY', order: ['INFANTRY'], hexId: null }]) {
      expect(applyAlphaCommand(state, P2, { ...command, expectedVersion: state.version })).toMatchObject({ ok: false });
    }
    state = must(state, P2, { type: 'READY' });
    expect(state.battles).toHaveLength(1);
  });
  it('BALANCE/UX: the default attack posture (ASSAULT) loses the circle to the default defence posture (HOLD): +1 for the defender in every un-customised battle', () => {
    const state = threeSeats(); state.wars = [[P1, P2]];
    const a = put(state, P1, 'INFANTRY', 3, 'a1'); put(state, P2, 'INFANTRY', 4, 'd1');
    expect(state.players[1]!.defensePosture).toBe('HOLD');
    expect(attackOrder([a], 4).posture).toBe('ASSAULT');
    expect(state.rules.combat.posture.HOLD.beats).toBe('ASSAULT');
    expect(web('alpha-table.tsx')).toContain("useState('ASSAULT')");
  });
});

describe('B-15 · the battle report the table shows (source contract)', () => {
  it.fails('REPRO: BattleReport lists which side lost which pieces (today only "Peças perdidas: N" with no side)', () => {
    const source = web('alpha-combat.tsx');
    expect(source).toMatch(/attackerUnits|defenderUnits/);
  });
  it.fails('REPRO: BattleReport never prints raw internal piece ids ("unit-p1-12-3: Comando: Salva…")', () => {
    expect(web('alpha-combat.tsx')).not.toContain('{roll.unitId}:');
  });
  it.fails('REPRO: BattleReport says who retreated (the single `retreat` field holds the attacker\'s origin after a defeat and the defender\'s refuge after a win)', () => {
    expect(web('alpha-combat.tsx')).not.toMatch(/battle\.retreat \? `Retirada para \$\{battle\.retreat\}\.`/);
  });
});

describe('payload (informational)', () => {
  it('one battle record is a few KB and every seat receives ALL battles on visible hexes on every poll (no pruning)', () => {
    let state = threeSeats(); state.wars = [[P1, P2]];
    const group = Array.from({ length: 3 }, (_, i) => put(state, P1, 'INFANTRY', 3, `a${i + 1}`)); put(state, P2, 'INFANTRY', 4, 'd1');
    state = must(state, P1, { type: 'QUEUE_ORDER', order: attackOrder(group, 4) });
    state = completeRound(state);
    const record = JSON.stringify(state.battles[0]);
    expect(record.length).toBeLessThan(6000);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
    // 50 identical records through the projection filter: nothing trims them.
    const clones = Array.from({ length: 50 }, (_, i) => ({ ...state.battles[0]!, id: `battle-${i + 2}` }));
    state.battles.push(...clones);
    expect(alphaPlayerView(state, P3)!.battles).toHaveLength(51);
  });
});
