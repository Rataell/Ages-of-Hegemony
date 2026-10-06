// Live persistence + realtime check against a deployed alpha.
//   ALPHA_BASE_URL=https://… ALPHA_ACCESS_CODE=… node scripts/alpha-live-persistence.mjs plan   (create 2p, start, A plans an action, B sees it live; saves sessions)
//   (restart/redeploy the service)
//   ALPHA_BASE_URL=https://… node scripts/alpha-live-persistence.mjs verify                    (both seats come back, same version, planned action still there)
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
const BASE = process.env.ALPHA_BASE_URL, CODE = process.env.ALPHA_ACCESS_CODE ?? '', FILE = process.env.ALPHA_STATE_FILE ?? '/tmp/aoh-live-state.json';
const mode = process.argv[2];
const api = (page, body) => page.evaluate(async ([base, b]) => (await fetch(`${base}/api/alpha`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })).json(), [BASE, body]);
const read = (page, id) => page.evaluate(async ([base, i]) => (await fetch(`${base}/api/alpha?gameId=${i}`, { cache: 'no-store' })).json(), [BASE, id]);
const browser = await chromium.launch();
try {
  if (mode === 'plan') {
    const ca = await browser.newContext(), cb = await browser.newContext(), a = await ca.newPage(), b = await cb.newPage();
    await a.goto(`${BASE}/alpha`); await b.goto(`${BASE}/alpha`);
    const created = await api(a, { operation: 'create', accessCode: CODE, payload: { name: 'Persist', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 77, planningSeconds: 0 } });
    if (!created.ok) throw new Error(JSON.stringify(created));
    const id = created.value.id, join = created.value.joinCode;
    const joined = await api(b, { operation: 'join', accessCode: CODE, code: join, displayName: 'Beto' }); if (!joined.ok) throw new Error(JSON.stringify(joined));
    let v = joined.value.version;
    for (const [p, civ] of [[a, 'aurelia'], [b, 'valgard']]) {
      const c = await api(p, { operation: 'lobby', gameId: id, payload: { type: 'CHOOSE_CIVILIZATION', civilization: civ, expectedVersion: v } }); v = c.value.version;
      const r = await api(p, { operation: 'lobby', gameId: id, payload: { type: 'LOBBY_READY', ready: true, expectedVersion: v } }); v = r.value.version;
    }
    const s = await api(a, { operation: 'lobby', gameId: id, payload: { type: 'START', expectedVersion: v } }); if (!s.ok) throw new Error(JSON.stringify(s));
    // Realtime: B watches the Mesa and must see A's public status change without any refresh.
    await b.goto(`${BASE}/alpha?game=${id}`); await b.locator('.alpha-mesa').waitFor();
    for (const p of [a, b]) {
      const cur = await read(p, id); const g = cur.value.game;
      const r = await api(p, { operation: 'command', gameId: id, payload: { type: 'CHOOSE_AMBITIONS', cardIds: g.self.ambitions.slice(0, 2), expectedVersion: g.version } }); if (!r.ok) throw new Error(JSON.stringify(r));
    }
    for (const p of [a, b]) for (let n = 0; n < 4; n++) { const cur = await read(p, id), g = cur.value.game, ch = g.self.pendingChoices[0]; if (!ch) break; await api(p, { operation: 'command', gameId: id, payload: { type: 'RESOLVE_CHOICE', choiceId: ch.id, optionId: ch.options[0].id, expectedVersion: g.version } }); }
    const cur = await read(a, id), g = cur.value.game, city = g.view.player.civilization.cities[0];
    const plan = await api(a, { operation: 'command', gameId: id, payload: { type: 'URBAN_ACTION', cityId: city.id, action: 'PRODUCE', expectedVersion: g.version } }); if (!plan.ok) throw new Error(JSON.stringify(plan));
    await a.goto(`${BASE}/alpha?game=${id}`); await a.locator('.alpha-mesa').waitFor();
    const ready = await api(a, { operation: 'command', gameId: id, payload: { type: 'READY', expectedVersion: plan.value.game.version } }); if (!ready.ok) throw new Error(JSON.stringify(ready));
    await b.getByText('✓ Pronto').first().waitFor({ timeout: 10000 }); // pushed by SSE, no refresh
    const after = await read(b, id);
    writeFileSync(FILE, JSON.stringify({ id, version: after.value.version, gameVersion: after.value.game.version, round: after.value.game.view.round, a: await ca.storageState(), b: await cb.storageState() }));
    console.log(`PLAN ok: room ${id.slice(0, 8)} version ${after.value.version}; B saw A's "Pronto" live via SSE`);
  } else {
    const st = JSON.parse(readFileSync(FILE, 'utf8'));
    for (const [who, state] of [['A', st.a], ['B', st.b]]) {
      const ctx = await browser.newContext({ storageState: state }), p = await ctx.newPage();
      await p.goto(`${BASE}/alpha?game=${st.id}`); await p.locator('.alpha-mesa').waitFor();
      const r = await read(p, st.id);
      console.log(`VERIFY ${who}: same seat ${r.value.selfPlayerId}, version ${r.value.version} (was ${st.version}), round ${r.value.game.view.round}, A ready=${r.value.game.players.find(x => x.ready) ? 'yes' : 'no'}`);
      if (r.value.version < st.version) throw new Error('state regressed');
    }
  }
} finally { await browser.close(); }
