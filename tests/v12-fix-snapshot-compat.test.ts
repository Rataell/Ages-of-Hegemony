import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, type AlphaState } from '@aoh/game-domain';
import { deserializeAlphaState, serializeAlphaState } from '@aoh/game-engine';
import { completeRound } from './alpha-rounds.js';

/**
 * Alpha V1.2 · snapshot compatibility. The fixture `tests/fixtures/rc4-midgame-state.json` was produced by the RC4 engine itself (commit dca181a, built in a
 * separate worktree and driven for 14 rounds with the V1.2 policy harness: 2 seats, Threats on). It has none of the fields V1.2 added:
 *   AlphaCity.revoltEmergencyRound (E-1) and Threat.withdrawing / Threat.readyRound (R1).
 * The buildings it holds are the old ones. The tests load it with today's schema, check the defaults, play on, and save/load again.
 */
const fixture = readFileSync(new URL('./fixtures/rc4-midgame-state.json', import.meta.url), 'utf8');

describe('an RC4 save under the V1.2 engine', () => {
  it('is a genuine RC4 snapshot: none of the V1.2 fields are in the file', () => {
    const raw = JSON.parse(fixture) as { cities: Record<string, unknown>[]; threats: Record<string, unknown>[] };
    expect(raw.cities.length).toBeGreaterThan(1); expect(raw.threats.length).toBeGreaterThan(0);
    for (const city of raw.cities) expect(city).not.toHaveProperty('revoltEmergencyRound');
    for (const threat of raw.threats) { expect(threat).not.toHaveProperty('withdrawing'); expect(threat).not.toHaveProperty('readyRound'); }
  });

  it('loads through the public path, with the new fields at their neutral defaults', () => {
    const loaded = deserializeAlphaState(fixture);
    expect(loaded.ok, loaded.ok ? '' : loaded.error.message).toBe(true);
    if (!loaded.ok) return;
    const state = loaded.value;
    expect(state.cities.every(city => city.revoltEmergencyRound === null)).toBe(true);
    expect(state.threats.every(threat => threat.withdrawing === false && threat.readyRound === 0)).toBe(true);
    expect(state.core.round).toBe(15);
    expect(state.phase).toBe('PLANNING');
  });

  it('keeps playing: eight more rounds resolve without error, stay schema-valid, and the Bandos obey the new cycle', () => {
    let state: AlphaState = AlphaStateSchema.parse(JSON.parse(fixture));
    const startRound = state.core.round;
    const withdrawals: string[] = [];
    for (let i = 0; i < 8 && state.core.status === 'ACTIVE'; i++) {
      state = completeRound(state);
      expect(AlphaStateSchema.safeParse(JSON.parse(JSON.stringify(state))).success, `round ${state.core.round}`).toBe(true);
      withdrawals.push(...state.events.filter(event => event.type === 'THREAT_WITHDRAWING').map(event => `${event.round}`));
    }
    expect(state.core.round).toBeGreaterThanOrEqual(startRound + 8);
    // No city is assaulted on two consecutive odd rounds by the same Bando any more: withdrawing Bandos never assault.
    for (const threat of state.threats.filter(item => item.withdrawing)) expect(threat.status).toBe('MARCHING');
    for (const threat of state.threats.filter(item => item.status === 'CAMPED')) expect(threat.withdrawing).toBe(false);
  });

  it('survives save and load again (the V1.2 fields are now written and read back)', () => {
    let state: AlphaState = AlphaStateSchema.parse(JSON.parse(fixture));
    state = completeRound(state);
    const again = deserializeAlphaState(serializeAlphaState(state));
    expect(again.ok).toBe(true);
    if (again.ok) { expect(JSON.parse(JSON.stringify(again.value))).toEqual(JSON.parse(JSON.stringify(state))); expect(again.value.cities[0]).toHaveProperty('revoltEmergencyRound'); expect(again.value.threats[0]).toHaveProperty('withdrawing'); }
  });

  it('a city in the old save that was already in Revolta can use the emergency recovery (no marker, nothing spent)', async () => {
    const { urbanBlock } = await import('@aoh/game-engine');
    const state: AlphaState = AlphaStateSchema.parse(JSON.parse(fixture));
    const meta = state.cities.find(city => city.currentOwnerId === state.players[0]!.playerId)!;
    meta.mood = 1;
    expect(urbanBlock(state, state.players[0]!.playerId, meta.cityId, 'EMERGENCY_GOVERN')).toBeNull();
  });
});
