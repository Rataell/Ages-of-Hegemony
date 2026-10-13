import { settleTradeOffers } from './alpha-trade.js';
import { administration, canGrow, citySustenance, growCost, militaryUpkeep, refreshAlphaAdministration, rearmRevoltEmergency, replaceCity } from './alpha-city.js';
import { TREATY_NAMES, battleMessage, discoveryMessage, lossesMessage, orderMessage, urbanActionMessage } from './alpha-messages.js';
import {
  ALPHA_CARDS, emptyOrderCount, AlphaStateSchema, legAsOrder, moveLegs, orderUnitIds, RESOURCE_KEYS, WORLD_PULSE_CARDS, alphaToLegacyResources,
  type AlphaCommand, type AlphaResourcePool, type AlphaRoundPhase, type AlphaState, type PlannedAction, type PlayerId, type RoundPhase, type StrategicOrder,
} from '@aoh/game-domain';
import { alphaEvent, resolutionEvent } from './alpha-events.js';
import { alphaRandomInteger } from './alpha-random.js';
import { alphaDrain, alphaGain, alphaLose, enforceStorageRecorded, ledgerOf } from './alpha-resources.js';
import { maintainCards, scoreAmbitions } from './alpha-cards.js';
import { settleCargo, suspendBlockadedRoutes } from './alpha-naval.js';
import { establishRoute, maintainTrade, manageDiplomacy, resolveInfluence, settleTreaties } from './alpha-diplomacy.js';
import { exploreRegion, refreshKnowledge, regionOpenFor, visibleHexIds } from './alpha-world.js';
import { isFrontierMove, resolveFrontierMove, type FrontierPlan } from './alpha-frontier.js';
import { activateThreats, applyThreatCommand, matureThreats, suspendThreatenedRoutes } from './alpha-threats.js';
import { addPendingChoice } from './alpha-resonance.js';
import { validateMilitaryOrder } from './alpha-military.js';
import { resolveBattle } from './alpha-combat.js';
import { hegemonyWinner, refreshHegemony } from './alpha-hegemony.js';
import { applyRecurringEffects, passEraByCalendar } from './alpha-institutions.js';
import { performUrbanAction, urbanCost } from './alpha-urban.js';
import { appliedUrban } from './alpha-applied.js';
import { alphaActionUsage } from './alpha-actions.js';
import { kitDroughtRecovery, kitDroughtRelief, kitFoodUpkeep } from './alpha-kits.js';
import { recordRoundTelemetry, snapshotOrders } from './alpha-telemetry.js';
import { applyGovernmentRoundStart } from './alpha-government.js';
import { enterEraTurn, finishEraTurn, isEraTurnDue } from './alpha-era-turn.js';

/**
 * The alpha round is driven only by `state.phase`. The legacy core phase is mirrored (never advanced through the core
 * reducer, whose maintenance would credit production automatically) so core commands that check it keep working.
 */
export const CORE_PHASE_MIRROR: Readonly<Record<AlphaRoundPhase, RoundPhase>> = {
  WORLD_PULSE: 'MAINTENANCE', PLANNING: 'PLANNING', URBAN_ACTIONS: 'PLANNING', ORDERS_MOVEMENT: 'RESOLUTION',
  DIPLOMACY_TRADE: 'RESOLUTION', CONFLICTS: 'REACTION', INTEGRATION_MAINTENANCE: 'MAINTENANCE', END_ROUND: 'END_ROUND', ERA_TURN: 'END_ROUND',
};
export function setAlphaPhase(state: AlphaState, phase: AlphaRoundPhase): void {
  state.phase = phase;
  state.core.phase = CORE_PHASE_MIRROR[phase];
}

/** Phases that wait for players. The others run automatically as soon as the previous phase closes. */
export const INTERACTIVE_PHASES: readonly AlphaRoundPhase[] = ['PLANNING', 'CONFLICTS', 'ERA_TURN'];

