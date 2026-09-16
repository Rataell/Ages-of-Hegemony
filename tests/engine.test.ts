import { describe, expect, it } from 'vitest';
import { advancePhase, applyCommand, createGame, hexId, nextPhase, submitOrder } from '@aoh/game-engine';
import { GameStateSchema, PlayerIdSchema, RoundPhaseSchema, deserializeGameState, serializeGameState, type GameCommand, type PlayerOrder } from '@aoh/game-domain';
import { deepFreeze, game, input, playerId, secondPlayerId, unwrap } from './helpers.js';

describe('game creation', () => {
  it.each([2, 3, 4, 5, 6])('accepts %i players', (count) => {
    const state = unwrap(createGame(input(count)));
    expect(state.playerCount).toBe(count);
    expect(Object.keys(state.pendingOrders)).toHaveLength(count);
    expect(state.config.baseCommandPoints).toBe(4);
    expect(state.rng.state).toBe(42);
    expect(GameStateSchema.safeParse(state).success).toBe(true);
  });
  it.each([0, 1, 7, 8])('rejects %i players', (count) => {
    expect(createGame(input(count))).toMatchObject({ ok: false, error: { code: 'INVALID_PLAYER_COUNT' } });
  });
  it('rejects duplicate players, reserved IDs, duplicate tiles and invalid seeds', () => {
    expect(createGame({ ...input(), players: [input().players[0], input().players[0]] }).ok).toBe(false);
    expect(createGame({ ...input(), players: [{ id: '__proto__', name: 'Bad' }, input().players[0]] }).ok).toBe(false);
    const tile = { id: '0,0', q: 0, r: 0 };
    expect(createGame({ ...input(), map: [tile, tile] }).ok).toBe(false);
    expect(createGame({ ...input(), map: [{ ...tile, id: '1,0' }] }).ok).toBe(false);
    expect(createGame({ ...input(), seed: -1 }).ok).toBe(false);
  });
  it('keeps configuration local to each match', () => {
    expect(unwrap(createGame({ ...input(), config: { baseCommandPoints: 9 } })).config.baseCommandPoints).toBe(9);
    expect(game().config.baseCommandPoints).toBe(4);
  });
});

describe('round state machine', () => {
  it('accepts the full cycle, increments round once, and preserves inputs', () => {
    let state = game();
    for (const phase of ['PLANNING', 'RESOLUTION', 'REACTION', 'END_ROUND', 'MAINTENANCE'] as const) {
      const before = JSON.stringify(state);
      const previous = state;
      state = unwrap(advancePhase(deepFreeze(state), phase, state.version));
      expect(JSON.stringify(previous)).toBe(before);
      expect(state.phase).toBe(phase);
      expect(GameStateSchema.safeParse(state).success).toBe(true);
    }
    expect(state.round).toBe(2);
    expect(state.version).toBe(5);
    expect(state.eventLog).toHaveLength(6);
  });
  for (const from of RoundPhaseSchema.options) {
    for (const to of RoundPhaseSchema.options.filter((phase) => phase !== nextPhase(from))) {
      it(`rejects ${from} -> ${to}`, () => {
        let state = game();
        while (state.phase !== from) state = unwrap(advancePhase(state, nextPhase(state.phase), state.version));
        expect(advancePhase(state, to, state.version)).toMatchObject({ ok: false, error: { code: 'INVALID_PHASE_TRANSITION' } });
      });
    }
  }
  it('rejects stale versions, finished games and unknown commands', () => {
    expect(advancePhase(game(), 'PLANNING', 5)).toMatchObject({ ok: false, error: { code: 'VERSION_CONFLICT' } });
    expect(advancePhase({ ...game(), status: 'FINISHED' }, 'PLANNING', 0)).toMatchObject({ ok: false, error: { code: 'NOT_ACTIVE' } });
    expect(applyCommand(game(), { type: 'WIN_GAME' }).ok).toBe(false);
  });
});

