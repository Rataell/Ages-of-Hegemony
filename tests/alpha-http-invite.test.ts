import { afterEach, describe, expect, it } from 'vitest';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService, type AlphaRoomView } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';

const origin = 'https://alpha.example.test';
const http = () => new AlphaHttp(new AlphaGameService(new InMemoryAlphaRepository()), new GuestSessions('test-secret-'.repeat(8)), origin, true);
const post = (body: unknown, ip = '10.0.0.1', cookie = '') => new Request(`${origin}/api/alpha`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie, 'x-forwarded-for': ip }, body: JSON.stringify(body) });
const create = (accessCode?: string) => ({ operation: 'create', ...(accessCode ? { accessCode } : {}), payload: { name: 'Mesa', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 4, planningSeconds: 0 } });
const value = async (response: Response) => (await response.json() as { value: AlphaRoomView }).value;

afterEach(() => { delete process.env.ALPHA_ACCESS_CODE; });

describe('invite-only joining (no Alpha access code for the invited)', () => {
  it('asks the access code to create a room, never to join one with the invite code', async () => {
    process.env.ALPHA_ACCESS_CODE = 'SEGREDO';
    const server = http();
    expect((await server.handle(post(create()), '10.0.0.1')).status).toBe(403);
    const made = await server.handle(post(create('segredo ')));
    expect(made.status).toBe(200);
    const room = await value(made);
    const joined = await server.handle(post({ operation: 'join', code: room.joinCode, displayName: 'Beto' }, '10.0.0.2'));
    expect(joined.status).toBe(200);
    expect((await value(joined)).seats).toHaveLength(2);
    // Rejoining with the same session is idempotent: the invite lands in the same seat.
    const cookie = joined.headers.get('set-cookie')!.split(';')[0]!;
    const again = await server.handle(post({ operation: 'join', code: room.joinCode, displayName: 'Beto' }, '10.0.0.2', cookie));
    expect(again.status).toBe(200);
    expect((await value(again)).seats).toHaveLength(2);
  });
  it('a wrong invite is a controlled 404, not an access-code prompt', async () => {
    process.env.ALPHA_ACCESS_CODE = 'SEGREDO';
    const response = await http().handle(post({ operation: 'join', code: 'A'.repeat(22), displayName: 'Beto' }));
    expect(response.status).toBe(404);
  });
  it('rate limits are per client: one noisy client does not block another', async () => {
    const server = http();
    let last = 200;
    for (let i = 0; i < 25; i++) last = (await server.handle(post({ operation: 'join', code: 'B'.repeat(22), displayName: 'x' }, '10.0.0.9'), 1000)).status;
    expect(last).toBe(429);
    expect((await server.handle(post({ operation: 'join', code: 'B'.repeat(22), displayName: 'y' }, '10.0.0.8'), 1000)).status).toBe(404);
    expect((await server.handle(post(create(), '10.0.0.7'), 1000)).status).toBe(200);
  });
});
