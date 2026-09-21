// Part B: live reload proofs. Temporary edits to product files are ALWAYS reverted with `git checkout` (finally block).
// A match created before the edits must still exist afterwards (in-memory store lives on globalThis).
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { startMatch, BASE, sleep, check, save, finding, okOrThrow } from './lib.mjs';

const ROOT = process.cwd();
const FILES = {
  tsx: 'apps/web/app/alpha/alpha-leave.tsx', css: 'apps/web/app/alpha/alpha.css', server: 'apps/server/src/alpha-runtime.ts',
  engine: 'packages/game-engine/src/alpha-turn.ts', domain: 'packages/game-domain/src/alpha.ts', shared: null,
};
const out = {};
const edit = (file, from, to) => { const text = readFileSync(file, 'utf8'); if (!text.includes(from)) throw new Error(`anchor not found in ${file}`); writeFileSync(file, text.replace(from, to)); };
const revert = () => { for (const f of Object.values(FILES).filter(Boolean)) execFileSync('git', ['checkout', '--', f], { cwd: ROOT }); };
const waitFor = async (fn, ms = 60000, step = 400) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = await fn(); if (v) return Math.round((Date.now() - t0)) ; } catch { /* keep polling */ } await sleep(step); } return null; };

const { players, roomId } = await startMatch(2, { seed: 91 });
const [A, B] = players;
const game = async p => (await p.get(roomId)).value.game;
const before = await game(A);
console.log('match', roomId.slice(0, 8), 'version', before.version, 'phase', before.phase);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addCookies([{ name: A.cookie.split('=')[0], value: A.cookie.split('=')[1], url: BASE, httpOnly: true, sameSite: 'Strict' }]);
const page = await context.newPage(); page.setDefaultTimeout(15000);
const consoleErrors = []; page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); }); page.on('pageerror', e => consoleErrors.push(String(e.message).slice(0, 200)));
try {
  await page.goto(`${BASE}/alpha?game=${roomId}`); await page.locator('.alpha-player-board h1').waitFor();
  await page.evaluate(() => { window.__auditMarker = 'still-here'; });

  console.log('## .tsx edit (Fast Refresh)');
  edit(FILES.tsx, '>Sair da partida<', '>Sair da partida AUDITORIA<');
  let ms = await waitFor(async () => (await page.getByRole('button', { name: /Sair da partida AUDITORIA/ }).count()) > 0);
  const keptTsx = await page.evaluate(() => window.__auditMarker);
  out.tsx = { appearedMs: ms, windowStateKept: keptTsx === 'still-here' };
  check('a .tsx edit shows up in the open page', ms !== null, `${ms} ms`);
  check('…without a full reload (window state kept, Fast Refresh)', keptTsx === 'still-here', String(keptTsx));
  check('…and the running match is intact', (await game(A)).version === before.version);
  revert(); ms = await waitFor(async () => (await page.getByRole('button', { name: /^Sair da partida$/ }).count()) > 0);
  check('reverting the .tsx edit restores the original text', ms !== null, `${ms} ms`);

  console.log('\n## .css edit');
  edit(FILES.css, '.alpha-game', '.audit-probe{--audit-probe:on}\n.alpha-game');
  await page.evaluate(() => { document.body.classList.add('audit-probe'); });
  ms = await waitFor(async () => (await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--audit-probe').trim())) === 'on');
  out.css = { appearedMs: ms, windowStateKept: (await page.evaluate(() => window.__auditMarker)) === 'still-here' };
  check('a .css edit is applied live', ms !== null, `${ms} ms`);
  check('…without a full reload', out.css.windowStateKept);
  revert();

  console.log('\n## apps/server edit (recompiled by tsc -b -w)');
  edit(FILES.server, "const release='alpha-v0.1';", "const release='alpha-v0.1-audit-probe';");
  ms = await waitFor(async () => (await (await fetch(`${BASE}/api/alpha/health`)).json()).release === 'alpha-v0.1-audit-probe', 90000, 1000);
  out.server = { appearedMs: ms };
  check('an apps/server edit reaches the running server', ms !== null, `${ms} ms`);
  const mid = await game(A);
  check('the match created before the edit still exists after the server reloaded', mid.version === before.version, `version ${mid.version}`);
  check('health still reports storage: memory', (await (await fetch(`${BASE}/api/alpha/health`)).json()).storage === 'memory');
  revert(); ms = await waitFor(async () => (await (await fetch(`${BASE}/api/alpha/health`)).json()).release === 'alpha-v0.1', 90000, 1000);
  check('reverting the server edit restores the original release', ms !== null, `${ms} ms`);

  console.log('\n## packages/game-engine edit');
  // WRONG_PHASE message contains the phase label; URBAN_ACTION is illegal in PLANNING
  const wrong = async () => { const v = await game(A); const r = await A.command(roomId, { type: 'URBAN_ACTION', cityId: 'x', action: 'PRODUCE', expectedVersion: v.version }, { expect: [400, 409] }); return r.error?.message ?? ''; };
  console.log('  baseline message:', await wrong());
  edit(FILES.engine, "PLANNING: 'Planejamento'", "PLANNING: 'Planejamento AUDITORIA'");
  ms = await waitFor(async () => (await wrong()).includes('AUDITORIA'), 90000, 1500);
  out.engine = { appearedMs: ms };
  check('a packages/game-engine edit reaches the running server', ms !== null, `${ms} ms`);
  check('the match survived the engine reload', (await game(A)).version === before.version);
  revert(); ms = await waitFor(async () => !(await wrong()).includes('AUDITORIA'), 90000, 1500);
  check('reverting the engine edit restores the original message', ms !== null, `${ms} ms`);

  console.log('\n## packages/game-domain + shared (comment-only edits trigger a rebuild of dependents)');
  for (const [name, file] of [['domain', FILES.domain], ['shared', 'packages/shared/src/index.ts']]) {
    try {
      const path = file; const text = readFileSync(path, 'utf8'); writeFileSync(path, `${text}\n// audit probe ${Date.now()}\n`);
      const t0 = Date.now(); let recovered = null;
      recovered = await waitFor(async () => (await (await fetch(`${BASE}/api/alpha/health`)).json()).ok === true && (await game(A)).version === before.version, 60000, 1500);
      out[name] = { rebuiltAndHealthyMs: recovered };
      check(`a packages/${name} edit does not break the running server or the match`, recovered !== null, `${Date.now() - t0} ms`);
      execFileSync('git', ['checkout', '--', path], { cwd: ROOT });
    } catch (error) { out[name] = { error: String(error.message).slice(0, 120) }; console.log(`  (${name}: ${error.message})`); try { execFileSync('git', ['checkout', '--', file], { cwd: ROOT }); } catch { /* not tracked */ } }
  }
  await sleep(6000);
  const after = await game(A);
  check('after every edit and revert the match is still on the same version', after.version === before.version, `${before.version} → ${after.version}`);
  const stillOpen = await page.evaluate(() => window.__auditMarker);
  out.pageStateAtEnd = stillOpen;
  console.log('  page marker at end:', stillOpen);
} finally {
  revert();
  await browser.close();
  const status = execFileSync('git', ['status', '--short', '--', 'apps', 'packages'], { cwd: ROOT, encoding: 'utf8' }).trim();
  console.log('working tree after revert (apps/packages):', status || 'clean');
  out.treeAfterRevert = status || 'clean';
  out.consoleErrors = consoleErrors;
  save('s11-hmr', { out });
}
