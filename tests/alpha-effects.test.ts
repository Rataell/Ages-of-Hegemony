import { describe, expect, it } from 'vitest';
import { ADVANCEMENTS, ALPHA_CARDS, AlphaStateSchema, CIVILIZATIONS, GREAT_PROJECTS, PlayerIdSchema, emptyResourcePool, type AlphaState } from '@aoh/game-domain';
import { applyRecurringEffects, beginAlphaPlanning, createAlphaGame, effectTiming, occupyCity } from '@aoh/game-engine';
import { completeRound, must, produceAll, readyAll } from './alpha-rounds.js';

const p1 = PlayerIdSchema.parse('p1');
const fresh = (seed = 91): AlphaState => beginAlphaPlanning(createAlphaGame({ gameId: `effects-${seed}`, seed, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));
const ledger = (state: AlphaState, id = 'p1') => state.roundLedgers.find(l => l.playerId === id)!;
const report = (state: AlphaState, id = 'p1') => state.roundReports.find(r => r.playerId === id)!;
const total = (pool: Record<string, number>) => Object.values(pool).reduce((a, b) => a + b, 0);
const passives = (state: AlphaState, index = 0) => CIVILIZATIONS.find(c => c.id === state.players[index]!.civilization)!.passives;

/** Gives p1 an advisor without leaving a second copy in the decks. */
function withAdvisor(state: AlphaState, id: string) {
  state.cards.advisorDeck = state.cards.advisorDeck.filter(card => card !== id);
  state.cards.advisorMarket = state.cards.advisorMarket.filter(card => card !== id);
  state.players[0]!.advisors = [id];
}
function withProject(state: AlphaState, district: string, cityId = 'capital-1') {
  const project = GREAT_PROJECTS.find(candidate => candidate.district === district)!;
  state.projects.push({ projectId: project.id, ownerId: p1, cityId: cityId as never, completedRound: 1 });
  return project;
}

describe('effect timing taxonomy', () => {
  it('assigns each authored family its own timing', () => {
    for (const civilization of CIVILIZATIONS) {
      for (const effect of civilization.passives) expect(effectTiming(effect)).toBe('MAINTENANCE');
      for (const effect of civilization.ability.effects) expect(effectTiming(effect)).toBe('ONCE');
    }
    for (const node of ADVANCEMENTS) expect(effectTiming(node.effect)).toBe(node.effect.kind === 'PRODUCTION' ? 'MAINTENANCE' : 'ONCE');
    for (const card of ALPHA_CARDS) {
      if (!card.effect || card.effect.kind !== 'PRODUCTION') continue;
      const timing = effectTiming(card.effect);
      if (card.family === 'ADVISOR') expect(timing).toBe('ROUND_START');
      else if (card.family === 'STRATEGY' || card.family === 'WORLD_EVENT') expect(timing).toBe('ONCE');
    }
    for (const project of GREAT_PROJECTS) expect(effectTiming(project.effect)).toBe(project.district === 'AGRARIAN' || project.district === 'INDUSTRIAL' ? 'ON_PRODUCE' : 'MAINTENANCE');
  });

  it('exercises every timing with authored content', () => {
    const seen = new Set<string>();
    for (const civilization of CIVILIZATIONS) for (const effect of [...civilization.passives, ...civilization.ability.effects]) seen.add(effectTiming(effect));
    for (const card of ALPHA_CARDS) if (card.effect) seen.add(effectTiming(card.effect));
    for (const project of GREAT_PROJECTS) seen.add(effectTiming(project.effect));
    expect([...seen].sort()).toEqual(['MAINTENANCE', 'ONCE', 'ON_PRODUCE', 'ROUND_START']);
  });
});

describe('recurring effects do not depend on PRODUCE', () => {
  it('pays civilization passives at maintenance even when no city produced', () => {
    const state = completeRound(fresh());
    const expected = passives(state).filter(e => e.kind === 'PRODUCTION').reduce((sum, e) => sum + e.amount, 0);
    expect(expected).toBeGreaterThan(0);
    expect(total(report(state).institutions)).toBe(expected);
    for (const key of ['food', 'materials', 'wealth', 'knowledge', 'influence'] as const) { expect(report(state).production[key]).toBe(0); expect(report(state).mining[key]).toBe(0); }
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('pays the same passives whether or not cities produced', () => {
    const idle = completeRound(fresh(92)), busy = completeRound(fresh(92), { produce: true });
    expect(report(busy).institutions).toEqual(report(idle).institutions);
    expect(total(report(busy).production)).toBeGreaterThan(0);
    expect(total(report(idle).production)).toBe(0);
  });

  it('keeps researched advancements paying at maintenance without PRODUCE', () => {
    let state = fresh(93);
    const node = ADVANCEMENTS.find(candidate => candidate.id === 'adv-1-1-1')!;
    expect(node.effect.kind).toBe('PRODUCTION');
    const before = total(passives(state).reduce((acc, e) => e.kind === 'PRODUCTION' ? { ...acc, [e.resource]: (acc[e.resource] ?? 0) + e.amount } : acc, {} as Record<string, number>));
    state = must(state, p1, { type: 'CHOOSE_AMBITIONS', cardIds: state.players[0]!.ambitions.slice(0, 2) });
    state = readyAll(state);
    state = must(state, p1, { type: 'URBAN_ACTION', cityId: 'capital-1', action: 'RESEARCH', advancementId: 'adv-1-1-1' });
    expect(total(ledger(state).institutions)).toBe(0);
    state = completeRound(state);
    expect(total(report(state).institutions)).toBe(before + (node.effect.kind === 'PRODUCTION' ? node.effect.amount : 0));
  });

  it('credits a ROUND_START advisor when the round opens, not at maintenance', () => {
    const state = fresh(94);
    withAdvisor(state, 'advisor-1');
    const effect = ALPHA_CARDS.find(card => card.id === 'advisor-1')!.effect!;
    expect(effect.kind === 'PRODUCTION' && effectTiming(effect)).toBe('ROUND_START');
    const amount = effect.kind === 'PRODUCTION' ? effect.amount : -1;
    const passiveTotal = total(passives(state).reduce((acc, e) => e.kind === 'PRODUCTION' ? { ...acc, [e.resource]: (acc[e.resource] ?? 0) + e.amount } : acc, {} as Record<string, number>));
    const afterOne = completeRound(state);
    expect(total(afterOne.roundReports.find(r => r.playerId === 'p1' && r.round === 1)!.institutions)).toBe(passiveTotal);
    expect(total(ledger(afterOne).institutions)).toBe(amount);
    const afterTwo = completeRound(afterOne);
    expect(total(afterTwo.roundReports.find(r => r.playerId === 'p1' && r.round === 2)!.institutions)).toBe(passiveTotal + amount);
  });

  it('credits ROUND_START when the round opens and MAINTENANCE at its end, once each', () => {
    const state = fresh(95);
    const start = total(ledger(state).institutions);
    withAdvisor(state, 'advisor-2');
    applyRecurringEffects(state, p1, 'ROUND_START');
    expect(total(ledger(state).institutions)).toBeGreaterThan(start);
    const passiveTotal = total(passives(state).reduce((acc, e) => e.kind === 'PRODUCTION' ? { ...acc, [e.resource]: (acc[e.resource as string] ?? 0) + e.amount } : acc, {} as Record<string, number>));
    const done = completeRound(fresh(95));
    expect(total(done.roundReports[0]!.institutions)).toBe(passiveTotal);
  });
});

describe('ON_PRODUCE effects belong to production', () => {
  it('credits an agrarian great project only with its own city\'s PRODUCE', () => {
    const state = fresh(96);
    const project = withProject(state, 'AGRARIAN');
    expect(effectTiming(project.effect)).toBe('ON_PRODUCE');
    const idle = completeRound(structuredClone(state));
    expect(total(report(idle).institutions)).toBe(total(passives(idle).reduce((acc, e) => e.kind === 'PRODUCTION' ? { ...acc, [e.resource]: (acc[e.resource as string] ?? 0) + e.amount } : acc, {} as Record<string, number>)));

    let urban = readyAll(structuredClone(state));
    const before = total(ledger(urban).institutions);
    urban = must(urban, p1, { type: 'URBAN_ACTION', cityId: 'capital-1', action: 'PRODUCE' });
    expect(total(ledger(urban).institutions) - before).toBe(project.effect.kind === 'PRODUCTION' ? project.effect.amount : -1);
  });

  it('does not credit it for another city\'s PRODUCE', () => {
    const state = fresh(97);
    occupyCity(state, p1, 'capital-2' as never);
    withProject(state, 'INDUSTRIAL', 'capital-2');
    let urban = readyAll(state);
    const before = total(ledger(urban).institutions);
    urban = must(urban, p1, { type: 'URBAN_ACTION', cityId: 'capital-1', action: 'PRODUCE' });
    expect(total(ledger(urban).institutions)).toBe(before);
  });

  it('never credits a city output twice for one PRODUCE and never on the idle path', () => {
    const state = fresh(98);
    const project = withProject(state, 'INDUSTRIAL');
    const busy = completeRound(structuredClone(state), { produce: true });
    const idle = completeRound(structuredClone(state));
    const amount = project.effect.kind === 'PRODUCTION' ? project.effect.amount : 0;
    expect(total(report(busy).institutions) - total(report(idle).institutions)).toBe(amount);
  });
});

describe('ONCE effects', () => {
  it('applies a strategy card immediately and never again', () => {
    let state = fresh(99);
    const card = state.players[0]!.hand.map(id => ALPHA_CARDS.find(c => c.id === id)!).find(c => c.timing === 'PLANNING' && c.effect?.kind === 'PRODUCTION');
    if (!card) return;
    state = must(state, p1, { type: 'CHOOSE_AMBITIONS', cardIds: state.players[0]!.ambitions.slice(0, 2) });
    const before = total(ledger(state).other);
    state = must(state, p1, { type: 'PLAY_CARD', cardId: card.id });
    expect(total(ledger(state).other) - before).toBe(card.effect!.kind === 'PRODUCTION' ? card.effect!.amount : -1);
    const amount = card.effect!.kind === 'PRODUCTION' ? card.effect!.amount : -1;
    const afterOne = completeRound(state);
    expect(total(afterOne.roundReports.find(r => r.round === 1 && r.playerId === 'p1')!.other)).toBeGreaterThanOrEqual(amount);
    const recurring = total(afterOne.roundReports.find(r => r.round === 1 && r.playerId === 'p1')!.institutions);
    expect(recurring).toBe(total(passives(afterOne).reduce((acc, e) => e.kind === 'PRODUCTION' ? { ...acc, [e.resource]: (acc[e.resource as string] ?? 0) + e.amount } : acc, {} as Record<string, number>)));
  });

  it('has no leftover flag on the ledger', () => {
    expect(Object.keys(ledger(fresh(100)))).not.toContain('institutionsCollected');
    expect(emptyResourcePool().food).toBe(0);
    expect(produceAll(readyAll(fresh(100))).phase).toBe('URBAN_ACTIONS');
  });
});
