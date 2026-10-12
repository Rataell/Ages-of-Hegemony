import { describe, expect, it } from 'vitest';
import { governBlock, governCity, governCost, governQuote, urbanBlock, urbanCost, urbanOptions } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { apply, freshGame, meta, plan, seat, shape, urban, P1 } from './v12-audit-urban-helpers.js';
import { completeRound } from './alpha-rounds.js';

/**
 * D4 (owner decision): Governar with an explicit choice inside the city's REAL reach. The engine computes the reach, the total cost per number of levels,
 * the blockers and the emergency option (`UrbanOption.govern`); the client never recalculates. These tests pin: the reach in Revolta (G1), the total cost
 * of several levels (G2), the plan that consumed the stock (G3), the no-op that spends an activation (G6), the explicit `levels`, the resolution message and
 * "applied == predicted".
 */

/** A Vila with Capacidade 2, Ânimo `mood`, the stock given and a Republic (every level is paid; the Conselho's free first level is tested apart). */
function village(mood: number, stock: Partial<ReturnType<typeof seat>['resources']> = {}, government: string = 'REPUBLIC') {
  const state = freshGame();
  shape(state, 'VILLAGE', 6, { producers: 2, unassigned: 4 });
  state.core.players.find(player => player.id === P1)!.civilization.cities[0]!.workedHexIds = [];
  meta(state).mood = mood;
  state.core.players.find(player => player.id === P1)!.civilization.government = government as never;
  Object.assign(seat(state).resources, { culture: 0, wealth: 0, stone: 0 }, stock);
  return state;
}
const govern = (state: ReturnType<typeof village>) => urbanOptions(state, P1).cities[meta(state).cityId]!.find(option => option.action === 'PROMOTE_MOOD')!;

describe('D4 · G1 · the reach is the real one, also in Revolta', () => {
  it('Revolta (Ânimo 1) with Capacidade 2: the option, its text and the projection say 2 levels, not "até 0"', () => {
    const state = village(1, { culture: 5 });
    expect(urbanOptions(state, P1).cities[meta(state).cityId]!.find(option => option.action === 'PRODUCE')!.effect).toContain('Capacidade 0'); // Produzir really is 0 in Revolta
    const option = govern(state);
    expect(option.govern).toMatchObject({ mood: 1, maxLevels: 2, moodRoom: 5, capacityLevels: 2, limitedBy: 'CAPACITY', blockers: [] });
    expect(option.effect).toContain('até 2 nível(is)');
    expect(option.effect).not.toContain('até 0');
    expect(option.blocked).toBeNull();
    const view = alphaPlayerView(state, P1)!;
    expect(view.cityStates.find(city => city.cityId === meta(state).cityId)).toMatchObject({ capacity: 0, governCeiling: 2 });
    expect(view.urban.cities[meta(state).cityId]!.find(entry => entry.action === 'PROMOTE_MOOD')!.govern!.maxLevels).toBe(2);
  });
  it('the Ânimo room limits it too: Ânimo 5 reaches only 1 level; the text says so', () => {
    const option = govern(village(5, { culture: 5 }));
    expect(option.govern).toMatchObject({ maxLevels: 1, moodRoom: 1, limitedBy: 'MOOD' });
    expect(option.effect).toContain('até 1 nível(is)');
  });
  it('the resources limit it and the text names the difference', () => {
    const option = govern(village(2, { culture: 1, wealth: 1 }));
    expect(option.govern).toMatchObject({ maxLevels: 1, limitedBy: 'RESOURCES' });
    expect(option.effect).toContain('até 1 nível(is) com seus recursos (a Capacidade e o Ânimo permitiriam 2)');
  });
});

