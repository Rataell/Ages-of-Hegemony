import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, PlayerIdSchema, WORLD_ID, threatComposition, type AlphaState, type AlphaUnit, type Threat } from '@aoh/game-domain';
import { activateThreats, beginAlphaPlanning, createAlphaGame, hexDistance, hexId, hexNeighbors, landTarget, threatIntent, threatView, visibleHexIds } from '@aoh/game-engine';

/**
 * Integrity slice 1 (owner decisions of 2026-10-12, docs/product/canonical-gap-register.md V12-UX-01..03) and the readable trail (UX directive item 4).
 * Hand-built states, no simulation: V12-UX-01 one assault per city per round; V12-UX-02 withdrawal also after an assault in the field; V12-UX-03 Piratas pillage a
 * port once per round and withdraw to their Ancoradouro; trail events and the planned path in threatView respect the fog.
 */
const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
function setup(): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'threat-integrity', seed: 173, preset: 'STANDARD', players: [{ id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' }] }));
  state.players.forEach(player => { player.knownHexIds = state.core.map.map(tile => tile.id); player.pendingChoices = []; });
  state.threats = [];
  return state;
}
const tile = (state: AlphaState, id: string) => state.core.map.find(candidate => candidate.id === id)!;
const capital = (state: AlphaState, index = 0) => tile(state, state.core.players[index]!.civilization.cities[0]!.hexId);
const isCity = (state: AlphaState, id: string) => state.core.players.some(owner => owner.civilization.cities.some(city => city.hexId === id));
const nbrs = (state: AlphaState, from: { q: number; r: number }) => hexNeighbors(from).map(hexId).map(id => state.core.map.find(t => t.id === id)).filter((t): t is NonNullable<typeof t> => t !== undefined);
function band(state: AlphaState, hex: string, over: Partial<Threat> = {}): Threat {
  const threat: Threat = { id: 'camp-x', kind: 'CAMP', hexId: hex as never, homeHexId: hex as never, level: 3, status: 'MARCHING', composition: threatComposition('CAMP', 3, 0), createdRound: 1, lastActedRound: 0, rewardPaid: false, fresh: false, withdrawing: false, readyRound: 0, ...over };
  state.threats.push(threat);
  return threat;
}
/** One activation of the marching threats in `round` (odd rounds in the real loop; `launch` is the Era turn / ATIVAR AMEAÇAS). */
const step = (state: AlphaState, round: number, launch = false) => { state.core.round = round; activateThreats(state, { launch }); };
const assaultsOn = (state: AlphaState, hex: string, round?: number) => state.battles.filter(battle => battle.attackerId === WORLD_ID && battle.hexId === hex && (round === undefined || battle.round === round));
/** Free land neighbours of a city hex (no piece, no threat, not a city, not a mountain), in id order. */
const approaches = (state: AlphaState, city: { q: number; r: number }) => nbrs(state, city).filter(t => !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain) && !isCity(state, t.id) && !state.units.some(u => u.hexId === t.id) && !state.threats.some(th => th.hexId === t.id)).sort((a, b) => (a.id < b.id ? -1 : 1));

