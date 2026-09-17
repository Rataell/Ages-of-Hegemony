import { z } from 'zod';
import { CityIdSchema, CitySpecializationSchema, DevelopmentSchema, HexIdSchema, ImprovementTypeSchema, NonNegativeIntegerSchema as N, PopulationRoleSchema, PositiveIntegerSchema as P, ResourcePoolSchema, StabilitySchema, TerrainFeatureSchema, TerrainTypeSchema, TileYieldSchema, emptyResourcePool } from './core.js';

export const DistrictTypeSchema = z.enum(CitySpecializationSchema.options);
export type DistrictType = z.infer<typeof DistrictTypeSchema>;
export const BuildingTypeSchema = z.enum(['GRANARY', 'MARKET', 'LIBRARY', 'ARCHIVE', 'BARRACKS', 'WORKSHOP', 'CULTURAL_CENTER']);
export type BuildingType = z.infer<typeof BuildingTypeSchema>;
export const DistrictStateSchema = z.strictObject({ type: DistrictTypeSchema, builtRound: P });
export const BuildingStateSchema = z.strictObject({ type: BuildingTypeSchema, builtRound: P });
export type BuildingState = z.infer<typeof BuildingStateSchema>;
export type DistrictState = z.infer<typeof DistrictStateSchema>;
const effect = {
  production: ResourcePoolSchema, workerRequirement: PopulationRoleSchema.nullable(),
  administrativeCapacity: N, garrisonCapacity: N,
};
export const DistrictCatalogEntrySchema = z.strictObject({
  cost: ResourcePoolSchema, minimumDevelopment: DevelopmentSchema, ...effect,
  specializationBonus: ResourcePoolSchema, specializationCapacityBonus: N, specializationGarrisonBonus: N,
});
export type DistrictCatalogEntry = z.infer<typeof DistrictCatalogEntrySchema>;
export const BuildingCatalogEntrySchema = z.strictObject({
  district: DistrictTypeSchema, cost: ResourcePoolSchema, minimumDevelopment: DevelopmentSchema,
  ...effect, growthThresholdReduction: N,
});
export type BuildingCatalogEntry = z.infer<typeof BuildingCatalogEntrySchema>;
const terrainList = z.array(TerrainTypeSchema).min(1).refine((items) => new Set(items).size === items.length, 'Duplicate terrain');
export const TerritoryRulesSchema = z.strictObject({
  terrainYields: z.record(TerrainTypeSchema, TileYieldSchema),
  featureCatalog: z.record(TerrainFeatureSchema, z.strictObject({ terrains: terrainList, yield: TileYieldSchema })),
  improvementCatalog: z.record(ImprovementTypeSchema, z.strictObject({ terrains: terrainList, alternateFeature: TerrainFeatureSchema.nullable(), requiredFeature: TerrainFeatureSchema.nullable(), yield: TileYieldSchema, cost: ResourcePoolSchema })),
  cityRadii: z.tuple([P, P, P, P, P]), districtSlots: z.tuple([N, N, N, N, N]),
  claimCost: ResourcePoolSchema, foundingCost: ResourcePoolSchema, minimumCityDistance: P,
  foundingTerrains: terrainList, foundingPopulation: N, foundingStability: StabilitySchema,
  controlledHexesPerLoad: P,
  districts: z.record(DistrictTypeSchema, DistrictCatalogEntrySchema),
  buildings: z.record(BuildingTypeSchema, BuildingCatalogEntrySchema),
}).superRefine((rules, ctx) => {
  if (Object.values(rules.terrainYields.UNKNOWN).some((value) => value !== 0)) ctx.addIssue({ code: 'custom', message: 'UNKNOWN terrain must yield zero' });
  if (rules.foundingTerrains.some((terrain) => terrain === 'UNKNOWN' || terrain === 'SEA')) ctx.addIssue({ code: 'custom', message: 'UNKNOWN and SEA cannot support founding' });
  for (const values of [rules.cityRadii, rules.districtSlots]) values.forEach((value, index) => {
    if (index > 0 && value < (values[index - 1] ?? value)) ctx.addIssue({ code: 'custom', message: 'Development capacities must not decrease' });
  });
});
export type TerritoryRules = z.infer<typeof TerritoryRulesSchema>;
const pool = (values: Partial<z.infer<typeof ResourcePoolSchema>> = {}) => ({ ...emptyResourcePool(), ...values });
const yieldOf = (food = 0, materials = 0, wealth = 0) => ({ food, materials, wealth });
const district = (cost: ReturnType<typeof pool>, production: ReturnType<typeof pool>, workerRequirement: z.infer<typeof PopulationRoleSchema> | null = null): DistrictCatalogEntry => ({ cost, production, workerRequirement, minimumDevelopment: 1, administrativeCapacity: 0, garrisonCapacity: 0, specializationBonus: production, specializationCapacityBonus: 0, specializationGarrisonBonus: 0 });
const building = (district: DistrictType, cost: ReturnType<typeof pool>, production = pool(), workerRequirement: z.infer<typeof PopulationRoleSchema> | null = null): BuildingCatalogEntry => ({ district, cost, production, workerRequirement, minimumDevelopment: 1, administrativeCapacity: 0, garrisonCapacity: 0, growthThresholdReduction: 0 });
export function createDefaultTerritoryRules(): TerritoryRules {
  return TerritoryRulesSchema.parse({
    terrainYields: { UNKNOWN: yieldOf(), PLAINS: yieldOf(2), FOREST: yieldOf(1, 1), HILLS: yieldOf(0, 2), MOUNTAINS: yieldOf(0, 2), COAST: yieldOf(1, 0, 1), SEA: yieldOf(1) },
    featureCatalog: {
      RIVER: { terrains: ['PLAINS', 'FOREST', 'HILLS', 'COAST'], yield: yieldOf(1) },
      FERTILE: { terrains: ['PLAINS', 'FOREST', 'HILLS'], yield: yieldOf(1) },
      TIMBER: { terrains: ['FOREST'], yield: yieldOf(0, 1) },
      STONE: { terrains: ['HILLS', 'MOUNTAINS'], yield: yieldOf(0, 1) },
      METAL: { terrains: ['HILLS', 'MOUNTAINS'], yield: yieldOf(0, 1) },
      FISH: { terrains: ['COAST', 'SEA'], yield: yieldOf(1) },
    },
    improvementCatalog: {
      FARM: { terrains: ['PLAINS'], alternateFeature: 'FERTILE', requiredFeature: null, yield: yieldOf(1), cost: pool({ materials: 1 }) },
      LUMBER_CAMP: { terrains: ['FOREST'], alternateFeature: null, requiredFeature: null, yield: yieldOf(0, 1), cost: pool({ materials: 1 }) },
      QUARRY: { terrains: ['HILLS', 'MOUNTAINS'], alternateFeature: null, requiredFeature: null, yield: yieldOf(0, 1), cost: pool({ materials: 2 }) },
      MINE: { terrains: ['HILLS', 'MOUNTAINS'], alternateFeature: null, requiredFeature: null, yield: yieldOf(0, 2), cost: pool({ materials: 2, wealth: 1 }) },
      FISHERY: { terrains: ['COAST'], alternateFeature: null, requiredFeature: 'FISH', yield: yieldOf(1), cost: pool({ materials: 1 }) },
    },
    cityRadii: [1, 1, 2, 2, 3], districtSlots: [1, 2, 3, 4, 5],
    claimCost: pool({ influence: 1 }), foundingCost: pool({ food: 5, materials: 3, wealth: 2 }), minimumCityDistance: 2,
    foundingTerrains: ['PLAINS', 'FOREST', 'HILLS', 'COAST'], foundingPopulation: 1, foundingStability: 60, controlledHexesPerLoad: 5,
    districts: {
      AGRARIAN: district(pool({ materials: 2 }), pool({ food: 1 }), 'PRODUCER'),
      COMMERCIAL: district(pool({ materials: 2, wealth: 1 }), pool({ wealth: 1 }), 'MERCHANT'),
      ACADEMIC: district(pool({ materials: 3, wealth: 1 }), pool({ knowledge: 1 }), 'SCHOLAR'),
      ADMINISTRATIVE: { ...district(pool({ materials: 3 }), pool()), administrativeCapacity: 1, specializationCapacityBonus: 1 },
      MILITARY: { ...district(pool({ materials: 3 }), pool()), garrisonCapacity: 1, specializationGarrisonBonus: 1 },
      INDUSTRIAL: district(pool({ materials: 3 }), pool({ materials: 1 }), 'ARTISAN'),
      CULTURAL: district(pool({ materials: 2, wealth: 1 }), pool({ influence: 1 })),
    },
    buildings: {
      GRANARY: { ...building('AGRARIAN', pool({ materials: 2 })), growthThresholdReduction: 2 },
      MARKET: building('COMMERCIAL', pool({ materials: 2, wealth: 1 }), pool({ wealth: 1 }), 'MERCHANT'),
      LIBRARY: building('ACADEMIC', pool({ materials: 3, wealth: 1 }), pool({ knowledge: 1 }), 'SCHOLAR'),
      ARCHIVE: { ...building('ADMINISTRATIVE', pool({ materials: 2 })), administrativeCapacity: 1 },
      BARRACKS: { ...building('MILITARY', pool({ materials: 3 })), garrisonCapacity: 2 },
      WORKSHOP: building('INDUSTRIAL', pool({ materials: 3 }), pool({ materials: 1 }), 'ARTISAN'),
      CULTURAL_CENTER: building('CULTURAL', pool({ materials: 2, wealth: 1 }), pool({ influence: 1 })),
    },
  });
}

const signed = z.number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER);
export const ResourceDeltaSchema = z.strictObject({ food: signed, materials: signed, wealth: signed, knowledge: signed, influence: signed });
export type ResourceDelta = z.infer<typeof ResourceDeltaSchema>;
export const CityProductionBreakdownSchema = z.strictObject({
  cityId: CityIdSchema, workedHexIds: z.array(HexIdSchema),
  sources: z.array(z.strictObject({ source: z.enum(['population', 'terrain', 'feature', 'improvement', 'district', 'building', 'specialization', 'government', 'stability']), delta: ResourceDeltaSchema })),
  total: ResourcePoolSchema,
});
export type CityProductionBreakdown = z.infer<typeof CityProductionBreakdownSchema>;
export const EconomyBreakdownSchema = z.strictObject({
  cities: z.array(CityProductionBreakdownSchema), gross: ResourcePoolSchema,
  administrativeAdjustment: ResourceDeltaSchema, credited: ResourcePoolSchema,
  foodRequired: N, foodPaid: N, opening: ResourcePoolSchema, closing: ResourcePoolSchema, netChange: ResourceDeltaSchema,
});
export type EconomyBreakdown = z.infer<typeof EconomyBreakdownSchema>;
