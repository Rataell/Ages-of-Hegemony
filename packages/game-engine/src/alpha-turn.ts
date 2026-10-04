import { proposeTrade, respondTrade } from './alpha-trade.js';
import { AlphaCommandSchema, AlphaStateSchema, actionClassForCommand, type AlphaError, type AlphaState, type PlayerId } from '@aoh/game-domain';
import { err, ok, type Result } from '@aoh/shared';
import { applyCommand } from './engine.js';
import { validateMilitaryOrder } from './alpha-military.js';
import { pendingArrivals, stackBlock } from './alpha-stack.js';
import { alphaPay, alphaResourcePayment } from './alpha-resources.js';
import { advanceEra, civilizationAbility } from './alpha-institutions.js';
import { diplomacyBlock, manageDiplomacy, tradePath, validateInfluence } from './alpha-diplomacy.js';
import { refreshKnowledge, validateExploration, visibleHexIds } from './alpha-world.js';
import { manageCard, playCivilizationCard } from './alpha-cards.js';
import { disembark, embark } from './alpha-naval.js';
import { declareHegemony, refreshHegemony } from './alpha-hegemony.js';
import { settleWithPioneer } from './alpha-cities.js';
import { alphaEvent, resolutionEvent } from './alpha-events.js';
import { LEGAL_COMMANDS, advanceAfterReady, openRound } from './alpha-phases.js';
import { performUrbanAction, syncCityMetadata, urbanBlock } from './alpha-urban.js';
import { ensureLeaders, useLeaderAbility } from './alpha-leaders.js';
import { alphaActionCapacity, chargeMainAction } from './alpha-actions.js';
import { contestPresence } from './alpha-culture.js';
import { independentAction } from './alpha-independents.js';
import { kitWorksCost } from './alpha-kits.js';

export { alphaEvent, resolutionEvent } from './alpha-events.js';

export function alphaCommandCapacity(state: AlphaState, playerId: PlayerId): number {
  return alphaActionCapacity(state,playerId);
}

/** Opens the first round (or any round waiting at WORLD_PULSE): ledgers, cards and one world pulse, then PLANNING. No city output is credited. */
export function beginAlphaPlanning(input: AlphaState): AlphaState {
  const state = AlphaStateSchema.parse(input);
  ensureLeaders(state);
  if (state.phase !== 'WORLD_PULSE') throw new Error('Início requer o Pulso do mundo.');
  openRound(state);
  return AlphaStateSchema.parse(state);
}

/** Commands that exist in the schema but have no rules yet. No control may send them; the reducer refuses them with NOT_IMPLEMENTED. */
export const ALPHA_UNSUPPORTED_COMMANDS = [] as const;
const UNSUPPORTED = new Set<string>(ALPHA_UNSUPPORTED_COMMANDS as readonly string[]);
const PHASE_LABEL: Record<AlphaState['phase'], string> = {
  WORLD_PULSE: 'Pulso do mundo', PLANNING: 'Planejamento', URBAN_ACTIONS: 'Ações urbanas', ORDERS_MOVEMENT: 'Ordens e movimento',
  DIPLOMACY_TRADE: 'Diplomacia e comércio', CONFLICTS: 'Conflitos', INTEGRATION_MAINTENANCE: 'Integração e manutenção', END_ROUND: 'Fim da rodada',
};

