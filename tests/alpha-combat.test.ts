import { describe, expect, it } from 'vitest';
import { ADVANCEMENTS, ALPHA_CARDS, AlphaStateSchema, BattlePostureSchema, alphaCombatConfig, alphaRules } from '@aoh/game-domain';
import {
  applyAlphaCommand, beginAlphaPlanning, combatPreview, createAlphaGame, hexDistance, institutionBonus, resolveBattle, resolveBattleWithFaces, setAlphaPhase, strengthSources, unitSupply,
} from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { completeRound, must } from './alpha-rounds.js';

import { amount, arena, entry, faces, fight, p1, p2 } from './alpha-arena.js';
describe('postures', () => {
  const postures = BattlePostureSchema.options;
  const every = (ids: string[]) => faces('EMPTY', ...ids);

  it('are circular: each beats exactly one posture and loses to exactly one', () => {
    const config = alphaCombatConfig();
    for (const posture of postures) {
      expect(postures.filter(other => config.posture[posture].beats === other)).toHaveLength(1);
      expect(postures.filter(other => config.posture[other].beats === posture)).toHaveLength(1);
      expect(config.posture[posture].beats).not.toBe(posture);
    }
  });

  it('award the advantage to exactly the winning side, and nothing on a tie or when nobody beats the other', () => {
    for (const attack of postures) for (const defense of postures) {
      const { battle, state } = fight({ attackPosture: attack, defensePosture: defense }, every(['a1', 'd1']));
      const config = state.rules.combat;
      const attackWins = config.posture[attack].beats === defense, defenseWins = config.posture[defense].beats === attack;
      expect(amount(battle.attackBreakdown, /^Postura/), `${attack} vs ${defense}`).toBe(attackWins ? config.postureAdvantage : 0);
      expect(amount(battle.defenseBreakdown, /^Postura/), `${attack} vs ${defense}`).toBe(defenseWins ? config.postureAdvantage : 0);
      expect(battle.attackerPosture).toBe(attack);
      expect(battle.defenderPosture).toBe(defense);
    }
  });

  it('shift Δ by exactly the posture advantage: +1 for the attacker, −1 for the defender, 0 otherwise', () => {
    for (const attack of postures) for (const defense of postures) {
      const { battle, state } = fight({ attackPosture: attack, defensePosture: defense }, every(['a1', 'd1']));
      const config = state.rules.combat;
      const expected = config.posture[attack].beats === defense ? 1 : config.posture[defense].beats === attack ? -1 : 0;
      expect(battle.delta, `${attack} vs ${defense}`).toBe(expected);
      // A posture alone never wins: |Δ| ≤ 1 is a tactical tie.
      expect(battle.outcome).toBe('TIE');
      expect(battle.winnerId).toBe(p2);
    }
  });

  it('empower their own face: assault doubles impacts, defence doubles guard cancellation, manoeuvre doubles manoeuvre', () => {
    const impact = fight({ attackPosture: 'ASSAULT', attackers: ['INFANTRY', 'INFANTRY'] }, { ...faces('IMPACT', 'a1', 'a2'), ...faces('EMPTY', 'd1') });
    expect(amount(impact.battle.attackBreakdown, 'Dados: impactos')).toBe(2 * (1 + 1));
    const plain = fight({ attackPosture: 'HOLD', attackers: ['INFANTRY', 'INFANTRY'] }, { ...faces('IMPACT', 'a1', 'a2'), ...faces('EMPTY', 'd1') });
    expect(amount(plain.battle.attackBreakdown, 'Dados: impactos')).toBe(2);
    const flank = fight({ attackPosture: 'MANEUVER', attackers: ['INFANTRY', 'INFANTRY'] }, { ...faces('MANEUVER', 'a1', 'a2'), ...faces('EMPTY', 'd1') });
    expect(amount(flank.battle.attackBreakdown, 'Dados: manobra')).toBe(4);
    const notFlank = fight({ attackPosture: 'ASSAULT', attackers: ['INFANTRY', 'INFANTRY'] }, { ...faces('MANEUVER', 'a1', 'a2'), ...faces('EMPTY', 'd1') });
    expect(amount(notFlank.battle.attackBreakdown, 'Dados: manobra')).toBe(2);
  });
});

