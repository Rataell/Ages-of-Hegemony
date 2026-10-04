import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, PlayerIdSchema, civilizationKit, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, civilizationCardStatus, createAlphaGame } from '@aoh/game-engine';
import { must } from './alpha-rounds.js';

const p1 = PlayerIdSchema.parse('p1');
const fresh = (): AlphaState => beginAlphaPlanning(createAlphaGame({ gameId: 'civ-cards', seed: 17, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));
const play = (state: AlphaState, cardId: string) => applyAlphaCommand(state, p1, { type: 'PLAY_CIVILIZATION_CARD', expectedVersion: state.version, cardId });

describe('civilization cards on the civilization board', () => {
  it('makes the first card available from Era I, without any draw', () => {
    const state = fresh(), kit = civilizationKit(state.players[0]!.civilization)!;
    expect(kit.cards).toHaveLength(3);
    expect(kit.cards.map(card => civilizationCardStatus(state, p1, card.id))).toEqual(['AVAILABLE', 'LOCKED', 'LOCKED']);
  });
  it('applies the effect once per Era and counts toward the round card limit', () => {
    let state = fresh();
    const kit = civilizationKit(state.players[0]!.civilization)!, first = kit.cards[0]!;
    const before = structuredClone(state.players[0]!.resources);
    state = must(state, p1, { type: 'PLAY_CIVILIZATION_CARD', cardId: first.id });
    const after = state.players[0]!.resources;
    expect(Object.values(after).reduce((a, b) => a + b, 0)).toBeGreaterThan(Object.values(before).reduce((a, b) => a + b, 0) - 1);
    expect(state.players[0]!.cardsPlayed).toBe(1);
    expect(civilizationCardStatus(state, p1, first.id)).toBe('USED');
    const again = play(state, first.id);
    expect(again.ok).toBe(false);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });
  it('refuses a locked card and a card from another civilization', () => {
    const state = fresh(), mine = civilizationKit(state.players[0]!.civilization)!, theirs = civilizationKit(state.players[1]!.civilization)!;
    expect(play(state, mine.cards[1]!.id).ok).toBe(false);
    expect(play(state, theirs.cards[0]!.id).ok).toBe(false);
  });
  it('frees the cards again in a new Era and unlocks the second at Era III', () => {
    let state = fresh();
    const kit = civilizationKit(state.players[0]!.civilization)!;
    state = must(state, p1, { type: 'PLAY_CIVILIZATION_CARD', cardId: kit.cards[0]!.id });
    state.players[0]!.era = 'CIVILIZATION';
    expect(kit.cards.map(card => civilizationCardStatus(state, p1, card.id))).toEqual(['AVAILABLE', 'AVAILABLE', 'LOCKED']);
  });
});
