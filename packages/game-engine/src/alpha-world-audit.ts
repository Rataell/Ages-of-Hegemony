import type { AlphaState } from '@aoh/game-domain';
import { hexId, hexNeighbors } from './hex.js';

import { isLandTerrain, isNavigableTerrain } from './alpha-water.js';
export { isLandTerrain, isNavigableTerrain };

export interface WorldAudit {
  regions: number; hexes: number;
  seaHexes: number; seaShare: number;
  /** Largest connected body of SEA hexes. */
  largestSea: number;
  landComponents: number[];
  patrias: { playerId: string; metalRegionDistance: number | null; landReach: number; waterEdge: boolean; landLinked: boolean }[];
  issues: string[];
}

/** Region-graph distance from `from` to every region over true hex adjacency. */
function regionDistances(state: AlphaState, from: string): Map<string, number> {
  const owner = new Map<string, string>(); for (const region of state.regions) for (const id of region.hexIds) owner.set(id, region.id);
  const next = new Map<string, Set<string>>(state.regions.map(region => [region.id, new Set<string>()]));
  for (const region of state.regions) for (const id of region.hexIds) {
    const [q, r] = id.split(',').map(Number) as [number, number];
    for (const point of hexNeighbors({ q, r })) { const other = owner.get(hexId(point)); if (other && other !== region.id) next.get(region.id)!.add(other); }
  }
  const dist = new Map<string, number>([[from, 0]]), queue = [from];
  for (const id of queue) for (const n of next.get(id) ?? []) if (!dist.has(n)) { dist.set(n, dist.get(id)! + 1); queue.push(n); }
  return dist;
}

/** Structural audit of a freshly generated world (rotation-independent: deposits are never carved, active Pátrias never touched). */
export function auditWorld(state: AlphaState): WorldAudit {
  const tiles = new Map(state.core.map.map(t => [t.id as string, t]));
  const issues: string[] = [];
  const neighbours = (id: string) => { const t = tiles.get(id)!; return hexNeighbors(t).map(hexId).filter(n => tiles.has(n)) as string[]; };
  const component = (start: string, test: (terrain: string) => boolean, seen: Set<string>) => {
    const out: string[] = [start]; seen.add(start);
    for (let i = 0; i < out.length; i++) for (const n of neighbours(out[i]!)) if (!seen.has(n) && test(tiles.get(n)!.terrain)) { seen.add(n); out.push(n); }
    return out;
  };
  const seaSeen = new Set<string>(), seaBodies: number[] = [];
  for (const t of state.core.map) if (t.terrain === 'SEA' && !seaSeen.has(t.id as string)) seaBodies.push(component(t.id as string, x => x === 'SEA', seaSeen).length);
  const landSeen = new Set<string>(), landBodies: { size: number; ids: Set<string> }[] = [];
  for (const t of state.core.map) if (isLandTerrain(t.terrain) && !landSeen.has(t.id as string)) { const ids = component(t.id as string, isLandTerrain, landSeen); landBodies.push({ size: ids.length, ids: new Set(ids) }); }
  const seaHexes = state.core.map.filter(t => t.terrain === 'SEA').length;
  const metalRegions = new Set(state.regions.filter(region => region.hexIds.some(id => tiles.get(id)!.features.includes('METAL'))).map(region => region.id));
  const patrias = state.players.map((player, slot) => {
    const home = state.regions.find(region => region.templateId === `homeland-${slot + 1}`)!;
    const capital = state.core.players[slot]!.civilization.cities[0]!.hexId as string;
    const distances = regionDistances(state, home.id);
    const metal = [...metalRegions].map(id => distances.get(id)).filter((d): d is number => d !== undefined);
    const body = landBodies.find(b => b.ids.has(capital))!;
    // The Pátria can reach water when its land mass touches navigable water anywhere (a city there can take the Porto).
    const waterEdge = [...body.ids].some(id => tiles.get(id)!.terrain === 'COAST' || neighbours(id).some(n => tiles.get(n)!.terrain === 'SEA'));
    const others = state.core.players.filter((_, i) => i !== slot).map(p => p.civilization.cities[0]!.hexId as string);
    return { playerId: player.playerId as string, metalRegionDistance: metal.length ? Math.min(...metal) : null, landReach: body.size, waterEdge, landLinked: others.some(id => body.ids.has(id)) };
  });
  for (const p of patrias) {
    if (p.metalRegionDistance === null || p.metalRegionDistance > 2) issues.push(`${p.playerId}: sem metal em até 2 Regiões`);
    if (!p.waterEdge && !p.landLinked) issues.push(`${p.playerId}: isolado (sem borda d'água nem terra até outra Pátria)`);
    if (p.landReach < 12 && !p.waterEdge) issues.push(`${p.playerId}: terra insuficiente`);
  }
  return { regions: state.regions.length, hexes: state.core.map.length, seaHexes, seaShare: seaHexes / state.core.map.length, largestSea: Math.max(0, ...seaBodies), landComponents: landBodies.map(b => b.size).sort((a, b) => b - a), patrias, issues };
}
