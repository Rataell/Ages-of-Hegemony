import { describe, expect, it } from 'vitest';
import { PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import { administration, applyAlphaCommand, beginAlphaPlanning, createAlphaGame, occupyCity } from '@aoh/game-engine';
import { completeRound } from './alpha-rounds.js';

const p1 = PlayerIdSchema.parse('p1');
function setup(): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'admin', seed: 9, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana', civilization: 'valgard' }, { id: 'p2', name: 'Beto', civilization: 'thalos' }] }));
  for (const player of state.players) player.ambitionsChosen = true;
  return state;
}
const capitalMeta = (state: AlphaState) => state.cities.find(city => city.currentOwnerId === p1)!;

describe('administration (canon V5.1a §4): load against capacity, never a zero-weight city', () => {
  it('starts at capacity 2 + capital 1 + Conselho 1 with load 1 and writes the result into the civilization record', () => {
    const state = setup();
    const admin = administration(state, p1);
    expect(admin).toMatchObject({ load: 1, capacity: 4, overextended: false, parts: { base: 2, capital: 1, government: 1, districts: 0, chancellery: 0, web: 0 } });
    expect(state.core.players[0]!.civilization).toMatchObject({ administrativeLoad: 1, administrativeCapacity: 4, administrationStatus: 'WITHIN_CAPACITY' });
  });
  it('counts an occupied city twice and credits Administrativo districts, the Chancelaria and the Web', () => {
    const state = setup();
    const meta = capitalMeta(state);
    meta.districts.push('ADMINISTRATIVE'); meta.buildings.push('CHANCELLERY');
    state.players[0]!.research.push('web-codes', 'web-urbanism');
    expect(administration(state, p1)).toMatchObject({ capacity: 2 + 1 + 1 + 1 + 1 + 2 });
    const occupied = structuredClone(meta); occupied.cityId = 'taken' as never; occupied.status = 'OCCUPIED'; occupied.capital = false; occupied.districts = []; occupied.buildings = [];
    state.cities.push(occupied);
    expect(administration(state, p1).load).toBe(3);
  });
  it('in Sobre-extensão the lowest-Ânimo city loses one level each round and no city gets a second activation', () => {
    // Three seats; the first captures the other two capitals: load 1 + 2 + 2 = 5 against capacity 4.
    let state = beginAlphaPlanning(createAlphaGame({ gameId: 'admin-3', seed: 11, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana', civilization: 'valgard' }, { id: 'p2', name: 'Beto', civilization: 'thalos' }, { id: 'p3', name: 'Caio', civilization: 'kor' }] }));
    for (const player of state.players) player.ambitionsChosen = true;
    for (const rival of ['p2', 'p3']) occupyCity(state, p1, state.core.players.find(player => player.id === rival)!.civilization.cities[0]!.id);
    const meta = capitalMeta(state);
    meta.mood = 4;
    expect(administration(state, p1)).toMatchObject({ load: 5, capacity: 4, overextended: true });
    const planned = applyAlphaCommand(state, p1, { type: 'URBAN_ACTION', expectedVersion: state.version, cityId: meta.cityId, action: 'PRODUCE' });
    expect(planned.ok, planned.ok ? '' : planned.error.message).toBe(true);
    if (planned.ok) expect(applyAlphaCommand(planned.value, p1, { type: 'URBAN_ACTION', expectedVersion: planned.value.version, cityId: meta.cityId, action: 'PRODUCE' })).toMatchObject({ ok: false });
    const moods = () => state.cities.filter(city => city.currentOwnerId === p1).reduce((total, city) => total + city.mood, 0);
    const before = moods();
    state = completeRound(state);
    expect(moods()).toBeLessThan(before);
    expect(state.events.some(event => event.type === 'ADMINISTRATIVE_OVEREXTENSION')).toBe(true);
  });
});

describe('Governar (canon §4, §10)', () => {
  it('raises Ânimo one level per Cultura or 2 Riqueza, up to the Capacity, never above Próspera', () => {
    let state = setup();
    const meta = capitalMeta(state);
    meta.mood = 2; state.players[0]!.resources.culture = 0; state.players[0]!.resources.wealth = 10;
    const wealth = state.players[0]!.resources.wealth;
    const governed = applyAlphaCommand(state, p1, { type: 'URBAN_ACTION', expectedVersion: state.version, cityId: meta.cityId, action: 'PROMOTE_MOOD' });
    if (!governed.ok) throw new Error(governed.error.message);
    state = governed.value;
    state = completeRound(state);
    // A Posto has Capacity 1: one level, 2 Riqueza.
    expect(capitalMeta(state).mood).toBe(3);
    expect(state.players[0]!.resources.wealth).toBeLessThanOrEqual(wealth - 2 + 5);
    const full = setup(); capitalMeta(full).mood = 6;
    expect(applyAlphaCommand(full, p1, { type: 'URBAN_ACTION', expectedVersion: full.version, cityId: capitalMeta(full).cityId, action: 'PROMOTE_MOOD' })).toMatchObject({ ok: false });
  });
});
