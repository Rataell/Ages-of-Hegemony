// Bot food economy report (V51B-16). Usage: npm run compile && node scripts/alpha-bot-economy.mjs [--players=2,4,6] [--seeds=10] [--rounds=35] [--out=docs/evidence/v51b-bot-economy] [--tag=after]
import { mkdirSync, writeFileSync } from 'node:fs';
import { playMatch } from './lib/alpha-bots.mjs';
const arg = (n, f) => (process.argv.find(a => a.startsWith(`--${n}=`)) ?? `--${n}=${f}`).split('=')[1];
const counts = arg('players', '2,4,6').split(',').map(Number), seeds = Number(arg('seeds', 10)), rounds = Number(arg('rounds', 35)), out = arg('out', 'docs/evidence/v51b-bot-economy'), tag = arg('tag', 'run');
mkdirSync(out, { recursive: true });
const rows = [], culprits = {}, perMatch = [], diag = {}, eraBands = { 'I-II (1-10)': [0, 0], 'III-IV (11-20)': [0, 0], 'V-VII (21-35)': [0, 0] };
for (const players of counts) {
  const agg = { seatRounds: 0, famine: 0, unitShort: 0, seatsWithFamineEraII: 0, seats: 0, popEraIII: [], citiesEraIII: [], citiesEraV: [], popEraV: [], armyEraIII: [], armyEraV: [], eraVReached: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    const r = playMatch({ seed, players, rounds, startingPioneers: 2 });
    const log = r.ctx.foodLog ?? [];
    for (const [k, v] of Object.entries(r.ctx.diag ?? {})) diag[k] = (diag[k] ?? 0) + v;
    for (const seat of r.ctx.seats) {
      const mine = log.filter(e => e.seat === seat.id);
      agg.seats++; agg.seatRounds += mine.length;
      for (const e of mine) { const band = e.round <= 10 ? 'I-II (1-10)' : e.round <= 20 ? 'III-IV (11-20)' : 'V-VII (21-35)'; eraBands[band][0]++; eraBands[band][1] += e.prevFamine + e.prevUnitShortage > 0 ? 1 : 0; }
      agg.famine += mine.reduce((n, e) => n + e.prevFamine, 0); agg.unitShort += mine.reduce((n, e) => n + e.prevUnitShortage, 0);
      if (mine.some(e => e.round >= 6 && e.round <= 10 && e.prevFamine > 0)) agg.seatsWithFamineEraII++;
      const at = round => mine.find(e => e.round === round);
      if (at(16)) { agg.popEraIII.push(at(16).pop); agg.citiesEraIII.push(at(16).cities); agg.armyEraIII.push(at(16).pieces); }
      if (at(26)) { agg.eraVReached++; agg.popEraV.push(at(26).pop); agg.citiesEraV.push(at(26).cities); agg.armyEraV.push(at(26).pieces); }
      // Which commands cost Alimento in the round before a famine.
      for (const e of mine.filter(x => x.prevFamine > 0 || x.prevUnitShortage > 0)) for (const spend of (r.ctx.foodSpend ?? []).filter(x => x.seat === seat.id && x.round === e.round - 1)) culprits[spend.what] = (culprits[spend.what] ?? 0) + spend.food;
    }
    perMatch.push({ players, seed, log });
  }
  const avg = xs => xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : null;
  rows.push({ players, seats: agg.seats, famineSeatRounds: `${agg.famine}/${agg.seatRounds}`, famineRate: +(agg.famine / agg.seatRounds).toFixed(3), unitShortageRate: +(agg.unitShort / agg.seatRounds).toFixed(3), seatsWithFamineInEraII: `${agg.seatsWithFamineEraII}/${agg.seats}`, popEraIII: avg(agg.popEraIII), citiesEraIII: avg(agg.citiesEraIII), piecesEraIII: avg(agg.armyEraIII), reachedEraV: `${agg.eraVReached}/${agg.seats}`, popEraV: avg(agg.popEraV), citiesEraV: avg(agg.citiesEraV), piecesEraV: avg(agg.armyEraV) });
  console.log(JSON.stringify(rows.at(-1)));
}
writeFileSync(`${out}/economy-${tag}.json`, JSON.stringify({ rows, foodSpentBeforeHunger: culprits, diagnostics: diag, hungerByEraBand: Object.fromEntries(Object.entries(eraBands).map(([k, [n, h]]) => [k, +(h / n).toFixed(3)])), foodLog: perMatch.slice(0, 6) }, null, 1));
console.log('hunger (famine or unpaid pieces) by era band:', JSON.stringify(Object.fromEntries(Object.entries(eraBands).map(([k, [n, h]]) => [k, +(h / n).toFixed(3)]))));
console.log('diagnostics:', JSON.stringify(diag));
console.log('food spent in the round before hunger:', JSON.stringify(culprits));
