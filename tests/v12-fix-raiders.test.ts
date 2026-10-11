import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, PlayerIdSchema, THREAT_NAMES, threatComposition, type AlphaState, type Threat } from '@aoh/game-domain';
import { activateThreats, beginAlphaPlanning, createAlphaGame, hexDistance, landTarget, payThreatReward, threatAt, threatIntent, threatName, validateMilitaryOrder } from '@aoh/game-engine';

/**
 * Alpha V1.2 · R1 (Saqueadores). Before: a Bando that reached a city stayed next to it, alive and MARCHING, and assaulted it again every odd round
 * (967 assaults in 22 audited matches); each win cost the city 1 Ânimo. Now: Acampamento → approach → assault → result → recuo (legal steps back to the Acampamento,
 * in the field, attackable, no assault on the way) → reorganização (camped, one full round) → a new incursion only when it is launched again.
 */
const p1 = PlayerIdSchema.parse('p1');
function setup(): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'r1', seed: 173, preset: 'STANDARD', players: [{ id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' }] }));
  state.players.forEach(player => { player.knownHexIds = state.core.map.map(tile => tile.id); player.pendingChoices = []; });
  state.threats = [];
  return state;
}
const tile = (state: AlphaState, id: string) => state.core.map.find(candidate => candidate.id === id)!;
const land = (state: AlphaState) => state.core.map.filter(candidate => !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(candidate.terrain));
const capital = (state: AlphaState, index = 0) => tile(state, state.core.players[index]!.civilization.cities[0]!.hexId);
function camp(state: AlphaState, hex: string, over: Partial<Threat> = {}): Threat {
  const threat: Threat = { id: 'camp-r1', kind: 'CAMP', hexId: hex as never, homeHexId: hex as never, level: 3, status: 'CAMPED', composition: threatComposition('CAMP', 3, 0), createdRound: 1, lastActedRound: 0, rewardPaid: false, fresh: false, withdrawing: false, readyRound: 0, ...over };
  state.threats.push(threat);
  return threat;
}
/** A land hex 4 away from the first capital with a land route to it, and far from the other capital. */
function origin(state: AlphaState): string {
  const centre = capital(state), other = capital(state, 1);
  for (const candidate of land(state).filter(t => hexDistance(centre, t) === 4).sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (hexDistance(other, candidate) < 6 || state.units.some(unit => unit.hexId === candidate.id) || candidate.ownerId !== null) continue;
    const probe = camp(state, candidate.id, { id: 'probe' }); const ok = landTarget(state, probe)?.hex === centre.id; state.threats = [];
    if (ok) return candidate.id;
  }
  throw new Error('no origin');
}
/** One round's activation of the threats. Odd rounds move the marching ones; `launch` is the Era turn / ATIVAR AMEAÇAS. */
const step = (state: AlphaState, round: number, launch = false) => { state.core.round = round; activateThreats(state, { launch }); };
const assaults = (state: AlphaState) => state.events.filter(event => event.type === 'THREAT_ASSAULT').length;

/** Runs the cycle until the Bando has assaulted the city once and walks back; returns the trace. */
function runCycle(state: AlphaState, band: Threat) {
  const trace: { round: number; hex: string; status: string; withdrawing: boolean }[] = [];
  step(state, 1, true);                                              // the Era turn launches it (and moves it once)
  const launched = band.hexId;
  for (let round = 3; round <= 41; round += 2) {
    step(state, round);
    trace.push({ round, hex: band.hexId, status: band.status, withdrawing: band.withdrawing });
    if (band.status === 'CAMPED') break;
  }
  return { trace, launched };
}

describe('R1 · the cycle: approach, one assault, withdrawal, reorganization', () => {
  it('a Bando assaults a city once, walks back one legal hex at a time and camps again at its own Acampamento', () => {
    const state = setup(), home = origin(state), band = camp(state, home);
    const { trace, launched } = runCycle(state, band);
    expect(assaults(state)).toBe(1);                                            // not one assault per odd round
    expect(band.status).toBe('CAMPED'); expect(band.hexId).toBe(home); expect(band.homeHexId).toBe(home);
    expect(band.withdrawing).toBe(false); expect(band.fresh).toBe(false);
    // Nothing teleports: between two activations it moves at most `speed` hexes (2: an Ameaça III has Cavalaria), the withdrawal walks only on land and ends exactly at home.
    let previous: string = launched;
    for (const entry of trace) { expect(hexDistance(tile(state, previous), tile(state, entry.hex)), `round ${entry.round}`).toBeLessThanOrEqual(2); expect(['SEA', 'UNKNOWN']).not.toContain(tile(state, entry.hex).terrain); previous = entry.hex as string; }
    expect(trace.some(entry => entry.withdrawing)).toBe(true);                  // it was seen withdrawing in the field
    expect(state.events.some(event => event.type === 'THREAT_WITHDRAWING')).toBe(true);
    expect(state.events.some(event => event.type === 'THREAT_REGROUPING')).toBe(true);
  });

  it('a city suffers one assault (and one Ânimo) per incursion, not one per odd round', () => {
    const state = setup(), band = camp(state, origin(state));
    const city = state.cities.find(entry => entry.currentOwnerId === p1)!; city.mood = 6;
    step(state, 1, true);
    for (let round = 3; round <= 25; round += 2) step(state, round);            // twelve odd rounds without a new launch
    expect(assaults(state)).toBe(1);
    expect(city.mood).toBeGreaterThanOrEqual(5);                                // at most the one assault's -1
    expect(band.status).toBe('CAMPED');
  });

  it('reorganization lasts one full round: it cannot be launched the round it came home, and can the next one', () => {
    const state = setup(), band = camp(state, origin(state));
    const arrival = runCycle(state, band).trace.at(-1)!.round;
    expect(band.readyRound).toBe(arrival + 1);
    step(state, arrival, true);                                                 // ATIVAR AMEAÇAS in the very round it arrived
    expect(band.status).toBe('CAMPED');
    step(state, arrival + 1, true);                                             // one full round later
    expect(band.status).toBe('MARCHING');
    for (let round = arrival + 2; round <= arrival + 40 && assaults(state) < 2; round += 2) step(state, round);
    expect(assaults(state)).toBe(2);                                            // a new incursion is possible
  });

  it('the Bando is not invulnerable while it withdraws: it is a MARCHING threat in the field, a legal target, and pays no reward', () => {
    const state = setup(), band = camp(state, origin(state));
    step(state, 1, true);
    for (let round = 3; round <= 41 && !band.withdrawing; round += 2) step(state, round);
    expect(band.withdrawing).toBe(true);
    expect(band.status).toBe('MARCHING');
    expect(threatAt(state, band.hexId)).toBe(band);
    expect(threatIntent(state, band).state).toBe('WITHDRAWING');
    payThreatReward(state, p1, band);
    expect(band.rewardPaid).toBe(false);                                        // Bandos in the field pay nothing (no farming)
    // An own piece next to it can order the attack (the validator does not forbid threats).
    const neighbour = land(state).find(t => hexDistance(tile(state, band.hexId), t) === 1 && !state.threats.some(other => other.hexId === t.id) && !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain))!;
    state.units.push({ id: 'striker', ownerId: p1, kind: 'INFANTRY', hexId: neighbour.id as never, recruitedRound: 1 });
    state.players.find(player => player.playerId === p1)!.knownHexIds = state.core.map.map(t => t.id);
    expect(() => validateMilitaryOrder(state, p1, { id: 'o1', type: 'ATTACK', unitIds: ['striker'], target: band.hexId, posture: 'ASSAULT' } as never)).not.toThrow();
  });

  it('a camped Bando that is destroyed pays its reward once; the destroyed camp leaves no phantom home', () => {
    const state = setup(), band = camp(state, origin(state));
    const wealth = state.players.find(player => player.playerId === p1)!.resources.wealth;
    payThreatReward(state, p1, band);
    expect(band.rewardPaid).toBe(true);
    expect(state.players.find(player => player.playerId === p1)!.resources.wealth).toBeGreaterThan(wealth);
    payThreatReward(state, p1, band);
    expect(state.players.find(player => player.playerId === p1)!.resources.wealth).toBe(wealth + 4);   // Ameaça III: 4 Riqueza, once
  });
});

