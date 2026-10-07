import { unitMovement } from './alpha-grades.js';
import type { AlphaState, AlphaUnit, PlayerId } from '@aoh/game-domain';
import { regionOpenFor } from './alpha-world.js';
import { discovererOf, entryRotations, frontierBlockText, frontierMode, newFrontierCache, FRONTIER_NEEDS_PIONEER, type FrontierCache } from './alpha-frontier.js';
import { hexDistance, hexNeighbors, hexId } from './hex.js';
import { canEnter } from './alpha-military.js';
import { enemyCityAt, movementOpen } from './alpha-diplomacy.js';
import { institutionBonus } from './alpha-institutions.js';
import { stackBlock } from './alpha-stack.js';
import { settleWithPioneer } from './alpha-cities.js';
import { applyCommand } from './engine.js';
import { alphaCanAfford } from './alpha-resources.js';
import { disembarkBlock, embarkBlock, isCarried, isCarrierKind } from './alpha-naval.js';
import { kitFrontierCost, kitMovement } from './alpha-kits.js';

export interface AlphaUnitOptions {
  /** Cheapest legal MOVE path (origin excluded) to every hex the piece can reach this round. */
  moves: Record<string, string[]>;
  /** MOVE budget of the piece this round (terrain costs, roads and bonuses already priced into `moves`): a group walks the path of its slowest piece. */
  movement: number;
  /**
   * Moving into the unknown (Move + Discovery). Closed Regions this piece can enter as the LAST step of a MOVE: each entry is a hex of the Region next to a hex it
   * can reach with at least the UNKNOWN cost left, with the cheapest path to it (entry included) and the orientations that give it a way in (one: applied
   * automatically; several: the player chooses). `block` is set when no entry has an orientation ("Requer acesso naval.").
   */
  frontier: { regionId: string; hexIds: string[]; entries: { hexId: string; path: string[]; rotations: number[] }[]; block: string | null }[];
  /** True when this piece can lead a Discovery by itself or as part of a group (Pioneiro; ship with a Pioneiro aboard; any ship after Navegação Oceânica). */
  discoverer: boolean;
  /** Why a closed Region next to the piece cannot be entered yet ("Necessita de um Pioneiro para descobrir."), or null. */
  frontierNote: string | null;
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
  const options: Record<string, AlphaUnitOptions> = {}, cache = newFrontierCache();
  for (const unit of state.units.filter(candidate => candidate.ownerId === actor)) {
    const carried = isCarried(unit);
    const embark = carried || state.rules.units[unit.kind].domain !== 'LAND' ? [] : state.units.filter(fleet => isCarrierKind(state, fleet.kind) && fleet.ownerId === actor && embarkBlock(state, actor, [unit.id], fleet.id) === null).map(fleet => fleet.id).sort();
    const disembark = carried ? hexNeighbors(byId.get(unit.hexId)!).map(hexId).filter(id => disembarkBlock(state, actor, [unit.id], id) === null).sort() : [];
    const walk = carried ? null : reachable(state, actor, unit, byId, known);
    options[unit.id] = { moves: walk?.moves ?? {}, movement: walk?.budget ?? 0, ...(walk ? frontierOf(state, actor, unit, byId, walk, cache) : { frontier: [], discoverer: false, frontierNote: null }), settleBlock: unit.kind === 'PIONEER' ? settleBlock(state, actor, unit) : 'Somente Pioneiros fundam cidades.', embark, disembark };
  }
  return options;
}

interface Walk { moves: Record<string, string[]>; best: Map<string, { cost: number; path: string[] }>; budget: number }
function reachable(state: AlphaState, actor: PlayerId, unit: AlphaUnit, byId: Map<string, AlphaState['core']['map'][number]>, known: Set<string>): Walk {
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
  return { moves, best, budget };
}

function frontierOf(state: AlphaState, actor: PlayerId, unit: AlphaUnit, byId: Map<string, AlphaState['core']['map'][number]>, walk: Walk, cache: FrontierCache): Pick<AlphaUnitOptions, 'frontier' | 'discoverer' | 'frontierNote'> {
  const mode = frontierMode(state, [unit]);
  if (!mode) return { frontier: [], discoverer: false, frontierNote: null };
  // A ship's own answer counts the Pioneiro it carries; a land piece answers for itself (the group decides on the client by combining its pieces).
  const discoverer = discovererOf(state, actor, [unit]) !== null;
  const cost = kitFrontierCost(state, unit, state.rules.movementCosts.UNKNOWN);
  const closed = state.regions.filter(region => !regionOpenFor(state, region, actor));
  const frontier = closed.flatMap(region => {
    const entries = region.hexIds.flatMap(id => {
      const tile = byId.get(id);
      if (!tile) return [];
      let pick: { cost: number; path: string[] } | null = null;
      for (const point of hexNeighbors(tile)) {
        const from = walk.best.get(hexId(point));
        if (from && from.cost + cost <= walk.budget && (pick === null || from.cost < pick.cost || (from.cost === pick.cost && from.path.length < pick.path.length))) pick = from;
      }
      if (!pick) return [];
      return [{ hexId: id, path: [...pick.path, id], rotations: entryRotations(state, region, id, mode, cache) }];
    });
    if (!entries.length) return [];
    const open = entries.some(entry => entry.rotations.length > 0);
    return [{ regionId: region.id, hexIds: [...region.hexIds], entries: open ? entries.filter(entry => entry.rotations.length > 0) : entries, block: open ? null : frontierBlockText(mode) }];
  }).sort((a, b) => a.regionId.localeCompare(b.regionId));
  return { frontier, discoverer, frontierNote: !discoverer && frontier.length ? (mode === 'LAND' ? FRONTIER_NEEDS_PIONEER : 'Necessita de um Pioneiro embarcado ou de Navegação Oceânica para descobrir.') : null };
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
