import { describe, expect, it } from 'vitest';
import { createScheduler } from '../apps/web/app/alpha/audio/audio-scheduler';
import { diffGame, snapshotOf, type GameLike } from '../apps/web/app/alpha/audio/audio-diff';
import { AudioManager, parseSettings } from '../apps/web/app/alpha/audio/audio-manager';
import type { AudioBackend } from '../apps/web/app/alpha/audio/audio-backend';
import { buildScore } from '../apps/web/app/alpha/audio/music-score';
import { rollFrames } from '../apps/web/app/alpha/audio/dice-roll';

const clock = (start = 0) => { let t = start; return { now: () => t, tick: (ms: number) => { t += ms; } }; };
const game = (patch: Partial<GameLike> = {}): GameLike => ({ phase: 'PLANNING', view: { round: 1 }, self: { era: 'I', resonance: { slots: [] }, pendingChoices: [] }, events: [], battles: [], threats: [], worldPulse: null, players: [{ id: 'p1' }], units: [], ...patch });

describe('audio scheduler', () => {
  it('collapses identical events inside the cooldown', () => {
    const c = clock(1000), s = createScheduler(c);
    expect(s.accept('UNIT_MOVED')).toBe(true);
    for (let i = 0; i < 5; i++) expect(s.accept('UNIT_MOVED')).toBe(false);
    c.tick(500); expect(s.accept('UNIT_MOVED')).toBe(true);
  });
  it('drops low priority within 250ms of a higher one, not after', () => {
    const c = clock(1000), s = createScheduler(c);
    expect(s.accept('ERA_CHANGED')).toBe(true);
    c.tick(100); expect(s.accept('UI_SELECT')).toBe(false);
    c.tick(200); expect(s.accept('UI_SELECT')).toBe(true);
  });
  it('lets higher priority through after a lower one', () => {
    const c = clock(1000), s = createScheduler(c);
    expect(s.accept('UI_SELECT')).toBe(true);
    c.tick(10); expect(s.accept('UNIT_LOST')).toBe(true);
  });
  it('caps polyphony but lets a higher priority steal a voice', () => {
    const c = clock(1000), s = createScheduler({ ...c, maxVoices: 2 });
    expect(s.accept('ORDER_PLANNED')).toBe(true);
    c.tick(5); expect(s.accept('ORDER_RESOLVED')).toBe(true);
    c.tick(5); expect(s.accept('UI_SELECT')).toBe(false);
    c.tick(5); expect(s.accept('BATTLE_START')).toBe(true);
  });
});

describe('audio differ', () => {
  it('first render emits nothing', () => {
    const g = game({ events: [{ id: 'e1', type: 'ERA_ADVANCED' }], battles: [{ id: 'b1', attackerId: 'p1', defenderId: 'p2', winnerId: 'p1', losses: ['u1'], retreat: null, attackerTactical: [{ face: 'IMPACT' }], defenderTactical: [] }] });
    expect(diffGame(null, g, 'p1').events).toEqual([]);
  });
  it('emits only new events by id, never replays', () => {
    const g1 = game({ events: [{ id: 'e1', type: 'CITY_FOUNDED' }] });
    const { next } = diffGame(null, g1, 'p1');
    expect(diffGame(next, g1, 'p1').events).toEqual([]);
    const g2 = game({ events: [...g1.events, { id: 'e2', type: 'REGION_REVEALED' }, { id: 'e3', type: 'UNKNOWN_TYPE' }] });
    expect(diffGame(next, g2, 'p1').events).toEqual(['REGION_REVEALED']);
  });
  it('maps battles to combat sounds', () => {
    const base = snapshotOf(game(), 'p1');
    const g = game({ battles: [{ id: 'b1', attackerId: 'p1', defenderId: 'p2', winnerId: 'p1', losses: ['u9'], retreat: 'h2', attackerTactical: [{ face: 'IMPACT' }], defenderTactical: [{ face: 'GUARD' }] }] });
    expect(diffGame(base, g, 'p1').events).toEqual(['BATTLE_START', 'DICE_ROLL', 'HIT', 'GUARD_BLOCK', 'UNIT_LOST', 'RETREAT']);
  });
  it('detects own unit moves, era, resonance, threats, phase', () => {
    const before = snapshotOf(game({ units: [{ id: 'u1', ownerId: 'p1', hexId: 'a' }, { id: 'u2', ownerId: 'p2', hexId: 'z' }] }), 'p1');
    const after = game({ phase: 'CONFLICTS', units: [{ id: 'u1', ownerId: 'p1', hexId: 'b' }, { id: 'u2', ownerId: 'p2', hexId: 'y' }], self: { era: 'II', resonance: { slots: [1] }, pendingChoices: [] }, threats: [{ id: 't1', kind: 'CAMP', status: 'CAMPED' }] });
    expect(diffGame(before, after, 'p1').events).toEqual(['CAMP_SPAWNED', 'UNIT_MOVED', 'RESONANCE_FILLED', 'ERA_CHANGED', 'PLAN_CONFIRMED']);
  });
  it('announces joins and reconnections', () => {
    const before = snapshotOf(game(), 'p1', [{ id: 'p1', connected: false }]);
    const after = game({ players: [{ id: 'p1' }, { id: 'p2' }] });
    expect(diffGame(before, after, 'p1', [{ id: 'p1', connected: true }]).events).toEqual(['PLAYER_JOINED', 'PLAYER_RECONNECTED']);
  });
});

