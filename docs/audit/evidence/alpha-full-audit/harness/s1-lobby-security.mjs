// Sessions, seats, lobby rules, invites, creation options, request hardening, privacy of private hands. Real HTTP, real sessions.
import { BASE, Player, check, finding, save, seat, startMatch, defaultCreate, okOrThrow, summarizeLog, sleep, LOG } from './lib.mjs';

const section = t => console.log(`\n## ${t}`);
const out = {};

section('C · 6 seats, isolation, 7th refused');
{
  const { players, roomId, code, view } = await seat(6);
  const seats = view.seats;
  check('6 seats occupied with the players\' names', seats.length === 6 && seats.map(s => s.name).join('|') === players.map(p => p.name).join('|'), seats.map(s => s.name).join(','));
  const views = await Promise.all(players.map(p => p.get(roomId)));
  const selves = views.map(v => v.value.selfPlayerId);
  check('each cookie resolves to its own seat', new Set(selves).size === 6, selves.join(','));
  check('cookies are distinct per browser', new Set(players.map(p => p.cookie)).size === 6);
  const g = new Player('Jogador G');
  const seventh = await g.join(code, 'Jogador G', { expect: [400] });
  check('7th player refused (LOBBY_CLOSED)', !seventh.ok && seventh.error?.code === 'LOBBY_CLOSED', JSON.stringify(seventh.error));
  check('refused join did not issue a session cookie', g.cookie === '');
  const again = await players[2].join(code, 'Jogador C');
  check('same session joining again keeps its seat (idempotent)', again.ok && again.value.seats.length === 6 && again.value.selfPlayerId === selves[2]);
  const renamed = await players[2].join(code, 'Outro Nome');
  check('re-join with another display name does not rename or duplicate the seat', renamed.ok && renamed.value.seats.length === 6 && renamed.value.seats.find(s => s.playerId === selves[2]).name === 'Jogador C', renamed.value?.seats?.find(s => s.playerId === selves[2])?.name);
  const outsider = await g.get(roomId, { expect: [401] });
  check('no session reads nothing (401)', outsider.status === 401);
  const other = new Player('Estranho'); const lonely = await other.create(defaultCreate({ name: 'Outra mesa' }));
  const cross = await other.get(roomId, { expect: [403] });
  check('a session from another table cannot read this room (403)', cross.status === 403, JSON.stringify(cross.error));
  out.sixSeats = { roomId };
}

