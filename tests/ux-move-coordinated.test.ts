import { describe, expect, it } from 'vitest';
import { appendFileSync, readFileSync } from 'node:fs';
import { AlphaStateSchema, COORDINATED_MOVE_MAX_PIECES, PlayerIdSchema, StrategicOrderSchema, moveLegs, orderUnitIds, type AlphaState, type AlphaUnit, type MoveLeg } from '@aoh/game-domain';
import { alphaActionUsage, alphaUnitOptions, applyAlphaCommand, beginAlphaPlanning, coordinatedMoveView, createAlphaGame, hexId, hexNeighbors, previewMoveOrder, regionOpenFor, stackLimit } from '@aoh/game-engine';
import { completeRound, must } from './alpha-rounds.js';
import { frontierOf, known, place, pioneerOf, tile, world } from './alpha-move-fixtures.js';

/**
 * V12-UX-04 · Mover coordenado (owner decision D1). One MOVE Order carries `legs`: 2..3 pieces in total, each leg with its own path and destination, ONE Order.
 * Engine-only and deterministic; no simulations. Vitest output is condensed in this repo, so findings are also appended to the file named by $UX_DUMP (no-op when unset).
 * Arena: a radius-2 disc of known, unowned, empty plains far from every city; pieces are placed by hand.
 */
const p1 = PlayerIdSchema.parse('p1');
type Kind = AlphaUnit['kind'];
const dump = (line: string) => { if (process.env.UX_DUMP) appendFileSync(process.env.UX_DUMP, `${line}\n`); };
const fresh = (seed = 23) => beginAlphaPlanning(createAlphaGame({ gameId: `ux-coord-${seed}`, seed, preset: 'QUICK', players: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] } as never));

function arena(terrain = 'PLAINS', seed = 23) {
  const state = fresh(seed), byId = new Map(state.core.map.map(t => [t.id as string, t]));
  const city = state.core.players[0]!.civilization.cities[0]!;
  let best: string[] = [];
  for (let dir = 0; dir < 6; dir++) {
    const ids: string[] = []; let cur = byId.get(city.hexId as string)!;
    for (let i = 0; i < 8; i++) { const n = hexNeighbors(cur)[dir]!, t = byId.get(hexId(n)); if (!t) break; ids.push(t.id); cur = t; }
    if (ids.length > best.length) best = ids;
  }
  const center = best[5]!, disc = new Set<string>([center]);
  for (let ring = 0; ring < 2; ring++) for (const id of [...disc]) for (const n of hexNeighbors(byId.get(id)!)) { const t = byId.get(hexId(n)); if (t) disc.add(t.id); }
  const progress = state.players[0]!;
  // The engine re-derives what a seat knows after every Order: open the Regions under the disc for p1 so the arena stays known through the whole round.
  for (const region of state.regions) if (region.hexIds.some(id => disc.has(id)) && !region.revealedBy.includes(p1)) region.revealedBy.push(p1);
  for (const id of disc) {
    const t = byId.get(id)!; t.terrain = terrain as never; t.ownerId = null as never; t.features = [] as never;
    if (!progress.knownHexIds.includes(id as never)) progress.knownHexIds.push(id as never);
    state.units = state.units.filter(u => u.hexId !== id); state.threats = state.threats.filter(th => th.hexId !== id); state.independents = state.independents.filter(i => i.hexId !== id);
  }
  state.units = state.units.filter(u => u.ownerId !== p1);
  const near = (id: string) => hexNeighbors(byId.get(id)!).map(hexId).filter(n => disc.has(n)).sort();
  return { state, center, disc, near, byId };
}
let serial = 0;
const put = (state: AlphaState, kind: Kind, at: string, id = `t-${kind.toLowerCase()}-${serial++}`) => { state.units.push({ id, ownerId: p1, kind, hexId: at as never, recruitedRound: 1, carrierId: null } as AlphaUnit); return id; };
const move = (id: string, legs: MoveLeg[]) => ({ id, type: 'MOVE', legs });
const queue = (state: AlphaState, order: Record<string, unknown>) => applyAlphaCommand(state, p1, { type: 'QUEUE_ORDER', expectedVersion: state.version, order } as never);
const legacy = (id: string, unitIds: string[], path: string[], extra: Record<string, unknown> = {}) => ({ id, type: 'MOVE', unitIds, path, ...extra });
const cheat = (state: AlphaState, cardId: string) => {
  state.cards.strategyDeck = state.cards.strategyDeck.filter(id => id !== cardId); state.cards.discarded = state.cards.discarded.filter(id => id !== cardId);
  for (const p of state.players) p.hand = p.hand.filter(id => id !== cardId);
  state.players[0]!.hand.push(cardId); state.players[0]!.ambitionsChosen = true;
};
const used = (state: AlphaState) => alphaActionUsage(state, p1).used;
const messageOf = (result: ReturnType<typeof queue>) => (result.ok ? '' : result.error.message);

