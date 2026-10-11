import { describe, expect, it } from 'vitest';
import { ADVANCEMENTS, PlayerIdSchema, alphaToLegacyResources, type AlphaState } from '@aoh/game-domain';
import { alphaClaimOptions, alphaStorageCapacity, applyAlphaCommand, beginAlphaPlanning, createAlphaGame, districtSlots, productionOutput, urbanCost, urbanOptions } from '@aoh/game-engine';
import { completeRound, must, readyAll } from './alpha-rounds.js';

/**
 * Lane A1 (Alpha V1.2 audit) regression contract. Each `it.fails` documents a finding of docs/audit/alpha-v1.2-lane-a1-economy-rhythm.md that is
 * still open: the test states the behaviour the audit asks for and is EXPECTED TO FAIL on the RC4 baseline. When the finding is fixed the test starts
 * passing, vitest flags it, and the `.fails` is dropped. Plain `it` cases pin rules that already hold (the independent conservation checks).
 * Evidence and repro scripts: scripts/alpha-economy-probes.mjs (P1..P13), docs/evidence/v12-audit/lane-a1/probes/.
 */
const p1 = PlayerIdSchema.parse('p1');
type Resources = AlphaState['players'][number]['resources'];

function game(preset: 'QUICK' | 'STANDARD' = 'STANDARD', civs: [string, string] = ['valgard', 'meridia']): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'lane-a1', seed: 1, preset, players: [{ id: 'p1', name: 'Ana', civilization: civs[0] }, { id: 'p2', name: 'Beto', civilization: civs[1] }] }));
  for (const player of state.players) player.ambitionsChosen = true;
  return state;
}
/** Scenario edit. The state schema enforces the ledger arithmetic, so a pool edit is mirrored into the opening balance of the open ledger. */
function edit(state: AlphaState, change: (draft: AlphaState) => void): AlphaState {
  const draft = structuredClone(state);
  const before = new Map(draft.players.map(p => [p.playerId, { ...p.resources }]));
  change(draft);
  for (const player of draft.players) {
    const ledger = draft.roundLedgers.find(l => l.playerId === player.playerId && l.round === draft.core.round);
    const was = before.get(player.playerId)!;
    if (ledger) {
      ledger.opening.food += player.resources.food - was.food;
      ledger.opening.materials += (player.resources.wood - was.wood) + (player.resources.stone - was.stone) + (player.resources.metal - was.metal);
      ledger.opening.wealth += player.resources.wealth - was.wealth; ledger.opening.knowledge += player.resources.knowledge - was.knowledge; ledger.opening.influence += player.resources.influence - was.influence;
    }
  }
  for (const owner of draft.core.players) owner.resources = alphaToLegacyResources(draft.players.find(p => p.playerId === owner.id)!.resources);
  return draft;
}
const capital = (state: AlphaState) => state.core.players.find(p => p.id === p1)!.civilization.cities[0]!;
const capitalMeta = (state: AlphaState) => state.cities.find(c => c.cityId === capital(state).id)!;
const mine = (state: AlphaState) => state.players.find(p => p.playerId === p1)!;
const setPool = (state: AlphaState, pool: Partial<Resources>) => Object.assign(mine(state).resources, pool);
const workers = (population: number) => ({ producers: population, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned: 0 });
const urbanPlan = (state: AlphaState, action: string, extra: Record<string, unknown> = {}) => applyAlphaCommand(state, p1, { type: 'URBAN_ACTION', cityId: capital(state).id, action, expectedVersion: state.version, ...extra });
const legalWeb = (extra: string[] = []): string[] => {
  const have = new Set(extra);
  for (let pass = 0; pass < 12; pass++) for (const node of ADVANCEMENTS) {
    if (have.has(node.id) || node.excludes.some(id => have.has(id))) continue;
    if (node.prerequisites.every(id => have.has(id)) && (node.prerequisitesAny.length === 0 || node.prerequisitesAny.some(id => have.has(id)))) have.add(node.id);
  }
  return [...have];
};

