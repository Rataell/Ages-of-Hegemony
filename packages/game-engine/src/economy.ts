import { RESOURCE_KEYS, emptyResourcePool, type CityState, type CityProductionBreakdown, type CivilizationState, type GameRulesConfig, type HexTile, type ResourcePool, type ResourceDelta, type TileYield } from '@aoh/game-domain';
import { multiply, percent, sum } from './arithmetic.js';
import { stabilityCategory } from './stability.js';
import { workerActive } from './urban.js';

export function tileYieldBreakdown(tile: HexTile, rules: GameRulesConfig) {
  const terrain = { ...rules.territory.terrainYields[tile.terrain] };
  const feature: TileYield = { food: 0, materials: 0, wealth: 0 };
  const improvement = tile.improvement === null ? { ...feature } : { ...rules.territory.improvementCatalog[tile.improvement].yield };
  for (const entry of tile.features) for (const key of ['food', 'materials', 'wealth'] as const) feature[key] = sum([feature[key], rules.territory.featureCatalog[entry].yield[key]]);
  return { terrain, feature, improvement, total: { food: sum([terrain.food, feature.food, improvement.food]), materials: sum([terrain.materials, feature.materials, improvement.materials]), wealth: sum([terrain.wealth, feature.wealth, improvement.wealth]) } };
}
export function deriveCityProductionBreakdown(city: CityState, civilization: CivilizationState, rules: GameRulesConfig, map: readonly HexTile[] = []): CityProductionBreakdown {
  const sources: CityProductionBreakdown['sources'] = [];
  const total = emptyResourcePool();
  const add = (source: CityProductionBreakdown['sources'][number]['source'], delta: ResourceDelta) => {
    for (const key of RESOURCE_KEYS) total[key] = sum([total[key], delta[key]]);
    sources.push({ source, delta });
  };
  add('population', {
    food: multiply(city.workers.producers - city.workedHexIds.length, rules.productionPerWorker.producers),
    materials: multiply(city.workers.artisans, rules.productionPerWorker.artisans),
    wealth: multiply(city.workers.merchants, rules.productionPerWorker.merchants),
    knowledge: multiply(city.workers.scholars, rules.productionPerWorker.scholars), influence: 0,
  });
  const tiles = city.workedHexIds.map((id) => {
    const tile = map.find((tile) => tile.id === id);
    if (!tile) throw new RangeError('Worked tile missing from production map');
    return tileYieldBreakdown(tile, rules);
  });
  for (const source of ['terrain', 'feature', 'improvement'] as const) {
    const delta = emptyResourcePool();
    for (const tile of tiles) for (const key of ['food', 'materials', 'wealth'] as const) delta[key] = sum([delta[key], tile[source][key]]);
    add(source, delta);
  }
  const districts = emptyResourcePool(); const buildings = emptyResourcePool(); const specialization = emptyResourcePool();
  for (const district of city.districts) {
    const entry = rules.territory.districts[district.type];
    if (workerActive(city, entry.workerRequirement)) for (const key of RESOURCE_KEYS) {
      districts[key] = sum([districts[key], entry.production[key]]);
      if (city.specialization === district.type) specialization[key] = sum([specialization[key], entry.specializationBonus[key]]);
    }
  }
  for (const building of city.buildings) {
    const entry = rules.territory.buildings[building.type];
    if (workerActive(city, entry.workerRequirement)) for (const key of RESOURCE_KEYS) buildings[key] = sum([buildings[key], entry.production[key]]);
  }
  add('district', districts); add('building', buildings);
  if (city.specialization !== null) {
    const spec = rules.specializationModifiers[city.specialization];
    specialization.food = sum([specialization.food, multiply(city.workers.producers, spec.producerBonus)]);
    specialization.materials = sum([specialization.materials, multiply(city.workers.artisans, spec.artisanBonus)]);
    specialization.wealth = sum([specialization.wealth, multiply(city.workers.merchants, spec.merchantBonus)]);
    specialization.knowledge = sum([specialization.knowledge, multiply(city.workers.scholars, spec.scholarBonus)]);
  }
  add('specialization', specialization);
  const government = rules.governmentModifiers[civilization.government];
  add('government', { ...emptyResourcePool(), wealth: percent(total.wealth, sum([100, government.wealthBonusPercent, city.specialization === 'COMMERCIAL' ? government.commercialWealthBonusPercent : 0])) - total.wealth });
  const stability = emptyResourcePool(); const rate = rules.stabilityProductionPercent[stabilityCategory(city.stability, rules)];
  for (const key of RESOURCE_KEYS) stability[key] = percent(total[key], rate) - total[key];
  add('stability', stability);
  return { cityId: city.id, workedHexIds: [...city.workedHexIds], sources, total };
}
export function sumProduction(cities: readonly CityProductionBreakdown[]): ResourcePool {
  const total = emptyResourcePool();
  for (const city of cities) for (const key of RESOURCE_KEYS) total[key] = sum([total[key], city.total[key]]);
  return total;
}
