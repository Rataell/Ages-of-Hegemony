import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, MatchReportV1Schema, PlayerIdSchema, REGION_TEMPLATES, type AlphaState, type AlphaUnit, type MapPreset } from '@aoh/game-domain';
import { alphaUnitOptions, buildMatchReport, entryRotations, hexDistance, hexId, hexNeighbors, isLandTerrain, planFrontierMove, regionOpenFor, resolveFrontierMove, resolveOrders, visibleHexIds } from '@aoh/game-engine';
import { completeRound } from './alpha-rounds.js';
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

describe('B3 (UXB-01): DANGER removes the exploring piece by design - and now says so on the table (LOSSES event, honest message, Cronica marker)', () => {
  const dangerCase = () => {
    const base = world(3, 'ARCHIPELAGO');
    const c = cases('ARCHIPELAGO', 3).list[0]!;
    base.regions.find(r => r.id === c.regionId)!.discovery = { kind: 'DANGER', resolved: false, resolvedBy: null };
    return { base, c, regionName: REGION_TEMPLATES.find(t => t.id === base.regions.find(r => r.id === c.regionId)!.templateId)!.name };
  };
  /** The RNG decides loss/escape (50%); walk counters until each outcome shows up. */
  const sweep = (base: AlphaState, c: Case, mutate: (state: AlphaState) => void = () => {}) => {
    const outcomes: { lost: boolean; state: AlphaState; pioneer: AlphaUnit }[] = [];
    for (let counter = 0; counter < 16; counter++) {
      const probe = structuredClone(base); mutate(probe);
      probe.privateRng.counter = counter;
      const { state, pioneer } = reveal(probe, c);
      outcomes.push({ lost: !state.units.some(u => u.id === pioneer.id), state, pioneer });
    }
    return outcomes;
  };

  it('with the RNG advanced differently, a DANGER Region kills the Pioneiro on some reveals (50%) and spares him on others', () => {
    const { base, c } = dangerCase();
    const outcomes = sweep(base, c);
    console.info(`B3 DANGER over 16 RNG counters: Pioneiro lost=${outcomes.filter(o => o.lost).length}, kept=${outcomes.filter(o => !o.lost).length}`);
    expect(outcomes.some(o => o.lost)).toBe(true);
    expect(outcomes.some(o => !o.lost)).toBe(true);
  });

  it('a Pioneiro lost to DANGER emits a LOSSES resolution event for the actor: entry hex, unit id, clear message naming the Region', () => {
    const { base, c, regionName } = dangerCase();
    const lost = sweep(base, c).filter(o => o.lost);
    expect(lost.length).toBeGreaterThan(0);
    for (const { state, pioneer } of lost) {
      const events = state.resolutionEvents.filter(e => e.type === 'LOSSES' && e.unitIds.includes(pioneer.id));
      expect(events).toHaveLength(1);
      const event = events[0]!;
      expect(event.actorId).toBe(p1);
      expect(event.visibleTo).toEqual([p1]);
      expect(event.hexId).toBe(c.entry);
      expect(event.unitIds).toEqual([pioneer.id]);
      expect(event.message).toBe(`Perigo: a peça Pioneiro foi perdida ao entrar em ${regionName}.`);
      expect(state.events.some(e => e.type === 'DANGER_LOSS' && e.message === event.message && e.audience?.join() === p1)).toBe(true);
      expect(AlphaStateSchema.safeParse(JSON.parse(JSON.stringify(state))).success).toBe(true);
    }
  });

  it('escaping the Perigo emits no LOSSES event and keeps the Pioneiro on the entry hex', () => {
    const { base, c } = dangerCase();
    const kept = sweep(base, c).filter(o => !o.lost);
    expect(kept.length).toBeGreaterThan(0);
    for (const { state, pioneer } of kept) {
      expect(state.resolutionEvents.filter(e => e.type === 'LOSSES')).toEqual([]);
      expect(state.events.some(e => e.type === 'DANGER_LOSS')).toBe(false);
      expect(state.events.some(e => e.type === 'DISCOVERY' && e.message.includes('escapou por pouco'))).toBe(true);
      expect(state.units.find(u => u.id === pioneer.id)?.hexId).toBe(c.entry);
    }
  });

  it('with Metodo Experimental the explorer never loses a piece to Perigo, on any RNG counter', () => {
    const { base, c } = dangerCase();
    const outcomes = sweep(base, c, probe => { probe.players.find(p => p.playerId === p1)!.research.push('web-experimental-method'); });
    expect(outcomes.every(o => !o.lost)).toBe(true);
    for (const { state } of outcomes) {
      expect(state.resolutionEvents.filter(e => e.type === 'LOSSES')).toEqual([]);
      expect(state.events.some(e => e.type === 'DISCOVERY' && e.message.includes('Método Experimental evitou o pior'))).toBe(true);
    }
  });

  it('the move result in the round does not say the Region was just revealed when the piece was lost (full resolveOrders path)', () => {
    const { base, c } = dangerCase();
    let lostMessage = '', keptMessage = '';
    for (let counter = 0; counter < 16 && !(lostMessage && keptMessage); counter++) {
      const state = structuredClone(base); state.privateRng.counter = counter;
      const pioneer = state.units.find(u => u.ownerId === p1 && u.kind === 'PIONEER')!;
      pioneer.hexId = c.from as never;
      const progress = state.players.find(p => p.playerId === p1)!;
      if (!progress.knownHexIds.includes(c.from as never)) progress.knownHexIds.push(c.from as never);
      progress.orders = [{ id: 'ux', type: 'MOVE', unitIds: [pioneer.id], path: [c.entry], rotation: c.rotation } as never];
      resolveOrders(state, ['MOVE']);
      const gone = !state.units.some(u => u.id === pioneer.id);
      const discovery = state.resolutionEvents.find(e => e.type === 'DISCOVERY' && e.actorId === p1)!;
      expect(discovery, 'the move still reports a DISCOVERY').toBeDefined();
      if (gone) { lostMessage = discovery.message; expect(state.resolutionEvents.some(e => e.type === 'LOSSES' && e.unitIds.includes(pioneer.id))).toBe(true); }
      else keptMessage = discovery.message;
    }
    expect(lostMessage).toContain('Perigo');
    expect(lostMessage).toContain('perdido');
    expect(lostMessage).not.toContain('Região revelada');
    expect(keptMessage).toContain('Região revelada');
  });

  it('Cronica: a piece lost to Perigo shows up as a DANGER_LOSS marker in the MatchReport timeline, for that seat only', () => {
    const { base, c } = dangerCase();
    const lost = sweep(base, c).find(o => o.lost)!;
    // The report exists only for a finished match: play the Pioneiro-less table to the round limit with the loss already in its history.
    let finished = lost.state; finished.rules.roundLimit = 2;
    for (let round = 0; round < 2; round++) finished = completeRound(finished);
    const report = buildMatchReport(finished, { origin: 'SIMULATION', finishedAt: '2026-10-12T12:00:00.000Z' });
    const marks = report.timeline.filter(entry => entry.kind === 'DANGER_LOSS');
    expect(marks).toHaveLength(1);
    expect(marks[0]!.seat).toBe(p1);
    expect(marks[0]!.round).toBe(lost.state.core.round);
    expect(MatchReportV1Schema.safeParse(report).success).toBe(true);
    expect(marks[0]!.text).not.toMatch(/\d+,\d+/);
  });

  it('advance warning: alphaUnitOptions flags every closed Region as a POSSIBLE Perigo (50%), without leaking which one holds it, and NONE with Metodo Experimental', () => {
    const { base, c } = dangerCase();
    const probe = structuredClone(base);
    const pioneer = probe.units.find(u => u.ownerId === p1 && u.kind === 'PIONEER')!;
    pioneer.hexId = c.from as never;
    probe.players.find(p => p.playerId === p1)!.knownHexIds.push(c.from as never);
    const risks = (state: AlphaState) => alphaUnitOptions(state, p1)[pioneer.id]!.frontier.map(entry => ({ regionId: entry.regionId, risk: entry.frontierRisk }));
    const plain = risks(probe);
    expect(plain.length).toBeGreaterThan(0);
    for (const { risk } of plain) expect(risk).toEqual({ danger: 'POSSIBLE', lossChance: 0.5, mitigatedBy: 'web-experimental-method' });
    // identical for a Region that holds a Perigo and one that holds nothing: the hidden draw does not leak
    const calm = structuredClone(probe); for (const region of calm.regions) region.discovery = { kind: 'NONE', resolved: false, resolvedBy: null };
    expect(risks(calm)).toEqual(plain);
    const protectedState = structuredClone(probe); protectedState.players.find(p => p.playerId === p1)!.research.push('web-experimental-method');
    for (const { risk } of risks(protectedState)) expect(risk).toEqual({ danger: 'NONE', lossChance: 0, mitigatedBy: 'web-experimental-method' });
  });
});

