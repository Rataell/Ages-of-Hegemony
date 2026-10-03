import type { AlphaState, PlayerId } from '@aoh/game-domain';
import { commandPoints } from './civilization.js';
import { institutionBonus } from './alpha-institutions.js';

export interface AlphaActionUsage {
  used:number;
  reserved:number;
  limit:number;
}

/**
 * Main actions available this round: the match base (configured actions per round; legacy snapshots use the old base command
 * points) plus every active modifier defined as "+N ações principais" (Comando): researched advancements, hired advisors,
 * strategy cards and leader abilities played this round (round-scoped temporary effects) and the government delta. One
 * function feeds the engine checks and the projected counter, so the client shows exactly what the server enforces.
 */
export function alphaActionCapacity(state:AlphaState,playerId:PlayerId):number {
  const player=state.core.players.find(candidate=>candidate.id===playerId);
  if(!player)return 0;
  const base=state.rules.actionsPerRound??state.rules.baseCommandPoints;
  const government=commandPoints(player.civilization,state.core.config)-state.core.config.baseCommandPoints;
  return Math.max(0,base+government+institutionBonus(state,playerId,'COMMAND'));
}

export function alphaActionUsage(state:AlphaState,playerId:PlayerId):AlphaActionUsage {
  const player=state.players.find(candidate=>candidate.playerId===playerId);
  const reserved=(player?.orders.length??0)+(player?.plannedActions.length??0);
  return {used:(player?.spentCommands??0)+reserved,reserved,limit:alphaActionCapacity(state,playerId)};
}

/** Only writer for the main-action ledger. RESERVE validates an order already placed in the private queue. */
export function chargeMainAction(state:AlphaState,playerId:PlayerId,mode:'COMMIT'|'RESERVE'='COMMIT'):void {
  const player=state.players.find(candidate=>candidate.playerId===playerId);
  if(!player)throw new Error('Jogador não encontrado.');
  if(mode==='COMMIT')player.spentCommands+=1;
  if(alphaActionUsage(state,playerId).used>alphaActionCapacity(state,playerId))throw new Error('Sem ações principais disponíveis nesta rodada.');
}
