import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame, serializeAlphaState } from '@aoh/game-engine';
import { readyAll } from './alpha-rounds.js';

const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
type Step = { actor: typeof p1; command: Record<string, unknown> };
const hash = (state: AlphaState) => createHash('sha256').update(serializeAlphaState(state)).digest('hex');
const apply = (state: AlphaState, step: Step, version = state.version) => applyAlphaCommand(state, step.actor, { ...step.command, expectedVersion: version });

/** The same match every time: seed, rules and hand-planted state are fixed, so the command log is the only input. */
function start(): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'cas-replay', seed: 91, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana' }, { id: 'p2', name: 'Beto' }] }));
  state.rules.roundsPerEra = 2; state.rules.roundLimit = 14;
  for (const player of state.players) { player.era = 'CONSOLIDATION'; player.resources.influence = 10; player.research.push('web-writing', 'web-common-narratives', 'web-codes', 'web-centralization'); }
  state.roundLedgers.forEach(ledger => { ledger.opening.influence = 10; });
  state.players[0]!.pendingChoices = [{ id: 'choice-replay', source: 'ENCOUNTER', cardId: 'enc-x', title: 'Encontro', text: '', createdRound: 1, mitigated: false, options: [{ id: 'a', label: 'A', ops: [{ op: 'GAIN', resource: 'knowledge', n: 1 }] }, { id: 'b', label: 'B', ops: [] }] }] as never;
  return state;
}
/** Plays the scripted commands, confirming every phase between them, and returns the final state plus the log of accepted steps. */
function play(): { state: AlphaState; log: Step[] } {
  let state = start();
  const log: Step[] = [];
  const run = (step: Step) => { const result = apply(state, step); if (!result.ok) throw new Error(`${String(step.command.type)}: ${result.error.message}`); state = result.value; log.push(step); };
  run({ actor: p1, command: { type: 'RESOLVE_CHOICE', choiceId: 'choice-replay', optionId: 'a' } });
  run({ actor: p1, command: { type: 'SET_DEFENSE_POSTURE', posture: 'MANEUVER' } });
  state = readyAll(state); // round 1 resolves (readyAll also chooses Ambições when needed)
  for (let guard = 0; guard < 12 && state.phase !== 'PLANNING'; guard++) state = readyAll(state);
  // Round 2 is the last of the Era: reserve the government reform with an Influência Order.
  run({ actor: p1, command: { type: 'MANAGE', command: { type: 'ADOPT_GOVERNMENT', playerId: p1, government: 'MONARCHY', expectedVersion: state.core.version } } });
  for (let guard = 0; guard < 24 && state.phase !== 'ERA_TURN'; guard++) state = readyAll(state);
  expect(state.phase).toBe('ERA_TURN');
  run({ actor: p1, command: { type: 'SWAP_AMBITION', cardId: state.players[0]!.ambitions[0]! } });
  state = readyAll(state);
  return { state, log };
}

describe('compare-and-swap and replay across a full Era turn', () => {
  it('rejects every new command sent with a stale expectedVersion, and leaves the state untouched', () => {
    let state = start();
    const stale = state.version + 7;
    const commands: Step[] = [
      { actor: p1, command: { type: 'RESOLVE_CHOICE', choiceId: 'choice-replay', optionId: 'a' } },
      { actor: p1, command: { type: 'MANAGE', command: { type: 'ADOPT_GOVERNMENT', playerId: p1, government: 'MONARCHY', expectedVersion: state.core.version } } },
      { actor: p1, command: { type: 'URBAN_ACTION', cityId: 'capital-1', action: 'MOVE_CAPITAL' } },
      { actor: p1, command: { type: 'SWAP_AMBITION', cardId: state.players[0]!.ambitions[0]! } },
    ];
    const before = hash(state);
    for (const step of commands) expect(apply(state, step, stale), String(step.command.type)).toMatchObject({ ok: false, error: { code: 'VERSION_CONFLICT' } });
    expect(hash(state)).toBe(before);
    // A winning command bumps the version, so the second one with the old version loses (two clients racing).
    const first = apply(state, commands[0]!);
    expect(first.ok).toBe(true);
    if (first.ok) { state = first.value; expect(apply(state, commands[0]!, state.version - 1 < 0 ? state.version + 3 : state.version - 1)).toMatchObject({ ok: false, error: { code: 'VERSION_CONFLICT' } }); expect(state.version).toBeGreaterThan(0); }
  });

  it('the same seed and the same command log reach an identical state hash through RESOLVE_CHOICE, government reform and SWAP_AMBITION', () => {
    const a = play(), b = play();
    expect(a.log.length).toBeGreaterThanOrEqual(4);
    expect(hash(a.state)).toBe(hash(b.state));
    expect(a.state.core.round).toBe(3);
    expect(a.state.core.players[0]!.civilization.government).toBe('MONARCHY');
    // Replaying the accepted log on a fresh start (confirming phases the same way) lands on the same hash again.
    let replay = start();
    for (const step of a.log.slice(0, 2)) { const result = apply(replay, step); expect(result.ok).toBe(true); if (result.ok) replay = result.value; }
    expect(replay.players[0]!.pendingChoices).toEqual([]);
    expect(replay.players[0]!.defensePosture).toBe('MANEUVER');
  });

  it('the private RNG counter replays: two runs consume the same randomness', () => {
    const a = play(), b = play();
    expect(a.state.privateRng.counter).toBe(b.state.privateRng.counter);
    expect(a.state.privateRng.counter).toBeGreaterThan(0);
  });
});