type CommandType = AlphaCommand['type'];
const planning: CommandType[] = [
  'MANAGE', 'QUEUE_ORDER', 'CANCEL_ORDER', 'SETTLE', 'DECLARE_HEGEMONY', 'CHOOSE_AMBITIONS', 'PLAY_CARD', 'PLAY_CIVILIZATION_CARD', 'HIRE_ADVISOR',
  'WORLD_CHOICE', 'ADVANCE_LEGACY_WORK', 'PROPOSE_TREATY', 'RESPOND_TREATY', 'END_TREATY', 'DECLARE_WAR', 'BUILD_ROAD',
  'LEADER_ABILITY', 'SET_DEFENSE_POSTURE', 'SET_CASUALTY_PRIORITY', 'URBAN_ACTION', 'READY', 'UNREADY', 'EMBARK', 'DISEMBARK', 'DEMOBILIZE',
  'CONTEST_PRESENCE', 'RESOLVE_CHOICE',
  'INDEPENDENT_ACTION',
  'PROPOSE_TRADE', 'RESPOND_TRADE',
];
/** Commands legal in each phase. Everything else is rejected with WRONG_PHASE before any rule runs. */
export const LEGAL_COMMANDS: Readonly<Record<AlphaRoundPhase, ReadonlySet<CommandType>>> = {
  WORLD_PULSE: new Set(),
  PLANNING: new Set(planning),
  URBAN_ACTIONS: new Set<CommandType>(['URBAN_ACTION', 'READY', 'UNREADY']),
  ORDERS_MOVEMENT: new Set(),
  DIPLOMACY_TRADE: new Set<CommandType>(['PROPOSE_TREATY', 'RESPOND_TREATY', 'END_TREATY', 'DECLARE_WAR', 'READY', 'UNREADY']),
  CONFLICTS: new Set<CommandType>(['PLAY_CARD', 'READY', 'UNREADY']),
  INTEGRATION_MAINTENANCE: new Set(),
  END_ROUND: new Set(),
  /** Step 7 of the Era turn: choices, one Ambição swap, the defensive posture, and READY. Reforms were reserved in the last round. */
  ERA_TURN: new Set<CommandType>(['RESOLVE_CHOICE', 'SWAP_AMBITION', 'SET_DEFENSE_POSTURE', 'READY', 'UNREADY']),
};

const PULSE_RESOURCE_NAMES = { FOOD: 'Alimento', WOOD: 'Madeira', STONE: 'Pedra', METAL: 'Metal', WEALTH: 'Riqueza', KNOWLEDGE: 'Conhecimento', INFLUENCE: 'Influência', CULTURE: 'Cultura' } as const;
const RESOURCE_OF_MODULE = { FOOD: 'food', WOOD: 'wood', STONE: 'stone', METAL: 'metal', WEALTH: 'wealth', KNOWLEDGE: 'knowledge', INFLUENCE: 'influence', CULTURE: 'culture' } as const;

function viewersAt(state:AlphaState,hexId:string,always:readonly PlayerId[]=[]):PlayerId[]{
  return state.players.map(player=>player.playerId).filter(playerId=>always.includes(playerId)||visibleHexIds(state,playerId).has(hexId));
}

/** Buys one Pulse with the private RNG, applies each module to every civilization and records it. */
export function drawWorldPulse(state: AlphaState): void {
  const pulse = state.worldPulse;
  if (pulse.current) { pulse.discard.push(pulse.current.id); pulse.current = null; }
  if (pulse.deck.length === 0) { pulse.deck = pulse.discard; pulse.discard = []; }
  if (pulse.deck.length === 0) return;
  const id = pulse.deck.splice(alphaRandomInteger(state, pulse.deck.length), 1)[0]!;
  const card = WORLD_PULSE_CARDS.find(candidate => candidate.id === id);
  if (!card) return;
  pulse.current = card; pulse.resolvedRound = state.core.round;
  for (const module of card.modules) {
    if (module.resource === null || module.amount === 0) continue;
    const key = RESOURCE_OF_MODULE[module.resource];
    for (const player of state.players) {
      if (module.amount > 0) alphaGain(state, player.playerId, { [key]: module.amount } as Partial<AlphaResourcePool>);
      else if (card.mitigatedBy.some(id => player.research.includes(id))) {
        state.telemetry.eventMitigations++; alphaEvent(state, 'PULSE_MITIGATED', `${card.name}: sua civilização mitigou a perda.`, [player.playerId]);
        const recovery = kitDroughtRecovery(state, player.playerId, card);
        if (recovery > 0 && key === 'food') { alphaGain(state, player.playerId, { food: recovery }); alphaEvent(state, 'PULSE_RECOVERY', 'Cheia do Nilo: a Irrigação devolve +1 Alimento.', [player.playerId]); }
      } else { const loss = kitDroughtRelief(state, player.playerId, card, -module.amount); if (loss > 0) alphaLose(state, player.playerId, { [key]: loss } as Partial<AlphaResourcePool>); }
    }
  }
  // Each civilization may answer the Pulse: Prestígio or Cultura (canon §24 "Pulso (escolha) +1 Prestígio").
  for (const player of state.players) addPendingChoice(state, player.playerId, { source: 'PULSE', cardId: card.id, title: card.name, text: 'Como sua civilização responde ao Pulso do mundo?', mitigated: false, options: [
    { id: 'prestige', label: 'Aproveitar a ocasião: +1 Prestígio', ops: [{ op: 'PRESTIGE', n: 1 }] }, { id: 'culture', label: 'Registrar nas crônicas: +2 Cultura', ops: [{ op: 'GAIN', resource: 'culture', n: 2 }] }] });
  if (card.command) applyThreatCommand(state, null, { op: 'THREAT', command: card.command.command, ...(card.command.kind ? { kind: card.command.kind } : {}) });
  state.telemetry.worldPulseEvents += 1;
  const effects = card.modules.filter(module => module.resource !== null && module.amount !== 0).map(module => `${module.amount > 0 ? '+' : '−'}${Math.abs(module.amount)} ${PULSE_RESOURCE_NAMES[module.resource!]}`);
  const message = `Pulso do mundo: ${card.name} — ${effects.length ? `${effects.join(', ')} para todas as civilizações` : 'sem efeito nos recursos'}.`;
  alphaEvent(state, 'WORLD_PULSE', message);
  resolutionEvent(state,{type:'ROUND_EVENT',actorId:null,visibleTo:null,message,unitIds:[]});
}

