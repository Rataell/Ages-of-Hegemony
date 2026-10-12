import type { AlphaState, AlphaUnit, HexId, PlayerId } from '@aoh/game-domain';
import { isNavigableTerrain, isNavigableWater } from './alpha-water.js';
import { hexDistance, hexId, hexNeighbors } from './hex.js';
import { atWar, enemyCityAt, movementOpen } from './alpha-diplomacy.js';
import { stackBlock } from './alpha-stack.js';
import { resolutionEvent } from './alpha-events.js';
import { unitTransport } from './alpha-grades.js';

/**
 * Naval vertical slice (DEC-014: naval is core for the Alpha). One generic Fleet class carries the slice:
 * - a city is a port when it stands on Coast or next to Coast/Sea; its fleets launch on an adjacent water hex;
 * - land pieces board an adjacent own fleet (EMBARK) and ride with it; they step off onto an adjacent land hex (DISEMBARK)
 *   or attack from the fleet with an amphibious penalty;
 * - a fleet sunk with cargo saves what the rescue conditions allow (another own fleet with room here, a free coast next to
 *   it), the rest is lost;
 * - an enemy fleet at war next to a port blockades it: no fleets launch there and its trade routes are suspended;
 * - rivals see the fleet, never its cargo.
 * The seven classes of the Bible atlas build on this once audited against the canon.
 */
const tileOf = (state: AlphaState, id: string) => state.core.map.find(tile => tile.id === id);
const neighbours = (state: AlphaState, id: string) => { const tile = tileOf(state, id); return tile ? hexNeighbors(tile).map(hexId).map(n => tileOf(state, n)).filter(t => t !== undefined) : []; };

export const isCarried = (unit: AlphaUnit) => unit.carrierId !== null && unit.carrierId !== undefined;
export const cargoOf = (state: AlphaState, fleetId: string) => state.units.filter(unit => unit.carrierId === fleetId);
export const cargoLoad = (state: AlphaState, fleetId: string) => cargoOf(state, fleetId).reduce((total, unit) => total + state.rules.units[unit.kind].cargo, 0);
/** Any own ship that offers transport slots. */
export const isCarrierKind = (state: AlphaState, kind: AlphaUnit['kind']) => state.rules.units[kind].domain === 'SEA' && state.rules.units[kind].transport > 0;
export const cargoRoom = (state: AlphaState, fleetId: string) => { const ship = state.units.find(unit => unit.id === fleetId); return ship ? Math.max(0, unitTransport(state, ship) - cargoLoad(state, fleetId)) : 0; };

/** A port: on Coast, or next to Coast or Sea. */
export function isPort(state: AlphaState, cityHexId: string): boolean {
  const tile = tileOf(state, cityHexId);
  return !!tile && (tile.terrain === 'COAST' || neighbours(state, cityHexId).some(n => isNavigableWater(n)));
}
/** An enemy (at war) fleet on the city's hex or on a water hex next to it. */
export function blockadedBy(state: AlphaState, cityHexId: string, ownerId: PlayerId): PlayerId | null {
  // Frota Abordagem (V5.1b): a won boarding keeps the port shut through the next round, even with no ship beside it.
  const city = state.core.players.flatMap(player => player.civilization.cities).find(candidate => candidate.hexId === cityHexId);
  const meta = city ? state.cities.find(candidate => candidate.cityId === city.id) : undefined;
  if (meta && meta.portBlockedUntil >= state.core.round && meta.portBlockedBy && meta.portBlockedBy !== ownerId && atWar(state, meta.portBlockedBy, ownerId)) return meta.portBlockedBy;
  const near = new Set([cityHexId, ...neighbours(state, cityHexId).filter(n => isNavigableTerrain(n.terrain)).map(n => n.id)]);
  // Only armed ships blockade (Força > 0): the Frota and the Barca de Patrulha.
  const armed = state.units.filter(unit => state.rules.units[unit.kind].domain === 'SEA' && state.rules.units[unit.kind].strength > 0 && unit.ownerId !== ownerId && near.has(unit.hexId) && atWar(state, unit.ownerId, ownerId));
  // Farol: the port is only blockaded by two or more armed ships of the same enemy. (A won boarding, checked above, still shuts it.)
  if (meta?.buildings.includes('LIGHTHOUSE')) { const counts = new Map<string, number>(); for (const unit of armed) counts.set(unit.ownerId, (counts.get(unit.ownerId) ?? 0) + 1); return armed.find(unit => (counts.get(unit.ownerId) ?? 0) >= 2)?.ownerId ?? null; }
  return armed[0]?.ownerId ?? null;
}
/** Where a fleet recruited in this port launches: the city hex if it is Coast, else the first adjacent water hex with room. */
export function launchHex(state: AlphaState, actor: PlayerId, cityHexId: string, kind: AlphaUnit['kind'] = 'FLEET'): HexId | null {
  const fleet: AlphaUnit = { id: 'launch-preview', ownerId: actor, kind, hexId: cityHexId as HexId, recruitedRound: Math.max(1, state.core.round), carrierId: null };
  const candidates = [tileOf(state, cityHexId)!, ...neighbours(state, cityHexId).sort((a, b) => Number(a.terrain !== 'COAST') - Number(b.terrain !== 'COAST') || a.id.localeCompare(b.id))]
    .filter(tile => isNavigableTerrain(tile.terrain) && !state.units.some(unit => unit.hexId === tile.id && unit.ownerId !== actor));
  return candidates.find(tile => stackBlock(state, actor, [{ ...fleet, hexId: tile.id }], tile.id) === null)?.id ?? null;
}
const ordered = (state: AlphaState, actor: PlayerId) => new Set(state.players.find(p => p.playerId === actor)!.orders.flatMap(order => 'unitIds' in order ? order.unitIds : 'unitId' in order ? [order.unitId] : []));