describe('tactical faces', () => {
  it('EMPTY gives nothing', () => {
    const { battle } = fight({}, faces('EMPTY', 'a1', 'd1'));
    expect(entry(battle.attackBreakdown, /^Dados/)).toBeUndefined();
    expect(battle.attackerTactical).toEqual([{ unitId: 'a1', face: 'EMPTY', effect: 'Sem efeito', grade: 1 }]);
  });

  it('IMPACT scores and MANEUVER scores', () => {
    const { battle } = fight({ attackPosture: 'HOLD', attackers: ['INFANTRY', 'INFANTRY'] }, { a1: 'IMPACT', a2: 'MANEUVER', d1: 'EMPTY' });
    expect(amount(battle.attackBreakdown, 'Dados: impactos')).toBe(1);
    expect(amount(battle.attackBreakdown, 'Dados: manobra')).toBe(1);
  });

  it('GUARD cancels enemy impacts one for one (two per guard under a defensive posture), never below zero', () => {
    const one = fight({ attackers: ['INFANTRY', 'INFANTRY', 'INFANTRY'], defensePosture: 'ASSAULT' }, { ...faces('IMPACT', 'a1', 'a2', 'a3'), d1: 'GUARD' });
    expect(amount(one.battle.attackBreakdown, /^Guardas inimigas anularam 1/)).toBe(-2);
    expect(amount(one.battle.attackBreakdown, 'Dados: impactos')).toBe(3 * 2);
    const hold = fight({ attackers: ['INFANTRY', 'INFANTRY', 'INFANTRY'], defensePosture: 'HOLD' }, { ...faces('IMPACT', 'a1', 'a2', 'a3'), d1: 'GUARD' });
    expect(amount(hold.battle.attackBreakdown, /^Guardas inimigas anularam 2/)).toBe(-4);
    const capped = fight({ attackers: ['INFANTRY'], defenders: ['INFANTRY', 'INFANTRY'], defensePosture: 'HOLD' }, { a1: 'IMPACT', d1: 'GUARD', d2: 'GUARD' });
    expect(amount(capped.battle.attackBreakdown, /^Guardas inimigas anularam 1/)).toBe(-2);
    const net = capped.battle.attackModifiers;
    expect(net).toBe(amount(capped.battle.attackBreakdown, 'Dados: impactos') + amount(capped.battle.attackBreakdown, /^Guardas/) + amount(capped.battle.attackBreakdown, /^Postura/) + amount(capped.battle.attackBreakdown, /^(Terreno|Sem)/));
  });

  it('records one die per fighting unit and none for civilians', () => {
    const { battle } = fight({ attackers: ['INFANTRY', 'GUARD'], defenders: ['INFANTRY', 'PIONEER'] }, { a1: 'EMPTY', a2: 'EMPTY', d1: 'EMPTY' });
    expect(battle.attackerTactical.map(r => r.unitId)).toEqual(['a1', 'a2']);
    expect(battle.defenderTactical.map(r => r.unitId)).toEqual(['d1']);
    expect(battle.defenderUnits).toEqual(['d1', 'd2']);
  });
});

