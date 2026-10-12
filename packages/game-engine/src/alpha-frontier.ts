import type { AlphaState, AlphaUnit, HexId, PlayerId, StrategicOrder } from '@aoh/game-domain';
import { REGION_TEMPLATES } from '@aoh/game-domain';
import { hexDistance } from './hex.js';
import { isLandTerrain, isNavigableTerrain } from './alpha-water.js';
import { regionOpenFor, regionOrientationFixed, revealRegion, rotatedRegionTiles, rotationKeepsOccupants, visibleHexIds } from './alpha-world.js';
import { applyDiscovery } from './alpha-discoveries.js';
import { canEnter } from './alpha-military.js';
import { enemyCityAt, movementOpen } from './alpha-diplomacy.js';
import { hasUnlock, institutionBonus } from './alpha-institutions.js';
import { unitMovement } from './alpha-grades.js';
import { kitFrontierCost, kitMovement } from './alpha-kits.js';
import { cargoOf, isCarried, settleCargo } from './alpha-naval.js';
import { stackBlock } from './alpha-stack.js';

/**
 * MOVE + DISCOVERY (canon 2026-10-07). There is no separate "explore" Order: MOVER is the Order, and opening a Region is the special consequence of a
 * Move whose last step enters a closed Region. The Region is the unit of the unknown (never a single hex): entering it costs UNKNOWN (1), is always the
 * last step, flips the whole Region, resolves its Discovery once, and ends the move on the entry hex. The terrain found there is never charged back.
 *
 * Who may enter the unknown:
 *  - on land, a group that contains a Pioneiro (the others are escort);
 *  - at sea, a ship that carries a Pioneiro, or any ship of a civilization that learned Navegação Oceânica (`web-ocean-navigation`).
 * Everyone in the group starts on the same hex and walks the same path, so the slowest piece limits it.
 */
/** The Teia unlock tag (Navegação Oceânica): a civilization capability, never a ship class. Any naval unit of the civilization then opens closed Regions by itself. */
export const NAVAL_DISCOVERY_UNLOCK = 'rule:naval-discovery';
export const FRONTIER_NEEDS_PIONEER = 'Necessita de um Pioneiro para descobrir.';
export const FRONTIER_NEEDS_NAVAL = 'Requer acesso naval.';
export const FRONTIER_NEEDS_LAND = 'Requer acesso por terra.';

export const navalDiscoveryUnlocked = (state: AlphaState, actor: PlayerId): boolean => hasUnlock(state, actor, NAVAL_DISCOVERY_UNLOCK);

export type FrontierMode = 'LAND' | 'NAVAL';
export interface Discoverer { /** The piece the Discovery is charged to (Perigo takes this one): the Pioneiro, or the ship that sails alone. */ id: string; via: 'PIONEER' | 'NAVAL_ADVANCE' }

const tileOf = (state: AlphaState, id: string) => state.core.map.find(tile => tile.id === id);
export const frontierMode = (state: AlphaState, units: readonly AlphaUnit[]): FrontierMode | null => {
  if (!units.length) return null;
  if (units.every(unit => state.rules.units[unit.kind].domain === 'LAND')) return 'LAND';
  if (units.every(unit => state.rules.units[unit.kind].domain === 'SEA')) return 'NAVAL';
  return null;
};
/** The piece that leads a Discovery for this group, or null when the group cannot open a Region. */
export function discovererOf(state: AlphaState, actor: PlayerId, units: readonly AlphaUnit[]): Discoverer | null {
  const mode = frontierMode(state, units);
  if (mode === 'LAND') {
    const pioneer = units.filter(unit => unit.kind === 'PIONEER').sort((a, b) => a.id.localeCompare(b.id))[0];
    return pioneer ? { id: pioneer.id, via: 'PIONEER' } : null;
  }
  if (mode === 'NAVAL') {
    const ships = [...units].sort((a, b) => a.id.localeCompare(b.id));
    for (const ship of ships) {
      const pioneer = cargoOf(state, ship.id).filter(unit => unit.kind === 'PIONEER').sort((a, b) => a.id.localeCompare(b.id))[0];
      if (pioneer) return { id: pioneer.id, via: 'PIONEER' };
    }
    if (navalDiscoveryUnlocked(state, actor) && ships[0]) return { id: ships[0].id, via: 'NAVAL_ADVANCE' };
  }
  return null;
}
export const frontierBlockText = (mode: FrontierMode): string => (mode === 'LAND' ? FRONTIER_NEEDS_NAVAL : FRONTIER_NEEDS_LAND);

