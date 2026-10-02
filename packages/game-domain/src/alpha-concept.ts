import { z } from 'zod';
import { CityIdSchema, HexIdSchema, IdentifierSchema, NonNegativeIntegerSchema as N, PlayerIdSchema, PositiveIntegerSchema as P, ResourcePoolSchema, type ResourcePool } from './core.js';

export const AlphaEraSchema = z.enum(['FOUNDATION', 'EXPANSION', 'CIVILIZATION', 'EMPIRES', 'ASCENSION', 'HEGEMONY']);
export type AlphaEra = z.infer<typeof AlphaEraSchema>;

export const AlphaRoundPhaseSchema = z.enum([
  'WORLD_PULSE',
  'PLANNING',
  'URBAN_ACTIONS',
  'ORDERS_MOVEMENT',
  'DIPLOMACY_TRADE',
  'CONFLICTS',
  'INTEGRATION_MAINTENANCE',
  'END_ROUND',
]);
export type AlphaRoundPhase = z.infer<typeof AlphaRoundPhaseSchema>;

export const ALPHA_RESOURCE_KEYS = ['food', 'wood', 'stone', 'metal', 'wealth', 'knowledge', 'influence'] as const;
export const AlphaResourceTypeSchema = z.enum(['FOOD', 'WOOD', 'STONE', 'METAL', 'WEALTH', 'KNOWLEDGE', 'INFLUENCE']);
export const AlphaResourcePoolSchema = z.strictObject({
  food: N,
  wood: N,
  stone: N,
  metal: N,
  wealth: N,
  knowledge: N,
  influence: N,
});
export type AlphaResourcePool = z.infer<typeof AlphaResourcePoolSchema>;
export const emptyAlphaResourcePool = (): AlphaResourcePool => ({ food: 0, wood: 0, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0 });
export const legacyToAlphaResources = (pool: ResourcePool): AlphaResourcePool => ({
  food: pool.food,
  wood: Math.ceil(pool.materials / 2),
  stone: Math.floor(pool.materials / 2),
  metal: 0,
  wealth: pool.wealth,
  knowledge: pool.knowledge,
  influence: pool.influence,
});
export const alphaToLegacyResources = (pool: AlphaResourcePool): ResourcePool => ResourcePoolSchema.parse({
  food: pool.food,
  materials: pool.wood + pool.stone + pool.metal,
  wealth: pool.wealth,
  knowledge: pool.knowledge,
  influence: pool.influence,
});

export const UrbanActionTypeSchema = z.enum(['PRODUCE', 'BUILD', 'RECRUIT', 'RESEARCH', 'PROMOTE_MOOD', 'SUPPORT_TRADE', 'CIVIC_ACTION']);
export const MoodStateSchema = z.enum(['REVOLTING', 'DESPONDENT', 'RESTLESS', 'SERENE', 'SATISFIED', 'PROSPEROUS', 'EXULTANT']);
export const CityLevelSchema = z.enum(['OUTPOST', 'HAMLET', 'VILLAGE', 'CITY', 'GREAT_CITY', 'METROPOLIS', 'IMPERIAL_METROPOLIS']);
export type CityLevel = z.infer<typeof CityLevelSchema>;
/** Settlement size follows population one-for-one through the seven named Alpha levels, then stays at the cap. */
export function cityLevelForPopulation(population: number): CityLevel {
  return CityLevelSchema.options[Math.min(CityLevelSchema.options.length - 1, Math.max(0, population - 1))]!;
}
export const AlphaDistrictSchema = z.enum(['AGRARIAN', 'COMMERCIAL', 'ACADEMIC', 'ADMINISTRATIVE', 'MILITARY', 'INDUSTRIAL', 'CULTURAL', 'MARITIME']);
export const AlphaBuildingSchema = z.enum([
  'GRANARY', 'MILL', 'IRRIGATION', 'WAREHOUSE', 'MARKET', 'TREASURY', 'BANK',
  'SCRIBES_HOUSE', 'LIBRARY', 'ACADEMY', 'OBSERVATORY', 'LABORATORY', 'ARCHIVE',
  'COURT', 'CHANCELLERY', 'BARRACKS', 'ARSENAL', 'TRAINING_GROUND', 'WORKSHOP', 'FOUNDRY',
  'CIVIC_SQUARE', 'THEATER', 'CULTURAL_CENTER', 'SANCTUARY', 'TEMPLE', 'TRADITION_HOUSE',
  'PORT', 'SHIPYARD', 'LIGHTHOUSE',
]);
export const FortificationLevelSchema = z.enum(['NONE', 'PALISADE', 'STONE_WALL', 'FORTRESS', 'BASTION', 'CITADEL']);
export const FORTIFICATION_UPGRADES = ['PALISADE', 'STONE_WALL', 'FORTRESS', 'BASTION', 'CITADEL'] as const;
export const FortificationUpgradeSchema = z.enum(FORTIFICATION_UPGRADES);
export const FortificationStateSchema = z.enum(['INTACT', 'DAMAGED', 'BREACHED']);
export const CulturalPresenceLevelSchema = z.enum(['CONTACT', 'ROOTED', 'PREDOMINANT']);
export const CulturalPresenceSchema = z.strictObject({ civilizationId: IdentifierSchema, level: CulturalPresenceLevelSchema });