/**
 * WORLD_PULSE opens a round: ledgers open at the current balances, strategy cards and the world event advance, one Pulse is
 * drawn, ROUND_START effects are credited, and the round enters PLANNING. No city output is credited here.
 */
export function openRound(state: AlphaState): void {
  if (state.phase !== 'WORLD_PULSE') throw new Error('Uma rodada só abre a partir do Pulso do mundo.');
  state.roundLedgers = state.roundLedgers.filter(ledger => ledger.round >= state.core.round);
  for (const player of state.players) { player.ready = false; player.spentCommands = 0; player.ordersSpent = emptyOrderCount(); player.orders = []; player.plannedActions=[]; ledgerOf(state, player.playerId); }
  passEraByCalendar(state);
  maintainCards(state);
  // The first Pulse opens the match (Era I); every later Pulse is drawn at step 3 of the Era turn (canon §18, §22).
  if (state.core.round === 1) drawWorldPulse(state);
  for (const player of state.players) applyRecurringEffects(state, player.playerId, 'ROUND_START');
  applyGovernmentRoundStart(state);
  setAlphaPhase(state, 'PLANNING');
  alphaEvent(state, 'ROUND_STARTED', `Rodada ${state.core.round}: Planejamento.`);
  resolutionEvent(state,{type:'ROUND_EVENT',actorId:null,visibleTo:null,message:`Rodada ${state.core.round} iniciada.`,unitIds:[]});
}