/** Two infantry on different hexes (centre and a neighbour), each with its own free step. */
function twoLegs() {
  const a = arena(), [n0] = a.near(a.center);
  const u1 = put(a.state, 'INFANTRY', a.center), u2 = put(a.state, 'INFANTRY', n0!);
  const d1 = a.near(a.center).find(id => id !== n0)!, d2 = a.near(n0!).find(id => id !== a.center && id !== d1)!;
  return { ...a, n0: n0!, u1, u2, d1, d2, legs: [{ unitIds: [u1], path: [d1] }, { unitIds: [u2], path: [d2] }] as MoveLeg[] };
}

describe('schema: exactly one MOVE shape; one reader', () => {
  const parse = (order: unknown) => StrategicOrderSchema.safeParse(order);
  it('accepts the legacy shape and the legs shape, refuses mixes, repeats and more than the piece cap', () => {
    expect(parse(legacy('a', ['u1', 'u2'], ['1,1'])).success).toBe(true);
    expect(parse(move('a', [{ unitIds: ['u1'], path: ['1,1'] }, { unitIds: ['u2'], path: ['2,2'] }])).success).toBe(true);
    expect(parse({ ...move('a', [{ unitIds: ['u1'], path: ['1,1'] }, { unitIds: ['u2'], path: ['2,2'] }]), unitIds: ['u3'], path: ['1,1'] }).success).toBe(false);
    expect(parse({ id: 'a', type: 'MOVE' }).success).toBe(false);
    expect(parse(move('a', [{ unitIds: ['u1'], path: ['1,1'] }])).success).toBe(false);
    expect(parse(move('a', [{ unitIds: ['u1'], path: ['1,1'] }, { unitIds: ['u1'], path: ['2,2'] }])).success).toBe(false);
    expect(parse(move('a', [{ unitIds: ['u1', 'u2'], path: ['1,1'] }, { unitIds: ['u3', 'u4'], path: ['2,2'] }])).success).toBe(false);
    expect(COORDINATED_MOVE_MAX_PIECES).toBe(3);
  });
  it('moveLegs / orderUnitIds read both shapes (a legacy Order is one leg)', () => {
    const old = StrategicOrderSchema.parse(legacy('a', ['u1', 'u2'], ['1,1', '1,2'], { rotation: 2 })), neu = StrategicOrderSchema.parse(move('b', [{ unitIds: ['u1'], path: ['1,1'] }, { unitIds: ['u2', 'u3'], path: ['2,2'], rotation: 1 }]));
    expect(moveLegs(old as never)).toEqual([{ unitIds: ['u1', 'u2'], path: ['1,1', '1,2'], rotation: 2 }]);
    expect(moveLegs(neu as never).length).toBe(2);
    expect(orderUnitIds(neu)).toEqual(['u1', 'u2', 'u3']);
    expect(orderUnitIds(old)).toEqual(['u1', 'u2']);
  });
});