describe('V12-UX-01 · at most one assault per city per round, summed over all Bandos', () => {
  it('two Bandos adjacent to the same city in the same round: only the first (id order) assaults, the other waits where it is', () => {
    const state = setup(), city = capital(state), [a, b] = approaches(state, city);
    expect(a && b).toBeTruthy();
    const first = band(state, a!.id, { id: 'camp-a' }), second = band(state, b!.id, { id: 'camp-b' });
    step(state, 3);
    const battles = assaultsOn(state, city.id, 3);
    expect(battles).toHaveLength(1);
    expect(battles[0]!.attackerUnits.every(id => id.startsWith('camp-a:'))).toBe(true);
    expect(second.hexId).toBe(b!.id);                                       // adjacent, did not move
    expect(second.withdrawing).toBe(false);
    expect(second.status).toBe('MARCHING');
    expect(second.composition).toEqual(threatComposition('CAMP', 3, 0));    // untouched: no battle for it
    expect(state.events.some(event => event.type === 'THREAT_WAITING' && event.message.includes('aguarda a vez'))).toBe(true);
    expect(state.telemetry.threatAttacks).toBe(1);
    void first;
  });

  it('the waiting Bando assaults on a later round, and still never twice in the same round', () => {
    const state = setup(), city = capital(state), [a, b] = approaches(state, city);
    band(state, a!.id, { id: 'camp-a' }); band(state, b!.id, { id: 'camp-b' });
    for (let round = 3; round <= 13; round += 2) {
      step(state, round);
      expect(assaultsOn(state, city.id, round).length, `round ${round}`).toBeLessThanOrEqual(1);
    }
    // the second Bando did get its turn once the first one had withdrawn (or died)
    expect(assaultsOn(state, city.id).some(battle => battle.attackerUnits.some(id => id.startsWith('camp-b:')))).toBe(true);
  });

  it('three Bandos: one assault per round, in id order, the others queue', () => {
    const state = setup(), city = capital(state), spots = approaches(state, city);
    expect(spots.length).toBeGreaterThanOrEqual(3);
    ['camp-a', 'camp-b', 'camp-c'].forEach((id, i) => band(state, spots[i]!.id, { id }));
    step(state, 3);
    expect(assaultsOn(state, city.id, 3)).toHaveLength(1);
    expect(state.events.filter(event => event.type === 'THREAT_WAITING')).toHaveLength(2);
  });
});

describe('V12-UX-02 · the Bando withdraws after an assault on pieces in the field too', () => {
  /** A Bando 3 hexes out whose first step is a hex holding an own Infantry: it must fight there. */
  function fieldFight() {
    const state = setup(), centre = capital(state), other = capital(state, 1);
    for (const start of state.core.map.filter(t => hexDistance(centre, t) === 3 && hexDistance(other, t) >= 6 && !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain) && t.ownerId === null && !state.units.some(u => u.hexId === t.id)).sort((a, b) => (a.id < b.id ? -1 : 1))) {
      const probe = band(state, start.id, { id: 'probe' }), goal = landTarget(state, probe); state.threats = [];
      const stepHex = goal?.path[0] && tile(state, goal.path[0]);
      if (!goal || goal.hex !== centre.id || !stepHex || isCity(state, stepHex.id) || ['MOUNTAINS', 'HILLS'].includes(stepHex.terrain)) continue;
      const fighter: AlphaUnit = { id: 'p1-field-inf', ownerId: p1, kind: 'INFANTRY', hexId: stepHex.id as never, recruitedRound: 1, carrierId: null };
      state.units.push(fighter);
      return { state, start: start.id, stepHex: stepHex.id, bando: band(state, start.id, { id: 'camp-field' }) };
    }
    throw new Error('no field fight set-up');
  }

  it('after an assault on pieces in the field, a surviving Bando turns back toward its Acampamento (and does not go on to the city)', () => {
    const { state, start, stepHex, bando } = fieldFight();
    step(state, 3);
    expect(state.battles.filter(battle => battle.attackerId === WORLD_ID && battle.hexId === stepHex)).toHaveLength(1);
    expect(state.threats.includes(bando)).toBe(true);                       // a level III Bando survives one Infantry
    expect(bando.withdrawing).toBe(true);
    expect(state.events.some(event => event.type === 'THREAT_WITHDRAWING' && event.message.includes('recuou depois do assalto'))).toBe(true);
    expect(threatIntent(state, bando).state).toBe('WITHDRAWING');
    // it walks home, never assaults again, and camps in the end (reorganization) at the Acampamento
    for (let round = 5; round <= 21 && bando.status !== 'CAMPED'; round += 2) step(state, round);
    expect(bando.status).toBe('CAMPED');
    expect(bando.hexId).toBe(start);
    expect(state.battles.filter(battle => battle.attackerId === WORLD_ID)).toHaveLength(1);
  });

  it('a Bando that meets only civilians (no fighters) still ambushes and keeps marching (unchanged)', () => {
    const state = setup(), centre = capital(state), other = capital(state, 1);
    const start = state.core.map.filter(t => hexDistance(centre, t) === 3 && hexDistance(other, t) >= 6 && !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain) && t.ownerId === null && !state.units.some(u => u.hexId === t.id)).sort((a, b) => (a.id < b.id ? -1 : 1))
      .find(t => { const probe = band(state, t.id, { id: 'probe' }), goal = landTarget(state, probe); state.threats = []; return goal?.hex === centre.id && goal.path[0] !== undefined && !isCity(state, goal.path[0]); })!;
    const probe = band(state, start.id, { id: 'probe' }), goal = landTarget(state, probe)!; state.threats = [];
    state.units.push({ id: 'p1-pioneer-x', ownerId: p1, kind: 'PIONEER', hexId: goal.path[0] as never, recruitedRound: 1, carrierId: null });
    const bando = band(state, start.id, { id: 'camp-civ' });
    step(state, 3);
    expect(state.units.some(u => u.id === 'p1-pioneer-x')).toBe(false);
    expect(bando.withdrawing).toBe(false);
    expect(state.battles.filter(battle => battle.attackerId === WORLD_ID)).toHaveLength(0);
  });
});

