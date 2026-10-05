import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';
import { PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { MemorySink, PlaytestRecorder, playtestEnabled, playtestRecorderFor, summarizeCommand } from '../apps/server/src/playtest-log.js';
// @ts-expect-error plain ESM script without types
import { compare, markdown, summarize } from '../scripts/alpha-playtest-summary.mjs';

const P1 = PlayerIdSchema.parse('p1'), P2 = PlayerIdSchema.parse('p2');
const SENTINEL = 'Fulano-Sentinela-Pessoal';
const fresh = () => beginAlphaPlanning(createAlphaGame({ gameId: 'playtest-log', seed: 5, players: [{ id: 'p1', name: SENTINEL, civilization: 'valgard' }, { id: 'p2', name: 'Outra Pessoa', civilization: 'meridia' }], preset: 'QUICK' }));
/** Both seats confirm until the round advances `rounds` times; every command goes through the observer. */
function play(recorder: PlaytestRecorder | null, rounds: number): AlphaState {
  const initial = fresh();
  let state = initial;
  recorder?.start(state);
  const target = state.core.round + rounds;
  for (let guard = 0; guard < 80 && state.core.round < target && state.core.status === 'ACTIVE'; guard++) {
    for (const seat of [P1, P2]) {
      const command = state.phase === 'PLANNING' && !state.players.find(p => p.playerId === seat)!.ambitionsChosen
        ? { type: 'CHOOSE_AMBITIONS', expectedVersion: state.version, cardIds: state.players.find(p => p.playerId === seat)!.ambitions.slice(0, 2) }
        : { type: 'READY', expectedVersion: state.version };
      const before = state, result = applyAlphaCommand(state, seat, command);
      recorder?.observe(before, seat, command, result);
      if (result.ok) state = result.value;
      if (command.type === 'CHOOSE_AMBITIONS' && result.ok) {
        const ready = { type: 'READY', expectedVersion: state.version }, b2 = state, r2 = applyAlphaCommand(state, seat, ready);
        recorder?.observe(b2, seat, ready, r2); if (r2.ok) state = r2.value;
      }
    }
  }
  return state;
}

afterEach(() => vi.unstubAllEnvs());

describe('playtest log is development-only', () => {
  it('is off by default and never on in production', () => {
    expect(playtestEnabled({})).toBe(false);
    expect(playtestEnabled({ ALPHA_PLAYTEST_LOG: '0' })).toBe(false);
    expect(playtestEnabled({ ALPHA_PLAYTEST_LOG: '1' })).toBe(true);
    expect(playtestEnabled({ ALPHA_PLAYTEST_LOG: '1', NODE_ENV: 'production' })).toBe(false);
    expect(playtestRecorderFor('g-off', {})).toBeNull();
    expect(playtestRecorderFor('g-prod', { ALPHA_PLAYTEST_LOG: '1', NODE_ENV: 'production' })).toBeNull();
  });

  it('records valid events without personal data and does not touch the state', () => {
    const sink = new MemorySink(), clock = (() => { let t = 1000; return () => (t += 7); })();
    const withLog = play(new PlaytestRecorder(sink, clock), 2), without = play(null, 2);
    expect(JSON.stringify(withLog)).toBe(JSON.stringify(without));
    const types = new Set(sink.events.map(e => e.type));
    for (const type of ['session_start', 'planning_open', 'command', 'ready', 'round_close']) expect(types).toContain(type);
    const text = sink.events.map(e => JSON.stringify(e)).join('\n');
    for (const line of text.split('\n')) expect(() => JSON.parse(line)).not.toThrow();
    expect(text).not.toContain(SENTINEL);
    expect(text).not.toContain('Outra Pessoa');
    expect(sink.events.map(e => e.seq)).toEqual(sink.events.map((_, i) => i + 1));
    const ready = sink.events.find(e => e.type === 'ready')!;
    expect(typeof ready.planningMs).toBe('number');
    const close = sink.events.find(e => e.type === 'round_close')!;
    expect(close).toMatchObject({ before: expect.any(Object), after: expect.any(Object), cityLevels: expect.any(Array) });
  });

  it('records rejected commands with the error code and keeps free text out of command summaries', () => {
    const sink = new MemorySink(), recorder = new PlaytestRecorder(sink), state = fresh();
    recorder.start(state);
    const command = { type: 'SETTLE', expectedVersion: state.version, unitId: 'nope', name: SENTINEL };
    recorder.observe(state, P1, command, applyAlphaCommand(state, P1, command));
    const rejected = sink.events.find(e => e.type === 'rejected')!;
    expect(rejected.code).toBeTruthy();
    expect(JSON.stringify(sink.events)).not.toContain(SENTINEL);
    expect(summarizeCommand(command)).not.toHaveProperty('name');
  });

  it('writes events.jsonl through the service only when enabled and leaves guest ids and names out', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'aoh-playtest-'));
    vi.stubEnv('ALPHA_PLAYTEST_LOG', '1'); vi.stubEnv('ALPHA_PLAYTEST_DIR', dir);
    const service = new AlphaGameService(new InMemoryAlphaRepository()), a = { guestId: randomUUID() }, b = { guestId: randomUUID() };
    const created = await service.create(a, { name: 'Mesa', displayName: SENTINEL, preset: 'QUICK', seatLimit: 2, seed: 9, planningSeconds: 0 });
    if (!created.ok) throw new Error(created.error.message);
    const view = (await service.join(b, created.value.joinCode, 'Segunda Pessoa'));
    if (!view.ok) throw new Error(view.error.message);
    let v = view.value;
    for (const [actor, civilization] of [[a, 'aurelia'], [b, 'valgard']] as const) {
      const chosen = await service.lobby(actor, v.id, { type: 'CHOOSE_CIVILIZATION', expectedVersion: v.version, civilization }, 0); if (!chosen.ok) throw new Error(chosen.error.message); v = chosen.value;
      const ready = await service.lobby(actor, v.id, { type: 'LOBBY_READY', expectedVersion: v.version, ready: true }, 0); if (!ready.ok) throw new Error(ready.error.message); v = ready.value;
    }
    const started = await service.lobby(a, v.id, { type: 'START', expectedVersion: v.version }, 1000); if (!started.ok) throw new Error(started.error.message);
    const chosen = await service.command(a, v.id, { type: 'CHOOSE_AMBITIONS', expectedVersion: started.value.game!.version, cardIds: started.value.game!.self.ambitions.slice(0, 2) }, 1500);
    if (!chosen.ok) throw new Error(chosen.error.message);
    const sent = await service.command(a, v.id, { type: 'READY', expectedVersion: chosen.value.game!.version }, 2000);
    expect(sent.ok).toBe(true);
    const folder = join(dir, `${new Date().toISOString().slice(0, 10)}-${v.id}`), file = join(folder, 'events.jsonl');
    expect(existsSync(file)).toBe(true);
    const raw = readFileSync(file, 'utf8');
    expect(raw.split('\n').filter(Boolean).every(line => { JSON.parse(line); return true; })).toBe(true);
    for (const secret of [SENTINEL, 'Segunda Pessoa', a.guestId, b.guestId]) expect(raw).not.toContain(secret);
    expect(raw).toContain('"type":"ready"');
  });
});

describe('playtest summary', () => {
  it('summarizes a session and compares two', () => {
    const sink = new MemorySink();
    play(new PlaytestRecorder(sink, (() => { let t = 0; return () => (t += 50); })()), 3);
    const summary = summarize(sink.events);
    expect(summary.session.seats).toBe(2);
    expect(Object.keys(summary.perSeat)).toEqual(['p1', 'p2']);
    expect(summary.perSeat.p1.roundsClosed).toBeGreaterThan(0);
    expect(summary.perSeat.p1.planningMs.max).toBeGreaterThanOrEqual(0);
    expect(summary).toHaveProperty('contact.firstContactRound');
    expect(markdown(summary)).toContain('## Por assento');
    expect(compare(summary, summary, ['a', 'b'])).toContain('| primeiro contato |');
  });
});
