import { describe, expect, it } from 'vitest';
import { CIVILIZATIONS, PlayerIdSchema, REGION_TEMPLATES } from '@aoh/game-domain';
import { alphaUnitOptions, beginAlphaPlanning, createAlphaGame, exploreRegion, hexDistance, hexId, hexNeighbors, orderMessage, settleWithPioneer, urbanActionMessage, validateExploration, validateMilitaryOrder } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';

function setup(count = 2, seed = 23) {
  return beginAlphaPlanning(createAlphaGame({ gameId: `options-${count}-${seed}`, seed, preset: 'QUICK', players: Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `Pessoa ${i + 1}` })) }));
}
/** Every hex a piece could step onto, so options can be checked against the validator in both directions. */
function knownNeighbourhood(state: ReturnType<typeof setup>, actor: string, origin: string, radius: number) {
  const known = new Set(state.players.find(player => player.playerId === actor)!.knownHexIds), center = state.core.map.find(tile => tile.id === origin)!;
  return state.core.map.filter(tile => tile.id !== origin && known.has(tile.id) && hexDistance(tile, center) <= radius);
}

describe('per-piece order options', () => {
  it.each([[2, 23], [4, 42], [6, 7]])('offers exactly the MOVE destinations the validator accepts (%i players, seed %i)', (count, seed) => {
    const state = setup(count, seed);
    for (const progress of state.players) {
      const options = alphaUnitOptions(state, progress.playerId);
      for (const unit of state.units.filter(candidate => candidate.ownerId === progress.playerId)) {
        const moves = options[unit.id]!.moves;
        for (const [target, path] of Object.entries(moves)) {
          expect(path.at(-1)).toBe(target);
          expect(() => validateMilitaryOrder(state, progress.playerId, { id: 'probe', type: 'MOVE', unitIds: [unit.id], path: path as never })).not.toThrow();
        }
        // Any one-step move the validator accepts must be offered.
        for (const tile of knownNeighbourhood(state, progress.playerId, unit.hexId, 1)) {
          let accepted = true;
          try { validateMilitaryOrder(state, progress.playerId, { id: 'probe', type: 'MOVE', unitIds: [unit.id], path: [tile.id] }); } catch { accepted = false; }
          expect(tile.id in moves, `${unit.id} -> ${tile.id}`).toBe(accepted);
        }
      }
    }
  });

  it('offers exploration only for adjacent unexplored regions, and every offer validates', () => {
    const state = setup();
    const actor = state.players[0]!.playerId, unit = state.units.find(candidate => candidate.ownerId === actor)!;
    // Step the pioneer to the edge of its homeland so a neighbouring region is in reach.
    const edge = Object.keys(alphaUnitOptions(state, actor)[unit.id]!.moves)[0]!;
    unit.hexId = edge as never;
    const offers = alphaUnitOptions(state, actor)[unit.id]!.explore;
    expect(offers.length).toBeGreaterThan(0);
    for (const offer of offers) {
      expect(offer.hexIds).toContain(offer.target);
      expect(() => validateExploration(state, actor, { id: 'probe', type: 'EXPLORE', unitId: unit.id, target: offer.target as never, rotation: 0 })).not.toThrow();
    }
    const revealed = new Set(state.regions.filter(region => region.revealedBy.includes(actor)).flatMap(region => region.hexIds));
    expect(offers.every(offer => !revealed.has(offer.target as never))).toBe(true);
  });

  it('reports founding blocks exactly as the action does, in Portuguese', () => {
    const state = setup(), actor = state.players[0]!.playerId, pioneer = state.units.find(unit => unit.ownerId === actor && unit.kind === 'PIONEER')!;
    const atCapital = alphaUnitOptions(state, actor)[pioneer.id]!.settleBlock;
    expect(atCapital).toMatch(/^Funde em terra firme/);
    expect(() => settleWithPioneer(structuredClone(state), actor, pioneer.id, 'Teste')).toThrow(atCapital!);
    const far = state.core.map.find(tile => ['PLAINS', 'HILLS', 'FOREST'].includes(tile.terrain) && tile.ownerId === null && state.core.players.every(player => player.civilization.cities.every(city => hexDistance(tile, state.core.map.find(t => t.id === city.hexId)!) >= 4)))!;
    pioneer.hexId = far.id;
    expect(alphaUnitOptions(state, actor)[pioneer.id]!.settleBlock).toBeNull();
    const infantry = { ...pioneer, id: 'probe-infantry', kind: 'INFANTRY' as const };
    state.units.push(infantry);
    expect(alphaUnitOptions(state, actor)['probe-infantry']!.settleBlock).toBe('Somente Pioneiros fundam cidades.');
  });

  it('projects options and warehouse limits only for the viewer', () => {
    const state = setup(), view = alphaPlayerView(state, PlayerIdSchema.parse('p1'))!;
    expect(Object.keys(view.unitOptions).every(id => state.units.find(unit => unit.id === id)?.ownerId === 'p1')).toBe(true);
    expect(view.storage.foodCapacity).toBeGreaterThan(0);
    expect(view.storage).toHaveProperty('metalCapacity');
  });
});

