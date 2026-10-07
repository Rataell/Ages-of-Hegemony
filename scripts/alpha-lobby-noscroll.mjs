// DEV-ONLY: the entry and lobby screens must never scroll the document (RC 1.2). Opens every front-of-house state at 1280x720, 1440x900
// and 390x844 and asserts document.scrollingElement.scrollHeight <= innerHeight (+1) and scrollWidth <= innerWidth (+1); prints which elements
// stick out when it fails. Also checks the invite flow end to end: a device that remembers a name lands in the room from the link without a
// click, a fresh device sees only the name card, and nobody is asked for the Alpha access code on join.
//
//   node scripts/local-alpha.mjs dev                       (another terminal; or AOH_DIST_DIR=… ALPHA_LOCAL_PORT=… for a private server)
//   BASE=http://127.0.0.1:3001 node scripts/alpha-lobby-noscroll.mjs [--shots[=docs/evidence/rc12/entry-lobby]] [--light]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://127.0.0.1:3001';
const arg = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? '1']; }));
const SHOTS = arg.shots ? (arg.shots === '1' ? 'docs/evidence/rc12/entry-lobby' : arg.shots) : null;
const VIEWPORTS = [[1280, 720], [1440, 900], [390, 844]];
const OLD_NAMES = /\b(Valgard|Aurélia|Merídia|Thalos|Saren|Kor|Orinth|Nymara|Dravik|Solenne|Elyra|Veyra)\b/;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
const failures = [];
const contexts = [];
async function device({ name = null, theme = 'DARK', viewport = [1280, 720] } = {}) {
  const context = await browser.newContext({ viewport: { width: viewport[0], height: viewport[1] }, permissions: ['clipboard-read', 'clipboard-write'] });
  await context.addInitScript(([remembered, chosenTheme]) => { try { localStorage.setItem('aoh-tour-off', '1'); localStorage.setItem('aoh-alpha-theme', chosenTheme); if (remembered && !sessionStorage.getItem('aoh-seeded')) { localStorage.setItem('aoh-alpha-name', remembered); sessionStorage.setItem('aoh-seeded', '1'); } } catch { /* */ } }, [name, theme]);
  contexts.push(context);
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
  return page;
}
/** The measurement: document scroll extents plus the elements outside the viewport that are not clipped by a scrolling panel. */
async function measure(page) {
  return page.evaluate(() => {
    const root = document.scrollingElement ?? document.documentElement;
    const clipped = element => { for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) { const style = getComputedStyle(node); if (/(auto|scroll|hidden|clip)/.test(style.overflowY + style.overflowX) && node !== root) return true; } return false; };
    const label = element => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${[...element.classList].slice(0, 3).map(c => `.${c}`).join('')}`;
    const outside = [];
    for (const element of document.body.querySelectorAll('*')) {
      const rect = element.getBoundingClientRect(); if (!rect.width || !rect.height) continue;
      if ((rect.bottom > innerHeight + 1 || rect.right > innerWidth + 1) && !clipped(element)) outside.push(`${label(element)} → bottom ${Math.round(rect.bottom)} right ${Math.round(rect.right)}`);
    }
    const panels = [...document.querySelectorAll('*')].filter(el => { const s = getComputedStyle(el); return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1; }).map(el => `${label(el)} (${el.scrollHeight}/${el.clientHeight})`);
    return { scrollHeight: root.scrollHeight, scrollWidth: root.scrollWidth, innerHeight, innerWidth, outside: outside.slice(0, 12), panels };
  });
}
async function check(page, state) {
  await page.waitForTimeout(250);
  const size = page.viewportSize(), m = await measure(page), tag = `${state} @ ${size.width}x${size.height}`;
  const ok = m.scrollHeight <= m.innerHeight + 1 && m.scrollWidth <= m.innerWidth + 1;
  const text = await page.locator('body').innerText();
  const old = OLD_NAMES.exec(text);
  console.log(`${ok && !old ? 'OK  ' : 'FAIL'} ${tag}: ${m.scrollWidth}x${m.scrollHeight} in ${m.innerWidth}x${m.innerHeight}${m.panels.length ? ` · panels scrolling inside: ${m.panels.join(', ')}` : ''}`);
  if (!ok) { failures.push(`${tag} scrolls`); for (const line of m.outside) console.log(`       sticks out: ${line}`); }
  if (old) failures.push(`${tag} shows an old civilization name: ${old[0]}`);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${state}-${size.width}x${size.height}.png` });
}
async function each(page, state, before = async () => {}) { for (const [width, height] of VIEWPORTS) { await page.setViewportSize({ width, height }); await before(); await check(page, state); } }
async function createRoom(page, { name, seats }) {
  await page.goto(`${BASE}/alpha`);
  await page.getByLabel('Seu nome', { exact: true }).fill(name);
  await page.getByLabel('Lugares', { exact: false }).selectOption(String(seats));
  await page.getByRole('button', { name: 'Criar partida', exact: true }).click();
  await page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
  return (await page.locator('.alpha-lobby-heading code').innerText()).trim();
}

