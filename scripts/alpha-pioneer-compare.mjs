// 1 vs 2 initial Pioneiros with bots. Usage: npm run compile && node scripts/alpha-pioneer-compare.mjs [--players=2,4,6] [--seeds=1..10] [--rounds=20] [--skill=competent] [--out=docs/evidence/v51b-pioneers]
import { mkdirSync, writeFileSync } from 'node:fs';
import { playMatch } from './lib/alpha-bots.mjs';
import { observe } from './lib/alpha-pioneer-metrics.mjs';

const arg = (name, fallback) => (process.argv.find(a => a.startsWith(`--${name}=`)) ?? `--${name}=${fallback}`).split('=')[1];
const playerCounts = arg('players', '2,4,6').split(',').map(Number);
const seedCount = Number(arg('seeds', 10)), rounds = Number(arg('rounds', 20)), skill = arg('skill', 'competent'), out = arg('out', 'docs/evidence/v51b-pioneers');
const variants = arg('variants', '1,2').split(',').map(Number);
mkdirSync(out, { recursive: true });
const avg = xs => { const v = xs.filter(x => x !== null && x !== undefined); return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : null; };
const reached = xs => `${xs.filter(x => x !== null).length}/${xs.length}`;
const rows = [], runs = [];
for (const players of playerCounts) for (const startingPioneers of variants) {
  const per = [], orders = { EXPLORE: 0, MOVE: 0, ATTACK: 0 }; let battles = 0, matches = 0, crashes = 0;
  for (let seed = 1; seed <= seedCount; seed++) {
    const obs = observe();
    const result = playMatch({ seed, players, rounds, skill, startingPioneers, scenario: obs.hook });
    const r = obs.result(result.state, result.ctx);
    crashes += result.ctx.crashes.length; matches++; battles += r.battles;
    for (const k of Object.keys(orders)) orders[k] += r.orders[k] ?? 0;
    per.push(...r.perPlayer);
    runs.push({ players, startingPioneers, seed, ...r, snaps: undefined });
  }
  const col = f => per.map(p => p[f]);
  rows.push({
    players, startingPioneers, matches, crashes, battles, seats: per.length,
    firstRegion: avg(col('firstRegion')), firstRegionReached: reached(col('firstRegion')),
    secondRegion: avg(col('secondRegion')), secondRegionReached: reached(col('secondRegion')),
    firstCity: avg(col('firstCity')), firstCityReached: reached(col('firstCity')),
    secondCity: avg(col('secondCity')), secondCityReached: reached(col('secondCity')),
    firstContact: avg(col('firstContact')), firstContactReached: reached(col('firstContact')),
    firstRecruitedPioneer: avg(col('firstRecruitedPioneer')), recruitedReached: reached(col('firstRecruitedPioneer')),
    pioneersByEra: [0, 1, 2, 3].map(i => avg(per.map(p => p.pioneersByEra[i]))),
    exploredAtEra: [0, 1, 2, 3].map(i => avg(per.map(p => p.exploredAtEra[i]))),
    citiesEraII: avg(col('citiesEraII')), citiesEraIII: avg(col('citiesEraIII')),
    expeditionOrdersPerSeat: +(orders.EXPLORE / per.length).toFixed(2), moveOrdersPerSeat: +(orders.MOVE / per.length).toFixed(2),
    orphaned: per.filter(p => p.orphaned).length, stoppedExploring: per.filter(p => p.stoppedExploring).length, armyEraIII: avg(col('armyEraIII')),
  });
  console.log(JSON.stringify(rows.at(-1)));
}
writeFileSync(`${out}/pioneers-${skill}.json`, JSON.stringify({ rows, runs }, null, 1));
const header = ['players', 'pioneers', '1st Region', '2nd Region', '1st city', '2nd city', '1st contact', '1st recruited', 'Pioneiros E2-E5', 'Regions opened E2-E5', 'cities E-II', 'cities E-III', 'EXPLORE/seat', 'orphaned', 'stopped', 'army E-III', 'battles'];
const md = [`# 1 vs 2 Pioneiros — ${skill} bots, ${seedCount} seeds, ${rounds} rounds`, '', '| ' + header.join(' | ') + ' |', '|' + header.map(() => '---').join('|') + '|',
  ...rows.map(r => `| ${r.players}p | ${r.startingPioneers} | ${r.firstRegion} (${r.firstRegionReached}) | ${r.secondRegion} (${r.secondRegionReached}) | ${r.firstCity} (${r.firstCityReached}) | ${r.secondCity} (${r.secondCityReached}) | ${r.firstContact} (${r.firstContactReached}) | ${r.firstRecruitedPioneer} (${r.recruitedReached}) | ${r.pioneersByEra.join('/')} | ${r.exploredAtEra.join('/')} | ${r.citiesEraII} | ${r.citiesEraIII} | ${r.expeditionOrdersPerSeat} | ${r.orphaned}/${r.seats} | ${r.stoppedExploring}/${r.seats} | ${r.armyEraIII} | ${r.battles} |`)];
writeFileSync(`${out}/PIONEERS-${skill}.md`, md.join('\n') + '\n');
console.log(`Report: ${out}/PIONEERS-${skill}.md`);
