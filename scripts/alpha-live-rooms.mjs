// Live room-lifecycle check against a deployed alpha (API level, three guests): lobby kick/resize/close, EM GUARDA by vote + reassume, end-by-vote read-only.
import { chromium } from '@playwright/test';
const BASE = process.env.ALPHA_BASE_URL, CODE = process.env.ALPHA_ACCESS_CODE ?? '';
const browser = await chromium.launch();
const guest = async () => { const p = await (await browser.newContext()).newPage(); await p.goto(`${BASE}/alpha`); return p; };
const post = (p, body) => p.evaluate(async ([base, b]) => (await fetch(`${base}/api/alpha`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })).json(), [BASE, body]);
const get = (p, id) => p.evaluate(async ([base, i]) => (await fetch(`${base}/api/alpha?gameId=${i}`, { cache: 'no-store' })).json(), [BASE, id]);
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' · ' + extra : ''}`); if (!ok) process.exitCode = 1; };
try {
  const [a, b, c] = [await guest(), await guest(), await guest()];
  // LOBBY: 3 seats, kick, resize, close
  let r = await post(a, { operation: 'create', accessCode: CODE, payload: { name: 'Lobby', displayName: 'Ana', preset: 'QUICK', seatLimit: 3, seed: 5, planningSeconds: 0 } });
  const id = r.value.id, code = r.value.joinCode;
  await post(b, { operation: 'join', accessCode: CODE, code, displayName: 'Beto' }); await post(c, { operation: 'join', accessCode: CODE, code, displayName: 'Cleo' });
  r = await get(a, id); check('lobby: 3 seats joined', r.value.seats.length === 3);
  const tooMany = await post(a, { operation: 'create', accessCode: CODE, payload: { name: 'x', displayName: 'Ana', preset: 'QUICK', seatLimit: 5, seed: 5, planningSeconds: 0 } });
  check('create with 5 seats is refused (2–4 only)', !tooMany.ok);
  let k = await post(a, { operation: 'lobby', gameId: id, payload: { type: 'KICK', playerId: 'player-3', expectedVersion: r.value.version } });
  check('host kicks a player before start', k.ok && k.value.seats.length === 2);
  check('kicked guest can no longer read the room', !(await get(c, id)).ok);
  const nonHostClose = await post(b, { operation: 'lobby', gameId: id, payload: { type: 'CLOSE_ROOM', expectedVersion: k.value.version } });
  check('a guest cannot close the room', !nonHostClose.ok);
  const closed = await post(a, { operation: 'lobby', gameId: id, payload: { type: 'CLOSE_ROOM', expectedVersion: k.value.version } });
  check('host closes the room → CLOSED', closed.ok && closed.value.lifecycle === 'CLOSED');
  // ACTIVE: 3 players, vote → EM GUARDA → reassume; then END vote → CLOSED, read-only
  r = await post(a, { operation: 'create', accessCode: CODE, payload: { name: 'Active', displayName: 'Ana', preset: 'QUICK', seatLimit: 3, seed: 9, planningSeconds: 0 } });
  const id2 = r.value.id, code2 = r.value.joinCode; await post(b, { operation: 'join', accessCode: CODE, code: code2, displayName: 'Beto' }); await post(c, { operation: 'join', accessCode: CODE, code: code2, displayName: 'Cleo' });
  let v = (await get(a, id2)).value.version;
  for (const [p, civ] of [[a, 'aurelia'], [b, 'valgard'], [c, 'thalos']]) { const x = await post(p, { operation: 'lobby', gameId: id2, payload: { type: 'CHOOSE_CIVILIZATION', civilization: civ, expectedVersion: v } }); v = x.value.version; const y = await post(p, { operation: 'lobby', gameId: id2, payload: { type: 'LOBBY_READY', ready: true, expectedVersion: v } }); v = y.value.version; }
  const st = await post(a, { operation: 'lobby', gameId: id2, payload: { type: 'START', expectedVersion: v } }); check('3-player match starts', st.ok && st.value.lifecycle === 'ACTIVE');
  for (const p of [a, b, c]) await get(p, id2); // presence: everybody seen now
  const prop = await post(a, { operation: 'room', gameId: id2, payload: { type: 'PROPOSE_REMOVE', target: 'player-3' } }); check('proposing EM GUARDA opens a vote', prop.ok && prop.value.vote?.kind === 'REMOVE');
  const yes = await post(b, { operation: 'room', gameId: id2, payload: { type: 'VOTE', yes: true } });
  check('majority puts the civilization EM GUARDA (not deleted)', yes.ok && yes.value.seats[2].onGuard === true && yes.value.game.players.length === 3);
  const gv = (await get(c, id2)).value;
  const refused = await post(c, { operation: 'command', gameId: id2, payload: { type: 'READY', expectedVersion: gv.game.version } });
  check('EM GUARDA seat gets no human Orders', !refused.ok && refused.error.code === 'ON_GUARD');
  const back = await post(c, { operation: 'room', gameId: id2, payload: { type: 'RESUME_SEAT' } }); check('reassume works', back.ok && back.value.selfOnGuard === false);
  await post(a, { operation: 'room', gameId: id2, payload: { type: 'PROPOSE_END' } });
  const end = await post(b, { operation: 'room', gameId: id2, payload: { type: 'VOTE', yes: true } });
  check('end-by-vote closes the match', end.ok && end.value.lifecycle === 'CLOSED');
  const ro = await post(a, { operation: 'command', gameId: id2, payload: { type: 'READY', expectedVersion: (await get(a, id2)).value.game.version } });
  check('CLOSED is read-only (Orders refused, table still readable)', !ro.ok && ro.error.code === 'ROOM_CLOSED' && (await get(a, id2)).ok);
} finally { await browser.close(); }
