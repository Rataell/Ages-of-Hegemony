import { describe, expect, it } from 'vitest';
import { ACTION_CLASS, ALPHA_CARDS, ActionClassSchema, AlphaCommandSchema, HexIdSchema, PlayerIdSchema, actionClassForCommand, type ActionClass, type AlphaCommand, type AlphaState } from '@aoh/game-domain';
import { alphaActionCapacity, alphaActionUsage, applyAlphaCommand, beginAlphaPlanning, createGame, migrateSnapshotV3ToV4, serializeAlphaState, setAlphaPhase } from '@aoh/game-engine';
import { AlphaRoomSchema } from '../apps/server/src/alpha-room.js';

const p1 = PlayerIdSchema.parse('p1');
const hex = (q: number) => HexIdSchema.parse(`${q},0`);
type CommandInput<T = AlphaCommand> = T extends AlphaCommand ? Omit<T, 'expectedVersion'> : never;

function game(actionsPerRound = 5): AlphaState {
  const core = createGame({
    gameId: 'action-economy', seed: 19,
    players: [{ id: p1, name: 'Ana' }, { id: 'p2', name: 'Beto' }],
    map: Array.from({ length: 14 }, (_, q) => ({ id: `${q},0`, q, r: 0, terrain: 'PLAINS' as const })),
    initialCities: [
      { id: 'c1', ownerId: p1, hexId: '0,0', name: 'Aurora' },
      { id: 'c2', ownerId: 'p2', hexId: '13,0', name: 'Merídia' },
    ],
  });
  if (!core.ok) throw new Error(core.error.message);
  const migrated = migrateSnapshotV3ToV4(core.value);
  if (!migrated.ok) throw new Error(migrated.error.message);
  const state = beginAlphaPlanning(migrated.value);
  state.rules.actionsPerRound = actionsPerRound;
  state.players[0]!.knownHexIds = state.core.map.map(tile => tile.id);
  state.units = [
    { id: 'u0', ownerId: p1, kind: 'INFANTRY', hexId: hex(0), recruitedRound: 1 },
    { id: 'u1', ownerId: p1, kind: 'INFANTRY', hexId: hex(0), recruitedRound: 1 },
    ...[3, 5, 7, 9, 11].map((q, index) => ({ id: `u${index + 2}`, ownerId: p1, kind: 'INFANTRY' as const, hexId: hex(q), recruitedRound: 1 })),
  ];
  return state;
}

function apply(state: AlphaState, command: CommandInput): ReturnType<typeof applyAlphaCommand> {
  return applyAlphaCommand(state, p1, { ...command, expectedVersion: state.version });
}

