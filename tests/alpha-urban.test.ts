import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, PlayerIdSchema, alphaToLegacyResources, type AlphaState } from '@aoh/game-domain';
import { alphaStorageCapacity, applyAlphaCommand, beginAlphaPlanning, createAlphaGame, deriveCityProductionBreakdown, occupyCity } from '@aoh/game-engine';
import { completeRound, must, readyAll } from './alpha-rounds.js';

const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
const c1 = 'capital-1', c2 = 'capital-2';

/** A two-player match whose PLANNING has just closed, so every city may take its urban action. */
function urban(seed = 61): AlphaState { return readyAll(beginAlphaPlanning(createAlphaGame({ gameId: `urban-${seed}`, seed, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }))); }
const act = (state: AlphaState, actor = p1, cityId = c1, extra: Record<string, unknown> = {}) => applyAlphaCommand(state, actor, { type: 'URBAN_ACTION', expectedVersion: state.version, cityId, ...extra });
const pool = (state: AlphaState, index = 0) => state.players[index]!.resources;
const meta = (state: AlphaState, id = c1) => state.cities.find(c => c.cityId === id)!;
const coreCity = (state: AlphaState, index = 0) => state.core.players[index]!.civilization.cities[0]!;

describe('urban actions: legality', () => {
  it('opens in URBAN_ACTIONS with every city fresh and refuses the command elsewhere', () => {
    const planning = beginAlphaPlanning(createAlphaGame({ gameId: 'urban-phase', seed: 61, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));
    expect(act(planning, p1, c1, { action: 'PRODUCE' })).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } });
    planning.cities[0]!.urbanActionsUsed = 1;
    const state = readyAll(planning);
    expect(state.phase).toBe('URBAN_ACTIONS');
    expect(state.cities.every(c => c.urbanActionsUsed === 0)).toBe(true);
    expect(act(state, p1, c1, { action: 'PRODUCE' }).ok).toBe(true);
  });

  it('allows exactly one action per city per round and resets it next round', () => {
    let state = must(urban(), p1, { type: 'URBAN_ACTION', cityId: c1, action: 'PRODUCE' });
    expect(meta(state).urbanActionsUsed).toBe(1);
    const again = act(state, p1, c1, { action: 'PROMOTE_MOOD' });
    expect(again).toMatchObject({ ok: false, error: { code: 'RULE_FAILURE', message: expect.stringContaining('já usou') } });
    expect(act(state, p2, c2, { action: 'PRODUCE' }).ok).toBe(true);
    state = completeRound(state);
    expect(state.core.round).toBe(2);
    state = readyAll(state);
    expect(meta(state).urbanActionsUsed).toBe(0);
    expect(act(state, p1, c1, { action: 'PRODUCE' }).ok).toBe(true);
  });

  it('refuses another civilization\'s city, unknown cities and forged actors', () => {
    const state = urban();
    expect(act(state, p1, c2, { action: 'PRODUCE' })).toMatchObject({ ok: false });
    expect(act(state, p2, c1, { action: 'PRODUCE' })).toMatchObject({ ok: false });
    expect(act(state, p1, 'nowhere', { action: 'PRODUCE' })).toMatchObject({ ok: false });
    expect(meta(state).urbanActionsUsed).toBe(0);
  });

  it('refuses missing or stray parameters and leaves the state untouched', () => {
    const state = urban(); const before = JSON.stringify(state);
    for (const extra of [{ action: 'BUILD' }, { action: 'RECRUIT' }, { action: 'RESEARCH' }, { action: 'PRODUCE', unit: 'INFANTRY' }, { action: 'PROMOTE_MOOD', advancementId: 'adv-1-1-1' }, { action: 'CIVIC_ACTION', build: { kind: 'FORTIFICATION' } }])
      expect(act(state, p1, c1, extra).ok).toBe(false);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('refuses every action except CIVIC_ACTION in an occupied city', () => {
    const state = urban();
    state.cities.find(c => c.cityId === c2)!.status = 'OCCUPIED';
    for (const action of ['PRODUCE', 'PROMOTE_MOOD', 'SUPPORT_TRADE']) expect(act(state, p2, c2, { action })).toMatchObject({ ok: false });
  });

  it('is rejected after the player confirms the phase', () => {
    const state = must(urban(), p1, { type: 'READY' });
    expect(act(state, p1, c1, { action: 'PRODUCE' })).toMatchObject({ ok: false, error: { code: 'ALREADY_READY' } });
  });
});

