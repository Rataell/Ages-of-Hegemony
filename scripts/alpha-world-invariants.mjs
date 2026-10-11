/* global performance */
// World/piece invariant scanner (V1.2 audit, lane C). Read-only over the built packages.
//   node scripts/alpha-world-invariants.mjs [--presets=MIXED,CONTINENTAL,ARCHIPELAGO,INLAND_SEA] [--players=2,4,6] [--seeds=1,2,3] [--rounds=8]
//        [--modes=bots,wander,naval] [--sweep=yes] [--out=docs/evidence/v12-lane-c]
// Modes: bots = live bot policy on every seat; wander = bots on even seats + random legal/illegal piece orders on odd seats; naval = wander + a small navy.
// After EVERY successful command the state is scanned for: an unembarked land piece on SEA, a ship on land, a dangling/mismatched carrier, cargo over capacity,
// terrain a table has seen that later changes, regions that are not seven hexes, a rotation that disagrees with the terrain, and illegal commands the validators accepted.
import { mkdirSync, writeFileSync } from 'node:fs';
import { runMatch, frontierSweep, cargoScenarios, raceScenario, makeGame, HARD } from './lib/alpha-world-invariants.mjs';

const arg = (name, fallback) => (process.argv.find(a => a.startsWith(`--${name}=`)) ?? `--${name}=${fallback}`).split('=')[1];
const presets = arg('presets', 'MIXED,CONTINENTAL,ARCHIPELAGO,INLAND_SEA').split(','), counts = arg('players', '2,4,6').split(',').map(Number), seeds = arg('seeds', '1,2,3').split(',').map(Number);
const rounds = Number(arg('rounds', 8)), modes = arg('modes', 'bots,wander,naval').split(','), sweep = arg('sweep', 'yes') === 'yes', out = arg('out', 'docs/evidence/v12-lane-c');
mkdirSync(out, { recursive: true });
const rows = [], tally = {};
const bump = (key, code) => { tally[key] ??= {}; tally[key][code] = (tally[key][code] ?? 0) + 1; };
for (const preset of presets) for (const players of counts) for (const seed of seeds) {
  for (const mode of modes) {
    const t = performance.now();
    const run = runMatch({ preset, seed, players, rounds, wander: mode !== 'bots', naval: mode === 'naval' });
    const hard = run.violations.filter(v => HARD.includes(v.code)), soft = run.violations.filter(v => !HARD.includes(v.code));
    for (const v of run.violations) bump(`${preset}/${mode}`, v.code);
    rows.push({ preset, players, seed, mode, rounds: run.round, ms: Math.round(performance.now() - t), hard, soft, counters: run.counters, rejected: run.rejected });
    console.log(`${preset} ${players}p seed ${seed} ${mode}: round ${run.round} · hard ${hard.length} soft ${soft.length} · ${Object.entries(run.counters).map(([k, v]) => `${k}=${v}`).join(' ')}${hard.length ? ' · ' + JSON.stringify(hard.slice(0, 2)) : ''}`);
  }
  if (sweep && players === 4) {
    const state = makeGame({ preset, seed, players });
    const land = frontierSweep(state, { mode: 'LAND' }), naval = frontierSweep(state, { mode: 'NAVAL' }), cargo = cargoScenarios(state), race = raceScenario(state);
    rows.push({ preset, players, seed, mode: 'sweep', land: { checked: land.checked, violations: land.violations.slice(0, 10) }, naval: { checked: naval.checked, violations: naval.violations.slice(0, 10) }, cargo, race });
    console.log(`${preset} ${players}p seed ${seed} sweep: land ${land.checked} checks / ${land.violations.length} viol · naval ${naval.checked} / ${naval.violations.length} · race ${race.skipped ?? `B ${race.B?.terrain} A ${race.A?.terrain}`}`);
    for (const c of cargo) if (c.violations?.length || c.steps?.some(s => s.violations?.length)) console.log('   cargo', c.name, JSON.stringify(c.violations ?? c.steps));
  }
}
writeFileSync(`${out}/pioneer-water-scan.json`, JSON.stringify({ presets, counts, seeds, rounds, modes, tally, rows }, null, 1));
console.log('tally', JSON.stringify(tally));
console.log(`Report data: ${out}/pioneer-water-scan.json`);
