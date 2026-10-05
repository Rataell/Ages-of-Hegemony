/* global performance */
// Headless bot playtest of the Alpha (V5.1b). Usage:
//   npm run compile && node scripts/alpha-bot-playtest.mjs [--players=2,4,6] [--seeds=1,2,3] [--out=docs/evidence/v51b-playtest] [--rounds=35]
// Plays full matches through applyAlphaCommand only, writes per-round telemetry (JSON) and a Markdown summary that answers the
// playtest questions of the V5.1b brief. Engine time is measured; human time is not (see the report's note).
import { mkdirSync, writeFileSync } from 'node:fs';
import { playMatch, COVERAGE_FLAGS, PERSONA_ORDER } from './lib/alpha-bots.mjs';
import { summarize, markdownReport } from './lib/alpha-playtest-report.mjs';
import { SCENARIOS } from './lib/alpha-scenarios.mjs';
import { gradeBenchmark } from './lib/alpha-grade-benchmark.mjs';

const arg = (name, fallback) => (process.argv.find(a => a.startsWith(`--${name}=`)) ?? `--${name}=${fallback}`).split('=')[1];
const playerCounts = arg('players', '2,4,6').split(',').map(Number), seeds = arg('seeds', '1,2,3').split(',').map(Number);
const out = arg('out', 'docs/evidence/v51b-playtest'), rounds = Number(arg('rounds', 35));
mkdirSync(out, { recursive: true });

const runs = [];
for (const players of playerCounts) for (const seed of seeds) {
  const started = performance.now();
  const result = playMatch({ seed, players, rounds });
  const summary = summarize(result, { players, seed });
  runs.push(summary);
  console.log(`${players}p seed ${seed}: round ${result.state.core.round} ${result.state.core.status} · ${Math.round(performance.now() - started)} ms · crashes ${result.ctx.crashes.length} · violations ${result.ctx.violations.length} · winner ${result.state.winner?.playerId ?? '-'} (${result.state.winner?.reason ?? '-'}) · coverage ${[...result.coverage].length}/${COVERAGE_FLAGS.length}`);
  writeFileSync(`${out}/match-${players}p-seed${seed}.json`, JSON.stringify({ summary, roundLog: result.state.telemetry.roundLog, counters: result.ctx.counters, crashes: result.ctx.crashes, violations: result.ctx.violations }, null, 1));
}
const scenarios = [];
if (arg('coverage', 'yes') !== 'no') for (const sc of SCENARIOS) {
  const result = playMatch({ seed: 1, players: sc.players, personas: sc.personas, rounds: sc.rounds, scenario: sc.hook });
  const reached = Object.fromEntries(sc.flags.map(f => [f, result.coverage.has(f)]));
  scenarios.push({ name: sc.name, note: sc.note, flags: sc.flags, reached, rounds: result.state.core.round, status: result.state.core.status, winner: result.state.winner ?? null, crashes: result.ctx.crashes, violations: result.ctx.violations.slice(0, 10), allCoverage: [...result.coverage] });
  console.log(`scenario ${sc.name}: ${Object.entries(reached).map(([f, v]) => `${f}=${v ? 'yes' : 'NO'}`).join(' ')} · crashes ${result.ctx.crashes.length} · violations ${result.ctx.violations.length}`);
}
const grades = gradeBenchmark();
console.log('grade benchmark:', grades.map(g => `${g.family} III-vs-I ${Math.round(g.gradeIII.attackerWins * 100)}%`).join(' · '));
writeFileSync(`${out}/summary.json`, JSON.stringify({ runs, scenarios, grades }, null, 1));
writeFileSync(`${out}/REPORT.md`, markdownReport(runs, { playerCounts, seeds, personas: PERSONA_ORDER, scenarios, grades }));
console.log(`Report: ${out}/REPORT.md`);