export function embarkBlock(state: AlphaState, actor: PlayerId, unitIds: readonly string[], fleetId: string): string | null {
  const fleet = state.units.find(unit => unit.id === fleetId && unit.ownerId === actor && isCarrierKind(state, unit.kind));
  if (!fleet) return 'Escolha um navio seu que transporte peças.';
  const units = unitIds.map(id => state.units.find(unit => unit.id === id && unit.ownerId === actor));
  if (units.some(unit => !unit) || new Set(unitIds).size !== unitIds.length) return 'Escolha peças suas, sem repetir.';
  const pieces = units as AlphaUnit[], busy = ordered(state, actor);
  if (pieces.some(unit => state.rules.units[unit.kind].domain !== 'LAND')) return 'Só peças terrestres embarcam.';
  if (pieces.some(isCarried)) return 'Uma das peças já está embarcada.';
  if (pieces.some(unit => busy.has(unit.id)) || busy.has(fleet.id) && pieces.length === 0) return 'Cancele as ordens dessas peças antes de embarcar.';
  if (pieces.some(unit => hexDistance(tileOf(state, unit.hexId)!, tileOf(state, fleet.hexId)!) > 1)) return 'As peças precisam estar no hex da frota ou ao lado dele.';
  const load = pieces.reduce((total, unit) => total + state.rules.units[unit.kind].cargo, 0);
  if (load > cargoRoom(state, fleet.id)) return `A frota tem ${cargoRoom(state, fleet.id)} vaga(s); estas peças ocupam ${load}.`;
  return null;
}
export function embark(state: AlphaState, actor: PlayerId, unitIds: readonly string[], fleetId: string): void {
  const blocked = embarkBlock(state, actor, unitIds, fleetId); if (blocked) throw new Error(blocked);
  const fleet = state.units.find(unit => unit.id === fleetId)!;
  for (const unit of state.units.filter(candidate => unitIds.includes(candidate.id))) { unit.carrierId = fleet.id; unit.hexId = fleet.hexId; }
}
export function disembarkBlock(state: AlphaState, actor: PlayerId, unitIds: readonly string[], target: string): string | null {
  const units = unitIds.map(id => state.units.find(unit => unit.id === id && unit.ownerId === actor));
  if (units.some(unit => !unit) || new Set(unitIds).size !== unitIds.length) return 'Escolha peças suas, sem repetir.';
  const pieces = units as AlphaUnit[];
  if (pieces.some(unit => !isCarried(unit))) return 'Só peças embarcadas desembarcam.';
  if (new Set(pieces.map(unit => unit.hexId)).size !== 1) return 'Desembarque peças de uma frota por vez.';
  const tile = tileOf(state, target), from = tileOf(state, pieces[0]!.hexId)!;
  if (!tile || tile.terrain === 'SEA' || tile.terrain === 'UNKNOWN') return 'Desembarque em terra (Costa ou interior).';
  if (hexDistance(from, tile) > 1) return 'O desembarque é no hex da frota ou ao lado dele.';
  if (!state.players.find(p => p.playerId === actor)!.knownHexIds.includes(tile.id)) return 'Desembarque num hex conhecido.';
  if (!movementOpen(state, actor, tile.ownerId) || enemyCityAt(state, actor, tile.id) || state.units.some(unit => unit.hexId === tile.id && unit.ownerId !== actor)) return 'Fronteira fechada, cidade inimiga ou presença de outra civilização: ataque a partir da frota.';
  return stackBlock(state, actor, pieces.map(unit => ({ ...unit, carrierId: null })), tile.id);
}
export function disembark(state: AlphaState, actor: PlayerId, unitIds: readonly string[], target: string): void {
  const blocked = disembarkBlock(state, actor, unitIds, target); if (blocked) throw new Error(blocked);
  for (const unit of state.units.filter(candidate => unitIds.includes(candidate.id))) { unit.carrierId = null; unit.hexId = target as HexId; }
}