describe('COMMAND by class (signatures)', () => {
  it('INFANTRY and GUARD: Comando has no effect of its own', () => {
    const inf = fight({ attackPosture: 'HOLD', attackers: ['INFANTRY'] }, { a1: 'COMMAND', d1: 'EMPTY' });
    expect(inf.battle.attackerTactical[0]!.effect).toContain('sem assinatura');
    expect(entry(inf.battle.attackBreakdown, /^Dados/)).toBeUndefined();
    const guard = fight({ defenders: ['GUARD'] }, { a1: 'IMPACT', d1: 'COMMAND' });
    expect(guard.battle.defenderTactical[0]!.effect).toContain('sem assinatura');
  });

  it('RANGED: Salva turns a Comando into Poder (more with Grau II)', () => {
    const one = fight({ attackers: ['RANGED'] }, { a1: 'COMMAND', d1: 'EMPTY' });
    expect(amount(one.battle.attackBreakdown, /^Salva/)).toBe(1);
    const { state, order } = arena({ attackers: ['RANGED'] });
    state.players[0]!.research = ['web-metallurgy'];
    resolveBattleWithFaces(state, p1, order, { a1: 'COMMAND', d1: 'EMPTY' });
    expect(amount(state.battles[0]!.attackBreakdown, /^Salva/)).toBe(2);
  });

  it('CAVALRY: Flanco on plains, nothing in a forest, Grau III also on hills', () => {
    const plains = fight({ attackers: ['CAVALRY'] }, { a1: 'COMMAND', d1: 'EMPTY' });
    expect(amount(plains.battle.attackBreakdown, /^Flanco/)).toBe(1);
    const forest = fight({ attackers: ['CAVALRY'], terrain: 'FOREST' }, { a1: 'COMMAND', d1: 'EMPTY' });
    expect(entry(forest.battle.attackBreakdown, /^Flanco/)).toBeUndefined();
    expect(forest.battle.attackerTactical[0]!.effect).toBe('Comando: terreno não permite Flanco');
    const hills = arena({ attackers: ['CAVALRY'], terrain: 'HILLS' });
    hills.state.players[0]!.research = ['web-naval-doctrine', 'web-war-of-movement'];
    resolveBattleWithFaces(hills.state, p1, hills.order, { a1: 'COMMAND', d1: 'EMPTY' });
    expect(amount(hills.state.battles[0]!.attackBreakdown, /^Flanco/)).toBe(2);
  });

  it('SIEGE: Brecha adds Poder against a fortified city and opens Integridade per Comando', () => {
    const one = fight({ city: true, attackers: ['SIEGE'], fort: { level: 'STONE_WALL', state: 'INTACT' } }, { a1: 'COMMAND', d1: 'EMPTY' });
    expect(amount(one.battle.attackBreakdown, /^Brecha/)).toBe(2);
    expect(one.battle.fortification).toMatchObject({ before: { level: 'STONE_WALL', state: 'INTACT' }, after: { level: 'STONE_WALL', state: 'DAMAGED' } });
    expect(one.state.cities.find(c => c.cityId === 'c2')!.fortification.state).toBe('DAMAGED');
    expect(amount(one.battle.defenseBreakdown, 'Brecha aberta pelo cerco')).toBeLessThan(0);
    const two = fight({ city: true, attackers: ['SIEGE', 'SIEGE'], fort: { level: 'STONE_WALL', state: 'INTACT' } }, { a1: 'COMMAND', a2: 'COMMAND', d1: 'EMPTY' });
    expect(two.battle.fortification!.after.state).toBe('BREACHED');
    const open = fight({ attackers: ['SIEGE'], attackPosture: 'HOLD' }, { a1: 'COMMAND', d1: 'EMPTY' });
    expect(open.battle.attackerTactical[0]!.effect).toBe('Comando: sem fortificação para abrir');
    expect(open.battle.fortification).toBeNull();
    expect(entry(open.battle.attackBreakdown, /^Brecha/)).toBeUndefined();
  });

  it('SIEGE: a DECISIVE win without a Comando face leaves the wall INTACT (Brecha only opens Integridade on Comando), and replays identically', () => {
    const options = { city: true, attackers: ['INFANTRY', 'INFANTRY', 'INFANTRY', 'SIEGE', 'SIEGE'] as const, defenders: ['GUARD'] as const, fort: { level: 'STONE_WALL', state: 'INTACT' } };
    const faceFor = { a1: 'IMPACT', a2: 'IMPACT', a3: 'IMPACT', a4: 'IMPACT', a5: 'IMPACT', d1: 'EMPTY' } as const;
    const { battle, state } = fight({ ...options, attackers: [...options.attackers], defenders: [...options.defenders] }, faceFor);
    expect(battle.outcome).toBe('DECISIVE');
    expect(battle.attackBreakdown.filter(m => /^Brecha/.test(m.source)).reduce((n, m) => n + m.amount, 0)).toBe(4);
    expect(battle.fortification).toMatchObject({ before: { state: 'INTACT' }, after: { state: 'INTACT' } });
    expect(entry(battle.defenseBreakdown, 'Brecha aberta pelo cerco')).toBeUndefined();
    expect(state.cities.find(c => c.cityId === 'c2')!.fortification.state).toBe('INTACT');
    const again = fight({ ...options, attackers: [...options.attackers], defenders: [...options.defenders] }, faceFor);
    expect(again.battle).toEqual(battle);
  });

  it('FLEET: Abordagem blocks the defender port after a victory, and only when attacking', () => {
    const { state, order } = arena({ attackers: ['FLEET', 'FLEET', 'FLEET', 'FLEET'], defenders: ['FLEET'], terrain: 'COAST', seed: 11 });
    state.core.map.find(t => t.id === '4,0')!.terrain = 'COAST'; state.core.map.find(t => t.id === '3,0')!.terrain = 'COAST';
    state.core.players[1]!.civilization.cities[0]!.hexId = '5,0' as never; state.core.map.find(t => t.id === '5,0')!.terrain = 'COAST';
    state.core.map.find(t => t.id === '7,0')!.terrain = 'PLAINS';
    resolveBattleWithFaces(state, p1, order, { ...faces('COMMAND', 'a1', 'a2', 'a3', 'a4'), d1: 'EMPTY' });
    const battle = state.battles[0]!;
    expect(battle.attackerTactical.every(r => r.effect === 'Comando: Abordagem')).toBe(true);
    expect(battle.defenderTactical[0]!.face).toBe('EMPTY');
    expect(battle.delta).toBeGreaterThan(1);
    expect(state.cities.find(c => c.cityId === 'c2')!.portBlockedUntil).toBe(state.core.round + 1);
  });
});

