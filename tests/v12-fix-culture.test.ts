import { describe, expect, it } from 'vitest';
import { alphaCanAfford, alphaPay, governCost, urbanBlock, urbanCost } from '@aoh/game-engine';
import { emptyAlphaResourcePool } from '@aoh/game-domain';
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
