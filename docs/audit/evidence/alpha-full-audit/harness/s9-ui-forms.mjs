// Entry, creation and lobby through the real UI: every visible option must be accepted; errors must be readable; invite copy; clipboard failure.
import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { BASE, sleep } from './lib.mjs';

const results = [];
const rec = (label, ok, detail = '') => { results.push({ label, ok, detail }); console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ' — ' + detail : ''}`); };
mkdirSync('docs/audit/evidence/alpha-full-audit/screens', { recursive: true });
const browser = await chromium.launch({ headless: true });
const consoleErrors = [];
async function fresh(perms = []) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: perms });
  const page = await context.newPage(); page.setDefaultTimeout(12000);
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => consoleErrors.push(String(e.message).slice(0, 200)));
  await page.goto(`${BASE}/alpha`);
  return { context, page };
}
const until = async (fn, ms = 4000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await fn().catch(() => false)) return true; await sleep(120); } return false; };
const banner = page => page.locator('.alpha-error').first();
// the server allows 20 create/join per minute for everybody: pace the UI too
let last = 0; const pace = async () => { const wait = 3300 - (Date.now() - last); if (wait > 0) await sleep(wait); last = Date.now(); };

console.log('## entry form');
{
  const { context, page } = await fresh();
  const create = page.getByRole('button', { name: 'Criar partida', exact: true }), join = page.getByRole('button', { name: 'Entrar na partida', exact: true });
  rec('empty nickname disables Criar and Entrar', await create.isDisabled() && await join.isDisabled());
  await page.getByLabel('Seu nome', { exact: true }).fill('   ');
  rec('whitespace-only nickname keeps them disabled', await create.isDisabled());
  await page.getByLabel('Seu nome', { exact: true }).fill('A'.repeat(90));
  rec('the nickname field stops at 80 characters', (await page.getByLabel('Seu nome', { exact: true }).inputValue()).length === 80);
  await page.getByLabel('Seu nome', { exact: true }).fill('Zé <b>Ação</b> ✓');
  await page.getByLabel('Código de convite', { exact: true }).fill('   ');
  rec('empty invite code keeps Entrar disabled', await join.isDisabled());
  await page.getByLabel('Código de convite', { exact: true }).fill('codigo-invalido');
  await pace(); await join.click(); await banner(page).waitFor();
  rec('a malformed code shows a readable error', /convite|código/i.test(await banner(page).innerText()), (await banner(page).innerText()).replace(/\s+/g, ' ').slice(0, 100));
  await page.getByLabel('Código de convite', { exact: true }).fill('A'.repeat(22));
  await pace(); await join.click();
  await page.waitForTimeout(600);
  rec('an unknown code shows "Convite não encontrado"', /não encontrado/i.test(await banner(page).innerText()), (await banner(page).innerText()).replace(/\s+/g, ' ').slice(0, 100));
  await page.screenshot({ path: 'docs/audit/evidence/alpha-full-audit/screens/entry-error.png' });
  await context.close();
}

console.log('\n## creation: every option the UI shows is accepted by the server');
{
  const { context, page } = await fresh();
  await page.getByLabel('Seu nome', { exact: true }).fill('Auditoria');
  const selectValues = async label => page.getByLabel(label, { exact: false }).first().locator('option').evaluateAll(o => o.map(x => ({ value: x.value, text: x.textContent })));
  const groups = { Lugares: await selectValues('Lugares'), Duração: await selectValues('Duração'), Mundo: await selectValues('Mundo'), 'Prazo por fase': await selectValues('Prazo por fase') };
  console.log('  options', JSON.stringify(Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.map(o => o.value)]))));
  let ok = 0, bad = [];
  for (const [label, options] of Object.entries(groups)) for (const o of options) {
    await context.clearCookies(); await page.goto(`${BASE}/alpha`); await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByLabel('Seu nome', { exact: true }).fill('Auditoria');
    await page.getByLabel(label, { exact: false }).first().selectOption(o.value);
    await pace(); await page.getByRole('button', { name: 'Criar partida', exact: true }).click();
    const lobby = await page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor({ timeout: 6000 }).then(() => true).catch(() => false);
    if (lobby) ok++; else bad.push(`${label}=${o.value} (${o.text}): ${(await banner(page).innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 80)}`);
  }
  rec(`all ${Object.values(groups).flat().length} visible options create a table`, bad.length === 0, bad.join(' | ') || `${ok} created`);
  rec('no world-size selector is offered (engine has a fixed 30-region board)', !(await page.getByLabel(/tamanho|hex[aá]gonos|regi[õo]es/i).count()));
  await context.close();
}

console.log('\n## lobby, invites and clipboard');
{
  const { context, page } = await fresh(['clipboard-read', 'clipboard-write']);
  await page.getByLabel('Seu nome', { exact: true }).fill('Jogador A');
  await page.getByLabel('Lugares', { exact: false }).selectOption('3');
  await pace(); await page.getByRole('button', { name: 'Criar partida', exact: true }).click();
  await page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
  const code = (await page.locator('.alpha-lobby-heading code').innerText()).trim();
  await page.getByRole('button', { name: 'Copiar código', exact: true }).click();
  rec('Copiar código copies only the code', (await page.evaluate(() => navigator.clipboard.readText())) === code);
  rec('…and shows a confirmation', await page.getByRole('status').filter({ hasText: 'Código copiado' }).isVisible());
  await page.getByRole('button', { name: 'Copiar link', exact: true }).click();
  rec('Copiar link copies /alpha?join=<code>', (await page.evaluate(() => navigator.clipboard.readText())) === `${BASE}/alpha?join=${code}`);
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true }); });
  await page.getByRole('button', { name: 'Copiar código', exact: true }).click(); await page.waitForTimeout(400);
  rec('a failing clipboard shows a readable message', /copiar/i.test(await banner(page).innerText().catch(() => '')), (await banner(page).innerText().catch(() => 'no banner')).replace(/\s+/g, ' ').slice(0, 100));
  // second player through the link
  const b = await fresh();
  await b.page.goto(`${BASE}/alpha?join=${code}`);
  rec('the invite link pre-fills the code', await until(async () => (await b.page.getByLabel('Código de convite', { exact: true }).inputValue()) === code));
  await b.page.getByLabel('Seu nome', { exact: true }).fill('Jogador B'); await pace(); await b.page.getByRole('button', { name: 'Entrar na partida', exact: true }).click();
  await b.page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
  // civilization rules in the UI
  const cards = page.locator('.alpha-civilizations button');
  rec('12 civilization cards are offered', (await cards.count()) === 12);
  await cards.nth(0).click(); await page.waitForTimeout(400);
  await b.page.waitForTimeout(3200);
  rec("the other player sees the taken civilization disabled (no duplicates in the UI)", await b.page.locator('.alpha-civilizations button').nth(0).isDisabled());
  rec('Iniciar partida is hidden from guests', !(await b.page.getByRole('button', { name: 'Iniciar partida', exact: true }).count()));
  rec('host cannot start with fewer than 2 ready players', await page.getByRole('button', { name: 'Iniciar partida', exact: true }).isDisabled());
  await page.getByRole('button', { name: 'Estou pronto', exact: true }).click();
  rec('a ready player cannot change civilization (cards disabled)', await cards.nth(1).isDisabled());
  await page.getByRole('button', { name: 'Voltar à preparação', exact: true }).click();
  rec('"Voltar à preparação" re-enables the choice', await until(() => cards.nth(1).isEnabled()));
  await page.screenshot({ path: 'docs/audit/evidence/alpha-full-audit/screens/lobby-3p.png' });
  // a full table refuses a new person
  const c = await fresh(); await c.page.goto(`${BASE}/alpha?join=${code}`); await c.page.getByLabel('Seu nome', { exact: true }).fill('Jogador C'); await pace(); await c.page.getByRole('button', { name: 'Entrar na partida', exact: true }).click();
  await c.page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
  const d = await fresh(); await d.page.goto(`${BASE}/alpha?join=${code}`); await d.page.getByLabel('Seu nome', { exact: true }).fill('Jogador D'); await pace(); await d.page.getByRole('button', { name: 'Entrar na partida', exact: true }).click();
  await d.page.waitForTimeout(900);
  rec('a fourth person at a 3-seat table gets a readable refusal', /começou|vagas/i.test(await banner(d.page).innerText().catch(() => '')), (await banner(d.page).innerText().catch(() => 'no banner')).replace(/\s+/g, ' ').slice(0, 100));
  await d.page.screenshot({ path: 'docs/audit/evidence/alpha-full-audit/screens/lobby-full-error.png' });
  await context.close();
}
await browser.close();
writeFileSync('docs/audit/evidence/alpha-full-audit/results/s9-ui-forms.json', JSON.stringify({ results, consoleErrors }, null, 1));
console.log(`\n${results.filter(r => r.ok).length}/${results.length} ok; console errors ${consoleErrors.length}`);
if (consoleErrors.length) console.log(consoleErrors.slice(0, 6));
