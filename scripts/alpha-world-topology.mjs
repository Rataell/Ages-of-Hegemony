// World topology report (V1.2 audit, lane C). Read-only over the built packages.
//   node scripts/alpha-world-topology.mjs [--seeds=20] [--sizes=STANDARD,COMPACT,WIDE] [--out=docs/evidence/v12-lane-c]
// Prints (and writes world-connectivity.json): per preset x player count the sea / navigable / land component statistics, ponds, fake coasts, Pátria access,
// and the pass/fail table of every connectivity property in scripts/lib/alpha-world-topology.mjs (the same list tests/v12-audit-world-connectivity.test.ts asserts).
import { mkdirSync, writeFileSync } from 'node:fs';
import { PRESETS, PROPERTIES, makeWorld, measureWorld, revealedWorld, runProperties, rimOcean, inlandCore } from './lib/alpha-world-topology.mjs';

const arg = (name, fallback) => (process.argv.find(a => a.startsWith(`--${name}=`)) ?? `--${name}=${fallback}`).split('=')[1];
const seedCount = Number(arg('seeds', 20)), sizes = arg('sizes', 'STANDARD,COMPACT,WIDE').split(','), out = arg('out', 'docs/evidence/v12-lane-c');
const allowed = { COMPACT: [2, 4], STANDARD: [2, 4, 6], WIDE: [2, 4, 6] };
const seeds = Array.from({ length: seedCount }, (_, i) => i + 1);
const avg = list => (list.length ? Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10 : 0);
const pct = (n, d) => Math.round((100 * n) / d);
mkdirSync(out, { recursive: true });
const result = { seeds: seedCount, aggregates: [], properties: {} };
for (const size of sizes) {
  for (const preset of PRESETS) for (const players of allowed[size]) {
    const rows = [];
    for (const seed of seeds) for (const variant of ['creation', 'turned']) { const base = makeWorld({ preset, seed, players, size }), state = variant === 'creation' ? base : revealedWorld(base, seed); rows.push({ m: measureWorld(state), state }); }
    const m = rows.map(r => r.m);
    const row = {
      size, preset, players, worlds: rows.length,
      seaHexes: avg(m.map(x => x.sea.hexes)), seaBodies: avg(m.map(x => x.sea.comps.length)), navBodies: avg(m.map(x => x.nav.comps.length)), largestNav: avg(m.map(x => x.nav.main)), ponds: avg(m.map(x => x.nav.ponds)),
      pondQuayPct: avg(m.map(x => (100 * x.pondQuays) / Math.max(1, x.quays))), fakeCoasts: avg(m.map(x => x.fakeCoasts)), worldsWithFakeCoastPct: pct(m.filter(x => x.fakeCoasts > 0).length, m.length),
      landMasses: avg(m.map(x => x.land.comps.length)), landFragments: avg(m.map(x => x.land.fragments)), largestLand: avg(m.map(x => x.land.comps[0])),
      patriasSameLandPct: pct(m.filter(x => x.homes.every(h => h.landMassId === x.homes[0].landMassId)).length, m.length),
      patriaOnlyPondPct: pct(m.filter(x => x.homes.some(h => h.anyQuayWithin3 && !h.realPortWithin3)).length, m.length),
      minCapitalDistance: Math.min(...m.map(x => Math.min(...x.pairs.map(p => p.hex)))), metalR2Missing: m.reduce((n, x) => n + x.homes.filter(h => h.metalR2 === 0).length, 0),
      noFishR1Pct: pct(m.filter(x => x.homes.some(h => h.fishR1 === 0)).length, m.length), noStoneR1Pct: pct(m.filter(x => x.homes.some(h => h.stoneR1 === 0)).length, m.length),
      ...(preset === 'CONTINENTAL' ? { rimBodies: avg(rows.map(r => rimOcean(r.state).bodies)), rimDryHexes: avg(rows.map(r => rimOcean(r.state).rimLand)) } : {}),
      ...(preset === 'INLAND_SEA' ? { centreDryHexes: avg(rows.map(r => inlandCore(r.state).dry.length)), centreBodies: avg(rows.map(r => inlandCore(r.state).bodies)) } : {}),
    };
    result.aggregates.push(row);
    console.log(JSON.stringify(row));
  }
  for (const players of allowed[size]) void players;
  result.properties[size] = runProperties({ seeds, counts: allowed[size], size });
  for (const prop of PROPERTIES) { const r = result.properties[size][prop.id]; console.log(`${size} ${r.kind} ${prop.id.padEnd(40)} ${Object.entries(r.byPreset).map(([p, c]) => `${p} ${c.fails}/${c.total}`).join('  ')}`); }
}
writeFileSync(`${out}/world-connectivity.json`, JSON.stringify(result, null, 1));
console.log(`Report data: ${out}/world-connectivity.json`);
