import { describe, expect, it } from 'vitest';
import { appendFileSync } from 'node:fs';
import type { AlphaCommand, AlphaState, MoveLeg } from '@aoh/game-domain';
import { alphaActionUsage, previewAction, previewMoveOrder, hexId, hexNeighbors, type ActionPreview } from '@aoh/game-engine';
import { completeRound } from './alpha-rounds.js';
import { apply, coreCity, freshGame, meta, P1, plan, seat, shape, urban } from './v12-audit-urban-helpers.js';

/**
 * Slice 4 · previewAction (Ficha de Ação). The preview runs the REAL engine function on a clone of the state the seat's earlier plans leave, and the resolver builds
 * `ResolutionEvent.applied` with the same two-state reading, so preview == applied. Engine-only, deterministic, no simulations. Findings are also appended to $UX_DUMP when set
 * (vitest output is condensed in this repo).
 */
const dump = (line: string) => { if (process.env.UX_DUMP) appendFileSync(process.env.UX_DUMP, `${line}\n`); };
const cmd = (state: AlphaState, command: Record<string, unknown>) => ({ expectedVersion: state.version, ...command }) as AlphaCommand;
const preview = (state: AlphaState, command: Record<string, unknown>): ActionPreview => previewAction(state, P1, cmd(state, command));
const cityOf = (state: AlphaState) => meta(state).cityId;
const act = (state: AlphaState, action: string, extra: Record<string, unknown> = {}) => preview(state, urban(cityOf(state), action, extra));
const gain = (p: ActionPreview, key: string) => { const e = p.effects.find(item => item.kind === 'RESOURCE' && item.target === key); return e ? (e.after as number) - (e.before as number) : 0; };

/** A Vila (Capacidade 2) with `hexes` neighbouring plains claimed and worked, `producers` Produtores, and an empty-ish stock so nothing hits the storage limit. */
function village(options: { civ?: string; hexes?: number; producers?: number; improvement?: 'FARM' | null; mood?: number; stock?: Record<string, number> } = {}) {
  const state = freshGame(options.civ ?? 'valgard');
  const hexes = options.hexes ?? 3, producers = options.producers ?? hexes;
  shape(state, 'VILLAGE', 8, { producers, artisans: 2, unassigned: 8 - producers - 2 });
  const city = coreCity(state), byId = new Map(state.core.map.map(t => [t.id as string, t]));
  const ring = hexNeighbors(byId.get(city.hexId as string)!).map(hexId).filter(id => byId.has(id)).slice(0, hexes);
  for (const id of ring) { const t = byId.get(id)!; t.terrain = 'PLAINS' as never; t.features = [] as never; t.ownerId = P1 as never; t.controllerCityId = city.id as never; t.improvement = (options.improvement ?? null) as never; }
  city.workedHexIds = ring.sort() as never;
  meta(state).mood = options.mood ?? 4;
  state.core.players.find(player => player.id === P1)!.civilization.government = 'REPUBLIC' as never; // every level is paid; the Conselho's free level is tested apart
  Object.assign(seat(state).resources, { food: 2, wood: 1, stone: 0, metal: 0, wealth: 4, knowledge: 0, influence: 0, culture: 2 }, options.stock ?? {});
  return state;
}
/** Plans `earlier`, previews `last` against the state they leave, queues it, resolves the round and returns both sides of the comparison. */
function previewThenResolve(state: AlphaState, earlier: Record<string, unknown>[], last: Record<string, unknown>) {
  let current = state;
  for (const command of earlier) { const result = apply(current, command); if (!result.ok) throw new Error(result.error.message); current = result.value; }
  const asked = preview(current, last);
  const round = current.core.round;
  const outcome = plan(current, [last]);
  const report = outcome.after.roundReports.find(entry => entry.playerId === P1 && entry.round === round)!;
  const events = report.resolution.filter(event => event.applied && event.cityId === (last.cityId as string));
  return { asked, applied: events.at(-1)?.applied, events, outcome };
}
const sameResult = (asked: ActionPreview, applied: NonNullable<ReturnType<typeof previewThenResolve>['applied']>) => {
  expect(asked.effects).toEqual(applied.effects);
  expect(asked.cost.resources).toEqual(applied.cost.resources);
  expect(asked.cost.stockAfter).toEqual(applied.cost.stockAfter);
  expect(asked.cost.activation).toEqual(applied.cost.activation);
  expect(asked.cost.substitution).toEqual(applied.cost.substitution);
  expect(asked.cost.upkeepDelta).toEqual(applied.cost.upkeepDelta);
  expect(asked.cost.order?.type).toBe(applied.cost.order?.type);
  expect(asked.cost.order?.limit).toBe(applied.cost.order?.limit);
};

