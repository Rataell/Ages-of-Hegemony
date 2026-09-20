import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, RESOURCE_KEYS, type AlphaState } from '@aoh/game-domain';
import { alphaGain, beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { completeRound } from './alpha-rounds.js';

const made = (id: string, seed = 51): AlphaState => createAlphaGame({ gameId: id, seed, preset: 'QUICK', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] });
const balance = (report: AlphaState['roundReports'][number], key: (typeof RESOURCE_KEYS)[number]) =>
  report.opening[key] + report.production[key] + report.mining[key] + report.trade[key] + report.institutions[key] + report.other[key] + (report.economy?.netChange[key] ?? 0)
  - report.losses[key] - report.expenses[key] - report.upkeepPaid[key] - report.discarded[key];

describe('authoritative alpha round reports', () => {
  it('opens with no reports and closes one per player when the round ends', () => {
    const state = beginAlphaPlanning(made('report-open'));
    expect(state.roundReports).toHaveLength(0);
    const after = completeRound(state, { produce: true });
    expect(after.roundReports.map(r => r.playerId).sort()).toEqual(['p1', 'p2']);
    expect(after.roundReports.every(r => r.round === 1)).toBe(true);
  });

  it('closes the equation opening + gains - spending - upkeep - discards = closing for every resource', () => {
    const state = beginAlphaPlanning(made('report-equation'));
    const after = completeRound(state, { produce: true });
    after.core.players.forEach(player => {
      const report = after.roundReports.find(r => r.playerId === player.id)!;
      for (const key of RESOURCE_KEYS) expect(balance(report, key)).toBe(report.closing[key]);
      expect(report.cities[0]!.populationAfter).toBe(player.civilization.cities[0]!.population);
    });
    expect(AlphaStateSchema.safeParse(after).success).toBe(true);
  });

  it('shows production only when cities produce', () => {
    const state = beginAlphaPlanning(made('report-production'));
    const idle = completeRound(structuredClone(state));
    for (const report of idle.roundReports) {
      for (const key of RESOURCE_KEYS) { expect(report.production[key]).toBe(0); expect(report.mining[key]).toBe(0); }
    }
    const busy = completeRound(structuredClone(state), { produce: true });
    for (const report of busy.roundReports) expect(RESOURCE_KEYS.some(key => report.production[key] > 0)).toBe(true);
  });

  it('records paid rather than demanded upkeep on shortage and reports final stability', () => {
    const initial = made('report-shortage');
    initial.rules.units.PIONEER.upkeep.food = 999;
    const state = completeRound(beginAlphaPlanning(initial));
    const report = state.roundReports[0]!;
    expect(report.upkeepRequired.food).toBeGreaterThanOrEqual(999);
    expect(report.upkeepPaid.food).toBeLessThan(report.upkeepRequired.food);
    expect(report.closing.food).toBe(0);
    expect(report.cities[0]!.stabilityAfter).toBe(state.core.players[0]!.civilization.cities[0]!.stability);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('records storage discards in the report so it still balances', () => {
    const state = beginAlphaPlanning(made('report-discard'));
    alphaGain(state, state.players[0]!.playerId, { food: 300, wood: 200 }, { enforceStorage: false });
    const after = completeRound(state);
    const report = after.roundReports.find(r => r.playerId === 'p1')!;
    expect(report.discarded.food).toBeGreaterThan(0);
    for (const key of RESOURCE_KEYS) expect(balance(report, key)).toBe(report.closing[key]);
    expect(AlphaStateSchema.safeParse(after).success).toBe(true);
  });

  it('rejects fabricated arithmetic and keeps opposing reports outside projections', () => {
    const state = completeRound(beginAlphaPlanning(made('report-private')));
    const actor = state.players[0]!.playerId;
    expect(alphaPlayerView(state, actor)!.roundReports.map(r => r.playerId)).toEqual([actor]);
    state.roundReports[0]!.closing.wealth++;
    expect(AlphaStateSchema.safeParse(state).success).toBe(false);
  });

  it('still parses a report written before production, expense and loss categories existed', () => {
    const state = completeRound(beginAlphaPlanning(made('report-legacy')));
    const old = structuredClone(state) as unknown as { roundReports: Record<string, unknown>[]; roundLedgers?: unknown };
    for (const report of old.roundReports) for (const key of ['production', 'other', 'losses', 'expenses', 'mining', 'discarded']) delete report[key];
    for (const report of old.roundReports as unknown as AlphaState['roundReports']) {
      // An old report balanced without the new categories; recompute its closing the way the old formula did.
      for (const key of RESOURCE_KEYS) report.closing[key] = report.opening[key] + report.institutions[key] + report.trade[key] - report.upkeepPaid[key];
    }
    const parsed = AlphaStateSchema.safeParse(old);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.roundReports[0]!.production.food).toBe(0);
  });
});
