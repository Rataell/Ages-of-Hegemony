// Local Closed Alpha helper. No dependencies beyond Node >= 22. Production and Railway do not use this file.
//
//   node scripts/local-alpha.mjs dev       ZERO CONFIG: prepare the workspace and start Next.js with Fast Refresh on http://127.0.0.1:3001/alpha.
//                                          Matches live in memory (restarting clears them); the session secret is random for this run.
//                                          Also runs `tsc -b -w`, so edits in packages/* and apps/server apply without a manual compile
//                                          (--no-watch-packages turns the watcher off).
//
// Advanced, PostgreSQL only (needs apps/web/.env.local):
//   node scripts/local-alpha.mjs dev --postgres   same server over a development PostgreSQL
//   node scripts/local-alpha.mjs check            validate apps/web/.env.local (names only are ever printed, never values)
//   node scripts/local-alpha.mjs migrate          prisma migrate deploy against the database in that file
//
// Databases (advanced mode): localhost / 127.0.0.1 always. A remote database is refused unless BOTH the command has --allow-remote (migrate and dev)
// AND apps/web/.env.local itself contains AOH_LOCAL_DB_ENV=development (check needs only the marker). Production is never inferred
// from a hostname: development and production can share the same provider and proxy, so the explicit marker is the only signal.
// No URL, host or secret is ever printed for a remote database.
//
// ALPHA_ENV_FILE overrides the env file path (used by tests). ALPHA_LOCAL_PORT (default 3001) moves the server; then ALPHA_PUBLIC_ORIGIN must follow.
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
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
const isPostgres = url => url !== null && ['postgres:', 'postgresql:'].includes(url.protocol);
/** host:port/database for a loopback address only. A remote database is never named in the output. */
const target = url => `${url.hostname}${url.port ? `:${url.port}` : ''}${url.pathname}`;
const databaseUrls = () => ['DATABASE_URL', 'DIRECT_URL'].map(name => urlOf(process.env[name] ?? '')).filter(url => url !== null);
const isRemote = () => databaseUrls().some(url => !LOCAL_HOSTS.includes(url.hostname));
/** The marker must be written in apps/web/.env.local itself; a variable that merely exists in the shell does not count. */
const markedDevelopment = () => existsSync(ENV_FILE) && /^\s*AOH_LOCAL_DB_ENV\s*=\s*["']?development["']?\s*(#.*)?$/m.test(readFileSync(ENV_FILE, 'utf8'));
/** Refuses a remote database unless it is marked as development and, for commands that touch it, --allow-remote was given. */
function requireRemoteGuard({ needsFlag }) {
  if (!isRemote()) return;
  const reasons = [];
  if (!markedDevelopment()) reasons.push('Falta AOH_LOCAL_DB_ENV=development em apps/web/.env.local (o valor precisa ser exatamente development, escrito no próprio arquivo).');
  if (needsFlag && !flags.includes('--allow-remote')) reasons.push('Falta --allow-remote no comando (por exemplo: npm run dev:alpha -- --allow-remote ou npm run db:migrate:local -- --allow-remote).');
  if (reasons.length) stop(`Banco remoto recusado. Um banco remoto só é usado quando ele é de DESENVOLVIMENTO e isso foi declarado duas vezes:\n${reasons.map(item => `  - ${item}`).join('\n')}\n\nNunca aponte estes scripts para o banco de produção. Nenhuma URL foi exibida.`, 2);
}
const describeDatabase = () => (isRemote() ? 'banco remoto de desenvolvimento (AOH_LOCAL_DB_ENV=development)' : `DATABASE_URL (${target(new URL(process.env.DATABASE_URL))})`);

/** Problems in the environment, by variable name. Values are never included. */
function problems({ forDatabaseOnly = false } = {}) {
  const list = [], env = process.env;
  const database = env.DATABASE_URL ?? '';
  if (!database) list.push('DATABASE_URL está ausente. Use a URL do seu PostgreSQL local (veja o exemplo).');
  else if (!isPostgres(urlOf(database))) list.push('DATABASE_URL não parece uma URL postgresql://usuario:senha@host:porta/banco.');
  if (env.DIRECT_URL && !isPostgres(urlOf(env.DIRECT_URL))) list.push('DIRECT_URL, quando definida, precisa ser uma URL postgresql://…');
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
  return spawnSync(process.execPath, [bin, ...args], { cwd, stdio: 'inherit', windowsHide: true, env: process.env }).status ?? 1;
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
  loadEnv(); requireValid(); requireRemoteGuard({ needsFlag: false });
  console.log(`Ambiente local ok: ${describeDatabase()}, ALPHA_SESSION_SECRET, ALPHA_PUBLIC_ORIGIN=${ORIGIN}${process.env.DIRECT_URL ? ', DIRECT_URL' : ''}.`);
} else if (command === 'migrate') {
  loadEnv(); requireValid({ forDatabaseOnly: true });
  requireRemoteGuard({ needsFlag: true });
  if (flags.includes('--dry-run')) { console.log('Validação ok (--dry-run): nenhuma migration foi aplicada.'); process.exit(0); }
  console.log(`Aplicando migrations (prisma migrate deploy) no ${isRemote() ? 'banco remoto de desenvolvimento' : `banco ${target(new URL(process.env.DIRECT_URL || process.env.DATABASE_URL))}`}`);
  const code = run(bins.prisma, ['migrate', 'deploy']) || run(bins.prisma, ['migrate', 'status']);
  process.exit(code);
} else if (command === 'dev') {
  // Default: zero configuration. Matches live in this process (memory) and the session secret is generated for this run only.
  // --postgres: the advanced mode, which needs apps/web/.env.local and keeps every database guard.
  const postgres = flags.includes('--postgres');
  if (postgres) { loadEnv(); requireValid(); requireRemoteGuard({ needsFlag: true }); }
  else if (flags.includes('--allow-remote')) stop('--allow-remote só vale com --postgres (npm run dev:alpha:pg -- --allow-remote). O modo padrão não usa banco.', 2);
  if (flags.includes('--dry-run')) { console.log(postgres ? 'Validação ok (--dry-run): nada foi iniciado.' : 'Modo em memória (--dry-run): nada a configurar; nada foi iniciado.'); process.exit(0); }
  if (!(await portFree(PORT))) stop(`A porta ${PORT} já está em uso (talvez outro servidor de desenvolvimento). Encerre-o ou use outra porta:\n  ALPHA_LOCAL_PORT=<porta> npm run dev:alpha`, 3);
  if (postgres) {
    const database = new URL(process.env.DATABASE_URL);
    if (isRemote()) console.log('Usando banco remoto marcado como desenvolvimento (AOH_LOCAL_DB_ENV=development).');
    if (!(await reachable(database))) console.warn(isRemote() ? '\nAviso: o banco remoto não respondeu na porta configurada. Confira a conexão e a URL no .env.local.\n' : `\nAviso: nada responde em ${database.hostname}:${database.port || 5432}. Suba o PostgreSQL local e rode: npm run db:migrate:local\n`);
  }
  console.log('Preparando o workspace (prisma generate, tsc -b)…');
  if (run(bins.prisma, ['generate']) !== 0 || run(bins.tsc, ['-b']) !== 0) stop('Falha ao preparar o workspace. Corrija os erros acima e tente de novo.');
  // Memory mode: the origin follows the port and the secret is random for this run, so a restart also invalidates old sessions.
  // --playtest: human session setup. A legal Contact between the two nearest Pátrias from round 1 (ALPHA_FORCE_CONTACT) and the local playtest log
  // (ALPHA_PLAYTEST_LOG), including the human-side timing events. The people play; nothing here drives the game.
  const playtest = flags.includes('--playtest');
  const sessionEnv = playtest ? { ALPHA_FORCE_CONTACT: '1', ALPHA_PLAYTEST_LOG: '1', ALPHA_PLAYTEST_DIR: join(ROOT, 'docs', 'evidence', 'playtests') } : {};
  const childEnv = postgres
    ? { ...process.env, ...sessionEnv, ALPHA_STORAGE: 'postgres' }
    : { ...process.env, ...sessionEnv, ALPHA_STORAGE: 'memory', ALPHA_PUBLIC_ORIGIN: ORIGIN, ALPHA_SESSION_SECRET: randomBytes(48).toString('base64url') };
  if (playtest) console.log('\nSESSÃO DE PLAYTEST HUMANO: contato forçado (2 Pioneiros frente a frente na rodada 1) + log local de playtest.\n  1. Abra a URL abaixo em duas janelas (ou dois navegadores), uma por pessoa; crie a sala com 2 lugares e comece.\n  2. O log fica em docs/evidence/playtests/<data>-<partida>/events.jsonl (veja docs/playtest/human-alpha-playtest.md).');
  console.log(`\nClosed Alpha local: ${ORIGIN}/alpha  (${postgres ? 'PostgreSQL de desenvolvimento' : 'em memória: reiniciar este comando apaga as partidas'})\n  .tsx/.css: Fast Refresh. packages/* e apps/server: recompilados por tsc -b -w. Ctrl+C encerra tudo.\n`);
  const children = [{ name: 'next', child: spawn(process.execPath, [bins.next, 'dev', '--hostname', HOST, '--port', String(PORT)], { cwd: WEB, stdio: 'inherit', windowsHide: true, env: childEnv }) }];
  if (!flags.includes('--no-watch-packages')) children.push({ name: 'tsc', child: spawn(process.execPath, [bins.tsc, '-b', '-w', '--preserveWatchOutput'], { cwd: ROOT, stdio: 'inherit', windowsHide: true, env: process.env }) });
  let closing = false;
  /** Ends every child and its own children (Next spawns workers). taskkill /T on Windows, SIGTERM elsewhere. */
  const shutdown = code => {
    if (closing) return; closing = true;
    for (const { child } of children) {
      if (child.exitCode !== null || child.pid === undefined) continue;
      if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
      else child.kill('SIGTERM');
    }
    process.exit(code);
  };
  process.on('SIGINT', () => shutdown(0)); process.on('SIGTERM', () => shutdown(0));
  for (const { name, child } of children) child.on('exit', code => { if (!closing) { console.error(`
${name} terminou (código ${code ?? '?'}); encerrando o restante.`); shutdown(code ?? 1); } });
} else {
  stop('Uso: node scripts/local-alpha.mjs check | migrate [--allow-remote] [--dry-run] | dev [--postgres [--allow-remote]] [--dry-run] [--no-watch-packages]', 2);
}
