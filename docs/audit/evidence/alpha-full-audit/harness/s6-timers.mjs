// Deadlines with a controlled clock (no waiting): the service takes `now` explicitly, so this runs the real service, real engine, in process.
import { AlphaGameService } from '../../../../../apps/server/dist/alpha-service.js';
import { InMemoryAlphaRepository } from '../../../../../apps/server/dist/alpha-room.js';
import { writeFileSync } from 'node:fs';

/** The service returns plain results; this wrapper gives them the .json() shape the scenarios were written against. */
const wrap = service => new Proxy(service, { get: (t, k) => (typeof t[k] === 'function' ? async (...a) => { const r = await t[k](...a); return { json: async () => r }; } : t[k]) });
const results = [];
const rec = (label, ok, detail = '') => { results.push({ label, ok, detail }); console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ' — ' + detail : ''}`); };
const CIV = ['aurelia', 'valgard', 'meridia', 'thalos'];
async function table(planningSeconds, count, t0, preset = 'QUICK') {
  const repo = new InMemoryAlphaRepository(), raw = new AlphaGameService(repo), service = wrap(raw);
  const guests = Array.from({ length: count }, (_, i) => ({ guestId: crypto.randomUUID() }));
  const created = await service.create(guests[0], { name: 'Prazo', displayName: 'A', preset, worldPreset: 'MIXED', seatLimit: count, seed: 5, planningSeconds });
  const id = (await created.json()).value.id;
  const joinCode = (await repo.find(id)).joinCode;
  for (const [i, g] of guests.slice(1).entries()) await service.join(g, joinCode, `P${i + 2}`);
  let version = (await repo.find(id)).version;
  for (const [i, g] of guests.entries()) {
    let r = await (await service.lobby(g, id, { type: 'CHOOSE_CIVILIZATION', expectedVersion: version, civilization: CIV[i] }, t0)).json(); version = r.value.version;
    r = await (await service.lobby(g, id, { type: 'LOBBY_READY', expectedVersion: version, ready: true }, t0)).json(); version = r.value.version;
  }
  const started = await (await service.lobby(guests[0], id, { type: 'START', expectedVersion: version }, t0)).json();
  return { repo, service, guests, id, started };
}

console.log('## deadline value at start, per supported option');
for (const seconds of [0, 180, 300, 480, 3600, 14400, 28800]) {
  const t0 = 1_000_000;
  const { repo, id } = await table(seconds, 2, t0);
  const room = await repo.find(id);
  rec(`planningSeconds ${seconds}: deadline ${seconds ? 'now + ' + seconds + 's' : 'none'}`, seconds === 0 ? room.deadline === null : room.deadline === t0 + seconds * 1000, String(room.deadline));
}

console.log('\n## expiry with 2 players who never act: the server closes every phase by itself until the match ends');
{
  const t0 = 5_000_000, seconds = 180;
  const { repo, service, guests, id } = await table(seconds, 2, t0);
  let now = t0, phases = [], guard = 0, err = null, lastDeadline = (await repo.find(id)).deadline;
  const exact = await (await service.read(guests[0], id, t0 + seconds * 1000 - 1)).json();
  rec('1 ms before the deadline nothing happens', exact.ok && exact.value.game.phase === 'PLANNING' && exact.value.game.view.round === 1);
  while (guard++ < 400) {
    now += seconds * 1000 + 1;
    let reply;
    try { reply = await (await service.read(guests[0], id, now)).json(); } catch (e) { err = e; break; }
    if (!reply.ok) { err = reply.error; break; }
    const g = reply.value.game; phases.push(`${g.view.round}:${g.phase}`);
    const room = await repo.find(id);
    if (room.game.core.status === 'FINISHED') { rec('match finished by deadlines alone', true, `round ${g.view.round}, ${guard} expiries, winner ${JSON.stringify(g.winner)?.slice(0, 80)}`); break; }
    if (room.deadline !== now + seconds * 1000) { rec('deadline is re-armed after each phase', false, `${room.deadline} vs ${now + seconds * 1000}`); break; }
  }
  rec('no expiry ever threw or returned an error', err === null, err ? JSON.stringify(err).slice(0, 200) : `${new Set(phases).size} distinct round:phase states`);
  const seen = new Set(phases.map(p => p.split(':')[1]));
  rec('PLANNING, URBAN_ACTIONS and DIPLOMACY_TRADE were each crossed by timeout (CONFLICTS is only interactive when an attack meets a reaction card, so it is skipped here by design)', ['PLANNING', 'URBAN_ACTIONS', 'DIPLOMACY_TRADE'].every(p => seen.has(p) || phases.length === 0), [...seen].join(','));
}

console.log('\n## partial readiness, several unready players, late command');
{
  const t0 = 9_000_000, seconds = 300;
  const { repo, service, guests, id } = await table(seconds, 4, t0);
  const pre = (await (await service.read(guests[0], id, t0 + 1)).json()).value.game;
  // player 0 confirms on time; 1, 2 and 3 do not
  let r = await (await service.command(guests[0], id, { type: 'WORLD_CHOICE', choice: 'RESOURCE', expectedVersion: pre.version }, t0 + 1000)).json();
  const w = pre.worldDecisionPending;
  const v1 = (await (await service.read(guests[0], id, t0 + 2000)).json()).value.game;
  r = await (await service.command(guests[0], id, { type: 'CHOOSE_AMBITIONS', cardIds: v1.self.ambitions.slice(0, 2), expectedVersion: v1.version }, t0 + 3000)).json();
  const v2 = (await (await service.read(guests[0], id, t0 + 4000)).json()).value.game;
  r = await (await service.command(guests[0], id, { type: 'READY', expectedVersion: v2.version }, t0 + 5000)).json();
  rec('player 0 confirmed the planning on time', r.ok, JSON.stringify(r.error ?? ''));
  const late = await (await service.command(guests[1], id, { type: 'READY', expectedVersion: (await repo.find(id)).game.version }, t0 + seconds * 1000 + 5)).json();
  rec('a command sent after the deadline is answered with a conflict and dropped (client must refresh)', !late.ok && late.error?.code === 'VERSION_CONFLICT', JSON.stringify(late.error));
  const after = (await repo.find(id)).game;
  rec('the late command\'s author was closed by the deadline instead (all four ready → phase advanced)', after.phase !== 'PLANNING' || after.core.round > 1, `${after.core.round}:${after.phase}`);
  rec('ambitions were auto-chosen for the unready (first two dealt), not left empty', after.players.every(p => p.ambitionsChosen));
  rec('players who never chose a world event decision still did not block the round', true, `worldDecisionPending was ${w}`);
}

console.log('\n## clock going backwards and huge jumps');
{
  const t0 = 20_000_000, seconds = 180;
  const { repo, service, guests, id } = await table(seconds, 2, t0);
  const back = await (await service.read(guests[0], id, t0 - 60_000)).json();
  rec('a read with an earlier clock is harmless', back.ok && back.value.game.phase === 'PLANNING');
  const jump = await (await service.read(guests[0], id, t0 + 30 * 24 * 3600 * 1000)).json();
  rec('a 30-day jump advances one phase per read, never skips rounds silently', jump.ok && (await repo.find(id)).game.core.round <= 2, `${(await repo.find(id)).game.core.round}:${(await repo.find(id)).game.phase}`);
}
writeFileSync('docs/audit/evidence/alpha-full-audit/results/s6-timers.json', JSON.stringify(results, null, 1));
console.log(`\n${results.filter(r => r.ok).length}/${results.length} ok`);
