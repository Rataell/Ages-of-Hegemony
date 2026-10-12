import { describe, expect, it } from 'vitest';
import { createDefaultRules } from '../packages/game-domain/src/rules.js';
import { createDefaultTerritoryRules } from '../packages/game-domain/src/territory.js';

describe('Player Guide & Compendium Rule Verification Suite', () => {
  const rules = createDefaultRules();
  const territory = createDefaultTerritoryRules();

  it('validates that all 5 adoptable governments match official domain mechanics', () => {
    const gov = rules.governmentModifiers;

    // MONARCHY
    expect(gov.MONARCHY.capacityFlat).toBe(2);
    expect(gov.MONARCHY.capitalStability).toBe(3);
    expect(gov.MONARCHY.capitalCrisisPenalty).toBe(5);

    // REPUBLIC
    expect(gov.REPUBLIC.developedCityStability).toBe(2);
    expect(gov.REPUBLIC.unstableCityCapacityPenalty).toBe(1);
    expect(gov.REPUBLIC.futureKnowledgeBonusPercent).toBe(10);
    expect(gov.REPUBLIC.futureInfluenceBonusPercent).toBe(10);

    // OLIGARCHY
    expect(gov.OLIGARCHY.wealthBonusPercent).toBe(10);
    expect(gov.OLIGARCHY.commercialWealthBonusPercent).toBe(15);
    expect(gov.OLIGARCHY.futureInequalityStabilityPenalty).toBe(2);

    // THEOCRACY
    expect(gov.THEOCRACY.globalStability).toBe(2);
    expect(gov.THEOCRACY.futureInfluenceBonusPercent).toBe(10);

    // CONFEDERATION
    expect(gov.CONFEDERATION.capacityPerCity).toBe(1);
    expect(gov.CONFEDERATION.multiCityStability).toBe(2);
    expect(gov.CONFEDERATION.commandPointsDelta).toBe(-1);
  });

  it('validates that all 7 districts have verified costs and corresponding buildings', () => {
    const districts = territory.districts;
    const buildings = territory.buildings;

    // AGRARIAN -> GRANARY
    expect(districts.AGRARIAN.cost.materials).toBe(2);
    expect(districts.AGRARIAN.production.food).toBe(1);
    expect(buildings.GRANARY.district).toBe('AGRARIAN');
    expect(buildings.GRANARY.growthThresholdReduction).toBe(2);

    // COMMERCIAL -> MARKET
    expect(districts.COMMERCIAL.cost.materials).toBe(2);
    expect(districts.COMMERCIAL.cost.wealth).toBe(1);
    expect(districts.COMMERCIAL.production.wealth).toBe(1);
    expect(buildings.MARKET.district).toBe('COMMERCIAL');
    expect(buildings.MARKET.production.wealth).toBe(1);

    // ACADEMIC -> LIBRARY
    expect(districts.ACADEMIC.cost.materials).toBe(3);
    expect(districts.ACADEMIC.production.knowledge).toBe(1);
    expect(buildings.LIBRARY.district).toBe('ACADEMIC');
    expect(buildings.LIBRARY.production.knowledge).toBe(1);

    // ADMINISTRATIVE (capacity) and ARCHIVE (RC5: Acadêmico family)
    expect(districts.ADMINISTRATIVE.cost.materials).toBe(3);
    expect(districts.ADMINISTRATIVE.administrativeCapacity).toBe(1);
    expect(buildings.ARCHIVE.district).toBe('ACADEMIC');
    expect(buildings.ARCHIVE.administrativeCapacity).toBe(1);

    // MILITARY -> BARRACKS
    expect(districts.MILITARY.cost.materials).toBe(3);
    expect(districts.MILITARY.garrisonCapacity).toBe(1);
    expect(buildings.BARRACKS.district).toBe('MILITARY');
    expect(buildings.BARRACKS.garrisonCapacity).toBe(2);

    // INDUSTRIAL -> WORKSHOP
    expect(districts.INDUSTRIAL.cost.materials).toBe(3);
    expect(districts.INDUSTRIAL.production.materials).toBe(1);
    expect(buildings.WORKSHOP.district).toBe('INDUSTRIAL');
    expect(buildings.WORKSHOP.production.materials).toBe(1);

    // CULTURAL -> CULTURAL_CENTER
    expect(districts.CULTURAL.cost.materials).toBe(2);
    expect(districts.CULTURAL.production.influence).toBe(1);
    expect(buildings.CULTURAL_CENTER.district).toBe('CULTURAL');
    expect(buildings.CULTURAL_CENTER.production.influence).toBe(1);
  });

  it('validates that all 5 rural improvements match valid terrains and yields', () => {
    const catalog = territory.improvementCatalog;

    // FARM
    expect(catalog.FARM.terrains).toContain('PLAINS');
    expect(catalog.FARM.yield.food).toBe(1);
    expect(catalog.FARM.cost.materials).toBe(1);

    // LUMBER_CAMP
    expect(catalog.LUMBER_CAMP.terrains).toContain('FOREST');
    expect(catalog.LUMBER_CAMP.yield.materials).toBe(1);
    expect(catalog.LUMBER_CAMP.cost.materials).toBe(1);

    // QUARRY
    expect(catalog.QUARRY.terrains).toContain('HILLS');
    expect(catalog.QUARRY.terrains).toContain('MOUNTAINS');
    expect(catalog.QUARRY.yield.materials).toBe(1);
    expect(catalog.QUARRY.cost.materials).toBe(2);

    // MINE
    expect(catalog.MINE.terrains).toContain('HILLS');
    expect(catalog.MINE.terrains).toContain('MOUNTAINS');
    expect(catalog.MINE.yield.materials).toBe(2);
    expect(catalog.MINE.cost.materials).toBe(2);
    expect(catalog.MINE.cost.wealth).toBe(1);

    // FISHERY
    expect(catalog.FISHERY.terrains).toContain('COAST');
    expect(catalog.FISHERY.requiredFeature).toBe('FISH');
    expect(catalog.FISHERY.yield.food).toBe(1);
    expect(catalog.FISHERY.cost.materials).toBe(1);
  });

  it('validates development population caps, costs, and expansion rules', () => {
    expect(rules.developmentPopulationCaps).toEqual([3, 5, 8, 12, 16]);
    expect(territory.districtSlots).toEqual([1, 2, 3, 4, 5]);
    expect(territory.cityRadii).toEqual([1, 1, 2, 2, 3]);

    expect(territory.claimCost.influence).toBe(1);
    expect(territory.foundingCost.food).toBe(5);
    expect(territory.foundingCost.materials).toBe(3);
    expect(territory.foundingCost.wealth).toBe(2);
    expect(territory.minimumCityDistance).toBe(2);
  });

  it('validates administration and stability band parameters', () => {
    const admin = rules.administrativeRules;
    expect(admin.baseCapacity).toBe(3);
    expect(admin.loadPerCity).toBe(1);
    expect(admin.developmentStep).toBe(2);
    expect(admin.populationStep).toBe(5);
    expect(admin.overextensionEconomicPercent).toBe(90);
    expect(admin.overextensionStabilityPenalty).toBe(3);

    const stab = rules.stabilityProductionPercent;
    expect(stab.CRITICAL).toBe(75);
    expect(stab.UNSTABLE).toBe(90);
    expect(stab.TENSE).toBe(100);
    expect(stab.STABLE).toBe(100);
    expect(stab.PROSPEROUS).toBe(110);
  });
});
