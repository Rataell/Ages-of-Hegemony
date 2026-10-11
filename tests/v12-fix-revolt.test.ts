import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, orderTypeForPlanned, type AlphaState } from '@aoh/game-domain';
import { REVOLT_EMERGENCY_MOOD, alphaActionUsage, cityActivations, emergencyGovernBlock, rearmRevoltEmergency, urbanBlock, urbanCost } from '@aoh/game-engine';
import { completeRound } from './alpha-rounds.js';
import { apply, coreCity, freshGame, meta, plan, seat, shape, urban, P1 } from './v12-audit-urban-helpers.js';

/**
 * Alpha V1.2 · E-1: emergency recovery from Revolta. A city in Revolta cannot produce, and normal Governar needs Cultura or Riqueza that only producing
 * brings: a famine could leave a civilization with no way back. EMERGENCY_GOVERN: one Ordem and one activation, no Cultura or Riqueza, only in Revolta, once
 * per episode, Ânimo 4. It never produces, feeds or repairs. Experiment with the real maintenance: scripts/alpha-revolt-recovery.mjs.
 */
interface Scenario { food: number; land: number }
const revoltCity = (sc: Scenario = { food: 15, land: 0 }) => {
  const state = freshGame();
  shape(state, 'VILLAGE', 6, { producers: 2, unassigned: 4 });
  coreCity(state).workedHexIds = [];
  meta(state).mood = 1;
  Object.assign(seat(state).resources, { food: sc.food, wealth: 0, culture: 0 });   // nothing to pay normal Governar with
  state.core.players.find(player => player.id === P1)!.civilization.government = 'REPUBLIC';   // no free first level of Governar
  state.units = state.units.filter(unit => unit.ownerId !== P1 || unit.kind === 'PIONEER');
  for (let i = 0; i < sc.land; i++) state.units.push({ id: `t-land-${i}`, ownerId: P1, kind: 'INFANTRY', hexId: coreCity(state).hexId, recruitedRound: 1 } as never);
  return state;
};
const emergency = (state: AlphaState) => urban(meta(state).cityId, 'EMERGENCY_GOVERN');
const band = (mood: number) => mood <= 1 ? 'REVOLT' : mood <= 3 ? 'SHAKEN' : mood === 4 ? 'STABLE' : 'PROSPEROUS';

describe('E-1 · who can use it, and what it costs', () => {
  it('exists only for a city in Revolta, and only for the owner', () => {
    for (const mood of [2, 3, 4, 5, 6]) {
      const state = revoltCity(); meta(state).mood = mood;
      expect(urbanBlock(state, P1, meta(state).cityId, 'EMERGENCY_GOVERN'), `Ânimo ${mood}`).toBe('A recuperação emergencial só existe para uma cidade em Revolta.');
    }
    for (const mood of [0, 1]) { const state = revoltCity(); meta(state).mood = mood; expect(urbanBlock(state, P1, meta(state).cityId, 'EMERGENCY_GOVERN'), `Ânimo ${mood}`).toBeNull(); }
    const state = revoltCity();
    expect(emergencyGovernBlock(state, P1, 'city-that-is-not-mine')).toBe('Escolha uma cidade própria.');
  });

  it('is offered with a zero cost; normal Governar in the same city keeps its cost and stays out of reach without Cultura or Riqueza', () => {
    const state = revoltCity();
    expect(urbanCost(state, P1, meta(state).cityId, 'EMERGENCY_GOVERN')).toEqual({ food: 0, wood: 0, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0, culture: 0 });
    expect(urbanBlock(state, P1, meta(state).cityId, 'PROMOTE_MOOD')).toMatch(/Governar custa/);
    expect(urbanCost(state, P1, meta(state).cityId, 'PROMOTE_MOOD')).toMatchObject({ wealth: 2 });
  });

  it('takes one Ordem (CITY, not Avanço) and the city\'s only activation, and nothing else from the treasury', () => {
    let state = revoltCity();
    const before = alphaActionUsage(state, P1).used, pool = { ...seat(state).resources };
    const planned = apply(state, emergency(state));
    expect(planned.ok, planned.ok ? '' : planned.error.message).toBe(true);
    state = planned.ok ? planned.value : state;
    expect(alphaActionUsage(state, P1).used).toBe(before + 1);
    expect(orderTypeForPlanned(seat(state).plannedActions[0]!)).toBe('CITY');
    expect(cityActivations(state, P1, meta(state).cityId)).toMatchObject({ allowed: 1, count: 1, left: 0 });
    expect(seat(state).resources).toEqual(pool);                       // planning reserves, never pays
    const after = plan(revoltCity(), [emergency(state)]).after;
    expect(after.events.some(event => event.type === 'ACTION_FAILED')).toBe(false);
    expect(seat(after).resources.culture).toBe(0);
    expect(seat(after).resources.wealth).toBe(0);                      // no Cultura or Riqueza spent or gained
    const ledger = after.roundReports.filter(report => report.playerId === P1).at(-1)!;
    // The only Alimento spent is the growth of a fed city (Crescer, 3), a maintenance step; the action itself spends nothing.
    expect(ledger.expenses).toEqual({ food: 3, materials: 0, wealth: 0, knowledge: 0, influence: 0 });
    expect(ledger.production).toEqual({ food: 0, materials: 0, wealth: 0, knowledge: 0, influence: 0 });   // no automatic production
  });

  it('refuses a second action in the same city that round (Revolta has one activation), and the city still cannot Produzir', () => {
    const state = revoltCity();
    const first = apply(state, emergency(state)); expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(apply(first.value, urban(meta(state).cityId, 'PRODUCE')).ok).toBe(false);
    expect(urbanBlock(state, P1, meta(state).cityId, 'PRODUCE')).toMatch(/Revolta/);
  });
});

