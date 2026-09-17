import {
  CivilizationIdSchema, CreateGameInputSchema, createDefaultRules, GameCommandSchema, GameStateSchema, unassignedPopulation,
  emptyResourcePool, type GameCommand, type GameEvent, type GameRuleError, type GameState, type PlayerOrder, type RoundPhase,
} from '@aoh/game-domain';
import { err, ok, type Result } from '@aoh/shared';
import { refreshAdministration } from './civilization.js';
import { maintainPlayer } from './maintenance.js';
import { manageCivilization } from './management.js';
import { applyTerritoryCommand } from './territory-commands.js';

const nextPhases: Readonly<Record<RoundPhase, RoundPhase>> = {
  MAINTENANCE: 'PLANNING', PLANNING: 'RESOLUTION', RESOLUTION: 'REACTION', REACTION: 'END_ROUND', END_ROUND: 'MAINTENANCE',
};
export const nextPhase = (phase: RoundPhase): RoundPhase => nextPhases[phase];

export function createGame(input: unknown): Result<GameState, GameRuleError> {
  const parsed = CreateGameInputSchema.safeParse(input);
  if (!parsed.success) {
    const countError = parsed.error.issues.some((issue) => issue.path[0] === 'players' && issue.path.length === 1 && (issue.code === 'too_small' || issue.code === 'too_big'));
    return err({ code: countError ? 'INVALID_PLAYER_COUNT' : 'INVALID_INPUT', message: parsed.error.message });
  }
  const data = parsed.data;
  const config = data.config ?? createDefaultRules();
  if (data.initialCities?.some((city) => !data.players.some((player) => player.id === city.ownerId))) return err({ code: 'INVALID_INPUT', message: 'Initial city owner is not in game' });
  try {
    const state: GameState = {
      schemaVersion: 3, gameId: data.gameId, version: 0, seed: data.seed,
      rng: { algorithm: 'mulberry32-v1', state: data.seed }, status: 'ACTIVE', playerCount: data.players.length,
      players: data.players.map((player, index) => {
        const cities = (data.initialCities ?? []).filter((city) => city.ownerId === player.id).map((city) => ({ ...city,
          population: city.population ?? config.initialPopulation, workers: city.workers ?? unassignedPopulation(city.population ?? config.initialPopulation),
          stability: config.initialStability, development: 1, specialization: null, growthProgress: 0, foundedRound: 1,
          workedHexIds: [], districts: [], buildings: [],
        }));
        return { ...player, resources: player.resources ?? emptyResourcePool(), civilization: refreshAdministration({ id: CivilizationIdSchema.parse(`civilization-${index + 1}`), ownerId: player.id, cities, capitalCityId: cities[0]?.id ?? null, government: 'PROTO_GOVERNANCE', administrativeCapacity: 0, administrativeLoad: 0, administrationStatus: 'WITHIN_CAPACITY' }, config) };
      }),
      map: data.map ?? [], round: 1, era: 'FOUNDATION', phase: 'MAINTENANCE', config,
      pendingOrders: Object.fromEntries(data.players.map((player) => [player.id, []])),
      eventLog: [{ type: 'GAME_CREATED', version: 0, round: 1 }],
    };
    for (const player of state.players) for (const city of player.civilization.cities) {
      const center = state.map.find((tile) => tile.id === city.hexId);
      if (center) {
        if ((center.ownerId !== null && center.ownerId !== player.id) || (center.controllerCityId !== null && center.controllerCityId !== city.id)) return err({ code: 'INVALID_INPUT', message: 'Initial city conflicts with existing territory' });
        center.ownerId = player.id; center.controllerCityId = city.id;
      }
    }
    state.players = state.players.map((player) => ({ ...player, civilization: refreshAdministration(player.civilization, config, state.map) }));
    const validated = GameStateSchema.safeParse(state);
    return validated.success ? ok(validated.data) : err({ code: 'INVALID_INPUT', message: validated.error.message });
  } catch (error: unknown) {
    if (error instanceof RangeError) return err({ code: 'NUMERIC_OVERFLOW', message: error.message });
    throw error;
  }
}

