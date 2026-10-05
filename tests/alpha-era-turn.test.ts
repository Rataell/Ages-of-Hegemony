import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, WORLD_PULSE_CARDS, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame, isEraTurnDue, serializeAlphaState } from '@aoh/game-engine';
import { must, readyAll } from './alpha-rounds.js';

const p1 = 'p1' as never, p2 = 'p2' as never;
function fresh(seed = 81, rounds = 2): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'era-turn', seed, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana' }, { id: 'p2', name: 'Beto' }] }));
  state.rules.roundsPerEra = rounds; state.rules.roundLimit = rounds * 7;
  return state;
}
/** Confirms every phase up to (and including) the end of round `round`'s conflicts so the match rests in the Era turn. */
function toEraTurn(state: AlphaState): AlphaState {
  let current = state;
  for (let guard = 0; guard < 60 && current.phase !== 'ERA_TURN'; guard++) current = readyAll(current);
  return current;
}
const research = (state: AlphaState, ids: string[]) => { for (const player of state.players) player.research.push(...ids); };

describe('Era turn (canon §22)', () => {
  it('rests in ERA_TURN after the last round of an Era with steps 1–6 logged in order and the round not yet advanced', () => {
    const state = toEraTurn(fresh());
    expect(state.phase).toBe('ERA_TURN');
    expect(state.core.round).toBe(2);
    expect(state.eraTurn!.step).toBe(7);
    expect(state.eraTurn!.log.map(entry => entry.step)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('is not due in the middle of an Era nor after the match last round', () => {
    const state = fresh();
    expect(isEraTurnDue(state)).toBe(false);
    state.core.round = 2; expect(isEraTurnDue(state)).toBe(true);
    state.core.round = state.rules.roundLimit; expect(isEraTurnDue(state)).toBe(false);
  });

  it('advances the Era together on READY from everyone: round + 1, a new planning, Leader power back, hand +1', () => {
    let state = toEraTurn(fresh());
    const handBefore = state.players.map(player => player.hand.length);
    state.players.forEach(player => { player.leader!.eraAbilityUsed = true; });
    state = readyAll(state);
    expect(state.phase).toBe('PLANNING');
    expect(state.core.round).toBe(3);
    expect(state.eraTurn).toBeNull();
    expect(state.players.map(player => player.era)).toEqual(['EXPANSION', 'EXPANSION']);
    expect(state.players.every(player => !player.leader!.eraAbilityUsed)).toBe(true);
    state.players.forEach((player, index) => expect(player.hand.length).toBe(Math.min(state.rules.handLimit, handBefore[index]! + 1)));
  });

  it('draws the Pulse only at the start of the match and at the Era turn (seven per full match)', () => {
    let state = fresh(82, 1);
    expect(state.telemetry.worldPulseEvents).toBe(1);
    const seen: number[] = [state.telemetry.worldPulseEvents];
    for (let era = 0; era < 6; era++) { state = readyAll(toEraTurn(state)); seen.push(state.telemetry.worldPulseEvents); }
    expect(seen).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(state.core.round).toBe(7);
    expect(WORLD_PULSE_CARDS.length).toBeGreaterThan(7);
  });

  it('runs a full 35-round match through every Era turn and finishes without losing a round', () => {
    let state = fresh(83, 5);
    state.rules.roundsPerEra = 5; state.rules.roundLimit = 35;
    let turns = 0;
    for (let guard = 0; guard < 600 && state.core.status === 'ACTIVE'; guard++) { if (state.phase === 'ERA_TURN') turns++; state = readyAll(state); }
    expect(turns).toBe(6);
    expect(state.core.status).toBe('FINISHED');
    expect(state.core.round).toBe(35);
    expect(state.telemetry.worldPulseEvents).toBe(7);
  });

  it('grows threats and launches ACTIVATE at step 4, not at the start of the next Era', () => {
    const base = fresh(84);
    const level = base.threats.map(threat => threat.level);
    const turn = toEraTurn(base);
    expect(turn.eraTurn!.log.find(entry => entry.step === 4)!.summary).toMatch(/Acampamento/);
    expect(turn.threats.length).toBeGreaterThan(0);
    expect(turn.threats.some((threat, index) => threat.level >= (level[index] ?? 1))).toBe(true);
  });

  it('auto-resolves choices pending from before and leaves the Pulse choices of this turn to the player', () => {
    let state = fresh(85);
    state = must(state, p1, { type: 'CHOOSE_AMBITIONS', cardIds: state.players[0]!.ambitions.slice(0, 2) });
    const turn = toEraTurn(state);
    expect(turn.players[0]!.pendingChoices.every(choice => choice.source === 'PULSE')).toBe(true);
  });

  it('allows only the Era-turn commands and one Ambição swap per Era', () => {
    const turn = toEraTurn(fresh(86));
    expect(applyAlphaCommand(turn, p1, { type: 'URBAN_ACTION', expectedVersion: turn.version, cityId: 'capital-1', action: 'PRODUCE' })).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } });
    const unfinished = turn.players[0]!.ambitions[0]!;
    const swapped = must(turn, p1, { type: 'SWAP_AMBITION', cardId: unfinished });
    expect(swapped.players[0]!.ambitions).not.toContain(unfinished);
    expect(swapped.players[0]!.ambitionSwapEra).toBe('FOUNDATION');
    const again = applyAlphaCommand(swapped, p1, { type: 'SWAP_AMBITION', expectedVersion: swapped.version, cardId: swapped.players[0]!.ambitions[0]! });
    expect(again).toMatchObject({ ok: false });
    expect(applyAlphaCommand(swapped, p1, { type: 'SWAP_AMBITION', expectedVersion: swapped.version, cardId: 'ambition-missing' }).ok).toBe(false);
  });

  it('is deterministic: the same match reaches the same state through the Era turn', () => {
    const a = readyAll(toEraTurn(fresh(87))), b = readyAll(toEraTurn(fresh(87)));
    expect(serializeAlphaState(a)).toBe(serializeAlphaState(b));
  });
});

