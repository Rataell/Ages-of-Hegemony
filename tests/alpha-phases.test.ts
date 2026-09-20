import { describe, expect, it } from 'vitest';
import { AlphaRoundPhaseSchema, AlphaStateSchema, PlayerIdSchema, WORLD_PULSE_CARDS, type AlphaState } from '@aoh/game-domain';
import { CORE_PHASE_MIRROR, LEGAL_COMMANDS, applyAlphaCommand, beginAlphaPlanning, createAlphaGame, serializeAlphaState } from '@aoh/game-engine';
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

describe('the eight-phase round', () => {
  it('declares the eight phases in order and mirrors each onto the legacy core phase', () => {
    expect(AlphaRoundPhaseSchema.options).toEqual(['WORLD_PULSE', 'PLANNING', 'URBAN_ACTIONS', 'ORDERS_MOVEMENT', 'DIPLOMACY_TRADE', 'CONFLICTS', 'INTEGRATION_MAINTENANCE', 'END_ROUND']);
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
    expect(trail).toEqual(['PHASE', 'RESOLUTION', 'MAINTENANCE', 'WORLD_PULSE', 'ROUND_STARTED']);
  });

  it('rests only in the interactive phases, in order', () => {
    let state = started(); const seen: string[] = [state.phase];
    for (let i = 0; i < 6; i++) { state = readyAll(state); seen.push(state.phase); }
    expect(seen).toEqual(['PLANNING', 'URBAN_ACTIONS', 'DIPLOMACY_TRADE', 'PLANNING', 'URBAN_ACTIONS', 'DIPLOMACY_TRADE', 'PLANNING']);
  });

  it('does not advance until every player confirms, and never skips a phase', () => {
    let state = started();
    state = must(state, p1, { type: 'CHOOSE_AMBITIONS', cardIds: state.players[0]!.ambitions.slice(0, 2) });
    state = must(state, p1, { type: 'READY' });
    expect(state.phase).toBe('PLANNING');
    expect(state.players.map(p => p.ready)).toEqual([true, false]);
    state = must(state, p2, { type: 'CHOOSE_AMBITIONS', cardIds: state.players[1]!.ambitions.slice(0, 2) });
    state = must(state, p2, { type: 'READY' });
    expect(state.phase).toBe('URBAN_ACTIONS');
    expect(state.players.every(p => !p.ready)).toBe(true);
  });
});

