import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, type AlphaState } from '@aoh/game-domain';
import { entryRotations, occupantFits, regionOccupants, revealRegion, rotatedRegionTiles, settleOccupants } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';

/**
 * Alpha V1.2 · WORLD-11 (BUG): independent peoples, Acampamentos and Piratas are placed on the provisional (rotation 0) terrain of a face-down Region;
 * turning the Region could drown a people or a camp, or strand a pirate on land. The rotations offered to an explorer now exclude those turns, and
 * `revealRegion` settles whatever would still stand on unsuitable terrain. The scanner of lane C (scripts/lib/alpha-world-invariants.mjs) is the oracle.
 */
interface Lib {
  makeGame(o: { preset: string; seed: number; players: number }): AlphaState;
  entitySweep(state: AlphaState): { regionsWithEntities: number; violations: { code: string }[] };
  frontierSweep(state: AlphaState, o?: { mode?: 'LAND' | 'NAVAL' }): { entityViolations: unknown[] };
}
const lib = async (): Promise<Lib> => (await import(/* @vite-ignore */ ['..', 'scripts', 'lib', 'alpha-world-invariants.mjs'].join('/'))) as Lib;
const PRESETS = ['MIXED', 'ARCHIPELAGO', 'INLAND_SEA', 'CONTINENTAL'];

describe('WORLD-11 · the legal orientations never put a people or a camp on SEA', () => {
  it('the case of the audit: MIXED seed 1, 4 seats, independent-2 stands in Região 11 and rotation 2 (entry -3,1) used to drown it', async () => {
    const { makeGame } = await lib();
    const state = makeGame({ preset: 'MIXED', seed: 1, players: 4 });
    const region = state.regions.find(candidate => candidate.hexIds.includes('-2,2' as never))!;
    const people = state.independents.find(candidate => candidate.hexId === '-2,2')!;
    expect(people).toBeDefined();
    const index = region.hexIds.findIndex(id => id === people.hexId);
    // Which turns of that Region would leave the people on water?
    const drowning = [0, 1, 2, 3, 4, 5].filter(rotation => !occupantFits('LAND', rotatedRegionTiles(state, region, rotation)[index]!.terrain));
    expect(drowning.length).toBeGreaterThan(0);
    // None of them is offered to an explorer at any entry of the Region, by land or by sea.
    for (const mode of ['LAND', 'NAVAL'] as const) for (const entry of region.hexIds) {
      const offered = entryRotations(state, region, entry, mode);
      for (const rotation of drowning) expect(offered, `${mode} @${entry}`).not.toContain(rotation);
    }
  });

  it.each(PRESETS)('%s: for every closed Region x entry x offered rotation the occupants stay on suitable terrain (2 and 4 seats, seeds 1-2)', async preset => {
    const { makeGame, entitySweep, frontierSweep } = await lib();
    for (const players of [2, 4]) for (const seed of [1, 2]) {
      const state = makeGame({ preset, seed, players });
      expect(entitySweep(state).violations, `${preset} s${seed} ${players}p`).toEqual([]);
      expect(frontierSweep(state, { mode: 'LAND' }).entityViolations, `${preset} s${seed} ${players}p land`).toEqual([]);
    }
  }, 120_000);

  it('revealing under an offered rotation keeps the state valid, persistent and projected on suitable terrain', async () => {
    const { makeGame } = await lib();
    const state = makeGame({ preset: 'MIXED', seed: 1, players: 4 });
    const region = state.regions.find(candidate => regionOccupants(state, candidate).length > 0 && candidate.revealedBy.length === 0)!;
    const offered = [...new Set(region.hexIds.flatMap(entry => entryRotations(state, region, entry, 'LAND')))].sort();
    expect(offered.length).toBeGreaterThan(0);
    for (const rotation of offered) {
      const clone = structuredClone(state), target = clone.regions.find(candidate => candidate.id === region.id)!;
      revealRegion(clone, clone.players[0]!.playerId, target, rotation);
      const reloaded = AlphaStateSchema.parse(JSON.parse(JSON.stringify(clone))); // persistence round trip
      for (const occupant of regionOccupants(reloaded, reloaded.regions.find(candidate => candidate.id === region.id)!)) {
        expect(occupantFits(occupant.need, reloaded.core.map.find(tile => tile.id === occupant.hexId)!.terrain), `${occupant.id} @${occupant.hexId} rotation ${rotation}`).toBe(true);
      }
      // projection: whatever a seat is shown (visible peoples and threats) stands on terrain it can stand on.
      const view = alphaPlayerView(reloaded, reloaded.players[0]!.playerId)!;
      for (const threat of view.threats) expect(occupantFits(threat.kind === 'PIRATE' ? 'SEA' : 'LAND', reloaded.core.map.find(tile => tile.id === threat.hexId)!.terrain)).toBe(true);
    }
  });
});

describe('WORLD-11 · settleOccupants is the safety net when every turn would break an occupant', () => {
  const setup = () => (async () => (await lib()).makeGame({ preset: 'MIXED', seed: 1, players: 4 }))();

  it('a people left on water moves to the nearest free land hex, deterministically, and nothing else changes', async () => {
    const state = await setup();
    const people = state.independents[0]!, origin = people.hexId, region = state.regions.find(candidate => candidate.hexIds.includes(origin))!;
    const here = state.core.map.find(tile => tile.id === origin)!;
    here.terrain = 'SEA'; here.features = [];
    const before = JSON.stringify(state.independents.slice(1));
    const twin = structuredClone(state);
    settleOccupants(state, region); settleOccupants(twin, region);
    const moved = state.independents.find(item => item.id === people.id)!;
    expect(moved.hexId).not.toBe(origin);
    expect(occupantFits('LAND', state.core.map.find(tile => tile.id === moved.hexId)!.terrain)).toBe(true);
    expect(state.core.map.find(tile => tile.id === moved.hexId)!.ownerId).toBeNull();
    expect(twin.independents.find(item => item.id === people.id)!.hexId).toBe(moved.hexId);
    expect(JSON.stringify(state.independents.slice(1))).toBe(before);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('a pirate stranded on land goes back to the sea and its home follows; an occupant that already fits is left alone', async () => {
    const state = await setup();
    const sea = state.core.map.filter(tile => tile.terrain === 'SEA' && !state.units.some(unit => unit.hexId === tile.id))[0]!;
    const region = state.regions.find(candidate => candidate.hexIds.includes(sea.id))!;
    state.threats.push({ id: 'pirate-test', kind: 'PIRATE', hexId: sea.id, homeHexId: sea.id, level: 1, status: 'CAMPED', composition: [{ kind: 'COASTAL_VESSEL', count: 1 }], createdRound: 1, lastActedRound: 1, rewardPaid: false, fresh: false } as never);
    settleOccupants(state, region);
    expect(state.threats.find(item => item.id === 'pirate-test')!.hexId).toBe(sea.id); // fits: untouched
    sea.terrain = 'PLAINS';
    settleOccupants(state, region);
    const pirate = state.threats.find(item => item.id === 'pirate-test')!;
    expect(state.core.map.find(tile => tile.id === pirate.hexId)!.terrain).toBe('SEA');
    expect(pirate.homeHexId).toBe(pirate.hexId);
  });
});
