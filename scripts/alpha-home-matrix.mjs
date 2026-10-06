// Prints the Region-graph distance matrix between the active Pátrias for 2–6 seats and a few seeds (fast: no matches are played).
//   node scripts/alpha-home-matrix.mjs [--seeds=1,2,3]
import { layoutBoard, regionDistances } from '../packages/game-domain/dist/index.js';
import { createAlphaGame, hexDistance } from '../packages/game-engine/dist/index.js';
const seeds = (process.argv.find(a => a.startsWith('--seeds=')) ?? '--seeds=1,2,3').split('=')[1].split(',').map(Number);
for (const n of [2, 3, 4, 5, 6]) for (const seed of seeds) {
  const board = layoutBoard(n, seed), homes = board.homeSlots.slice(0, n);
  const m = homes.map(a => { const d = regionDistances(board.cells, a); return homes.map(b => d.get(b)); });
  const off = m.flatMap((row, i) => row.filter((_, j) => j > i));
  console.log(`${n}p seed ${seed}: ${homes.join(' ')} | min ${Math.min(...off)} total ${off.reduce((a, b) => a + b, 0)}`);
  const state = createAlphaGame({ gameId: `matrix-${n}-${seed}`, seed, preset: 'QUICK', players: Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` })) });
  const caps = state.core.players.map(p => state.core.map.find(t => t.id === p.civilization.cities[0].hexId));
  console.log(m.map((r, i) => '   Regiões ' + r.join(' ') + '   | capitais (hexes) ' + caps.map(c => hexDistance(caps[i], c)).join(' ')).join('\n'));
}
