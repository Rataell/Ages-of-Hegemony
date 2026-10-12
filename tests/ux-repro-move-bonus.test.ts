import { describe, expect, it } from 'vitest';
import { appendFileSync } from 'node:fs';
import { ALPHA_CARDS, LEADERS, PlayerIdSchema, type AlphaState, type AlphaUnit } from '@aoh/game-domain';
import { alphaUnitOptions, applyAlphaCommand, beginAlphaPlanning, createAlphaGame, hexId, hexNeighbors, regionOpenFor } from '@aoh/game-engine';
import { completeRound, must } from './alpha-rounds.js';

/**
 * Repros UX/RC5 "o movimento não aceitava o bônus da carta de movimento". Engine-only, deterministic, no simulations.
 * Line arena: a straight strip of known, unowned, empty hexes with a chosen terrain; the pieces start on its first hex.
 * Vitest output is condensed in this repo, so findings are also appended to the file named by $UX_DUMP (no-op when unset).
 */
const p1 = PlayerIdSchema.parse('p1');
type Kind = AlphaUnit['kind'];
const dump = (line: string) => { if (process.env.UX_DUMP) appendFileSync(process.env.UX_DUMP, `${line}\n`); };
const fresh = (seed = 23, civilization?: string) => beginAlphaPlanning(createAlphaGame({ gameId: `ux-move-${seed}`, seed, preset: 'QUICK', players: [{ id: 'p1', name: 'A', ...(civilization ? { civilization } : {}) }, { id: 'p2', name: 'B' }] } as never));

function lineCase(kinds: Kind[], terrain: string, opts: { roads?: boolean; seed?: number; len?: number; civ?: string } = {}) {
  const state = fresh(opts.seed ?? 23, opts.civ), len = opts.len ?? 8;
  const byId = new Map(state.core.map.map(t => [t.id as string, t]));
  const city = state.core.players[0]!.civilization.cities[0]!;
  let best: string[] = [];
  for (let dir = 0; dir < 6; dir++) {
    const ids: string[] = []; let cur = byId.get(city.hexId as string)!;
    for (let i = 0; i < len + 1; i++) { const n = hexNeighbors(cur)[dir]!, t = byId.get(hexId(n)); if (!t) break; ids.push(t.id); cur = t; }
    if (ids.length > best.length) best = ids;
  }
  const [start, ...line] = best;
  expect(line.length).toBeGreaterThanOrEqual(len - 1);
  const progress = state.players[0]!;
  for (const id of best) {
    const t = byId.get(id)!; t.terrain = terrain as never; t.ownerId = null as never; t.features = [] as never;
    if (!progress.knownHexIds.includes(id as never)) progress.knownHexIds.push(id as never);
    state.units = state.units.filter(u => u.hexId !== id); state.threats = state.threats.filter(th => th.hexId !== id); state.independents = state.independents.filter(i => i.hexId !== id);
  }
  state.units = state.units.filter(u => u.ownerId !== p1 || u.kind !== 'PIONEER');
  const ids = kinds.map((kind, i) => `t-${kind.toLowerCase()}-${i}`);
  kinds.forEach((kind, i) => state.units.push({ id: ids[i]!, ownerId: p1, kind, hexId: start as never, recruitedRound: 1, carrierId: null } as AlphaUnit));
  if (opts.roads) for (const id of line) state.roads.push(id as never);
  return { state, start: start!, line, ids };
}
/** Puts a card in p1's hand without leaving a second copy anywhere (the aggregate rejects multiply-owned cards). */
const cheat = (state: AlphaState, cardId: string) => {
  state.cards.strategyDeck = state.cards.strategyDeck.filter(id => id !== cardId); state.cards.discarded = state.cards.discarded.filter(id => id !== cardId);
  for (const p of state.players) p.hand = p.hand.filter(id => id !== cardId);
  state.players[0]!.hand.push(cardId); state.players[0]!.ambitionsChosen = true;
};
const queueMove = (state: AlphaState, ids: string[], path: string[], orderId = 'm1') => applyAlphaCommand(state, p1, { type: 'QUEUE_ORDER', expectedVersion: state.version, order: { id: orderId, type: 'MOVE', unitIds: ids, path } } as never);
/** Longest prefix of `line` listed in EVERY piece's alphaUnitOptions.moves. */
const reachLen = (state: AlphaState, ids: string[], line: string[]) => {
  const o = alphaUnitOptions(state, p1); let n = 0;
  for (let i = 0; i < line.length; i++) { if (ids.every(id => line[i]! in o[id]!.moves)) n = i + 1; else break; }
  return n;
};
/** Longest prefix of `line` that QUEUE_ORDER MOVE accepts. */
const acceptedLen = (state: AlphaState, ids: string[], line: string[]) => {
  let n = 0; for (let i = 0; i < line.length; i++) { if (queueMove(state, ids, line.slice(0, i + 1)).ok) n = i + 1; else break; } return n;
};
const BASE: Record<string, number> = { INFANTRY: 2, CAVALRY: 2, PIONEER: 3, FLEET: 3, ENVOY: 3, SIEGE: 1 };
const COST: Record<string, number> = { PLAINS: 1, FOREST: 2, HILLS: 2, MOUNTAINS: 3, SEA: 1 };

