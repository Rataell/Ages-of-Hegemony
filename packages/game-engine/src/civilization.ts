import { type CityState, type CivilizationState, type GameRulesConfig, type GovernmentModifiers, type ResourcePool, type HexTile } from '@aoh/game-domain';
import { sum, multiply } from './arithmetic.js';
import { infrastructureStats } from './urban.js';
import { deriveCityProductionBreakdown, sumProduction } from './economy.js';

export { safeInteger, sum, multiply, percent } from './arithmetic.js';
export { clampStability, stabilityCategory } from './stability.js';
export function populationCap(city: CityState, rules: GameRulesConfig): number {
  const cap = rules.developmentPopulationCaps[city.development - 1];
  if (cap === undefined) throw new RangeError('Unknown development level');
  return cap;
}
export const governmentModifiers = (civilization: CivilizationState, rules: GameRulesConfig): GovernmentModifiers => rules.governmentModifiers[civilization.government];
export const commandPoints = (civilization: CivilizationState, rules: GameRulesConfig): number => Math.max(0, sum([rules.baseCommandPoints, governmentModifiers(civilization, rules).commandPointsDelta]));

export function deriveAdministration(civilization: CivilizationState, rules: GameRulesConfig, map: readonly HexTile[] = []): Pick<CivilizationState, 'administrativeCapacity' | 'administrativeLoad' | 'administrationStatus'> {
  const policy = rules.administrativeRules;
  const government = governmentModifiers(civilization, rules);
  const capacity = sum([
    policy.baseCapacity, government.capacityFlat, multiply(civilization.cities.length, government.capacityPerCity),
    ...civilization.cities.map((city) => city.specialization === null ? 0 : rules.specializationModifiers[city.specialization].administrativeCapacity),
    ...civilization.cities.map((city) => infrastructureStats(city, rules).administrativeCapacity),
    -multiply(civilization.cities.filter((city) => city.stability < government.unstableBelow).length, government.unstableCityCapacityPenalty),
  ]);
  const administrativeCapacity = Math.max(0, capacity);
  const administrativeLoad = sum([Math.floor(map.filter((tile) => tile.ownerId === civilization.ownerId).length / rules.territory.controlledHexesPerLoad), ...civilization.cities.map((city) => sum([policy.loadPerCity, Math.floor((city.development - 1) / policy.developmentStep), Math.floor(city.population / policy.populationStep)]))]);
  return { administrativeCapacity, administrativeLoad, administrationStatus: administrativeLoad > administrativeCapacity ? 'OVEREXTENDED' : 'WITHIN_CAPACITY' };
}
export const refreshAdministration = (civilization: CivilizationState, rules: GameRulesConfig, map: readonly HexTile[] = []): CivilizationState => ({ ...civilization, ...deriveAdministration(civilization, rules, map) });

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

export function deriveCityProduction(city: CityState, civilization: CivilizationState, rules: GameRulesConfig, map: readonly HexTile[] = []): ResourcePool {
  return deriveCityProductionBreakdown(city, civilization, rules, map).total;
}
export function totalProduction(civilization: CivilizationState, rules: GameRulesConfig, map: readonly HexTile[] = []): ResourcePool {
  return sumProduction(civilization.cities.map((city) => deriveCityProductionBreakdown(city, civilization, rules, map)));
}
