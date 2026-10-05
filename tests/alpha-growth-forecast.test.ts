import { describe, expect, it } from 'vitest';
import { PlayerIdSchema, alphaToLegacyResources, populationCeiling, type AlphaResourcePool, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, citySustenance, createAlphaGame, growthForecast } from '@aoh/game-engine';

const p1 = PlayerIdSchema.parse('p1');
function setup(): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'growth', seed: 4, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana', civilization: 'meridia' }, { id: 'p2', name: 'Beto' }] }));
  for (const player of state.players) player.ambitionsChosen = true;
  return state;
}
const must = (state: AlphaState, command: Record<string, unknown>, actor = 'p1') => { const r = applyAlphaCommand(state, actor as never, { ...command, expectedVersion: state.version }); if (!r.ok) throw new Error(r.error.message); return r.value; };
const capital = (state: AlphaState) => state.core.players[0]!.civilization.cities[0]!;
/** Seeds the stock after the round opened: the ledger's opening must move with it or the report arithmetic breaks. */
function seed(state: AlphaState, pool: Partial<AlphaResourcePool>): void {
  const before = alphaToLegacyResources(state.players[0]!.resources);
  Object.assign(state.players[0]!.resources, pool);
  const after = alphaToLegacyResources(state.players[0]!.resources);
  state.core.players[0]!.resources = after;
  const ledger = state.roundLedgers.find(l => l.playerId === p1);
  if (ledger) for (const key of Object.keys(after) as (keyof typeof after)[]) ledger.opening[key] += after[key] - before[key];
}
const meta = (state: AlphaState) => state.cities.find(city => city.cityId === capital(state).id)!;
/** Every own city PRODUCEs (the forecast's assumption), then the round runs to the next planning. */
function produceRound(state: AlphaState): AlphaState {
  for (const city of state.core.players[0]!.civilization.cities) state = must(state, { type: 'URBAN_ACTION', cityId: city.id, action: 'PRODUCE' });
  for (const id of ['p1', 'p2']) state = must(state, { type: 'READY' }, id);
  return state;
}

describe('sustenance and growth (canon V5.1a §7): forecast and maintenance use one rule', () => {
  it('eats 1 Alimento per 2 inhabitants, rounded up', () => {
    expect([1, 2, 3, 4, 7, 8, 11, 18].map(citySustenance)).toEqual([1, 1, 2, 2, 4, 4, 6, 9]);
    const state = setup();
    const forecast = growthForecast(state, p1);
    expect(forecast.cities[0]!.eats).toBe(citySustenance(capital(state).population));
    expect(forecast.foodEaten).toBeGreaterThanOrEqual(forecast.cities[0]!.eats);
  });

  it('grows by one Disponível for 3 Alimento when the forecast says so, and the Posto stops at its ceiling', () => {
    const state = setup();
    seed(state, { food: 10 });
    const forecast = growthForecast(state, p1).cities[0]!;
    expect(forecast.growCost).toBe(3);
    expect(forecast.willGrow).toBe(true);
    const before = capital(state).population;
    const after = produceRound(structuredClone(state));
    expect(capital(after).population).toBe(before + 1);
    expect(capital(after).workers.unassigned).toBe(capital(state).workers.unassigned + 1);
    // Posto holds 4 (I-37): the next Crescer is refused until Elevar.
    const full = structuredClone(after); seed(full, { food: 15 });
    const city = capital(full); city.population = populationCeiling('OUTPOST'); city.workers = { ...city.workers, unassigned: city.population - city.workers.producers - city.workers.artisans - city.workers.merchants - city.workers.scholars - city.workers.soldiers };
    const capped = growthForecast(full, p1).cities[0]!;
    expect(capped.capped).toBe(true);
    expect(capped.ceiling).toBe(4);
    expect(capital(produceRound(full)).population).toBe(4);
  });

  it('charges 2 Alimento where a Celeiro stands', () => {
    const state = setup();
    meta(state).buildings.push('GRANARY');
    expect(growthForecast(state, p1).cities[0]!.growCost).toBe(2);
  });

  it('forecasts famine when food does not cover sustenance, and maintenance takes a habitant and Ânimo', () => {
    const state = setup();
    seed(state, { food: 0 });
    const city = capital(state);
    city.population = 7; city.workers = { producers: 0, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned: 7 }; city.workedHexIds = [];
    meta(state).mood = 4;
    const forecast = growthForecast(state, p1);
    expect(forecast.shortage).toBe(true);
    expect(forecast.cities[0]!.willGrow).toBe(false);
    let after = structuredClone(state);
    for (const id of ['p1', 'p2']) after = must(after, { type: 'READY' }, id);
    expect(capital(after).population).toBe(6);
    expect(meta(after).mood).toBe(3);
    expect(after.events.some(event => event.type === 'FOOD_SHORTAGE')).toBe(true);
  });
});

