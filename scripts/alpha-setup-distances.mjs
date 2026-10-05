// Initial geometry and the pace of contact with every Pátria public and the capital back inside its Pátria (DEV measurement, read-only).
//   npm run compile && node scripts/alpha-setup-distances.mjs [--seeds=12] [--match-seeds=4] [--out=docs/evidence/v51b-shared-table/PATRIAS.md]
import { writeFileSync } from 'node:fs';
import * as E from '../packages/game-engine/dist/index.js';
import { playMatch } from './lib/alpha-bots.mjs';
const arg = (n, d) => (process.argv.find(a => a.startsWith(`--${n}=`)) ?? `--${n}=${d}`).split('=')[1];
const COUNTS = arg('players', '2,4,6').split(',').map(Number), SEEDS = Number(arg('seeds', 12)), MATCH = Number(arg('match-seeds', 4)), OUT = arg('out', 'docs/evidence/v51b-shared-table/PATRIAS.md');
const mean = a => a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : null;
const lines = ['# Pátrias públicas, capital dentro da Pátria: distâncias e ritmo de contato\n', 'Geometria (capital = centro da Pátria, hex gerado; seeds 1–' + SEEDS + '):\n', '| mesa | distância capital↔capital mais próxima (mín / média) | capital↔capital média | Pátria↔Pátria (centros vizinhos mais próximos) |', '|---|---|---|---|'];
const geo = {};
for (const count of COUNTS) {
  const nearest = [], all = [];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const state = E.createAlphaGame({ gameId: `geo-${count}-${seed}`, seed, preset: 'QUICK', players: Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` })) });
    const caps = state.core.players.map(p => state.core.map.find(t => t.id === p.civilization.cities[0].hexId));
    for (const [i, a] of caps.entries()) { const ds = caps.filter((_, j) => j !== i).map(b => E.hexDistance(a, b)); nearest.push(Math.min(...ds)); all.push(...ds); }
  }
  geo[count] = { min: Math.min(...nearest), mean: mean(nearest), all: mean(all) };
  lines.push(`| ${count}p | ${geo[count].min} / ${geo[count].mean} | ${geo[count].all} | ${count === 4 ? '5 (vizinhas) / 10' : '5'} hexes entre centros |`);
}
lines.push('', `Ritmo (bots competentes, ${MATCH} seeds por mesa, 35 rodadas; "—" = não aconteceu):`, '', '| mesa | 1º Contato (rodada) | 1ª fronteira compartilhada | 1º combate jogador × jogador | 1ª cidade adicional | partidas |', '|---|---|---|---|---|---|');
for (const count of COUNTS) {
  const first = { contact: [], border: [], combat: [], city: [] };
  for (let seed = 1; seed <= MATCH; seed++) {
    const seen = {};
    const scenario = (box, when) => {
      if (when !== 'round-start') return;
      const st = box.state, round = st.core.round;
      if (seen.contact === undefined && st.players.some(p => p.contacts.length)) seen.contact = round;
      if (seen.border === undefined) { const own = new Map(st.core.map.filter(t => t.ownerId).map(t => [t.id, t.ownerId])); const hit = st.core.map.some(t => t.ownerId && E.hexNeighbors(t).some(n => { const o = own.get(`${n.q},${n.r}`); return o && o !== t.ownerId; })); if (hit) seen.border = round; }
      if (seen.combat === undefined && st.battles.some(b => b.attackerId !== 'world' && b.defenderId !== 'world')) seen.combat = round;
      if (seen.city === undefined && st.core.players.reduce((n, p) => n + p.civilization.cities.length, 0) > count) seen.city = round;
    };
    playMatch({ seed, players: count, skill: 'competent', scenario });
    for (const k of Object.keys(first)) if (seen[k] !== undefined) first[k].push(seen[k]);
  }
  const cell = a => a.length ? `${mean(a)} (${a.length}/${MATCH})` : '—';
  lines.push(`| ${count}p | ${cell(first.contact)} | ${cell(first.border)} | ${cell(first.combat)} | ${cell(first.city)} | ${MATCH} |`);
}
writeFileSync(OUT, lines.join('\n') + '\n'); console.log(lines.join('\n'));
