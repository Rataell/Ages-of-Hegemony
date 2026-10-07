import type { AlphaState } from '@aoh/game-domain';
import { hexId, hexNeighbors } from './hex.js';

/**
 * ONE truth for water. Ships, the Porto, the Distrito Marítimo, naval exploration and the world audit all read these, never their own list.
 * COAST is both land (a piece can walk on it) and navigable water (a ship can enter it); SEA is water only.
 */
export const isNavigableTerrain = (terrain: string): boolean => terrain === 'COAST' || terrain === 'SEA';
export const isNavigableWater = (tile: { terrain: string } | null | undefined): boolean => !!tile && isNavigableTerrain(tile.terrain);
/** Hexes a land piece can stand on. */
export const isLandTerrain = (terrain: string): boolean => terrain === 'PLAINS' || terrain === 'FOREST' || terrain === 'HILLS' || terrain === 'MOUNTAINS' || terrain === 'COAST';

const tileOf = (state: AlphaState, id: string) => state.core.map.find(tile => tile.id === id);
/** The navigable-water hexes that share an edge with this hex, SEA before COAST, then by id: the candidates for a quay. */
export function waterEdges(state: AlphaState, atHexId: string): string[] {
  const tile = tileOf(state, atHexId);
  if (!tile) return [];
  return hexNeighbors(tile).map(hexId).map(id => tileOf(state, id)).filter((t): t is NonNullable<typeof t> => isNavigableWater(t))
    .sort((a, b) => Number(a.terrain !== 'SEA') - Number(b.terrain !== 'SEA') || a.id.localeCompare(b.id)).map(t => t.id);
}
/** The hex a quay of this city reaches across a shared edge, or null when the city has no navigable-water edge. */
export const harborHex = (state: AlphaState, cityHexId: string): string | null => waterEdges(state, cityHexId)[0] ?? null;
/** A city may hold a Distrito Marítimo / Porto only with a real navigable-water edge. */
export function isCoastalCity(state: AlphaState, cityId: string): boolean {
  const city = state.core.players.flatMap(player => player.civilization.cities).find(candidate => candidate.id === cityId);
  return !!city && harborHex(state, city.hexId) !== null;
}