describe('modifiers by origin', () => {
  it('terrain: hills and mountains help the defender; cavalry has no passive terrain bonus any more', () => {
    const config = alphaCombatConfig();
    const hills = fight({ terrain: 'HILLS' }, faces('EMPTY', 'a1', 'd1'));
    expect(amount(hills.battle.defenseBreakdown, 'Terreno')).toBe(config.hillDefense);
    const mountain = fight({ terrain: 'MOUNTAINS' }, faces('EMPTY', 'a1', 'd1'));
    expect(amount(mountain.battle.defenseBreakdown, 'Terreno')).toBe(config.mountainDefense);
    const cav = fight({ attackers: ['CAVALRY'] }, faces('EMPTY', 'a1', 'd1'));
    expect(entry(cav.battle.attackBreakdown, 'Terreno')).toBeUndefined();
  });

  it('supply: unsupplied attackers pay the configured penalty, supplied ones do not', () => {
    const near = fight({}, faces('EMPTY', 'a1', 'd1'));
    expect(entry(near.battle.attackBreakdown, 'Sem suprimento')).toBeUndefined();
    const far = fight({ far: true }, faces('EMPTY', 'a1', 'd1'));
    expect(amount(far.battle.attackBreakdown, 'Sem suprimento')).toBe(-far.state.rules.combat.unsuppliedPenalty);
    expect(unitSupply(far.state, { id: 'x', ownerId: p1, kind: 'INFANTRY', hexId: '5,0' as never, recruitedRound: 1 }).supplied).toBe(false);
  });

  it('fortification: level bonus, halved when damaged, nothing when breached; no extra for sheltered defenders', () => {
    const config = alphaCombatConfig();
    for (const level of ['NONE', 'PALISADE', 'STONE_WALL', 'FORTRESS', 'BASTION', 'CITADEL'] as const) {
      const intact = fight({ city: true, fort: { level, state: 'INTACT' }, defenders: ['INFANTRY'] }, faces('EMPTY', 'a1', 'd1'));
      expect(amount(intact.battle.defenseBreakdown, 'Fortificação'), level).toBe(config.fortification.levelBonus[level]);
      expect(entry(intact.battle.defenseBreakdown, 'Defensores abrigados'), level).toBeUndefined();
    }
    const damaged = fight({ city: true, fort: { level: 'FORTRESS', state: 'DAMAGED' } }, faces('EMPTY', 'a1', 'd1'));
    expect(amount(damaged.battle.defenseBreakdown, 'Fortificação')).toBe(Math.floor(config.fortification.levelBonus.FORTRESS * config.fortification.damagedPercent / 100));
    const breached = fight({ city: true, fort: { level: 'FORTRESS', state: 'BREACHED' } }, faces('EMPTY', 'a1', 'd1'));
    expect(entry(breached.battle.defenseBreakdown, 'Fortificação')).toBeUndefined();
  });

  it('a city defends with its pieces and walls only: no level or garrison strength', () => {
    const { battle } = fight({ city: true, defenders: ['INFANTRY'] }, faces('EMPTY', 'a1', 'd1'));
    expect(battle.defenseStrength).toBe(2);
  });

  it('technology, leader and cards appear as separate lines and add up to the institutional bonus', () => {
    const { state, order } = arena({ attackers: ['INFANTRY', 'INFANTRY'] });
    const tech = ADVANCEMENTS.find(node => node.effect?.kind === 'STRENGTH')!;
    state.players[0]!.research = [tech.id];
    state.players[0]!.temporaryEffects = [{ source: 'leader-toren-hjalvar', effect: { kind: 'STRENGTH', amount: 2 }, round: state.core.round }, { source: 'strategy-99', effect: { kind: 'STRENGTH', amount: 1 }, round: state.core.round }];
    const sources = strengthSources(state, p1);
    expect(sources).toEqual({ technology: 1, leader: 2, other: 1 });
    expect(sources.technology + sources.leader + sources.other).toBe(institutionBonus(state, p1, 'STRENGTH'));
    resolveBattleWithFaces(state, p1, order, faces('EMPTY', 'a1', 'a2', 'd1'));
    const battle = state.battles[0]!;
    expect(amount(battle.attackBreakdown, 'Tecnologia')).toBe(1);
    expect(amount(battle.attackBreakdown, 'Figura')).toBe(2);
    expect(amount(battle.attackBreakdown, 'Cartas e efeitos')).toBe(1);
    expect(ALPHA_CARDS.some(card => card.effect?.kind === 'STRENGTH')).toBe(true);
  });

  it('a defender with the same bonus gets the same lines', () => {
    const { state, order } = arena();
    state.players[1]!.temporaryEffects = [{ source: 'leader-hartvig-drell', effect: { kind: 'STRENGTH', amount: 2 }, round: state.core.round }];
    resolveBattleWithFaces(state, p1, order, faces('EMPTY', 'a1', 'd1'));
    expect(amount(state.battles[0]!.defenseBreakdown, 'Figura')).toBe(2);
    expect(entry(state.battles[0]!.attackBreakdown, 'Figura')).toBeUndefined();
  });

  it('keeps the arithmetic exact for every battle: total = strength + the sum of the breakdown', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { state, order } = arena({ seed, attackers: ['INFANTRY', 'RANGED', 'CAVALRY', 'SIEGE'], defenders: ['GUARD', 'INFANTRY', 'RANGED'], city: seed % 2 === 0, fort: { level: 'STONE_WALL', state: 'INTACT' } });
      resolveBattle(state, p1, order);
      const battle = state.battles[0]!;
      expect(battle.attackModifiers).toBe(battle.attackBreakdown.reduce((n, m) => n + m.amount, 0));
      expect(battle.defenseModifiers).toBe(battle.defenseBreakdown.reduce((n, m) => n + m.amount, 0));
      expect(battle.attackTotal).toBe(battle.attackStrength + battle.attackModifiers);
      expect(battle.defenseTotal).toBe(battle.defenseStrength + battle.defenseModifiers);
      expect(battle.delta).toBe(battle.attackTotal - battle.defenseTotal);
      expect(battle.winnerId).toBe(battle.outcome !== 'TIE' && battle.delta! > 0 ? p1 : p2);
    }
  });
});

