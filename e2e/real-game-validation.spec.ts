import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { collisions, overlaysOver } from './layout-probe.js';

// Validation on the REAL app (no seeded state): the match is created through the lobby, a bot plays the other seat, and the human plays several rounds with real actions
// (Produzir, Recrutar, Construir through the Ficha). Then the populated Mesa is checked at three viewports, with the Ficha open: no piece, city, camp or warrior is covered
// or overlapped. The numbers of what the map really held are attached to the report.
const evidence = 'docs/evidence/ux-board-real';
const unlock = async (page: Page) => {
  const field = page.getByLabel('Código de acesso do Alpha');
  if (process.env.ALPHA_ACCESS_CODE) { await field.waitFor({ timeout: 8000 }).catch(() => undefined); if (await field.isVisible().catch(() => false)) await field.fill(process.env.ALPHA_ACCESS_CODE); }
};
const readGame = (page: Page) => page.evaluate(async () => {
  const id = new URL(location.href).searchParams.get('game');
  const reply = await (await fetch(`/api/alpha?gameId=${id}`, { cache: 'no-store' })).json() as { value: { game: { view: { round: number }; phase: string; units: { ownerId: string; kind: string; hexId: string }[]; threats: { kind: string; hexId: string }[]; cityStates: { cityId: string }[]; self: { plannedActions: unknown[] } } } };
  const g = reply.value.game;
  return { round: g.view.round, phase: g.phase, units: g.units.length, threats: g.threats.length, cities: g.cityStates.length, planned: g.self.plannedActions.length, kinds: [...new Set(g.units.map(u => u.kind))] };
});
/** The Era turn: a pending Pulse choice (take the first option) and the tray's "Confirmar Virada". */
async function eraTurn(page: Page) {
  if (!(await page.locator('.alpha-era-turn').first().isVisible().catch(() => false))) return;
  const choice = page.locator('.alpha-choices .alpha-choice button, .alpha-choices button').first();
  if (await choice.isVisible().catch(() => false)) await choice.click().catch(() => undefined);
  const ready = page.locator('.alpha-round-bar').getByRole('button', { name: /^Confirmar Virada$/ });
  if (await ready.isVisible().catch(() => false) && await ready.isEnabled().catch(() => false)) await ready.click().catch(() => undefined);
}
async function dismiss(page: Page) {
  await eraTurn(page);
  for (const sel of ['.alpha-parchment-pop button', '.alpha-resolution-phase button.primary']) { const b = page.locator(sel).first(); if (await b.isVisible().catch(() => false)) await b.click().catch(() => undefined); }
}
/** A selected hex toggles when clicked again, so click until the cloud is there (at most three times). */
async function openCityCloud(page: Page, node: string) {
  const n = page.locator(`.ctx-node[data-node="${node}"]`).first();
  for (let i = 0; i < 3 && !(await page.locator('.table-cloud').first().isVisible().catch(() => false)); i++) { await page.locator('g.hex.owner-1 .art-city').first().click({ force: true }); await page.waitForTimeout(500); }
  await n.waitFor({ timeout: 8000 });
  return n;
}
async function closeCloud(page: Page) {
  for (let i = 0; i < 5 && (await page.locator('.table-cloud').first().isVisible().catch(() => false)); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); }
}
const blocked: string[] = [];
async function planAction(page: Page, node: string, label?: string) {
  const n = await openCityCloud(page, node);
  if (await n.isDisabled().catch(() => true)) { await closeCloud(page); return false; }
  await n.dispatchEvent('click');
  if (label) { const sub = page.locator('.ctx-node').filter({ hasText: label }).first(); await sub.waitFor({ timeout: 6000 }); await sub.dispatchEvent('click'); }
  const go = page.locator('.table-cloud .afi .ctx-go');
  await go.waitFor({ timeout: 8000 });
  // The Ficha asks the engine first (a debounced read-only request): wait for its answer; a button that stays off is a real block, with its reason.
  const ready = await expect(go).toBeEnabled({ timeout: 6000 }).then(() => true, () => false);
  if (!ready) { blocked.push((await page.locator('.table-cloud .afi [data-why]').first().textContent().catch(() => null)) ?? 'blocked'); await closeCloud(page); return false; }
  await go.click();
  await page.locator('.table-cloud').waitFor({ state: 'detached', timeout: 8000 }).catch(() => undefined);
  return true;
}
const confirmPlanning = async (page: Page) => {
  await page.locator('.alpha-tray .advance-phase-btn').click();
  const anyway = page.getByRole('button', { name: 'Confirmar mesmo assim' });
  if (await anyway.isVisible({ timeout: 1500 }).catch(() => false)) await anyway.click();
};

