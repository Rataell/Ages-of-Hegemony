// Closed-alpha smoke test over real HTTP. Works against a local production build or the public domain.
//
//   node scripts/alpha-smoke.mjs health            # GET /api/alpha/health must be ok
//   node scripts/alpha-smoke.mjs play              # lobby -> 2 players -> play a full round -> reload
//   (restart the server process here)
//   node scripts/alpha-smoke.mjs resume            # same match after the restart, then one more round
//
// ALPHA_SMOKE_URL    base URL (default http://127.0.0.1:3000)
// ALPHA_PUBLIC_ORIGIN  sent as Origin; must equal the server's ALPHA_PUBLIC_ORIGIN (default: the base URL)
// ALPHA_SMOKE_STATE  file that carries the match between "play" and "resume"
// It creates one throw-away QUICK match per run and never touches anything else. No credentials are read or printed.
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = (process.env.ALPHA_SMOKE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const ORIGIN = process.env.ALPHA_PUBLIC_ORIGIN ?? BASE;
const STATE = process.env.ALPHA_SMOKE_STATE ?? join(tmpdir(), 'alpha-smoke-state.json');
const stage = process.argv[2];
const log = (...parts) => console.log(...parts);
const check = (label, condition) => { if (!condition) throw new Error(`CHECK FAILED: ${label}`); log('  ok', label); };

async function call(body, cookie = '') {
  const response = await fetch(`${BASE}/api/alpha`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: ORIGIN, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  return { status: response.status, json: await response.json(), cookie: response.headers.getSetCookie?.()[0]?.split(';')[0] };
}
async function read(gameId, cookie) {
  const response = await fetch(`${BASE}/api/alpha?gameId=${gameId}`, { headers: { Cookie: cookie, Origin: ORIGIN } });
  return { status: response.status, json: await response.json() };
}
const ok = (reply, label) => { if (!reply.json.ok) throw new Error(`${label}: ${reply.status} ${JSON.stringify(reply.json.error)}`); return reply.json.value; };
const view = async (id, cookie) => ok(await read(id, cookie), 'read');
const act = async (id, cookie, payload) => call({ operation: 'command', gameId: id, payload: { ...payload, expectedVersion: (await view(id, cookie)).game.version } }, cookie);

/** Every player does what the phase asks of them, then confirms; the phase closes when the last one confirms. */
async function advanceOnePhase(id, cookies) {
  for (const cookie of cookies) {
    let v = await view(id, cookie);
    if (v.game.worldDecisionPending) await act(id, cookie, { type: 'WORLD_CHOICE', choice: 'RESOURCE' });
    v = await view(id, cookie);
    if (!v.game.self.ambitionsChosen && v.game.phase === 'PLANNING') ok(await act(id, cookie, { type: 'CHOOSE_AMBITIONS', cardIds: v.game.self.ambitions.slice(0, 2) }), 'ambitions');
    v = await view(id, cookie);
    if (v.game.phase === 'URBAN_ACTIONS' && !v.game.self.ready) ok(await act(id, cookie, { type: 'URBAN_ACTION', cityId: v.game.view.player.civilization.cities[0].id, action: 'PRODUCE' }), 'produce');
    v = await view(id, cookie);
    if (!v.game.self.ready) ok(await act(id, cookie, { type: 'READY' }), 'ready');
  }
  return view(id, cookies[0]);
}
async function playRound(id, cookies, from) {
  let game = from, guard = 0;
  const startRound = game.game.view.round;
  while (game.game.view.round === startRound && guard++ < 30) game = await advanceOnePhase(id, cookies);
  return game;
}

if (stage === 'health') {
  const response = await fetch(`${BASE}/api/alpha/health`), body = await response.json();
  log(JSON.stringify(body));
  check('health answers 200 with ok=true', response.status === 200 && body.ok === true);
  if (body.storage === 'memory') {
    // The zero-config development server. A public server must never report it.
    check('memory storage is only acceptable on a local address', ['127.0.0.1', 'localhost'].includes(new URL(BASE).hostname));
  } else check('database and migrations are ready', body.database === true && body.migration === true);
  check('release is labelled', typeof body.release === 'string' && body.release.startsWith('alpha-'));
} else if (stage === 'play') {
  const a = await call({ operation: 'create', payload: { name: 'Smoke', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 7, planningSeconds: 0 } });
  let v = ok(a, 'create');
  const b = await call({ operation: 'join', code: v.joinCode, displayName: 'Beto' });
  v = ok(b, 'join');
  check('lobby has two seats', v.seats.length === 2);
  for (const [cookie, civilization] of [[a.cookie, 'aurelia'], [b.cookie, 'valgard']]) {
    v = ok(await call({ operation: 'lobby', gameId: v.id, payload: { type: 'CHOOSE_CIVILIZATION', expectedVersion: v.version, civilization } }, cookie), 'choose civilization');
    v = ok(await call({ operation: 'lobby', gameId: v.id, payload: { type: 'LOBBY_READY', expectedVersion: v.version, ready: true } }, cookie), 'lobby ready');
  }
  v = ok(await call({ operation: 'lobby', gameId: v.id, payload: { type: 'START', expectedVersion: v.version } }, a.cookie), 'start');
  const id = v.id, viewA = await view(id, a.cookie), viewB = await view(id, b.cookie);
  check('two different seats, private hands differ', viewA.selfPlayerId !== viewB.selfPlayerId && JSON.stringify(viewA.game.self.hand) !== JSON.stringify(viewB.game.self.hand));
  check('a forged session is refused', (await read(id, 'aoh_alpha_session=forged')).status !== 200);
  const round = await playRound(id, [a.cookie, b.cookie], viewA);
  check(`a full round was played (now round ${round.game.view.round})`, round.game.view.round === viewA.game.view.round + 1);
  const reloaded = await view(id, a.cookie);
  check('reload (new request, same session) returns the same state', reloaded.game.version === round.game.version);
  writeFileSync(STATE, JSON.stringify({ id, a: a.cookie, b: b.cookie, version: round.game.version, round: round.game.view.round, resources: round.game.self.resources }));
  log(`match ${id} saved for "resume"`);
} else if (stage === 'resume') {
  const saved = JSON.parse(readFileSync(STATE, 'utf8'));
  const viewA = await view(saved.id, saved.a), viewB = await view(saved.id, saved.b);
  check('the match survived the restart at the same version', viewA.game.version === saved.version);
  check('both seats are still theirs', viewA.selfPlayerId !== viewB.selfPlayerId);
  check('resources were preserved', JSON.stringify(viewA.game.self.resources) === JSON.stringify(saved.resources));
  const round = await playRound(saved.id, [saved.a, saved.b], viewA);
  check(`play continued after the restart (round ${saved.round} -> ${round.game.view.round})`, round.game.view.round === saved.round + 1);
} else {
  console.error('usage: node scripts/alpha-smoke.mjs health|play|resume');
  process.exit(2);
}
log('SMOKE OK', stage);
