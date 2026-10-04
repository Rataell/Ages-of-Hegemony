import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '../apps/server/src/generated/prisma/client.js';
import { ARCHIVE_REASON_MIGRATED_TO_V5, PrismaAlphaRepository } from '../apps/server/src/alpha-prisma-repository.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { toV4Snapshot } from './alpha-v4-fixture.js';

const connectionString = process.env.ALPHA_TEST_DATABASE_URL;
if (!connectionString) throw new Error('Set ALPHA_TEST_DATABASE_URL to a migrated, dedicated LOCAL alpha test database (npm run test:db:docker).');
const host = new URL(connectionString).hostname;
if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(host) && process.env.ALPHA_TEST_ALLOW_REMOTE !== '1') {
  throw new Error(`Refusing to run against non-local host "${host}". Integration tests use the disposable Docker database, never Supabase or the public alpha.`);
}

const client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const repository = new PrismaAlphaRepository(client);
const service = new AlphaGameService(repository);
const created: string[] = [];

const a = { guestId: randomUUID() }, b = { guestId: randomUUID() };
let seed = 200;

/** Starts a real two-player match through the service, then rewrites its stored row into the legacy v4 shape. */
async function legacyMatch(): Promise<{ id: string; original: unknown }> {
  const made = await service.create(a, { name: 'Legacy migration', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: seed++, planningSeconds: 0 });
  if (!made.ok) throw new Error(made.error.message);
  const id = made.value.id; created.push(id);
  const joined = await service.join(b, made.value.joinCode, 'Beto');
  if (!joined.ok) throw new Error(joined.error.message);
  let view = joined.value;
  for (const [actor, civilization] of [[a, 'aurelia'], [b, 'valgard']] as const) {
    const choice = await service.lobby(actor, id, { type: 'CHOOSE_CIVILIZATION', expectedVersion: view.version, civilization }, 1000);
    if (!choice.ok) throw new Error(choice.error.message);
    const ready = await service.lobby(actor, id, { type: 'LOBBY_READY', expectedVersion: choice.value.version, ready: true }, 1000);
    if (!ready.ok) throw new Error(ready.error.message);
    view = ready.value;
  }
  const started = await service.lobby(a, id, { type: 'START', expectedVersion: view.version }, 1000);
  if (!started.ok) throw new Error(started.error.message);
  const room = JSON.parse(JSON.stringify(await repository.find(id))) as { game: never };
  const legacy = { ...room, game: toV4Snapshot(room.game) };
  await client.alphaMatch.update({ where: { id }, data: { snapshot: legacy as never } });
  return { id, original: legacy };
}
const rawSnapshot = async (id: string) => (await client.alphaMatch.findUniqueOrThrow({ where: { id } })).snapshot;
const command = (version: number) => ({ type: 'SET_DEFENSE_POSTURE', posture: 'HOLD', expectedVersion: version });

beforeAll(async () => {
  const applied = await client.$queryRaw<{ migration_name: string }[]>`
    SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
  const names = applied.map(row => row.migration_name);
  expect(names).toContain('20260919000100_alpha_match');
  expect(names).toContain('20260920000100_alpha_match_archive');
});
afterAll(async () => {
  // Delete only rows created by this file; never reset or truncate a database.
  if (created.length) {
    await client.alphaMatchArchive.deleteMany({ where: { matchId: { in: created } } });
    await client.alphaMatch.deleteMany({ where: { id: { in: created } } });
  }
  await client.$disconnect();
});

describe('legacy v4 rows on real PostgreSQL', () => {
  it('migrates on read without writing anything', async () => {
    const { id, original } = await legacyMatch();
    const room = await repository.find(id);
    expect(room?.game?.schemaVersion).toBe(5);
    expect(await repository.find(id)).toEqual(room);
    expect(await rawSnapshot(id)).toEqual(original);
    expect(await repository.archived(id)).toEqual([]);
  });

  it('archives the exact original snapshot in the same transaction as the first v5 save, once', async () => {
    const { id, original } = await legacyMatch();
    const version = (await repository.find(id))!.game!.version;
    const first = await service.command(a, id, command(version), 2000);
    expect(first.ok).toBe(true);
    const archived = await repository.archived(id);
    expect(archived).toHaveLength(1);
    expect(archived[0]).toMatchObject({ reason: ARCHIVE_REASON_MIGRATED_TO_V5 });
    expect(archived[0]!.snapshot).toEqual(original);
    expect((await rawSnapshot(id) as { game: { schemaVersion: number } }).game.schemaVersion).toBe(5);
    const second = await service.command(b, id, command(version + 1), 2000);
    expect(second.ok).toBe(true);
    expect(await repository.archived(id)).toHaveLength(1);
  });

  it('lets exactly one of two competing first saves win and archives once', async () => {
    const { id, original } = await legacyMatch();
    const version = (await repository.find(id))!.game!.version;
    const results = await Promise.all([service.command(a, id, command(version), 2000), service.command(a, id, command(version), 2000)]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(results.find(result => !result.ok)).toMatchObject({ ok: false, error: { code: 'VERSION_CONFLICT' } });
    const archived = await repository.archived(id);
    expect(archived).toHaveLength(1);
    expect(archived[0]!.snapshot).toEqual(original);
  });

  it('refuses a corrupt row and leaves both the row and the archive untouched', async () => {
    const { id } = await legacyMatch();
    const corrupt = { ...(await rawSnapshot(id) as object), game: { schemaVersion: 4, garbage: true } };
    await client.alphaMatch.update({ where: { id }, data: { snapshot: corrupt as never } });
    await expect(repository.find(id)).rejects.toThrow('Invalid alpha match snapshot');
    expect(await rawSnapshot(id)).toEqual(corrupt);
    expect(await repository.archived(id)).toEqual([]);
  });

  it('does not archive a save that loses the compare-and-swap', async () => {
    const { id } = await legacyMatch();
    const room = (await repository.find(id))!;
    expect(await repository.save({ ...room, version: room.version + 6 }, room.version + 5)).toBe(false);
    expect(await repository.archived(id)).toEqual([]);
  });
});
