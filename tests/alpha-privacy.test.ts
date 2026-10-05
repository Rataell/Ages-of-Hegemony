import { describe, expect, it } from 'vitest';
import { PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame, visibleHexIds } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { readyAll } from './alpha-rounds.js';

const [p1, p2, p3, p4] = ['p1', 'p2', 'p3', 'p4'].map(id => PlayerIdSchema.parse(id)) as [ReturnType<typeof PlayerIdSchema.parse>, ReturnType<typeof PlayerIdSchema.parse>, ReturnType<typeof PlayerIdSchema.parse>, ReturnType<typeof PlayerIdSchema.parse>];
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
    expect(Object.keys(view).sort()).toEqual(["actionClasses", "actions", "administration", "advisorMarket", "battles", "cityDetails", "cityMarks", "cityStates", "claimOptions", "commandCapacity", "costs", "culture", "declarations", "economicEvents", "eraTurn", "events", "explorationHints", "finalStandings", "frontier", "gameId", "government", "grades", "hegemony", "incomingAttacks", "independents", "initiative", "knownTerritory", "leaderBlock", "legacyWorks", "milestones", "occupations", "operatingCapacity", "orderPreviews", "phase", "players", "recruitLimits", "regions", "roads", "roundReports", "routes", "rules", "schemaVersion", "self", "stacks", "storage", "threatAlerts", "threats", "tradeOffers", "treaties", "unitOptions", "units", "urban", "version", "view", "wars", "winner", "worldDecisionPending", "worldEvent", "worldPulse"]);
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
    state.players.forEach(player => { player.pendingChoices = []; });
    rival.pendingChoices = [{ id: 'choice-secret-xyz', source: 'REPERCUSSION', cardId: 'rep-dom-knowledge-1', title: 'Segredo do rival', text: '', createdRound: 1, mitigated: false, options: [{ id: 'a', label: 'A', ops: [] }, { id: 'b', label: 'B', ops: [] }] }];
    const seen = alphaPlayerView(state, p2)!, json = JSON.stringify(seen);
    expect(seen.players.find(player => player.id === p1)).toMatchObject({ resonanceFilled: 1, resonanceCycles: 0 });
    for (const secret of ['choice-secret-xyz', 'Segredo do rival']) expect(json).not.toContain(secret);
    expect(seen.self.pendingChoices).toEqual([]);
    expect(alphaPlayerView(state, p1)!.self.pendingChoices).toHaveLength(1);
    expect(alphaPlayerView(state, p1)!.self.resonance.slots).toHaveLength(1);
  });
});

/** Walks every key of a projected view and returns the paths of the forbidden private keys found outside `self`. */
const PRIVATE_KEYS = new Set(['research', 'marks', 'slots', 'pendingChoices', 'hand', 'ambitions', 'completedAmbitions', 'defensePosture', 'orders', 'plannedActions', 'privateRng', 'seed', 'resources', 'knownHexIds', 'temporaryEffects', 'governmentReformEra']);
function leakedKeys(value: unknown, path = '', found: string[] = []): string[] {
  if (Array.isArray(value)) { value.forEach((item, index) => leakedKeys(item, `${path}[${index}]`, found)); return found; }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const here = path ? `${path}.${key}` : key;
      if (PRIVATE_KEYS.has(key) && !here.startsWith('self.') && !/^(rules|costs|view|actions|storage|urban|unitOptions|milestones|cityStates\[\d+\]\.slots)\b/.test(here)) found.push(here);
      leakedKeys(child, here, found);
    }
  }
  return found;
}