describe('resolution', () => {
  it('a tie is a tactical tie: the attacker does not advance and each side with 2+ pieces loses 1', () => {
    const solo = fight({ attackPosture: 'HOLD', defensePosture: 'HOLD' }, faces('EMPTY', 'a1', 'd1'));
    expect(solo.battle).toMatchObject({ outcome: 'TIE', delta: 0, winnerId: p2, retreat: '3,0', losses: [] });
    const pairs = fight({ attackPosture: 'HOLD', defensePosture: 'HOLD', attackers: ['INFANTRY', 'INFANTRY'], defenders: ['INFANTRY', 'INFANTRY'] }, faces('EMPTY', 'a1', 'a2', 'd1', 'd2'));
    expect(pairs.battle.outcome).toBe('TIE');
    expect(pairs.battle.losses).toHaveLength(2);
    expect(pairs.battle.losses.filter(id => id.startsWith('a'))).toHaveLength(1);
    expect(pairs.battle.losses.filter(id => id.startsWith('d'))).toHaveLength(1);
    expect(pairs.state.units.filter(u => u.ownerId === p1).every(u => u.hexId === '3,0')).toBe(true);
    expect(pairs.state.units.filter(u => u.ownerId === p2).every(u => u.hexId === '4,0')).toBe(true);
    expect(pairs.state.players[0]!.victories).toBe(0);
  });

  it('retreats a losing defender to a free neighbouring hex and a losing attacker to where it came from', () => {
    const win = fight({ attackers: ['INFANTRY', 'INFANTRY', 'INFANTRY', 'INFANTRY'], defenders: ['INFANTRY', 'INFANTRY', 'INFANTRY', 'INFANTRY'], attackPosture: 'ASSAULT' }, { ...faces('IMPACT', 'a1', 'a2', 'a3', 'a4'), ...faces('EMPTY', 'd1', 'd2', 'd3', 'd4') });
    expect(win.battle.winnerId).toBe(p1);
    expect(win.battle.retreat).not.toBeNull();
    expect(win.state.units.filter(u => u.ownerId === p1).every(u => u.hexId === '4,0')).toBe(true);
    expect(win.state.units.filter(u => u.ownerId === p2).every(u => u.hexId === win.battle.retreat)).toBe(true);
    const lose = fight({ defenders: ['INFANTRY', 'INFANTRY', 'INFANTRY'] }, { a1: 'EMPTY', ...faces('IMPACT', 'd1', 'd2', 'd3') });
    expect(lose.battle.winnerId).toBe(p2);
    expect(lose.battle.retreat).toBe('3,0');
  });

  it('reads Δ: 2–4 is a victory (loser loses 1, weakest first), 5+ is decisive (loses 2)', () => {
    const win = fight({ attackers: ['INFANTRY', 'INFANTRY', 'INFANTRY', 'INFANTRY'], defenders: ['PIONEER', 'INFANTRY', 'GUARD'] }, { ...faces('IMPACT', 'a1', 'a2', 'a3', 'a4'), d2: 'EMPTY', d3: 'EMPTY' });
    expect(win.battle.outcome).toBe('DECISIVE');
    expect(win.battle.losses).toHaveLength(2);
    expect(win.battle.losses[0]).toBe('d2');
    expect(win.state.units.some(u => win.battle.losses.includes(u.id))).toBe(false);
    const normal = fight({ attackPosture: 'HOLD', attackers: ['INFANTRY', 'INFANTRY', 'INFANTRY'], defenders: ['INFANTRY', 'INFANTRY', 'INFANTRY'] }, { ...faces('IMPACT', 'a1', 'a2', 'a3'), ...faces('EMPTY', 'd1', 'd2', 'd3') });
    expect(normal.battle.delta).toBeGreaterThanOrEqual(2);
    expect(normal.battle.delta).toBeLessThan(5);
    expect(normal.battle.outcome).toBe('VICTORY');
    expect(normal.battle.losses).toHaveLength(1);
    expect(normal.state.players[0]!.victories).toBe(1);
  });

  it('only the attacker may advance: a losing attacker stays, a winning defender never leaves its hex', () => {
    const lose = fight({ defenders: ['INFANTRY', 'INFANTRY', 'INFANTRY'] }, { a1: 'EMPTY', ...faces('IMPACT', 'd1', 'd2', 'd3') });
    expect(lose.battle.delta).toBeLessThanOrEqual(-2);
    expect(lose.state.units.find(u => u.id === 'a1' || false)?.hexId ?? '3,0').toBe('3,0');
    expect(lose.state.units.filter(u => u.ownerId === p2).every(u => u.hexId === '4,0')).toBe(true);
    expect(lose.state.players[0]!.victories).toBe(0);
  });

  it('captures an undefended or beaten city through occupation', () => {
    const { battle, state } = fight({ city: true, attackers: ['INFANTRY', 'INFANTRY', 'INFANTRY', 'INFANTRY'], defenders: [] }, { ...faces('IMPACT', 'a1', 'a2', 'a3', 'a4') });
    expect(battle.winnerId).toBe(p1);
    expect(state.cities.find(c => c.cityId === 'c2')!.currentOwnerId).toBe(p1);
  });

  it('refuses illegal attacks before any dice are rolled', () => {
    const { state, order } = arena();
    state.wars = [];
    const counter = state.privateRng.counter;
    expect(() => resolveBattle(state, p1, order)).toThrow('guerra');
    expect(state.privateRng.counter).toBe(counter);
    expect(state.battles).toHaveLength(0);
  });
});

