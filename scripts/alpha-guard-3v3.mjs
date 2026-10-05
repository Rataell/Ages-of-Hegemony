// D-2 evidence: Guarda keeps a defensive identity. 3v3 and mixed compositions through the real shock core, 2000 seeded shocks each.
// Read-only: no rule changes. Requires `npm run compile` first (reads packages/game-engine/dist).
import { writeFileSync } from 'node:fs';
import * as E from '../packages/game-engine/dist/index.js';
const trials = 2000;
const state = E.createAlphaGame({ gameId: 'guard-3v3', seed: 97, preset: 'STANDARD', players: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] });
const mix = (list, tag, posture) => ({ pieces: list.flatMap(([kind, n, grade], k) => Array.from({ length: n }, (_, i) => ({ id: `${tag}${k}-${i}`, kind, grade }))), posture, flat: [] });
function run(build) {
  const c = { A: 0, tie: 0, D: 0 }; let sum = 0;
  for (let i = 0; i < trials; i++) { const r = E.resolveShock(state, build()); sum += r.delta; if (r.outcome === 'TIE') c.tie++; else if (r.delta > 0) c.A++; else c.D++; }
  const pct = n => Math.round(100 * n / trials);
  return `${pct(c.A)} / ${pct(c.tie)} / ${pct(c.D)} (Δ ${(sum / trials).toFixed(2)})`;
}
const open = { terrain: 'PLAINS', city: false, fortification: null };
const INF = ['INFANTRY', 3, 1], G = g => ['GUARD', 3, g];
const CASES = [
  ['3 Infantaria atacam 3 Infantaria (Assalto × Manter)', g => ({ attacker: mix([['INFANTRY', 3, g]], 'a', 'ASSAULT'), defender: mix([INF], 'd', 'HOLD'), ...open })],
  ['3 Guarda atacam 3 Infantaria I (Assalto × Manter): Guarda sem efeito', g => ({ attacker: mix([G(g)], 'a', 'ASSAULT'), defender: mix([INF], 'd', 'HOLD'), ...open })],
  ['3 Guarda atacam 3 Infantaria I (Manter × Manter): Guarda vale', g => ({ attacker: mix([G(g)], 'a', 'HOLD'), defender: mix([INF], 'd', 'HOLD'), ...open })],
  ['3 Guarda defendem contra 3 Infantaria I (Assalto × Manter)', g => ({ attacker: mix([INF], 'a', 'ASSAULT'), defender: mix([G(g)], 'd', 'HOLD'), ...open })],
  ['3 Guarda defendem em Colina contra 3 Infantaria I', g => ({ attacker: mix([INF], 'a', 'ASSAULT'), defender: mix([G(g)], 'd', 'HOLD'), terrain: 'HILLS', city: false, fortification: null })],
  ['3 Guarda defendem a cidade (Muralha) contra 3 Infantaria I', g => ({ attacker: mix([INF], 'a', 'ASSAULT'), defender: mix([G(g)], 'd', 'HOLD'), terrain: 'PLAINS', city: true, fortification: { level: 'STONE_WALL', state: 'INTACT' } })],
  ['2 Guarda + 1 Cavalaria atacam 3 Infantaria I (Assalto × Manter)', g => ({ attacker: mix([['GUARD', 2, g], ['CAVALRY', 1, g]], 'a', 'ASSAULT'), defender: mix([INF], 'd', 'HOLD'), ...open })],
  ['2 Infantaria + 1 Guarda atacam 3 Infantaria I (Assalto × Manter)', g => ({ attacker: mix([['INFANTRY', 2, g], ['GUARD', 1, g]], 'a', 'ASSAULT'), defender: mix([INF], 'd', 'HOLD'), ...open })],
  ['2 Guarda + 1 Arqueiros defendem contra 3 Infantaria I', g => ({ attacker: mix([INF], 'a', 'ASSAULT'), defender: mix([['GUARD', 2, g], ['RANGED', 1, g]], 'd', 'HOLD'), ...open })],
  ['3 Guarda avançam (Manter) contra 3 Guarda (Manter)', g => ({ attacker: mix([G(g)], 'a', 'HOLD'), defender: mix([G(1)], 'd', 'HOLD'), ...open })],
];
const lines = ['# Guarda · 3v3 e composições mistas (atacante vence / empate / defensor vence, % de 2000 choques; Δ médio; a Guarda tem o Grau indicado)\n', '| composição | Grau I | Grau II | Grau III |', '|---|---|---|---|'];
for (const [name, build] of CASES) lines.push(`| ${name} | ${[1, 2, 3].map(g => run(() => build(g))).join(' | ')} |`);
writeFileSync('docs/evidence/v51b-investigation/GUARDA-3V3.md', lines.join('\n') + '\n');
console.log(lines.join('\n'));