describe('E-1 · what it does, and what the maintenance does to it afterwards', () => {
  it('leaves the city Estável (4) when nothing goes wrong, records the episode, and Produzir works the next round', () => {
    const done = plan(revoltCity({ food: 15, land: 0 }), [emergency(revoltCity())]).after;
    expect(meta(done).mood).toBe(REVOLT_EMERGENCY_MOOD);
    expect(meta(done).revoltEmergencyRound).toBe(1);
    expect(done.core.round).toBe(2);
    expect(urbanBlock(done, P1, meta(done).cityId, 'PRODUCE')).toBeNull();
  });

  // The real maintenance of the round, with the faults of the audit: famine, pieces without upkeep, both. (scripts/alpha-revolt-recovery.mjs also covers Sobre-extensão.)
  const cases: { name: string; sc: Scenario; mood: number; produces: boolean }[] = [
    { name: 'famine (no Alimento)', sc: { food: 0, land: 0 }, mood: 3, produces: true },
    { name: 'pieces without upkeep (Alimento for the city, not for the army)', sc: { food: 3, land: 4 }, mood: 3, produces: true },
    { name: 'famine AND pieces without upkeep', sc: { food: 0, land: 4 }, mood: 2, produces: true },
  ];
  for (const { name, sc, mood, produces } of cases) {
    it(`${name}: ends Abalada at ${mood} and can still plan Produzir the next round (Ânimo 4 is enough; 3 would not be for the double fault)`, () => {
      const start = revoltCity(sc);
      const done = plan(start, [emergency(start)]).after;
      expect(meta(done).mood).toBe(mood);
      expect(band(meta(done).mood)).not.toBe('REVOLT');
      expect(urbanBlock(done, P1, meta(done).cityId, 'PRODUCE') === null).toBe(produces);
    });
  }

  it('does not make the city immune to famine: the population still falls, and a city that does not Produzir falls back', () => {
    const start = revoltCity({ food: 0, land: 0 });
    const done = plan(start, [emergency(start)]).after;
    expect(coreCity(done).population).toBe(5);                          // 6 → 5: the famine of that round still hits
    expect(meta(done).revoltEmergencyRound).toBe(1);
  });
});

describe('E-1 · once per episode: leaving Revolta for an instant does not repeat the benefit', () => {
  const used = (round: number, mood: number) => { const state = revoltCity(); state.core.round = round + 1; meta(state).revoltEmergencyRound = round; meta(state).mood = mood; return state; };

  it('a second Revolta right after is refused with the Governar-normal hint', () => {
    const state = used(1, 1);
    expect(urbanBlock(state, P1, meta(state).cityId, 'EMERGENCY_GOVERN')).toMatch(/já foi usada neste episódio/);
  });

  it('closing the SAME round Estável does not re-arm it; closing a LATER round Estável does', () => {
    const sameRound = used(1, 4); sameRound.core.round = 1; rearmRevoltEmergency(sameRound);
    expect(meta(sameRound).revoltEmergencyRound).toBe(1);
    const later = used(1, 4); rearmRevoltEmergency(later);
    expect(meta(later).revoltEmergencyRound).toBeNull();
  });

  it('a city that never got back to Estável stays spent however many rounds pass (Abalada is not the end of the episode)', () => {
    for (const mood of [0, 1, 2, 3]) { const state = used(1, mood); state.core.round = 9; rearmRevoltEmergency(state); expect(meta(state).revoltEmergencyRound, `Ânimo ${mood}`).toBe(1); }
  });

  it('across real rounds: spent in round 1, still spent when the city falls back in round 2, available again only after a later round closed Estável', () => {
    let state = plan(revoltCity({ food: 15, land: 0 }), [emergency(revoltCity())]).after;   // round 1: Revolta → 4, round 2 opens
    expect(meta(state).revoltEmergencyRound).toBe(1);
    meta(state).mood = 1;                                                                    // the city falls again before it stabilised
    expect(urbanBlock(state, P1, meta(state).cityId, 'EMERGENCY_GOVERN')).toMatch(/já foi usada/);
    meta(state).mood = 4;                                                                    // it recovered by itself and stays Estável through round 2's maintenance
    seat(state).resources.food = 15;
    state = completeRound({ ...state, roundLedgers: [] } as AlphaState);
    expect(meta(state).mood).toBeGreaterThanOrEqual(4);
    expect(meta(state).revoltEmergencyRound).toBeNull();                                     // re-armed: the next Revolta is a new episode
    meta(state).mood = 0;
    expect(urbanBlock(state, P1, meta(state).cityId, 'EMERGENCY_GOVERN')).toBeNull();
  });
});

describe('E-1 · persistence and compatibility', () => {
  it('a snapshot written before the field existed still parses, with the recovery available', () => {
    const state = revoltCity();
    const raw = JSON.parse(JSON.stringify(state)) as { cities: Record<string, unknown>[] };
    for (const city of raw.cities) delete city.revoltEmergencyRound;
    const parsed = AlphaStateSchema.parse(raw);
    expect(parsed.cities.every(city => city.revoltEmergencyRound === null)).toBe(true);
  });
  it('the marker survives the round trip of a state that used it', () => {
    const done = plan(revoltCity(), [emergency(revoltCity())]).after;
    expect(AlphaStateSchema.parse(JSON.parse(JSON.stringify(done))).cities.find(city => city.cityId === meta(done).cityId)!.revoltEmergencyRound).toBe(1);
  });
});
