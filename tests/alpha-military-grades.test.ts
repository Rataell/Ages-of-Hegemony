import { describe, expect, it } from 'vitest';
import { ALPHA_CARDS, AlphaStateSchema, alphaCombatConfig, alphaRules } from '@aoh/game-domain';
import { GRADE_FAMILIES, GRADE_REQUIREMENTS, applyAlphaCommand, createAlphaGame, beginAlphaPlanning, gradeFor, resolveBattleWithFaces, resolveShock, setAlphaPhase, unitGrade, unitMovement, unitTransport, classifyDelta, type ShockPiece } from '@aoh/game-engine';
import { amount, arena, entry, faces, fight, p1, p2 } from './alpha-arena.js';

const ALL_ADVANCES = Object.values(GRADE_REQUIREMENTS).flatMap(rule => [...rule.II, ...rule.III]);

describe('Graus I–III come from the Web (canon §12b)', () => {
  it('every family is Grau I with no research, II with its Grau II advance, III with its Grau III advance', () => {
    for (const kind of GRADE_FAMILIES) {
      const rule = GRADE_REQUIREMENTS[kind];
      expect(gradeFor([], kind), kind).toBe(1);
      expect(gradeFor(rule.II, kind), kind).toBe(2);
      expect(gradeFor([...rule.II, ...rule.III], kind), kind).toBe(3);
    }
    expect(gradeFor(ALL_ADVANCES, 'PIONEER')).toBe(1);
  });

  it('Cavalaria III needs both Doutrina Naval and Guerra de Movimento; Guarda III needs Defesa Profunda', () => {
    expect(gradeFor(['web-naval-doctrine'], 'CAVALRY')).toBe(1);
    expect(gradeFor(['web-war-of-movement'], 'CAVALRY')).toBe(2);
    expect(gradeFor(['web-war-of-movement', 'web-naval-doctrine'], 'CAVALRY')).toBe(3);
    expect(gradeFor(['web-fortification'], 'GUARD')).toBe(2);
    expect(gradeFor(['web-fortification', 'web-deep-defense'], 'GUARD')).toBe(3);
  });

  it('pieces already in the field rise with the research: movement and transport follow the Grau', () => {
    const { state } = arena({ attackers: ['CAVALRY', 'FLEET'] });
    const cavalry = state.units.find(u => u.kind === 'CAVALRY')!, fleet = state.units.find(u => u.kind === 'FLEET')!;
    expect(unitMovement(state, cavalry)).toBe(2);
    expect(unitTransport(state, fleet)).toBe(2);
    state.players[0]!.research = ['web-war-of-movement', 'web-naval-architecture'];
    expect(unitGrade(state, p1, 'CAVALRY')).toBe(2);
    expect(unitMovement(state, cavalry)).toBe(3);
    expect(unitTransport(state, fleet)).toBe(3);
  });

  it('the V5.1b catalog: Power 2/2/2/3/1/3 and no passive city or terrain equipment', () => {
    const units = alphaRules().units;
    expect([units.INFANTRY, units.GUARD, units.RANGED, units.CAVALRY, units.SIEGE, units.FLEET].map(u => u.strength)).toEqual([2, 2, 2, 3, 1, 3]);
    for (const kind of GRADE_FAMILIES) {
      expect(units[kind].cityModifier, kind).toBe(0);
      expect(Object.values(units[kind].terrainModifiers).every(v => v === 0), kind).toBe(true);
    }
  });
});