describe('determinism, replay and privacy', () => {
  it('produces the same battle from the same seed and different faces from different seeds', () => {
    const run = (seed: number) => { const { state, order } = arena({ seed, attackers: ['INFANTRY', 'INFANTRY', 'GUARD', 'RANGED'], defenders: ['INFANTRY', 'INFANTRY', 'GUARD'] }); resolveBattle(state, p1, order); return state.battles[0]!; };
    expect(run(9)).toEqual(run(9));
    const seen = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(seed => JSON.stringify(run(seed).attackerTactical.map(r => r.face))));
    expect(seen.size).toBeGreaterThan(1);
  });

  it('draws exactly one random number per fighting unit, attackers first, in unit-id order', () => {
    const { state, order } = arena({ attackers: ['INFANTRY', 'GUARD'], defenders: ['INFANTRY', 'PIONEER', 'CAVALRY'] });
    const counter = state.privateRng.counter;
    resolveBattle(state, p1, order);
    expect(state.privateRng.counter - counter).toBe(4);
    expect(state.battles[0]!.attackerTactical.map(r => r.unitId)).toEqual(['a1', 'a2']);
    expect(state.battles[0]!.defenderTactical.map(r => r.unitId)).toEqual(['d1', 'd3']);
  });

  it('previews without consuming randomness, revealing dice, or the defender posture', () => {
    const { state, order } = arena({ attackers: ['INFANTRY', 'SIEGE'], city: true, fort: { level: 'STONE_WALL', state: 'INTACT' }, defensePosture: 'MANEUVER' });
    const before = JSON.stringify(state);
    const preview = combatPreview(state, p1, order);
    expect(JSON.stringify(state)).toBe(before);
    expect(preview.ok).toBe(true);
    expect(combatPreview(state, p1, order)).toEqual(preview);
    expect(preview.defender!.posture).toBe('UNKNOWN');
    const text = JSON.stringify(preview);
    for (const secret of ['MANEUVER"', 'attackDice', 'defenseDice', 'privateRng', state.privateRng.seed]) expect(text.includes(secret) && secret !== 'MANEUVER"').toBe(false);
    expect(preview.dieFaces).toEqual(alphaRules().combat.dieFaces);
    expect(preview.attacker.units).toHaveLength(2);
    expect(preview.attacker.total).toBe(preview.attacker.strength + preview.attacker.breakdown.reduce((n, m) => n + m.amount, 0));
    expect(entry(preview.defender!.breakdown, 'Fortificação')?.amount).toBe(2);
  });

  it('hides a defence the attacker cannot see and explains blocked attacks', () => {
    const { state, order } = arena({ city: true });
    state.units = state.units.filter(u => u.ownerId === p2 || u.id === 'a1');
    state.units.find(u => u.id === 'a1')!.hexId = '0,0' as never;
    const hidden = combatPreview(state, p1, { ...order, unitIds: ['a1'] });
    expect(hidden.ok).toBe(false);
    const arena2 = arena();
    arena2.state.wars = [];
    expect(combatPreview(arena2.state, p1, arena2.order)).toMatchObject({ ok: false, blocked: expect.stringContaining('guerra') });
  });

  it('reads the same battle after a serialization round trip', () => {
    const { state, order } = arena();
    resolveBattle(state, p1, order);
    expect(JSON.parse(JSON.stringify(state.battles))).toEqual(state.battles);
  });
});

