import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';
import { must } from './alpha-rounds.js';

const p1 = PlayerIdSchema.parse('p1');
const fresh = (): AlphaState => beginAlphaPlanning(createAlphaGame({ gameId: 'gr36', seed: 12, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));

describe('commands that had no test (GR-36)', () => {
  it('BUILD_ROAD builds once on own land, pays the road cost and refuses foreign or repeated hexes', () => {
    let state = fresh();
    const capital = state.core.players[0]!.civilization.cities[0]!;
    const before = state.players[0]!.resources.wood + state.players[0]!.resources.stone;
    state = must(state, p1, { type: 'BUILD_ROAD', hexId: capital.hexId });
    expect(state.roads).toContain(capital.hexId);
    expect(state.players[0]!.resources.wood + state.players[0]!.resources.stone).toBeLessThan(before);
    expect(applyAlphaCommand(state, p1, { type: 'BUILD_ROAD', expectedVersion: state.version, hexId: capital.hexId }).ok).toBe(false);
    const foreign = state.core.players[1]!.civilization.cities[0]!.hexId;
    expect(applyAlphaCommand(state, p1, { type: 'BUILD_ROAD', expectedVersion: state.version, hexId: foreign }).ok).toBe(false);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('HIRE_ADVISOR takes a card from the market, pays its cost and refills the market', () => {
    let state = fresh();
    const offered = state.cards.advisorMarket[0]!, marketSize = state.cards.advisorMarket.length;
    state.players[0]!.resources = { ...state.players[0]!.resources, wealth: 10, knowledge: 10 };
    state = must(state, p1, { type: 'HIRE_ADVISOR', cardId: offered });
    expect(state.players[0]!.advisors).toEqual([offered]);
    expect(state.cards.advisorMarket).not.toContain(offered);
    expect(state.cards.advisorMarket).toHaveLength(marketSize);
    expect(state.players[0]!.resources.wealth).toBe(10 - state.rules.advisorCost.wealth);
    expect(applyAlphaCommand(state, p1, { type: 'HIRE_ADVISOR', expectedVersion: state.version, cardId: offered }).ok).toBe(false);
  });
});
