import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, alphaRules, alphaToLegacyResources } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, createGame, deserializeAlphaState, migrateSnapshotV3ToV4, migrateSnapshotV4ToV5, occupyCity, serializeAlphaState } from '@aoh/game-engine';
import { toV4Snapshot } from './alpha-v4-fixture.js';

function legacy() {
  const result = createGame({ gameId: 'migration-alpha', seed: 42,
    players: [{ id: 'p1', name: 'Primeiro' }, { id: 'p2', name: 'Segundo' }],
    map: [{ id: '0,0', q: 0, r: 0, terrain: 'PLAINS' }, { id: '1,0', q: 1, r: 0, terrain: 'FOREST' }, { id: '4,0', q: 4, r: 0, terrain: 'PLAINS' }],
    initialCities: [{ id: 'city1', ownerId: 'p1', hexId: '0,0', name: 'Aurora' }, { id: 'city2', ownerId: 'p2', hexId: '4,0', name: 'Fronteira' }],
  });
  if (!result.ok) throw new Error(result.error.message); return result.value;
}
describe('explicit alpha aggregate migration', () => {
  it('preserves v3 byte-equivalent data and deterministic v4 round trips', () => {
    const old = legacy(); const before = JSON.stringify(old);
    const result = migrateSnapshotV3ToV4(old); expect(result.ok).toBe(true); if (!result.ok) return;
    expect(JSON.stringify(old)).toBe(before); expect(JSON.stringify(result.value.core)).toBe(before);
    const restored = deserializeAlphaState(serializeAlphaState(result.value));
    expect(restored).toEqual(result); expect(migrateSnapshotV3ToV4(old)).toEqual(result);
  });
  it('requires explicit conversion and a safe maintenance boundary', () => {
    const old = legacy(); expect(deserializeAlphaState(JSON.stringify(old))).toMatchObject({ ok: false, error: { code: 'SNAPSHOT_MIGRATION_REQUIRED' } });
    expect(migrateSnapshotV3ToV4({ ...old, phase: 'PLANNING' })).toMatchObject({ ok: false, error: { code: 'MIGRATION_BOUNDARY' } });
  });
  it('initial knowledge excludes distant opponent homeland', () => {
    const result = migrateSnapshotV3ToV4(legacy()); if (!result.ok) throw new Error(result.error.message);
    expect(result.value.players[0]?.knownHexIds).toEqual(['0,0','1,0']);
    expect(result.value.players[0]?.knownHexIds).not.toContain('4,0');
  });
  it('rejects duplicate initiative and invalid finished outcome', () => {
    const result = migrateSnapshotV3ToV4(legacy()); if (!result.ok) throw new Error(result.error.message);
    expect(AlphaStateSchema.safeParse({ ...result.value, initiative: ['p1','p1'] }).success).toBe(false);
    expect(AlphaStateSchema.safeParse({ ...result.value, core: { ...result.value.core, status: 'FINISHED' } }).success).toBe(false);
  });
  it('provides configurable game length presets: seven Eras of 3 / 5 / 7 rounds', () => {
    expect(['QUICK','STANDARD','EPIC'].map(p => alphaRules(p as 'QUICK'|'STANDARD'|'EPIC').roundLimit)).toEqual([21,35,49]);
    expect(['QUICK','STANDARD','EPIC'].map(p => alphaRules(p as 'QUICK'|'STANDARD'|'EPIC').roundsPerEra)).toEqual([3,5,7]);
    expect(alphaRules().baseCommandPoints).toBe(4);
  });
});

