import { RESOURCE_KEYS, emptyResourcePool, type CityState, type CivilizationState, type GameRulesConfig, type GovernmentModifiers, type ResourcePool, type StabilityCategory } from '@aoh/game-domain';

export function safeInteger(value: number | bigint): number {
  const result = typeof value === 'bigint' ? Number(value) : value;
  if (!Number.isSafeInteger(result)) throw new RangeError('Game arithmetic exceeds safe integer range');
  return result;
}
export const sum = (values: readonly number[]): number => safeInteger(values.reduce((total, value) => total + BigInt(value), 0n));
export const multiply = (a: number, b: number): number => safeInteger(BigInt(a) * BigInt(b));
export const percent = (value: number, rate: number): number => safeInteger(BigInt(value) * BigInt(rate) / 100n);

export function clampStability(value: number): number {
  if (!Number.isFinite(value)) throw new RangeError('Stability must be finite');
  return Math.max(0, Math.min(100, Math.trunc(value)));
}
export function stabilityCategory(value: number, rules: GameRulesConfig): StabilityCategory {
  const stability = clampStability(value);
  const bands = rules.stabilityThresholds;
  if (stability <= bands.criticalMax) return 'CRITICAL';
  if (stability <= bands.unstableMax) return 'UNSTABLE';
  if (stability <= bands.tenseMax) return 'TENSE';
  if (stability <= bands.stableMax) return 'STABLE';
  return 'PROSPEROUS';
}
export function populationCap(city: CityState, rules: GameRulesConfig): number {
  const cap = rules.developmentPopulationCaps[city.development - 1];
  if (cap === undefined) throw new RangeError('Unknown development level');
  return cap;
}
export const governmentModifiers = (civilization: CivilizationState, rules: GameRulesConfig): GovernmentModifiers => rules.governmentModifiers[civilization.government];
export const commandPoints = (civilization: CivilizationState, rules: GameRulesConfig): number => Math.max(0, sum([rules.baseCommandPoints, governmentModifiers(civilization, rules).commandPointsDelta]));

export function deriveAdministration(civilization: CivilizationState, rules: GameRulesConfig): Pick<CivilizationState, 'administrativeCapacity' | 'administrativeLoad' | 'administrationStatus'> {
  const policy = rules.administrativeRules;
  const government = governmentModifiers(civilization, rules);
  const capacity = sum([
    policy.baseCapacity, government.capacityFlat, multiply(civilization.cities.length, government.capacityPerCity),
    ...civilization.cities.map((city) => city.specialization === null ? 0 : rules.specializationModifiers[city.specialization].administrativeCapacity),
    -multiply(civilization.cities.filter((city) => city.stability < government.unstableBelow).length, government.unstableCityCapacityPenalty),
  ]);
  const administrativeCapacity = Math.max(0, capacity);
  const administrativeLoad = sum(civilization.cities.map((city) => sum([policy.loadPerCity, Math.floor((city.development - 1) / policy.developmentStep), Math.floor(city.population / policy.populationStep)])));
  return { administrativeCapacity, administrativeLoad, administrationStatus: administrativeLoad > administrativeCapacity ? 'OVEREXTENDED' : 'WITHIN_CAPACITY' };
}
export const refreshAdministration = (civilization: CivilizationState, rules: GameRulesConfig): CivilizationState => ({ ...civilization, ...deriveAdministration(civilization, rules) });

export function governmentStabilityDelta(city: CityState, civilization: CivilizationState, rules: GameRulesConfig): number {
  const government = governmentModifiers(civilization, rules);
  const capital = civilization.cities.find((candidate) => candidate.id === civilization.capitalCityId);
  return sum([
    government.globalStability,
    city.id === civilization.capitalCityId ? government.capitalStability : 0,
    city.development >= government.developedMinLevel ? government.developedCityStability : 0,
    civilization.cities.length >= government.multiCityMinimum ? government.multiCityStability : 0,
    capital !== undefined && capital.stability < government.capitalCrisisBelow ? -government.capitalCrisisPenalty : 0,
  ]);
}

export function deriveCityProduction(city: CityState, civilization: CivilizationState, rules: GameRulesConfig): ResourcePool {
  const specialization = city.specialization === null ? null : rules.specializationModifiers[city.specialization];
  const workers = city.workers;
  const production: ResourcePool = {
    food: multiply(workers.producers, sum([rules.productionPerWorker.producers, specialization?.producerBonus ?? 0])),
    materials: multiply(workers.artisans, sum([rules.productionPerWorker.artisans, specialization?.artisanBonus ?? 0])),
    wealth: multiply(workers.merchants, sum([rules.productionPerWorker.merchants, specialization?.merchantBonus ?? 0])),
    knowledge: multiply(workers.scholars, sum([rules.productionPerWorker.scholars, specialization?.scholarBonus ?? 0])), influence: 0,
  };
  const government = governmentModifiers(civilization, rules);
  production.wealth = percent(production.wealth, sum([100, government.wealthBonusPercent, city.specialization === 'COMMERCIAL' ? government.commercialWealthBonusPercent : 0]));
  const stabilityPercent = rules.stabilityProductionPercent[stabilityCategory(city.stability, rules)];
  for (const key of RESOURCE_KEYS) production[key] = percent(production[key], stabilityPercent);
  return production;
}

export function totalProduction(civilization: CivilizationState, rules: GameRulesConfig): ResourcePool {
  const total = emptyResourcePool();
  for (const city of civilization.cities) {
    const production = deriveCityProduction(city, civilization, rules);
    for (const key of RESOURCE_KEYS) total[key] = sum([total[key], production[key]]);
  }
  return total;
}
