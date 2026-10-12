import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, PlayerIdSchema, type AlphaState, type MapPreset } from '@aoh/game-domain';
import { entryRotations, hexDistance, hexId, hexNeighbors, isLandTerrain, planFrontierMove, regionOpenFor, resolveFrontierMove, visibleHexIds } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { beginAlphaPlanning, createAlphaGame, deserializeAlphaState, serializeAlphaState } from '@aoh/game-engine';

/**
 * UX repro B (RC5 playtest): "Pioneiro sumiu ao revelar Regiao com agua". Reveals every water-bearing frontier Region through every legal
 * entry hex and every legal orientation, then audits the authoritative state, the schema, the per-seat projection and the persisted snapshot.
 */
const p1 = PlayerIdSchema.parse('p1');
const world = (seed: number, preset: MapPreset): AlphaState => {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'ux-repro-pioneer', seed, preset: 'QUICK', worldPreset: preset, mapSize: 'STANDARD', players: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] }));
  for (const region of state.regions) region.discovery = { kind: 'NONE', resolved: true, resolvedBy: null };
  return state;
};
const tileOf = (state: AlphaState, id: string) => state.core.map.find(t => t.id === id)!;
const WATERY = (state: AlphaState, region: AlphaState['regions'][number]) => region.hexIds.some(id => ['SEA', 'COAST'].includes(tileOf(state, id).terrain));

interface Case { preset: MapPreset; seed: number; regionId: string; entry: string; from: string; rotation: number; entryTerrain: string; all: number[] }
/** Enumerates (region, entry hex, neighbour outside the Region to stand on, legal orientation) for every closed frontier Region with water. */
function cases(preset: MapPreset, seed: number): { state: AlphaState; list: Case[] } {
  const state = world(seed, preset), list: Case[] = [];
  for (const region of state.regions) {
    if (regionOpenFor(state, region, p1) || !WATERY(state, region)) continue;
    for (const entry of region.hexIds) {
      const from = hexNeighbors(tileOf(state, entry)).map(hexId).find(id => !region.hexIds.includes(id as never) && state.core.map.some(t => t.id === id && !['SEA', 'UNKNOWN'].includes(t.terrain)));
      if (!from) continue;
      const rotations = entryRotations(state, region, entry, 'LAND');
      for (const rotation of rotations) list.push({ preset, seed, regionId: region.id, entry, from, rotation, entryTerrain: '', all: rotations });
    }
  }
  return { state, list };
}
function reveal(base: AlphaState, c: Case) {
  const state = structuredClone(base);
  const pioneer = state.units.find(u => u.ownerId === p1 && u.kind === 'PIONEER')!;
  pioneer.hexId = c.from as never;
  const progress = state.players.find(p => p.playerId === p1)!;
  if (!progress.knownHexIds.includes(c.from as never)) progress.knownHexIds.push(c.from as never);
  const order = { id: 'ux', type: 'MOVE' as const, unitIds: [pioneer.id], path: [c.entry], rotation: c.rotation };
  const result = resolveFrontierMove(state, p1, order as never);
  return { state, pioneer, result };
}

describe('B1: every legal orientation of a watery Region leaves the Pioneiro on land, in state.units, visible in his own projection', () => {
  it.each([['MIXED', 3], ['ARCHIPELAGO', 3], ['INLAND_SEA', 3], ['CONTINENTAL', 3], ['ARCHIPELAGO', 29], ['INLAND_SEA', 29]] as [MapPreset, number][])('%s seed %i', (preset, seed) => {
    const { state: base, list } = cases(preset, seed);
    let onCoast = 0, onLand = 0, hiddenThreat = 0, parsed = 0;
    for (const c of list) {
      const { state, pioneer, result } = reveal(base, c);
      const alive = state.units.find(u => u.id === pioneer.id);
      expect(alive, `${c.regionId} entry ${c.entry} rotation ${c.rotation}: Pioneiro missing from state.units`).toBeDefined();
      const end = tileOf(state, alive!.hexId);
      if (!result.entered) { hiddenThreat++; continue; }
      expect(alive!.hexId).toBe(c.entry);
      expect(isLandTerrain(end.terrain), `${c.regionId} entry ${c.entry} rotation ${c.rotation}: Pioneiro stands on ${end.terrain}`).toBe(true);
      end.terrain === 'COAST' ? onCoast++ : onLand++;
      // every piece on the table stands on terrain that suits it (the schema invariant)
      for (const unit of state.units) expect(tileOf(state, unit.hexId).terrain, `${unit.id} on ${unit.hexId}`).not.toBe('UNKNOWN');
      for (const unit of state.units.filter(u => !u.carrierId && state.rules.units[u.kind].domain === 'LAND')) expect(tileOf(state, unit.hexId).terrain).not.toBe('SEA');
      // the seat's own projection keeps the piece, and its hex is visible (so the client has the tile to draw it on)
      expect(visibleHexIds(state, p1).has(c.entry)).toBe(true);
      if (list.indexOf(c) % 12 === 0) {
        const view = alphaPlayerView(state, p1)!;
        expect(view.units.some((u: { id: string; hexId: string }) => u.id === pioneer.id && u.hexId === c.entry)).toBe(true);
        expect(AlphaStateSchema.safeParse(JSON.parse(JSON.stringify(state))).success).toBe(true);
        parsed++;
      }
    }
    console.info(`B1 ${preset}/${seed}: reveals=${list.length}, Pioneiro on COAST=${onCoast}, on plain land=${onLand}, held back by hidden Ameaca=${hiddenThreat}, schema-checked=${parsed}`);
    expect(list.length).toBeGreaterThan(0);
  });
});

