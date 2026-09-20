import { AlphaCommandSchema, AlphaStateSchema, type AlphaError, type AlphaState, type PlayerId } from '@aoh/game-domain';
import { err, ok, type Result } from '@aoh/shared';
import { applyCommand } from './engine.js';
import { commandPoints } from './civilization.js';
import { validateMilitaryOrder } from './alpha-military.js';
import { pendingArrivals, stackBlock } from './alpha-stack.js';
import { alphaPay, commitLegacyReducer } from './alpha-resources.js';
import { advanceEra, civilizationAbility, institutionBonus } from './alpha-institutions.js';
import { manageDiplomacy, tradePath, validateInfluence } from './alpha-diplomacy.js';
import { refreshKnowledge, validateExploration } from './alpha-world.js';
import { manageCard } from './alpha-cards.js';
import { declareHegemony, refreshHegemony } from './alpha-hegemony.js';
import { settleWithPioneer } from './alpha-cities.js';
import { alphaEvent } from './alpha-events.js';
import { LEGAL_COMMANDS, advanceAfterReady, openRound } from './alpha-phases.js';
import { performUrbanAction, syncCityMetadata } from './alpha-urban.js';
import { ensureLeaders, useLeaderAbility } from './alpha-leaders.js';

export { alphaEvent } from './alpha-events.js';

