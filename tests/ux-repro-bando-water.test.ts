import { describe, expect, it } from 'vitest';
import { threatComposition, type AlphaState, type MapPreset, type Threat } from '@aoh/game-domain';
import { activateThreats, beginAlphaPlanning, createAlphaGame, hexDistance, landTarget, spawnThreat, threatIntent } from '@aoh/game-engine';

/**
 * UX repro A (RC5 playtest): "Saqueadores atravessaram agua". Deterministic audit of every hex a Bando / Pirata visits and its terrain.
 * Engine facts under test (alpha-threats.ts): land Bandos use BFS over tiles where terrain is not SEA/UNKNOWN (so COAST is LAND for them);
 * Piratas use BFS over SEA only. Nothing here edits production code.
 */
const TWO = [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }];
const world = (seed: number, worldPreset: MapPreset = 'MIXED'): AlphaState => {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'ux-repro-bando', seed, preset: 'QUICK', worldPreset, mapSize: 'STANDARD', players: TWO }));
  state.players.forEach(player => { player.knownHexIds = state.core.map.map(tile => tile.id); player.pendingChoices = []; });
  state.threats = [];
  return state;
};
const tileOf = (state: AlphaState, id: string) => state.core.map.find(tile => tile.id === id)!;
const capital = (state: AlphaState, index: number) => tileOf(state, state.core.players[index]!.civilization.cities[0]!.hexId);
const isCity = (state: AlphaState, id: string) => state.core.players.some(p => p.civilization.cities.some(c => c.hexId === id));
const camp = (state: AlphaState, hex: string, over: Partial<Threat> = {}): Threat => {
  const threat: Threat = { id: 'camp-ux', kind: 'CAMP', hexId: hex as never, homeHexId: hex as never, level: 1, status: 'CAMPED', composition: threatComposition('CAMP', 1, 0), createdRound: 1, lastActedRound: 0, rewardPaid: false, fresh: false, withdrawing: false, readyRound: 0, ...over };
  state.threats.push(threat);
  return threat;
};
const pirate = (state: AlphaState, hex: string): Threat => {
  const threat: Threat = { id: 'pirate-ux', kind: 'PIRATE', hexId: hex as never, homeHexId: hex as never, level: 1, status: 'CAMPED', composition: threatComposition('PIRATE', 1, 0), createdRound: 1, lastActedRound: 0, rewardPaid: false, fresh: false, withdrawing: false, readyRound: 0 };
  state.threats.push(threat);
  return threat;
};
/** Hexes by exact distance band around a centre. */
const ring = (state: AlphaState, centre: { q: number; r: number }, from: number, to = from) => state.core.map.filter(t => { const d = hexDistance(centre, t); return d >= from && d <= to; });
/** Isolates the second capital's surroundings (so only the first city is a target) by drowning a ring of radius 2 around it. */
const isolateOtherCapital = (state: AlphaState) => { for (const t of ring(state, capital(state, 1), 2)) if (!isCity(state, t.id)) t.terrain = 'SEA'; };
/** Runs `rounds` activations (launch on the first), logging EVERY hex the threat stands on after each activation with its terrain. */
function march(state: AlphaState, threat: Threat, rounds: number) {
  const log: { round: number; hex: string; terrain: string }[] = [{ round: state.core.round, hex: threat.hexId, terrain: tileOf(state, threat.hexId).terrain }];
  for (let i = 0; i < rounds && state.threats.includes(threat); i++) {
    state.core.round += 1;
    activateThreats(state, { launch: i === 0 });
    log.push({ round: state.core.round, hex: threat.hexId, terrain: tileOf(state, threat.hexId).terrain });
  }
  return log;
}
/** A land hex at `distance` from the first capital, not a mountain, unowned, free of pieces. */
const landAt = (state: AlphaState, distance: number): string => {
  const options = ring(state, capital(state, 0), distance).filter(t => !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain) && t.ownerId === null && !state.units.some(u => u.hexId === t.id)).sort((a, b) => (a.id < b.id ? -1 : 1));
  return options[0]!.id;
};

