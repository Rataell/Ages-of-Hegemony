import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, cityYield, createAlphaGame, harborHex, hexId, hexNeighbors, isCoastalCity, isNavigableWater, isPort, setAlphaPhase, urbanOptions, waterEdges } from '@aoh/game-engine';

const p1 = PlayerIdSchema.parse('p1'), c1 = 'capital-1';
const match = (seed = 61): AlphaState => {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: `maritime-${seed}`, seed, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));
  state.players.forEach(player => { player.ambitionsChosen = true; });
  setAlphaPhase(state, 'URBAN_ACTIONS');
  return state;
};
const capital = (state: AlphaState) => state.core.players[0]!.civilization.cities[0]!;
const dryUp = (state: AlphaState) => { for (const p of hexNeighbors(state.core.map.find(t => t.id === capital(state).hexId)!)) { const tile = state.core.map.find(t => t.id === hexId(p)); if (tile && ['COAST', 'SEA'].includes(tile.terrain)) { tile.terrain = 'PLAINS'; tile.features = []; } } };
const wetten = (state: AlphaState, terrain: 'SEA' | 'COAST' = 'SEA') => { const city = state.core.map.find(t => t.id === capital(state).hexId)!; const edge = state.core.map.find(t => t.id === hexId(hexNeighbors(city)[0]!))!; edge.terrain = terrain; edge.features = []; return edge.id; };
const act = (state: AlphaState, build: Record<string, unknown>) => applyAlphaCommand(state, p1, { type: 'URBAN_ACTION', expectedVersion: state.version, cityId: c1, action: 'BUILD', build } as never);

describe('one truth for water: isNavigableWater / isCoastalCity', () => {
  it('COAST and SEA are navigable; land is not', () => {
    for (const terrain of ['COAST', 'SEA']) expect(isNavigableWater({ terrain })).toBe(true);
    for (const terrain of ['PLAINS', 'FOREST', 'HILLS', 'MOUNTAINS', 'UNKNOWN']) expect(isNavigableWater({ terrain })).toBe(false);
    expect(isNavigableWater(undefined)).toBe(false);
  });
  it('a city is coastal only with a real navigable-water edge, and the quay reaches that hex', () => {
    const state = match();
    dryUp(state);
    expect(isCoastalCity(state, c1)).toBe(false);
    expect(harborHex(state, capital(state).hexId)).toBeNull();
    const edge = wetten(state, 'COAST');
    expect(isCoastalCity(state, c1)).toBe(true);
    expect(harborHex(state, capital(state).hexId)).toBe(edge);
    const sea = state.core.map.find(t => t.id === hexId(hexNeighbors(state.core.map.find(c => c.id === capital(state).hexId)!)[1]!))!; sea.terrain = 'SEA'; sea.features = [];
    expect(waterEdges(state, capital(state).hexId)[0]).toBe(sea.id);
  });
  it('the geometric port rule and the coastal-city rule agree for a city on dry land', () => {
    const state = match(); dryUp(state);
    expect(isPort(state, capital(state).hexId)).toBe(false);
    wetten(state);
    expect(isPort(state, capital(state).hexId)).toBe(true);
  });
});

describe('Distrito Marítimo includes the basic Porto', () => {
  it('is refused in an inland city, even with the advance', () => {
    const state = match(); dryUp(state);
    state.players[0]!.research.push('web-coastal-navigation');
    const refused = act(state, { kind: 'MARITIME' });
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.error.message).toMatch(/borda d.água navegável/);
    const options = urbanOptions(state, p1).cities[c1]!.find(o => o.action === 'BUILD' && (o.build as { kind?: string } | undefined)?.kind === 'MARITIME');
    expect(options?.blocked).toMatch(/borda d.água navegável/);
  });
  it('needs the Teia advance, then builds the district and the Porto together, once, paying only the district', () => {
    const state = match(); wetten(state);
    expect(act(state, { kind: 'MARITIME' }).ok).toBe(false);
    state.players[0]!.research.push('web-coastal-navigation');
    const before = JSON.stringify(state.players[0]!.resources);
    const built = act(state, { kind: 'MARITIME' });
    expect(built.ok).toBe(true); if (!built.ok) return;
    const meta = built.value.cities.find(c => c.cityId === c1)!;
    expect(meta.districts).toContain('MARITIME');
    expect(meta.buildings).toContain('PORT');
    expect(meta.buildings.filter(b => b === 'PORT')).toHaveLength(1);
    expect(JSON.stringify(built.value.players[0]!.resources)).not.toBe(before);
    expect(AlphaStateSchema.safeParse(built.value).success).toBe(true);
    expect(act(built.value, { kind: 'MARITIME' }).ok).toBe(false);
  });
  it('the Marítimo yields +1 Food when the city produces', () => {
    const state = match(); wetten(state);
    const before = cityYield(state, c1).output.food;
    state.players[0]!.research.push('web-coastal-navigation');
    const built = act(state, { kind: 'MARITIME' }); if (!built.ok) throw new Error(built.error.message);
    expect(cityYield(built.value, c1).output.food).toBe(before + 1);
  });
});
