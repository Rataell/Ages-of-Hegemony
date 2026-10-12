import type { AlphaState, PlayerId } from '@aoh/game-domain';
import { canGrow, citySustenance, cityPair, growCost, militaryUpkeep } from './alpha-city.js';
import { productionOutput } from './alpha-urban.js';
import { kitFoodUpkeep } from './alpha-kits.js';

export interface CityGrowthForecast {
  cityId: string;
  population: number;
  /** Habitants the built level holds before Elevar is needed. */
  ceiling: number;
  /** Food this city's PRODUCE would credit now. */
  producedFood: number;
  /** Alimento this city eats in Maintenance (1 per 2 inhabitants). */
  eats: number;
  /** Alimento Crescer costs here (3; 2 with Celeiro). */
  growCost: number;
  capped: boolean;
  /** True when, with every city producing, the stock after sustenance pays this city's Crescer (biggest cities first). */
  willGrow: boolean;
}
export interface GrowthForecast {
  foodProduced: number;
  /** Sustenance of all cities plus military upkeep. */
  foodEaten: number;
  /** True when stock plus production would not feed everyone (no growth anywhere, and famine in the unfed cities). */
  shortage: boolean;
  /** Food left after sustenance, available for Crescer. */
  surplus: number;
  cities: CityGrowthForecast[];
}

/** Alimento the maintenance takes: sustenance of every city (1 per 2 inhabitants) plus the military and kit upkeep. */
export function foodEatenOf(state: AlphaState, actor: PlayerId): number {
  const owner = state.core.players.find(player => player.id === actor);
  const sustenance = owner?.civilization.cities.reduce((total, city) => total + citySustenance(city.population), 0) ?? 0;
  return sustenance + militaryUpkeep(state, actor).food + kitFoodUpkeep(state, actor);
}

/**
 * Forecast with the maintenance rule itself (canon §7), assuming every own non-occupied city chooses PRODUCE this round:
 * sustenance 1 per 2 inhabitants, then Crescer for 3 Alimento (2 with Celeiro) biggest city first, once each.
 */
export function growthForecast(state: AlphaState, actor: PlayerId): GrowthForecast {
  const owner = state.core.players.find(player => player.id === actor);
  const progress = state.players.find(player => player.playerId === actor);
  if (!owner || !progress) return { foodProduced: 0, foodEaten: 0, shortage: false, surplus: 0, cities: [] };
  const producing = new Set(state.cities.filter(meta => meta.currentOwnerId === actor && meta.status !== 'OCCUPIED').map(meta => meta.cityId as string));
  const produced = new Map(owner.civilization.cities.map(city => [city.id as string, producing.has(city.id) ? productionOutput(state, actor, city.id).output.food : 0]));
  const foodProduced = [...produced.values()].reduce((total, value) => total + value, 0);
  const foodEaten = foodEatenOf(state, actor);
  const stock = progress.resources.food + foodProduced;
  const shortage = stock < foodEaten;
  let surplus = shortage ? 0 : stock - foodEaten;
  const cities = [...owner.civilization.cities].sort((a, b) => b.population - a.population).map(city => {
    const pair = cityPair(state, city.id);
    const capped = !pair || !canGrow(pair.meta, city, state.rules.pace);
    const cost = growCost(state, city.id);
    const willGrow = !shortage && !capped && producing.has(city.id) && surplus >= cost;
    if (willGrow) surplus -= cost;
    return { cityId: city.id, population: city.population, ceiling: pair ? pair.meta && canGrow(pair.meta, city, state.rules.pace) ? cityCeiling(state, city.id) : city.population : city.population, producedFood: produced.get(city.id) ?? 0, eats: citySustenance(city.population), growCost: cost, capped, willGrow };
  });
  return { foodProduced, foodEaten, shortage, surplus: shortage ? 0 : stock - foodEaten, cities };
}
function cityCeiling(state: AlphaState, cityId: string): number {
  const pair = cityPair(state, cityId);
  if (!pair) return 0;
  // Imported lazily to keep the forecast's dependencies on the ladder in one place.
  return ceilingOf(pair.meta.level, state.rules.pace);
}
import { populationCeiling } from '@aoh/game-domain';
const ceilingOf = populationCeiling;
