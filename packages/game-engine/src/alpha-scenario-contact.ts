import type { AlphaState, PlayerId } from '@aoh/game-domain';
import { hexDistance, hexNeighbors, hexId } from './hex.js';
import { alphaEvent } from './alpha-events.js';
import { refreshKnowledge } from './alpha-world.js';

export interface ForcedContact { seats: [PlayerId, PlayerId]; scouts: [string, string]; hexes: [string, string]; openedRegion: string | null }

/**
 * Test scenario (never used by a normal game): sets up a legal Contact between the two seats whose Pátrias are closest, by placing one
 * Pioneiro of each on adjacent hexes. Contact is NOT written: `refreshKnowledge` applies the real proximity rule and either produces it or
 * this throws. The two Pátrias are 3 hexes apart with a frontier Region between them, so that Region is opened (publicly, like any
 * explored Region) to make the meeting place a hex the table can see.
 */
export function forceContactSetup(state: AlphaState): ForcedContact {
  const tiles = new Map(state.core.map.map(tile => [tile.id as string, tile]));
  const homes = state.regions.filter(region => region.revealedBy.length > 0);
  const land = (id: string) => { const tile = tiles.get(id); return tile !== undefined && !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(tile.terrain); };
  let best: { d: number; a: PlayerId; b: PlayerId; ha: string; hb: string } | null = null;
  for (let i = 0; i < homes.length; i++) for (let j = i + 1; j < homes.length; j++) {
    for (const ha of homes[i]!.hexIds) for (const hb of homes[j]!.hexIds) {
      if (!land(ha) || !land(hb)) continue;
      const d = hexDistance(tiles.get(ha)!, tiles.get(hb)!);
      if (!best || d < best.d || (d === best.d && (ha + hb) < (best.ha + best.hb))) best = { d, a: homes[i]!.revealedBy[0]!, b: homes[j]!.revealedBy[0]!, ha, hb };
    }
  }
  if (!best) throw new Error('forceContactSetup: no pair of Pátrias with land hexes.');
  const stand = (owner: PlayerId) => state.units.filter(unit => unit.ownerId === owner && unit.kind === 'PIONEER').sort((x, y) => x.id.localeCompare(y.id)).at(-1);
  const scoutA = stand(best.a), scoutB = stand(best.b);
  if (!scoutA || !scoutB) throw new Error('forceContactSetup: each seat needs a Pioneiro.');
  // Seat B's scout stands on the neighbour of A's hex that is closest to B's Pátria.
  const free = (id: string) => land(id) && !state.units.some(unit => unit.hexId === id && unit.ownerId !== best!.b && unit.id !== scoutB.id) && (tiles.get(id)!.ownerId === null || tiles.get(id)!.ownerId === best!.b || tiles.get(id)!.ownerId === best!.a);
  const meet = hexNeighbors(tiles.get(best.ha)!).map(hexId).filter(id => tiles.has(id) && free(id))
    .sort((x, y) => hexDistance(tiles.get(x)!, tiles.get(best!.hb)!) - hexDistance(tiles.get(y)!, tiles.get(best!.hb)!) || x.localeCompare(y))[0];
  if (!meet) throw new Error('forceContactSetup: no free hex next to the meeting point.');
  const region = state.regions.find(candidate => candidate.hexIds.includes(meet)) ?? null;
  let opened: string | null = null;
  if (region && region.revealedBy.length === 0) { region.revealedBy.push(best.a); opened = region.id; }
  scoutA.hexId = best.ha as never; scoutB.hexId = meet as never;
  refreshKnowledge(state);
  const seatA = state.players.find(player => player.playerId === best!.a)!, seatB = state.players.find(player => player.playerId === best!.b)!;
  if (!seatA.contacts.includes(best.b) || !seatB.contacts.includes(best.a)) throw new Error('forceContactSetup: the real Contact rule did not fire for the placed pieces.');
  alphaEvent(state, 'SCENARIO', 'Cenário de teste: contato forçado. Dois Pioneiros estão frente a frente; o Contato veio da regra normal de proximidade.', null);
  return { seats: [best.a, best.b], scouts: [scoutA.id, scoutB.id], hexes: [best.ha, meet], openedRegion: opened };
}
