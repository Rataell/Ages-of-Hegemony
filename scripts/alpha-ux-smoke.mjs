/* global document, window, localStorage */
// DEV-ONLY UX smoke for Interaction Model V2: opens N isolated Chromium windows on the local Closed Alpha (npm run dev:alpha / playtest:human),
// starts a table through the real forms, and runs a named scene as ONE seat while another window plays the rest by hand (clicks only).
//   node scripts/alpha-ux-smoke.mjs --scene=city --out=docs/evidence/v51b-interaction-v2 [--viewport=1280x720] [--players=2]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const arg = new Map(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const PORT = Number(process.env.ALPHA_LOCAL_PORT ?? 3001), BASE = `http://127.0.0.1:${PORT}`;
const [VW, VH] = String(arg.get('viewport') ?? '1280x720').split('x').map(Number);
const OUT = String(arg.get('out') ?? 'docs/evidence/v51b-interaction-v2'); mkdirSync(OUT, { recursive: true });
const COUNT = Number(arg.get('players') ?? 2);

export async function openTable() {
  const browser = await chromium.launch({ headless: true });
  const seats = [];
  for (let i = 0; i < COUNT; i++) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addInitScript(() => { try { localStorage.setItem('aoh-tour-off', '1'); } catch { /* storage blocked */ } });
    const page = await context.newPage(); page.setDefaultTimeout(20000);
    seats.push({ page, label: `Jogador ${'ABCDEF'[i]}` });
  }
  const [host, ...guests] = seats;
  await Promise.all(seats.map(async ({ page, label }) => { await page.goto(`${BASE}/alpha`); await page.getByLabel('Seu nome', { exact: true }).fill(label); }));
  await host.page.getByLabel('Lugares', { exact: false }).selectOption(String(COUNT));
  await host.page.getByRole('button', { name: 'Criar partida', exact: true }).click();
  await host.page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
  const code = (await host.page.locator('.alpha-lobby-heading code').innerText()).trim();
  for (const guest of guests) {
    await guest.page.goto(`${BASE}/alpha?join=${code}`);
    await guest.page.getByLabel('Seu nome', { exact: true }).fill(guest.label);
    await guest.page.getByRole('button', { name: 'Entrar na partida', exact: true }).click();
    await guest.page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
  }
  for (const [index, { page }] of seats.entries()) { await page.locator('.alpha-civilizations button').nth(index).click(); await page.getByRole('button', { name: 'Estou pronto', exact: true }).click(); }
  await host.page.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
  for (const { page } of seats) await page.locator('.alpha-mesa').waitFor();
  // Both seats choose their two Ambições so the table is playable; the dialog is not part of what this smoke looks at.
  for (const { page } of seats) {
    const later = page.getByRole('button', { name: 'Ver o mapa primeiro', exact: true });
    if (await later.isVisible().catch(() => false)) await later.click();
  }
  // The lobby is built for desktop; the table is then looked at in the viewport under test.
  for (const { page } of seats) await page.setViewportSize({ width: VW, height: VH });
  await seats[0].page.waitForTimeout(400);
  return { browser, seats, code };
}
export const shot = async (page, name) => page.screenshot({ path: `${OUT}/${name}.png` });
export { OUT, VW, VH };

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const table = await openTable();
  await shot(table.seats[0].page, `${arg.get('scene') ?? 'mesa'}-${VW}x${VH}`);
  console.log(`mesa pronta (${table.code}); captura em ${OUT}`);
  await table.browser.close();
}

// ---- scenes (run as seat A; seat B is a second window controlled by hand through clicks) ----
export const own = page => page.locator('g.hex.owner-1');
export async function clickHex(page, locator) { await locator.first().scrollIntoViewIfNeeded().catch(() => undefined); await locator.first().click({ force: true }); }
export async function skipOverlays(page) {
  for (const name of ['Ver o mapa primeiro', 'Continuar']) { const b = page.getByRole('button', { name, exact: true }); if (await b.isVisible().catch(() => false)) await b.click(); }
}
export async function readState(page) { return page.evaluate(() => ({ nodes: [...document.querySelectorAll('.table-cloud .ctx-node')].map(n => n.textContent), plate: document.querySelector('.table-cloud .ctx-plate')?.textContent ?? null, targets: document.querySelectorAll('.world-map .hex.target').length, chip: document.querySelector('.ctx-chip')?.textContent ?? null, scrollH: document.documentElement.scrollHeight, innerH: window.innerHeight, scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth })); }
/** Clicks a painted pixel of the player's own piece badge on a hex (the badge's bounding box also covers empty corners that hit the hex below). */
export async function clickPiece(page, hexSelector = 'g.hex') {
  const point = await page.evaluate(sel => {
    for (const hex of document.querySelectorAll(sel)) {
      const stack = hex.querySelector('.art-stack.own'); if (!stack) continue;
      const b = stack.getBoundingClientRect();
      for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) { const x = b.left + (b.width * i) / 12, y = b.top + (b.height * j) / 12, el = document.elementFromPoint(x, y); if (el?.closest('.art-stack.own') === stack) return { x, y }; }
    }
    return null;
  }, hexSelector);
  if (!point) throw new Error('no own piece badge found');
  await page.mouse.click(point.x, point.y);
}

/** Both seats confirm the round through the real buttons until the strip reads the next round (ambitions and Pulso choices are answered on the way). */
export async function endRound(table, toRound) {
  const names = ['Aproveitar a ocasião', 'Continuar', 'Seguir para os dados', 'Passar / pronto', 'Confirmar planejamento', 'Confirmar mesmo assim', 'Confirmar Virada'];
  for (let guard = 0; guard < 60; guard++) {
    const rounds = await Promise.all(table.seats.map(({ page }) => page.locator('.alpha-strip-when').innerText().catch(() => '')));
    if (rounds.every(text => new RegExp(`Rodada\\s*${toRound}\\b`).test(text) && /Planejamento/.test(text))) return true;
    for (const { page } of table.seats) {
      const ambitions = page.getByRole('button', { name: 'Escolher ambições', exact: true });
      if (await ambitions.isVisible().catch(() => false)) {
        await ambitions.click();
        const boxes = page.locator('.alpha-modal input[type="checkbox"]');
        if (await boxes.count() >= 2) { await boxes.nth(0).check(); await boxes.nth(1).check(); await page.getByRole('button', { name: 'Confirmar duas ambições', exact: true }).click(); }
        continue;
      }
      for (const name of names) {
        const button = page.getByRole('button', { name, exact: false }).first();
        if (await button.isVisible().catch(() => false) && await button.isEnabled().catch(() => false)) { await button.click().catch(() => undefined); break; }
      }
    }
    await table.seats[0].page.waitForTimeout(500);
  }
  return false;
}
