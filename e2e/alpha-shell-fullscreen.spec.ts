import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import type { AlphaState } from '@aoh/game-domain';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { runScriptedMatch } from '../tests/alpha-match-scenario.js';
import { connectAlphaContext } from './alpha-fixture.js';

// Phase 1 of the UX north star: during gameplay the desktop is a full-screen application, not a long page.
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
    return { vw: innerWidth, vh: innerHeight, docH: root.scrollHeight, docW: root.scrollWidth, bodyH: document.body.scrollHeight, scrollTop: root.scrollTop, top: box('.top-bar'), nav: box('.main-nav'), bar: box('.alpha-round-bar'), map: box('.map-stage'), council: box('.alpha-council'), inspector: box('.alpha-inspector'), body: box('.alpha-tab-body') };
  }) as Promise<{ vw: number; vh: number; docH: number; docW: number; bodyH: number; scrollTop: number; top: Box; nav: Box; bar: Box; map: Box | null; council: Box | null; inspector: Box | null; body: Box | null }>;
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
async function assertShell(page: Page, label: string) {
  const m = await metrics(page);
  expect.soft(m.docH, `${label}: html scroll height`).toBeLessThanOrEqual(m.vh);
  expect.soft(m.bodyH, `${label}: body scroll height`).toBeLessThanOrEqual(m.vh);
  expect.soft(m.docW, `${label}: horizontal overflow`).toBeLessThanOrEqual(m.vw);
  expect.soft(m.scrollTop, `${label}: page scrolled`).toBe(0);
  expect.soft(m.top.top, `${label}: top bar pinned`).toBe(0);
  expect.soft(m.bar.bottom, `${label}: action bar inside the viewport`).toBeLessThanOrEqual(m.vh + 0.5);
  expect.soft(m.bar.top, `${label}: action bar sits under the content`).toBeGreaterThan(m.nav.bottom);
  await expect.soft(page.locator('.alpha-round-bar button'), `${label}: phase button`).toBeInViewport({ ratio: 1 });
  // Nothing inside the fixed bars may spill out of them (a 64 px top bar with a 70 px block clips its own text).
  for (const selector of ['.top-bar', '.main-nav', '.alpha-round-bar']) {
    const spill = await page.evaluate((query) => { const bar = document.querySelector(query)!.getBoundingClientRect(); return Array.from(document.querySelector(query)!.children).filter(child => { const b = child.getBoundingClientRect(); return b.height > 0 && (b.top < bar.top - 0.5 || b.bottom > bar.bottom + 0.5); }).map(child => child.className || child.tagName); }, selector);
    expect.soft(spill, `${label}: children spilling out of ${selector}`).toEqual([]);
  }
  return m;
}