export const AlphaCitySchema = z.strictObject({
  cityId: CityIdSchema,
  originalOwnerId: PlayerIdSchema,
  currentOwnerId: PlayerIdSchema,
  nativeIdentity: IdentifierSchema,
  status: z.enum(['OWNED', 'OCCUPIED']),
  integration: N.max(100),
  mood: N.max(6),
  level: CityLevelSchema,
  capital: z.boolean(),
  districts: z.array(AlphaDistrictSchema),
  buildings: z.array(AlphaBuildingSchema),
  fortification: z.strictObject({ level: FortificationLevelSchema, state: FortificationStateSchema }),
  foreignPresence: z.array(CulturalPresenceSchema).max(3),
  localCohesion: N.max(100),
  culturalAnchor: IdentifierSchema.nullable(),
  urbanActionsUsed: N,
});
export type AlphaCity = z.infer<typeof AlphaCitySchema>;

export const MapPresetSchema = z.enum(['CONTINENTAL', 'ARCHIPELAGO', 'INLAND_SEA', 'MIXED']);
export type MapPreset = z.infer<typeof MapPresetSchema>;
export const GovernmentCatalogSchema = z.enum(['MONARCHY', 'REPUBLIC', 'OLIGARCHY', 'THEOCRACY', 'CONFEDERATION', 'MERITOCRACY', 'AUTOCRACY']);
export const TradeOfferTypeSchema = z.enum(['TRADE_INSTANT', 'GIFT', 'FUTURE_PROMISE', 'LOAN']);
export const TradeOfferSchema = z.strictObject({
  id: IdentifierSchema,
  type: TradeOfferTypeSchema,
  proposerId: PlayerIdSchema,
  recipientId: PlayerIdSchema,
  offer: AlphaResourcePoolSchema,
  request: AlphaResourcePoolSchema,
  treatyTerms: z.array(IdentifierSchema).max(4),
  status: z.enum(['PROPOSED', 'ACCEPTED', 'DECLINED', 'SETTLED', 'DEFAULTED']),
  createdRound: P,
  dueRound: P.nullable(),
});

export const BattlePostureSchema = z.enum(['ASSAULT', 'HOLD', 'MANEUVER']);
export const TacticalFaceSchema = z.enum(['EMPTY', 'IMPACT', 'GUARD', 'MANEUVER', 'COMMAND']);
export type BattlePosture = z.infer<typeof BattlePostureSchema>;
export type TacticalFace = z.infer<typeof TacticalFaceSchema>;
export const BattleModifierSchema = z.strictObject({ source: z.string().min(1).max(120), amount: z.number().int().min(-100).max(100) });

/**
 * Tactical combat configuration: every threshold and modifier in one place (ALPHA). Each unit that fights rolls one die whose
 * faces are listed here. Postures are circular (each beats one and loses to one) and each empowers one face.
 */
