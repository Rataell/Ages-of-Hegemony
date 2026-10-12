import { describe, expect, it } from 'vitest';
import { alphaClaimOptions, productionOutput } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { coreCity, freshGame, meta, plan, seat, shape, urban, apply, P1 } from './v12-audit-urban-helpers.js';

/**
 * Alpha V1.2 · lane A2+D · AUDIT of the urban actions: planning-time acceptances that predictably become invalid at resolution.
 *
 * Mechanism (packages/game-engine): while planning, `URBAN_ACTION` only runs `urbanBlock` against the CURRENT state and stores the plan
 * (alpha-turn.ts:130-133). Nothing is reserved. At the end of planning `resolvePlannedActions` (alpha-phases.ts:179) runs every plan
 * through `performUrbanAction` in order (slot, then initiative), each one atomic: a plan that no longer holds becomes `ACTION_FAILED`
 * and the Order is spent for nothing. Every pair of plans below is accepted by the planner and then broken by the PLAYER'S OWN earlier plan.
 *
 * Conventions (same as tests/v12-audit-combat-flow.test.ts): `it.fails` + "REPRO" is a defect that exists today and states the EXPECTED
 * behaviour (a plan the engine accepted must not fail at resolution: refuse it up front or honour it). It goes green while the defect
 * exists and turns red when fixed: flip it to a plain `it`. Plain `it` is a GUARD (correct today) or a CHARACTERIZATION (behaviour the
 * report classifies as a rule/UX decision). IDs (U-nn) match docs/audit/alpha-v1.2-lane-a2d-sources-cities-urban.md.
 */
const rich = (state: ReturnType<typeof freshGame>, pool: Partial<ReturnType<typeof seat>['resources']> = {}) => { Object.assign(seat(state).resources, { food: 12, wood: 10, stone: 8, wealth: 0, knowledge: 8, influence: 8, culture: 0, metal: 0 }, pool); };

describe('U-01 · resources are not reserved across plans', () => {
  const setup = () => {
    const state = freshGame();
    shape(state, 'VILLAGE', 6, { producers: 3, scholars: 3 });          // two district slots
    seat(state).research.push('web-agriculture', 'web-masonry');         // AGRARIAN (2 Madeira) and INDUSTRIAL (3 Madeira)
    rich(state, { wood: 4, stone: 0, wealth: 0 });                       // 4 pays either one, never both; no Riqueza to substitute
    return state;
  };
  const commands = (state: ReturnType<typeof freshGame>) => [urban(meta(state).cityId, 'BUILD', { build: { kind: 'DISTRICT', district: 'AGRARIAN' } }), urban(meta(state).cityId, 'BUILD', { build: { kind: 'DISTRICT', district: 'INDUSTRIAL' } })];
  it.fails('REPRO U-01 (BUG/UX): two Construir plans that each fit the stock but not together are both accepted, the second dies at resolution', () => {
    const state = setup();
    const outcome = plan(state, commands(state));
    expect(outcome.failures, 'accepted plans that failed at resolution').toEqual([]);
  });
  it('CHARACTERIZATION U-01: both plans are accepted while planning and the second becomes ACTION_FAILED (the Order is spent)', () => {
    const state = setup();
    const outcome = plan(state, commands(state));
    expect(outcome.accepted).toHaveLength(2);
    expect(outcome.failures).toHaveLength(1);
    expect(outcome.failures[0]).toMatch(/Recursos insuficientes/);
    expect(coreCity(outcome.after).districts.map(d => d.type)).toEqual(['AGRARIAN']);
  });
});

describe('U-02 · the same district or building planned twice / more districts than slots', () => {
  it.fails('REPRO U-02a (BUG/UX): the same district planned twice in one city is accepted twice', () => {
    const state = freshGame();
    shape(state, 'VILLAGE', 6, { producers: 3, scholars: 3 }); seat(state).research.push('web-agriculture'); rich(state);
    const outcome = plan(state, [urban(meta(state).cityId, 'BUILD', { build: { kind: 'DISTRICT', district: 'AGRARIAN' } }), urban(meta(state).cityId, 'BUILD', { build: { kind: 'DISTRICT', district: 'AGRARIAN' } })]);
    expect(outcome.failures).toEqual([]);
  });
  it.fails('REPRO U-02b (BUG/UX): two different districts for a city with ONE free slot are both accepted', () => {
    const state = freshGame();
    shape(state, 'OUTPOST', 4, { producers: 2, scholars: 2 }); seat(state).research.push('web-agriculture', 'web-masonry'); rich(state);
    const outcome = plan(state, [urban(meta(state).cityId, 'BUILD', { build: { kind: 'DISTRICT', district: 'AGRARIAN' } }), urban(meta(state).cityId, 'BUILD', { build: { kind: 'DISTRICT', district: 'INDUSTRIAL' } })]);
    expect(outcome.failures).toEqual([]);
  });
});

