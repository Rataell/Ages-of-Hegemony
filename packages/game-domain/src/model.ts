import { z } from 'zod';
import {
  IdentifierSchema, GameIdSchema, PlayerIdSchema, CivilizationIdSchema, CityIdSchema, HexIdSchema,
  EraSchema, RoundPhaseSchema, OrderTypeSchema, NonNegativeIntegerSchema as N, PositiveIntegerSchema as P,
  SeedSchema, ResourcePoolSchema, HexTileSchema, InitialHexTileSchema, ImprovementTypeSchema, PopulationAllocationSchema, CitySpecializationSchema,
  GovernmentSchema, GovernmentTypeSchema, StabilitySchema, DevelopmentSchema,
} from './core.js';
import { GameRulesConfigSchema, createDefaultRules } from './rules.js';
import { BuildingStateSchema, BuildingTypeSchema, DistrictStateSchema, DistrictTypeSchema, EconomyBreakdownSchema } from './territory.js';
import { territorialInvariantErrors } from './territory-invariants.js';

export const CityStateSchema = z.strictObject({
  id: CityIdSchema, ownerId: PlayerIdSchema, hexId: HexIdSchema, name: z.string().trim().min(1).max(80),
  population: N, stability: StabilitySchema, development: DevelopmentSchema,
  specialization: CitySpecializationSchema.nullable(), workers: PopulationAllocationSchema,
  foundedRound: P, growthProgress: N,
  workedHexIds: z.array(HexIdSchema), districts: z.array(DistrictStateSchema), buildings: z.array(BuildingStateSchema),
}).superRefine((city, ctx) => {
  if (Object.values(city.workers).reduce((sum, value) => sum + BigInt(value), 0n) !== BigInt(city.population)) ctx.addIssue({ code: 'custom', message: 'Allocated population must equal city population' });
});
export type CityState = z.infer<typeof CityStateSchema>;
export const CivilizationStateSchema = z.strictObject({
  id: CivilizationIdSchema, ownerId: PlayerIdSchema, cities: z.array(CityStateSchema),
  capitalCityId: CityIdSchema.nullable(), government: GovernmentSchema,
  administrativeCapacity: N, administrativeLoad: N, administrationStatus: z.enum(['WITHIN_CAPACITY', 'OVEREXTENDED']),
});
export type CivilizationState = z.infer<typeof CivilizationStateSchema>;
export const PlayerStateSchema = z.strictObject({ id: PlayerIdSchema, name: z.string().trim().min(1).max(80), civilization: CivilizationStateSchema, resources: ResourcePoolSchema });
export type PlayerState = z.infer<typeof PlayerStateSchema>;