describe('signatures by Grau', () => {
  const guardCancel = (research: string[], posture: 'ASSAULT' | 'HOLD', attacking: boolean) => {
    // Infantaria with a Guarda face against three Impactos.
    const options = attacking
      ? { attackers: ['INFANTRY' as const], defenders: ['INFANTRY' as const, 'INFANTRY' as const, 'INFANTRY' as const], attackPosture: posture }
      : { attackers: ['INFANTRY' as const, 'INFANTRY' as const, 'INFANTRY' as const], defenders: ['INFANTRY' as const], defensePosture: posture };
    const { state, order } = arena(options);
    state.players[attacking ? 0 : 1]!.research = research;
    const own = attacking ? faces('GUARD', 'a1') : faces('GUARD', 'd1');
    const foe = attacking ? faces('IMPACT', 'd1', 'd2', 'd3') : faces('IMPACT', 'a1', 'a2', 'a3');
    resolveBattleWithFaces(state, p1, order, { ...own, ...foe });
    const list = attacking ? state.battles[0]!.defenseBreakdown : state.battles[0]!.attackBreakdown;
    return -amount(list, /^Guardas inimigas anularam/) / (posture === 'HOLD' || !attacking ? 1 : 1);
  };

  it('Linha: a defending Infantaria Guarda cancels 1 Impacto at Grau I and II, Manter doubles it; Grau II cancels 2 outside Manter', () => {
    const cancelled = (research: string[], posture: 'ASSAULT' | 'HOLD') => {
      const { state, order } = arena({ attackers: ['INFANTRY', 'INFANTRY', 'INFANTRY'], defenders: ['INFANTRY'], defensePosture: posture });
      state.players[1]!.research = research;
      resolveBattleWithFaces(state, p1, order, { ...faces('IMPACT', 'a1', 'a2', 'a3'), d1: 'GUARD' });
      return Number(/anularam (\d+)/.exec(state.battles[0]!.attackBreakdown.find(m => m.source.startsWith('Guardas inimigas'))?.source ?? '')?.[1] ?? 0);
    };
    expect(cancelled([], 'ASSAULT')).toBe(1);
    expect(cancelled(['web-maneuver-training'], 'ASSAULT')).toBe(2);
    expect(cancelled([], 'HOLD')).toBe(2);
    void guardCancel;
  });

  it('I-2: an attacking Guarda face only counts under Manter, or for Infantaria Grau III', () => {
    const cancelled = (research: string[], posture: 'ASSAULT' | 'HOLD') => {
      const { state, order } = arena({ attackers: ['INFANTRY'], defenders: ['INFANTRY', 'INFANTRY', 'INFANTRY'], attackPosture: posture });
      state.players[0]!.research = research;
      resolveBattleWithFaces(state, p1, order, { a1: 'GUARD', ...faces('IMPACT', 'd1', 'd2', 'd3') });
      return Number(/anularam (\d+)/.exec(state.battles[0]!.defenseBreakdown.find(m => m.source.startsWith('Guardas inimigas'))?.source ?? '')?.[1] ?? 0);
    };
    expect(cancelled([], 'ASSAULT')).toBe(0);
    expect(cancelled(['web-maneuver-training'], 'ASSAULT')).toBe(0);
    expect(cancelled(['web-maneuver-training', 'web-iron'], 'ASSAULT')).toBe(2);
    expect(cancelled([], 'HOLD')).toBe(2);
  });

  it('Muro: Guarda defending a city +1, +1 more on hills from Grau II, +2 in the city at Grau III', () => {
    const wall = (research: string[], options: { city?: boolean; terrain?: string }) => {
      const { state, order } = arena({ defenders: ['GUARD'], ...options });
      state.players[1]!.research = research;
      resolveBattleWithFaces(state, p1, order, faces('EMPTY', 'a1', 'd1'));
      return state.battles[0]!.defenseBreakdown.filter(m => m.source.startsWith('Muro')).reduce((n, m) => n + m.amount, 0);
    };
    expect(wall([], { city: true })).toBe(1);
    expect(wall([], {})).toBe(0);
    expect(wall(['web-fortification'], { terrain: 'HILLS' })).toBe(1);
    expect(wall(['web-fortification'], { city: true })).toBe(1);
    expect(wall(['web-fortification', 'web-deep-defense'], { city: true })).toBe(2);
  });

  it('Cerco Grau III ignores Paliçada and Muralha de Pedra; Salva Grau III trims one level of fortification', () => {
    const run = (attackers: ('SIEGE' | 'RANGED' | 'INFANTRY')[], research: string[], level: 'PALISADE' | 'STONE_WALL' | 'FORTRESS', forced: Record<string, 'COMMAND' | 'EMPTY'>) => {
      const { state, order } = arena({ city: true, attackers, defenders: ['INFANTRY'], fort: { level, state: 'INTACT' } });
      state.players[0]!.research = research;
      resolveBattleWithFaces(state, p1, order, forced);
      return state.battles[0]!.defenseBreakdown.reduce((n, m) => n + m.amount, 0);
    };
    const base = run(['SIEGE'], [], 'STONE_WALL', { a1: 'EMPTY', d1: 'EMPTY' });
    expect(run(['SIEGE'], ['web-engineering', 'web-artillery'], 'STONE_WALL', { a1: 'EMPTY', d1: 'EMPTY' })).toBe(base - 2);
    const fortress = run(['SIEGE'], ['web-artillery'], 'FORTRESS', { a1: 'EMPTY', d1: 'EMPTY' });
    expect(fortress).toBe(run(['SIEGE'], [], 'FORTRESS', { a1: 'EMPTY', d1: 'EMPTY' }));
    const withSalva = run(['RANGED'], ['web-metallurgy', 'web-gunpowder'], 'FORTRESS', { a1: 'COMMAND', d1: 'EMPTY' });
    const without = run(['RANGED'], [], 'FORTRESS', { a1: 'COMMAND', d1: 'EMPTY' });
    expect(withSalva).toBe(without - 1);
  });
});

