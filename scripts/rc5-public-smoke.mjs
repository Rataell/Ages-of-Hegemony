// RC5 public smoke against a deployed Alpha (HTTP only, guest sessions, no secrets printed).
//   ALPHA_BASE_URL=https://… ALPHA_ACCESS_CODE=… [SMOKE_STATE=/path/state.json] node scripts/rc5-public-smoke.mjs <a1|a2|b>
//   a1  two humans, ACCELERATED short match: refused without the access code, forged session refused, rule checks in round 1, play to round 10, reload, save state
//   a2  (after a restart of the service) same match: same version and stock, play to the end, Crônica report over HTTP, JSON and CSV exports
//   b   one human + three bots, ACCELERATED short match to the end: bots build, research, explore and fight; the report says what happened
import { readFileSync, writeFileSync } from 'node:fs';
import { matchReportToCsv, MatchReportV1Schema } from '@aoh/game-domain';
import { matchReportToJson } from '@aoh/game-engine';
import { BASE, CODE, Seat, check, lobby, playStep, sleep } from './lib/public-smoke-api.mjs';

const MODE = process.argv[2], STATE = process.env.SMOKE_STATE ?? '/tmp/rc5-smoke-state.json';
if (!BASE || !CODE) { console.error('ALPHA_BASE_URL and ALPHA_ACCESS_CODE are required'); process.exit(2); }
const finished = view => view.lifecycle === 'FINISHED' || view.game?.view?.status === 'FINISHED' || view.game?.winner;
const round = view => view.game?.view?.round ?? 0;
const stock = view => JSON.stringify(view.game?.self?.resources ?? {});

async function playUntil(seats, id, target, label) {
  for (let i = 0; i < 400; i++) {
    const views = await Promise.all(seats.map(seat => seat.get(id)));
    if (views.some(v => !v.ok)) { check(`${label}: read ok`, false, JSON.stringify(views.find(v => !v.ok)?.error)); return null; }
    const lead = views[0].value;
    if (finished(lead) || round(lead) >= target) return lead;
    let acted = 0;
    for (let k = 0; k < seats.length; k++) if (await playStep(seats[k], id, k) && true) acted++;
    await sleep(acted ? 150 : 700);
  }
  check(`${label}: reached target`, false); return null;
}
async function lobbyTo(seats, id, civs) {
  for (let k = 0; k < seats.length; k++) { await lobby(seats[k], id, { type: 'CHOOSE_CIVILIZATION', civilization: civs[k] }); await lobby(seats[k], id, { type: 'LOBBY_READY', ready: true }); }
  return lobby(seats[0], id, { type: 'START' });
}
function validateReport(report, { pace, players, label }) {
  const parsed = MatchReportV1Schema.safeParse(report); check(`${label}: report matches MatchReportV1`, parsed.success, parsed.success ? '' : JSON.stringify(parsed.error.issues[0]));
  check(`${label}: report identifies pace ${pace}, ${players} civs, 21 rounds`, report.match.pace === pace && report.match.players === players && report.match.roundsPlayed === 21, JSON.stringify({ pace: report.match.pace, players: report.match.players, rounds: report.match.roundsPlayed }));
  check(`${label}: eight resources per seat`, Object.keys(report.economy.perSeat[0].stock).sort().join() === 'culture,food,influence,knowledge,metal,stone,wealth,wood');
  check(`${label}: report has no private data`, !/joinCode|guestId|privateRng|accessCode|SESSION/i.test(JSON.stringify(report)));
  const json = matchReportToJson(report), csv = matchReportToCsv(report);
  check(`${label}: JSON export round-trips`, JSON.stringify(JSON.parse(json)) === JSON.stringify(report));
  check(`${label}: CSV export has a header and ${players} seat rows`, csv.trim().split('\n').length === players + 1, csv.split('\n')[0].slice(0, 70));
}

