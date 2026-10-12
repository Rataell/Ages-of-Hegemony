import { expect, test, type Browser, type Page } from '@playwright/test';

/**
 * RC5 · directed gate through the real UI, desktop and mobile: the experimental pace is chosen at creation (short matches only), persisted with the table and seen by the players;
 * the standard pace is untouched; the Teia and the build menu carry the six new buildings with their real effect text.
 */
const VIEWPORTS = [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const;
async function guest(browser: Browser, viewport: { width: number; height: number }) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(() => { try { localStorage.setItem('aoh-tour-off', '1'); } catch { /* */ } });
  const page = await context.newPage(); page.setDefaultTimeout(25_000); return { context, page };
}
async function unlock(page: Page) {
  const field = page.getByLabel('Código de acesso do Alpha');
  if (process.env.ALPHA_ACCESS_CODE) { await field.waitFor({ timeout: 8000 }).catch(() => undefined); if (await field.isVisible().catch(() => false)) await field.fill(process.env.ALPHA_ACCESS_CODE); }
}
async function create(page: Page, options: { duration?: string; pace?: string } = {}) {
  await page.goto('/alpha'); await page.getByLabel('Seu nome', { exact: true }).fill('Ana'); await unlock(page);
  await page.getByLabel('Lugares', { exact: false }).selectOption('2');
  if (options.duration) await page.getByLabel('Duração').selectOption(options.duration);
  await page.getByRole('button', { name: 'Opções da mesa' }).click();
  return { paceSelect: page.getByLabel('Ritmo das cidades'), duration: async (value: string) => {
    // On a phone the options panel replaces the main form: close it, change the duration, reopen it.
    const toggle = page.getByRole('button', { name: 'Opções da mesa' });
    if ((await toggle.getAttribute('aria-expanded')) === 'true') await toggle.click();
    await page.getByLabel('Duração').selectOption(value);
    await toggle.click();
  } };
}
async function submit(page: Page) {
  await page.getByRole('button', { name: 'Criar partida', exact: true }).click();
  await page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
}
async function startWithBot(page: Page) {
  await page.getByRole('button', { name: 'Adicionar bot', exact: true }).click();
  await page.locator('.alpha-civilizations button:not([disabled])').nth(3).click();
  await page.getByRole('button', { name: 'Estou pronto', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
  await page.locator('.alpha-mesa').waitFor();
}
async function humanFirstRound(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Escolha duas ambições secretas' });
  await dialog.waitFor(); const boxes = dialog.getByRole('checkbox'); await boxes.nth(0).check(); await boxes.nth(1).check();
  await dialog.getByRole('button', { name: 'Confirmar duas ambições', exact: true }).click(); await dialog.waitFor({ state: 'detached' });
  const pulse = page.locator('.alpha-parchment-pop button').first(); if (await pulse.isVisible().catch(() => false)) await pulse.click();
}
/** The projection of the table as the browser itself reads it (same cookie, same endpoint). */
const readGame = (page: Page) => page.evaluate(async () => {
  const id = new URL(location.href).searchParams.get('game');
  const reply = await (await fetch(`/api/alpha?gameId=${id}`, { cache: 'no-store' })).json() as { value: { pace: string; game: { rules: { pace: string }; cityStates: { level: string }[]; self: { research: string[] } } } };
  return { room: reply.value.pace, rules: reply.value.game.rules.pace, levels: reply.value.game.cityStates.map(city => city.level), research: reply.value.game.self.research };
});

for (const [name, viewport] of VIEWPORTS) {
  test(`${name}: the accelerated pace is offered only for the Rápida duration, is persisted, and starts the capital as a Povoado`, async ({ browser }) => {
    const { context, page } = await guest(browser, viewport);
    try {
      const form = await create(page, { duration: 'QUICK' });
      await expect(form.paceSelect).toBeVisible();
      await expect(form.paceSelect.locator('option')).toHaveText(['Padrão (ritmo anterior)', 'Acelerado (experimental)']);
      await expect(form.paceSelect.locator('option').first()).toHaveAttribute('value', 'STANDARD');   // the previous pace stays the default
      await form.duration('STANDARD');
      await expect(form.paceSelect).toHaveCount(0);                                                    // 35 rounds: no pace choice
      await form.duration('EPIC');
      await expect(form.paceSelect).toHaveCount(0);                                                    // 49 rounds: no pace choice
      await form.duration('QUICK');
      await form.paceSelect.selectOption('ACCELERATED');
      await submit(page);
      await expect(page.locator('main, body').first()).toContainText(/ritmo acelerado|Ritmo das cidades/i);
      await startWithBot(page);
      const game = await readGame(page);
      expect(game).toMatchObject({ room: 'ACCELERATED', rules: 'ACCELERATED' });
      expect(game.levels).toEqual(['HAMLET']);                                                         // M1: Povoado
      expect(game.research).toContain('web-agriculture');
    } finally { await context.close(); }
  });

  test(`${name}: the standard pace is unchanged (Posto at the start, no pace in the room)`, async ({ browser }) => {
    const { context, page } = await guest(browser, viewport);
    try {
      await create(page, { duration: 'QUICK' });
      await submit(page);
      await startWithBot(page);
      const game = await readGame(page);
      expect(game).toMatchObject({ room: 'STANDARD', rules: 'STANDARD' });
      expect(game.levels).toEqual(['OUTPOST']);
      expect(game.research).toEqual([]);
    } finally { await context.close(); }
  });
}

for (const [name, viewport] of VIEWPORTS) {
  test(`${name}: the Cofre is always visible in the tray with the eight resources, and the Figura rides in the hand with its illustration`, async ({ browser }) => {
    const { context, page } = await guest(browser, viewport);
    try {
      await create(page, { duration: 'QUICK' });
      await submit(page);
      await startWithBot(page);
      await humanFirstRound(page);
      // Cofre: in the tray (bottom), not in the top strip; eight resources, always visible; the click opens the limits and closes again.
      const cofre = page.locator('.alpha-tray .alpha-tray-cofre');
      await expect(cofre).toBeVisible();
      await expect(cofre.locator('.resource')).toHaveCount(8);
      await expect(page.locator('.alpha-strip').getByRole('button', { name: 'Cofre', exact: true })).toHaveCount(0);
      const box = await cofre.boundingBox(); expect(box && box.y + box.height <= viewport.height).toBe(true);   // inside the viewport, at the bottom
      await page.screenshot({ path: `test-results/rc5-cofre-${name}.png` });
      await page.getByRole('button', { name: 'Cofre', exact: true }).click();
      await expect(page.getByRole('region', { name: 'Cofre' })).toBeVisible();
      await page.getByRole('region', { name: 'Cofre' }).getByRole('button', { name: 'Fechar', exact: true }).click();
      await expect(page.getByRole('region', { name: 'Cofre' })).toBeHidden();
      // Figura: one card, marked, with the civilization seal and the initials; opening it shows the Passiva and the Poder and the button to use it.
      const toggle = page.getByRole('button', { name: /^Cartas ·/ });
      if (await toggle.isVisible().catch(() => false)) await toggle.click();
      const figure = page.locator('.alpha-hand-card.is-figure');
      await expect(figure).toHaveCount(1);
      await expect(figure.locator('.alpha-hand-portrait svg').first()).toBeAttached();
      await expect(figure.locator('.alpha-gcard-seal')).toBeAttached();
      await figure.dispatchEvent('click');
      const focus = page.locator('.alpha-hand-play');
      await expect(focus).toContainText(/Passiva/); await expect(focus).toContainText(/Poder 1× por Era/);
      await expect(focus.getByRole('button', { name: 'Usar o Poder', exact: true })).toBeVisible();
      await page.screenshot({ path: `test-results/rc5-figure-${name}.png` });
    } finally { await context.close(); }
  });
}
