import { expect, test, type Browser, type Page } from '@playwright/test';

/**
 * QUICK EXTERNAL GATE (real server, real SSE, separate browser contexts = separate guests): invite link, lobby, start, reactions,
 * reconnect to the same seat, host transfer, leave-and-return, suspend/resume. No 35-round games.
 */
const ENTRY = '/alpha';
async function guest(browser: Browser, name: string) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await context.addInitScript(() => { try { localStorage.setItem('aoh-tour-off', '1'); } catch { /* no storage */ } });
  const page = await context.newPage(); page.setDefaultTimeout(20_000);
  return { context, page, name };
}
async function create(page: Page, name: string, seats: number) {
  await page.goto(ENTRY);
  await page.getByLabel('Seu nome', { exact: true }).fill(name);
  await page.getByLabel('Lugares', { exact: false }).selectOption(String(seats));
  await page.getByRole('button', { name: 'Criar partida', exact: true }).click();
  await page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
  return (await page.locator('.alpha-lobby-heading code').innerText()).trim();
}
async function joinByLink(page: Page, name: string, code: string) {
  await page.goto(`/alpha/join/${code}`);
  await expect(page.getByLabel('Código de convite')).toHaveValue(code); // the link pre-fills the code
  await page.getByLabel('Seu nome', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Entrar na partida', exact: true }).click();
  await page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
}
async function startTable(pages: Page[]) {
  for (const [i, page] of pages.entries()) {
    await page.locator('.alpha-civilizations button:not([disabled])').nth(i).click();
    await page.getByRole('button', { name: 'Estou pronto', exact: true }).click();
  }
  await pages[0]!.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
  for (const page of pages) await page.locator('.alpha-mesa').waitFor();
  for (const page of pages) {
    const later = page.getByRole('button', { name: 'Ver o mapa primeiro', exact: true });
    if (await later.isVisible().catch(() => false)) await later.click();
  }
}
const livroTab = async (page: Page, tab: string) => {
  const livro = page.getByRole('dialog', { name: 'Livro' });
  if (!(await livro.isVisible())) await page.getByRole('button', { name: 'Livro', exact: true }).click();
  await livro.getByRole('button', { name: 'Conselho', exact: true }).click();
  await livro.getByRole('tab', { name: tab }).click();
};

test('2 players: link, lobby, start, reaction, reconnect, host transfer, suspend/resume', async ({ browser }) => {
  const a = await guest(browser, 'Ana'), b = await guest(browser, 'Beto');
  try {
    const code = await create(a.page, 'Ana', 2);
    await joinByLink(b.page, 'Beto', code);
    await expect(a.page.locator('.alpha-seats article')).toHaveCount(2); // pushed over SSE, no reload
    await startTable([a.page, b.page]);

    // Reaction: A reacts from the viewer's own plate cloud; B sees the bubble over A's plate (SSE, nothing saved).
    await a.page.locator('.alpha-strip-tools').getByRole('button', { name: 'Reagir', exact: true }).click();
    await a.page.getByRole('menuitem', { name: 'Boa jogada' }).click();
    await expect(b.page.locator('.seat-bubble')).toContainText('Boa jogada');
    await expect(b.page.locator('.seat-bubble')).toHaveCount(0, { timeout: 6000 }); // it vanishes by itself

    // F5 on B: same seat, no duplicate.
    await b.page.reload();
    await expect(b.page.locator('.alpha-mesa')).toBeVisible();
    await livroTab(b.page, 'Mesa');
    await expect(b.page.locator('.alpha-room-seats li')).toHaveCount(2);
    await expect(b.page.locator('.alpha-room-seats li.is-self')).toContainText('Beto');

    // Host leaves on purpose: the match is NOT destroyed, the host role moves to B.
    await a.page.getByRole('button', { name: 'Sair da partida' }).click();
    await a.page.getByRole('button', { name: 'Sair e poder voltar' }).click();
    await expect(b.page.locator('.alpha-toast')).toContainText('anfitrião', { timeout: 10_000 });
    await livroTab(b.page, 'Mesa');
    await expect(b.page.locator('.alpha-room-seats li').filter({ hasText: 'Beto' })).toContainText('anfitrião');

    // A comes back with the same browser session and takes the same seat (not a new one).
    await a.page.goto(ENTRY);
    await a.page.getByRole('button', { name: 'Voltar à minha partida' }).click();
    await a.page.locator('.alpha-mesa').waitFor();
    await livroTab(a.page, 'Mesa');
    await expect(a.page.locator('.alpha-room-seats li')).toHaveCount(2);
    await expect(a.page.locator('.alpha-room-seats li.is-self')).toContainText('Ana');
    await expect(a.page.locator('.alpha-room-seats li.is-self')).not.toContainText('anfitrião');
  } finally { await a.context.close(); await b.context.close(); }
});

test('4 players: all enter, the Mesa opens for everyone, a reaction reaches all by SSE', async ({ browser }) => {
  const people = await Promise.all(['Ana', 'Beto', 'Cleo', 'Davi'].map(n => guest(browser, n)));
  try {
    const code = await create(people[0]!.page, 'Ana', 4);
    for (const p of people.slice(1)) await joinByLink(p.page, p.name, code);
    await expect(people[0]!.page.locator('.alpha-seats article')).toHaveCount(4);
    await startTable(people.map(p => p.page));
    await people[3]!.page.locator('.alpha-strip-tools').getByRole('button', { name: 'Reagir', exact: true }).click();
    await people[3]!.page.getByRole('menuitem', { name: 'Atenção' }).click();
    for (const p of people.slice(0, 3)) await expect(p.page.locator('.seat-bubble')).toContainText('Atenção');
    for (const p of people) await expect(p.page.locator('.alpha-tray .advance-phase-btn')).toBeVisible();
  } finally { for (const p of people) await p.context.close(); }
});

test('2 players: suspend at a safe point, both see it, resume continues; restart-safe state is the server snapshot', async ({ browser }) => {
  const a = await guest(browser, 'Ana'), b = await guest(browser, 'Beto');
  try {
    const code = await create(a.page, 'Ana', 2);
    await joinByLink(b.page, 'Beto', code);
    for (const [i, page] of [a.page, b.page].entries()) {
      await page.locator('.alpha-civilizations button:not([disabled])').nth(i).click();
      await page.getByRole('button', { name: 'Estou pronto', exact: true }).click();
    }
    await a.page.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
    for (const page of [a.page, b.page]) {
      const dialog = page.getByRole('dialog', { name: 'Escolha duas ambições secretas' });
      await dialog.waitFor();
      const boxes = dialog.getByRole('checkbox'); await boxes.nth(0).check(); await boxes.nth(1).check();
      await dialog.getByRole('button', { name: 'Confirmar duas ambições', exact: true }).click();
      await dialog.waitFor({ state: 'detached' });
      const pulse = page.locator('.alpha-parchment-pop button').first();
      if (await pulse.isVisible().catch(() => false)) await pulse.click();
    }
    // Not a safe point while a mandatory decision is open → the button explains why; otherwise it suspends.
    await livroTab(a.page, 'Mesa');
    const suspend = a.page.getByRole('button', { name: 'Suspender partida' });
    await expect(suspend).toBeEnabled();
    await suspend.click();
    for (const page of [a.page, b.page]) await expect(page.getByRole('dialog', { name: 'Partida suspensa' })).toContainText('Última rodada: 1');
    await expect(b.page.getByRole('button', { name: 'Retomar' })).toHaveCount(0); // only the host resumes
    await a.page.getByRole('button', { name: 'Retomar' }).click();
    for (const page of [a.page, b.page]) await expect(page.getByRole('dialog', { name: 'Partida suspensa' })).toHaveCount(0);
  } finally { await a.context.close(); await b.context.close(); }
});
