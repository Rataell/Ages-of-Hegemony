/* global structuredClone */
// World topology measurement for the Alpha (V1.2 audit, lane C). Pure functions over the BUILT packages (`npm run compile` output).
// Reads the real generator (createAlphaGame + rotatedRegionTiles); never edits the engine. Used by tests/v12-audit-world-connectivity.test.ts and
// scripts/alpha-world-invariants.mjs. "Navigable" is the engine's own truth (alpha-water.ts): COAST and SEA; "land" includes COAST.
import * as E from '../../packages/game-engine/dist/index.js';

export const PRESETS = ['MIXED', 'CONTINENTAL', 'ARCHIPELAGO', 'INLAND_SEA'];
export const NAV = t => t === 'COAST' || t === 'SEA';
export const LAND = t => t === 'PLAINS' || t === 'FOREST' || t === 'HILLS' || t === 'MOUNTAINS' || t === 'COAST';
/** A pond is a navigable body smaller than a Region (7 hexes): too small to be "a sea" for ships, ports and the Distrito Marítimo. */
export const POND_MAX = 6;

const hashOf = text => { let h = 2166136261; for (let k = 0; k < text.length; k++) { h ^= text.charCodeAt(k); h = Math.imul(h, 16777619); } return h >>> 0; };
const nbIds = id => { const [q, r] = id.split(',').map(Number); return [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]].map(([a, b]) => `${q + a},${r + b}`); };
export const players = n => Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` }));

/** A freshly created world (what the table sees at round 1: frontier Regions still at rotation 0). */
export const makeWorld = ({ preset, seed, players: n, size = 'STANDARD' }) => E.createAlphaGame({ gameId: `w-${preset}-${seed}-${n}`, seed, players: players(n), preset: 'STANDARD', worldPreset: preset, mapSize: size });

/**
 * The same world once every non-Pátria Region has been revealed under a pseudo-random orientation (what a long match converges to).
 * Active Pátrias keep rotation 0 (they are public from the first snapshot). Pure: returns a clone.
 */
export function revealedWorld(state, salt = 0) {
  const clone = structuredClone(state);
  for (const region of clone.regions) {
    if (region.revealedBy.length > 0) continue;
    const rotation = hashOf(`${salt}:${region.id}`) % 6, tiles = E.rotatedRegionTiles(clone, region, rotation);
    region.hexIds.forEach((id, i) => { const tile = clone.core.map.find(t => t.id === id); tile.terrain = tiles[i].terrain; tile.features = tiles[i].features; });
    region.rotation = rotation;
  }
  return clone;
}

function components(ids, tiles, test) {
  const seen = new Set(), out = [];
  for (const id of ids) {
    if (seen.has(id) || !test(tiles.get(id).terrain)) continue;
    const comp = [id]; seen.add(id);
    for (let i = 0; i < comp.length; i++) for (const n of nbIds(comp[i])) if (!seen.has(n) && tiles.has(n) && test(tiles.get(n).terrain)) { seen.add(n); comp.push(n); }
    out.push(comp);
  }
  return out.sort((a, b) => b.length - a.length);
}

/** Region-graph distances from one Region over true hex adjacency. */
function regionGraph(state) {
  const owner = new Map(); for (const region of state.regions) for (const id of region.hexIds) owner.set(id, region.id);
  const adj = new Map(state.regions.map(r => [r.id, new Set()]));
  for (const region of state.regions) for (const id of region.hexIds) for (const n of nbIds(id)) { const o = owner.get(n); if (o && o !== region.id) adj.get(region.id).add(o); }
  return { owner, adj };
}
const bfs = (adj, from) => { const d = new Map([[from, 0]]), q = [from]; for (const id of q) for (const n of adj.get(id) ?? []) if (!d.has(n)) { d.set(n, d.get(id) + 1); q.push(n); } return d; };
const hexDist = (a, b) => { const [aq, ar] = a.split(',').map(Number), [bq, br] = b.split(',').map(Number); return Math.max(Math.abs(aq - bq), Math.abs(ar - br), Math.abs(aq + ar - bq - br)); };

export function measureWorld(state) {
  const tiles = new Map(state.core.map.map(t => [t.id, t])), ids = [...tiles.keys()];
  const seaComps = components(ids, tiles, t => t === 'SEA'), navComps = components(ids, tiles, NAV), landComps = components(ids, tiles, LAND);
  const navOf = new Map(); navComps.forEach((c, i) => c.forEach(id => navOf.set(id, i)));
  const landOf = new Map(); landComps.forEach((c, i) => c.forEach(id => landOf.set(id, i)));
  const main = navComps[0] ?? [];
  const coasts = ids.filter(id => tiles.get(id).terrain === 'COAST');
  const fakeCoasts = coasts.filter(id => !nbIds(id).some(n => tiles.has(n) && NAV(tiles.get(n).terrain)));
  // Land hexes that are a quay candidate (a shared edge with navigable water) and how big the water body behind that edge is.
  const quays = ids.filter(id => LAND(tiles.get(id).terrain) && nbIds(id).some(n => tiles.has(n) && NAV(tiles.get(n).terrain)));
  const quayBody = id => Math.max(...nbIds(id).filter(n => tiles.has(n) && NAV(tiles.get(n).terrain)).map(n => navComps[navOf.get(n)].length));
  const pondQuays = quays.filter(id => quayBody(id) <= POND_MAX);
  // isPort (alpha-naval) says COAST or next to water; harborHex (alpha-water) needs a shared edge with water: they disagree on a fake coast.
  const portNoHarbor = coasts.filter(id => E.harborHex(state, id) === null);
  const { adj } = regionGraph(state);
  const homes = state.players.map((p, slot) => {
    const region = state.regions.find(r => r.templateId === `homeland-${slot + 1}`), capital = state.core.players[slot].civilization.cities[0].hexId;
    const dist = bfs(adj, region.id), landBody = landComps[landOf.get(capital)];
    const near = state.regions.filter(r => (dist.get(r.id) ?? 99) <= 1), near2 = state.regions.filter(r => (dist.get(r.id) ?? 99) <= 2);
    const count = (regions, feature) => regions.reduce((n, r) => n + r.hexIds.filter(h => tiles.get(h).features.includes(feature)).length, 0);
    const harbor = E.harborHex(state, capital), capitalPort = harbor ? navComps[navOf.get(harbor)].length : 0;
    // The Pátria's land mass touches the main navigable body (a city on it could take a useful Porto).
    const touchesMain = landBody.some(id => nbIds(id).some(n => navOf.get(n) === 0) || navOf.get(id) === 0);
    const touchesAnyWater = landBody.some(id => nbIds(id).some(n => tiles.has(n) && NAV(tiles.get(n).terrain)) || tiles.get(id).terrain === 'COAST');
    // Water a city of this Pátria could really use: a quay within 3 hexes of the capital (the widest city radius) on a navigable body of at least one Region (7 hexes).
    const cap = tiles.get(capital), within3 = landBody.filter(id => hexDist(id, capital) <= 3 && LAND(tiles.get(id).terrain));
    const bodyOfQuay = id => Math.max(0, ...nbIds(id).filter(n => tiles.has(n) && NAV(tiles.get(n).terrain)).map(n => navComps[navOf.get(n)].length));
    const quayBodies = within3.map(bodyOfQuay).filter(x => x > 0), bestQuayBody = quayBodies.length ? Math.max(...quayBodies) : 0;
    void cap;
    return { slot, region: region.id, bestQuayBody, realPortWithin3: bestQuayBody > POND_MAX, anyQuayWithin3: bestQuayBody > 0, capital, landMass: landBody.length, landMassId: landOf.get(capital), capitalHarborBody: capitalPort, touchesMain, touchesAnyWater,
      metalR1: count(near, 'METAL'), metalR2: count(near2, 'METAL'), fishR1: count(near, 'FISH'), timberR1: count(near, 'TIMBER'), fertileR1: count(near, 'FERTILE'), stoneR1: count(near, 'STONE'), fishHome: count([region], 'FISH') };
  });
  const pairs = [];
  for (let a = 0; a < homes.length; a++) for (let b = a + 1; b < homes.length; b++) pairs.push({ a, b, hex: hexDist(homes[a].capital, homes[b].capital), sameLandMass: homes[a].landMassId === homes[b].landMassId });
  return {
    regions: state.regions.length, regionSizes: [...new Set(state.regions.map(r => r.hexIds.length))], hexes: ids.length,
    sea: { hexes: ids.filter(id => tiles.get(id).terrain === 'SEA').length, comps: seaComps.map(c => c.length) },
    nav: { comps: navComps.map(c => c.length), main: main.length, ponds: navComps.slice(1).filter(c => c.length <= POND_MAX).length, orphanBodies: navComps.length - 1 },
    land: { comps: landComps.map(c => c.length), fragments: landComps.filter(c => c.length < 7).length },
    coasts: coasts.length, fakeCoasts: fakeCoasts.length, quays: quays.length, pondQuays: pondQuays.length, portNoHarbor: portNoHarbor.length,
    homes, pairs,
  };
}

/** CONTINENTAL promises "a real ocean border": the SEA hexes of the outer rim of the board, and how many separate navigable bodies they fall into. */
export function rimOcean(state) {
  const tiles = new Map(state.core.map.map(t => [t.id, t])), ids = [...tiles.keys()];
  const rim = ids.filter(id => nbIds(id).some(n => !tiles.has(n))), navComps = components(ids, tiles, NAV), navOf = new Map(); navComps.forEach((c, i) => c.forEach(id => navOf.set(id, i)));
  const seaRim = rim.filter(id => tiles.get(id).terrain === 'SEA');
  return { rim: rim.length, seaRim: seaRim.length, rimLand: rim.length - seaRim.length - rim.filter(id => tiles.get(id).terrain === 'COAST').length, bodies: new Set(seaRim.map(id => navOf.get(id))).size, largestBody: navComps[0]?.length ?? 0 };
}

/** INLAND_SEA promises "one connected sea in the middle": the 19 hexes within two of the central Region centre, and what is not water in them. */
export function inlandCore(state) {
  const tiles = new Map(state.core.map.map(t => [t.id, t])), origin = '0,0';
  const middle = [...state.regions].sort((a, b) => hexDist(origin, a.hexIds[0]) - hexDist(origin, b.hexIds[0]) || (a.id < b.id ? -1 : 1))[0], centre = middle.hexIds[0];
  const disk = [...tiles.keys()].filter(id => hexDist(centre, id) <= 2), navComps = components([...tiles.keys()], tiles, NAV), navOf = new Map(); navComps.forEach((c, i) => c.forEach(id => navOf.set(id, i)));
  const dry = disk.filter(id => !NAV(tiles.get(id).terrain));
  return { region: middle.id, disk: disk.length, dry: dry.map(id => `${id}:${tiles.get(id).terrain}${tiles.get(id).features.includes('METAL') ? '+METAL' : ''}`), bodies: new Set(disk.filter(id => tiles.get(id).terrain === 'SEA').map(id => navOf.get(id))).size };
}

/* ------------------------------------------------------------------ properties */

const activeHomes = state => state.players.map((_, slot) => state.regions.find(r => r.templateId === `homeland-${slot + 1}`));
export const pondQuayHexes = state => {
  const tiles = new Map(state.core.map.map(t => [t.id, t])), ids = [...tiles.keys()], navComps = components(ids, tiles, NAV), navOf = new Map(); navComps.forEach((c, i) => c.forEach(id => navOf.set(id, i)));
  return ids.filter(id => LAND(tiles.get(id).terrain) && nbIds(id).some(n => tiles.has(n) && NAV(tiles.get(n).terrain) && navComps[navOf.get(n)].length <= POND_MAX) && !nbIds(id).some(n => tiles.has(n) && NAV(tiles.get(n).terrain) && navComps[navOf.get(n)].length > POND_MAX));
};

/**
 * Connectivity properties per preset. `kind` GUARD = must hold today (the audit preserves it); FINDING = does not hold today (documented with `it.fails`; flip to a plain `it`
 * when the generator is fixed). `check` returns null when the world satisfies it, otherwise a one-line detail. A world is checked at creation (rotation 0) and again once every
 * Region has been turned (`revealedWorld`).
 */
export const PROPERTIES = [
  { id: 'G1-seven-hex-regions', kind: 'GUARD', presets: PRESETS, title: 'every Region has exactly seven distinct hexes', check: (st, m) => (m.regionSizes.length === 1 && m.regionSizes[0] === 7 ? null : `sizes ${m.regionSizes}`) },
  { id: 'G2-deposit-survives-rotation', kind: 'GUARD', presets: PRESETS, title: 'a Region keeps exactly its metal deposits under all six rotations', check: st => {
    for (const region of st.regions) { const counts = [0, 1, 2, 3, 4, 5].map(k => E.rotatedRegionTiles(st, region, k).map(t => t.features.filter(f => f === 'METAL').length).reduce((a, b) => a + b, 0)); if (new Set(counts).size !== 1) return `${region.id}: ${counts}`; }
    return null; } },
  { id: 'G3-patria-untouched', kind: 'GUARD', presets: PRESETS, title: 'active Pátrias stay at rotation 0 with their authored terrain', check: st => {
    for (const region of activeHomes(st)) { const authored = E.rotatedRegionTiles(st, region, 0); if (region.rotation !== 0 || region.hexIds.some((id, i) => st.core.map.find(t => t.id === id).terrain !== authored[i].terrain)) return `${region.id} rotation ${region.rotation}`; }
    return null; } },
  { id: 'G4-metal-within-two-regions', kind: 'GUARD', presets: PRESETS, title: 'every active Pátria has a metal deposit within two Regions', check: (st, m) => (m.homes.every(h => h.metalR2 > 0) ? null : `no metal: slots ${m.homes.filter(h => h.metalR2 === 0).map(h => h.slot + 1)}`) },
  { id: 'G5-patrias-share-a-land-mass', kind: 'GUARD', presets: ['MIXED', 'CONTINENTAL', 'INLAND_SEA'], title: 'every active Pátria is on the same land mass (a walkable road exists between homelands)', check: (st, m) => (m.homes.every(h => h.landMassId === m.homes[0].landMassId) ? null : `land masses ${m.homes.map(h => h.landMassId)}`) },
  { id: 'G6-inland-sea-one-body', kind: 'GUARD', presets: ['INLAND_SEA'], title: 'the central sea is one connected body', check: st => { const c = inlandCore(st); return c.bodies === 1 ? null : `${c.bodies} bodies`; } },
  { id: 'G7-archipelago-islands', kind: 'GUARD', presets: ['ARCHIPELAGO'], title: 'the world is split into at least two land masses', check: (st, m) => (m.land.comps.length >= 2 ? null : 'single land mass') },
  { id: 'F1-no-fake-coast', kind: 'FINDING', presets: PRESETS, title: 'no COAST hex without a navigable neighbour (a coast to nowhere)', check: (st, m) => (m.fakeCoasts === 0 ? null : `${m.fakeCoasts} fake coast(s)`) },
  { id: 'F2-isPort-implies-harbor', kind: 'FINDING', presets: PRESETS, title: 'isPort (recruit ships) and harborHex (Distrito Marítimo) agree on every COAST hex', check: (st, m) => (m.portNoHarbor === 0 ? null : `${m.portNoHarbor} COAST hex(es) are a port without a harbor`) },
  { id: 'F3-no-port-on-a-pond', kind: 'FINDING', presets: PRESETS, title: 'a quay needs a navigable body of at least one Region (7 hexes): harborHex is null on pond-only edges', check: st => { const bad = pondQuayHexes(st).filter(id => E.harborHex(st, id) !== null); return bad.length === 0 ? null : `${bad.length} pond-only quay hex(es), e.g. ${bad[0]}`; } },
  { id: 'F4-home-port-on-real-sea', kind: 'FINDING', presets: ['MIXED', 'CONTINENTAL'], title: 'no active Pátria is left with ponds as its only water', check: (st, m) => { const bad = m.homes.filter(h => h.anyQuayWithin3 && !h.realPortWithin3); return bad.length === 0 ? null : `slots ${bad.map(h => h.slot + 1)} reach only a pond (best body ${bad.map(h => h.bestQuayBody)})`; } },
  { id: 'F5-continental-ocean-rim', kind: 'FINDING', presets: ['CONTINENTAL'], title: 'the outer ocean rim is one navigable body', check: st => { const r = rimOcean(st); return r.bodies === 1 ? null : `${r.bodies} separate bodies (${r.rimLand} dry rim hexes)`; } },
  { id: 'F6-continental-one-land-mass', kind: 'FINDING', presets: ['CONTINENTAL'], title: 'one great land mass: no islet cut off from it', check: (st, m) => (m.land.comps.length === 1 ? null : `land masses ${m.land.comps}`) },
  { id: 'F7-inland-sea-no-metal-islets', kind: 'FINDING', presets: ['INLAND_SEA'], title: 'the central sea has no dry hex (deposits are not carved into islets)', check: st => { const c = inlandCore(st); return c.dry.length === 0 ? null : `dry: ${c.dry}`; } },
  { id: 'F8-inland-sea-no-fragments', kind: 'FINDING', presets: ['INLAND_SEA'], title: 'no land fragment smaller than a Region', check: (st, m) => (m.land.fragments === 0 ? null : `${m.land.fragments} fragment(s) ${m.land.comps.filter(c => c < 7)}`) },
  { id: 'F9-archipelago-no-corridor', kind: 'FINDING', presets: ['ARCHIPELAGO'], title: 'no land corridor: no two active Pátrias share a land mass', check: (st, m) => { const seen = new Map(); for (const h of m.homes) { if (seen.has(h.landMassId)) return `slots ${seen.get(h.landMassId) + 1} and ${h.slot + 1} share a land mass`; seen.set(h.landMassId, h.slot); } return null; } },
  { id: 'F10-archipelago-patria-has-real-port', kind: 'FINDING', presets: ['ARCHIPELAGO'], title: 'every active Pátria reaches a real sea (a quay within 3 hexes of the capital on a body of 7+ hexes)', check: (st, m) => { const bad = m.homes.filter(h => !h.realPortWithin3); return bad.length === 0 ? null : `slots ${bad.map(h => h.slot + 1)} have no real port`; } },
  { id: 'F11-archipelago-no-islets', kind: 'FINDING', presets: ['ARCHIPELAGO'], title: 'no land fragment smaller than a Region', check: (st, m) => (m.land.fragments === 0 ? null : `${m.land.fragments} fragment(s) ${m.land.comps.filter(c => c < 7)}`) },
];

/** Runs every property over seeds x player counts x {creation, all Regions turned}. Returns { id -> { fails, total, first } per preset }. Each world is measured once. */
export function runProperties({ seeds, counts = [2, 4, 6], size = 'STANDARD', only, presets = PRESETS } = {}) {
  const table = {}, props = PROPERTIES.filter(p => !only || only.includes(p.id));
  for (const prop of props) table[prop.id] = { id: prop.id, kind: prop.kind, title: prop.title, byPreset: Object.fromEntries(prop.presets.filter(x => presets.includes(x)).map(x => [x, { fails: 0, total: 0, first: null }])) };
  for (const preset of presets) for (const players of counts) for (const seed of seeds) for (const variant of ['creation', 'turned']) {
    const base = makeWorld({ preset, seed, players, size }), state = variant === 'creation' ? base : revealedWorld(base, seed), measure = measureWorld(state);
    for (const prop of props) {
      const cell = table[prop.id].byPreset[preset]; if (!cell) continue;
      const detail = prop.check(state, measure); cell.total++;
      if (detail !== null) { cell.fails++; cell.first ??= { preset, seed, players, size, variant, detail }; }
    }
  }
  return table;
}
