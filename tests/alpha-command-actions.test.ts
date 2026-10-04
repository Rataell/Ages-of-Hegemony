import { describe, expect, it } from 'vitest';
import { ALPHA_CARDS, PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import { alphaActionCapacity, alphaClaimOptions, applyAlphaCommand, beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';

const p1 = PlayerIdSchema.parse('p1');
function setup(actionsPerRound = 5): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'command', seed: 4, preset: 'QUICK', actionsPerRound, players: [{ id: 'p1', name: 'Ana', civilization: 'meridia' }, { id: 'p2', name: 'Beto' }] }));
  for (const player of state.players) player.ambitionsChosen = true;
  return state;
}
const must = (state: AlphaState, command: Record<string, unknown>, actor = 'p1') => { const r = applyAlphaCommand(state, actor as never, { ...command, expectedVersion: state.version }); if (!r.ok) throw new Error(r.error.message); return r.value; };
const commandCard = ALPHA_CARDS.find(card => card.family === 'STRATEGY' && card.effect?.kind === 'COMMAND' && card.effect.amount === 2)!;

describe('+Ações principais (Comando) modifiers raise the round limit', () => {
  it('starts at the match base and the projection shows the same limit', () => {
    const state = setup(6);
    expect(alphaActionCapacity(state, p1)).toBe(6);
    expect(alphaPlayerView(state, p1)!.actions.limit).toBe(6);
  });

  it('adds hired advisors permanently; Web nodes unlock things and never add actions (canon V5.1a)', () => {
    const state = setup();
    state.players[0]!.research.push('web-writing', 'web-codes');
    expect(alphaActionCapacity(state, p1)).toBe(5);
    state.players[0]!.advisors.push('advisor-15');
    expect(alphaActionCapacity(state, p1)).toBe(6);
    expect(alphaPlayerView(state, p1)!.actions.limit).toBe(6);
  });

  it('adds a played strategy card for this round only, once', () => {
    let state = setup();
    state.cards.strategyDeck = state.cards.strategyDeck.filter(id => id !== commandCard.id);
    state.players[0]!.hand = [commandCard.id];
    state = must(state, { type: 'PLAY_CARD', cardId: commandCard.id });
    expect(alphaActionCapacity(state, p1)).toBe(5 + 2);
    for (const id of ['p1', 'p2']) state = must(state, { type: 'READY' }, id);
    expect(state.core.round).toBe(2);
    expect(alphaActionCapacity(state, p1)).toBe(5);
  });

  it('lets the extra actions actually be spent, and refuses beyond the raised limit', () => {
    let state = setup(5);
    state.cards.strategyDeck = state.cards.strategyDeck.filter(id => id !== commandCard.id);
    state.players[0]!.hand = [commandCard.id];
    state = must(state, { type: 'PLAY_CARD', cardId: commandCard.id });
    state.players[0]!.resources.influence = 10;
    expect(alphaActionCapacity(state, p1)).toBe(7);
    const claim = () => {
      const city = state.core.players[0]!.civilization.cities[0]!;
      const hexId = alphaClaimOptions(state, p1)[city.id]![0]!;
      return applyAlphaCommand(state, p1, { type: 'MANAGE', expectedVersion: state.version, command: { type: 'CLAIM_HEX', playerId: p1, cityId: city.id, hexId, expectedVersion: state.core.version } });
    };
    for (let i = 0; i < 6; i++) { const r = claim(); expect(r.ok, `claim ${i + 1}: ${r.ok ? '' : r.error.message}`).toBe(true); if (r.ok) state = r.value; }
    state = must(state, { type: 'CIVILIZATION_ABILITY' }); // the 7th main action, possible only with the +2
    // The 8th main action: a road is the cheapest main action left, and the limit, not the input, must refuse it.
    const roadHex = state.core.map.find(tile => tile.ownerId === p1 && !state.roads.includes(tile.id))!.id;
    expect(applyAlphaCommand(state, p1, { type: 'BUILD_ROAD', expectedVersion: state.version, hexId: roadHex })).toMatchObject({ ok: false, error: { code: 'ACTION_LIMIT' } });
  });

  it('ignores the legacy government command delta: Orders are fixed per match (canon V5.1a §1)', () => {
    const state = setup(5);
    state.core.players[0]!.civilization.government = 'CONFEDERATION' as never;
    expect(alphaActionCapacity(state, p1)).toBe(5);
  });
});
