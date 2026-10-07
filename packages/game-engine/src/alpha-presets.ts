import type { MapPreset, TerrainType } from '@aoh/game-domain';
import { hexDistance } from './hex.js';

/**
 * World presets are PURE per-hex transforms of the authored Region content. They are applied at creation and again whenever a Region is
 * rotated at reveal, so turning a Region can never undo (or leak) the shape of the world: the same hex, seed and authored content always
 * give the same terrain. A hex holding the Region's metal deposit is never carved: every Region keeps its deposit under every rotation.
 *
 *  - MISTO: the authored templates as they are.
 *  - CONTINENTAL: no sea outside the Pátrias; the water of the templates becomes land.
 *  - ARQUIPÉLAGO: roughly two of every five open hexes become sea. There is NO land corridor: neighbours are reached by sea.
 *  - MAR INTERIOR: the middle of the table is one connected sea (every hex within two of the central Region's centre).
 * Active Pátrias are never touched.
 */
export interface WorldShape { preset: MapPreset; seed: number; active: ReadonlySet<string>; inlandSea: ReadonlySet<string> }
interface RegionLike { id: string; templateId: string; hexIds: readonly string[] }
const parse = (id: string) => { const [q, r] = id.split(',').map(Number) as [number, number]; return { q, r }; };

export function worldShape(preset: MapPreset, seed: number, regions: readonly RegionLike[], playerCount: number): WorldShape {
  const active = new Set(regions.filter(region => { const match = /^homeland-(\d+)$/.exec(region.templateId); return match !== null && Number(match[1]) <= playerCount; }).map(region => region.id));
  const inlandSea = new Set<string>();
  if (preset === 'INLAND_SEA' && regions.length) {
    const origin = { q: 0, r: 0 };
    const middle = [...regions].sort((a, b) => hexDistance(origin, parse(a.hexIds[0]!)) - hexDistance(origin, parse(b.hexIds[0]!)) || (a.id < b.id ? -1 : 1))[0]!;
    const centre = parse(middle.hexIds[0]!);
    for (const region of regions) for (const id of region.hexIds) if (hexDistance(centre, parse(id)) <= 2) inlandSea.add(id);
  }
  return { preset, seed, active, inlandSea };
}

const holdsMetal = (terrain: TerrainType) => terrain === 'HILLS' || terrain === 'MOUNTAINS';
const mix = (q: number, r: number, seed: number) => Math.abs(q * 17 + r * 31 + seed);

export function presetTerrain(shape: WorldShape, regionId: string, hexId: string, content: { terrain: TerrainType; deposit: boolean }): TerrainType {
  const { terrain } = content;
  if (shape.preset === 'MIXED' || shape.active.has(regionId)) return terrain;
  if (content.deposit && holdsMetal(terrain)) return terrain;
  const { q, r } = parse(hexId);
  switch (shape.preset) {
    case 'CONTINENTAL':
      if (terrain === 'SEA') return (q + r + shape.seed) % 2 === 0 ? 'PLAINS' : 'FOREST';
      return terrain === 'COAST' ? 'PLAINS' : terrain;
    case 'ARCHIPELAGO':
      return terrain !== 'MOUNTAINS' && mix(q, r, shape.seed) % 5 < 2 ? 'SEA' : terrain;
    case 'INLAND_SEA':
      return shape.inlandSea.has(hexId) ? 'SEA' : terrain;
    default:
      return terrain;
  }
}
