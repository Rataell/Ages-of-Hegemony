import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import { alphaUnitOptions, applyAlphaCommand, resolveBattleWithFaces, beginAlphaPlanning, blockadedBy, createAlphaGame, hexId, hexNeighbors, isPort, launchHex, recruitBlock, recruitUnit, settleCargo, suspendBlockadedRoutes } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { must } from './alpha-rounds.js';

const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
const tile = (state: AlphaState, id: string) => state.core.map.find(t => t.id === id)!;
const around = (state: AlphaState, id: string) => hexNeighbors(tile(state, id)).map(hexId).filter(n => state.core.map.some(t => t.id === n));

/**
 * A port capital: one neighbour of p1's capital becomes Coast and the next one out becomes Sea, unowned and known,
 * so the fleet has a launch hex and open water beyond it.
 */
function harbour() {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'naval', seed: 33, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));
  const capital = state.core.players[0]!.civilization.cities[0]!;
  const worked = new Set(state.core.players.flatMap(p => p.civilization.cities.flatMap(c => c.workedHexIds)));
  const coast = around(state, capital.hexId).find(id => !worked.has(id) && !state.core.players.some(p => p.civilization.cities.some(c => c.hexId === id)))!;
  const sea = around(state, coast).find(id => id !== capital.hexId && !worked.has(id) && !around(state, capital.hexId).includes(id) && !state.core.players.some(p => p.civilization.cities.some(c => c.hexId === id)))!;
  for (const id of [coast, sea]) { const t = tile(state, id); t.ownerId = null; t.controllerCityId = null; t.improvement = null; }
  tile(state, coast).terrain = 'COAST'; tile(state, sea).terrain = 'SEA';
  state.units = state.units.filter(unit => ![coast, sea].includes(unit.hexId));
  for (const player of state.players) for (const id of [coast, sea]) if (!player.knownHexIds.includes(id as never)) player.knownHexIds.push(id as never);
  state.players[0]!.era = 'EXPANSION';
  state.players[0]!.resources = { ...state.players[0]!.resources, wood: 30, stone: 30, wealth: 30, metal: 10, food: 20 };
  return { state, capital, coast, sea };
}