test('game shell fills the screen: no page scroll, fixed chrome, panels scroll inside', async ({ browser }) => {
  test.setTimeout(240000);
  let beforeAttack: AlphaState | undefined;
  runScriptedMatch((name, state) => { if (name === 'beforeAttack') beforeAttack = state; });
  expect(beforeAttack).toBeDefined();
  const repository = new InMemoryAlphaRepository();
  const sessions = new GuestSessions('shell-fullscreen-secret-'.repeat(4)), identity = sessions.issue(Date.now()), other = sessions.issue(Date.now());
  const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
  await repository.create(AlphaRoomSchema.parse({
    id: beforeAttack!.gameId, version: 0, name: 'Prova do shell', joinCode: 'abcdefghijklmnopqrstuv', hostGuestId: identity.principal.guestId, preset: 'EPIC', seed: 61, seatLimit: 2, planningSeconds: 0, deadline: null,
    seats: beforeAttack!.players.map((p, i) => ({ guestId: (i === 0 ? identity : other).principal.guestId, playerId: p.playerId, name: i === 0 ? 'Aurélia' : 'Valgard', civilization: p.civilization, ready: true })), game: beforeAttack,
  }));
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await mkdir(shots, { recursive: true });
  try {
    await connectAlphaContext(context, http);
    await context.addCookies([{ name: 'aoh_alpha_session', value: identity.token, url: origin, httpOnly: true, sameSite: 'Strict' }]);
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    await page.goto(`/alpha?game=${beforeAttack!.gameId}`);
    await expect.soft(page.getByRole('heading', { name: 'Aurélia', exact: true })).toBeVisible();
    // Give both side panels their longest realistic content: every piece listed, the army selected, extra orders open.
    await page.locator('.alpha-army details summary').first().click();
    await page.locator('.alpha-army').filter({ hasText: '8,0' }).getByRole('button', { name: 'Selecionar todas', exact: true }).click();
    await expect.soft(page.getByRole('heading', { name: 'Planejar com 10 peça(s)' })).toBeVisible();
    // Target the adjacent enemy so the builder shows its attack block, then open the advanced orders and the manual path.
    await page.getByRole('status', { name: 'Resolvendo a rodada' }).getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Planície 9,0', exact: true }).click();
    await page.locator('.alpha-order-builder details summary').click();
    await page.getByRole('button', { name: 'Traçar caminho hex a hex', exact: true }).click();
    await page.getByRole('button', { name: 'Planície 9,0', exact: true }).click();

    for (const [width, height] of SIZES) {
      const label = `${width}x${height}`;
      await page.setViewportSize({ width, height }); await page.waitForTimeout(250);

      // 1. Chrome and page: nothing scrolls globally, the phase button is always there.
      const world = await assertShell(page, `${label} world`);
      expect.soft(world.nav.height, `${label}: navigation keeps a single row`).toBeLessThan(60);
      const navFits = await page.evaluate(() => { const nav = document.querySelector('.main-nav')!; return nav.scrollWidth <= nav.clientWidth + 1; });
      expect.soft(navFits, `${label}: navigation does not overflow sideways`).toBe(true);
      for (const name of ['Mundo', ...TABS]) await expect.soft(page.locator('.main-nav').getByRole('button', { name, exact: true }), `${label}: tab ${name}`).toBeInViewport();
      await page.mouse.move(width / 2, height / 2); await page.mouse.wheel(0, 900);
      expect.soft((await metrics(page)).scrollTop, `${label}: wheel over the atlas does not scroll the page`).toBe(0);

      // 2. Atlas: it takes the whole centre.
      const map = world.map!;
      expect.soft(map.bottom - map.top, `${label}: atlas height`).toBeGreaterThanOrEqual(world.bar.top - world.nav.bottom - 2);
      expect.soft(map.width, `${label}: atlas width`).toBeGreaterThan(width * 0.5);
      await expect.soft(page.locator('svg.world-map'), `${label}: atlas`).toBeVisible();
      await expect.soft(page.getByRole('button', { name: 'Aumentar zoom' })).toBeInViewport();
      await expect.soft(page.getByRole('button', { name: 'Centralizar', exact: true })).toBeInViewport();

      // 3. Side panels scroll inside themselves, never the page.
      for (const selector of ['.alpha-council .alpha-panel-body', '.alpha-inspector .alpha-panel-body']) {
        const inner = await scroller(page, selector);
        expect.soft(inner.overflowY, `${label} ${selector}`).toBe('auto');
        expect.soft(inner.overscroll, `${label} ${selector} overscroll`).toBe('contain');
        expect.soft(inner.pageScroll, `${label} ${selector}: page must not move`).toBe(0);
        if (inner.overflows) expect.soft(inner.moved, `${label} ${selector}: scrolls internally`).toBeGreaterThan(0);
        if (height === 768) expect.soft(inner.overflows, `${label} ${selector}: content must overflow here, or the test proves nothing`).toBe(true);
      }
      // The panel is reachable with the wheel and the page stays put.
      const council = (await metrics(page)).council!;
      await page.mouse.move(council.left + council.width / 2, council.top + council.height / 2); await page.mouse.wheel(0, 500);
      expect.soft((await metrics(page)).scrollTop, `${label}: wheel over the council`).toBe(0);
      const inspector = (await metrics(page)).inspector!;
      await page.mouse.move(inspector.left + inspector.width / 2, inspector.top + inspector.height / 2); await page.mouse.wheel(0, 500);
      expect.soft((await metrics(page)).scrollTop, `${label}: wheel over the inspector`).toBe(0);

      // 4. Collapsing the panels gives the room to the atlas and keeps every control reachable.
      const before = (await metrics(page)).map!;
      await page.getByRole('button', { name: 'Recolher Conselho', exact: true }).click();
      await page.getByRole('button', { name: 'Recolher Inspector', exact: true }).click();
      await expect.soft(page.getByRole('button', { name: 'Expandir Conselho', exact: true })).toBeInViewport();
      await expect.soft(page.getByRole('button', { name: 'Expandir Inspector', exact: true })).toBeInViewport();
      const collapsed = await assertShell(page, `${label} collapsed`);
      expect.soft(collapsed.map!.width - before.width, `${label}: collapsing widens the atlas`).toBeGreaterThan(width >= 1920 ? 350 : 250);
      expect.soft(Math.abs(collapsed.map!.height - before.height), `${label}: height unchanged`).toBeLessThan(2);
      await page.getByRole('button', { name: 'Expandir Conselho', exact: true }).click();
      await page.getByRole('button', { name: 'Expandir Inspector', exact: true }).click();
      expect.soft(Math.abs((await metrics(page)).map!.width - before.width), `${label}: expanding restores the atlas`).toBeLessThan(2);
      await page.waitForTimeout(500); await page.evaluate(() => document.querySelectorAll('.alpha-panel-body, .alpha-tab-body').forEach(element => { element.scrollTop = 0; }));
      await page.screenshot({ path: `${shots}/${label}-world.png` });

      // 5. Every other area keeps the outer shell and scrolls only its own region.
      for (const tab of TABS) {
        await page.locator('.main-nav').getByRole('button', { name: tab, exact: true }).click();
        const area = await assertShell(page, `${label} ${tab}`);
        expect.soft(area.nav.top, `${label} ${tab}: navigation did not move`).toBe(world.nav.top);
        expect.soft(area.bar.top, `${label} ${tab}: action bar did not move`).toBe(world.bar.top);
        const inner = await scroller(page, '.alpha-tab-body');
        expect.soft(inner.overflowY, `${label} ${tab}`).toBe('auto');
        expect.soft(inner.overscroll, `${label} ${tab} overscroll`).toBe('contain');
        expect.soft(inner.pageScroll, `${label} ${tab}: page must not move`).toBe(0);
        if (inner.overflows) expect.soft(inner.moved, `${label} ${tab}: region scrolls`).toBeGreaterThan(0);
        const body = area.body!;
        await page.mouse.move(body.left + body.width / 2, body.top + body.height / 2); await page.mouse.wheel(0, 700);
        expect.soft((await metrics(page)).scrollTop, `${label} ${tab}: wheel`).toBe(0);
        if (tab === 'Crônicas') { await page.waitForTimeout(500); await page.evaluate(() => document.querySelectorAll('.alpha-panel-body, .alpha-tab-body').forEach(element => { element.scrollTop = 0; })); await page.screenshot({ path: `${shots}/${label}-chronicles.png` }); }
      }
      await page.locator('.main-nav').getByRole('button', { name: 'Mundo', exact: true }).click();
      await expect.soft(page.locator('svg.world-map')).toBeVisible();
    }
  } finally { await context.close(); }
});