const budgetOf = (state: AlphaState, actor: PlayerId, unit: AlphaUnit): number => unitMovement(state, unit) + institutionBonus(state, actor, 'MOVEMENT') + kitMovement(state, actor, unit.kind);
export const stepCost = (state: AlphaState, unit: Pick<AlphaUnit, 'kind'>, tile: { id: string; terrain: string }): number =>
  state.roads.includes(tile.id as HexId) && state.rules.units[unit.kind].domain === 'LAND' ? 1 : state.rules.movementCosts[tile.terrain as keyof AlphaState['rules']['movementCosts']];

/** The Region (closed for `actor`) that the last hex of this MOVE enters, or null: an ordinary move. */
export function frontierRegionOf(state: AlphaState, actor: PlayerId, order: Extract<StrategicOrder, { type: 'MOVE' }>) {
  const last = order.path.at(-1);
  if (!last) return null;
  const progress = state.players.find(player => player.playerId === actor);
  if (!progress || progress.knownHexIds.includes(last as HexId)) return null;
  const region = state.regions.find(candidate => candidate.hexIds.includes(last as HexId));
  return region && !regionOpenFor(state, region, actor) ? region : null;
}
export const isFrontierMove = (state: AlphaState, actor: PlayerId, order: StrategicOrder): order is Extract<StrategicOrder, { type: 'MOVE' }> => order.type === 'MOVE' && frontierRegionOf(state, actor, order) !== null;

/** Per-call memo: what every seat already observes, and each Region's terrain under every orientation that keeps observed terrain unchanged. */
export interface FrontierCache { observed: Set<string> | null; profiles: Map<string, { rotation: number; terrains: string[] }[]> }
export const newFrontierCache = (): FrontierCache => ({ observed: null, profiles: new Map() });
function profileOf(state: AlphaState, region: AlphaState['regions'][number], cache: FrontierCache) {
  const hit = cache.profiles.get(region.id);
  if (hit) return hit;
  cache.observed ??= new Set(state.players.flatMap(player => [...player.knownHexIds, ...visibleHexIds(state, player.playerId)]));
  const observed = cache.observed;
  const known = [0, 1, 2, 3, 4, 5].flatMap(rotation => {
    const tiles = rotatedRegionTiles(state, region, rotation);
    const keepsKnown = region.hexIds.every((id, i) => { if (!observed.has(id)) return true; const tile = tileOf(state, id)!; return tile.terrain === tiles[i]!.terrain && tile.features.join() === tiles[i]!.features.join(); });
    return keepsKnown ? [{ rotation, terrains: tiles.map(tile => tile.terrain as string) }] : [];
  });
  // WORLD-11: prefer turns that leave every people, camp and pirate on terrain that suits it; if every turn breaks one, keep them all (revealRegion settles the occupant).
  const safe = known.filter(entry => rotationKeepsOccupants(state, region, entry.terrains.map(terrain => ({ terrain }))));
  const profile = safe.length ? safe : known;
  cache.profiles.set(region.id, profile);
  return profile;
}
/**
 * Orientations (sixth-turns) under which `entryId` is a hex the group can stand on, never altering terrain somebody already knows. A Region whose orientation is
 * fixed (anyone revealed, claimed or entered it) answers with its one rotation, or none when the standing terrain does not suit the group.
 */
export function entryRotations(state: AlphaState, region: AlphaState['regions'][number], entryId: string, mode: FrontierMode, cache: FrontierCache = newFrontierCache()): number[] {
  const enters = mode === 'LAND' ? isLandTerrain : isNavigableTerrain, index = region.hexIds.indexOf(entryId as HexId);
  if (index < 0) return [];
  if (regionOrientationFixed(state, region)) return enters(tileOf(state, entryId)!.terrain) ? [region.rotation] : [];
  if (!REGION_TEMPLATES.some(template => template.id === region.templateId)) return [0];
  return profileOf(state, region, cache).filter(entry => enters(entry.terrains[index]!)).map(entry => entry.rotation);
}

export interface FrontierPlan {
  region: AlphaState['regions'][number];
  entry: HexId;
  mode: FrontierMode;
  rotations: number[];
  rotation: number;
  discoverer: Discoverer;
  units: AlphaUnit[];
}
/**
 * Validates a MOVE that enters the unknown and returns what it will do. Throws the player-facing refusal otherwise. Used when queuing the Order and again when it
 * resolves, so a plan made against the fog is re-checked against the table as it is then.
 */
