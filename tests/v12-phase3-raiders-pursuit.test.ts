import { describe, expect, it } from 'vitest';
import { PlayerIdSchema, threatComposition, type AlphaState, type AlphaUnit, type Threat } from '@aoh/game-domain';
import { activateThreats, beginAlphaPlanning, createAlphaGame, hexDistance, resolveBattleWithFaces, resolveOrders, threatAlerts, threatAt, threatIntent, threatPieces, validateMilitaryOrder, visibleHexIds } from '@aoh/game-engine';

/**
 * Alpha V1.2 · Phase 3 · Saqueadores, seen from the player's side (the policies of the simulations never attack a Bando, so R1 had no evidence of the answer).
 * One deterministic story on the real engine: the player locates an Acampamento, sees the Bando approach, defends the city, counter-attacks the Bando while it
 * withdraws, chases it, and destroys the Acampamento it came home to. The Bando is never invulnerable and never teleports: every position it takes is a legal hex at
 * most `speed` steps from the previous one, and from every one of them an adjacent piece can legally order the attack.
 */
const p1 = PlayerIdSchema.parse('p1');
type Faces = Record<string, 'IMPACT' | 'EMPTY'>;
const tile = (state: AlphaState, id: string) => state.core.map.find(candidate => candidate.id === id)!;
const land = (state: AlphaState) => state.core.map.filter(candidate => !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(candidate.terrain));
const capital = (state: AlphaState, index = 0) => tile(state, state.core.players[index]!.civilization.cities[0]!.hexId);
const ownCityHex = (state: AlphaState) => capital(state).id;

