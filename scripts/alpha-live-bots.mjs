/* global setTimeout */
// Live bots check: node scripts/alpha-live-bots.mjs plan  → restart the service →  node scripts/alpha-live-bots.mjs verify
// plan: 1 human + 2 bots start, the human plays round 1, then the table is SUSPENDED in round 2 and must not move.
// verify (after restart): still SUSPENDED, same 2 bot seats (no duplicate, no replacement), resume → the bots plan and confirm and the round advances.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
const BASE = process.env.ALPHA_BASE_URL, CODE = process.env.ALPHA_ACCESS_CODE ?? '', FILE = '/tmp/aoh-live-bots.json';
const ok = (n, c, x = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${x ? ' · ' + x : ''}`); if (!c) process.exitCode = 1; };
const post = (p, b) => p.evaluate(async ([base, x]) => (await fetch(`${base}/api/alpha`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(x) })).json(), [BASE, b]);
const get = (p, id) => p.evaluate(async ([base, i]) => (await fetch(`${base}/api/alpha?gameId=${i}`, { cache: 'no-store' })).json(), [BASE, id]);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function humanReady(p, id) {
  for (let n = 0; n < 8; n++) {
    const g = (await get(p, id)).value.game, me = g.self;
    if (!me.ambitionsChosen) { await post(p, { operation: 'command', gameId: id, payload: { type: 'CHOOSE_AMBITIONS', cardIds: me.ambitions.slice(0, 2), expectedVersion: g.version } }); continue; }
    const ch = me.pendingChoices[0]; if (ch) { await post(p, { operation: 'command', gameId: id, payload: { type: 'RESOLVE_CHOICE', choiceId: ch.id, optionId: ch.options[0].id, expectedVersion: g.version } }); continue; }
    if (me.ready) return; await post(p, { operation: 'command', gameId: id, payload: { type: 'READY', expectedVersion: g.version } }); return;
  }
}
const browser = await chromium.launch();
try {
  if (process.argv[2] === 'plan') {
    const ctx = await browser.newContext(), a = await ctx.newPage(); await a.goto(`${BASE}/alpha`);
    const c = await post(a, { operation: 'create', accessCode: CODE, payload: { name: 'Bots live', displayName: 'Ana', preset: 'QUICK', seatLimit: 3, seed: 31, planningSeconds: 0 } }); const id = c.value.id;
    for (let i = 0; i < 2; i++) await post(a, { operation: 'lobby', gameId: id, payload: { type: 'ADD_BOT', expectedVersion: (await get(a, id)).value.version } });
    let v = (await get(a, id)).value; ok('2 bots added in the lobby', v.seats.filter(s => s.bot).length === 2 && v.seats.filter(s => s.bot).every(s => s.civilization));
    const free = ['aurelia', 'valgard', 'thalos', 'ironmark', 'kor'].find(x => !v.seats.some(s => s.civilization === x));
    v = (await post(a, { operation: 'lobby', gameId: id, payload: { type: 'CHOOSE_CIVILIZATION', civilization: free, expectedVersion: v.version } })).value;
    v = (await post(a, { operation: 'lobby', gameId: id, payload: { type: 'LOBBY_READY', ready: true, expectedVersion: v.version } })).value;
    const st = await post(a, { operation: 'lobby', gameId: id, payload: { type: 'START', expectedVersion: v.version } }); ok('match starts with 1H + 2B', st.ok && st.value.lifecycle === 'ACTIVE');
    await sleep(4000);
    let g = (await get(a, id)).value.game; ok('bots chose Ambições and are Pronto (server-side)', g.players.filter(p => p.id !== st.value.selfPlayerId).every(p => p.ready));
    await humanReady(a, id); await sleep(4500);
    g = (await get(a, id)).value.game; ok('round 1 resolved, round 2 open', g.view.round === 2, `round ${g.view.round}`);
    await sleep(3500); g = (await get(a, id)).value.game; ok('bots planned and confirmed round 2', g.players.filter(p => !p.ready).length === 1);
    // human resolves any pending choice, then SUSPEND at the safe point
    for (let n = 0; n < 3; n++) { const gg = (await get(a, id)).value.game, ch = gg.self.pendingChoices[0]; if (!ch) break; await post(a, { operation: 'command', gameId: id, payload: { type: 'RESOLVE_CHOICE', choiceId: ch.id, optionId: ch.options[0].id, expectedVersion: gg.version } }); }
    const sus = await post(a, { operation: 'room', gameId: id, payload: { type: 'SUSPEND' } }); ok('suspended', sus.ok && sus.value.lifecycle === 'SUSPENDED');
    const before = (await get(a, id)).value.game.version; await sleep(5000);
    ok('suspended table does not move (bots idle)', (await get(a, id)).value.game.version === before);
    writeFileSync(FILE, JSON.stringify({ id, version: before, state: await ctx.storageState() }));
  } else {
    const st = JSON.parse(readFileSync(FILE, 'utf8')), ctx = await browser.newContext({ storageState: st.state }), a = await ctx.newPage(); await a.goto(`${BASE}/alpha`);
    let v = (await get(a, st.id)); ok('after restart: room loads for the same human', v.ok && v.value.lifecycle === 'SUSPENDED');
    ok('bot seats persisted (2 bots, 1 human, no duplicates)', v.value.seats.length === 3 && v.value.seats.filter(s => s.bot).length === 2 && v.value.seats.filter(s => !s.bot).length === 1 && v.value.isHost);
    await sleep(4000); ok('still no movement while suspended', (await get(a, st.id)).value.game.version === st.version);
    const res = await post(a, { operation: 'room', gameId: st.id, payload: { type: 'RESUME' } }); ok('resumed', res.ok && res.value.lifecycle === 'ACTIVE');
    await sleep(3000);
    await humanReady(a, st.id); await sleep(6000);
    const g = (await get(a, st.id)).value.game; ok('after restart the bots keep playing: round 3 reached, bots Pronto/planning', g.view.round >= 3, `round ${g.view.round}`);
  }
} finally { await browser.close(); }
