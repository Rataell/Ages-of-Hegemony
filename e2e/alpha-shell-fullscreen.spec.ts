import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import type { AlphaState } from '@aoh/game-domain';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { runScriptedMatch } from '../tests/alpha-match-scenario.js';
import { connectAlphaContext, openArea, toMap, muteTour } from './alpha-fixture.js';

// The Mesa (alpha-mesa-design-system): during gameplay the desktop is the table: map, strip, tray, card and Livro, never a long page.
// The scripted match has a ten-piece army and full hands, so the side panels have enough content to overflow at 1366x768.
const shots = process.env.UX_SHOTS_DIR ?? 'docs/evidence/alpha-shell-phase1/after';
const origin = 'http://127.0.0.1:3107';
const SIZES = [[1366, 768], [1440, 900], [1920, 1080]] as const;
const TABS = ['Teia Civilizacional', 'Cartas & Projetos', 'Diplomacia', 'Eras & Hegemonia', 'Crônicas'] as const;

interface Box { top: number; bottom: number; left: number; right: number; width: number; height: number }
async function metrics(page: Page) {
  return page.evaluate(() => {
    const box = (selector: string) => { const element = document.querySelector(selector); if (!element) return null; const b = element.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height }; };
    const root = document.scrollingElement!;
    return { vw: innerWidth, vh: innerHeight, docH: root.scrollHeight, docW: root.scrollWidth, bodyH: document.body.scrollHeight, scrollTop: root.scrollTop, strip: box('.alpha-strip'), tray: box('.alpha-tray'), map: box('.map-stage'), card: box('.alpha-context'), livro: box('.alpha-livro') };
  }) as Promise<{ vw: number; vh: number; docH: number; docW: number; bodyH: number; scrollTop: number; strip: Box; tray: Box; map: Box; card: Box | null; livro: Box | null }>;
}
/** Overflow policy of a scroll container, and whether it really scrolls by itself without moving the page. */
async function scroller(page: Page, selector: string) {
  return page.evaluate((query) => {
    const element = document.querySelector(query)!, style = getComputedStyle(element), root = document.scrollingElement!;
    const overflows = element.scrollHeight > element.clientHeight + 1;
    element.scrollTop = 0; element.scrollTop = 140;
    const moved = element.scrollTop, page = root.scrollTop; element.scrollTop = 0;
    return { overflowY: style.overflowY, overscroll: style.overscrollBehaviorY, overflows, moved, pageScroll: page };
  }, selector);
}
/** UXDEC-020: at most one enabled gold action on screen. */
const golds = (page: Page) => page.evaluate(() => Array.from(document.querySelectorAll('button.primary, button.is-primary')).filter(b => !(b as HTMLButtonElement).disabled && (b as HTMLElement).offsetParent !== null).map(b => b.textContent?.trim()));
async function assertMesa(page: Page, label: string) {
  const m = await metrics(page);
  expect.soft(m.docH, `${label}: html scroll height`).toBeLessThanOrEqual(m.vh);
  expect.soft(m.bodyH, `${label}: body scroll height`).toBeLessThanOrEqual(m.vh);
  expect.soft(m.docW, `${label}: horizontal overflow`).toBeLessThanOrEqual(m.vw);
  expect.soft(m.scrollTop, `${label}: page scrolled`).toBe(0);
  expect.soft(m.strip.height, `${label}: strip at most 52 px`).toBeLessThanOrEqual(52.5);
  expect.soft(m.strip.top, `${label}: strip on top`).toBeLessThan(16);
  expect.soft(m.tray.height, `${label}: tray at most 72 px`).toBeLessThanOrEqual(72.5);
  expect.soft(m.tray.bottom, `${label}: tray inside the viewport`).toBeLessThanOrEqual(m.vh + 0.5);
  expect.soft(m.map.width, `${label}: the map is the table`).toBeGreaterThanOrEqual(m.vw * 0.75);
  await expect.soft(page.locator('.alpha-tray .advance-phase-btn'), `${label}: phase button`).toBeInViewport({ ratio: 1 });
  for (const selector of ['.alpha-strip', '.alpha-tray']) {
    const spill = await page.evaluate((query) => { const bar = document.querySelector(query)!.getBoundingClientRect(); return Array.from(document.querySelector(query)!.children).filter(child => { const b = child.getBoundingClientRect(); const position = getComputedStyle(child).position; return position !== 'absolute' && b.height > 0 && (b.top < bar.top - 0.5 || b.bottom > bar.bottom + 0.5); }).map(child => child.className || child.tagName); }, selector);
    expect.soft(spill, `${label}: children spilling out of ${selector}`).toEqual([]);
  }
  expect.soft((await golds(page)).length, `${label}: one gold action at most`).toBeLessThanOrEqual(1);
  return m;
}

