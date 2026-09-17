import { z } from 'zod';

export const IdentifierSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/)
  .refine((id) => !['__proto__', 'constructor', 'prototype'].includes(id), 'Reserved identifier');
export const GameIdSchema = IdentifierSchema.brand<'GameId'>();
export const PlayerIdSchema = IdentifierSchema.brand<'PlayerId'>();
export const CivilizationIdSchema = IdentifierSchema.brand<'CivilizationId'>();
export const CityIdSchema = IdentifierSchema.brand<'CityId'>();
export const HexIdSchema = z.string().regex(/^-?\d+,-?\d+$/).brand<'HexId'>();
export type GameId = z.infer<typeof GameIdSchema>;
export type PlayerId = z.infer<typeof PlayerIdSchema>;
export type CivilizationId = z.infer<typeof CivilizationIdSchema>;
export type CityId = z.infer<typeof CityIdSchema>;
export type HexId = z.infer<typeof HexIdSchema>;

export const EraSchema = z.enum(['FOUNDATION', 'EXPANSION', 'CIVILIZATION', 'EMPIRES', 'HEGEMONY']);
export const CivilizationDomainSchema = z.enum(['KNOWLEDGE', 'SOCIETY', 'ECONOMY', 'WARFARE', 'CULTURE']);
export const HegemonyTypeSchema = z.enum(['MILITARY', 'ECONOMIC', 'SCIENTIFIC', 'CULTURAL', 'POLITICAL', 'TERRITORIAL']);
export const RoundPhaseSchema = z.enum(['MAINTENANCE', 'PLANNING', 'RESOLUTION', 'REACTION', 'END_ROUND']);
export const OrderTypeSchema = z.enum(['EXPLORE', 'EXPAND', 'DEVELOP', 'BUILD', 'RECRUIT', 'RESEARCH', 'MOVE', 'NEGOTIATE', 'INFLUENCE']);
export const ResourceTypeSchema = z.enum(['FOOD', 'MATERIALS', 'WEALTH', 'KNOWLEDGE', 'INFLUENCE']);
export type Era = z.infer<typeof EraSchema>;
export type CivilizationDomain = z.infer<typeof CivilizationDomainSchema>;
export type HegemonyType = z.infer<typeof HegemonyTypeSchema>;
export type RoundPhase = z.infer<typeof RoundPhaseSchema>;
export type OrderType = z.infer<typeof OrderTypeSchema>;
export type ResourceType = z.infer<typeof ResourceTypeSchema>;

export const NonNegativeIntegerSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const SeedSchema = z.number().int().min(0).max(0xffffffff);
export const ResourcePoolSchema = z.strictObject({
  food: NonNegativeIntegerSchema, materials: NonNegativeIntegerSchema,
  wealth: NonNegativeIntegerSchema, knowledge: NonNegativeIntegerSchema, influence: NonNegativeIntegerSchema,
});
export type ResourcePool = z.infer<typeof ResourcePoolSchema>;
export const emptyResourcePool = (): ResourcePool => ({ food: 0, materials: 0, wealth: 0, knowledge: 0, influence: 0 });
export const AxialCoordinatesSchema = z.strictObject({ q: z.number().int().min(-1_000_000).max(1_000_000), r: z.number().int().min(-1_000_000).max(1_000_000) });
export type AxialCoordinates = z.infer<typeof AxialCoordinatesSchema>;
export const TerrainTypeSchema = z.enum(['UNKNOWN', 'PLAINS', 'FOREST', 'HILLS', 'MOUNTAINS', 'COAST', 'SEA']);
export type TerrainType = z.infer<typeof TerrainTypeSchema>;
export const TerrainFeatureSchema = z.enum(['RIVER', 'FERTILE', 'TIMBER', 'STONE', 'METAL', 'FISH']);
export type TerrainFeature = z.infer<typeof TerrainFeatureSchema>;
export const ImprovementTypeSchema = z.enum(['FARM', 'LUMBER_CAMP', 'QUARRY', 'MINE', 'FISHERY']);
export type ImprovementType = z.infer<typeof ImprovementTypeSchema>;
export const TileYieldSchema = z.strictObject({ food: NonNegativeIntegerSchema, materials: NonNegativeIntegerSchema, wealth: NonNegativeIntegerSchema });
export type TileYield = z.infer<typeof TileYieldSchema>;
export const HexTileSchema = z.strictObject({
  id: HexIdSchema, q: AxialCoordinatesSchema.shape.q, r: AxialCoordinatesSchema.shape.r,
  terrain: TerrainTypeSchema, features: z.array(TerrainFeatureSchema), ownerId: PlayerIdSchema.nullable(),
  controllerCityId: CityIdSchema.nullable(), improvement: ImprovementTypeSchema.nullable(),
});
// Defaults apply only at the trusted scenario boundary, never while decoding a v3 snapshot.
export const InitialHexTileSchema = HexTileSchema.extend({ terrain: TerrainTypeSchema.default('UNKNOWN'), features: z.array(TerrainFeatureSchema).default([]), ownerId: PlayerIdSchema.nullable().default(null), controllerCityId: CityIdSchema.nullable().default(null), improvement: ImprovementTypeSchema.nullable().default(null) });
export type HexTile = z.infer<typeof HexTileSchema>;
export const PositiveIntegerSchema = NonNegativeIntegerSchema.min(1);
export const RESOURCE_KEYS = ['food', 'materials', 'wealth', 'knowledge', 'influence'] as const;
export const PopulationRoleSchema = z.enum(['PRODUCER', 'ARTISAN', 'MERCHANT', 'SCHOLAR', 'SOLDIER', 'UNASSIGNED']);
export type PopulationRole = z.infer<typeof PopulationRoleSchema>;
export const PopulationAllocationSchema = z.strictObject({
  producers: NonNegativeIntegerSchema, artisans: NonNegativeIntegerSchema, merchants: NonNegativeIntegerSchema,
  scholars: NonNegativeIntegerSchema, soldiers: NonNegativeIntegerSchema, unassigned: NonNegativeIntegerSchema,
});
export type PopulationAllocation = z.infer<typeof PopulationAllocationSchema>;
export const unassignedPopulation = (population: number): PopulationAllocation => ({ producers: 0, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned: population });
export const CitySpecializationSchema = z.enum(['AGRARIAN', 'COMMERCIAL', 'ACADEMIC', 'ADMINISTRATIVE', 'MILITARY', 'INDUSTRIAL', 'CULTURAL']);
export type CitySpecialization = z.infer<typeof CitySpecializationSchema>;
export const GovernmentTypeSchema = z.enum(['MONARCHY', 'REPUBLIC', 'OLIGARCHY', 'THEOCRACY', 'CONFEDERATION']);
export type GovernmentType = z.infer<typeof GovernmentTypeSchema>;
export const GovernmentSchema = z.enum(['PROTO_GOVERNANCE', ...GovernmentTypeSchema.options]);
export type Government = z.infer<typeof GovernmentSchema>;
export const StabilitySchema = z.number().int().min(0).max(100);
export const DevelopmentSchema = z.number().int().min(1).max(5);
export type Development = z.infer<typeof DevelopmentSchema>;
export const StabilityCategorySchema = z.enum(['CRITICAL', 'UNSTABLE', 'TENSE', 'STABLE', 'PROSPEROUS']);
export type StabilityCategory = z.infer<typeof StabilityCategorySchema>;
