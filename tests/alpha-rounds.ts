import type { AlphaState, PlayerId } from '@aoh/game-domain';
import { applyAlphaCommand } from '@aoh/game-engine';

/** Applies a command and returns the new state, failing loudly with the engine's own message. */
export function must(state: AlphaState, actor: PlayerId, command: Record<string, unknown>): AlphaState {
  const result = applyAlphaCommand(state, actor, { ...command, expectedVersion: state.version });
  if (!result.ok) throw new Error(`${String(command.type)}: ${result.error.code} ${result.error.message}`);
  return result.value;
}

/** Every player who has not confirmed the current phase confirms it, in the given order (default: seat order). */
export function readyAll(state: AlphaState, order: readonly PlayerId[] = state.players.map(p => p.playerId)): AlphaState {
  let current = state;
  const round = current.core.round, phase = current.phase;
  for (const actor of order) {
    if (current.core.round !== round || current.phase !== phase || current.core.status !== 'ACTIVE') break;
    const seat = current.players.find(p => p.playerId === actor)!;
    if (!seat.ambitionsChosen) current = must(current, actor, { type: 'CHOOSE_AMBITIONS', cardIds: seat.ambitions.slice(0, 2) });
    if (!current.players.find(p => p.playerId === actor)!.ready) current = must(current, actor, { type: 'READY' });
  }
  return current;
}

/** Confirms phase after phase until the round number advances or the match ends. `produce` adds a PRODUCE action for every city. */
export function completeRound(state: AlphaState, options: { produce?: boolean; order?: readonly PlayerId[] } = {}): AlphaState {
  let current = state;
  const round = current.core.round;
  for (let guard = 0; guard < 24 && current.core.round === round && current.core.status === 'ACTIVE'; guard++) {
    if (current.phase === 'URBAN_ACTIONS' && options.produce) current = produceAll(current);
    current = readyAll(current, options.order);
  }
  return current;
}

/** PRODUCE in every city that has not acted, for every player. */
export function produceAll(state: AlphaState): AlphaState {
  let current = state;
  for (const owner of state.core.players) {
    for (const city of owner.civilization.cities) {
      const meta = current.cities.find(c => c.cityId === city.id);
      if (meta && meta.currentOwnerId === owner.id && meta.status === 'OWNED' && meta.urbanActionsUsed === 0) current = must(current, owner.id, { type: 'URBAN_ACTION', cityId: city.id, action: 'PRODUCE' });
    }
  }
  return current;
}

/** The canonical urban action, applied to `actor`'s first city unless `cityId` is given. State must be in URBAN_ACTIONS. */
export function urban(state: AlphaState, actor: PlayerId, action: string, extra: Record<string, unknown> = {}, cityId?: string) {
  const id = cityId ?? state.core.players.find(p => p.id === actor)!.civilization.cities[0]!.id;
  return applyAlphaCommand(state, actor, { type: 'URBAN_ACTION', expectedVersion: state.version, cityId: id, action, ...extra });
}