try {
  const theme = arg.light ? 'LIGHT' : 'DARK';
  // 1. Entry on a new device, then with the table options open.
  const fresh = await device({ theme });
  await fresh.goto(`${BASE}/alpha`); await fresh.getByLabel('Seu nome', { exact: true }).waitFor();
  if (await fresh.getByLabel('Código de acesso do Alpha').count()) console.log('note: this server requires an Alpha access code to create rooms');
  await each(fresh, 'entry-new-device');
  await fresh.getByRole('button', { name: 'Opções da mesa', exact: true }).click();
  await each(fresh, 'entry-options');
  // 2. Entry on a device that remembers a name.
  const known = await device({ name: 'Marina', theme });
  await known.goto(`${BASE}/alpha`); await known.getByRole('button', { name: 'Não sou eu' }).waitFor();
  if (await known.getByLabel('Seu nome', { exact: true }).inputValue() !== 'Marina') failures.push('remembered name is not pre-filled');
  await each(known, 'entry-remembered-name');

  // 3. Invite flow: host creates a 4-seat table and copies the link.
  const host = await device({ theme });
  const code = await createRoom(host, { name: 'Ana', seats: 4 });
  await host.getByRole('button', { name: 'Copiar link', exact: true }).click();
  const link = await host.evaluate(() => navigator.clipboard.readText());
  if (!link.endsWith(`/alpha/join/${code}`)) failures.push(`copied link is ${link}`);
  // A fresh device: only the name card (code as a chip, never an input, never the access code).
  const newcomer = await device({ theme });
  await newcomer.goto(link); await newcomer.locator('.alpha-invite-card').waitFor();
  if (await newcomer.getByLabel('Código de convite').count()) failures.push('join card shows the invite code as an input');
  if (await newcomer.getByLabel('Código de acesso do Alpha').count()) failures.push('join card asks for the access code');
  if (await newcomer.locator('.alpha-invite-chip').getAttribute('data-code') !== code) failures.push('invite chip does not carry the code');
  await each(newcomer, 'join-card-new-device');
  await newcomer.getByLabel('Seu nome', { exact: true }).fill('Beto');
  await newcomer.getByRole('button', { name: 'Entrar na partida', exact: true }).click();
  await newcomer.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
  // A device that remembers a name enters from the link without any click.
  const returning = await device({ name: 'Caio', theme });
  const posts = []; returning.on('request', r => { if (r.method() === 'POST' && r.url().endsWith('/api/alpha')) posts.push(r.postDataJSON()); });
  await returning.goto(link);
  await returning.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
  if (!posts.some(p => p.operation === 'join' && p.displayName === 'Caio' && !('accessCode' in p))) failures.push(`auto-join POST not seen as expected: ${JSON.stringify(posts)}`);
  console.log('OK   remembered name auto-joined from the invite link; fresh device saw the name card');
  // F5 keeps the seat and the choices.
  await returning.locator('.alpha-civilizations button:not([disabled])').first().click();
  const figure = returning.locator('.alpha-figures [role="button"]').nth(2); await figure.click();
  await returning.waitForTimeout(400);
  const picked = await returning.locator('.alpha-figures .is-selected h4').innerText();
  await returning.reload(); await returning.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
  const after = await returning.locator('.alpha-figures .is-selected h4').innerText().catch(() => '');
  if (after !== picked) failures.push(`F5 lost the Figura (${picked} → ${after})`); else console.log(`OK   F5 kept civilization and Figura (${picked.replace('★', '').trim()})`);
  // The same link again on the seated device resumes the seat (no second seat).
  await returning.goto(link); await returning.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
  await host.waitForTimeout(600);
  const seated = await host.locator('.alpha-seats article').count(); if (seated !== 3) failures.push(`expected 3 seats after re-opening the link, saw ${seated}`);

  // 4. Lobby with 2 seats (host + Beto in a 2-seat table) and with 6 seats (bots).
  const pair = await device({ theme });
  const pairCode = await createRoom(pair, { name: 'Ana', seats: 2 });
  const guest = await device({ theme });
  await guest.goto(`${BASE}/alpha/join/${pairCode}`); await guest.getByLabel('Seu nome', { exact: true }).fill('Beto'); await guest.getByRole('button', { name: 'Entrar na partida', exact: true }).click();
  await pair.locator('.alpha-seats article').nth(1).waitFor();
  await each(pair, 'lobby-2-seats');
  await pair.locator('.alpha-civilizations button').filter({ hasText: 'Nórdicos' }).click();
  await pair.waitForTimeout(400);
  await each(pair, 'lobby-civ-figura', async () => { await pair.getByRole('tab', { name: 'Figura' }).click().catch(() => undefined); });
  await each(pair, 'lobby-table-controls', async () => { await pair.getByRole('tab', { name: 'Mesa' }).click().catch(() => undefined); });
  const full = await device({ theme });
  await createRoom(full, { name: 'Ana', seats: 6 });
  for (let i = 0; i < 5; i++) { await full.getByRole('button', { name: 'Adicionar bot', exact: true }).click(); await full.locator('.alpha-seats article').nth(i + 1).waitFor(); }
  await full.locator('.alpha-civilizations button:not([disabled])').first().click(); await full.waitForTimeout(300);
  await each(full, 'lobby-6-seats', async () => { await full.getByRole('tab', { name: 'Civilização' }).click().catch(() => undefined); });
  // 5. Invite errors: unknown invite (real 404) and a V1.1 room (simulated LEGACY_ROOM answer).
  const lost = await device({ name: 'Dora', theme });
  await lost.goto(`${BASE}/alpha/join/AAAAAAAAAAAAAAAAAAAAAA`); await lost.getByText('Convite não encontrado').waitFor();
  await each(lost, 'join-not-found');
  const legacy = await device({ name: 'Dora', theme });
  await legacy.route('**/api/alpha', route => route.request().method() === 'POST'
    ? route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ ok: false, error: { code: 'LEGACY_ROOM', message: 'Esta partida foi criada em uma versão anterior do Alpha (1.1) e agora é somente leitura. Crie uma nova sala para jogar com a versão atual.' } }) })
    : route.continue());
  await legacy.goto(`${BASE}/alpha/join/BBBBBBBBBBBBBBBBBBBBBB`); await legacy.getByRole('button', { name: 'Criar nova sala' }).waitFor();
  await each(legacy, 'join-legacy-room');
} catch (error) {
  failures.push(`script error: ${error instanceof Error ? error.message : String(error)}`);
} finally {
  for (const context of contexts) await context.close().catch(() => undefined);
  await browser.close();
}
if (failures.length) { console.error(`\n${failures.length} problem(s):\n- ${failures.join('\n- ')}`); process.exit(1); }
console.log('\nEntry and lobby: no document scroll at 1280x720, 1440x900 and 390x844.');
