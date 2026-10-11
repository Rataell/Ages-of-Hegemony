import { describe, expect, it } from 'vitest';
import type { AlphaState } from '@aoh/game-domain';
import { harborHex, isPort, launchHex } from '@aoh/game-engine';

/**
 * V1.2 AUDIT, lane C (World): connectivity of sea, coast and land per preset. READ-ONLY over the generator: nothing here edits the engine.
 *
 * The properties live in scripts/lib/alpha-world-topology.mjs (`PROPERTIES`) so the CLI report (scripts/alpha-world-topology.mjs) and this file never disagree.
 *  - GUARD    holds today; the audit PRESERVES it (regions of seven hexes, rotation that keeps deposits and observed terrain, Pátrias untouched, metal access,
 *             one walkable land mass where the preset promises it).
 *  - FINDING  does NOT hold today. It is asserted with `it.fails` (REPRO naming): the test is green while the defect exists and turns red the moment the
 *             generator/engine is fixed, which is the signal to flip it to a plain `it`. Each REPRO names a seed that reproduces it.
 *
 * COAST is both land and navigable water (alpha-water.ts); SEA is water only. A navigable "body" is a connected set of COAST+SEA hexes. There is NO LAKE terrain:
 * a "lake" here is only a body smaller than one Region (7 hexes) that no ship can usefully leave.
 */
interface Measure {
  regionSizes: number[]; fakeCoasts: number; portNoHarbor: number; pondQuays: number; quays: number;
  nav: { comps: number[]; main: number; ponds: number }; land: { comps: number[]; fragments: number };
  homes: { slot: number; capital: string; landMassId: number; bestQuayBody: number; realPortWithin3: boolean; anyQuayWithin3: boolean; metalR2: number }[];
}
interface Row { id: string; kind: 'GUARD' | 'FINDING'; title: string; byPreset: Record<string, { fails: number; total: number; first: { preset: string; seed: number; players: number; variant: string; detail: string } | null }> }
interface Topology {
  PRESETS: string[]; POND_MAX: number;
  makeWorld(o: { preset: string; seed: number; players: number; size?: string }): AlphaState;
  revealedWorld(state: AlphaState, salt?: number): AlphaState;
  measureWorld(state: AlphaState): Measure;
  pondQuayHexes(state: AlphaState): string[];
  rimOcean(state: AlphaState): { bodies: number; rimLand: number };
  inlandCore(state: AlphaState): { dry: string[]; bodies: number };
  runProperties(o: { seeds: number[]; counts?: number[]; size?: string; only?: string[]; presets?: string[] }): Record<string, Row>;
}
const topology = async (): Promise<Topology> => (await import(/* @vite-ignore */ ['..', 'scripts', 'lib', 'alpha-world-topology.mjs'].join('/'))) as Topology;

const SEEDS = [1, 2, 3, 4, 5, 6];
const table = (() => { let cache: Promise<Record<string, Row>> | null = null; return () => (cache ??= topology().then(t => t.runProperties({ seeds: SEEDS }))); })();
const failures = (row: Row) => Object.entries(row.byPreset).filter(([, c]) => c.fails > 0).map(([preset, c]) => `${preset} ${c.fails}/${c.total} e.g. ${JSON.stringify(c.first)}`);

describe('V1.2 lane C: world connectivity, properties the audit preserves', () => {
  for (const id of ['G1-seven-hex-regions', 'G2-deposit-survives-rotation', 'G3-patria-untouched', 'G4-metal-within-two-regions', 'G5-patrias-share-a-land-mass', 'G6-inland-sea-one-body', 'G7-archipelago-islands']) {
    it(`GUARD ${id}`, async () => {
      const row = (await table())[id]!;
      expect(row.kind).toBe('GUARD');
      expect(failures(row), row.title).toEqual([]);
      expect(Object.values(row.byPreset).every(cell => cell.total === SEEDS.length * 3 * 2)).toBe(true); // seeds x {2,4,6} players x {creation, turned}
    }, 180_000);
  }

  it('GUARD the footprint is the same world after every Region is turned: still seven hexes, same hex set, same Pátria terrain', async () => {
    const t = await topology();
    for (const preset of t.PRESETS) {
      const created = t.makeWorld({ preset, seed: 3, players: 4 }), turned = t.revealedWorld(created, 3);
      expect(new Set(turned.core.map.map(tile => tile.id))).toEqual(new Set(created.core.map.map(tile => tile.id)));
      expect(turned.regions.every(region => region.hexIds.length === 7)).toBe(true);
      for (const slot of [1, 2, 3, 4]) {
        const home = created.regions.find(region => region.templateId === `homeland-${slot}`)!;
        expect(home.hexIds.map(id => turned.core.map.find(tile => tile.id === id)!.terrain)).toEqual(home.hexIds.map(id => created.core.map.find(tile => tile.id === id)!.terrain));
      }
    }
  });
});

