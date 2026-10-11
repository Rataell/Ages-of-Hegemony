// Economic-cycle audit (Alpha V1.2). Usage: npm run compile && node scripts/alpha-economy-audit.mjs [--seed=1] [--players=2] [--rounds=35]
// Prints, per seat and round: opening → production → expenses → upkeep → discarded → closing, plus cities, population, pieces, Ânimo.
import { playMatch } from './lib/alpha-bots.mjs';
const arg = (n, f) => (process.argv.find(a => a.startsWith(`--${n}=`)) ?? `--${n}=${f}`).split('=')[1];
const seed = Number(arg('seed', 1)), players = Number(arg('players', 2)), rounds = Number(arg('rounds', 35));
const { state, ctx } = playMatch({ seed, players, rounds, startingPioneers: 2 });
const KEYS = ['food', 'materials', 'wealth', 'knowledge', 'influence'];
const f = (pool, k) => String(pool?.[k] ?? 0).padStart(3);
const gain = (r, k) => ['production', 'mining', 'trade', 'institutions', 'other'].reduce((n, s) => n + (r[s]?.[k] ?? 0), 0);
const prodOnly = (r, k) => (r.production?.[k] ?? 0) + (r.mining?.[k] ?? 0);
const out = (r, k) => (r.expenses?.[k] ?? 0) + (r.losses?.[k] ?? 0);
// Equation check: opening + gains − expenses − losses − upkeepPaid − discarded = closing, for every resource of every round.
let broken = 0;
for (const seat of ctx.seats) {
  const owner = state.core.players.find(p => p.id === seat.id);
  console.log(`\n== ${owner.name} (${seat.id}) ==`);
  console.log('rnd era  | ' + KEYS.map(k => `${k.slice(0, 4)} open prod +oth exp upk dis close`).join(' | ') + ' | cit pop pcs');
  for (const r of state.roundReports.filter(x => x.playerId === seat.id)) {
    const progress = state.players.find(p => p.playerId === seat.id);
    const cols = KEYS.map(k => `${f(r.opening, k)} ${String(prodOnly(r, k)).padStart(3)} ${String(gain(r, k) - prodOnly(r, k)).padStart(3)} ${String(out(r, k)).padStart(3)} ${f(r.upkeepPaid, k)} ${f(r.discarded, k)} ${f(r.closing, k)}`).join(' | ');
    for (const k of KEYS) if ((r.opening[k] ?? 0) + gain(r, k) - out(r, k) - (r.upkeepPaid[k] ?? 0) - (r.discarded[k] ?? 0) !== (r.closing[k] ?? 0)) broken++;
    const pop = r.cities.reduce((n, c) => n + c.populationAfter, 0);
    console.log(`${String(r.round).padStart(3)}      | ${cols} | ${String(r.cities.length).padStart(3)} ${String(pop).padStart(3)}`);
  }
}

console.log(`\nledger equation violations: ${broken}`);