section('F · lobby rules with 3 players');
{
  const { players, roomId } = await seat(3);
  const [A, B, C] = players;
  let v = (await A.get(roomId)).value.version;
  const a1 = await A.lobby(roomId, { type: 'CHOOSE_CIVILIZATION', expectedVersion: v, civilization: 'aurelia' }); v = a1.value.version;
  const dup = await B.lobby(roomId, { type: 'CHOOSE_CIVILIZATION', expectedVersion: v, civilization: 'aurelia' }, { expect: [400] });
  check('duplicate civilization refused', !dup.ok, JSON.stringify(dup.error));
  const bad = await B.lobby(roomId, { type: 'CHOOSE_CIVILIZATION', expectedVersion: v, civilization: 'atlantis' }, { expect: [400] });
  check('unknown civilization refused', !bad.ok, JSON.stringify(bad.error));
  const noCiv = await C.lobby(roomId, { type: 'LOBBY_READY', expectedVersion: v, ready: true }, { expect: [400] });
  check('cannot be ready without a civilization', !noCiv.ok, JSON.stringify(noCiv.error));
  const b1 = await B.lobby(roomId, { type: 'CHOOSE_CIVILIZATION', expectedVersion: v, civilization: 'valgard' }); v = b1.value.version;
  const c1 = await C.lobby(roomId, { type: 'CHOOSE_CIVILIZATION', expectedVersion: v, civilization: 'meridia' }); v = c1.value.version;
  const swap = await C.lobby(roomId, { type: 'CHOOSE_CIVILIZATION', expectedVersion: v, civilization: 'thalos' }); v = swap.value.version;
  check('changing civilization before ready works and frees the old one', swap.ok && !swap.value.seats.some(s => s.civilization === 'meridia'));
  const ra = await A.lobby(roomId, { type: 'LOBBY_READY', expectedVersion: v, ready: true }); v = ra.value.version;
  const change = await A.lobby(roomId, { type: 'CHOOSE_CIVILIZATION', expectedVersion: v, civilization: 'kor' }, { expect: [400] });
  check('a ready player cannot change civilization', !change.ok, JSON.stringify(change.error));
  const early = await A.lobby(roomId, { type: 'START', expectedVersion: v }, { expect: [400] });
  check('host cannot start before everyone is ready', !early.ok, JSON.stringify(early.error));
  const rb = await B.lobby(roomId, { type: 'LOBBY_READY', expectedVersion: v, ready: true }); v = rb.value.version;
  const rc = await C.lobby(roomId, { type: 'LOBBY_READY', expectedVersion: v, ready: true }); v = rc.value.version;
  const guestStart = await B.lobby(roomId, { type: 'START', expectedVersion: v }, { expect: [400, 403] });
  check('a guest cannot start the match', !guestStart.ok, JSON.stringify(guestStart.error));
  const unready = await B.lobby(roomId, { type: 'LOBBY_READY', expectedVersion: v, ready: false }); v = unready.value.version;
  check('"Voltar à preparação" works', unready.ok && unready.value.seats.find(s => s.playerId === unready.value.selfPlayerId).ready === false);
  const stale = await B.lobby(roomId, { type: 'LOBBY_READY', expectedVersion: v - 1, ready: true }, { expect: [409] });
  check('stale expectedVersion is a VERSION_CONFLICT (409)', stale.status === 409 && stale.error?.code === 'VERSION_CONFLICT', JSON.stringify(stale.error));
  // real concurrency: same expectedVersion, two different players, fired together
  const racers = await Promise.all([B.lobby(roomId, { type: 'LOBBY_READY', expectedVersion: v, ready: true }, { expect: [200, 409] }), C.lobby(roomId, { type: 'LOBBY_READY', expectedVersion: v, ready: false }, { expect: [200, 409] })]);
  const statuses = racers.map(r => r.status).sort();
  check('two lobby writes at the same version: exactly one wins, one conflicts', statuses.join() === '200,409', statuses.join());
  const final = (await A.get(roomId)).value;
  check('after the race the room is consistent (version increased exactly once)', final.version === v + 1, `v=${v} final=${final.version}`);
  const gone = await A.get(roomId);
  out.lobby3 = { roomId, version: gone.value.version };
}

section('E · invites: join by code, invalid and unknown codes');
{
  const { players, roomId, code } = await seat(2);
  const stranger = new Player('Convidado');
  for (const bad of ['', 'abc', 'x'.repeat(21), 'x'.repeat(23), '!'.repeat(22), '../../etc/passwd'.padEnd(22, 'a')]) {
    const r = await stranger.join(bad, 'Convidado', { expect: [400] });
    check(`invalid code "${bad.slice(0, 12)}" refused with 400`, r.status === 400, `${r.status} ${r.error?.code}`);
  }
  const unknown = await stranger.join('A'.repeat(22), 'Convidado', { expect: [404] });
  check('well-formed but unknown code is 404 NOT_FOUND', unknown.status === 404 && unknown.error?.code === 'NOT_FOUND', `${unknown.status} ${unknown.error?.code}`);
  const empty = await stranger.join(code, '   ', { expect: [400] });
  check('blank display name refused', empty.status === 400);
  const longName = await stranger.join(code, 'n'.repeat(81), { expect: [400] });
  check('display name over 80 chars refused', longName.status === 400);
  const maxName = await stranger.join(code, 'n'.repeat(80), { expect: [200] });
  check('display name of exactly 80 chars accepted', maxName.ok || maxName.error?.code === 'LOBBY_CLOSED', `${maxName.status} ${maxName.error?.code}`);
  const special = new Player('Especial'); const sp = await special.create(defaultCreate({ displayName: 'Zé <b>Ação</b> ✓ & "q"', name: 'Mesa <i>x</i> & cia' }));
  check('special characters are stored verbatim (escaping is the UI\'s job)', sp.ok && sp.value.seats[0].name === 'Zé <b>Ação</b> ✓ & "q"', sp.value?.seats?.[0]?.name);
  const trimmed = new Player('Trim'); const tr = await trimmed.create(defaultCreate({ displayName: '   Ana   ', name: '  Mesa  ' }));
  check('whitespace around names is trimmed', tr.ok && tr.value.seats[0].name === 'Ana' && tr.value.name === 'Mesa', `${tr.value?.seats?.[0]?.name}|${tr.value?.name}`);
}