const PostureRuleSchema = z.strictObject({ beats: BattlePostureSchema, empowers: TacticalFaceSchema });
export const CombatConfigSchema = z.strictObject({
  mediumMargin: P, largeMargin: P, unsuppliedPenalty: N, hillDefense: N, mountainDefense: N, postureAdvantage: N,
  dieFaces: z.array(TacticalFaceSchema).length(6),
  impactValue: P, empoweredBonus: N, maneuverValue: P,
  posture: z.strictObject({ ASSAULT: PostureRuleSchema, HOLD: PostureRuleSchema, MANEUVER: PostureRuleSchema }),
  guardCancels: P, holdGuardCancels: P,
  command: z.strictObject({
    cavalryFlank: N, cavalryFlankTerrains: z.array(z.enum(['UNKNOWN', 'PLAINS', 'FOREST', 'HILLS', 'MOUNTAINS', 'COAST', 'SEA'])),
    cityGuardProtection: N, navalTerrains: z.array(z.enum(['UNKNOWN', 'PLAINS', 'FOREST', 'HILLS', 'MOUNTAINS', 'COAST', 'SEA'])), navalBonus: N,
    siegeBreachSteps: P, rangedConversions: P,
  }),
  fortification: z.strictObject({
    levelBonus: z.strictObject({ NONE: N, PALISADE: N, STONE_WALL: N, FORTRESS: N, BASTION: N, CITADEL: N }),
    damagedPercent: z.number().int().min(0).max(100), fortifiedDefenderBonus: N,
  }),
});
export type CombatConfig = z.infer<typeof CombatConfigSchema>;
export function alphaCombatConfig(): CombatConfig {
  return CombatConfigSchema.parse({
    mediumMargin: 3, largeMargin: 6, unsuppliedPenalty: 2, hillDefense: 1, mountainDefense: 2, postureAdvantage: 1,
    dieFaces: ['EMPTY', 'IMPACT', 'IMPACT', 'GUARD', 'MANEUVER', 'COMMAND'],
    impactValue: 1, empoweredBonus: 1, maneuverValue: 1,
    posture: { ASSAULT: { beats: 'MANEUVER', empowers: 'IMPACT' }, HOLD: { beats: 'ASSAULT', empowers: 'GUARD' }, MANEUVER: { beats: 'HOLD', empowers: 'MANEUVER' } },
    guardCancels: 1, holdGuardCancels: 2,
    command: { cavalryFlank: 1, cavalryFlankTerrains: ['PLAINS'], cityGuardProtection: 1, navalTerrains: ['COAST', 'SEA'], navalBonus: 1, siegeBreachSteps: 1, rangedConversions: 1 },
    fortification: { levelBonus: { NONE: 0, PALISADE: 1, STONE_WALL: 2, FORTRESS: 3, BASTION: 4, CITADEL: 5 }, damagedPercent: 50, fortifiedDefenderBonus: 1 },
  });
}

export const IndependentTypeSchema = z.enum(['VILLAGE', 'TOWN', 'CITY_STATE']);
export const IndependentAttitudeSchema = z.enum(['FRIENDLY', 'NEUTRAL', 'WARY', 'HOSTILE']);
export const IndependentActionSchema = z.enum(['TRADE', 'NEGOTIATE', 'INFLUENCE', 'PROTECT', 'INTEGRATE', 'CONQUER']);
export const IndependentPeopleSchema = z.strictObject({
  id: IdentifierSchema,
  hexId: HexIdSchema,
  type: IndependentTypeSchema,
  attitude: IndependentAttitudeSchema,
  influenceByPlayer: z.record(PlayerIdSchema, N),
  protectorId: PlayerIdSchema.nullable(),
  integratedBy: PlayerIdSchema.nullable(),
});
export const RaidBandSchema = z.strictObject({ id: IdentifierSchema, hexId: HexIdSchema, strength: P, lastMovedRound: N });

