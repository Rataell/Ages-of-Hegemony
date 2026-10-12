import { describe, expect, it } from 'vitest';
import { alphaCanAfford, alphaPay, governCost, urbanBlock, urbanCost } from '@aoh/game-engine';
import { emptyAlphaResourcePool } from '@aoh/game-domain';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { apply, freshGame, meta, plan, seat, shape, urban, P1 } from './v12-audit-urban-helpers.js';

/**
 * Alpha V1.2 · E-7 (BUG): a cost in Cultura was shown but never validated nor debited (`alphaCanAfford` and `alphaPay` ignored
 * `culture`), so Governar paid with Cultura was free and Cultura never went down. The ledger of the round report is the legacy
 * five-resource shape and cannot represent Cultura, so this suite is the independent accounting: it reads the pool before and after.
 */
const cost = (culture: number) => ({ ...emptyAlphaResourcePool(), culture });

describe('E-7 · Cultura is validated and debited by the shared payment path', () => {
  for (const culture of [0, 1, 2]) {
    it(`Cultura ${culture}: affordability of a 1-Cultura cost is exactly "culture >= 1"`, () => {
      const state = freshGame();
      Object.assign(seat(state).resources, { culture, wealth: 20 }); // Riqueza never substitutes Cultura
      expect(alphaCanAfford(state, P1, cost(1))).toBe(culture >= 1);
    });
  }

  it('paying a Cultura cost removes exactly that Cultura and nothing else', () => {
    const state = freshGame();
    Object.assign(seat(state).resources, { culture: 2, wealth: 5, food: 7 });
    const before = { ...seat(state).resources };
    alphaPay(state, P1, cost(1));
    expect(seat(state).resources).toEqual({ ...before, culture: 1 });
  });

  it('paying a Cultura cost the civilization cannot afford is refused and changes nothing', () => {
    const state = freshGame();
    Object.assign(seat(state).resources, { culture: 0, wealth: 20 });
    const before = { ...seat(state).resources };
    expect(() => alphaPay(state, P1, cost(1))).toThrow('Recursos insuficientes');
    expect(seat(state).resources).toEqual(before);
  });

  it('the legacy-shaped cost (materials) still never touches Cultura', () => {
    const state = freshGame();
    Object.assign(seat(state).resources, { culture: 2, wood: 5 });
    alphaPay(state, P1, { food: 0, materials: 2, wealth: 0, knowledge: 0, influence: 0 });
    expect(seat(state).resources.culture).toBe(2);
  });
});

describe('E-7 · Governar spends the Cultura it shows', () => {
  const mood2 = (culture: number, wealth: number) => {
    const state = freshGame();
    shape(state, 'OUTPOST', 3, { producers: 1, unassigned: 2 });
    meta(state).mood = 2;                                   // Abalada: Governar has Ânimo to recover (capacity 1 → one level per activation)
    // The founding government (Conselho) makes the first level of Governar free; a Republic pays every level, so the cost is observable.
    state.core.players.find(player => player.id === P1)!.civilization.government = 'REPUBLIC';
    Object.assign(seat(state).resources, { culture, wealth });
    return state;
  };

  it('the displayed cost is 1 Cultura while there is Cultura, 2 Riqueza when there is none', () => {
    expect(governCost(mood2(1, 10), P1)).toMatchObject({ culture: 1, wealth: 0 });
    expect(governCost(mood2(0, 10), P1)).toMatchObject({ culture: 0, wealth: 2 });
  });

  it('displayed and applied agree: the Cultura shown is the Cultura debited (Cultura 2 → 1)', () => {
    const state = mood2(2, 0);
    const shown = urbanCost(state, P1, meta(state).cityId, 'PROMOTE_MOOD');
    const done = plan(state, [urban(meta(state).cityId, 'PROMOTE_MOOD')]).after;
    expect(done.events.some(event => event.type === 'ACTION_FAILED')).toBe(false);
    expect(seat(done).resources.culture).toBe(2 - shown.culture);
    expect(meta(done).mood).toBeGreaterThan(2);
  });

  it('Cultura 1: pays with the Cultura, then the next Governar falls back to Riqueza and is blocked without it', () => {
    let state = mood2(1, 0);
    expect(urbanBlock(state, P1, meta(state).cityId, 'PROMOTE_MOOD')).toBeNull();
    state = plan(state, [urban(meta(state).cityId, 'PROMOTE_MOOD')]).after;
    expect(seat(state).resources.culture).toBe(0);
    meta(state).mood = 2;                                   // the city is back to Abalada
    expect(urbanBlock(state, P1, meta(state).cityId, 'PROMOTE_MOOD')).toMatch(/Governar custa/);
    expect(apply(state, urban(meta(state).cityId, 'PROMOTE_MOOD')).ok).toBe(false);
  });

  it('Cultura 0 with Riqueza 2 pays the Riqueza and keeps Cultura at 0', () => {
    const state = mood2(0, 2);
    const done = plan(state, [urban(meta(state).cityId, 'PROMOTE_MOOD')]).after;
    expect(seat(done).resources).toMatchObject({ culture: 0, wealth: 0 });
    expect(meta(done).mood).toBeGreaterThan(2);
  });

  it('successive Governar over rounds spends one Cultura per level until the Cultura is gone', () => {
    let state = mood2(2, 0);
    const levels: number[] = [];
    for (let round = 0; round < 3; round++) {
      meta(state).mood = 2;
      const blocked = urbanBlock(state, P1, meta(state).cityId, 'PROMOTE_MOOD');
      if (blocked) { levels.push(-1); continue; }
      state = plan(state, [urban(meta(state).cityId, 'PROMOTE_MOOD')]).after;
      levels.push(seat(state).resources.culture);
    }
    expect(levels).toEqual([1, 0, -1]);                     // 2 → 1 → 0 → blocked (no Riqueza to fall back on)
  });
});

