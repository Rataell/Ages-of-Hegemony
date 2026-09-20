import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, alphaRules } from '@aoh/game-domain';
import { createGame, deserializeAlphaState, migrateSnapshotV3ToV4, serializeAlphaState } from '@aoh/game-engine';

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
  it('provides configurable game length presets without changing the legacy economy', () => {
    expect(['QUICK','STANDARD','EPIC'].map(p => alphaRules(p as 'QUICK'|'STANDARD'|'EPIC').roundLimit)).toEqual([9,15,20]);
    expect(alphaRules().baseCommandPoints).toBe(4);
  });
});