describe('D4 · G2 · the cost is the TOTAL of the levels, in the order the engine charges', () => {
  const costs = (state: ReturnType<typeof village>) => govern(state).govern!.levels.map(({ levels, moodAfter, costCulture, costWealth }) => ({ levels, moodAfter, costCulture, costWealth }));
  it('only Cultura: 1 and 2 Cultura', () => expect(costs(village(2, { culture: 3 }))).toEqual([{ levels: 1, moodAfter: 3, costCulture: 1, costWealth: 0 }, { levels: 2, moodAfter: 4, costCulture: 2, costWealth: 0 }]));
  it('only Riqueza: 2 and 4 Riqueza', () => expect(costs(village(2, { wealth: 6 }))).toEqual([{ levels: 1, moodAfter: 3, costCulture: 0, costWealth: 2 }, { levels: 2, moodAfter: 4, costCulture: 0, costWealth: 4 }]));
  it('mixed: the Cultura goes first, the second level falls back to 2 Riqueza', () => expect(costs(village(2, { culture: 1, wealth: 2 }))).toEqual([{ levels: 1, moodAfter: 3, costCulture: 1, costWealth: 0 }, { levels: 2, moodAfter: 4, costCulture: 1, costWealth: 2 }]));
  it('a level the stock cannot pay is not offered (Cultura 1 + Riqueza 1 reaches 1 level)', () => expect(costs(village(2, { culture: 1, wealth: 1 }))).toHaveLength(1));
  it('the option cost is the total of the default (maximum) choice and matches governCost', () => {
    const state = village(2, { culture: 1, wealth: 2 });
    expect(govern(state).cost).toMatchObject({ culture: 1, wealth: 2 });
    expect(governCost(state, P1, 2)).toMatchObject({ culture: 1, wealth: 2 });
    expect(governCost(state, P1)).toMatchObject({ culture: 1, wealth: 0 }); // the legacy one-level reading
    expect(urbanCost(state, P1, meta(state).cityId, 'PROMOTE_MOOD', { levels: 1 })).toMatchObject({ culture: 1, wealth: 0 });
  });
  it('the Conselho makes the first level free', () => {
    const state = village(2, { wealth: 2 }, 'PROTO_GOVERNANCE');
    const levels = govern(state).govern!.levels;
    expect(levels.map(level => [level.costCulture, level.costWealth])).toEqual([[0, 0], [0, 2]]);
  });
  it('the Pedra of the fortification repair is part of the total, and the Pedra is shown per choice', () => {
    const state = village(2, { culture: 2, stone: 3 });
    meta(state).fortification = { ...meta(state).fortification, state: 'DAMAGED' };
    const levels = govern(state).govern!.levels;
    expect(levels.map(level => level.stoneRepair)).toEqual([1, 1]);
    expect(govern(state).cost).toMatchObject({ culture: 2, stone: 1 });
  });
});

describe('D4 · explicit levels', () => {
  const planned = (state: ReturnType<typeof village>, extra: Record<string, unknown> = {}) => plan(state, [urban(meta(state).cityId, 'PROMOTE_MOOD', extra)]);
  it('levels 1 of 2: recovers and pays one level only', () => {
    const outcome = planned(village(2, { culture: 3 }), { levels: 1 });
    expect(outcome.failures).toEqual([]);
    expect(seat(outcome.after).resources.culture).toBe(2);
    expect(meta(outcome.after).mood).toBe(3);
  });
  it('without levels it behaves as before: as many as the reach allows', () => {
    const outcome = planned(village(2, { culture: 3 }));
    expect(seat(outcome.after).resources.culture).toBe(1);
    expect(meta(outcome.after).mood).toBe(4);
  });
  it('levels above the reach is refused while planning, with the reason (Capacidade, Ânimo, resources)', () => {
    expect(planned(village(2, { culture: 9 }), { levels: 3 }).refused[0]!.message).toContain('Capacidade');
    expect(planned(village(5, { culture: 9 }), { levels: 2 }).refused[0]!.message).toContain('só cabem 1 nível');
    const poor = planned(village(2, { culture: 1, wealth: 1 }), { levels: 2 });
    expect(poor.refused[0]!.message).toContain('Governar 2 nível(is) custa 1 Cultura + 2 Riqueza: faltam 1 Riqueza');
    expect(poor.accepted).toEqual([]);
  });
  it('the schema bounds levels to 1..6 and the engine runs the check too', () => {
    const state = village(2, { culture: 9 });
    expect(apply(state, urban(meta(state).cityId, 'PROMOTE_MOOD', { levels: 0 })).ok).toBe(false);
    expect(apply(state, urban(meta(state).cityId, 'PROMOTE_MOOD', { levels: 7 })).ok).toBe(false);
    expect(() => governCity(structuredClone(state), P1, meta(state).cityId, 3)).toThrow(/Capacidade/);
    expect(governBlock(state, P1, meta(state).cityId, 2)).toBeNull();
  });
  it('levels is accepted only by Governar', () => {
    const state = village(2, { culture: 9 });
    expect(apply(state, urban(meta(state).cityId, 'PRODUCE', { levels: 1 })).ok).toBe(false);
  });
});

