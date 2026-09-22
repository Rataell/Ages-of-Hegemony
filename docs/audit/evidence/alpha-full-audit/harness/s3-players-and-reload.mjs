// alpha:players configurations (headless, --once) and reload / reconnect behaviour in the browser.
import { spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { BASE, startMatch, seat, Player, defaultCreate } from './lib.mjs';

const PORT = new URL(BASE).port;
const results = { players: [], reload: [] };
const rec = (arr, label, ok, detail = '') => { arr.push({ label, ok, detail }); console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ' — ' + detail : ''}`); };

console.log('## alpha:players configurations');
const env = { ...process.env, ALPHA_LOCAL_PORT: PORT, ALPHA_PLAYERS_HEADLESS: '1' };
for (const args of [['--players=2', '--once'], ['--players=2', '--auto-join', '--once'], ['--players=2', '--auto-join', '--start', '--once'], ['--players=3', '--auto-join', '--start', '--once'], ['--players=4', '--auto-join', '--start', '--once'], ['--players=6', '--auto-join', '--start', '--once'], ['--players=7'], ['--players=1'], ['--players=2', '--layout=grid']]) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['scripts/alpha-players.mjs', ...args], { encoding: 'utf8', env, timeout: 120000 });
  const text = `${r.stdout}${r.stderr}`.replace(/\s+/g, ' ');
  const wantStart = args.includes('--start'), wantOk = !['--players=7', '--players=1', '--layout=grid'].some(a => args.includes(a));
  rec(results.players, `npm run alpha:players -- ${args.filter(a => a !== '--once').join(' ')}`, wantOk ? r.status === 0 && (!wantStart || text.includes('Partida iniciada')) : r.status === 2, `exit ${r.status}, ${Math.round((Date.now() - t0) / 1000)}s, ${text.slice(0, 150)}`);
}

console.log('\n## reload / reconnect in a real browser');
const browser = await chromium.launch({ headless: true });
const cookieOf = p => ({ name: p.cookie.split('=')[0], value: p.cookie.split('=')[1], url: BASE, httpOnly: true, sameSite: 'Strict' });
const { players, roomId, code } = await startMatch(2);
const [A, B] = players;
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies([cookieOf(A)]);
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  const who = async () => page.locator('.alpha-player-board h1').innerText();
  await page.goto(`${BASE}/alpha?game=${roomId}`); const first = await who();
  await page.reload(); rec(results.reload, 'F5 keeps the identity and the match', (await who()) === first, first);
  const tab2 = await context.newPage(); await tab2.goto(`${BASE}/alpha?game=${roomId}`); await tab2.locator('.alpha-player-board h1').waitFor();
  rec(results.reload, 'a second tab in the same browser is the same person', (await tab2.locator('.alpha-player-board h1').innerText()) === first); await tab2.close();
  await page.close();
  const reopened = await context.newPage(); await reopened.goto(`${BASE}/alpha?game=${roomId}`); await reopened.locator('.alpha-player-board h1').waitFor();
  rec(results.reload, 'closing and reopening the page keeps the session', (await reopened.locator('.alpha-player-board h1').innerText()) === first);
  // /alpha without ?game= only resumes once the page itself has sent a request (localStorage is written after a POST, not after a read)
  await reopened.goto(`${BASE}/alpha`); await reopened.waitForTimeout(1200);
  const coldResume = await reopened.locator('.alpha-player-board h1').isVisible();
  rec(results.reload, 'KNOWN LIMIT: opening /alpha after only READING the match through ?game= shows the entry screen (no resume yet)', !coldResume, coldResume ? 'it resumed' : 'entry screen shown, as documented (P3)');
  await reopened.getByLabel('Seu nome', { exact: true }).fill('Jogador A'); await reopened.getByLabel('Código de convite', { exact: true }).fill(code); await reopened.getByRole('button', { name: 'Entrar na partida', exact: true }).click();
  const rejoined = await reopened.locator('.alpha-player-board h1').waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
  rec(results.reload, 'entering the code with the same session returns to the same seat mid-match', rejoined && (await reopened.locator('.alpha-player-board h1').innerText()) === first);
  await reopened.goto(`${BASE}/alpha`);
  const resumed = await reopened.locator('.alpha-player-board h1').waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
  rec(results.reload, 'after a request from the page, /alpha with no ?game= resumes the last match (localStorage)', resumed);
  if (resumed) {
    await reopened.getByRole('button', { name: 'Sair da partida', exact: true }).click(); await reopened.getByRole('button', { name: 'Sair agora', exact: true }).click();
    await reopened.getByRole('heading', { name: 'Preparar uma mesa' }).waitFor();
    rec(results.reload, 'leaving returns to the entry screen and clears ?game=', new URL(reopened.url()).search === '');
    await reopened.reload(); const stillEntry = await reopened.getByRole('heading', { name: 'Preparar uma mesa' }).isVisible();
    rec(results.reload, 'after leaving, a reload stays on the entry screen', stillEntry);
    const after = await fetch(`${BASE}/api/alpha?gameId=${roomId}`, { headers: { Cookie: A.cookie } }).then(r => r.status);
    rec(results.reload, 'leaving is client-only: the seat still exists on the server (documented behaviour)', after === 200, String(after));
    await reopened.getByLabel('Seu nome', { exact: true }).fill('Jogador A'); await reopened.getByLabel('Código de convite', { exact: true }).fill(code); await reopened.getByRole('button', { name: 'Entrar na partida', exact: true }).click();
    const back = await reopened.locator('.alpha-player-board h1').waitFor().then(() => true).catch(() => false);
    rec(results.reload, 'entering the code again after leaving returns to the same seat mid-match', back && (await reopened.locator('.alpha-player-board h1').innerText()) === first);
  }
  // no cookie: a fresh browser must not see the match
  const anon = await (await browser.newContext()).newPage();
  await anon.goto(`${BASE}/alpha?game=${roomId}`); await anon.waitForTimeout(1500);
  rec(results.reload, 'a browser without the session sees the entry screen, not the match', await anon.getByRole('heading', { name: 'Preparar uma mesa' }).isVisible());
  await context.close();
}
await browser.close();
writeFileSync('docs/audit/evidence/alpha-full-audit/results/s3-players-reload.json', JSON.stringify(results, null, 1));
console.log(`\n${[...results.players, ...results.reload].filter(r => r.ok).length}/${results.players.length + results.reload.length} ok`);
