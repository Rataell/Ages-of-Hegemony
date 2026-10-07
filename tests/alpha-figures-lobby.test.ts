import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AlphaGameService, type AlphaRoomView } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository, LEGACY_ROOM_MESSAGE } from '../apps/server/src/alpha-room.js';
import type { GuestPrincipal } from '../apps/server/src/guest-session.js';

const who = (): GuestPrincipal => ({ guestId: randomUUID() });
async function table(seatLimit = 2, extra: Record<string, unknown> = {}) {
  const repository = new InMemoryAlphaRepository(), service = new AlphaGameService(repository), a = who(), b = who();
  const created = await service.create(a, { name: 'Mesa', displayName: 'Ana', preset: 'QUICK', seatLimit, seed: 123, planningSeconds: 0, ...extra });
  if (!created.ok) throw new Error(created.error.message);
  const joined = await service.join(b, created.value.joinCode, 'Beto'); if (!joined.ok) throw new Error(joined.error.message);
  return { repository, service, a, b, view: joined.value as AlphaRoomView };
}
const lobby = async (f: Awaited<ReturnType<typeof table>>, actor: GuestPrincipal, view: AlphaRoomView, action: Record<string, unknown>) =>
  f.service.lobby(actor, view.id, { expectedVersion: view.version, ...action }, 0);

describe('Figura selection in the lobby (Core 10)', () => {
  it('offers only the ten civilizations; picking one preselects its recommended Figura (★)', async () => {
    const f = await table();
    expect((await lobby(f, f.a, f.view, { type: 'CHOOSE_CIVILIZATION', civilization: 'veyra' })).ok).toBe(false);
    expect((await lobby(f, f.a, f.view, { type: 'CHOOSE_CIVILIZATION', civilization: 'elyra' })).ok).toBe(false);
    const chosen = await lobby(f, f.a, f.view, { type: 'CHOOSE_CIVILIZATION', civilization: 'valgard' });
    expect(chosen.ok).toBe(true); if (!chosen.ok) return;
    const mine = chosen.value.seats.find(s => s.playerId === chosen.value.selfPlayerId)!;
    expect(mine.figureId).toBe('leader-alexandre-magno');
  });
  it('refuses a Figura of another civilization and a Figura before the civilization; unready is required to change', async () => {
    const f = await table();
    expect((await lobby(f, f.a, f.view, { type: 'CHOOSE_FIGURE', figureId: 'leader-odisseu' })).ok).toBe(false);
    const civ = await lobby(f, f.a, f.view, { type: 'CHOOSE_CIVILIZATION', civilization: 'valgard' }); if (!civ.ok) throw new Error(civ.error.message);
    expect((await lobby(f, f.a, civ.value, { type: 'CHOOSE_FIGURE', figureId: 'leader-sun-tzu' })).ok).toBe(false);
    const pick = await lobby(f, f.a, civ.value, { type: 'CHOOSE_FIGURE', figureId: 'leader-odisseu' }); if (!pick.ok) throw new Error(pick.error.message);
    const ready = await lobby(f, f.a, pick.value, { type: 'LOBBY_READY', ready: true }); if (!ready.ok) throw new Error(ready.error.message);
    const late = await lobby(f, f.a, ready.value, { type: 'CHOOSE_FIGURE', figureId: 'leader-agamenon' });
    expect(late.ok).toBe(false);
  });
  it('keeps every Figura private until all seats are ready, then reveals them together; F5 does not lose the choice', async () => {
    const f = await table();
    let view = f.view;
    const a1 = await lobby(f, f.a, view, { type: 'CHOOSE_CIVILIZATION', civilization: 'valgard' }); if (!a1.ok) throw new Error('a1'); view = a1.value;
    const a2 = await lobby(f, f.a, view, { type: 'CHOOSE_FIGURE', figureId: 'leader-odisseu' }); if (!a2.ok) throw new Error('a2'); view = a2.value;
    const b1 = await lobby(f, f.b, view, { type: 'CHOOSE_CIVILIZATION', civilization: 'kor' }); if (!b1.ok) throw new Error('b1'); view = b1.value;
    const a3 = await lobby(f, f.a, view, { type: 'LOBBY_READY', ready: true }); if (!a3.ok) throw new Error('a3'); view = a3.value;
    // B has not confirmed: A sees only its own Figura, B sees A's as hidden.
    const bSees = await f.service.read(f.b, view.id, 0); if (!bSees.ok) throw new Error('read');
    expect(bSees.value.seats.find(s => s.civilization === 'valgard')!.figureId).toBeNull();
    expect(bSees.value.seats.find(s => s.civilization === 'valgard')!.figureChosen).toBe(true);
    expect(bSees.value.seats.find(s => s.civilization === 'kor')!.figureId).toBe('leader-julio-cesar');
    const b2 = await lobby(f, f.b, bSees.value, { type: 'LOBBY_READY', ready: true }); if (!b2.ok) throw new Error('b2');
    const both = await new AlphaGameService(f.repository).read(f.a, view.id, 0); if (!both.ok) throw new Error('read2');
    expect(both.value.seats.map(s => s.figureId).sort()).toEqual(['leader-julio-cesar', 'leader-odisseu']);
    // The match starts with exactly the chosen Figuras.
    const started = await f.service.lobby(f.a, view.id, { type: 'START', expectedVersion: both.value.version }, 1000); if (!started.ok) throw new Error(started.error.message);
    const game = started.value.game!;
    expect(game.self.leader?.leaderId).toBe('leader-odisseu');
  });
  it('bots take a Figura of their own civilization, deterministically from the seed', async () => {
    const run = async () => { const f = await table(4); const added = await lobby(f, f.a, f.view, { type: 'ADD_BOT' }); if (!added.ok) throw new Error(added.error.message); const room = (await f.repository.find(f.view.id))!; return room.seats.find(s => s.bot)!; };
    const one = await run(), two = await run();
    expect(one.figureId).toBe(two.figureId);
    expect(one.civilization).toBe(two.civilization);
    expect(one.figureId).toMatch(/^leader-/);
  });
});