describe('audio manager', () => {
  const fake = () => { const calls: string[] = []; const b: AudioBackend = { resume: () => calls.push('resume'), play: (e: string) => calls.push(`play:${e}`), startMusic: () => calls.push('music:on'), stopMusic: () => calls.push('music:off'), setMusicGain: (v: number) => calls.push(`mg:${v}`), setSfxGain: (v: number) => calls.push(`sg:${v}`) }; return { b, calls }; };
  const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } }; };
  it('defaults: music off, sfx on at 0.6; silent before the first gesture', () => {
    const { b, calls } = fake(); const m = new AudioManager({ backend: b, storage: mem(), now: () => 0 });
    expect(m.getSettings()).toMatchObject({ musicEnabled: false, sfxEnabled: true, sfxVolume: 0.6, muted: false });
    m.playSfx('UI_SELECT'); expect(calls.some(c => c.startsWith('play:'))).toBe(false);
    m.resume(); m.playSfx('UI_SELECT'); expect(calls).toContain('play:UI_SELECT'); expect(calls).not.toContain('music:on');
  });
  it('persists, mutes and starts music only when enabled', () => {
    const { b, calls } = fake(); const storage = mem(); const m = new AudioManager({ backend: b, storage, now: () => 0 });
    m.setMusicEnabled(true); expect(calls).toContain('music:on');
    m.muteAll(); m.playSfx('HIT'); expect(calls).not.toContain('play:HIT'); expect(calls).toContain('mg:0');
    expect(parseSettings(storage.getItem('aoh-alpha-audio-v1'))).toMatchObject({ musicEnabled: true, muted: true });
  });
  it('survives corrupt storage', () => { expect(parseSettings('{oops')).toMatchObject({ musicEnabled: false, sfxVolume: 0.6 }); });
});

describe('music score and dice frames', () => {
  it('is deterministic and cycles in 3-5 minutes', () => {
    expect(buildScore(1913)).toEqual(buildScore(1913));
    const s = buildScore(); expect(s.cycleSec).toBeGreaterThanOrEqual(180); expect(s.cycleSec).toBeLessThanOrEqual(300);
  });
  it('dice always end on the server face, within 700ms, without randomness', () => {
    for (const face of ['IMPACT', 'GUARD', 'MANEUVER', 'COMMAND', 'EMPTY'] as const) {
      const f = rollFrames(face, 2); expect(f.at(-1)).toBe(face); expect(f.length * 60).toBeLessThanOrEqual(700); expect(rollFrames(face, 2)).toEqual(f);
    }
  });
});

describe('audio wiring for build, research and planned orders', () => {
  const base = { phase: 'PLANNING', view: { round: 2 }, self: { era: 'FOUNDATION', orders: [] as unknown[], plannedActions: [] as unknown[], pendingChoices: [] as unknown[], resonance: { slots: [] as unknown[] } }, events: [], battles: [], threats: [], worldPulse: null, players: [{ id: 'p1' }], units: [], roundReports: [] as { resolution: { id: string; type: string }[] }[] };
  it('emits ORDER_PLANNED when an order is reserved, and BUILD/RESEARCH/MOVE/EXPLORE/FOUND from the round report', () => {
    const first = diffGame(null, base as never, 'p1');
    const planned = diffGame(first.next, { ...base, self: { ...base.self, plannedActions: [{}] } } as never, 'p1');
    expect(planned.events).toContain('ORDER_PLANNED');
    const resolved = diffGame(first.next, { ...base, roundReports: [{ resolution: [{ id: 'a', type: 'CONSTRUCTION' }, { id: 'b', type: 'RESEARCH' }, { id: 'c', type: 'EXPLORATION' }, { id: 'd', type: 'FOUNDATION' }, { id: 'e', type: 'MOVEMENT' }] }] } as never, 'p1');
    expect(resolved.events).toEqual(expect.arrayContaining(['BUILD_DONE', 'RESEARCH_DONE', 'REGION_REVEALED', 'CITY_FOUNDED', 'UNIT_MOVED']));
    expect(diffGame(null, { ...base, roundReports: [{ resolution: [{ id: 'a', type: 'CONSTRUCTION' }] }] } as never, 'p1').events).toEqual([]); // history is never replayed
  });
});
