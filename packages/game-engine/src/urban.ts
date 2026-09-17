import type { CityState, GameRulesConfig, PopulationAllocation, PopulationRole } from '@aoh/game-domain';
import { sum } from './arithmetic.js';

const fields: Record<PopulationRole, keyof PopulationAllocation> = { PRODUCER: 'producers', ARTISAN: 'artisans', MERCHANT: 'merchants', SCHOLAR: 'scholars', SOLDIER: 'soldiers', UNASSIGNED: 'unassigned' };
export const workerActive = (city: CityState, role: PopulationRole | null): boolean => role === null || city.workers[fields[role]] > 0;
export function infrastructureStats(city: CityState, rules: GameRulesConfig) {
  const districts = city.districts.map((district) => ({ type: district.type, entry: rules.territory.districts[district.type] }));
  const buildings = city.buildings.map((building) => rules.territory.buildings[building.type]);
  return {
    administrativeCapacity: sum([...districts.map(({ type, entry }) => sum([entry.administrativeCapacity, city.specialization === type ? entry.specializationCapacityBonus : 0])), ...buildings.map((entry) => entry.administrativeCapacity)]),
    garrisonCapacity: sum([...districts.map(({ type, entry }) => sum([entry.garrisonCapacity, city.specialization === type ? entry.specializationGarrisonBonus : 0])), ...buildings.map((entry) => entry.garrisonCapacity)]),
    growthThreshold: Math.max(1, sum([rules.growthThreshold, ...buildings.map((entry) => -entry.growthThresholdReduction)])),
  };
}
