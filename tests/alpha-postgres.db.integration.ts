import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { expect, it } from 'vitest';
import { PrismaClient } from '../apps/server/src/generated/prisma/client.js';
import { PrismaAlphaRepository } from '../apps/server/src/alpha-prisma-repository.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';

it('persists a running match across connections and rejects competing PostgreSQL writes', async () => {
  const connectionString = process.env.ALPHA_TEST_DATABASE_URL;
  if (!connectionString) throw new Error('Set ALPHA_TEST_DATABASE_URL to a migrated, dedicated LOCAL alpha test database (npm run test:db:docker).');
  const host = new URL(connectionString).hostname;
  if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(host) && process.env.ALPHA_TEST_ALLOW_REMOTE !== '1') throw new Error(`Refusing to run against non-local host "${host}"; integration tests use the disposable Docker database.`);
  const connect = () => new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const first = connect();
  let second: PrismaClient | undefined;
  let roomId: string | undefined;
  const a = { guestId: randomUUID() }, b = { guestId: randomUUID() };
  try {
    const migrations = await first.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM _prisma_migrations
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
    expect(migrations.some(m => m.migration_name === '20260919000100_alpha_match')).toBe(true);
    const repository = new PrismaAlphaRepository(first), service = new AlphaGameService(repository);
    const created = await service.create(a, { name: 'PostgreSQL integration', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 61, planningSeconds: 0 });
    if (!created.ok) throw new Error(created.error.message);
    roomId = created.value.id;
    const joined = await service.join(b, created.value.joinCode, 'Beto');
    if (!joined.ok) throw new Error(joined.error.message);
    let view = joined.value;
    for (const [actor, civilization] of [[a, 'aurelia'], [b, 'valgard']] as const) {
      const choice = await service.lobby(actor, roomId, { type: 'CHOOSE_CIVILIZATION', expectedVersion: view.version, civilization }, 1000);
      if (!choice.ok) throw new Error(choice.error.message);
      const ready = await service.lobby(actor, roomId, { type: 'LOBBY_READY', expectedVersion: choice.value.version, ready: true }, 1000);
      if (!ready.ok) throw new Error(ready.error.message);
      view = ready.value;
    }
    const started = await service.lobby(a, roomId, { type: 'START', expectedVersion: view.version }, 1000);
    if (!started.ok) throw new Error(started.error.message);
    const before = await repository.find(roomId);
    await first.$disconnect();

    second = connect();
    const restoredRepository = new PrismaAlphaRepository(second), restoredService = new AlphaGameService(restoredRepository);
    expect(await restoredRepository.find(roomId)).toEqual(before);
    const reconnected = await restoredService.join(a, created.value.joinCode, 'Ana');
    expect(reconnected.ok && reconnected.value.selfPlayerId).toBe(started.value.selfPlayerId);
    expect(reconnected.ok && reconnected.value.seats.length).toBe(2);
    expect((await restoredService.read({ guestId: randomUUID() }, roomId, 2000)).ok).toBe(false);

    const command = { type: 'SET_DEFENSE_POSTURE', posture: 'HOLD', expectedVersion: started.value.game!.version };
    const results = await Promise.all([restoredService.command(a, roomId, command, 2000), restoredService.command(a, roomId, command, 2000)]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(results.find(result => !result.ok)).toMatchObject({ ok: false, error: { code: 'VERSION_CONFLICT' } });
    expect((await restoredRepository.find(roomId))!.game!.version).toBe(command.expectedVersion + 1);
  } finally {
    // Delete only the unique match created by this test; never reset or truncate a database.
    if (roomId) await (second ?? first).alphaMatch.deleteMany({ where: { id: roomId } });
    await first.$disconnect();
    await second?.$disconnect();
  }
});