describe('D4 · G6 · an action with no real effect cannot be confirmed', () => {
  it('Ânimo 6 with an intact fortification: blocked (as before)', () => {
    const state = village(6, { culture: 3, stone: 3 });
    expect(urbanBlock(state, P1, meta(state).cityId, 'PROMOTE_MOOD')).toContain('Próspera e íntegra');
    expect(govern(state).govern!.blockers.map(blocker => blocker.code)).toEqual(['MOOD_FULL']);
  });
  it('Ânimo 6 with a DAMAGED fortification and no Pedra: blocked, naming the Pedra; the projection says why', () => {
    const state = village(6, { culture: 3, stone: 0 });
    meta(state).fortification = { ...meta(state).fortification, state: 'DAMAGED' };
    expect(urbanBlock(state, P1, meta(state).cityId, 'PROMOTE_MOOD')).toMatch(/falta Pedra.*você tem 0/);
    expect(apply(state, urban(meta(state).cityId, 'PROMOTE_MOOD')).ok).toBe(false);
    expect(govern(state).govern!.blockers[0]).toMatchObject({ code: 'REPAIR_NO_STONE', missing: { resource: 'stone', amount: 1 } });
  });
  it('Ânimo 6 with a DAMAGED fortification and 1 Pedra: allowed as a repair, no levels, 1 Pedra charged', () => {
    const state = village(6, { stone: 1 });
    meta(state).fortification = { ...meta(state).fortification, state: 'DAMAGED' };
    expect(govern(state).govern).toMatchObject({ repairOnly: true, maxLevels: 0, blockers: [] });
    expect(govern(state).cost).toMatchObject({ stone: 1, culture: 0, wealth: 0 });
    const outcome = plan(state, [urban(meta(state).cityId, 'PROMOTE_MOOD')]);
    expect(outcome.failures).toEqual([]);
    expect(meta(outcome.after).fortification.state).toBe('INTACT');
    expect(seat(outcome.after).resources.stone).toBe(0);
  });
  it('no level payable: the blocker names what is missing (and keeps the "Governar custa" wording)', () => {
    const state = village(2, { culture: 0, wealth: 1 });
    expect(urbanBlock(state, P1, meta(state).cityId, 'PROMOTE_MOOD')).toBe('Governar custa 1 Cultura ou 2 Riqueza por nível de Ânimo: faltam 1 Riqueza (ou 1 Cultura); você tem 0 Cultura e 1 Riqueza.');
    expect(govern(state).govern!.blockers[0]).toMatchObject({ code: 'NO_RESOURCE', missing: { resource: 'wealth', amount: 1 } });
  });
});

describe('D4 · G3 · the plan that already spent the stock is seen while planning', () => {
  it('[Governar 1 nível, Governar] with Cultura for one: the second is refused while planning, naming the first', () => {
    const state = village(4, { culture: 1 });                 // Estável: two activations
    const id = meta(state).cityId;
    const first = apply(state, urban(id, 'PROMOTE_MOOD', { levels: 1 }));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const blocked = urbanBlock(first.value, P1, id, 'PROMOTE_MOOD');
    expect(blocked).toContain('Cultura/Riqueza insuficiente na resolução');
    expect(blocked).toContain('Planos anteriores desta rodada: Governar em');
    expect(blocked).toContain('gasta 1 Cultura');
    const second = apply(first.value, urban(id, 'PROMOTE_MOOD'));
    expect(second).toMatchObject({ ok: false });
    // the projection carries it, as a PLANNED blocker, and the Ordem is not wasted
    const option = urbanOptions(first.value, P1).cities[id]!.find(entry => entry.action === 'PROMOTE_MOOD')!;
    expect(option.blocked).toBe(blocked);
    expect(option.govern!.blockers.map(blocker => blocker.code)).toContain('PLANNED');
    const outcome = plan(state, [urban(id, 'PROMOTE_MOOD', { levels: 1 }), urban(id, 'PROMOTE_MOOD')]);
    expect(outcome.failures).toEqual([]);
    expect(outcome.refused).toHaveLength(1);
  });
  it('the levels offered after an earlier plan are those the remaining stock pays', () => {
    const state = village(4, { culture: 2 });
    const first = apply(state, urban(meta(state).cityId, 'PROMOTE_MOOD', { levels: 1 }));
    if (!first.ok) throw new Error(first.error.message);
    const option = urbanOptions(first.value, P1).cities[meta(state).cityId]!.find(entry => entry.action === 'PROMOTE_MOOD')!;
    expect(option.govern).toMatchObject({ mood: 5, moodNow: 4, maxLevels: 1 });
  });
  it('at resolution, when a plan still fails, the message names the resource and the plans that ran before', () => {
    const state = village(4, { culture: 2 });
    const id = meta(state).cityId;
    const first = apply(state, urban(id, 'PROMOTE_MOOD', { levels: 1 }));
    if (!first.ok) throw new Error(first.error.message);
    const second = apply(first.value, urban(id, 'PROMOTE_MOOD', { levels: 1 }));
    if (!second.ok) throw new Error(second.error.message);
    const current = second;
    seat(current.value).resources.culture = 1;               // the stock shrinks after both were accepted (anything outside the player's plans)
    const round = current.value.core.round;
    const after = completeRound({ ...current.value, roundLedgers: [] });
    const failure = after.events.find(event => event.round === round && event.type === 'ACTION_FAILED')!;
    expect(failure.message).toContain('Governar custa 1 Cultura ou 2 Riqueza');
    expect(failure.message).toContain('Planos anteriores desta rodada já resolvidos');
    expect(failure.message).toContain('governou: 1 nível(is)');
  });
});

