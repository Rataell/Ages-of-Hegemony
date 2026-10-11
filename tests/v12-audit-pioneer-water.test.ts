import { describe, expect, it } from 'vitest';
import type { AlphaState } from '@aoh/game-domain';

/**
 * V1.2 AUDIT, lane C (World): the Pioneiro and water. READ-ONLY over the engine; nothing here edits packages/ or apps/.
 *
 * INVARIANT: an UNEMBARKED non-naval piece never occupies SEA. COAST is land AND navigable water (alpha-water.ts), so a Pioneiro on COAST is legal; an embarked piece rides
 * its fleet and may sit on SEA. The scanner (scripts/lib/alpha-world-invariants.mjs) re-checks the whole state after EVERY successful command of a real match, for
 *   - the live bot policy on every seat (setup, MOVE, Discovery, rotation, EMBARK/DISEMBARK, SETTLE, upkeep, combat),
 *   - a seeded wanderer on the odd seats: random legal MOVE / frontier entries under every legal rotation / group moves / EMBARK / DISEMBARK / ships with cargo,
 *     plus deliberate ILLEGAL probes (a land piece into known SEA; a frontier entry under a rotation that drowns it) that the validators must refuse,
 * and exhaustively for every closed Region x hex x legal rotation (frontierSweep), naufrágio (cargoScenarios) and two seats entering one Region (raceScenario).
 * It also checks what the server projects to each seat (alphaPlayerView) against the authoritative state.
 *
 * Verdict recorded in docs/audit/alpha-v1.2-lane-c-world.md: no state bug puts a Pioneiro on SEA today. What remains is COAST drawn as water (UX), COAST-hex
 * naufrágio losses (RULE), claims that fix a face-down Region (RULE/WORLD) and the projection sending hexes of a face-down Region (UX). Those are the it.fails below.
 */
interface Violation { code: string; unit?: string; hex?: string; region?: string; round?: number; cmd?: string; terrain?: string; [key: string]: unknown }
interface RunResult { state: AlphaState; violations: Violation[]; crashes: Violation[]; counters: Record<string, number>; rejected: Record<string, number>; round: number }
interface Lib {
  HARD: string[]; SOFT: string[]; ENTITY_CODES: string[];
  makeGame(o: { preset: string; seed: number; players: number; size?: string }): AlphaState;
  runMatch(o: { preset: string; seed: number; players: number; size?: string; rounds?: number; wander?: boolean; naval?: boolean }): RunResult;
  scanState(state: AlphaState, mem: unknown, where?: object): Violation[];
  newMemory(): unknown;
  frontierSweep(state: AlphaState, o?: { mode?: 'LAND' | 'NAVAL'; maxRegions?: number }): { checked: number; violations: Violation[]; entityViolations: Violation[] };
  entitySweep(state: AlphaState): { regionsWithEntities: number; violations: Violation[] };
  cargoScenarios(state: AlphaState): { name: string; site?: string; skipped?: string; violations?: Violation[]; lost?: number; survivors?: { id: string; terrain: string; carried: boolean }[]; steps?: { step: string; block?: string | null; violations?: Violation[] }[] }[];
  raceScenario(state: AlphaState): { skipped?: string; A?: { terrain: string }; B?: { terrain: string; hex: string }; violations?: Violation[]; queuedA?: boolean; queuedB?: boolean };
}
const lib = async (): Promise<Lib> => (await import(/* @vite-ignore */ ['..', 'scripts', 'lib', 'alpha-world-invariants.mjs'].join('/'))) as Lib;
const PRESETS = ['MIXED', 'CONTINENTAL', 'ARCHIPELAGO', 'INLAND_SEA'];

