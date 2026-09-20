import { afterEach, describe, expect, it, vi } from 'vitest';
import { alphaHealth } from '../apps/server/src/alpha-runtime.js';

describe('alpha healthcheck', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('answers 503, no-store and the release label when the environment is not configured, without leaking why', async () => {
    vi.stubEnv('DATABASE_URL', ''); vi.stubEnv('ALPHA_SESSION_SECRET', ''); vi.stubEnv('ALPHA_PUBLIC_ORIGIN', '');
    const response = await alphaHealth();
    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const body = await response.json() as Record<string, unknown>;
    expect(body).toEqual({ ok: false, service: 'ages-of-hegemony-alpha', release: 'alpha-v0.1', database: false, migration: false });
  });
});