/** Orders that resolve automatically. `types` chooses the phase: movement and exploration before diplomacy, attacks and influence in conflicts. */
export function resolveOrders(state: AlphaState, types: readonly StrategicOrder['type'][]): void {
  for (const type of types) for (const id of state.initiative) {
    // A coordinated MOVE resolves leg by leg, each as the plain Move it is: a leg that is no longer legal fails alone (its own ORDER_FAILED) and the others still go.
    const legOf = new Map<StrategicOrder, { index: number; total: number }>();
    const orders = state.players.find(player => player.playerId === id)!.orders.filter(order => order.type === type).flatMap(order => {
      if (order.type !== 'MOVE' || order.legs === undefined) return [order];
      const legs = moveLegs(order);
      return legs.map((leg, index) => { const single = legAsOrder(order, leg); legOf.set(single, { index, total: legs.length }); return single; });
    });
    for (const order of orders) {
      const candidate = structuredClone(state);
      let found: { plan: FrontierPlan; entered: boolean; lost?: string[] } | null = null;
      try {
        if (order.type === 'EXPLORE') exploreRegion(candidate, id, order);
        else if (order.type === 'TRADE') establishRoute(candidate, id, order);
        else if (order.type === 'INFLUENCE') resolveInfluence(candidate, id, order);
        // A Move whose last step enters a closed Region opens it (Move + Discovery); the plan is re-checked against the table as it is now.
        else if (order.type === 'MOVE' && isFrontierMove(candidate, id, order)) found = resolveFrontierMove(candidate, id, order);
        else validateMilitaryOrder(candidate, id, order);
        if (order.type === 'MOVE' && !found) { const [leg] = moveLegs(order); candidate.units.filter(unit => leg!.unitIds.includes(unit.id)).forEach(unit => { unit.hexId = leg!.path.at(-1)!; }); settleCargo(candidate); }
        if (order.type === 'ATTACK') resolveBattle(candidate, id, order);
        refreshAlphaAdministration(candidate);
        refreshKnowledge(candidate); refreshHegemony(candidate);
        const before = { units: new Map(state.units.map(unit => [unit.id, unit])), rules: state.rules, names: new Map([...state.core.players.map(player => [player.id as string, player.name] as const), ['world', 'As Ameaças do Mundo'] as const]) };
        const raced = order.type === 'MOVE' && !found && order.rotation !== undefined;
        const message = order.type === 'ATTACK' ? battleMessage(before.names, candidate.battles.at(-1)!) : found && order.type === 'MOVE' ? discoveryMessage(state, id, order, found.plan.region.templateId, found.entered, found.lost) : `${orderMessage(state, id, order, order.type === 'TRADE' ? state.core.players.flatMap(player => player.civilization.cities).find(city => city.id === order.toCityId)?.name : undefined)}${raced ? ' A Região já havia sido revelada.' : ''}`;
        Object.assign(state, AlphaStateSchema.parse(candidate));
        const target0=order.type==='MOVE'?moveLegs(order)[0]!.path.at(-1):order.type==='EXPLORE'||order.type==='INFLUENCE'||order.type==='ATTACK'?order.target:undefined;
        // Moves, exploration and attacks change the shared table: everyone who can see that hex (the whole table in an open Region) reads them. Trade and influence stay with their owner.
        alphaEvent(state, type, message, target0&&(order.type==='MOVE'||order.type==='EXPLORE'||order.type==='ATTACK')?viewersAt(state,target0,[id]):[id]);
        const target=order.type==='MOVE'?moveLegs(order)[0]!.path.at(-1):order.type==='EXPLORE'||order.type==='INFLUENCE'||order.type==='ATTACK'?order.target:state.core.players.flatMap(player=>player.civilization.cities).find(city=>city.id===order.toCityId)?.hexId;
        const unitIds=orderUnitIds(order);
        const eventType=found?'DISCOVERY' as const:({EXPLORE:'EXPLORATION',MOVE:'MOVEMENT',TRADE:'TRADE',ATTACK:'COMBAT',INFLUENCE:'INFLUENCE'} as const)[order.type];
        const visibleTo=target?viewersAt(state,target,[id]):[id];
        const fromHex=order.type==='MOVE'&&!found?before.units.get(unitIds[0]!)?.hexId:undefined;
        resolutionEvent(state,{type:eventType,actorId:id,visibleTo,message,...(target?{hexId:target}:{}),...(fromHex&&fromHex!==target?{fromHexId:fromHex}:{}),unitIds});
        if(order.type==='ATTACK'){
          const battle=state.battles.at(-1);
          if(battle?.losses.length)resolutionEvent(state,{type:'LOSSES',actorId:id,visibleTo,message:lossesMessage(before,battle.losses),hexId:order.target,unitIds:battle.losses});
          if(battle?.retreat){const retreating=battle.winnerId===id?battle.defenderId:id;resolutionEvent(state,{type:'RETREAT',actorId:retreating,visibleTo,message:`${before.names.get(retreating)??'O derrotado'} recuou para ${battle.retreat}.`,hexId:battle.retreat,unitIds:[]});}
          const advanced=order.unitIds.filter(unitId=>state.units.some(unit=>unit.id===unitId&&unit.hexId===order.target));
          if(advanced.length)resolutionEvent(state,{type:'ADVANCE',actorId:id,visibleTo,message:`${before.names.get(id)??'O vencedor'} avançou para ${order.target}.`,hexId:order.target,unitIds:advanced});
        }
      } catch (error: unknown) {
        const leg = legOf.get(order), reason = `${leg ? `Mover coordenado, trajeto ${leg.index + 1} de ${leg.total}: ` : ''}${error instanceof Error ? error.message : 'Ordem não pôde ser executada.'}`;
        // A plan made against the fog that arrives after a rival opened the Region is an ordinary move now; say why it could not be made.
        const last = order.type === 'MOVE' ? moveLegs(order)[0]!.path.at(-1) : undefined, region = last ? state.regions.find(candidate => candidate.hexIds.includes(last)) : undefined;
        const failure = order.type === 'MOVE' && order.rotation !== undefined && region && regionOpenFor(state, region, id) ? `A Região já havia sido revelada; o movimento não pôde ser feito: ${reason}` : reason;
        alphaEvent(state, 'ORDER_FAILED', failure, [id]);
        // The failed leg is also a line of the round's resolution (a coordinated Move reports each leg on its own): never silent.
        resolutionEvent(state, { type: 'FAILURE', actorId: id, visibleTo: [id], message: failure, ...(last ? { hexId: last } : {}), unitIds: orderUnitIds(order) });
      }
    }
  }
}

