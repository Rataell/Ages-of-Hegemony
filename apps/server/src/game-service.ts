import { GameCommandSchema, type GameId, type PlayerId, type GameState, type GameRuleError, type RoundPhase } from '@aoh/game-domain';
import { applyCommand, createGame } from '@aoh/game-engine';
import { err, ok, type Result } from '@aoh/shared';
import type { GameRepository } from './repository.js';

type ServiceError = GameRuleError | { readonly code: 'NOT_FOUND' | 'FORBIDDEN' | 'ALREADY_EXISTS'; readonly message: string };
// Credentials must be resolved by a trusted transport adapter, never from command JSON.
export interface AuthenticatedPlayer { readonly playerId: PlayerId }

// Explicit allowlist: no authoritative state, opponent orders or private event log leaks.
export function playerView(state: GameState, playerId: PlayerId) {
  const player = state.players.find((entry) => entry.id === playerId);
  if (!player) return null;
  return structuredClone({
    gameId: state.gameId, version: state.version, round: state.round, era: state.era,
    phase: state.phase, status: state.status, playerCount: state.playerCount,
    player, pendingOrders: state.pendingOrders[playerId] ?? [], config: state.config,
  });
}
export type PlayerView = NonNullable<ReturnType<typeof playerView>>;

export class GameService {
  constructor(private readonly repository: GameRepository) {}
  // Internal lobby entry point, not exposed as an unauthenticated HTTP handler.
  async create(input: unknown): Promise<Result<GameState, ServiceError>> {
    const created = createGame(input);
    if (!created.ok) return created;
    return await this.repository.create(created.value) ? created : err({ code: 'ALREADY_EXISTS', message: 'Game already exists' });
  }
  async submit(gameId: GameId, principal: AuthenticatedPlayer, input: unknown): Promise<Result<PlayerView, ServiceError>> {
    const command = GameCommandSchema.safeParse(input);
    if (!command.success) return err({ code: 'INVALID_INPUT', message: 'Invalid order command' });
    if (command.data.type !== 'SUBMIT_ORDER' || command.data.order.playerId !== principal.playerId) return err({ code: 'FORBIDDEN', message: 'Players may submit only their own orders' });
    const state = await this.repository.find(gameId);
    if (!state) return err({ code: 'NOT_FOUND', message: 'Unknown game' });
    const result = applyCommand(state, command.data);
    if (!result.ok) return result;
    if (!await this.repository.save(result.value, state.version)) return err({ code: 'VERSION_CONFLICT', message: 'Concurrent update; reload before retrying' });
    const view = playerView(result.value, principal.playerId);
    return view ? ok(view) : err({ code: 'FORBIDDEN', message: 'Player is not in game' });
  }
  // Scheduler/admin capability. A future HTTP/WS adapter MUST NOT expose this to players.
  async advance(gameId: GameId, phase: RoundPhase, expectedVersion: number): Promise<Result<GameState, ServiceError>> {
    const state = await this.repository.find(gameId);
    if (!state) return err({ code: 'NOT_FOUND', message: 'Unknown game' });
    const result = applyCommand(state, { type: 'ADVANCE_PHASE', nextPhase: phase, expectedVersion });
    if (!result.ok) return result;
    return await this.repository.save(result.value, state.version) ? result : err({ code: 'VERSION_CONFLICT', message: 'Concurrent update; reload before retrying' });
  }
}