describe('v4 to v5 migration', () => {
  const made = () => beginAlphaPlanning(createAlphaGame({ gameId: 'v4-to-v5', seed: 71, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));
  const ok = (input: unknown) => { const result = migrateSnapshotV4ToV5(input); if (!result.ok) throw new Error(result.error.message); return result.value; };

  it('converts a v4 snapshot to a valid v5 state without touching the input', () => {
    const v4 = toV4Snapshot(made()); const before = JSON.stringify(v4);
    const migrated = ok(v4);
    expect(JSON.stringify(v4)).toBe(before);
    expect(migrated.schemaVersion).toBe(5);
    expect(AlphaStateSchema.safeParse(migrated).success).toBe(true);
    expect(migrated.core).toEqual((v4 as { core: unknown }).core);
    expect(migrated.cities).toHaveLength(migrated.core.players.flatMap(p => p.civilization.cities).length);
  });

  it('is idempotent and accepts v5 unchanged', () => {
    const once = ok(toV4Snapshot(made()));
    expect(ok(once)).toEqual(once);
    expect(ok(JSON.parse(JSON.stringify(once)))).toEqual(once);
    expect(migrateSnapshotV4ToV5(toV4Snapshot(made()))).toEqual(migrateSnapshotV4ToV5(toV4Snapshot(made())));
  });

  it('maps seven-resource pools from the legacy pool without changing totals', () => {
    const v4 = toV4Snapshot(made());
    const migrated = ok(v4);
    migrated.players.forEach((player, index) => {
      expect(alphaToLegacyResources(player.resources)).toEqual(migrated.core.players[index]!.resources);
      expect(player.resources.metal).toBe(0);
    });
  });

  it('renames Settler to Pioneer and keeps every unit', () => {
    const source = made(); const v4 = toV4Snapshot(source) as { units: { kind: string }[] };
    expect(v4.units.some(u => u.kind === 'SETTLER')).toBe(true);
    const migrated = ok(v4);
    expect(migrated.units).toHaveLength(source.units.length);
    expect(migrated.units.some(u => (u.kind as string) === 'SETTLER')).toBe(false);
    expect(migrated.units.filter(u => u.kind === 'PIONEER')).toHaveLength(source.units.filter(u => u.kind === 'PIONEER').length);
  });

  it('reads the old sixth Era HEGEMONY as Ascensão (Era VII) whether or not Hegemony was declared', () => {
    const declared = toV4Snapshot(made()) as { players: { era: string; hegemony: unknown }[] };
    declared.players[0]!.era = 'HEGEMONY'; declared.players[0]!.hegemony = { path: 'TERRITORIAL', declaredRound: 1, qualifiedSince: null };
    declared.players[1]!.era = 'HEGEMONY'; declared.players[1]!.hegemony = null;
    const migrated = ok(declared);
    expect(migrated.players[0]!.era).toBe('ASCENSION');
    expect(migrated.players[0]!.hegemony).toEqual({ path: 'TERRITORIAL', declaredRound: 1, qualifiedSince: null });
    expect(migrated.players[1]!.era).toBe('ASCENSION');
  });

  it('carries occupations into city metadata', () => {
    const source = made(); const [a, b] = [source.players[0]!.playerId, source.players[1]!.playerId];
    const cityId = source.core.players[0]!.civilization.cities[0]!.id;
    occupyCity(source, b, cityId);
    const migrated = ok(toV4Snapshot(source));
    const meta = migrated.cities.find(c => c.cityId === cityId)!;
    expect(meta).toMatchObject({ status: 'OCCUPIED', integration: 0, originalOwnerId: a, currentOwnerId: b });
    expect(migrated.occupations).toEqual(source.occupations);
  });

  it('maps legacy planning timers and core phases', () => {
    const v4 = toV4Snapshot(made()) as { rules: { planningSeconds: number }; core: { phase: string } };
    v4.rules.planningSeconds = 600;
    expect(ok(v4).rules.planningSeconds).toBe(480);
    v4.rules.planningSeconds = 5000;
    expect(ok(v4).rules.planningSeconds).toBe(28800);
    v4.rules.planningSeconds = 300;
    expect(ok(v4).rules.planningSeconds).toBe(300);
  });

  it('refuses corrupt, incomplete and unknown input and leaves it untouched', () => {
    const good = toV4Snapshot(made());
    const cases: unknown[] = [null, 'text', 42, {}, { schemaVersion: 4 }, { ...good, core: { broken: true } }, { ...good, rules: { preset: 'HUGE' } }, { ...good, schemaVersion: 99 }, { ...good, schemaVersion: 2 }];
    for (const input of cases) {
      const before = JSON.stringify(input);
      expect(migrateSnapshotV4ToV5(input)).toMatchObject({ ok: false, error: { code: 'INVALID_STATE' } });
      expect(JSON.stringify(input)).toBe(before);
    }
  });

  it('never yields a v5 state that fails validation for an inconsistent v4 payload', () => {
    const bad = toV4Snapshot(made()) as { initiative: string[] };
    bad.initiative = ['p1', 'p1'];
    expect(migrateSnapshotV4ToV5(bad).ok).toBe(false);
  });

  it('asks callers to migrate explicitly instead of decoding v4 or v3 silently', () => {
    const v4 = JSON.stringify(toV4Snapshot(made()));
    expect(deserializeAlphaState(v4)).toMatchObject({ ok: false, error: { code: 'SNAPSHOT_MIGRATION_REQUIRED' } });
    expect(deserializeAlphaState(JSON.stringify({ schemaVersion: 3 }))).toMatchObject({ ok: false, error: { code: 'SNAPSHOT_MIGRATION_REQUIRED' } });
    expect(deserializeAlphaState(JSON.stringify({ schemaVersion: 99 })).ok).toBe(false);
    expect(deserializeAlphaState('not json').ok).toBe(false);
  });

  it('round-trips a migrated state through the v5 serializer', () => {
    const migrated = ok(toV4Snapshot(made()));
    expect(deserializeAlphaState(serializeAlphaState(migrated))).toEqual({ ok: true, value: migrated });
  });
});