type RoundPlanned=Exclude<PlannedAction,{type:'GOVERNMENT_REFORM'}>;
function plannedOf(state:AlphaState,actor:PlayerId,types:readonly PlannedAction['type'][]):RoundPlanned[]{
  return state.players.find(player=>player.playerId===actor)!.plannedActions.filter((action):action is RoundPlanned=>action.type!=='GOVERNMENT_REFORM'&&types.includes(action.type));
}

/** Resolves private urban/diplomatic reservations by slot, then initiative. Failed actions are atomic and become visible events. */
function resolvePlannedActions(state:AlphaState,types:readonly PlannedAction['type'][]):void {
  const queued=new Map(state.initiative.map(actor=>[actor,plannedOf(state,actor,types)]));
  const maximum=Math.max(0,...state.initiative.map(actor=>queued.get(actor)!.length));
  for(let slot=0;slot<maximum;slot++)for(const actor of state.initiative){
    const action=queued.get(actor)![slot];if(!action)continue;
    const candidate=structuredClone(state),progress=candidate.players.find(player=>player.playerId===actor)!;
    progress.plannedActions=progress.plannedActions.filter(item=>item.id!==action.id);
    try{
      if(action.type==='URBAN_ACTION'){
        const {id,...payload}=action;
        performUrbanAction(candidate,actor,{...payload,planId:id,expectedVersion:candidate.version} as Extract<AlphaCommand,{type:'URBAN_ACTION'}>);
        alphaEvent(candidate,action.action,`Ação planejada executada: ${action.action}.`,[actor]);
        const city=candidate.core.players.flatMap(player=>player.civilization.cities).find(item=>item.id===action.cityId)!;
        const type=({PRODUCE:'PRODUCTION',BUILD:'CONSTRUCTION',RECRUIT:'RECRUITMENT',RESEARCH:'RESEARCH',ELEVATE:'CONSTRUCTION',PROMOTE_MOOD:'ROUND_EVENT',EMERGENCY_GOVERN:'ROUND_EVENT',SUPPORT_TRADE:'TRADE',CIVIC_ACTION:'ROUND_EVENT',MOVE_CAPITAL:'ROUND_EVENT'} as const)[action.action];
        const visibleTo=action.action==='BUILD'?viewersAt(candidate,city.hexId,[actor]):[actor];
        // Ficha de Ação: what the plan really changed and cost, from the same two-state reading previewAction uses. `state` still holds the plan, so its Order is counted in `used`.
        const params={...(action.build?{build:action.build}:{}),...(action.unit?{unit:action.unit}:{}),...(action.advancementId?{advancementId:action.advancementId}:{}),...(action.count?{count:action.count}:{}),...(action.levels?{levels:action.levels}:{})};
        const usage=alphaActionUsage(state,actor);
        const applied=appliedUrban(state,candidate,actor,{cityId:action.cityId,action:action.action,...params},urbanCost(state,actor,action.cityId,action.action,params),{used:usage.used,limit:usage.limit});
        resolutionEvent(candidate,{type,actorId:actor,visibleTo,message:urbanActionMessage(state,candidate,actor,action,city.name),hexId:city.hexId,cityId:city.id,unitIds:[],applied});
      }else{
        const {id,...payload}=action;
        manageDiplomacy(candidate,actor,{...payload,planId:id,expectedVersion:candidate.version} as Extract<AlphaCommand,{type:'PROPOSE_TREATY'|'DECLARE_WAR'}>);
        alphaEvent(candidate,action.type,`Ação diplomática planejada executada: ${action.type}.`,[actor]);
        if(action.type==='DECLARE_WAR')alphaEvent(candidate,'WAR_DECLARED',`${candidate.core.players.find(player=>player.id===actor)?.name??'Uma civilização'} declarou guerra a ${candidate.core.players.find(player=>player.id===action.targetId)?.name??'outra civilização'}.`,null);
        resolutionEvent(candidate,{type:'ROUND_EVENT',actorId:actor,visibleTo:action.type==='DECLARE_WAR'?null:[actor,action.recipientId],message:action.type==='DECLARE_WAR'?`${candidate.core.players.find(player=>player.id===actor)?.name??'Uma civilização'} declarou guerra a ${candidate.core.players.find(player=>player.id===action.targetId)?.name??'outra civilização'}.`:`${candidate.core.players.find(player=>player.id===actor)?.name??'Uma civilização'} propôs ${TREATY_NAMES[action.treaty]??'um acordo'} a ${candidate.core.players.find(player=>player.id===action.recipientId)?.name??'outra civilização'}.`,unitIds:[]});
      }
      Object.assign(state,AlphaStateSchema.parse(candidate));
    }catch(error:unknown){
      state.players.find(player=>player.playerId===actor)!.plannedActions=state.players.find(player=>player.playerId===actor)!.plannedActions.filter(item=>item.id!==action.id);
      const message=error instanceof Error?`A ação não pôde ser realizada: ${error.message}`:'A ação não pôde ser realizada.';
      alphaEvent(state,'ACTION_FAILED',message,[actor]);
      resolutionEvent(state,{type:'FAILURE',actorId:actor,visibleTo:[actor],message,...(action.type==='URBAN_ACTION'?{cityId:action.cityId}:{}),unitIds:[]});
    }
  }
}

