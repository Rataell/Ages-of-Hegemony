import type { AlphaState, PlayerId } from '@aoh/game-domain';
import { commandPoints } from './civilization.js';
import { institutionBonus } from './alpha-institutions.js';

export interface AlphaActionUsage {
  used:number;
  reserved:number;
  limit:number;
}

/** New matches use the configured fixed limit. Legacy snapshots keep their previous modifier-based capacity. */
export function alphaActionCapacity(state:AlphaState,playerId:PlayerId):number {
  if(state.rules.actionsPerRound!==undefined)return state.rules.actionsPerRound;
  const player=state.core.players.find(candidate=>candidate.id===playerId);
  if(!player)return 0;
  return Math.max(0,state.rules.baseCommandPoints+commandPoints(player.civilization,state.core.config)-state.core.config.baseCommandPoints+institutionBonus(state,playerId,'COMMAND'));
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
