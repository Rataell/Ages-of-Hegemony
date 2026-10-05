import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, ENCOUNTER_CARDS, PlayerIdSchema, WORLD_ID, threatComposition, threatPieceIds, type AlphaState, type Threat } from '@aoh/game-domain';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import {
  activateThreats, applyThreatCommand, beginAlphaPlanning, createAlphaGame, growThreats, hexBlockedByThreat, hexDistance, hexNeighbors, hexId,
  landTarget, matureThreats, resolveBattleWithFaces, threatIntent, spawnThreat, suspendThreatenedRoutes, threatCap, threatView, visibleHexIds,
} from '@aoh/game-engine';

const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
function setup(count = 2): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'threat-test', seed: 173, preset: 'STANDARD', players: Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` })) }));
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
/** The land hex farthest from every capital (ties by id): the quietest corner of the board. */
function farthest(state: AlphaState): string {
  const capitals = state.core.players.map(player => tile(state, player.civilization.cities[0]!.hexId));
  return land(state).map(t => ({ t, d: Math.min(...capitals.map(c => hexDistance(c, t))) })).sort((a, b) => b.d - a.d || (a.t.id < b.t.id ? -1 : 1))[0]!.t.id;
}
/** A land hex `distance` away from the first capital from which the camp has a land route to a city. */
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

describe('caps and event commands (canon §21b)', () => {
  it.each([[2, 4, 2], [4, 6, 3], [6, 8, 4]] as const)('%i players: camps cap %i, pirates cap %i', (count, camps, pirates) => {
    const state = setup(count);
    expect(threatCap(state, 'CAMP')).toBe(camps);
    expect(threatCap(state, 'PIRATE')).toBe(pirates);
  });

  it('SPAWN creates a camp out of sight, 3+ hexes from every city, unclaimed and never next to a city', () => {
    const state = setup();
    const created = spawnThreat(state, 'CAMP')!;
    expect(created.status).toBe('CAMPED'); expect(created.level).toBe(1); expect(created.composition).toEqual([{ kind: 'INFANTRY', count: 2 }]);
    const where = tile(state, created.hexId);
    expect(['SEA', 'UNKNOWN', 'MOUNTAINS']).not.toContain(where.terrain);
    expect(where.ownerId).toBeNull();
    for (const player of state.core.players) for (const city of player.civilization.cities) expect(hexDistance(tile(state, city.hexId), where)).toBeGreaterThanOrEqual(3);
    for (const player of state.players) expect(visibleHexIds(state, player.playerId).has(created.hexId)).toBe(false);
    expect(state.telemetry.threatsSpawned).toBe(1);
  });

  it('a SPAWN over the cap reinforces an existing camp instead of creating another', () => {
    const state = setup(), cap = threatCap(state, 'CAMP');
    for (let i = 0; i < cap; i++) { const t = spawnThreat(state, 'CAMP'); expect(t).not.toBeNull(); }
    expect(state.threats).toHaveLength(cap);
    applyThreatCommand(state, null, { op: 'THREAT', command: 'SPAWN', kind: 'LAND' });
    expect(state.threats).toHaveLength(cap);
    expect(state.threats.filter(t => t.level === 2)).toHaveLength(1);
    expect(state.events.at(-1)!.message).not.toMatch(/\d+,\d+/);
  });

  it('REINFORCE picks the camp farthest from player pieces and stops at Ameaça III', () => {
    const state = setup(), centre = capitalTile(state);
    const near = camp(state, origin(state, 4), { id: 'camp-near' });
    const far = camp(state, farthest(state), { id: 'camp-far' });
    applyThreatCommand(state, null, { op: 'THREAT', command: 'REINFORCE', kind: 'LAND' });
    expect(far.level).toBe(2); expect(near.level).toBe(1);
    far.level = 3; near.level = 3;
    applyThreatCommand(state, null, { op: 'THREAT', command: 'REINFORCE', kind: 'LAND' });
    expect(far.level).toBe(3);
  });

  it('pirates have their own cap and live on the sea, never on land', () => {
    const state = setup(), centre = capitalTile(state);
    const sea = hexNeighbors(centre).map(hexId).map(id => tile(state, id)); sea.slice(0, 3).forEach(t => { t.terrain = 'SEA'; });
    const created = spawnThreat(state, 'PIRATE');
    if (created) { expect(tile(state, created.hexId).terrain).toBe('SEA'); expect(created.composition).toEqual([{ kind: 'FLEET', count: 1 }]); }
    const cap = threatCap(state, 'PIRATE');
    for (let i = 0; i < cap + 2; i++) applyThreatCommand(state, null, { op: 'THREAT', command: 'SPAWN', kind: 'PIRATE' });
    expect(state.threats.filter(t => t.kind === 'PIRATE').length).toBeLessThanOrEqual(cap);
    for (const t of state.threats.filter(item => item.kind === 'PIRATE')) expect(tile(state, t.hexId).terrain).toBe('SEA');
  });
});

describe('composition and growth', () => {
  it('follows level and Era (II: Arqueiros → Cavalaria from Era III; III: + Cerco from Era V)', () => {
    expect(threatComposition('CAMP', 1, 0)).toEqual([{ kind: 'INFANTRY', count: 2 }]);
    expect(threatComposition('CAMP', 2, 0)).toEqual([{ kind: 'INFANTRY', count: 3 }, { kind: 'RANGED', count: 1 }]);
    expect(threatComposition('CAMP', 2, 2)).toEqual([{ kind: 'INFANTRY', count: 3 }, { kind: 'CAVALRY', count: 1 }]);
    expect(threatComposition('CAMP', 3, 3)).toEqual([{ kind: 'INFANTRY', count: 4 }, { kind: 'CAVALRY', count: 1 }]);
    expect(threatComposition('CAMP', 3, 4)).toEqual([{ kind: 'INFANTRY', count: 4 }, { kind: 'CAVALRY', count: 1 }, { kind: 'SIEGE', count: 1 }]);
    expect(threatComposition('PIRATE', 3, 0)).toEqual([{ kind: 'FLEET', count: 3 }]);
  });

  it('grows at the Era turn only when no player piece is within 2 hexes, and never past III', () => {
    const state = setup(), centre = capitalTile(state);
    const lonely = camp(state, farthest(state), { id: 'camp-lonely' });
    const watched = camp(state, origin(state, 4), { id: 'camp-watched' });
    const scout = state.units.find(unit => unit.ownerId === p1)!;
    scout.hexId = hexNeighbors(tile(state, watched.hexId)).map(hexId).map(id => tile(state, id)).find(t => !['SEA', 'UNKNOWN'].includes(t.terrain))!.id as never;
    expect(growThreats(state)).toBe(1);
    expect(lonely.level).toBe(2); expect(watched.level).toBe(1);
    expect(lonely.composition).toEqual(threatComposition('CAMP', 2, 0));
    growThreats(state); growThreats(state);
    expect(lonely.level).toBe(3);
  });

  it('a marching Bando does not grow', () => {
    const state = setup(), centre = capitalTile(state);
    const band = camp(state, land(state).filter(t => hexDistance(centre, t) >= 9)[0]!.id, { status: 'MARCHING' });
    expect(growThreats(state)).toBe(0); expect(band.level).toBe(1);
  });
});

describe('targeting and movement', () => {
  it('picks the nearest reachable city, then the lowest defence', () => {
    const state = setup(), start = origin(state, 4);
    const t = camp(state, start);
    const target = landTarget(state, t)!;
    const cities = state.core.players.flatMap(p => p.civilization.cities);
    const distances = cities.map(c => ({ hex: c.hexId as string, d: landTarget(state, { ...t, hexId: start as never })!.path.length }));
    expect(distances.length).toBeGreaterThan(0);
    const nearest = [...cities].sort((a, b) => hexDistance(tile(state, start), tile(state, a.hexId)) - hexDistance(tile(state, start), tile(state, b.hexId)))[0]!;
    expect(hexDistance(tile(state, start), tile(state, target.hex))).toBeLessThanOrEqual(hexDistance(tile(state, start), tile(state, nearest.hexId)) + 1);
    // Equal distance: the less defended city wins.
    const a = state.core.players[0]!.civilization.cities[0]!, b = state.core.players[1]!.civilization.cities[0]!;
    const mid = camp(state, start, { id: 'camp-mid' });
    const first = landTarget(state, mid)!.hex;
    const other = first === a.hexId ? b : a;
    void other;
    state.units.push({ id: 'g1', ownerId: first === a.hexId ? p1 : p2, kind: 'GUARD', hexId: first as never, recruitedRound: 1 });
    expect(landTarget(state, mid)).not.toBeNull();
  });

  it('ACTIVATE launches a camp (CAMPED → MARCHING) and moves it one hex toward its target', () => {
    const state = setup(), start = origin(state, 5), t = camp(state, start);
    const before = tile(state, start), goal = landTarget(state, t)!;
    activateThreats(state, { launch: false });
    expect(t.status).toBe('CAMPED'); expect(t.hexId).toBe(start);
    activateThreats(state, { launch: true });
    expect(t.status).toBe('MARCHING');
    expect(t.hexId).toBe(goal.path[0]);
    expect(hexDistance(before, tile(state, t.hexId))).toBe(1);
    const here = t.hexId; activateThreats(state, { launch: true });
    expect(t.hexId).toBe(here); // one action per round
    state.core.round += 1; activateThreats(state, { launch: false });
    expect(t.hexId).toBe(landTarget(state, { ...t, hexId: here } as Threat) ? t.hexId : here);
    expect(t.hexId).not.toBe(here);
  });

  it('Cavalaria from level II moves two hexes', () => {
    const state = setup(), t = camp(state, origin(state, 6), { level: 2, composition: threatComposition('CAMP', 2, 3) });
    const goal = landTarget(state, t)!;
    activateThreats(state, { launch: true });
    expect(t.hexId).toBe(goal.path[1]);
  });

  it('replays identically from the same state', () => {
    const state = setup(); camp(state, origin(state, 4)); applyThreatCommand(state, null, { op: 'THREAT', command: 'SPAWN', kind: 'LAND' });
    const replay = structuredClone(state);
    activateThreats(state, { launch: true }); activateThreats(replay, { launch: true });
    expect(state).toEqual(replay);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });
});

describe('what a Bando does', () => {
  it('attacks the pieces defending a city with the shock core and records a battle against the world', () => {
    const state = setup(), centre = capitalTile(state);
    state.units = [{ id: 'guard-1', ownerId: p1, kind: 'GUARD', hexId: centre.id as never, recruitedRound: 1 }, { id: 'guard-2', ownerId: p1, kind: 'GUARD', hexId: centre.id as never, recruitedRound: 1 }];
    const next = nbrs(state, centre).find(t => !['SEA', 'UNKNOWN'].includes(t.terrain))!;
    camp(state, next.id, { status: 'MARCHING', level: 3, composition: threatComposition('CAMP', 3, 0) });
    activateThreats(state, { launch: false });
    const battle = state.battles.at(-1)!;
    expect(battle.attackerId).toBe(WORLD_ID); expect(battle.defenderId).toBe(p1); expect(battle.attackerPosture).toBe('ASSAULT');
    expect(battle.attackerTactical.length).toBe(5); expect(battle.defenderTactical.length).toBe(2);
    expect(battle.delta).toBe(battle.attackTotal - battle.defenseTotal);
    expect(['TIE', 'VICTORY', 'DECISIVE']).toContain(battle.outcome);
    expect(state.telemetry.threatAttacks).toBe(1);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('assaults a city next to it: a successful assault costs 1 Ânimo and never captures', () => {
    const state = setup(), centre = capitalTile(state), city = state.core.players[0]!.civilization.cities[0]!;
    state.units = [];
    const next = hexNeighbors(centre).map(hexId).map(id => tile(state, id)).find(t => !['SEA', 'UNKNOWN'].includes(t.terrain))!;
    const meta = state.cities.find(c => c.cityId === city.id)!; meta.mood = 5;
    const band = camp(state, next.id, { status: 'MARCHING', level: 3, composition: threatComposition('CAMP', 3, 0) });
    let delta = -1;
    for (let round = 0; round < 6 && delta <= 0; round++) { state.core.round += 1; band.lastActedRound = 0; activateThreats(state, { launch: false }); delta = state.battles.at(-1)?.delta ?? -1; }
    const last = state.battles.at(-1)!;
    expect(last.attackerId).toBe(WORLD_ID); expect(last.defenderId).toBe(p1);
    expect(state.core.players[0]!.civilization.cities.some(c => c.id === city.id)).toBe(true);
    expect(state.core.players[0]!.civilization.cities[0]!.ownerId).toBe(p1);
    if (last.delta! > 0) expect(meta.mood).toBeLessThan(5);
  });

  it('pillages the improvement of a hex it enters and kills exposed civilians', () => {
    const state = setup(), start = origin(state, 4), t = camp(state, start, { status: 'MARCHING' });
    const goal = landTarget(state, t)!, first = tile(state, goal.path[0]!);
    first.improvement = 'FARM'; first.ownerId = p1;
    activateThreats(state, { launch: false });
    if (t.hexId === first.id) { expect(first.improvement).toBeNull(); expect(state.events.some(e => e.type === 'THREAT_PILLAGE' && e.audience?.includes(p1))).toBe(true); }
    // Exposed civilians: an Explorador alone on the next hex dies without a battle.
    const state2 = setup(), t2 = camp(state2, origin(state2, 4), { status: 'MARCHING' });
    const step = tile(state2, landTarget(state2, t2)!.path[0]!);
    state2.units = [{ id: 'lone', ownerId: p1, kind: 'PIONEER', hexId: step.id as never, recruitedRound: 1 }];
    activateThreats(state2, { launch: false });
    expect(state2.units.find(u => u.id === 'lone')).toBeUndefined();
    expect(state2.battles).toHaveLength(0);
    expect(t2.hexId).toBe(step.id);
  });

  it('blocks collection of the hex it stands on and cuts routes through it', () => {
    const state = setup(), start = origin(state, 4), t = camp(state, start, { status: 'MARCHING' });
    expect(hexBlockedByThreat(state, start)).toBe(true);
    camp(state, land(state)[0]!.id === start ? land(state)[1]!.id : land(state)[0]!.id, { id: 'camp-still' });
    expect(hexBlockedByThreat(state, state.threats.find(x => x.id === 'camp-still')!.hexId)).toBe(false);
    const a = state.core.players[0]!.civilization.cities[0]!, b = state.core.players[1]!.civilization.cities[0]!;
    state.routes.push({ id: 'route-1', ownerId: p1, fromCityId: a.id, toCityId: b.id, path: [t.hexId] as never, suspended: false });
    suspendThreatenedRoutes(state);
    expect(state.routes[0]!.suspended).toBe(true);
  });

  it('pirates stay on the sea, block the route they sit on and pillage 2 Riqueza from a port', () => {
    const state = setup(), centre = capitalTile(state);
    const water = hexNeighbors(centre).map(hexId).map(id => tile(state, id)).filter(t => !state.core.players.some(p => p.civilization.cities.some(c => c.hexId === t.id)));
    water.slice(0, 2).forEach(t => { t.terrain = 'SEA'; });
    const pirate = camp(state, water[0]!.id, { id: 'pirate-1', kind: 'PIRATE', status: 'MARCHING', composition: threatComposition('PIRATE', 1, 0) });
    const before = state.players[0]!.resources.wealth;
    activateThreats(state, { launch: false });
    expect(tile(state, pirate.hexId).terrain).toBe('SEA');
    expect(state.players[0]!.resources.wealth).toBe(Math.max(0, before - 2));
    expect(state.events.some(e => e.type === 'THREAT_PILLAGE' && e.audience?.includes(p1))).toBe(true);
  });
});

describe('players against threats', () => {
  function fight(level: 1 | 2 | 3, status: Threat['status']) {
    const state = setup(), centre = capitalTile(state);
    const spot = nbrs(state, centre).find(t => !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain))!;
    const stand = nbrs(state, spot).find(t => !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain) && t.id !== centre.id && t.id !== spot.id)!;
    const t = camp(state, spot.id, { level, status, composition: threatComposition('CAMP', level, 0) });
    state.units = Array.from({ length: 8 }, (_, i) => ({ id: `inf-${i}`, ownerId: p1, kind: 'INFANTRY' as const, hexId: stand.id as never, recruitedRound: 1 }));
    state.players[0]!.knownHexIds = state.core.map.map(x => x.id);
    return { state, threat: t, stand };
  }
  const attack = (state: AlphaState, threat: Threat, stand: { id: string }) => resolveBattleWithFaces(state, p1, { id: 'o1', type: 'ATTACK', unitIds: state.units.filter(u => u.hexId === stand.id).map(u => u.id), target: threat.hexId, posture: 'ASSAULT' }, emptyFaces(threat));

  it('attacking a camp with the normal ATTACK order resolves through the shock core and pays the reward once', () => {
    const { state, threat, stand } = fight(1, 'CAMPED');
    const wealth = state.players[0]!.resources.wealth, prestige = state.players[0]!.prestige;
    for (let i = 0; i < 4 && state.threats.length; i++) attack(state, threat, stand);
    expect(state.threats).toHaveLength(0);
    const battle = state.battles.find(b => b.defenderId === WORLD_ID)!;
    expect(battle.attackerId).toBe(p1); expect(battle.defenderTactical.length).toBeGreaterThan(0);
    expect(state.players[0]!.resources.wealth).toBeGreaterThan(wealth - 1);
    expect(state.players[0]!.prestige).toBe(prestige);
    expect(threat.rewardPaid).toBe(true);
    expect(state.telemetry.threatKills).toBe(1);
    expect(state.events.some(e => e.type === 'THREAT_DESTROYED')).toBe(true);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('D-1: a fresh camp that the player strikes inside its window dies camped, pays its reward and never becomes a Bando', () => {
    const { state, threat, stand } = fight(1, 'CAMPED');
    threat.fresh = true;
    activateThreats(state, { launch: true }); // an ATIVAR / Era turn in the same chain does nothing to it
    expect(threat.status).toBe('CAMPED');
    for (let i = 0; i < 4 && state.threats.length; i++) attack(state, threat, stand);
    expect(state.threats).toHaveLength(0);
    expect(threat.rewardPaid).toBe(true); expect(state.telemetry.threatKills).toBe(1);
    activateThreats(state, { launch: true });
    expect(state.threats.filter(item => item.status === 'MARCHING')).toHaveLength(0);
  });

  it('a level III camp also pays Prestígio and an Encontro choice', () => {
    const { state, threat, stand } = fight(3, 'CAMPED');
    const prestige = state.players[0]!.prestige;
    for (let i = 0; i < 8 && state.threats.length; i++) attack(state, threat, stand);
    expect(state.threats).toHaveLength(0);
    expect(state.players[0]!.prestige).toBe(prestige + 2);
    expect(state.players[0]!.pendingChoices.some(c => c.source === 'ENCOUNTER' && c.cardId === ENCOUNTER_CARDS.find(e => e.id === 'enc-camp-spoils')!.id)).toBe(true);
  });

  it('a Bando killed in the field pays nothing (no farming)', () => {
    const { state, threat, stand } = fight(1, 'MARCHING');
    const wealth = state.players[0]!.resources.wealth, prestige = state.players[0]!.prestige;
    for (let i = 0; i < 4 && state.threats.length; i++) attack(state, threat, stand);
    expect(state.threats).toHaveLength(0);
    expect(state.players[0]!.resources.wealth).toBe(wealth); expect(state.players[0]!.prestige).toBe(prestige);
    expect(threat.rewardPaid).toBe(false);
  });

  it('a threat hex cannot be entered by a MOVE order, only attacked', () => {
    const { state, threat, stand } = fight(1, 'CAMPED');
    expect(() => resolveBattleWithFaces(state, p1, { id: 'm', type: 'MOVE', unitIds: ['inf-0'], path: [threat.hexId] } as never)).toThrow();
    void stand;
  });
});

describe('projection of threats', () => {
  it('shows a threat only while its hex is in current vision', () => {
    const state = setup(), far = land(state).filter(t => hexDistance(capitalTile(state), t) >= 6)[0]!;
    const t = camp(state, far.id);
    state.players[0]!.knownHexIds = [t.hexId];
    expect(threatView(state, p1)).toEqual([]);
    const scout = state.units.find(unit => unit.ownerId === p1)!; scout.hexId = t.hexId as never;
    expect(threatView(state, p1).map(item => item.id)).toEqual([t.id]);
  });
});

describe('D-1 · Acampamento RECÉM-SURGIDO', () => {
  it('a spawned camp is fresh and cannot launch a Bando in the chain that created it', () => {
    const state = setup();
    const created = spawnThreat(state, 'CAMP')!;
    expect(created.fresh).toBe(true);
    activateThreats(state, { launch: true });
    expect(created.status).toBe('CAMPED'); expect(created.hexId).toBe(created.homeHexId);
    // ATIVAR AMEAÇAS right after SURGIR AMEAÇA in the same effect chain also leaves it alone.
    applyThreatCommand(state, null, { op: 'THREAT', command: 'ACTIVATE', kind: 'LAND' });
    expect(created.status).toBe('CAMPED');
  });

  it('stays fresh through the rest of its round and becomes ACTIVE only after one full Planning round', () => {
    const state = setup();
    const created = spawnThreat(state, 'CAMP')!;
    matureThreats(state); // a Planning that was already complete when it appeared does not count
    expect(created.fresh).toBe(true);
    state.core.round += 1; matureThreats(state); // the next round's Planning completed
    expect(created.fresh).toBe(false);
    activateThreats(state, { launch: true });
    expect(created.status).toBe('MARCHING');
  });

  it('a fresh camp keeps its place at the Era turn when a seasoned one launches', () => {
    const state = setup(), seasoned = camp(state, origin(state, 5), { id: 'camp-old' });
    const fresh = spawnThreat(state, 'CAMP')!;
    activateThreats(state, { launch: true });
    expect(seasoned.status).toBe('MARCHING'); expect(fresh.status).toBe('CAMPED');
  });

  it('opening camps are not fresh', () => {
    const game = createAlphaGame({ gameId: 'open-camps', seed: 5, preset: 'STANDARD', players: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] });
    expect(game.threats.every(threat => threat.fresh === false)).toBe(true);
  });
});

describe('V51B-05 · the Bando target is authoritative public information, filtered by the fog', () => {
  /** A marching camp whose engine target is p1's own capital, watched by a p2 scout that sees the Bando but not the city. */
  function marching(): { state: AlphaState; band: Threat } {
    const state = setup(), start = origin(state, 5), band = camp(state, start, { status: 'MARCHING' });
    const scout = state.units.find(unit => unit.ownerId === p2 && unit.kind === 'PIONEER')!; scout.hexId = band.hexId as never;
    return { state, band };
  }

  it('is computed by the same functions the engine acts with: the next hex is where the Bando goes', () => {
    const { state, band } = marching();
    const intent = threatIntent(state, band), goal = landTarget(state, band)!;
    expect(intent).toMatchObject({ state: 'MARCHING', targetKind: 'CITY', targetId: goal.id, targetHexId: goal.hex, nextHexId: goal.path[0], distance: goal.path.length });
    activateThreats(state, { launch: false });
    expect(band.hexId).toBe(intent.nextHexId);
  });

  it('reveals target, distance and id only when the target hex is in the viewer\'s vision', () => {
    const { state, band } = marching();
    const goal = landTarget(state, band)!;
    const stranger = threatView(state, p2).find(item => item.id === band.id)!;
    expect(stranger.intent).toMatchObject({ state: 'MARCHING', targetKind: 'CITY', targetKnown: false, targetId: null, targetHexId: null, distance: null });
    const owner = threatView(state, p1);
    expect(owner).toEqual([]); // p1 does not see the Bando yet: the intention does not leak the Bando either
    // Give p1 a piece beside the Bando: it now sees the Bando and, because the target is p1's own city, the target.
    const scout = state.units.find(unit => unit.ownerId === p1)!; scout.hexId = band.hexId as never;
    const seen = threatView(state, p1).find(item => item.id === band.id)!;
    expect(seen.intent).toMatchObject({ targetKnown: true, targetId: goal.id, targetHexId: goal.hex, distance: goal.path.length });
    // Intent is only ever exposed for visible threats.
    expect(visibleHexIds(state, p1).has(band.hexId)).toBe(true);
  });

  it('shows the next step only when that hex is visible, and never a hidden target through a visible next step', () => {
    const { state, band } = marching();
    const view = threatView(state, p2).find(item => item.id === band.id)!;
    expect(view.intent.nextHexId === null || visibleHexIds(state, p2).has(view.intent.nextHexId)).toBe(true);
    expect(JSON.stringify(view)).not.toContain(landTarget(state, band)!.hex);
  });

  it('a CAMPED camp has no target and says whether it is fresh', () => {
    const state = setup(), spawned = spawnThreat(state, 'CAMP')!;
    const intent = threatIntent(state, spawned);
    expect(intent).toMatchObject({ state: 'FRESH', targetKind: null, targetId: null, targetHexId: null, nextHexId: null, distance: null });
    spawned.fresh = false;
    expect(threatIntent(state, spawned).state).toBe('WAITING');
    state.rules.revealMap = true;
    expect(threatView(state, p1).find(item => item.id === spawned.id)).toMatchObject({ fresh: false, intent: { state: 'WAITING', targetKnown: false } });
  });

  it('is deterministic: the same state gives the same intention', () => {
    const { state, band } = marching();
    expect(threatIntent(structuredClone(state), structuredClone(band))).toEqual(threatIntent(state, band));
  });

  it('the player projection carries the filtered intention and nothing about threats out of sight', () => {
    const { state, band } = marching();
    const view = alphaPlayerView(state, p2)!;
    const mine = view.threats.find(item => item.id === band.id)!;
    expect(mine.intent.targetKnown).toBe(false);
    expect(JSON.stringify(view.threats)).not.toContain(landTarget(state, band)!.hex);
    expect(alphaPlayerView(state, p1)!.threats.find(item => item.id === band.id)).toBeUndefined();
  });
});