describe('valid coordinated Orders', () => {
  it('2 legs, different origins and destinations: ONE Order charged, both pieces arrive', () => {
    const { state, legs, u1, u2, d1, d2 } = twoLegs();
    const usedBefore = used(state), queued = must(state, p1, { type: 'QUEUE_ORDER', order: move('c1', legs) });
    expect(used(queued)).toBe(usedBefore + 1);
    expect(alphaActionUsage(queued, p1).byOrder.EXPEDITION).toBe(1);
    expect(queued.players[0]!.orders.length).toBe(1);
    const done = completeRound(queued);
    expect(done.units.find(u => u.id === u1)!.hexId).toBe(d1);
    expect(done.units.find(u => u.id === u2)!.hexId).toBe(d2);
    // one MOVEMENT event per leg, with the destination and where the piece came from
    const events = done.resolutionEvents.filter(e => e.type === 'MOVEMENT' && e.actorId === p1 && (e.unitIds.includes(u1) || e.unitIds.includes(u2)));
    expect(events.map(e => [e.unitIds[0], e.hexId, e.fromHexId]).sort()).toEqual([[u1, d1, state.units.find(u => u.id === u1)!.hexId], [u2, d2, state.units.find(u => u.id === u2)!.hexId]].sort());
    expect(done.events.filter(e => e.type === 'ORDER_FAILED').length).toBe(0);
    expect(done.events.filter(e => e.type === 'MOVE' && e.message.includes('moveu-se')).length).toBe(2);
  });
  it('Ordens 3/5 -> 4/5: the coordinated Order is one charge, and `actions` stays consistent', () => {
    const { state, near, center, legs } = twoLegs();
    const others = near(center).filter(id => !legs.some(l => l.path.includes(id as never) || id === state.units[1]!.hexId)).slice(0, 3);
    let s = state;
    others.forEach((dest, i) => { const piece = put(s, 'INFANTRY', center, `solo-${i}`); s = must(s, p1, { type: 'QUEUE_ORDER', order: legacy(`solo-order-${i}`, [piece], [dest]) }); });
    expect(others.length).toBe(3);
    expect(used(s)).toBe(3);
    const after = must(s, p1, { type: 'QUEUE_ORDER', order: move('c1', legs) });
    expect(used(after)).toBe(4);
    expect(after.players[0]!.orders.length).toBe(4);
    const view = alphaActionUsage(after, p1);
    expect([view.used, view.reserved, view.limit]).toEqual([4, 4, 5]);
    // cancelling the Order cancels every leg and gives the Order back
    const cancelled = must(after, p1, { type: 'CANCEL_ORDER', orderId: 'c1' });
    expect(used(cancelled)).toBe(3);
    expect(cancelled.players[0]!.orders.some(o => o.id === 'c1')).toBe(false);
  });
  it('3 legs of one piece each', () => {
    const a = arena(), ring = a.near(a.center), from = [a.center, ring[0]!, ring[3]!];
    const ids = from.map(at => put(a.state, 'INFANTRY', at));
    const taken = new Set<string>([...from]);
    const legs: MoveLeg[] = ids.map((id, i) => { const dest = a.near(from[i]!).find(n => !taken.has(n))!; taken.add(dest); return { unitIds: [id], path: [dest] as never }; });
    const queued = must(a.state, p1, { type: 'QUEUE_ORDER', order: move('c3', legs) });
    const done = completeRound(queued);
    legs.forEach((leg, i) => expect(done.units.find(u => u.id === ids[i])!.hexId).toBe(leg.path[0]));
  });
  it('same origin: pieces of one stack are separated to different hexes', () => {
    const a = arena(), [x, y] = a.near(a.center), ids = [put(a.state, 'INFANTRY', a.center), put(a.state, 'CAVALRY', a.center)];
    const queued = must(a.state, p1, { type: 'QUEUE_ORDER', order: move('sep', [{ unitIds: [ids[0]!], path: [x!] as never }, { unitIds: [ids[1]!], path: [y!] as never }]) });
    const done = completeRound(queued);
    expect([done.units.find(u => u.id === ids[0])!.hexId, done.units.find(u => u.id === ids[1])!.hexId]).toEqual([x, y]);
  });
  it('a leg may carry a joined group (2 + 1 = 3 pieces) and the group stays together', () => {
    const a = arena(), [x, y] = a.near(a.center), g = [put(a.state, 'INFANTRY', a.center), put(a.state, 'INFANTRY', a.center)], lone = put(a.state, 'INFANTRY', a.center);
    const queued = must(a.state, p1, { type: 'QUEUE_ORDER', order: move('mix', [{ unitIds: g, path: [x!] as never }, { unitIds: [lone], path: [y!] as never }]) });
    const done = completeRound(queued);
    expect(g.map(id => done.units.find(u => u.id === id)!.hexId)).toEqual([x, x]);
    expect(done.units.find(u => u.id === lone)!.hexId).toBe(y);
  });
});