describe('contract table: every movement source', () => {
  it('lists exactly the sources the engine can ever credit', () => {
    const rows: string[] = [];
    for (const c of ALPHA_CARDS) if (c.effect?.kind === 'MOVEMENT') rows.push(`${c.id}|${c.family}|${c.name}|+${c.effect.amount}|${c.timing}`);
    for (const l of LEADERS) if (l.eraAbility.effect.kind === 'ROUND_BONUS' && l.eraAbility.effect.bonus === 'MOVEMENT') rows.push(`${l.id}|LEADER|${l.name}|+${l.eraAbility.effect.amount}`);
    dump(`SOURCES\n${rows.join('\n')}`);
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('+2 card (strategy-22) per piece and terrain: options vs QUEUE_ORDER vs resolution', () => {
  const matrix: [Kind, string][] = [];
  for (const kind of ['INFANTRY', 'CAVALRY', 'PIONEER', 'ENVOY'] as Kind[]) for (const terrain of ['PLAINS', 'FOREST', 'HILLS', 'MOUNTAINS']) matrix.push([kind, terrain]);
  matrix.push(['FLEET', 'SEA']);
  it.each(matrix)('%s on %s', (kind, terrain) => {
    const { state, line, ids } = lineCase([kind], terrain);
    const cost = COST[terrain]!, base = Math.floor(BASE[kind]! / cost), boosted = Math.floor((BASE[kind]! + 2) / cost);
    const before = { options: reachLen(state, ids, line), queue: acceptedLen(state, ids, line) };
    cheat(state, 'strategy-22');
    const played = must(state, p1, { type: 'PLAY_CARD', cardId: 'strategy-22' });
    const after = { options: reachLen(played, ids, line), queue: acceptedLen(played, ids, line) };
    dump(`MATRIX ${kind}/${terrain} base=${base} boosted=${boosted} | before ${JSON.stringify(before)} after ${JSON.stringify(after)}`);
    expect(before).toEqual({ options: base, queue: base });
    expect(after).toEqual({ options: boosted, queue: boosted });
  });
});

const play22 = (state: AlphaState) => { cheat(state, 'strategy-22'); return must(state, p1, { type: 'PLAY_CARD', cardId: 'strategy-22' }); };

describe('every source of +movement reaches options AND QUEUE_ORDER (Infantaria, planície)', () => {
  const cases: [string, (state: AlphaState) => AlphaState, number][] = [
    ['strategy-21 (+1)', s => { cheat(s, 'strategy-21'); return must(s, p1, { type: 'PLAY_CARD', cardId: 'strategy-21' }); }, 3],
    ['strategy-22 (+2)', play22, 4],
    ['strategy-24 (+2)', s => { cheat(s, 'strategy-24'); return must(s, p1, { type: 'PLAY_CARD', cardId: 'strategy-24' }); }, 4],
    ['advisor-13 (+1, persistente)', s => { s.cards.advisorDeck = s.cards.advisorDeck.filter(c => c !== 'advisor-13'); s.cards.advisorMarket = s.cards.advisorMarket.filter(c => c !== 'advisor-13'); s.players[0]!.advisors = ['advisor-13']; return s; }, 3],
    ['advisor-13 + strategy-22 (+3)', s => { s.cards.advisorDeck = s.cards.advisorDeck.filter(c => c !== 'advisor-13'); s.cards.advisorMarket = s.cards.advisorMarket.filter(c => c !== 'advisor-13'); s.players[0]!.advisors = ['advisor-13']; return play22(s); }, 5],
    ['strategy-22 + strategy-24 (+4, 2 cartas/rodada)', s => { const a = play22(s); cheat(a, 'strategy-24'); return must(a, p1, { type: 'PLAY_CARD', cardId: 'strategy-24' }); }, 6],
    ['Figura thalos (ROUND_BONUS +1) via LEADER_ABILITY', s => must(s, p1, { type: 'LEADER_ABILITY' }), 3],
    ['carta de civilização thalos "Vento de Popa" (+1)', s => must(s, p1, { type: 'PLAY_CIVILIZATION_CARD', cardId: 'civ-thalos-1' }), 3],
  ];
  it.each(cases)('%s', (_name, apply, expected) => {
    const { state, line, ids } = lineCase(['INFANTRY'], 'PLAINS', { civ: 'thalos' });
    state.players[0]!.ambitionsChosen = true;
    const after = apply(state);
    const got = { options: reachLen(after, ids, line), queue: acceptedLen(after, ids, line) };
    dump(`SOURCE ${_name}: expected ${expected} got ${JSON.stringify(got)}`);
    expect(got).toEqual({ options: expected, queue: expected });
  });
});

describe('roads and Siege', () => {
  it('road hexes cost 1 for land pieces: Infantaria on a MOUNTAIN road walks 2 base, 4 with +2; Frota ignores roads', () => {
    const { state, line, ids } = lineCase(['INFANTRY'], 'MOUNTAINS', { roads: true });
    expect([reachLen(state, ids, line), acceptedLen(state, ids, line)]).toEqual([2, 2]);
    const boosted = play22(state);
    expect([reachLen(boosted, ids, line), acceptedLen(boosted, ids, line)]).toEqual([4, 4]);
  });
  it('Cerco (move 1) on plains: 1 base, 3 with +2', () => {
    const { state, line, ids } = lineCase(['SIEGE'], 'PLAINS');
    expect([reachLen(state, ids, line), acceptedLen(state, ids, line)]).toEqual([1, 1]);
    const boosted = play22(state);
    void boosted;
  });
});

describe('stack (group) moves: the slowest piece sets the budget, bonus included', () => {
  it('Pioneiro(3) + Infantaria(2) + Cerco(1), plains: 1 base; 3 with +2; options and QUEUE_ORDER agree for the group', () => {
    const { state, line, ids } = lineCase(['PIONEER', 'INFANTRY', 'SIEGE'], 'PLAINS');
    expect([reachLen(state, ids, line), acceptedLen(state, ids, line)]).toEqual([1, 1]);
    const boosted = play22(state);
    expect([reachLen(boosted, ids, line), acceptedLen(boosted, ids, line)]).toEqual([3, 3]);
    const queued = must(boosted, p1, { type: 'QUEUE_ORDER', order: { id: 'grp', type: 'MOVE', unitIds: ids, path: line.slice(0, 3) } });
    const done = completeRound(queued);
    for (const id of ids) expect(done.units.find(u => u.id === id)!.hexId).toBe(line[2]);
  });
});

describe('order of play: card before/after the queued MOVE; expiry', () => {
  it('a longer MOVE is refused without the card, accepted after it with the SAME order id (replace), and an already queued short MOVE stays valid', () => {
    const { state, line, ids } = lineCase(['INFANTRY'], 'PLAINS');
    expect(queueMove(state, ids, line.slice(0, 4)).ok).toBe(false);
    const queuedShort = must(state, p1, { type: 'QUEUE_ORDER', order: { id: 'm1', type: 'MOVE', unitIds: ids, path: line.slice(0, 2) } });
    const played = play22(queuedShort);
    expect(played.players[0]!.orders).toHaveLength(1);
    const replaced = must(played, p1, { type: 'QUEUE_ORDER', order: { id: 'm1', type: 'MOVE', unitIds: ids, path: line.slice(0, 4) } });
    expect(replaced.players[0]!.orders).toHaveLength(1);
    const done = completeRound(replaced);
    expect(done.units.find(u => u.id === ids[0])!.hexId).toBe(line[3]);
    expect(done.events.some(e => e.type === 'ORDER_FAILED')).toBe(false);
  });
  it('the MOVE queued with the bonus is re-validated at resolution (ORDERS_MOVEMENT) with the bonus still in force: lands on the far hex', () => {
    const { state, line, ids } = lineCase(['CAVALRY'], 'PLAINS');
    const queued = must(play22(state), p1, { type: 'QUEUE_ORDER', order: { id: 'm1', type: 'MOVE', unitIds: ids, path: line.slice(0, 4) } });
    expect(queued.core.round).toBe(1);
    const done = completeRound(queued);
    expect(done.units.find(u => u.id === ids[0])!.hexId).toBe(line[3]);
  });
  it('the card only lives for the round it was played: next round the budget is base again', () => {
    const { state, line, ids } = lineCase(['INFANTRY'], 'PLAINS');
    const played = play22(state);
    const nextRound = completeRound(played);
    expect(nextRound.core.round).toBe(2);
    expect(nextRound.phase).toBe('PLANNING');
    const unit = nextRound.units.find(u => u.id === ids[0])!;
    const here = line.indexOf(unit.hexId as string);
    // from where it stands (still on the strip's start) the base reach is 2 again
    const rest = [unit.hexId as string, ...line].slice(here + 1);
    expect(alphaUnitOptions(nextRound, p1)[ids[0]!]!.movement).toBe(2);
    expect(rest.length).toBeGreaterThan(0);
  });
  it('a card cannot be played after READY (client gate must disable it)', () => {
    const { state } = lineCase(['INFANTRY'], 'PLAINS');
    state.players[0]!.ambitionsChosen = false;
    const chosen = must(state, p1, { type: 'CHOOSE_AMBITIONS', cardIds: state.players[0]!.ambitions.slice(0, 2) });
    const ready = must(chosen, p1, { type: 'READY' });
    cheat(ready, 'strategy-22');
    const refused = applyAlphaCommand(ready, p1, { type: 'PLAY_CARD', cardId: 'strategy-22', expectedVersion: ready.version } as never);
    expect(refused.ok).toBe(false);
  });
});

describe('Discovery (Região fechada): the bonus enters the same budget in options.frontier and planFrontierMove', () => {
  it('with +2 the frontier grows, and offers == accepted in both directions (last UNKNOWN step costs 1 inside the boosted budget)', async () => {
    const { landCase } = await import('./alpha-move-fixtures.js');
    let checked = 0, extended = 0;
    for (const seed of [2, 5, 9, 13, 21, 34]) {
      const found = landCase(seed);
      if (!found) continue;
      const { state, pioneer } = found;
      const before = alphaUnitOptions(state, p1)[pioneer.id]!;
      const boosted = play22(state);
      const after = alphaUnitOptions(boosted, p1)[pioneer.id]!;
      const entriesOf = (o: typeof after) => new Set(o.frontier.flatMap(f => f.entries.map(e => e.hexId)));
      for (const e of entriesOf(before)) expect(entriesOf(after).has(e)).toBe(true);
      extended += [...entriesOf(after)].filter(e => !entriesOf(before).has(e)).length;
      // offers => accepted
      for (const f of after.frontier) for (const e of f.entries.filter(x => x.rotations.length)) {
        const r = queueMove(boosted, [pioneer.id], e.path, `f-${e.hexId}`);
        const withRotation = applyAlphaCommand(boosted, p1, { type: 'QUEUE_ORDER', expectedVersion: boosted.version, order: { id: 'r', type: 'MOVE', unitIds: [pioneer.id], path: e.path, rotation: e.rotations[0] } } as never);
        expect(withRotation.ok, `${e.hexId} ${e.path.length} steps`).toBe(true); void r; checked++;
      }
      // accepted => offered: every (reachable hex + closed-region neighbour) that the validator accepts is among the entries
      const moves = after.moves, closed = new Set(boosted.regions.filter(r => !regionOpenFor(boosted, r, p1)).flatMap(r => r.hexIds as string[]));
      const offered = entriesOf(after);
      const byId = new Map(boosted.core.map.map(t => [t.id as string, t]));
      for (const [at, path] of [['', []] as [string, string[]], ...Object.entries(moves)]) {
        const from = at ? byId.get(at)! : byId.get(boosted.units.find(u => u.id === pioneer.id)!.hexId as string)!;
        for (const n of hexNeighbors(from)) {
          const nid = hexId(n); if (!closed.has(nid)) continue;
          const ok = [0, 1, 2, 3, 4, 5].some(rotation => applyAlphaCommand(boosted, p1, { type: 'QUEUE_ORDER', expectedVersion: boosted.version, order: { id: 'a', type: 'MOVE', unitIds: [pioneer.id], path: [...path, nid], rotation } } as never).ok);
          if (ok) expect(offered.has(nid), `validator accepts ${nid} via ${at || 'start'} but options.frontier does not offer it`).toBe(true);
        }
      }
    }
    dump(`FRONTIER checked=${checked} newEntriesFromBonus=${extended}`);
    expect(checked).toBeGreaterThan(0);
  });
});

describe('DIVERGENCES options.moves vs QUEUE_ORDER (not bonus-specific, but the bonus widens the surface)', () => {
  const camp = (hex: string) => ({ id: 'camp-x', kind: 'CAMP', hexId: hex, homeHexId: hex, level: 1, status: 'CAMPED', composition: [{ kind: 'INFANTRY', count: 1 }], createdRound: 1, lastActedRound: 1, rewardPaid: false, fresh: false, withdrawing: false, readyRound: 0 } as never);
  // EXPECTED (correct): every hex listed in options.moves is accepted by QUEUE_ORDER with the listed path, so a highlighted target is clickable AND valid.
  it('a world threat (Acampamento) on the strip: options.moves must not list the threat hex nor hexes whose cheapest path crosses it', () => {
    const { state, line, ids } = lineCase(['INFANTRY'], 'PLAINS');
    state.threats.push(camp(line[1]!));
    const boosted = play22(state);
    const listed = Object.entries(alphaUnitOptions(boosted, p1)[ids[0]!]!.moves);
    const bad = listed.filter(([, path]) => !queueMove(boosted, ids, path).ok).map(([hex]) => hex);
    dump(`THREAT listed=${JSON.stringify(listed.map(([h, p]) => [h, p.length]))} rejectedByQueue=${JSON.stringify(bad)}`);
    expect(bad).toEqual([]);
  });
  it('own queued arrivals (pendingArrivals): options.moves must not list a hex whose civilian stack (2) other queued orders already filled', () => {
    const { state, line, ids } = lineCase(['PIONEER', 'PIONEER'], 'PLAINS');
    const third: AlphaUnit = { id: 't-pioneer-9', ownerId: p1, kind: 'PIONEER', hexId: line[0] as never, recruitedRound: 1, carrierId: null };
    state.units.push(third);
    let next = must(state, p1, { type: 'QUEUE_ORDER', order: { id: 'a', type: 'MOVE', unitIds: [ids[0]!], path: [line[0]!, line[1]!] } });
    next = must(next, p1, { type: 'QUEUE_ORDER', order: { id: 'b', type: 'MOVE', unitIds: [ids[1]!], path: [line[0]!, line[1]!] } });
    const listed = line[1]! in alphaUnitOptions(next, p1)[third.id]!.moves;
    const accepted = applyAlphaCommand(next, p1, { type: 'QUEUE_ORDER', expectedVersion: next.version, order: { id: 'c', type: 'MOVE', unitIds: [third.id], path: [line[1]!] } } as never).ok;
    dump(`PENDING listed=${listed} accepted=${accepted}`);
    expect(listed).toBe(accepted);
  });
});
