/* global document, innerHeight, localStorage, setTimeout */
// RC 1.2 visual gate: real tables per size/preset/seat count (1 human + bots), full map at 1280x720.
//   BASE=http://127.0.0.1:3130 node scripts/alpha-rc-shots.mjs [outdir]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:3130', OUT = process.argv[2] ?? 'docs/evidence/rc12/worlds';
mkdirSync(OUT, { recursive: true });
const CHASSIS = ['valgard', 'nymara', 'meridia', 'dravik', 'solenne', 'kor', 'thalos', 'orinth', 'saren', 'aurelia'];
const CASES = [
  ['2p-compacto-misto', 2, 'COMPACT', 'MIXED'], ['4p-padrao-misto', 4, 'STANDARD', 'MIXED'], ['6p-amplo-misto', 6, 'WIDE', 'MIXED'],
  ['4p-padrao-continental', 4, 'STANDARD', 'CONTINENTAL'], ['4p-padrao-arquipelago', 4, 'STANDARD', 'ARCHIPELAGO'], ['4p-padrao-mar-interior', 4, 'STANDARD', 'INLAND_SEA'],
];
const browser = await chromium.launch();
for (const [name, seats, mapSize, worldPreset] of CASES) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const api = (body) => context.request.post(`${BASE}/api/alpha`, { data: body, headers: { Origin: BASE } }).then(r => r.json());
  await context.addInitScript(() => { try { localStorage.setItem('aoh-tour-off', '1'); } catch { /* none */ } });
  let created;
  for (let attempt = 0; attempt < 3; attempt++) { created = await api({ operation: 'create', payload: { name: name, displayName: 'Ana', preset: 'QUICK', seatLimit: seats, seed: 41, planningSeconds: 0, worldPreset, mapSize, revealMap: true } }); if (created.ok || created.error?.code !== 'RATE_LIMIT') break; await new Promise(resolve => setTimeout(resolve, 62000)); }
  if (!created.ok) throw new Error(JSON.stringify(created));
  let view = created.value; const id = view.id;
  for (let i = 1; i < seats; i++) { const r = await api({ operation: 'lobby', gameId: id, payload: { type: 'ADD_BOT', expectedVersion: view.version } }); if (!r.ok) throw new Error(JSON.stringify(r)); view = r.value; }
  const taken = new Set(view.seats.map(s => s.civilization));
  const civ = CHASSIS.find(c => !taken.has(c));
  let r = await api({ operation: 'lobby', gameId: id, payload: { type: 'CHOOSE_CIVILIZATION', expectedVersion: view.version, civilization: civ } }); view = r.value;
  r = await api({ operation: 'lobby', gameId: id, payload: { type: 'LOBBY_READY', expectedVersion: view.version, ready: true } }); view = r.value;
  r = await api({ operation: 'lobby', gameId: id, payload: { type: 'START', expectedVersion: view.version } }); if (!r.ok) throw new Error(JSON.stringify(r));
  // The mandatory first decisions, answered by API so the shot shows the table.
  const read = await context.request.get(`${BASE}/api/alpha?gameId=${id}`).then(x => x.json());
  const g = read.value.game;
  await api({ operation: 'command', gameId: id, payload: { type: 'CHOOSE_AMBITIONS', expectedVersion: g.version, cardIds: g.self.ambitions.slice(0, 2) } });
  for (let k = 0; k < 3; k++) {
    const cur = (await context.request.get(`${BASE}/api/alpha?gameId=${id}`).then(x => x.json())).value.game;
    const choice = cur.self.pendingChoices[0];
    if (!choice) break;
    await api({ operation: 'command', gameId: id, payload: { type: 'RESOLVE_CHOICE', expectedVersion: cur.version, choiceId: choice.id, optionId: choice.options[0].id } });
  }
  const page = await context.newPage();
  await page.goto(`${BASE}/alpha?game=${id}`);
  await page.waitForSelector('svg.world-map', { timeout: 30000 });
  await page.waitForTimeout(1200);
  for (const label of ['Entendi', 'Fechar', 'Pular']) await page.getByRole('button', { name: label }).first().click({ timeout: 500 }).catch(() => undefined);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  const overflow = await page.evaluate(() => document.documentElement.scrollHeight > innerHeight + 1);
  console.log(name, 'regions', (await page.locator('svg.world-map g.hex').count()), 'docScroll', overflow);
  await context.close();
}
await browser.close();
