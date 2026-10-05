/* global document, window, localStorage, requestAnimationFrame, setTimeout */
// Multi-window shared-table test (2, 4 or 6 seats), DEV ONLY, against `npm run dev:alpha`.
// Every seat is its own Chromium window with its own session. The seats act through the same HTTP boundary the UI uses; the OTHER windows are only
// observed (DOM + the client's own sync log), never refreshed by the script. For each public change we record when the acting window sent it, when the
// server saved it (push `at`), when each other window received the push, and when its DOM showed the change.
//
//   node scripts/alpha-multiwindow.mjs --players=2,4,6 --out=docs/evidence/v51b-shared-table --viewport=1280x720
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const PORT = Number(process.env.ALPHA_LOCAL_PORT ?? 3001), BASE = `http://127.0.0.1:${PORT}`;
const arg = new Map(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const COUNTS = String(arg.get('players') ?? '2').split(',').map(Number), OUT = String(arg.get('out') ?? 'docs/evidence/v51b-shared-table');
const [VW, VH] = String(arg.get('viewport') ?? '1280x720').split('x').map(Number);
const nap = ms => new Promise(r => setTimeout(r, ms));
const LETTERS = 'ABCDEF';
const hits = new Map();
/** The server allows 120 requests a minute per session: stay well under it. */
async function throttle(p, weight) { for (;;) { const now = Date.now(), list = hits.get(p.label) ?? []; hits.set(p.label, list); while (list.length && list[0] < now - 60000) list.shift(); if (list.length + weight <= 80) { for (let i = 0; i < weight; i++) list.push(now); return; } await nap(1200); } }
const room = async p => { await throttle(p, 1); return p.page.evaluate(async () => { const id = localStorage.getItem('aoh-alpha-room'); const j = await (await fetch(`/api/alpha?gameId=${id}`, { cache: 'no-store' })).json(); if (!j.ok) throw new Error(JSON.stringify(j.error)); return j.value; }); };
const cmd = async (p, payload) => {
  await throttle(p, 2);
  const sentAt = Date.now();
  const res = await p.page.evaluate(async payload => {
    const id = localStorage.getItem('aoh-alpha-room'); const rr = await (await fetch(`/api/alpha?gameId=${id}`, { cache: 'no-store' })).json();
    if (!rr.ok) return { ok: false, text: 'ROOM ' + JSON.stringify(rr.error) };
    const r = await (await fetch('/api/alpha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operation: 'command', gameId: id, payload: { ...payload, expectedVersion: rr.value.game.version, ...(payload.type === 'MANAGE' ? { command: { ...payload.command, expectedVersion: rr.value.game.version } } : {}) } }) })).json();
    return { ok: r.ok, text: r.ok ? 'ok' : `${r.error.code}: ${r.error.message}`, version: r.ok ? r.value.version : null };
  }, payload);
  return { ...res, sentAt, doneAt: Date.now() };
};
const shotsOf = [];
const dismiss = async p => { for (const name of [/Ver o mapa primeiro/, /Pular tour/, /^Continuar$/]) { const b = p.page.getByRole('button', { name }).first(); if (await b.isVisible().catch(() => false)) await b.click().catch(() => undefined); } };
/** Resolves in the page with Date.now() the first animation frame in which `test()` holds. */
const observe = (p, source, arg, timeout = 9000) => p.page.evaluate(({ source, arg, timeout }) => new Promise(resolve => { const test = new Function('arg', `return (${source});`); const end = Date.now() + timeout; const tick = () => { if (test(arg)) resolve(Date.now()); else if (Date.now() > end) resolve(null); else requestAnimationFrame(tick); }; tick(); }), { source, arg, timeout });
const regionBacks = p => p.page.evaluate(() => document.querySelectorAll('svg.world-map .region-back').length);
const syncLog = p => p.page.evaluate(() => (window.__aohSync ?? []).slice());
const present = (p, query) => p.page.evaluate(q => !!document.querySelector(q), query);
const sel = id => `svg.world-map g.hex[aria-label$=" ${id}"], svg.world-map g.hex[aria-label*=" ${id},"]`;

async function run(count) {
  const dir = `${OUT}/${count}p`; mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const players = [];
  for (let i = 0; i < count; i++) {
    const context = await browser.newContext({ viewport: { width: VW, height: VH } });
    await context.addInitScript(() => { try { localStorage.setItem('aoh-tour-off', '1'); } catch { /* storage unavailable */ } });
    const page = await context.newPage(); page.setDefaultTimeout(20000);
    players.push({ page, label: `Jogador ${LETTERS[i]}`, letter: LETTERS[i], index: i });
  }
  const shot = async (p, name) => { const file = `${name}.png`; await p.page.screenshot({ path: `${dir}/${file}` }); shotsOf.push(`${count}p/${file}`); return file; };
  const [host, ...guests] = players;
  await Promise.all(players.map(async p => { await p.page.goto(`${BASE}/alpha`); await p.page.getByLabel('Seu nome', { exact: true }).fill(p.label); }));
  await host.page.getByLabel('Lugares', { exact: false }).selectOption(String(count));
  await host.page.getByRole('button', { name: 'Criar partida', exact: true }).click();
  await host.page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
  const code = (await host.page.locator('.alpha-lobby-heading code').innerText()).trim();
  for (const g of guests) { await g.page.goto(`${BASE}/alpha?join=${code}`); await g.page.getByLabel('Seu nome', { exact: true }).fill(g.label); await g.page.getByRole('button', { name: 'Entrar na partida', exact: true }).click(); await g.page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor(); }
  for (const p of players) { await p.page.locator('.alpha-civilizations button').nth(p.index).click(); await p.page.getByRole('button', { name: 'Estou pronto', exact: true }).click(); }
  const started = Date.now();
  await host.page.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
  await host.page.locator('.world-map').waitFor();
  // 1 · the first second inside the match, before anything is dismissed
  await shot(host, '01-primeiro-segundo');
  await Promise.all(players.map(p => p.page.locator('.world-map').waitFor()));
  const result = { players: count, viewport: `${VW}x${VH}`, startedAfterMs: Date.now() - started, events: [], notes: [] };
  for (const p of players) await dismiss(p);
  await shot(host, '02-mesa-inteira-tudo-oculto'); await shot(guests[0] ?? host, '03-patrias-dos-outros');
  // Mesa / Focar
  await host.page.locator('.map-tools').getByRole('button', { name: 'Focar' }).click(); await nap(300); await shot(host, '10-visao-foco');
  await host.page.locator('.map-tools').getByRole('button', { name: 'Mesa' }).click(); await nap(300); await shot(host, '09-visao-mesa');
  // 6 · inspector open must not move the map: compare the position of one hex
  const probeBefore = await host.page.locator('svg.world-map g.hex').first().boundingBox();
  await host.page.locator('svg.world-map g.hex').nth(40).click({ force: true }).catch(() => undefined); await nap(400);
  const probeAfter = await host.page.locator('svg.world-map g.hex').first().boundingBox();
  result.inspectorShift = probeBefore && probeAfter ? Math.hypot(probeBefore.x - probeAfter.x, probeBefore.y - probeAfter.y) : null;
  await shot(host, '06-inspector-aberto-sem-deslocar');
  // the round: choices first
  async function prepare(p) {
    let r = await room(p), g = r.game;
    if (!g.self.ambitionsChosen && g.self.ambitions.length >= 2) await cmd(p, { type: 'CHOOSE_AMBITIONS', cardIds: g.self.ambitions.slice(0, 2) });
    g = (await room(p)).game;
    if (g.worldEvent && g.worldDecisionPending) await cmd(p, { type: 'WORLD_CHOICE', choice: 'RESOURCE' });
    for (const choice of (await room(p)).game.self.pendingChoices ?? []) await cmd(p, { type: 'RESOLVE_CHOICE', choiceId: choice.id, optionId: choice.options[0].id });
  }
  for (const p of players) await prepare(p);
  // ---- Round 1: every seat explores a closed Region at the same time ----
  const mine = async p => { const g = (await room(p)).game; return { g, me: (await room(p)).selfPlayerId, units: g.units.filter(u => u.ownerId === (g.view.player.id)) }; };
  const planned = [];
  for (const p of players) {
    const { g, units } = await mine(p);
    const unit = units.find(u => u.kind === 'PIONEER' && g.unitOptions[u.id]?.explore.length);
    if (!unit) { result.notes.push(`${p.letter}: no explore option at the start`); continue; }
    const target = g.unitOptions[unit.id].explore[0];
    const res = await cmd(p, { type: 'QUEUE_ORDER', order: { id: `explore-${p.letter}`, type: 'EXPLORE', unitId: unit.id, target: target.target, rotation: 0 } });
    planned.push({ p, unit, target, res });
  }
  const before = await Promise.all(players.map(regionBacks));
  await shot(guests[0] ?? host, '05a-antes-da-regiao-virar');
  // observers: every window waits for its own count of face-down pieces to drop by the number of explored Regions
  const need = planned.filter(x => x.res.ok).length;
  const watchers = players.map((p, i) => observe(p, '(()=>document.querySelectorAll("svg.world-map .region-back").length<=arg)()', before[i] - need));
  // all but the last confirm first; the last READY triggers the simultaneous resolution
  const readyAll = async () => { let last = null; for (const p of players) { last = await cmd(p, { type: 'READY' }); last.p = p; } return last; };
  const lastReady = await readyAll();
  const seen = await Promise.all(watchers);
  await nap(500);
  const logs = await Promise.all(players.map(syncLog));
  const pushOf = (log, version) => log.find(e => e.kind === 'push' && e.version === version);
  const appliedOf = (log, version) => log.find(e => e.kind === 'applied' && e.version >= version);
  players.forEach((p, i) => {
    const push = pushOf(logs[i], lastReady.version), applied = appliedOf(logs[i], lastReady.version);
    result.events.push({ change: `${need} Região(ões) virada(s) na resolução da rodada 1`, observer: p.letter, sentToSeenMs: seen[i] ? seen[i] - lastReady.sentAt : null, serverSavedToPushMs: push ? push.t - push.serverAt : null, pushToAppliedMs: push && applied ? applied.t - push.t : null, receivedPushToSeenMs: push && seen[i] ? seen[i] - push.t : null, serverSavedToSeenMs: push && seen[i] ? seen[i] - push.serverAt : null });
  });
  await shot(guests[0] ?? host, '05b-regiao-virou-nos-outros'); await shot(host, '08-mapa-parcialmente-descoberto');
  result.regionBacksBefore = before; result.regionBacksAfter = await Promise.all(players.map(regionBacks));
  // ---- Round 2: each seat moves the Pioneiro into the Region it just revealed; everyone must see the piece ----
  for (const p of players) await prepare(p);
  const moves = [];
  for (const p of players) {
    const { g, units } = await mine(p);
    const unit = units.find(u => u.kind === 'PIONEER' && g.unitOptions[u.id]);
    const options = unit ? g.unitOptions[unit.id].moves : {};
    const region = g.board.find(r => !r.closed && r.homeOf === null && r.hexIds.some(id => options[id]));
    const taken = new Set(g.units.map(u => u.hexId));
    const dest = region ? region.hexIds.filter(id => options[id] && !taken.has(id)).sort((a, b) => options[b].length - options[a].length)[0] : null;
    if (!unit || !dest) { result.notes.push(`${p.letter}: no move into a public Region in round 2`); continue; }
    const res = await cmd(p, { type: 'QUEUE_ORDER', order: { id: `move-${p.letter}`, type: 'MOVE', unitIds: [unit.id], path: options[dest] } });
    moves.push({ p, unit, dest, res });
  }
  const ok2 = moves.filter(m => m.res.ok);
  const stackQuery = m => `${sel(m.dest).split(', ').map(x => `${x} .art-stack`).join(', ')}`;
  const baseline2 = await Promise.all(players.map(p => Promise.all(ok2.map(m => present(p, stackQuery(m))))));
  const watch2 = players.map(p => Promise.all(ok2.map(m => observe(p, `!!document.querySelector(arg)`, stackQuery(m)))));
  const last2 = await readyAll();
  const seen2 = await Promise.all(watch2);
  await nap(400);
  const logs2 = await Promise.all(players.map(syncLog));
  players.forEach((p, i) => { const push = pushOf(logs2[i], last2.version); result.events.push({ change: `${ok2.length} Pioneiro(s) moveram para Regiões públicas (todos veem)`, observer: p.letter, validBaseline: baseline2[i].every(v => !v), sentToSeenMs: seen2[i].every(Boolean) ? Math.max(...seen2[i]) - last2.sentAt : null, serverSavedToPushMs: push ? push.t - push.serverAt : null, serverSavedToSeenMs: push && seen2[i].every(Boolean) ? Math.max(...seen2[i]) - push.serverAt : null, seen: seen2[i].filter(Boolean).length + '/' + ok2.length }); });
  await shot(guests[0] ?? host, '07-peças-movidas-vistas-por-todos');
  // ---- Round 3: whoever can, founds a city (an immediate command): everyone must see it appear ----
  for (const p of players) await prepare(p);
  let founded = null;
  for (const p of players) {
    const { g, units } = await mine(p);
    const unit = units.find(u => u.kind === 'PIONEER' && g.unitOptions[u.id]?.settleBlock === null);
    if (!unit) continue;
    const others = players.filter(o => o !== p);
    const hex = unit.hexId, cityQuery = `${sel(hex).split(', ').map(x => `${x} .city-anchor`).join(', ')}`;
    const baseline3 = await Promise.all(others.map(o => present(o, cityQuery))), probes = others.map(o => observe(o, `!!document.querySelector(arg)`, cityQuery, 6000));
    const res = await cmd(p, { type: 'SETTLE', unitId: unit.id, name: `Posto ${p.letter}` });
    if (!res.ok) { result.notes.push(`${p.letter}: SETTLE refused: ${res.text}`); continue; }
    const seenFound = await Promise.all(probes); await nap(300);
    const log = await Promise.all(others.map(syncLog));
    others.forEach((o, i) => { const push = pushOf(log[i], res.version); result.events.push({ change: `${p.letter} fundou um Posto`, observer: o.letter, validBaseline: !baseline3[i], sentToSeenMs: seenFound[i] ? seenFound[i] - res.sentAt : null, serverSavedToPushMs: push ? push.t - push.serverAt : null, serverSavedToSeenMs: push && seenFound[i] ? seenFound[i] - push.serverAt : null }); });
    founded = p; await shot(others[0] ?? host, '04-nova-cidade-nos-outros'); break;
  }
  if (!founded) result.notes.push('nobody could found a city in round 3 (distance/cost): not measured here');
  const crash = await Promise.all(players.map(p => p.page.evaluate(() => document.querySelectorAll('.alpha-error, [role="alert"]').length)));
  result.alertsOnScreen = crash;
  const all = result.events.filter(e => e.validBaseline !== false).map(e => e.serverSavedToSeenMs).filter(v => typeof v === 'number');
  result.summary = { samples: all.length, meanServerSavedToSeenMs: all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : null, maxServerSavedToSeenMs: all.length ? Math.max(...all) : null };
  await browser.close();
  writeFileSync(`${dir}/latency.json`, JSON.stringify(result, null, 1));
  console.log(`${count}p`, JSON.stringify(result.summary), 'inspectorShift', result.inspectorShift, 'notes', result.notes.join(' | '));
  return result;
}
mkdirSync(OUT, { recursive: true });
const all = [];
for (const count of COUNTS) all.push(await run(count));
writeFileSync(`${OUT}/latency-${VW}x${VH}.json`, JSON.stringify(all, null, 1));