/**
 * Upkeep, population food and growth, stability and storage. Growth is fed only by food produced this round by PRODUCE, so a
 * civilization that never produces never grows. Nothing is credited to a city here.
 */
/**
 * Sustenance, growth, military upkeep and Ânimo (canon §7, §10). Each city eats 1 Alimento per 2 inhabitants; a city that
 * cannot be fed loses one inhabitant (Disponível first, Soldado last) and one Ânimo. Then each city below its level's
 * ceiling may Crescer for 3 Alimento (2 with Celeiro), biggest first, once per round. Pieces cost 1 Alimento per 2 land
 * pieces and 1 Riqueza per ship. Estabilidade is no longer touched: Ânimo is the social state.
 */
function maintainCivilizations(state: AlphaState): void {
  for (const owner of state.core.players) {
    const ledger = ledgerOf(state, owner.id);
    const zero = { food: 0, materials: 0, wealth: 0, knowledge: 0, influence: 0 };
    const progress = state.players.find(player => player.playerId === owner.id)!;
    const metas = state.cities.filter(meta => meta.currentOwnerId === owner.id);
    // Sustenance, city by city, the capital first; the capital is the last to go hungry.
    const order = [...owner.civilization.cities].sort((a, b) => Number(b.id === owner.civilization.capitalCityId) - Number(a.id === owner.civilization.capitalCityId));
    let shortage = false;
    for (const city of order) {
      const required = citySustenance(city.population);
      ledger.upkeepRequired.food += required;
      const eaten = alphaDrain(state, owner.id, { ...zero, food: required }, 'upkeepPaid').food;
      if (eaten >= required) continue;
      shortage = true;
      const meta = metas.find(candidate => candidate.cityId === city.id);
      const current = owner.civilization.cities.find(candidate => candidate.id === city.id)!;
      if (current.population > 1) {
        const workers = { ...current.workers };
        const victim = (['unassigned', 'producers', 'artisans', 'merchants', 'scholars', 'soldiers'] as const).find(role => workers[role] > 0)!;
        workers[victim] -= 1;
        replaceCity(state, city.id, { ...current, population: current.population - 1, workers });
      }
      if (meta) meta.mood = Math.max(0, meta.mood - 1);
      alphaEvent(state, 'FOOD_SHORTAGE', `${city.name} passou fome: faltaram ${required - eaten} Alimento. A cidade perde um habitante e Ânimo.`, [owner.id]);
    }
    // Crescer: only cities fed this round, biggest first, one habitant each.
    if (!shortage) {
      const fed = [...owner.civilization.cities].sort((a, b) => b.population - a.population);
      for (const city of fed) {
        const meta = metas.find(candidate => candidate.cityId === city.id);
        if (!meta || meta.status === 'OCCUPIED' || !canGrow(meta, city, state.rules.pace)) continue;
        const cost = growCost(state, city.id);
        if (progress.resources.food < cost) continue;
        alphaDrain(state, owner.id, { ...zero, food: cost }, 'expenses');
        const current = owner.civilization.cities.find(candidate => candidate.id === city.id)!;
        replaceCity(state, city.id, { ...current, population: current.population + 1, workers: { ...current.workers, unassigned: current.workers.unassigned + 1 } });
        alphaEvent(state, 'POPULATION_GROWN', `${city.name} cresceu para ${current.population + 1} habitantes.`, [owner.id]);
      }
    }
    // Military upkeep: 1 Alimento per 2 land pieces (plus kit extras), 1 Riqueza per ship.
    const military = militaryUpkeep(state, owner.id);
    const upkeep = { ...zero, food: military.food + kitFoodUpkeep(state, owner.id), wealth: military.wealth };
    for (const key of RESOURCE_KEYS) ledger.upkeepRequired[key] += upkeep[key];
    const paid = alphaDrain(state, owner.id, upkeep, 'upkeepPaid');
    const unitShortage = RESOURCE_KEYS.some(key => paid[key] < upkeep[key]);
    if (unitShortage) {
      for (const meta of metas) meta.mood = Math.max(0, meta.mood - 1);
      alphaEvent(state, 'UPKEEP_SHORTAGE', 'Faltaram recursos para manter as peças. Ânimo das cidades −1.', [owner.id]);
    }
    // Sobre-extensão (canon §4): the city with the lowest Ânimo loses one level each round over the capacity.
    const admin = administration(state, owner.id);
    if (admin.overextended) {
      const lowest = [...metas].sort((a, b) => a.mood - b.mood)[0];
      if (lowest) lowest.mood = Math.max(0, lowest.mood - 1);
      alphaEvent(state, 'ADMINISTRATIVE_OVEREXTENSION', `Sobre-extensão: carga ${admin.load} para capacidade ${admin.capacity}. Ânimo cai na cidade mais abalada.`, [owner.id]);
    }
    for (const meta of metas) state.telemetry.moodSamples.push(meta.mood);
    refreshAlphaAdministration(state);
    alphaEvent(state, 'UPKEEP', `Manutenção: ${ledger.upkeepRequired.food} Alimento e ${upkeep.wealth} Riqueza.`, [owner.id]);
  }
}

