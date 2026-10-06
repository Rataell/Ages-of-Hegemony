// Interaction Model V2 checkpoint (A–H). Needs the local server started with `npm run playtest:human` (forced contact puts a Pioneiro next to a
// closed Region, so Explorar is live from round 1). Two seats are opened; this script drives seat A through the real UI by clicks and keeps the
// metrics that matter: the page never scrolls (document height/width = viewport), whatever is open.
//   node scripts/alpha-ux-checkpoint.mjs [--viewport=1280x720] [--out=docs/evidence/v51b-interaction-v2]
import { writeFileSync } from 'node:fs';
import { openTable, shot, clickHex, clickPiece, skipOverlays, readState, OUT, VW, VH } from './alpha-ux-smoke.mjs';
const table = await openTable(), a = table.seats[0].page, log = {};
const note = async (key, extra = {}) => { const st = await readState(a); log[key] = { ...st, ...extra, pageScrolls: st.scrollH > st.innerH || st.scrollW > st.innerW }; };
await skipOverlays(a);

// A · city
await clickHex(a, a.locator('g.hex.owner-1:has(.art-city)')); await a.waitForTimeout(350); await note('A-city'); await shot(a, `A-city-${VW}x${VH}`);
await a.locator('.ctx-node[data-node="BUILD"]').click(); await a.waitForTimeout(300); await note('A2-city-build'); await shot(a, `A2-city-build-${VW}x${VH}`);
await a.keyboard.press('Escape'); await a.keyboard.press('Escape'); await a.waitForTimeout(250);
// B · Pioneiro (the scout next to the closed Region)
await clickPiece(a, 'g.hex:not(.owner-1)'); await a.waitForTimeout(350); await note('B-pioneer'); await shot(a, `B-pioneer-${VW}x${VH}`);
// E · Explorar (the map shows the Region)
await a.locator('.ctx-node[data-node="explore"]').click(); await a.waitForTimeout(350); await note('E-explore'); await shot(a, `E-explore-${VW}x${VH}`);
await a.keyboard.press('Escape'); await a.waitForTimeout(250);
// D · Mover (destinations on the map)
await a.locator('.ctx-node[data-node="move"]').click(); await a.waitForTimeout(350); await note('D-move'); await shot(a, `D-move-${VW}x${VH}`);
await a.keyboard.press('Escape'); await a.keyboard.press('Escape'); await a.waitForTimeout(250);
// C · military stack (the Guarda/army that stands in the city)
await clickPiece(a, 'g.hex.owner-1'); await a.waitForTimeout(300);
const army = a.locator('.ctx-tabs button', { hasText: 'Militares' }); if (await army.count()) await army.click();
await a.waitForTimeout(300); await note('C-army'); await shot(a, `C-army-${VW}x${VH}`);
await a.keyboard.press('Escape'); await a.waitForTimeout(200);
// Detalhes (inspector) and the hand must not make the page scroll either
await a.getByRole('button', { name: 'Detalhes', exact: true }).click(); await a.waitForTimeout(300); await note('H-details-open'); await shot(a, `H-details-${VW}x${VH}`);
await a.getByRole('button', { name: 'Fechar cartão' }).click().catch(() => undefined);
// G · Tabuleiro (Ressonância) and F · Teia, both as glass layers
await a.locator('.alpha-strip-civ').click(); await a.waitForTimeout(500); await note('G-civ'); await shot(a, `G-resonance-${VW}x${VH}`);
await a.locator('.alpha-node.is-reachable').first().click(); await a.waitForTimeout(350); await note('F-teia-focus'); await shot(a, `F-teia-${VW}x${VH}`);
await a.getByRole('tab', { name: 'Identidade e Governo' }).click(); await a.waitForTimeout(250); await note('G2-governo'); await shot(a, `G2-governo-${VW}x${VH}`);
await a.keyboard.press('Escape'); await a.waitForTimeout(200);
await a.getByRole('button', { name: 'Livro', exact: true }).click(); await a.waitForTimeout(300); await note('G3-livro'); await shot(a, `G3-livro-${VW}x${VH}`);
writeFileSync(`${OUT}/checkpoint-${VW}x${VH}.json`, JSON.stringify(log, null, 1));
const scrolling = Object.entries(log).filter(([, v]) => v.pageScrolls).map(([k]) => k);
console.log(scrolling.length ? `PÁGINA ROLA em: ${scrolling.join(', ')}` : 'zero scroll global em todos os estados');
await table.browser.close();
process.exit(scrolling.length ? 1 : 0);
