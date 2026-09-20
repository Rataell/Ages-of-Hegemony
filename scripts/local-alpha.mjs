// Local Closed Alpha helper. No dependencies beyond Node >= 22. Production and Railway do not use this file.
//
//   node scripts/local-alpha.mjs check     validate apps/web/.env.local (names only are ever printed, never values)
//   node scripts/local-alpha.mjs migrate   prisma migrate deploy against the database in that file (local hosts only unless --allow-remote)
//   node scripts/local-alpha.mjs dev       prepare the workspace and start Next.js with Fast Refresh on http://127.0.0.1:3001/alpha
//                                          also runs `tsc -b -w`, so edits in packages/* and apps/server show up without a manual compile
//                                          (--no-watch-packages turns the watcher off)
//
// ALPHA_ENV_FILE overrides the env file path (used by tests). ALPHA_LOCAL_PORT (default 3001) moves the server; then ALPHA_PUBLIC_ORIGIN must follow.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { connect, createServer } from 'node:net';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const WEB = join(ROOT, 'apps/web');
const ENV_FILE = process.env.ALPHA_ENV_FILE ?? join(WEB, '.env.local');
const HOST = '127.0.0.1', PORT = Number(process.env.ALPHA_LOCAL_PORT ?? 3001), ORIGIN = `http://${HOST}:${PORT}`;
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]'];
const bins = { prisma: join(ROOT, 'node_modules/prisma/build/index.js'), tsc: join(ROOT, 'node_modules/typescript/bin/tsc'), next: join(ROOT, 'node_modules/next/dist/bin/next') };

const [command, ...flags] = process.argv.slice(2);
const copyHint = process.platform === 'win32' ? 'Copy-Item apps/web/.env.local.example apps/web/.env.local' : 'cp apps/web/.env.local.example apps/web/.env.local';
const stop = (message, code = 1) => { console.error(`\n${message}\n`); process.exit(code); };

function loadEnv() {
  if (!existsSync(ENV_FILE)) stop(`Arquivo de ambiente local não encontrado: apps/web/.env.local\nCrie a partir do exemplo e preencha os valores:\n  ${copyHint}\nDepois veja docs/local-alpha.md.`);
  try { process.loadEnvFile(ENV_FILE); } catch { stop('Não consegui ler apps/web/.env.local. Confira se cada linha é NOME=valor.'); }
}
const urlOf = value => { try { return new URL(value); } catch { return null; } };
/** Production runs on Railway. A development script must never be pointed at it. */
const PRODUCTION_HOSTS = /(^|.)(railway.app|rlwy.net|railway.internal)$/i;
const isPostgres = url => url !== null && ['postgres:', 'postgresql:'].includes(url.protocol);
/** host:port/database, without user or password. */
const target = url => `${url.hostname}${url.port ? `:${url.port}` : ''}${url.pathname}`;

/** Problems in the environment, by variable name. Values are never included. */
function problems({ forDatabaseOnly = false } = {}) {
  const list = [], env = process.env;
  const database = env.DATABASE_URL ?? '';
  if (!database) list.push('DATABASE_URL está ausente. Use a URL do seu PostgreSQL local (veja o exemplo).');
  else if (!isPostgres(urlOf(database))) list.push('DATABASE_URL não parece uma URL postgresql://usuario:senha@host:porta/banco.');
  if (env.DIRECT_URL && !isPostgres(urlOf(env.DIRECT_URL))) list.push('DIRECT_URL, quando definida, precisa ser uma URL postgresql://…');
  for (const name of ['DATABASE_URL', 'DIRECT_URL']) if (PRODUCTION_HOSTS.test(urlOf(env[name] ?? '')?.hostname ?? '')) list.push(`${name} aponta para um host do Railway (produção). O desenvolvimento local usa um banco separado e nunca o de produção.`);
  if (forDatabaseOnly) return list;
  const secret = env.ALPHA_SESSION_SECRET ?? '';
  if (!secret) list.push('ALPHA_SESSION_SECRET está ausente. Gere um: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"');
  else if (secret.length < 32) list.push('ALPHA_SESSION_SECRET é curto demais: use pelo menos 32 caracteres aleatórios.');
  const origin = env.ALPHA_PUBLIC_ORIGIN ?? '';
  if (!origin) list.push(`ALPHA_PUBLIC_ORIGIN está ausente. Use ${ORIGIN}`);
  else if (origin.replace(/\/$/, '') !== ORIGIN) list.push(`ALPHA_PUBLIC_ORIGIN deve ser exatamente ${ORIGIN} no ambiente local (o servidor confere a origem de cada requisição; abra o site por esse endereço, não por localhost).`);
  return list;
}
function requireValid(options) {
  const found = problems(options);
  if (found.length) stop(`Ambiente local incompleto (apps/web/.env.local):\n${found.map(item => `  - ${item}`).join('\n')}\n\nNenhum valor foi exibido. Veja docs/local-alpha.md.`);
}
const run = (bin, args, cwd = ROOT) => {
  if (!existsSync(bin)) stop('Dependências não instaladas. Rode: npm install');
  return spawnSync(process.execPath, [bin, ...args], { cwd, stdio: 'inherit', env: process.env }).status ?? 1;
};
const portFree = port => new Promise(resolve => {
  const probe = createServer();
  probe.once('error', () => resolve(false));
  probe.listen(port, HOST, () => probe.close(() => resolve(true)));
});
const reachable = url => new Promise(resolve => {
  const socket = connect({ host: url.hostname, port: Number(url.port) || 5432, timeout: 1500 });
  socket.once('connect', () => { socket.destroy(); resolve(true); });
  socket.once('timeout', () => { socket.destroy(); resolve(false); });
  socket.once('error', () => resolve(false));
});