export const PlayerOrderSchema = z.strictObject({ id: IdentifierSchema, playerId: PlayerIdSchema, type: OrderTypeSchema, targetHexId: HexIdSchema.optional() });
export type PlayerOrder = z.infer<typeof PlayerOrderSchema>;
const playerCommand = { expectedVersion: N, playerId: PlayerIdSchema };
export const GameCommandSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('SUBMIT_ORDER'), expectedVersion: N, order: PlayerOrderSchema }),
  z.strictObject({ type: z.literal('ADVANCE_PHASE'), expectedVersion: N, nextPhase: RoundPhaseSchema }),
  z.strictObject({ ...playerCommand, type: z.literal('ASSIGN_POPULATION'), cityId: CityIdSchema, workers: PopulationAllocationSchema }),
  z.strictObject({ ...playerCommand, type: z.literal('DEVELOP_CITY'), cityId: CityIdSchema }),
  z.strictObject({ ...playerCommand, type: z.literal('SPECIALIZE_CITY'), cityId: CityIdSchema, specialization: CitySpecializationSchema }),
  z.strictObject({ ...playerCommand, type: z.literal('ADOPT_GOVERNMENT'), government: GovernmentTypeSchema }),
  z.strictObject({ ...playerCommand, type: z.literal('CLAIM_HEX'), cityId: CityIdSchema, hexId: HexIdSchema }),
  z.strictObject({ ...playerCommand, type: z.literal('ASSIGN_WORKED_HEXES'), cityId: CityIdSchema, hexIds: z.array(HexIdSchema) }),
  z.strictObject({ ...playerCommand, type: z.literal('IMPROVE_HEX'), hexId: HexIdSchema, improvement: ImprovementTypeSchema }),
  z.strictObject({ ...playerCommand, type: z.literal('FOUND_CITY'), cityId: CityIdSchema, hexId: HexIdSchema, name: CityStateSchema.shape.name }),
  z.strictObject({ ...playerCommand, type: z.literal('BUILD_DISTRICT'), cityId: CityIdSchema, district: DistrictTypeSchema }),
  z.strictObject({ ...playerCommand, type: z.literal('BUILD_BUILDING'), cityId: CityIdSchema, building: BuildingTypeSchema }),
]);
export type GameCommand = z.infer<typeof GameCommandSchema>;
export type TerritoryCommand = Extract<GameCommand, { type: 'CLAIM_HEX' | 'ASSIGN_WORKED_HEXES' | 'IMPROVE_HEX' | 'FOUND_CITY' | 'BUILD_DISTRICT' | 'BUILD_BUILDING' }>;
export type ManagementCommand = Exclude<GameCommand, TerritoryCommand | { type: 'SUBMIT_ORDER' | 'ADVANCE_PHASE' }>;

