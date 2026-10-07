import { describe, expect, it } from 'vitest';
import type { AlphaState, AlphaUnit } from '@aoh/game-domain';
import { alphaUnitOptions, beginAlphaPlanning, createAlphaGame, exploreRegion, explorationAccess, explorerRole, hexId, hexNeighbors, regionOrientationFixed, rotatedRegionTiles, validateExploration, EXPLORE_NEEDS_NAVAL } from '@aoh/game-engine';

const world = (seed: number, worldPreset: 'MIXED' | 'ARCHIPELAGO' = 'MIXED') => beginAlphaPlanning(createAlphaGame({ gameId: 'explore', seed, preset: 'QUICK', worldPreset, mapSize: 'STANDARD', players: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] }));
const unitOf = (state: AlphaState, kind: AlphaUnit['kind']) => ({ ...state.units.find(u => u.ownerId === 'p1')!, id: `probe-${kind}`, kind } as AlphaUnit);
/** Hexes next to a Region (outside it), the places a piece can stand to explore it. */
const rim = (state: AlphaState, region: AlphaState['regions'][number]) => {
  const inside = new Set<string>(region.hexIds), out = new Set<string>();
  for (const id of region.hexIds) { const t = state.core.map.find(x => x.id === id)!; for (const p of hexNeighbors(t)) { const n = hexId(p); if (!inside.has(n) && state.core.map.some(x => x.id === n)) out.add(n); } }
  return [...out];
};
const hidden = (state: AlphaState) => state.regions.filter(r => !regionOrientationFixed(state, r) && !r.templateId.startsWith('homeland'));