describe('R1 · when the Acampamento is no longer there', () => {
  /** Drives the Bando until it starts walking back, then lets the caller change the world before the next step. */
  function withdrawing() {
    const state = setup(), home = origin(state), band = camp(state, home);
    step(state, 1, true);
    let round = 3;
    for (; round <= 41 && !band.withdrawing; round += 2) step(state, round);
    return { state, band, home, round };
  }

  it('a home that was claimed by a civilization is replaced by the nearest valid site, 3+ hexes from every city, and the Bando camps there', () => {
    const { state, band, home, round } = withdrawing();
    tile(state, home).ownerId = p1;                                             // the player took the camp ground
    let at = round;
    for (; at <= round + 40 && band.status !== 'CAMPED'; at += 2) step(state, at);
    expect(band.status).toBe('CAMPED');
    expect(band.homeHexId).not.toBe(home);
    expect(band.hexId).toBe(band.homeHexId);
    expect(tile(state, band.homeHexId).ownerId).toBeNull();
    for (const player of state.core.players) for (const city of player.civilization.cities) expect(hexDistance(tile(state, city.hexId), tile(state, band.homeHexId))).toBeGreaterThanOrEqual(3);
  });

  it('with nowhere left to camp the Bando disperses, with a public event, without a reward and without a dangling destination', () => {
    const { state, band, home, round } = withdrawing();
    for (const t of state.core.map) if (t.ownerId === null) t.ownerId = p1;      // every free hex is claimed
    tile(state, home).ownerId = p1;
    step(state, round);
    expect(state.threats.includes(band)).toBe(false);
    expect(state.events.some(event => event.type === 'THREAT_DISPERSED')).toBe(true);
    expect(state.threats).toHaveLength(0);
  });
});