const eventBase = { version: N, round: P };
const cityEvent = { ...eventBase, playerId: PlayerIdSchema, cityId: CityIdSchema };
export const GameEventSchema = z.discriminatedUnion('type', [
  z.strictObject({ ...eventBase, type: z.literal('GAME_CREATED') }),
  z.strictObject({ ...eventBase, type: z.literal('ORDER_SUBMITTED'), order: PlayerOrderSchema }),
  z.strictObject({ ...eventBase, type: z.literal('PHASE_ADVANCED'), from: RoundPhaseSchema, to: RoundPhaseSchema }),
  z.strictObject({ ...cityEvent, type: z.literal('CITY_DEVELOPED'), development: DevelopmentSchema, cost: ResourcePoolSchema }),
  z.strictObject({ ...cityEvent, type: z.literal('CITY_SPECIALIZED'), specialization: CitySpecializationSchema }),
  z.strictObject({ ...cityEvent, type: z.literal('POPULATION_ASSIGNED'), workers: PopulationAllocationSchema }),
  z.strictObject({ ...cityEvent, type: z.literal('POPULATION_GROWN'), amount: P, population: N }),
  z.strictObject({ ...cityEvent, type: z.literal('GROWTH_PROGRESS_CHANGED'), from: N, to: N }),
  z.strictObject({ ...eventBase, playerId: PlayerIdSchema, type: z.literal('FOOD_SHORTAGE'), required: N, paid: N, deficit: P }),
  z.strictObject({ ...cityEvent, type: z.literal('STABILITY_CHANGED'), from: StabilitySchema, to: StabilitySchema }),
  z.strictObject({ ...eventBase, playerId: PlayerIdSchema, type: z.literal('GOVERNMENT_ADOPTED'), government: GovernmentTypeSchema }),
  z.strictObject({ ...eventBase, playerId: PlayerIdSchema, type: z.literal('ADMINISTRATIVE_OVEREXTENSION'), load: N, capacity: N }),
  z.strictObject({ ...eventBase, playerId: PlayerIdSchema, type: z.literal('RESOURCES_PRODUCED'), resources: ResourcePoolSchema, breakdown: EconomyBreakdownSchema.optional() }),
  z.strictObject({ ...eventBase, playerId: PlayerIdSchema, type: z.literal('FOOD_CONSUMED'), amount: N }),
  z.strictObject({ ...cityEvent, type: z.literal('HEX_CLAIMED'), hexId: HexIdSchema, cost: ResourcePoolSchema }),
  z.strictObject({ ...cityEvent, type: z.literal('WORKED_HEXES_ASSIGNED'), hexIds: z.array(HexIdSchema) }),
  z.strictObject({ ...eventBase, playerId: PlayerIdSchema, type: z.literal('HEX_IMPROVED'), hexId: HexIdSchema, improvement: ImprovementTypeSchema, cost: ResourcePoolSchema }),
  z.strictObject({ ...cityEvent, type: z.literal('CITY_FOUNDED'), hexId: HexIdSchema, name: z.string(), cost: ResourcePoolSchema }),
  z.strictObject({ ...cityEvent, type: z.literal('DISTRICT_BUILT'), district: DistrictTypeSchema, cost: ResourcePoolSchema }),
  z.strictObject({ ...cityEvent, type: z.literal('BUILDING_BUILT'), building: BuildingTypeSchema, cost: ResourcePoolSchema }),
]);
export type GameEvent = z.infer<typeof GameEventSchema>;
export type GameRuleErrorCode = 'INVALID_INPUT' | 'INVALID_STATE' | 'INVALID_PLAYER_COUNT' | 'VERSION_CONFLICT' | 'INVALID_PHASE_TRANSITION' | 'WRONG_PHASE' | 'UNKNOWN_PLAYER' | 'UNKNOWN_HEX' | 'DUPLICATE_ORDER' | 'INVALID_RESOURCE' | 'INSUFFICIENT_RESOURCES' | 'NOT_ACTIVE' | 'CITY_NOT_OWNED' | 'INVALID_ALLOCATION' | 'MAX_DEVELOPMENT' | 'CRITICAL_STABILITY' | 'ALREADY_SPECIALIZED' | 'DEVELOPMENT_REQUIRED' | 'GOVERNMENT_ALREADY_ADOPTED' | 'NUMERIC_OVERFLOW' | 'SNAPSHOT_MIGRATION_REQUIRED' | 'UNSUPPORTED_SCHEMA';
export interface GameRuleError { readonly code: GameRuleErrorCode | 'INVALID_TERRITORY' | 'HEX_NOT_FREE' | 'HEX_NOT_OWNED' | 'OUT_OF_RANGE' | 'DISCONNECTED_TERRITORY' | 'INVALID_WORKED_HEXES' | 'INVALID_IMPROVEMENT' | 'ALREADY_IMPROVED' | 'INVALID_CITY_SITE' | 'CITY_TOO_CLOSE' | 'DUPLICATE_CITY' | 'DISTRICT_LIMIT' | 'DUPLICATE_DISTRICT' | 'MISSING_DISTRICT' | 'DUPLICATE_BUILDING'; readonly message: string }

export const InitialCitySchema = z.strictObject({
  id: CityIdSchema, ownerId: PlayerIdSchema, hexId: HexIdSchema, name: CityStateSchema.shape.name,
  population: N.optional(), workers: PopulationAllocationSchema.optional(),
});
// Trusted lobby/scenario input; not a free city-founding rule for players.
export const CreateGameInputSchema = z.strictObject({
  gameId: GameIdSchema, seed: SeedSchema,
  players: z.array(z.strictObject({ id: PlayerIdSchema, name: PlayerStateSchema.shape.name, resources: ResourcePoolSchema.optional() })).min(2).max(6),
  config: z.union([GameRulesConfigSchema, z.strictObject({ baseCommandPoints: N }).transform((old) => ({ ...createDefaultRules(), ...old }))]).optional(),
  map: z.array(InitialHexTileSchema).optional(), initialCities: z.array(InitialCitySchema).optional(),
});
export type CreateGameInput = z.infer<typeof CreateGameInputSchema>;

