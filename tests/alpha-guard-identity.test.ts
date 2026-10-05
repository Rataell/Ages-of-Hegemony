import { describe, expect, it } from 'vitest';
import { createAlphaGame, resolveShock } from '@aoh/game-engine';
import type { ShockPiece } from '@aoh/game-engine';

/** D-2: the Guarda keeps a defensive identity — its shield only works on the attacking side in the Manter posture. */
const state = createAlphaGame({ gameId: 'guard-identity', seed: 11, preset: 'STANDARD', players: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] });
const guards = (n: number, grade: 1 | 2 | 3 = 1): ShockPiece[] => Array.from({ length: n }, (_, i) => ({ id: `g${i}`, kind: 'GUARD', grade }));
const infantry = (n: number, tag: string, grade: 1 | 2 | 3 = 1): ShockPiece[] => Array.from({ length: n }, (_, i) => ({ id: `${tag}${i}`, kind: 'INFANTRY', grade }));
const faces = (pieces: ShockPiece[], face: 'GUARD' | 'IMPACT') => Object.fromEntries(pieces.map(piece => [piece.id, face]));
const open = { terrain: 'PLAINS', city: false, fortification: null };

describe('Guarda ao atacar', () => {
  const attackers = guards(3), defenders = infantry(3, 'd');
  const forced = { ...faces(attackers, 'GUARD'), ...faces(defenders, 'IMPACT') };
  it.each([['ASSAULT', 0], ['MANEUVER', 0], ['HOLD', 3]] as const)('Guarda rolled while attacking in %s cancels %i Impacto(s) of the other side', (posture, cancelled) => {
    const result = resolveShock(state, { attacker: { pieces: attackers, posture, flat: [] }, defender: { pieces: defenders, posture: 'HOLD', flat: [] }, forced, ...open });
    const flat = result.attackerRolls.map(roll => roll.effect).join('|');
    expect(flat.includes('cancela')).toBe(cancelled > 0);
    if (cancelled === 0) expect(flat).toContain('sem efeito ao atacar fora da postura Manter');
  });

  it('higher Graus do not turn the attacking Guarda into an offensive shield (identity, not parity with Infantaria)', () => {
    for (const grade of [1, 2, 3] as const) {
      const pieces = guards(3, grade), enemy = infantry(3, 'd');
      const result = resolveShock(state, { attacker: { pieces, posture: 'ASSAULT', flat: [] }, defender: { pieces: enemy, posture: 'HOLD', flat: [] }, forced: { ...faces(pieces, 'GUARD'), ...faces(enemy, 'IMPACT') }, ...open });
      expect(result.attackerRolls.every(roll => roll.effect.includes('sem efeito'))).toBe(true);
    }
  });

  it('on defence the same Guarda face does cancel Impacto', () => {
    const own = guards(3), enemy = infantry(3, 'a');
    const result = resolveShock(state, { attacker: { pieces: enemy, posture: 'ASSAULT', flat: [] }, defender: { pieces: own, posture: 'HOLD', flat: [] }, forced: { ...faces(own, 'GUARD'), ...faces(enemy, 'IMPACT') }, ...open });
    expect(result.defenderRolls.every(roll => roll.effect.includes('cancela'))).toBe(true);
  });
});
