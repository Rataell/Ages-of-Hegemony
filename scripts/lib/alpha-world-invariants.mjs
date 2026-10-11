/* global structuredClone */
// World/piece invariants for the Alpha (V1.2 audit, lane C). Read-only over the BUILT packages: it never edits the engine and never touches production.
//
// INVARIANT (the one this audit enforces): an UNEMBARKED non-naval piece never occupies SEA (nor a hex nobody has turned face up).
// COAST is both land and navigable water (alpha-water.ts): a Pioneiro on COAST is legal; on SEA it is a state bug.
//
// Three drivers feed `scanState` after EVERY successful command (the box.apply hook), so a transient violation inside a round is seen too:
//   - runMatch({ wander:false })   the live bot policy (apps/server/dist/alpha-bot-policy.js) on every seat;
//   - runMatch({ wander:true })    bots on even seats, a seeded "wanderer" on odd seats: random legal MOVE / frontier entries with every legal
//                                  rotation, group moves, EMBARK / DISEMBARK, fleets, plus deliberate ILLEGAL probes that the validators must refuse;
//   - frontierSweep / cargoScenarios / raceScenario   exhaustive and synthetic engine-level cases (Discovery, naufrágio, two seats entering one Region).
import * as E from '../../packages/game-engine/dist/index.js';
import * as D from '../../packages/game-domain/dist/index.js';
import * as P from '../../apps/server/dist/alpha-bot-policy.js';
import { alphaPlayerView } from '../../apps/server/dist/alpha-projection.js';