describe('urban actions: PRODUCE', () => {
  it('produces only when a city acts, exactly what its breakdown says, and records it', () => {
    const state = urban();
    const expected = deriveCityProductionBreakdown(coreCity(state), state.core.players[0]!.civilization, state.core.config, state.core.map).total;
    const after = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'PRODUCE' });
    const ledger = after.roundLedgers.find(l => l.playerId === p1)!;
    expect(ledger.production).toEqual(expected);
    expect(after.events.some(e => e.type === 'URBAN_ACTION' && e.audience?.includes(p1))).toBe(true);
    expect(after.telemetry.actionsByType.PRODUCE).toBe(1);
    expect(after.telemetry.productionByResource.food).toBeGreaterThan(0);
  });

  it('credits persistent institutional production once per round, on the first PRODUCE', () => {
    const state = urban();
    expect(state.roundLedgers.find(l => l.playerId === p1)!.institutionsCollected).toBe(false);
    const first = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'PRODUCE' });
    const ledger = first.roundLedgers.find(l => l.playerId === p1)!;
    expect(ledger.institutionsCollected).toBe(true);
    expect(Object.values(ledger.institutions).some(v => v > 0)).toBe(true);
    const again = structuredClone(first); again.cities.find(c => c.cityId === c1)!.urbanActionsUsed = 0;
    const second = must(again, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'PRODUCE' });
    expect(second.roundLedgers.find(l => l.playerId === p1)!.institutions).toEqual(ledger.institutions);
  });

  it('discards what does not fit and records the discard', () => {
    const state = urban();
    const cap = alphaStorageCapacity(state, p1);
    pool(state).food = cap.foodCapacity;
    state.core.players[0]!.resources = alphaToLegacyResources(pool(state));
    const after = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'PRODUCE' });
    expect(pool(after).food).toBe(cap.foodCapacity);
    const ledger = after.roundLedgers.find(l => l.playerId === p1)!;
    expect(ledger.discarded.food).toBe(ledger.production.food + ledger.institutions.food);
    expect(after.events.some(e => e.type === 'STORAGE_DISCARD')).toBe(true);
  });

  it('gives no output from an idle city and none automatically between rounds', () => {
    const state = urban();
    const after = completeRound(state);
    for (const report of after.roundReports) for (const key of ['food', 'materials', 'wealth', 'knowledge', 'influence'] as const) { expect(report.production[key]).toBe(0); expect(report.mining[key]).toBe(0); }
  });

  it('scales with mood and stays zero for a revolting city', () => {
    const state = urban();
    meta(state).mood = 0;
    const after = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'PRODUCE' });
    const ledger = after.roundLedgers.find(l => l.playerId === p1)!;
    for (const key of ['food', 'materials', 'wealth', 'knowledge', 'influence'] as const) expect(ledger.production[key]).toBe(0);
  });
});

describe('urban actions: BUILD', () => {
  it('builds a district through the current catalog, charges it and syncs the city record', () => {
    const state = urban();
    const before = alphaToLegacyResources(pool(state));
    const after = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'BUILD', build: { kind: 'DISTRICT', district: 'AGRARIAN' } });
    expect(coreCity(after).districts.map(d => d.type)).toContain('AGRARIAN');
    expect(meta(after).districts).toContain('AGRARIAN');
    expect(alphaToLegacyResources(pool(after)).materials).toBe(before.materials - 2);
    expect(after.roundLedgers.find(l => l.playerId === p1)!.expenses.materials).toBe(2);
    expect(AlphaStateSchema.safeParse(after).success).toBe(true);
  });

  it('builds a building only where its district exists', () => {
    const state = urban();
    expect(act(state, p1, c1, { action: 'BUILD', build: { kind: 'BUILDING', building: 'GRANARY' } })).toMatchObject({ ok: false });
    coreCity(state).districts.push({ type: 'AGRARIAN', builtRound: 1 });
    const after = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'BUILD', build: { kind: 'BUILDING', building: 'GRANARY' } });
    expect(meta(after).buildings).toContain('GRANARY');
  });

  it('refuses a build it cannot afford without changing anything', () => {
    const state = urban();
    Object.assign(pool(state), { wood: 0, stone: 0, metal: 0, wealth: 0 });
    state.core.players[0]!.resources = alphaToLegacyResources(pool(state));
    const before = JSON.stringify(state);
    expect(act(state, p1, c1, { action: 'BUILD', build: { kind: 'DISTRICT', district: 'ACADEMIC' } }).ok).toBe(false);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('upgrades fortifications in order, gating advanced levels on era, a Military district and metal', () => {
    const state = urban();
    const first = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'BUILD', build: { kind: 'FORTIFICATION' } });
    expect(meta(first).fortification).toEqual({ level: 'PALISADE', state: 'INTACT' });
    expect(first.roundLedgers.find(l => l.playerId === p1)!.expenses.materials).toBe(2);

    const advanced = urban(62);
    meta(advanced).fortification = { level: 'STONE_WALL', state: 'INTACT' };
    expect(act(advanced, p1, c1, { action: 'BUILD', build: { kind: 'FORTIFICATION' } })).toMatchObject({ ok: false, error: { message: expect.stringContaining('era') } });
    advanced.players[0]!.era = 'CIVILIZATION';
    expect(act(advanced, p1, c1, { action: 'BUILD', build: { kind: 'FORTIFICATION' } })).toMatchObject({ ok: false, error: { message: expect.stringContaining('Militar') } });
    coreCity(advanced).districts.push({ type: 'MILITARY', builtRound: 1 });
    Object.assign(pool(advanced), { wood: 10, stone: 10, metal: 3, wealth: 10 });
    advanced.core.players[0]!.resources = alphaToLegacyResources(pool(advanced));
    const done = must(advanced, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'BUILD', build: { kind: 'FORTIFICATION' } });
    expect(meta(done).fortification.level).toBe('FORTRESS');
    expect(pool(done).metal).toBe(2);
  });

  it('stops at the highest fortification', () => {
    const state = urban();
    meta(state).fortification = { level: 'CITADEL', state: 'INTACT' };
    expect(act(state, p1, c1, { action: 'BUILD', build: { kind: 'FORTIFICATION' } })).toMatchObject({ ok: false });
  });
});

