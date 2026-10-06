/* global setTimeout, localStorage, document, innerHeight, innerWidth */
// DEV-ONLY: plays a real 2-seat match against `npm run dev:alpha` (HTTP + two Chromium windows, "Mapa revelado" on) and
// captures the V5.1b Mesa: Faixa, Tabuleiro, Teia, Herança, city card with Elevar, a threat, combat preview/result, Era turn.
// Usage: node scripts/alpha-v51b-shots.mjs      (dev:alpha must be running on ALPHA_LOCAL_PORT, default 3001)
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const BASE = `http://127.0.0.1:${process.env.ALPHA_LOCAL_PORT ?? 3001}`, OUT = 'docs/evidence/v51b-mesa-real/';
mkdirSync(OUT, { recursive: true });
const nap = ms => new Promise(r => setTimeout(r, ms));
const log = [], errors = [], shots = [];
const browser = await chromium.launch();
const open = async label => {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await context.addInitScript(() => { try { localStorage.setItem('aoh-tour-off', '1'); } catch { /* storage unavailable */ } });
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', e => errors.push(`${label}: ${e.message}`));
  return { label, page };
};
const A = await open('A'), B = await open('B');
for (const p of [A, B]) { await p.page.goto(`${BASE}/alpha`); await p.page.getByLabel('Seu nome', { exact: true }).fill(`Jogador ${p.label}`); }
await A.page.getByLabel('Duração').selectOption('STANDARD');
await A.page.getByText('Opções da mesa', { exact: true }).click(); await A.page.getByLabel(/Mapa revelado/).check();
await A.page.getByRole('button', { name: 'Criar partida', exact: true }).click();
await A.page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
const code = (await A.page.locator('.alpha-lobby-heading code').innerText()).trim();
await B.page.goto(`${BASE}/alpha?join=${code}`);
await B.page.getByLabel('Seu nome', { exact: true }).fill('Jogador B');
await B.page.getByRole('button', { name: 'Entrar na partida', exact: true }).click();
await B.page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
await A.page.locator('.alpha-roster-row').filter({ hasText: 'Valgard' }).click(); await A.page.getByRole('button', { name: 'Estou pronto', exact: true }).click();
await B.page.locator('.alpha-roster-row').filter({ hasText: 'Thalos' }).click(); await B.page.getByRole('button', { name: 'Estou pronto', exact: true }).click();
await A.page.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
await A.page.waitForSelector('.world-map'); await B.page.waitForSelector('.world-map');

