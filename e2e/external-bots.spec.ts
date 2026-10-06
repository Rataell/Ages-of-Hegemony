import { expect, test, type Browser, type Page } from '@playwright/test';

/** EXTERNAL ALPHA V1.1 — BOTS, quick gate through the real UI (A: 1H+1B, B: 1H+3B, C: 2H+2B). Bots confirm after a short presentation delay. */
async function guest(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await context.addInitScript(() => { try { localStorage.setItem('aoh-tour-off', '1'); } catch { /* */ } });
  const page = await context.newPage(); page.setDefaultTimeout(25_000); return { context, page };
}
async function unlock(page: Page) {
  const field = page.getByLabel('Código de acesso do Alpha');
  if (process.env.ALPHA_ACCESS_CODE) { await field.waitFor({ timeout: 8000 }).catch(() => undefined); if (await field.isVisible().catch(() => false)) await field.fill(process.env.ALPHA_ACCESS_CODE); }
}
async function create(page: Page, seats: number) {
  await page.goto('/alpha'); await page.getByLabel('Seu nome', { exact: true }).fill('Ana'); await unlock(page);
  await page.getByLabel('Lugares', { exact: false }).selectOption(String(seats));
  await page.getByRole('button', { name: 'Criar partida', exact: true }).click();
  await page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
  return (await page.locator('.alpha-lobby-heading code').innerText()).trim();
}
async function join(page: Page, code: string, name: string) {
  await page.goto(`/alpha/join/${code}`); await page.getByLabel('Seu nome', { exact: true }).fill(name); await unlock(page);
  await page.getByRole('button', { name: 'Entrar na partida', exact: true }).click(); await page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
}
async function pickAndReady(page: Page, index: number) {
  await page.locator('.alpha-civilizations button:not([disabled])').nth(index).click();
  await page.getByRole('button', { name: 'Estou pronto', exact: true }).click();
}
async function humanFirstRound(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Escolha duas ambições secretas' });
  await dialog.waitFor(); const boxes = dialog.getByRole('checkbox'); await boxes.nth(0).check(); await boxes.nth(1).check();
  await dialog.getByRole('button', { name: 'Confirmar duas ambições', exact: true }).click(); await dialog.waitFor({ state: 'detached' });
  const pulse = page.locator('.alpha-parchment-pop button').first(); if (await pulse.isVisible().catch(() => false)) await pulse.click();
}
const confirmPlanning = async (page: Page) => {
  await page.locator('.alpha-tray .advance-phase-btn').click();
  const anyway = page.getByRole('button', { name: 'Confirmar mesmo assim' }); // the pre-confirmation reminder (idle city, idle pieces)
  if (await anyway.isVisible({ timeout: 1500 }).catch(() => false)) await anyway.click();
};

test('A: 1 human + 1 bot — lobby shows BOT, the Mesa labels it, the round resolves after the human confirms', async ({ browser }) => {
  const a = await guest(browser);
  try {
    await create(a.page, 2);
    await a.page.getByRole('button', { name: 'Adicionar bot', exact: true }).click();
    await expect(a.page.locator('.alpha-seats article').filter({ hasText: 'BOT' })).toHaveCount(1);
    await expect(a.page.getByRole('button', { name: 'Adicionar bot' })).toHaveCount(0); // seats full
    await pickAndReady(a.page, 3); await a.page.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
    await a.page.locator('.alpha-mesa').waitFor();
    await expect(a.page.locator('.seat-plate').filter({ hasText: 'BOT' })).toHaveCount(1);
    await humanFirstRound(a.page);
    await expect(a.page.locator('.seat-plate').filter({ hasText: 'BOT' })).toContainText('Pronto', { timeout: 8000 }); // bot planned and confirmed on the server
    await confirmPlanning(a.page);
    await expect(a.page.locator('.alpha-strip-when')).toContainText('Rodada 2', { timeout: 15_000 });
    await expect(a.page.locator('.seat-plate').filter({ hasText: 'BOT' })).toContainText(/Planejando|Pronto/);
  } finally { await a.context.close(); }
});

test('B: 1 human + 3 bots — four civilizations on the Mesa, no modal waits for a bot', async ({ browser }) => {
  const a = await guest(browser);
  try {
    await create(a.page, 4);
    for (let i = 0; i < 3; i++) await a.page.getByRole('button', { name: 'Adicionar bot', exact: true }).click();
    await expect(a.page.locator('.alpha-seats article').filter({ hasText: 'BOT' })).toHaveCount(3);
    await pickAndReady(a.page, 5); await a.page.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
    await a.page.locator('.alpha-mesa').waitFor();
    await expect(a.page.locator('.seat-plate')).toHaveCount(4);
    await humanFirstRound(a.page);
    await expect(a.page.locator('.seat-plate').filter({ hasText: 'BOT' }).filter({ hasText: 'Pronto' })).toHaveCount(3, { timeout: 12_000 });
    await confirmPlanning(a.page);
    await expect(a.page.locator('.alpha-strip-when')).toContainText('Rodada 2', { timeout: 20_000 });
  } finally { await a.context.close(); }
});

test('C: 2 humans + 2 bots — SSE between humans, reactions still work, round needs both humans', async ({ browser }) => {
  const a = await guest(browser), b = await guest(browser);
  try {
    const code = await create(a.page, 4); await join(b.page, code, 'Beto');
    for (let i = 0; i < 2; i++) await a.page.getByRole('button', { name: 'Adicionar bot', exact: true }).click();
    await pickAndReady(a.page, 5); await pickAndReady(b.page, 6);
    await a.page.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
    for (const p of [a.page, b.page]) await p.locator('.alpha-mesa').waitFor();
    await expect(b.page.locator('.seat-plate')).toHaveCount(4); await expect(b.page.locator('.seat-plate').filter({ hasText: 'BOT' })).toHaveCount(2);
    await humanFirstRound(a.page); await humanFirstRound(b.page);
    await a.page.locator('.alpha-strip-tools').getByRole('button', { name: 'Reagir', exact: true }).click();
    await a.page.getByRole('menuitem', { name: 'Atenção' }).click();
    await expect(b.page.locator('.seat-bubble')).toContainText('Atenção');
    await confirmPlanning(a.page);
    await expect(a.page.locator('.alpha-strip-when')).toContainText('Rodada 1'); // still waiting for the other human
    await confirmPlanning(b.page);
    await expect(a.page.locator('.alpha-strip-when')).toContainText('Rodada 2', { timeout: 20_000 });
  } finally { await a.context.close(); await b.context.close(); }
});
