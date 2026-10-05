/* global performance */
// Investigation of the V5.1b balance suspicions (read-only: no number is retuned). Usage:
//   npm run compile && node scripts/alpha-investigate-v51b.mjs [--players=2,4,6] [--seeds=1,2,3] [--out=docs/evidence/v51b-investigation] [--variants=baseline,economist,economist-nothreat-food]
// Writes data.json and TABLES.md; REPORT.md is written by hand from them.
import { mkdirSync, writeFileSync } from 'node:fs';
import { playMatch } from './lib/alpha-bots.mjs';
import { makeObserver, finalFacts } from './lib/alpha-observer.mjs';
import { gradeBenchmark, bandBenchmark } from './lib/alpha-grade-benchmark.mjs';

const arg = (name, fallback) => (process.argv.find(a => a.startsWith(`--${name}=`)) ?? `--${name}=${fallback}`).split('=')[1];
const playerCounts = arg('players', '2,4,6').split(',').map(Number), seeds = arg('seeds', '1,2,3').split(',').map(Number);
const variants = arg('variants', 'baseline,economist,economist-nothreat-food').split(',');
const out = arg('out', 'docs/evidence/v51b-investigation');
mkdirSync(out, { recursive: true });

const avg = list => list.length ? +(list.reduce((a, b) => a + b, 0) / list.length).toFixed(2) : null;
const med = list => list.length ? [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)] : null;
const pct = (n, d) => d ? `${Math.round(100 * n / d)}%` : '-';
const runs = [];
for (const variant of variants) for (const players of playerCounts) for (const seed of seeds) {
  const t0 = performance.now(), obs = makeObserver({ variant });
  const result = playMatch({ seed, players, rounds: 35, skill: 'competent', scenario: obs.hook });
  const facts = finalFacts(result);
  runs.push({ variant, players, seed, rounds: result.state.core.round, status: result.state.core.status, crashes: result.ctx.crashes.length, violations: result.ctx.violations.length, ...obs.data, facts });
  console.log(`[${variant}] ${players}p seed ${seed}: round ${result.state.core.round} ${result.state.core.status} · ${Math.round(performance.now() - t0)} ms · first N4/N5/N6/N7: ${[4, 5, 6, 7].map(l => obs.data.firstLevel[l] ?? '-').join('/')}`);
}
writeFileSync(`${out}/data.json`, JSON.stringify({ runs, grades: gradeBenchmark(), bands: bandBenchmark() }, null, 1));

// ---------------------------------------------------------------- tables
const lines = [];
const sel = (variant, players) => runs.filter(r => r.variant === variant && (players === undefined || r.players === players));
const first = (list, key) => { const v = list.map(r => r.firstLevel[key]).filter(x => x !== undefined); return `${v.length ? avg(v) : 'never'} (${v.length}/${list.length})`; };

lines.push('## A/C. Threat timeline (baseline, competent bots)\n');
lines.push('| players | seed | threat | created | nearest city (hexes) | path len at 1st sight | launched (round) | gone (round) | first world assault | camped window (rounds) |', '|---|---|---|---|---|---|---|---|---|---|');
for (const r of sel('baseline')) {
  const firstAssault = r.facts.worldBattles[0]?.round ?? '-';
  for (const t of Object.values(r.threats).filter(t => t.kind === 'CAMP').slice(0, 4)) lines.push(`| ${r.players} | ${r.seed} | ${t.id} | ${t.createdRound} | ${t.nearestCityAtSpawn} | ${t.pathLenAtFirstSight ?? '-'} | ${t.launchedRound ?? 'never'} | ${t.goneRound ?? '-'} | ${firstAssault} | ${t.launchedRound !== null ? t.launchedRound - t.createdRound : '-'} |`);
}
lines.push('\n### Spawns by source round (baseline): THREAT_SPAWNED / THREAT_REINFORCED / THREAT_MARCHING event rounds\n');
lines.push('| players | seed | spawned (rounds) | reinforced | marching events | world assaults | assaults on undefended hex | assaults on city | camps killed camped | player attacks on threats |', '|---|---|---|---|---|---|---|---|---|---|');
for (const r of sel('baseline')) {
  const e = r.facts.events, wb = r.facts.worldBattles;
  lines.push(`| ${r.players} | ${r.seed} | ${(e.THREAT_SPAWNED ?? []).join(',') || '-'} | ${(e.THREAT_REINFORCED ?? []).join(',') || '-'} | ${(e.THREAT_MARCHING ?? []).join(',') || '-'} | ${wb.length} | ${wb.filter(b => b.defenders === 0).length} | ${wb.filter(b => b.city).length} | ${(e.THREAT_DESTROYED ?? []).length} | ${r.facts.playerVsWorld.length} |`);
}
lines.push('\n### Assaults per target (baseline): how many times the same hex is assaulted\n');
lines.push('| players | seed | distinct hexes | assaults | max on one hex | share on the 2 most-hit hexes |', '|---|---|---|---|---|---|');
for (const r of sel('baseline')) {
  const by = {}; for (const b of r.facts.worldBattles) by[b.hex] = (by[b.hex] ?? 0) + 1;
  const counts = Object.values(by).sort((a, b) => b - a), total = counts.reduce((a, b) => a + b, 0);
  lines.push(`| ${r.players} | ${r.seed} | ${counts.length} | ${total} | ${counts[0] ?? 0} | ${pct((counts[0] ?? 0) + (counts[1] ?? 0), total)} |`);
}