export const WorldPulseTypeSchema = z.enum(['POSITIVE', 'NEGATIVE', 'MIXED']);
export const WorldPulseModuleSchema = z.strictObject({ id: IdentifierSchema, text: z.string().min(1).max(240), resource: AlphaResourceTypeSchema.nullable(), amount: z.number().int().min(-10).max(10) });
export const WorldPulseCardSchema = z.strictObject({ id: IdentifierSchema, name: z.string().min(1).max(120), type: WorldPulseTypeSchema, modules: z.array(WorldPulseModuleSchema).min(1).max(3) });
export type WorldPulseCard = z.infer<typeof WorldPulseCardSchema>;

const pulse = (id: string, name: string, type: z.infer<typeof WorldPulseTypeSchema>, resource: z.infer<typeof AlphaResourceTypeSchema> | null, amount: number): WorldPulseCard => ({
  id,
  name,
  type,
  modules: [{ id: `${id}-global`, text: `${name}: efeito global Alpha.`, resource, amount }],
});

export const WORLD_PULSE_CARDS: readonly WorldPulseCard[] = [
  pulse('wp-abundant-harvest', 'Colheita abundante', 'POSITIVE', 'FOOD', 2),
  pulse('wp-open-roads', 'Estradas abertas', 'POSITIVE', 'WEALTH', 2),
  pulse('wp-scholars', 'Círculo de sábios', 'POSITIVE', 'KNOWLEDGE', 2),
  pulse('wp-festival', 'Festival dos povos', 'POSITIVE', 'INFLUENCE', 2),
  pulse('wp-timber', 'Bosques férteis', 'POSITIVE', 'WOOD', 2),
  pulse('wp-quarry', 'Nova pedreira', 'POSITIVE', 'STONE', 2),
  pulse('wp-vein', 'Veio metálico', 'POSITIVE', 'METAL', 1),
  pulse('wp-calm-seas', 'Mares tranquilos', 'POSITIVE', 'WEALTH', 1),
  pulse('wp-drought', 'Seca prolongada', 'NEGATIVE', 'FOOD', -2),
  pulse('wp-fire', 'Incêndios florestais', 'NEGATIVE', 'WOOD', -2),
  pulse('wp-collapse', 'Desabamento de minas', 'NEGATIVE', 'STONE', -2),
  pulse('wp-rust', 'Escassez de metal', 'NEGATIVE', 'METAL', -1),
  pulse('wp-panic', 'Pânico mercantil', 'NEGATIVE', 'WEALTH', -2),
  pulse('wp-dogma', 'Reação ao saber', 'NEGATIVE', 'KNOWLEDGE', -1),
  pulse('wp-scandal', 'Crise diplomática', 'NEGATIVE', 'INFLUENCE', -1),
  pulse('wp-raiders', 'Bandos em marcha', 'NEGATIVE', null, 0),
  pulse('wp-migration', 'Migrações', 'MIXED', 'FOOD', -1),
  pulse('wp-caravans', 'Caravanas errantes', 'MIXED', 'WEALTH', 1),
  pulse('wp-debate', 'Grande debate', 'MIXED', 'KNOWLEDGE', 1),
  pulse('wp-pilgrimage', 'Peregrinação', 'MIXED', 'INFLUENCE', 1),
  pulse('wp-flood', 'Cheias dos rios', 'MIXED', 'FOOD', 1),
  pulse('wp-refugees', 'Refugiados da fronteira', 'MIXED', null, 0),
  pulse('wp-storm', 'Tempestades costeiras', 'MIXED', 'WOOD', -1),
  pulse('wp-discovery', 'Descoberta inesperada', 'MIXED', 'METAL', 1),
] as const;