describe('economy conservation (independent of the ledger): rules that hold on the RC4 baseline', () => {
  it('sustenance is ceil(pop/2) per city and Crescer costs 3 Alimento, taken from the pool in one round without production', () => {
    let state = edit(game(), s => { const c = s.core.players[0]!.civilization.cities[0]!; c.population = 3; c.workers = workers(3); setPool(s, { food: 10 }); });
    const before = mine(state).resources.food;
    state = completeRound(state);
    const spent = before - mine(state).resources.food;
    // sustenance ceil(3/2)=2 + Crescer 3 (the city is below its ceiling) - the civilization's own +1 Alimento recurring effect, if any, is part of the pool delta
    expect(spent).toBeGreaterThanOrEqual(4);
    expect(spent).toBeLessThanOrEqual(5);
  });
  it('the Alimento of a round is conserved: open + credited - sustenance - Crescer - upkeep = close (no hidden line)', () => {
    let state = edit(game(), s => { setPool(s, { food: 12 }); });
    const open = { ...mine(state).resources };
    state = completeRound(state);
    const report = state.roundReports.find(r => r.playerId === p1 && r.round === 1)!;
    expect(report.opening.food + report.institutions.food + report.other.food + report.production.food - report.expenses.food - report.upkeepPaid.food - report.discarded.food - report.losses.food).toBe(report.closing.food);
    expect(open.food).toBeGreaterThan(0);
  });
});

