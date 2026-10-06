// Finds player-vs-player battles in bot matches. Usage: node scripts/alpha-pvp-combat.mjs [--players=2,4,6] [--seeds=6] [--rounds=35] [--personas=warrior] [--out=docs/evidence/v51b-pioneers]
import { mkdirSync, writeFileSync } from 'node:fs';
import { playMatch } from './lib/alpha-bots.mjs';
const arg = (n, f) => (process.argv.find(a => a.startsWith(`--${n}=`)) ?? `--${n}=${f}`).split('=')[1];
const counts = arg('players', '2,4,6').split(',').map(Number), seeds = Number(arg('seeds', 6)), rounds = Number(arg('rounds', 35)), out = arg('out', 'docs/evidence/v51b-pioneers');
const persona = arg('personas', 'warrior');
mkdirSync(out, { recursive: true });
const rows = [], samples = [];
for (const players of counts) {
  let withPvp = 0, pvp = 0, captures = 0, firstRounds = [], wars = 0; const kinds = {};
  for (let seed = 1; seed <= seeds; seed++) {
    const seen = new Map(); let firstContact = null;
    const r = playMatch({ seed, players, rounds, startingPioneers: 2, personas: Array(players).fill(persona), scenario: (box, h) => {
      if (h !== 'round-start') return; const s = box.state;
      if (firstContact === null && s.players.some(p => p.contacts.some(c => c !== p.playerId))) firstContact = s.core.round;
      const ids = new Set(s.players.map(p => p.playerId));
      for (const b of s.battles) if (ids.has(b.attackerId) && ids.has(b.defenderId) && !seen.has(b.id)) seen.set(b.id, b);
    } });
    for (const b of r.state.battles) { const ids = new Set(r.state.players.map(p => p.playerId)); if (ids.has(b.attackerId) && ids.has(b.defenderId) && !seen.has(b.id)) seen.set(b.id, b); }
    wars += r.state.wars.length; captures += r.state.telemetry.citiesCaptured;
    if (seen.size) { withPvp++; pvp += seen.size; firstRounds.push(Math.min(...[...seen.values()].map(b => b.round))); samples.push({ players, seed, battle: [...seen.values()][0] }); }
    for (const b of seen.values()) for (const m of [...b.attackBreakdown, ...b.defenseBreakdown]) kinds[m.source] = (kinds[m.source] ?? 0) + 1;
    console.log(`${players}p seed ${seed}: contact r${firstContact} pvp ${seen.size} wars ${r.state.wars.length} captured ${r.state.telemetry.citiesCaptured}`);
  }
  rows.push({ players, matches: seeds, matchesWithPvp: withPvp, pvpBattles: pvp, firstPvpRound: firstRounds.length ? +(firstRounds.reduce((a, b) => a + b, 0) / firstRounds.length).toFixed(1) : null, wars, captures, modifiers: kinds });
}
writeFileSync(`${out}/pvp-combat.json`, JSON.stringify({ rows, samples: samples.slice(0, 6) }, null, 1));
console.log(JSON.stringify(rows));