describe('limits and refusals: the whole Order is refused at queue time with a concrete message', () => {
  it('piece cap: 3 in total (schema), a 4th piece is refused', () => {
    const a = arena(), [x, y] = a.near(a.center), ids = [0, 1, 2, 3].map(() => put(a.state, 'INFANTRY', a.center));
    const refused = queue(a.state, move('big', [{ unitIds: ids.slice(0, 2), path: [x!] }, { unitIds: ids.slice(2), path: [y!] }]));
    expect(refused.ok).toBe(false);
    const preview = previewMoveOrder(a.state, p1, [{ unitIds: ids.slice(0, 2), path: [x!] as never }, { unitIds: ids.slice(2), path: [y!] as never }]);
    expect(preview.ok).toBe(false);
    expect(preview.blockers.map(b => b.code)).toContain('PIECE_LIMIT');
    expect(preview.blockers.find(b => b.code === 'PIECE_LIMIT')!.message).toMatch(/no máximo 3 peças/);
  });
  it('repeated unitIds between legs are refused', () => {
    const a = arena(), [x, y] = a.near(a.center), id = put(a.state, 'INFANTRY', a.center);
    expect(queue(a.state, move('dup', [{ unitIds: [id], path: [x!] }, { unitIds: [id], path: [y!] }])).ok).toBe(false);
    expect(previewMoveOrder(a.state, p1, [{ unitIds: [id], path: [x!] as never }, { unitIds: [id], path: [y!] as never }]).blockers.map(b => b.code)).toContain('DUPLICATE_PIECE');
  });
  it('a piece already in another Order is refused, naming it', () => {
    const { state, legs, u1, d1 } = twoLegs(), other = [...state.core.map].find(t => t.id !== d1)!.id;
    void other;
    const busy = must(state, p1, { type: 'QUEUE_ORDER', order: legacy('solo', [u1], [d1]) });
    const refused = queue(busy, move('c', legs));
    expect(messageOf(refused)).toMatch(/já está em outra Ordem/);
    expect(busy.players[0]!.orders.length).toBe(1);
  });
  it('sea for a land piece', () => {
    const { state, legs, d2, byId } = twoLegs();
    byId.get(d2)!.terrain = 'SEA' as never;
    const refused = queue(state, move('sea', legs));
    expect(messageOf(refused)).toMatch(/Trajeto 2 de 2: Mar em .* não entra em água/);
    expect(used(state)).toBe(0);
  });
  it('range: a mountain beyond the budget says the numbers (cost 3 vs movement 2)', () => {
    const { state, legs, d1, byId } = twoLegs();
    byId.get(d1)!.terrain = 'MOUNTAINS' as never;
    const refused = queue(state, move('mtn', legs));
    expect(messageOf(refused)).toMatch(/Trajeto 1 de 2: Alcance insuficiente: o trajeto custa 3 e Infantaria tem 2 de movimento/);
    const leg = previewMoveOrder(state, p1, legs).legs[0]!;
    expect([leg.ok, leg.cost, leg.budget, leg.remaining]).toEqual([false, 3, 2, -1]);
  });
  it('a world threat on a destination', () => {
    const { state, legs, d1 } = twoLegs();
    state.threats.push({ id: 'camp-x', kind: 'CAMP', hexId: d1, homeHexId: d1, level: 1, status: 'CAMPED', composition: [{ kind: 'INFANTRY', count: 1 }], createdRound: 1, lastActedRound: 1, rewardPaid: false, fresh: false, withdrawing: false, readyRound: 0 } as never);
    const refused = queue(state, move('thr', legs));
    expect(messageOf(refused)).toMatch(/Trajeto 1 de 2: Ameaça do mundo em/);
    expect(state.players[0]!.orders.length).toBe(0);
  });
  it('arrival over the stack limit, with the other leg of the same Order counted', () => {
    const a = arena(), target = a.near(a.center)[0]!, [from1, from2] = a.near(target).filter(id => id !== a.center).slice(0, 2);
    const limit = stackLimit(a.state, p1, target, 'military');
    for (let i = 0; i < limit - 1; i++) put(a.state, 'INFANTRY', target);
    const u1 = put(a.state, 'INFANTRY', from1!), u2 = put(a.state, 'INFANTRY', from2!);
    // one leg alone fits (limit-1 + 1); two legs to the same hex do not
    expect(queue(a.state, legacy('one', [u1], [target])).ok).toBe(true);
    const refused = queue(a.state, move('two', [{ unitIds: [u1], path: [target] }, { unitIds: [u2], path: [target] }]));
    expect(messageOf(refused)).toMatch(/Trajeto \d de 2: Limite de pilha atingido em/);
    // different hexes: fine
    const free = a.near(from2!).find(id => id !== target && id !== from1 && id !== from2 && id !== a.center)!;
    expect(queue(a.state, move('ok', [{ unitIds: [u1], path: [target] }, { unitIds: [u2], path: [free] }])).ok).toBe(true);
  });
});