describe('V1.2 lane C: REPRO of world findings (it.fails = the defect exists today; flip to it() when fixed)', () => {
  // One REPRO per FINDING property, named after the finding id used in docs/audit/alpha-v1.2-lane-c-world.md.
  const repro: Record<string, string> = {
    'F1-no-fake-coast': 'WORLD-1 REPRO MIXED seed 1, 2 players (also INLAND_SEA, ARCHIPELAGO): a COAST hex with no water beside it',
    'F2-isPort-implies-harbor': 'RULE-1 REPRO MIXED seed 1, 2 players: isPort() says port, harborHex() says no harbor on the same COAST hex',
    'F3-no-port-on-a-pond': 'RULE-2 REPRO any preset, seed 1: harborHex accepts a quay whose whole water is a pond of 1-6 hexes',
    'F4-home-port-on-real-sea': 'WORLD-2 REPRO MIXED seed 4, 2 players, Regions turned: slot 1 Pátria can only ever build its Porto on a pond',
    'F5-continental-ocean-rim': 'WORLD-3 REPRO CONTINENTAL seed 1, 2 players: the "real ocean border" is 10 separate bodies',
    'F6-continental-one-land-mass': 'WORLD-4 REPRO CONTINENTAL seed 1, 2 players: a one-hex islet next to the great land mass',
    'F7-inland-sea-no-metal-islets': 'WORLD-5 REPRO INLAND_SEA seed 1, 2 players: metal deposits stand as islets inside the central sea',
    'F8-inland-sea-no-fragments': 'WORLD-6 REPRO INLAND_SEA seed 2, 2 players: a one-hex land fragment',
    'F9-archipelago-no-corridor': 'WORLD-7 REPRO ARCHIPELAGO seed 3, 2 players, Regions turned: two Pátrias on one land mass despite "no land corridor"',
    'F10-archipelago-patria-has-real-port': 'WORLD-8 REPRO ARCHIPELAGO seed 3, 6 players, Regions turned: slot 3 Pátria has no real port within 3 hexes',
    'F11-archipelago-no-islets': 'WORLD-9 REPRO ARCHIPELAGO seed 1, 2 players: islets of 1-3 hexes no walker can reach',
  };
  for (const [id, name] of Object.entries(repro)) {
    it.fails(name, async () => {
      const row = (await table())[id]!;
      expect(row.kind).toBe('FINDING');
      expect(failures(row), row.title).toEqual([]);
    }, 180_000);
  }

  it('MECHANICS at a pond: the engine accepts a harbor and a ship launch whose only water is a pond (documents what the minimal fix must change)', async () => {
    const t = await topology();
    const state = t.makeWorld({ preset: 'MIXED', seed: 1, players: 2 });
    const quays = t.pondQuayHexes(state);
    expect(quays.length).toBeGreaterThan(0);
    const hex = quays[0]!;
    // Today: a Distrito Marítimo (harborHex) and a ship (launchHex) are both allowed beside a body of 1-6 hexes. After the fix both must refuse it.
    expect(harborHex(state, hex)).not.toBeNull();
    expect(launchHex(state, state.players[0]!.playerId, hex)).not.toBeNull();
  });

  it('MECHANICS isPort and harborHex are two definitions of "port" that disagree on a coast to nowhere', async () => {
    const t = await topology();
    const state = t.makeWorld({ preset: 'MIXED', seed: 1, players: 2 });
    const tiles = new Map(state.core.map.map(tile => [tile.id, tile]));
    const lonely = state.core.map.find(tile => tile.terrain === 'COAST' && [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]].every(([a, b]) => !['SEA', 'COAST'].includes(tiles.get(`${tile.q + a!},${tile.r + b!}` as never)?.terrain ?? 'UNKNOWN')));
    expect(lonely).toBeDefined();
    expect(isPort(state, lonely!.id)).toBe(true); // ships may be recruited here (alpha-naval.ts isPort: terrain === COAST)
    expect(harborHex(state, lonely!.id)).toBeNull(); // but the Distrito Marítimo is refused (alpha-water.ts harborHex needs a shared water edge)
  });
});