describe('V1.2 lane C: the scanner itself detects what it claims to', () => {
  it('flags an unembarked land piece on SEA, a dangling carrier, a ship on land and a mutated observed terrain; accepts an embarked piece on SEA and a Pioneiro on COAST', async () => {
    const { makeGame, scanState, newMemory, HARD } = await lib();
    const state = makeGame({ preset: 'ARCHIPELAGO', seed: 3, players: 2 });
    const sea = state.core.map.find(t => t.terrain === 'SEA')!, coast = state.core.map.find(t => t.terrain === 'COAST')!, plains = state.core.map.find(t => t.terrain === 'PLAINS')!;
    const base = { ownerId: state.players[0]!.playerId, recruitedRound: 1, carrierId: null };
    const clean = structuredClone(state); clean.units = []; clean.independents = []; clean.threats = [];
    expect(scanState(clean, newMemory()).filter(v => HARD.includes(v.code))).toEqual([]);
    const withCoast = structuredClone(clean); withCoast.units.push({ ...base, id: 'p-coast', kind: 'PIONEER', hexId: coast.id } as never);
    expect(scanState(withCoast, newMemory()).filter(v => HARD.includes(v.code))).toEqual([]); // COAST is legal ground
    const withBoat = structuredClone(clean); withBoat.units.push({ ...base, id: 'f1', kind: 'FLEET', hexId: sea.id } as never, { ...base, id: 'p-aboard', kind: 'PIONEER', hexId: sea.id, carrierId: 'f1' } as never);
    expect(scanState(withBoat, newMemory()).filter(v => HARD.includes(v.code))).toEqual([]); // embarked on SEA is legal
    const drowned = structuredClone(clean); drowned.units.push({ ...base, id: 'p-sea', kind: 'PIONEER', hexId: sea.id } as never);
    expect(scanState(drowned, newMemory()).map(v => v.code)).toContain('LAND_PIECE_ON_SEA');
    const orphan = structuredClone(withBoat); orphan.units = orphan.units.filter(u => u.id !== 'f1');
    expect(scanState(orphan, newMemory()).map(v => v.code)).toContain('DANGLING_CARRIER');
    const stranded = structuredClone(clean); stranded.units.push({ ...base, id: 'f-land', kind: 'FLEET', hexId: plains.id } as never);
    expect(scanState(stranded, newMemory()).map(v => v.code)).toContain('SHIP_ON_LAND');
    const memory = newMemory(), seen = structuredClone(state); scanState(seen, memory);
    const changed = structuredClone(seen), home = changed.regions.find(r => r.revealedBy.length > 0)!; changed.core.map.find(t => t.id === home.hexIds[1])!.terrain = changed.core.map.find(t => t.id === home.hexIds[1])!.terrain === 'SEA' ? 'PLAINS' : 'SEA';
    expect(scanState(changed, memory).map(v => v.code)).toContain('TERRAIN_MUTATED');
  });
});

describe('V1.2 lane C: no unembarked land piece ever stands on SEA (scanned after every command)', () => {
  // Bots on every seat (2p wanderer+bot with a navy, 4p bots, 6p wanderer+bots): each preset, each in its own test so a failure names the preset.
  it.each(PRESETS)('%s: bots + wanderer + navy, 2/4/6 seats, no hard violation, no crash, validators refuse every illegal probe', async preset => {
    const { runMatch, HARD, ENTITY_CODES } = await lib();
    const pieceCodes = HARD.filter(code => !ENTITY_CODES.includes(code)); // world entities (peoples, camps) are the WORLD-11 REPRO below
    const runs = [
      runMatch({ preset, seed: 2, players: 2, rounds: 7, wander: true, naval: true }),
      runMatch({ preset, seed: 1, players: 4, rounds: 4 }),
      runMatch({ preset, seed: 3, players: 6, rounds: 3, wander: true }),
    ];
    for (const run of runs) {
      expect(run.crashes).toEqual([]);
      expect(run.violations.filter(v => pieceCodes.includes(v.code))).toEqual([]);
      expect(run.counters.commands).toBeGreaterThan(40);
    }
    expect(runs[0]!.counters.frontier + runs[0]!.counters.embark + runs[0]!.counters.group).toBeGreaterThan(0); // the wanderer really moved pieces
  }, 600_000);

  it.each(PRESETS)('%s: every closed Region x hex x legal rotation: the discoverer ends on a hex it can stand on, the Region keeps its rotation, deposits and observed terrain', async preset => {
    const { makeGame, frontierSweep } = await lib();
    const state = makeGame({ preset, seed: 2, players: 4 });
    const land = frontierSweep(state, { mode: 'LAND' }), naval = frontierSweep(state, { mode: 'NAVAL' });
    expect(land.checked).toBeGreaterThan(100);
    expect(naval.checked).toBeGreaterThan(0);
    expect(land.violations).toEqual([]);
    expect(naval.violations).toEqual([]);
  }, 300_000);

  it.each(['ARCHIPELAGO', 'MIXED'])('%s: naufrágio, rescue by a second fleet and the embark/disembark round trip leave nothing on SEA or dangling', async preset => {
    const { makeGame, cargoScenarios } = await lib();
    const results = cargoScenarios(makeGame({ preset, seed: 2, players: 4 }));
    expect(results.length).toBeGreaterThanOrEqual(4);
    for (const result of results) {
      if (result.skipped) continue;
      expect(result.violations ?? [], result.name).toEqual([]);
      for (const step of result.steps ?? []) expect(step.violations ?? [], `${result.name}/${step.step}`).toEqual([]);
    }
    const trip = results.find(r => r.name === 'embark-disembark-roundtrip')!;
    if (!trip.skipped) {
      expect(trip.steps!.find(s => s.step === 'embark')!.block).toBeNull();
      expect(trip.steps!.find(s => s.step === 'disembark-onto-SEA')!.block).toMatch(/Desembarque em terra/); // a carried Pioneiro cannot step into the sea
      expect(trip.steps!.find(s => s.step === 'disembark-onto-land')!.block).toBeNull();
    }
    const sunk = results.find(r => r.name === 'sunk-interior-sea')!;
    expect(sunk.survivors).toEqual([]); // nothing is left floating when there is no shore
  }, 120_000);

  it.each(PRESETS)('%s: two seats enter the same face-down Region with different orientations: the loser is never left on SEA', async preset => {
    const { makeGame, raceScenario } = await lib();
    const race = raceScenario(makeGame({ preset, seed: 1, players: 4 }));
    if (race.skipped) return;
    expect(race.violations).toEqual([]);
    expect(['SEA', 'UNKNOWN']).not.toContain(race.A!.terrain);
    expect(['SEA', 'UNKNOWN']).not.toContain(race.B!.terrain);
  }, 120_000);
});