section('D · creation options: every advertised option is accepted, every invalid one refused');
{
  const p = new Player('Criador');
  const tried = [];
  const ok = async (label, over, want = true) => { const r = await new Player('c').create(defaultCreate(over)); const good = r.ok === want; tried.push({ label, status: r.status, ok: r.ok }); check(label, good, r.ok ? '' : `${r.status} ${JSON.stringify(r.error)}`); return r; };
  for (const w of ['CONTINENTAL', 'ARCHIPELAGO', 'INLAND_SEA', 'MIXED']) await ok(`worldPreset ${w}`, { worldPreset: w });
  for (const d of ['QUICK', 'STANDARD', 'EPIC']) await ok(`preset ${d}`, { preset: d });
  for (const n of [2, 3, 4, 5, 6]) await ok(`seatLimit ${n}`, { seatLimit: n });
  for (const s of [0, 180, 300, 480, 3600, 14400, 28800]) await ok(`planningSeconds ${s}`, { planningSeconds: s });
  for (const s of [0, 1, 4294967295]) await ok(`seed ${s}`, { seed: s });
  await ok('name of 80 chars', { name: 'n'.repeat(80) });
  for (const [label, over] of [['seatLimit 1', { seatLimit: 1 }], ['seatLimit 7', { seatLimit: 7 }], ['planningSeconds 900 (removed option)', { planningSeconds: 900 }], ['planningSeconds 43200 (removed option)', { planningSeconds: 43200 }], ['seed -1', { seed: -1 }], ['seed 4294967296', { seed: 4294967296 }], ['seed 1.5', { seed: 1.5 }], ['unknown worldPreset', { worldPreset: 'PANGEA' }], ['unknown preset', { preset: 'HUGE' }], ['empty name', { name: '   ' }], ['name of 81 chars', { name: 'n'.repeat(81) }], ['extra field (strict)', { mapSize: 91 }], ['mapSize 37 is not a supported option', { regions: 37 }]]) await ok(`refused: ${label}`, over, false);
  out.creation = tried;
  const noPreset = await new Player('d').post({ operation: 'create', payload: (({ worldPreset, ...rest }) => rest)(defaultCreate()) });
  check('worldPreset is optional and defaults to MIXED', noPreset.ok && noPreset.value.worldPreset === 'MIXED', noPreset.value?.worldPreset);
}