describe('region orientation', () => {
  it('lets only the first explorer orient a region; a later explorer uses the fixed orientation without rewriting terrain', () => {
    const state = setup();
    const [a, b] = state.players.map(player => player.playerId) as unknown as [string, string];
    const region = state.regions.find(candidate => candidate.revealedBy.length === 0 && candidate.hexIds.every(id => state.core.map.find(tile => tile.id === id)!.ownerId === null))!;
    const center = state.core.map.find(tile => tile.id === region.hexIds[0])!;
    const outside = hexNeighbors(hexNeighbors(center)[0]!).map(hexId).find(id => !region.hexIds.includes(id as never) && state.core.map.some(tile => tile.id === id))!;
    const unitA = state.units.find(unit => unit.ownerId === a)!, unitB = state.units.find(unit => unit.ownerId === b)!;
    unitA.hexId = outside as never; unitB.hexId = outside as never;
    exploreRegion(state, a as never, { id: 'e1', type: 'EXPLORE', unitId: unitA.id, target: region.hexIds[0]!, rotation: 0 });
    const terrain = region.hexIds.map(id => state.core.map.find(tile => tile.id === id)!.terrain);
    // Same round, different requested orientation: previously refused, now resolved with the fixed orientation.
    expect(() => exploreRegion(state, b as never, { id: 'e2', type: 'EXPLORE', unitId: unitB.id, target: region.hexIds[0]!, rotation: 5 })).not.toThrow();
    expect(state.regions.find(candidate => candidate.id === region.id)!.rotation).toBe(0);
    expect(state.regions.find(candidate => candidate.id === region.id)!.revealedBy).toEqual([a, b]);
    expect(region.hexIds.map(id => state.core.map.find(tile => tile.id === id)!.terrain)).toEqual(terrain);
    expect(REGION_TEMPLATES.some(template => template.id === region.templateId)).toBe(true);
  });
});

describe('names players read', () => {
  it('names each capital after its civilization, not after the player', () => {
    const state = beginAlphaPlanning(createAlphaGame({ gameId: 'capitals', seed: 3, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana', civilization: 'meridia' }, { id: 'p2', name: 'Beto', civilization: 'kor' }] }));
    expect(state.core.players.map(player => player.civilization.cities[0]!.name)).toEqual(['Porto das Margens', 'Forja de Kor']);
    expect(new Set(CIVILIZATIONS.map(civ => civ.capital)).size).toBe(CIVILIZATIONS.length);
  });

  it('describes resolution results without command identifiers', () => {
    const before = setup(), after = structuredClone(before), actor = before.players[0]!.playerId;
    after.players[0]!.resources.food += 2; after.players[0]!.resources.knowledge += 1;
    const produce = urbanActionMessage(before, after, actor, { id: 'a', type: 'URBAN_ACTION', cityId: before.core.players[0]!.civilization.cities[0]!.id, action: 'PRODUCE' }, 'Celeiro Áureo');
    expect(produce).toBe('Celeiro Áureo produziu +2 Alimento, +1 Conhecimento.');
    const unit = before.units.find(candidate => candidate.ownerId === actor)!;
    const move = orderMessage(before, actor, { id: 'm', type: 'MOVE', unitIds: [unit.id], path: [unit.hexId] });
    expect(move).toBe(`Pessoa 1: Pioneiro moveu-se para ${unit.hexId}.`);
    expect(`${produce} ${move}`).not.toMatch(/\b[A-Z]{4,}(_[A-Z]+)*\b/);
  });
});

describe('withdrawing READY', () => {
  it('lets a player take back READY while someone is still deciding, then decide again', async () => {
    const { applyAlphaCommand } = await import('@aoh/game-engine');
    let state = setup();
    for (const player of state.players) { player.ambitionsChosen = true; }
    const [a] = state.players.map(player => player.playerId);
    const run = (raw: Record<string, unknown>) => { const result = applyAlphaCommand(state, a!, { ...raw, expectedVersion: state.version }); if (result.ok) state = result.value; return result; };
    expect(run({ type: 'UNREADY' })).toMatchObject({ ok: false, error: { code: 'NOT_READY' } });
    expect(run({ type: 'READY' }).ok).toBe(true);
    expect(run({ type: 'CANCEL_ORDER', orderId: 'none' })).toMatchObject({ ok: false, error: { code: 'ALREADY_READY' } });
    expect(run({ type: 'UNREADY' }).ok).toBe(true);
    expect(state.players.find(player => player.playerId === a)!.ready).toBe(false);
    expect(state.phase).toBe('PLANNING');
    expect(run({ type: 'CANCEL_ORDER', orderId: 'none' }).ok).toBe(true);
  });
});