describe('U-03 · Elevar planned twice in the same round', () => {
  it.fails('REPRO U-03 (BUG/UX): two ELEVATE plans are accepted (both read the same current level); the second fails on Era/population at resolution', () => {
    const state = freshGame();
    shape(state, 'OUTPOST', 8, { producers: 4, scholars: 4 }); seat(state).research.push('web-agriculture', 'web-masonry'); rich(state, { wood: 12, stone: 6, wealth: 4 });
    const outcome = plan(state, [urban(meta(state).cityId, 'ELEVATE'), urban(meta(state).cityId, 'ELEVATE')]);
    expect(outcome.failures).toEqual([]);
  });
});

describe('U-04 · Recrutar mobilizes an inhabitant at once and can starve a later Elevar of its minimum population', () => {
  const setup = () => {
    const state = freshGame();
    shape(state, 'OUTPOST', 4, { producers: 2, soldiers: 1, unassigned: 1 });   // exactly the 4 inhabitants a Posto needs to Elevar
    seat(state).research.push('web-agriculture'); rich(state, { wood: 6, food: 10 });
    return state;
  };
  it.fails('REPRO U-04 (BUG/UX): [Recrutar, Elevar] is accepted; Recrutar drops the city to 3 inhabitants and Elevar (needs 4) fails at resolution', () => {
    const state = setup();
    const id = meta(state).cityId;
    const outcome = plan(state, [urban(id, 'RECRUIT', { unit: 'INFANTRY' }), urban(id, 'ELEVATE')]);
    expect(outcome.failures).toEqual([]);
  });
  it('GUARD U-04: the opposite order [Elevar, Recrutar] works, so the failure is pure plan-order dependence', () => {
    const state = setup();
    const id = meta(state).cityId;
    const outcome = plan(state, [urban(id, 'ELEVATE'), urban(id, 'RECRUIT', { unit: 'INFANTRY' })]);
    expect(outcome.failures).toEqual([]);
    expect(meta(outcome.after).level).toBe('HAMLET');
  });
});

describe('U-05 · a FREE redistribution after planning breaks a Recrutar plan the engine already accepted', () => {
  it.fails('REPRO U-05 (BUG/UX): Recrutar is planned with 1 Soldado, then ASSIGN_POPULATION (free, sem Ordem) removes the Soldado; the plan fails at resolution', () => {
    const state = freshGame();
    shape(state, 'OUTPOST', 4, { producers: 2, soldiers: 1, scholars: 1 }); rich(state, { wood: 6, food: 10 });
    const id = meta(state).cityId;
    const planned = apply(state, urban(id, 'RECRUIT', { unit: 'INFANTRY' }));
    if (!planned.ok) throw new Error(planned.error.message);
    const moved = apply(planned.value, { type: 'MANAGE', command: { type: 'ASSIGN_POPULATION', playerId: P1, cityId: id, workers: { producers: 4, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned: 0 }, expectedVersion: planned.value.core.version } });
    // Either the free action is refused (it would break a reserved Order) or the resolver can still recruit.
    const outcome = plan(moved.ok ? moved.value : planned.value, []);
    expect(outcome.failures).toEqual([]);
  });
});

describe('U-06 · Avanço plans share one Conhecimento stock', () => {
  it.fails('REPRO U-06 (BUG/UX): three 2-Conhecimento advances are accepted with 4 Conhecimento; the third fails at resolution', () => {
    const state = freshGame();
    rich(state, { knowledge: 4 });
    const id = meta(state).cityId;
    const outcome = plan(state, ['web-agriculture', 'web-masonry', 'web-writing'].map(advancementId => urban(id, 'RESEARCH', { advancementId })));
    expect(outcome.accepted).toHaveLength(3);
    expect(outcome.failures).toEqual([]);
  });
  it('GUARD U-06: the same advance planned twice is refused (the E-1 reservation of alpha-urban.ts:133 works)', () => {
    const state = freshGame(); rich(state);
    const id = meta(state).cityId;
    const first = apply(state, urban(id, 'RESEARCH', { advancementId: 'web-agriculture' }));
    expect(first.ok).toBe(true);
    if (first.ok) expect(apply(first.value, urban(id, 'RESEARCH', { advancementId: 'web-agriculture' }))).toMatchObject({ ok: false });
  });
  it('CHARACTERIZATION U-06 (UX): an advance cannot be planned together with the one it opens — the planner is conservative about chains', () => {
    const state = freshGame(); rich(state);
    const id = meta(state).cityId;
    const first = apply(state, urban(id, 'RESEARCH', { advancementId: 'web-masonry' }));
    if (!first.ok) throw new Error(first.error.message);
    expect(apply(first.value, urban(id, 'RESEARCH', { advancementId: 'web-metallurgy' }))).toMatchObject({ ok: false });
  });
});

