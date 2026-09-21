// Burst of successful concurrent writes inside PLANNING (the earlier burst ran after the phase had moved on and only produced 400s).
import { startMatch, save, check, finding, LOG, summarizeLog } from './lib.mjs';
const { players, roomId } = await startMatch(4, { seed: 78 });
const game = async p => (await p.get(roomId)).value.game;
for (const p of players) { for (let i = 0; i < 6; i++) { const v = await game(p); if (v.worldDecisionPending) await p.command(roomId, { type: 'WORLD_CHOICE', choice: 'RESOURCE', expectedVersion: v.version }, { expect: [200, 409] }); const w = await game(p); if (w.self.ambitionsChosen) break; await p.command(roomId, { type: 'CHOOSE_AMBITIONS', cardIds: w.self.ambitions.slice(0, 2), expectedVersion: w.version }, { expect: [200, 409] }); } }
const before = await Promise.all(players.map(game));
console.log('phase', before[0].phase, 'round', before[0].view.round, 'version', before[0].version);
const postures = ['HOLD', 'ASSAULT', 'MANEUVER'];
const outcomes = [];
// each player sends 10 posture changes in quick succession, all four players in parallel, each re-reading the version first (like a busy client)
await Promise.all(players.map(async (p, pi) => { for (let i = 0; i < 10; i++) { const v = await game(p); const r = await p.command(roomId, { type: 'SET_DEFENSE_POSTURE', posture: postures[(i + pi) % 3], expectedVersion: v.version }, { expect: [200, 400, 409] }); outcomes.push({ pi, i, status: r.status, code: r.error?.code ?? null }); } }));
const s = outcomes.reduce((m, o) => { m[o.status] = (m[o.status] ?? 0) + 1; return m; }, {});
console.log('outcomes', JSON.stringify(s));
check('no 5xx', !outcomes.some(o => o.status >= 500));
check('only 200 and 409 (no stray 400 while still in PLANNING)', outcomes.every(o => o.status === 200 || o.status === 409), JSON.stringify(s));
const after = await Promise.all(players.map(game));
check('all players agree on the version afterwards', new Set(after.map(v => v.version)).size === 1, after.map(v => v.version).join(','));
check('version advanced exactly once per accepted write', after[0].version - before[0].version === s[200], `${after[0].version - before[0].version} vs ${s[200]}`);
const persisted = after.map(v => v.self.defensePosture ?? v.self.posture ?? null);
console.log('postures', JSON.stringify(persisted));
if (s[409] / outcomes.length > 0.3) finding('MP-CAS-2', 'P2', 'Multiplayer', `Com 4 jogadores enviando ordens privadas em paralelo, ${Math.round(100 * s[409] / outcomes.length)}% dos comandos válidos voltam 409 porque o CAS é da sala inteira (não por jogador).`, { outcomes: s });
save('s8b-burst', { outcomes: s, summary: summarizeLog() });