describe('+2 card (strategy-22) widens each piece; an Order queued before the card stays valid', () => {
  it('reaches by piece what the base budget does not, and the preview agrees', () => {
    const a = arena(), c = a.center, step1 = a.near(c)[0]!, step2 = a.near(step1).find(id => id !== c && !a.near(c).includes(id))!, step3 = a.near(step2).find(id => !a.near(step1).includes(id) && id !== step1 && id !== c)!;
    const inf = put(a.state, 'INFANTRY', c), cav = put(a.state, 'CAVALRY', c);
    const other = a.near(c).filter(id => id !== step1)[0]!;
    const long = [{ unitIds: [inf], path: [step1, step2, step3] }, { unitIds: [cav], path: [other] }] as MoveLeg[];
    expect(queue(a.state, move('far', long)).ok).toBe(false);
    expect(messageOf(queue(a.state, move('far', long)))).toMatch(/Alcance insuficiente: o trajeto custa 3 e Infantaria tem 2/);
    cheat(a.state, 'strategy-22');
    const boosted = must(a.state, p1, { type: 'PLAY_CARD', cardId: 'strategy-22' });
    const preview = previewMoveOrder(boosted, p1, long);
    expect(preview.ok).toBe(true);
    expect(preview.legs[0]!.budget).toBe(4);
    expect(preview.legs[0]!.remaining).toBe(1);
    const queued = must(boosted, p1, { type: 'QUEUE_ORDER', order: move('far', long) });
    const done = completeRound(queued);
    expect(done.units.find(u => u.id === inf)!.hexId).toBe(step3);
    expect(done.units.find(u => u.id === cav)!.hexId).toBe(other);
  });
  it('queued BEFORE the card (short legs): still valid and resolves after the card is played', () => {
    const { state, legs, u1, u2, d1, d2 } = twoLegs();
    const queued = must(state, p1, { type: 'QUEUE_ORDER', order: move('c1', legs) });
    cheat(queued, 'strategy-22');
    const played = must(queued, p1, { type: 'PLAY_CARD', cardId: 'strategy-22' });
    expect(played.players[0]!.orders.length).toBe(1);
    const done = completeRound(played);
    expect([done.units.find(u => u.id === u1)!.hexId, done.units.find(u => u.id === u2)!.hexId]).toEqual([d1, d2]);
  });
});

describe('resolution is per leg', () => {
  it('a leg that is no longer legal fails alone; the other still moves; the Order was charged once and is not refunded', () => {
    const { state, legs, u1, u2, d1, d2 } = twoLegs();
    const queued = must(state, p1, { type: 'QUEUE_ORDER', order: move('c1', legs) });
    queued.units.push({ id: 'rival-1', ownerId: PlayerIdSchema.parse('p2'), kind: 'INFANTRY', hexId: d1 as never, recruitedRound: 1, carrierId: null } as AlphaUnit);
    const done = completeRound(queued);
    expect(done.units.find(u => u.id === u1)!.hexId).not.toBe(d1);
    expect(done.units.find(u => u.id === u2)!.hexId).toBe(d2);
    const failed = done.events.filter(e => e.type === 'ORDER_FAILED' && e.audience?.includes(p1));
    dump(`LEG-FAIL ${JSON.stringify(failed.map(e => e.message))}`);
    expect(failed.length).toBe(1);
    expect(failed[0]!.message).toMatch(/^Mover coordenado, trajeto 1 de 2: /);
    expect(done.events.filter(e => e.type === 'MOVE' && e.message.includes('moveu-se')).length).toBe(1);
    expect(done.resolutionEvents.filter(e => e.type === 'MOVEMENT' && e.actorId === p1 && e.unitIds.includes(u2)).length).toBe(1);
  });
  it('legs resolve in order, so two legs to the same hex add up against the limit and the second one fails alone', () => {
    const a = arena(), target = a.near(a.center)[0]!, [from1, from2] = a.near(target).filter(id => id !== a.center).slice(0, 2);
    const limit = stackLimit(a.state, p1, target, 'military');
    for (let i = 0; i < limit - 2; i++) put(a.state, 'INFANTRY', target);
    const u1 = put(a.state, 'INFANTRY', from1!), u2 = put(a.state, 'INFANTRY', from2!);
    const queued = must(a.state, p1, { type: 'QUEUE_ORDER', order: move('both', [{ unitIds: [u1], path: [target] }, { unitIds: [u2], path: [target] }]) });
    // a third piece of the same civilization arrives meanwhile (another Order of an earlier initiative would too): the room is gone for the 2nd leg
    queued.units.push({ id: 'squatter', ownerId: p1, kind: 'INFANTRY', hexId: target as never, recruitedRound: 1, carrierId: null } as AlphaUnit);
    const done = completeRound(queued);
    expect(done.units.find(u => u.id === u1)!.hexId).toBe(target);
    expect(done.units.find(u => u.id === u2)!.hexId).toBe(from2);
    expect(done.events.filter(e => e.type === 'ORDER_FAILED' && /trajeto 2 de 2/.test(e.message)).length).toBe(1);
  });
});