describe('D2 invariant: no orientation of a Region removes a piece or leaves one on SEA/UNKNOWN', () => {
  it.each([['ARCHIPELAGO', 3], ['INLAND_SEA', 3], ['MIXED', 3]] as [MapPreset, number][])('%s seed %i: every (entry, legal rotation) x present pieces', (preset, seed) => {
    const { state: base, list } = cases(preset, seed);
    let checked = 0, fixedByPiece = 0, refused = 0, occupantsChecked = 0;
    const seen = new Set<string>();
    for (const c of list) {
      const region = base.regions.find(r => r.id === c.regionId)!;
      for (const variant of ['occupants', 'rival-piece'] as const) {
        const key = `${variant}:${c.regionId}:${c.entry}:${c.rotation}`;
        if (seen.has(key)) continue; seen.add(key);
        const probe = structuredClone(base);
        // a rival (p2) land piece standing inside the Region pins its orientation (a piece's terrain never changes under it)
        const rivalHex = region.hexIds.find(id => id !== c.entry && !['SEA', 'UNKNOWN'].includes(tileOf(probe, id).terrain) && !probe.units.some(u => u.hexId === id) && !probe.threats.some(t => t.hexId === id) && !probe.independents.some(i => i.hexId === id));
        if (variant === 'rival-piece') {
          if (!rivalHex) continue;
          probe.units.push({ id: 'rival-inf', ownerId: 'p2', kind: 'INFANTRY', hexId: rivalHex as never, recruitedRound: 1, carrierId: null } as AlphaUnit);
        }
        const terrainBefore = region.hexIds.map(id => tileOf(probe, id).terrain);
        const unitsBefore = probe.units.length;
        let result: ReturnType<typeof reveal>;
        try { result = reveal(probe, c); } catch { refused++; continue; } // the planner refused this orientation: nothing was applied
        const { state } = result;
        checked++;
        expect(state.units.length, `${variant} ${c.regionId} entry ${c.entry} rot ${c.rotation}: a piece disappeared`).toBe(unitsBefore);
        for (const unit of state.units.filter(u => !u.carrierId && state.rules.units[u.kind].domain === 'LAND')) expect(['SEA', 'UNKNOWN'], `${unit.id} on ${unit.hexId}`).not.toContain(tileOf(state, unit.hexId).terrain);
        for (const unit of state.units) expect(tileOf(state, unit.hexId).terrain).not.toBe('UNKNOWN');
        // world occupants (peoples, camps, pirates) are settled onto terrain that suits them
        for (const people of state.independents.filter(i => region.hexIds.includes(i.hexId as never))) { expect(isLandTerrain(tileOf(state, people.hexId).terrain)).toBe(true); occupantsChecked++; }
        for (const threat of state.threats.filter(t => region.hexIds.includes(t.hexId as never))) { expect(threat.kind === 'PIRATE' ? tileOf(state, threat.hexId).terrain === 'SEA' : isLandTerrain(tileOf(state, threat.hexId).terrain)).toBe(true); occupantsChecked++; }
        if (variant === 'rival-piece') {
          fixedByPiece++;
          expect(region.hexIds.map(id => tileOf(state, id).terrain), 'a piece inside the Region pins its orientation').toEqual(terrainBefore);
          expect(state.units.find(u => u.id === 'rival-inf')?.hexId).toBe(rivalHex);
        }
      }
    }
    console.info(`D2 ${preset}/${seed}: reveals checked=${checked}, refused by planner=${refused}, pinned by a piece=${fixedByPiece}, world occupants checked=${occupantsChecked}`);
    expect(checked).toBeGreaterThan(0);
    expect(fixedByPiece).toBeGreaterThan(0);
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