/**
 * Keeps cargo with its fleet after movement and combat. A piece whose fleet sank is rescued by another own fleet with room on the same hex, then by one free
 * coast next to it (one piece); the rest is lost.
 */
export function settleCargo(state: AlphaState): void {
  for (const unit of state.units.filter(isCarried)) {
    const carrier = state.units.find(candidate => candidate.id === unit.carrierId);
    if (carrier) unit.hexId = carrier.hexId;
  }
  const orphans = state.units.filter(unit => isCarried(unit) && !state.units.some(candidate => candidate.id === unit.carrierId));
  const byHex = new Map<string, AlphaUnit[]>();
  for (const unit of orphans) byHex.set(unit.hexId, [...(byHex.get(unit.hexId) ?? []), unit]);
  const lost: string[] = [];
  for (const [hex, group] of byHex) {
    let shoreUsed = false;
    for (const unit of [...group].sort((a, b) => state.rules.units[b.kind].strength - state.rules.units[a.kind].strength || a.id.localeCompare(b.id))) {
      const rescue = state.units.find(f => isCarrierKind(state, f.kind) && f.ownerId === unit.ownerId && f.hexId === hex && cargoRoom(state, f.id) >= state.rules.units[unit.kind].cargo);
      if (rescue) { unit.carrierId = rescue.id; continue; }
      const shore = shoreUsed ? undefined : neighbours(state, hex).sort((a, b) => a.id.localeCompare(b.id)).find(tile => tile.terrain !== 'SEA' && tile.terrain !== 'UNKNOWN' && !state.units.some(other => other.hexId === tile.id && other.ownerId !== unit.ownerId) && stackBlock(state, unit.ownerId, [{ ...unit, carrierId: null }], tile.id) === null);
      if (shore) { unit.carrierId = null; unit.hexId = shore.id; shoreUsed = true; continue; }
      lost.push(unit.id);
    }
    if (group.length) resolutionEvent(state, { type: 'LOSSES', actorId: group[0]!.ownerId, visibleTo: [group[0]!.ownerId], message: `Naufrágio em ${hex}: ${group.length - group.filter(u => lost.includes(u.id)).length} de ${group.length} peça(s) embarcada(s) salva(s).`, hexId: hex as HexId, unitIds: group.map(u => u.id) });
  }
  if (lost.length) state.units = state.units.filter(unit => !lost.includes(unit.id));
}

/** A blockaded port cuts the trade routes that start or end in it. Runs after the routes are re-traced in maintenance. */
export function suspendBlockadedRoutes(state: AlphaState): void {
  const cities = state.core.players.flatMap(player => player.civilization.cities);
  for (const route of state.routes) {
    if (route.suspended) continue;
    const ends = [cities.find(city => city.id === route.fromCityId), cities.find(city => city.id === route.toCityId)];
    if (ends.some(city => city && isPort(state, city.hexId) && blockadedBy(state, city.hexId, city.ownerId) !== null)) route.suspended = true;
  }
}
