import type { MapPreset, TerrainType } from '@aoh/game-domain';
import { hexDistance, hexNeighbors } from './hex.js';

/**
 * World presets are PURE per-hex transforms of the authored Region content. They are applied at creation and again whenever a Region is
 * rotated at reveal, so turning a Region can never undo (or leak) the shape of the world: the same hex, seed and authored content always
 * give the same terrain. A hex holding the Region's metal deposit is never carved: every Region keeps its deposit under every rotation.
 * Active Pátrias are never touched.
 *
 *  - MISTO: the authored templates as they are (bays, lakes and straits of the templates, one land mass).
 *  - CONTINENTAL: one great land mass inside a real ocean border: the sea of the templates inside the table becomes land,
 *    and the whole outer rim of the board is ocean (except mountains, deposits and the Pátrias). Coast only survives next to that ocean.
 *  - ARQUIPÉLAGO: the Regions are grouped into islands (every Pátria seeds one) and a one-hex strait is carved between neighbouring islands.
 *    There is NO land corridor: neighbours are reached by sea over short crossings.
 *  - MAR INTERIOR: the middle of the table is one connected sea (every hex within two of the central Region's centre).
 */
export interface WorldShape {
  preset: MapPreset; seed: number;
  active: ReadonlySet<string>;
  /** MAR INTERIOR: the hexes of the central sea. */
  inlandSea: ReadonlySet<string>;
  /** CONTINENTAL: hexes on the outer rim of the board / one step inside it. */
  rim: ReadonlySet<string>; nearRim: ReadonlySet<string>;
  /** ARQUIPÉLAGO: hexes that become the straits between islands. */
  straits: ReadonlySet<string>;
}
interface RegionLike { id: string; templateId: string; hexIds: readonly string[] }
const parse = (id: string) => { const [q, r] = id.split(',').map(Number) as [number, number]; return { q, r }; };
const hashOf = (text: string) => { let h = 2166136261; for (let k = 0; k < text.length; k++) { h ^= text.charCodeAt(k); h = Math.imul(h, 16777619); } return h >>> 0; };

const shapes = new WeakMap<object, Map<string, WorldShape>>();
/** The shape only depends on preset, seed, seat count and the (immutable) Region layout, so it is memoised per Region list. */
export function worldShape(preset: MapPreset, seed: number, regions: readonly RegionLike[], playerCount: number): WorldShape {
  const key = `${preset}:${seed}:${playerCount}`, bucket = shapes.get(regions) ?? new Map<string, WorldShape>();
  shapes.set(regions, bucket);
  const known = bucket.get(key);
  if (known) return known;
  const built = buildShape(preset, seed, regions, playerCount);
  bucket.set(key, built);
  return built;
}
function buildShape(preset: MapPreset, seed: number, regions: readonly RegionLike[], playerCount: number): WorldShape {
  const active = new Set(regions.filter(region => { const match = /^homeland-(\d+)$/.exec(region.templateId); return match !== null && Number(match[1]) <= playerCount; }).map(region => region.id));
  const empty = new Set<string>();
  const shape: WorldShape = { preset, seed, active, inlandSea: empty, rim: empty, nearRim: empty, straits: empty };
  if (!regions.length || preset === 'MIXED') return shape;
  const board = new Set(regions.flatMap(region => region.hexIds));
  const neighboursOf = (id: string) => hexNeighbors(parse(id)).map(p => `${p.q},${p.r}`);
  if (preset === 'INLAND_SEA') {
    const origin = { q: 0, r: 0 };
    const middle = [...regions].sort((a, b) => hexDistance(origin, parse(a.hexIds[0]!)) - hexDistance(origin, parse(b.hexIds[0]!)) || (a.id < b.id ? -1 : 1))[0]!;
    const centre = parse(middle.hexIds[0]!), sea = new Set<string>();
    for (const id of board) if (hexDistance(centre, parse(id)) <= 2) sea.add(id);
    return { ...shape, inlandSea: sea };
  }
  if (preset === 'CONTINENTAL') {
    const rim = new Set([...board].filter(id => neighboursOf(id).some(n => !board.has(n))));
    const nearRim = new Set([...board].filter(id => !rim.has(id) && neighboursOf(id).some(n => rim.has(n))));
    return { ...shape, rim, nearRim };
  }
  // ARCHIPELAGO: islands are the cells of a multi-source flood over the Region graph; every active Pátria seeds one.
  const regionOf = new Map<string, string>(); for (const region of regions) for (const id of region.hexIds) regionOf.set(id, region.id);
  const adjacent = new Map<string, Set<string>>(regions.map(region => [region.id, new Set<string>()]));
  for (const region of regions) for (const id of region.hexIds) for (const n of neighboursOf(id)) { const other = regionOf.get(n); if (other && other !== region.id) adjacent.get(region.id)!.add(other); }
  const homes = regions.filter(region => active.has(region.id)).map(region => region.id).sort();
  const seeds = [...homes], target = Math.max(homes.length + 2, Math.round(regions.length / 4));
  const order = regions.map(region => region.id).filter(id => !active.has(id)).sort((a, b) => hashOf(`${seed}:isle:${a}`) - hashOf(`${seed}:isle:${b}`));
  for (const id of order) { if (seeds.length >= target) break; if (seeds.every(other => other !== id && !adjacent.get(other)!.has(id))) seeds.push(id); }
  const island = new Map<string, number>(seeds.map((id, rank) => [id, rank])), queue = [...seeds];
  for (let i = 0; i < queue.length; i++) for (const next of [...adjacent.get(queue[i]!)!].sort((a, b) => hashOf(`${seed}:flood:${a}`) - hashOf(`${seed}:flood:${b}`))) if (!island.has(next)) { island.set(next, island.get(queue[i]!)!); queue.push(next); }
  // The strait is one hex wide and lies on one side of every boundary: against an active Pátria it is always the other side (the Pátria is never carved),
  // between two islands it is the higher-ranked island's side.
  const straits = new Set<string>();
  for (const id of board) {
    const region = regionOf.get(id)!, mine = island.get(region)!;
    if (active.has(region)) continue;
    if (neighboursOf(id).some(n => { if (!board.has(n)) return false; const other = regionOf.get(n)!, theirs = island.get(other)!; return theirs !== mine && (active.has(other) || mine > theirs); })) straits.add(id);
  }
  return { ...shape, straits };
}

const holdsMetal = (terrain: TerrainType) => terrain === 'HILLS' || terrain === 'MOUNTAINS';

export function presetTerrain(shape: WorldShape, regionId: string, hexId: string, content: { terrain: TerrainType; deposit: boolean }): TerrainType {
  const { terrain } = content;
  if (shape.preset === 'MIXED' || shape.active.has(regionId)) return terrain;
  if (content.deposit && holdsMetal(terrain)) return terrain;
  const { q, r } = parse(hexId);
  switch (shape.preset) {
    case 'CONTINENTAL':
      if (shape.rim.has(hexId)) return terrain !== 'MOUNTAINS' ? 'SEA' : terrain;
      if (terrain === 'SEA') return shape.nearRim.has(hexId) ? 'SEA' : (q + r + shape.seed) % 2 === 0 ? 'PLAINS' : 'FOREST';
      return terrain === 'COAST' && !shape.nearRim.has(hexId) ? 'PLAINS' : terrain;
    case 'ARCHIPELAGO':
      return shape.straits.has(hexId) ? 'SEA' : terrain;
    case 'INLAND_SEA':
      return shape.inlandSea.has(hexId) ? 'SEA' : terrain;
    default:
      return terrain;
  }
}