const hits = new Map();
const throttle = async (p, weight) => { const now = () => Date.now(); const list = hits.get(p.label) ?? []; hits.set(p.label, list); for (;;) { while (list.length && list[0] < now() - 60000) list.shift(); if (list.length + weight <= 60) break; await nap(1500); } for (let i = 0; i < weight; i++) list.push(now()); };
const room = async p => { await throttle(p, 1); await nap(150); return p.page.evaluate(async () => { const id = localStorage.getItem('aoh-alpha-room'); const j = await (await fetch(`/api/alpha?gameId=${id}`, { cache: 'no-store' })).json(); if (!j.ok) throw new Error('ROOM ' + JSON.stringify(j.error)); return j.value; }); };
const cmd = async (p, payload) => {
  await throttle(p, 2); await nap(250);
  const res = await p.page.evaluate(async payload => {
    const id = localStorage.getItem('aoh-alpha-room'); const rr = await (await fetch(`/api/alpha?gameId=${id}`, { cache: 'no-store' })).json();
    if (!rr.ok) return 'ROOM ' + JSON.stringify(rr.error);
    const r = await (await fetch('/api/alpha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operation: 'command', gameId: id, payload: { ...payload, expectedVersion: rr.value.game.version, ...(payload.type === 'MANAGE' ? { command: { ...payload.command, expectedVersion: rr.value.game.view.version } } : {}) } }) })).json();
    return r.ok ? 'ok' : `${r.error.code}: ${r.error.message}`;
  }, payload);
  log.push(`${p.label} ${payload.type}${payload.action ? ':' + payload.action : ''}${payload.order ? ':' + payload.order.type : ''} ${res}`);
  return res;
};
const noGlobalScroll = page => page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth + 1);
const shot = async (p, name, sizes = [[1366, 768]]) => {
  for (const [w, h] of sizes) {
    await p.page.setViewportSize({ width: w, height: h }); await nap(500);
    const file = `${name}-${w}x${h}.png`; await p.page.screenshot({ path: OUT + file });
    shots.push({ file, noGlobalScroll: await noGlobalScroll(p.page) });
  }
  await p.page.setViewportSize({ width: 1366, height: 768 });
};
const both = [[1366, 768], [1440, 900]];
const dismiss = async p => { for (const name of [/Ver o mapa primeiro/, /Pular tour/, /^Continuar$/, /Fechar/]) { const b = p.page.getByRole('button', { name }).first(); if (await b.isVisible().catch(() => false)) await b.click().catch(() => undefined); } };
await dismiss(A); await dismiss(B);

const dist = (a, b) => { const [aq, ar] = a.split(',').map(Number), [bq, br] = b.split(',').map(Number), dq = aq - bq, dr = ar - br; return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)); };
const captured = new Set();
async function plan(p, round) {
  let r = await room(p), g = r.game;
  if (!g.self.ambitionsChosen && g.self.ambitions.length >= 2) await cmd(p, { type: 'CHOOSE_AMBITIONS', cardIds: g.self.ambitions.slice(0, 2) });
  if (g.worldEvent && g.worldDecisionPending) await cmd(p, { type: 'WORLD_CHOICE', choice: 'RESOURCE' });
  for (const choice of g.self.pendingChoices ?? []) await cmd(p, { type: 'RESOLVE_CHOICE', choiceId: choice.id, optionId: choice.options[0].id });
  g = (await room(p)).game;
  const me = r.selfPlayerId, city = g.view.player.civilization.cities[0];
  // Soldiers first: a city of 3+ puts one habitant at arms so Recrutar is real.
  if (city && city.population >= 3 && city.workers.soldiers < 2 && p === A) {
    const w = { ...city.workers }; const take = w.unassigned > 0 ? 'unassigned' : w.producers > 1 ? 'producers' : 'scholars';
    w[take] -= 1; w.soldiers += 1;
    await cmd(p, { type: 'MANAGE', command: { type: 'ASSIGN_POPULATION', playerId: me, cityId: city.id, workers: w } });
  }
  g = (await room(p)).game;
  const opts = (g.urban?.cities?.[city.id] ?? []).filter(o => !o.blocked), research = (g.urban?.research ?? []).filter(o => !o.blocked);
  const elevate = opts.find(o => o.action === 'ELEVATE'), recruit = opts.find(o => o.action === 'RECRUIT' && o.unit === 'INFANTRY');
  const shaky = ['REVOLT', 'SHAKEN'].includes(g.cityStates.find(c => c.cityId === city.id)?.moodBand);
  const govern = shaky ? opts.find(o => o.action === 'PROMOTE_MOOD' || o.action === 'CIVIC_ACTION') : null;
  const pick = govern ? govern : (p === A && elevate) ? elevate : (p === A && recruit && round >= 2) ? recruit : opts.find(o => o.action === 'PRODUCE');
  const doResearch = !govern && research[0] && (p === B || round % 2 === 1);
  if (pick && !doResearch) await cmd(p, { type: 'URBAN_ACTION', cityId: city.id, action: pick.action, ...(pick.unit ? { unit: pick.unit } : {}), ...(pick.action === 'RECRUIT' && (g.recruitLimits?.[city.id] ?? 1) > 1 ? { count: 2 } : {}) });
  if (doResearch) await cmd(p, { type: 'URBAN_ACTION', cityId: city.id, action: 'RESEARCH', advancementId: research[0].advancementId });
  // Expedition: march the army to the nearest threat and attack when adjacent (seat A only).
  if (p === A) {
    g = (await room(p)).game;
    const army = g.units.filter(u => u.ownerId === me && ['INFANTRY', 'GUARD', 'RANGED', 'CAVALRY'].includes(u.kind));
    const threat = [...(g.threats ?? [])].sort((x, y) => dist(x.hexId, city.hexId) - dist(y.hexId, city.hexId))[0];
    log.push(`DBG r${round} army=${JSON.stringify(army.map(u => [u.kind, u.hexId]))} threat=${JSON.stringify(threat && [threat.id, threat.hexId, threat.level])} units=${g.units.filter(u => u.ownerId === me).length}`);
    if (army.length && threat) {
      const groups = new Map(); for (const u of army) groups.set(u.hexId, [...(groups.get(u.hexId) ?? []), u]);
      for (const [hex, units] of groups) {
        const ids = units.map(u => u.id);
        if (dist(hex, threat.hexId) === 1) { await cmd(p, { type: 'QUEUE_ORDER', order: { id: `atk-${round}-${hex.replace(/[^0-9a-z]/gi, '_')}`, type: 'ATTACK', unitIds: ids, target: threat.hexId, posture: 'ASSAULT' } }); continue; }
        const moves = g.unitOptions?.[units[0].id]?.moves ?? {};
        const best = Object.keys(moves).sort((x, y) => dist(x, threat.hexId) - dist(y, threat.hexId))[0];
        if (best && dist(best, threat.hexId) < dist(hex, threat.hexId)) await cmd(p, { type: 'QUEUE_ORDER', order: { id: `mv-${round}-${hex.replace(/[^0-9a-z]/gi, '_')}`, type: 'MOVE', unitIds: ids, path: moves[best] } });
      }
    }
  }
}