describe('R1 · compatibility and names', () => {
  it('a save written before R1 loads (the Bando keeps its old behaviour fields at defaults)', () => {
    const state = setup(); camp(state, origin(state));
    const raw = JSON.parse(JSON.stringify(state)) as { threats: Record<string, unknown>[] };
    for (const threat of raw.threats) { delete threat.withdrawing; delete threat.readyRound; }
    const parsed = AlphaStateSchema.parse(raw);
    expect(parsed.threats[0]).toMatchObject({ withdrawing: false, readyRound: 0 });
  });

  it('the visible name is Saqueadores (single source THREAT_NAMES), Piratas stay separate, internal ids are untouched', () => {
    expect(THREAT_NAMES.CAMP).toEqual({ camp: 'Acampamento de Saqueadores', band: 'Bando de Saqueadores', short: 'Saqueadores' });
    expect(THREAT_NAMES.PIRATE.band).toBe('Piratas');
    expect(threatName({ kind: 'CAMP', status: 'CAMPED' })).toBe('Acampamento de Saqueadores');
    expect(threatName({ kind: 'CAMP', status: 'MARCHING' })).toBe('Bando de Saqueadores');
    expect(threatName({ kind: 'PIRATE', status: 'CAMPED' })).toBe('Ancoradouro pirata');
    const state = setup(); const band = camp(state, origin(state));
    expect(band.kind).toBe('CAMP'); expect(band.id).toBe('camp-r1');
  });

  it('no visible string of the game still says "bárbaro"', () => {
    for (const file of ['../packages/game-domain/src/alpha-threats.ts', '../packages/game-engine/src/alpha-discoveries.ts', '../packages/game-engine/src/alpha-threats.ts', '../apps/web/app/alpha/alpha-board.tsx']) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8').split('\n').filter(line => !/^\s*(\/\/|\*|\/\*\*)/.test(line)).join('\n');
      expect(source, file).not.toMatch(/b[aá]rbar/i);
    }
  });
});