lines.push('\n## B. Urban pace: first round reaching each level, by variant\n');
lines.push('| variant | players | N2 | N3 | N4 | N5 | N6 | N7 |', '|---|---|---|---|---|---|---|---|');
for (const v of variants) for (const p of playerCounts) { const s = sel(v, p); lines.push(`| ${v} | ${p} | ${[2, 3, 4, 5, 6, 7].map(l => first(s, l)).join(' | ')} |`); }
lines.push('\n### Elevar bottleneck: share of city-rounds (next level not yet built) by FIRST failing condition\n');
lines.push('| variant | players | city-rounds | population | Era | Web advance | cost | all four met | ready but not elevated next round | below pop ceiling | …of which Alimento < 3 |', '|---|---|---|---|---|---|---|---|---|---|---|');
for (const v of variants) for (const p of playerCounts) {
  const s = sel(v, p), sum = key => s.reduce((n, r) => n + (r.elevate.byFirstBlock[key] ?? 0), 0), cr = s.reduce((n, r) => n + r.elevate.cityRounds, 0);
  const rn = s.reduce((n, r) => n + r.elevate.readyNotElevated, 0), re = s.reduce((n, r) => n + r.elevate.readyElevated, 0);
  const below = s.reduce((n, r) => n + r.elevate.popBelowCeiling, 0), nofood = s.reduce((n, r) => n + r.elevate.popBelowCeilingNoFood, 0);
  lines.push(`| ${v} | ${p} | ${cr} | ${pct(sum('pop'), cr)} | ${pct(sum('era'), cr)} | ${pct(sum('advance'), cr)} | ${pct(sum('cost'), cr)} | ${pct(sum('ready'), cr)} | ${rn}/${rn + re} | ${pct(below, cr)} | ${pct(nofood, below)} |`);
}
lines.push('\n### Any-failing share (a condition counted whenever it fails, not only first)\n');
lines.push('| variant | players | population | Era | Web advance | cost |', '|---|---|---|---|---|---|');
for (const v of variants) for (const p of playerCounts) { const s = sel(v, p), cr = s.reduce((n, r) => n + r.elevate.cityRounds, 0), a = k => pct(s.reduce((n, r) => n + r.elevate.anyBlock[k], 0), cr); lines.push(`| ${v} | ${p} | ${a('pop')} | ${a('era')} | ${a('advance')} | ${a('cost')} |`); }

lines.push('\n## D. Soldados (baseline)\n');
lines.push('| players | pop (mean/civ-round) | Soldados (mean) | pieces (mean) | civ-rounds with a degraded city | …with ≥1 piece but no Soldado reserve | pieces at r10 | r20 | r30 | cities (mean) |', '|---|---|---|---|---|---|---|---|---|---|');
for (const p of playerCounts) {
  const smp = sel('baseline', p).flatMap(r => r.soldiers.samples);
  const at = round => avg(smp.filter(s => s.round === round).map(s => s.pieces));
  lines.push(`| ${p} | ${avg(smp.map(s => s.pop))} | ${avg(smp.map(s => s.soldiers))} | ${avg(smp.map(s => s.pieces))} | ${pct(smp.filter(s => s.degraded > 0).length, smp.length)} | ${pct(smp.filter(s => s.pieces > 0 && s.soldiers === 0).length, smp.length)} | ${at(10)} | ${at(20)} | ${at(30)} | ${avg(smp.map(s => s.cities))} |`);
}
lines.push('\n### Recruitment and losses (baseline totals per match)\n');
lines.push('| players | pieces recruited / match | casualties in world battles | casualties in PvP | upkeep Alimento / match (military) |', '|---|---|---|---|---|');
for (const p of playerCounts) {
  const s = sel('baseline', p);
  lines.push(`| ${p} | ${avg(s.map(r => Object.values(r.facts.unitRecruitment).reduce((a, b) => a + b, 0)))} | ${avg(s.map(r => r.facts.worldBattles.length))} assaults | ${avg(s.map(r => r.facts.pvp.length))} battles | n/a (ledger: see data.json) |`);
}

