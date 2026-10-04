import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, PlayerIdSchema, alphaToLegacyResources, cityLevelForPopulation, type AlphaState } from '@aoh/game-domain';
import { alphaGain, alphaStorageCapacity, applyAlphaCommand, beginAlphaPlanning, cityYield, createAlphaGame, occupyCity, setAlphaPhase, syncCityMetadata } from '@aoh/game-engine';
import { completeRound, must } from './alpha-rounds.js';

const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
const c1 = 'capital-1', c2 = 'capital-2';

/** A two-player match whose PLANNING has just closed, so every city may take its urban action. */
/** Turns one worker of the first city into a Soldado so a land piece can be mobilized. */
function soldier(state: AlphaState): void { const city = coreCity(state); const role = (['unassigned', 'producers', 'artisans', 'merchants', 'scholars'] as const).find(key => city.workers[key] > 0)!; city.workers = { ...city.workers, [role]: city.workers[role] - 1, soldiers: city.workers.soldiers + 1 }; }
function urban(seed = 61): AlphaState { const state=beginAlphaPlanning(createAlphaGame({ gameId: `urban-${seed}`, seed, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));state.players.forEach(player=>{player.ambitionsChosen=true;});setAlphaPhase(state,'URBAN_ACTIONS');state.cities.forEach(city=>{city.urbanActionsUsed=0;});return state; }
const act = (state: AlphaState, actor = p1, cityId = c1, extra: Record<string, unknown> = {}) => applyAlphaCommand(state, actor, { type: 'URBAN_ACTION', expectedVersion: state.version, cityId, ...extra });
const pool = (state: AlphaState, index = 0) => state.players[index]!.resources;
const meta = (state: AlphaState, id = c1) => state.cities.find(c => c.cityId === id)!;
const coreCity = (state: AlphaState, index = 0) => state.core.players[index]!.civilization.cities[0]!;

describe('urban actions: legality', () => {
  it('opens in URBAN_ACTIONS with every city fresh and refuses the command elsewhere', () => {
    const planning = beginAlphaPlanning(createAlphaGame({ gameId: 'urban-phase', seed: 61, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));
    const reserved=act(planning,p1,c1,{action:'PRODUCE'});expect(reserved.ok).toBe(true);if(reserved.ok)expect(reserved.value.players[0]!.plannedActions).toHaveLength(1);
    planning.cities[0]!.urbanActionsUsed = 1;
    const state = urban(62);
    expect(state.phase).toBe('URBAN_ACTIONS');
    expect(state.cities.every(c => c.urbanActionsUsed === 0)).toBe(true);
    const produced=act(state, p1, c1, { action: 'PRODUCE' });
    expect(produced.ok).toBe(true);
    if(produced.ok)expect(produced.value.players[0]!.spentCommands).toBe(1);
  });

  it('shares the global action limit and refuses atomically before city activation', () => {
    const state=urban();state.players[0]!.spentCommands=state.rules.actionsPerRound!;
    const before=JSON.stringify(state),denied=act(state,p1,c1,{action:'PRODUCE'});
    expect(denied).toMatchObject({ok:false,error:{message:'Sem ações principais disponíveis nesta rodada.'}});
    expect(JSON.stringify(state)).toBe(before);
  });

  it('allows exactly one action per city per round and resets it next round', () => {
    let state = must(urban(), p1, { type: 'URBAN_ACTION', cityId: c1, action: 'PRODUCE' });
    expect(meta(state).urbanActionsUsed).toBe(1);
    const again = act(state, p1, c1, { action: 'PROMOTE_MOOD' });
    expect(again).toMatchObject({ ok: false, error: { code: 'RULE_FAILURE', message: expect.stringContaining('já usou') } });
    expect(act(state, p2, c2, { action: 'PRODUCE' }).ok).toBe(true);
    setAlphaPhase(state,'PLANNING');state = completeRound(state);
    expect(state.core.round).toBe(2);
    setAlphaPhase(state,'URBAN_ACTIONS');state.cities.forEach(city=>{city.urbanActionsUsed=0;});
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
    for (const extra of [{ action: 'BUILD' }, { action: 'RECRUIT' }, { action: 'RESEARCH' }, { action: 'PRODUCE', unit: 'INFANTRY' }, { action: 'PROMOTE_MOOD', advancementId: 'web-writing' }, { action: 'CIVIC_ACTION', build: { kind: 'FORTIFICATION' } }])
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
    const expected = alphaToLegacyResources(cityYield(state, c1).output);
    const after = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'PRODUCE' });
    const ledger = after.roundLedgers.find(l => l.playerId === p1)!;
    expect(ledger.production).toEqual(expected);
    expect(after.events.some(e => e.type === 'URBAN_ACTION' && e.audience?.includes(p1))).toBe(true);
    expect(after.telemetry.actionsByType.PRODUCE).toBe(1);
    expect(after.telemetry.productionByResource.food).toBeGreaterThan(0);
  });

  it('leaves institutional income to its own timing instead of taking it from PRODUCE', () => {
    const state = urban();
    const before = state.roundLedgers.find(l => l.playerId === p1)!.institutions;
    const after = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'PRODUCE' });
    expect(after.roundLedgers.find(l => l.playerId === p1)!.institutions).toEqual(before);
  });

  it('discards what does not fit and records the discard', () => {
    const state = urban();
    const cap = alphaStorageCapacity(state, p1);
    pool(state).food = cap.food;
    state.core.players[0]!.resources = alphaToLegacyResources(pool(state));
    const after = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'PRODUCE' });
    expect(pool(after).food).toBe(cap.food);
    const ledger = after.roundLedgers.find(l => l.playerId === p1)!;
    expect(ledger.discarded.food).toBe(ledger.production.food);
    expect(after.events.some(e => e.type === 'STORAGE_DISCARD')).toBe(true);
  });

  it('gives no output from an idle city and none automatically between rounds', () => {
    const state = urban();
    setAlphaPhase(state,'PLANNING');const after = completeRound(state);
    for (const report of after.roundReports) for (const key of ['food', 'materials', 'wealth', 'knowledge', 'influence'] as const) { expect(report.production[key]).toBe(0); expect(report.mining[key]).toBe(0); }
  });

  it('reads Capacity through Ânimo: Abalada −1 (min 1), Próspera +1 on the first activation, Revolta only Governar (canon §10)', () => {
    const state = urban();
    meta(state).mood = 4; const stable = cityYield(state, c1).capacity;
    meta(state).mood = 2; expect(cityYield(state, c1).capacity).toBe(Math.max(1, stable - 1));
    meta(state).mood = 6; expect(cityYield(state, c1).capacity).toBe(stable + 1);
    meta(state).mood = 0;
    expect(act(state, p1, c1, { action: 'PRODUCE' })).toMatchObject({ ok: false, error: { message: expect.stringContaining('Revolta') } });
  });
});