describe('A1: a SEA moat stops land Bandos completely', () => {
  it('no land route when a SEA ring surrounds every city: the Bando never leaves its Acampamento and never stands on SEA', () => {
    const state = world(173);
    isolateOtherCapital(state);
    const start = landAt(state, 5);
    for (const t of ring(state, capital(state, 0), 2)) if (!isCity(state, t.id)) t.terrain = 'SEA';
    const bando = camp(state, start);
    expect(landTarget(state, bando)).toBeNull();
    const log = march(state, bando, 8);
    expect(log.every(step => step.hex === start)).toBe(true);
    expect(log.some(step => step.terrain === 'SEA' || step.terrain === 'UNKNOWN')).toBe(false);
    expect(threatIntent(state, bando).state).toBe('WAITING');
  });

  it('Cavalaria (2 hexes) does not jump the moat either: speed 2 walks the same BFS path hex by hex', () => {
    const state = world(173);
    isolateOtherCapital(state);
    const start = landAt(state, 5);
    for (const t of ring(state, capital(state, 0), 2)) if (!isCity(state, t.id)) t.terrain = 'SEA';
    const bando = camp(state, start, { level: 2, composition: [{ kind: 'CAVALRY', count: 2 }] as never });
    expect(landTarget(state, bando)).toBeNull();
    const log = march(state, bando, 8);
    expect(log.every(step => step.hex === start)).toBe(true);
  });
});

describe('A2: COAST is land for the Bando (the legal "bridge" that looks like water)', () => {
  /** SEA moat of radius 2 around the capital with ONE COAST hex: the only way through. */
  function bridgeWorld(level = 1) {
    const state = world(173);
    isolateOtherCapital(state);
    const start = landAt(state, 5);
    const moat = ring(state, capital(state, 0), 2).filter(t => !isCity(state, t.id));
    const bridge = [...moat].sort((a, b) => hexDistance(a, tileOf(state, start)) - hexDistance(b, tileOf(state, start)) || (a.id < b.id ? -1 : 1))[0]!;
    for (const t of moat) t.terrain = t.id === bridge.id ? 'COAST' : 'SEA';
    const bando = camp(state, start, level === 1 ? {} : { level: 2, composition: [{ kind: 'CAVALRY', count: 2 }] as never });
    return { state, bando, bridge, start };
  }

  it('walks across the COAST hex of a SEA moat; every visited hex is land, and COAST is among them', () => {
    const { state, bando, bridge } = bridgeWorld();
    const route = landTarget(state, bando);
    expect(route).not.toBeNull();
    expect(route!.path).toContain(bridge.id);
    const log = march(state, bando, 14);
    console.info('A2 visited:', log.map(step => `${step.hex}:${step.terrain}`).join(' > '));
    expect(log.some(step => step.hex === bridge.id && step.terrain === 'COAST')).toBe(true);
    for (const step of log) expect(['SEA', 'UNKNOWN']).not.toContain(step.terrain);
    for (let i = 1; i < log.length; i++) expect(hexDistance(tileOf(state, log[i - 1]!.hex), tileOf(state, log[i]!.hex))).toBeLessThanOrEqual(1);
  });

  it('Cavalaria crosses the same bridge two hexes per activation without landing on SEA; every hex of the path is land and adjacent', () => {
    const { state, bando } = bridgeWorld(2);
    const route = landTarget(state, bando)!;
    expect(bando.composition.some(entry => entry.kind === 'CAVALRY')).toBe(true);
    for (const id of route.path) if (id !== route.hex) expect(['SEA', 'UNKNOWN']).not.toContain(tileOf(state, id).terrain);
    for (let i = 1; i < route.path.length; i++) expect(hexDistance(tileOf(state, route.path[i - 1]!), tileOf(state, route.path[i]!))).toBe(1);
    const log = march(state, bando, 6);
    for (let i = 1; i < log.length; i++) expect(hexDistance(tileOf(state, log[i - 1]!.hex), tileOf(state, log[i]!.hex))).toBeLessThanOrEqual(2);
    for (const step of log) expect(['SEA', 'UNKNOWN']).not.toContain(step.terrain);
  });
});

describe('A3: Pirata is sea-only', () => {
  it('a Pirata inside a SEA lake around a port never stands on COAST or land', () => {
    const state = world(173);
    isolateOtherCapital(state);
    const c = capital(state, 0);
    for (const t of ring(state, c, 1, 3)) if (!isCity(state, t.id) && !state.units.some(u => u.hexId === t.id)) t.terrain = 'SEA';
    const start = ring(state, c, 3).filter(t => t.terrain === 'SEA')[0]!.id;
    const raider = pirate(state, start);
    const log = march(state, raider, 6);
    console.info('A3 visited:', log.map(step => `${step.hex}:${step.terrain}`).join(' > '));
    for (const step of log) expect(step.terrain).toBe('SEA');
  });
});