describe('frontier legs: each leg needs its own discoverer; two legs into the same closed Region', () => {
  function twoEntries() {
    for (const seed of [2, 5, 9, 13, 21, 34, 55, 89]) {
      const state = world(seed), seen = known(state), first = pioneerOf(state);
      const second = state.units.filter(u => u.ownerId === p1 && u.kind === 'PIONEER').find(u => u.id !== first.id)!;
      for (const at of [...seen].sort()) {
        const t = tile(state, at);
        if (!['PLAINS', 'FOREST', 'HILLS'].includes(t.terrain) || state.units.some(u => u.hexId === at && u.id !== first.id && u.id !== second.id)) continue;
        place(first, at); place(second, at);
        const region = frontierOf(state, first).find(r => r.block === null && r.entries.filter(e => e.path.length === 1).length >= 2);
        if (region) return { state, first, second, at, entries: region.entries.filter(e => e.path.length === 1), region };
      }
    }
    return null;
  }
  it('two Pioneiros, two entries of one closed Region: both queue (rotation per leg); resolution runs both legs, the 2nd as an ordinary move', () => {
    const found = twoEntries();
    if (!found) { dump('FRONTIER-2LEG no case found'); return; }
    const { state, first, second, entries } = found, [e1, e2] = entries;
    const legs: MoveLeg[] = [{ unitIds: [first.id], path: e1!.path as never, ...(e1!.rotations.length ? { rotation: e1!.rotations[0]! } : {}) }, { unitIds: [second.id], path: e2!.path as never, ...(e2!.rotations.length ? { rotation: e2!.rotations[0]! } : {}) }];
    const preview = previewMoveOrder(state, p1, legs);
    dump(`FRONTIER-2LEG preview ok=${preview.ok} legs=${JSON.stringify(preview.legs.map(l => [l.ok, l.cost, l.budget, l.frontier, l.frontierRisk?.danger, l.blockers.map(b => b.message)]))}`);
    expect(preview.ok).toBe(true);
    expect(preview.legs.every(l => l.frontier && l.frontierRisk !== undefined)).toBe(true);
    const queued = must(state, p1, { type: 'QUEUE_ORDER', order: move('fr', legs) });
    expect(used(queued)).toBe(used(state) + 1);
    const regionId = found.region.regionId;
    const done = completeRound(queued);
    expect(regionOpenFor(done, done.regions.find(r => r.id === regionId)!, p1)).toBe(true);
    // exactly one outcome event per leg: the first is the Discovery, the second a plain move or its own failure
    const discoveries = done.resolutionEvents.filter(e => e.type === 'DISCOVERY' && e.actorId === p1 && e.round === state.core.round);
    const others = done.resolutionEvents.filter(e => e.type === 'MOVEMENT' && e.actorId === p1 && e.unitIds.includes(second.id));
    const failed = done.events.filter(e => e.type === 'ORDER_FAILED' && e.audience?.includes(p1) && e.round === state.core.round);
    dump(`FRONTIER-2LEG discoveries=${discoveries.length} second=${others.length} failed=${JSON.stringify(failed.map(f => f.message))}`);
    expect(discoveries.length).toBe(1);
    expect(others.length + failed.length).toBe(1);
  });
  it('a frontier leg without a discoverer is refused with the engine text, naming the trajectory', () => {
    const found = twoEntries();
    if (!found) return;
    const { state, first, second, entries } = found, [e1, e2] = entries;
    state.units = state.units.filter(u => u.id !== second.id);
    const inf = put(state, 'INFANTRY', found.at);
    const legs: MoveLeg[] = [{ unitIds: [first.id], path: e1!.path as never, ...(e1!.rotations.length ? { rotation: e1!.rotations[0]! } : {}) }, { unitIds: [inf], path: e2!.path as never, ...(e2!.rotations.length ? { rotation: e2!.rotations[0]! } : {}) }];
    const refused = queue(state, move('fr', legs));
    expect(messageOf(refused)).toMatch(/Trajeto 2 de 2: Necessita de um Pioneiro para descobrir/);
  });
});

