// Run repository tools through Node directly so Windows does not need nested npm shells.
// Keep child output attached to the current terminal and hide any console window created by Windows.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const WEB = join(ROOT, 'apps', 'web');
const bins = {
  eslint: join(ROOT, 'node_modules', 'eslint', 'bin', 'eslint.js'),
  next: join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'),
  playwright: join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js'),
  prisma: join(ROOT, 'node_modules', 'prisma', 'build', 'index.js'),
  tsc: join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc'),
  vitest: join(ROOT, 'node_modules', 'vitest', 'vitest.mjs'),
};

function runNode(entry, args, cwd = ROOT) {
  const result = spawnSync(process.execPath, [entry, ...args], {
    cwd,
    env: process.env,
    shell: false,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.error) {
    console.error(`Falha ao iniciar ${entry}: ${result.error.message}`);
    return 1;
  }
  return result.status ?? 1;
}

const compile = () => runNode(bins.prisma, ['generate']) || runNode(bins.tsc, ['-b']);
const lint = args => runNode(bins.eslint, ['.', '--max-warnings', '0', ...args]);
const webTypecheck = () => runNode(bins.next, ['typegen'], WEB) || runNode(bins.tsc, ['--noEmit'], WEB);
const typecheck = () => compile()
  || runNode(bins.tsc, ['-p', 'tests/tsconfig.json'])
  || runNode(bins.tsc, ['-p', 'e2e/tsconfig.json'])
  || webTypecheck();
const test = args => compile() || runNode(bins.vitest, ['run', ...args.filter(arg => arg !== '--run')]);
const e2e = args => runNode(bins.playwright, ['test', ...args]);
const build = () => compile() || runNode(bins.next, ['build'], WEB);
const check = () => lint([]) || typecheck() || test([]) || build();

const tasks = {
  build,
  check,
  compile,
  demo: () => compile() || runNode(join(ROOT, 'apps', 'server', 'dist', 'demo.js'), []),
  'dev:server': () => compile() || runNode(join(ROOT, 'apps', 'server', 'dist', 'main.js'), []),
  'dev:web': args => compile() || runNode(bins.next, ['dev', '--hostname', '127.0.0.1', ...args], WEB),
  'db:deploy': args => runNode(bins.prisma, ['migrate', 'deploy', ...args]),
  'db:generate': args => runNode(bins.prisma, ['generate', ...args]),
  'db:migrate': args => runNode(bins.prisma, ['migrate', 'dev', ...args]),
  'db:validate': args => runNode(bins.prisma, ['validate', ...args]),
  lint,
  test,
  'test:db': args => compile() || runNode(bins.vitest, ['run', '--config', 'vitest.db.config.ts', ...args]),
  'test:db:docker': args => compile() || runNode(join(ROOT, 'scripts', 'test-db.mjs'), args),
  'test:e2e': e2e,
  typecheck,
  'web:build': args => runNode(bins.next, ['build', ...args], WEB),
  'web:dev': args => runNode(bins.next, ['dev', '--hostname', '127.0.0.1', ...args], WEB),
  'web:start': args => runNode(bins.next, ['start', ...args], WEB),
  'web:typecheck': webTypecheck,
};

const [taskName, ...args] = process.argv.slice(2);
const task = tasks[taskName];
if (!task) {
  console.error(`Tarefa desconhecida: ${taskName ?? '(ausente)'}`);
  process.exitCode = 2;
} else {
  process.exitCode = task(args);
}