export const AlphaBalanceSchema = z.strictObject({
  label: z.literal('ALPHA'),
  cityActions: P,
  wealthConversionRate: z.literal(2),
  wealthMaterialCostPercentMax: z.literal(50),
  baseStorage: z.strictObject({ foodCapacity: P, woodCapacity: P, stoneCapacity: P, metalCapacity: P, wealthCapacity: P }),
  storagePerBuilding: z.record(AlphaBuildingSchema, N),
  overflowRule: z.literal('DISCARD_AFTER_ACTION'),
  publicInvestmentCost: P,
  moodEffects: z.array(z.strictObject({ productionPercent: z.number().int().min(-100).max(100), stabilityDelta: z.number().int().min(-10).max(10) })).length(7),
  stack: z.strictObject({ military: P, militaryCommandOne: P, militaryCommandTwo: P, civilians: P, cityBase: P, cityMax: P, fleets: P, fleetsUpgraded: P,
    /** Advancements that raise a limit. Ids are checked against the advancement catalogue by tests. */
    upgrades: z.strictObject({ commandOne: z.string().min(1), commandTwo: z.string().min(1), naval: z.string().min(1), doctrine: z.string().min(1) }),
    /** City garrison: base plus these bonuses, never above cityMax. */
    cityBonus: z.strictObject({ militaryDistrict: N, doctrine: N, fortification: z.record(FortificationLevelSchema, N) }),
  }),
  cultureSlots: z.literal(3),
  cultureDice: z.literal(2),
  integrationPerAction: P,
  /** Metal produced by each PRODUCE action for every worked hex that has both a metal deposit and a Mine. */
  metalPerMine: P,
  /** CIVIC_ACTION in an owned city: influence gained and local cohesion added. */
  civicInfluence: P,
  civicCohesion: P,
  /** PROMOTE_MOOD (public investment) raises mood by one and can never carry a city above this mood on its own. */
  promoteMoodCeiling: z.number().int().min(1).max(6),
  /** Maximum hex distance from a starting city within which a metal deposit must exist on generated maps. */
  metalAccessDistance: P,
  /** Fortification upgrades a BUILD action can add, in order. Advanced levels demand metal. */
  fortification: z.record(FortificationUpgradeSchema, z.strictObject({ cost: ResourcePoolSchema, metal: N, era: AlphaEraSchema, militaryDistrict: z.boolean() })),
});
export type AlphaBalance = z.infer<typeof AlphaBalanceSchema>;

export function alphaBalance(): AlphaBalance {
  const storage = Object.fromEntries(AlphaBuildingSchema.options.map(building => [building, 0])) as Record<z.infer<typeof AlphaBuildingSchema>, number>;
  storage.GRANARY = 10;
  storage.WAREHOUSE = 10;
  storage.TREASURY = 10;
  storage.BANK = 20;
  return AlphaBalanceSchema.parse({
    label: 'ALPHA',
    cityActions: 1,
    wealthConversionRate: 2,
    wealthMaterialCostPercentMax: 50,
    baseStorage: { foodCapacity: 20, woodCapacity: 15, stoneCapacity: 15, metalCapacity: 10, wealthCapacity: 25 },
    storagePerBuilding: storage,
    overflowRule: 'DISCARD_AFTER_ACTION',
    publicInvestmentCost: 3,
    moodEffects: [
      { productionPercent: -100, stabilityDelta: -2 },
      { productionPercent: -50, stabilityDelta: -1 },
      { productionPercent: -25, stabilityDelta: -1 },
      { productionPercent: 0, stabilityDelta: 0 },
      { productionPercent: 10, stabilityDelta: 0 },
      { productionPercent: 20, stabilityDelta: 1 },
      { productionPercent: 30, stabilityDelta: 1 },
    ],
    stack: { military: 6, militaryCommandOne: 7, militaryCommandTwo: 8, civilians: 2, cityBase: 6, cityMax: 10, fleets: 4, fleetsUpgraded: 5,
      upgrades: { commandOne: 'adv-2-4-1', commandTwo: 'adv-4-4-1', naval: 'adv-3-4-2', doctrine: 'adv-4-4-2' },
      cityBonus: { militaryDistrict: 1, doctrine: 1, fortification: { NONE: 0, PALISADE: 1, STONE_WALL: 1, FORTRESS: 2, BASTION: 2, CITADEL: 3 } },
    },
    cultureSlots: 3,
    cultureDice: 2,
    integrationPerAction: 25,
    metalPerMine: 1,
    civicInfluence: 1,
    civicCohesion: 10,
    promoteMoodCeiling: 5,
    metalAccessDistance: 6,
    fortification: {
      PALISADE: { cost: { food: 0, materials: 2, wealth: 0, knowledge: 0, influence: 0 }, metal: 0, era: 'FOUNDATION', militaryDistrict: false },
      STONE_WALL: { cost: { food: 0, materials: 4, wealth: 0, knowledge: 0, influence: 0 }, metal: 0, era: 'EXPANSION', militaryDistrict: false },
      FORTRESS: { cost: { food: 0, materials: 5, wealth: 1, knowledge: 0, influence: 0 }, metal: 1, era: 'CIVILIZATION', militaryDistrict: true },
      BASTION: { cost: { food: 0, materials: 6, wealth: 2, knowledge: 0, influence: 0 }, metal: 2, era: 'EMPIRES', militaryDistrict: true },
      CITADEL: { cost: { food: 0, materials: 8, wealth: 3, knowledge: 0, influence: 0 }, metal: 3, era: 'ASCENSION', militaryDistrict: true },
    },
  });
}

