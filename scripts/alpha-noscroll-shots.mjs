/* global document, getComputedStyle */
// NO-SCROLL UX checkpoint: opens a 2-seat table on the local playtest server (npm run playtest:human) and, as seat A, visits every
// strategic surface in the viewport under test, taking one capture each and auditing scroll: for every state it lists elements that
// scroll (overflow auto/scroll with hidden content) and elements that CLIP their own content (overflow hidden, content larger).
//   node scripts/alpha-noscroll-shots.mjs [--viewport=1280x720] [--out=docs/evidence/v51b-no-scroll]
import { writeFileSync } from 'node:fs';
import { openTable, shot, clickHex, clickPiece, skipOverlays, OUT, VW, VH } from './alpha-ux-smoke.mjs';
const table = await openTable(), a = table.seats[0].page, report = {};
const audit = page => page.evaluate(() => {
  const out = { scrolls: [], clipped: [], page: document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth + 1 };
  const name = el => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`;
  for (const el of document.querySelectorAll('.alpha-mesa *')) {
    const box = el.getBoundingClientRect(); if (!box.width || !box.height) continue;
    const cs = getComputedStyle(el), over = cs.overflowY, overX = cs.overflowX;
    if ((over === 'auto' || over === 'scroll') && el.scrollHeight > el.clientHeight + 1) out.scrolls.push(`${name(el)} ${el.scrollHeight}>${el.clientHeight}`);
    else if ((over === 'hidden' || over === 'clip') && el.scrollHeight > el.clientHeight + 2 && !el.closest('svg') && !el.classList.contains('alpha-mesa') && !el.closest('.world-column')) out.clipped.push(`${name(el)} ${el.scrollHeight}>${el.clientHeight}`);
    if ((overX === 'auto' || overX === 'scroll') && el.scrollWidth > el.clientWidth + 1 && !el.closest('.alpha-strip') && !el.closest('.alpha-livro-tabs')) out.scrolls.push(`${name(el)} (x) ${el.scrollWidth}>${el.clientWidth}`);
  }
  return out;
});
const note = async (key, file) => { report[key] = await audit(a); await shot(a, `${file ?? key}-${VW}x${VH}`); };
const seg = (scope, name) => a.locator(scope).getByRole('tab', { name, exact: false }).first().click();
await skipOverlays(a);
const openDetails = async tab => {
  const insp = a.locator('.alpha-inspector');
  if (!(await insp.isVisible().catch(() => false))) await a.getByRole('button', { name: 'Detalhes', exact: true }).click();
  await a.locator('.inspector-tabs').getByRole('button', { name: tab, exact: true }).click(); await a.waitForTimeout(250);
};
// 1–3 · city details
await clickHex(a, a.locator('g.hex.owner-1:has(.art-city)')); await a.waitForTimeout(350);
await openDetails('Cidade'); await note('01-cidade-resumo');
await seg('.alpha-frame', 'Produção'); await a.waitForTimeout(250); await note('02-cidade-producao');
await seg('.alpha-frame', 'População'); await a.waitForTimeout(250); await note('03-cidade-populacao');
await seg('.alpha-frame', 'Defesa'); await a.waitForTimeout(250); await note('03b-cidade-defesa');
await seg('.alpha-frame', 'Ações'); await a.waitForTimeout(250); await note('03c-cidade-acoes');
await seg('.alpha-frame .alpha-seg.is-sub', 'Pesquisar'); await a.waitForTimeout(250); await note('03d-cidade-acoes-pesquisar');
// 4 · military stack
await a.keyboard.press('Escape'); await a.waitForTimeout(200);
try { await clickPiece(a, 'g.hex.owner-1'); await a.waitForTimeout(350); await openDetails('Militar'); await note('04-pilha-resumo'); await seg('.alpha-frame', 'Composição'); await a.waitForTimeout(200); await note('04b-pilha-composicao'); await seg('.alpha-frame', 'Suprimento'); await a.waitForTimeout(200); await note('04c-pilha-suprimento'); } catch (e) { report['04-pilha'] = { error: String(e).slice(0, 120) }; }
await a.getByRole('button', { name: 'Fechar cartão' }).click().catch(() => undefined);
// 5 · Cofre
await a.getByRole('button', { name: 'Cofre', exact: true }).click(); await a.waitForTimeout(250); await note('05-cofre-recursos');
await seg('.alpha-cofre', 'Limites'); await a.waitForTimeout(200); await note('05b-cofre-limites');
await a.getByRole('button', { name: 'Fechar', exact: true }).click().catch(() => undefined);
// 6/7 · Tabuleiro (Ressonância + Teia) and Governo
await a.locator('.alpha-strip-civ').click(); await a.waitForTimeout(500); await note('07-tabuleiro-resonancia');
await a.locator('.alpha-node.is-reachable').first().click(); await a.waitForTimeout(300); await note('07b-teia-selecionado');
await seg('.alpha-node-detail', 'Desbloqueia'); await a.waitForTimeout(200); await note('07c-teia-desbloqueia');
await a.getByRole('tab', { name: 'Herança' }).click(); await a.waitForTimeout(250); await note('07d-heranca');
await a.getByRole('tab', { name: 'Identidade e Governo' }).click(); await a.waitForTimeout(250); await note('06a-identidade');
await seg('.alpha-civ-identity', 'Governo'); await a.waitForTimeout(250); await note('06-governo');
await a.keyboard.press('Escape'); await a.waitForTimeout(200);
// 8 · Livro
await a.getByRole('button', { name: 'Livro', exact: true }).click(); await a.waitForTimeout(300); await note('08-livro-conselho');
for (const [tab, file, inner] of [['Cartas & Projetos', '08b-livro-cartas', null], ['Diplomacia', '08c-livro-diplomacia', null], ['Eras & Hegemonia', '08d-livro-eras', null], ['Crônicas', '08e-livro-cronicas', null]]) {
  await a.locator('.alpha-livro-tabs').getByRole('button', { name: tab }).click(); await a.waitForTimeout(250); await note(file);
}
await a.getByRole('button', { name: 'Voltar ao mapa' }).click().catch(() => undefined);
// 9 · mobile city
await a.setViewportSize({ width: 390, height: 844 }); await a.waitForTimeout(400);
await clickHex(a, a.locator('g.hex.owner-1:has(.art-city)')); await a.waitForTimeout(350);
const open = a.getByRole('button', { name: 'Detalhes', exact: true }); if (await open.isVisible().catch(() => false)) await open.click();
await a.locator('.inspector-tabs').getByRole('button', { name: 'Cidade', exact: true }).click().catch(() => undefined); await a.waitForTimeout(250);
await a.screenshot({ path: `${OUT}/09-mobile-cidade-resumo-390x844.png` }); report['09-mobile-resumo'] = await audit(a);
await seg('.alpha-frame', 'População'); await a.waitForTimeout(200); await a.screenshot({ path: `${OUT}/09b-mobile-cidade-populacao-390x844.png` }); report['09b-mobile-populacao'] = await audit(a);
await seg('.alpha-frame', 'Produção'); await a.waitForTimeout(200); await a.screenshot({ path: `${OUT}/09c-mobile-cidade-producao-390x844.png` }); report['09c-mobile-producao'] = await audit(a);
writeFileSync(`${OUT}/audit-${VW}x${VH}.json`, JSON.stringify(report, null, 1));
for (const [k, v] of Object.entries(report)) console.log(k.padEnd(30), v.error ?? `${v.page ? 'PÁGINA ROLA ' : ''}scroll:[${v.scrolls.join('; ')}] cortado:[${v.clipped.join('; ')}]`);
await table.browser.close();
