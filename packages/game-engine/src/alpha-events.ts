import type { AlphaState, PlayerId, ResolutionEvent } from '@aoh/game-domain';

export function alphaEvent(state: AlphaState, type: string, message: string, audience: PlayerId[] | null = null): void {
  state.events.push({ id: `event-${state.events.length + 1}`, round: state.core.round, type, message, audience });
}

export function resolutionEvent(state:AlphaState,event:Omit<ResolutionEvent,'id'|'round'>):void {
  state.resolutionEvents.push({id:`resolution-${state.resolutionEvents.length+1}`,round:state.core.round,...event,visibleTo:event.visibleTo===null?null:[...new Set(event.visibleTo)]});
}
