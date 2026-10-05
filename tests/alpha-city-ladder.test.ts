import { describe, expect, it } from 'vitest';
import {
  AlphaBuildingSchema, AlphaDistrictSchema, CITY_LADDER, CityLevelSchema, DISTRICT_CATALOG, ELEVATE_TABLE, districtOfBuilding, effectiveCapacity, effectiveLevel,
  elevateRequirement, levelSupportedByPopulation, populationCeiling, supplyReach,
} from '@aoh/game-domain';

describe('city ladder (canon V5.1a §4)', () => {
  it('has the seven levels with population 2/4/6/8/11/14/18, Capacity 1/1/2/2/3/3/4 and slots 1/1/2/3/4/5/6', () => {
    expect(CITY_LADDER.map(step => step.level)).toEqual(CityLevelSchema.options);
    expect(CITY_LADDER.map(step => step.minPopulation)).toEqual([2, 4, 6, 8, 11, 14, 18]);
    expect(CITY_LADDER.map(step => step.capacity)).toEqual([1, 1, 2, 2, 3, 3, 4]);
    expect(CITY_LADDER.map(step => step.slots)).toEqual([1, 1, 2, 3, 4, 5, 6]);
  });
  it('derives supply reach as 1 + ceil(N / 2) and stores the same numbers in the table', () => {
    expect(CITY_LADDER.map(step => supplyReach(step.level))).toEqual([2, 2, 3, 3, 4, 4, 5]);
    expect(CITY_LADDER.map(step => step.supplyReach)).toEqual([2, 2, 3, 3, 4, 4, 5]);
  });
  it("caps population at the next level's minimum (I-37), 20 for the Imperial Metropolis", () => {
    expect(CityLevelSchema.options.map(populationCeiling)).toEqual([4, 6, 8, 11, 14, 18, 20]);
  });
  it('never drops the built level but operates at the level the population supports', () => {
    expect(levelSupportedByPopulation(7)).toBe('VILLAGE');
    expect(levelSupportedByPopulation(1)).toBe('OUTPOST');
    expect(effectiveLevel('METROPOLIS', 7)).toBe('VILLAGE');
    expect(effectiveCapacity('METROPOLIS', 7)).toBe(2);
    expect(effectiveCapacity('METROPOLIS', 14)).toBe(3);
    expect(effectiveLevel('OUTPOST', 30)).toBe('OUTPOST');
  });
  it('lists Elevar for every level above Posto, with rising costs, an advance and the Era; N7 only in Ascensão', () => {
    expect(ELEVATE_TABLE.map(entry => entry.to)).toEqual(CityLevelSchema.options.slice(1));
    const totals = ELEVATE_TABLE.map(entry => Object.values(entry.cost).reduce((sum, value) => sum + value, 0));
    expect(totals).toEqual([...totals].sort((a, b) => a - b));
    expect(Math.max(...ELEVATE_TABLE.flatMap(entry => Object.values(entry.cost)))).toBeLessThanOrEqual(15);
    expect(elevateRequirement('IMPERIAL_METROPOLIS')).toMatchObject({ era: 'ASCENSION', minPopulation: 18, advances: ['web-sanitation', 'web-world-metropolises'] });
    expect(elevateRequirement('OUTPOST')).toBeNull();
  });
});

describe('districts (canon V5.1a §5)', () => {
  it('has the eight districts, each with an opening advance and a family; only the Marítimo is coastal', () => {
    expect(DISTRICT_CATALOG.map(entry => entry.district)).toEqual(AlphaDistrictSchema.options);
    expect(DISTRICT_CATALOG.filter(entry => entry.coastal).map(entry => entry.district)).toEqual(['MARITIME']);
    for (const entry of DISTRICT_CATALOG) expect(entry.buildings.length).toBeGreaterThan(0);
  });
  it('places every building in exactly one family', () => {
    const seen = new Map<string, number>();
    for (const entry of DISTRICT_CATALOG) for (const building of entry.buildings) seen.set(building, (seen.get(building) ?? 0) + 1);
    for (const building of AlphaBuildingSchema.options) expect(seen.get(building), building).toBe(1);
    expect(districtOfBuilding('GRANARY')).toBe('AGRARIAN');
    expect(districtOfBuilding('CHANCELLERY')).toBe('ADMINISTRATIVE');
  });
});