function runMaintenance(state: AlphaState): void {
  maintainTrade(state);suspendBlockadedRoutes(state);
  settleTradeOffers(state);
  if (state.core.round % 2 === 1) activateThreats(state, { launch: false });
  suspendThreatenedRoutes(state);
  for (const player of state.players) applyRecurringEffects(state, player.playerId, 'MAINTENANCE', { enforceStorage: false });
  maintainCivilizations(state);
  rearmRevoltEmergency(state);
  for (const player of state.players) enforceStorageRecorded(state, player.playerId);
  state.players.forEach(player => { player.ready = false; });
  refreshKnowledge(state);
  refreshHegemony(state);
  alphaEvent(state, 'MAINTENANCE', `Manutenção da rodada ${state.core.round} concluída.`);
  resolutionEvent(state,{type:'ROUND_EVENT',actorId:null,visibleTo:null,message:`Manutenção da rodada ${state.core.round} concluída.`,unitIds:[]});
}

function buildRoundReports(state: AlphaState): void {
  for (const owner of state.core.players) {
    // A copy: the Era turn that follows the last round of an Era still moves resources (Pulso, rewards, reforms) after the report closes.
    const ledger = structuredClone(ledgerOf(state, owner.id));
    const closing = alphaToLegacyResources(state.players.find(player => player.playerId === owner.id)!.resources);
    state.roundReports.push({
      playerId: owner.id, round: state.core.round, opening: ledger.opening, institutions: ledger.institutions, trade: ledger.trade, mining: ledger.mining,
      production: ledger.production, other: ledger.other, losses: ledger.losses, expenses: ledger.expenses, discarded: ledger.discarded,
      economy: null, upkeepRequired: ledger.upkeepRequired, upkeepPaid: ledger.upkeepPaid, closing,
      administrativeLoad: owner.civilization.administrativeLoad, administrativeCapacity: owner.civilization.administrativeCapacity,
      cities: owner.civilization.cities.map(city => {
        const before = ledger.cities.find(entry => entry.cityId === city.id);
        return { cityId: city.id, populationBefore: before?.population ?? city.population, populationAfter: city.population, stabilityBefore: before?.stability ?? city.stability, stabilityAfter: city.stability };
      }), // `applied` carries the actor's stock and costs: a rival who merely sees a construction in its hex reads the message, never the numbers.
      resolution:state.resolutionEvents.filter(event=>event.round===state.core.round&&(event.visibleTo===null||event.visibleTo.includes(owner.id))).map(({applied,...event})=>applied!==undefined&&event.actorId===owner.id?{...event,applied}:event),
    });
  }
}

export function prestigeRanking(state: AlphaState): PlayerId[] {
  const metrics = (id: PlayerId) => {
    const progress = state.players.find(player => player.playerId === id)!; const owner = state.core.players.find(player => player.id === id)!;
    return [progress.prestige, progress.research.length, owner.civilization.cities.reduce((total, city) => total + city.population, 0), progress.resources.wealth];
  };
  return [...state.initiative].sort((a, b) => {
    const x = metrics(a), y = metrics(b);
    for (let index = 0; index < x.length; index++) if (x[index] !== y[index]) return (y[index] ?? 0) - (x[index] ?? 0);
    return state.initiative.indexOf(a) - state.initiative.indexOf(b);
  });
}