export function applyCommand(state: GameState, input: unknown): Result<GameState, GameRuleError> {
  const validated = GameStateSchema.safeParse(state);
  if (!validated.success) return err({ code: 'INVALID_STATE', message: validated.error.message });
  const parsed = GameCommandSchema.safeParse(input);
  if (!parsed.success) return err({ code: 'INVALID_INPUT', message: parsed.error.message });
  const command: GameCommand = parsed.data;
  const current = validated.data; // Zod gives an independent snapshot; caller-owned values are never mutated.
  if (current.status !== 'ACTIVE') return err({ code: 'NOT_ACTIVE', message: 'Game is not active' });
  if (command.expectedVersion !== current.version) return err({ code: 'VERSION_CONFLICT', message: 'Reload the current state before retrying' });
  if (current.version === Number.MAX_SAFE_INTEGER) return err({ code: 'INVALID_STATE', message: 'Version overflow' });
  const version = current.version + 1;
  const events: GameEvent[] = [];
  try {
    let event: GameEvent;
    if (command.type === 'SUBMIT_ORDER') {
      if (current.phase !== 'PLANNING') return err({ code: 'WRONG_PHASE', message: 'Orders are accepted only in PLANNING' });
      const order = command.order;
      if (!current.players.some((player) => player.id === order.playerId)) return err({ code: 'UNKNOWN_PLAYER', message: 'Player is not in this game' });
      if (order.targetHexId !== undefined && !current.map.some((hex) => hex.id === order.targetHexId)) return err({ code: 'UNKNOWN_HEX', message: 'Target is not in the map' });
      if (Object.values(current.pendingOrders).some((orders) => orders.some((existing) => existing.id === order.id))) return err({ code: 'DUPLICATE_ORDER', message: 'Order ID is already used in this round' });
      current.pendingOrders[order.playerId] = [...(current.pendingOrders[order.playerId] ?? []), order];
      event = { type: 'ORDER_SUBMITTED', version, round: current.round, order };
    } else if (command.type === 'ADVANCE_PHASE') {
      if (nextPhase(current.phase) !== command.nextPhase) return err({ code: 'INVALID_PHASE_TRANSITION', message: `Expected ${nextPhase(current.phase)}` });
      const from = current.phase;
      if (from === 'MAINTENANCE') {
        current.players = current.players.map((player) => {
          const maintenance = maintainPlayer(player, current.config, current.round, version, current.map);
          events.push(...maintenance.events);
          return maintenance.player;
        });
      }
      if (from === 'END_ROUND') {
        if (current.round === Number.MAX_SAFE_INTEGER) return err({ code: 'INVALID_STATE', message: 'Round overflow' });
        current.round += 1;
        current.pendingOrders = Object.fromEntries(current.players.map((player) => [player.id, []]));
      }
      current.phase = command.nextPhase;
      event = { type: 'PHASE_ADVANCED', version, round: current.round, from, to: command.nextPhase };
    } else if (command.type === 'CLAIM_HEX' || command.type === 'ASSIGN_WORKED_HEXES' || command.type === 'IMPROVE_HEX' || command.type === 'FOUND_CITY' || command.type === 'BUILD_DISTRICT' || command.type === 'BUILD_BUILDING') {
      const result = applyTerritoryCommand(current, command, version);
      if (!result.ok) return result;
      current.map = result.value.map;
      current.players = current.players.map((player) => player.id === result.value.player.id ? result.value.player : player);
      event = result.value.event;
    } else {
      const result = manageCivilization(current, command, version);
      if (!result.ok) return result;
      current.players = current.players.map((player) => player.id === result.value.player.id ? result.value.player : player);
      event = result.value.event;
    }
    current.players = current.players.map((player) => ({ ...player, civilization: refreshAdministration(player.civilization, current.config, current.map) }));
    const output = GameStateSchema.safeParse({ ...current, version, eventLog: [...current.eventLog, ...events, event] });
    return output.success ? ok(output.data) : err({ code: 'INVALID_STATE', message: output.error.message });
  } catch (error: unknown) {
    if (error instanceof RangeError) return err({ code: 'NUMERIC_OVERFLOW', message: error.message });
    throw error;
  }
}

export const submitOrder = (state: GameState, order: PlayerOrder, expectedVersion: number): Result<GameState, GameRuleError> => applyCommand(state, { type: 'SUBMIT_ORDER', expectedVersion, order });
export const advancePhase = (state: GameState, phase: RoundPhase, expectedVersion: number): Result<GameState, GameRuleError> => applyCommand(state, { type: 'ADVANCE_PHASE', expectedVersion, nextPhase: phase });
