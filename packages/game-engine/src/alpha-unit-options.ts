import { unitMovement } from './alpha-grades.js';
import type { AlphaState, AlphaUnit, PlayerId } from '@aoh/game-domain';
import { hexDistance, hexNeighbors, hexId } from './hex.js';
import { canEnter } from './alpha-military.js';
import { enemyCityAt, movementOpen } from './alpha-diplomacy.js';
import { institutionBonus } from './alpha-institutions.js';
import { stackBlock } from './alpha-stack.js';
import { settleWithPioneer } from './alpha-cities.js';
import { applyCommand } from './engine.js';
import { alphaCanAfford } from './alpha-resources.js';
import { disembarkBlock, embarkBlock, isCarried, isCarrierKind } from './alpha-naval.js';
import { kitExplorationReach, kitMovement } from './alpha-kits.js';

export interface AlphaUnitOptions {
  /** Cheapest legal MOVE path (origin excluded) to every hex the piece can reach this round. */
  moves: Record<string, string[]>;
  /** Adjacent regions the player has not explored yet: the order target plus every hex of the region (geometry is public). */
  explore: { target: string; hexIds: string[] }[];
  /** Pioneers only: null when founding here is allowed, otherwise the refusal the server would give. */
  settleBlock: string | null;
  /** Land pieces: own fleets on this hex or next to it that can take this piece now. */
  embark: string[];
  /** Carried pieces: land hexes they can step onto from their fleet now. */
  disembark: string[];
}

/**
 * What each own piece can do this round, computed with the validators' own rules (known hexes, terrain, roads, borders,
 * foreign presence, institution movement bonus, stack limits), so the client can offer targets instead of asking the
 * player to click a path hex by hex. The server still validates every order.
 */
export function alphaUnitOptions(state: AlphaState, actor: PlayerId): Record<string, AlphaUnitOptions> {
  const progress = state.players.find(player => player.playerId === actor);
  if (!progress) return {};
  const byId = new Map(state.core.map.map(tile => [tile.id, tile]));
  const known = new Set(progress.knownHexIds);
  const options: Record<string, AlphaUnitOptions> = {};
  for (const unit of state.units.filter(candidate => candidate.ownerId === actor)) {
    const carried = isCarried(unit);
    const embark = carried || state.rules.units[unit.kind].domain !== 'LAND' ? [] : state.units.filter(fleet => isCarrierKind(state, fleet.kind) && fleet.ownerId === actor && embarkBlock(state, actor, [unit.id], fleet.id) === null).map(fleet => fleet.id).sort();
    const disembark = carried ? hexNeighbors(byId.get(unit.hexId)!).map(hexId).filter(id => disembarkBlock(state, actor, [unit.id], id) === null).sort() : [];
    options[unit.id] = { moves: carried ? {} : reachable(state, actor, unit, byId, known), explore: carried ? [] : explorable(state, actor, unit, byId), settleBlock: unit.kind === 'PIONEER' ? settleBlock(state, actor, unit) : 'Somente Pioneiros fundam cidades.', embark, disembark };
  }
  return options;
}

function reachable(state: AlphaState, actor: PlayerId, unit: AlphaUnit, byId: Map<string, AlphaState['core']['map'][number]>, known: Set<string>): Record<string, string[]> {
  const budget = unitMovement(state, unit) + institutionBonus(state, actor, 'MOVEMENT') + kitMovement(state, actor, unit.kind);
  const land = state.rules.units[unit.kind].domain === 'LAND';
  const best = new Map<string, { cost: number; path: string[] }>([[unit.hexId, { cost: 0, path: [] }]]);
  const queue = [unit.hexId as string];
  while (queue.length) {
    queue.sort((a, b) => best.get(a)!.cost - best.get(b)!.cost || a.localeCompare(b));
    const id = queue.shift()!, node = best.get(id)!, current = byId.get(id)!;
    for (const point of hexNeighbors(current)) {
      const nextId = hexId(point), tile = byId.get(nextId);
      if (!tile || !known.has(nextId) || !canEnter(state, unit, tile.id)) continue;
      if (!movementOpen(state, actor, tile.ownerId) || enemyCityAt(state, actor, nextId) || state.units.some(other => other.hexId === nextId && other.ownerId !== actor)) continue;
      const cost = node.cost + (state.roads.includes(tile.id) && land ? 1 : state.rules.movementCosts[tile.terrain]);
      if (cost > budget || cost >= (best.get(nextId)?.cost ?? Infinity)) continue;
      best.set(nextId, { cost, path: [...node.path, nextId] });
      queue.push(nextId);
    }
  }
  const moves: Record<string, string[]> = {};
  for (const [id, node] of [...best.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (id !== unit.hexId && stackBlock(state, actor, [unit], id) === null) moves[id] = node.path;
  }
  return moves;
}

function explorable(state: AlphaState, actor: PlayerId, unit: AlphaUnit, byId: Map<string, AlphaState['core']['map'][number]>): AlphaUnitOptions['explore'] {
  const origin = byId.get(unit.hexId)!;
  return state.regions.filter(region => !region.revealedBy.includes(actor)).flatMap(region => {
    const near = region.hexIds.map(id => byId.get(id)!).filter(tile => tile && hexDistance(origin, tile) <= kitExplorationReach(state, unit)).sort((a, b) => hexDistance(origin, a) - hexDistance(origin, b) || a.id.localeCompare(b.id));
    return near[0] ? [{ target: near[0].id, hexIds: [...region.hexIds] }] : [];
  }).sort((a, b) => a.target.localeCompare(b.target));
}

/** Dry run on a copy: founding has several rules (spacing, terrain, cost) and only the real action knows all of them. */
function settleBlock(state: AlphaState, actor: PlayerId, unit: AlphaUnit): string | null {
  try { settleWithPioneer(structuredClone(state), actor, unit.id, 'Prévia'); return null; }
  catch (error) { return error instanceof Error ? error.message : 'Fundação indisponível.'; }
}

/**
 * Hexes each own city can claim now, by dry-running the shared CLAIM_HEX rule (radius, free land, connection, cost) with
 * a payment that only checks the seven-resource pool. Occupied cities are left out: their territory is frozen.
 */
export function alphaClaimOptions(state: AlphaState, actor: PlayerId): Record<string, string[]> {
  const player = state.core.players.find(candidate => candidate.id === actor);
  if (!player) return {};
  const options: Record<string, string[]> = {};
  const free = state.core.map.filter(tile => tile.ownerId === null && tile.terrain !== 'SEA' && tile.terrain !== 'UNKNOWN');
  for (const city of player.civilization.cities) {
    if (state.occupations.some(occupation => occupation.cityId === city.id)) continue;
    const center = state.core.map.find(tile => tile.id === city.hexId)!, radius = state.core.config.territory.cityRadii[city.development - 1] ?? 0;
    options[city.id] = free.filter(tile => hexDistance(center, tile) <= radius).filter(tile => applyCommand(state.core, { type: 'CLAIM_HEX', playerId: actor, cityId: city.id, hexId: tile.id, expectedVersion: state.core.version }, (_, cost) => alphaCanAfford(state, actor, cost)).ok).map(tile => tile.id).sort();
  }
  return options;
}