async function captures(round) {
  const g = (await room(A)).game, me = g.view.player.civilization.cities[0];
  if (round === 2 && !captured.has('mesa')) {
    captured.add('mesa'); await dismiss(A);
    await shot(A, '01-mesa-faixa', both);
    await A.page.locator('.alpha-strip .alpha-resonance').click();
    const board = A.page.getByRole('dialog', { name: 'Tabuleiro da Civilização' });
    await board.waitFor();
    await shot(A, '02-tabuleiro', both);
    const node = board.locator('.alpha-node.is-reachable').first();
    if (await node.count()) { await node.click(); await board.locator('.alpha-node-detail').scrollIntoViewIfNeeded().catch(() => undefined); await shot(A, '03-teia-detalhe'); }
    await board.locator('.alpha-civ-heritage').scrollIntoViewIfNeeded().catch(() => undefined); await shot(A, '04-heranca');
    await board.locator('.alpha-civ-government').scrollIntoViewIfNeeded().catch(() => undefined); await shot(A, '04b-governo-lider');
    await A.page.keyboard.press('Escape');
  }
  if (!captured.has('cidade') && me) {
    const tile = A.page.locator(`svg.world-map g.hex[aria-label$=" ${me.hexId}"], svg.world-map g.hex[aria-label*=" ${me.hexId},"]`).first();
    if (await tile.count()) {
      await tile.click({ force: true }); await nap(400);
      const elev = A.page.locator('.alpha-elevate').first();
      if (await elev.count()) { captured.add('cidade'); await elev.scrollIntoViewIfNeeded().catch(() => undefined); await shot(A, '05-cidade-elevar', both); }
      else if (round === 3) { captured.add('cidade'); await shot(A, '05-cidade', both); }
    }
  }
  const threat = g.threats?.[0];
  if (threat && !captured.has('ameaca')) {
    captured.add('ameaca');
    const tile = A.page.locator(`svg.world-map g.hex[aria-label$=" ${threat.hexId}"], svg.world-map g.hex[aria-label*=" ${threat.hexId},"]`).first();
    await tile.scrollIntoViewIfNeeded().catch(() => undefined); await tile.click({ force: true }).catch(() => undefined); await shot(A, '06-ameaca-mapa', both);
  }
  if (g.self.orders.some(o => o.type === 'ATTACK') && !captured.has('previa')) {
    captured.add('previa'); await dismiss(A);
    await A.page.getByRole('button', { name: /Ordens planejadas/ }).first().click().catch(() => undefined); await nap(500);
    await shot(A, '07-combate-previa', both);
    await A.page.getByRole('button', { name: /Ordens planejadas/ }).first().click().catch(() => undefined);
  }
}

let round = 1, guard = 0;
while (guard++ < 60) {
  const g = (await room(A)).game;
  if (g.phase === 'ERA_TURN') {
    if (!captured.has('era')) { captured.add('era'); await dismiss(A); await shot(A, '09-virada-de-era', both); }
    for (const p of [A, B]) { const gg = (await room(p)).game; for (const c of gg.self.pendingChoices ?? []) await cmd(p, { type: 'RESOLVE_CHOICE', choiceId: c.id, optionId: c.options[0].id }); await cmd(p, { type: 'READY' }); }
    await nap(1500); continue;
  }
  if (captured.has('resultado') || (g.view.round ?? 0) > 26) break;
  if (g.phase !== 'PLANNING') { await nap(800); continue; }
  round = g.view.round ?? round;
  for (const p of [A, B]) await plan(p, round);
  await dismiss(A); await captures(round);
  const before = (await room(A)).game.battles?.length ?? 0;
  for (const p of [A, B]) await cmd(p, { type: 'READY' });
  for (let i = 0; i < 25; i++) { await nap(500); const s = (await room(A)).game; if (s.phase === 'PLANNING' && (s.view.round ?? 0) > round || s.phase === 'ERA_TURN') break; if (s.phase === 'CONFLICTS') for (const p of [A, B]) await cmd(p, { type: 'READY' }); }
  const after = (await room(A)).game;
  if ((after.battles?.length ?? 0) > before && !captured.has('resultado')) {
    captured.add('resultado'); await dismiss(A);
    await A.page.getByRole('button', { name: /Última resolução/ }).first().click().catch(() => undefined); await nap(700);
    await shot(A, '08-combate-resultado', both);
    await A.page.keyboard.press('Escape'); await dismiss(A);
  }
}
writeFileSync(OUT + 'run.json', JSON.stringify({ shots, errors, captured: [...captured], log: log.slice(-120) }, null, 2));
console.log(JSON.stringify({ shots: shots.map(s => `${s.file}${s.noGlobalScroll ? '' : ' !SCROLL'}`), captured: [...captured], errors }, null, 1));
await browser.close();