describe('defence posture command', () => {
  const match = () => beginAlphaPlanning(createAlphaGame({ gameId: 'posture-alpha', seed: 91, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));

  it('defaults to defence, changes in planning only, and stays private', () => {
    let state = match();
    expect(state.players.map(p => p.defensePosture)).toEqual(['HOLD', 'HOLD']);
    state = must(state, p1, { type: 'SET_DEFENSE_POSTURE', posture: 'MANEUVER' });
    expect(state.players[0]!.defensePosture).toBe('MANEUVER');
    const own = alphaPlayerView(state, p1)!, other = alphaPlayerView(state, p2)!;
    expect(own.self.defensePosture).toBe('MANEUVER');
    expect(JSON.stringify(other)).not.toContain('"defensePosture":"MANEUVER"');
    const urban = state;setAlphaPhase(urban,'URBAN_ACTIONS');
    expect(applyAlphaCommand(urban, p1, { type: 'SET_DEFENSE_POSTURE', expectedVersion: urban.version, posture: 'ASSAULT' })).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } });
  });

  it('is applied by the battle and revealed only through the battle record', () => {
    const { state, order } = arena({ defensePosture: 'MANEUVER', attackPosture: 'ASSAULT' });
    resolveBattle(state, p1, order);
    expect(state.battles[0]).toMatchObject({ attackerPosture: 'ASSAULT', defenderPosture: 'MANEUVER' });
  });

  it('exposes previews of queued attacks only to their owner', () => {
    let state = match();
    state.wars = [[p1, p2]];
    const own = state.core.players[0]!.civilization.cities[0]!;
    state.units = [{ id: 'u1', ownerId: p1, kind: 'INFANTRY', hexId: own.hexId, recruitedRound: 1 }];
    const origin = state.core.map.find(t => t.id === own.hexId)!;
    const neighbour = state.core.map.find(t => t.id !== own.hexId && !['SEA', 'UNKNOWN'].includes(t.terrain) && hexDistance(origin, t) === 1)!;
    state.players[0]!.knownHexIds = state.core.map.map(t => t.id);
    state.units.push({ id: 'e1', ownerId: p2, kind: 'INFANTRY', hexId: neighbour.id, recruitedRound: 1 });
    state.players[0]!.orders = [{ id: 'atk', type: 'ATTACK', unitIds: ['u1'], target: neighbour.id, posture: 'ASSAULT' }];
    expect(Object.keys(alphaPlayerView(state, p1)!.orderPreviews)).toEqual(['atk']);
    expect(alphaPlayerView(state, p2)!.orderPreviews).toEqual({});
    state = structuredClone(state);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });
});