describe('E-7 · Cultura and Riqueza together, and what the client is sent', () => {
  const village = (culture: number, wealth: number) => {
    const state = freshGame();
    shape(state, 'VILLAGE', 6, { producers: 2, unassigned: 4 });                    // Capacidade 2: Governar can pay two levels
    coreCityHexes(state);
    meta(state).mood = 2;
    Object.assign(seat(state).resources, { culture, wealth });
    state.core.players.find(player => player.id === P1)!.civilization.government = 'REPUBLIC';
    return state;
  };
  const coreCityHexes = (state: ReturnType<typeof freshGame>) => { state.core.players.find(player => player.id === P1)!.civilization.cities[0]!.workedHexIds = []; };

  it('the cost shown prefers Cultura while there is Cultura, then Riqueza; every level is charged in that order', () => {
    // Cultura 1 + Riqueza 2: level 1 uses the Cultura, level 2 falls back to the 2 Riqueza.
    const done = plan(village(1, 2), [urban(meta(village(1, 2)).cityId, 'PROMOTE_MOOD')]).after;
    expect(seat(done).resources).toMatchObject({ culture: 0, wealth: 0 });
    expect(meta(done).mood).toBe(4);
    // Cultura 2 + Riqueza 2: both levels in Cultura, the Riqueza stays.
    const both = plan(village(2, 2), [urban(meta(village(2, 2)).cityId, 'PROMOTE_MOOD')]).after;
    expect(seat(both).resources).toMatchObject({ culture: 0, wealth: 2 });
    // Cultura 0 + Riqueza 4: 2 + 2 Riqueza.
    const gold = plan(village(0, 4), [urban(meta(village(0, 4)).cityId, 'PROMOTE_MOOD')]).after;
    expect(seat(gold).resources).toMatchObject({ culture: 0, wealth: 0 });
    // Cultura 1 + Riqueza 1: the second level cannot be paid (2 Riqueza needed), so Governar stops after one level and keeps the Riqueza.
    const short = plan(village(1, 1), [urban(meta(village(1, 1)).cityId, 'PROMOTE_MOOD')]).after;
    expect(seat(short).resources).toMatchObject({ culture: 0, wealth: 1 });
    expect(meta(short).mood).toBe(3);
  });

  it('the client is sent the Cultura cost and the blocked reason; a Cultura cost is never reported as affordable with Riqueza alone', () => {
    const state = village(0, 10);
    const view = alphaPlayerView(state, P1)!;
    const option = view.urban.cities[meta(state).cityId]!.find(entry => entry.action === 'PROMOTE_MOOD')!;
    expect(option.cost).toMatchObject({ culture: 0, wealth: 4 });                    // no Cultura: the shown price is the Riqueza one, for the two levels (D4: the TOTAL the activation charges)
    const rich = village(3, 0);
    const richOption = alphaPlayerView(rich, P1)!.urban.cities[meta(rich).cityId]!.find(entry => entry.action === 'PROMOTE_MOOD')!;
    expect(richOption.cost).toMatchObject({ culture: 2, wealth: 0 });
    expect(richOption.blocked).toBeNull();
    const none = village(0, 0);
    expect(alphaPlayerView(none, P1)!.urban.cities[meta(none).cityId]!.find(entry => entry.action === 'PROMOTE_MOOD')!.blocked).toMatch(/Governar custa/);
  });

  it('the legacy five-resource ledger cannot hold Cultura: the round report still balances while Cultura moves (independent accounting is the pool diff above)', () => {
    const state = village(2, 0);
    const done = plan(state, [urban(meta(state).cityId, 'PROMOTE_MOOD')]).after;      // READY would fail with INVALID_STATE if the report arithmetic broke
    const report = done.roundReports.find(entry => entry.playerId === P1 && entry.round === 1)!;
    expect(Object.keys(report.expenses)).not.toContain('culture');
    expect(seat(state).resources.culture - seat(done).resources.culture).toBe(2);
  });
});