describe('exploration: who explores and how a Region is entered', () => {
  it('only Pioneiros (land) and Frotas (naval) explore; military land pieces never do', () => {
    const state = world(5);
    for (const kind of ['INFANTRY', 'GUARD', 'RANGED', 'CAVALRY', 'SIEGE', 'ENVOY'] as const) expect(explorerRole(state, unitOf(state, kind)), kind).toBeNull();
    expect(explorerRole(state, unitOf(state, 'PIONEER'))).toBe('LAND');
    expect(explorerRole(state, unitOf(state, 'FLEET'))).toBe('NAVAL');
    const soldier = state.units.find(u => u.ownerId === 'p1')!; soldier.kind = 'INFANTRY';
    const target = hidden(state).find(r => rim(state, r).length)!;
    soldier.hexId = rim(state, target)[0] as typeof soldier.hexId;
    expect(() => validateExploration(state, 'p1' as never, { type: 'EXPLORE', id: 'x', unitId: soldier.id, target: target.hexIds[0]!, rotation: 0 })).toThrow('Somente Pioneiros e Frotas exploram.');
    expect(alphaUnitOptions(state, 'p1' as never)[soldier.id]!.explore).toEqual([]);
  });
  it('a Pioneiro needs LAND at the entry hex: one orientation is applied automatically, several are chosen, none says "Requer acesso naval."', () => {
    let single = 0, several = 0, none = 0;
    for (const seed of [2, 5, 9, 13, 21, 34]) {
      const state = world(seed, 'ARCHIPELAGO'), pioneer = unitOf(state, 'PIONEER');
      for (const region of hidden(state)) for (const at of rim(state, region)) {
        pioneer.hexId = at as typeof pioneer.hexId;
        const access = explorationAccess(state, pioneer, region);
        if (access.block === null) { expect(access.rotations.length).toBeGreaterThan(0); if (access.rotations.length === 1) single++; else several++; for (const rotation of access.rotations) expect(rotatedRegionTiles(state, region, rotation).some((t, i) => ['PLAINS', 'FOREST', 'HILLS', 'MOUNTAINS', 'COAST'].includes(t.terrain) && state.core.map.find(m => m.id === region.hexIds[i])! && true)).toBe(true); }
        else if (access.block === EXPLORE_NEEDS_NAVAL) { none++; expect(access.rotations).toEqual([]); }
      }
    }
    expect(single).toBeGreaterThan(0); expect(several).toBeGreaterThan(0); expect(none).toBeGreaterThan(0);
  });
  it('exploring applies the single legal orientation whatever the order says, and refuses an illegal one when several exist', () => {
    for (const seed of [2, 5, 9, 13, 21, 34, 55]) {
      const state = world(seed, 'ARCHIPELAGO'), pioneer = state.units.find(u => u.ownerId === 'p1' && u.kind === 'PIONEER')!;
      for (const region of hidden(state)) for (const at of rim(state, region)) {
        pioneer.hexId = at as typeof pioneer.hexId;
        const access = explorationAccess(state, pioneer, region);
        if (access.rotations.length > 1 && access.rotations.length < 6) {
          const bad = [0, 1, 2, 3, 4, 5].find(r => !access.rotations.includes(r))!;
          expect(() => validateExploration(state, 'p1' as never, { type: 'EXPLORE', id: 'x', unitId: pioneer.id, target: region.hexIds[0]!, rotation: bad })).toThrow('orientação');
          return;
        }
      }
    }
    throw new Error('no multi-orientation case found');
  });
  it('a lone legal orientation is forced onto the Region and flips it for the whole table', () => {
    for (const seed of [2, 5, 9, 13, 21, 34, 55]) {
      const state = world(seed, 'ARCHIPELAGO'), pioneer = state.units.find(u => u.ownerId === 'p1' && u.kind === 'PIONEER')!;
      for (const region of hidden(state)) for (const at of rim(state, region)) {
        pioneer.hexId = at as typeof pioneer.hexId;
        const access = explorationAccess(state, pioneer, region);
        if (access.rotations.length !== 1) continue;
        const wrong = (access.rotations[0]! + 3) % 6, expected = rotatedRegionTiles(state, region, access.rotations[0]!).map(t => t.terrain);
        exploreRegion(state, 'p1' as never, { type: 'EXPLORE', id: 'e', unitId: pioneer.id, target: region.hexIds[0]!, rotation: wrong });
        expect(region.rotation).toBe(access.rotations[0]);
        expect(region.hexIds.map(id => state.core.map.find(t => t.id === id)!.terrain)).toEqual(expected);
        return;
      }
    }
    throw new Error('no single-orientation case found');
  });
  it('a Frota enters through navigable water (COAST or SEA) and the options report it', () => {
    const state = world(9, 'ARCHIPELAGO'), fleet = unitOf(state, 'FLEET');
    let seen = 0;
    for (const region of hidden(state)) for (const at of rim(state, region)) {
      fleet.hexId = at as typeof fleet.hexId;
      const access = explorationAccess(state, fleet, region);
      if (access.block === null) { seen++; for (const rotation of access.rotations) expect(rotatedRegionTiles(state, region, rotation).some(t => t.terrain === 'COAST' || t.terrain === 'SEA')).toBe(true); }
    }
    expect(seen).toBeGreaterThan(0);
  });
  it('two explorers of the same Region in one round do not corrupt it, and its Discovery resolves once', () => {
    for (const seed of [2, 5, 9, 13, 21, 34, 55]) {
      const state = world(seed), a = state.units.find(u => u.ownerId === 'p1' && u.kind === 'PIONEER')!, b = state.units.find(u => u.ownerId === 'p2' && u.kind === 'PIONEER')!;
      for (const region of hidden(state)) {
        const at = rim(state, region); a.hexId = at[0] as typeof a.hexId; b.hexId = at[at.length - 1] as typeof b.hexId;
        if (explorationAccess(state, a, region).block !== null || explorationAccess(state, b, region).block !== null) continue;
        const first = explorationAccess(state, a, region).rotations[0]!;
        exploreRegion(state, 'p1' as never, { type: 'EXPLORE', id: 'e1', unitId: a.id, target: region.hexIds[0]!, rotation: first });
        const terrain = region.hexIds.map(id => state.core.map.find(t => t.id === id)!.terrain), resolvedBy = region.discovery?.resolvedBy ?? null, events = state.events.length;
        exploreRegion(state, 'p2' as never, { type: 'EXPLORE', id: 'e2', unitId: b.id, target: region.hexIds[0]!, rotation: (first + 3) % 6 });
        expect(region.rotation).toBe(first);
        expect(region.hexIds.map(id => state.core.map.find(t => t.id === id)!.terrain)).toEqual(terrain);
        expect(region.discovery?.resolvedBy ?? null).toBe(resolvedBy);
        expect(state.events.slice(events).some(e => e.type === 'REGION_ALREADY_OPEN')).toBe(true);
        expect(state.players[1]!.exploredRegions).toBe(0);
        return;
      }
    }
    throw new Error('no shared-region case found');
  });
});