describe('V1.2 lane C: REPRO of Pioneiro / water findings (it.fails = the defect exists today; flip to it() when fixed)', () => {
  it.fails('RULE-3 REPRO naufrágio on a COAST hex (land) loses a piece that could simply stay: 2 Pioneiros aboard, fleet sunk on COAST, only one survives', async () => {
    const { makeGame, cargoScenarios } = await lib();
    const sunk = cargoScenarios(makeGame({ preset: 'ARCHIPELAGO', seed: 2, players: 4 })).find(r => r.name === 'sunk-on-coast-with-land')!;
    expect(sunk.skipped).toBeUndefined();
    expect(sunk.lost).toBe(0); // COAST is walkable: settleCargo should unembark in place instead of choosing one shore piece and dropping the rest
  });

  it.fails('WORLD-11 REPRO an independent people (or an Acampamento) placed on face-down terrain ends ON SEA when the Region is turned (MIXED seed 1, 4 seats: Região 11, rotation 2, entry -3,1)', async () => {
    const { makeGame, frontierSweep, entitySweep, ENTITY_CODES } = await lib();
    const state = makeGame({ preset: 'MIXED', seed: 1, players: 4 });
    expect(frontierSweep(state, { mode: 'LAND' }).entityViolations).toEqual([]); // the real resolveFrontierMove path: today it puts independent-2 (-2,2) in the sea
    const run = (await lib()).runMatch({ preset: 'MIXED', seed: 2, players: 2, rounds: 7, wander: true, naval: true }); // the same defect inside a real match: round 5, READY of seat 2, independent people at -2,3
    expect(run.violations.filter(v => ENTITY_CODES.includes(v.code))).toEqual([]);
    for (const seed of [1, 2, 3]) expect(entitySweep(makeGame({ preset: 'MIXED', seed, players: 2 })).violations, `seed ${seed}`).toEqual([]);
  }, 120_000);

  it.fails('WORLD-10 REPRO a territory claim inside a face-down Region fixes its orientation at rotation 0 and puts a Pioneiro in a Region nobody revealed (ARCHIPELAGO seed 2, 2 seats, round 5)', async () => {
    const { runMatch } = await lib();
    const run = runMatch({ preset: 'ARCHIPELAGO', seed: 2, players: 2, rounds: 6 });
    expect(run.violations.filter(v => ['OWNED_HEX_IN_CLOSED_REGION', 'UNIT_IN_CLOSED_REGION'].includes(v.code))).toEqual([]);
  }, 120_000);

  it.fails('UX-1 REPRO the server projects the terrain of a hex inside a face-down Region to its owner (the client then draws a piece on a card that is still face down)', async () => {
    const { runMatch } = await lib();
    const run = runMatch({ preset: 'ARCHIPELAGO', seed: 2, players: 2, rounds: 7 });
    expect(run.violations.filter(v => v.code.startsWith('PROJECTION_'))).toEqual([]);
  }, 120_000);
});