describe('naval vertical slice (DEC-014)', () => {
  it('lets a port capital launch a fleet on the water next to it', () => {
    const { state, capital, coast } = harbour();
    expect(isPort(state, capital.hexId)).toBe(true);
    const launch = launchHex(state, p1, capital.hexId)!;
    expect(['COAST', 'SEA']).toContain(tile(state, launch).terrain);
    expect(around(state, capital.hexId)).toContain(launch);
    expect(recruitBlock(state, p1, capital.id, 'FLEET')).toBeNull();
    recruitUnit(state, p1, capital.id, 'FLEET');
    const fleet = state.units.find(unit => unit.kind === 'FLEET')!;
    expect(fleet.hexId).toBe(launch);
    void coast;
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('embarks land pieces up to the fleet capacity, carries them, and lands them', () => {
    const { state, capital, coast, sea } = harbour();
    recruitUnit(state, p1, capital.id, 'FLEET');
    const fleet = state.units.find(unit => unit.kind === 'FLEET')!;
    const explorer = state.units.find(unit => unit.ownerId === p1 && unit.kind === 'EXPLORER')!;
    expect(alphaUnitOptions(state, p1)[explorer.id]!.embark).toContain(fleet.id);
    let next = must(state, p1, { type: 'EMBARK', unitIds: [explorer.id], fleetId: fleet.id });
    const aboard = next.units.find(unit => unit.id === explorer.id)!;
    expect(aboard.carrierId).toBe(fleet.id);
    expect(aboard.hexId).toBe(fleet.hexId);
    expect(alphaUnitOptions(next, p1)[explorer.id]!.moves).toEqual({});
    // Sailing: the fleet reaches open sea and the cargo goes with it.
    next.units.find(unit => unit.id === fleet.id)!.hexId = sea as never;
    settleCargo(next);
    expect(next.units.find(unit => unit.id === explorer.id)!.hexId).toBe(sea);
    expect(AlphaStateSchema.safeParse(next).success).toBe(true);
    // A carried piece cannot take a land MOVE order.
    const move = applyAlphaCommand(next, p1, { type: 'QUEUE_ORDER', expectedVersion: next.version, order: { id: 'o-ship', type: 'MOVE', unitIds: [explorer.id], path: [coast] } });
    expect(alphaUnitOptions(next, p1)[explorer.id]!.disembark).toContain(coast);
    expect(move.ok).toBe(false);
    next = must(next, p1, { type: 'DISEMBARK', unitIds: [explorer.id], hexId: coast });
    const ashore = next.units.find(unit => unit.id === explorer.id)!;
    expect(ashore.carrierId ?? null).toBeNull();
    expect(ashore.hexId).toBe(coast);
  });

  it('refuses cargo beyond the fleet capacity', () => {
    const { state, capital } = harbour();
    recruitUnit(state, p1, capital.id, 'FLEET');
    const fleet = state.units.find(unit => unit.kind === 'FLEET')!;
    const ids = ['a', 'b', 'c', 'd'].map(suffix => { const id = `inf-${suffix}`; state.units.push({ id, ownerId: p1, kind: 'INFANTRY', hexId: capital.hexId, recruitedRound: 1, carrierId: null }); return id; });
    expect(applyAlphaCommand(state, p1, { type: 'EMBARK', expectedVersion: state.version, unitIds: ids, fleetId: fleet.id }).ok).toBe(false);
    expect(applyAlphaCommand(state, p1, { type: 'EMBARK', expectedVersion: state.version, unitIds: ids.slice(0, 3), fleetId: fleet.id }).ok).toBe(true);
  });

  it('saves one piece on a free coast when its fleet sinks, and loses the rest', () => {
    const { state, capital, sea } = harbour();
    recruitUnit(state, p1, capital.id, 'FLEET');
    const fleet = state.units.find(unit => unit.kind === 'FLEET')!;
    fleet.hexId = sea as never;
    for (const suffix of ['a', 'b']) state.units.push({ id: `cargo-${suffix}`, ownerId: p1, kind: 'INFANTRY', hexId: sea as never, recruitedRound: 1, carrierId: fleet.id });
    state.units = state.units.filter(unit => unit.id !== fleet.id);
    settleCargo(state);
    const survivors = state.units.filter(unit => unit.id.startsWith('cargo-'));
    expect(survivors).toHaveLength(1);
    expect(tile(state, survivors[0]!.hexId).terrain).not.toBe('SEA');
    expect(survivors[0]!.carrierId ?? null).toBeNull();
  });

  it('blockades an enemy port at war: no fleet launches and its routes are cut', () => {
    const { state, capital, coast } = harbour();
    state.units.push({ id: 'raider', ownerId: p2, kind: 'FLEET', hexId: coast as never, recruitedRound: 1, carrierId: null });
    expect(blockadedBy(state, capital.hexId, p1)).toBeNull();
    state.wars.push(['p1', 'p2'] as never);
    expect(blockadedBy(state, capital.hexId, p1)).toBe(p2);
    expect(recruitBlock(state, p1, capital.id, 'FLEET')).toMatch(/bloqueado/);
    state.routes.push({ id: 'route-test', ownerId: p1, fromCityId: capital.id, toCityId: state.core.players[1]!.civilization.cities[0]!.id, path: [capital.hexId], suspended: false });
    suspendBlockadedRoutes(state);
    expect(state.routes.find(route => route.id === 'route-test')!.suspended).toBe(true);
  });

  it('shows rivals the fleet but never its cargo', () => {
    const { state, capital } = harbour();
    recruitUnit(state, p1, capital.id, 'FLEET');
    const fleet = state.units.find(unit => unit.kind === 'FLEET')!;
    const explorer = state.units.find(unit => unit.ownerId === p1 && unit.kind === 'EXPLORER')!;
    const next = must(state, p1, { type: 'EMBARK', unitIds: [explorer.id], fleetId: fleet.id });
    // Let p2 see the harbour.
    for (const id of [fleet.hexId, ...around(next, fleet.hexId)]) next.units.push({ id: `watch-${id}`, ownerId: p2, kind: 'EXPLORER', hexId: capital.hexId, recruitedRound: 1, carrierId: null });
    const view = alphaPlayerView(next, p2)!;
    expect(view.units.some(unit => unit.id === explorer.id)).toBe(false);
    expect(alphaPlayerView(next, p1)!.units.find(unit => unit.id === explorer.id)?.carrierId).toBe(fleet.id);
  });

  it('fights at sea: a sunk fleet takes its cargo down, minus what reaches the coast', () => {
    const { state, capital, coast, sea } = harbour();
    recruitUnit(state, p1, capital.id, 'FLEET');
    const fleet = state.units.find(unit => unit.kind === 'FLEET')!;
    fleet.hexId = sea as never;
    for (const suffix of ['a', 'b']) state.units.push({ id: `cargo-${suffix}`, ownerId: p1, kind: 'INFANTRY', hexId: sea as never, recruitedRound: 1, carrierId: fleet.id });
    state.units.push({ id: 'raider-1', ownerId: p2, kind: 'FLEET', hexId: coast as never, recruitedRound: 1, carrierId: null }, { id: 'raider-2', ownerId: p2, kind: 'FLEET', hexId: coast as never, recruitedRound: 1, carrierId: null });
    state.units = state.units.filter(unit => !(unit.ownerId === p1 && unit.hexId === coast));
    state.wars.push(['p1', 'p2'] as never);
    if (!state.players[1]!.knownHexIds.includes(sea as never)) state.players[1]!.knownHexIds.push(sea as never);
    const order = { id: 'naval-strike', type: 'ATTACK' as const, unitIds: ['raider-1', 'raider-2'], target: sea as never, posture: 'ASSAULT' as const };
    resolveBattleWithFaces(state, p2, order, { 'raider-1': 'IMPACT', 'raider-2': 'IMPACT', [fleet.id]: 'EMPTY' });
    const battle = state.battles.at(-1)!;
    expect(battle.defenderUnits).toEqual([fleet.id]);
    expect(battle.winnerId).toBe(p2);
    expect(state.units.some(unit => unit.id === fleet.id)).toBe(false);
    expect(state.units.filter(unit => unit.id.startsWith('cargo-')).length).toBeLessThanOrEqual(1);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });
});