describe('B2: an orientation that would put the entry hex under water is refused, never applied', () => {
  it('for every excluded orientation of every entry hex planFrontierMove throws (no Pioneiro lands on SEA)', () => {
    const { state, list } = cases('ARCHIPELAGO', 3);
    let refused = 0;
    const seen = new Set<string>();
    for (const c of list) {
      const key = `${c.regionId}:${c.entry}`;
      if (seen.has(key)) continue; seen.add(key);
      for (const rotation of [0, 1, 2, 3, 4, 5].filter(r => !c.all.includes(r))) {
        const probe = structuredClone(state);
        const pioneer = probe.units.find(u => u.ownerId === p1 && u.kind === 'PIONEER')!;
        pioneer.hexId = c.from as never;
        probe.players.find(p => p.playerId === p1)!.knownHexIds.push(c.from as never);
        const order = { id: 'ux', type: 'MOVE' as const, unitIds: [pioneer.id], path: [c.entry], rotation };
        // With several legal orientations an illegal one is rejected; with exactly one legal orientation the auto-applied one wins, so only multi-orientation entries can show it.
        if (c.all.length > 1) { expect(() => planFrontierMove(probe, p1, order as never)).toThrow(); refused++; }
      }
    }
    console.info(`B2 refused illegal orientations: ${refused}`);
    expect(refused).toBeGreaterThan(0);
  });
});

describe('B3: DANGER discovery removes the exploring piece by design - and says so only in a private text event', () => {
  it('with the RNG advanced differently, a DANGER Region kills the Pioneiro on some reveals (50%), with no LOSSES resolution event for the client to show', () => {
    const base = world(3, 'ARCHIPELAGO');
    const c = cases('ARCHIPELAGO', 3).list[0]!;
    const region = base.regions.find(r => r.id === c.regionId)!;
    region.discovery = { kind: 'DANGER', resolved: false, resolvedBy: null };
    let lost = 0, kept = 0, silent = 0;
    for (let counter = 0; counter < 16; counter++) {
      const probe = structuredClone(base);
      probe.privateRng.counter = counter;
      const { state, pioneer } = reveal(probe, c);
      const alive = state.units.some(u => u.id === pioneer.id);
      alive ? kept++ : lost++;
      if (!alive) {
        const text = state.events.find(e => e.type === 'DISCOVERY' && e.message.includes('perigo custou a peça'));
        expect(text, 'DANGER loss is announced in a DISCOVERY text event').toBeDefined();
        if (!state.resolutionEvents.some(e => e.type === 'LOSSES' && e.unitIds?.includes(pioneer.id))) silent++;
      }
    }
    console.info(`B3 DANGER over 16 RNG counters: Pioneiro lost=${lost}, kept=${kept}, loss without a LOSSES resolution event=${silent}`);
    expect(lost).toBeGreaterThan(0);
    expect(kept).toBeGreaterThan(0);
  });

  // Expected behaviour (UX): when a piece is removed by a Descoberta the client receives the same LOSSES resolution event used for ambushes/shipwrecks,
  // so the table can show WHY the piece vanished. Today applyDiscovery just filters state.units (alpha-discoveries.ts DANGER case): no resolution event.
  it.fails('EXPECTED: a Pioneiro lost to DANGER emits a LOSSES resolution event naming the unit', () => {
    const base = world(3, 'ARCHIPELAGO');
    const c = cases('ARCHIPELAGO', 3).list[0]!;
    base.regions.find(r => r.id === c.regionId)!.discovery = { kind: 'DANGER', resolved: false, resolvedBy: null };
    for (let counter = 0; counter < 16; counter++) {
      const probe = structuredClone(base);
      probe.privateRng.counter = counter;
      const { state, pioneer } = reveal(probe, c);
      if (!state.units.some(u => u.id === pioneer.id)) { expect(state.resolutionEvents.some(e => e.type === 'LOSSES' && e.unitIds?.includes(pioneer.id))).toBe(true); return; }
    }
    throw new Error('no DANGER loss found in 16 counters');
  });
});

describe('B4: persistence keeps the piece after a reveal', () => {
  it('serialize -> load round trip of the post-reveal state keeps the Pioneiro on the entry hex', () => {
    const { state: base, list } = cases('INLAND_SEA', 3);
    const c = list.find(x => x.all.length > 0)!;
    const { state, pioneer } = reveal(base, c);
    const loaded = deserializeAlphaState(serializeAlphaState(state));
    expect(loaded.ok).toBe(true);
    const again = (loaded as { ok: true; value: AlphaState }).value;
    const found = again.units.find(u => u.id === pioneer.id);
    expect(found?.hexId).toBe(c.entry);
    expect(hexDistance(tileOf(again, found!.hexId), tileOf(again, c.entry))).toBe(0);
  });
});
