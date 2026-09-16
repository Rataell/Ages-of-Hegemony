import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../apps/server/src/generated/prisma/client.js';
import { PrismaGameRepository } from '../apps/server/src/prisma-repository.js';
import { advancePhase } from '@aoh/game-engine';
import { game, gameId, unwrap } from './helpers.js';

// Adapter contract tests, with Prisma calls stubbed. These do not claim live DB coverage.
const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'postgresql://unused:unused@localhost:5432/unused' }) });
afterEach(() => vi.restoreAllMocks());

describe('Prisma snapshot adapter contract', () => {
  it('maps and validates database snapshots', async () => {
    vi.spyOn(client.game, 'findUnique').mockResolvedValue({ id: gameId, version: 0n, snapshot: game() });
    const repository = new PrismaGameRepository(client);
    expect(await repository.find(gameId)).toEqual(game());
  });
  it('rejects corrupt metadata and payloads', async () => {
    const spy = vi.spyOn(client.game, 'findUnique').mockResolvedValue({ id: gameId, version: 5n, snapshot: game() });
    const repository = new PrismaGameRepository(client);
    await expect(repository.find(gameId)).rejects.toThrow('Corrupt');
    spy.mockResolvedValue({ id: gameId, version: 0n, snapshot: {} });
    await expect(repository.find(gameId)).rejects.toThrow();
  });
  it('creates domain snapshots and handles duplicate game IDs', async () => {
    const spy = vi.spyOn(client.game, 'create').mockResolvedValue({ id: gameId, version: 0n, snapshot: game() });
    const repository = new PrismaGameRepository(client);
    expect(await repository.create(game())).toBe(true);
    expect(spy).toHaveBeenCalledWith({ data: { id: gameId, version: 0n, snapshot: game() } });
    spy.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Duplicate', { code: 'P2002', clientVersion: '7.10.0' }));
    expect(await repository.create(game())).toBe(false);
    spy.mockRejectedValue(new Error('Database unavailable'));
    await expect(repository.create(game())).rejects.toThrow('Database unavailable');
  });
  it('sends an atomic version predicate and detects lost updates', async () => {
    const spy = vi.spyOn(client.game, 'updateMany').mockResolvedValue({ count: 1 });
    const repository = new PrismaGameRepository(client);
    const next = unwrap(advancePhase(game(), 'PLANNING', 0));
    expect(await repository.save(next, 0)).toBe(true);
    expect(spy).toHaveBeenCalledWith({ where: { id: gameId, version: 0n }, data: { version: 1n, snapshot: next } });
    spy.mockResolvedValue({ count: 0 });
    expect(await repository.save(next, 0)).toBe(false);
    spy.mockClear();
    expect(await repository.save(next, 2)).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});