if (command === 'check') {
  loadEnv(); requireValid();
  console.log(`Ambiente local ok: DATABASE_URL (${target(new URL(process.env.DATABASE_URL))}), ALPHA_SESSION_SECRET, ALPHA_PUBLIC_ORIGIN=${ORIGIN}${process.env.DIRECT_URL ? ', DIRECT_URL' : ''}.`);
} else if (command === 'migrate') {
  loadEnv(); requireValid({ forDatabaseOnly: true });
  const url = new URL(process.env.DIRECT_URL || process.env.DATABASE_URL);
  if (!LOCAL_HOSTS.includes(url.hostname) && !flags.includes('--allow-remote')) stop(`Recusado: o banco em apps/web/.env.local não é local (${url.hostname}).\nEste comando é para o banco de desenvolvimento. Para migrar um banco remoto de propósito, repita com --allow-remote.`, 2);
  console.log(`Aplicando migrations (prisma migrate deploy) em ${target(url)}`);
  const code = run(bins.prisma, ['migrate', 'deploy']) || run(bins.prisma, ['migrate', 'status']);
  process.exit(code);
} else if (command === 'dev') {
  loadEnv(); requireValid();
  if (!(await portFree(PORT))) stop(`A porta ${PORT} já está em uso (talvez outro servidor de desenvolvimento). Encerre-o ou use outra porta:
  ALPHA_LOCAL_PORT=<porta> npm run dev:alpha   (e ajuste ALPHA_PUBLIC_ORIGIN para http://127.0.0.1:<porta>)`, 3);
  const database = new URL(process.env.DATABASE_URL);
  if (!LOCAL_HOSTS.includes(database.hostname)) console.log(`Banco externo de desenvolvimento: ${target(database)}. Confirme que NÃO é o banco de produção.`);
  if (!(await reachable(database))) console.warn(`\nAviso: nada responde em ${database.hostname}:${database.port || 5432}. Suba o PostgreSQL local (npm run db:up) e rode: npm run db:migrate:local\n`);
  console.log('Preparando o workspace (prisma generate, tsc -b)…');
  if (run(bins.prisma, ['generate']) !== 0 || run(bins.tsc, ['-b']) !== 0) stop('Falha ao preparar o workspace. Corrija os erros acima e tente de novo.');
  console.log(`
Closed Alpha local: ${ORIGIN}/alpha
  .tsx/.css: Fast Refresh. packages/* e apps/server: recompilados por tsc -b -w. Ctrl+C encerra tudo.
`);
  const children = [{ name: 'next', child: spawn(process.execPath, [bins.next, 'dev', '--hostname', HOST, '--port', String(PORT)], { cwd: WEB, stdio: 'inherit', env: process.env }) }];
  if (!flags.includes('--no-watch-packages')) children.push({ name: 'tsc', child: spawn(process.execPath, [bins.tsc, '-b', '-w', '--preserveWatchOutput'], { cwd: ROOT, stdio: 'inherit', env: process.env }) });
  let closing = false;
  /** Ends every child and its own children (Next spawns workers). taskkill /T on Windows, SIGTERM elsewhere. */
  const shutdown = code => {
    if (closing) return; closing = true;
    for (const { child } of children) {
      if (child.exitCode !== null || child.pid === undefined) continue;
      if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      else child.kill('SIGTERM');
    }
    process.exit(code);
  };
  process.on('SIGINT', () => shutdown(0)); process.on('SIGTERM', () => shutdown(0));
  for (const { name, child } of children) child.on('exit', code => { if (!closing) { console.error(`
${name} terminou (código ${code ?? '?'}); encerrando o restante.`); shutdown(code ?? 1); } });
} else {
  stop('Uso: node scripts/local-alpha.mjs check | migrate [--allow-remote] | dev [--no-watch-packages]', 2);
}
