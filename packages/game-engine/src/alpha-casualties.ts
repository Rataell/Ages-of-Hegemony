import type { AlphaState, AlphaUnit, PlayerId } from '@aoh/game-domain';

/** Why a casualty priority cannot be set now, or null. Legal while planning and before the seat confirms; only combat kinds are listed. */
export function casualtyPriorityBlock(state: AlphaState, actor: PlayerId, order: readonly AlphaUnit['kind'][], hexId: string | null): string | null {
  const seat = state.players.find(player => player.playerId === actor);
  if (!seat) return 'Jogador desconhecido.';
  if (state.phase !== 'PLANNING') return 'A prioridade de baixas só muda no Planejamento, antes do conflito.';
  if (seat.ready) return 'Reabra o Planejamento (desconfirme) para mudar a prioridade de baixas.';
  const civil = order.find(kind => state.rules.units[kind].strength <= 0);
  if (civil) return 'Só peças de combate entram na prioridade de baixas.';
  if (hexId !== null && !state.units.some(unit => unit.ownerId === actor && unit.hexId === hexId)) return 'Nenhuma peça sua nesse hex.';
  return null;
}