describe('isolation: a match without the rule', () => {
  it('legs are refused with a clear message while the legacy shape is accepted (RC4 save from the fixture)', () => {
    const state = AlphaStateSchema.parse(JSON.parse(readFileSync(new URL('./fixtures/rc4-midgame-state.json', import.meta.url), 'utf8')));
    expect(state.rules.coordinatedMove).toBeUndefined();
    const me = state.players[0]!.playerId, options = alphaUnitOptions(state, me);
    const movers = state.units.filter(u => u.ownerId === me && Object.keys(options[u.id]!.moves).length > 0).slice(0, 2);
    expect(movers.length).toBe(2);
    const dest = (u: AlphaUnit) => options[u.id]!.moves[Object.keys(options[u.id]!.moves).sort()[0]!]!;
    const attempt = (order: Record<string, unknown>) => applyAlphaCommand(state, me, { type: 'QUEUE_ORDER', expectedVersion: state.version, order } as never);
    const refused = attempt(move('c', movers.map(u => ({ unitIds: [u.id], path: dest(u) })) as MoveLeg[]));
    expect(messageOf(refused as never)).toBe('Mover coordenado não está ativo nesta partida.');
    expect(attempt(legacy('l', [movers[0]!.id], dest(movers[0]!))).ok).toBe(true);
    expect(previewMoveOrder(state, me, movers.map(u => ({ unitIds: [u.id], path: dest(u) })) as MoveLeg[]).blockers.map(b => b.code)).toContain('NOT_ENABLED');
    expect(coordinatedMoveView(state, me).enabled).toBe(false);
  });
  it('a round trip through the schema neither adds nor drops the flag, and a new match carries it', () => {
    const { state } = arena();
    expect(state.rules.coordinatedMove).toBe(true);
    const off = structuredClone(state); delete off.rules.coordinatedMove;
    expect('coordinatedMove' in AlphaStateSchema.parse(JSON.parse(JSON.stringify(off))).rules).toBe(false);
    expect(AlphaStateSchema.parse(JSON.parse(JSON.stringify(state))).rules.coordinatedMove).toBe(true);
  });
  it('legacy stack of 6 pieces still costs ONE Order and moves together', () => {
    const a = arena(), [x] = a.near(a.center), ids = [0, 1, 2, 3, 4, 5].map(() => put(a.state, 'INFANTRY', a.center));
    const before = used(a.state), queued = must(a.state, p1, { type: 'QUEUE_ORDER', order: legacy('stack', ids, [x!]) });
    expect(used(queued)).toBe(before + 1);
    expect(previewMoveOrder(a.state, p1, [{ unitIds: ids, path: [x!] as never }]).ok).toBe(true);
    const done = completeRound(queued);
    for (const id of ids) expect(done.units.find(u => u.id === id)!.hexId).toBe(x);
  });
});