section('X · request hardening and forged identity');
{
  const { players, roomId } = await startMatch(2);
  const [A, B] = players;
  const va = (await A.get(roomId)).value, vb = (await B.get(roomId)).value;
  check('match started with two different seats', va.selfPlayerId !== vb.selfPlayerId);
  const noCookie = await new Player('x').get(roomId, { expect: [401] }); check('GET without cookie → 401', noCookie.status === 401);
  const junk = await new Player('x').get(roomId, { cookie: 'aoh_alpha_session=abc.def.ghi', expect: [401] }); check('GET with an invalid cookie → 401', junk.status === 401);
  const tampered = A.cookie.slice(0, -2) + (A.cookie.endsWith('AA') ? 'BB' : 'AA');
  const t = await new Player('x').get(roomId, { cookie: tampered, expect: [401] }); check('GET with a tampered signature → 401', t.status === 401);
  const swapped = A.cookie.replace(/^([^=]+=)[^.]+/, `$1${B.cookie.split('=')[1].split('.')[0]}`);
  const sw = await new Player('x').get(roomId, { cookie: swapped, expect: [401] }); check("A's signature with B's guest id → 401", sw.status === 401);
  const badId = await A.get('not-a-uuid', { expect: [400] }); check('gameId that is not a uuid → 400', badId.status === 400);
  const missing = await A.get('00000000-0000-4000-8000-000000000000', { expect: [404] }); check('unknown gameId → 404', missing.status === 404);
  const post = (over) => A.post({ operation: 'command', gameId: roomId, payload: { type: 'READY', expectedVersion: va.game.version } }, over);
  const noOrigin = await post({ origin: '', expect: [403] }); check('POST without Origin → 403', noOrigin.status === 403);
  const wrong = await post({ origin: 'http://evil.example', expect: [403] }); check('POST with a foreign Origin → 403', wrong.status === 403);
  const cross = await post({ headers: { 'Sec-Fetch-Site': 'cross-site' }, expect: [403] }); check('POST with Sec-Fetch-Site cross-site → 403', cross.status === 403);
  const crossGet = await A.get(roomId, { headers: { 'Sec-Fetch-Site': 'cross-site' }, expect: [403] }); check('GET with Sec-Fetch-Site cross-site → 403', crossGet.status === 403);
  for (const method of ['PUT', 'DELETE', 'PATCH']) { const r = await fetch(`${BASE}/api/alpha`, { method, headers: { Origin: BASE, Cookie: A.cookie } }); LOG.push({ who: 'x', method, op: 'raw', status: r.status, code: null, expected: r.status === 405 }); check(`${method} → 405`, r.status === 405); }
  const text = await A.post(null, { raw: JSON.stringify({ operation: 'command' }), type: 'text/plain', expect: [400] }); check('Content-Type text/plain → 400', text.status === 400);
  const big = await A.post(null, { raw: JSON.stringify({ operation: 'command', gameId: roomId, payload: { pad: 'x'.repeat(20000) } }), expect: [400] }); check('body over 16 KiB → 400', big.status === 400);
  const bad = await A.post(null, { raw: '{"operation":', expect: [400] }); check('invalid JSON → 400', bad.status === 400);
  const extra = await A.post({ operation: 'command', gameId: roomId, payload: { type: 'READY', expectedVersion: 0 }, playerId: 'p2' }, { expect: [400] }); check('unknown envelope field (playerId at top level) → 400', extra.status === 400);
  const unknownOp = await A.post({ operation: 'admin', gameId: roomId }, { expect: [400] }); check('unknown operation → 400', unknownOp.status === 400);
  const nopay = await A.command(roomId, { type: 'DROP_TABLE', expectedVersion: va.game.version }, { expect: [400] }); check('unknown command type → 400', nopay.status === 400);
  const cityA = va.game.view.player.civilization.cities[0], cityB = vb.game.view.player.civilization.cities[0];
  const forged = await A.command(roomId, { type: 'MANAGE', expectedVersion: va.game.version, command: { type: 'ASSIGN_WORKED_HEXES', playerId: vb.selfPlayerId, cityId: cityB.id, hexIds: [cityB.hexId], expectedVersion: va.game.view.version } }, { expect: [200, 400, 403] });
  check("A cannot manage B's city by forging playerId", !forged.ok, `${forged.status} ${JSON.stringify(forged.error)}`);
  const after = (await B.get(roomId)).value;
  check("B's state unchanged by the forged command", after.game.version === vb.game.version);
  const forged2 = await A.command(roomId, { type: 'MANAGE', expectedVersion: va.game.version, command: { type: 'CLAIM_HEX', playerId: vb.selfPlayerId, cityId: cityA.id, hexId: cityA.hexId, expectedVersion: va.game.view.version } }, { expect: [200, 400, 403] });
  check("MANAGE with B's playerId does not act as B (result never applied to B)", (await B.get(roomId)).value.game.version === after.game.version || !forged2.ok, `${forged2.status} ${JSON.stringify(forged2.error)}`);
  const stolen = await A.command(roomId, { type: 'PLAY_CARD', cardId: vb.game.self.hand[0], expectedVersion: va.game.version }, { expect: [400] });
  check("A cannot play a card from B's hand", !stolen.ok, JSON.stringify(stolen.error));
  const ambition = await A.command(roomId, { type: 'CHOOSE_AMBITIONS', cardIds: vb.game.self.ambitions.slice(0, 2), expectedVersion: va.game.version }, { expect: [400] });
  check("A cannot choose B's ambition cards", !ambition.ok, JSON.stringify(ambition.error));
  const jA = JSON.stringify(va.game), jB = JSON.stringify(vb.game);
  const handsLeak = vb.game.self.hand.some(id => jA.includes(`"${id}"`)) || vb.game.self.ambitions.some(id => jA.includes(`"${id}"`));
  check("B's private hand/ambition ids never appear in A's projection", !handsLeak);
  check('projection never contains the private RNG seed, counter or core state', !/privateRng|"seed"|"counter"|"core"|hmac/i.test(jA + jB));
  check('the other player is never given hand/orders/research in the public list', va.game.players.every(p => p.id === va.selfPlayerId || (!('hand' in p) && !('orders' in p) && !('ambitions' in p))));
  out.security = { roomId };
}
save('s1-lobby-security', { out, summary: summarizeLog() });
console.log('\nrequests', LOG.length, JSON.stringify(summarizeLog()));
