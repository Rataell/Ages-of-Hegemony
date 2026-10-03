import { describe, expect, it } from 'vitest';
import { ALPHA_CARDS, AlphaStateSchema, type AlphaState } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, maintainCards, serializeAlphaState } from '@aoh/game-engine';

const strategy = new Set(ALPHA_CARDS.filter(card => card.family === 'STRATEGY').map(card => card.id));
function sixPlayers(): AlphaState {
  return beginAlphaPlanning(createAlphaGame({ gameId: 'decks', seed: 31, preset: 'EPIC', players: Array.from({ length: 6 }, (_, i) => ({ id: `p${i + 1}`, name: `Pessoa ${i + 1}` })) }));
}
/** Every player plays down to two cards and the deck runs dry, as happens around round 3 with six players. */
function exhausted(): AlphaState {
  const state = sixPlayers();
  for (const player of state.players) state.cards.discarded.push(...player.hand.splice(2));
  state.cards.discarded.push(...state.cards.strategyDeck.splice(0));
  return state;
}

describe('the strategy deck keeps hands refilling for the whole match', () => {
  it('reshuffles the played strategy cards when the deck is empty, leaving other discards alone', () => {
    const state = exhausted();
    const others = state.cards.discarded.filter(id => !strategy.has(id));
    const returning = state.cards.discarded.filter(id => strategy.has(id)).length;
    maintainCards(state);
    for (const player of state.players) expect(player.hand).toHaveLength(3);
    expect(state.cards.strategyDeck).toHaveLength(returning - state.players.length);
    expect(state.cards.discarded).toEqual(others);
    const zones = [...state.cards.strategyDeck, ...state.players.flatMap(player => player.hand)];
    expect(new Set(zones).size).toBe(zones.length);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('shuffles with the match seed, so the same match draws the same cards', () => {
    const a = exhausted(), b = exhausted();
    maintainCards(a); maintainCards(b);
    expect(serializeAlphaState(a)).toBe(serializeAlphaState(b));
  });

  it('draws nothing, without error, when no strategy card has been played yet', () => {
    const state = sixPlayers();
    state.cards.strategyDeck = [];
    const hands = state.players.map(player => [...player.hand]);
    expect(() => maintainCards(state)).not.toThrow();
    expect(state.players.map(player => player.hand)).toEqual(hands);
  });
});
