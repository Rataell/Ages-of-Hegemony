import { AlphaOrderTypeSchema, emptyOrderCount, orderTypeForOrder, orderTypeForPlanned, type AlphaState, type AlphaOrderType, type PlayerId } from '@aoh/game-domain';
import { institutionBonus } from './alpha-institutions.js';

export interface AlphaActionUsage {
  used:number;
  reserved:number;
  limit:number;
  /** Orders used this round by type: committed plus reserved (canon §2; types may repeat). */
  byOrder:Record<AlphaOrderType,number>;
}

/**
 * Orders available this round (canon §1): the match's `actionsPerRound` (5 by default) plus any "+N" modifier still in play
 * (advisors, strategy cards, leader abilities this round). Governments no longer change the count. One function feeds the
 * engine checks and the projected counter, so the client shows exactly what the server enforces.
 */
export function alphaActionCapacity(state:AlphaState,playerId:PlayerId):number {
  const player=state.core.players.find(candidate=>candidate.id===playerId);
  if(!player)return 0;
  const base=state.rules.actionsPerRound??5;
  return Math.max(0,base+institutionBonus(state,playerId,'COMMAND'));
}

export function alphaActionUsage(state:AlphaState,playerId:PlayerId):AlphaActionUsage {
  const player=state.players.find(candidate=>candidate.playerId===playerId);
  const reserved=(player?.orders.length??0)+(player?.plannedActions.length??0);
  const byOrder=emptyOrderCount();
  if(player){
    for(const type of AlphaOrderTypeSchema.options)byOrder[type]+=player.ordersSpent[type]??0;
    for(const order of player.orders)byOrder[orderTypeForOrder(order)]+=1;
    for(const action of player.plannedActions)byOrder[orderTypeForPlanned(action)]+=1;
  }
  return {used:(player?.spentCommands??0)+reserved,reserved,limit:alphaActionCapacity(state,playerId),byOrder};
}

/** Only writer for the Orders ledger. RESERVE validates an order already placed in the private queue; COMMIT records the type. */
export function chargeMainAction(state:AlphaState,playerId:PlayerId,mode:'COMMIT'|'RESERVE'='COMMIT',orderType:AlphaOrderType|null=null):void {
  const player=state.players.find(candidate=>candidate.playerId===playerId);
  if(!player)throw new Error('Jogador não encontrado.');
  if(mode==='COMMIT'){player.spentCommands+=1;if(orderType)player.ordersSpent[orderType]=(player.ordersSpent[orderType]??0)+1;}
  if(alphaActionUsage(state,playerId).used>alphaActionCapacity(state,playerId))throw new Error('Sem ações principais disponíveis nesta rodada.');
}