describe('urban actions: RECRUIT', () => {
  it('recruits a military piece and charges its catalog cost', () => {
    const state = urban();
    const before = alphaToLegacyResources(pool(state)), units = state.units.length;
    const after = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'RECRUIT', unit: 'INFANTRY' });
    expect(after.units).toHaveLength(units + 1);
    expect(alphaToLegacyResources(pool(after)).food).toBe(before.food - state.rules.units.INFANTRY.cost.food);
    expect(after.telemetry.unitRecruitment.INFANTRY).toBe(1);
  });

  it('recruits civilian pieces without a Military district or any soldiers', () => {
    for (const unit of ['EXPLORER', 'ENVOY', 'PIONEER'] as const) {
      const state = urban();
      expect(coreCity(state).districts.some(d => d.type === 'MILITARY')).toBe(false);
      expect(coreCity(state).workers.soldiers).toBe(0);
      Object.assign(pool(state), { food: 10, wealth: 10, influence: 8, wood: 6, stone: 6 });
      state.core.players[0]!.resources = alphaToLegacyResources(pool(state));
      expect(act(state, p1, c1, { action: 'RECRUIT', unit }).ok, unit).toBe(true);
    }
  });

  it('keeps military pieces behind their district and era', () => {
    const state = urban();
    expect(act(state, p1, c1, { action: 'RECRUIT', unit: 'GUARD' })).toMatchObject({ ok: false, error: { message: expect.stringContaining('Militar') } });
    expect(act(state, p1, c1, { action: 'RECRUIT', unit: 'SIEGE' })).toMatchObject({ ok: false });
  });

  it('spends metal on advanced pieces', () => {
    const state = urban();
    state.players[0]!.era = 'CIVILIZATION';
    coreCity(state).districts.push({ type: 'MILITARY', builtRound: 1 });
    Object.assign(pool(state), { wood: 10, stone: 10, metal: 5, wealth: 10, food: 10 });
    state.core.players[0]!.resources = alphaToLegacyResources(pool(state));
    const after = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'RECRUIT', unit: 'SIEGE' });
    expect(pool(after).metal).toBe(5 - state.rules.units.SIEGE.metal);
    expect(state.rules.units.SIEGE.metal).toBeGreaterThan(0);
  });

  it('lets wealth cover a missing metal cost only up to the substitution limit', () => {
    const state = urban();
    state.players[0]!.era = 'CIVILIZATION';
    coreCity(state).districts.push({ type: 'MILITARY', builtRound: 1 });
    Object.assign(pool(state), { wood: 10, stone: 10, metal: 0, wealth: 30, food: 10 });
    state.core.players[0]!.resources = alphaToLegacyResources(pool(state));
    const cost = state.rules.units.SIEGE;
    const materialUnits = cost.cost.materials + cost.metal;
    const shortfall = cost.metal;
    const allowed = shortfall <= Math.floor(materialUnits * state.rules.balance.wealthMaterialCostPercentMax / 100);
    expect(act(state, p1, c1, { action: 'RECRUIT', unit: 'SIEGE' }).ok).toBe(allowed);
  });
});

