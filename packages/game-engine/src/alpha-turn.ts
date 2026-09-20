import { ALPHA_CARDS, AlphaCommandSchema, AlphaStateSchema, RESOURCE_KEYS, emptyResourcePool, type AlphaError, type AlphaState, type PlayerId, type StrategicOrder } from '@aoh/game-domain';
import { err, ok, type Result } from '@aoh/shared';
import { applyCommand, nextPhase } from './engine.js';
import { commandPoints, refreshAdministration } from './civilization.js';
import { recruitUnit, resolveBattle, validateMilitaryOrder } from './alpha-military.js';
import { alphaPay, reconcileLegacyPools } from './alpha-resources.js';
import { advanceEra, civilizationAbility, institutionBonus, produceInstitutions, researchAdvancement } from './alpha-institutions.js';
import { establishRoute, maintainTrade, manageDiplomacy, resolveInfluence, settleTreaties, tradePath, validateInfluence } from './alpha-diplomacy.js';
import { exploreRegion, refreshKnowledge, validateExploration } from './alpha-world.js';
import { maintainCards, manageCard, scoreAmbitions } from './alpha-cards.js';
import { declareHegemony, hegemonyWinner, refreshHegemony } from './alpha-hegemony.js';
import { integrateCity, settleWithPioneer } from './alpha-cities.js';

export function alphaCommandCapacity(state: AlphaState, playerId: PlayerId): number {
  const player = state.core.players.find(p => p.id === playerId);
  if (!player) return 0;
  return Math.max(0, state.rules.baseCommandPoints + commandPoints(player.civilization, state.core.config) - state.core.config.baseCommandPoints + institutionBonus(state,playerId,'COMMAND'));
}
export function alphaEvent(state: AlphaState, type: string, message: string, audience: PlayerId[] | null = null): void {
  state.events.push({ id: `event-${state.events.length + 1}`, round: state.core.round, type, message, audience });
}
function phase(state: AlphaState): void {
  const result = applyCommand(state.core, { type: 'ADVANCE_PHASE', expectedVersion: state.core.version, nextPhase: nextPhase(state.core.phase) });
  if (!result.ok) throw new Error(result.error.message);
  state.core = result.value;
}
export function beginAlphaPlanning(input: AlphaState): AlphaState {
  const state = AlphaStateSchema.parse(input);
  if (state.core.phase !== 'MAINTENANCE') throw new Error('Início requer Manutenção.');
  const opening=new Map(state.core.players.map(p=>[p.id,structuredClone(p)]));
  const eventOffset=state.core.eventLog.length;
  maintainCards(state);
  produceInstitutions(state);
  const afterInstitutions=new Map(state.core.players.map(p=>[p.id,{...p.resources}]));
  maintainTrade(state);
  const afterTrade=new Map(state.core.players.map(p=>[p.id,{...p.resources}]));
  phase(state);
  for(const player of state.core.players) {
    const upkeep=emptyResourcePool();
    for(const unit of state.units.filter(u=>u.ownerId===player.id))for(const key of RESOURCE_KEYS)upkeep[key]+=state.rules.units[unit.kind].upkeep[key];
    let shortage=false;const paid=emptyResourcePool();
    for(const key of RESOURCE_KEYS){if(player.resources[key]<upkeep[key])shortage=true;paid[key]=Math.min(player.resources[key],upkeep[key]);player.resources[key]-=paid[key];}
    if(shortage){player.civilization.cities.forEach(c=>c.stability=Math.max(0,c.stability-5));alphaEvent(state,'UPKEEP_SHORTAGE','Faltaram recursos para manter as peças. Estabilidade das cidades reduzida em 5.',[player.id]);}
    player.civilization=refreshAdministration(player.civilization,state.core.config,state.core.map);
    const before=opening.get(player.id)!;
const institutions=emptyResourcePool(),trade=emptyResourcePool();
    for(const key of RESOURCE_KEYS){institutions[key]=afterInstitutions.get(player.id)![key]-before.resources[key];trade[key]=afterTrade.get(player.id)![key]-afterInstitutions.get(player.id)![key];}
    const production=state.core.eventLog.slice(eventOffset).find(e=>e.type==='RESOURCES_PRODUCED'&&e.playerId===player.id);
    state.roundReports.push({playerId:player.id,round:state.core.round,opening:before.resources,institutions,trade,economy:production?.type==='RESOURCES_PRODUCED'?production.breakdown??null:null,
      upkeepRequired:upkeep,upkeepPaid:paid,closing:{...player.resources},administrativeLoad:player.civilization.administrativeLoad,administrativeCapacity:player.civilization.administrativeCapacity,
      cities:player.civilization.cities.map(c=>({cityId:c.id,populationBefore:before.civilization.cities.find(old=>old.id===c.id)!.population,populationAfter:c.population,stabilityBefore:before.civilization.cities.find(old=>old.id===c.id)!.stability,stabilityAfter:c.stability}))});
    alphaEvent(state,'UPKEEP',`Manutenção das peças: ${upkeep.food} Alimentos e ${upkeep.wealth} Riqueza.`,[player.id]);
  }
  reconcileLegacyPools(state);
  state.players.forEach(p => { p.ready = false; p.spentCommands = 0; p.orders = []; });
  alphaEvent(state, 'MAINTENANCE', `Manutenção da rodada ${state.core.round} concluída.`);
  refreshHegemony(state);
  return AlphaStateSchema.parse(state);
}
export function prestigeRanking(state: AlphaState): PlayerId[] {
  const metrics = (id: PlayerId) => {
    const p = state.players.find(p => p.playerId === id)!; const core = state.core.players.find(p => p.id === id)!;
    return [p.prestige, p.research.length, core.civilization.cities.reduce((n,c) => n+c.population,0), core.resources.wealth];
  };
  return [...state.initiative].sort((a,b) => {
    const x=metrics(a), y=metrics(b);
    for(let i=0;i<x.length;i++) if(x[i]!==y[i]) return (y[i]??0)-(x[i]??0);
    return state.initiative.indexOf(a)-state.initiative.indexOf(b);
  });
}
export function finishAlphaRound(state: AlphaState): void {
  if (state.core.phase !== 'END_ROUND') throw new Error('Encerramento requer Fim da rodada.');
  scoreAmbitions(state);
  const hegemon=hegemonyWinner(state);
  if(hegemon){
    state.winner={playerId:hegemon,reason:'HEGEMONY',round:state.core.round};state.core.status='FINISHED';
    alphaEvent(state,'GAME_FINISHED','Uma civilização consolidou sua Hegemonia.');return;
  }
  if (state.core.round >= state.rules.roundLimit) {
    const playerId = prestigeRanking(state)[0]!;
    state.winner = { playerId, reason:'ROUND_LIMIT', round:state.core.round }; state.core.status = 'FINISHED';
    alphaEvent(state,'GAME_FINISHED','Partida encerrada pelo limite de rodadas.'); return;
  }
  const first = state.initiative.shift(); if (first) state.initiative.push(first);
  phase(state);
  const next = beginAlphaPlanning(state); Object.assign(state,next);
}