lines.push('\n## E. Graus (engine shock core, 1500 trials per row)\n');
lines.push('| family | I vs I: A / tie / D | II vs I | III vs I | I vs III defending |', '|---|---|---|---|---|');
const fmt = x => `${Math.round(x.attackerWins * 100)} / ${Math.round(x.tie * 100)} / ${Math.round(x.defenderWins * 100)}`;
for (const g of gradeBenchmark()) lines.push(`| ${g.family} | ${fmt(g.gradeI)} | ${fmt(g.gradeII)} | ${fmt(g.gradeIII)} | ${fmt(g.gradeIIIDefending)} |`);

lines.push('\n## F. Orders and Legado (baseline)\n');
lines.push('| players | Legado orders / match | matches with any Legado | ADVANCE_LEGACY_WORK sent | rejected | probe attempts | probe OK | most common refusal |', '|---|---|---|---|---|---|---|---|');
for (const p of playerCounts) {
  const s = sel('baseline', p), reasons = {}; for (const r of s) for (const [k, v] of Object.entries(r.legacyProbe.reasons)) reasons[k] = (reasons[k] ?? 0) + v;
  const top = Object.entries(reasons).sort((a, b) => b[1] - a[1])[0];
  lines.push(`| ${p} | ${avg(s.map(r => r.facts.orders.LEGACY ?? 0))} | ${s.filter(r => (r.facts.orders.LEGACY ?? 0) > 0).length}/${s.length} | ${avg(s.map(r => r.facts.counters.byType.ADVANCE_LEGACY_WORK ?? 0))} | ${avg(s.map(r => Object.entries(r.facts.counters.rejectedReasons).filter(([k]) => k.startsWith('ADVANCE_LEGACY_WORK')).reduce((n, [, v]) => n + v, 0)))} | ${s.reduce((n, r) => n + r.legacyProbe.attempts, 0)} | ${s.reduce((n, r) => n + r.legacyProbe.ok, 0)} | ${top ? `${top[0]} (${top[1]})` : '-'} |`);
}

lines.push('\n## 5. Contact milestones (baseline; round observed at the start of planning)\n');
lines.push('| players | seed | capital distance (min / mean) | first contact | first shared border | first diplomacy | first hostility (war) | first PvP battle | first world assault |', '|---|---|---|---|---|---|---|---|---|');
for (const r of sel('baseline')) { const c = r.contact; lines.push(`| ${r.players} | ${r.seed} | ${c.capitalDistance?.min} / ${c.capitalDistance?.mean} | ${c.firstContact ?? 'never'} | ${c.firstSharedBorder ?? 'never'} | ${c.firstDiplomacy ?? 'never'} | ${c.firstHostility ?? 'never'} | ${c.firstPvP ?? 'never'} | ${c.firstWorldAssault ?? 'never'} |`); }
lines.push('\n### Means by table size and variant\n');
lines.push('| variant | players | contact | shared border | diplomacy | war | PvP battle | matches with PvP |', '|---|---|---|---|---|---|---|---|');
for (const v of variants) for (const p of playerCounts) { const s = sel(v, p), m = key => { const x = s.map(r => r.contact[key]).filter(y => y !== null); return `${x.length ? avg(x) : 'never'} (${x.length}/${s.length})`; }; lines.push(`| ${v} | ${p} | ${m('firstContact')} | ${m('firstSharedBorder')} | ${m('firstDiplomacy')} | ${m('firstHostility')} | ${m('firstPvP')} | ${s.filter(r => r.facts.pvp.length).length}/${s.length} |`); }
lines.push('\n## A (cont.). What happens at the gate: outcome of world assaults by variant\n');
lines.push('| variant | players | world assaults / match | Bando wins | tie | defender wins | player attacks on threats | camps killed camped | mean pieces / civ-round | mean pop / civ-round | civ-rounds with a degraded city |', '|---|---|---|---|---|---|---|---|---|---|---|');
for (const v of variants) for (const p of playerCounts) {
  const s = sel(v, p), wb = s.flatMap(r => r.facts.worldBattles), smp = s.flatMap(r => r.soldiers.samples);
  lines.push(`| ${v} | ${p} | ${avg(s.map(r => r.facts.worldBattles.length))} | ${pct(wb.filter(b => b.outcome !== 'TIE' && b.delta > 0).length, wb.length)} | ${pct(wb.filter(b => b.outcome === 'TIE').length, wb.length)} | ${pct(wb.filter(b => b.outcome !== 'TIE' && b.delta < 0).length, wb.length)} | ${avg(s.map(r => r.facts.playerVsWorld.length))} | ${avg(s.map(r => (r.facts.events.THREAT_DESTROYED ?? []).length))} | ${avg(smp.map(x => x.pieces))} | ${avg(smp.map(x => x.pop))} | ${pct(smp.filter(x => x.degraded > 0).length, smp.length)} |`);
}
writeFileSync(`${out}/TABLES.md`, lines.join('\n') + '\n');
console.log(`Tables: ${out}/TABLES.md (median first N4 baseline: ${med(sel('baseline').map(r => r.firstLevel[4]).filter(Boolean))})`);
