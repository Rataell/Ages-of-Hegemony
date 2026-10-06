// Organic player-vs-player combat in bot matches (V51B-16, item 7). No injected units: the bots play the whole match.
// Usage: node scripts/alpha-pvp-combat.mjs [--players=2,4,6] [--seeds=10] [--rounds=35] [--personas=mixed|warrior] [--out=docs/evidence/v51b-pioneers] [--tag=organic]
import { mkdirSync, writeFileSync } from 'node:fs';
import { playMatch } from './lib/alpha-bots.mjs';
const arg = (n, f) => (process.argv.find(a => a.startsWith(`--${n}=`)) ?? `--${n}=${f}`).split('=')[1];
const counts = arg('players', '2,4,6').split(',').map(Number), seeds = Number(arg('seeds', 10)), rounds = Number(arg('rounds', 35)), out = arg('out', 'docs/evidence/v51b-pioneers'), tag = arg('tag', 'organic');
const persona = arg('personas', 'mixed');
mkdirSync(out, { recursive: true });
const rows = [], battles = [];
const compOf = (state, ids) => { const c = {}; for (const id of ids) { const u = state.units.find(x => x.id === id); const k = u?.kind ?? '?'; c[k] = (c[k] ?? 0) + 1; } return c; };
for (const players of counts) {
  const agg = { matches: seeds, matchesWithWar: 0, wars: 0, matchesWithPvp: 0, pvp: 0, captures: 0, firstPvpRounds: [], firstContactRounds: [], firstWarRounds: [], attackerWins: 0, ties: 0, decisive: 0, unsupplied: 0, sizes: [], losses: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    const seen = new Map(); let firstContact = null, firstWar = null;
    const record = state => { const ids = new Set(state.players.map(p => p.playerId));
      for (const b of state.battles) if (ids.has(b.attackerId) && ids.has(b.defenderId) && !seen.has(b.id)) seen.set(b.id, { b, comp: { attack: compOf(state, b.attackerUnits), defense: compOf(state, b.defenderUnits) } }); };
    const r = playMatch({ seed, players, rounds, startingPioneers: 2, ...(persona === 'mixed' ? {} : { personas: Array(players).fill(persona) }), scenario: (box, h) => {
      if (h !== 'round-start') return; const s = box.state;
      if (firstContact === null && s.players.some(p => p.contacts.some(c => c !== p.playerId))) firstContact = s.core.round;
      if (firstWar === null && s.wars.length) firstWar = s.core.round;
      record(s);
    } });
    record(r.state);
    if (firstContact !== null) agg.firstContactRounds.push(firstContact);
    if (firstWar !== null) { agg.matchesWithWar++; agg.firstWarRounds.push(firstWar); }
    agg.wars += r.state.wars.length; agg.captures += r.state.telemetry.citiesCaptured;
    if (seen.size) { agg.matchesWithPvp++; agg.pvp += seen.size; agg.firstPvpRounds.push(Math.min(...[...seen.values()].map(x => x.b.round))); }
    for (const { b, comp } of seen.values()) {
      const att = Object.values(comp.attack).reduce((a, c) => a + c, 0), def = Object.values(comp.defense).reduce((a, c) => a + c, 0);
      agg.sizes.push([att, def]); agg.losses += b.losses.length;
      const noSupply = [...b.attackBreakdown].some(m => /Sem suprimento/.test(m.source)), noSupplyDef = [...b.defenseBreakdown].some(m => /Sem suprimento/.test(m.source));
      if (noSupply || noSupplyDef) agg.unsupplied++;
      if (b.winnerId === b.attackerId) agg.attackerWins++;
      if (b.outcome === 'TIE') agg.ties++; if (b.outcome === 'DECISIVE') agg.decisive++;
      battles.push({ players, seed, round: b.round, attacker: b.attackerId, defender: b.defenderId, attackerPosture: b.attackerPosture, defenderPosture: b.defenderPosture, comp, delta: b.delta, outcome: b.outcome, winner: b.winnerId, losses: b.losses.length, retreat: b.retreat, noSupplyAttacker: noSupply, noSupplyDefender: noSupplyDef, fortification: b.fortification && `${b.fortification.before.level}/${b.fortification.before.state}→${b.fortification.after.state}`,
        breakdown: { attack: b.attackBreakdown.map(m => `${m.source}${m.amount >= 0 ? '+' : ''}${m.amount}`), defense: b.defenseBreakdown.map(m => `${m.source}${m.amount >= 0 ? '+' : ''}${m.amount}`) } });
    }
    console.log(`${players}p seed ${seed}: contact r${firstContact} war r${firstWar} wars ${r.state.wars.length} pvp ${seen.size} captured ${r.state.telemetry.citiesCaptured}`);
  }
  const avg = xs => xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : null;
  rows.push({ players, matches: seeds, matchesWithWar: agg.matchesWithWar, warsDeclared: agg.wars, firstWarRound: avg(agg.firstWarRounds), firstContactRound: avg(agg.firstContactRounds), matchesWithPvp: agg.matchesWithPvp, pvpBattles: agg.pvp, firstPvpRound: avg(agg.firstPvpRounds), avgAttackerPieces: avg(agg.sizes.map(x => x[0])), avgDefenderPieces: avg(agg.sizes.map(x => x[1])), attackerWins: agg.attackerWins, ties: agg.ties, decisive: agg.decisive, withSupplyPenalty: agg.unsupplied, pieceLosses: agg.losses, citiesCaptured: agg.captures });
  console.log(JSON.stringify(rows.at(-1)));
}
writeFileSync(`${out}/pvp-${tag}.json`, JSON.stringify({ persona, rounds, rows, battles }, null, 1));
console.log(JSON.stringify(rows));
