import { RESOURCE_KEYS, emptyResourcePool, type EconomyBreakdown, type HexTile, type GameEvent, type GameRulesConfig, type PlayerState } from '@aoh/game-domain';
import { clampStability, deriveAdministration, governmentStabilityDelta, multiply, percent, populationCap, refreshAdministration, sum } from './civilization.js';
import { deriveCityProductionBreakdown, sumProduction } from './economy.js';
import { infrastructureStats } from './urban.js';

// Pure pipeline: the caller commits this result together with the phase transition.
export function maintainPlayer(player: PlayerState, rules: GameRulesConfig, round: number, version: number, map: readonly HexTile[] = []): { player: PlayerState; events: GameEvent[]; economy: EconomyBreakdown } {
  const base = { playerId: player.id, round, version };
  const events: GameEvent[] = [];
  const breakdowns = player.civilization.cities.map((city) => deriveCityProductionBreakdown(city, player.civilization, rules, map));
  const gross = sumProduction(breakdowns);
  const production = { ...gross };
  const resources = { ...player.resources };
  for (const key of RESOURCE_KEYS) resources[key] = sum([resources[key], production[key]]);
  const required = multiply(sum(player.civilization.cities.map((city) => city.population)), rules.foodPerPopulation);
  const paid = Math.min(required, resources.food);
  resources.food -= paid;
  const shortage = paid < required;
  if (shortage) events.push({ ...base, type: 'FOOD_SHORTAGE', required, paid, deficit: required - paid });

  // Only NEW net food production earns growth; stockpiles cannot be counted repeatedly.
  const surplus = shortage ? 0 : Math.max(0, production.food - required);
  const eligible = player.civilization.cities.filter((city) => city.population < populationCap(city, rules)).map((city) => city.id).sort();
  const shares = new Map(eligible.map((id, index) => [id, Math.floor(surplus / eligible.length) + (index < surplus % eligible.length ? 1 : 0)]));
  let cities = player.civilization.cities.map((city) => {
    if (shortage || city.population >= populationCap(city, rules)) return { ...city, workers: { ...city.workers } };
    const progress = sum([city.growthProgress, shares.get(city.id) ?? 0]);
    const threshold = infrastructureStats(city, rules).growthThreshold;
    const growth = Math.min(Math.floor(progress / threshold), rules.maxGrowthPerMaintenance, populationCap(city, rules) - city.population);
    const population = sum([city.population, growth]);
    // Bank at most one threshold so capped cities do not accumulate unbounded bursts.
    const growthProgress = Math.min(threshold, progress - multiply(growth, threshold));
    if (growth > 0) events.push({ ...base, cityId: city.id, type: 'POPULATION_GROWN', amount: growth, population });
    if (growthProgress !== city.growthProgress) events.push({ ...base, cityId: city.id, type: 'GROWTH_PROGRESS_CHANGED', from: city.growthProgress, to: growthProgress });
    return { ...city, population, growthProgress, workers: { ...city.workers, unassigned: sum([city.workers.unassigned, growth]) } };
  });
  const afterGrowth = { ...player.civilization, cities };
  const administration = deriveAdministration(afterGrowth, rules, map);
  const overextended = administration.administrationStatus === 'OVEREXTENDED';
  if (overextended) {
    events.push({ ...base, type: 'ADMINISTRATIVE_OVEREXTENSION', load: administration.administrativeLoad, capacity: administration.administrativeCapacity });
    // Penalize only this cycle's non-food output, never the existing stockpile.
    for (const key of RESOURCE_KEYS.filter((key) => key !== 'food')) {
      const retained = percent(production[key], rules.administrativeRules.overextensionEconomicPercent);
      resources[key] -= production[key] - retained;
      production[key] = retained;
    }
  }
  cities = cities.map((city) => {
    // Government predicates read pre-cycle stability; city array order cannot change outcomes.
    const delta = sum([governmentStabilityDelta(city, player.civilization, rules), shortage ? -rules.shortageStabilityPenalty : 0, overextended ? -rules.administrativeRules.overextensionStabilityPenalty : 0]);
    const stability = clampStability(sum([city.stability, delta]));
    if (stability !== city.stability) events.push({ ...base, cityId: city.id, type: 'STABILITY_CHANGED', from: city.stability, to: stability });
    return { ...city, stability };
  });
  // Recompute final derived values after stability crosses a government threshold.
  const civilization = refreshAdministration({ ...player.civilization, cities }, rules, map);
  const administrativeAdjustment = emptyResourcePool(); const netChange = emptyResourcePool();
  for (const key of RESOURCE_KEYS) { administrativeAdjustment[key] = production[key] - gross[key]; netChange[key] = resources[key] - player.resources[key]; }
  const economy: EconomyBreakdown = { cities: breakdowns, gross, administrativeAdjustment, credited: production, foodRequired: required, foodPaid: paid, opening: { ...player.resources }, closing: resources, netChange };
  return { player: { ...player, resources, civilization }, economy, events: cities.length === 0 ? [] : [
    { ...base, type: 'RESOURCES_PRODUCED', resources: production, breakdown: economy },
    { ...base, type: 'FOOD_CONSUMED', amount: paid }, ...events,
  ] };
}