describe('U-07 · Governar planned twice', () => {
  // Fixed by D4 (Governar com escolha explícita): the planner replays the earlier plans, so the second Governar is refused up front instead of dying at resolution.
  it('FIXED U-07 (D4): [Governar, Governar] on an Estável city: the second is refused while planning, nothing fails at resolution', () => {
    const state = freshGame();
    shape(state, 'VILLAGE', 6, { producers: 3, scholars: 3 }); meta(state).mood = 4; rich(state, { culture: 6 });
    const id = meta(state).cityId;
    const outcome = plan(state, [urban(id, 'PROMOTE_MOOD'), urban(id, 'PROMOTE_MOOD')]);
    expect(outcome.failures).toEqual([]);
    expect(outcome.refused).toHaveLength(1);
  });
});

describe('U-08 · the Próspera bonus belongs to the FIRST activation, but Recrutar is checked as if it were always first', () => {
  const setup = () => {
    const state = freshGame();
    shape(state, 'VILLAGE', 6, { producers: 3, soldiers: 3 });          // Capacidade 2; Próspera makes the first activation 3
    meta(state).mood = 5; rich(state, { wood: 12, food: 12 });
    return state;
  };
  it.fails('REPRO U-08 (BUG/UX): [Produzir, Recrutar x3] is accepted (limit read as 3) and Recrutar, now the 2nd activation (Capacidade 2), fails whole', () => {
    const state = setup();
    const id = meta(state).cityId;
    const outcome = plan(state, [urban(id, 'PRODUCE'), urban(id, 'RECRUIT', { unit: 'INFANTRY', count: 3 })]);
    expect(outcome.failures).toEqual([]);
  });
  it('GUARD U-08: [Recrutar x3, Produzir] works — the first activation is the one with the bonus', () => {
    const state = setup();
    const id = meta(state).cityId;
    const outcome = plan(state, [urban(id, 'RECRUIT', { unit: 'INFANTRY', count: 3 }), urban(id, 'PRODUCE')]);
    expect(outcome.failures).toEqual([]);
  });
});

describe('U-09 · the Produzir preview of a Próspera city shows the bonus Capacity for every planned Produzir', () => {
  it.fails('REPRO U-09 (UX): with one Produzir already planned the preview of the second still includes the first-activation bonus; the second credits less', () => {
    let state = freshGame();
    shape(state, 'OUTPOST', 4, { producers: 4 });
    meta(state).mood = 5; rich(state);
    // Two claimed and worked hexes, through the engine's own commands, so that the extra Capacity of Próspera (1 -> 2) shows in the yield.
    const city = coreCity(state);
    let claimed = state;
    for (const hexId of (alphaClaimOptions(state, P1)[city.id] ?? []).slice(0, 2)) {
      const result = apply(claimed, { type: 'MANAGE', command: { type: 'CLAIM_HEX', playerId: P1, cityId: city.id, hexId, expectedVersion: claimed.core.version } });
      if (!result.ok) throw new Error(result.error.message);
      claimed = result.value;
    }
    const worked = claimed.core.map.filter(tile => tile.controllerCityId === city.id && tile.id !== city.hexId).map(tile => tile.id);
    expect(worked).toHaveLength(2);
    const assigned = apply(claimed, { type: 'MANAGE', command: { type: 'ASSIGN_WORKED_HEXES', playerId: P1, cityId: city.id, hexIds: worked, expectedVersion: claimed.core.version } });
    if (!assigned.ok) throw new Error(assigned.error.message);
    state = assigned.value;
    const id = meta(state).cityId;
    const first = apply(state, urban(id, 'PRODUCE'));
    if (!first.ok) throw new Error(first.error.message);
    const previewed = productionOutput(first.value, P1, id).output;              // what the planner shows for the second Produzir
    const resolving = structuredClone(first.value); meta(resolving).urbanActionsUsed = 1;
    const realised = productionOutput(resolving, P1, id).output;                 // what the second Produzir really credits
    expect(realised).toEqual(previewed);
  });
});

