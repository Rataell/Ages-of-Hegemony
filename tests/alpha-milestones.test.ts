import { describe, expect, it } from 'vitest';
import { ALPHA_ERA_MILESTONES, AlphaEraSchema, alphaRules, eraForRound } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, eraMilestones } from '@aoh/game-engine';
import { completeRound } from './alpha-rounds.js';

function setup(roundsPerEra = 5) {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'eras-alpha', seed: 31, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));
  state.rules.roundsPerEra = roundsPerEra; state.rules.roundLimit = 7 * roundsPerEra;
  return state;
}

describe('eras pass by the calendar (canon V5.1a §1, §22)', () => {
  it('has seven Eras ending in Ascensão; Hegemony is not an Era', () => {
    expect(AlphaEraSchema.options).toEqual(['FOUNDATION', 'EXPANSION', 'CONSOLIDATION', 'CIVILIZATION', 'EMPIRES', 'POWERS', 'ASCENSION']);
    expect(AlphaEraSchema.options).not.toContain('HEGEMONY');
  });
  it('maps rounds to Eras in blocks of roundsPerEra, the last Era absorbing extra rounds', () => {
    expect([1, 5, 6, 10, 11, 15, 16, 20, 21, 25, 26, 30, 31, 35, 40].map(round => eraForRound(round, 5))).toEqual([
      'FOUNDATION', 'FOUNDATION', 'EXPANSION', 'EXPANSION', 'CONSOLIDATION', 'CONSOLIDATION', 'CIVILIZATION', 'CIVILIZATION', 'EMPIRES', 'EMPIRES', 'POWERS', 'POWERS', 'ASCENSION', 'ASCENSION', 'ASCENSION',
    ]);
    expect(eraForRound(4, 3)).toBe('EXPANSION');
  });
  it('sizes the match as seven Eras of roundsPerEra rounds', () => {
    expect(alphaRules('STANDARD')).toMatchObject({ roundsPerEra: 5, roundLimit: 35 });
    expect(alphaRules('QUICK')).toMatchObject({ roundsPerEra: 3, roundLimit: 21 });
    expect(alphaRules('EPIC')).toMatchObject({ roundsPerEra: 7, roundLimit: 49 });
  });
  it('moves every civilization together when a new Era opens and restores the Leader power', () => {
    let state = setup(2);
    for (const player of state.players) if (player.leader) player.leader.eraAbilityUsed = true;
    expect(state.players.map(player => player.era)).toEqual(['FOUNDATION', 'FOUNDATION']);
    state = completeRound(state);
    expect(state.core.round).toBe(2);
    expect(state.players.map(player => player.era)).toEqual(['FOUNDATION', 'FOUNDATION']);
    state = completeRound(state);
    expect(state.core.round).toBe(3);
    expect(state.players.map(player => player.era)).toEqual(['EXPANSION', 'EXPANSION']);
    for (const player of state.players) if (player.leader) expect(player.leader.eraAbilityUsed).toBe(false);
    expect(state.events.filter(event => event.type === 'ERA_ADVANCED')).toHaveLength(2);
  });
  it('reports the next Era and how many rounds remain; nobody advances by criteria any more', () => {
    const state = setup(5);
    const progress = eraMilestones(state, state.players[0]!.playerId);
    expect(progress).toMatchObject({ next: 'EXPANSION', roundsPerEra: 5, roundsUntilNext: 5, canAdvance: false });
    expect(progress.criteria.length).toBeGreaterThan(0);
  });
  it('keeps the old milestone table only as a reference', () => {
    expect(ALPHA_ERA_MILESTONES).toHaveLength(5);
    expect(alphaRules('STANDARD').milestones).toEqual(ALPHA_ERA_MILESTONES);
  });
});