describe('Lane A1 open findings (each test is expected to fail until the finding is fixed)', () => {
  it.fails('E-A1-01 BUG: Governar "custa 1 Cultura" and the pool must be charged', () => {
    let state = edit(game(), s => { setPool(s, { culture: 3 }); capitalMeta(s).mood = 3; });
    expect(urbanCost(state, p1, capital(state).id, 'PROMOTE_MOOD').culture).toBe(1);
    state = must(state, p1, { type: 'URBAN_ACTION', cityId: capital(state).id, action: 'PROMOTE_MOOD' });
    state = completeRound(state);
    expect(mine(state).resources.culture).toBe(2);
  });

  it.fails('E-A1-02 BUG: the round report carries Cultura (and Metal apart from the materials)', () => {
    const state = completeRound(game());
    const closing = state.roundReports.find(r => r.playerId === p1)!.closing as Record<string, number>;
    expect(Object.keys(closing)).toContain('culture');
  });

  it.fails('E-A1-03 BUG: nothing that changes the pool is left outside the report chain: closing(r) = opening(r+1) across the Era turn', () => {
    let state = game('QUICK');
    for (let guard = 0; guard < 12 && state.core.round < 5; guard++) state = readyAll(state);
    const a = state.roundReports.find(r => r.playerId === p1 && r.round === 3)!, b = state.roundReports.find(r => r.playerId === p1 && r.round === 4)!;
    expect(b.opening).toEqual(a.closing);
  });

  it.fails('E-A1-04 BUG: a district slot the ladder promises (Grande Cidade, 4th) is built, not refused at resolution', () => {
    const types = ['AGRARIAN', 'COMMERCIAL', 'ACADEMIC'] as const;
    let state = edit(game(), s => {
      const city = s.core.players[0]!.civilization.cities[0]!, meta = s.cities.find(c => c.cityId === city.id)!;
      meta.level = 'GREAT_CITY'; city.population = 11; city.workers = workers(11); city.development = 3;
      city.districts = types.map(type => ({ type, builtRound: 1 })); meta.districts = [...types];
      const progress = s.players[0]!; progress.era = 'ASCENSION'; progress.research = legalWeb(); setPool(s, { wood: 15, stone: 15, wealth: 15, food: 15 });
    });
    expect(districtSlots(state, capital(state).id)).toBe(4);
    state = must(state, p1, { type: 'URBAN_ACTION', cityId: capital(state).id, action: 'BUILD', build: { kind: 'DISTRICT', district: 'ADMINISTRATIVE' } });
    state = completeRound(state);
    expect(capital(state).districts.length).toBe(4);
  });

  it.fails('E-A1-05 BUG/UX: the planner refuses a second Elevar that the first one makes impossible (it would only burn an Order)', () => {
    let state = edit(game(), s => {
      const city = s.core.players[0]!.civilization.cities[0]!; city.population = 8; city.workers = workers(8);
      mine(s).research.push('web-agriculture', 'web-masonry'); setPool(s, { wood: 20, stone: 20, wealth: 20, food: 15 });
    });
    state = must(state, p1, { type: 'URBAN_ACTION', cityId: capital(state).id, action: 'ELEVATE' });
    expect(urbanPlan(state, 'ELEVATE').ok).toBe(false);
  });

  it.fails('E-A1-06 RULE: Produzir credits are not cut at the storage limit before the same round\'s sustenance', () => {
    const finalFood = (start: (cap: number) => number): number => {
      let state = edit(game(), s => { const c = s.core.players[0]!.civilization.cities[0]!; c.population = 6; c.workers = { ...workers(6), producers: 1, scholars: 5 }; });
      const cap = alphaStorageCapacity(state, p1).food;
      state = edit(state, s => setPool(s, { food: start(cap) }));
      state = must(state, p1, { type: 'URBAN_ACTION', cityId: capital(state).id, action: 'PRODUCE' });
      return mine(completeRound(state)).resources.food;
    };
    // Produzir gives 2 Alimento. Starting 2 below the limit the credit fits; starting 1 below, one unit is cut BEFORE the 3 Alimento of sustenance are eaten.
    // Without the early cut the extra unit of stock must still be there at the end of the round.
    expect(finalFood(cap => cap - 1) - finalFood(cap => cap - 3)).toBe(2);
  });

  it.fails('E-A1-07 RULE: military upkeep is paid before Crescer takes the last Alimento (no UPKEEP_SHORTAGE with enough food for both sustenance and pieces)', () => {
    let state = edit(game(), s => {
      const c = s.core.players[0]!.civilization.cities[0]!; c.population = 3; c.workers = { ...workers(3), producers: 1, scholars: 2 }; setPool(s, { food: 4 });
      s.units.push({ id: 'a1-guard', ownerId: p1, kind: 'GUARD', hexId: c.hexId, recruitedRound: 1 });
    });
    state = completeRound(state);
    expect(state.events.some(e => e.round === 1 && e.type === 'UPKEEP_SHORTAGE' && e.audience?.includes(p1))).toBe(false);
  });

  it.fails('E-A1-08 RULE: a Povoado in Revolta with Riqueza and no Alimento can climb out in three rounds', () => {
    let state = edit(game(), s => { const c = s.core.players[0]!.civilization.cities[0]!, meta = s.cities.find(m => m.cityId === c.id)!; meta.level = 'HAMLET'; meta.mood = 0; c.population = 4; c.workers = workers(4); setPool(s, { food: 0, wealth: 20, culture: 0 }); });
    for (let round = 0; round < 3; round++) {
      const meta = capitalMeta(state);
      if (meta.mood >= 2) break;
      state = must(state, p1, { type: 'URBAN_ACTION', cityId: capital(state).id, action: 'PROMOTE_MOOD' });
      state = completeRound(state);
    }
    expect(capitalMeta(state).mood).toBeGreaterThanOrEqual(2);
  });

  it.fails('E-A1-09 UX: the displayed Elevar cost is what is paid (Riqueza that covers missing Madeira is shown)', () => {
    let state = edit(game(), s => {
      const city = s.core.players[0]!.civilization.cities[0]!, meta = s.cities.find(m => m.cityId === city.id)!;
      meta.level = 'HAMLET'; city.population = 6; city.workers = workers(6);
      const progress = mine(s); progress.era = 'EXPANSION'; progress.research.push('web-agriculture', 'web-masonry'); setPool(s, { wood: 1, stone: 10, wealth: 20, food: 15 });
    });
    const shown = urbanOptions(state, p1).cities[capital(state).id]!.find(o => o.action === 'ELEVATE')!;
    expect(shown.blocked).toBeNull();
    const poolBefore = { ...mine(state).resources };
    state = must(state, p1, { type: 'URBAN_ACTION', cityId: capital(state).id, action: 'ELEVATE' });
    state = completeRound(state);
    const paidWealth = poolBefore.wealth - mine(state).resources.wealth;
    expect(paidWealth).toBe(shown.cost.wealth);
  });

  it.fails('E-A1-10 UX: the research list marks an advancement already reserved this round as blocked', () => {
    let state = game();
    state = must(state, p1, { type: 'URBAN_ACTION', cityId: capital(state).id, action: 'RESEARCH', advancementId: 'web-agriculture' });
    expect(urbanOptions(state, p1).research.find(o => o.advancementId === 'web-agriculture')!.blocked).not.toBeNull();
  });

  it.fails('E-A1-11 UX: the Produzir preview includes the civilization kit bonus (Aurélia: +1 Alimento per worked Fazenda)', () => {
    let state = edit(game('STANDARD', ['aurelia', 'meridia']), s => { mine(s).research.push('web-agriculture'); setPool(s, { influence: 8, wood: 8 }); });
    const free = alphaClaimOptions(state, p1)[capital(state).id]!.map(id => state.core.map.find(t => t.id === id)!).find(t => t.terrain === 'PLAINS')!;
    state = must(state, p1, { type: 'MANAGE', command: { type: 'CLAIM_HEX', playerId: p1, cityId: capital(state).id, hexId: free.id, expectedVersion: state.core.version } });
    state = must(state, p1, { type: 'MANAGE', command: { type: 'IMPROVE_HEX', playerId: p1, hexId: free.id, improvement: 'FARM', expectedVersion: state.core.version } });
    state = must(state, p1, { type: 'MANAGE', command: { type: 'ASSIGN_WORKED_HEXES', playerId: p1, cityId: capital(state).id, hexIds: [free.id], expectedVersion: state.core.version } });
    const shown = productionOutput(state, p1, capital(state).id).output.food;
    const before = mine(state).resources.food;
    state = must(state, p1, { type: 'URBAN_ACTION', cityId: capital(state).id, action: 'PRODUCE' });
    state = completeRound(state);
    // credited = shown + 1 (kit); sustenance 1, Crescer 3 and a +1 recurring effect also move the pool, so compare the Produzir report line
    const credited = state.roundReports.find(r => r.playerId === p1 && r.round === 1)!.production.food;
    expect(credited).toBe(shown);
    expect(before).toBeGreaterThan(0);
  });

  it.fails('E-A1-12 BUG/LEGACY: improvement unlocks declared by the Web are enforced (no Mina before Metalurgia)', () => {
    let state = game();
    state = edit(state, s => setPool(s, { influence: 10, wood: 10, wealth: 10 }));
    const hill = alphaClaimOptions(state, p1)[capital(state).id]!.map(id => state.core.map.find(t => t.id === id)!).find(t => t.terrain === 'HILLS' && t.features.includes('METAL'))!;
    state = must(state, p1, { type: 'MANAGE', command: { type: 'CLAIM_HEX', playerId: p1, cityId: capital(state).id, hexId: hill.id, expectedVersion: state.core.version } });
    const result = applyAlphaCommand(state, p1, { type: 'MANAGE', command: { type: 'IMPROVE_HEX', playerId: p1, hexId: hill.id, improvement: 'MINE', expectedVersion: state.core.version }, expectedVersion: state.version });
    expect(mine(state).research.includes('web-metallurgy')).toBe(false);
    expect(result.ok).toBe(false);
  });
});