describe('U-10 · 2nd activation Ânimo penalty (canon §10) — where it lives and that it works', () => {
  it('GUARD U-10: the 2nd activation costs 1 Ânimo, charged at the END of performUrbanAction (alpha-urban.ts:371-375), not for Avanço', () => {
    const state = freshGame(); meta(state).mood = 4; rich(state);
    const id = meta(state).cityId;
    const once = plan(state, [urban(id, 'PRODUCE')]);
    const twice = plan(freshGameWithMood(4), [urban(id, 'PRODUCE'), urban(id, 'PRODUCE')]);
    const withResearch = plan(freshGameWithMood(4), [urban(id, 'PRODUCE'), urban(id, 'RESEARCH', { advancementId: 'web-agriculture' })]);
    expect(meta(once.after).mood).toBe(4);
    expect(meta(twice.after).mood).toBe(3);
    expect(meta(withResearch.after).mood).toBe(4);
  });
  it('GUARD U-10: an Abalada city is held to ONE planned activation', () => {
    const state = freshGame(); meta(state).mood = 3; rich(state);
    const id = meta(state).cityId;
    const first = apply(state, urban(id, 'PRODUCE'));
    expect(first.ok).toBe(true);
    if (first.ok) expect(apply(first.value, urban(id, 'PRODUCE'))).toMatchObject({ ok: false });
  });
  it('CHARACTERIZATION U-10 (BALANCE): two Produzir in one round credit twice; the only price is 1 Ânimo, recovered by Governar (itself an activation)', () => {
    const one = plan(freshGameWithMood(4), [urban(meta(freshGame()).cityId, 'PRODUCE')]);
    const two = plan(freshGameWithMood(4), [urban(meta(freshGame()).cityId, 'PRODUCE'), urban(meta(freshGame()).cityId, 'PRODUCE')]);
    const food = (o: { after: ReturnType<typeof freshGame> }) => o.after.roundReports.find(r => r.playerId === P1 && r.round === 1)!.production.food;
    expect(food(two)).toBe(2 * food(one));
  });
});

describe('U-11 · storage: Produzir discards the overflow AT ONCE, before the Construir planned after it can spend the stock', () => {
  const stage = (order: 'produce-first' | 'build-first') => {
    const state = freshGame();
    shape(state, 'VILLAGE', 6, { producers: 2, artisans: 4 });                    // 4 Artesãos = 2 Madeira per Produzir
    seat(state).research.push('web-agriculture'); rich(state, { wood: 15, wealth: 0 }); // 15 = the Madeira limit
    const id = meta(state).cityId;
    const build = urban(id, 'BUILD', { build: { kind: 'DISTRICT', district: 'AGRARIAN' } }), produce = urban(id, 'PRODUCE');
    return plan(state, order === 'produce-first' ? [produce, build] : [build, produce]);
  };
  it('CHARACTERIZATION U-11 (RULE/UX): the same two plans end with more Madeira when Construir is planned first (Produzir-first discards 2 Madeira on the spot)', () => {
    const a = stage('produce-first'), b = stage('build-first');
    expect(a.failures).toEqual([]); expect(b.failures).toEqual([]);
    expect(seat(b.after).resources.wood).toBeGreaterThan(seat(a.after).resources.wood);
  });
});

describe('U-12 · the city card counts an Avanço carried by a city as one of its activations', () => {
  it.fails('REPRO U-12 (UX): [Avanço via cidade, Produzir] shows plannedUrbanActions = 2 although only 1 activation is used (engine alpha-urban.ts:49 excludes RESEARCH); the web gate then hides the 2nd real activation', () => {
    const state = freshGame(); meta(state).mood = 4; rich(state);
    const id = meta(state).cityId;
    const research = apply(state, urban(id, 'RESEARCH', { advancementId: 'web-agriculture' }));
    if (!research.ok) throw new Error(research.error.message);
    const produce = apply(research.value, urban(id, 'PRODUCE'));
    if (!produce.ok) throw new Error(produce.error.message);
    // The ENGINE still accepts a second real activation (Estável city) …
    expect(apply(produce.value, urban(id, 'PROMOTE_MOOD')).ok).toBe(true);
    // … but the projection the web gate reads (alpha-panels.tsx:32, `plannedUrbanActions >= cityActions`) already says the city is full.
    const view = alphaPlayerView(produce.value, P1)!;
    expect(view.cityStates.find(c => c.cityId === id)!.plannedUrbanActions).toBe(1);
  });
});

function freshGameWithMood(mood: number) { const state = freshGame(); meta(state).mood = mood; rich(state); return state; }
