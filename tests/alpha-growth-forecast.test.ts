import { describe, expect, it } from 'vitest';
import { PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame, growthForecast, growthShares, infrastructureStats, populationCap } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';

const p1 = PlayerIdSchema.parse('p1');
function setup(): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'growth', seed: 4, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana', civilization: 'meridia' }, { id: 'p2', name: 'Beto' }] }));
  for (const player of state.players) player.ambitionsChosen = true;
  return state;
}
const must = (state: AlphaState, command: Record<string, unknown>, actor = 'p1') => { const r = applyAlphaCommand(state, actor as never, { ...command, expectedVersion: state.version }); if (!r.ok) throw new Error(r.error.message); return r.value; };
const capital = (state: AlphaState) => state.core.players[0]!.civilization.cities[0]!;
/** Every own city PRODUCEs (the forecast's assumption), then the round runs to the next planning. */
function produceRound(state: AlphaState): AlphaState {
  for (const city of state.core.players[0]!.civilization.cities) state = must(state, { type: 'URBAN_ACTION', cityId: city.id, action: 'PRODUCE' });
  for (const id of ['p1', 'p2']) state = must(state, { type: 'READY' }, id);
  return state;
}
/** What the forecast said compared with what maintenance did. */
function expectForecastHolds(before: AlphaState, after: AlphaState) {
  const forecast = growthForecast(before, p1).cities.find(city => city.cityId === capital(before).id)!;
  const rules = before.core.config, city = capital(before), result = capital(after);
  const progress = city.growthProgress + forecast.share, growth = Math.min(Math.floor(progress / forecast.threshold), rules.maxGrowthPerMaintenance, populationCap(city, rules) - city.population);
  expect(result.population).toBe(city.population + growth);
  expect(result.growthProgress).toBe(Math.min(forecast.threshold, progress - growth * forecast.threshold));
  if (forecast.roundsToGrow === 1) expect(result.population).toBe(city.population + 1);
  else expect(result.population).toBe(city.population);
}

describe('growth forecast and maintenance use one rule', () => {
  it('projects the starting city exactly as maintenance grows it', () => {
    const state = setup();
    const forecast = growthForecast(state, p1);
    const city = capital(state);
    expect(forecast.foodEaten).toBe(city.population * state.core.config.foodPerPopulation);
    expect(forecast.cities[0]!.threshold).toBe(infrastructureStats(city, state.core.config).growthThreshold);
    expect(forecast.surplus).toBe(Math.max(0, forecast.foodProduced - forecast.foodEaten));
    expectForecastHolds(state, produceRound(structuredClone(state)));
  });

  it('counts a worked food hex: more producers raise the forecast and the real growth together', () => {
    const state = setup();
    const city = capital(state);
    const base = growthForecast(state, p1).foodProduced;
    city.workers.producers += city.workers.scholars; city.workers.scholars = 0;
    const forecast = growthForecast(state, p1);
    expect(forecast.foodProduced).toBeGreaterThan(base);
    expect(forecast.cities[0]!.share).toBe(forecast.foodProduced - forecast.foodEaten);
    expectForecastHolds(state, produceRound(structuredClone(state)));
  });

  it('crosses the threshold from accumulated progress when the forecast says one round', () => {
    const state = setup();
    const city = capital(state);
    city.workers.producers += city.workers.scholars; city.workers.scholars = 0;
    const share = growthForecast(state, p1).cities[0]!.share;
    expect(share).toBeGreaterThan(0);
    city.growthProgress = infrastructureStats(city, state.core.config).growthThreshold - share;
    expect(growthForecast(state, p1).cities[0]!.roundsToGrow).toBe(1);
    const after = produceRound(structuredClone(state));
    expect(capital(after).population).toBe(city.population + 1);
    expectForecastHolds(state, after);
  });

  it('keeps accumulated progress below the threshold when the forecast says more rounds', () => {
    const state = setup();
    const city = capital(state);
    city.workers.producers += city.workers.scholars; city.workers.scholars = 0;
    city.growthProgress = 1;
    const forecast = growthForecast(state, p1).cities[0]!;
    const after = produceRound(structuredClone(state));
    expect(forecast.roundsToGrow).toBeGreaterThan(1);
    expect(capital(after).growthProgress).toBe(1 + forecast.share);
    expectForecastHolds(state, after);
  });

  it('forecasts no growth when the population would go hungry, as maintenance does', () => {
    const state = setup();
    const city = capital(state);
    city.population += 1; city.workers.unassigned += 1;
    state.players[0]!.resources.food = 0;
    state.roundLedgers = state.roundLedgers.filter(ledger => ledger.round !== state.core.round);
    const forecast = growthForecast(state, p1);
    expect(forecast.shortage).toBe(true);
    expect(forecast.cities[0]!.roundsToGrow).toBeNull();
    const after = produceRound(structuredClone(state));
    expect(capital(after).population).toBe(city.population);
  });

  it('serves the same forecast to the city panel, civilization-wide', () => {
    const state = setup();
    const forecast = growthForecast(state, p1);
    const detail = alphaPlayerView(state, p1)!.cityDetails[0]!;
    const city = forecast.cities[0]!;
    expect({ cityId: city.cityId, ...detail.growth }).toEqual({ ...city, civilization: { foodProduced: forecast.foodProduced, foodEaten: forecast.foodEaten, shortage: forecast.shortage, surplus: forecast.surplus } });
  });

  it('splits the civilization surplus evenly between cities that can still grow, remainder first by id', () => {
    const state = setup();
    const a = capital(state), b = { ...structuredClone(a), id: 'city-b' as never }, full = { ...structuredClone(a), id: 'city-c' as never, population: 3 };
    const shares = growthShares([full, b, a], 3, state.core.config);
    expect([...shares.entries()]).toEqual([[a.id, 2], ['city-b', 1]]);
  });
});
