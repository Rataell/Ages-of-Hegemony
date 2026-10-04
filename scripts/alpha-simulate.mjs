/* global setTimeout, localStorage */
// DEV-ONLY: full two-seat match against the local Alpha (npm run dev:alpha) through the real HTTP boundary and two browsers,
// exercising every command type and recording coverage. Usage: node scripts/alpha-simulate.mjs [rounds]
// Full 2-player match through the real local Alpha (HTTP + browser), exercising every command type and recording what each did.
import { chromium } from '@playwright/test';
const BASE = process.env.ALPHA_BASE ?? 'http://127.0.0.1:3001', OUT = process.env.ALPHA_SIM_OUT ?? 'docs/evidence/alpha-sim/';
import { mkdirSync, writeFileSync } from 'node:fs'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch(); const errs = [], log = [], covered = new Map();
const mk = async (label) => { const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }); const page = await ctx.newPage(); page.setDefaultTimeout(20000); page.on('pageerror', e => errs.push(label + ': ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !m.text().includes('400')) errs.push(label + ' console: ' + m.text()); }); return { page, label }; };
const A = await mk('A'), B = await mk('B'); const nap = ms => new Promise(r => setTimeout(r, ms));
for (const p of [A, B]) { await p.page.goto(BASE + '/alpha'); await p.page.getByLabel('Seu nome', { exact: true }).fill('Jogador ' + p.label); }
await A.page.getByLabel('Duração').selectOption('STANDARD'); await A.page.getByRole('button', { name: 'Criar partida', exact: true }).click();
await A.page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
const code = (await A.page.locator('.alpha-lobby-heading code').innerText()).trim();
await B.page.goto(`${BASE}/alpha?join=${code}`); await B.page.getByLabel('Seu nome', { exact: true }).fill('Jogador B'); await B.page.getByRole('button', { name: 'Entrar na partida', exact: true }).click();
await B.page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
await A.page.locator('.alpha-roster-row').filter({ hasText: 'Valgard' }).click(); await A.page.getByRole('button', { name: 'Estou pronto', exact: true }).click();
await B.page.locator('.alpha-roster-row').filter({ hasText: 'Thalos' }).click(); await B.page.getByRole('button', { name: 'Estou pronto', exact: true }).click();
await A.page.getByRole('button', { name: 'Iniciar partida', exact: true }).click(); await A.page.waitForSelector('.world-map'); await B.page.waitForSelector('.world-map');
const room = async p => { await nap(450); return p.page.evaluate(async () => { const id = localStorage.getItem('aoh-alpha-room'); const j = await (await fetch(`/api/alpha?gameId=${id}`, { cache: 'no-store' })).json(); if (!j.ok) throw new Error('ROOM ' + JSON.stringify(j.error)); return j.value; }); };
const cmd = async (p, payload) => { await nap(900); const res = await p.page.evaluate(async payload => { const id = localStorage.getItem('aoh-alpha-room'); const rr = await (await fetch(`/api/alpha?gameId=${id}`, { cache: 'no-store' })).json(); if (!rr.ok) return 'ROOM ' + JSON.stringify(rr.error); const r = await (await fetch('/api/alpha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operation: 'command', gameId: id, payload: { ...payload, expectedVersion: rr.value.game.version, ...(payload.type === 'MANAGE' ? { command: { ...payload.command, expectedVersion: rr.value.game.view.version } } : {}) } }) })).json(); return r.ok ? 'ok' : r.error.code + ': ' + r.error.message; }, payload); const k = payload.type + (payload.type === 'MANAGE' ? ':' + payload.command.type : payload.type === 'URBAN_ACTION' ? ':' + payload.action : payload.type === 'QUEUE_ORDER' ? ':' + payload.order.type : ''); const c = covered.get(k) ?? { ok: 0, fail: 0, last: '' }; if (res === 'ok') c.ok++; else { c.fail++; c.last = res; } covered.set(k, c); log.push(`${p.label} ${k} ${res}`); return res; };
const selfId = r => r.selfPlayerId;
async function plan(p, round) {
  const r = await room(p), g = r.game, id = selfId(r);
  if (!g.self.ambitionsChosen && g.self.ambitions.length >= 2) await cmd(p, { type: 'CHOOSE_AMBITIONS', cardIds: g.self.ambitions.slice(0, 2) });
  if (g.worldEvent && g.worldDecisionPending) await cmd(p, { type: 'WORLD_CHOICE', choice: round % 2 ? 'RESOURCE' : 'PRESTIGE' });
  if (round === 2) await cmd(p, { type: 'SET_DEFENSE_POSTURE', posture: 'HOLD' });
  if (round === 4 && g.self.leader && !g.self.leader.eraAbilityUsed) await cmd(p, { type: 'LEADER_ABILITY' });
  // cards from hand / civilization board
  const strat = g.self.hand[0]; if (strat && round % 2 === 0) await cmd(p, { type: 'PLAY_CARD', cardId: strat });
  if (g.advisorMarket[0] && round === 5) await cmd(p, { type: 'HIRE_ADVISOR', cardId: g.advisorMarket[0] });
  // urban: one action per city, varied
  let g1 = (await room(p)).game;
  for (const c of g1.view.player.civilization.cities) {
    const opts = (g1.urban?.cities?.[c.id] ?? []).filter(o => !o.blocked), research = (g1.urban?.research ?? []).filter(o => !o.blocked);
    const want = [round === 1 ? 'RECRUIT:COASTAL_VESSEL' : null, round % 5 === 2 ? 'RECRUIT:INFANTRY' : null, round % 5 === 3 ? 'BUILD:DISTRICT' : null, round % 5 === 4 ? 'RESEARCH' : null, round % 5 === 0 ? 'BUILD:FORTIFICATION' : null, round === 6 ? 'PROMOTE_MOOD' : null, round === 8 ? 'CIVIC_ACTION' : null, round === 9 ? 'RECRUIT:FLEET' : null, round === 11 ? 'SUPPORT_TRADE' : null, 'PRODUCE'].filter(Boolean);
    let pick = null;
    for (const w of want) { const [a, s] = w.split(':'); pick = a === 'RESEARCH' ? research[0] : opts.find(o => o.action === a && (!s || o.unit === s || o.build?.kind === s)); if (pick) break; }
    if (!pick) continue;
    await cmd(p, { type: 'URBAN_ACTION', cityId: c.id, action: pick.action, ...(pick.unit ? { unit: pick.unit } : {}), ...(pick.build ? { build: pick.build } : {}), ...(pick.advancementId ? { advancementId: pick.advancementId } : {}) });
  }
  g1 = (await room(p)).game;
  // management: claim, improve, assign workers, specialize, road
  const city = g1.view.player.civilization.cities[0];
  if (city && round === 2) { const claim = g1.claimOptions[city.id]?.[0]; if (claim) await cmd(p, { type: 'MANAGE', command: { type: 'CLAIM_HEX', playerId: id, cityId: city.id, hexId: claim } }); }
  if (city && round === 3) { const t = g1.view.visibleTerritory.find(t => t.controllerCityId === city.id && !t.improvement && t.id !== city.hexId && ['PLAINS', 'FOREST', 'HILLS'].includes(t.terrain)); if (t) await cmd(p, { type: 'MANAGE', command: { type: 'IMPROVE_HEX', playerId: id, hexId: t.id, improvement: t.terrain === 'PLAINS' ? 'FARM' : t.terrain === 'FOREST' ? 'LUMBER_CAMP' : 'QUARRY' } }); }
  if (city && round === 4) { const worked = g1.view.visibleTerritory.filter(t => t.controllerCityId === city.id).slice(0, city.workers.producers).map(t => t.id); await cmd(p, { type: 'MANAGE', command: { type: 'ASSIGN_WORKED_HEXES', playerId: id, cityId: city.id, hexIds: worked } }); }
  if (city && round === 5) await cmd(p, { type: 'MANAGE', command: { type: 'ASSIGN_POPULATION', playerId: id, cityId: city.id, workers: { ...city.workers } } });
  if (city && round === 7) await cmd(p, { type: 'BUILD_ROAD', hexId: city.hexId });
  if (city && round === 10) { const cs = g1.cityStates.find(c => c.cityId === city.id); if (cs?.elevate && cs.elevate.block === null) await cmd(p, { type: 'URBAN_ACTION', cityId: city.id, action: 'ELEVATE' }); }
  if (round === 11) { const piece = g1.units.find(u => u.ownerId === id && u.kind === 'INFANTRY' && g1.cityMarks.some(m => m.ownerId === id && m.hexId === u.hexId)); if (piece) await cmd(p, { type: 'DEMOBILIZE', unitId: piece.id }); }
  // diplomacy
  const other = g1.players.find(x => x.id !== id)?.id;
  if (other && round === 2 && p === A) await cmd(p, { type: 'PROPOSE_TREATY', recipientId: other, treaty: 'OPEN_BORDERS', deal: { give: { food: 0, wood: 0, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0 }, receive: { food: 0, wood: 0, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0 } } });
  if (other && round === 3 && p === A) await cmd(p, { type: 'PROPOSE_TRADE', recipientId: other, offerType: 'GIFT', offer: { food: 1, wood: 0, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0 }, request: { food: 0, wood: 0, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0 }, treatyTerms: [], dueRound: null });
  for (const t of g1.treaties.filter(t => t.status === 'PROPOSED' && t.recipientId === id)) await cmd(p, { type: 'RESPOND_TREATY', treatyId: t.id, accept: true });
  for (const o of g1.tradeOffers.filter(o => o.status === 'PROPOSED' && o.recipientId === id)) await cmd(p, { type: 'RESPOND_TRADE', offerId: o.id, accept: true });
  if (round === 6 && p === A) { const t = g1.treaties.find(t => t.status === 'ACTIVE'); if (t) await cmd(p, { type: 'END_TREATY', treatyId: t.id }); }
  if (other && round === 7 && p === A) await cmd(p, { type: 'DECLARE_WAR', targetId: other });
  const people = g1.independents.find(x => x.actions?.some(a => !a.blocked)); if (people && round === 5) { const act = people.actions.find(a => !a.blocked); await cmd(p, { type: 'INDEPENDENT_ACTION', peopleId: people.id, action: act.action }); }
  // pieces
  const g2 = (await room(p)).game, mine = g2.units.filter(u => u.ownerId === id);
  const ship = mine.find(u => u.kind === 'COASTAL_VESSEL' || u.kind === 'FLEET');
  if (ship && !mine.some(u => u.carrierId)) { const land = mine.find(u => !u.carrierId && ['INFANTRY', 'EXPLORER'].includes(u.kind) && g2.unitOptions[u.id]?.embark?.includes(ship.id)); if (land) await cmd(p, { type: 'EMBARK', unitIds: [land.id], fleetId: ship.id }); }
  for (const u of mine.filter(u => u.carrierId)) { const d = g2.unitOptions[u.id]?.disembark ?? []; if (d.length && round % 2 === 0) await cmd(p, { type: 'DISEMBARK', unitIds: [u.id], hexId: d[d.length - 1] }); }
  const g3 = (await room(p)).game; let queued = 0;
  for (const u of g3.units.filter(u => u.ownerId === id && !u.carrierId)) {
    const o = g3.unitOptions[u.id]; if (!o) continue;
    if (u.kind === 'PIONEER' && round >= 2 && o.settleBlock === null) { await cmd(p, { type: 'SETTLE', unitId: u.id, name: 'Nova ' + p.label }); continue; }
    if (u.kind === 'ENVOY' && round >= 4) { const near = g3.view.visibleCities.find(c => c.ownerId !== id); if (near) { await cmd(p, { type: 'QUEUE_ORDER', order: { id: `inf-${round}-${u.id}`, type: 'INFLUENCE', unitId: u.id, target: near.hexId } }); continue; } }
    if (o.explore?.length) { await cmd(p, { type: 'QUEUE_ORDER', order: { id: `o-${round}-${u.id}`, type: 'EXPLORE', unitId: u.id, target: o.explore[0].hexIds[0], rotation: 0 } }); queued++; continue; }
    const enemy = g3.units.find(e => e.ownerId !== id && !e.carrierId); const atWar = g3.wars.length > 0;
    if (atWar && enemy && (g3.rules.units[u.kind].strength > 0)) { await cmd(p, { type: 'QUEUE_ORDER', order: { id: `atk-${round}-${u.id}`, type: 'ATTACK', unitIds: [u.id], target: enemy.hexId, posture: 'ASSAULT' } }); }
    const moves = Object.entries(o.moves); if (moves.length) { const [, path] = moves[moves.length - 1]; const res = await cmd(p, { type: 'QUEUE_ORDER', order: { id: `o-${round}-${u.id}`, type: 'MOVE', unitIds: [u.id], path } }); if (res === 'ok' && queued === 0 && round === 5) await cmd(p, { type: 'CANCEL_ORDER', orderId: `o-${round}-${u.id}` }); queued++; }
    if (city && round === 9) { const tgt = g3.view.visibleCities.find(c => c.id !== city.id); if (tgt) await cmd(p, { type: 'QUEUE_ORDER', order: { id: `tr-${round}`, type: 'TRADE', fromCityId: city.id, toCityId: tgt.id } }); }
  }
  if (round === 12) { const r3 = await room(p); const first = Object.keys(r3.game.costs.projects)[0]; if (first && city) await cmd(p, { type: 'BUILD_PROJECT', projectId: first, cityId: city.id }); }
  if (round === 13) { const g4 = (await room(p)).game; const path = g4.hegemony?.[0]?.path; if (path) await cmd(p, { type: 'DECLARE_HEGEMONY', path }); }
  if (round === 14) { const g4 = (await room(p)).game; const c = g4.culture.find(c => c.currentOwnerId !== id && c.foreignPresence.length >= 2); if (c) await cmd(p, { type: 'CONTEST_PRESENCE', cityId: c.cityId, defenderCivilizationId: c.foreignPresence[0].civilizationId }); }
  if (round === 15 && p === A) await cmd(p, { type: 'PLAY_CIVILIZATION_CARD', cardId: 'civ-valgard-1' });
}
const ROUNDS = Number(process.argv[2] ?? 15);
for (let round = 1; round <= ROUNDS; round++) {
  await plan(A, round); await plan(B, round);
  if (round === 3) { await cmd(A, { type: 'READY' }); await cmd(A, { type: 'UNREADY' }); }
  for (let k = 0; k < 8; k++) {
    const ga = (await room(A)).game; if (ga.winner) break; const before = ga.view.round;
    for (const p of [A, B]) { const g = (await room(p)).game; if (!g.self.ready && ['PLANNING', 'CONFLICTS'].includes(g.phase)) await cmd(p, { type: 'READY' }); }
    const g = (await room(A)).game; if (g.winner || (g.view.round > before && g.phase === 'PLANNING')) break;
  }
  if (round % 5 === 0) { for (const p of [A, B]) { await p.page.reload(); await p.page.waitForSelector('.world-map'); await p.page.waitForTimeout(700); const c = p.page.getByRole('button', { name: 'Continuar', exact: true }); if (await c.count()) await c.first().click(); await p.page.screenshot({ path: OUT + `r${round}-${p.label}.png` }); } }
  const g = (await room(A)).game; if (g.winner) { log.push('WINNER ' + JSON.stringify(g.winner)); break; }
}
const g = (await room(A)).game;
const summary = { round: g.view.round, era: g.self.era, winner: g.winner, standings: g.finalStandings, wars: g.wars, treaties: g.treaties.map(t => t.type + ':' + t.status), battles: g.battles.length, cities: g.cityMarks, units: g.units.map(u => u.ownerId.slice(-1) + u.kind).join(','), prestige: g.players.map(p => p.name + ':' + p.prestige), research: g.self.research.length };
const cov = Object.fromEntries([...covered].sort());
writeFileSync(OUT + 'summary.json', JSON.stringify({ summary, coverage: cov, errors: errs, log }, null, 1));
console.log(JSON.stringify(summary)); console.log('COVERAGE'); for (const [k, v] of Object.entries(cov)) console.log(k.padEnd(28), 'ok', v.ok, 'fail', v.fail, v.fail ? '· ' + v.last : '');
console.log('page errors', errs.length, errs.slice(0, 3));
await b.close();
