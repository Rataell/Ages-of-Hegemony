import { describe, expect, it } from 'vitest';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { PublishingAlphaRepository } from '../apps/server/src/alpha-bus.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';

const origin = 'https://alpha.example.test';
const rig = () => new AlphaHttp(new AlphaGameService(new PublishingAlphaRepository(new InMemoryAlphaRepository())), new GuestSessions('push-secret-'.repeat(4)), origin, true);
async function post(http: AlphaHttp, cookie: string, body: unknown) {
  const response = await http.handle(new Request(`${origin}/api/alpha`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie }, body: JSON.stringify(body) }));
  const set = response.headers.get('set-cookie');
  return { json: await response.json() as { ok: boolean; value?: Record<string, unknown> }, cookie: set ? set.split(';')[0]! : cookie };
}
/** Reads SSE frames until `count` data frames have arrived (or the time runs out). */
async function frames(response: Response, count: number, ms = 1500): Promise<{ version: number; at: number; received: number }[]> {
  const reader = response.body!.getReader(), decoder = new TextDecoder(), out: { version: number; at: number; received: number }[] = [];
  const stop = Date.now() + ms;
  let buffer = '';
  while (out.length < count && Date.now() < stop) {
    const next = await Promise.race([reader.read(), new Promise<{ done: true; value: undefined }>(resolve => setTimeout(() => resolve({ done: true, value: undefined }), Math.max(1, stop - Date.now())))]);
    if (next.done) break;
    buffer += decoder.decode(next.value, { stream: true });
    for (const part of buffer.split('\n\n').slice(0, -1)) { const line = part.split('\n').find(entry => entry.startsWith('data: ')); if (line) out.push({ ...(JSON.parse(line.slice(6)) as { version: number; at: number }), received: Date.now() }); }
    buffer = buffer.slice(buffer.lastIndexOf('\n\n') + 2);
  }
  await reader.cancel();
  return out;
}

describe('shared table push (SSE)', () => {
  it('announces a saved room version to every connected seat within the same tick, and carries no game data', async () => {
    const http = rig();
    const created = await post(http, '', { operation: 'create', payload: { name: 'Mesa', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 5, planningSeconds: 0 } });
    expect(created.json.ok).toBe(true);
    const room = created.json.value as { id: string; joinCode: string; version: number };
    const joined = await post(http, '', { operation: 'join', code: room.joinCode, displayName: 'Beto' });
    expect(joined.json.ok).toBe(true);
    const open = (cookie: string) => http.handle(new Request(`${origin}/api/alpha?gameId=${room.id}&stream=1`, { headers: { Cookie: cookie } }));
    const [a, b] = await Promise.all([open(created.cookie), open(joined.cookie)]);
    expect(a.headers.get('content-type')).toContain('text/event-stream');
    const watching = Promise.all([frames(a, 2), frames(b, 2)]);
    await new Promise(resolve => setTimeout(resolve, 50));
    const sent = Date.now();
    const chosen = await post(http, created.cookie, { operation: 'lobby', gameId: room.id, payload: { type: 'CHOOSE_CIVILIZATION', civilization: 'aurelia', expectedVersion: room.version + 1 } });
    expect(chosen.json.ok, JSON.stringify(chosen.json)).toBe(true);
    const [seenA, seenB] = await watching;
    for (const seen of [seenA, seenB]) {
      expect(seen.length).toBe(2);
      expect(Object.keys(seen[1]!).sort()).toEqual(['at', 'gameId', 'received', 'version']);
      expect(seen[1]!.version).toBeGreaterThan(room.version);
      expect(seen[1]!.received - sent).toBeLessThan(500);
    }
  });

  it('refuses a stream to someone who is not seated, and to a stranger without a session', async () => {
    const http = rig();
    const created = await post(http, '', { operation: 'create', payload: { name: 'Mesa', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 5, planningSeconds: 0 } });
    const room = created.json.value as { id: string };
    const stranger = await post(http, '', { operation: 'create', payload: { name: 'Outra', displayName: 'Zé', preset: 'QUICK', seatLimit: 2, seed: 6, planningSeconds: 0 } });
    const denied = await http.handle(new Request(`${origin}/api/alpha?gameId=${room.id}&stream=1`, { headers: { Cookie: stranger.cookie } }));
    expect(denied.status).toBe(403);
    const anonymous = await http.handle(new Request(`${origin}/api/alpha?gameId=${room.id}&stream=1`));
    expect(anonymous.status).toBe(401);
  });
});
