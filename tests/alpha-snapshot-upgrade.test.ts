import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, PlayerIdSchema } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, deserializeAlphaState, serializeAlphaState } from '@aoh/game-engine';

const ids = ['p1', 'p2'].map(id => PlayerIdSchema.parse(id));
const v51a = () => {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'upgrade', seed: 3, preset: 'QUICK', players: ids.map(id => ({ id, name: id })) }));
  const raw = JSON.parse(JSON.stringify(state)) as Record<string, unknown>;
  delete raw.rulesVersion; delete raw.threats; delete raw.eraTurn;
  raw.pressure = 5;
  for (const player of raw.players as Record<string, unknown>[]) { delete player.resonance; delete player.pendingChoices; player.research = ['web-writing']; }
  (raw.telemetry as Record<string, unknown>).resonanceCycles = undefined; delete (raw.telemetry as Record<string, unknown>).resonanceCycles; delete (raw.telemetry as Record<string, unknown>).resonanceByKind;
  return raw;
};

describe('V5.1a → V5.1b snapshot upgrade', () => {
  it('upgrades a V5.1a save: drops Pressão, adds Ressonância with marks, and says so publicly', () => {
    const raw = v51a();
    const result = AlphaStateSchema.safeParse(raw);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const state = result.data;
    expect(state.rulesVersion).toBe('v5.1b');
    expect(state).not.toHaveProperty('pressure');
    expect(state.players[0]!.resonance.slots).toEqual([]);
    expect(state.players[0]!.resonance.marks.map(mark => mark.advancementId)).toEqual(['web-writing']);
    expect(state.players[0]!.pendingChoices).toEqual([]);
    expect(state.threats).toEqual([]);
    expect(state.eraTurn).toBeNull();
    const event = state.events.at(-1)!;
    expect(event.type).toBe('SAVE_UPGRADED');
    expect(event.audience).toBeNull();
  });

  it('is idempotent: upgrading twice adds the event once', () => {
    const once = AlphaStateSchema.parse(v51a());
    const twice = AlphaStateSchema.parse(JSON.parse(serializeAlphaState(once)));
    expect(twice.events.filter(event => event.type === 'SAVE_UPGRADED')).toHaveLength(1);
    expect(twice).toEqual(once);
  });

  it('a fresh V5.1b match never emits SAVE_UPGRADED', () => {
    const state = beginAlphaPlanning(createAlphaGame({ gameId: 'fresh', seed: 3, preset: 'QUICK', players: ids.map(id => ({ id, name: id })) }));
    expect(state.rulesVersion).toBe('v5.1b');
    expect(state.events.some(event => event.type === 'SAVE_UPGRADED')).toBe(false);
  });

  it('corrupt input stays rejected, not silently repaired', () => {
    const raw = v51a(); raw.units = 'nope';
    expect(AlphaStateSchema.safeParse(raw).success).toBe(false);
    expect(deserializeAlphaState(JSON.stringify({ schemaVersion: 5 })).ok).toBe(false);
  });
});
