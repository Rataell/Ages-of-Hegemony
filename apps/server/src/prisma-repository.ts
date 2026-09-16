import { deserializeGameState, GameStateSchema, type GameId, type GameState } from '@aoh/game-domain';
import { PrismaClient, Prisma } from './generated/prisma/client.js';
import type { GameRepository } from './repository.js';

export class PrismaGameRepository implements GameRepository {
  constructor(private readonly client: PrismaClient) {}
  async find(id: GameId): Promise<GameState | null> {
    const row = await this.client.game.findUnique({ where: { id } });
    if (!row) return null;
    const decoded = deserializeGameState(JSON.stringify(row.snapshot));
    if (!decoded.ok) throw new Error(`${decoded.error.code}: ${decoded.error.message}`);
    const state = decoded.value;
    if (state.gameId !== row.id || BigInt(state.version) !== row.version) throw new Error('Corrupt game snapshot metadata');
    return state;
  }
  async create(state: GameState): Promise<boolean> {
    const snapshot = GameStateSchema.parse(state);
    try {
      await this.client.game.create({ data: { id: state.gameId, version: BigInt(state.version), snapshot } });
      return true;
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return false;
      throw error;
    }
  }
  async save(state: GameState, expectedVersion: number): Promise<boolean> {
    const snapshot = GameStateSchema.parse(state);
    if (state.version !== expectedVersion + 1) return false;
    const result = await this.client.game.updateMany({
      where: { id: state.gameId, version: BigInt(expectedVersion) },
      data: { version: BigInt(state.version), snapshot },
    });
    return result.count === 1;
  }
}
