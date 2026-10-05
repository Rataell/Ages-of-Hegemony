import { describe, expect, it } from 'vitest';
import { ALPHA_CARDS, AlphaStateSchema, type AlphaState } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, renewManeuvers, serializeAlphaState } from '@aoh/game-engine';

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

describe('the strategy deck renews hands by one card at each Era turn (canon §22)', () => {
  it('reshuffles the played strategy cards when the deck is empty, leaving other discards alone', () => {
    const state = exhausted();
    const others = state.cards.discarded.filter(id => !strategy.has(id));
    const returning = state.cards.discarded.filter(id => strategy.has(id)).length;
    renewManeuvers(state);
    for (const player of state.players) expect(player.hand).toHaveLength(3);
    expect(state.cards.strategyDeck).toHaveLength(returning - state.players.length);
    expect(state.cards.discarded).toEqual(others);
    const zones = [...state.cards.strategyDeck, ...state.players.flatMap(player => player.hand)];
    expect(new Set(zones).size).toBe(zones.length);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('gives nothing to a hand already at the limit and sends played Reactions back to the deck', () => {
    const state = sixPlayers();
    const reaction = ALPHA_CARDS.find(card => card.family === 'STRATEGY' && card.timing === 'REACTION')!.id;
    state.cards.strategyDeck = state.cards.strategyDeck.filter(id => id !== reaction);
    state.players.forEach(player => { player.hand = player.hand.filter(id => id !== reaction); });
    state.cards.discarded.push(reaction);
    state.players[0]!.hand.push(...state.cards.strategyDeck.splice(0, state.rules.handLimit - state.players[0]!.hand.length));
    expect(state.players[0]!.hand).toHaveLength(state.rules.handLimit);
    renewManeuvers(state);
    expect(state.players[0]!.hand).toHaveLength(state.rules.handLimit);
    expect(state.cards.discarded).not.toContain(reaction);
    expect([...state.cards.strategyDeck, ...state.players.flatMap(player => player.hand)]).toContain(reaction);
  });

  it('shuffles with the match seed, so the same match draws the same cards', () => {
    const a = exhausted(), b = exhausted();
    renewManeuvers(a); renewManeuvers(b);
    expect(serializeAlphaState(a)).toBe(serializeAlphaState(b));
  });

  it('draws nothing, without error, when no strategy card has been played yet', () => {
    const state = sixPlayers();
    state.cards.strategyDeck = [];
    const hands = state.players.map(player => [...player.hand]);
    expect(() => renewManeuvers(state)).not.toThrow();
    expect(state.players.map(player => player.hand)).toEqual(hands);
  });
});
