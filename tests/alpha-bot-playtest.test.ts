import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { serializeAlphaState } from '@aoh/game-engine';
import type { AlphaState, RoundTelemetry } from '@aoh/game-domain';

/** The headless bot driver lives in scripts/ (plain ESM over the built packages); load it without a static type edge. */
interface BotRun { state: AlphaState; ctx: { crashes: unknown[]; violations: unknown[]; counters: { commands: number } }; coverage: Set<string> }
type Driver = { playMatch(options: { seed: number; players: number; rounds?: number }): BotRun; COVERAGE_FLAGS: string[] };
const driver = async (): Promise<Driver> => (await import(/* @vite-ignore */ ['..', 'scripts', 'lib', 'alpha-bots.mjs'].join('/'))) as Driver;
const hash = (state: AlphaState) => createHash('sha256').update(serializeAlphaState(state)).digest('hex');

describe('headless bot playtest (V5.1b)', () => {
  it('plays a 2-player match for 12 rounds without crash, softlock or invariant violation, and writes per-round telemetry', async () => {
    const { playMatch } = await driver();
    const run = playMatch({ seed: 1, players: 2, rounds: 12 });
    expect(run.ctx.crashes).toEqual([]);
    expect(run.ctx.violations).toEqual([]);
    expect(run.state.core.round).toBeGreaterThan(12);
    const log: RoundTelemetry[] = run.state.telemetry.roundLog;
    expect(log.length).toBe(24);
    expect(log.every(row => row.population >= 1 && row.cities >= 1)).toBe(true);
    expect(log.some(row => Object.values(row.orders).reduce((a, b) => a + b, 0) > 0)).toBe(true);
    expect(run.state.telemetry.pendingOrders).toEqual({});
  }, 120_000);

  it('is deterministic: the same seed and bots reach the same state hash', async () => {
    const { playMatch } = await driver();
    const a = playMatch({ seed: 5, players: 2, rounds: 8 }), b = playMatch({ seed: 5, players: 2, rounds: 8 });
    expect(hash(a.state)).toBe(hash(b.state));
    expect(hash(a.state)).not.toBe(hash(playMatch({ seed: 6, players: 2, rounds: 8 }).state));
  }, 120_000);

  it('runs 4 and 6 seats through the first Era turn and beyond with the same guarantees', async () => {
    const { playMatch } = await driver();
    for (const players of [4, 6]) {
      const run = playMatch({ seed: 2, players, rounds: 7 });
      expect(run.ctx.crashes, `${players} seats`).toEqual([]);
      expect(run.ctx.violations, `${players} seats`).toEqual([]);
      expect(run.state.core.round).toBeGreaterThan(7);
      expect(run.state.telemetry.roundLog.filter(row => row.round === 1)).toHaveLength(players);
    }
  }, 240_000);

  it('a full 35-round 2-player match finishes and reaches the cheap coverage subset', async () => {
    const { playMatch, COVERAGE_FLAGS } = await driver();
    const run = playMatch({ seed: 2, players: 2 });
    expect(run.ctx.crashes).toEqual([]);
    expect(run.ctx.violations).toEqual([]);
    expect(run.state.core.status).toBe('FINISHED');
    expect(run.state.core.round).toBe(35);
    expect(run.state.telemetry.roundLog.length).toBe(70);
    for (const flag of ['famine', 'battle', 'band', 'fortification']) expect(run.coverage.has(flag), flag).toBe(true);
    expect(COVERAGE_FLAGS).toContain('hegemony');
  }, 240_000);
});