describe('V5.1b privacy walk (4 players: planning, conflicts, Era turn)', () => {
  const seats = ['p1', 'p2', 'p3', 'p4'].map(id => PlayerIdSchema.parse(id));
  function walkStart(): AlphaState {
    let state = beginAlphaPlanning(createAlphaGame({ gameId: 'privacy-v51b', seed: 33, preset: 'QUICK', players: seats.map(id => ({ id, name: id.toUpperCase() })) }));
    state.rules.roundsPerEra = 1; state.rules.roundLimit = 7;
    for (const player of state.players) player.contacts = state.players.map(other => other.playerId).filter(id => id !== player.playerId);
    const rival = state.players.find(player => player.playerId === p1)!;
    rival.resonance.slots = [{ advancementId: 'web-writing', source: 'WEB', domains: ['KNOWLEDGE'] }];
    rival.resonance.marks = [{ advancementId: 'web-writing', domains: ['KNOWLEDGE'], round: 1 }];
    rival.pendingChoices = [{ id: 'choice-walk-secret', source: 'ENCOUNTER', cardId: 'enc-x', title: 'Segredo da caminhada', text: '', createdRound: 1, mitigated: false, options: [{ id: 'a', label: 'A', ops: [] }, { id: 'b', label: 'B', ops: [] }] }];
    state = must(state, p1, { type: 'CHOOSE_AMBITIONS', cardIds: rival.ambitions.slice(0, 2) });
    state = must(state, p1, { type: 'SET_DEFENSE_POSTURE', posture: 'MANEUVER' });
    state = must(state, p1, { type: 'DECLARE_WAR', targetId: p2, planId: 'walk-secret-war' });
    return state;
  }
  function assertNoLeaks(state: AlphaState, label: string) {
    const rival = state.players.find(player => player.playerId === p1)!;
    for (const viewer of seats.filter(id => id !== p1)) {
      const view = alphaPlayerView(state, viewer)!, json = JSON.stringify(view);
      expect(leakedKeys(view), `${label}: ${viewer}`).toEqual([]);
      for (const secret of ['choice-walk-secret', 'Segredo da caminhada', 'walk-secret-war', state.privateRng.seed]) expect(json, `${label}: ${viewer} ${secret}`).not.toContain(secret);
      const ownCards = new Set([...view.self.hand, ...view.self.ambitions, ...view.self.advisors, ...view.advisorMarket]);
      for (const card of [...rival.hand, ...rival.ambitions].filter(id => !ownCards.has(id))) expect(json, `${label}: ${viewer} ${card}`).not.toContain(`"${card}"`);
      // Fog: threats and regions only where the viewer may know them.
      const visible = visibleHexIds(state, viewer);
      for (const threat of view.threats as { hexId: string }[]) expect(visible.has(threat.hexId), `${label}: threat ${threat.hexId} beyond the fog`).toBe(true);
      for (const alert of view.threatAlerts as unknown as Record<string, unknown>[]) expect(Object.keys(alert).some(key => ['hexId', 'hex', 'id', 'composition'].includes(key)), `${label}: threat alert leaks a position`).toBe(false);
      for (const region of view.regions) expect(state.regions.find(item => item.id === region.id)!.revealedBy).toContain(viewer);
      // Rival cargo and the other players' summaries.
      expect(view.units.filter(unit => unit.ownerId !== viewer).every(unit => !unit.carrierId)).toBe(true);
      for (const summary of view.players) expect(Object.keys(summary).sort()).toEqual(['civilization', 'era', 'id', 'name', 'prestige', 'ready', 'resonanceCycles', 'resonanceFilled']);
      expect(view.self.playerId).toBe(viewer);
      expect(view.government.current).toBeDefined();
    }
  }

  it('never leaks private state to the three rivals during planning, conflicts and the Era turn', () => {
    let state = walkStart();
    assertNoLeaks(state, 'planning');
    // Put p1 next to p2's capital with an attack reserved: the CONFLICTS phase opens for reactions.
    const target = state.core.players.find(player => player.id === p2)!.civilization.cities[0]!.hexId;
    const neighbor = state.core.map.find(tile => !['SEA', 'UNKNOWN'].includes(tile.terrain) && tile.id !== target && Math.max(Math.abs(tile.q - Number(target.split(',')[0])), Math.abs(tile.r - Number(target.split(',')[1]))) <= 1 && !state.core.players.some(player => player.civilization.cities.some(city => city.hexId === tile.id)));
    if (neighbor) {
      const soldier = { id: 'walk-inf', ownerId: p1, kind: 'INFANTRY' as const, hexId: neighbor.id, recruitedRound: 1 };
      state.units.push(soldier);
      state.wars.push([p1, p2]);
      const queued = applyAlphaCommand(state, p1, { type: 'QUEUE_ORDER', expectedVersion: state.version, order: { id: 'walk-secret-attack', type: 'ATTACK', unitIds: ['walk-inf'], target, posture: 'ASSAULT' } });
      if (queued.ok) { state = queued.value; expect(JSON.stringify(alphaPlayerView(state, p2)!)).not.toContain('walk-secret-attack'); assertNoLeaks(state, 'planning+attack'); }
    }
    let guard = 0;
    while (state.phase !== 'ERA_TURN' && guard++ < 40) {
      state = readyAll(state);
      assertNoLeaks(state, `phase ${state.phase}`);
      expect(JSON.stringify(alphaPlayerView(state, p3)!)).not.toContain('walk-secret-attack');
    }
    expect(state.phase).toBe('ERA_TURN');
    assertNoLeaks(state, 'era-turn');
    const eraView = alphaPlayerView(state, p2)!;
    expect(Object.keys(eraView.eraTurn!).sort()).toEqual(['awaiting', 'era', 'log', 'step']);
  });

  it('never shows an unresolved defensive posture before the battle: the posture lives only in the owner self', () => {
    const state = walkStart();
    expect(alphaPlayerView(state, p1)!.self.defensePosture).toBe('MANEUVER');
    for (const viewer of [p2, p3, p4]) { const view = alphaPlayerView(state, viewer)!; expect(view.self.defensePosture).toBe('HOLD'); expect(leakedKeys(view)).toEqual([]); }
  });

  it('hides a region discovery from players who did not reveal it', () => {
    const state = walkStart();
    const region = state.regions[state.regions.length - 1]!;
    region.discovery = { kind: 'RUIN', resolved: false, resolvedBy: null };
    region.revealedBy = [p1];
    for (const viewer of [p2, p3, p4]) expect(JSON.stringify(alphaPlayerView(state, viewer)!.regions)).not.toContain(region.id);
    expect(alphaPlayerView(state, p1)!.regions.find(item => item.id === region.id)!.discovery).toMatchObject({ kind: 'RUIN' });
  });
});
