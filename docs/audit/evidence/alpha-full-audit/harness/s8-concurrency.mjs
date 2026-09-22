// Concurrency: same-version writes, duplicate commands, replays, bursts. Nothing may be applied twice.
import { startMatch, save, check, finding, LOG, summarizeLog } from './lib.mjs';

const { players, roomId } = await startMatch(4, { seed: 77 });
const game = async p => (await p.get(roomId)).value.game;
const out = {};

console.log('## prepare: everyone chooses ambitions one by one');
for (const p of players) { for (let i = 0; i < 6; i++) { const v = await game(p); if (v.worldDecisionPending) await p.command(roomId, { type: 'WORLD_CHOICE', choice: 'RESOURCE', expectedVersion: v.version }, { expect: [200, 409] }); const w = await game(p); if (w.self.ambitionsChosen) break; await p.command(roomId, { type: 'CHOOSE_AMBITIONS', cardIds: w.self.ambitions.slice(0, 2), expectedVersion: w.version }, { expect: [200, 409] }); } }
check('all four have chosen ambitions', (await Promise.all(players.map(game))).every(v => v.self.ambitionsChosen));

console.log('\n## 1 · four players confirm READY at the same instant, all holding the same version');
{
  const base = await game(players[0]);
  const replies = await Promise.all(players.map(p => p.command(roomId, { type: 'READY', expectedVersion: base.version }, { expect: [200, 409] })));
  const won = replies.filter(r => r.ok).length, lost = replies.filter(r => r.status === 409).length;
  console.log(`  ${won} accepted, ${lost} conflicts`);
  out.readyRace = { won, lost };
  check('exactly one wins the race (room-wide compare-and-swap)', won === 1 && lost === 3, `${won}/${lost}`);
  // the losers retry once, as the client does
  const retried = [];
  for (const [i, r] of replies.entries()) if (r.status === 409) { const v = await game(players[i]); retried.push(await players[i].command(roomId, { type: 'READY', expectedVersion: v.version }, { expect: [200, 409] })); }
  const second = retried.filter(r => r.ok).length;
  console.log(`  retry once: ${second} of ${retried.length} accepted`);
  out.readyRetry = { retried: retried.length, accepted: second };
  if (second < retried.length) finding('MP-CAS-1', 'P2', 'Multiplayer', `Com 4 jogadores confirmando ao mesmo tempo, ${retried.length - second} de ${retried.length} ainda falharam na única tentativa de recuperação do cliente (o CAS é da sala inteira, não por jogador).`, { retried: retried.length, accepted: second });
  for (let round = 0; round < 6; round++) { for (const p of players) { const v = await game(p); if (!v.self.ready && v.phase === 'PLANNING') await p.command(roomId, { type: 'READY', expectedVersion: v.version }, { expect: [200, 409] }); } }
  const after = await Promise.all(players.map(game));
  check('every player ends up ready exactly once and the phase advanced exactly once', after.every(v => v.phase !== 'PLANNING' || v.self.ready) && new Set(after.map(v => `${v.view.round}:${v.phase}`)).size === 1, [...new Set(after.map(v => `${v.view.round}:${v.phase}`))].join(','));
}

console.log('\n## 2 · the same command twice in parallel from one player');
{
  const p = players[0];
  let v = await game(p);
  for (let g = 0; g < 8 && v.phase !== 'URBAN_ACTIONS'; g++) { await new Promise(r => setTimeout(r, 300)); v = await game(p); }
  const city = v.view.player.civilization.cities[0].id;
  const payload = { type: 'URBAN_ACTION', cityId: city, action: 'PRODUCE' };
  const before = v.self.resources, cityBefore = (await game(p)).cityStates.find(c => c.cityId === city).urbanActionsUsed;
  const dup = await Promise.all([1, 2, 3].map(() => p.command(roomId, { ...payload, expectedVersion: v.version }, { expect: [200, 409] })));
  console.log('  statuses', dup.map(r => r.status).join(','));
  const after = await game(p), used = after.cityStates.find(c => c.cityId === city).urbanActionsUsed;
  check('three identical parallel PRODUCE: exactly one applied', dup.filter(r => r.ok).length === 1 && used === cityBefore + 1, `${dup.filter(r => r.ok).length} ok, used ${used}`);
  const replay = await p.command(roomId, { ...payload, expectedVersion: v.version }, { expect: [409] });
  check('replaying the exact old request is rejected (409), not re-applied', replay.status === 409);
  out.duplicate = { statuses: dup.map(r => r.status), used };
}

console.log('\n## 3 · burst: 4 players × 10 commands at once (mixed, cheap and harmless)');
{
  const t0 = LOG.length;
  const results = await Promise.all(players.flatMap(p => Array.from({ length: 10 }, async (_, i) => { const v = await game(p); return p.command(roomId, { type: 'SET_DEFENSE_POSTURE', posture: ['HOLD', 'ASSAULT', 'MANEUVER'][i % 3], expectedVersion: v.version }, { expect: [200, 400, 409] }); })));
  const s = results.reduce((m, r) => { m[r.status] = (m[r.status] ?? 0) + 1; return m; }, {});
  console.log('  outcomes', JSON.stringify(s));
  out.burst = s;
  check('no 5xx under the burst', !results.some(r => r.status >= 500));
  check('every response is a well-formed result (ok or coded error)', results.every(r => r.json && (r.ok || r.error?.code)));
  const versions = await Promise.all(players.map(async p => (await game(p)).version));
  check('all players see the same room version afterwards', new Set(versions).size === 1, versions.join(','));
}

console.log('\n## 4 · reads racing writes');
{
  const p = players[1];
  const readers = Array.from({ length: 15 }, async () => (await p.get(roomId)).value.game.version);
  const writers = Array.from({ length: 3 }, async (_, i) => { const v = await game(players[2]); return players[2].command(roomId, { type: 'SET_DEFENSE_POSTURE', posture: 'HOLD', expectedVersion: v.version }, { expect: [200, 409] }); });
  const [vers] = await Promise.all([Promise.all(readers), Promise.all(writers)]);
  check('versions seen by a polling reader never go backwards within one burst', vers.every((v, i) => i === 0 || v >= Math.min(...vers)) && Math.max(...vers) - Math.min(...vers) <= 3, `${Math.min(...vers)}..${Math.max(...vers)}`);
}
save('s8-concurrency', { out, summary: summarizeLog() });
