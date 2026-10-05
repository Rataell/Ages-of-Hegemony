// Where do the Graus matter? Each family's Grau II/III effect measured in the situation its signature is written for (the plain 3v3 field benchmark
// cannot show Muro, Flanco in Colina, Brecha, Salva vs walls). 2000 seeded shocks through the real core. Read-only: no rule changes.
import { writeFileSync } from 'node:fs';
import * as E from '../packages/game-engine/dist/index.js';
const trials = 2000;
const state = E.createAlphaGame({ gameId: 'grade-situational', seed: 97, preset: 'STANDARD', players: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] });
const side = (kind, n, grade, tag, posture) => ({ pieces: Array.from({ length: n }, (_, i) => ({ id: `${tag}${i}`, kind, grade })), posture, flat: [] });
const mix = (list, tag, posture) => ({ pieces: list.flatMap(([kind, n, grade], k) => Array.from({ length: n }, (_, i) => ({ id: `${tag}${k}-${i}`, kind, grade }))), posture, flat: [] });
function run(build) {
  const c = { A: 0, tie: 0, D: 0, dec: 0 }; let sumDelta = 0;
  for (let i = 0; i < trials; i++) { const r = E.resolveShock(state, build()); sumDelta += r.delta; if (r.outcome === 'TIE') c.tie++; else if (r.delta > 0) c.A++; else c.D++; if (r.outcome === 'DECISIVE') c.dec++; }
  return { A: Math.round(100 * c.A / trials), tie: Math.round(100 * c.tie / trials), D: Math.round(100 * c.D / trials), decisive: Math.round(100 * c.dec / trials), meanDelta: +(sumDelta / trials).toFixed(2) };
}
const fort = (level) => ({ level, state: 'INTACT' });
const CASES = [
  ['Guarda · Muro: 3 Guarda defendem a cidade (Muralha) contra 4 Infantaria I (Assalto × Manter)', g => () => ({ attacker: side('INFANTRY', 4, 1, 'a', 'ASSAULT'), defender: side('GUARD', 3, g, 'd', 'HOLD'), terrain: 'PLAINS', city: true, fortification: fort('STONE_WALL') })],
  ['Guarda · Muro II: 3 Guarda defendem em Colina (campo aberto) contra 3 Infantaria I', g => () => ({ attacker: side('INFANTRY', 3, 1, 'a', 'ASSAULT'), defender: side('GUARD', 3, g, 'd', 'HOLD'), terrain: 'HILLS', city: false, fortification: null })],
  ['Cavalaria · Flanco: 3 Cavalaria atacam 3 Infantaria I na Planície', g => () => ({ attacker: side('CAVALRY', 3, g, 'a', 'ASSAULT'), defender: side('INFANTRY', 3, 1, 'd', 'HOLD'), terrain: 'PLAINS', city: false, fortification: null })],
  ['Cavalaria · Flanco III: 3 Cavalaria atacam 3 Infantaria I na Colina', g => () => ({ attacker: side('CAVALRY', 3, g, 'a', 'ASSAULT'), defender: side('INFANTRY', 3, 1, 'd', 'HOLD'), terrain: 'HILLS', city: false, fortification: null })],
  ['Cerco · Brecha: 3 Infantaria + 2 Cerco atacam 2 Guarda I na Fortaleza', g => () => ({ attacker: mix([['INFANTRY', 3, 1], ['SIEGE', 2, g]], 'a', 'ASSAULT'), defender: side('GUARD', 2, 1, 'd', 'HOLD'), terrain: 'PLAINS', city: true, fortification: fort('FORTRESS') })],
  ['Cerco · Brecha III: 3 Infantaria + 2 Cerco atacam 2 Guarda I na Muralha de Pedra', g => () => ({ attacker: mix([['INFANTRY', 3, 1], ['SIEGE', 2, g]], 'a', 'ASSAULT'), defender: side('GUARD', 2, 1, 'd', 'HOLD'), terrain: 'PLAINS', city: true, fortification: fort('STONE_WALL') })],
  ['Arqueiros · Salva: 3 Infantaria + 2 Arqueiros atacam 3 Guarda I na Muralha', g => () => ({ attacker: mix([['INFANTRY', 3, 1], ['RANGED', 2, g]], 'a', 'ASSAULT'), defender: side('GUARD', 3, 1, 'd', 'HOLD'), terrain: 'PLAINS', city: true, fortification: fort('STONE_WALL') })],
  ['Infantaria · Linha: 3 Infantaria atacam 3 Infantaria I (Manter)', g => () => ({ attacker: side('INFANTRY', 3, g, 'a', 'ASSAULT'), defender: side('INFANTRY', 3, 1, 'd', 'HOLD'), terrain: 'PLAINS', city: false, fortification: null })],
  ['Infantaria · Linha: 3 Infantaria defendem contra 3 Infantaria I (Assalto)', g => () => ({ attacker: side('INFANTRY', 3, 1, 'a', 'ASSAULT'), defender: side('INFANTRY', 3, g, 'd', 'HOLD'), terrain: 'PLAINS', city: false, fortification: null })],
];
const lines = ['# Graus in the situation their signature is written for (A / tie / D, % of 2000 shocks; mean Δ)\n', '| situation | Grau I | Grau II | Grau III |', '|---|---|---|---|'];
const data = [];
for (const [name, build] of CASES) {
  const row = [1, 2, 3].map(g => run(build(g)));
  data.push({ name, row });
  lines.push(`| ${name} | ${row.map(x => `${x.A} / ${x.tie} / ${x.D} (Δ ${x.meanDelta})`).join(' | ')} |`);
}
writeFileSync('docs/evidence/v51b-investigation/GRAUS-SITUACIONAL.md', lines.join('\n') + '\n');
writeFileSync('docs/evidence/v51b-investigation/graus-situacional.json', JSON.stringify(data, null, 1));
console.log(lines.join('\n'));