describe('mobilization (canon §6) and Elevar (canon §4)', () => {
  it('recruiting a land piece takes one habitant (Soldado first, Disponível otherwise)', () => {
    const state = setup();
    seed(state, { food: 10, wood: 10, stone: 10, wealth: 10 });
    const city = capital(state);
    city.population = 4; city.workers = { producers: 2, artisans: 0, merchants: 0, scholars: 0, soldiers: 1, unassigned: 1 };
    const after = must(state, { type: 'URBAN_ACTION', cityId: city.id, action: 'RECRUIT', unit: 'INFANTRY' });
    let resolved = after; for (const id of ['p1', 'p2']) resolved = must(resolved, { type: 'READY' }, id);
    // 4 → 3 by mobilization, then Crescer may bring it back to the ceiling in the same Manutenção.
    expect(capital(resolved).population).toBe(resolved.events.some(event => event.type === 'POPULATION_GROWN' && event.round === state.core.round) ? 4 : 3);
    expect(capital(resolved).workers.soldiers).toBe(0);
    expect(resolved.units.some(unit => unit.kind === 'INFANTRY' && unit.ownerId === p1)).toBe(true);
  });

  it('demobilizing inside an own city returns the habitant as Disponível', () => {
    const state = setup();
    const city = capital(state);
    state.units.push({ id: 'inf-1', ownerId: p1, kind: 'INFANTRY', hexId: city.hexId, recruitedRound: 1, carrierId: null });
    const after = must(state, { type: 'DEMOBILIZE', unitId: 'inf-1' });
    expect(after.units.some(unit => unit.id === 'inf-1')).toBe(false);
    expect(capital(after).population).toBe(city.population + 1);
    expect(capital(after).workers.unassigned).toBe(city.workers.unassigned + 1);
  });

  it('Elevar needs population, cost, the Web advance and the Era; the built level then rises', () => {
    const state = setup();
    const city = capital(state);
    expect(meta(state).level).toBe('OUTPOST');
    const refused = applyAlphaCommand(state, p1, { type: 'URBAN_ACTION', expectedVersion: state.version, cityId: city.id, action: 'ELEVATE' });
    expect(refused).toMatchObject({ ok: false, error: { message: expect.stringContaining('habitantes') } });
    city.population = 4; city.workers = { producers: 2, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned: 2 };
    expect(applyAlphaCommand(state, p1, { type: 'URBAN_ACTION', expectedVersion: state.version, cityId: city.id, action: 'ELEVATE' })).toMatchObject({ ok: false, error: { message: expect.stringContaining('web-agriculture') } });
    state.players[0]!.research.push('web-agriculture');
    seed(state, { wood: 3 });
    let after = must(state, { type: 'URBAN_ACTION', cityId: city.id, action: 'ELEVATE' });
    for (const id of ['p1', 'p2']) after = must(after, { type: 'READY' }, id);
    expect(meta(after).level).toBe('HAMLET');
    expect(after.players[0]!.resources.wood).toBeLessThan(3 + 10);
  });
});
