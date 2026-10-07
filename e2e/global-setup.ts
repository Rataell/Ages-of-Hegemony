import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const HEALTH = 'http://127.0.0.1:3107/api/alpha/health';

function stopTree(child: ChildProcess): void {
  if (child.exitCode !== null || child.pid === undefined) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      shell: false,
      stdio: 'ignore',
      windowsHide: true,
    });
  } else {
    child.kill('SIGTERM');
  }
}

async function waitUntilReady(child: ChildProcess): Promise<void> {
  let exited = false;
  let spawnError: Error | undefined;
  child.once('exit', () => { exited = true; });
  child.once('error', error => { spawnError = error; });
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    if (exited) throw new Error('O servidor E2E encerrou antes de ficar pronto.');
    const response = await fetch(HEALTH, { signal: AbortSignal.timeout(2_000) }).catch(() => null);
    if (response?.ok) return;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Tempo esgotado aguardando ${HEALTH}.`);
}

export default async function globalSetup(): Promise<() => Promise<void>> {
  const child = spawn(process.execPath, [join(ROOT, 'scripts', 'local-alpha.mjs'), 'dev', '--no-watch-packages'], {
    cwd: ROOT,
    env: { ...process.env, AOH_E2E: '1', ALPHA_LOCAL_PORT: '3107', ALPHA_CREATE_RATE_PER_MINUTE: '120' },
    shell: false,
    stdio: 'inherit',
    windowsHide: true,
  });

  try {
    await waitUntilReady(child);
  } catch (error) {
    stopTree(child);
    throw error;
  }

  return async () => { stopTree(child); };
}