describe('V12-UX-03 · Piratas pillage a port once per round and then withdraw to their Ancoradouro', () => {
  /** The first capital becomes a port with two sea hexes next to it, one Pirata anchored on each. */
  function harbor(pirates = 2) {
    const state = setup(), city = capital(state);
    const water = nbrs(state, city).filter(t => !isCity(state, t.id) && !state.units.some(u => u.hexId === t.id)).sort((a, b) => (a.id < b.id ? -1 : 1)).slice(0, 2);
    water.forEach(t => { t.terrain = 'SEA'; });
    state.players[0]!.resources.wealth = 40;
    const list = water.slice(0, pirates).map((t, i) => band(state, t.id, { id: `pirate-${i + 1}`, kind: 'PIRATE', level: 1, composition: threatComposition('PIRATE', 1, 0) }));
    return { state, list, wealth: () => state.players[0]!.resources.wealth, pillages: (round: number) => state.resolutionEvents.filter(e => e.round === round && e.type === 'LOSSES' && e.cityId !== undefined && e.message.startsWith('Piratas pilharam')) };
  }

  it('a Pirata pillages a port once; the same activation does not pillage it again with a second Pirata', () => {
    const { state, list, wealth, pillages } = harbor();
    step(state, 3);
    expect(wealth()).toBe(38);                                              // 2 Riqueza, once
    expect(pillages(3)).toHaveLength(1);
    expect(state.events.filter(event => event.type === 'THREAT_PILLAGE')).toHaveLength(1);
    expect(list[0]!.withdrawing).toBe(true);                                // the one that pillaged retires
    expect(list[1]!.withdrawing).toBe(false);                               // the other waits next to the port
    expect(list[1]!.status).toBe('MARCHING');
    expect(state.events.some(event => event.type === 'THREAT_WITHDRAWING' && event.message.includes('se retirou depois da pilhagem'))).toBe(true);
  });

  it('a lone Pirata pillages 1 time per incursion: no repeated pillage on later rounds, only after being launched again', () => {
    const { state, list, wealth } = harbor(1);
    const [pirate] = list;
    step(state, 3);
    expect(wealth()).toBe(38);
    for (let round = 5; round <= 11; round += 2) step(state, round);        // old behaviour: -2 per odd round forever
    expect(wealth()).toBe(38);
    expect(pirate!.status).toBe('CAMPED');                                  // back at the Ancoradouro, reorganizing
    expect(pirate!.readyRound).toBeGreaterThan(3);
    expect(pirate!.hexId).toBe(pirate!.homeHexId);
    expect(state.events.some(event => event.type === 'THREAT_REGROUPING' && event.message.includes('ancoradouro'))).toBe(true);
    step(state, 12, true);                                                  // launched again (Era turn / ATIVAR AMEAÇAS)
    expect(wealth()).toBe(36);
  });

  it('with two Piratas the port suffers one pillage per round, the second Pirata taking the next one', () => {
    const { state, list, wealth, pillages } = harbor();
    step(state, 3); step(state, 5);
    expect(pillages(3)).toHaveLength(1); expect(pillages(5)).toHaveLength(1);
    expect(wealth()).toBe(36);
    expect(list.every(pirate => pirate.withdrawing || pirate.status === 'CAMPED')).toBe(true);
  });

  it('a Pirata whose Ancoradouro was taken re-anchors on open sea instead of walking on land', () => {
    const { state, list } = harbor(1);
    const [pirate] = list;
    pirate!.homeHexId = capital(state, 1).id as never;                      // the old home is now a city: no longer valid
    step(state, 3);
    for (let round = 5; round <= 15 && pirate!.status !== 'CAMPED' && state.threats.includes(pirate!); round += 2) step(state, round);
    if (state.threats.includes(pirate!)) expect(tile(state, pirate!.hexId).terrain).toBe('SEA');
  });
});

