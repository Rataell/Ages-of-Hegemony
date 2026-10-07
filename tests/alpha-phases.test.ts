import { describe, expect, it } from 'vitest';
import { AlphaRoundPhaseSchema, AlphaStateSchema, PlayerIdSchema, ResolutionEventTypeSchema, WORLD_PULSE_CARDS, type AlphaState } from '@aoh/game-domain';
import { CORE_PHASE_MIRROR, INTERACTIVE_PHASES, LEGAL_COMMANDS, alphaPay, applyAlphaCommand, beginAlphaPlanning, createAlphaGame, serializeAlphaState, visibleHexIds } from '@aoh/game-engine';
import { completeRound, must, produceAll, readyAll } from './alpha-rounds.js';

const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
const fresh = (seed = 71, count = 2): AlphaState => createAlphaGame({ gameId: `phases-${seed}`, seed, preset: 'STANDARD', players: Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` })) });
const started = (seed?: number, count?: number) => {
  const state = beginAlphaPlanning(fresh(seed, count));
  for (const player of state.players) player.contacts = state.players.filter(other => other !== player).map(other => other.playerId);
  return state;
};
const legalIn = (state: AlphaState, type: string, extra: Record<string, unknown> = {}) => applyAlphaCommand(state, p1, { type, expectedVersion: state.version, ...extra });
const relevant = ['WORLD_PULSE', 'ROUND_STARTED', 'PHASE', 'RESOLUTION', 'MAINTENANCE'];
const none = { food: 0, materials: 0, wealth: 0, knowledge: 0, influence: 0 };
const noneAlpha = { food: 0, wood: 0, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0 };
const movementFixture = (state: AlphaState) => {
  const origin = state.core.players[0]!.civilization.cities[0]!.hexId;
  const [q, r] = origin.split(',').map(Number);
  const known = new Set(state.players[0]!.knownHexIds);
  const target = state.core.map.find(tile => {
    if (!known.has(tile.id) || tile.id === origin || ['SEA', 'UNKNOWN'].includes(tile.terrain)) return false;
    const [tq, tr] = tile.id.split(',').map(Number);
    const dq = tq! - q!, dr = tr! - r!;
    return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2 === 1;
  })!.id;
  state.units = [{ id: 'u1', ownerId: p1, kind: 'INFANTRY', hexId: origin, recruitedRound: 1 }];
  return target;
};

describe('the eight-phase round', () => {
  it('declares the eight phases in order and mirrors each onto the legacy core phase', () => {
    expect(AlphaRoundPhaseSchema.options).toEqual(['WORLD_PULSE', 'PLANNING', 'URBAN_ACTIONS', 'ORDERS_MOVEMENT', 'DIPLOMACY_TRADE', 'CONFLICTS', 'INTEGRATION_MAINTENANCE', 'END_ROUND', 'ERA_TURN']);
    expect(Object.keys(CORE_PHASE_MIRROR)).toEqual([...AlphaRoundPhaseSchema.options]);
  });

  it('starts a new match in WORLD_PULSE and opens the first round in PLANNING with a pulse drawn', () => {
    const initial = fresh();
    expect(initial.phase).toBe('WORLD_PULSE');
    const state = beginAlphaPlanning(initial);
    expect(state.phase).toBe('PLANNING');
    expect(state.core.phase).toBe('PLANNING');
    expect(state.worldPulse.current).not.toBeNull();
    expect(state.worldPulse.resolvedRound).toBe(1);
    expect(state.telemetry.worldPulseEvents).toBe(1);
    expect(state.players.every(p => !p.ready && p.orders.length === 0 && p.spentCommands === 0)).toBe(true);
    expect(() => beginAlphaPlanning(state)).toThrow();
  });

  it('runs every phase, in order, once per round and returns to WORLD_PULSE work', () => {
    const state = started();
    const start = state.events.length;
    const after = completeRound(state);
    expect(after.core.round).toBe(2);
    expect(after.phase).toBe('PLANNING');
    const trail = after.events.slice(start).map(e => e.type).filter(t => relevant.includes(t));
    // Round 2 is inside Era I: no Pulse opens it (canon §17).
    expect(trail).toEqual(['RESOLUTION', 'RESOLUTION', 'MAINTENANCE', 'ROUND_STARTED']);
  });

  it('rests only in planning, conflicts or the Era turn while internal phases resolve automatically', () => {
    expect(INTERACTIVE_PHASES).toEqual(['PLANNING', 'CONFLICTS', 'ERA_TURN']);
    let state = started();
    for (let i = 0; i < 6; i++) {
      state = readyAll(state);
      expect(INTERACTIVE_PHASES).toContain(state.phase);
    }
  });

  it('does not advance until every player confirms, and never skips a phase', () => {
    let state = started();
    state = must(state, p1, { type: 'CHOOSE_AMBITIONS', cardIds: state.players[0]!.ambitions.slice(0, 2) });
    state = must(state, p1, { type: 'READY' });
    expect(state.phase).toBe('PLANNING');
    expect(state.players.map(p => p.ready)).toEqual([true, false]);
    state = must(state, p2, { type: 'CHOOSE_AMBITIONS', cardIds: state.players[1]!.ambitions.slice(0, 2) });
    state = must(state, p2, { type: 'READY' });
    expect(state.phase).toBe('PLANNING');
    expect(state.core.round).toBe(2);
    expect(state.players.every(p => !p.ready)).toBe(true);
  });
});

describe('phase legality', () => {
  it('permits each command only in its phases', () => {
    const planning = started();
    expect(legalIn(planning, 'URBAN_ACTION', { cityId: 'capital-1', action: 'PRODUCE' }).ok).toBe(true);
    expect(legalIn(planning, 'PROPOSE_TREATY', { recipientId: p2, treaty: 'TRADE_AGREEMENT', deal: { give: none, receive: none } }).ok).toBe(true);
    expect(LEGAL_COMMANDS.CONFLICTS).toEqual(new Set(['PLAY_CARD', 'READY', 'UNREADY']));
    for (const phase of ['ORDERS_MOVEMENT', 'INTEGRATION_MAINTENANCE', 'END_ROUND'] as const)
      expect(LEGAL_COMMANDS[phase].size).toBe(0);
    expect(LEGAL_COMMANDS.ERA_TURN).toEqual(new Set(['RESOLVE_CHOICE', 'SWAP_AMBITION', 'SET_DEFENSE_POSTURE', 'READY', 'UNREADY']));
  });

  it('has exactly one path for each urban action: the legacy commands no longer exist', () => {
    const state = started();
    for (const raw of [{ type: 'RECRUIT', cityId: 'capital-1', kind: 'INFANTRY' }, { type: 'RESEARCH', advancementId: 'web-writing' }, { type: 'INTEGRATE_CITY', cityId: 'capital-2' }])
      expect(applyAlphaCommand(state, p1, { ...raw, expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
    for (const build of [{ type: 'BUILD_DISTRICT', cityId: 'capital-1', district: 'AGRARIAN' }, { type: 'BUILD_BUILDING', cityId: 'capital-1', building: 'GRANARY' }])
      expect(legalIn(state, 'MANAGE', { command: { ...build, playerId: p1, expectedVersion: state.core.version } })).toMatchObject({ ok: false, error: { code: 'USE_URBAN_ACTION' } });
    const planning = [...LEGAL_COMMANDS.PLANNING];
    expect(planning).toContain('URBAN_ACTION');
    for (const type of ['RECRUIT', 'RESEARCH', 'INTEGRATE_CITY']) expect(planning).not.toContain(type);
  });

  it('keeps automatic-only phases closed and legacy snapshot phases recoverable', () => {
    for (const phase of ['WORLD_PULSE', 'ORDERS_MOVEMENT', 'INTEGRATION_MAINTENANCE', 'END_ROUND'] as const) expect(LEGAL_COMMANDS[phase].size).toBe(0);
    for (const phase of INTERACTIVE_PHASES) expect(LEGAL_COMMANDS[phase].has('READY')).toBe(true);
    for (const phase of ['URBAN_ACTIONS', 'DIPLOMACY_TRADE'] as const) expect(LEGAL_COMMANDS[phase].has('READY')).toBe(true);
  });

  it('answers trade commands with their real rule instead of silently succeeding', () => {
    const state = started();
    expect(applyAlphaCommand(state, p1, { type: 'PROPOSE_TRADE', recipientId: p2, offerType: 'GIFT', offer: noneAlpha, request: noneAlpha, treatyTerms: [], dueRound: null, expectedVersion: state.version })).toMatchObject({ ok: false, error: { message: 'Inclua algum recurso na oferta.' } });
    expect(applyAlphaCommand(state, p1, { type: 'RESPOND_TRADE', offerId: 'o', accept: true, expectedVersion: state.version })).toMatchObject({ ok: false, error: { message: 'Esta oferta não está mais aberta.' } });
  });

  it('keeps the legacy core phase consistent with the alpha phase in every resting state', () => {
    let state = started();
    for (let i = 0; i < 6; i++) { expect(state.core.phase).toBe(CORE_PHASE_MIRROR[state.phase]); state = readyAll(state); }
  });
});

describe('what each phase does', () => {
  it('resets urban actions when planning closes', () => {
    let state = started();
    state.cities[0]!.urbanActionsUsed = 1;
    expect(state.cities[0]!.urbanActionsUsed).toBe(1);
    state = readyAll(state);
    expect(state.cities.every(c => c.urbanActionsUsed === 0)).toBe(true);
  });

  it('resolves movement only when planning closes', () => {
    let state = started();
    const target = movementFixture(state);
    state = must(state, p1, { type: 'QUEUE_ORDER', order: { id: 'm1', type: 'MOVE', unitIds: ['u1'], path: [target] } });
    expect(state.units[0]!.hexId).not.toBe(target);
    state = readyAll(state);
    expect(state.phase).toBe('PLANNING');
    expect(state.core.round).toBe(2);
    expect(state.units[0]!.hexId).toBe(target);
  });

  it('offers a planned treaty after resolution and activates an accepted treaty next round', () => {
    let state = started();
    state = must(state, p1, { type: 'PROPOSE_TREATY', recipientId: p2, treaty: 'TRADE_AGREEMENT', deal: { give: none, receive: none } });
    expect(state.treaties).toHaveLength(0);
    state = readyAll(state);
    expect(state.treaties[0]!.status).toBe('PROPOSED');
    state = must(state, p2, { type: 'RESPOND_TREATY', treatyId: state.treaties.at(-1)!.id, accept: true });
    expect(state.treaties[0]!.status).toBe('ACCEPTED');
    state = readyAll(state);
    expect(state.treaties[0]!.status).toBe('ACTIVE');
  });

  it('validates at reservation, revalidates without escrow, and records a private resolution failure', () => {
    let state = started(88);
    state.players[0]!.research.push('web-agriculture');
    const cityId = state.core.players[0]!.civilization.cities[0]!.id;
    state = must(state, p1, { type: 'URBAN_ACTION', planId: 'future-district', cityId, action: 'BUILD', build: { kind: 'DISTRICT', district: 'AGRARIAN' } });
    expect(state.players[0]!.plannedActions.map(action => action.id)).toContain('future-district');
    expect(state.core.players[0]!.civilization.cities[0]!.districts).toHaveLength(0);

    alphaPay(state, p1, { ...state.players[0]!.resources });
    state = readyAll(state);

    expect(state.core.players[0]!.civilization.cities[0]!.districts).toHaveLength(0);
    expect(state.players[0]!.plannedActions).toHaveLength(0);
    expect(state.events).toContainEqual(expect.objectContaining({ type: 'ACTION_FAILED', audience: [p1], message: expect.stringContaining('não pôde ser realizada') }));
  });

  it('rotates the initiative once per round', () => {
    let state = started(72, 3);
    const order = [...state.initiative];
    state = completeRound(state);
    expect(state.initiative).toEqual([...order.slice(1), order[0]]);
    state = completeRound(state);
    expect(state.initiative).toEqual([...order.slice(2), ...order.slice(0, 2)]);
  });

  it('resets readiness at each interactive phase and clears orders at the round start', () => {
    let state = started();
    const target = movementFixture(state);
    state = must(state, p1, { type: 'QUEUE_ORDER', order: { id: 'm1', type: 'MOVE', unitIds: ['u1'], path: [target] } });
    expect(state.players[0]!.orders).toHaveLength(1);
    state = completeRound(state);
    expect(state.players.every(p => !p.ready && p.orders.length === 0 && p.spentCommands === 0)).toBe(true);
  });

  it('draws one distinct pulse at the start of the match and one at each Era turn from the private deck (canon §18), none in between', () => {
    let state = started(73);
    state.rules.roundsPerEra = 2;
    const seen = new Set([state.worldPulse.current!.id]);
    const deck = state.worldPulse.deck.length;
    expect(state.worldPulse.deck.length + state.worldPulse.discard.length + 1).toBe(WORLD_PULSE_CARDS.length);
    state = completeRound(state);
    expect(state.worldPulse.resolvedRound).toBe(1);
    state = completeRound(state);
    // The second Pulse is drawn at step 3 of the Era turn that closes round 2 (canon §22).
    expect(state.worldPulse.resolvedRound).toBe(2);
    expect(seen.has(state.worldPulse.current!.id)).toBe(false);
    expect(state.worldPulse.deck.length).toBe(deck - 1);
    expect(state.telemetry.worldPulseEvents).toBe(2);
    expect(state.events.filter(e => e.type === 'WORLD_PULSE')).toHaveLength(2);
  });

  it('keeps reports valid while a pulse changes balances', () => {
    const state = completeRound(started(74), { produce: true });
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
    expect(state.roundReports.every(report => report.round === 1)).toBe(true);
  });

  it('gives no production automatically: an untouched civilization only pays', () => {
    let state = started(75);
    state = completeRound(state);
    for (const report of state.roundReports) {
      for (const key of ['food', 'materials', 'wealth', 'knowledge', 'influence'] as const) {
        expect(report.production[key]).toBe(0);
        expect(report.mining[key]).toBe(0);
        expect(report.closing[key]).toBeLessThanOrEqual(report.opening[key] + report.other[key] + report.institutions[key]);
      }
    }
  });

  it('feeds growth only from food produced this round', () => {
    const idle = completeRound(started(76));
    const busy = completeRound(started(76), { produce: true });
    const progress = (s: AlphaState) => s.core.players[0]!.civilization.cities[0]!.growthProgress + s.core.players[0]!.civilization.cities[0]!.population * 1000;
    expect(progress(busy)).toBeGreaterThanOrEqual(progress(idle));
    expect(idle.roundReports[0]!.production.food).toBe(0);
    expect(busy.roundReports[0]!.production.food).toBeGreaterThan(0);
  });

  it('applies upkeep and food for the population during maintenance, recorded as upkeep', () => {
    const state = completeRound(started(77));
    const report = state.roundReports[0]!;
    expect(report.upkeepRequired.food).toBeGreaterThan(0);
    expect(report.upkeepPaid.food).toBeGreaterThan(0);
  });
});

describe('structured resolution visibility', () => {
  it('defines every result type required by the replay contract', () => {
    expect(ResolutionEventTypeSchema.options).toEqual([
      'MOVEMENT', 'EXPLORATION', 'DISCOVERY', 'FOUNDATION', 'PRODUCTION', 'CONSTRUCTION', 'RECRUITMENT', 'RESEARCH',
      'TRADE', 'INFLUENCE', 'COMBAT', 'LOSSES', 'RETREAT', 'ADVANCE', 'FAILURE', 'ROUND_EVENT',
    ]);
  });

  it('shows Ana her move and, because the Pátria is public, Beto too: the table shares every resolved move', () => {
    let state = started(89);
    const target = movementFixture(state);
    expect(visibleHexIds(state, p2).has(target)).toBe(true);
    state = must(state, p1, { type: 'QUEUE_ORDER', order: { id: 'public-move', type: 'MOVE', unitIds: ['u1'], path: [target] } });
    expect(state.players[1]!.orders).toEqual([]); // the order itself stayed private while planned
    state = readyAll(state);
    const ana = state.roundReports.find(report => report.playerId === p1 && report.round === 1)!.resolution;
    const beto = state.roundReports.find(report => report.playerId === p2 && report.round === 1)!.resolution;
    expect(ana).toContainEqual(expect.objectContaining({ type: 'MOVEMENT', actorId: p1, hexId: target, unitIds: ['u1'] }));
    expect(beto).toContainEqual(expect.objectContaining({ type: 'MOVEMENT', actorId: p1, hexId: target }));
  });

  it('keeps showing Beto the move after he explores the Region too (nothing hides again)', () => {
    let state = started(90);
    const target = movementFixture(state);
    // The table shares open Regions: once Beto has explored the Region of the destination, Ana's move there is public.
    state.regions.find(region => region.hexIds.includes(target as never))!.revealedBy.push(p2);
    expect(visibleHexIds(state, p2).has(target)).toBe(true);
    state = must(state, p1, { type: 'QUEUE_ORDER', order: { id: 'visible-move', type: 'MOVE', unitIds: ['u1'], path: [target] } });
    state = readyAll(state);

    const beto = state.roundReports.find(report => report.playerId === p2 && report.round === 1)!.resolution;
    expect(beto).toContainEqual(expect.objectContaining({ type: 'MOVEMENT', actorId: p1, hexId: target, unitIds: ['u1'] }));
  });
});

describe('finishing and determinism', () => {
  it('finishes at the round limit without opening another round', () => {
    let state = started(78); state.rules.roundLimit = 2;
    state = completeRound(state); state = completeRound(state);
    expect(state.core.status).toBe('FINISHED');
    expect(state.core.round).toBe(2);
    expect(state.phase).toBe('END_ROUND');
    expect(state.winner?.reason).toBe('ROUND_LIMIT');
    expect(state.roundReports).toHaveLength(4);
    expect(applyAlphaCommand(state, p1, { type: 'READY', expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'NOT_ACTIVE' } });
  });

  it('replays deterministically from the same seed and commands', () => {
    const play = () => {
      let state = started(79);
      for (let round = 0; round < 3; round++) {
        state = produceAll(state);
        state = completeRound(state);
      }
      return serializeAlphaState(state);
    };
    expect(play()).toBe(play());
  });

  it('draws different pulses for different seeds', () => {
    const order = (seed: number) => { const s = started(seed); return [s.worldPulse.current!.id, completeRound(s).worldPulse.current!.id].join(); };
    expect(new Set([80, 81, 82, 83, 84].map(order)).size).toBeGreaterThan(1);
  });
});

describe('client projection of the round loop', () => {
  it('exposes the phase, the current pulse and only the viewer\'s own city states, never the deck', async () => {
    const { alphaPlayerView } = await import('../apps/server/src/alpha-projection.js');
    const state = started(85);
    const view = alphaPlayerView(state, p1)!;
    expect(view.phase).toBe('PLANNING');
    expect(view.worldPulse).toEqual({ id: state.worldPulse.current!.id, name: state.worldPulse.current!.name, type: state.worldPulse.current!.type });
    expect(view.cityStates.map(c => c.cityId)).toEqual(['capital-1']);
    expect(view.cityStates[0]).toMatchObject({ urbanActionsUsed: 0, status: 'OWNED' });
    const text = JSON.stringify(view);
    expect(text).not.toContain(state.privateRng.seed);
    expect(view).not.toHaveProperty('roundLedgers');
    for (const id of state.worldPulse.deck) expect(text).not.toContain(`"${id}"`);
    expect(view.schemaVersion).toBe(5);
  });

  it('changes an opponent projection only from Planejando to Pronto, never exposing reserved ids, targets or costs', async () => {
    const { alphaPlayerView } = await import('../apps/server/src/alpha-projection.js');
    let state = started(87, 3);
    const target = movementFixture(state), p3 = state.players[2]!.playerId;
    state.players[0]!.ambitionsChosen = true;
    const before = alphaPlayerView(state, p2)!;
    state = must(state, p1, { type: 'QUEUE_ORDER', order: { id: 'hidden-move-plan', type: 'MOVE', unitIds: ['u1'], path: [target] } });
    state = must(state, p1, { type: 'URBAN_ACTION', planId: 'hidden-city-plan', cityId: 'capital-1', action: 'PRODUCE' });
    state = must(state, p1, { type: 'PROPOSE_TREATY', planId: 'hidden-treaty-plan', recipientId: p3, treaty: 'TRADE_AGREEMENT', deal: { give: { ...none, wealth: 3 }, receive: { ...none, materials: 2 } } });
    const own = JSON.stringify(alphaPlayerView(state, p1));
    const rival = alphaPlayerView(state, p2)!;
    expect(own).toContain('hidden-move-plan');
    expect(own).toContain('hidden-city-plan');
    expect(own).toContain('hidden-treaty-plan');
    const withoutVersion = <T extends { version: number }>(view: T) => ({ ...structuredClone(view), version: 0 });
    expect(withoutVersion(rival)).toEqual(withoutVersion(before));
    expect(rival.self.plannedActions).toEqual([]);

    state = must(state, p1, { type: 'READY' });
    const ready = alphaPlayerView(state, p2)!;
    const expected = structuredClone(rival);
    expected.players.find(player => player.id === p1)!.ready = true;
    expect(withoutVersion(ready)).toEqual(withoutVersion(expected));
  });
});

describe('world pulse deck exhaustion', () => {
  it('reshuffles the discard pile deterministically when the deck runs out', () => {
    const play = () => {
      const state = started(86);
      state.rules.roundsPerEra = 1;
      state.worldPulse.discard = [...state.worldPulse.deck];
      state.worldPulse.deck = [];
      const after = completeRound(state);
      return [after.worldPulse.current!.id, after.worldPulse.deck.length, after.worldPulse.discard.length].join(':');
    };
    expect(play()).toBe(play());
    expect(play().split(':').slice(1).join(':')).toBe(`${WORLD_PULSE_CARDS.length - 1}:0`);
  });
});