/** Authenticated actor is separate from command JSON. No repository or network in this reducer. */
export function applyAlphaCommand(input: AlphaState, actor: PlayerId, raw: unknown): Result<AlphaState, AlphaError> {
  const validated = AlphaStateSchema.safeParse(input);
  if (!validated.success) return err({ code:'INVALID_STATE', message:'Estado alpha inválido.' });
  const parsed = AlphaCommandSchema.safeParse(raw);
  if (!parsed.success) return err({ code:'INVALID_INPUT', message:'Comando inválido.' });
  const state = validated.data; const command = parsed.data;
  ensureLeaders(state);
  if (command.expectedVersion !== state.version) return err({ code:'VERSION_CONFLICT', message:'A partida mudou. Atualize antes de confirmar novamente.' });
  if (state.version === Number.MAX_SAFE_INTEGER) return err({ code:'NUMERIC_OVERFLOW', message:'Limite de versões atingido.' });
  if (state.core.status !== 'ACTIVE') return err({ code:'NOT_ACTIVE', message:'Esta partida já terminou.' });
  const player = state.players.find(p => p.playerId === actor);
  if (!player) return err({ code:'FORBIDDEN', message:'Você não ocupa um lugar nesta partida.' });
  if (UNSUPPORTED.has(command.type)) return err({ code:'NOT_IMPLEMENTED', message:'Esta ação ainda não está disponível na alpha.' });
  if (!LEGAL_COMMANDS[state.phase].has(command.type)) return err({ code:'WRONG_PHASE', message:`Esta decisão não é permitida na fase ${PHASE_LABEL[state.phase]}.` });
  if (command.type === 'UNREADY' && !player.ready) return err({ code:'NOT_READY', message:'Você ainda não confirmou esta fase.' });
  if (player.ready && command.type !== 'UNREADY') return err({ code:'ALREADY_READY', message:'Suas decisões já estão confirmadas para esta fase.' });
  try {
    const actionClass=actionClassForCommand(command,state.phase);
    let reservedMainAction=false;
    if (command.type === 'MANAGE') {
      if (command.command.type === 'ADVANCE_PHASE' || command.command.type === 'SUBMIT_ORDER') return err({ code:'FORBIDDEN', message:'Use os controles de planejamento da alpha.' });
      if (command.command.playerId !== actor) return err({ code:'FORBIDDEN', message:'Você só pode comandar sua própria civilização.' });
      if (command.command.type === 'BUILD_DISTRICT' || command.command.type === 'BUILD_BUILDING') return err({ code:'USE_URBAN_ACTION', message:'Construa pela ação urbana Construir.' });
      const management=command.command;
      const occupied=state.occupations.some(o=>('cityId' in management&&management.type!=='FOUND_CITY'&&management.cityId===o.cityId)||('hexId' in management&&state.core.map.find(t=>t.id===management.hexId)?.controllerCityId===o.cityId));
      if(occupied)throw new Error('Integre a cidade ocupada antes de administrar seus territórios e construções.');
      const pay=alphaResourcePayment(state);
      const result = applyCommand(state.core,{ ...command.command, expectedVersion:state.core.version },management.type==='IMPROVE_HEX'?(player,cost)=>pay(player,kitWorksCost(state,actor,cost)):pay);
      if (!result.ok) return result;
      state.core = result.value; syncCityMetadata(state);
      alphaEvent(state,'MANAGEMENT','Decisão de gestão aplicada.',[actor]);
    } else if (command.type === 'SET_DEFENSE_POSTURE') {
      player.defensePosture = command.posture;
      alphaEvent(state, 'DEFENSE_POSTURE', 'Postura defensiva definida.', [actor]);
    } else if (command.type === 'LEADER_ABILITY') {
      useLeaderAbility(state, actor);
    } else if (command.type === 'CONTEST_PRESENCE') {
      contestPresence(state, actor, command);
    } else if (command.type === 'PROPOSE_TRADE') {
      proposeTrade(state, actor, command);
    } else if (command.type === 'RESPOND_TRADE') {
      respondTrade(state, actor, command);
    } else if (command.type === 'INDEPENDENT_ACTION') {
      independentAction(state, actor, command);
    } else if (command.type === 'URBAN_ACTION') {
      if(state.phase==='PLANNING'){
        const params={...(command.build?{build:command.build}:{}),...(command.unit?{unit:command.unit}:{}),...(command.advancementId?{advancementId:command.advancementId}:{})};
        const blocked=urbanBlock(state,actor,command.cityId,command.action,params);if(blocked)throw new Error(blocked);
        player.plannedActions.push({id:command.planId??`action-${state.version}`,type:'URBAN_ACTION',cityId:command.cityId,action:command.action,...params});reservedMainAction=true;
      }else performUrbanAction(state, actor, command);
    } else if (command.type === 'UNREADY') {
      // Everyone ready advances the phase inside the same command, so a withdrawable READY always has someone still deciding.
      player.ready = false;
    } else if (command.type === 'READY') {
      if(!player.ambitionsChosen)throw new Error('Escolha duas ambições antes de confirmar seu primeiro planejamento.');
      player.ready = true;
      if (state.players.every(p => p.ready)) advanceAfterReady(state);
    } else if(command.type==='QUEUE_ORDER'||command.type==='CANCEL_ORDER') {
      if(command.type==='CANCEL_ORDER'){player.orders=player.orders.filter(o=>o.id!==command.orderId);player.plannedActions=player.plannedActions.filter(action=>action.id!==command.orderId);}
      else {
        if(command.order.type==='EXPLORE')validateExploration(state,actor,command.order);
        else if(command.order.type==='TRADE')tradePath(state,actor,command.order.fromCityId,command.order.toCityId);
        else if(command.order.type==='INFLUENCE')validateInfluence(state,actor,command.order);
        else validateMilitaryOrder(state,actor,command.order);
        if(command.order.type==='MOVE'&&command.order.path.length){
          const target=command.order.path.at(-1)!,moving=state.units.filter(u=>u.ownerId===actor&&(command.order as {unitIds:string[]}).unitIds.includes(u.id));
          const crowded=stackBlock(state,actor,moving,target,pendingArrivals(state,actor,target,command.order.id));if(crowded)throw new Error(crowded);
        }
        const remaining=player.orders.filter(o=>o.id!==command.order.id);
        const units='unitIds' in command.order?command.order.unitIds:'unitId' in command.order?[command.order.unitId]:[];
        if(remaining.some(o=>('unitIds' in o?o.unitIds:'unitId' in o?[o.unitId]:[]).some(id=>units.includes(id))))throw new Error('Cada peça pode participar de apenas uma ordem por rodada.');
        player.orders=[...remaining,command.order];reservedMainAction=true;
      }
    } else if(command.type==='SETTLE') {
      const hexId=state.units.find(unit=>unit.id===command.unitId&&unit.ownerId===actor)?.hexId;
      settleWithPioneer(state,actor,command.unitId,command.name);refreshKnowledge(state);
      alphaEvent(state,'CITY_FOUNDED','Pioneiro estabeleceu uma nova cidade.',[actor]);
      if(hexId){const city=state.core.players.find(owner=>owner.id===actor)!.civilization.cities.find(item=>item.hexId===hexId)!;const visibleTo=state.players.map(owner=>owner.playerId).filter(playerId=>playerId===actor||visibleHexIds(state,playerId).has(hexId));resolutionEvent(state,{type:'FOUNDATION',actorId:actor,visibleTo,message:`${city.name} foi fundada.`,hexId,cityId:city.id,unitIds:[command.unitId]});}
    } else if(command.type==='DECLARE_HEGEMONY') {
      declareHegemony(state,actor,command.path);
      alphaEvent(state,'HEGEMONY_DECLARED','Uma civilização declarou seu caminho hegemônico.');
    } else if(command.type==='PLAY_CIVILIZATION_CARD') {
      playCivilizationCard(state,actor,command.cardId);
      alphaEvent(state,'CARD_ACTION','Carta da civilização aplicada.',[actor]);
    } else if(command.type==='PLAY_CARD'||command.type==='CHOOSE_AMBITIONS'||command.type==='HIRE_ADVISOR'||command.type==='WORLD_CHOICE'||command.type==='BUILD_PROJECT') {
      manageCard(state,actor,command);
      alphaEvent(state,'CARD_ACTION','Decisão de carta ou projeto aplicada.',[actor]);
    } else if(command.type==='PROPOSE_TREATY'||command.type==='RESPOND_TREATY'||command.type==='END_TREATY'||command.type==='DECLARE_WAR') {
      if(state.phase==='PLANNING'&&(command.type==='PROPOSE_TREATY'||command.type==='DECLARE_WAR')){
        const blocked=diplomacyBlock(state,actor,command);if(blocked)throw new Error(blocked);
        if(command.type==='PROPOSE_TREATY')player.plannedActions.push({id:command.planId??`action-${state.version}`,type:command.type,recipientId:command.recipientId,treaty:command.treaty,deal:command.deal});
        else player.plannedActions.push({id:command.planId??`action-${state.version}`,type:command.type,targetId:command.targetId});
        reservedMainAction=true;alphaEvent(state,'DIPLOMACY_PLANNED','Decisão diplomática reservada.',[actor]);
      }else{manageDiplomacy(state,actor,command);alphaEvent(state,'DIPLOMACY','Decisão diplomática registrada.',[actor]);}
    } else if(command.type==='EMBARK'||command.type==='DISEMBARK') {
      if(command.type==='EMBARK')embark(state,actor,command.unitIds,command.fleetId);else disembark(state,actor,command.unitIds,command.hexId);
      const where=state.units.find(unit=>unit.id===command.unitIds[0])!.hexId;
      resolutionEvent(state,{type:'MOVEMENT',actorId:actor,visibleTo:[actor],message:command.type==='EMBARK'?`${command.unitIds.length} peça(s) embarcada(s) em ${where}.`:`${command.unitIds.length} peça(s) desembarcada(s) em ${where}.`,hexId:where,unitIds:[...command.unitIds]});
      alphaEvent(state,'ACTION_COMPLETED',command.type==='EMBARK'?'Peças embarcadas.':'Peças desembarcadas.',[actor]);
    } else if(command.type==='BUILD_ROAD'||command.type==='ADVANCE_ERA'||command.type==='CIVILIZATION_ABILITY') {
      if(command.type==='ADVANCE_ERA'){advanceEra(state,actor);resolutionEvent(state,{type:'ADVANCE',actorId:actor,visibleTo:null,message:'Civilização avançou de era.',unitIds:[]});}
      else if(command.type==='CIVILIZATION_ABILITY')civilizationAbility(state,actor);
      else {
        const tile=state.core.map.find(t=>t.id===command.hexId&&t.ownerId===actor);
        if(!tile||state.roads.includes(tile.id))throw new Error('Construa estrada em território próprio sem estrada.');
        alphaPay(state,actor,kitWorksCost(state,actor,state.rules.roadCost));state.roads.push(tile.id);
      }
      alphaEvent(state,'ACTION_COMPLETED',({BUILD_ROAD:'Estrada construída.',ADVANCE_ERA:'Nova era alcançada.',CIVILIZATION_ABILITY:'Habilidade civilizacional utilizada.'})[command.type],[actor]);
    }
    if(actionClass==='MAIN')chargeMainAction(state,actor,reservedMainAction?'RESERVE':'COMMIT');
    refreshHegemony(state);
    state.version++;
    const output=AlphaStateSchema.safeParse(state);
    return output.success ? ok(output.data) : err({ code:'INVALID_STATE', message:'A decisão violaria uma regra de integridade.' });
  } catch (error: unknown) {
    const message=error instanceof Error ? error.message : 'A decisão não pôde ser concluída.';
    return err({ code:message==='Sem ações principais disponíveis nesta rodada.'?'ACTION_LIMIT':'RULE_FAILURE', message });
  }
}