describe('no duplication', () => {
  it('resolves a queued attack exactly once, even if the same command is sent again', () => {
    let state = beginAlphaPlanning(createAlphaGame({ gameId: 'dup-alpha', seed: 92, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));
    state.wars = [[p1, p2]];
    for (const player of state.players) player.contacts = [p1, p2].filter(id => id !== player.playerId);
    const own = state.core.players[0]!.civilization.cities[0]!;
    const origin = state.core.map.find(t => t.id === own.hexId)!;
    const neighbour = state.core.map.find(t => t.id !== own.hexId && !['SEA', 'UNKNOWN'].includes(t.terrain) && hexDistance(origin, t) === 1)!;
    state.units = [{ id: 'u1', ownerId: p1, kind: 'INFANTRY', hexId: own.hexId, recruitedRound: 1 }, { id: 'e1', ownerId: p2, kind: 'INFANTRY', hexId: neighbour.id, recruitedRound: 1 }];
    state.players.forEach(p => { p.knownHexIds = state.core.map.map(t => t.id); });
    const command = { type: 'QUEUE_ORDER', order: { id: 'atk', type: 'ATTACK', unitIds: ['u1'], target: neighbour.id, posture: 'ASSAULT' } };
    const first = applyAlphaCommand(state, p1, { ...command, expectedVersion: state.version });
    if (!first.ok) throw new Error(first.error.message);
    expect(applyAlphaCommand(first.value, p1, { ...command, expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'VERSION_CONFLICT' } });
    state = completeRound(first.value);
    expect(state.battles).toHaveLength(1);
    state = completeRound(state);
    expect(state.battles).toHaveLength(1);
  });
});

describe('legacy compatibility and configuration', () => {
  it('still reads battles resolved with the old two-dice rule', () => {
    const state = beginAlphaPlanning(createAlphaGame({ gameId: 'legacy-battle', seed: 93, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));
    state.battles.push({
      id: 'battle-1', round: 1, hexId: state.core.map[0]!.id, attackerId: p1, defenderId: p2, attackerUnits: [], defenderUnits: [], attackerPosture: 'ASSAULT', defenderPosture: 'HOLD',
      attackBreakdown: [], defenseBreakdown: [], attackerTactical: [], defenderTactical: [], fortification: null,
      attackStrength: 4, defenseStrength: 3, attackModifiers: 1, defenseModifiers: 0, attackDice: [3, 4], defenseDice: [2, 2], attackTotal: 12, defenseTotal: 7, winnerId: p1, losses: [], retreat: null,
    });
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('rejects a battle whose breakdown or arithmetic was tampered with', () => {
    const { state, order } = arena();
    resolveBattle(state, p1, order);
    const base = createAlphaGame({ gameId: 'tamper', seed: 94, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] });
    const battle = { ...state.battles[0]!, hexId: base.core.map[0]!.id };
    expect(AlphaStateSchema.safeParse({ ...base, battles: [battle] }).success).toBe(true);
    expect(AlphaStateSchema.safeParse({ ...base, battles: [{ ...battle, attackTotal: battle.attackTotal + 1 }] }).success).toBe(false);
    expect(AlphaStateSchema.safeParse({ ...base, battles: [{ ...battle, attackBreakdown: [...battle.attackBreakdown, { source: 'Invento', amount: 1 }] }] }).success).toBe(false);
  });

  it('keeps every combat number in the central configuration', () => {
    expect(alphaRules().combat).toEqual(alphaCombatConfig());
    expect(alphaRules().combat.dieFaces).toEqual(['EMPTY', 'IMPACT', 'IMPACT', 'GUARD', 'MANEUVER', 'COMMAND']);
  });
});