export const GameStateSchema = z.strictObject({
  schemaVersion: z.literal(3), gameId: GameIdSchema, version: N,
  seed: SeedSchema, rng: z.strictObject({ algorithm: z.literal('mulberry32-v1'), state: SeedSchema }),
  status: z.enum(['ACTIVE', 'FINISHED']), playerCount: z.number().int().min(2).max(6),
  players: z.array(PlayerStateSchema).min(2).max(6), map: z.array(HexTileSchema),
  round: P, era: EraSchema, phase: RoundPhaseSchema, config: GameRulesConfigSchema,
  pendingOrders: z.record(PlayerIdSchema, z.array(PlayerOrderSchema)), eventLog: z.array(GameEventSchema),
}).superRefine((state, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  for (const message of territorialInvariantErrors(state)) fail(message);
  const players = new Set<string>(state.players.map((player) => player.id));
  if (players.size !== state.playerCount || state.players.length !== state.playerCount) fail('Player count or unique IDs mismatch');
  if (new Set(state.players.map((p) => p.civilization.id)).size !== state.playerCount) fail('Duplicate civilization');
  const hexes = new Set(state.map.map((hex) => hex.id));
  if (hexes.size !== state.map.length || state.map.some((hex) => hex.id !== `${hex.q},${hex.r}`)) fail('Invalid or duplicate hex identity');
  const cityIds = new Set<string>();
  const occupiedHexes = new Set<string>();
  for (const player of state.players) {
    const civ = player.civilization;
    if (civ.ownerId !== player.id) fail('Civilization owner mismatch');
    if (civ.cities.length === 0 ? civ.capitalCityId !== null : !civ.cities.some((city) => city.id === civ.capitalCityId)) fail('Capital must belong to civilization');
    if ((civ.administrativeLoad > civ.administrativeCapacity) !== (civ.administrationStatus === 'OVEREXTENDED')) fail('Administration status mismatch');
    for (const city of civ.cities) {
      if (city.ownerId !== player.id || !hexes.has(city.hexId) || cityIds.has(city.id) || occupiedHexes.has(city.hexId)) fail('Invalid city ownership, hex or duplicate city');
      cityIds.add(city.id); occupiedHexes.add(city.hexId);
      if (city.development > state.config.maxDevelopment || city.population > (state.config.developmentPopulationCaps[city.development - 1] ?? 0)) fail('City exceeds development or population cap');
      if (city.growthProgress > state.config.growthThreshold || city.foundedRound > state.round) fail('Invalid growth progress or founding round');
      if (city.specialization !== null && city.development < state.config.specializationMinimumDevelopment) fail('Specialization requires development');
    }
  }
  const keys = Object.keys(state.pendingOrders);
  if (keys.length !== players.size || keys.some((key) => !players.has(key))) fail('Pending-order players mismatch');
  const orderIds = new Set<string>();
  for (const [playerId, orders] of Object.entries(state.pendingOrders)) for (const order of orders) {
    if (order.playerId !== playerId || orderIds.has(order.id) || (order.targetHexId !== undefined && !hexes.has(order.targetHexId))) fail('Invalid order owner, target or duplicate ID');
    orderIds.add(order.id);
  }
  if (state.eventLog[0]?.type !== 'GAME_CREATED' || state.eventLog[0]?.version !== 0 || state.eventLog.at(-1)?.version !== state.version) fail('Event log/version mismatch');
  let revision = 0;
  let round = 1;
  for (const [index, event] of state.eventLog.entries()) {
    if (event.version < revision || event.version > revision + 1 || event.round < round || event.round > state.round || (index > 0 && (event.type === 'GAME_CREATED' || event.version === 0))) fail('Invalid event sequence');
    revision = event.version; round = event.round;
    if (event.type === 'ORDER_SUBMITTED' && !players.has(event.order.playerId)) fail('Unknown event player');
    if ('playerId' in event && !players.has(event.playerId)) fail('Unknown event player');
    if ('cityId' in event && !state.players.find((player) => player.id === event.playerId)?.civilization.cities.some((city) => city.id === event.cityId)) fail('Unknown event city or owner');
  }
});
export type GameState = z.infer<typeof GameStateSchema>;