describe('previewAction · read-only', () => {
  it('never writes: the state is byte-identical after every kind of preview', () => {
    const state = village({ stock: { culture: 3 } });
    const before = JSON.stringify(state);
    const id = cityOf(state);
    for (const command of [urban(id, 'PRODUCE'), urban(id, 'PROMOTE_MOOD'), urban(id, 'RECRUIT', { unit: 'INFANTRY', count: 2 }), urban(id, 'BUILD', { build: { kind: 'DISTRICT', district: 'AGRARIAN' } }), urban(id, 'ELEVATE'), urban(id, 'RESEARCH', { advancementId: 'web-masonry' }), { type: 'READY' }, { type: 'PLAY_CARD', cardId: 'x' }]) preview(state, command);
    expect(JSON.stringify(state)).toBe(before);
  });
  it('a command of a stranger or an unsupported command is never eligible, and says so', () => {
    const state = village();
    const unsupported = preview(state, { type: 'PLAY_CARD', cardId: 'none' });
    expect(unsupported).toMatchObject({ coverage: 'UNSUPPORTED', eligible: false });
    expect(unsupported.blockers[0]!.code).toBe('UNSUPPORTED');
    const rival = state.cities.find(city => city.currentOwnerId !== P1)!;
    expect(preview(state, urban(rival.cityId, 'PRODUCE')).blockers[0]).toMatchObject({ code: 'NOT_OWN_CITY' });
  });
  it('eligible agrees with what the engine accepts when queuing (Ordens, ativação, recursos)', () => {
    const state = village({ stock: { culture: 3, wealth: 6, wood: 6, stone: 4 } });
    const id = cityOf(state);
    const commands = [urban(id, 'PRODUCE'), urban(id, 'PROMOTE_MOOD'), urban(id, 'RECRUIT', { unit: 'INFANTRY' }), urban(id, 'RECRUIT', { unit: 'RANGED' }), urban(id, 'BUILD', { build: { kind: 'DISTRICT', district: 'AGRARIAN' } }), urban(id, 'BUILD', { build: { kind: 'BUILDING', building: 'MARKET' } }), urban(id, 'ELEVATE'), urban(id, 'RESEARCH', { advancementId: 'web-masonry' }), urban(id, 'RESEARCH', { advancementId: 'web-engineering' }), urban(id, 'EMERGENCY_GOVERN'), urban(id, 'CIVIC_ACTION')];
    for (const command of commands) {
      const asked = preview(state, command), queued = apply(state, command);
      expect(asked.eligible, JSON.stringify(command)).toBe(queued.ok);
      if (!asked.eligible) expect(asked.blockers.length, JSON.stringify(command)).toBeGreaterThan(0);
    }
  });
});