test('mesa: map-first table, strip and tray sizes, one gold, card and Livro scroll inside', async ({ browser }) => {
  test.setTimeout(240000);
  let beforeAttack: AlphaState | undefined;
  runScriptedMatch((name, state) => { if (name === 'beforeAttack') beforeAttack = state; });
  expect(beforeAttack).toBeDefined();
  const repository = new InMemoryAlphaRepository();
  const sessions = new GuestSessions('shell-fullscreen-secret-'.repeat(4)), identity = sessions.issue(Date.now()), other = sessions.issue(Date.now());
  const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
  await repository.create(AlphaRoomSchema.parse({
    id: beforeAttack!.gameId, version: 0, contentVersion: 'v1.2', name: 'Prova do shell', joinCode: 'abcdefghijklmnopqrstuv', hostGuestId: identity.principal.guestId, preset: 'EPIC', seed: 61, seatLimit: 2, planningSeconds: 0, deadline: null,
    seats: beforeAttack!.players.map((p, i) => ({ guestId: (i === 0 ? identity : other).principal.guestId, playerId: p.playerId, name: i === 0 ? 'Incas (Tawantinsuyu)' : 'Helênicos', civilization: p.civilization, figureId: p.leader?.leaderId ?? null, ready: true })), game: beforeAttack,
  }));
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await mkdir(shots, { recursive: true });
  try {
    await connectAlphaContext(context, http);await muteTour(context);
    await context.addCookies([{ name: 'aoh_alpha_session', value: identity.token, url: origin, httpOnly: true, sameSite: 'Strict' }]);
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    await page.goto(`/alpha?game=${beforeAttack!.gameId}`);
    await expect.soft(page.getByRole('heading', { name: 'Incas (Tawantinsuyu)', exact: true })).toBeVisible();
    // Give the table its longest realistic content: the results panel dismissed, every piece listed in Detalhes, the army's cloud open and target mode lit.
    await page.getByRole('status', { name: 'Resolvendo a rodada' }).getByRole('button', { name: 'Continuar' }).click();
    await page.locator('svg.world-map g.hex[aria-label$=" 8,0"], svg.world-map g.hex[aria-label$=" 8,0, trabalhado"]').first().click();
    await page.getByRole('button', { name: 'Detalhes', exact: true }).click();
    await page.locator('.alpha-inspector .alpha-frame').filter({ hasText: '8,0' }).getByRole('button', { name: 'Selecionar todas', exact: true }).click();
    await expect.soft(page.locator('.table-cloud .ctx-plate')).toContainText('MILITARES · 10');
    await page.locator('.ctx-node[data-node="attack"]').click();
    await expect.soft(page.locator('.ctx-chip')).toBeVisible();

    for (const [width, height] of SIZES) {
      const label = `${width}x${height}`;
      await page.setViewportSize({ width, height }); await page.waitForTimeout(250);

      // 1. The table: nothing scrolls globally, strip and tray stay within their sizes, the map takes the screen.
      await assertMesa(page, `${label} map`);
      await page.mouse.move(width / 3, height / 2); await page.mouse.wheel(0, 900);
      expect.soft((await metrics(page)).scrollTop, `${label}: wheel over the atlas does not scroll the page`).toBe(0);
      await expect.soft(page.getByRole('button', { name: 'Aumentar zoom' })).toBeInViewport();
      await expect.soft(page.getByRole('button', { name: 'Mesa', exact: true })).toBeInViewport();

      // 2. NO-SCROLL: the context card is one fixed frame (segments swap its content); it neither scrolls nor lets the page move.
      const inner = await scroller(page, '.alpha-context .alpha-panel-body');
      expect.soft(inner.overflowY, `${label} card`).toBe('hidden');
      expect.soft(inner.overflows, `${label} card: content fits, nothing is clipped`).toBe(false);
      expect.soft(inner.pageScroll, `${label} card: page must not move`).toBe(0);
      const card = (await metrics(page)).card!;
      await page.mouse.move(card.left + card.width / 2, card.top + card.height / 2); await page.mouse.wheel(0, 500);
      expect.soft((await metrics(page)).scrollTop, `${label}: wheel over the card`).toBe(0);
      await page.waitForTimeout(300); await page.evaluate(() => document.querySelectorAll('.alpha-panel-body, .alpha-tab-body').forEach(element => { element.scrollTop = 0; }));
      await page.screenshot({ path: `${shots}/${label}-world.png` });

      // 3. The Cofre opens over the map and closes back to it.
      await page.getByRole('button', { name: 'Cofre', exact: true }).click();
      await expect.soft(page.getByRole('region', { name: 'Cofre' })).toBeVisible();
      await page.getByRole('region', { name: 'Cofre' }).getByRole('button', { name: 'Fechar', exact: true }).click();

      // 4. Every area opens in the Livro over the map, scrolls only its own region and closes back to the map.
      for (const tab of ['Conselho', ...TABS]) {
        await openArea(page, tab);
        // The Teia is not a page of the Livro: it opens the Tabuleiro (a glass layer with its own pan/zoom) over the Mesa.
        if (tab === 'Teia Civilizacional') {
          await expect.soft(page.getByRole('dialog', { name: 'Tabuleiro da Civilização' }), `${label} ${tab}: Tabuleiro open`).toBeVisible();
          await assertMesa(page, `${label} ${tab}`);
          await page.keyboard.press('Escape');
          continue;
        }
        const area = await assertMesa(page, `${label} ${tab}`);
        expect.soft(area.livro, `${label} ${tab}: Livro open`).not.toBeNull();
        const body = await scroller(page, '.alpha-livro .alpha-tab-body');
        // Livro pages swap in place; only a naturally textual page scrolls, and then in its own single region (never nested).
        expect.soft(body.overflowY, `${label} ${tab}`).toBe('hidden');
        expect.soft(body.pageScroll, `${label} ${tab}: page must not move`).toBe(0);
        if (tab === 'Crônicas') { await page.waitForTimeout(400); await page.screenshot({ path: `${shots}/${label}-chronicles.png` }); }
      }
      await page.keyboard.press('Escape');
      await toMap(page);
      await expect.soft(page.getByRole('dialog', { name: 'Livro' })).toHaveCount(0);
      await expect.soft(page.locator('svg.world-map')).toBeVisible();
    }
  } finally { await context.close(); }
});