describe('main-action economy', () => {
  it('classifies every command exactly once with a valid shared class', () => {
    const commandTypes = AlphaCommandSchema.options.map(option => option.shape.type.value).sort();
    expect(Object.keys(ACTION_CLASS).sort()).toEqual(commandTypes);
    for (const value of Object.values(ACTION_CLASS)) expect(ActionClassSchema.safeParse(value).success).toBe(true);
  });

  it('counts a multi-hex group MOVE once, replacement once, and cancellation frees it', () => {
    const initial = game();
    const first = apply(initial, { type: 'QUEUE_ORDER', order: { id: 'march', type: 'MOVE', unitIds: ['u0', 'u1'], path: [hex(1), hex(2)] } });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(alphaActionUsage(first.value, p1)).toMatchObject({ used: 1, reserved: 1, limit: 5 });

    const replacement = apply(first.value, { type: 'QUEUE_ORDER', order: { id: 'march', type: 'MOVE', unitIds: ['u0', 'u1'], path: [hex(1)] } });
    expect(replacement.ok).toBe(true);
    if (!replacement.ok) return;
    expect(alphaActionUsage(replacement.value, p1)).toMatchObject({ used: 1, reserved: 1 });

    const cancelled = apply(replacement.value, { type: 'CANCEL_ORDER', orderId: 'march' });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(alphaActionUsage(cancelled.value, p1)).toMatchObject({ used: 0, reserved: 0 });
  });

  it('refuses the sixth main action atomically', () => {
    let state = game();
    for (let index = 2; index < 7; index++) {
      const q = 2 * index - 1;
      const queued = apply(state, { type: 'QUEUE_ORDER', order: { id: `move-${index}`, type: 'MOVE', unitIds: [`u${index}`], path: [hex(q + 1)] } });
      if (!queued.ok) throw new Error(queued.error.message);
      state = queued.value;
    }
    expect(alphaActionUsage(state, p1).used).toBe(5);
    const before = serializeAlphaState(state);
    const refused = apply(state, { type: 'QUEUE_ORDER', order: { id: 'sixth', type: 'MOVE', unitIds: ['u0'], path: [hex(1)] } });
    expect(refused).toMatchObject({ ok: false, error: { code: 'ACTION_LIMIT', message: 'Sem ações principais disponíveis nesta rodada.' } });
    expect(serializeAlphaState(state)).toBe(before);
  });

  it('loads a room whose match predates actionsPerRound with its legacy capacity intact', () => {
    const legacy = game(7);
    delete legacy.rules.actionsPerRound;
    const expected = alphaActionCapacity(legacy, p1);
    const room = AlphaRoomSchema.parse({
      id: legacy.gameId, version: 0, name: 'Legada', joinCode: 'abcdefghijklmnopqrstuv',
      hostGuestId: '00000000-0000-4000-8000-000000000001', preset: 'STANDARD', worldPreset: 'MIXED', seed: 19,
      seatLimit: 2, planningSeconds: 0, deadline: null,
      seats: [
        { guestId: '00000000-0000-4000-8000-000000000001', playerId: p1, name: 'Ana', civilization: legacy.players[0]!.civilization, ready: false },
        { guestId: '00000000-0000-4000-8000-000000000002', playerId: 'p2', name: 'Beto', civilization: legacy.players[1]!.civilization, ready: false },
      ],
      game: legacy,
    });
    expect(room.game?.rules.actionsPerRound).toBeUndefined();
    expect(alphaActionCapacity(room.game!, p1)).toBe(expected);
  });

  it('keeps used actions within the limit over deterministic random command sequences', () => {
    for (let seed = 1; seed <= 12; seed++) {
      let state = game(), random = seed;
      for (let step = 0; step < 30; step++) {
        random = (random * 1664525 + 1013904223) >>> 0;
        const unit = 2 + (random % 5), q = 2 * unit - 1, choice = (random >>> 8) % 4;
        const command: CommandInput = choice === 0
          ? { type: 'QUEUE_ORDER', order: { id: `move-${unit}`, type: 'MOVE', unitIds: [`u${unit}`], path: [hex(q + 1)] } }
          : choice === 1
            ? { type: 'CANCEL_ORDER', orderId: `move-${unit}` }
            : choice === 2
              ? { type: 'SET_DEFENSE_POSTURE', posture: random % 2 ? 'HOLD' : 'MANEUVER' }
              : { type: 'QUEUE_ORDER', order: { id: `invalid-${step}`, type: 'MOVE', unitIds: [`u${unit}`], path: [hex(13)] } };
        const before = serializeAlphaState(state), beforeUsage = alphaActionUsage(state, p1).used;
        const result = apply(state, command);
        if (result.ok) {
          const afterUsage = alphaActionUsage(result.value, p1).used;
          expect(afterUsage).toBeLessThanOrEqual(result.value.rules.actionsPerRound!);
          if (actionClassForCommand({ ...command, expectedVersion: state.version } as AlphaCommand, state.phase) === 'MAIN') expect(afterUsage - beforeUsage).toBeLessThanOrEqual(1);
          state = result.value;
        } else expect(serializeAlphaState(state)).toBe(before);
      }
    }
  });

  it('replays representative MAIN, FREE and REACTION commands deterministically', () => {
    const main = game();
    const free = game();
    const reaction = game(), reactionCard = ALPHA_CARDS.find(card => card.timing === 'REACTION')!;
    setAlphaPhase(reaction, 'CONFLICTS');
    reaction.players[0]!.hand = [reactionCard.id];
    const cases: Array<{ actionClass: ActionClass; state: AlphaState; command: CommandInput }> = [
      { actionClass: 'MAIN', state: main, command: { type: 'QUEUE_ORDER', order: { id: 'replay-main', type: 'MOVE', unitIds: ['u0'], path: [hex(1)] } } },
      { actionClass: 'FREE', state: free, command: { type: 'SET_DEFENSE_POSTURE', posture: 'MANEUVER' } },
      { actionClass: 'REACTION', state: reaction, command: { type: 'PLAY_CARD', cardId: reactionCard.id } },
    ];
    for (const sample of cases) {
      const command = { ...sample.command, expectedVersion: sample.state.version } as AlphaCommand;
      expect(actionClassForCommand(command, sample.state.phase)).toBe(sample.actionClass);
      const first = applyAlphaCommand(structuredClone(sample.state), p1, command);
      const second = applyAlphaCommand(structuredClone(sample.state), p1, command);
      expect(first.ok).toBe(true);
      expect(second.ok).toBe(true);
      if (first.ok && second.ok) expect(serializeAlphaState(first.value)).toBe(serializeAlphaState(second.value));
    }
  });
});
