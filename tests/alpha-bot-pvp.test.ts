import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs driver without types
import { foodProjection, playMatch } from '../scripts/lib/alpha-bots.mjs';

// V51B-16: the bots must be able to reach and win an organic battle. A defender preview carries no `total`, and a bot that read it got NaN and never attacked.
describe('bot military policy', () => {
  it('two warriors at war produce a real player-vs-player battle and a captured city without injected units', () => {
    const result = playMatch({ seed: 2, players: 2, rounds: 20, personas: ['warrior', 'warrior'] });
    const ids = new Set(result.state.players.map((p: { playerId: string }) => p.playerId));
    const pvp = result.state.battles.filter((b: { attackerId: string; defenderId: string }) => ids.has(b.attackerId) && ids.has(b.defenderId));
    expect(result.ctx.crashes).toEqual([]);
    expect(pvp.length).toBeGreaterThan(0);
    expect(result.state.telemetry.citiesCaptured).toBeGreaterThan(0);
  }, 120_000);

  it('food projection replays the maintenance order: sustenance, automatic Crescer, then piece upkeep', () => {
    const result = playMatch({ seed: 1, players: 2, rounds: 1 });
    const pj = foodProjection(result.state, 'p1');
    expect(Object.keys(pj)).toEqual(expect.arrayContaining(['foodNow', 'income', 'sustenance', 'military', 'endStock', 'famine', 'unitShortage', 'ceilingGap']));
    expect(pj.endStock).toBeLessThanOrEqual(pj.foodNow + pj.income);
    const spent = foodProjection(result.state, 'p1', { spendFood: 5 });
    expect(spent.endStock).toBeLessThanOrEqual(pj.endStock);
  });
});
