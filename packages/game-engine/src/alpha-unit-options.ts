import type { AlphaState, AlphaUnit, PlayerId } from '@aoh/game-domain';
import { hexDistance, hexNeighbors, hexId } from './hex.js';
import { canEnter } from './alpha-military.js';
import { bordersOpen } from './alpha-diplomacy.js';
import { institutionBonus } from './alpha-institutions.js';
import { stackBlock } from './alpha-stack.js';
import { settleWithPioneer } from './alpha-cities.js';

export interface AlphaUnitOptions {
  /** Cheapest legal MOVE path (origin excluded) to every hex the piece can reach this round. */
  moves: Record<string, string[]>;
  /** Adjacent regions the player has not explored yet: the order target plus every hex of the region (geometry is public). */
  explore: { target: string; hexIds: string[] }[];
  /** Pioneers only: null when founding here is allowed, otherwise the refusal the server would give. */
  settleBlock: string | null;
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
    options[unit.id] = { moves: reachable(state, actor, unit, byId, known), explore: explorable(state, actor, unit, byId), settleBlock: unit.kind === 'PIONEER' ? settleBlock(state, actor, unit) : 'Somente Pioneiros fundam cidades.' };
  }
  return options;
}

function reachable(state: AlphaState, actor: PlayerId, unit: AlphaUnit, byId: Map<string, AlphaState['core']['map'][number]>, known: Set<string>): Record<string, string[]> {
  const budget = state.rules.units[unit.kind].movement + institutionBonus(state, actor, 'MOVEMENT');
  const land = state.rules.units[unit.kind].domain === 'LAND';
  const best = new Map<string, { cost: number; path: string[] }>([[unit.hexId, { cost: 0, path: [] }]]);
  const queue = [unit.hexId as string];
  while (queue.length) {
    queue.sort((a, b) => best.get(a)!.cost - best.get(b)!.cost || a.localeCompare(b));
    const id = queue.shift()!, node = best.get(id)!, current = byId.get(id)!;
    for (const point of hexNeighbors(current)) {
      const nextId = hexId(point), tile = byId.get(nextId);
      if (!tile || !known.has(nextId) || !canEnter(state, unit, tile.id)) continue;
      if (!bordersOpen(state, actor, tile.ownerId) || state.units.some(other => other.hexId === nextId && other.ownerId !== actor)) continue;
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
    const near = region.hexIds.map(id => byId.get(id)!).filter(tile => tile && hexDistance(origin, tile) <= 1).sort((a, b) => hexDistance(origin, a) - hexDistance(origin, b) || a.id.localeCompare(b.id));
    return near[0] ? [{ target: near[0].id, hexIds: [...region.hexIds] }] : [];
  }).sort((a, b) => a.target.localeCompare(b.target));
}

/** Dry run on a copy: founding has several rules (spacing, terrain, cost) and only the real action knows all of them. */
function settleBlock(state: AlphaState, actor: PlayerId, unit: AlphaUnit): string | null {
  try { settleWithPioneer(structuredClone(state), actor, unit.id, 'Prévia'); return null; }
  catch (error) { return error instanceof Error ? error.message : 'Fundação indisponível.'; }
}
