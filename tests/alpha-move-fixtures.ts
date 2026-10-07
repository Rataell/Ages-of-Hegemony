import { ADVANCEMENTS, type AlphaState, type AlphaUnit } from '@aoh/game-domain';
import { PlayerIdSchema } from '@aoh/game-domain';
import { alphaUnitOptions, applyAlphaCommand, beginAlphaPlanning, createAlphaGame, type AlphaUnitOptions } from '@aoh/game-engine';

/** Shared fixtures for the Move + Discovery tests: a closed Region next to a piece, on land or at sea. */
export const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
export type Preset = 'MIXED' | 'ARCHIPELAGO' | 'INLAND_SEA';
export const world = (seed: number, worldPreset: Preset = 'MIXED') => beginAlphaPlanning(createAlphaGame({ gameId: 'move-discovery', seed, preset: 'QUICK', worldPreset, mapSize: 'STANDARD', players: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] }));
export const tile = (state: AlphaState, id: string) => state.core.map.find(t => t.id === id)!;
export const known = (state: AlphaState, who = p1) => new Set<string>(state.players.find(p => p.playerId === who)!.knownHexIds);
export const pioneerOf = (state: AlphaState, who = p1) => state.units.find(u => u.ownerId === who && u.kind === 'PIONEER')!;
export const place = (unit: AlphaUnit, at: string) => { unit.hexId = at as never; };
export const queue = (state: AlphaState, order: Record<string, unknown>, who = p1) => applyAlphaCommand(state, who, { type: 'QUEUE_ORDER', expectedVersion: state.version, order } as never);
/** Researches an advancement with its whole prerequisite chain, the way a real match would have, so the state stays legal. */
export function learn(state: AlphaState, who: typeof p1, id: string) {
  const player = state.players.find(p => p.playerId === who)!, order: string[] = [];
  const visit = (node: string) => { if (order.includes(node)) return; const a = ADVANCEMENTS.find(x => x.id === node)!; [...a.prerequisites, ...a.prerequisitesAny.slice(0, 1)].forEach(visit); order.push(node); };
  visit(id);
  player.era = 'ASCENSION';
  for (const node of order) if (!player.research.includes(node)) player.research.push(node);
}
export const frontierOf = (state: AlphaState, unit: AlphaUnit, who = p1): AlphaUnitOptions['frontier'] => alphaUnitOptions(state, who)[unit.id]!.frontier;

/** A known land hex next to a closed Region the Pioneiro can enter on land, with the entry the options offer. */
export function landCase(seed: number, preset: Preset = 'MIXED') {
  const state = world(seed, preset), pioneer = pioneerOf(state), seen = known(state);
  for (const at of [...seen].sort()) {
    const t = tile(state, at);
    if (!['PLAINS', 'FOREST', 'HILLS'].includes(t.terrain) || state.units.some(u => u.hexId === at && u.id !== pioneer.id)) continue;
    place(pioneer, at);
    const open = frontierOf(state, pioneer).find(r => r.block === null && r.entries.some(e => e.path.length === 1));
    if (open) return { state, pioneer, at, region: open, entry: open.entries.find(e => e.path.length === 1)! };
  }
  return null;
}
export const anyLandCase = () => { for (const seed of [2, 5, 9, 13, 21, 34, 55, 89]) { const found = landCase(seed); if (found) return found; } throw new Error('no land frontier case'); };

/** A known water hex next to a closed Region that a ship can enter, in a water world. */
export function seaCase(kind: AlphaUnit['kind'] = 'FLEET') {
  for (const preset of ['ARCHIPELAGO', 'INLAND_SEA'] as const) for (const seed of [2, 5, 9, 13, 21, 34, 55, 89]) {
    const state = world(seed, preset), seen = known(state), city = state.core.players[0]!.civilization.cities[0]!;
    const ship: AlphaUnit = { id: `ship-${kind.toLowerCase().replace('_', '-')}`, ownerId: p1, kind, hexId: city.hexId, recruitedRound: 1, carrierId: null };
    state.units.push(ship);
    for (const at of [...seen].sort()) {
      if (!['SEA', 'COAST'].includes(tile(state, at).terrain) || state.units.some(u => u.hexId === at && u.id !== ship.id && u.ownerId !== p1)) continue;
      ship.hexId = at as never;
      const open = frontierOf(state, ship).find(r => r.block === null && r.entries.some(e => e.path.length === 1));
      if (open) return { state, ship, at, region: open, entry: open.entries.find(e => e.path.length === 1)! };
    }
  }
  return null;
}
export const SEAS = () => { const found = seaCase(); if (!found) throw new Error('no sea frontier case'); return found; };

