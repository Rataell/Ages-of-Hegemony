import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const script = join(process.cwd(), 'scripts/local-alpha.mjs');
const SECRET = 'this-is-a-very-secret-value-0123456789-abcdef-XYZ';
const PASSWORD = 'hunter2-not-for-logs';
const good = { DATABASE_URL: `postgresql://aoh:${PASSWORD}@127.0.0.1:5432/aoh_dev?schema=public`, ALPHA_SESSION_SECRET: SECRET, ALPHA_PUBLIC_ORIGIN: 'http://127.0.0.1:3001' };

function run(command: string, values: Record<string, string> | string | null, args: string[] = [], shellEnv: Record<string, string> = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'aoh-local-alpha-')), file = join(dir, '.env.local');
  if (typeof values === 'string') writeFileSync(file, values);
  else if (values) writeFileSync(file, Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n'));
  // The environment is rebuilt so the caller's own variables cannot satisfy or pollute the check.
  const env: Record<string, string> = { PATH: process.env.PATH ?? '', SystemRoot: process.env.SystemRoot ?? '', ALPHA_ENV_FILE: file, ...shellEnv };
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

describe('remote database guard', () => {
  const HOSTS = ['containers-us-west-1.railway.app', 'roundhouse.proxy.rlwy.net', 'aws-0.pooler.supabase.com', 'db.example.com'];
  const remote = (host: string, extra: Record<string, string> = {}) => ({ ...good, DATABASE_URL: `postgresql://postgres:${PASSWORD}@${host}:5432/railway?sslmode=require`, ...extra });
  const marked = { AOH_LOCAL_DB_ENV: 'development' };
  const clean = (output: string, host: string) => { for (const secret of [PASSWORD, SECRET, host, 'postgresql://', 'sslmode']) expect(output, secret).not.toContain(secret); };

  it('allows a local database without any marker or flag', () => {
    for (const command of ['check', 'migrate', 'dev']) expect(run(command, good, ['--dry-run']).code, command).toBe(0);
    expect(run('dev', { ...good, DATABASE_URL: good.DATABASE_URL.replace('127.0.0.1', 'localhost') }, ['--dry-run']).code).toBe(0);
  });

  it('refuses any remote database by default, for every command, without printing URL, host or credentials', () => {
    for (const host of HOSTS) for (const command of ['check', 'migrate', 'dev']) {
      const result = run(command, remote(host), command === 'check' ? [] : ['--allow-remote', '--dry-run']);
      expect(result.code, `${command} ${host}`).toBe(2);
      expect(result.output).toContain('AOH_LOCAL_DB_ENV=development'); clean(result.output, host);
    }
  });

  it('does not infer production from the hostname: a Railway host marked as development is accepted', () => {
    for (const host of HOSTS) {
      const values = remote(host, marked);
      const check = run('check', values);
      expect(check.code, `check ${host}`).toBe(0); expect(check.output).toContain('Ambiente local ok'); expect(check.output).toContain('banco remoto de desenvolvimento'); clean(check.output, host);
      for (const command of ['migrate', 'dev']) {
        const result = run(command, values, ['--allow-remote', '--dry-run']);
        expect(result.code, `${command} ${host}`).toBe(0); expect(result.output).toContain('--dry-run'); clean(result.output, host);
      }
    }
  });

  it('needs --allow-remote for migrate and dev even when the database is marked as development', () => {
    for (const command of ['migrate', 'dev']) {
      const result = run(command, remote('containers-us-west-1.railway.app', marked), ['--dry-run']);
      expect(result.code, command).toBe(2); expect(result.output).toContain('--allow-remote'); expect(result.output).not.toContain('Falta AOH_LOCAL_DB_ENV'); clean(result.output, 'railway.app');
    }
  });

  it('needs the marker itself: another value, a comment, a shell variable or a partial match do not count', () => {
    const host = 'containers-us-west-1.railway.app';
    const base = Object.entries(remote(host)).map(([key, value]) => `${key}=${value}`).join('\n');
    for (const text of [`${base}\nAOH_LOCAL_DB_ENV=production`, `${base}\nAOH_LOCAL_DB_ENV=Development`, `${base}\n# AOH_LOCAL_DB_ENV=development`, `${base}\nAOH_LOCAL_DB_ENV=development-2`, `${base}\nXAOH_LOCAL_DB_ENV=development`]) {
      const result = run('migrate', text, ['--allow-remote', '--dry-run']);
      expect(result.code, text.split('\n').pop()).toBe(2); expect(result.output).toContain('Falta AOH_LOCAL_DB_ENV'); clean(result.output, host);
    }
    const fromShell = run('migrate', remote(host), ['--allow-remote', '--dry-run'], marked);
    expect(fromShell.code).toBe(2); expect(fromShell.output).toContain('Falta AOH_LOCAL_DB_ENV');
    for (const line of ['AOH_LOCAL_DB_ENV=development', 'AOH_LOCAL_DB_ENV="development"', '  AOH_LOCAL_DB_ENV = development  # dev only']) {
      expect(run('check', `${base}\n${line}`).code, line).toBe(0);
    }
  });

  it('a remote DIRECT_URL triggers the same rule even when DATABASE_URL is local', () => {
    const values = { ...good, DIRECT_URL: `postgresql://postgres:${PASSWORD}@containers-us-west-1.railway.app:5432/railway` };
    expect(run('migrate', values, ['--allow-remote', '--dry-run']).code).toBe(2);
    expect(run('migrate', { ...values, ...marked }, ['--allow-remote', '--dry-run']).code).toBe(0);
  });

  it('refuses a production origin, so a copied production env cannot start the dev server', () => {
    const result = run('check', remote('containers-us-west-1.railway.app', { ...marked, ALPHA_PUBLIC_ORIGIN: 'https://alpha.up.railway.app' }));
    expect(result.code).toBe(1); expect(result.output).toContain('ALPHA_PUBLIC_ORIGIN'); clean(result.output, 'railway.app');
  });
});

describe('development scripts', () => {
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