export function alphaCommandCapacity(state: AlphaState, playerId: PlayerId): number {
  const player = state.core.players.find(p => p.id === playerId);
  if (!player) return 0;
  return Math.max(0, state.rules.baseCommandPoints + commandPoints(player.civilization, state.core.config) - state.core.config.baseCommandPoints + institutionBonus(state,playerId,'COMMAND'));
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
export const ALPHA_UNSUPPORTED_COMMANDS = ['PROPOSE_TRADE', 'RESPOND_TRADE', 'CONTEST_PRESENCE', 'INDEPENDENT_ACTION'] as const;
const UNSUPPORTED = new Set<string>(ALPHA_UNSUPPORTED_COMMANDS);
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
  if (player.ready) return err({ code:'ALREADY_READY', message:'Suas decisões já estão confirmadas para esta fase.' });
  try {
    if (command.type === 'MANAGE') {
      if (command.command.type === 'ADVANCE_PHASE' || command.command.type === 'SUBMIT_ORDER') return err({ code:'FORBIDDEN', message:'Use os controles de planejamento da alpha.' });
      if (command.command.playerId !== actor) return err({ code:'FORBIDDEN', message:'Você só pode comandar sua própria civilização.' });
      if (command.command.type === 'BUILD_DISTRICT' || command.command.type === 'BUILD_BUILDING') return err({ code:'USE_URBAN_ACTION', message:'Construa pela ação urbana Construir.' });
      const management=command.command;
      const occupied=state.occupations.some(o=>('cityId' in management&&management.type!=='FOUND_CITY'&&management.cityId===o.cityId)||('hexId' in management&&state.core.map.find(t=>t.id===management.hexId)?.controllerCityId===o.cityId));
      if(occupied)throw new Error('Integre a cidade ocupada antes de administrar seus territórios e construções.');
      const free = ['ASSIGN_POPULATION','ASSIGN_WORKED_HEXES','ADOPT_GOVERNMENT'].includes(command.command.type);
      if (!free && player.spentCommands + player.orders.length >= alphaCommandCapacity(state,actor)) return err({ code:'COMMAND_LIMIT', message:'Sem pontos de comando disponíveis nesta rodada.' });
      const legacyBefore = { ...state.core.players.find(p => p.id === actor)!.resources };
      const result = applyCommand(state.core,{ ...command.command, expectedVersion:state.core.version });
      if (!result.ok) return result;
      state.core = result.value; commitLegacyReducer(state, actor, legacyBefore); syncCityMetadata(state); if(!free) player.spentCommands++;
      alphaEvent(state,'MANAGEMENT','Decisão de gestão aplicada.',[actor]);
    } else if (command.type === 'SET_DEFENSE_POSTURE') {
      player.defensePosture = command.posture;
      alphaEvent(state, 'DEFENSE_POSTURE', 'Postura defensiva definida.', [actor]);
    } else if (command.type === 'LEADER_ABILITY') {
      useLeaderAbility(state, actor);
    } else if (command.type === 'URBAN_ACTION') {
      performUrbanAction(state, actor, command);
    } else if (command.type === 'READY') {
      if(!player.ambitionsChosen)throw new Error('Escolha duas ambições antes de confirmar seu primeiro planejamento.');
      player.ready = true;
      if (state.players.every(p => p.ready)) advanceAfterReady(state);
    } else if(command.type==='QUEUE_ORDER'||command.type==='CANCEL_ORDER') {
      if(command.type==='CANCEL_ORDER')player.orders=player.orders.filter(o=>o.id!==command.orderId);
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
        if(player.spentCommands+remaining.length>=alphaCommandCapacity(state,actor))throw new Error('Sem pontos de comando disponíveis.');
        const units='unitIds' in command.order?command.order.unitIds:'unitId' in command.order?[command.order.unitId]:[];
        if(remaining.some(o=>('unitIds' in o?o.unitIds:'unitId' in o?[o.unitId]:[]).some(id=>units.includes(id))))throw new Error('Cada peça pode participar de apenas uma ordem por rodada.');
        player.orders=[...remaining,command.order];
      }
    } else if(command.type==='SETTLE') {
      if(player.spentCommands+player.orders.length>=alphaCommandCapacity(state,actor))throw new Error('Sem pontos de comando disponíveis.');
      settleWithPioneer(state,actor,command.unitId,command.name);player.spentCommands++;refreshKnowledge(state);
      alphaEvent(state,'CITY_FOUNDED','Pioneiro estabeleceu uma nova cidade.',[actor]);
    } else if(command.type==='DECLARE_HEGEMONY') {
      declareHegemony(state,actor,command.path);
      alphaEvent(state,'HEGEMONY_DECLARED','Uma civilização declarou seu caminho hegemônico.');
    } else if(command.type==='PLAY_CARD'||command.type==='CHOOSE_AMBITIONS'||command.type==='HIRE_ADVISOR'||command.type==='WORLD_CHOICE'||command.type==='BUILD_PROJECT') {
      const paid=command.type==='HIRE_ADVISOR'||command.type==='BUILD_PROJECT';
      if(paid&&player.spentCommands+player.orders.length>=alphaCommandCapacity(state,actor))throw new Error('Sem pontos de comando disponíveis.');
      manageCard(state,actor,command);if(paid)player.spentCommands++;
      alphaEvent(state,'CARD_ACTION','Decisão de carta ou projeto aplicada.',[actor]);
    } else if(command.type==='PROPOSE_TREATY'||command.type==='RESPOND_TREATY'||command.type==='END_TREATY'||command.type==='DECLARE_WAR') {
      const paid=command.type==='PROPOSE_TREATY'||command.type==='DECLARE_WAR';
      if(paid&&player.spentCommands+player.orders.length>=alphaCommandCapacity(state,actor))throw new Error('Sem pontos de comando disponíveis.');
      manageDiplomacy(state,actor,command);if(paid)player.spentCommands++;
      alphaEvent(state,'DIPLOMACY','Decisão diplomática registrada.',[actor]);
    } else if(command.type==='BUILD_ROAD'||command.type==='ADVANCE_ERA'||command.type==='CIVILIZATION_ABILITY') {
      if(player.spentCommands+player.orders.length>=alphaCommandCapacity(state,actor))throw new Error('Sem pontos de comando disponíveis.');
      if(command.type==='ADVANCE_ERA')advanceEra(state,actor);
      else if(command.type==='CIVILIZATION_ABILITY')civilizationAbility(state,actor);
      else {
        const tile=state.core.map.find(t=>t.id===command.hexId&&t.ownerId===actor);
        if(!tile||state.roads.includes(tile.id))throw new Error('Construa estrada em território próprio sem estrada.');
        alphaPay(state,actor,state.rules.roadCost);state.roads.push(tile.id);
      }
      player.spentCommands++;alphaEvent(state,'ACTION_COMPLETED',({BUILD_ROAD:'Estrada construída.',ADVANCE_ERA:'Nova era alcançada.',CIVILIZATION_ABILITY:'Habilidade civilizacional utilizada.'})[command.type],[actor]);
    }
    refreshHegemony(state);
    state.version++;
    const output=AlphaStateSchema.safeParse(state);
    return output.success ? ok(output.data) : err({ code:'INVALID_STATE', message:'A decisão violaria uma regra de integridade.' });
  } catch (error: unknown) {
    return err({ code:'RULE_FAILURE', message:error instanceof Error ? error.message : 'A decisão não pôde ser concluída.' });
  }
}
