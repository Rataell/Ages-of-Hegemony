import { describe, expect, it } from 'vitest';
import { MatchReportV1Schema, REPORT_RESOURCES, type AlphaState } from '@aoh/game-domain';
import { buildMatchReport } from '@aoh/game-engine';

/**
 * RC5 smoke: a complete short match (21 rounds) played by the headless bots with the RC5 systems in force (the six buildings on offer, `unit:*` recruiting prerequisites, the Arquivo in
 * the Acadêmico family, the accelerated pace). It must finish without crash, softlock or invariant violation, and yield a valid Crônica with the eight resources.
 */
interface BotRun { state: AlphaState; ctx: { crashes: unknown[]; violations: unknown[]; counters: { commands: number } } }
type Driver = { playMatch(options: { seed: number; players: number; rounds?: number; preset?: string; pace?: string }): BotRun };
const driver = async (): Promise<Driver> => (await import(/* @vite-ignore */ ['..', 'scripts', 'lib', 'alpha-bots.mjs'].join('/'))) as Driver;

describe('short match with the new systems', () => {
  it('accelerated pace, 2 players: finishes, no crash or violation, and the report identifies the pace', async () => {
    const { playMatch } = await driver();
    const run = playMatch({ seed: 4, players: 2, rounds: 21, preset: 'QUICK', pace: 'ACCELERATED' });
    expect(run.ctx.crashes).toEqual([]);
    expect(run.ctx.violations).toEqual([]);
    expect(run.state.core.status).toBe('FINISHED');
    expect(run.state.rules.pace).toBe('ACCELERATED');
    expect(run.state.players.every(player => player.research.includes('web-agriculture'))).toBe(true);
    const report = buildMatchReport(run.state, { origin: 'SIMULATION' });
    expect(MatchReportV1Schema.parse(report)).toEqual(report);
    expect(report.match).toMatchObject({ pace: 'ACCELERATED', roundsPlayed: 21, endReason: 'ROUND_LIMIT' });
    for (const seat of report.economy.perSeat) for (const resource of REPORT_RESOURCES) expect(seat.stock[resource]!.length, `${seat.seat} ${resource}`).toBe(21);
    expect(report.coverage.truncated).toBe(false);
  }, 180_000);

  it('standard pace, 4 players: finishes the same way and the pace stays STANDARD', async () => {
    const { playMatch } = await driver();
    const run = playMatch({ seed: 3, players: 4, rounds: 21, preset: 'QUICK' });
    expect(run.ctx.crashes).toEqual([]);
    expect(run.ctx.violations).toEqual([]);
    expect(run.state.core.status).toBe('FINISHED');
    const report = buildMatchReport(run.state, { origin: 'SIMULATION' });
    expect(report.match.pace).toBe('STANDARD');
    expect(run.state.cities.some(city => city.level !== 'OUTPOST')).toBe(true);
  }, 240_000);
});
