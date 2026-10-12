import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AlphaGameService, type AlphaRoomView } from '../apps/server/src/alpha-service.js';
import { ActionPreviewRequestSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { GuestSessions, type GuestPrincipal } from '../apps/server/src/guest-session.js';

/** Slice 4 · the read-only `preview` operation: previewAction for the asking seat only, no write, no version bump, validated by the command schema. */
const principal = (): GuestPrincipal => ({ guestId: randomUUID() });
async function started() {
  const repository = new InMemoryAlphaRepository(), service = new AlphaGameService(repository), a = principal(), b = principal();
  const created = await service.create(a, { name: 'Mesa', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 123, planningSeconds: 0 });
  if (!created.ok) throw new Error(created.error.message);
  const joined = await service.join(b, created.value.joinCode, 'Beto'); if (!joined.ok) throw new Error(joined.error.message);
  let view: AlphaRoomView = joined.value;
  for (const [actor, civilization] of [[a, 'aurelia'], [b, 'valgard']] as const) {
    const chosen = await service.lobby(actor, view.id, { type: 'CHOOSE_CIVILIZATION', expectedVersion: view.version, civilization }, 0); if (!chosen.ok) throw new Error(chosen.error.message); view = chosen.value;
    const ready = await service.lobby(actor, view.id, { type: 'LOBBY_READY', expectedVersion: view.version, ready: true }, 0); if (!ready.ok) throw new Error(ready.error.message); view = ready.value;
  }
  const go = await service.lobby(a, view.id, { type: 'START', expectedVersion: view.version }, 1000); if (!go.ok) throw new Error(go.error.message);
  return { repository, service, a, b, view: go.value };
}

describe('actionPreview on the server', () => {
  it('answers PRODUCE for the own city, writes nothing, bumps no version', async () => {
    const f = await started(), game = f.view.game!;
    const mine = { cityId: Object.keys(game.urban.cities)[0]! };
    const room = await f.repository.find(f.view.id), versionBefore = room!.version, snapshot = JSON.stringify(room!.game);
    const command = { type: 'URBAN_ACTION', expectedVersion: game.version, cityId: mine.cityId, action: 'PRODUCE' };
    const asked = await f.service.actionPreview(f.a, f.view.id, { command });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.value).toMatchObject({ command: 'URBAN_ACTION', coverage: 'FULL', eligible: true, resolvesAt: 'RESOLUTION' });
    expect(asked.value.cost.order).toMatchObject({ type: 'CITY', usedBefore: 0, usedAfter: 1 });
    expect(asked.value.cost.activation).toMatchObject({ usedBefore: 0, usedAfter: 1 });
    const after = await f.repository.find(f.view.id);
    expect(after!.version).toBe(versionBefore);
    expect(JSON.stringify(after!.game)).toBe(snapshot);
  });
  it('ignores a stale expectedVersion (a preview describes the match as it is now)', async () => {
    const f = await started(), mine = { cityId: Object.keys(f.view.game!.urban.cities)[0]! };
    const asked = await f.service.actionPreview(f.a, f.view.id, { command: { type: 'URBAN_ACTION', expectedVersion: 0, cityId: mine.cityId, action: 'PRODUCE' } });
    expect(asked.ok && asked.value.eligible).toBe(true);
  });
  it('only the asking seat: a rival city is "not yours", a stranger and a malformed body are refused', async () => {
    const f = await started(), game = f.view.game!;
    const theirs = (await f.repository.find(f.view.id))!.game!.cities.find(city => city.currentOwnerId !== f.view.selfPlayerId);
    if (theirs) {
      const rival = await f.service.actionPreview(f.a, f.view.id, { command: { type: 'URBAN_ACTION', expectedVersion: game.version, cityId: theirs.cityId, action: 'PRODUCE' } });
      expect(rival.ok && rival.value.eligible).toBe(false);
      if (rival.ok) expect(rival.value.blockers[0]!.code).toBe('NOT_OWN_CITY');
    }
    const mine = { cityId: Object.keys(game.urban.cities)[0]! };
    const command = { type: 'URBAN_ACTION', expectedVersion: game.version, cityId: mine.cityId, action: 'PRODUCE' };
    expect((await f.service.actionPreview(principal(), f.view.id, { command })).ok).toBe(false);
    expect((await f.service.actionPreview(f.a, f.view.id, { command: { type: 'NOPE' } })).ok).toBe(false);
    expect((await f.service.actionPreview(f.a, f.view.id, { command, extra: 1 })).ok).toBe(false);
    expect((await f.service.actionPreview(f.a, randomUUID(), { command })).ok).toBe(false);
    expect(ActionPreviewRequestSchema.safeParse({ command }).success).toBe(true);
  });
  it('a command with no preview is answered as UNSUPPORTED, never as eligible', async () => {
    const f = await started();
    const asked = await f.service.actionPreview(f.a, f.view.id, { command: { type: 'SET_DEFENSE_POSTURE', expectedVersion: 0, posture: 'HOLD' } });
    expect(asked.ok && asked.value.coverage).toBe('UNSUPPORTED');
    expect(asked.ok && asked.value.eligible).toBe(false);
  });
});