test('real match: populated Mesa, Ficha open, three viewports, nothing covered or overlapping', async ({ browser }) => {
  test.setTimeout(240_000);
  await mkdir(evidence, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => { try { localStorage.setItem('aoh-tour-off', '1'); } catch { /* */ } });
  const page = await context.newPage(); page.setDefaultTimeout(25_000);
  try {
    await page.goto('/alpha'); await page.getByLabel('Seu nome', { exact: true }).fill('Ana'); await unlock(page);
    await page.getByLabel('Lugares', { exact: false }).selectOption('2');
    await page.getByRole('button', { name: 'Criar partida', exact: true }).click();
    await page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
    await page.getByRole('button', { name: 'Adicionar bot', exact: true }).click();
    await page.locator('.alpha-civilizations button:not([disabled])').nth(3).click();
    await page.getByRole('button', { name: 'Estou pronto', exact: true }).click();
    await page.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
    await page.locator('.alpha-mesa').waitFor();
    const dialog = page.getByRole('dialog', { name: 'Escolha duas ambições secretas' });
    await dialog.waitFor(); const boxes = dialog.getByRole('checkbox'); await boxes.nth(0).check(); await boxes.nth(1).check();
    await dialog.getByRole('button', { name: 'Confirmar duas ambições', exact: true }).click(); await dialog.waitFor({ state: 'detached' });

    const played: string[] = [];
    for (let round = 1; round <= 5; round++) {
      await dismiss(page);
      if (await planAction(page, 'PRODUCE')) played.push(`R${round} Produzir`);
      await dismiss(page);
      if (round >= 2 && await planAction(page, 'RECRUIT', 'Infantaria')) played.push(`R${round} Recrutar Infantaria`);
      await dismiss(page);
      await confirmPlanning(page);
      const want = new RegExp(`Rodada ${round + 1}`);
      await expect.poll(async () => { await dismiss(page); return (await page.locator('.alpha-strip-when').textContent()) ?? ''; }, { timeout: 30_000 }).toMatch(want);
    }
    const game = await readGame(page);
    test.info().annotations.push({ type: 'real-game', description: JSON.stringify({ played, blocked, game }) });
    console.log('REAL-GAME', JSON.stringify({ played, blocked, game }));
    expect(played.length).toBeGreaterThanOrEqual(3);
    expect(game.units).toBeGreaterThan(2);

    for (const [name, size] of [['1440x900', { width: 1440, height: 900 }], ['1280x720', { width: 1280, height: 720 }], ['390x844', { width: 390, height: 844 }]] as const) {
      await page.setViewportSize(size); await dismiss(page); await page.waitForTimeout(500);
      const populated = await collisions(page);
      await page.getByRole('button', { name: 'Focar' }).click().catch(() => undefined); await page.waitForTimeout(600);
      const close = await collisions(page);
      await page.screenshot({ path: `${evidence}/${name}-populated.png` });
      expect(populated.bad, `${name} overview\n${populated.bad.join('\n')}`).toEqual([]);
      expect(close.bad, `${name} focus\n${close.bad.join('\n')}`).toEqual([]);
      // the Ficha open on the real city: it covers no piece, city or warrior
      const produce = await openCityCloud(page, 'PRODUCE');
      await produce.dispatchEvent('click');
      await expect(page.locator('.table-cloud .afi')).toBeVisible(); await page.waitForTimeout(500);
      // the Confirmar button of the Ficha is the topmost element at its centre: no bar, popover or hand covers it
      const hit = await page.evaluate(() => { const b = document.querySelector<HTMLElement>('.table-cloud .afi .ctx-go'); if (!b) return 'missing'; const r = b.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return b === top || b.contains(top) ? 'ok' : `covered by ${top?.className}`; });
      expect(hit, `${name} Confirmar button`).toBe('ok');
      const covered = await overlaysOver(page);
      await page.screenshot({ path: `${evidence}/${name}-ficha.png` });
      expect(covered.bad, `${name} ficha\n${covered.bad.join('\n')}`).toEqual([]);
      await closeCloud(page);
      test.info().annotations.push({ type: name, description: `${populated.count} priority elements checked, ${close.count} at Focar, ${covered.overlays} overlays` });
    }
  } finally { await context.close(); }
});