function resolveOrders(state:AlphaState,types:readonly StrategicOrder['type'][]):void {
  for(const type of types)for(const id of state.initiative) {
    const orders=state.players.find(p=>p.playerId===id)!.orders.filter(o=>o.type===type);
    for(const order of orders) {
      const candidate=structuredClone(state);
      try {
        if(order.type==='EXPLORE')exploreRegion(candidate,id,order);
        else if(order.type==='TRADE')establishRoute(candidate,id,order);
        else if(order.type==='INFLUENCE')resolveInfluence(candidate,id,order);
        else validateMilitaryOrder(candidate,id,order);
        if(order.type==='MOVE')candidate.units.filter(u=>order.unitIds.includes(u.id)).forEach(u=>u.hexId=order.path.at(-1)!);
        if(order.type==='ATTACK')resolveBattle(candidate,id,order);
        candidate.core.players.forEach(p=>p.civilization=refreshAdministration(p.civilization,candidate.core.config,candidate.core.map));
        refreshKnowledge(candidate);refreshHegemony(candidate);Object.assign(state,AlphaStateSchema.parse(candidate));
        const message=({EXPLORE:'Região explorada.',MOVE:'Movimento concluído.',TRADE:'Rota de comércio estabelecida.',ATTACK:'Conflito resolvido; consulte dados e perdas.',INFLUENCE:'Influência aplicada.'})[type];
        alphaEvent(state,'ORDER_RESOLVED',message,[id]);
      }catch(error:unknown){alphaEvent(state,'ORDER_FAILED',error instanceof Error?error.message:'Ordem não pôde ser executada.',[id]);}
    }
  }
}

