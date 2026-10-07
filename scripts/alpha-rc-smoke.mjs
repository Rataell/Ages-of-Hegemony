/* global document, localStorage, setTimeout, clearTimeout, window, innerHeight, EventSource */
// RC 1.2 public smoke + 6-seat gate against a deployed alpha (API + real browser).
//   ALPHA_BASE_URL=https://… ALPHA_ACCESS_CODE=… node scripts/alpha-rc-smoke.mjs [smoke|six|worlds|all]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const BASE = process.env.ALPHA_BASE_URL, CODE = process.env.ALPHA_ACCESS_CODE ?? '', MODE = process.argv[2] ?? 'all';
const OUT = process.env.OUT ?? 'docs/evidence/rc12/public'; mkdirSync(OUT, { recursive: true });
const CHASSIS = ['valgard', 'nymara', 'meridia', 'dravik', 'solenne', 'kor', 'thalos', 'orinth', 'saren', 'aurelia'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' · ' + extra : ''}`); if (!ok) process.exitCode = 1; };
const browser = await chromium.launch();
const session = async (viewport = { width: 1280, height: 720 }, name) => {
  const ctx = await browser.newContext({ viewport });
  await ctx.addInitScript(([n]) => { try { localStorage.setItem('aoh-tour-off', '1'); if (n) localStorage.setItem('aoh-alpha-name', n); } catch { /* none */ } }, [name ?? null]);
  const page = await ctx.newPage(); await page.goto(`${BASE}/alpha`);
  const call = async body => { for (let i = 0; i < 4; i++) { const r = await page.evaluate(async ([b]) => (await fetch('/api/alpha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })).json(), [body]); if (r?.error?.code === 'RATE_LIMIT') { await sleep(63000); continue; } return r; } };
  const get = id => page.evaluate(async i => (await fetch(`/api/alpha?gameId=${i}`, { cache: 'no-store' })).json(), id);
  return { ctx, page, call, get };
};
const create = (s, extra = {}) => s.call({ operation: 'create', accessCode: CODE, payload: { name: 'RC smoke', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 17, planningSeconds: 0, ...extra } });
const lobby = async (s, id, payload) => { const v = (await s.get(id)).value; return s.call({ operation: 'lobby', gameId: id, payload: { expectedVersion: v.version, ...payload } }); };
const firstDecisions = async (s, id) => {
  for (let k = 0; k < 6; k++) {
    const g = (await s.get(id)).value.game; if (!g) return;
    if (!g.self.ambitionsChosen) { await s.call({ operation: 'command', gameId: id, payload: { type: 'CHOOSE_AMBITIONS', expectedVersion: g.version, cardIds: g.self.ambitions.slice(0, 2) } }); continue; }
    const ch = g.self.pendingChoices[0]; if (ch) { await s.call({ operation: 'command', gameId: id, payload: { type: 'RESOLVE_CHOICE', expectedVersion: g.version, choiceId: ch.id, optionId: ch.options[0].id } }); continue; }
    return g;
  }
};
const ready = async (s, id) => { const g = await firstDecisions(s, id); if (g && !g.self.ready) await s.call({ operation: 'command', gameId: id, payload: { type: 'READY', expectedVersion: g.version } }); };
const freeCiv = v => CHASSIS.find(c => !v.seats.some(s => s.civilization === c));

try {
  const health = await (await fetch(`${BASE}/api/alpha/health`)).json();
  check('health: app, database, migrations, single instance', health.ok && health.database && health.migration && health.singleInstance, JSON.stringify(health));
  check('health: maxSeats=6 and access protected', health.maxSeats === 6 && health.accessProtected === true);

  if (MODE === 'smoke' || MODE === 'all') {
    const a = await session(undefined, 'Ana');
    const refused = await a.call({ operation: 'create', payload: { name: 'x', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 1, planningSeconds: 0 } });
    check('create without the access code is refused', refused.ok === false && refused.error.code === 'ACCESS_CODE');
    let r = await create(a); check('create with the code (2 seats → Compacto recommended)', r.ok && r.value.mapSize === 'COMPACT', r.ok ? r.value.mapSize : JSON.stringify(r.error));
    const id = r.value.id, inviteCode = r.value.joinCode;
    // Invite: the second device remembers a name and opens the link, no access code typed.
    const b = await session(undefined, 'Beto');
    await b.page.goto(`${BASE}/alpha/join/${inviteCode}`); await b.page.waitForFunction(() => /Seu tabuleiro de civilização/.test(document.body.innerText), null, { timeout: 30000 }).catch(() => null);
    const seated = (await a.get(id)).value; check('invite link auto-joins a device with a remembered name (no access code)', seated.seats.length === 2 && seated.seats.some(s => s.name === 'Beto'));
    await b.page.screenshot({ path: `${OUT}/lobby-invite-autojoin.png` });
    // Core 10 + three Figuras + simultaneous reveal.
    const notCore = await lobby(a, id, { type: 'CHOOSE_CIVILIZATION', civilization: 'elyra' }); check('only the Core 10 are selectable (elyra refused)', notCore.ok === false);
    r = await lobby(a, id, { type: 'CHOOSE_CIVILIZATION', civilization: 'valgard' }); check('Core 10 choice accepted; recommended Figura preselected', r.ok && r.value.seats.find(s => s.playerId === r.value.selfPlayerId).figureId === 'leader-alexandre-magno');
    r = await lobby(a, id, { type: 'CHOOSE_FIGURE', figureId: 'leader-odisseu' }); check('Figura choice accepted', r.ok);
    r = await lobby(b, id, { type: 'CHOOSE_CIVILIZATION', civilization: 'kor' }); check('second civilization accepted', r.ok);
    await lobby(a, id, { type: 'LOBBY_READY', ready: true });
    const bView = (await b.get(id)).value; check("Figura of a ready seat stays hidden until everyone is ready", bView.seats.find(s => s.civilization === 'valgard').figureId === null && bView.seats.find(s => s.civilization === 'valgard').figureChosen === true);
    await b.page.reload(); await b.page.waitForTimeout(1500); await b.page.screenshot({ path: `${OUT}/lobby-core10-figuras.png` });
    for (const size of ['STANDARD', 'WIDE']) { const w = await lobby(a, id, { type: 'SET_WORLD', mapSize: size }); check(`map size ${size} selectable for 2 seats`, w.ok && w.value.mapSize === size); }
    const w = await lobby(a, id, { type: 'SET_WORLD', mapSize: 'COMPACT', worldPreset: 'ARCHIPELAGO' }); check('Compacto + Arquipélago selectable', w.ok && w.value.worldPreset === 'ARCHIPELAGO');
    await lobby(b, id, { type: 'LOBBY_READY', ready: true });
    const revealed = (await a.get(id)).value; check('all ready → both Figuras revealed together', revealed.seats.every(s => s.figureId !== null));
    r = await lobby(a, id, { type: 'START' }); check('match starts', r.ok && r.value.lifecycle === 'ACTIVE', r.ok ? '' : JSON.stringify(r.error));
    await ready(a, id); await ready(b, id); await sleep(1500);
    // SSE + reaction + reload + suspend/resume.
    await a.page.goto(`${BASE}/alpha?game=${id}`); await a.page.waitForSelector('svg.world-map', { timeout: 30000 });
    const got = a.page.evaluate(id2 => new Promise(res => { const es = new EventSource(`/api/alpha?gameId=${id2}&stream=1`); const t = setTimeout(() => { es.close(); res(false); }, 15000); es.onmessage = () => { /* first frame */ }; es.addEventListener('message', e => { try { const m = JSON.parse(e.data); if (typeof m.version === 'number') { clearTimeout(t); es.close(); res(true); } } catch { /* ping */ } }); }), id);
    await sleep(500); await b.call({ operation: 'room', gameId: id, payload: { type: 'REACT', reaction: 'APPLAUSE' } });
    const rr = await b.call({ operation: 'room', gameId: id, payload: { type: 'REACT', reaction: 'CHEER' } }); check('reaction accepted', rr.ok !== false, rr.ok === false ? JSON.stringify(rr.error) : '');
    check('SSE pushes a version to a listener', await got);
    await a.page.screenshot({ path: `${OUT}/table-2p-compacto-archipelago.png` });
    await a.page.reload(); await a.page.waitForSelector('svg.world-map', { timeout: 30000 }); check('reload keeps the table', (await a.get(id)).value.seats.length === 2);
    const sus = await a.call({ operation: 'room', gameId: id, payload: { type: 'SUSPEND' } }); check('suspend at a safe point', sus.ok && sus.value.lifecycle === 'SUSPENDED', sus.ok ? '' : JSON.stringify(sus.error));
    await a.page.reload(); await a.page.waitForTimeout(1200); check('table reads SUSPENDED after reload', /SUSPENSA/i.test(await a.page.evaluate(() => document.body.innerText)));
    const res = await a.call({ operation: 'room', gameId: id, payload: { type: 'RESUME' } }); check('resume', res.ok && res.value.lifecycle === 'ACTIVE');
    await a.ctx.close(); await b.ctx.close();
  }

  if (MODE === 'six' || MODE === 'all') {
    // GATE 6: 1H + 5B.
    const h = await session({ width: 1280, height: 720 }, 'Ana');
    let r = await create(h, { seatLimit: 6, seed: 29 }); check('6-seat room created; Amplo recommended', r.ok && r.value.seatLimit === 6 && r.value.mapSize === 'WIDE', r.ok ? r.value.mapSize : JSON.stringify(r.error));
    const id = r.value.id;
    for (let i = 0; i < 5; i++) r = await lobby(h, id, { type: 'ADD_BOT' });
    check('5 bots added', r.ok && r.value.seats.length === 6);
    r = await lobby(h, id, { type: 'CHOOSE_CIVILIZATION', civilization: freeCiv(r.value) }); await lobby(h, id, { type: 'LOBBY_READY', ready: true });
    const full = (await h.get(id)).value;
    check('six distinct civilizations', new Set(full.seats.map(s => s.civilization)).size === 6 && full.seats.every(s => CHASSIS.includes(s.civilization)));
    r = await lobby(h, id, { type: 'START' }); check('6-seat match starts', r.ok && r.value.game !== null, r.ok ? '' : JSON.stringify(r.error));
    const g0 = (await h.get(id)).value.game;
    check('six homelands, one per seat, 301 hexes (Amplo)', g0.board.filter(x => x.homeOf).length >= 6 && new Set(g0.board.flatMap(x => x.hexIds)).size === 301);
    await ready(h, id); await sleep(4000);
    const g1 = (await h.get(id)).value.game; check('bots confirm and the round resolves', g1.view.round >= 2, `round ${g1.view.round}`);
    await h.page.goto(`${BASE}/alpha?game=${id}`); await h.page.waitForSelector('svg.world-map', { timeout: 30000 }); await h.page.waitForTimeout(1500);
    await h.page.screenshot({ path: `${OUT}/table-6p-amplo.png` });
    await h.page.reload(); await h.page.waitForSelector('svg.world-map', { timeout: 30000 });
    check('reload preserves the 6 seats', (await h.get(id)).value.seats.length === 6);
    const sus = await h.call({ operation: 'room', gameId: id, payload: { type: 'SUSPEND' } }); check('6p suspend', sus.ok && sus.value.lifecycle === 'SUSPENDED', sus.ok ? '' : JSON.stringify(sus.error));
    const res = await h.call({ operation: 'room', gameId: id, payload: { type: 'RESUME' } }); check('6p resume', res.ok && res.value.lifecycle === 'ACTIVE');
    await h.ctx.close();
    // Six real sessions: join by invite, presence/SSE.
    const host = await session(undefined, 'P1'); r = await create(host, { seatLimit: 6, seed: 31 }); const id6 = r.value.id, code = r.value.joinCode;
    const people = [host]; for (let i = 2; i <= 6; i++) { const p = await session(undefined, `P${i}`); const j = await p.call({ operation: 'join', code, displayName: `P${i}` }); if (!j.ok) check(`join ${i}`, false, JSON.stringify(j.error)); people.push(p); }
    const withSse = people.map(p => p.page.evaluate(i => new Promise(res => { const es = new EventSource(`/api/alpha?gameId=${i}&stream=1`); setTimeout(() => res(es && true), 800); window.__es = es; }), id6));
    await Promise.all(withSse); await sleep(1500);
    let view = (await host.get(id6)).value; check('six humans seated', view.seats.length === 6);
    check('presence tracked for the six (SSE)', view.seats.filter(s => ['ONLINE', 'RECONNECTING', 'AWAY'].includes(s.presence) || s.presence).length === 6, view.seats.map(s => s.presence).join(','));
    for (const p of people) { const v = (await p.get(id6)).value; await p.call({ operation: 'lobby', gameId: id6, payload: { expectedVersion: v.version, type: 'CHOOSE_CIVILIZATION', civilization: freeCiv((await p.get(id6)).value) } }); }
    for (const p of people) { const v = (await p.get(id6)).value; await p.call({ operation: 'lobby', gameId: id6, payload: { expectedVersion: v.version, type: 'LOBBY_READY', ready: true } }); }
    view = (await host.get(id6)).value; check('six humans: six distinct civilizations, all ready', new Set(view.seats.map(s => s.civilization)).size === 6 && view.seats.every(s => s.ready));
    const st = await lobby(host, id6, { type: 'START' }); check('6 humans start', st.ok, st.ok ? '' : JSON.stringify(st.error));
    for (const p of people) await ready(p, id6); await sleep(3000);
    check('6 humans resolve a round', (await host.get(id6)).value.game.view.round >= 2);
    for (const p of people) await p.ctx.close();
  }

  if (MODE === 'worlds' || MODE === 'all') {
    for (const [name, seats, mapSize, worldPreset, bots] of [['compacto-misto', 2, 'COMPACT', 'MIXED', 1], ['padrao-continental', 4, 'STANDARD', 'CONTINENTAL', 3], ['padrao-arquipelago', 4, 'STANDARD', 'ARCHIPELAGO', 3], ['padrao-mar-interior', 4, 'STANDARD', 'INLAND_SEA', 3], ['amplo-misto', 6, 'WIDE', 'MIXED', 5]]) {
      const s = await session(undefined, 'Ana'); let r = await create(s, { seatLimit: seats, mapSize, worldPreset, revealMap: true, seed: 41 });
      if (!r.ok) { check(`world ${name}`, false, JSON.stringify(r.error)); continue; }
      const id = r.value.id; for (let i = 0; i < bots; i++) r = await lobby(s, id, { type: 'ADD_BOT' });
      await lobby(s, id, { type: 'CHOOSE_CIVILIZATION', civilization: freeCiv((await s.get(id)).value) }); await lobby(s, id, { type: 'LOBBY_READY', ready: true });
      await lobby(s, id, { type: 'START' }); await firstDecisions(s, id);
      await s.page.goto(`${BASE}/alpha?game=${id}`); await s.page.waitForSelector('svg.world-map', { timeout: 30000 }); await s.page.waitForTimeout(1500);
      const hexes = await s.page.locator('svg.world-map g.hex').count();
      check(`world ${name}: ${hexes} hexes on the real table`, hexes === { COMPACT: 168, STANDARD: 210, WIDE: 301 }[mapSize]);
      await s.page.screenshot({ path: `${OUT}/world-${name}.png` });
      check(`world ${name}: no document scroll`, !(await s.page.evaluate(() => document.documentElement.scrollHeight > innerHeight + 1)));
      await s.ctx.close();
    }
  }
} finally { await browser.close(); }
