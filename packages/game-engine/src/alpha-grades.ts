import type { AlphaState, AlphaUnit, PlayerId } from '@aoh/game-domain';

/** Military Graus I–III (canon §12b). The physical piece is the same in every Grau; the Grau is read from the owner's research. */
export type Grade = 1 | 2 | 3;
type Family = Extract<AlphaUnit['kind'], 'INFANTRY' | 'GUARD' | 'RANGED' | 'CAVALRY' | 'SIEGE' | 'FLEET'>;
export const GRADE_REQUIREMENTS: Readonly<Record<Family, { II: readonly string[]; III: readonly string[] }>> = {
  INFANTRY: { II: ['web-maneuver-training'], III: ['web-iron'] },
  GUARD: { II: ['web-fortification'], III: ['web-deep-defense'] },
  RANGED: { II: ['web-metallurgy'], III: ['web-gunpowder'] },
  CAVALRY: { II: ['web-war-of-movement'], III: ['web-naval-doctrine', 'web-war-of-movement'] },
  SIEGE: { II: ['web-engineering'], III: ['web-artillery'] },
  FLEET: { II: ['web-naval-architecture'], III: ['web-ballistics'] },
};
export const GRADE_FAMILIES = Object.keys(GRADE_REQUIREMENTS) as Family[];
export const GRADE_NUMERALS = ['I', 'II', 'III'] as const;
export const isGradedKind = (kind: AlphaUnit['kind']): kind is Family => kind in GRADE_REQUIREMENTS;

/** The Grau of a family for a civilization: the highest whose Web requirements are all researched. Non-military pieces are always I. */
export function gradeFor(research: readonly string[], kind: AlphaUnit['kind']): Grade {
  if (!isGradedKind(kind)) return 1;
  const rule = GRADE_REQUIREMENTS[kind];
  if (rule.III.every(id => research.includes(id))) return 3;
  if (rule.II.every(id => research.includes(id))) return 2;
  return 1;
}
export const unitGrade = (state: AlphaState, owner: PlayerId, kind: AlphaUnit['kind']): Grade => gradeFor(state.players.find(player => player.playerId === owner)?.research ?? [], kind);
/** Movement budget before roads, bonuses and kits: Cavalaria gains 1 from Grau II (Guerra de Movimento). */
export const unitMovement = (state: AlphaState, unit: Pick<AlphaUnit, 'ownerId' | 'kind'>): number =>
  state.rules.units[unit.kind].movement + (unit.kind === 'CAVALRY' && unitGrade(state, unit.ownerId, 'CAVALRY') >= 2 ? 1 : 0);
/** Cargo slots a ship offers: Frota carries 2, 3 from Grau II (Arquitetura Naval). */
export const unitTransport = (state: AlphaState, unit: Pick<AlphaUnit, 'ownerId' | 'kind'>): number =>
  state.rules.units[unit.kind].transport + (unit.kind === 'FLEET' && unitGrade(state, unit.ownerId, 'FLEET') >= 2 ? 1 : 0);
