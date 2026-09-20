import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { alphaStorageMode } from '../apps/server/src/alpha-storage.js';

const ORIGIN = 'http://127.0.0.1:3001';
const state = globalThis as Record<string, unknown>;
const clear = () => { delete state.aohAlphaRuntime; delete state.aohAlphaMemory; };

describe('alpha storage mode', () => {
  it('production is always PostgreSQL and refuses memory instead of falling back to it', () => {
    expect(alphaStorageMode({ NODE_ENV: 'production' })).toBe('postgres');
    expect(alphaStorageMode({ NODE_ENV: 'production', ALPHA_STORAGE: 'postgres' })).toBe('postgres');
    expect(() => alphaStorageMode({ NODE_ENV: 'production', ALPHA_STORAGE: 'memory' })).toThrow('not allowed in production');
  });

  it('outside production it is memory unless PostgreSQL is asked for explicitly', () => {
    for (const NODE_ENV of ['development', 'test', undefined]) {
      expect(alphaStorageMode({ NODE_ENV })).toBe('memory');
      expect(alphaStorageMode({ NODE_ENV, DATABASE_URL: 'postgresql://a:b@c/d' })).toBe('memory');
      expect(alphaStorageMode({ NODE_ENV, ALPHA_STORAGE: 'postgres' })).toBe('postgres');
    }
  });
});

describe('zero-config development runtime (in memory)', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    for (const name of ['DATABASE_URL', 'DIRECT_URL', 'ALPHA_SESSION_SECRET', 'ALPHA_PUBLIC_ORIGIN', 'ALPHA_STORAGE']) vi.stubEnv(name, '');
    clear(); vi.resetModules();
  });
  afterEach(() => { vi.unstubAllEnvs(); clear(); });

  const post = (body: unknown, cookie = '') => new Request(`${ORIGIN}/api/alpha`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: ORIGIN, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  const get = (path: string, cookie = '') => new Request(`${ORIGIN}/api/alpha${path}`, { headers: { ...(cookie ? { Cookie: cookie } : {}) } });
  const cookieOf = (response: Response) => response.headers.get('set-cookie')!.split(';')[0]!;
  const create = { operation: 'create', payload: { name: 'Mesa', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 7, planningSeconds: 0 } };

  it('serves real, separate guest sessions with no database, secret or origin configured', async () => {
    const { handleAlphaRequest } = await import('../apps/server/src/alpha-runtime.js');
    const a = await handleAlphaRequest(post(create)), created = await a.json() as { ok: true; value: { id: string; joinCode: string } };
    expect(a.status).toBe(200); expect(created.ok).toBe(true);
    const cookieA = cookieOf(a);
    expect(cookieA).toMatch(/^aoh_alpha_session=/);
    const b = await handleAlphaRequest(post({ operation: 'join', code: created.value.joinCode, displayName: 'Beto' }));
    const cookieB = cookieOf(b);
    expect(b.status).toBe(200); expect(cookieB).not.toBe(cookieA);
    const seats = (await (await handleAlphaRequest(get(`?gameId=${created.value.id}`, cookieA))).json() as { value: { selfPlayerId: string; seats: unknown[] } }).value;
    const other = (await (await handleAlphaRequest(get(`?gameId=${created.value.id}`, cookieB))).json() as { value: { selfPlayerId: string } }).value;
    expect(seats.seats).toHaveLength(2); expect(seats.selfPlayerId).not.toBe(other.selfPlayerId);
    const forged = await handleAlphaRequest(get(`?gameId=${created.value.id}`, 'aoh_alpha_session=forged'));
    expect(forged.status).not.toBe(200);
  });

  it('still rejects a request from another origin', async () => {
    const { handleAlphaRequest } = await import('../apps/server/src/alpha-runtime.js');
    const foreign = new Request(`${ORIGIN}/api/alpha`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://evil.example' }, body: JSON.stringify(create) });
    expect((await handleAlphaRequest(foreign)).status).toBe(403);
  });

  it('keeps matches and sessions across a module reload (hot reload) and picks up new code', async () => {
    const first = await import('../apps/server/src/alpha-runtime.js');
    const a = await first.handleAlphaRequest(post(create)), created = await a.json() as { value: { id: string } }, cookie = cookieOf(a);
    vi.resetModules();
    const reloaded = await import('../apps/server/src/alpha-runtime.js');
    expect(reloaded).not.toBe(first);
    const again = await reloaded.handleAlphaRequest(get(`?gameId=${created.value.id}`, cookie));
    expect(again.status).toBe(200);
    expect((await again.json() as { value: { id: string } }).value.id).toBe(created.value.id);
  });

  it('a restart (fresh process state) starts empty and invalidates old sessions', async () => {
    const first = await import('../apps/server/src/alpha-runtime.js');
    const a = await first.handleAlphaRequest(post(create)), created = await a.json() as { value: { id: string } }, cookie = cookieOf(a);
    clear(); vi.resetModules();
    const restarted = await import('../apps/server/src/alpha-runtime.js');
    expect((await restarted.handleAlphaRequest(get(`?gameId=${created.value.id}`, cookie))).status).not.toBe(200);
  });

  it('production refuses memory storage for the API too', async () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('ALPHA_STORAGE', 'memory');
    const { handleAlphaRequest } = await import('../apps/server/src/alpha-runtime.js');
    const response = await handleAlphaRequest(post(create));
    expect(response.status).toBe(503);
    expect(state.aohAlphaMemory).toBeUndefined();
  });
});