describe('urban actions: RESEARCH', () => {
  it('spends knowledge and records the domain', () => {
    const state = urban();
    const knowledge = pool(state).knowledge;
    const after = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'RESEARCH', advancementId: 'adv-1-1-1' });
    expect(after.players[0]!.research).toEqual(['adv-1-1-1']);
    expect(pool(after).knowledge).toBe(knowledge - 2);
    expect(Object.values(after.telemetry.researchByDomain).reduce((a, b) => a + b, 0)).toBe(1);
  });

  it('respects prerequisites, era and unknown advancements', () => {
    const state = urban();
    expect(act(state, p1, c1, { action: 'RESEARCH', advancementId: 'adv-2-1-1' }).ok).toBe(false);
    expect(act(state, p1, c1, { action: 'RESEARCH', advancementId: 'nope' }).ok).toBe(false);
    pool(state).knowledge = 0; state.core.players[0]!.resources = alphaToLegacyResources(pool(state));
    expect(act(state, p1, c1, { action: 'RESEARCH', advancementId: 'adv-1-1-1' }).ok).toBe(false);
  });
});

describe('urban actions: PROMOTE_MOOD', () => {
  it('spends the configured wealth to raise mood one step', () => {
    const state = urban();
    const wealth = pool(state).wealth, mood = meta(state).mood;
    const after = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'PROMOTE_MOOD' });
    expect(meta(after).mood).toBe(mood + 1);
    expect(pool(after).wealth).toBe(wealth - state.rules.balance.publicInvestmentCost);
  });

  it('never lifts a city above the ceiling on its own', () => {
    const state = urban();
    meta(state).mood = state.rules.balance.promoteMoodCeiling;
    expect(act(state, p1, c1, { action: 'PROMOTE_MOOD' })).toMatchObject({ ok: false });
    expect(meta(state).mood).toBe(5);
  });

  it('needs the wealth', () => {
    const state = urban();
    pool(state).wealth = 1; state.core.players[0]!.resources = alphaToLegacyResources(pool(state));
    expect(act(state, p1, c1, { action: 'PROMOTE_MOOD' }).ok).toBe(false);
  });
});

describe('urban actions: SUPPORT_TRADE and CIVIC_ACTION', () => {
  it('refuses trade support without an active route from the city', () => {
    expect(act(urban(), p1, c1, { action: 'SUPPORT_TRADE' })).toMatchObject({ ok: false });
  });

  it('pays configured income for each route the city originates', () => {
    const state = urban();
    state.rules.routeIncome = 3; state.rules.foreignRouteIncome = 2;
    state.routes.push({ id: 'r1', ownerId: p1, fromCityId: c1 as never, toCityId: c2 as never, path: state.core.map.slice(0, 3).map(t => t.id), suspended: false });
    const [w1, w2] = [pool(state, 0).wealth, pool(state, 1).wealth];
    const after = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'SUPPORT_TRADE' });
    expect(pool(after, 0).wealth).toBe(w1 + 3);
    expect(pool(after, 1).wealth).toBe(w2 + 2);
    expect(after.roundLedgers.find(l => l.playerId === p2)!.trade.wealth).toBe(2);
  });

  it('gives an owned city influence and cohesion', () => {
    const state = urban();
    const influence = pool(state).influence, cohesion = meta(state).localCohesion;
    const after = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'CIVIC_ACTION' });
    expect(pool(after).influence).toBe(influence + state.rules.balance.civicInfluence);
    expect(meta(after).localCohesion).toBe(Math.min(100, cohesion + state.rules.balance.civicCohesion));
  });

  it('integrates an occupied city step by step and frees it at 100', () => {
    let state = urban();
    const target = c2;
    occupyCity(state, p1, target as never);
    expect(state.cities.find(c => c.cityId === target)).toMatchObject({ status: 'OCCUPIED', integration: 0, currentOwnerId: p1 });
    const step = state.rules.balance.integrationPerAction, needed = Math.ceil(100 / step);
    for (let i = 0; i < needed; i++) {
      expect(state.cities.find(c => c.cityId === target)!.status).toBe('OCCUPIED');
      state = must(state, p1, { type: 'URBAN_ACTION', cityId: target, action: 'CIVIC_ACTION' });
      expect(state.cities.find(c => c.cityId === target)!.integration).toBe(Math.min(100, (i + 1) * step));
      state.cities.find(c => c.cityId === target)!.urbanActionsUsed = 0;
    }
    expect(state.cities.find(c => c.cityId === target)!.status).toBe('OWNED');
    expect(state.occupations.some(o => o.cityId === target)).toBe(false);
  });
});
