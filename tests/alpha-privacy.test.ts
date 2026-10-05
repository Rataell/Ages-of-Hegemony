import { describe, expect, it } from 'vitest';
import { PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame, visibleHexIds } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';

const [p1, p2, p3] = ['p1', 'p2', 'p3'].map(id => PlayerIdSchema.parse(id)) as [ReturnType<typeof PlayerIdSchema.parse>, ReturnType<typeof PlayerIdSchema.parse>, ReturnType<typeof PlayerIdSchema.parse>];
const must = (state: AlphaState, actor: string, command: Record<string, unknown>) => { const result = applyAlphaCommand(state, actor as never, { ...command, expectedVersion: state.version }); if (!result.ok) throw new Error(result.error.message); return result.value; };

/** Three seats in contact; p1 has made every kind of private decision this round. */
function midRound(): AlphaState {
  let state = beginAlphaPlanning(createAlphaGame({ gameId: 'privacy', seed: 21, preset: 'QUICK', players: [p1, p2, p3].map(id => ({ id, name: id.toUpperCase() })) }));
  for (const player of state.players) player.contacts = state.players.map(other => other.playerId).filter(id => id !== player.playerId);
  state.roundLedgers = [];
  state = must(state, p1, { type: 'CHOOSE_AMBITIONS', cardIds: state.players[0]!.ambitions.slice(0, 2) });
  const city = state.cities.find(meta => meta.currentOwnerId === p1)!.cityId;
  state = must(state, p1, { type: 'URBAN_ACTION', cityId: city, action: 'PRODUCE', planId: 'secret-urban' });
  const explorer = state.units.find(unit => unit.ownerId === p1 && unit.kind === 'EXPLORER')!;
  const reachable = Object.keys((alphaPlayerView(state, p1)!.unitOptions)[explorer.id]!.moves)[0]!;
  state = must(state, p1, { type: 'QUEUE_ORDER', order: { id: 'secret-order', type: 'MOVE', unitIds: [explorer.id], path: alphaPlayerView(state, p1)!.unitOptions[explorer.id]!.moves[reachable] } });
  state = must(state, p1, { type: 'PROPOSE_TRADE', recipientId: p3, offerType: 'GIFT', offer: { food: 1, wood: 0, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0 }, request: { food: 0, wood: 0, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0 }, treatyTerms: [], dueRound: null });
  state = must(state, p1, { type: 'DECLARE_WAR', targetId: p3, planId: 'secret-war' });
  return state;
}

describe('projection privacy', () => {
  it('ships only an explicit list of top-level fields', () => {
    const view = alphaPlayerView(midRound(), p2)!;
    // Adding a field to the projection must be a deliberate edit of this list.
    expect(Object.keys(view).sort()).toEqual(["actionClasses","actions","administration","advisorMarket","battles","cityDetails","cityMarks","cityStates","claimOptions","commandCapacity","costs","culture","declarations","economicEvents","events","finalStandings","frontier","gameId","grades","hegemony","incomingAttacks","independents","initiative","knownTerritory","leaderBlock","milestones","occupations","orderPreviews","phase","players","projects","raidBands","regions","roads","roundReports","routes","rules","schemaVersion","self","stacks","storage","tradeOffers","treaties","unitOptions","units","urban","version","view","wars","winner","worldDecisionPending","worldEvent","worldPulse"]);
    for (const forbidden of ['core', 'privateRng', 'seed', 'cards', 'tradeOffersAll', 'telemetry', 'roundLedgers', 'resolutionEvents']) expect(view).not.toHaveProperty(forbidden);
  });

  it('never shows another player its rival private decisions, hand, ambitions or unexplored terrain', () => {
    const state = midRound(), view = alphaPlayerView(state, p2)!, json = JSON.stringify(view);
    const rival = state.players.find(player => player.playerId === p1)!;
    for (const secret of ['secret-urban', 'secret-order', 'secret-war', state.privateRng.seed]) expect(json).not.toContain(secret);
    const ownCards = new Set([...view.self.hand, ...view.self.ambitions, ...view.self.advisors, ...view.advisorMarket, ...(view.worldEvent ? [view.worldEvent] : [])]);
    for (const card of [...rival.hand, ...rival.ambitions].filter(id => !ownCards.has(id))) expect(json).not.toContain(`"${card}"`);
    expect(view.players.find(player => player.id === p1)).not.toHaveProperty('hand');
    expect(view.tradeOffers).toEqual([]);
    expect(view.incomingAttacks).toEqual([]);
    expect(Object.keys(view.unitOptions).every(id => state.units.find(unit => unit.id === id)?.ownerId === p2)).toBe(true);
    expect(Object.keys(view.claimOptions).every(id => state.core.players.find(player => player.id === p2)!.civilization.cities.some(city => city.id === id))).toBe(true);
    const knows = new Set([...state.players.find(player => player.playerId === p2)!.knownHexIds, ...visibleHexIds(state, p2)]);
    for (const tile of [...view.view.visibleTerritory, ...view.knownTerritory]) expect(knows.has(tile.id), tile.id).toBe(true);
    for (const tile of view.frontier) expect(tile).not.toHaveProperty('terrain');
    // The trade offer is shared with its recipient only.
    expect(alphaPlayerView(state, p3)!.tradeOffers).toHaveLength(1);
  });
});

describe('public city marks', () => {
  it('show a visible rival city only by size and walls, and never a city out of sight', () => {
    const state = midRound(), view = alphaPlayerView(state, p2)!;
    for (const mark of view.cityMarks) {
      expect(Object.keys(mark).sort()).toEqual(['blockaded', 'capacity', 'capital', 'cityId', 'fortification', 'hexId', 'level', 'ownerId']);
      if (mark.ownerId !== p2) expect(mark.blockaded).toBeNull();
      expect(mark.level).toBeGreaterThanOrEqual(1);
      expect(mark.level).toBeLessThanOrEqual(7);
      const own = mark.ownerId === p2, seen = view.view.visibleTerritory.some(tile => tile.id === mark.hexId);
      expect(own || seen).toBe(true);
    }
  });

  it('Ressonância: rivals see only how many sockets are filled; choices and marks stay with the owner', () => {
    const state = midRound();
    const rival = state.players.find(player => player.playerId === p1)!;
    rival.resonance.slots = [{ advancementId: 'web-writing', source: 'WEB', domains: ['KNOWLEDGE'] }];
    rival.resonance.marks = [{ advancementId: 'web-writing', domains: ['KNOWLEDGE'], round: 1 }];
    rival.pendingChoices = [{ id: 'choice-secret-xyz', source: 'REPERCUSSION', cardId: 'rep-dom-knowledge-1', title: 'Segredo do rival', text: '', createdRound: 1, mitigated: false, options: [{ id: 'a', label: 'A', ops: [] }, { id: 'b', label: 'B', ops: [] }] }];
    const seen = alphaPlayerView(state, p2)!, json = JSON.stringify(seen);
    expect(seen.players.find(player => player.id === p1)).toMatchObject({ resonanceFilled: 1, resonanceCycles: 0 });
    for (const secret of ['choice-secret-xyz', 'Segredo do rival']) expect(json).not.toContain(secret);
    expect(seen.self.pendingChoices).toEqual([]);
    expect(alphaPlayerView(state, p1)!.self.pendingChoices).toHaveLength(1);
    expect(alphaPlayerView(state, p1)!.self.resonance.slots).toHaveLength(1);
  });
});
