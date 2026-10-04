import { describe, expect, it } from 'vitest';
import { PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import { alphaUnitOptions, applyAlphaCommand, beginAlphaPlanning, createAlphaGame, hexDistance, hexId, hexNeighbors } from '@aoh/game-engine';

const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');

/** p2's capital ringed by its own claimed hexes, p1 infantry two hexes away, both at war (GR-29). */
function ringedCapital(): { state: AlphaState; ring: string[]; target: string; start: string } {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'war-access', seed: 8, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));
  const capital = state.core.players[1]!.civilization.cities[0]!, center = state.core.map.find(t => t.id === capital.hexId)!;
  const ring = hexNeighbors(center).map(hexId).filter(id => state.core.map.some(t => t.id === id && !['SEA', 'UNKNOWN'].includes(t.terrain)));
  for (const id of ring) { const tile = state.core.map.find(t => t.id === id)!; tile.ownerId = p2; tile.controllerCityId = capital.id; }
  const start = state.core.map.filter(t => hexDistance(t, center) === 2 && !['SEA', 'UNKNOWN'].includes(t.terrain) && t.ownerId !== p2 && hexNeighbors(t).map(hexId).some(n => ring.includes(n))).sort((a, b) => a.id.localeCompare(b.id))[0]!;
  state.units = state.units.filter(unit => unit.ownerId !== p2 || unit.hexId !== start.id);
  state.units.push({ id: 'raider', ownerId: p1, kind: 'INFANTRY', hexId: start.id, recruitedRound: 1, carrierId: null });
  const p1Progress = state.players[0]!;
  p1Progress.knownHexIds = [...new Set([...p1Progress.knownHexIds, ...ring, capital.hexId, start.id])].sort() as never;
  state.wars.push(['p1', 'p2'] as never);
  return { state, ring, target: capital.hexId, start: start.id };
}

describe('war opens the enemy territory to movement (GR-29)', () => {
  it('lets an army at war walk into enemy-held land next to the city', () => {
    const { state, ring } = ringedCapital();
    const moves = Object.keys(alphaUnitOptions(state, p1)['raider']!.moves);
    expect(moves.some(id => ring.includes(id))).toBe(true);
  });
  it('still forbids walking into the enemy city itself: entering a city is always an attack', () => {
    const { state, target } = ringedCapital();
    const raider = state.units.find(unit => unit.id === 'raider')!;
    raider.hexId = (hexNeighbors(state.core.map.find(t => t.id === target)!).map(hexId).find(id => state.core.map.some(t => t.id === id && t.ownerId === p2)))! as never;
    expect(Object.keys(alphaUnitOptions(state, p1)['raider']!.moves)).not.toContain(target);
    const attack = applyAlphaCommand(state, p1, { type: 'QUEUE_ORDER', expectedVersion: state.version, order: { id: 'storm', type: 'ATTACK', unitIds: ['raider'], target, posture: 'ASSAULT' } });
    expect(attack.ok).toBe(true);
  });
  it('keeps borders closed in peace without a treaty', () => {
    const { state, ring } = ringedCapital();
    state.wars = [];
    expect(Object.keys(alphaUnitOptions(state, p1)['raider']!.moves).some(id => ring.includes(id))).toBe(false);
  });
});