describe('the preview operation at the HTTP boundary', () => {
  const origin = 'https://alpha.example.test';
  const post = (body: unknown, cookie = '') => new Request(`${origin}/api/alpha`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie }, body: JSON.stringify(body) });
  const ok = async (response: Response): Promise<AlphaRoomView> => { expect(response.status).toBe(200); return ((await response.json()) as { value: AlphaRoomView }).value; };
  it('is in the envelope, needs a session, answers 200 for the own city and never changes the match', async () => {
    const repository = new InMemoryAlphaRepository(), http = new AlphaHttp(new AlphaGameService(repository), new GuestSessions('test-secret-'.repeat(8)), origin, true);
    const first = await http.handle(post({ operation: 'create', payload: { name: 'Mesa', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 4, planningSeconds: 0 } }), 1000), cookieA = first.headers.get('set-cookie')!.split(';')[0]!;
    let current = await ok(first);
    const joined = await http.handle(post({ operation: 'join', code: current.joinCode, displayName: 'Beto' }), 2000), cookieB = joined.headers.get('set-cookie')!.split(';')[0]!;
    current = await ok(joined);
    for (const [cookie, civilization] of [[cookieA, 'aurelia'], [cookieB, 'valgard']]) {
      current = await ok(await http.handle(post({ operation: 'lobby', gameId: current.id, payload: { type: 'CHOOSE_CIVILIZATION', expectedVersion: current.version, civilization } }, cookie), 3000));
      current = await ok(await http.handle(post({ operation: 'lobby', gameId: current.id, payload: { type: 'LOBBY_READY', expectedVersion: current.version, ready: true } }, cookie), 4000));
    }
    current = await ok(await http.handle(post({ operation: 'lobby', gameId: current.id, payload: { type: 'START', expectedVersion: current.version } }, cookieA), 5000));
    const mine = { cityId: Object.keys(current.game!.urban.cities)[0]! };
    const body = { operation: 'preview', gameId: current.id, payload: { command: { type: 'URBAN_ACTION', expectedVersion: current.game!.version, cityId: mine.cityId, action: 'PRODUCE' } } };
    const before = JSON.stringify((await repository.find(current.id))!.game), versionBefore = (await repository.find(current.id))!.version;
    expect((await http.handle(post(body), 6000)).status).toBe(401);
    const answered = await http.handle(post(body, cookieA), 6000);
    expect(answered.status).toBe(200);
    expect(((await answered.json()) as { value: { eligible: boolean } }).value.eligible).toBe(true);
    expect((await http.handle(post({ ...body, payload: { command: { type: 'NOPE' } } }, cookieA), 6000)).status).toBe(400);
    expect((await http.handle(post(body, cookieB), 6000)).status).toBe(200); // the rival asking about A's city only learns it is not theirs
    expect((await repository.find(current.id))!.version).toBe(versionBefore);
    expect(JSON.stringify((await repository.find(current.id))!.game)).toBe(before);
  });
});