describe('simultaneous planning', () => {
  const order: PlayerOrder = { id: 'order-1', playerId, type: 'EXPLORE' };
  it('accepts independent orders and leaves undefined effects untouched', () => {
    let state = unwrap(advancePhase(game(), 'PLANNING', 0));
    const players = structuredClone(state.players);
    const commandOrder = deepFreeze({ ...order });
    state = unwrap(submitOrder(deepFreeze(state), commandOrder, 1));
    state = unwrap(submitOrder(state, { ...order, id: 'order-2', playerId: secondPlayerId, type: 'RESEARCH' }, 2));
    expect(state.pendingOrders[playerId]).toEqual([order]);
    expect(state.pendingOrders[secondPlayerId]).toHaveLength(1);
    expect(state.players).toEqual(players);
    for (const phase of ['RESOLUTION', 'REACTION', 'END_ROUND', 'MAINTENANCE'] as const) state = unwrap(advancePhase(state, phase, state.version));
    expect(state.pendingOrders[playerId]).toEqual([]);
    expect(state.eventLog.filter((event) => event.type === 'ORDER_SUBMITTED')).toHaveLength(2);
    expect(state.players).toEqual(players);
  });
  it('rejects wrong phase, foreign players, unknown hexes and duplicate IDs', () => {
    expect(submitOrder(game(), order, 0)).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } });
    let state = unwrap(advancePhase(game(), 'PLANNING', 0));
    expect(submitOrder(state, { ...order, playerId: PlayerIdSchema.parse('outsider') }, 1)).toMatchObject({ ok: false, error: { code: 'UNKNOWN_PLAYER' } });
    expect(submitOrder(state, { ...order, targetHexId: hexId({ q: 2, r: 2 }) }, 1)).toMatchObject({ ok: false, error: { code: 'UNKNOWN_HEX' } });
    state = unwrap(submitOrder(state, order, 1));
    expect(submitOrder(state, { ...order, playerId: secondPlayerId }, 2)).toMatchObject({ ok: false, error: { code: 'DUPLICATE_ORDER' } });
  });
  it('replays the same ordered commands identically, including after serialization', () => {
    const commands: GameCommand[] = [
      { type: 'ADVANCE_PHASE', expectedVersion: 0, nextPhase: 'PLANNING' },
      { type: 'SUBMIT_ORDER', expectedVersion: 1, order },
      { type: 'ADVANCE_PHASE', expectedVersion: 2, nextPhase: 'RESOLUTION' },
    ];
    const replay = () => commands.reduce((state, command) => unwrap(applyCommand(state, command)), game());
    const halfway = unwrap(applyCommand(game(), commands[0]));
    const resumed = commands.slice(1).reduce((state, command) => unwrap(applyCommand(state, command)), unwrap(deserializeGameState(serializeGameState(halfway))));
    expect(serializeGameState(replay())).toBe(serializeGameState(replay()));
    expect(resumed).toEqual(replay());
  });
});

describe('snapshots', () => {
  it('round trips JSON and rejects corrupt or unsupported snapshots', () => {
    const state = game();
    expect(unwrap(deserializeGameState(serializeGameState(state)))).toEqual(state);
    for (const json of ['bad json', '{}', JSON.stringify({ ...state, schemaVersion: 2 }), JSON.stringify({ ...state, playerCount: 6 }), JSON.stringify({ ...state, version: 8 })]) expect(deserializeGameState(json).ok).toBe(false);
  });
  it('rejects negative resources and invalid pending-order ownership at the boundary', () => {
    const state = game();
    const first = state.players[0];
    if (!first) throw new Error('Missing fixture');
    first.resources.food = -1;
    expect(deserializeGameState(JSON.stringify(state)).ok).toBe(false);
    expect(applyCommand(state, { type: 'ADVANCE_PHASE', nextPhase: 'PLANNING', expectedVersion: 0 })).toMatchObject({ ok: false, error: { code: 'INVALID_STATE' } });
    const wrong = game();
    wrong.pendingOrders[playerId] = [{ id: 'bad', type: 'BUILD', playerId: secondPlayerId }];
    expect(deserializeGameState(JSON.stringify(wrong)).ok).toBe(false);
  });
});
