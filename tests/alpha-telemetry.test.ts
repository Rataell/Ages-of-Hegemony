import { describe, expect, it } from 'vitest';
import { PlayerIdSchema } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, recordRoundTelemetry, serializeAlphaState } from '@aoh/game-engine';
import { completeRound, must } from './alpha-rounds.js';

const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
const fresh = () => beginAlphaPlanning(createAlphaGame({ gameId: 'telemetry', seed: 12, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana' }, { id: 'p2', name: 'Beto' }] }));

describe('per-round telemetry (V5.1b playtest)', () => {
  it('writes one row per civilization when a round closes, with the Orders committed at planning time', () => {
    let state = fresh();
    state = must(state, p1, { type: 'CHOOSE_AMBITIONS', cardIds: state.players[0]!.ambitions.slice(0, 2) });
    state = must(state, p1, { type: 'URBAN_ACTION', cityId: 'capital-1', action: 'PRODUCE' });
    state = completeRound(state);
    const rows = state.telemetry.roundLog.filter(row => row.round === 1);
    expect(rows.map(row => row.playerId).sort()).toEqual([p1, p2]);
    const mine = rows.find(row => row.playerId === p1)!;
    expect(mine.orders.CITY).toBeGreaterThanOrEqual(1);
    expect(mine.repeatedOrders).toBeGreaterThanOrEqual(0);
    expect(mine.population).toBeGreaterThanOrEqual(1);
    expect(mine.cityLevels).toEqual([1]);
    expect(Object.keys(mine.stock).sort()).toEqual(['culture', 'food', 'influence', 'knowledge', 'metal', 'stone', 'wealth', 'wood']);
    expect(state.telemetry.pendingOrders).toEqual({});
  });

  it('is bounded to the last 260 rows and deterministic (no clock in the state)', () => {
    const a = fresh(), b = fresh();
    for (let index = 0; index < 150; index++) { a.core.round = 1 + (index % 35); recordRoundTelemetry(a); }
    expect(a.telemetry.roundLog.length).toBeLessThanOrEqual(260);
    recordRoundTelemetry(b); recordRoundTelemetry(fresh());
    expect(serializeAlphaState(completeRound(fresh()))).toBe(serializeAlphaState(completeRound(fresh())));
  });
});