const LAND_TERRAIN = new Set(['PLAINS', 'FOREST', 'HILLS', 'MOUNTAINS', 'COAST']);
const NAV_TERRAIN = new Set(['COAST', 'SEA']);
const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const domainOf = (state, unit) => state.rules.units[unit.kind].domain;
export const players = n => Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` }));
export const makeGame = ({ preset, seed, players: n, size = 'STANDARD' }) => E.createAlphaGame({ gameId: `inv-${preset}-${seed}-${n}`, seed, players: players(n), preset: 'STANDARD', worldPreset: preset, mapSize: size });

/** HARD codes are state bugs; SOFT codes are reported separately (rule or presentation questions, never a crash). */
export const HARD = ['LAND_PIECE_ON_SEA', 'UNIT_ON_UNKNOWN', 'SHIP_ON_LAND', 'DANGLING_CARRIER', 'CARRIER_HEX_MISMATCH', 'CARRIED_BY_NON_CARRIER', 'CARGO_OVER_CAPACITY', 'UNIT_OFF_MAP', 'CITY_ON_WATER', 'INDEPENDENT_ON_WATER', 'CAMP_ON_SEA', 'PIRATE_ON_LAND', 'IMPROVEMENT_ON_SEA', 'ROAD_ON_SEA', 'TERRAIN_MUTATED', 'ROTATION_TERRAIN_MISMATCH', 'REGION_NOT_SEVEN', 'ILLEGAL_COMMAND_ACCEPTED', 'ENGINE_CRASH', 'PROJECTION_UNIT_WITHOUT_TILE', 'PROJECTION_TERRAIN_DIVERGES'];
export const ENTITY_CODES = ['INDEPENDENT_ON_WATER', 'CAMP_ON_SEA', 'PIRATE_ON_LAND', 'IMPROVEMENT_ON_SEA', 'ROAD_ON_SEA'];
const UNIT_CODES = ['LAND_PIECE_ON_SEA', 'UNIT_ON_UNKNOWN', 'SHIP_ON_LAND', 'DANGLING_CARRIER', 'CARRIER_HEX_MISMATCH', 'CARRIED_BY_NON_CARRIER', 'CARGO_OVER_CAPACITY', 'UNIT_OFF_MAP'];
export const SOFT = ['UNIT_IN_CLOSED_REGION', 'OWNED_HEX_IN_CLOSED_REGION', 'STACK_OVER_LIMIT', 'PROJECTION_UNIT_IN_CLOSED_BOARD', 'PROJECTION_CLOSED_REGION_TERRAIN'];

export const newMemory = () => ({ fixed: new Map(), revealed: -1 });

/** Scans one state. `mem` carries the terrain memory between scans (observed terrain must never change). */
export function scanState(state, mem, where = {}) {
  const out = [], tiles = new Map(state.core.map.map(t => [t.id, t])), units = new Map(state.units.map(u => [u.id, u]));
  const say = (code, detail) => out.push({ code, ...detail, round: state.core.round, phase: state.phase, ...where });
  const regionOf = new Map(); for (const region of state.regions) for (const id of region.hexIds) regionOf.set(id, region);
  const load = new Map();
  for (const unit of state.units) {
    const tile = tiles.get(unit.hexId), domain = domainOf(state, unit), carried = unit.carrierId !== null && unit.carrierId !== undefined;
    if (!tile) { say('UNIT_OFF_MAP', { unit: unit.id, kind: unit.kind, hex: unit.hexId }); continue; }
    if (carried) {
      const carrier = units.get(unit.carrierId);
      if (!carrier) { say('DANGLING_CARRIER', { unit: unit.id, kind: unit.kind, hex: unit.hexId, terrain: tile.terrain, carrier: unit.carrierId }); continue; }
      if (carrier.hexId !== unit.hexId) say('CARRIER_HEX_MISMATCH', { unit: unit.id, kind: unit.kind, hex: unit.hexId, carrierHex: carrier.hexId });
      if (domainOf(state, carrier) !== 'SEA' || state.rules.units[carrier.kind].transport <= 0 || domain !== 'LAND' || carrier.ownerId !== unit.ownerId) say('CARRIED_BY_NON_CARRIER', { unit: unit.id, kind: unit.kind, carrier: carrier.id, carrierKind: carrier.kind });
      load.set(carrier.id, (load.get(carrier.id) ?? 0) + state.rules.units[unit.kind].cargo);
      continue;
    }
    if (tile.terrain === 'UNKNOWN') say('UNIT_ON_UNKNOWN', { unit: unit.id, kind: unit.kind, hex: unit.hexId });
    else if (domain === 'LAND' && tile.terrain === 'SEA') say('LAND_PIECE_ON_SEA', { unit: unit.id, kind: unit.kind, owner: unit.ownerId, hex: unit.hexId, terrain: tile.terrain });
    else if (domain === 'SEA' && !NAV_TERRAIN.has(tile.terrain)) say('SHIP_ON_LAND', { unit: unit.id, kind: unit.kind, owner: unit.ownerId, hex: unit.hexId, terrain: tile.terrain });
    const region = regionOf.get(unit.hexId);
    if (region && region.revealedBy.length === 0) say('UNIT_IN_CLOSED_REGION', { unit: unit.id, kind: unit.kind, hex: unit.hexId, region: region.id });
  }
  for (const [carrierId, total] of load) { const carrier = units.get(carrierId); if (total > E.unitTransport?.(state, carrier) && E.unitTransport) say('CARGO_OVER_CAPACITY', { carrier: carrierId, load: total }); }
  for (const owner of state.core.players) for (const city of owner.civilization.cities) { const t = tiles.get(city.hexId); if (!t || !LAND_TERRAIN.has(t.terrain)) say('CITY_ON_WATER', { city: city.id, hex: city.hexId, terrain: t?.terrain }); }
  // World entities fixed at creation on the face-down (rotation 0) terrain: they must still stand on the right kind of hex once a Region is turned.
  for (const people of state.independents) { const t = tiles.get(people.hexId); if (!t || !LAND_TERRAIN.has(t.terrain)) say('INDEPENDENT_ON_WATER', { people: people.id, hex: people.hexId, terrain: t?.terrain, region: regionOf.get(people.hexId)?.id }); }
  for (const threat of state.threats) { const t = tiles.get(threat.hexId); if (threat.kind === 'CAMP' && (!t || !LAND_TERRAIN.has(t.terrain))) say('CAMP_ON_SEA', { threat: threat.id, hex: threat.hexId, terrain: t?.terrain, region: regionOf.get(threat.hexId)?.id }); if (threat.kind === 'PIRATE' && (!t || !NAV_TERRAIN.has(t.terrain))) say('PIRATE_ON_LAND', { threat: threat.id, hex: threat.hexId, terrain: t?.terrain }); }
  for (const tile of state.core.map) { if (tile.terrain === 'SEA' && tile.improvement) say('IMPROVEMENT_ON_SEA', { hex: tile.id, improvement: tile.improvement }); }
  for (const road of state.roads) if (tiles.get(road)?.terrain === 'SEA') say('ROAD_ON_SEA', { hex: road });
  for (const tile of state.core.map) { const region = regionOf.get(tile.id); if (region && region.revealedBy.length === 0 && tile.ownerId !== null) say('OWNED_HEX_IN_CLOSED_REGION', { hex: tile.id, region: region.id, owner: tile.ownerId, terrain: tile.terrain }); }
  // Stacks above the limit are legal when inherited (starting forces); report only so the pilot of a hex is visible.
  const seen = new Set();
  for (const unit of state.units) { if (unit.carrierId) continue; const key = `${unit.ownerId}@${unit.hexId}`; if (seen.has(key)) continue; seen.add(key); const stack = E.stackHex(state, unit.ownerId, unit.hexId); if (stack.civilians.used > stack.civilians.limit || stack.military.used > stack.military.limit || stack.fleets.used > stack.fleets.limit) say('STACK_OVER_LIMIT', { owner: unit.ownerId, hex: unit.hexId, stack: { civ: stack.civilians, mil: stack.military, fleet: stack.fleets } }); }
  // Regions: seven hexes always; terrain a table has seen never changes; rotation matches the terrain on the table.
  const revealed = state.regions.filter(r => r.revealedBy.length > 0);
  for (const region of state.regions) if (region.hexIds.length !== 7 || new Set(region.hexIds).size !== 7) say('REGION_NOT_SEVEN', { region: region.id, hexes: region.hexIds.length });
  for (const region of revealed) for (const id of region.hexIds) {
    const tile = tiles.get(id), signature = `${tile.terrain}|${[...tile.features].filter(f => ['METAL', 'FISH', 'TIMBER', 'FERTILE', 'STONE'].includes(f)).sort().join(',')}`, before = mem.fixed.get(id);
    if (before === undefined) mem.fixed.set(id, signature);
    else if (before.split('|')[0] !== signature.split('|')[0]) say('TERRAIN_MUTATED', { hex: id, region: region.id, was: before, now: signature });
  }
  if (revealed.length !== mem.revealed) {
    mem.revealed = revealed.length;
    for (const region of revealed) { const tilesAt = E.rotatedRegionTiles(state, region, region.rotation); region.hexIds.forEach((id, i) => { if (tiles.get(id).terrain !== tilesAt[i].terrain) say('ROTATION_TERRAIN_MISMATCH', { region: region.id, rotation: region.rotation, hex: id, terrain: tiles.get(id).terrain, expected: tilesAt[i].terrain }); }); }
  }
  return out;
}


/**
 * What the server projects to each seat (apps/server alpha-projection) against the authoritative state: every piece the client is told about stands on a hex the client is
 * also told about, with the same terrain; terrain of a face-down Region reaches the client only through hexes it owns.
 */
export function projectionScan(state, where = {}) {
  const out = [], truth = new Map(state.core.map.map(t => [t.id, t]));
  for (const seat of state.players.map(p => p.playerId)) {
    const view = alphaPlayerView(state, seat), tiles = new Map([...view.view.visibleTerritory, ...view.knownTerritory].map(t => [t.id, t])), closed = new Map(view.board.filter(b => b.closed).flatMap(b => b.hexIds.map(h => [h, b.id])));
    const say = (code, detail) => out.push({ code, seat, round: state.core.round, phase: state.phase, ...where, ...detail });
    for (const unit of view.units) {
      const tile = tiles.get(unit.hexId);
      if (!tile) { say('PROJECTION_UNIT_WITHOUT_TILE', { unit: unit.id, kind: unit.kind, hex: unit.hexId }); continue; }
      if (tile.terrain !== truth.get(unit.hexId).terrain) say('PROJECTION_TERRAIN_DIVERGES', { unit: unit.id, hex: unit.hexId, shown: tile.terrain, truth: truth.get(unit.hexId).terrain });
      if (closed.has(unit.hexId) && !unit.carrierId) say('PROJECTION_UNIT_IN_CLOSED_BOARD', { unit: unit.id, kind: unit.kind, hex: unit.hexId, region: closed.get(unit.hexId), terrain: tile.terrain });
    }
    for (const [id, tile] of tiles) if (closed.has(id)) say('PROJECTION_CLOSED_REGION_TERRAIN', { hex: id, region: closed.get(id), terrain: tile.terrain });
  }
  return out;
}

/* ------------------------------------------------------------------ drivers */

function makeBox(initial, hooks) {
  const box = { live: initial };
  box.apply = (id, command) => {
    let result;
    try { result = E.applyAlphaCommand(box.live, id, command); } catch (error) { hooks.crash(id, command, error); return { ok: false, error: { code: 'CRASH', message: String(error) } }; }
    if (result.ok) { box.live = result.value; hooks.after(box.live, id, command); } else hooks.rejected(id, command, result.error);
    return result;
  };
  Object.defineProperty(box, 'state', { get: () => box.live, set: () => {} });
  box.refresh = () => box.live;
  box.real = () => box.live;
  return box;
}

function confirm(box, id) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const live = box.live, ready = box.apply(id, { type: 'READY', expectedVersion: live.version });
    if (ready.ok) return true;
    const me = live.players.find(p => p.playerId === id);
    let next = null;
    if (!me.ambitionsChosen && me.ambitions.length >= 2) next = box.apply(id, { type: 'CHOOSE_AMBITIONS', expectedVersion: live.version, cardIds: me.ambitions.slice(0, 2) });
    else if (me.pendingChoices.length) next = box.apply(id, { type: 'RESOLVE_CHOICE', expectedVersion: live.version, choiceId: me.pendingChoices[0].id, optionId: me.pendingChoices[0].options[0].id });
    else if (live.cards.worldEvent && !live.cards.worldResponded.includes(id)) next = box.apply(id, { type: 'WORLD_CHOICE', expectedVersion: live.version, choice: 'PRESTIGE' });
    if (!next || !next.ok) return false;
  }
  return false;
}

/** A wanderer: random but legal piece orders, plus illegal probes. Every command goes through the same validators a player meets. */
function wander(box, id, rand, ctx) {
  const state = box.live, opts = E.alphaUnitOptions(state, id), pick = list => list[Math.floor(rand() * list.length)];
  const mine = state.units.filter(u => u.ownerId === id).sort((a, b) => a.id.localeCompare(b.id));
  const tile = hex => state.core.map.find(t => t.id === hex);
  const order = (unitIds, path, rotation) => box.apply(id, { type: 'QUEUE_ORDER', expectedVersion: box.live.version, order: { id: `w-${id}-${state.core.round}-${++ctx.seq}`, type: 'MOVE', unitIds, path, ...(rotation !== undefined ? { rotation } : {}) } });
  const busy = new Set();
  for (const unit of mine) {
    if (box.live.phase !== 'PLANNING') return; // a command resolved the phase (not expected while planning)
    const uo = opts[unit.id]; if (!uo || busy.has(unit.id)) continue;
    const carried = unit.carrierId !== null && unit.carrierId !== undefined, r = rand();
    if (carried) { if (r < 0.6 && uo.disembark.length) { ctx.counters.disembark++; box.apply(id, { type: 'DISEMBARK', expectedVersion: box.live.version, unitIds: [unit.id], hexId: pick(uo.disembark) }); } continue; }
    const domain = domainOf(state, unit);
    // ILLEGAL probes: the validators must refuse a land piece stepping into the sea (alone or as the end of a path) and a frontier entry under a rotation that drowns the entry.
    if (domain === 'LAND' && unit.kind === 'PIONEER' && r < 0.3) {
      const known = new Set(state.players.find(p => p.playerId === id).knownHexIds), seaNear = state.core.map.filter(t => t.terrain === 'SEA' && known.has(t.id) && E.hexDistance(tile(unit.hexId), t) === 1); // only SEA the actor can see: a face-down Region's hex is not a SEA hex yet
      const target = seaNear[0];
      if (target) { ctx.counters.probes++; const before = box.live.version, res = order([unit.id], [target.id]); if (res.ok) { ctx.illegal.push({ code: 'ILLEGAL_COMMAND_ACCEPTED', what: 'MOVE into SEA', unit: unit.id, hex: target.id, round: state.core.round }); box.apply(id, { type: 'CANCEL_ORDER', expectedVersion: box.live.version, orderId: box.live.players.find(p => p.playerId === id).orders.at(-1).id }); } void before; }
      for (const f of uo.frontier) for (const e of f.entries.slice(0, 2)) for (const k of [0, 1, 2, 3, 4, 5].filter(k => !e.rotations.includes(k) && e.rotations.length > 1)) {
        if (rand() > 0.3) continue;
        ctx.counters.probes++; const res = order([unit.id], e.path, k);
        if (res.ok) { ctx.illegal.push({ code: 'ILLEGAL_COMMAND_ACCEPTED', what: `frontier entry ${e.hexId} with disallowed rotation ${k} (allowed ${e.rotations})`, unit: unit.id, round: state.core.round }); box.apply(id, { type: 'CANCEL_ORDER', expectedVersion: box.live.version, orderId: box.live.players.find(p => p.playerId === id).orders.at(-1).id }); }
        break;
      }
    }
    if (domain === 'LAND') {
      if (r < 0.2 && uo.embark.length) { ctx.counters.embark++; box.apply(id, { type: 'EMBARK', expectedVersion: box.live.version, unitIds: [unit.id], fleetId: pick(uo.embark) }); continue; }
      const entries = uo.frontier.flatMap(f => f.entries.filter(e => e.rotations.length).map(e => ({ f, e })));
      if (unit.kind === 'PIONEER' && entries.length && r < 0.75) {
        const { e } = pick(entries), rotation = pick(e.rotations);
        // Sometimes bring an escort that stands on the same hex (a group walks the path of its slowest piece).
        const escort = rand() < 0.4 ? mine.filter(o => o.id !== unit.id && o.hexId === unit.hexId && !o.carrierId && domainOf(state, o) === 'LAND' && !busy.has(o.id)).slice(0, 2) : [];
        const ids = [unit.id, ...escort.map(o => o.id)];
        const res = order(ids, e.path, rotation); ctx.counters.frontier++;
        if (res.ok) ids.forEach(x => busy.add(x)); else if (ids.length > 1) { const solo = order([unit.id], e.path, rotation); if (solo.ok) busy.add(unit.id); }
        continue;
      }
      const targets = Object.keys(uo.moves); if (!targets.length) continue;
      const target = pick(targets), group = rand() < 0.35 ? mine.filter(o => o.id !== unit.id && o.hexId === unit.hexId && !o.carrierId && domainOf(state, o) === 'LAND' && !busy.has(o.id) && opts[o.id]?.moves[target]).slice(0, 2) : [];
      if (group.length) {
        const slowest = [unit, ...group].sort((a, b) => opts[a.id].movement - opts[b.id].movement)[0];
        ctx.counters.group++;
        const res = order([unit.id, ...group.map(o => o.id)], opts[slowest.id].moves[target]);
        if (res.ok) { busy.add(unit.id); group.forEach(o => busy.add(o.id)); continue; }
      }
      const res = order([unit.id], uo.moves[target]); if (res.ok) busy.add(unit.id);
    } else {
      const entries = uo.discoverer ? uo.frontier.flatMap(f => f.entries.filter(e => e.rotations.length)) : [];
      if (entries.length && r < 0.6) { const e = pick(entries); ctx.counters.naval++; const res = order([unit.id], e.path, pick(e.rotations)); if (res.ok) busy.add(unit.id); continue; }
      const targets = Object.keys(uo.moves); if (!targets.length) continue;
      const res = order([unit.id], uo.moves[pick(targets)]); if (res.ok) busy.add(unit.id);
    }
  }
}

/** Grants an advance with its whole prerequisite chain (the state schema refuses research that skips a prerequisite or an Era). */
function grant(progress, id) {
  const node = D.ADVANCEMENTS.find(a => a.id === id); if (!node || progress.research.includes(id)) return;
  for (const pre of node.prerequisites) grant(progress, pre);
  if (node.prerequisitesAny.length && !node.prerequisitesAny.some(p => progress.research.includes(p))) grant(progress, node.prerequisitesAny[0]);
  if (D.AlphaEraSchema.options.indexOf(node.era) > D.AlphaEraSchema.options.indexOf(progress.era)) progress.era = node.era;
  progress.research.push(id);
}

/** Gives every wanderer seat a small navy and the techs a water match would have by round 10, so naval cases happen in a short match. */
function navalFixture(box, seats, rand) {
  const state = structuredClone(box.live);
  for (const id of seats) {
    const progress = state.players.find(p => p.playerId === id);
    grant(progress, 'web-naval-architecture');
    if (rand() < 0.5) grant(progress, 'web-ocean-navigation');
    // A beach party near the capital: two ships on the closest navigable hex that has land next to it, a Pioneiro and escorts on that land (all inside open Regions).
    const home = state.core.players.find(p => p.id === id).civilization.cities[0], homeTile = state.core.map.find(t => t.id === home.hexId);
    // Water close to home: turn the nearest closed Region that shows SEA beside walkable land under some orientation (as an earlier expedition would have).
    const withSea = state.regions.filter(r => r.revealedBy.length === 0).flatMap(r => [0, 1, 2, 3, 4, 5].map(k => ({ r, k, tl: E.rotatedRegionTiles(state, r, k) }))).filter(({ r, tl }) => tl.some((t, i) => t.terrain === 'SEA' && nbIds(r.hexIds[i]).some(n => { const j = r.hexIds.indexOf(n); return j >= 0 && ['PLAINS', 'FOREST', 'HILLS'].includes(tl[j].terrain); })))
      .sort((x, y) => Math.min(...x.r.hexIds.map(h => E.hexDistance(homeTile, state.core.map.find(t => t.id === h)))) - Math.min(...y.r.hexIds.map(h => E.hexDistance(homeTile, state.core.map.find(t => t.id === h)))) || x.r.id.localeCompare(y.r.id) || x.k - y.k)[0];
    if (withSea) E.revealRegion(state, id, state.regions.find(r => r.id === withSea.r.id), withSea.k);
    const open = new Set(state.regions.filter(r => r.revealedBy.length > 0).flatMap(r => r.hexIds)), tiles = new Map(state.core.map.map(t => [t.id, t]));
    const free = t => open.has(t.id) && !state.units.some(u => u.hexId === t.id) && !state.core.players.some(o => o.civilization.cities.some(c => c.hexId === t.id));
    const beaches = state.core.map.filter(t => t.terrain === 'SEA' && free(t)).flatMap(sea => nbIds(sea.id).map(n => tiles.get(n)).filter(l => l && l.terrain !== 'SEA' && l.terrain !== 'COAST' && l.terrain !== 'MOUNTAINS' && free(l)).map(land => ({ sea, land }))).sort((x, y) => E.hexDistance(homeTile, x.land) - E.hexDistance(homeTile, y.land) || x.sea.id.localeCompare(y.sea.id));
    const spot = beaches[0];
    if (spot) {
      state.units.push({ id: `fx-${id}-ship-1`, ownerId: id, kind: 'COASTAL_VESSEL', hexId: spot.sea.id, recruitedRound: 1, carrierId: null });
      state.units.push({ id: `fx-${id}-ship-2`, ownerId: id, kind: 'FLEET', hexId: spot.sea.id, recruitedRound: 1, carrierId: null });
      for (const kind of ['PIONEER', 'INFANTRY']) state.units.push({ id: `fx-${id}-${kind.toLowerCase()}`, ownerId: id, kind, hexId: spot.land.id, recruitedRound: 1, carrierId: null });
      const known = progress.knownHexIds; for (const hex of [spot.sea.id, spot.land.id]) if (!known.includes(hex)) known.push(hex);
    }
  }
  box.live = state;
}

/**
 * Plays `rounds` rounds and scans after every command. Returns { violations (HARD+SOFT), crashes, counters, rejected }.
 * wander: bots on even seats and a wanderer on odd seats (needs >= 2 seats). naval: wanderer seats get a navy and ocean techs.
 */
export function runMatch({ preset, seed, players: n, size = 'STANDARD', rounds = 6, wander: useWander = false, naval = false, softLimit = 60 }) {
  const state0 = E.beginAlphaPlanning(makeGame({ preset, seed, players: n, size }));
  const seats = state0.players.map(p => p.playerId), rand = rng(seed * 31 + n);
  const mem = newMemory(), violations = [], crashes = [], rejectedCodes = {}, ctx = { seq: 0, illegal: [], counters: { frontier: 0, group: 0, embark: 0, disembark: 0, naval: 0, probes: 0, commands: 0 } };
  const seen = new Set();
  const record = list => { for (const v of list) { const key = `${v.code}:${v.unit ?? v.people ?? v.threat ?? v.hex ?? v.region ?? v.city ?? v.carrier}:${v.code.startsWith('ILLEGAL') || v.code === 'LAND_PIECE_ON_SEA' ? v.round : ''}`; if (seen.has(key)) continue; seen.add(key); if (violations.filter(x => x.code === v.code).length < softLimit) violations.push(v); } };
  const hooks = {
    after: (state, id, command) => { ctx.counters.commands++; record(scanState(state, mem, { by: id, cmd: command.type + (command.order ? `:${command.order.type}` : '') })); },
    rejected: (id, command, error) => { const key = `${command.type}${command.order ? ':' + command.order.type : ''}:${error.code}`; rejectedCodes[key] = (rejectedCodes[key] ?? 0) + 1; },
    crash: (id, command, error) => crashes.push({ code: 'ENGINE_CRASH', id, cmd: command.type, message: String(error?.message ?? error).slice(0, 200) }),
  };
  const box = makeBox(state0, hooks);
  record(scanState(box.live, mem, { by: 'setup', cmd: 'CREATE' }));
  const botCtx = { skill: 'competent', seats: seats.map((id, i) => ({ id, persona: P.PERSONA_ORDER[(i + seed) % P.PERSONA_ORDER.length] })), rand: Object.fromEntries(seats.map((id, i) => [id, P.rng(seed * 7919 + i * 104729)])), activations: new Map(), failed: new Map(), counters: { commands: 0, rejected: 0 }, rejectedCodes: new Set(), crashes: [], orderSeq: 0, foodLog: [], seed };
  box.ctx = botCtx;
  const wanderSeats = useWander ? seats.filter((_, i) => i % 2 === 1) : [];
  let stalls = 0, last = '', fixtured = false, lastProjected = 0;
  for (let guard = 0; guard < rounds * 12 && box.live.core.status === 'ACTIVE' && box.live.core.round <= rounds; guard++) {
    const key = `${box.live.core.round}:${box.live.phase}`;
    stalls = key === last ? stalls + 1 : 0; last = key; if (stalls > 3) { crashes.push({ code: 'ENGINE_CRASH', cmd: 'STALL', message: `no progress at ${key}` }); break; }
    const phase = box.live.phase;
    if (phase === 'PLANNING' && box.live.core.round !== lastProjected) { lastProjected = box.live.core.round; record(projectionScan(box.live, { by: 'projection', cmd: 'ROUND_START' })); }
    if (phase === 'PLANNING') {
      if (naval && !fixtured && wanderSeats.length) { navalFixture(box, wanderSeats, rand); fixtured = true; record(scanState(box.live, mem, { by: 'fixture', cmd: 'NAVAL' })); }
      try {
        P.recordFood(box);
        for (const id of [...box.live.initiative]) {
          if (box.live.phase !== 'PLANNING') break;
          if (wanderSeats.includes(id)) wander(box, id, rand, ctx); else P.botPlan(box, id);
        }
      } catch (error) { crashes.push({ code: 'ENGINE_CRASH', cmd: 'PLAN', message: String(error?.stack ?? error).slice(0, 300) }); break; }
      for (const id of seats) { if (box.live.phase !== 'PLANNING' || box.live.core.status !== 'ACTIVE') break; if (!box.live.players.find(p => p.playerId === id).ready) confirm(box, id); }
    } else if (phase === 'ERA_TURN') {
      for (const id of seats) P.eraTurnActions(box, id);
      for (const id of seats) { if (box.live.phase !== 'ERA_TURN') break; if (!box.live.players.find(p => p.playerId === id).ready) confirm(box, id); }
    } else for (const id of seats) { if (box.live.phase !== phase) break; if (!box.live.players.find(p => p.playerId === id).ready) confirm(box, id); }
  }
  record(ctx.illegal); record(crashes);
  return { state: box.live, violations, crashes, counters: ctx.counters, rejected: rejectedCodes, round: box.live.core.round };
}

/* ------------------------------------------------------------ engine-level cases */

const nbIds = id => { const [q, r] = id.split(',').map(Number); return [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]].map(([a, b]) => `${q + a},${r + b}`); };

/**
 * EXHAUSTIVE Discovery sweep: for every closed Region, every hex, every orientation that `entryRotations` allows, a Pioneiro standing next to the hex
 * in an open Region enters it through the real `resolveFrontierMove`. The piece must end on that hex, on a hex it can stand on; the Region keeps seven
 * hexes, the chosen rotation, every hex somebody had observed, and its metal deposits.
 */
export function frontierSweep(state, { mode = 'LAND', maxRegions = 99 } = {}) {
  const out = [], entities = [], tiles = new Map(state.core.map.map(t => [t.id, t])), owner = state.players[0].playerId;
  const standOn = mode === 'LAND' ? t => LAND_TERRAIN.has(t) : t => NAV_TERRAIN.has(t);
  const observed = new Set(state.players.flatMap(p => [...p.knownHexIds, ...E.visibleHexIds(state, p.playerId)]));
  let checked = 0;
  for (const region of state.regions.filter(r => r.revealedBy.length === 0).slice(0, maxRegions)) {
    for (const entry of region.hexIds) {
      const rotations = E.entryRotations(state, region, entry, mode);
      const from = nbIds(entry).filter(id => tiles.has(id) && !region.hexIds.includes(id) && standOn(tiles.get(id).terrain) && state.regions.some(r => r.hexIds.includes(id) && r.revealedBy.length > 0)).sort()[0];
      if (!from) continue;
      for (const rotation of rotations) {
        const clone = structuredClone(state), kind = mode === 'LAND' ? 'PIONEER' : 'COASTAL_VESSEL', pid = `sweep-${checked}`;
        clone.units = clone.units.filter(u => u.hexId !== from);
        clone.units.push({ id: pid, ownerId: owner, kind, hexId: from, recruitedRound: 1, carrierId: null });
        if (mode === 'NAVAL') { const p = clone.players.find(x => x.playerId === owner); if (!p.research.includes('web-ocean-navigation')) p.research.push('web-ocean-navigation'); }
        const before = clone.core.map.filter(t => region.hexIds.includes(t.id)).map(t => t.features.filter(f => f === 'METAL').length).reduce((a, b) => a + b, 0);
        const outside = new Map(clone.core.map.filter(t => observed.has(t.id) && !region.hexIds.includes(t.id)).map(t => [t.id, t.terrain]));
        checked++;
        try {
          const res = E.resolveFrontierMove(clone, owner, { id: 'o', type: 'MOVE', unitIds: [pid], path: [entry], rotation });
          const piece = clone.units.find(u => u.id === pid), landed = clone.core.map.find(t => t.id === piece?.hexId);
          const here = { region: region.id, entry, rotation, from, mode };
          for (const v of scanState(clone, newMemory(), { cmd: 'resolveFrontierMove' })) if (ENTITY_CODES.includes(v.code)) entities.push({ ...v, ...here });
          if (!piece) { if (region.discovery?.kind !== 'DANGER') out.push({ code: 'PIECE_LOST', ...here }); } // Perigo costs the discoverer half the time: a rule, not a bug
          else if (res.entered && (!landed || !standOn(landed.terrain))) out.push({ code: mode === 'LAND' ? 'LAND_PIECE_ON_SEA' : 'SHIP_ON_LAND', ...here, terrain: landed?.terrain, via: 'resolveFrontierMove' });
          // A Jazida Discovery may add a deposit on purpose, so the deposit rule is checked on the pure rotation, not on the post-Discovery map.
          const pure = E.rotatedRegionTiles(state, region, rotation).map(t => t.features.filter(f => f === 'METAL').length).reduce((a, b) => a + b, 0);
          if (pure !== before) out.push({ code: 'METAL_NOT_PRESERVED', ...here, before, after: pure });
          if (clone.regions.find(r => r.id === region.id).rotation !== rotation) out.push({ code: 'ROTATION_NOT_APPLIED', ...here });
          for (const [id, terrain] of outside) if (clone.core.map.find(t => t.id === id).terrain !== terrain) out.push({ code: 'TERRAIN_MUTATED', ...here, hex: id });
          for (const id of region.hexIds) if (observed.has(id) && clone.core.map.find(t => t.id === id).terrain !== tiles.get(id).terrain) out.push({ code: 'TERRAIN_MUTATED', ...here, hex: id });
        } catch (error) { out.push({ code: 'ENGINE_CRASH', region: region.id, entry, rotation, message: String(error.message).slice(0, 160) }); }
      }
    }
  }
  return { checked, violations: out, entityViolations: entities };
}

/** Naufrágio / transport cases on a real world, run directly through `settleCargo`, `embark`, `disembark`. */
export function cargoScenarios(state) {
  const results = [], tiles = new Map(state.core.map.map(t => [t.id, t])), owner = state.players[0].playerId;
  const near = id => nbIds(id).filter(n => tiles.has(n));
  const anySea = state.core.map.find(t => t.terrain === 'SEA' && near(t.id).length === 6);
  const interiorSea = anySea && { id: anySea.id, terrain: 'SEA', carve: true };
  const shoreSea = state.core.map.find(t => t.terrain === 'SEA' && near(t.id).some(n => LAND_TERRAIN.has(tiles.get(n).terrain) && tiles.get(n).terrain !== 'COAST'));
  const coastWithLand = state.core.map.find(t => t.terrain === 'COAST' && near(t.id).some(n => LAND_TERRAIN.has(tiles.get(n).terrain)));
  const fresh = () => { const s = structuredClone(state); s.units = []; s.threats = []; return s; };
  const add = (s, id, kind, hexId, carrierId = null) => s.units.push({ id, ownerId: owner, kind, hexId, recruitedRound: 1, carrierId });
  const run = (name, site, build, expectation) => {
    if (!site) { results.push({ name, skipped: 'no such site in this world' }); return; }
    const s = fresh(); if (site.carve) for (const n of near(site.id)) s.core.map.find(t => t.id === n).terrain = 'SEA'; build(s, site); const before = s.units.filter(u => u.carrierId).length;
    E.settleCargo(s);
    const violations = scanState(s, newMemory(), { cmd: name }).filter(v => UNIT_CODES.includes(v.code));
    const summary = { lost: before - s.units.filter(u => u.kind === 'PIONEER').length, survivors: s.units.filter(u => u.kind === 'PIONEER').map(u => ({ id: u.id, terrain: s.core.map.find(t => t.id === u.hexId).terrain, carried: !!u.carrierId })) };
    results.push({ name, site: site.id, terrain: site.terrain, violations, ...summary, expectation });
  };
  // The carrier is simply gone (sunk by combat / threat): `settleCargo` runs after the removal, as in alpha-combat and alpha-threats.
  run('sunk-interior-sea', interiorSea, (s, site) => { add(s, 'f1', 'FLEET', site.id); add(s, 'pa', 'PIONEER', site.id, 'f1'); add(s, 'pb', 'PIONEER', site.id, 'f1'); s.units = s.units.filter(u => u.id !== 'f1'); }, 'all cargo lost, none left floating');
  run('sunk-shore-sea', shoreSea, (s, site) => { add(s, 'f1', 'FLEET', site.id); add(s, 'pa', 'PIONEER', site.id, 'f1'); add(s, 'pb', 'PIONEER', site.id, 'f1'); s.units = s.units.filter(u => u.id !== 'f1'); }, 'one piece reaches the shore, the other is lost');
  run('sunk-on-coast-with-land', coastWithLand, (s, site) => { add(s, 'f1', 'FLEET', site.id); add(s, 'pa', 'PIONEER', site.id, 'f1'); add(s, 'pb', 'PIONEER', site.id, 'f1'); s.units = s.units.filter(u => u.id !== 'f1'); }, 'COAST is land: ideally both pieces simply stay on the hex');
  run('rescued-by-second-fleet', shoreSea, (s, site) => { add(s, 'f1', 'FLEET', site.id); add(s, 'f2', 'FLEET', site.id); add(s, 'pa', 'PIONEER', site.id, 'f1'); s.units = s.units.filter(u => u.id !== 'f1'); }, 'rescued aboard f2');
  // embark / disembark round trip through real hexes.
  if (shoreSea) {
    const land = near(shoreSea.id).map(id => tiles.get(id)).find(t => LAND_TERRAIN.has(t.terrain) && t.terrain !== 'COAST');
    if (land) {
      const s = fresh(); add(s, 'f1', 'COASTAL_VESSEL', shoreSea.id); add(s, 'pa', 'PIONEER', land.id);
      const known = s.players.find(p => p.playerId === owner).knownHexIds; for (const id of [land.id, shoreSea.id]) if (!known.includes(id)) known.push(id);
      const steps = [];
      const blockE = E.embarkBlock(s, owner, ['pa'], 'f1'); steps.push({ step: 'embark', block: blockE });
      if (!blockE) { E.embark(s, owner, ['pa'], 'f1'); steps.push({ step: 'after-embark', violations: scanState(s, newMemory()).filter(v => UNIT_CODES.includes(v.code)) }); const seaTarget = E.disembarkBlock(s, owner, ['pa'], shoreSea.id); steps.push({ step: 'disembark-onto-SEA', block: seaTarget }); const ok = E.disembarkBlock(s, owner, ['pa'], land.id); steps.push({ step: 'disembark-onto-land', block: ok }); if (!ok) { E.disembark(s, owner, ['pa'], land.id); steps.push({ step: 'after-disembark', violations: scanState(s, newMemory()).filter(v => UNIT_CODES.includes(v.code)) }); } }
      results.push({ name: 'embark-disembark-roundtrip', site: shoreSea.id, steps });
    } else results.push({ name: 'embark-disembark-roundtrip', skipped: 'no land next to sea' });
  }
  return results;
}

/**
 * Two seats enter the SAME closed Region in one round with different orientations (the first to resolve fixes it). Plays real commands and READY, scanning
 * after each one. Returns what happened to the second Pioneiro.
 */
export function raceScenario(state0) {
  const state = structuredClone(E.beginAlphaPlanning(structuredClone(state0)));
  const [a, b] = state.players.map(p => p.playerId), tiles = new Map(state.core.map.map(t => [t.id, t]));
  const openIds = new Set(state.regions.filter(r => r.revealedBy.length > 0).flatMap(r => r.hexIds));
  for (const region of state.regions.filter(r => r.revealedBy.length === 0)) {
    for (const h1 of region.hexIds) for (const h2 of region.hexIds) {
      if (h1 === h2) continue;
      const rot1 = E.entryRotations(state, region, h1, 'LAND'), rot2 = E.entryRotations(state, region, h2, 'LAND');
      const f1 = nbIds(h1).find(id => openIds.has(id) && LAND_TERRAIN.has(tiles.get(id)?.terrain)), f2 = nbIds(h2).find(id => openIds.has(id) && LAND_TERRAIN.has(tiles.get(id)?.terrain) && id !== f1);
      if (!f1 || !f2 || !rot1.length || !rot2.length) continue;
      // The second seat's orientation is legal on its own, but under the first seat's orientation its entry hex is water.
      const pairs = rot1.flatMap(k1 => rot2.filter(k2 => k2 !== k1 && !LAND_TERRAIN.has(E.rotatedRegionTiles(state, region, k1)[region.hexIds.indexOf(h2)].terrain)).map(k2 => [k1, k2]));
      if (!pairs.length) continue;
      const [k1, k2] = pairs[0], violations = [], mem = newMemory();
      const s = structuredClone(state); s.units = s.units.filter(u => u.hexId !== f1 && u.hexId !== f2);
      s.units.push({ id: 'race-a', ownerId: a, kind: 'PIONEER', hexId: f1, recruitedRound: 1, carrierId: null }, { id: 'race-b', ownerId: b, kind: 'PIONEER', hexId: f2, recruitedRound: 1, carrierId: null });
      const box = makeBox(s, { after: (st, id, c) => violations.push(...scanState(st, mem, { by: id, cmd: c.type })), rejected: () => {}, crash: (id, c, e) => violations.push({ code: 'ENGINE_CRASH', message: String(e) }) });
      box.ctx = {};
      const queue = (id, hex, rot) => box.apply(id, { type: 'QUEUE_ORDER', expectedVersion: box.live.version, order: { id: `race-${id}`, type: 'MOVE', unitIds: [id === a ? 'race-a' : 'race-b'], path: [hex], rotation: rot } });
      const qa = queue(a, h1, k1), qb = queue(b, h2, k2);
      for (const id of state.players.map(p => p.playerId)) { if (box.live.phase === 'PLANNING') confirm(box, id); }
      const pa = box.live.units.find(u => u.id === 'race-a'), pb = box.live.units.find(u => u.id === 'race-b');
      return { region: region.id, h1, h2, k1, k2, queuedA: qa.ok, queuedB: qb.ok, A: pa && { hex: pa.hexId, terrain: box.live.core.map.find(t => t.id === pa.hexId).terrain }, B: pb && { hex: pb.hexId, terrain: box.live.core.map.find(t => t.id === pb.hexId).terrain }, resolvedRotation: box.live.regions.find(r => r.id === region.id).rotation, violations: violations.filter(v => HARD.includes(v.code)) };
    }
  }
  return { skipped: 'no suitable pair of entries in this world' };
}


/**
 * World entities placed at creation on face-down (rotation 0) terrain: independent peoples and Acampamentos. For every closed Region that holds one, every orientation a
 * player can actually choose (the union of `entryRotations` over its hexes, on foot and by sea) is applied through the real `revealRegion` on a clone and the state is
 * scanned: the entity must not end on water.
 */
export function entitySweep(state) {
  const out = [], seen = new Set();
  for (const region of state.regions.filter(r => r.revealedBy.length === 0)) {
    const holds = [...state.independents.filter(i => region.hexIds.includes(i.hexId)).map(i => `people ${i.id} @${i.hexId}`), ...state.threats.filter(t => region.hexIds.includes(t.hexId)).map(t => `${t.kind.toLowerCase()} ${t.id} @${t.hexId}`)];
    if (!holds.length) continue;
    const reachable = new Set(['LAND', 'NAVAL'].flatMap(mode => region.hexIds.flatMap(h => E.entryRotations(state, region, h, mode))));
    for (const rotation of [...reachable].sort()) {
      const clone = structuredClone(state), target = clone.regions.find(r => r.id === region.id);
      E.revealRegion(clone, clone.players[0].playerId, target, rotation);
      for (const v of scanState(clone, newMemory(), { cmd: `revealRegion ${region.id} rotation ${rotation}` })) if (ENTITY_CODES.includes(v.code)) { const key = `${v.code}:${v.people ?? v.threat ?? v.hex}:${rotation}`; if (!seen.has(key)) { seen.add(key); out.push({ ...v, rotation, holds }); } }
    }
  }
  return { regionsWithEntities: state.regions.filter(r => r.revealedBy.length === 0 && (state.independents.some(i => r.hexIds.includes(i.hexId)) || state.threats.some(t => r.hexIds.includes(t.hexId)))).length, violations: out };
}