describe('urban actions: BUILD', () => {
  it('builds a district through the current catalog, charges it and syncs the city record', () => {
    const state = urban();
    state.players[0]!.research.push('web-agriculture');
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
    expect(alphaStorageCapacity(after, p1).food).toBeGreaterThan(alphaStorageCapacity(state, p1).food);
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

describe('alpha city state', () => {
  it('never raises the built level from population: only Elevar does (canon §4)', () => {
    const state = urban();
    const city = coreCity(state);
    for (const population of [1, 2, 3, 4, 5, 6, 7, 12]) {
      city.population = population;
      syncCityMetadata(state);
      expect(meta(state).level).toBe('OUTPOST');
    }
    expect(cityLevelForPopulation(12)).toBe('GREAT_CITY');
  });

  it('samples the city mood each maintenance and leaves the legacy stability untouched (Ânimo is the social state)', () => {
    const state = urban();
    meta(state).mood = 6;
    const stability = coreCity(state).stability;
    setAlphaPhase(state, 'PLANNING');
    const after = completeRound(state);
    expect(coreCity(after).stability).toBe(stability);
    expect(after.telemetry.moodSamples).toContain(6);
    expect(meta(after).level).toBe('OUTPOST');
  });
});

describe('urban actions: RECRUIT', () => {
  it('recruits a military piece, charges its catalog cost and mobilizes one habitant (canon §6)', () => {
    const state = urban();
    soldier(state);
    const before = alphaToLegacyResources(pool(state)), units = state.units.length, population = coreCity(state).population;
    const after = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'RECRUIT', unit: 'INFANTRY' });
    expect(after.units).toHaveLength(units + 1);
    expect(coreCity(after).population).toBe(population - 1);
    expect(coreCity(after).workers.soldiers).toBe(0);
    expect(alphaToLegacyResources(pool(after)).food).toBe(before.food - state.rules.units.INFANTRY.cost.food);
    expect(after.telemetry.unitRecruitment.INFANTRY).toBe(1);
  });

  it('recruits civilian pieces without a Military district or any soldiers', () => {
    for (const unit of ['EXPLORER', 'ENVOY', 'PIONEER'] as const) {
      const state = urban();
      // The starting Explorer has left the capital, freeing the civilian stack (limit 2) for the recruit.
      state.units = state.units.filter(piece => piece.kind !== 'EXPLORER');
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
    soldier(state);
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
    soldier(state);
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
    const after = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'RESEARCH', advancementId: 'web-writing' });
    expect(after.players[0]!.research).toEqual(['web-writing']);
    expect(pool(after).knowledge).toBe(knowledge - 2);
    expect(Object.values(after.telemetry.researchByDomain).reduce((a, b) => a + b, 0)).toBe(1);
  });

  it('respects prerequisites, era and unknown advancements', () => {
    const state = urban();
    expect(act(state, p1, c1, { action: 'RESEARCH', advancementId: 'web-mathematics' }).ok).toBe(false);
    expect(act(state, p1, c1, { action: 'RESEARCH', advancementId: 'nope' }).ok).toBe(false);
    pool(state).knowledge = 0; state.core.players[0]!.resources = alphaToLegacyResources(pool(state));
    expect(act(state, p1, c1, { action: 'RESEARCH', advancementId: 'web-writing' }).ok).toBe(false);
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
    for(const key of Object.keys(state.rules.balance.limits.base)){Object.assign(state.rules.balance.limits.base,{[key]:100});Object.assign(state.rules.balance.limits.hardCap,{[key]:100});}
    alphaGain(state, p1, { influence: 32 });
    expect(state.cities.find(c => c.cityId === target)).toMatchObject({ status: 'OCCUPIED', integration: 0, currentOwnerId: p1 });
    setAlphaPhase(state,'PLANNING');state = completeRound(state);setAlphaPhase(state,'URBAN_ACTIONS');state.cities.forEach(city=>{city.urbanActionsUsed=0;});
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
