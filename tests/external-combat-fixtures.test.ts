import { describe, expect, it } from 'vitest';
import { ALPHA_CARDS, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame, hexDistance, resolveBattleWithFaces } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { amount, arena, entry, faces, fight, p1, p2 } from './alpha-arena.js';
import { must } from './alpha-rounds.js';

// EXTERNAL ALPHA audit: short deterministic combat fixtures (forced dice faces; arena = ten plains, p1 city 0,0, p2 city 7,0).
const IMPACTS = (n: number) => faces('IMPACT', ...Array.from({ length: n }, (_, i) => `a${i + 1}`));
const inf = (n: number) => Array.from({ length: n }, () => 'INFANTRY' as const);

describe('Choque Tático', () => {
  it('A simple battle: one record with dice, totals, Δ and a winner; arithmetic is exact', () => {
    const { battle } = fight({}, faces('EMPTY', 'a1', 'd1'));
    expect(battle).toMatchObject({ attackerId: p1, defenderId: p2, attackerUnits: ['a1'], defenderUnits: ['d1'] });
    expect(battle.attackerTactical).toHaveLength(1); expect(battle.defenderTactical).toHaveLength(1);
    expect(battle.delta).toBe(battle.attackTotal - battle.defenseTotal);
    expect(battle.attackTotal).toBe(battle.attackStrength + battle.attackModifiers);
  });

  it('B tie: |Δ| <= 1 is TIE (Δ 0 and Δ +1 by posture), defender holds, lone pieces lose nothing', () => {
    const zero = fight({ attackPosture: 'HOLD', defensePosture: 'HOLD' }, faces('EMPTY', 'a1', 'd1'));
    expect(zero.battle).toMatchObject({ delta: 0, outcome: 'TIE', winnerId: p2, losses: [] });
    // ASSAULT beats MANEUVER in the circular postures? Whichever beats, the advantage is exactly +1.
    const cfg = zero.state.rules.combat;
    const win = (['ASSAULT', 'HOLD', 'MANEUVER'] as const).find(a => cfg.posture[a].beats === 'HOLD')!;
    const one = fight({ attackPosture: win, defensePosture: 'HOLD' }, faces('EMPTY', 'a1', 'd1'));
    expect(one.battle.delta).toBe(1); expect(one.battle.outcome).toBe('TIE'); expect(one.battle.winnerId).toBe(p2); expect(one.battle.losses).toEqual([]);
  });

  it('C win Δ 2-4: VICTORY, loser loses exactly 1, attacker advances', () => {
    const { battle, state } = fight({ attackPosture: 'HOLD', attackers: inf(3), defenders: inf(3) }, { ...IMPACTS(3), ...faces('EMPTY', 'd1', 'd2', 'd3') });
    expect(battle.delta).toBeGreaterThanOrEqual(2); expect(battle.delta).toBeLessThanOrEqual(4);
    expect(battle).toMatchObject({ outcome: 'VICTORY', winnerId: p1 });
    expect(battle.losses).toHaveLength(1);
    expect(state.units.filter(u => u.ownerId === p1).every(u => u.hexId === '4,0')).toBe(true);
  });

  it('D decisive Δ >= 5: DECISIVE, loser loses 2', () => {
    const { battle } = fight({ attackers: inf(4), defenders: inf(3) }, { ...IMPACTS(4), ...faces('EMPTY', 'd1', 'd2', 'd3') });
    expect(battle.delta).toBeGreaterThanOrEqual(5);
    expect(battle.outcome).toBe('DECISIVE');
    expect(battle.losses).toHaveLength(2);
  });

  it('E two casualties: both pieces leave the table, only from the loser', () => {
    const { battle, state } = fight({ attackers: inf(4), defenders: inf(3) }, { ...IMPACTS(4), ...faces('EMPTY', 'd1', 'd2', 'd3') });
    expect(battle.losses.every(id => id.startsWith('d'))).toBe(true);
    expect(new Set(battle.losses).size).toBe(2);
    expect(state.units.filter(u => u.ownerId === p2)).toHaveLength(1);
    expect(state.units.filter(u => u.ownerId === p1)).toHaveLength(4);
  });

  it('F retreat: a beaten defender falls back to a free neighbour, a beaten attacker to its origin', () => {
    const win = fight({ attackers: inf(4), defenders: inf(4) }, { ...IMPACTS(4), ...faces('EMPTY', 'd1', 'd2', 'd3', 'd4') });
    expect(win.battle.retreat).not.toBeNull();
    expect(win.battle.retreat).not.toBe('4,0');
    expect(hexDistance(win.state.core.map.find(t => t.id === '4,0')!, win.state.core.map.find(t => t.id === win.battle.retreat)!)).toBe(1);
    expect(win.state.units.filter(u => u.ownerId === p2).every(u => u.hexId === win.battle.retreat)).toBe(true);
    const lose = fight({ defenders: inf(3) }, { a1: 'EMPTY', ...faces('IMPACT', 'd1', 'd2', 'd3') });
    expect(lose.battle.winnerId).toBe(p2);
    expect(lose.battle.retreat).toBe('3,0');
  });

  it('G city capture: beating the last defenders of a city flips its owner', () => {
    const { battle, state } = fight({ city: true, attackers: inf(4), defenders: [] }, IMPACTS(4));
    expect(battle.winnerId).toBe(p1);
    expect(state.cities.find(c => c.cityId === 'c2')!.currentOwnerId).toBe(p1);
  });

  it('H Guarda: a Guarda face cancels enemy impacts (2 per guard under HOLD), never below zero', () => {
    const { battle } = fight({ attackers: inf(3), defenders: ['GUARD'], defensePosture: 'HOLD' }, { ...IMPACTS(3), d1: 'GUARD' });
    expect(amount(battle.attackBreakdown, /^Guardas inimigas anularam 2/)).toBe(-4);
    const none = fight({ attackers: inf(1), defenders: ['GUARD'], defensePosture: 'HOLD' }, { a1: 'EMPTY', d1: 'GUARD' });
    expect(entry(none.battle.attackBreakdown, /^Guardas/)).toBeUndefined();
  });

  it('I Cavalaria: Comando gives Flanco on plains and nothing in a forest', () => {
    expect(amount(fight({ attackers: ['CAVALRY'] }, { a1: 'COMMAND', d1: 'EMPTY' }).battle.attackBreakdown, /^Flanco/)).toBe(1);
    expect(entry(fight({ attackers: ['CAVALRY'], terrain: 'FOREST' }, { a1: 'COMMAND', d1: 'EMPTY' }).battle.attackBreakdown, /^Flanco/)).toBeUndefined();
  });

  it('J Arqueiro: Comando becomes Salva (+1 Poder)', () => {
    expect(amount(fight({ attackers: ['RANGED'] }, { a1: 'COMMAND', d1: 'EMPTY' }).battle.attackBreakdown, /^Salva/)).toBe(1);
  });

  it('K Cerco: Comando opens the wall (INTACT -> DAMAGED) and adds Brecha Poder; no wall, no effect', () => {
    const { battle, state } = fight({ city: true, attackers: ['SIEGE'], fort: { level: 'STONE_WALL', state: 'INTACT' } }, { a1: 'COMMAND', d1: 'EMPTY' });
    expect(amount(battle.attackBreakdown, /^Brecha/)).toBe(2);
    expect(state.cities.find(c => c.cityId === 'c2')!.fortification.state).toBe('DAMAGED');
    expect(entry(fight({ attackers: ['SIEGE'] }, { a1: 'COMMAND', d1: 'EMPTY' }).battle.attackBreakdown, /^Brecha/)).toBeUndefined();
  });

  it('L fortification: level bonus when intact, halved when damaged, zero when breached', () => {
    const run = (st: string) => amount(fight({ city: true, fort: { level: 'FORTRESS', state: st } }, faces('EMPTY', 'a1', 'd1')).battle.defenseBreakdown, 'Fortificação');
    const full = run('INTACT');
    expect(full).toBeGreaterThan(0);
    expect(run('DAMAGED')).toBe(Math.floor(full * 50 / 100));
    expect(run('DAMAGED')).toBeLessThan(full);
    expect(run('BREACHED')).toBe(0);
  });

  it('M supply: a supplied attacker pays no penalty; only an out-of-supply one pays -2', () => {
    expect(entry(fight({}, faces('EMPTY', 'a1', 'd1')).battle.attackBreakdown, 'Sem suprimento')).toBeUndefined();
    expect(amount(fight({ far: true }, faces('EMPTY', 'a1', 'd1')).battle.attackBreakdown, 'Sem suprimento')).toBe(-2);
  });

  it('N casualty priority: owner list decides which piece dies, else weakest first', () => {
    const run = (order: string[]) => {
      const { state, order: atk } = arena({ attackers: inf(3), defenders: ['INFANTRY', 'GUARD', 'RANGED', 'CAVALRY'] });
      state.players[1]!.casualtyPriority.order = order as never;
      resolveBattleWithFaces(state, p1, atk, { ...IMPACTS(3), ...faces('EMPTY', 'd1', 'd2', 'd3', 'd4') });
      return state.battles[0]!;
    };
    expect(run([]).losses).toEqual(['d1']);
    expect(run(['RANGED']).losses).toEqual(['d3']);
    expect(run(['CAVALRY']).losses).toEqual(['d4']);
  });
});