describe('Δ, capture and Reaction cap', () => {
  it('classifies Δ: |Δ| ≤ 1 tie, 2–4 victory, ≥ 5 decisive, symmetric in sign', () => {
    const config = alphaCombatConfig();
    const read = [-6, -5, -4, -2, -1, 0, 1, 2, 4, 5, 9].map(delta => classifyDelta(config, delta));
    expect(read).toEqual(['DECISIVE', 'DECISIVE', 'VICTORY', 'VICTORY', 'TIE', 'TIE', 'TIE', 'VICTORY', 'VICTORY', 'DECISIVE', 'DECISIVE']);
  });

  it('I-3: an empty city falls to a normal victory; a defended one holds its defenders; a decisive win without Guarda captures', () => {
    const empty = fight({ city: true, attackers: ['INFANTRY', 'INFANTRY'], defenders: [], attackPosture: 'HOLD' }, faces('EMPTY', 'a1', 'a2'));
    expect(empty.battle.outcome).not.toBe('TIE');
    expect(empty.state.cities.find(c => c.cityId === 'c2')!.currentOwnerId).toBe(p1);
    const held = fight({ city: true, attackers: ['INFANTRY', 'INFANTRY', 'INFANTRY'], defenders: ['INFANTRY', 'INFANTRY', 'INFANTRY'], attackPosture: 'HOLD' }, { ...faces('IMPACT', 'a1', 'a2', 'a3'), ...faces('EMPTY', 'd1', 'd2', 'd3') });
    expect(held.battle.outcome).toBe('VICTORY');
    expect(held.state.cities.find(c => c.cityId === 'c2')!.currentOwnerId).toBe(p2);
    expect(held.state.units.filter(u => u.ownerId === p2 && u.hexId === '7,0')).toHaveLength(2);
    expect(held.state.units.filter(u => u.ownerId === p1).every(u => u.hexId === '6,0')).toBe(true);
    const guarded = fight({ city: true, attackers: ['INFANTRY', 'INFANTRY', 'INFANTRY', 'INFANTRY', 'INFANTRY', 'INFANTRY'], defenders: ['INFANTRY', 'INFANTRY', 'GUARD'] }, { ...faces('IMPACT', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6'), ...faces('EMPTY', 'd1', 'd2', 'd3') });
    expect(guarded.battle.outcome).toBe('DECISIVE');
    expect(guarded.state.units.some(u => u.id === 'd3')).toBe(true);
    expect(guarded.state.cities.find(c => c.cityId === 'c2')!.currentOwnerId).toBe(p2);
    const routed = fight({ city: true, attackers: ['INFANTRY', 'INFANTRY', 'INFANTRY', 'INFANTRY', 'INFANTRY', 'INFANTRY'], defenders: ['INFANTRY', 'INFANTRY', 'INFANTRY'] }, { ...faces('IMPACT', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6'), ...faces('EMPTY', 'd1', 'd2', 'd3') });
    expect(routed.battle.outcome).toBe('DECISIVE');
    expect(routed.state.cities.find(c => c.cityId === 'c2')!.currentOwnerId).toBe(p1);
  });

  it('I-16: a second Reação in the same round is refused', () => {
    const state = beginAlphaPlanning(createAlphaGame({ gameId: 'reaction-cap', seed: 31, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));
    setAlphaPhase(state, 'CONFLICTS');
    const reactions = ALPHA_CARDS.filter(card => card.timing === 'REACTION').slice(0, 2).map(card => card.id);
    for (const player of state.players) player.hand = player.hand.filter(id => !reactions.includes(id));
    state.cards.strategyDeck = state.cards.strategyDeck.filter(id => !reactions.includes(id));
    state.players[0]!.hand = reactions;
    const first = applyAlphaCommand(state, p1, { type: 'PLAY_CARD', expectedVersion: state.version, cardId: reactions[0]! });
    if (!first.ok) throw new Error(first.error.message);
    const second = applyAlphaCommand(first.value, p1, { type: 'PLAY_CARD', expectedVersion: first.value.version, cardId: reactions[1]! });
    expect(second.ok).toBe(false);
  });
});

describe('V5.1a saves', () => {
  it('upgrade to the V5.1b catalogs with a public event, and the upgrade is idempotent', () => {
    const fresh = createAlphaGame({ gameId: 'old-combat', seed: 41, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] });
    const old = JSON.parse(JSON.stringify(fresh)) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    delete old.rulesVersion;
    const { shock: _s, signatures: _g, gradeNames: _n, ...legacyCombat } = old.rules.combat; void _s; void _g; void _n;
    old.rules.combat = { ...legacyCombat, mediumMargin: 3, largeMargin: 6 };
    old.rules.units.CAVALRY.strength = 2; old.rules.units.CAVALRY.movement = 3; old.rules.units.FLEET.transport = 3; old.rules.units.GUARD.cityModifier = 2;
    const upgraded = AlphaStateSchema.parse(old);
    expect(upgraded.rules.units.CAVALRY).toMatchObject({ strength: 3, movement: 2 });
    expect(upgraded.rules.units.FLEET.transport).toBe(2);
    expect(upgraded.rules.units.GUARD.cityModifier).toBe(0);
    expect(upgraded.rules.combat).toEqual(alphaCombatConfig());
    expect(upgraded.events.filter(e => e.type === 'SAVE_UPGRADED' && e.audience === null && /Combate/.test(e.message))).toHaveLength(1);
    expect(AlphaStateSchema.parse(upgraded).events.filter(e => e.type === 'SAVE_UPGRADED' && /Combate/.test(e.message))).toHaveLength(1);
  });

  it('an interim V5.1b save (no shock marker) is refreshed too', () => {
    const fresh = JSON.parse(JSON.stringify(createAlphaGame({ gameId: 'interim', seed: 42, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }))) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    delete fresh.rules.combat.shock; fresh.rules.units.INFANTRY.strength = 9;
    expect(AlphaStateSchema.parse(fresh).rules.units.INFANTRY.strength).toBe(2);
  });
});

describe('shock statistics (seeded)', () => {
  it('3 Infantaria I against 3 Infantaria I is a tactical tie in roughly half the shocks', () => {
    const { state } = arena({ seed: 77 });
    const side = (prefix: string, posture: 'ASSAULT' | 'HOLD') => ({ pieces: [1, 2, 3].map(i => ({ id: `${prefix}${i}`, kind: 'INFANTRY', grade: 1 }) as ShockPiece), posture, flat: [] });
    const counts = { TIE: 0, VICTORY: 0, DECISIVE: 0 };
    for (let i = 0; i < 2000; i++) counts[resolveShock(state, { attacker: side('a', 'ASSAULT'), defender: side('d', 'HOLD'), terrain: 'PLAINS', city: false, fortification: null }).outcome]++;
    expect(counts.TIE / 2000).toBeGreaterThan(0.35);
    expect(counts.TIE / 2000).toBeLessThan(0.7);
    expect(counts.DECISIVE / 2000).toBeLessThan(0.1);
    expect(entry([], 'x')).toBeUndefined();
  });
});