describe('Governo only at the Era turn (canon §16, I-31)', () => {
  const adopt = (state: AlphaState, actor: never, government = 'MONARCHY') =>
    applyAlphaCommand(state, actor, { type: 'MANAGE', expectedVersion: state.version, command: { type: 'ADOPT_GOVERNMENT', playerId: actor, government, expectedVersion: state.core.version } });
  function ready(seed = 88): AlphaState {
    const state = fresh(seed);
    for (const player of state.players) { player.era = 'CONSOLIDATION'; player.resources.influence = 10; state.roundLedgers.filter(ledger => ledger.playerId === player.playerId).forEach(ledger => { ledger.opening.influence = 10; }); }
    research(state, ['web-writing', 'web-common-narratives', 'web-codes', 'web-centralization']);
    return state;
  }

  it('refuses a reform outside the last round of the Era', () => {
    const state = ready();
    expect(adopt(state, p1)).toMatchObject({ ok: false, error: { message: expect.stringContaining('Virada de Era') } });
  });

  it('reserves an Influência Order in the last round, pays and applies it at step 5, and leaves the capital Abalada', () => {
    let state = ready();
    while (state.core.round < 2) state = readyAll(state);
    expect(state.phase).toBe('PLANNING');
    const before = state.players[0]!.resources.influence;
    const reserved = adopt(state, p1);
    if (!reserved.ok) throw new Error(reserved.error.message);
    state = reserved.value;
    expect(state.players[0]!.plannedActions.some(action => action.type === 'GOVERNMENT_REFORM')).toBe(true);
    expect(state.players[0]!.resources.influence).toBe(before);
    expect(state.core.players[0]!.civilization.government).toBe('PROTO_GOVERNANCE');
    state = toEraTurn(state);
    expect(state.core.players[0]!.civilization.government).toBe('MONARCHY');
    expect(state.players[0]!.resources.influence).toBe(before - 4);
    expect(state.players[0]!.governmentReformEra).toBe('CONSOLIDATION');
    expect(state.cities.find(city => city.cityId === state.core.players[0]!.civilization.capitalCityId)!.mood).toBeLessThanOrEqual(3);
    expect(state.eraTurn!.log.find(entry => entry.step === 5)!.summary).toContain('Monarquia');
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('rejects a locked government, the same government, a second reservation and an unaffordable reform', () => {
    let state = ready(89);
    while (state.core.round < 2) state = readyAll(state);
    expect(adopt(state, p1, 'REPUBLIC')).toMatchObject({ ok: false, error: { message: expect.stringContaining('avanço da Teia') } });
    state.players[0]!.resources.influence = 3;
    expect(adopt(state, p1)).toMatchObject({ ok: false, error: { message: expect.stringContaining('Influência') } });
    state.players[0]!.resources.influence = 10;
    const first = adopt(state, p1);
    if (!first.ok) throw new Error(first.error.message);
    expect(adopt(first.value, p1)).toMatchObject({ ok: false });
  });

  it('a reservation that became impossible loses only its Order, and a reservation can be cancelled', () => {
    let state = ready(90);
    while (state.core.round < 2) state = readyAll(state);
    const reserved = adopt(state, p1);
    if (!reserved.ok) throw new Error(reserved.error.message);
    state = reserved.value;
    state.players[0]!.governmentReformEra = 'CONSOLIDATION';
    const turn = toEraTurn(state);
    expect(turn.core.players[0]!.civilization.government).toBe('PROTO_GOVERNANCE');
    expect(turn.players[0]!.resources.influence).toBe(10);
    const cancelled = must(reserved.value, p1, { type: 'CANCEL_ORDER', orderId: reserved.value.players[0]!.plannedActions.find(action => action.type === 'GOVERNMENT_REFORM')!.id });
    expect(cancelled.players[0]!.plannedActions.some(action => action.type === 'GOVERNMENT_REFORM')).toBe(false);
  });

  it('scores at most one Ambição per Era at the Era turn', () => {
    let state = fresh(91);
    state = must(state, p1, { type: 'CHOOSE_AMBITIONS', cardIds: state.players[0]!.ambitions.slice(0, 2) });
    const turn = toEraTurn(state);
    expect(turn.players[0]!.completedAmbitions.length).toBeLessThanOrEqual(1);
    void p2;
  });
});
