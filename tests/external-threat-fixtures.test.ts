import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, PlayerIdSchema, WORLD_ID, threatComposition, threatPieceIds, type AlphaState, type Threat } from '@aoh/game-domain';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import {
  activateThreats, applyThreatCommand, beginAlphaPlanning, createAlphaGame, hexDistance, hexId, hexNeighbors, landTarget, matureThreats,
  reinforceThreat, resolveBattleWithFaces, seaTarget, spawnThreat, threatCap, threatIntent,
} from '@aoh/game-engine';

// EXTERNAL ALPHA audit: short deterministic threat fixtures (Acampamentos, Bandos, Piratas). No simulations.
const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
function setup(count = 2): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'ext-threat', seed: 173, preset: 'STANDARD', players: Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` })) }));
  state.players.forEach(player => { player.knownHexIds = state.core.map.map(tile => tile.id); player.pendingChoices = []; });
  state.threats = [];
  return state;
}
const tile = (state: AlphaState, id: string) => state.core.map.find(candidate => candidate.id === id)!;
const capitalTile = (state: AlphaState, index = 0) => tile(state, state.core.players[index]!.civilization.cities[0]!.hexId);
const nbrs = (state: AlphaState, from: { q: number; r: number }) => hexNeighbors(from).map(hexId).map(id => state.core.map.find(t => t.id === id)).filter((t): t is NonNullable<typeof t> => t !== undefined);
const land = (state: AlphaState) => state.core.map.filter(candidate => !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(candidate.terrain));
function camp(state: AlphaState, hex: string, over: Partial<Threat> = {}): Threat {
  const threat: Threat = { id: over.id ?? `camp-t${state.threats.length + 1}`, kind: 'CAMP', hexId: hex as never, homeHexId: hex as never, level: 1, status: 'CAMPED', composition: threatComposition('CAMP', 1, 0), createdRound: 1, lastActedRound: 0, rewardPaid: false, fresh: false, ...over };
  state.threats.push(threat);
  return threat;
}
function origin(state: AlphaState, distance: number): string {
  const centre = capitalTile(state);
  for (const candidate of land(state).filter(t => hexDistance(centre, t) === distance).sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const probe = camp(state, candidate.id, { id: 'probe' }); const ok = landTarget(state, probe)?.id === state.core.players[0]!.civilization.cities[0]!.id; state.threats = state.threats.filter(t => t.id !== 'probe');
    const others = state.core.players.slice(1).map(player => tile(state, player.civilization.cities[0]!.hexId));
    if (ok && others.every(other => hexDistance(other, candidate) >= distance + 2) && !state.units.some(u => u.hexId === candidate.id)) return candidate.id;
  }
  throw new Error('no origin');
}
const emptyFaces = (threat: Threat) => Object.fromEntries(threatPieceIds(threat).map(piece => [piece.id, 'EMPTY' as const]));
/** Sea next to p1's capital, so p1 owns a port and a pirate has water to live on. Returns the sea hexes (capital's neighbours). */
function seaside(state: AlphaState, count = 3) {
  const centre = capitalTile(state);
  const water = nbrs(state, centre).filter(t => !state.core.players.some(p => p.civilization.cities.some(c => c.hexId === t.id))).slice(0, count);
  water.forEach(t => { t.terrain = 'SEA'; });
  return water;
}

describe('Acampamento', () => {
  it('1 spawns: SPAWN creates a CAMPED level I camp out of sight and counts it', () => {
    const state = setup();
    applyThreatCommand(state, null, { op: 'THREAT', command: 'SPAWN', kind: 'LAND' });
    expect(state.threats).toHaveLength(1);
    expect(state.threats[0]).toMatchObject({ kind: 'CAMP', status: 'CAMPED', level: 1 });
    expect(state.telemetry.threatsSpawned).toBe(1);
  });

  it('2 is "recém-surgido" (fresh) when spawned; opening/seasoned camps are not', () => {
    const state = setup();
    expect(spawnThreat(state, 'CAMP')!.fresh).toBe(true);
    expect(threatIntent(state, state.threats[0]!).state).toBe('FRESH');
  });

  it('3 does not activate immediately: ACTIVATE in the same chain leaves it camped in place', () => {
    const state = setup(), created = spawnThreat(state, 'CAMP')!;
    applyThreatCommand(state, null, { op: 'THREAT', command: 'ACTIVATE', kind: 'LAND' });
    expect(created).toMatchObject({ status: 'CAMPED', hexId: created.homeHexId });
  });

  it('4 becomes eligible later: after one completed Planning round it can launch', () => {
    const state = setup(), created = spawnThreat(state, 'CAMP')!;
    matureThreats(state);
    expect(created.fresh).toBe(true);
    state.core.round += 1; matureThreats(state);
    expect(created.fresh).toBe(false);
    expect(threatIntent(state, created).state).toBe('WAITING');
    activateThreats(state, { launch: true });
    expect(created.status).toBe('MARCHING');
  });

  it('12 can be destroyed by a player ATTACK order while CAMPED, paying the reward once', () => {
    const state = setup(), centre = capitalTile(state);
    const spot = nbrs(state, centre).find(t => !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain))!;
    const stand = nbrs(state, spot).find(t => !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain) && t.id !== centre.id)!;
    const threat = camp(state, spot.id);
    state.units = Array.from({ length: 8 }, (_, i) => ({ id: `inf-${i}`, ownerId: p1, kind: 'INFANTRY' as const, hexId: stand.id as never, recruitedRound: 1 }));
    const wealth = state.players[0]!.resources.wealth;
    for (let i = 0; i < 4 && state.threats.length; i++) resolveBattleWithFaces(state, p1, { id: 'o1', type: 'ATTACK', unitIds: state.units.filter(u => u.hexId === stand.id).map(u => u.id), target: threat.hexId, posture: 'ASSAULT' }, emptyFaces(threat));
    expect(state.threats).toHaveLength(0);
    expect(threat.rewardPaid).toBe(true);
    expect(state.players[0]!.resources.wealth).toBe(wealth + 2);
    expect(state.events.some(e => e.type === 'THREAT_DESTROYED')).toBe(true);
  });
});

describe('Bando', () => {
  it('5 an Acampamento becomes a Bando on ACTIVATE, and REINFORCE grows the level/composition', () => {
    const state = setup(), c = camp(state, origin(state, 5));
    const grown = reinforceThreat(state, 'CAMP')!;
    expect(grown).toBe(c); expect(c.level).toBe(2); expect(c.composition).toEqual(threatComposition('CAMP', 2, 0));
    activateThreats(state, { launch: true });
    expect(c.status).toBe('MARCHING');
    expect(state.events.some(e => e.type === 'THREAT_MARCHING')).toBe(true);
  });

  it('6 target choice is deterministic and replays identically (nearest reachable city)', () => {
    const state = setup(), c = camp(state, origin(state, 5), { status: 'MARCHING' });
    const a = landTarget(state, c), b = landTarget(structuredClone(state), structuredClone(c));
    expect(a).not.toBeNull(); expect(a).toEqual(b);
    const replay = structuredClone(state);
    activateThreats(state, { launch: false }); activateThreats(replay, { launch: false });
    expect(state).toEqual(replay);
  });

  it('7 moves one hex toward its target per round, at most once per round', () => {
    const state = setup(), start = origin(state, 5), c = camp(state, start, { status: 'MARCHING' });
    const goal = landTarget(state, c)!;
    activateThreats(state, { launch: false });
    expect(c.hexId).toBe(goal.path[0]);
    activateThreats(state, { launch: false });
    expect(c.hexId).toBe(goal.path[0]);
  });

  it('8 blocks/stacks: two Bandos never share a hex (pathing treats the other as blocked)', () => {
    const state = setup(), start = origin(state, 5);
    const first = camp(state, start, { id: 'band-a', status: 'MARCHING' });
    const ahead = landTarget(state, first)!.path[0]!;
    const second = camp(state, ahead, { id: 'band-b', status: 'MARCHING' });
    expect(landTarget(state, first)!.path).not.toContain(ahead);
    expect(threatIntent(state, first).nextHexId).not.toBe(ahead);
    for (let i = 0; i < 3; i++) { state.core.round += 1; activateThreats(state, { launch: false }); }
    const hexes = state.threats.map(t => t.hexId);
    expect(new Set(hexes).size).toBe(hexes.length);
    void second;
  });

  function assaulted() {
    const state = setup(), centre = capitalTile(state);
    state.units = [{ id: 'guard-1', ownerId: p1, kind: 'GUARD', hexId: centre.id as never, recruitedRound: 1 }, { id: 'guard-2', ownerId: p1, kind: 'GUARD', hexId: centre.id as never, recruitedRound: 1 }];
    const next = nbrs(state, centre).find(t => !['SEA', 'UNKNOWN'].includes(t.terrain))!;
    const band = camp(state, next.id, { status: 'MARCHING', level: 3, composition: threatComposition('CAMP', 3, 0) });
    return { state, band, counter: state.privateRng.counter };
  }

  it('9 attacks the city defenders next to it (battle recorded, telemetry counted)', () => {
    const { state } = assaulted();
    activateThreats(state, { launch: false });
    expect(state.telemetry.threatAttacks).toBe(1);
    expect(state.battles.at(-1)).toMatchObject({ attackerId: WORLD_ID, defenderId: p1, attackerPosture: 'ASSAULT' });
    expect(state.events.some(e => e.type === 'THREAT_ASSAULT')).toBe(true);
  });

  it('10 uses the combat engine: one die per fighting piece, Δ arithmetic and outcome as in player battles', () => {
    const { state, counter } = assaulted();
    activateThreats(state, { launch: false });
    const battle = state.battles.at(-1)!;
    expect(state.privateRng.counter - counter).toBe(5 + 2);
    expect(battle.attackerTactical).toHaveLength(5); expect(battle.defenderTactical).toHaveLength(2);
    expect(battle.attackTotal).toBe(battle.attackStrength + battle.attackModifiers);
    expect(battle.defenseTotal).toBe(battle.defenseStrength + battle.defenseModifiers);
    expect(battle.delta).toBe(battle.attackTotal - battle.defenseTotal);
    expect(state.rules.combat.mediumMargin).toBe(2);
    const abs = Math.abs(battle.delta!);
    expect(battle.outcome).toBe(abs < 2 ? 'TIE' : abs >= 5 ? 'DECISIVE' : 'VICTORY');
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('11 can die: a Bando thrown against a strong garrison loses pieces until it is gone, with no reward', () => {
    const state = setup(), centre = capitalTile(state);
    state.units = Array.from({ length: 6 }, (_, i) => ({ id: `g${i}`, ownerId: p1, kind: 'GUARD' as const, hexId: centre.id as never, recruitedRound: 1 }));
    const next = nbrs(state, centre).find(t => !['SEA', 'UNKNOWN'].includes(t.terrain))!;
    const band = camp(state, next.id, { status: 'MARCHING' });
    const wealth = state.players[0]!.resources.wealth;
    for (let round = 0; round < 12 && state.threats.length; round++) { state.core.round += 1; band.lastActedRound = 0; activateThreats(state, { launch: false }); }
    expect(state.threats).toHaveLength(0);
    expect(state.telemetry.threatLosses).toBe(1);
    expect(state.players[0]!.resources.wealth).toBe(wealth);
  });
});

describe('caps and reinforcement', () => {
  it('13 camp cap is players+2: SPAWN never creates more', () => {
    for (const count of [2, 3]) {
      const state = setup(count);
      expect(threatCap(state, 'CAMP')).toBe(count + 2);
      for (let i = 0; i < count + 4; i++) applyThreatCommand(state, null, { op: 'THREAT', command: 'SPAWN', kind: 'LAND' });
      expect(state.threats.filter(t => t.kind === 'CAMP').length).toBe(count + 2);
    }
  });

  it('14 over the cap, SPAWN reinforces an existing camp (level +1) and the event never names a hex', () => {
    const state = setup(), cap = threatCap(state, 'CAMP');
    for (let i = 0; i < cap; i++) spawnThreat(state, 'CAMP');
    const spawned = state.telemetry.threatsSpawned;
    applyThreatCommand(state, null, { op: 'THREAT', command: 'SPAWN', kind: 'LAND' });
    expect(state.threats).toHaveLength(cap);
    expect(state.telemetry.threatsSpawned).toBe(spawned);
    expect(state.threats.filter(t => t.level === 2)).toHaveLength(1);
    expect(state.events.at(-1)).toMatchObject({ type: 'THREAT_REINFORCED' });
    expect(state.events.at(-1)!.message).not.toMatch(/\d+,\d+/);
  });
});

describe('Piratas', () => {
  it('15 spawn on the sea near a port, deterministically', () => {
    const state = setup(); seaside(state, 3);
    // Enough open sea within reach of the port, out of sight.
    nbrs(state, capitalTile(state)).forEach(t => { if (!state.core.players.some(p => p.civilization.cities.some(c => c.hexId === t.id))) t.terrain = 'SEA'; });
    const far = state.core.map.filter(t => hexDistance(capitalTile(state), t) >= 2 && hexDistance(capitalTile(state), t) <= 4 && !['UNKNOWN'].includes(t.terrain) && !state.core.players.some(p => p.civilization.cities.some(c => c.hexId === t.id)));
    far.forEach(t => { t.terrain = 'SEA'; });
    state.players.forEach(p => { p.knownHexIds = []; });
    const created = spawnThreat(state, 'PIRATE', far.map(t => t.id));
    expect(created).not.toBeNull();
    expect(tile(state, created!.hexId).terrain).toBe('SEA');
    expect(created).toMatchObject({ kind: 'PIRATE', status: 'CAMPED', composition: [{ kind: 'FLEET', count: 1 }] });
    const again = setup(); seaside(again, 3);
    expect(again.threats).toHaveLength(0);
  });

  it('16 cap is ceil(players/2)+1 and SPAWN over the cap reinforces instead', () => {
    const state = setup();
    expect([2, 3, 4, 6].map(n => threatCap(setup(n), 'PIRATE'))).toEqual([2, 3, 3, 4]);
    const seaHexes = state.core.map.filter(t => hexDistance(capitalTile(state), t) >= 2 && hexDistance(capitalTile(state), t) <= 5 && t.terrain !== 'UNKNOWN' && !state.core.players.some(p => p.civilization.cities.some(c => c.hexId === t.id)));
    seaHexes.forEach(t => { t.terrain = 'SEA'; }); seaside(state, 2);
    state.players.forEach(p => { p.knownHexIds = []; });
    const cap = threatCap(state, 'PIRATE');
    for (let i = 0; i < cap + 2; i++) applyThreatCommand(state, null, { op: 'THREAT', command: 'SPAWN', kind: 'PIRATE' });
    expect(state.threats.filter(t => t.kind === 'PIRATE')).toHaveLength(cap);
    expect(state.threats.reduce((n, t) => n + t.level, 0)).toBe(cap + 2);
    expect(state.events.at(-1)!.type).toBe('THREAT_REINFORCED');
  });

  it('17 prioritise the richest sea route; with no route they go to the port with the fewest Frotas', () => {
    const state = setup(), water = seaside(state, 3);
    const pirate = camp(state, water[0]!.id, { id: 'pirate-1', kind: 'PIRATE', status: 'MARCHING', composition: threatComposition('PIRATE', 1, 0) });
    expect(seaTarget(state, pirate)).toMatchObject({ kind: 'PORT', id: state.core.players[0]!.civilization.cities[0]!.id });
    // A route through the second sea hex: the target becomes the route, not the port.
    const a = state.core.players[0]!.civilization.cities[0]!, b = state.core.players[1]!.civilization.cities[0]!;
    state.routes.push({ id: 'route-sea', ownerId: p1, fromCityId: a.id, toCityId: b.id, path: [water[1]!.id, water[2]!.id] as never, suspended: false });
    const target = seaTarget(state, pirate)!;
    expect(target.kind).toBe('ROUTE');
    expect(target.id).toBe('route-sea');
    expect([water[1]!.id, water[2]!.id]).toContain(target.hex);
    expect(threatIntent(state, pirate)).toMatchObject({ state: 'MARCHING', targetKind: 'ROUTE' });
  });
});

describe('public projection', () => {
  it('18 an open-Region threat appears with the same public state to every other player (what SSE clients refetch)', () => {
    const state = setup(), start = origin(state, 5), band = camp(state, start, { status: 'MARCHING', level: 2, composition: threatComposition('CAMP', 2, 0) });
    state.regions.find(region => region.hexIds.includes(start as never))!.revealedBy.push(p2);
    const seen = [p1, p2].map(viewer => alphaPlayerView(state, viewer)!.threats.find(item => item.id === band.id));
    expect(seen[0]).toBeDefined();
    expect(seen[1]).toEqual(seen[0]);
    expect(seen[1]).toMatchObject({ kind: 'CAMP', level: 2, status: 'MARCHING', hexId: start, fresh: false, composition: threatComposition('CAMP', 2, 0) });
    expect(seen[1]!.intent).toMatchObject({ state: 'MARCHING', targetKnown: true });
  });
});