describe('D4 · emergency recovery is untouched', () => {
  it('Revolta without Cultura nor Riqueza: Governar is blocked by the stock, the emergency is offered and goes to Ânimo 4', () => {
    const state = village(1, { culture: 0, wealth: 0 });
    const option = govern(state);
    expect(option.blocked).toContain('Governar custa');
    expect(option.govern!.emergency).toEqual({ available: true, moodAfter: 4, reason: null });
    const emergency = urbanOptions(state, P1).cities[meta(state).cityId]!.find(entry => entry.action === 'EMERGENCY_GOVERN')!;
    expect(emergency.blocked).toBeNull();
    expect(emergency.cost).toMatchObject({ culture: 0, wealth: 0 });
    const outcome = plan(state, [urban(meta(state).cityId, 'EMERGENCY_GOVERN')]);
    expect(outcome.failures).toEqual([]);
    expect(meta(outcome.after).revoltEmergencyRound).toBe(1);
  });
  it('outside Revolta the projection says the emergency is not available, with the engine reason', () => {
    expect(govern(village(3, { culture: 2 })).govern!.emergency).toMatchObject({ available: false, moodAfter: 4, reason: 'A recuperação emergencial só existe para uma cidade em Revolta.' });
  });
});

describe('D4 · applied == predicted, and the resolution message says it', () => {
  for (const [label, mood, stock, damaged] of [
    ['Cultura', 2, { culture: 3 }, false], ['Riqueza', 2, { wealth: 6 }, false], ['mista com reparo', 1, { culture: 1, wealth: 4, stone: 2 }, true], ['Revolta', 0, { culture: 5, stone: 1 }, true],
  ] as const) {
    it(`${label}: each offered choice is applied exactly as projected`, () => {
      const base = village(mood, stock);
      if (damaged) meta(base).fortification = { ...meta(base).fortification, state: 'DAMAGED' };
      const predicted = govern(base).govern!.levels;
      expect(predicted.length).toBeGreaterThan(0);
      for (const level of predicted) {
        const state = structuredClone(base);
        const before = { ...seat(state).resources };
        const result = governCity(state, P1, meta(state).cityId, level.levels);
        expect(meta(state).mood).toBe(level.moodAfter);
        expect(result).toMatchObject({ levels: level.levels, moodBefore: mood, moodAfter: level.moodAfter });
        expect(before.culture - seat(state).resources.culture).toBe(level.costCulture);
        expect(before.wealth - seat(state).resources.wealth).toBe(level.costWealth);
        expect(before.stone - seat(state).resources.stone).toBe(level.stoneRepair ?? 0);
        expect(governQuote(base, P1, meta(base).cityId).levels).toEqual(predicted);
      }
    });
  }
  it('the event of the resolution reads levels, Ânimo before→after and the cost paid', () => {
    const state = village(2, { culture: 1, wealth: 2 });
    const outcome = plan(state, [urban(meta(state).cityId, 'PROMOTE_MOOD')]);
    const round = state.core.round;
    const message = outcome.after.events.filter(event => event.round === round && event.type === 'URBAN_ACTION' && (event.audience ?? []).includes(P1)).map(event => event.message).join(' | ');
    expect(message).toMatch(/governou: 2 nível\(is\), Ânimo 2→4; pagou 1 Cultura \+ 2 Riqueza\./);
    const resolution = outcome.after.resolutionEvents.find(event => event.round === round && event.cityId === meta(state).cityId);
    expect(resolution?.message).toMatch(/Ânimo 2→4; pagou 1 Cultura \+ 2 Riqueza/);
  });
  it('a free level says "sem custo"', () => {
    const state = village(2, {}, 'PROTO_GOVERNANCE');
    const outcome = plan(state, [urban(meta(state).cityId, 'PROMOTE_MOOD')]);
    const message = outcome.after.events.filter(event => event.round === 1 && event.type === 'URBAN_ACTION').map(event => event.message).join(' | ');
    expect(message).toMatch(/governou: 1 nível\(is\), Ânimo 2→3; sem custo\./);
  });
});
