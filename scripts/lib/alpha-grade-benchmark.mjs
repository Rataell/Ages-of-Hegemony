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