describe('previewAction · PRODUCE', () => {
  it('yield per resource is the real one, hexes without worker are named, and the activation is shown', () => {
    const state = village({ hexes: 3, producers: 3 });
    const p = act(state, 'PRODUCE');
    expect(p.eligible).toBe(true);
    const breakdown = p.details!.produce as { capacity: number; forgone: { hexes: string[] }; producers: { total: number; working: number } };
    expect(breakdown.capacity).toBe(2);
    expect(breakdown.forgone.hexes).toHaveLength(1);
    expect(breakdown.producers).toMatchObject({ total: 3, working: 2 });
    expect(p.warnings.map(w => w.code)).toContain('CAPACITY_LOSS');
    expect(p.effects.find(e => e.target.endsWith(':unworked-hexes'))).toMatchObject({ kind: 'STATE', before: 3, after: 2 });
    expect(p.cost.activation).toMatchObject({ usedBefore: 0, usedAfter: 1, max: 2, moodCost: 0 });
    expect(p.cost.order).toMatchObject({ type: 'CITY', usedBefore: 0, usedAfter: 1, limit: 5 });
    dump(`PRODUCE yields ${JSON.stringify(p.effects.filter(e => e.kind === 'RESOURCE'))}`);
  });
  it('the farm bonus of Aurélia (kitProduceBonus) is counted exactly', () => {
    const plain = village({ civ: 'aurelia', improvement: null }), farmed = village({ civ: 'aurelia', improvement: 'FARM' });
    const a = act(plain, 'PRODUCE'), b = act(farmed, 'PRODUCE');
    const kit = (b.details!.produce as { kit: { food: number } }).kit.food;
    expect(kit).toBeGreaterThanOrEqual(1);
    expect((a.details!.produce as { kit: { food: number } }).kit.food).toBe(0);
    expect(gain(b, 'food')).toBeGreaterThan(gain(a, 'food'));
  });
  it('Próspera takes +1 Capacity on the first activation only', () => {
    const stable = act(village({ hexes: 3, mood: 4 }), 'PRODUCE'), rich = act(village({ hexes: 3, mood: 5 }), 'PRODUCE');
    expect((stable.details!.produce as { capacity: number; prosperousBonus: boolean })).toMatchObject({ capacity: 2, prosperousBonus: false });
    expect((rich.details!.produce as { capacity: number; prosperousBonus: boolean })).toMatchObject({ capacity: 3, prosperousBonus: true });
    expect((rich.details!.produce as { forgone: { hexes: string[] } }).forgone.hexes).toHaveLength(0);
  });
  it('the second activation costs 1 Ânimo, and a Tribunal waives it', () => {
    const state = village({ hexes: 2 });
    const second = previewThenResolve(state, [urban(cityOf(state), 'PRODUCE')], urban(cityOf(state), 'PRODUCE'));
    expect(second.asked.cost.activation).toMatchObject({ usedBefore: 1, usedAfter: 2, moodCost: 1 });
    expect(second.asked.warnings.map(w => w.code)).toContain('SECOND_ACTIVATION');
    expect(second.asked.effects.find(e => e.kind === 'MOOD')).toMatchObject({ before: 4, after: 3 });
    sameResult(second.asked, second.applied!);
    const court = village({ hexes: 2 }); meta(court).buildings = ['COURT'];
    const waived = previewThenResolve(court, [urban(cityOf(court), 'PRODUCE')], urban(cityOf(court), 'PRODUCE'));
    expect(waived.asked.cost.activation).toMatchObject({ usedAfter: 2, moodCost: 0 });
    expect(waived.asked.warnings.map(w => w.code)).toContain('COURT_WAIVER');
    expect(waived.asked.effects.some(e => e.kind === 'MOOD')).toBe(false);
    sameResult(waived.asked, waived.applied!);
  });
  it('food at the end of the round counts the earlier plans', () => {
    const state = village({ hexes: 2, stock: { food: 6, wood: 4 } });
    const alone = act(state, 'PRODUCE');
    const queued = apply(state, urban(cityOf(state), 'RECRUIT', { unit: 'INFANTRY' }));
    expect(queued.ok).toBe(true);
    if (!queued.ok) return;
    const after = act(queued.value, 'PRODUCE');
    const food = (p: ActionPreview) => p.details!.food as { stockAfterAction: number; eatenInMaintenance: number; balance: number };
    expect(food(after).stockAfterAction).toBe(food(alone).stockAfterAction - 1 + 0); // the Infantaria costs 1 Alimento; nothing else differs
    expect(after.warnings.map(w => w.code)).toContain('EARLIER_PLANS');
    expect(food(after).balance).toBe(food(after).stockAfterAction - food(after).eatenInMaintenance);
  });
  it('preview == applied', () => {
    const state = village({ hexes: 3, civ: 'aurelia', improvement: 'FARM' });
    const { asked, applied, events } = previewThenResolve(state, [], urban(cityOf(state), 'PRODUCE'));
    expect(applied).toBeDefined();
    sameResult(asked, applied!);
    expect(events.at(-1)!.message).toMatch(/produziu \+\d+ Alimento/);
    expect(events.at(-1)!.message).toContain('sem trabalhador');
  });
});