function setup(): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'r1-pursuit', seed: 173, preset: 'STANDARD', players: [{ id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' }] }));
  state.players.forEach(player => { player.knownHexIds = state.core.map.map(t => t.id); player.pendingChoices = []; });
  state.threats = []; state.units = state.units.filter(unit => unit.ownerId !== p1 || unit.kind === 'PIONEER');
  return state;
}
function camp(state: AlphaState, hex: string): Threat {
  const threat: Threat = { id: 'camp-p3', kind: 'CAMP', hexId: hex as never, homeHexId: hex as never, level: 2, status: 'CAMPED', composition: threatComposition('CAMP', 2, 0), createdRound: 1, lastActedRound: 0, rewardPaid: false, fresh: false, withdrawing: false, readyRound: 0 };
  state.threats.push(threat);
  return threat;
}
/** An unclaimed land hex 4 steps from the capital, with a land route to it, far from the other capital (so the Bando's nearest city is p1's). */
function origin(state: AlphaState): string {
  const centre = capital(state), other = capital(state, 1);
  for (const candidate of land(state).filter(t => hexDistance(centre, t) === 4).sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (hexDistance(other, candidate) < 6 || state.units.some(unit => unit.hexId === candidate.id) || candidate.ownerId !== null) continue;
    const probe = camp(state, candidate.id); const ok = activateReach(state, probe); state.threats = [];
    if (ok) return candidate.id;
  }
  throw new Error('no origin');
}
const activateReach = (state: AlphaState, probe: Threat): boolean => threatIntent(state, { ...probe, status: 'MARCHING' }).targetHexId === ownCityHex(state);
const step = (state: AlphaState, round: number, launch = false) => { state.core.round = round; activateThreats(state, { launch }); };
let serial = 0;
const put = (state: AlphaState, kind: AlphaUnit['kind'], hex: string): AlphaUnit => { const unit = { id: `p1-${kind.toLowerCase()}-${++serial}`, ownerId: p1, kind, hexId: hex as never, recruitedRound: 1, carrierId: null } as AlphaUnit; state.units.push(unit); return unit; };
const order = (units: AlphaUnit[], target: string, id = 'atk') => ({ id, type: 'ATTACK' as const, unitIds: units.map(unit => unit.id), target: target as never, posture: 'ASSAULT' as const });
const faces = (attackers: AlphaUnit[], threat: Threat, attack: 'IMPACT' | 'EMPTY', defence: 'IMPACT' | 'EMPTY'): Faces =>
  ({ ...Object.fromEntries(attackers.map(unit => [unit.id, attack])), ...Object.fromEntries(threatPieces(threat).map(piece => [piece.id, defence])) });
/** The player's attack, through the real validation and battle code (dice fixed so the story is the same on every run). */
function attack(state: AlphaState, attackers: AlphaUnit[], threat: Threat, attackFace: 'IMPACT' | 'EMPTY', defenceFace: 'IMPACT' | 'EMPTY') {
  const command = order(attackers, threat.hexId);
  resolveBattleWithFaces(state, p1, command, faces(attackers, threat, attackFace, defenceFace));
  return state.battles.at(-1)!;
}
/** A MOVE through the real resolver. It re-parses the state, so the threat objects held by the test are put back (the resolver does not touch threats). */
const moveTo = (state: AlphaState, units: AlphaUnit[], path: string[]) => {
  const threats = state.threats;
  state.players.find(player => player.playerId === p1)!.orders = [{ id: `mv-${++serial}`, type: 'MOVE', unitIds: units.map(unit => unit.id), path }] as never;
  resolveOrders(state, ['MOVE']);
  state.players.find(player => player.playerId === p1)!.orders = [];
  state.threats = threats;
  const failed = state.events.filter(event => event.type === 'ORDER_FAILED').at(-1);
  for (const unit of units) expect(state.units.find(other => other.id === unit.id)!.hexId, `move to ${path.at(-1)} (${failed?.message ?? 'ok'})`).toBe(path.at(-1));
};
/** Land path from `from` toward `to`, one hex at a time, each hex adjacent to the last and passable. */
function walk(state: AlphaState, from: string, to: string, steps: number): string[] {
  const out: string[] = []; let at = tile(state, from);
  const goal = tile(state, to);
  while (out.length < steps && at.id !== goal.id) {
    const next = land(state).filter(t => hexDistance(at, t) === 1 && !state.threats.some(th => th.hexId === t.id) && !state.units.some(u => u.hexId === t.id && u.ownerId !== p1)).sort((a, b) => hexDistance(a, goal) - hexDistance(b, goal) || (a.id < b.id ? -1 : 1))[0];
    if (!next || hexDistance(next, goal) >= hexDistance(at, goal)) break;
    out.push(next.id); at = next;
  }
  return out;
}

describe('Saqueadores · the player locates, defends, counter-attacks, chases and destroys', () => {
  const trace: { round: number; what: string; hex: string; withdrawing: boolean }[] = [];
  const story = (explored = true) => {
    const state = setup(), home = origin(state), band = camp(state, home), city = ownCityHex(state);
    if (explored) for (const region of state.regions) if (region.hexIds.some(id => hexDistance(tile(state, id), tile(state, city)) <= 6) && !region.revealedBy.includes(p1)) region.revealedBy.push(p1);   // the Regions around the Pátria are explored
    const record = (round: number, what: string) => trace.push({ round, what, hex: band.hexId, withdrawing: band.withdrawing });
    return { state, home, band, city, record };
  };

  it('1 · locates: opening its Region puts the Acampamento on the table, and the Bando shows as an alert when it marches', () => {
    const { state, home, band } = story(false);
    expect(visibleHexIds(state, p1).has(home)).toBe(false);                      // far from every own piece: the Acampamento is not on the player\'s table
    // Visibility is by Region (no radius): the player locates the Acampamento by opening its Region (Pioneiro / Move + Descoberta).
    state.regions.find(region => region.hexIds.includes(home as never))!.revealedBy.push(p1);
    expect(visibleHexIds(state, p1).has(home)).toBe(true);                       // located
    expect(threatAt(state, home)).toBe(band);
    expect(threatIntent(state, band).state).toBe('WAITING');
    step(state, 1, true);
    expect(band.status).toBe('MARCHING');
    if (process.env.AOH_TRACE) console.log(JSON.stringify({ band: band.hexId, home, city: ownCityHex(state), d: hexDistance(tile(state, band.hexId), tile(state, ownCityHex(state))) }));
    let alerts = threatAlerts(state, p1);
    for (let round = 3; round <= 11 && alerts.length === 0; round += 2) { step(state, round); alerts = threatAlerts(state, p1); }
    expect(alerts.length).toBeGreaterThan(0);                                    // "Saqueadores a N hex da cidade", before the assault
    expect(alerts[0]!.distance).toBeLessThanOrEqual(3);
    expect(state.events.some(event => event.type === 'THREAT_ASSAULT')).toBe(false);
  });

  it('2 · the whole story: defence, counter-attack on the Bando in recuo, chase, and the Acampamento destroyed', () => {
    const { state, home, band, city, record } = story();
    for (const kind of ['INFANTRY', 'INFANTRY', 'INFANTRY', 'GUARD'] as const) put(state, kind, city);   // the garrison
    const owner = () => state.players.find(player => player.playerId === p1)!;       // the resolver re-parses the state: always read the live seat
    const wealth = owner().resources.wealth;
    record(0, 'camped');

    step(state, 1, true); record(1, 'launched');
    expect(band.status).toBe('MARCHING');
    let round = 3;
    for (; round <= 9 && !band.withdrawing; round += 2) { step(state, round); record(round, 'approach'); }
    expect(band.withdrawing).toBe(true);                                         // it assaulted the city once and started to walk back
    expect(state.events.filter(event => event.type === 'THREAT_ASSAULT')).toHaveLength(1);
    expect(state.core.players[0]!.civilization.cities.some(entry => entry.hexId === city)).toBe(true);
    expect(state.occupations.some(entry => entry.cityId === state.core.players[0]!.civilization.cities[0]!.id)).toBe(false);   // defended: the city was not taken
    expect(state.units.some(unit => unit.ownerId === p1 && unit.hexId === city)).toBe(true);                                    // and the garrison still stands

    // It is in the field, withdrawing, visible and attackable from the city: a legal target (not invulnerable).
    expect(threatAt(state, band.hexId)).toBe(band);
    expect(hexDistance(tile(state, band.hexId), tile(state, city))).toBeLessThanOrEqual(2);
    // Counter-attack with a detachment from the city. A piece next to the Bando orders it; one further away is told so.
    const strikers = state.units.filter(unit => unit.ownerId === p1 && unit.hexId === city && unit.kind === 'INFANTRY');
    const adjacent = hexDistance(tile(state, band.hexId), tile(state, city)) === 1;
    if (!adjacent) moveTo(state, strikers, walk(state, city, band.hexId, 1));
    const fieldBefore = threatPieces(band).length;
    const first = attack(state, strikers, band, 'IMPACT', 'EMPTY');
    record(round, 'counter-attack');
    if (process.env.AOH_TRACE) console.log(JSON.stringify({ first, comp: band.composition, fieldBefore, strikers: strikers.length }));
    expect(first.defenderId).toBe('world');
    expect(first.attackerId).toBe(p1);
    expect(state.threats.includes(band)).toBe(true);                             // a victory costs it pieces, not necessarily its life
    expect(threatPieces(band).length).toBeLessThan(fieldBefore);                 // but it hurt it
    expect(band.withdrawing).toBe(true);                                         // and the Bando keeps walking home

    // The chase: while it walks (2 hexes per odd round) the player follows it with the rest of the detachment; it never leaves the table and never jumps.
    const pursuerIds = state.units.filter(unit => unit.ownerId === p1 && unit.kind === 'INFANTRY').map(unit => unit.id);
    const pursuers = () => pursuerIds.map(id => state.units.find(unit => unit.id === id)).filter((unit): unit is AlphaUnit => unit !== undefined);
    let previous = band.hexId as string, moves = 0;
    for (round += 1; round <= 24 && band.status !== 'CAMPED'; round += 1) {
      if (round % 2 === 1) {
        step(state, round); record(round, 'withdrawing');
        expect(hexDistance(tile(state, previous), tile(state, band.hexId)), `no teleport at round ${round}`).toBeLessThanOrEqual(2);
        expect(['SEA', 'UNKNOWN']).not.toContain(tile(state, band.hexId).terrain);
        previous = band.hexId as string; moves++;
      } else if ((band.status as string) !== 'CAMPED') {
        // the pursuers close in without attacking on the way: a legal MOVE, never an entry into the Bando\'s own hex
        const lead = tile(state, pursuers()[0]!.hexId);
        const path = walk(state, lead.id, band.hexId, 2).filter(id => id !== band.hexId);
        if (path.length) moveTo(state, pursuers(), path);
      }
    }
    expect(moves).toBeGreaterThan(0);
    if (process.env.AOH_TRACE) console.log(JSON.stringify({ trace, band: { hex: band.hexId, home, st: band.status, w: band.withdrawing }, homeHex: band.homeHexId, units: state.units.filter(u => u.ownerId === p1).map(u => [u.kind, u.hexId]) }));
    expect(band.status).toBe('CAMPED');                                          // it came home: not stuck in the field, not teleported
    expect(band.hexId).toBe(home);
    expect(band.readyRound).toBeGreaterThan(0);                                  // reorganizing
    expect(threatAt(state, home)).toBe(band);

    // The Acampamento is a legal target again, and destroying it pays once and leaves nothing behind.
    const assaulters = () => state.units.filter(unit => unit.ownerId === p1 && unit.kind === 'INFANTRY');
    const front = walk(state, assaulters()[0]!.hexId, home, 6);      // closes in; the walk never steps onto the Acampamento itself
    if (front.length) moveTo(state, assaulters(), front);
    const near = assaulters().filter(unit => hexDistance(tile(state, unit.hexId), tile(state, home)) === 1);
    expect(near.length).toBeGreaterThan(0);
    expect(() => validateMilitaryOrder(state, p1, order(near, home))).not.toThrow();
    for (let guard = 0; guard < 6 && state.threats.includes(band); guard++) attack(state, assaulters().filter(unit => hexDistance(tile(state, unit.hexId), tile(state, home)) === 1), band, 'IMPACT', 'EMPTY');
    expect(state.threats.includes(band)).toBe(false);                            // destroyed
    expect(band.rewardPaid).toBe(true);
    expect(owner().resources.wealth).toBeGreaterThan(wealth);                    // the reward: paid once
    expect(threatAt(state, home)).toBeUndefined();
    step(state, round + 2, true);                                                // nothing is left to launch, nothing dangling
    expect(state.threats).toHaveLength(0);
    if (process.env.AOH_TRACE) console.log(JSON.stringify(trace));
  });
});