describe('item 4 · readable trail: march events and the planned path respect the fog', () => {
  /** A Bando in the open, walking toward the first capital, with every Region of the table open to both seats. */
  function openMarch() {
    const state = setup(), centre = capital(state), other = capital(state, 1);
    const start = state.core.map.filter(t => hexDistance(centre, t) === 4 && hexDistance(other, t) >= 6 && !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain) && t.ownerId === null && !state.units.some(u => u.hexId === t.id)).sort((a, b) => (a.id < b.id ? -1 : 1))
      .find(t => { const probe = band(state, t.id, { id: 'probe' }), goal = landTarget(state, probe); state.threats = []; return goal?.hex === centre.id && goal.path.length >= 3; })!;
    for (const region of state.regions) region.revealedBy = [p1, p2];
    return { state, start: start.id, bando: band(state, start.id, { id: 'camp-trail', level: 1, composition: threatComposition('CAMP', 1, 0) }) };
  }

  it('a step emits a MOVEMENT resolution event origin -> destination for every seat that sees both hexes', () => {
    const { state, start, bando } = openMarch();
    step(state, 3);
    const events = state.resolutionEvents.filter(event => event.type === 'MOVEMENT' && event.unitIds.includes(bando.id));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ actorId: null, fromHexId: start, hexId: bando.hexId, visibleTo: [p1, p2] });
    expect(events[0]!.message).toContain(`de ${start} para ${bando.hexId}`);
    expect(AlphaStateSchema.safeParse(JSON.parse(JSON.stringify(state))).success).toBe(true);
  });

  it('withdrawal steps are announced as "recuou"', () => {
    const { state, start, bando } = openMarch();
    bando.withdrawing = true; bando.homeHexId = start as never; bando.hexId = landTarget(state, { ...bando, withdrawing: false })!.path[1] as never;
    step(state, 3);
    const moved = state.resolutionEvents.filter(event => event.type === 'MOVEMENT' && event.unitIds.includes(bando.id));
    expect(moved.length).toBeGreaterThan(0);
    expect(moved[0]!.message).toContain('recuou de');
  });

  /**
   * A Bando standing in a closed (non-homeland) Region whose first step leaves it for a hex both seats see. Optionally the origin hex is owned by p1, so only p1 sees it.
   * Deterministic search over the table; the test fails loudly if the layout offers no such place.
   */
  function fogMarch(ownedByP1: boolean) {
    const state = setup();
    for (const region of state.regions) region.revealedBy = [p1, p2];
    for (const region of state.regions.filter(r => !/^homeland-/.test(r.templateId))) {
      const ids = new Set<string>(region.hexIds);
      for (const hex of region.hexIds.map(id => tile(state, id)).filter(t => !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain) && t.ownerId === null && !state.units.some(u => u.hexId === t.id) && !state.independents.some(i => i.hexId === t.id)).sort((a, b) => (a.id < b.id ? -1 : 1))) {
        region.revealedBy = [];
        const probe = band(state, hex.id, { id: 'probe' }), goal = landTarget(state, probe); state.threats = [];
        const next = goal?.path[0];
        if (next && !ids.has(next) && visibleHexIds(state, p1).has(next) && visibleHexIds(state, p2).has(next) && !visibleHexIds(state, p1).has(hex.id) && !visibleHexIds(state, p2).has(hex.id)) {
          if (ownedByP1) hex.ownerId = p1 as never;
          return { state, origin: hex.id, next, bando: band(state, hex.id, { id: 'camp-fog', level: 1, composition: threatComposition('CAMP', 1, 0) }) };
        }
        region.revealedBy = [p1, p2];
      }
    }
    throw new Error('no fog layout');
  }

  it('fog: when nobody sees the origin, seats that see the destination read only an arrival (no origin hex anywhere in the event)', () => {
    const { state, origin, next, bando } = fogMarch(false);
    step(state, 3);
    const events = state.resolutionEvents.filter(event => event.type === 'MOVEMENT' && event.unitIds.includes(bando.id));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ hexId: next, visibleTo: [p1, p2] });
    expect(events[0]!.fromHexId).toBeUndefined();
    expect(events[0]!.message).toBe(`Bando de Saqueadores chegou a ${next}.`);
    expect(JSON.stringify(events[0])).not.toContain(origin);
  });

  it('fog: only the seat that sees the origin reads the whole step; the other seat reads the arrival alone', () => {
    const { state, origin, next, bando } = fogMarch(true);
    step(state, 3);
    const events = state.resolutionEvents.filter(event => event.type === 'MOVEMENT' && event.unitIds.includes(bando.id));
    const full = events.find(event => event.fromHexId === origin)!, arrival = events.find(event => event.fromHexId === undefined)!;
    expect(full).toMatchObject({ hexId: next, visibleTo: [p1] });
    expect(arrival).toMatchObject({ hexId: next, visibleTo: [p2] });
    expect(JSON.stringify(arrival)).not.toContain(origin);
    expect(events).toHaveLength(2);
  });

  it('threatView exposes the planned BFS path (hex ids up to the target), consistent with nextHexId and distance', () => {
    const { state, bando } = openMarch();
    const view = threatView(state, p1).find(entry => entry.id === bando.id)!;
    const goal = landTarget(state, bando)!;
    expect(view.intent.pathHexIds).toEqual(goal.path);
    expect(view.intent.pathHexIds[0]).toBe(view.intent.nextHexId);
    expect(view.intent.pathHexIds.at(-1)).toBe(view.intent.targetHexId);
    expect(view.intent.pathHexIds).toHaveLength(view.intent.distance!);
    expect(threatIntent(state, bando).pathHexIds).toEqual(goal.path);
  });

  it('the path stops at the first hex outside the viewer\'s vision and a camped threat has none', () => {
    const { state, bando } = openMarch();
    const goal = landTarget(state, bando)!;
    // Close the Region that holds the third hex of the path (its tiles unowned): the viewer must read only the prefix before it, and that prefix is non-empty only if the Bando itself is visible.
    const hidden = goal.path[2]!, region = state.regions.find(candidate => candidate.hexIds.includes(hidden as never));
    expect(region, 'the third path hex lies in a Region').toBeDefined();
    region!.revealedBy = [];
    for (const entry of state.core.map) if (region!.hexIds.includes(entry.id as never)) entry.ownerId = null as never;
    const visible = visibleHexIds(state, p1);
    expect(visible.has(hidden)).toBe(false);
    const view = threatView(state, p1).find(entry => entry.id === bando.id);
    const expected: string[] = []; for (const id of goal.path) { if (!visible.has(id)) break; expected.push(id); }
    if (visible.has(bando.hexId)) {
      expect(view).toBeDefined();
      expect(view!.intent.pathHexIds).toEqual(expected);
      expect(view!.intent.pathHexIds).not.toContain(hidden);
      expect(view!.intent.pathHexIds.length).toBeLessThan(goal.path.length);
    } else expect(view).toBeUndefined();   // not even the Bando is on the table: nothing of its path leaks either
    bando.status = 'CAMPED';
    const camped = threatView(state, p1).find(entry => entry.id === bando.id);
    expect(camped?.intent.pathHexIds ?? []).toEqual([]);
  });
});