describe('previewAction · PROMOTE_MOOD (Governar)', () => {
  it('Ânimo before → after, levels, total cost, Pedra of the repair', () => {
    const state = village({ mood: 2, stock: { culture: 3, wealth: 0, stone: 2 } });
    meta(state).fortification = { ...meta(state).fortification, level: 'PALISADE' as never, state: 'DAMAGED' };
    const p = act(state, 'PROMOTE_MOOD', { levels: 2 });
    expect(p.eligible).toBe(true);
    expect(p.effects.find(e => e.kind === 'MOOD')).toMatchObject({ before: 2, after: 4, note: 'Abalada → Estável' });
    expect(p.effects.find(e => e.target.endsWith(':govern-levels'))).toMatchObject({ before: 0, after: 2 });
    expect(p.cost.resources).toEqual({ culture: 2, stone: 1 });
    expect(p.cost.stockAfter).toMatchObject({ culture: 1, stone: 1 });
    expect(p.effects.some(e => e.target.endsWith(':fortification'))).toBe(true);
  });
  it('blocks with a concrete cause and the resource that is missing', () => {
    const none = act(village({ mood: 2, stock: { culture: 0, wealth: 1 } }), 'PROMOTE_MOOD');
    expect(none.eligible).toBe(false);
    expect(none.blockers[0]).toMatchObject({ code: 'NO_RESOURCE', missing: { kind: 'RESOURCE', id: 'wealth', have: 1, need: 2 } });
    const full = act(village({ mood: 6, stock: { culture: 3 } }), 'PROMOTE_MOOD');
    expect(full.eligible).toBe(false);
    expect(full.blockers[0]!.code).toBe('MOOD_FULL');
  });
  it('a plan that already took the Cultura makes the next Governar not confirmable, naming the earlier plan', () => {
    const state = village({ mood: 4, stock: { culture: 1, wealth: 0 } });
    const first = apply(state, urban(cityOf(state), 'PROMOTE_MOOD', { levels: 1 }));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const p = act(first.value, 'PROMOTE_MOOD', { levels: 1 });
    expect(p.eligible).toBe(false);
    expect(p.blockers[0]!.message).toMatch(/resolução|Planos anteriores/);
    expect(p.warnings.map(w => w.code)).toContain('EARLIER_PLANS');
    expect(apply(first.value, urban(cityOf(state), 'PROMOTE_MOOD', { levels: 1 })).ok).toBe(false); // the engine refuses it too: no Ordem is lost
  });
  it('preview == applied (also with the second-activation penalty)', () => {
    const state = village({ mood: 2, stock: { culture: 3, wealth: 0, stone: 2 } });
    meta(state).fortification = { ...meta(state).fortification, level: 'PALISADE' as never, state: 'DAMAGED' };
    const one = previewThenResolve(state, [], urban(cityOf(state), 'PROMOTE_MOOD', { levels: 2 }));
    sameResult(one.asked, one.applied!);
    const stable = village({ mood: 4, stock: { culture: 3 }, hexes: 1 });
    const two = previewThenResolve(stable, [urban(cityOf(stable), 'PRODUCE')], urban(cityOf(stable), 'PROMOTE_MOOD', { levels: 1 }));
    expect(two.asked.cost.activation!.moodCost).toBe(1);
    sameResult(two.asked, two.applied!);
  });
});