describe('phase legality', () => {
  it('permits each command only in its phases', () => {
    const planning = started();
    expect(legalIn(planning, 'URBAN_ACTION', { cityId: 'capital-1', action: 'PRODUCE' })).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } });
    const urban = readyAll(planning);
    expect(legalIn(urban, 'CIVILIZATION_ABILITY')).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } });
    expect(legalIn(urban, 'QUEUE_ORDER', { order: { id: 'x', type: 'MOVE', unitIds: ['u'], path: ['0,0'] } })).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } });
    expect(legalIn(urban, 'MANAGE', { command: { type: 'DEVELOP_CITY', playerId: p1, cityId: 'capital-1', expectedVersion: urban.core.version } })).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } });
    const diplomacy = readyAll(urban);
    expect(diplomacy.phase).toBe('DIPLOMACY_TRADE');
    expect(legalIn(diplomacy, 'URBAN_ACTION', { cityId: 'capital-1', action: 'PRODUCE' })).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } });
    expect(legalIn(diplomacy, 'BUILD_ROAD', { hexId: '0,0' })).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } });
    expect(legalIn(diplomacy, 'PROPOSE_TREATY', { recipientId: p2, treaty: 'TRADE_AGREEMENT', deal: { give: none, receive: none } }).ok).toBe(true);
  });

  it('has exactly one path for each urban action: the legacy commands no longer exist', () => {
    const state = started();
    for (const raw of [{ type: 'RECRUIT', cityId: 'capital-1', kind: 'INFANTRY' }, { type: 'RESEARCH', advancementId: 'adv-1-1-1' }, { type: 'INTEGRATE_CITY', cityId: 'capital-2' }])
      expect(applyAlphaCommand(state, p1, { ...raw, expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
    for (const build of [{ type: 'BUILD_DISTRICT', cityId: 'capital-1', district: 'AGRARIAN' }, { type: 'BUILD_BUILDING', cityId: 'capital-1', building: 'GRANARY' }])
      expect(legalIn(state, 'MANAGE', { command: { ...build, playerId: p1, expectedVersion: state.core.version } })).toMatchObject({ ok: false, error: { code: 'USE_URBAN_ACTION' } });
    const planning = [...LEGAL_COMMANDS.PLANNING];
    for (const type of ['URBAN_ACTION', 'RECRUIT', 'RESEARCH', 'INTEGRATE_CITY']) expect(planning).not.toContain(type);
  });

  it('lists no command for the automatic phases', () => {
    for (const phase of ['WORLD_PULSE', 'ORDERS_MOVEMENT', 'INTEGRATION_MAINTENANCE', 'END_ROUND'] as const) expect(LEGAL_COMMANDS[phase].size).toBe(0);
    for (const phase of ['PLANNING', 'URBAN_ACTIONS', 'DIPLOMACY_TRADE', 'CONFLICTS'] as const) expect(LEGAL_COMMANDS[phase].has('READY')).toBe(true);
  });

  it('answers commands that are not built yet with NOT_IMPLEMENTED instead of silently succeeding', () => {
    const state = started();
    for (const raw of [
      { type: 'PROPOSE_TRADE', recipientId: p2, offerType: 'GIFT', offer: noneAlpha, request: noneAlpha, treatyTerms: [], dueRound: null },
      { type: 'RESPOND_TRADE', offerId: 'o', accept: true },
      { type: 'CONTEST_PRESENCE', cityId: 'capital-2', defenderCivilizationId: 'valgard' },
      { type: 'INDEPENDENT_ACTION', peopleId: 'independent-1', action: 'TRADE' },
    ]) expect(applyAlphaCommand(state, p1, { ...raw, expectedVersion: state.version })).toMatchObject({ ok: false, error: { code: 'NOT_IMPLEMENTED' } });
  });

  it('keeps the legacy core phase consistent with the alpha phase in every resting state', () => {
    let state = started();
    for (let i = 0; i < 6; i++) { expect(state.core.phase).toBe(CORE_PHASE_MIRROR[state.phase]); state = readyAll(state); }
  });
});

describe('what each phase does', () => {
  it('resets urban actions when URBAN_ACTIONS opens, not before', () => {
    let state = started();
    state.cities[0]!.urbanActionsUsed = 1;
    expect(state.cities[0]!.urbanActionsUsed).toBe(1);
    state = readyAll(state);
    expect(state.cities.every(c => c.urbanActionsUsed === 0)).toBe(true);
  });

  it('resolves movement between URBAN_ACTIONS and DIPLOMACY_TRADE, never earlier', () => {
    let state = started();
    state.units = [{ id: 'u1', ownerId: p1, kind: 'INFANTRY', hexId: state.core.map[0]!.id, recruitedRound: 1 }];
    const target = '1,0';
    state = must(state, p1, { type: 'QUEUE_ORDER', order: { id: 'm1', type: 'MOVE', unitIds: ['u1'], path: [target] } });
    expect(state.units[0]!.hexId).not.toBe(target);
    state = readyAll(state);
    expect(state.phase).toBe('URBAN_ACTIONS');
    expect(state.units[0]!.hexId).not.toBe(target);
    state = readyAll(state);
    expect(state.phase).toBe('DIPLOMACY_TRADE');
    expect(state.units[0]!.hexId).toBe(target);
  });

  it('activates accepted treaties when DIPLOMACY_TRADE closes', () => {
    let state = started();
    state = must(state, p1, { type: 'PROPOSE_TREATY', recipientId: p2, treaty: 'TRADE_AGREEMENT', deal: { give: none, receive: none } });
    state = must(state, p2, { type: 'RESPOND_TREATY', treatyId: state.treaties.at(-1)!.id, accept: true });
    expect(state.treaties[0]!.status).toBe('ACCEPTED');
    state = readyAll(readyAll(state));
    expect(state.treaties[0]!.status).toBe('ACCEPTED');
    state = readyAll(state);
    expect(state.treaties[0]!.status).toBe('ACTIVE');
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
    state.units = [{ id: 'u1', ownerId: p1, kind: 'INFANTRY', hexId: state.core.map[0]!.id, recruitedRound: 1 }];
    state = must(state, p1, { type: 'QUEUE_ORDER', order: { id: 'm1', type: 'MOVE', unitIds: ['u1'], path: ['1,0'] } });
    expect(state.players[0]!.orders).toHaveLength(1);
    state = completeRound(state);
    expect(state.players.every(p => !p.ready && p.orders.length === 0 && p.spentCommands === 0)).toBe(true);
  });

  it('draws one distinct pulse per round from the private deck', () => {
    let state = started(73);
    const seen = new Set([state.worldPulse.current!.id]);
    const deck = state.worldPulse.deck.length;
    expect(state.worldPulse.deck.length + state.worldPulse.discard.length + 1).toBe(WORLD_PULSE_CARDS.length);
    for (let round = 2; round <= 4; round++) {
      state = completeRound(state);
      expect(state.worldPulse.resolvedRound).toBe(round);
      expect(seen.has(state.worldPulse.current!.id)).toBe(false);
      seen.add(state.worldPulse.current!.id);
    }
    expect(state.worldPulse.deck.length).toBe(deck - 3);
    expect(state.telemetry.worldPulseEvents).toBe(4);
    expect(state.events.filter(e => e.type === 'WORLD_PULSE')).toHaveLength(4);
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
        state = readyAll(state);
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
});

describe('world pulse deck exhaustion', () => {
  it('reshuffles the discard pile deterministically when the deck runs out', () => {
    const play = () => {
      const state = started(86);
      state.worldPulse.discard = [...state.worldPulse.deck];
      state.worldPulse.deck = [];
      const after = completeRound(state);
      return [after.worldPulse.current!.id, after.worldPulse.deck.length, after.worldPulse.discard.length].join(':');
    };
    expect(play()).toBe(play());
    expect(play().split(':').slice(1).join(':')).toBe(`${WORLD_PULSE_CARDS.length - 1}:0`);
  });
});