describe('Reação (CONFLICTS phase)', () => {
  const reactions = ALPHA_CARDS.filter(c => c.timing === 'REACTION' && c.effect?.kind === 'STRENGTH');
  function conflict(): AlphaState {
    let state = beginAlphaPlanning(createAlphaGame({ gameId: 'ext-reaction', seed: 5, preset: 'QUICK', players: [1, 2, 3].map(i => ({ id: `p${i}`, name: `P${i}` })) }));
    for (const player of state.players) { state.cards.discarded.push(...player.hand); player.hand = []; player.ambitionsChosen = true; player.contacts = state.players.map(o => o.playerId).filter(id => id !== player.playerId); }
    const hand = (id: string, ids: string[]) => { for (const card of ids) { state.cards.strategyDeck = state.cards.strategyDeck.filter(x => x !== card); state.cards.discarded = state.cards.discarded.filter(x => x !== card); } state.players.find(p => p.playerId === id)!.hand = ids; };
    hand('p1', [reactions[0]!.id, reactions[1]!.id]); hand('p2', [reactions[2]!.id]);
    const target = state.units.find(u => u.ownerId === 'p2')!;
    const land = state.core.map.find(t => hexDistance(t, state.core.map.find(x => x.id === target.hexId)!) === 1 && ['PLAINS', 'FOREST', 'HILLS'].includes(t.terrain))!;
    state.units.push({ id: 'p1-inf', ownerId: 'p1' as never, kind: 'INFANTRY', hexId: land.id, recruitedRound: 1 });
    const scout = state.players[0]!; scout.knownHexIds = [...new Set([...scout.knownHexIds, land.id, target.hexId])].sort() as never;
    state = must(state, 'p1' as never, { type: 'DECLARE_WAR', targetId: 'p2' });
    state = must(state, 'p1' as never, { type: 'QUEUE_ORDER', order: { id: 'strike', type: 'ATTACK', unitIds: ['p1-inf'], target: target.hexId, posture: 'ASSAULT' } });
    for (const id of ['p1', 'p2', 'p3']) state = must(state, id as never, { type: 'READY' });
    return state;
  }

  it('O a reaction played in CONFLICTS adds strength to the battle; max 1 per side; the rival hand stays hidden', () => {
    let state = conflict();
    expect(state.phase).toBe('CONFLICTS');
    const [r1, r1b] = [reactions[0]!, reactions[1]!];
    state = must(state, 'p1' as never, { type: 'PLAY_CARD', cardId: r1.id });
    // Second reaction by the same side in the same round is refused.
    expect(applyAlphaCommand(state, 'p1' as never, { type: 'PLAY_CARD', cardId: r1b.id, expectedVersion: state.version })).toMatchObject({ ok: false });
    // The rival's projection never contains the reaction cards in p1's hand.
    const rival = JSON.stringify(alphaPlayerView(state, 'p2' as never)!);
    for (const card of [r1.id, r1b.id]) expect(rival).not.toContain(`"${card}"`);
    expect(alphaPlayerView(state, 'p1' as never)!.self.hand).toContain(r1b.id);
    state = must(state, 'p2' as never, { type: 'READY' });
    state = must(state, 'p1' as never, { type: 'READY' });
    const battle = state.battles[0]!;
    expect(battle.attackerId).toBe('p1');
    expect(amount(battle.attackBreakdown, 'Cartas e efeitos')).toBe((r1.effect as { amount: number }).amount);
    expect(entry(battle.defenseBreakdown, 'Cartas e efeitos')).toBeUndefined();
  });
});

describe('Resultado autoritativo', () => {
  it('P both players read identical dice faces, Δ and outcome from their projections (server state, not client)', () => {
    const { state, order } = arena({ attackers: ['INFANTRY', 'GUARD', 'RANGED'], defenders: ['INFANTRY', 'CAVALRY'], seed: 21 });
    resolveBattleWithFaces(state, p1, order);
    const server = state.battles[0]!;
    const [a, b] = [p1, p2].map(id => alphaPlayerView(state, id)!.battles.find(x => x.id === server.id));
    expect(a).toBeDefined();
    expect(b).toEqual(a);
    expect(a).toEqual(server);
    expect(a!.attackerTactical.map(r => r.face)).toEqual(server.attackerTactical.map(r => r.face));
    expect(a!.delta).toBe(server.delta);
  });
});
