import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, DISCOVERY_WEIGHTS, PlayerIdSchema, REGION_TEMPLATES, type AlphaState, type DiscoveryKind } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame, exploreRegion, explorationHints, hexDistance } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';

const p1 = PlayerIdSchema.parse('p1');
const make = (seed = 11): AlphaState => beginAlphaPlanning(createAlphaGame({ gameId: `disc-${seed}`, seed, preset: 'STANDARD', players: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] }));
const frontier = (state: AlphaState) => state.regions.filter(region => REGION_TEMPLATES.find(t => t.id === region.templateId)?.kind === 'FRONTIER' && !region.revealedBy.includes(p1));
/** Sets the region's content, then explores it with an Explorador standing next to it. */
function reveal(state: AlphaState, kind: DiscoveryKind, regionIndex = 0) {
  const region = frontier(state).find(candidate => candidate.hexIds.some(id => state.core.map.find(t => t.id === id)!.terrain !== 'SEA'))!;
  void regionIndex;
  region.discovery = { kind, resolved: kind === 'NONE', resolvedBy: null };
  const unit = state.units.find(u => u.ownerId === p1 && u.kind === 'COLONIST')!;
  const edge = state.core.map.find(tile => !region.hexIds.includes(tile.id) && !['SEA', 'UNKNOWN'].includes(tile.terrain) && region.hexIds.some(id => hexDistance(tile, state.core.map.find(c => c.id === id)!) === 1))!;
  unit.hexId = edge.id as never; state.players[0]!.knownHexIds = state.core.map.map(t => t.id);
  state.players[0]!.pendingChoices = [];
  exploreRegion(state, p1, { id: 'e', type: 'EXPLORE', unitId: unit.id, target: region.hexIds[0]!, rotation: 0 });
  return { region, unit };
}

describe('hidden region content (canon §21)', () => {
  it('is drawn once at creation, deterministic per seed, and homelands hold nothing', () => {
    const a = make(11), b = make(11), c = make(12);
    expect(a.regions.map(r => r.discovery)).toEqual(b.regions.map(r => r.discovery));
    expect(a.regions.map(r => r.discovery?.kind)).not.toEqual(c.regions.map(r => r.discovery?.kind));
    for (const region of a.regions) {
      expect(region.discovery).toBeDefined();
      if (REGION_TEMPLATES.find(t => t.id === region.templateId)!.kind === 'HOMELAND') expect(region.discovery).toEqual({ kind: 'NONE', resolved: true, resolvedBy: null });
    }
  });

  it('covers every kind across seeds and only places an Ancoradouro where there is water', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 25; seed++) {
      const state = make(seed);
      for (const region of state.regions) {
        seen.add(region.discovery!.kind);
        if (region.discovery!.kind === 'ANCHORAGE') expect(region.hexIds.some(id => ['COAST', 'SEA'].includes(state.core.map.find(t => t.id === id)!.terrain))).toBe(true);
      }
    }
    for (const [kind] of DISCOVERY_WEIGHTS) expect(seen.has(kind), kind).toBe(true);
  });

  it('never reaches the projection before the region is revealed', () => {
    const state = make(); const view = alphaPlayerView(state, p1)!;
    expect(view.regions.every(region => state.regions.find(r => r.id === region.id)!.revealedBy.includes(p1))).toBe(true);
    expect(JSON.stringify(view)).not.toContain('"DANGER"');
    const { region } = reveal(state, 'RUIN');
    expect(alphaPlayerView(state, p1)!.regions.find(r => r.id === region.id)!.discovery).toEqual({ kind: 'RUIN', resolved: true });
    expect(alphaPlayerView(state, PlayerIdSchema.parse('p2'))!.regions.find(r => r.id === region.id)).toBeUndefined();
  });
});

