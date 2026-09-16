import { GameStateSchema, type GameId, type GameState } from '@aoh/game-domain';

export interface GameRepository {
  find(id: GameId): Promise<GameState | null>;
  create(state: GameState): Promise<boolean>;
  // Atomic compare-and-swap: true only if the persisted version still matches.
  save(state: GameState, expectedVersion: number): Promise<boolean>;
}

export class InMemoryGameRepository implements GameRepository {
  private readonly states = new Map<GameId, GameState>();
  async find(id: GameId): Promise<GameState | null> {
    const state = this.states.get(id);
    return state ? GameStateSchema.parse(state) : null;
  }
  async create(state: GameState): Promise<boolean> {
    const validated = GameStateSchema.parse(state);
    if (this.states.has(state.gameId)) return false;
    this.states.set(state.gameId, validated);
    return true;
  }
  async save(state: GameState, expectedVersion: number): Promise<boolean> {
    const validated = GameStateSchema.parse(state);
    if (state.version !== expectedVersion + 1 || this.states.get(state.gameId)?.version !== expectedVersion) return false;
    this.states.set(state.gameId, validated);
    return true;
  }
}
