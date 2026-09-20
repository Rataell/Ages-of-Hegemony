// Runs the PostgreSQL integration suite against a disposable Docker database (or ALPHA_TEST_DATABASE_URL when set).
// Usage: npm run test:db:docker            start db-test, migrate, test, remove it
//        KEEP_TEST_DB=1 npm run test:db:docker   leave the container running afterwards
import { spawnSync } from 'node:child_process';

const DEFAULT_URL = 'postgresql://aoh:aoh@127.0.0.1:5433/aoh_test?schema=public';
const external = process.env.ALPHA_TEST_DATABASE_URL;
const url = external ?? DEFAULT_URL;
const host = new URL(url).hostname;
if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(host)) {
  console.error(`Refusing to run integration tests against non-local host "${host}". Use the Docker test database.`);
  process.exit(2);
}
const run = (cmd, args, env = {}) => {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...env } });
  return result.status ?? 1;
};
let code;
const managed = external === undefined;
try {
  if (managed && run('docker', ['compose', '--profile', 'test', 'up', '-d', '--wait', 'db-test']) !== 0) {
    console.error('Could not start the db-test container. Is Docker running?');
    process.exit(3);
  }
  const env = { ALPHA_TEST_DATABASE_URL: url, DATABASE_URL: url, DIRECT_URL: url };
  code = run('npx', ['prisma', 'migrate', 'deploy'], env) || run('npx', ['vitest', 'run', '--config', 'vitest.db.config.ts'], env);
} finally {
  if (managed && process.env.KEEP_TEST_DB !== '1') run('docker', ['compose', '--profile', 'test', 'rm', '-sfv', 'db-test']);
}
process.exit(code);
