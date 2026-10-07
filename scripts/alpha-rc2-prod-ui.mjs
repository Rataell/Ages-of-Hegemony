/* global document, localStorage, innerHeight, innerWidth */
// RC2 · production UI smoke for Move + Discovery: a real room (1 human + 1 bot), the Pioneiro's cloud (Mover, Fundar, no Explorar), Mover mode lighting a closed Region.
//   ALPHA_BASE_URL=https://… ALPHA_ACCESS_CODE=… node scripts/alpha-rc2-prod-ui.mjs [--out=docs/evidence/rc2/prod-ui]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const arg = new Map(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const BASE = process.env.ALPHA_BASE_URL, CODE = process.env.ALPHA_ACCESS_CODE ?? '', OUT = String(arg.get('out') ?? 'docs/evidence/rc2/prod-ui');
mkdirSync(OUT, { recursive: true });
const results = []; const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ` · ${extra}` : ''}`); };
const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript(() => { try { localStorage.setItem('aoh-tour-off', '1'); } catch { /* none */ } });
const page = await ctx.newPage(); await page.goto(`${BASE}/alpha`);
const call = body => page.evaluate(async b => { const r = await fetch('/api/alpha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }); return r.json(); }, body);
let r = await call({ operation: 'create', accessCode: CODE, payload: { name: 'UI RC2', displayName: 'Ana', preset: 'STANDARD', seatLimit: 2, seed: 41, planningSeconds: 0, worldPreset: 'MIXED', mapSize: 'COMPACT' } });
const id = r.value.id; let lobby = r.value;
r = await call({ operation: 'lobby', gameId: id, payload: { type: 'ADD_BOT', expectedVersion: lobby.version } }); lobby = r.value;
const civ = ['valgard', 'nymara', 'meridia', 'dravik', 'solenne', 'kor', 'thalos', 'orinth', 'saren', 'aurelia'].find(c => !lobby.seats.some(s => s.civilization === c));
r = await call({ operation: 'lobby', gameId: id, payload: { type: 'CHOOSE_CIVILIZATION', expectedVersion: lobby.version, civilization: civ } }); lobby = r.value;
r = await call({ operation: 'lobby', gameId: id, payload: { type: 'LOBBY_READY', expectedVersion: lobby.version, ready: true } }); lobby = r.value;
await call({ operation: 'lobby', gameId: id, payload: { type: 'START', expectedVersion: lobby.version } });
await page.goto(`${BASE}/alpha?game=${id}`); await page.waitForSelector('svg.world-map');
const later = page.getByRole('button', { name: /Ver o mapa primeiro/ }); if (await later.isVisible().catch(() => false)) await later.click();
await page.waitForTimeout(1200);
// Touch the piece on the capital hex (the Pioneiro stands with the city).
const point = await page.evaluate(() => { for (const hex of document.querySelectorAll('g.hex:has(.art-city)')) { const stack = hex.querySelector('.art-stack.own'); if (!stack) continue; const b = stack.getBoundingClientRect(); for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) { const x = b.left + b.width * i / 12, y = b.top + b.height * j / 12; if (document.elementFromPoint(x, y)?.closest('.art-stack.own') === stack) return { x, y }; } } return null; });
check('own piece found on the capital', !!point);
await page.mouse.click(point.x, point.y); await page.waitForTimeout(500);
const nodes = await page.locator('.ctx-node').evaluateAll(list => list.map(n => n.getAttribute('data-node')));
check('Pioneiro cloud has Mover and Fundar, never Explorar', nodes.includes('move') && nodes.includes('found') && !nodes.includes('explore'), nodes.join(','));
await page.screenshot({ path: `${OUT}/1-pioneer-cloud.png` });
await page.locator('.ctx-node[data-node="move"]').click(); await page.waitForTimeout(500);
const chip = await page.locator('.ctx-chip').innerText().catch(() => '');
const regions = await page.locator('svg.world-map .region-back.is-target').count();
check('Mover lights a closed Region as a place to enter', regions >= 1 && /Mover/.test(chip), `${regions} region(s) · "${chip.replace(/\s+/g, ' ')}"`);
await page.screenshot({ path: `${OUT}/2-move-mode.png` });
// Click a hex of the first highlighted Region: either the order is queued at once or the orientation selector opens.
const target = await page.evaluate(() => { const region = document.querySelector('svg.world-map .region-back.is-target'); if (!region) return null; const b = region.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
if (target) { await page.mouse.click(target.x, target.y); await page.waitForTimeout(600); }
const asked = await page.locator('.table-cloud').filter({ hasText: /Orientação \d+ de \d+/ }).isVisible().catch(() => false);
if (asked) { await page.screenshot({ path: `${OUT}/3-orientation.png` }); await page.getByRole('button', { name: /Confirmar movimento/ }).click(); await page.waitForTimeout(600); }
const planned = await page.getByText(/Mover · descobrir/).first().isVisible().catch(() => false);
check('one Move order is planned "Mover · descobrir"', planned, asked ? 'after choosing an orientation' : 'queued at once');
await page.screenshot({ path: `${OUT}/4-planned.png` });
const scrolls = await page.evaluate(() => document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth + 1);
check('no document scroll', !scrolls);
await browser.close();
process.exit(results.every(Boolean) ? 0 : 1);
