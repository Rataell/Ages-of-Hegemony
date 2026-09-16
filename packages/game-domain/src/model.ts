import { z } from 'zod';

const identifier = z.string().min(1).max(100).regex(/^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/)
  .refine((id) => !['__proto__', 'constructor', 'prototype'].includes(id), 'Reserved identifier');
export const GameIdSchema = identifier.brand<'GameId'>();
export const PlayerIdSchema = identifier.brand<'PlayerId'>();
export const CivilizationIdSchema = identifier.brand<'CivilizationId'>();
export const CityIdSchema = identifier.brand<'CityId'>();
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
export const HexTileSchema = z.strictObject({ id: HexIdSchema, q: AxialCoordinatesSchema.shape.q, r: AxialCoordinatesSchema.shape.r });
export type HexTile = z.infer<typeof HexTileSchema>;
export const CityStateSchema = z.strictObject({
  id: CityIdSchema, ownerId: PlayerIdSchema, hexId: HexIdSchema,
  population: NonNegativeIntegerSchema, stability: z.number().finite(), development: NonNegativeIntegerSchema,
});
export type CityState = z.infer<typeof CityStateSchema>;
export const CivilizationStateSchema = z.strictObject({ id: CivilizationIdSchema, ownerId: PlayerIdSchema, cities: z.array(CityStateSchema) });
export type CivilizationState = z.infer<typeof CivilizationStateSchema>;
export const PlayerStateSchema = z.strictObject({ id: PlayerIdSchema, name: z.string().trim().min(1).max(80), civilization: CivilizationStateSchema, resources: ResourcePoolSchema });
export type PlayerState = z.infer<typeof PlayerStateSchema>;
export const GameConfigSchema = z.strictObject({ baseCommandPoints: NonNegativeIntegerSchema });
export type GameConfig = z.infer<typeof GameConfigSchema>;
export const DEFAULT_GAME_CONFIG: Readonly<GameConfig> = Object.freeze({ baseCommandPoints: 4 });

// Intent envelope only. Action-specific payloads and costs await game-design specifications.
export const PlayerOrderSchema = z.strictObject({ id: identifier, playerId: PlayerIdSchema, type: OrderTypeSchema, targetHexId: HexIdSchema.optional() });
export type PlayerOrder = z.infer<typeof PlayerOrderSchema>;
export const GameCommandSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('SUBMIT_ORDER'), expectedVersion: NonNegativeIntegerSchema, order: PlayerOrderSchema }),
  z.strictObject({ type: z.literal('ADVANCE_PHASE'), expectedVersion: NonNegativeIntegerSchema, nextPhase: RoundPhaseSchema }),
]);
export type GameCommand = z.infer<typeof GameCommandSchema>;

const eventBase = { version: NonNegativeIntegerSchema, round: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) };
export const GameEventSchema = z.discriminatedUnion('type', [
  z.strictObject({ ...eventBase, type: z.literal('GAME_CREATED') }),
  z.strictObject({ ...eventBase, type: z.literal('ORDER_SUBMITTED'), order: PlayerOrderSchema }),
  z.strictObject({ ...eventBase, type: z.literal('PHASE_ADVANCED'), from: RoundPhaseSchema, to: RoundPhaseSchema }),
]);
export type GameEvent = z.infer<typeof GameEventSchema>;
export type GameRuleErrorCode = 'INVALID_INPUT' | 'INVALID_STATE' | 'INVALID_PLAYER_COUNT' | 'VERSION_CONFLICT' | 'INVALID_PHASE_TRANSITION' | 'WRONG_PHASE' | 'UNKNOWN_PLAYER' | 'UNKNOWN_HEX' | 'DUPLICATE_ORDER' | 'INVALID_RESOURCE' | 'INSUFFICIENT_RESOURCES' | 'NOT_ACTIVE';
export interface GameRuleError { readonly code: GameRuleErrorCode; readonly message: string }

export const CreateGameInputSchema = z.strictObject({
  gameId: GameIdSchema, seed: SeedSchema,
  players: z.array(z.strictObject({ id: PlayerIdSchema, name: PlayerStateSchema.shape.name })).min(2).max(6),
  config: GameConfigSchema.optional(),
  map: z.array(HexTileSchema).optional(),
});
export type CreateGameInput = z.infer<typeof CreateGameInputSchema>;

export const GameStateSchema = z.strictObject({
  schemaVersion: z.literal(1), gameId: GameIdSchema, version: NonNegativeIntegerSchema,
  seed: SeedSchema, rng: z.strictObject({ algorithm: z.literal('mulberry32-v1'), state: SeedSchema }),
  status: z.enum(['ACTIVE', 'FINISHED']), playerCount: z.number().int().min(2).max(6),
  players: z.array(PlayerStateSchema).min(2).max(6), map: z.array(HexTileSchema),
  round: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), era: EraSchema, phase: RoundPhaseSchema,
  config: GameConfigSchema,
  pendingOrders: z.record(PlayerIdSchema, z.array(PlayerOrderSchema)), eventLog: z.array(GameEventSchema),
}).superRefine((state, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  const players = new Set(state.players.map((player) => player.id));
  if (players.size !== state.playerCount || state.players.length !== state.playerCount) fail('Player count or unique IDs mismatch');
  if (new Set(state.players.map((p) => p.civilization.id)).size !== state.playerCount) fail('Duplicate civilization');
  const hexes = new Set(state.map.map((hex) => hex.id));
  if (hexes.size !== state.map.length || state.map.some((hex) => hex.id !== `${hex.q},${hex.r}`)) fail('Invalid or duplicate hex identity');
  const cityIds = new Set<string>();
  for (const player of state.players) {
    if (player.civilization.ownerId !== player.id) fail('Civilization owner mismatch');
    for (const city of player.civilization.cities) {
      if (city.ownerId !== player.id || !hexes.has(city.hexId) || cityIds.has(city.id)) fail('Invalid city ownership, hex or ID');
      cityIds.add(city.id);
    }
  }
  const keys = Object.keys(state.pendingOrders);
  if (keys.length !== players.size || keys.some((key) => !players.has(PlayerIdSchema.parse(key)))) fail('Pending-order players mismatch');
  const orderIds = new Set<string>();
  for (const [playerId, orders] of Object.entries(state.pendingOrders)) {
    for (const order of orders) {
      if (order.playerId !== playerId || orderIds.has(order.id) || (order.targetHexId !== undefined && !hexes.has(order.targetHexId))) fail('Invalid order owner, target or duplicate ID');
      orderIds.add(order.id);
    }
  }
  if (state.eventLog.length !== state.version + 1 || state.eventLog[0]?.type !== 'GAME_CREATED') fail('Event log/version mismatch');
  state.eventLog.forEach((event, index) => {
    if (event.version !== index || event.round > state.round || (index > 0 && event.type === 'GAME_CREATED')) fail('Invalid event sequence');
    if (event.type === 'ORDER_SUBMITTED' && !players.has(event.order.playerId)) fail('Unknown event player');
  });
});
export type GameState = z.infer<typeof GameStateSchema>;
