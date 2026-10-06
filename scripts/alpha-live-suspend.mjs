/* global localStorage */
// Live: suspend at a safe point → reload both browsers → still SUSPENDED, same seats → host resumes → the game snapshot is exactly the one saved.
import { chromium } from '@playwright/test';
const BASE = process.env.ALPHA_BASE_URL, CODE = process.env.ALPHA_ACCESS_CODE ?? '';
const check = (n, ok, x = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? ' · ' + x : ''}`); if (!ok) process.exitCode = 1; };
const browser = await chromium.launch();
const ctxA = await browser.newContext({ viewport: { width: 1366, height: 768 } }), ctxB = await browser.newContext({ viewport: { width: 1366, height: 768 } });
for (const c of [ctxA, ctxB]) await c.addInitScript(() => { try { localStorage.setItem('aoh-tour-off', '1'); } catch { /* */ } });
const a = await ctxA.newPage(), b = await ctxB.newPage();
const post = (p, body) => p.evaluate(async ([base, x]) => (await fetch(`${base}/api/alpha`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(x) })).json(), [BASE, body]);
const get = (p, id) => p.evaluate(async ([base, i]) => (await fetch(`${base}/api/alpha?gameId=${i}`, { cache: 'no-store' })).json(), [BASE, id]);
try {
  await a.goto(`${BASE}/alpha`); await b.goto(`${BASE}/alpha`);
  const c = await post(a, { operation: 'create', accessCode: CODE, payload: { name: 'Suspend', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 21, planningSeconds: 0 } });
  const id = c.value.id; await post(b, { operation: 'join', accessCode: CODE, code: c.value.joinCode, displayName: 'Beto' });
  let v = (await get(a, id)).value.version;
  for (const [p, civ] of [[a, 'aurelia'], [b, 'valgard']]) { const x = await post(p, { operation: 'lobby', gameId: id, payload: { type: 'CHOOSE_CIVILIZATION', civilization: civ, expectedVersion: v } }); v = x.value.version; const y = await post(p, { operation: 'lobby', gameId: id, payload: { type: 'LOBBY_READY', ready: true, expectedVersion: v } }); v = y.value.version; }
  await post(a, { operation: 'lobby', gameId: id, payload: { type: 'START', expectedVersion: v } });
  for (const p of [a, b]) {
    const g = (await get(p, id)).value.game;
    await post(p, { operation: 'command', gameId: id, payload: { type: 'CHOOSE_AMBITIONS', cardIds: g.self.ambitions.slice(0, 2), expectedVersion: g.version } });
    for (let n = 0; n < 4; n++) { const gg = (await get(p, id)).value.game, ch = gg.self.pendingChoices[0]; if (!ch) break; await post(p, { operation: 'command', gameId: id, payload: { type: 'RESOLVE_CHOICE', choiceId: ch.id, optionId: ch.options[0].id, expectedVersion: gg.version } }); }
  }
  const city = (await get(a, id)).value.game.view.player.civilization.cities[0];
  await post(a, { operation: 'command', gameId: id, payload: { type: 'URBAN_ACTION', cityId: city.id, action: 'PRODUCE', expectedVersion: (await get(a, id)).value.game.version } });
  const before = (await get(a, id)).value;
  const sus = await post(a, { operation: 'room', gameId: id, payload: { type: 'SUSPEND' } });
  check('suspended at a safe point', sus.ok && sus.value.lifecycle === 'SUSPENDED');
  const snap = x => JSON.stringify({ round: x.game.view.round, ver: x.game.version, phase: x.game.phase, res: x.game.self.resources, planned: x.game.self.plannedActions.map(p => p.type + p.action), ev: x.game.events.length, era: x.game.self.era });
  const savedA = snap(before);
  // F5 / new browser: fresh contexts with only the saved sessions
  const stA = await ctxA.storageState(), stB = await ctxB.storageState();
  const n1 = await browser.newContext({ storageState: stA, viewport: { width: 1366, height: 768 } }), n2 = await browser.newContext({ storageState: stB, viewport: { width: 1366, height: 768 } });
  for (const c of [n1, n2]) await c.addInitScript(() => { try { localStorage.setItem('aoh-tour-off', '1'); } catch { /* */ } });
  const pa = await n1.newPage(), pb = await n2.newPage();
  await pa.goto(`${BASE}/alpha?game=${id}`); await pb.goto(`${BASE}/alpha?game=${id}`);
  for (const [who, p] of [['A (host)', pa], ['B', pb]]) { await p.getByRole('dialog', { name: 'Partida suspensa' }).waitFor(); check(`${who}: after reload the table still reads PARTIDA SUSPENSA`, true, (await p.getByRole('dialog', { name: 'Partida suspensa' }).innerText()).replace(/\s+/g, ' ').slice(0, 70)); }
  const ra = (await get(pa, id)).value, rb = (await get(pb, id)).value;
  check('same seats after reload (player-1 host, player-2)', ra.selfPlayerId === 'player-1' && ra.isHost && rb.selfPlayerId === 'player-2' && !rb.isHost);
  check('only the host sees Retomar', (await pa.getByRole('button', { name: 'Retomar' }).count()) === 1 && (await pb.getByRole('button', { name: 'Retomar' }).count()) === 0);
  const refused = await post(pb, { operation: 'command', gameId: id, payload: { type: 'READY', expectedVersion: rb.game.version } });
  check('no Orders while suspended', !refused.ok && refused.error.code === 'SUSPENDED');
  await pa.getByRole('button', { name: 'Retomar' }).click();
  await pa.getByRole('dialog', { name: 'Partida suspensa' }).waitFor({ state: 'detached' }); await pb.getByRole('dialog', { name: 'Partida suspensa' }).waitFor({ state: 'detached' });
  const after = (await get(pa, id)).value;
  check('resumed → ACTIVE for both, no refresh needed on B', after.lifecycle === 'ACTIVE');
  check('game snapshot identical to the one saved at suspension', snap(after) === savedA, `round ${after.game.view.round}, planned ${after.game.self.plannedActions.length}`);
} finally { await browser.close(); }