export function planFrontierMove(state: AlphaState, actor: PlayerId, order: Extract<StrategicOrder, { type: 'MOVE' }>): FrontierPlan {
  const region = frontierRegionOf(state, actor, order);
  if (!region) throw new Error('Este movimento não entra numa Região fechada.');
  if (new Set(order.unitIds).size !== order.unitIds.length) throw new Error('Não repita peças na mesma ordem.');
  const units = order.unitIds.map(id => state.units.find(candidate => candidate.id === id && candidate.ownerId === actor));
  if (units.some(unit => !unit)) throw new Error('A ordem contém uma peça que não pertence a você.');
  const group = units as AlphaUnit[];
  if (group.some(isCarried)) throw new Error('Peça embarcada: desembarque ou ataque a partir da frota.');
  const mode = frontierMode(state, group);
  if (!mode) throw new Error('Terra e mar não descobrem juntos: mova as peças em ordens separadas.');
  const discoverer = discovererOf(state, actor, group);
  if (!discoverer) throw new Error(mode === 'LAND' ? FRONTIER_NEEDS_PIONEER : 'Necessita de um Pioneiro embarcado ou de Navegação Oceânica para descobrir.');
  if (new Set(group.map(unit => unit.hexId)).size !== 1) throw new Error('Para descobrir juntas, as peças precisam partir do mesmo hex.');
  const entry = order.path.at(-1) as HexId;
  const known = order.path.slice(0, -1), progress = state.players.find(player => player.playerId === actor)!;
  let current = tileOf(state, group[0]!.hexId)!;
  for (const id of known) {
    const tile = tileOf(state, id);
    if (!tile || !progress.knownHexIds.includes(id) || hexDistance(current, tile) !== 1 || !group.every(unit => canEnter(state, unit, id))) throw new Error('Caminho deve cruzar hexes conhecidos, adjacentes e compatíveis com a peça.');
    if (!movementOpen(state, actor, tile.ownerId) || enemyCityAt(state, actor, id) || state.units.some(other => other.hexId === id && other.ownerId !== actor) || state.threats.some(threat => threat.hexId === id)) throw new Error('Fronteira fechada, cidade inimiga, ameaça do mundo ou presença de outra civilização: use uma ordem de conflito.');
    current = tile;
  }
  const entryTile = tileOf(state, entry);
  if (!entryTile || hexDistance(current, entryTile) !== 1) throw new Error('A entrada deve ficar ao lado do último hex conhecido do caminho.');
  for (const unit of group) {
    const spent = known.reduce((total, id) => total + stepCost(state, unit, tileOf(state, id)!), 0) + kitFrontierCost(state, unit, state.rules.movementCosts.UNKNOWN);
    if (spent > budgetOf(state, actor, unit)) throw new Error('Caminho excede a mobilidade da peça: entrar no desconhecido custa 1 de movimento e é o último passo.');
  }
  const rotations = entryRotations(state, region, entry, mode);
  if (!rotations.length) throw new Error(frontierBlockText(mode));
  if (rotations.length > 1 && (order.rotation === undefined || !rotations.includes(order.rotation))) throw new Error('Escolha uma orientação que dê acesso à Região.');
  const crowded = stackBlock(state, actor, group, entry);
  if (crowded) throw new Error(crowded);
  return { region, entry, mode, rotations, rotation: rotations.length === 1 ? rotations[0]! : order.rotation!, discoverer, units: group };
}

/** Resolves a validated frontier MOVE on `state` (a candidate copy): flips the Region, resolves its Discovery once, lands the group on the entry hex. */
export function resolveFrontierMove(state: AlphaState, actor: PlayerId, order: Extract<StrategicOrder, { type: 'MOVE' }>): { plan: FrontierPlan; entered: boolean; lost: string[] } {
  const plan = planFrontierMove(state, actor, order);
  revealRegion(state, actor, plan.region, plan.rotation);
  // A hidden Ameaça on the entry hex keeps the group at the border: the Region is open, the group is not in it.
  const entered = !state.threats.some(threat => threat.hexId === plan.entry);
  if (entered) for (const unit of state.units.filter(candidate => order.unitIds.includes(candidate.id))) unit.hexId = plan.entry;
  settleCargo(state);
  applyDiscovery(state, actor, state.regions.find(candidate => candidate.id === plan.region.id)!, plan.discoverer.id);
  settleCargo(state);
  // Pieces of the group the Discovery took (Perigo): the caller words the result and the table events already say why.
  return { plan, entered, lost: order.unitIds.filter(id => !state.units.some(unit => unit.id === id)) };
}