describe('previewMoveOrder == the real result', () => {
  it('per leg: ok, destination and cost match what QUEUE_ORDER and the resolution do, across valid and refused sets', () => {
    const { state, legs, d1, d2, byId, u1, u2 } = twoLegs();
    const scenarios: [string, (s: AlphaState) => void][] = [
      ['valid', () => undefined],
      ['mountain leg 2', s => { s.core.map.find(t => t.id === d2)!.terrain = 'MOUNTAINS' as never; }],
      ['sea leg 1', s => { s.core.map.find(t => t.id === d1)!.terrain = 'SEA' as never; }],
      ['foreign piece leg 1', s => { s.units.push({ id: 'rival', ownerId: PlayerIdSchema.parse('p2'), kind: 'INFANTRY', hexId: d1 as never, recruitedRound: 1, carrierId: null } as AlphaUnit); }],
      ['forest leg 1 (cost 2 = budget)', s => { s.core.map.find(t => t.id === d1)!.terrain = 'FOREST' as never; }],
    ];
    void byId;
    for (const [name, mutate] of scenarios) {
      const s = structuredClone(state); mutate(s);
      const preview = previewMoveOrder(s, p1, legs), real = queue(s, move('c', legs));
      dump(`PREVIEW ${name}: preview=${preview.ok} queue=${real.ok} ${real.ok ? '' : messageOf(real)}`);
      expect(preview.ok, name).toBe(real.ok);
      // per leg: the same leg queued alone as a legacy Order is accepted exactly when the preview says so
      preview.legs.forEach((leg, i) => {
        const alone = queue(s, legacy(`alone-${i}`, legs[i]!.unitIds, legs[i]!.path));
        expect(leg.ok, `${name} leg ${i}`).toBe(alone.ok);
        expect(leg.destination).toBe(legs[i]!.path.at(-1));
      });
      if (real.ok) {
        const done = completeRound(real.value);
        preview.legs.forEach((leg, i) => expect(done.units.find(u => u.id === legs[i]!.unitIds[0])!.hexId, `${name} leg ${i} arrival`).toBe(leg.destination));
      }
    }
    void u1; void u2;
  });
  it('terrain cost, budget and remaining per leg (forest = 2 of 2)', () => {
    const { state, legs, d1, byId } = twoLegs();
    byId.get(d1)!.terrain = 'FOREST' as never;
    const preview = previewMoveOrder(state, p1, legs);
    expect(preview.legs.map(l => [l.cost, l.budget, l.remaining])).toEqual([[2, 2, 0], [1, 2, 1]]);
    expect([preview.ordersBefore, preview.ordersAfter, preview.ordersLimit, preview.pieces, preview.maxPieces]).toEqual([0, 1, 5, 2, 3]);
  });
  it('a leg whose pieces differ walks at the pace of the slowest (Pioneiro 3 + Cerco 1 over 2 plains)', () => {
    const a = arena(), x = a.near(a.center)[0]!, y = a.near(x).find(id => id !== a.center && !a.near(a.center).includes(id))!;
    const group = [put(a.state, 'PIONEER', a.center), put(a.state, 'SIEGE', a.center)], solo = put(a.state, 'INFANTRY', a.center);
    const z = a.near(a.center).find(id => id !== x)!;
    const preview = previewMoveOrder(a.state, p1, [{ unitIds: group, path: [x, y] as never }, { unitIds: [solo], path: [z] as never }]);
    expect(preview.legs[0]!.ok).toBe(false);
    expect(preview.legs[0]!.budget).toBe(1);
    expect(preview.legs[0]!.blockers[0]!.code).toBe('RANGE');
    expect(preview.legs[1]!.ok).toBe(true);
  });
});

describe('projection', () => {
  it('coordinatedMoveView lists which pieces are already in an Order, with the leg', () => {
    const { state, legs, u1, u2 } = twoLegs(), third = put(state, 'INFANTRY', state.units.find(u => u.id === u1)!.hexId);
    const queued = must(state, p1, { type: 'QUEUE_ORDER', order: move('c1', legs) });
    const view = coordinatedMoveView(queued, p1);
    expect([view.enabled, view.maxPieces, view.usedPieces]).toEqual([true, 3, 2]);
    expect(view.queued).toEqual([{ orderId: 'c1', pieces: 2, legs: 2 }]);
    expect(view.pieces.find(p => p.unitId === u1)).toEqual({ unitId: u1, inOrder: true, orderId: 'c1', orderType: 'MOVE', legIndex: 0 });
    expect(view.pieces.find(p => p.unitId === u2)).toMatchObject({ inOrder: true, legIndex: 1 });
    expect(view.pieces.find(p => p.unitId === third)).toEqual({ unitId: third, inOrder: false });
  });
});
