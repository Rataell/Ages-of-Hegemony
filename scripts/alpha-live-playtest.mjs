/* global document, localStorage, setTimeout, innerHeight */
// Live playtest of a deployed alpha: 1 human seat played by a small client policy THROUGH THE PUBLIC API (exactly what the UI sends) + bots.
// It is a playtest harness, not a bot: it only reads what the human seat can read (the player view) and sends the same commands the UI sends.
//   ALPHA_BASE_URL=https://… ALPHA_ACCESS_CODE=… node scripts/alpha-live-playtest.mjs --name=padrao-misto --world=MIXED --size=STANDARD --bots=3 --rounds=14
//   add --naval to prioritise Distrito Marítimo, a vessel and sea exploration.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const arg = new Map(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const BASE = process.env.ALPHA_BASE_URL, CODE = process.env.ALPHA_ACCESS_CODE ?? '';
const NAME = String(arg.get('name') ?? 'playtest'), WORLD = String(arg.get('world') ?? 'MIXED'), SIZE = String(arg.get('size') ?? 'STANDARD');
const BOTS = Number(arg.get('bots') ?? 3), ROUNDS = Number(arg.get('rounds') ?? 14), NAVAL = arg.has('naval'), CIV = String(arg.get('civ') ?? 'valgard');
const OUT = `docs/evidence/rc2/playtest-${NAME}`; mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = { name: NAME, world: WORLD, size: SIZE, bots: BOTS, naval: NAVAL, rounds: [], findings: [], rejected: {} };
const finding = (kind, text) => { log.findings.push({ kind, text }); console.log(`[${kind}] ${text}`); };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript(() => { try { localStorage.setItem('aoh-tour-off', '1'); } catch { /* none */ } });
const page = await ctx.newPage(); const consoleErrors = [];
page.on('pageerror', e => consoleErrors.push(String(e).slice(0, 200)));
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
await page.goto(`${BASE}/alpha`);
const call = async body => { for (let i = 0; i < 4; i++) { const r = await page.evaluate(async ([b]) => { const x = await fetch('/api/alpha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }); return { status: x.status, ...(await x.json()) }; }, [body]); if (r?.error?.code === 'RATE_LIMIT') { await sleep(63000); continue; } return r; } };
const read = async id => (await page.evaluate(async i => (await fetch(`/api/alpha?gameId=${i}`, { cache: 'no-store' })).json(), id)).value;
const send = async (id, g, payload, tag) => {
  const r = await call({ operation: 'command', gameId: id, payload: { expectedVersion: g.version, ...payload } });
  if (r.status >= 500) finding('BLOCKER', `HTTP ${r.status} on ${payload.type} ${tag ?? ''}: ${JSON.stringify(r.error ?? r).slice(0, 160)}`);
  if (!r.ok) { const k = `${payload.type}:${r.error?.message ?? r.error?.code}`.slice(0, 120); log.rejected[k] = (log.rejected[k] ?? 0) + 1; }
  return r;
};
const CHASSIS = ['valgard', 'nymara', 'meridia', 'dravik', 'solenne', 'kor', 'thalos', 'orinth', 'saren', 'aurelia'];

// ---- lobby
let r = await call({ operation: 'create', accessCode: CODE, payload: { name: `Playtest ${NAME}`, displayName: 'Ana', preset: 'STANDARD', seatLimit: BOTS + 1, seed: Number(arg.get('seed') ?? 77), planningSeconds: 0, worldPreset: WORLD, mapSize: SIZE } });
if (!r.ok) { finding('BLOCKER', `create failed ${JSON.stringify(r.error)}`); process.exit(1); }
const id = r.value.id; let lobby = r.value;
for (let i = 0; i < BOTS; i++) { r = await call({ operation: 'lobby', gameId: id, payload: { type: 'ADD_BOT', expectedVersion: lobby.version } }); if (!r.ok) finding('BLOCKER', `ADD_BOT ${JSON.stringify(r.error)}`); else lobby = r.value; }
const civ = CHASSIS.includes(CIV) && !lobby.seats.some(s => s.civilization === CIV) ? CIV : CHASSIS.find(c => !lobby.seats.some(s => s.civilization === c));
r = await call({ operation: 'lobby', gameId: id, payload: { type: 'CHOOSE_CIVILIZATION', expectedVersion: lobby.version, civilization: civ } }); lobby = r.value;
r = await call({ operation: 'lobby', gameId: id, payload: { type: 'LOBBY_READY', expectedVersion: lobby.version, ready: true } }); lobby = r.value;
r = await call({ operation: 'lobby', gameId: id, payload: { type: 'START', expectedVersion: lobby.version } });
if (!r.ok) { finding('BLOCKER', `START failed ${JSON.stringify(r.error)}`); process.exit(1); }
await page.goto(`${BASE}/alpha?game=${id}`); await page.waitForSelector('svg.world-map', { timeout: 30000 });
console.log(`room ${id} · ${WORLD} ${SIZE} · ${BOTS + 1} seats · civ ${civ}`);

// ---- policy
const dist = (a, b) => { const [aq, ar] = a.split(',').map(Number), [bq, br] = b.split(',').map(Number); return (Math.abs(aq - bq) + Math.abs(ar - br) + Math.abs(aq + ar - bq - br)) / 2; };
const URBAN_ORDER = NAVAL
  ? [['RESEARCH', o => o.advancementId === 'web-coastal-navigation'], ['BUILD', o => o.build?.kind === 'MARITIME'], ['RECRUIT', o => o.unit === 'COASTAL_VESSEL' && vessels < 2], ['ELEVATE'], ['BUILD', o => o.build?.district === 'AGRARIAN'], ['RESEARCH', o => o.advancementId === 'web-agriculture'], ['RESEARCH'], ['PRODUCE']]
  : [['ELEVATE'], ['BUILD', o => o.build?.district === 'AGRARIAN'], ['RESEARCH', o => ['web-agriculture', 'web-writing', 'web-masonry', 'web-exchange'].includes(o.advancementId)], ['BUILD', o => o.build?.kind === 'BUILDING' && ['GRANARY', 'LIBRARY', 'MARKET'].includes(o.build.building)], ['RECRUIT', o => o.unit === 'GUARD'], ['RESEARCH'], ['PRODUCE']];
let orderSeq = 0, vessels = 0;
async function playRound(g) {
  const me = g.self, notes = [];
  // mandatory decisions
  if (!me.ambitionsChosen) { await send(id, g, { type: 'CHOOSE_AMBITIONS', cardIds: me.ambitions.slice(0, 2) }); g = (await read(id)).game; }
  for (let k = 0; k < 4; k++) { const ch = g.self.pendingChoices[0]; if (!ch) break; await send(id, g, { type: 'RESOLVE_CHOICE', choiceId: ch.id, optionId: ch.options[0].id }); g = (await read(id)).game; }
  if (g.worldDecisionPending) { await send(id, g, { type: 'WORLD_CHOICE', choice: 'RESOURCE' }); g = (await read(id)).game; }
  if (g.phase !== 'PLANNING' || g.self.ready) return g;
  const before = vessels; vessels = g.units.filter(u => u.ownerId === g.self.playerId && ['FLEET', 'COASTAL_VESSEL'].includes(u.kind)).length;
  if (vessels < before) finding('WORLD', `vessel lost before round ${g.view.round}: ${(g.events ?? []).slice(-6).map(e => e.message).join(' / ').slice(0, 300)}`);
  const closedHexes = g.board.filter(x => x.closed).flatMap(x => x.hexIds);
  const mine = g.units.filter(u => u.ownerId === g.self.playerId && !u.carrierId);
  // explorers: Pioneiros (land) and any vessel (sea)
  for (const u of mine.filter(x => ['PIONEER', 'FLEET', 'COASTAL_VESSEL'].includes(x.kind))) {
    g = (await read(id)).game; const o = g.unitOptions[u.id]; if (!o) continue;
    // --naval keeps the second Pioneiro for the sea: it boards the first vessel instead of founding.
    const founder = !NAVAL && u.kind === 'PIONEER' && mine.filter(x => x.kind === 'PIONEER').indexOf(u) === 1;
    const seaPioneer = NAVAL && u.kind === 'PIONEER' && (arg.has('sea-only') || mine.filter(x => x.kind === 'PIONEER').indexOf(u) === 1);
    if (seaPioneer && o.embark?.length) { const x = await send(id, g, { type: 'EMBARK', unitIds: [u.id], fleetId: o.embark[0] }, 'PIONEER boards a ship (naval playtest)'); if (x.ok) { notes.push('EMBARK'); continue; } }
    if (seaPioneer) { notes.push('PIONEER (sea) waits for a ship'); continue; }
    // A ship opens a Region only with a Pioneiro aboard (or Navegação Oceânica): without a discoverer it keeps its naval work.
    if (u.kind !== 'PIONEER' && !o.discoverer) { if (o.frontierNote) notes.push(`${u.kind}: ${o.frontierNote}`); continue; }
    if (founder && o.settleBlock === null && g.cityStates.length < 4) { const x = await send(id, g, { type: 'SETTLE', unitId: u.id, name: `Colônia ${g.view.round}-${u.id.slice(-2)}` }); if (x.ok) { notes.push('SETTLE'); continue; } }
    // Move + Discovery (RC2): discovery is a MOVE whose last step enters a closed Region and carries the orientation.
    const open = (o.frontier ?? []).filter(r => r.block === null && r.entries.length).map(r => ({ r, e: [...r.entries].sort((a, b) => a.path.length - b.path.length || a.hexId.localeCompare(b.hexId))[0] })).sort((a, b) => a.e.path.length - b.e.path.length);
    if (open.length) { const { e } = open[0]; const x = await send(id, g, { type: 'QUEUE_ORDER', order: { id: `pt-${++orderSeq}`, type: 'MOVE', unitIds: [u.id], path: e.path, rotation: e.rotations[0] } }, `${u.kind} move into the unknown (${e.rotations.length} orientations)`); if (x.ok) { notes.push(`DISCOVER ${u.kind}`); continue; } }
    else if ((o.frontier ?? []).some(e => e.block)) notes.push(`${u.kind}: ${o.frontier.find(e => e.block).block}`);
    else if (o.frontierNote) notes.push(`${u.kind}: ${o.frontierNote}`);
    // A Pioneiro next to an own ship boards it when no Region is open to it on foot: the ship then carries the Discovery.
    if (u.kind === 'PIONEER' && !seaPioneer && !open.length && o.embark?.length && (NAVAL || (o.frontier ?? []).some(e => e.block))) { const x = await send(id, g, { type: 'EMBARK', unitIds: [u.id], fleetId: o.embark[0] }, 'PIONEER boards a ship'); if (x.ok) { notes.push('EMBARK'); continue; } }
    if (u.kind === 'PIONEER' && o.settleBlock === null && g.cityStates.length < 5) { const x = await send(id, g, { type: 'SETTLE', unitId: u.id, name: `Colônia ${g.view.round}` }); if (x.ok) { notes.push('SETTLE'); continue; } }
    if (closedHexes.length) {
      const here = u.hexId, water = u.kind !== 'PIONEER', terrain = Object.fromEntries((g.view.visibleTerritory ?? []).map(t => [t.id, t.terrain]));
      // A vessel sails to the navigable hex nearest a closed Region; a Pioneiro walks toward one over land.
      const goal = closedHexes.reduce((best, h) => (dist(here, h) < dist(here, best) ? h : best), closedHexes[0]);
      const ok = h => (water ? ['SEA', 'COAST'].includes(terrain[h]) : !['SEA', 'UNKNOWN'].includes(terrain[h] ?? 'PLAINS'));
      const step = Object.keys(o.moves).filter(ok).map(h => ({ h, d: dist(h, goal) })).filter(x => x.d < dist(here, goal)).sort((a, b) => a.d - b.d)[0];
      if (step) { const x = await send(id, g, { type: 'QUEUE_ORDER', order: { id: `pt-${++orderSeq}`, type: 'MOVE', unitIds: [u.id], path: o.moves[step.h] } }); if (x.ok) notes.push(`MOVE ${u.kind}`); }
    }
  }
  // cities: one urban action each, by priority
  g = (await read(id)).game;
  for (const city of g.cityStates) {
    g = (await read(id)).game; const list = [...(g.urban.cities[city.cityId] ?? []), ...(g.urban.research ?? [])];
    for (const [action, test] of URBAN_ORDER) {
      const opt = list.find(o => o.action === action && !o.blocked && (!test || test(o)));
      if (!opt) continue;
      const payload = { type: 'URBAN_ACTION', cityId: city.cityId, action, ...(opt.build ? { build: opt.build } : {}), ...(opt.unit ? { unit: opt.unit } : {}), ...(opt.advancementId ? { advancementId: opt.advancementId } : {}) };
      const x = await send(id, g, payload, `${action}${opt.advancementId ? ' ' + opt.advancementId : ''}${opt.build ? ' ' + (opt.build.district ?? opt.build.building ?? opt.build.kind) : ''}${opt.unit ? ' ' + opt.unit : ''}`);
      if (x.ok) { notes.push(`${action}${opt.advancementId ? ':' + opt.advancementId : ''}${opt.build ? ':' + (opt.build.district ?? opt.build.building ?? opt.build.kind) : ''}${opt.unit ? ':' + opt.unit : ''}`); break; }
    }
  }
  g = (await read(id)).game;
  const ready = await send(id, g, { type: 'READY' }); if (!ready.ok) notes.push(`READY refused: ${ready.error?.message}`);
  log.rounds.push({ round: g.view.round, era: g.self.era, notes });
  return g;
}

const t0 = Date.now(); let lastRound = 0, stall = 0;
for (let step = 0; step < ROUNDS * 40 && Date.now() - t0 < 25 * 60 * 1000; step++) {
  const g = (await read(id)).game;
  if (g.winner) { finding('RULE', `match ended: ${JSON.stringify(g.winner).slice(0, 120)}`); break; }
  const round = g.view.round;
  if (round > ROUNDS) break;
  if (g.phase === 'PLANNING' && !g.self.ready) {
    stall = 0;
    if (round !== lastRound) lastRound = round;
    await playRound(g);
    if (round % 3 === 1 || round === ROUNDS) { await page.waitForTimeout(800); await page.screenshot({ path: `${OUT}/round-${String(round).padStart(2, '0')}.png` }); }
    if (await page.evaluate(() => document.documentElement.scrollHeight > innerHeight + 1)) finding('UX', `document scrolls at round ${round}`);
  } else if (g.phase === 'ERA_TURN' && !g.self.ready) {
    for (let k = 0; k < 4; k++) { const cur = (await read(id)).game; const ch = cur.self.pendingChoices[0]; if (!ch) break; await send(id, cur, { type: 'RESOLVE_CHOICE', choiceId: ch.id, optionId: ch.options[0].id }); }
    const cur = (await read(id)).game; const x = await send(id, cur, { type: 'READY' }); if (!x.ok) finding('RULE', `ERA_TURN READY refused: ${x.error?.message}`);
  } else { stall++; await sleep(1500); if (stall > 60) { finding('BLOCKER', `stalled at round ${round} phase ${g.phase}`); break; } }
}
const final = (await read(id)).game;
log.final = { round: final.view.round, era: final.self.era, cities: final.cityStates.length, prestige: final.players.map(p => [p.civilization, p.prestige, p.exploredRegions]), regionsOpen: final.board.filter(x => !x.closed).length, regions: final.board.length, discoveries: final.regions.filter(x => x.discovery).map(x => x.discovery.kind), vessels: final.units.filter(u => u.ownerId === final.self.playerId && ['FLEET', 'COASTAL_VESSEL'].includes(u.kind)).length, maritime: final.cityMarks.filter(c => c.ownerId === final.self.playerId && c.harbor).length };
log.consoleErrors = [...new Set(consoleErrors)].slice(0, 10);
if (consoleErrors.length) finding('VISUAL', `console errors: ${log.consoleErrors.join(' | ').slice(0, 300)}`);
await page.screenshot({ path: `${OUT}/final.png` });
writeFileSync(`${OUT}/log.json`, JSON.stringify(log, null, 1));
console.log(JSON.stringify(log.final), '\nrejected', JSON.stringify(log.rejected));
await browser.close();
