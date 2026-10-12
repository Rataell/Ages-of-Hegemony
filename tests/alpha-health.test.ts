import { afterEach, describe, expect, it, vi } from 'vitest';
import { alphaHealth } from '../apps/server/src/alpha-runtime.js';

const clear = () => { const state = globalThis as Record<string, unknown>; delete state.aohAlphaRuntime; delete state.aohAlphaMemory; };

describe('alpha healthcheck', () => {
  afterEach(() => { vi.unstubAllEnvs(); clear(); });

  it('production: answers 503, no-store and the release label when the environment is not configured, without leaking why', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DATABASE_URL', ''); vi.stubEnv('ALPHA_SESSION_SECRET', ''); vi.stubEnv('ALPHA_PUBLIC_ORIGIN', '');
    const response = await alphaHealth();
    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const body = await response.json() as Record<string, unknown>;
    expect(body).toEqual({ ok: false, service: 'ages-of-hegemony-alpha', release: 'alpha-external-1.2-rc5', database: false, migration: false });
  });

  it('production never reports memory storage, even if asked to', async () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('ALPHA_STORAGE', 'memory');
    vi.stubEnv('DATABASE_URL', ''); vi.stubEnv('ALPHA_SESSION_SECRET', ''); vi.stubEnv('ALPHA_PUBLIC_ORIGIN', '');
    const response = await alphaHealth();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, service: 'ages-of-hegemony-alpha', release: 'alpha-external-1.2-rc5', database: false, migration: false });
  });

  it('development without configuration: explicit memory storage, no database claims', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    for (const name of ['DATABASE_URL', 'DIRECT_URL', 'ALPHA_SESSION_SECRET', 'ALPHA_PUBLIC_ORIGIN', 'ALPHA_STORAGE']) vi.stubEnv(name, '');
    const response = await alphaHealth();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ ok: true, service: 'ages-of-hegemony-alpha', release: 'alpha-external-1.2-rc5', storage: 'memory' });
  });
});
