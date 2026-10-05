// Do the military Graus matter? Seeded 3v3 shocks per family through the real shock core (resolveShock), Grau I against II and III.
import * as E from '../../packages/game-engine/dist/index.js';
const FAMILIES = [['INFANTRY', 'Infantaria'], ['GUARD', 'Guarda'], ['RANGED', 'Arqueiros'], ['CAVALRY', 'Cavalaria'], ['SIEGE', 'Cerco (contra 3 Guardas e Paliçada)'], ['FLEET', 'Frota']];
export function gradeBenchmark(trials = 1500) {
  const state = E.createAlphaGame({ gameId: 'grade-benchmark', seed: 99, preset: 'STANDARD', players: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] });
  const side = (kind, grade, tag, posture) => ({ pieces: [1, 2, 3].map(i => ({ id: `${tag}${i}`, kind, grade })), posture, flat: [] });
  const foe = kind => kind === 'SIEGE' ? 'GUARD' : kind;
  const run = (kind, attackGrade, defendGrade) => {
    const counts = { attackerWins: 0, defenderWins: 0, tie: 0 };
    for (let i = 0; i < trials; i++) {
      const result = E.resolveShock(state, { attacker: side(kind, attackGrade, 'a', 'ASSAULT'), defender: side(foe(kind), defendGrade, 'd', 'HOLD'), terrain: kind === 'FLEET' ? 'SEA' : 'PLAINS', city: kind === 'SIEGE', fortification: kind === 'SIEGE' ? { level: 'PALISADE', state: 'INTACT' } : null });
      if (result.outcome === 'TIE') counts.tie++; else if (result.delta > 0) counts.attackerWins++; else counts.defenderWins++;
    }
    return { attackerWins: counts.attackerWins / trials, defenderWins: counts.defenderWins / trials, tie: counts.tie / trials };
  };
  return FAMILIES.map(([kind, family]) => ({ family, trials, gradeI: run(kind, 1, 1), gradeII: run(kind, 2, 1), gradeIII: run(kind, 3, 1), gradeIIIDefending: run(kind, 1, 3) }));
}

/** Can a human-sized force handle a Bando? Seeded shocks through the same core: a Bando (always Assalto) against k defenders behind each wall, and k Infantaria attacking an Acampamento in the open. */
export function bandBenchmark(trials = 1500) {
  const state = E.createAlphaGame({ gameId: 'band-benchmark', seed: 98, preset: 'STANDARD', players: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] });
  const pieces = (list, tag) => list.flatMap(([kind, count], i) => Array.from({ length: count }, (_, j) => ({ id: `${tag}${i}-${j}`, kind, grade: 1 })));
  const BANDS = { 'I (Era I-II)': [['INFANTRY', 2]], 'II (Era II)': [['INFANTRY', 3], ['RANGED', 1]], 'II (Era III+)': [['INFANTRY', 3], ['CAVALRY', 1]], 'III (Era V+)': [['INFANTRY', 4], ['CAVALRY', 1], ['SIEGE', 1]] };
  const walls = [['sem muralha', null], ['Paliçada', 'PALISADE'], ['Muralha de Pedra', 'STONE_WALL'], ['Fortaleza', 'FORTRESS']];
  const share = (attacker, defender, terrain, city, fortification, attackerPosture, defenderPosture) => {
    let aw = 0, tie = 0;
    for (let i = 0; i < trials; i++) { const r = E.resolveShock(state, { attacker: { pieces: attacker, posture: attackerPosture, flat: [] }, defender: { pieces: defender, posture: defenderPosture, flat: [] }, terrain, city, fortification }); if (r.outcome === 'TIE') tie++; else if (r.delta > 0) aw++; }
    return { attackerWins: aw / trials, tie: tie / trials, defenderWins: 1 - aw / trials - tie / trials };
  };
  const defence = [];
  for (const [name, band] of Object.entries(BANDS)) for (const k of [0, 1, 2, 3, 4, 6]) for (const [wallName, wall] of walls) defence.push({ band: name, defenders: k, wall: wallName, ...share(pieces(band, 'b'), pieces([['INFANTRY', k]], 'd'), 'PLAINS', true, wall ? { level: wall, state: 'INTACT' } : null, 'ASSAULT', 'HOLD') });
  const offence = [];
  for (const [name, band] of Object.entries(BANDS)) for (const k of [2, 3, 4, 5, 6, 8]) offence.push({ band: name, attackers: k, ...share(pieces([['INFANTRY', k]], 'a'), pieces(band, 'b'), 'PLAINS', false, null, 'ASSAULT', 'ASSAULT') });
  return { trials, defence, offence };
}