/** END_ROUND: score, close reports, check victory, rotate initiative, increment the round and open the next WORLD_PULSE. */
function endRound(state: AlphaState): void {
  buildRoundReports(state);
  recordRoundTelemetry(state);
  refreshHegemony(state);
  const hegemon = hegemonyWinner(state);
  if (hegemon) {
    state.winner = { playerId: hegemon, reason: 'HEGEMONY', round: state.core.round }; state.core.status = 'FINISHED';
    state.telemetry.winner = hegemon; state.telemetry.victoryReason = 'HEGEMONY';
    alphaEvent(state, 'GAME_FINISHED', 'Uma civilização consolidou sua Hegemonia.'); return;
  }
  if (state.core.round >= state.rules.roundLimit) {
    scoreAmbitions(state);
    const playerId = prestigeRanking(state)[0]!;
    state.winner = { playerId, reason: 'ROUND_LIMIT', round: state.core.round }; state.core.status = 'FINISHED';
    state.telemetry.winner = playerId; state.telemetry.victoryReason = 'ROUND_LIMIT';
    alphaEvent(state, 'GAME_FINISHED', 'Partida encerrada pelo limite de rodadas.'); return;
  }
  if (isEraTurnDue(state)) { enterEraTurn(state); return; }
  const first = state.initiative.shift(); if (first) state.initiative.push(first);
  state.core.round += 1;
  state.core.pendingOrders = Object.fromEntries(state.core.players.map(player => [player.id, []]));
  state.telemetry.rounds = state.core.round;
  setAlphaPhase(state, 'WORLD_PULSE');
  openRound(state);
}

/** Reserved attacks with their defender (owner of the pieces or city on the target), in initiative order. */
export function pendingAttacks(state: AlphaState): { attackerId: PlayerId; defenderId: PlayerId; target: string; orderId: string }[] {
  return state.initiative.flatMap(attackerId => state.players.find(player => player.playerId === attackerId)!.orders.flatMap(order => {
    if (order.type !== 'ATTACK') return [];
    const defenderId = state.units.find(unit => unit.hexId === order.target && unit.ownerId !== attackerId)?.ownerId
      ?? state.core.players.find(player => player.id !== attackerId && player.civilization.cities.some(city => city.hexId === order.target))?.id;
    return defenderId ? [{ attackerId, defenderId, target: order.target as string, orderId: order.id }] : [];
  }));
}
const REACTION_CARD = (id: string) => ALPHA_CARDS.find(card => card.id === id)?.timing === 'REACTION';

/**
 * Every player confirmed. Closes the current phase and runs every automatic phase after it until the next one that waits for
 * players (or the match ends). A phase cannot be skipped: each one runs in order and its required work happens in it.
 */
export function advanceAfterReady(state: AlphaState): void {
  for (let guard = 0; guard < 16; guard++) {
    switch (state.phase) {
      case 'PLANNING': {
        matureThreats(state);
        snapshotOrders(state);
        state.players.forEach(player => { player.ready = false; });
        state.cities.forEach(city => { city.urbanActionsUsed = 0; });
        setAlphaPhase(state, 'URBAN_ACTIONS');
        alphaEvent(state, 'RESOLUTION', 'Todos prontos. Resolvendo a rodada por iniciativa.');
        resolvePlannedActions(state,['URBAN_ACTION']);
        setAlphaPhase(state, 'ORDERS_MOVEMENT');
        resolveOrders(state, ['EXPLORE', 'MOVE', 'TRADE']);
        alphaEvent(state, 'RESOLUTION', 'Ordens de exploração, movimento e comércio resolvidas por iniciativa explícita.');
        setAlphaPhase(state, 'DIPLOMACY_TRADE');
        resolvePlannedActions(state,['PROPOSE_TREATY','DECLARE_WAR']);
        settleTreaties(state);
        setAlphaPhase(state, 'CONFLICTS');
        // Only the sides of a reserved attack may react; everyone else is not asked to wait.
        const parties = new Set(pendingAttacks(state).flatMap(attack => [attack.attackerId, attack.defenderId]));
        state.players.forEach(player => { player.ready = !(parties.has(player.playerId) && player.cardsPlayed < state.rules.cardsPerRound && player.hand.some(REACTION_CARD)); });
        if (state.players.some(player => !player.ready)) return;
        break;
      }
      case 'ERA_TURN':
        finishEraTurn(state);
        return;
      case 'URBAN_ACTIONS':
      case 'DIPLOMACY_TRADE':
        throw new Error(`A fase interna ${state.phase} não aguarda jogadores.`);
      case 'CONFLICTS':
        resolveOrders(state, ['ATTACK', 'INFLUENCE']);
        setAlphaPhase(state, 'INTEGRATION_MAINTENANCE');
        runMaintenance(state);
        setAlphaPhase(state, 'END_ROUND');
        endRound(state);
        if (state.core.status !== 'ACTIVE') return;
        return;
      default:
        throw new Error(`A fase ${state.phase} não aguarda jogadores.`);
    }
  }
  throw new Error('O ciclo de fases não convergiu.');
}