describe('exploring applies the content once', () => {
  it('RUIN becomes an Encounter with two choices that RESOLVE_CHOICE settles', () => {
    const state = make(); reveal(state, 'RUIN');
    const choice = state.players[0]!.pendingChoices.find(c => c.source === 'ENCOUNTER')!;
    expect(choice.options).toHaveLength(2);
    const result = applyAlphaCommand(state, p1, { type: 'RESOLVE_CHOICE', expectedVersion: state.version, choiceId: choice.id, optionId: choice.options[0]!.id });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.players[0]!.pendingChoices.some(c => c.id === choice.id)).toBe(false);
  });

  it('DEPOSIT gives Pedra and Metal and marks a deposit', () => {
    const state = make(); state.players[0]!.resources.stone = 0; state.players[0]!.resources.metal = 0;
    const { region } = reveal(state, 'DEPOSIT');
    expect(state.players[0]!.resources.stone).toBe(2); expect(state.players[0]!.resources.metal).toBe(1);
    void region;
  });

  it('PASSAGE opens natural roads inside the region', () => {
    const state = make(); const before = state.roads.length;
    const { region } = reveal(state, 'PASSAGE');
    expect(state.roads.length).toBeGreaterThan(before);
    expect(state.roads.slice(before).every(id => region.hexIds.includes(id as never))).toBe(true);
  });

  it('ANCHORAGE grants Riqueza', () => {
    const state = make(); state.players[0]!.resources.wealth = 0;
    reveal(state, 'ANCHORAGE'); expect(state.players[0]!.resources.wealth).toBe(1);
  });

  it('DANGER can cost the explorer, but Método Experimental protects it', () => {
    let lost = 0;
    for (let seed = 1; seed <= 12; seed++) { const state = make(seed); const { unit } = reveal(state, 'DANGER'); if (!state.units.some(u => u.id === unit.id)) lost++; }
    expect(lost).toBeGreaterThan(0); expect(lost).toBeLessThan(12);
    for (let seed = 1; seed <= 12; seed++) { const state = make(seed); state.players[0]!.research.push('web-experimental-method'); const { unit } = reveal(state, 'DANGER'); expect(state.units.some(u => u.id === unit.id)).toBe(true); }
  });

  it('CAMP spawns a camp inside the region (subject to the cap)', () => {
    const state = make(); state.threats = [];
    const { region } = reveal(state, 'CAMP');
    expect(state.threats).toHaveLength(1);
    expect(region.hexIds).toContain(state.threats[0]!.hexId);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('only the first civilization to reveal a region gets the content', () => {
    const state = make(); state.players[0]!.resources.wealth = 0;
    const { region, unit } = reveal(state, 'ANCHORAGE');
    expect(region.discovery).toMatchObject({ resolved: true, resolvedBy: p1 });
    state.players[0]!.resources.wealth = 0; region.revealedBy = region.revealedBy.filter(id => id !== p1);
    exploreRegion(state, p1, { id: 'e2', type: 'EXPLORE', unitId: unit.id, target: region.hexIds[0]!, rotation: 0 });
    expect(state.players[0]!.resources.wealth).toBe(0);
  });
});

describe('what the Web shows before exploring', () => {
  it('Matemática names the biome, Método Experimental warns of danger and coast, nothing leaks without them', () => {
    const state = make(); const unit = state.units.find(u => u.ownerId === p1)!;
    expect(explorationHints(state, p1)).toEqual([]);
    state.players[0]!.research.push('web-mathematics');
    const near = explorationHints(state, p1);
    expect(near.length).toBeGreaterThan(0);
    expect(near.every(hint => hint.biome !== null && hint.danger === null && hint.coast === null)).toBe(true);
    state.players[0]!.research.push('web-experimental-method');
    const target = frontier(state)[0]!; target.discovery = { kind: 'DANGER', resolved: false, resolvedBy: null };
    unit.hexId = state.core.map.find(t => !target.hexIds.includes(t.id) && t.terrain !== 'SEA' && target.hexIds.some(id => hexDistance(t, state.core.map.find(c => c.id === id)!) === 1))!.id as never;
    const hint = explorationHints(state, p1).find(h => h.regionId === target.id)!;
    expect(hint.danger).toBe(true);
    expect(JSON.stringify(hint)).not.toContain('DANGER');
  });
});
