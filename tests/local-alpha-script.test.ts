import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const script = join(process.cwd(), 'scripts/local-alpha.mjs');
const SECRET = 'this-is-a-very-secret-value-0123456789-abcdef-XYZ';
const PASSWORD = 'hunter2-not-for-logs';
const good = { DATABASE_URL: `postgresql://aoh:${PASSWORD}@127.0.0.1:5432/aoh_dev?schema=public`, ALPHA_SESSION_SECRET: SECRET, ALPHA_PUBLIC_ORIGIN: 'http://127.0.0.1:3001' };

function run(command: string, values: Record<string, string> | null, args: string[] = []) {
  const dir = mkdtempSync(join(tmpdir(), 'aoh-local-alpha-')), file = join(dir, '.env.local');
  if (values) writeFileSync(file, Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n'));
  // The environment is rebuilt so the caller's own variables cannot satisfy or pollute the check.
  const env: Record<string, string> = { PATH: process.env.PATH ?? '', SystemRoot: process.env.SystemRoot ?? '', ALPHA_ENV_FILE: file };
  const result = spawnSync(process.execPath, [script, command, ...args], { encoding: 'utf8', env });
  return { code: result.status, output: `${result.stdout}${result.stderr}` };
}

const players = join(process.cwd(), 'scripts/alpha-players.mjs');
function runPlayers(args: string[], extra: Record<string, string> = {}) {
  const env: Record<string, string> = { PATH: process.env.PATH ?? '', SystemRoot: process.env.SystemRoot ?? '', ...extra };
  const result = spawnSync(process.execPath, [players, ...args], { encoding: 'utf8', env, timeout: 30000 });
  return { code: result.status, output: `${result.stdout}${result.stderr}` };
}

describe('scripts/local-alpha.mjs', () => {
  it('accepts a complete local environment and prints names and host only', () => {
    const result = run('check', good);
    expect(result.code).toBe(0);
    expect(result.output).toContain('Ambiente local ok');
    expect(result.output).toContain('127.0.0.1:5432/aoh_dev');
    expect(result.output).not.toContain(SECRET); expect(result.output).not.toContain(PASSWORD);
  });

  it('tells how to create the file when it is missing', () => {
    const result = run('check', null);
    expect(result.code).toBe(1);
    expect(result.output).toContain('.env.local.example');
  });

  it('names every missing or wrong variable without ever printing a value', () => {
    const result = run('check', { DATABASE_URL: 'not-a-url', ALPHA_SESSION_SECRET: 'short-secret-value', ALPHA_PUBLIC_ORIGIN: 'https://prod.example' });
    expect(result.code).toBe(1);
    for (const name of ['DATABASE_URL', 'ALPHA_SESSION_SECRET', 'ALPHA_PUBLIC_ORIGIN']) expect(result.output).toContain(name);
    expect(result.output).not.toContain('short-secret-value'); expect(result.output).not.toContain('prod.example');
    const empty = run('check', { DATABASE_URL: good.DATABASE_URL });
    expect(empty.output).toContain('ALPHA_SESSION_SECRET está ausente'); expect(empty.output).toContain('ALPHA_PUBLIC_ORIGIN está ausente');
    expect(empty.output).not.toContain(PASSWORD);
  });

  it('refuses to migrate a database that is not local unless told to, and does not print its credentials', () => {
    const remote = { DATABASE_URL: `postgresql://postgres.abc:${PASSWORD}@aws-0.pooler.supabase.com:6543/postgres` };
    const result = run('migrate', remote);
    expect(result.code).toBe(2);
    expect(result.output).toContain('não é local'); expect(result.output).toContain('--allow-remote');
    expect(result.output).not.toContain(PASSWORD);
  });

  it('migrate needs only the database variable and dev needs the whole set', () => {
    expect(run('migrate', { ALPHA_PUBLIC_ORIGIN: 'x' }).output).toContain('DATABASE_URL está ausente');
    expect(run('dev', { DATABASE_URL: good.DATABASE_URL }).output).toContain('ALPHA_SESSION_SECRET');
  });

  it('is wired to the root scripts, keeps the example free of secrets, and does not touch production files', () => {
    const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts as Record<string, string>;
    expect(scripts['dev:alpha']).toBe('node scripts/local-alpha.mjs dev');
    expect(scripts['db:migrate:local']).toBe('node scripts/local-alpha.mjs migrate');
    expect(scripts['build']).toBe('npm run compile && npm run build -w @aoh/web');
    const example = readFileSync('apps/web/.env.local.example', 'utf8');
    expect(example).toMatch(/^ALPHA_SESSION_SECRET=$/m);
    expect(example).toMatch(/^ALPHA_PUBLIC_ORIGIN=http:\/\/127\.0\.0\.1:3001$/m);
    for (const name of ['DATABASE_URL', 'DIRECT_URL', 'ALPHA_SESSION_SECRET', 'ALPHA_PUBLIC_ORIGIN']) expect(example).toContain(name);
    expect(JSON.parse(readFileSync('railway.json', 'utf8')).deploy.startCommand).toBe('npm run start -w @aoh/web');
  });
});

describe('development never points at production', () => {
  it('refuses a Railway database for every command and never prints its credentials', () => {
    for (const host of ['containers-us-west-1.railway.app', 'roundhouse.proxy.rlwy.net', 'postgres.railway.internal']) {
      const values = { ...good, DATABASE_URL: `postgresql://postgres:${PASSWORD}@${host}:5432/railway` };
      for (const command of ['check', 'dev', 'migrate']) {
        const result = run(command, values, command === 'migrate' ? ['--allow-remote'] : []);
        expect(result.code, `${command} ${host}`).toBe(1);
        expect(result.output).toContain('Railway'); expect(result.output).not.toContain(PASSWORD);
      }
    }
  });

  it('refuses a production origin, so a copied production env cannot start the dev server', () => {
    const result = run('check', { ...good, ALPHA_PUBLIC_ORIGIN: 'https://alpha.up.railway.app' });
    expect(result.code).toBe(1); expect(result.output).toContain('ALPHA_PUBLIC_ORIGIN');
  });

  it('dev runs the TypeScript watcher by default and shuts every child down', () => {
    const source = readFileSync('scripts/local-alpha.mjs', 'utf8');
    expect(source).toContain("'-b', '-w'"); expect(source).toContain('--no-watch-packages'); expect(source).toContain('taskkill');
    expect(source).toContain("'--hostname', HOST, '--port'");
  });
});

describe('scripts/alpha-players.mjs (dev-only harness)', () => {
  it('accepts only 2 to 6 players and validates options before opening anything', () => {
    for (const bad of ['--players=1', '--players=7', '--players=abc', '--players']) {
      const result = runPlayers([bad]);
      expect(result.code, bad).toBe(2); expect(result.output).toContain('--players');
    }
    expect(runPlayers(['--nope']).code).toBe(2);
    expect(runPlayers(['--players=2', '--layout=grid']).code).toBe(2);
    expect(runPlayers(['--players=2', '--screen=big']).code).toBe(2);
  });

  it('says how to start the server when none answers, instead of failing obscurely', () => {
    const result = runPlayers(['--players=2'], { ALPHA_LOCAL_PORT: '1' });
    expect(result.code).toBe(1);
    expect(result.output).toContain('npm run dev:alpha');
  });

  it('is wired to npm and only drives the public forms: no identity forging, no cookies, no private endpoints', () => {
    const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts as Record<string, string>;
    expect(scripts['alpha:players']).toBe('node scripts/alpha-players.mjs');
    const source = readFileSync('scripts/alpha-players.mjs', 'utf8');
    for (const forbidden of ['guestId', 'Set-Cookie', 'document.cookie', 'addCookies', 'ALPHA_SESSION_SECRET', 'X-Guest']) expect(source, forbidden).not.toContain(forbidden);
    expect(source).toContain('127.0.0.1');
    for (const file of ['apps/web/app/api/alpha/route.ts', 'apps/web/app/api/alpha/health/route.ts']) expect(readFileSync(file, 'utf8')).not.toMatch(/alpha-players|impersonat|DEV_ONLY/i);
  });
});