if (MODE === 'a1') {
  const health = await (await fetch(`${BASE}/api/alpha/health`)).json();
  check('health: release alpha-external-1.2-rc5, db + migrations ok, access protected', health.release === 'alpha-external-1.2-rc5' && health.database && health.migration && health.accessProtected, JSON.stringify({ release: health.release, maxSeats: health.maxSeats }));
  const anon = new Seat('anon'); const refused = await anon.call({ operation: 'create', payload: { name: 'x', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 1, planningSeconds: 0 } });
  check('create without the access code is refused', refused.ok === false, refused.error?.code);
  const standard = new Seat('S'); const std = await standard.call({ operation: 'create', accessCode: CODE, payload: { name: 'padrao', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 3, planningSeconds: 0 } });
  check('QUICK without pace stays STANDARD (previous pace)', std.ok && std.value.pace === 'STANDARD', std.value?.pace);
  const rejected = await standard.call({ operation: 'create', accessCode: CODE, payload: { name: 'longa', displayName: 'Ana', preset: 'STANDARD', seatLimit: 2, seed: 3, planningSeconds: 0, pace: 'ACCELERATED' } });
  check('ACCELERATED pace refused outside the 21-round duration', rejected.ok === false, rejected.error?.code);

  const A = new Seat('A'), B = new Seat('B');
  const created = await A.call({ operation: 'create', accessCode: CODE, payload: { name: 'RC5 smoke A', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 21, planningSeconds: 0, pace: 'ACCELERATED' } });
  check('create ACCELERATED short match', created.ok && created.value.pace === 'ACCELERATED', created.ok ? '' : JSON.stringify(created.error));
  const id = created.value.id; const joined = await B.call({ operation: 'join', code: created.value.joinCode, displayName: 'Beto' }); check('second human joins by code', joined.ok);
  const forged = new Seat('forged', 'aoh_alpha_guest=forged.value'); const f = await forged.get(id); check('forged session cannot read the table', !f.ok || !f.value?.game, f.error?.code ?? 'no game');
  const started = await lobbyTo([A, B], id, ['valgard', 'nymara']); check('lobby → match starts', started.ok, started.ok ? '' : JSON.stringify(started.error));
  let view = (await A.get(id)).value; const g0 = view.game;
  const cap = g0.cityStates.find(c => c.cityId === 'capital-1');
  check('accelerated start: capital is Povoado and Elevar asks 5 inhabitants (standard asks 6)', g0.view.round === 1 && cap?.level === 'HAMLET' && cap?.elevate?.minPopulation === 5, JSON.stringify({ level: cap?.level, next: cap?.elevate?.next, min: cap?.elevate?.minPopulation }));
  await A.call({ operation: 'command', gameId: id, payload: { type: 'CHOOSE_AMBITIONS', expectedVersion: g0.version, cardIds: g0.self.ambitions.slice(0, 2) } });
  const v1 = (await A.get(id)).value.game;
  const guard = await A.call({ operation: 'command', gameId: id, payload: { type: 'URBAN_ACTION', expectedVersion: v1.version, cityId: 'capital-1', action: 'RECRUIT', unit: 'GUARD', count: 1 } });
  check('Guarda without Formações de Guarda is refused and names the advance', guard.ok === false && /avanço da Teia/.test(JSON.stringify(guard.error)), JSON.stringify(guard.error?.message ?? '').slice(0, 120));
  const fleet = await A.call({ operation: 'command', gameId: id, payload: { type: 'URBAN_ACTION', expectedVersion: (await A.get(id)).value.game.version, cityId: 'capital-1', action: 'RECRUIT', unit: 'FLEET', count: 1 } });
  check('Frota without Cartografia is refused', fleet.ok === false, JSON.stringify(fleet.error?.message ?? '').slice(0, 120));
  const inf = await A.call({ operation: 'command', gameId: id, payload: { type: 'URBAN_ACTION', expectedVersion: (await A.get(id)).value.game.version, cityId: 'capital-1', action: 'RECRUIT', unit: 'INFANTRY', count: 1 } });
  check('Infantaria (exército básico) is never blocked by an advance (here only by having no free inhabitant)', inf.ok || !/avanço da Teia/.test(JSON.stringify(inf.error)), inf.ok ? 'accepted' : JSON.stringify(inf.error?.message ?? '').slice(0, 120));
  const mid = await playUntil([A, B], id, 10, 'A→r10'); if (!mid) process.exit(1);
  const reload = new Seat('A2', A.cookie); const again = (await reload.get(id)).value;
  check('reload (fresh client, same session) sees the same table', again.version === mid.version && again.game.view.round === mid.game.view.round, `round ${again.game.view.round} v${again.version}`);
  writeFileSync(STATE, JSON.stringify({ id, A: A.cookie, B: B.cookie, version: again.version, round: again.game.view.round, stock: stock(again), at: Date.now() }), { mode: 0o600 });
  console.log(`state saved (round ${again.game.view.round}, version ${again.version})`);
} else if (MODE === 'a2') {
  const s = JSON.parse(readFileSync(STATE, 'utf8')); const A = new Seat('A', s.A), B = new Seat('B', s.B);
  const health = await (await fetch(`${BASE}/api/alpha/health`)).json(); check('health after restart', health.ok && health.database && health.migration);
  const v = (await A.get(s.id)).value;
  check('after restart: same match, same version, same Cofre', v.game && v.version === s.version && stock(v) === s.stock, `round ${v.game?.view?.round} v${v.version}`);
  const end = await playUntil([A, B], s.id, 99, 'A→end'); if (!end) process.exit(1);
  check('match A finishes with a winner', !!finished(end), `round ${round(end)}`);
  const rep = await A.get(s.id, '&report=1'); check('seat A reads the Crônica over HTTP', rep.ok && rep.value, rep.error?.code);
  const repB = await B.get(s.id, '&report=1'); check('seat B reads the same Crônica', repB.ok && repB.value?.reportId === rep.value?.reportId);
  const stranger = await new Seat('x').get(s.id, '&report=1'); check('a stranger cannot read the Crônica', !stranger.ok, stranger.error?.code);
  if (rep.ok) { validateReport(rep.value, { pace: 'ACCELERATED', players: 2, label: 'A' }); writeFileSync(STATE.replace('.json', '-report-A.json'), matchReportToJson(rep.value)); }
} else if (MODE === 'b') {
  const H = new Seat('H'); const created = await H.call({ operation: 'create', accessCode: CODE, payload: { name: 'RC5 smoke B', displayName: 'Ana', preset: 'QUICK', seatLimit: 4, seed: 44, planningSeconds: 0, pace: 'ACCELERATED' } });
  check('create 4-seat ACCELERATED room', created.ok, created.ok ? '' : JSON.stringify(created.error)); const id = created.value.id;
  for (let i = 0; i < 3; i++) await lobby(H, id, { type: 'ADD_BOT' });
  const lob = (await H.get(id)).value; check('player + 3 bots seated', lob.seats.length === 4, String(lob.seats.length));
  const st = await lobbyTo([H], id, ['dravik']); check('match with bots starts', st.ok, st.ok ? '' : JSON.stringify(st.error));
  const end = await playUntil([H], id, 99, 'B→end'); if (!end) process.exit(1);
  check('bot match finishes', !!finished(end), `round ${round(end)}`);
  const rep = await H.get(id, '&report=1'); check('Crônica available for the human seat', rep.ok && rep.value, rep.error?.code);
  if (rep.ok) {
    validateReport(rep.value, { pace: 'ACCELERATED', players: 4, label: 'B' });
    const r = rep.value, sum = f => r.civilizations.reduce((a, c) => a + f(c), 0), kinds = {};
    for (const c of r.civilizations) for (const [k, n] of Object.entries(c.buildings)) kinds[k] = (kinds[k] ?? 0) + n;
    console.log('INFO buildings built by type:', JSON.stringify(kinds));
    console.log('INFO battles:', JSON.stringify(r.conflicts.battles), '| regions discovered:', sum(c => c.regionsDiscovered), '| advances researched:', sum(c => c.research.total), '| max city level:', Math.max(...r.civilizations.map(c => c.cities.maxLevel)));
    console.log('INFO seats:', r.seats.map(s => `${s.seat}:${s.kind}:${s.civilization}`).join(' '), '| winner', r.result.winner);
    writeFileSync(STATE.replace('.json', '-report-B.json'), matchReportToJson(r));
  }
} else { console.error('mode: a1 | a2 | b'); process.exit(2); }
const failed = (await import('./lib/public-smoke-api.mjs')).checks.filter(c => !c.ok);
console.log(failed.length ? `\n${failed.length} FAIL` : '\nALL PASS');