/** Authenticated actor is separate from command JSON. No repository or network in this reducer. */
export function applyAlphaCommand(input: AlphaState, actor: PlayerId, raw: unknown): Result<AlphaState, AlphaError> {
  const validated = AlphaStateSchema.safeParse(input);
  if (!validated.success) return err({ code:'INVALID_STATE', message:'Estado alpha inválido.' });
  const parsed = AlphaCommandSchema.safeParse(raw);
  if (!parsed.success) return err({ code:'INVALID_INPUT', message:'Comando inválido.' });
  const state = validated.data; const command = parsed.data;
  if (command.expectedVersion !== state.version) return err({ code:'VERSION_CONFLICT', message:'A partida mudou. Atualize antes de confirmar novamente.' });
  if (state.version === Number.MAX_SAFE_INTEGER) return err({ code:'NUMERIC_OVERFLOW', message:'Limite de versões atingido.' });
  if (state.core.status !== 'ACTIVE') return err({ code:'NOT_ACTIVE', message:'Esta partida já terminou.' });
  const player = state.players.find(p => p.playerId === actor);
  if (!player) return err({ code:'FORBIDDEN', message:'Você não ocupa um lugar nesta partida.' });
  if (!['PLANNING','REACTION'].includes(state.core.phase)) return err({ code:'WRONG_PHASE', message:'Aguarde a próxima fase de decisões.' });
  if (player.ready) return err({ code:'ALREADY_READY', message:'Suas decisões já estão confirmadas para esta fase.' });
  try {
    if (command.type === 'MANAGE') {
      if (state.core.phase !== 'PLANNING') return err({ code:'WRONG_PHASE', message:'Gestão está disponível durante Planejamento.' });
      if (command.command.type === 'ADVANCE_PHASE' || command.command.type === 'SUBMIT_ORDER') return err({ code:'FORBIDDEN', message:'Use os controles de planejamento da alpha.' });
      if (command.command.playerId !== actor) return err({ code:'FORBIDDEN', message:'Você só pode comandar sua própria civilização.' });
      const management=command.command;
      const occupied=state.occupations.some(o=>('cityId' in management&&management.type!=='FOUND_CITY'&&management.cityId===o.cityId)||('hexId' in management&&state.core.map.find(t=>t.id===management.hexId)?.controllerCityId===o.cityId));
      if(occupied)throw new Error('Integre a cidade ocupada antes de administrar seus territórios e construções.');
      const free = ['ASSIGN_POPULATION','ASSIGN_WORKED_HEXES','ADOPT_GOVERNMENT'].includes(command.command.type);
      if (!free && player.spentCommands + player.orders.length >= alphaCommandCapacity(state,actor)) return err({ code:'COMMAND_LIMIT', message:'Sem pontos de comando disponíveis nesta rodada.' });
      const result = applyCommand(state.core,{ ...command.command, expectedVersion:state.core.version });
      if (!result.ok) return result;
      state.core = result.value; if(!free) player.spentCommands++;
      alphaEvent(state,'MANAGEMENT','Decisão de gestão aplicada.',[actor]);
    } else if (command.type === 'READY') {
      if(!player.ambitionsChosen)throw new Error('Escolha duas ambições antes de confirmar seu primeiro planejamento.');
      player.ready = true;
      if (state.players.every(p => p.ready)) {
        if (state.core.phase === 'PLANNING') {
          phase(state);
          resolveOrders(state,['EXPLORE','MOVE','TRADE']);settleTreaties(state);
          alphaEvent(state,'RESOLUTION','Ordens desta rodada resolvidas por iniciativa explícita.'); phase(state);
          const conflict=state.players.some(p=>p.orders.some(o=>o.type==='ATTACK'));
          state.players.forEach(p=>p.ready=!(conflict&&p.cardsPlayed<state.rules.cardsPerRound&&p.hand.some(id=>ALPHA_CARDS.find(c=>c.id===id)?.timing==='REACTION')));
          if(state.players.some(p=>!p.ready)){reconcileLegacyPools(state);state.version++;return ok(AlphaStateSchema.parse(state));}
        }
        resolveOrders(state,['ATTACK','INFLUENCE']);
        phase(state); finishAlphaRound(state);
      }
    } else if(command.type==='QUEUE_ORDER'||command.type==='CANCEL_ORDER') {
      if(state.core.phase!=='PLANNING')throw new Error('Edite ordens durante Planejamento.');
      if(command.type==='CANCEL_ORDER')player.orders=player.orders.filter(o=>o.id!==command.orderId);
      else {
        if(command.order.type==='EXPLORE')validateExploration(state,actor,command.order);
        else if(command.order.type==='TRADE')tradePath(state,actor,command.order.fromCityId,command.order.toCityId);
        else if(command.order.type==='INFLUENCE')validateInfluence(state,actor,command.order);
        else validateMilitaryOrder(state,actor,command.order);
        const remaining=player.orders.filter(o=>o.id!==command.order.id);
        if(player.spentCommands+remaining.length>=alphaCommandCapacity(state,actor))throw new Error('Sem pontos de comando disponíveis.');
        const units='unitIds' in command.order?command.order.unitIds:'unitId' in command.order?[command.order.unitId]:[];
        if(remaining.some(o=>('unitIds' in o?o.unitIds:'unitId' in o?[o.unitId]:[]).some(id=>units.includes(id))))throw new Error('Cada peça pode participar de apenas uma ordem por rodada.');
        player.orders=[...remaining,command.order];
      }
    } else if(command.type==='SETTLE') {
      if(state.core.phase!=='PLANNING')throw new Error('Funde cidades durante Planejamento.');
      if(player.spentCommands+player.orders.length>=alphaCommandCapacity(state,actor))throw new Error('Sem pontos de comando disponíveis.');
      settleWithPioneer(state,actor,command.unitId,command.name);player.spentCommands++;refreshKnowledge(state);
      alphaEvent(state,'CITY_FOUNDED','Pioneiro estabeleceu uma nova cidade.',[actor]);
    } else if(command.type==='INTEGRATE_CITY') {
      if(state.core.phase!=='PLANNING')throw new Error('Integre cidades durante Planejamento.');
      if(player.spentCommands+player.orders.length>=alphaCommandCapacity(state,actor))throw new Error('Sem pontos de comando disponíveis.');
      integrateCity(state,actor,command.cityId);player.spentCommands++;
      alphaEvent(state,'CITY_INTEGRATED','Cidade integrada à administração.',[actor]);
    } else if(command.type==='DECLARE_HEGEMONY') {
      if(state.core.phase!=='PLANNING')throw new Error('Declare Hegemonia durante Planejamento.');
      declareHegemony(state,actor,command.path);
      alphaEvent(state,'HEGEMONY_DECLARED','Uma civilização declarou seu caminho hegemônico.');
    } else if(command.type==='PLAY_CARD'||command.type==='CHOOSE_AMBITIONS'||command.type==='HIRE_ADVISOR'||command.type==='WORLD_CHOICE'||command.type==='BUILD_PROJECT') {
      if(command.type!=='PLAY_CARD'&&state.core.phase!=='PLANNING')throw new Error('Esta decisão requer Planejamento.');
      const paid=command.type==='HIRE_ADVISOR'||command.type==='BUILD_PROJECT';
      if(paid&&player.spentCommands+player.orders.length>=alphaCommandCapacity(state,actor))throw new Error('Sem pontos de comando disponíveis.');
      manageCard(state,actor,command);if(paid)player.spentCommands++;
      alphaEvent(state,'CARD_ACTION','Decisão de carta ou projeto aplicada.',[actor]);
    } else if(['PROPOSE_TREATY','RESPOND_TREATY','END_TREATY','DECLARE_WAR'].includes(command.type)) {
      if(state.core.phase!=='PLANNING')throw new Error('Negocie durante Planejamento.');
      if(command.type==='PROPOSE_TREATY'||command.type==='RESPOND_TREATY'||command.type==='END_TREATY'||command.type==='DECLARE_WAR') {
        const paid=command.type==='PROPOSE_TREATY'||command.type==='DECLARE_WAR';
        if(paid&&player.spentCommands+player.orders.length>=alphaCommandCapacity(state,actor))throw new Error('Sem pontos de comando disponíveis.');
        manageDiplomacy(state,actor,command);if(paid)player.spentCommands++;
        alphaEvent(state,'DIPLOMACY','Decisão diplomática registrada.',[actor]);
      }
    } else if(command.type==='RECRUIT'||command.type==='BUILD_ROAD'||command.type==='RESEARCH'||command.type==='ADVANCE_ERA'||command.type==='CIVILIZATION_ABILITY') {
      if(state.core.phase!=='PLANNING')throw new Error('Esta ação requer Planejamento.');
      if(player.spentCommands+player.orders.length>=alphaCommandCapacity(state,actor))throw new Error('Sem pontos de comando disponíveis.');
      if(command.type==='RECRUIT')recruitUnit(state,actor,command.cityId,command.kind);
      else if(command.type==='RESEARCH')researchAdvancement(state,actor,command.advancementId);
      else if(command.type==='ADVANCE_ERA')advanceEra(state,actor);
      else if(command.type==='CIVILIZATION_ABILITY')civilizationAbility(state,actor);
      else {
        const tile=state.core.map.find(t=>t.id===command.hexId&&t.ownerId===actor);
        if(!tile||state.roads.includes(tile.id))throw new Error('Construa estrada em território próprio sem estrada.');
        alphaPay(state,actor,state.rules.roadCost);state.roads.push(tile.id);
      }
      player.spentCommands++;alphaEvent(state,'ACTION_COMPLETED',({RECRUIT:'Peça recrutada.',BUILD_ROAD:'Estrada construída.',RESEARCH:'Avanço pesquisado.',ADVANCE_ERA:'Nova era alcançada.',CIVILIZATION_ABILITY:'Habilidade civilizacional utilizada.'})[command.type],[actor]);
    }
    refreshHegemony(state);
    reconcileLegacyPools(state);
    state.version++;
    const output=AlphaStateSchema.safeParse(state);
    return output.success ? ok(output.data) : err({ code:'INVALID_STATE', message:'A decisão violaria uma regra de integridade.' });
  } catch (error: unknown) {
    return err({ code:'RULE_FAILURE', message:error instanceof Error ? error.message : 'A decisão não pôde ser concluída.' });
  }
}
