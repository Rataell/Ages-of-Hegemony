import { describe, expect, it } from 'vitest';
import { ADVANCEMENTS, ALPHA_CARDS, AlphaStateSchema, BattlePostureSchema, PlayerIdSchema, alphaCombatConfig, alphaRules, type AlphaUnit, type BattlePosture, type TacticalFace } from '@aoh/game-domain';
import {
  applyAlphaCommand, beginAlphaPlanning, combatPreview, createAlphaGame, createGame, hexDistance, institutionBonus, migrateSnapshotV3ToV4, resolveBattle, resolveBattleWithFaces, setAlphaPhase, strengthSources, unitSupply,
} from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { completeRound, must } from './alpha-rounds.js';

const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
type Kind = AlphaUnit['kind'];
interface Arena { attackers?: Kind[]; defenders?: Kind[]; city?: boolean; far?: boolean; terrain?: string; attackPosture?: BattlePosture; defensePosture?: BattlePosture; fort?: { level: string; state: string }; seed?: number }

/** Ten plains in a row. p1's city at 0,0, p2's at 7,0. Field battles at 4,0 (supplied) or 6,0 (attackers unsupplied); city battles at 7,0. */
function arena(options: Arena = {}) {
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
const faces = (face: TacticalFace, ...ids: string[]) => Object.fromEntries(ids.map(id => [id, face])) as Record<string, TacticalFace>;
const entry = (list: { source: string; amount: number }[], source: string | RegExp) => list.find(item => typeof source === 'string' ? item.source === source : source.test(item.source));
const amount = (list: { source: string; amount: number }[], source: string | RegExp) => entry(list, source)?.amount ?? 0;
const fight = (options: Arena, forced?: Record<string, TacticalFace>) => {
  const { state, order } = arena(options);
  resolveBattleWithFaces(state, p1, order, forced);
  return { state, battle: state.battles[0]! };
};

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

  it('never win automatically: every posture can win and lose a mirrored fight', () => {
    const outcomes = new Map<string, Set<boolean>>();
    for (const attack of postures) for (const defense of postures) {
      const { battle } = fight({ attackPosture: attack, defensePosture: defense }, every(['a1', 'd1']));
      // Equal strength (2 v 2), no dice points: the posture advantage alone decides, and ties go to the defender.
      const attackerWon = battle.winnerId === p1;
      outcomes.set(attack, (outcomes.get(attack) ?? new Set()).add(attackerWon));
    }
    for (const posture of postures) expect([...outcomes.get(posture)!].sort()).toEqual([false, true]);
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
    expect(battle.attackerTactical).toEqual([{ unitId: 'a1', face: 'EMPTY', effect: 'Sem efeito' }]);
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

describe('COMMAND by class', () => {
  it('INFANTRY: impact when assaulting, guard when holding', () => {
    const assault = fight({ attackPosture: 'ASSAULT', attackers: ['INFANTRY'] }, { a1: 'COMMAND', d1: 'EMPTY' });
    expect(assault.battle.attackerTactical[0]!.effect).toBe('Comando: impacto');
    expect(amount(assault.battle.attackBreakdown, 'Dados: impactos')).toBe(2);
    const hold = fight({ defensePosture: 'HOLD', attackers: ['INFANTRY'] }, { a1: 'IMPACT', d1: 'COMMAND' });
    expect(hold.battle.defenderTactical[0]!.effect).toBe('Comando: guarda (postura de defesa)');
    expect(amount(hold.battle.attackBreakdown, /^Guardas inimigas anularam 1/)).toBeLessThan(0);
  });

  it('GUARD: an extra guard, plus protection when defending a city', () => {
    const field = fight({ defenders: ['GUARD'], defensePosture: 'ASSAULT' }, { a1: 'IMPACT', d1: 'COMMAND' });
    expect(field.battle.defenderTactical[0]!.effect).toBe('Comando: guarda extra');
    expect(amount(field.battle.defenseBreakdown, 'Proteção da cidade')).toBe(0);
    const city = fight({ city: true, defenders: ['GUARD'], defensePosture: 'ASSAULT' }, { a1: 'IMPACT', d1: 'COMMAND' });
    expect(city.battle.defenderTactical[0]!.effect).toContain('proteção da cidade');
    expect(amount(city.battle.defenseBreakdown, 'Proteção da cidade')).toBe(1);
  });

  it('GUARD: its city modifier serves the defenders of a city, never an attack on one (same value)', () => {
    const guard = alphaRules().units.GUARD.cityModifier;
    const defending = fight({ city: true, defenders: ['GUARD'] }, faces('EMPTY', 'a1', 'd1'));
    expect(amount(defending.battle.defenseBreakdown, 'Guarda da cidade')).toBe(guard);
    expect(entry(defending.battle.attackBreakdown, 'Equipamento contra cidade')).toBeUndefined();
    const attacking = fight({ city: true, attackers: ['GUARD'] }, faces('EMPTY', 'a1', 'd1'));
    expect(entry(attacking.battle.attackBreakdown, 'Equipamento contra cidade')).toBeUndefined();
    expect(entry(fight({ defenders: ['GUARD'] }, faces('EMPTY', 'a1', 'd1')).battle.defenseBreakdown, 'Guarda da cidade')).toBeUndefined();
    const siege = fight({ city: true, attackers: ['SIEGE'] }, faces('EMPTY', 'a1', 'd1'));
    expect(amount(siege.battle.attackBreakdown, 'Equipamento contra cidade')).toBe(alphaRules().units.SIEGE.cityModifier);
    // The preview shows the same static breakdown the battle will use.
    const { state, order } = arena({ city: true, defenders: ['GUARD'] });
    expect(amount(combatPreview(state, p1, order).defender!.breakdown, 'Guarda da cidade')).toBe(guard);
    // Matches saved before the side was explicit keep the corrected rule.
    const legacy = arena({ city: true, defenders: ['GUARD'] });
    delete legacy.state.rules.units.GUARD.cityModifierSide;
    resolveBattleWithFaces(legacy.state, p1, legacy.order, faces('EMPTY', 'a1', 'd1'));
    expect(amount(legacy.state.battles[0]!.defenseBreakdown, 'Guarda da cidade')).toBe(guard);
  });

  it('RANGED: turns one empty ally die into an impact and does nothing when there is none', () => {
    const support = fight({ attackers: ['INFANTRY', 'RANGED'], attackPosture: 'HOLD' }, { a1: 'EMPTY', a2: 'COMMAND', d1: 'EMPTY' });
    expect(support.battle.attackerTactical.find(r => r.unitId === 'a1')).toMatchObject({ face: 'IMPACT', effect: expect.stringContaining('virou impacto') });
    expect(amount(support.battle.attackBreakdown, 'Dados: impactos')).toBe(1);
    const nothing = fight({ attackers: ['INFANTRY', 'RANGED'], attackPosture: 'HOLD' }, { a1: 'GUARD', a2: 'COMMAND', d1: 'EMPTY' });
    expect(nothing.battle.attackerTactical.find(r => r.unitId === 'a2')!.effect).toContain('sem dado vazio');
    expect(amount(nothing.battle.attackBreakdown, 'Dados: impactos')).toBe(0);
  });

  it('CAVALRY: flanks on plains, not in a forest', () => {
    const plains = fight({ attackers: ['CAVALRY'] }, { a1: 'COMMAND', d1: 'EMPTY' });
    expect(amount(plains.battle.attackBreakdown, 'Flanco da cavalaria')).toBe(1);
    const forest = fight({ attackers: ['CAVALRY'], terrain: 'FOREST' }, { a1: 'COMMAND', d1: 'EMPTY' });
    expect(entry(forest.battle.attackBreakdown, 'Flanco da cavalaria')).toBeUndefined();
    expect(forest.battle.attackerTactical[0]!.effect).toBe('Comando: terreno não permite flanco');
  });

  it('SIEGE: breaches a fortification one step per command, otherwise strikes', () => {
    const one = fight({ city: true, attackers: ['SIEGE'], fort: { level: 'STONE_WALL', state: 'INTACT' } }, { a1: 'COMMAND', d1: 'EMPTY' });
    expect(one.battle.fortification).toMatchObject({ before: { level: 'STONE_WALL', state: 'INTACT' }, after: { level: 'STONE_WALL', state: 'DAMAGED' } });
    expect(one.state.cities.find(c => c.cityId === 'c2')!.fortification.state).toBe('DAMAGED');
    expect(amount(one.battle.defenseBreakdown, 'Brecha aberta pelo cerco')).toBeLessThan(0);
    const two = fight({ city: true, attackers: ['SIEGE', 'SIEGE'], fort: { level: 'STONE_WALL', state: 'INTACT' } }, { a1: 'COMMAND', a2: 'COMMAND', d1: 'EMPTY' });
    expect(two.battle.fortification!.after.state).toBe('BREACHED');
    const open = fight({ attackers: ['SIEGE'], attackPosture: 'HOLD' }, { a1: 'COMMAND', d1: 'EMPTY' });
    expect(open.battle.attackerTactical[0]!.effect).toBe('Comando: impacto (sem fortificação)');
    expect(open.battle.fortification).toBeNull();
  });

  it('FLEET: naval effect on coast and sea, none on land', () => {
    const coast = fight({ attackers: ['FLEET'], terrain: 'COAST' }, { a1: 'COMMAND', d1: 'EMPTY' });
    expect(amount(coast.battle.attackBreakdown, 'Superioridade naval')).toBe(1);
    const land = arena({ attackers: ['FLEET'] });
    land.state.units[0]!.hexId = '3,0' as never;
    expect(() => resolveBattleWithFaces(land.state, p1, land.order, { a1: 'COMMAND', d1: 'EMPTY' })).toThrow();
  });
});

describe('modifiers by origin', () => {
  it('terrain: hills and mountains help the defender, cavalry likes plains', () => {
    const config = alphaCombatConfig();
    const hills = fight({ terrain: 'HILLS' }, faces('EMPTY', 'a1', 'd1'));
    expect(amount(hills.battle.defenseBreakdown, 'Terreno')).toBe(config.hillDefense + hills.state.rules.units.INFANTRY.terrainModifiers.HILLS);
    const mountain = fight({ terrain: 'MOUNTAINS' }, faces('EMPTY', 'a1', 'd1'));
    expect(amount(mountain.battle.defenseBreakdown, 'Terreno')).toBe(config.mountainDefense + mountain.state.rules.units.INFANTRY.terrainModifiers.MOUNTAINS);
    const cav = fight({ attackers: ['CAVALRY'] }, faces('EMPTY', 'a1', 'd1'));
    expect(amount(cav.battle.attackBreakdown, 'Terreno')).toBe(cav.state.rules.units.CAVALRY.terrainModifiers.PLAINS);
  });

  it('supply: unsupplied attackers pay the configured penalty, supplied ones do not', () => {
    const near = fight({}, faces('EMPTY', 'a1', 'd1'));
    expect(entry(near.battle.attackBreakdown, 'Sem suprimento')).toBeUndefined();
    const far = fight({ far: true }, faces('EMPTY', 'a1', 'd1'));
    expect(amount(far.battle.attackBreakdown, 'Sem suprimento')).toBe(-far.state.rules.combat.unsuppliedPenalty);
    expect(unitSupply(far.state, { id: 'x', ownerId: p1, kind: 'INFANTRY', hexId: '5,0' as never, recruitedRound: 1 }).supplied).toBe(false);
  });

  it('fortification: level bonus, halved when damaged, nothing when breached, sheltered guards and infantry', () => {
    const config = alphaCombatConfig();
    for (const level of ['NONE', 'PALISADE', 'STONE_WALL', 'FORTRESS', 'BASTION', 'CITADEL'] as const) {
      const intact = fight({ city: true, fort: { level, state: 'INTACT' }, defenders: ['GUARD'] }, faces('EMPTY', 'a1', 'd1'));
      expect(amount(intact.battle.defenseBreakdown, 'Fortificação'), level).toBe(config.fortification.levelBonus[level]);
      expect(amount(intact.battle.defenseBreakdown, 'Defensores abrigados'), level).toBe(level === 'NONE' ? 0 : config.fortification.fortifiedDefenderBonus);
    }
    const damaged = fight({ city: true, fort: { level: 'FORTRESS', state: 'DAMAGED' } }, faces('EMPTY', 'a1', 'd1'));
    expect(amount(damaged.battle.defenseBreakdown, 'Fortificação')).toBe(Math.floor(config.fortification.levelBonus.FORTRESS * config.fortification.damagedPercent / 100));
    const breached = fight({ city: true, fort: { level: 'FORTRESS', state: 'BREACHED' } }, faces('EMPTY', 'a1', 'd1'));
    expect(entry(breached.battle.defenseBreakdown, 'Fortificação')).toBeUndefined();
    expect(entry(breached.battle.defenseBreakdown, 'Defensores abrigados')).toBeUndefined();
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
    expect(amount(battle.attackBreakdown, 'Líder')).toBe(2);
    expect(amount(battle.attackBreakdown, 'Cartas e efeitos')).toBe(1);
    expect(ALPHA_CARDS.some(card => card.effect?.kind === 'STRENGTH')).toBe(true);
  });

  it('a defender with the same bonus gets the same lines', () => {
    const { state, order } = arena();
    state.players[1]!.temporaryEffects = [{ source: 'leader-hartvig-drell', effect: { kind: 'STRENGTH', amount: 2 }, round: state.core.round }];
    resolveBattleWithFaces(state, p1, order, faces('EMPTY', 'a1', 'd1'));
    expect(amount(state.battles[0]!.defenseBreakdown, 'Líder')).toBe(2);
    expect(entry(state.battles[0]!.attackBreakdown, 'Líder')).toBeUndefined();
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
      expect(battle.winnerId).toBe(battle.attackTotal > battle.defenseTotal ? p1 : p2);
    }
  });
});

describe('resolution', () => {
  it('gives ties to the defender', () => {
    const { battle } = fight({ attackPosture: 'HOLD', defensePosture: 'HOLD' }, faces('EMPTY', 'a1', 'd1'));
    expect(battle.attackTotal).toBe(battle.defenseTotal);
    expect(battle.winnerId).toBe(p2);
    expect(battle.retreat).toBe('3,0');
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

  it('scales losses with the margin and removes the weakest first', () => {
    const { battle, state } = fight({ attackers: ['INFANTRY', 'INFANTRY', 'INFANTRY', 'INFANTRY'], defenders: ['EXPLORER', 'INFANTRY', 'GUARD'] }, { ...faces('IMPACT', 'a1', 'a2', 'a3', 'a4'), d2: 'EMPTY', d3: 'EMPTY' });
    expect(battle.winnerId).toBe(p1);
    expect(battle.losses[0]).toBe('d1');
    expect(state.units.some(u => battle.losses.includes(u.id))).toBe(false);
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
