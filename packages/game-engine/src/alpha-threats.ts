import type { AlphaState, PlayerId, RepercussionOp } from '@aoh/game-domain';
import { alphaEvent } from './alpha-events.js';

/**
 * Hook for the event commands SPAWN / REINFORCE / ACTIVATE (canon §21b). Repercussão, Encontro and Pulso call it.
 * TODO(S3): replace the body with the real threat engine. Until then it only records that a threat was requested.
 */
export function applyThreatCommand(state: AlphaState, source: PlayerId | null, op: Extract<RepercussionOp, { op: 'THREAT' }>): void {
  alphaEvent(state, 'THREAT_PENDING', `Ameaça solicitada: ${op.command}${op.kind ? ` (${op.kind})` : ''}.`, source ? [source] : null);
}
