import { describe, expect, it } from 'vitest';
import { hexNeighbors } from '@aoh/game-engine';
// @ts-expect-error plain .mjs driver without types
import { foodProjection, playMatch } from '../scripts/lib/alpha-bots.mjs';

type Tile = { id: string; q: number; r: number; terrain: string };
type Unit = { id: string; ownerId: string; kind: string; hexId: string; recruitedRound?: number };
type Scenario = { core: { round: number; players: { id: string; civilization: { cities: { hexId: string }[] } }[]; map: Tile[] }; wars: string[][]; units: Unit[]; players: { knownHexIds: string[] }[] };

// V51B-16: the bots must be able to reach and win an organic battle. A defender preview carries no `total`, and a bot that read it got NaN and never attacked.
describe('bot military policy', () => {
  it('a warrior at war with an undefended neighbour attacks and takes the city (policy, not geometry: the Pátrias are far apart now)', () => {
    let placed = false;
    const result = playMatch({ seed: 2, players: 2, rounds: 14, personas: ['warrior', 'warrior'], scenario: (box: { state: Scenario }, hook: string) => {
      const st = box.state;
      if (hook !== 'round-start' || st.core.round !== 10 || placed) return;
      placed = true;
      const a = st.core.players[0]!, b = st.core.players[1]!, target = b.civilization.cities[0]!, centre = st.core.map.find((t: Tile) => t.id === target.hexId)!;
      st.wars.push([a.id, b.id]);
      st.units = st.units.filter((u: Unit) => !(u.ownerId === b.id && ['INFANTRY', 'GUARD', 'RANGED', 'CAVALRY', 'SIEGE'].includes(u.kind)));
      const spot = hexNeighbors(centre).map((p: { q: number; r: number }) => st.core.map.find((t: Tile) => t.q === p.q && t.r === p.r)).find((t): t is Tile => !!t && !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain) && !st.units.some((u: Unit) => u.hexId === t.id))!;
      ['INFANTRY', 'INFANTRY', 'INFANTRY'].forEach((kind, i) => st.units.push({ id: `pv-${i}`, ownerId: a.id, kind, hexId: spot.id, recruitedRound: 10 }));
      for (const seat of st.players) seat.knownHexIds = [...new Set([...seat.knownHexIds, spot.id, target.hexId])];
    } });
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