describe('previewAction · RECRUIT', () => {
  it('count multiplies the cost, Riqueza stands in for the missing material, and the upkeep is announced', () => {
    const state = village({ stock: { food: 6, wood: 3, wealth: 6 } });
    const one = act(state, 'RECRUIT', { unit: 'INFANTRY', count: 1 }), two = act(state, 'RECRUIT', { unit: 'INFANTRY', count: 2 });
    dump(`RECRUIT two ${JSON.stringify(two.blockers)} ${JSON.stringify(two.cost)}`);
    expect(two.eligible).toBe(true);
    for (const key of Object.keys(one.cost.resources) as (keyof typeof one.cost.resources)[]) if (key !== 'wealth') expect(two.cost.resources[key]).toBeGreaterThanOrEqual(one.cost.resources[key]!);
    expect(two.cost.substitution?.[0]).toMatchObject({ resource: 'wood' });
    expect(two.cost.substitution![0]!.wealth).toBe(two.cost.resources.wealth);
    expect(two.cost.upkeepDelta).toBeDefined();
    expect(two.warnings.map(w => w.code)).toContain('UPKEEP');
    expect(two.effects.find(e => e.target === 'unit:INFANTRY')).toMatchObject({ before: state.units.filter(u => u.ownerId === P1 && u.kind === 'INFANTRY').length, after: state.units.filter(u => u.ownerId === P1 && u.kind === 'INFANTRY').length + 2 });
    expect(two.effects.find(e => e.kind === 'POPULATION')).toMatchObject({ before: 8, after: 6 });
    const recruit = two.details!.recruit as { count: number; stack: { military: { used: number; limit: number } } | null; soldiers: { mobilizes: number } };
    expect(recruit.count).toBe(2); expect(recruit.soldiers.mobilizes).toBe(2); expect(recruit.stack).not.toBeNull();
    dump(`RECRUIT x2 ${JSON.stringify({ cost: two.cost, warnings: two.warnings })}`);
  });
  it('the Riqueza cap applies per piece: the first piece the stock cannot pay is named', () => {
    const p = act(village({ stock: { food: 6, wood: 2, wealth: 6 } }), 'RECRUIT', { unit: 'INFANTRY', count: 2 });
    expect(p.eligible).toBe(false);
    expect(p.blockers[0]).toMatchObject({ code: 'NO_RESOURCE', missing: { kind: 'RESOURCE' } });
    expect(p.blockers[0]!.message).toMatch(/^Peça 2 de 2: Falt/);
  });
  it('names the missing Teia advance (no web-* ids), the Era with a number, and the Soldados', () => {
    const state = village({ stock: { food: 9, wood: 9, stone: 9, metal: 9, wealth: 9 } });
    const archers = act(state, 'RECRUIT', { unit: 'RANGED' });
    const kinds = archers.blockers.filter(b => b.missing?.kind === 'ADVANCE');
    for (const blocker of archers.blockers) expect(blocker.message).not.toMatch(/web-/);
    dump(`RECRUIT archers ${JSON.stringify(archers.blockers)}`);
    if (kinds.length) expect(kinds[0]!.missing!.need).toMatch(/\p{L}/u);
    const siege = act(state, 'RECRUIT', { unit: 'SIEGE' });
    const era = siege.blockers.find(b => b.missing?.kind === 'ERA');
    if (era) expect(era.message).toMatch(/Era (I|II|III|IV|V|VI|VII) \(/);
    const empty = village({ producers: 6, stock: { food: 9, wood: 9 } });
    const none = act(empty, 'RECRUIT', { unit: 'INFANTRY' });
    expect(none.blockers.some(b => b.missing?.kind === 'SOLDIERS' && b.missing.have === 0)).toBe(true);
  });
  it('preview == applied', () => {
    const state = village({ stock: { food: 6, wood: 3, wealth: 6 } });
    const { asked, applied } = previewThenResolve(state, [], urban(cityOf(state), 'RECRUIT', { unit: 'INFANTRY', count: 2 }));
    expect(applied).toBeDefined();
    sameResult(asked, applied!);
    expect(applied!.cost.substitution).toBeDefined();
  });
});

describe('previewAction · BUILD, ELEVATE, RESEARCH (structured eligibility)', () => {
  it('Elevar: population have/need, Era with a number, advance by name, resource by name', () => {
    const state = village({ stock: { wood: 1, stone: 0, wealth: 0 } });
    shape(state, 'VILLAGE', 6, { producers: 3, artisans: 1, unassigned: 2 });
    const p = act(state, 'ELEVATE');
    expect(p.eligible).toBe(false);
    const codes = p.blockers.map(b => b.code);
    expect(codes).toEqual(expect.arrayContaining(['POPULATION', 'NO_RESOURCE']));
    expect(p.blockers.find(b => b.code === 'POPULATION')!.missing).toMatchObject({ kind: 'POPULATION', have: 6, need: 8 });
    expect(p.blockers.some(b => /web-/.test(b.message))).toBe(false);
    for (const b of p.blockers.filter(item => item.code === 'ERA')) expect(b.message).toMatch(/Era [IVX]+ \(/);
    dump(`ELEVATE ${JSON.stringify(p.blockers)}`);
  });
  it('Construir: missing district, missing advance by name, missing resource with how much and whether Riqueza would cover', () => {
    const state = village({ stock: { wood: 0, stone: 0, wealth: 0 } });
    const market = act(state, 'BUILD', { build: { kind: 'BUILDING', building: 'MARKET' } });
    expect(market.blockers.map(b => b.code)).toContain('MISSING_DISTRICT');
    const district = act(state, 'BUILD', { build: { kind: 'DISTRICT', district: 'AGRARIAN' } });
    expect(district.eligible).toBe(false);
    const resource = district.blockers.find(b => b.code === 'NO_RESOURCE');
    dump(`BUILD district ${JSON.stringify(district.blockers)}`);
    if (resource) { expect(resource.missing!.kind).toBe('RESOURCE'); expect(resource.message).toMatch(/Falt/); }
    const advance = district.blockers.find(b => b.code === 'NO_ADVANCE');
    if (advance) { expect(advance.message).not.toMatch(/web-/); expect(advance.missing!.kind).toBe('ADVANCE'); }
    const rich = village({ stock: { wood: 0, stone: 0, wealth: 30, food: 5 } });
    const covered = act(rich, 'BUILD', { build: { kind: 'DISTRICT', district: 'AGRARIAN' } });
    if (covered.eligible) expect(covered.cost.substitution?.length ?? 0).toBeGreaterThan(0);
  });
  it('Pesquisar: prerequisite by name; eligible research shows the advance as the effect and the Ordem Avanço without activation', () => {
    const state = village({ stock: { knowledge: 9 } });
    const locked = act(state, 'RESEARCH', { advancementId: 'web-engineering' });
    expect(locked.eligible).toBe(false);
    for (const b of locked.blockers) expect(b.message).not.toMatch(/web-/);
    expect(locked.blockers.some(b => b.missing?.kind === 'ADVANCE' || b.missing?.kind === 'ERA')).toBe(true);
    dump(`RESEARCH locked ${JSON.stringify(locked.blockers)}`);
    const ok = act(state, 'RESEARCH', { advancementId: 'web-masonry' });
    if (ok.eligible) {
      expect(ok.cost.order!.type).toBe('ADVANCE'); expect(ok.cost.activation).toBeNull();
      expect(ok.effects.find(e => e.kind === 'ADVANCE')!.label).toBe('Alvenaria');
    }
  });
  it('no Ordem left: the cause is the Ordem, with how many are used', () => {
    const state = village({ stock: { knowledge: 20, culture: 9 } });
    let current = state;
    for (let i = 0; i < 5; i++) { const r = apply(current, urban(cityOf(current), 'RESEARCH', { advancementId: ['web-masonry', 'web-agriculture', 'web-mining', 'web-bronze', 'web-writing'][i] })); if (r.ok) current = r.value; }
    const used = alphaActionUsage(current, P1).used;
    if (used >= 5) { const p = act(current, 'PRODUCE'); expect(p.blockers[0]).toMatchObject({ code: 'NO_ORDERS', missing: { kind: 'ORDER' } }); }
    dump(`orders used ${used}`);
  });
});

describe('previewAction · MOVE (reusa previewMoveOrder)', () => {
  function legsOf(state: AlphaState): { legs: MoveLeg[]; ids: string[] } {
    const byId = new Map(state.core.map.map(t => [t.id as string, t]));
    const city = state.core.players[0]!.civilization.cities[0]!;
    const centre = byId.get(city.hexId as string)!;
    const open = hexNeighbors(centre).map(hexId).filter(id => byId.has(id) && byId.get(id)!.terrain !== 'SEA' && byId.get(id)!.terrain !== 'UNKNOWN');
    const mine = state.units.filter(u => u.ownerId === P1 && state.rules.units[u.kind].domain === 'LAND').slice(0, 2);
    return { legs: mine.map((u, i) => ({ unitIds: [u.id], path: [open[i]!] })) as MoveLeg[], ids: mine.map(u => u.id) };
  }
  it('per leg: cost, budget, remaining and destination, one Ordem EXPEDIÇÃO, effects POSITION per piece', () => {
    const state = freshGame(); for (const p of state.players) p.knownHexIds = state.core.map.map(t => t.id) as never;
    const { legs } = legsOf(state);
    const order = { id: 'mv', type: 'MOVE', legs };
    const p = preview(state, { type: 'QUEUE_ORDER', order });
    const direct = previewMoveOrder(state, P1, legs, { orderId: 'mv' });
    expect(p.eligible).toBe(direct.ok);
    expect((p.details!.move as typeof direct).legs.map(l => [l.cost, l.budget, l.remaining])).toEqual(direct.legs.map(l => [l.cost, l.budget, l.remaining]));
    expect(p.cost.order).toMatchObject({ type: 'EXPEDITION', usedBefore: direct.ordersBefore, usedAfter: direct.ordersAfter });
    if (p.eligible) {
      expect(p.effects.filter(e => e.kind === 'POSITION')).toHaveLength(legs.length);
      for (const leg of legs) expect(p.effects.find(e => e.target === `unit:${leg.unitIds[0]}`)).toMatchObject({ after: leg.path[0], certainty: 'EXACT' });
    }
    dump(`MOVE ${JSON.stringify({ eligible: p.eligible, blockers: p.blockers, effects: p.effects })}`);
  });
  it('preview == applied per leg: each MOVEMENT event has the leg destination and origin', () => {
    const state = freshGame(); for (const p of state.players) p.knownHexIds = state.core.map.map(t => t.id) as never;
    const { legs } = legsOf(state);
    const asked = preview(state, { type: 'QUEUE_ORDER', order: { id: 'mv', type: 'MOVE', legs } });
    if (!asked.eligible) { dump(`MOVE not eligible: ${JSON.stringify(asked.blockers)}`); return; }
    const queued = apply(state, { type: 'QUEUE_ORDER', order: { id: 'mv', type: 'MOVE', legs } });
    expect(queued.ok).toBe(true);
    if (!queued.ok) return;
    const done = completeRound(queued.value);
    for (const effect of asked.effects.filter(e => e.kind === 'POSITION')) {
      const unitId = effect.target.replace('unit:', '');
      const event = done.resolutionEvents.find(e => e.type === 'MOVEMENT' && e.actorId === P1 && e.unitIds.includes(unitId));
      expect(event, unitId).toBeDefined();
      expect({ from: event!.fromHexId, to: event!.hexId }).toEqual({ from: effect.before, to: effect.after });
    }
  });
  it('a coordinated order with a repeated piece or a rival piece is not eligible, with the leg named', () => {
    const state = freshGame(); for (const p of state.players) p.knownHexIds = state.core.map.map(t => t.id) as never;
    const { legs } = legsOf(state);
    const rival = state.units.find(u => u.ownerId !== P1)!;
    const bad = preview(state, { type: 'QUEUE_ORDER', order: { id: 'mv', type: 'MOVE', legs: [legs[0]!, { unitIds: [rival.id], path: legs[1]!.path }] } });
    expect(bad.eligible).toBe(false);
    expect(bad.blockers.some(b => /Trajeto 2 de 2/.test(b.message) || b.code === 'NOT_OWNED')).toBe(true);
  });
});

describe('previewAction · territory commands in Portuguese', () => {
  it('CLAIM_HEX / IMPROVE_HEX / ASSIGN_WORKED_HEXES: concrete blockers, never the core English', () => {
    const state = village({ stock: { wood: 0, food: 0, stone: 0, wealth: 0 } });
    const city = coreCity(state), far = state.core.map.find(t => t.ownerId === null && t.terrain === 'PLAINS')!;
    const manage = (command: Record<string, unknown>) => preview(state, { type: 'MANAGE', command: { playerId: P1, expectedVersion: state.core.version, ...command } });
    const claim = manage({ type: 'CLAIM_HEX', cityId: city.id, hexId: far.id });
    expect(claim.eligible).toBe(false);
    for (const b of claim.blockers) expect(b.message).not.toMatch(/Cannot afford|Target exceeds|requires PLANNING|Only unowned/);
    const improve = manage({ type: 'IMPROVE_HEX', hexId: city.hexId, improvement: 'FARM' });
    for (const b of improve.blockers) expect(b.message).not.toMatch(/Cannot afford|Replacing|incompatible/);
    const assign = manage({ type: 'ASSIGN_WORKED_HEXES', cityId: city.id, hexIds: ['0,0', '0,0'] });
    expect(assign.eligible).toBe(false);
    expect(assign.blockers[0]!.message).toMatch(/Produtor/);
    dump(`TERRITORY ${JSON.stringify([claim.blockers, improve.blockers, assign.blockers])}`);
  });
  it('a claim the stock can pay is eligible with its configured cost', () => {
    const state = village({ hexes: 1, stock: { wood: 5, food: 5, stone: 5, wealth: 5 } });
    const city = coreCity(state), centre = state.core.map.find(t => t.id === city.hexId)!;
    const target = hexNeighbors(centre).map(hexId).map(id => state.core.map.find(t => t.id === id)).find(t => t && t.ownerId === null && t.terrain !== 'SEA' && t.terrain !== 'UNKNOWN');
    if (!target) return;
    const p = preview(state, { type: 'MANAGE', command: { type: 'CLAIM_HEX', playerId: P1, cityId: city.id, hexId: target.id, expectedVersion: state.core.version } });
    dump(`CLAIM ${JSON.stringify({ eligible: p.eligible, cost: p.cost.resources, blockers: p.blockers })}`);
    if (p.eligible) { expect(Object.keys(p.cost.resources).length).toBeGreaterThan(0); expect(p.effects[0]!.target).toBe(`hex:${target.id}:owner`); }
  });
});

describe('previewAction · ATTACK, SETTLE, privacy of the applied result', () => {
  it('ATTACK: eligibility from the real validator and the combat reading, with the result HIDDEN', async () => {
    const { arena, p1 } = await import('./alpha-arena.js');
    const { state, order } = arena();
    const asked = previewAction(state, p1, { type: 'QUEUE_ORDER', expectedVersion: state.version, order } as AlphaCommand);
    expect(asked).toMatchObject({ coverage: 'PARTIAL', eligible: true, resolvesAt: 'RESOLUTION' });
    expect(asked.effects[0]).toMatchObject({ kind: 'STATE', certainty: 'HIDDEN' });
    expect((asked.details!.combat as { ok: boolean }).ok).toBe(true);
    expect(asked.cost.order).toMatchObject({ type: 'EXPEDITION' });
    state.wars = [];
    const peace = previewAction(state, p1, { type: 'QUEUE_ORDER', expectedVersion: state.version, order } as AlphaCommand);
    expect(peace.eligible).toBe(false);
    expect(peace.blockers[0]!.message).toMatch(/guerra/);
  });
  it('SETTLE: dry-run on a clone, the cost and the new city, or the engine refusal', () => {
    const state = freshGame();
    const pioneer = state.units.find(u => u.ownerId === P1 && u.kind === 'PIONEER')!;
    const asked = preview(state, { type: 'SETTLE', unitId: pioneer.id, name: 'Nova' });
    expect(asked.coverage).toBe('FULL');
    expect(asked.resolvesAt).toBe('NOW');
    expect(asked.eligible).toBe(apply(state, { type: 'SETTLE', unitId: pioneer.id, name: 'Nova' }).ok);
    if (!asked.eligible) expect(asked.blockers.length).toBeGreaterThan(0);
  });
  it('the applied result never reaches a rival that merely sees the building', () => {
    const state = village({ stock: { wood: 9, stone: 9, wealth: 9, food: 9 } });
    seat(state).research.push('web-agriculture');
    const city = coreCity(state);
    state.units.push({ id: 'watcher', ownerId: 'p2', kind: 'INFANTRY', hexId: city.hexId, recruitedRound: 1, carrierId: null } as never);
    const { outcome } = previewThenResolve(state, [], urban(cityOf(state), 'BUILD', { build: { kind: 'DISTRICT', district: 'AGRARIAN' } }));
    const round = state.core.round;
    const mine = outcome.after.roundReports.find(r => r.playerId === P1 && r.round === round)!.resolution, theirs = outcome.after.roundReports.find(r => r.playerId === 'p2' && r.round === round)!.resolution;
    const ownEvent = mine.find(e => e.cityId === cityOf(state) && e.type === 'CONSTRUCTION');
    expect(ownEvent?.applied).toBeDefined();
    expect(ownEvent!.applied!.effects.some(e => e.kind === 'BUILDING')).toBe(true);
    const seen = theirs.filter(e => e.cityId === cityOf(state) && e.type === 'CONSTRUCTION');
    dump(`privacy: rival sees ${seen.length} construction event(s)`);
    for (const event of theirs) expect(event.applied).toBeUndefined();
  });
});
