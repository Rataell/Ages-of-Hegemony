import type { AlphaState, CityState, GameRulesConfig, PlayerId } from '@aoh/game-domain';
import { multiply, populationCap, sum } from './civilization.js';
import { infrastructureStats } from './urban.js';
import { productionOutput } from './alpha-urban.js';

/**
 * The single growth rule, used by maintenance and by the forecast shown to players.
 * The civilization's food surplus (food credited by PRODUCE this round minus what the population eats) is split evenly
 * between the cities below their population cap, in id order; the remainder goes to the first ones.
 */
export function growthShares(cities: readonly CityState[], surplus: number, rules: GameRulesConfig): Map<string, number> {
  const eligible = cities.filter(city => city.population < populationCap(city, rules)).map(city => city.id).sort();
  return new Map(eligible.map((id, index) => [id, Math.floor(surplus / eligible.length) + (index < surplus % eligible.length ? 1 : 0)]));
}

/** One city's growth from its share: progress accumulates, at most `maxGrowthPerMaintenance` per round, never past the cap. */
export function growCity(city: CityState, share: number, rules: GameRulesConfig): { population: number; growthProgress: number; growth: number } {
  const progress = sum([city.growthProgress, share]);
  const threshold = infrastructureStats(city, rules).growthThreshold;
  const growth = Math.max(0, Math.min(Math.floor(progress / threshold), rules.maxGrowthPerMaintenance, populationCap(city, rules) - city.population));
  return { population: sum([city.population, growth]), growthProgress: Math.min(threshold, progress - multiply(growth, threshold)), growth };
}

export interface CityGrowthForecast {
  cityId: string;
  /** Food this city's PRODUCE would credit now (the part of production that counts for growth). */
  producedFood: number;
  /** Its share of the civilization surplus if every city that can PRODUCE does so this round. */
  share: number;
  growthProgress: number;
  threshold: number;
  capped: boolean;
  /** Rounds until +1 inhabitant at this pace, or null when nothing reaches it. */
  roundsToGrow: number | null;
}
export interface GrowthForecast {
  foodProduced: number;
  foodEaten: number;
  /** True when stock plus production would not feed the population (no growth anywhere). */
  shortage: boolean;
  surplus: number;
  cities: CityGrowthForecast[];
}

/**
 * Forecast with the maintenance rule itself, assuming every own non-occupied city chooses PRODUCE this round.
 * Only PRODUCE output counts (as in maintenance); effects credited on maintenance or ON_PRODUCE bonuses do not feed growth.
 * The shortage check uses the current food stock; maintenance-time income can only lower a forecast shortage.
 */
export function growthForecast(state: AlphaState, actor: PlayerId): GrowthForecast {
  const rules = state.core.config;
  const owner = state.core.players.find(player => player.id === actor);
  const progress = state.players.find(player => player.playerId === actor);
  if (!owner || !progress) return { foodProduced: 0, foodEaten: 0, shortage: false, surplus: 0, cities: [] };
  const producing = new Set(state.cities.filter(meta => meta.currentOwnerId === actor && meta.status !== 'OCCUPIED').map(meta => meta.cityId as string));
  const produced = new Map(owner.civilization.cities.map(city => [city.id as string, producing.has(city.id) ? productionOutput(state, actor, city.id).output.food : 0]));
  const foodProduced = sum([...produced.values()]);
  const foodEaten = multiply(sum(owner.civilization.cities.map(city => city.population)), rules.foodPerPopulation);
  const shortage = progress.resources.food + foodProduced < foodEaten;
  const surplus = shortage ? 0 : Math.max(0, foodProduced - foodEaten);
  const shares = growthShares(owner.civilization.cities, surplus, rules);
  return {
    foodProduced, foodEaten, shortage, surplus,
    cities: owner.civilization.cities.map(city => {
      const threshold = infrastructureStats(city, rules).growthThreshold, share = shares.get(city.id) ?? 0, capped = city.population >= populationCap(city, rules);
      const missing = Math.max(0, threshold - city.growthProgress);
      return { cityId: city.id, producedFood: produced.get(city.id) ?? 0, share, growthProgress: city.growthProgress, threshold, capped,
        roundsToGrow: capped || shortage ? null : share <= 0 ? (missing === 0 ? 1 : null) : Math.max(1, Math.ceil(missing / share)) };
    }),
  };
}