/**
 * Era progression thresholds. Row i gates the step from era i to era i+1. A civilization advances when at least
 * `requiredCriteria` of its criteria are met, so specialised civilizations need not satisfy every one. `government: false`
 * removes the government criterion from that row. Central ALPHA tuning point: edit only here.
 */
export const AlphaEraMilestoneSchema = z.strictObject({
  cities: N, population: N, territory: N, districts: N, research: N, development: N, contacts: N,
  government: z.boolean(), requiredCriteria: P.max(8),
});
export type AlphaEraMilestone = z.infer<typeof AlphaEraMilestoneSchema>;
export const ALPHA_ERA_MILESTONE_CRITERIA = ['cities', 'population', 'territory', 'districts', 'research', 'development', 'government', 'contacts'] as const;
export type AlphaMilestoneCriterion = typeof ALPHA_ERA_MILESTONE_CRITERIA[number];
export const ALPHA_ERA_MILESTONES: readonly AlphaEraMilestone[] = [
  { cities: 1, population: 3, territory: 3, districts: 1, research: 2, development: 1, contacts: 0, government: false, requiredCriteria: 4 },
  { cities: 2, population: 5, territory: 5, districts: 2, research: 4, development: 2, contacts: 0, government: true, requiredCriteria: 4 },
  { cities: 2, population: 7, territory: 7, districts: 3, research: 6, development: 2, contacts: 1, government: true, requiredCriteria: 5 },
  { cities: 3, population: 9, territory: 9, districts: 4, research: 8, development: 3, contacts: 1, government: true, requiredCriteria: 5 },
  { cities: 3, population: 10, territory: 11, districts: 5, research: 10, development: 3, contacts: 2, government: true, requiredCriteria: 5 },
];

export const AlphaTelemetrySchema = z.strictObject({
  version: z.string(), preset: MapPresetSchema, seed: N, players: P, rounds: P, durationMs: N,
  actionsByType: z.record(z.string(), N), productionByResource: AlphaResourcePoolSchema,
  tradeOffers: N, acceptedTrades: N, unitRecruitment: z.record(z.string(), N), battles: N,
  battleResults: z.record(z.string(), N), casualties: N, citiesFounded: N, citiesCaptured: N,
  cityIntegration: N, moodSamples: z.array(N.max(6)), researchByDomain: z.record(z.string(), N),
  worldPulseEvents: N, eventMitigations: N, culturalContests: N, culturalContestResults: z.record(z.string(), N),
  prestigeBySource: z.record(z.string(), N), hegemonyDeclarations: N, hegemonyInterruptions: N,
  winner: PlayerIdSchema.nullable(), victoryReason: z.enum(['HEGEMONY', 'ROUND_LIMIT']).nullable(),
});
export type AlphaTelemetry = z.infer<typeof AlphaTelemetrySchema>;

export const FeedbackSchema = z.strictObject({
  id: IdentifierSchema,
  matchId: IdentifierSchema,
  round: P,
  version: z.string(),
  text: z.string().trim().min(1).max(4000),
  createdAt: z.number().int().nonnegative(),
});
