import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository, LEGACY_ROOM_MESSAGE, isLegacyRoom } from '../apps/server/src/alpha-room.js';
import { decode, encodeRoom } from '../apps/server/src/alpha-prisma-repository.js';

/** A REAL V1.1 room (tag external-alpha-v1.1-bots-parity): 1 human + 2 bots (valgard, nymara, veyra), round 9 of a running match. */
const fixture = JSON.parse(readFileSync(new URL('./fixtures/v11-room.json', import.meta.url), 'utf8')) as { room: Record<string, unknown>; human: string };

describe('V1.1 room saved before RC 1.2', () => {
  it('still parses against the current catalogs, as a legacy (read-only) room', () => {
    const room = AlphaRoomSchema.parse(fixture.room);
    expect(isLegacyRoom(room)).toBe(true);
    expect(room.contentVersion).toBe('v1.1');
    expect(room.mapSize).toBe('STANDARD');
    expect(room.game!.core.round).toBeGreaterThan(5);
    expect(room.seats.some(seat => seat.civilization === 'veyra')).toBe(true);
  });
  it('shows the table with a controlled message and refuses every mutation; nothing is advanced or written', async () => {
    const repository = new InMemoryAlphaRepository(), service = new AlphaGameService(repository), room = AlphaRoomSchema.parse(fixture.room);
    await repository.create(room);
    const before = JSON.stringify(await repository.find(room.id));
    const host = { guestId: fixture.human };
    const view = await service.read(host, room.id, 99999999);
    expect(view.ok).toBe(true); if (!view.ok) return;
    expect(view.value.legacy).toBe(true);
    expect(view.value.legacyMessage).toBe(LEGACY_ROOM_MESSAGE);
    expect(view.value.game).not.toBeNull();
    for (const attempt of [
      service.command(host, room.id, { type: 'READY', expectedVersion: room.game!.version }, 99999999),
      service.lobby(host, room.id, { type: 'LOBBY_READY', expectedVersion: room.version, ready: true }, 99999999),
      service.roomAction(host, room.id, { type: 'SUSPEND' }, 99999999),
      service.join({ guestId: crypto.randomUUID() }, room.joinCode, 'Carla'),
    ]) { const result = await attempt; expect(result.ok).toBe(false); if (!result.ok) expect(result.error.code).toBe('LEGACY_ROOM'); }
    expect(JSON.stringify(await repository.find(room.id))).toBe(before);
  });
  it('is stored with exactly the V1 shape (no content version, map size or Figura keys), so a rollback still opens it', () => {
    const encoded = encodeRoom(AlphaRoomSchema.parse(fixture.room)) as unknown as Record<string, unknown>;
    expect(Object.keys(encoded)).not.toContain('contentVersion');
    expect(Object.keys(encoded)).not.toContain('mapSize');
    for (const seat of encoded.seats as Record<string, unknown>[]) {
      expect(Object.keys(seat)).not.toContain('figureId');
      expect(Object.keys(seat).sort()).toEqual(seat.bot ? ['bot', 'botPersona', 'civilization', 'guestId', 'name', 'playerId', 'ready'] : ['civilization', 'guestId', 'name', 'playerId', 'ready']);
    }
  });
  it('a V1.1 snapshot that no longer parses is shown as a legacy table without its game, never as a server error', () => {
    const broken = structuredClone(fixture.room) as Record<string, unknown>;
    (broken.game as Record<string, unknown>).players = [{ nonsense: true }];
    const row = { id: broken.id as string, joinCode: broken.joinCode as string, version: BigInt(broken.version as number), status: 'ACTIVE', snapshot: broken };
    const room = decode(row);
    expect(room).not.toBeNull();
    expect(room!.game).toBeNull();
    expect(isLegacyRoom(room!)).toBe(true);
    // A snapshot of the current generation that is corrupt still fails loudly.
    expect(() => decode({ ...row, snapshot: { ...broken, contentVersion: 'v1.2' } })).toThrow('Invalid alpha match snapshot');
  });
});