describe('map size and world preset in the lobby', () => {
  it('recommends a footprint by table size and enforces the manual availability', async () => {
    const small = await table(2); expect(small.view.mapSize).toBe('COMPACT');
    const wide = await table(2, { seatLimit: 6, seed: 5 }); expect(wide.view.mapSize).toBe('WIDE');
    expect((await (async () => { const f = await table(2, { mapSize: 'COMPACT', seatLimit: 5 }).catch(e => e); return f; })()) instanceof Error).toBe(true);
    const f = await table(4);
    const ok = await lobby(f, f.a, f.view, { type: 'SET_WORLD', mapSize: 'COMPACT', worldPreset: 'ARCHIPELAGO' }); expect(ok.ok).toBe(true);
    if (ok.ok) { expect(ok.value.mapSize).toBe('COMPACT'); expect(ok.value.worldPreset).toBe('ARCHIPELAGO'); }
    const seats = await lobby(f, f.a, ok.ok ? ok.value : f.view, { type: 'SET_SEATS', seatLimit: 6 });
    expect(seats.ok && seats.value.mapSize).toBe('WIDE');
    const guest = await lobby(f, f.b, seats.ok ? seats.value : f.view, { type: 'SET_WORLD', mapSize: 'STANDARD' });
    expect(guest.ok).toBe(false);
  });
});

describe('V1.1 rooms are read-only', () => {
  it('shows a saved V1.1 room with a controlled message and refuses every change', async () => {
    const f = await table();
    const room = await f.repository.find(f.view.id); if (!room) throw new Error('missing');
    room.contentVersion = 'v1.1';
    (f.repository as unknown as { rooms: Map<string, unknown> }).rooms?.set?.(room.id, room);
    const view = await f.service.read(f.a, f.view.id, 0);
    expect(view.ok).toBe(true); if (!view.ok) return;
    expect(view.value.legacy).toBe(true);
    expect(view.value.legacyMessage).toBe(LEGACY_ROOM_MESSAGE);
    const blocked = await f.service.lobby(f.a, f.view.id, { type: 'CHOOSE_CIVILIZATION', expectedVersion: view.value.version, civilization: 'valgard' }, 0);
    expect(blocked.ok).toBe(false); if (!blocked.ok) expect(blocked.error.code).toBe('LEGACY_ROOM');
    const join = await f.service.join(who(), f.view.joinCode, 'Carla'); expect(join.ok).toBe(false);
    if (!join.ok) expect(join.error.code).toBe('LEGACY_ROOM');
    expect((await f.service.command(f.a, f.view.id, { type: 'x' }, 0)).ok).toBe(false);
  });
});
