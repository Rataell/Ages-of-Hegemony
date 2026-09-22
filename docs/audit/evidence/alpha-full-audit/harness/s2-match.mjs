// Full-match playtest over real HTTP. Usage: node s2-match.mjs <players> [seed] [maxRounds]   (QUICK = 9 rounds)
import { startMatch, save, summarizeLog, LOG, FINDINGS } from './lib.mjs';
import { playMatch } from './bot.mjs';

const count = Number(process.argv[2] ?? 2), seed = Number(process.argv[3] ?? 1), name = `s2-match-${count}p-seed${seed}`;
const sink = { attempts: [], anomalies: [], phases: [] };
const { players, roomId, view } = await startMatch(count, { seed: 40 + seed });
console.log(`match ${roomId} started with ${count} players`);
const rounds = [];
const result = await playMatch({ players, roomId, sink, seed, maxSeconds: Number(process.env.AUDIT_MAX_SECONDS ?? 1500), onRound: (v, views) => {
  rounds.push({ round: v.view.round, at: new Date().toISOString(), players: views.map((x, i) => ({ i, res: x.self.resources, prestige: x.self.prestige, cities: x.view.player.civilization.cities.length, units: x.units.filter(u => u.ownerId === x.self.playerId).length, research: x.self.research.length, era: x.self.era, adm: `${x.view.player.civilization.administrativeLoad}/${x.view.player.civilization.administrativeCapacity}` })) });
  console.log(`  round ${v.view.round} reached (${v.phase})`);
} });
const table = {};
for (const a of sink.attempts) { const k = `${a.type}${a.sub ? ':' + a.sub : ''}`; const t = (table[k] ??= { ok: 0, refused: 0, codes: {} }); if (a.ok) t.ok++; else { t.refused++; const c = a.code ?? a.status; t.codes[c] = (t.codes[c] ?? 0) + 1; (t.messages ??= {})[c] ??= a.message; } }
const conflictStats = (() => { const d = {}; let total = 0; for (const a of sink.attempts) { const k = String(a.conflicts ?? 0); d[k] = (d[k] ?? 0) + 1; total++; } const needMoreThanOne = sink.attempts.filter(a => (a.conflicts ?? 0) >= 2).length; return { attempts: total, byConflictsBeforeOutcome: d, needMoreThanOneRetry: needMoreThanOne, pctNeedMoreThanOneRetry: Number((100 * needMoreThanOne / total).toFixed(2)) }; })();
const finalViews = result.views.map(v => ({ prestige: v.self.prestige, era: v.self.era, cities: v.view.player.civilization.cities.length, research: v.self.research.length, battles: v.battles.length, contacts: v.self.contacts.length, treaties: (v.treaties ?? []).length, wars: (v.wars ?? []).length, routes: (v.routes ?? []).length, explored: v.self.exploredRegions, milestonesMet: `${v.milestones.satisfied}/${v.milestones.needed}`, adm: `${v.view.player.civilization.administrativeLoad}/${v.view.player.civilization.administrativeCapacity}`, known: v.self.knownHexIds.length, units: v.units.filter(u => u.ownerId === v.self.playerId).map(u => u.kind).join(',') }));
console.log('result', JSON.stringify({ finished: result.finished, winner: result.winner, round: result.round, seconds: Math.round(result.seconds), stalled: result.stalled, attempts: sink.attempts.length, anomalies: sink.anomalies.length }));
console.log('conflicts', JSON.stringify(conflictStats));
console.log('anomalies', JSON.stringify(sink.anomalies.slice(0, 12), null, 1));
save(name, { count, seed, roomId, conflictStats, result: { ...result, views: undefined }, finalViews, rounds, table, anomalies: sink.anomalies, phases: sink.phases, summary: summarizeLog() });