describe('A4: sweep over generated worlds - every land route is land, adjacent, and ends at a city', () => {
  const presets: MapPreset[] = ['MIXED', 'ARCHIPELAGO', 'INLAND_SEA', 'CONTINENTAL'];
  it.each(presets)('%s: BFS paths from every land hex never cross SEA/UNKNOWN; isolated hexes simply have no route', preset => {
    let checked = 0, isolated = 0, coastSteps = 0;
    for (const seed of [3, 29]) {
      const state = world(seed, preset);
      const cities = new Set(state.core.players.flatMap(p => p.civilization.cities.map(c => c.hexId as string)));
      for (const t of state.core.map.filter(h => !['SEA', 'UNKNOWN'].includes(h.terrain))) {
        const probe = camp(state, t.id, { id: `probe-${t.id}` });
        const route = landTarget(state, probe);
        state.threats = state.threats.filter(x => x.id !== probe.id);
        if (!route) { isolated++; continue; }
        checked++;
        let previous = t;
        route.path.forEach((id, index) => {
          const step = tileOf(state, id);
          expect(hexDistance(previous, step)).toBe(1);
          if (index < route.path.length - 1) expect(['SEA', 'UNKNOWN']).not.toContain(step.terrain);
          if (step.terrain === 'COAST') coastSteps++;
          previous = step;
        });
        if (route.path.length) expect(cities.has(route.path.at(-1)!)).toBe(true);
      }
    }
    console.info(`A4 ${preset}: land hexes with a route=${checked}, without (isolated by water)=${isolated}, COAST steps walked=${coastSteps}`);
    expect(checked).toBeGreaterThan(0);
  });

  it('ARCHIPELAGO: an Acampamento spawned on an island without a city stays CAMPED (WAITING) forever (cannot cross the strait); nothing moves it', () => {
    let isolatedCamps = 0, total = 0;
    for (const seed of [3, 11, 29, 47, 71]) {
      const state = world(seed, 'ARCHIPELAGO');
      for (let i = 0; i < 4; i++) {
        const spawned = spawnThreat(state, 'CAMP');
        if (!spawned) continue;
        spawned.fresh = false; total++;
        if (landTarget(state, spawned) === null) {
          isolatedCamps++;
          const before = spawned.hexId;
          const log = march(state, spawned, 4);
          expect(log.every(step => step.hex === before)).toBe(true);
          expect(threatIntent(state, spawned).state).toBe('WAITING');
        }
      }
    }
    console.info(`A4 ARCHIPELAGO spawn: camps=${total}, isolated by water=${isolatedCamps}`);
    expect(total).toBeGreaterThan(0);
  });
});

/**
 * A5 (appearance): the client draws the Bando's heading as a STRAIGHT dashed line from the Bando to its exact target when the target is visible
 * (apps/web/app/play/hex-map.tsx, `threat-heading`: <line x1..y2> between hex centres, not the BFS path). When the legal path winds around water
 * the straight line visibly crosses SEA hexes although the engine never does. This measures how often that happens on generated worlds.
 */
describe('A5: the drawn heading line crosses water although the legal path does not', () => {
  const lineHexes = (a: { q: number; r: number }, b: { q: number; r: number }) => {
    const n = hexDistance(a, b), out: string[] = [];
    for (let i = 1; i < n; i++) {
      const t = i / n, q = a.q + (b.q - a.q) * t, r = a.r + (b.r - a.r) * t, s = -q - r;
      let rq = Math.round(q), rr = Math.round(r); const rs = Math.round(s);
      const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
      if (dq > dr && dq > ds) rq = -rr - rs; else if (dr > ds) rr = -rq - rs;
      out.push(`${rq},${rr}`);
    }
    return out;
  };
  it.each(['ARCHIPELAGO', 'INLAND_SEA'] as MapPreset[])('%s: some real Bando routes are land-legal while the straight heading line crosses SEA hexes', preset => {
    let routes = 0, drawnOverWater = 0;
    for (const seed of [3, 29]) {
      const state = world(seed, preset);
      for (const t of state.core.map.filter(h => !['SEA', 'UNKNOWN'].includes(h.terrain))) {
        const probe = camp(state, t.id, { id: `probe-${t.id}` });
        const route = landTarget(state, probe);
        state.threats = state.threats.filter(x => x.id !== probe.id);
        if (!route) continue;
        routes++;
        if (lineHexes(t, tileOf(state, route.hex)).some(id => tileOf(state, id)?.terrain === 'SEA')) drawnOverWater++;
      }
    }
    console.info(`A5 ${preset}: routes=${routes}, straight heading line crosses SEA=${drawnOverWater}`);
    expect(routes).toBeGreaterThan(0);
    expect(drawnOverWater).toBeGreaterThan(0);
  });
});
