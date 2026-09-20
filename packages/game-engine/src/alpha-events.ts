import type { AlphaState, PlayerId } from '@aoh/game-domain';

export function alphaEvent(state: AlphaState, type: string, message: string, audience: PlayerId[] | null = null): void {
  state.events.push({ id: `event-${state.events.length + 1}`, round: state.core.round, type, message, audience });
}
