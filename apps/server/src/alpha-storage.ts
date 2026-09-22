export type AlphaStorageMode = 'postgres' | 'memory';

/**
 * Where the alpha keeps its matches. Production is always PostgreSQL and can never be told otherwise: asking for memory there is an
 * error, not a fallback. Outside production the default is memory (zero configuration) and PostgreSQL is opt-in with
 * ALPHA_STORAGE=postgres.
 */
export function alphaStorageMode(env: Readonly<Record<string, string | undefined>>): AlphaStorageMode {
  if (env.NODE_ENV === 'production') {
    if (env.ALPHA_STORAGE === 'memory') throw new Error('In-memory storage is not allowed in production.');
    return 'postgres';
  }
  return env.ALPHA_STORAGE === 'postgres' ? 'postgres' : 'memory';
}
