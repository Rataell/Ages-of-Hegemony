import { TREATY_NAMES, battleMessage, lossesMessage, orderMessage, urbanActionMessage } from './alpha-messages.js';
import {
  ALPHA_CARDS, AlphaStateSchema, RESOURCE_KEYS, WORLD_PULSE_CARDS, alphaToLegacyResources, cityLevelForPopulation,
  type AlphaCommand, type AlphaResourcePool, type AlphaRoundPhase, type AlphaState, type PlannedAction, type PlayerId, type RoundPhase, type StrategicOrder,
} from '@aoh/game-domain';
import { clampStability, deriveAdministration, governmentStabilityDelta, multiply, populationCap, refreshAdministration, sum } from './civilization.js';
import { infrastructureStats } from './urban.js';
import { alphaEvent, resolutionEvent } from './alpha-events.js';
import { alphaRandomInteger } from './alpha-random.js';
import { alphaDrain, alphaGain, alphaLose, enforceStorageRecorded, ledgerOf } from './alpha-resources.js';
import { maintainCards, scoreAmbitions } from './alpha-cards.js';
import { establishRoute, maintainTrade, manageDiplomacy, resolveInfluence, settleTreaties } from './alpha-diplomacy.js';
import { exploreRegion, refreshKnowledge, resolveRaidBands, visibleHexIds } from './alpha-world.js';
import { validateMilitaryOrder } from './alpha-military.js';
import { resolveBattle } from './alpha-combat.js';
import { hegemonyWinner, refreshHegemony } from './alpha-hegemony.js';
import { applyRecurringEffects } from './alpha-institutions.js';
import { performUrbanAction } from './alpha-urban.js';

/**
 * The alpha round is driven only by `state.phase`. The legacy core phase is mirrored (never advanced through the core
 * reducer, whose maintenance would credit production automatically) so core commands that check it keep working.
 */
export const CORE_PHASE_MIRROR: Readonly<Record<AlphaRoundPhase, RoundPhase>> = {
  WORLD_PULSE: 'MAINTENANCE', PLANNING: 'PLANNING', URBAN_ACTIONS: 'PLANNING', ORDERS_MOVEMENT: 'RESOLUTION',
  DIPLOMACY_TRADE: 'RESOLUTION', CONFLICTS: 'REACTION', INTEGRATION_MAINTENANCE: 'MAINTENANCE', END_ROUND: 'END_ROUND',
};
export function setAlphaPhase(state: AlphaState, phase: AlphaRoundPhase): void {
  state.phase = phase;
  state.core.phase = CORE_PHASE_MIRROR[phase];
}

/** Phases that wait for players. The others run automatically as soon as the previous phase closes. */
export const INTERACTIVE_PHASES: readonly AlphaRoundPhase[] = ['PLANNING', 'CONFLICTS'];

type CommandType = AlphaCommand['type'];
const planning: CommandType[] = [
  'MANAGE', 'QUEUE_ORDER', 'CANCEL_ORDER', 'SETTLE', 'DECLARE_HEGEMONY', 'CHOOSE_AMBITIONS', 'PLAY_CARD', 'HIRE_ADVISOR',
  'WORLD_CHOICE', 'BUILD_PROJECT', 'PROPOSE_TREATY', 'RESPOND_TREATY', 'END_TREATY', 'DECLARE_WAR', 'BUILD_ROAD',
  'ADVANCE_ERA', 'CIVILIZATION_ABILITY', 'LEADER_ABILITY', 'SET_DEFENSE_POSTURE', 'URBAN_ACTION', 'READY', 'UNREADY',
  'CONTEST_PRESENCE',
  'INDEPENDENT_ACTION',
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
};

const PULSE_RESOURCE_NAMES = { FOOD: 'Alimento', WOOD: 'Madeira', STONE: 'Pedra', METAL: 'Metal', WEALTH: 'Riqueza', KNOWLEDGE: 'Conhecimento', INFLUENCE: 'Influência' } as const;
const RESOURCE_OF_MODULE = { FOOD: 'food', WOOD: 'wood', STONE: 'stone', METAL: 'metal', WEALTH: 'wealth', KNOWLEDGE: 'knowledge', INFLUENCE: 'influence' } as const;

function viewersAt(state:AlphaState,hexId:string,always:readonly PlayerId[]=[]):PlayerId[]{
  return state.players.map(player=>player.playerId).filter(playerId=>always.includes(playerId)||visibleHexIds(state,playerId).has(hexId));
}

/** Buys one Pulse with the private RNG, applies each module to every civilization and records it. */
function drawWorldPulse(state: AlphaState): void {
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
      else alphaLose(state, player.playerId, { [key]: -module.amount } as Partial<AlphaResourcePool>);
    }
  }
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
  for (const player of state.players) { player.ready = false; player.spentCommands = 0; player.orders = []; player.plannedActions=[]; ledgerOf(state, player.playerId); }
  maintainCards(state);
  drawWorldPulse(state);
  for (const player of state.players) applyRecurringEffects(state, player.playerId, 'ROUND_START');
  setAlphaPhase(state, 'PLANNING');
  alphaEvent(state, 'ROUND_STARTED', `Rodada ${state.core.round}: Planejamento.`);
  resolutionEvent(state,{type:'ROUND_EVENT',actorId:null,visibleTo:null,message:`Rodada ${state.core.round} iniciada.`,unitIds:[]});
}

/** Orders that resolve automatically. `types` chooses the phase: movement and exploration before diplomacy, attacks and influence in conflicts. */
export function resolveOrders(state: AlphaState, types: readonly StrategicOrder['type'][]): void {
  for (const type of types) for (const id of state.initiative) {
    const orders = state.players.find(player => player.playerId === id)!.orders.filter(order => order.type === type);
    for (const order of orders) {
      const candidate = structuredClone(state);
      try {
        if (order.type === 'EXPLORE') exploreRegion(candidate, id, order);
        else if (order.type === 'TRADE') establishRoute(candidate, id, order);
        else if (order.type === 'INFLUENCE') resolveInfluence(candidate, id, order);
        else validateMilitaryOrder(candidate, id, order);
        if (order.type === 'MOVE') candidate.units.filter(unit => order.unitIds.includes(unit.id)).forEach(unit => { unit.hexId = order.path.at(-1)!; });
        if (order.type === 'ATTACK') resolveBattle(candidate, id, order);
        candidate.core.players.forEach(player => { player.civilization = refreshAdministration(player.civilization, candidate.core.config, candidate.core.map); });
        refreshKnowledge(candidate); refreshHegemony(candidate);
        const before = { units: new Map(state.units.map(unit => [unit.id, unit])), rules: state.rules, names: new Map(state.core.players.map(player => [player.id as string, player.name])) };
        const message = order.type === 'ATTACK' ? battleMessage(before.names, candidate.battles.at(-1)!) : orderMessage(state, id, order, order.type === 'TRADE' ? state.core.players.flatMap(player => player.civilization.cities).find(city => city.id === order.toCityId)?.name : undefined);
        Object.assign(state, AlphaStateSchema.parse(candidate));
        alphaEvent(state, type, message, [id]);
        const target=order.type==='MOVE'?order.path.at(-1):order.type==='EXPLORE'||order.type==='INFLUENCE'||order.type==='ATTACK'?order.target:state.core.players.flatMap(player=>player.civilization.cities).find(city=>city.id===order.toCityId)?.hexId;
        const unitIds='unitIds' in order?order.unitIds:'unitId' in order?[order.unitId]:[];
        const eventType=({EXPLORE:'EXPLORATION',MOVE:'MOVEMENT',TRADE:'TRADE',ATTACK:'COMBAT',INFLUENCE:'INFLUENCE'} as const)[order.type];
        const visibleTo=target?viewersAt(state,target,[id]):[id];
        resolutionEvent(state,{type:eventType,actorId:id,visibleTo,message,...(target?{hexId:target}:{}),unitIds});
        if(order.type==='ATTACK'){
          const battle=state.battles.at(-1);
          if(battle?.losses.length)resolutionEvent(state,{type:'LOSSES',actorId:id,visibleTo,message:lossesMessage(before,battle.losses),hexId:order.target,unitIds:battle.losses});
          if(battle?.retreat){const retreating=battle.winnerId===id?battle.defenderId:id;resolutionEvent(state,{type:'RETREAT',actorId:retreating,visibleTo,message:`${before.names.get(retreating)??'O derrotado'} recuou para ${battle.retreat}.`,hexId:battle.retreat,unitIds:[]});}
          const advanced=order.unitIds.filter(unitId=>state.units.some(unit=>unit.id===unitId&&unit.hexId===order.target));
          if(advanced.length)resolutionEvent(state,{type:'ADVANCE',actorId:id,visibleTo,message:`${before.names.get(id)??'O vencedor'} avançou para ${order.target}.`,hexId:order.target,unitIds:advanced});
        }
      } catch (error: unknown) { alphaEvent(state, 'ORDER_FAILED', error instanceof Error ? error.message : 'Ordem não pôde ser executada.', [id]); }
    }
  }
}

function plannedOf(state:AlphaState,actor:PlayerId,types:readonly PlannedAction['type'][]):PlannedAction[]{
  return state.players.find(player=>player.playerId===actor)!.plannedActions.filter(action=>types.includes(action.type));
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
        const type=({PRODUCE:'PRODUCTION',BUILD:'CONSTRUCTION',RECRUIT:'RECRUITMENT',RESEARCH:'RESEARCH',PROMOTE_MOOD:'ROUND_EVENT',SUPPORT_TRADE:'TRADE',CIVIC_ACTION:'ROUND_EVENT'} as const)[action.action];
        const visibleTo=action.action==='BUILD'?viewersAt(candidate,city.hexId,[actor]):[actor];
        resolutionEvent(candidate,{type,actorId:actor,visibleTo,message:urbanActionMessage(state,candidate,actor,action,city.name),hexId:city.hexId,cityId:city.id,unitIds:[]});
      }else{
        const {id,...payload}=action;
        manageDiplomacy(candidate,actor,{...payload,planId:id,expectedVersion:candidate.version} as Extract<AlphaCommand,{type:'PROPOSE_TREATY'|'DECLARE_WAR'}>);
        alphaEvent(candidate,action.type,`Ação diplomática planejada executada: ${action.type}.`,[actor]);
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
function maintainCivilizations(state: AlphaState): void {
  const rules = state.core.config;
  for (const owner of state.core.players) {
    const ledger = ledgerOf(state, owner.id);
    const zero = { food: 0, materials: 0, wealth: 0, knowledge: 0, influence: 0 };
    // Population eats first, then pieces are maintained.
    const required = multiply(sum(owner.civilization.cities.map(city => city.population)), rules.foodPerPopulation);
    ledger.upkeepRequired.food += required;
    const eaten = alphaDrain(state, owner.id, { ...zero, food: required }, 'upkeepPaid').food;
    const shortage = eaten < required;
    if (shortage) alphaEvent(state, 'FOOD_SHORTAGE', `Faltaram ${required - eaten} Alimentos para a população. Estabilidade reduzida.`, [owner.id]);

    const surplus = shortage ? 0 : Math.max(0, ledger.production.food - required);
    const eligible = owner.civilization.cities.filter(city => city.population < populationCap(city, rules)).map(city => city.id).sort();
    const shares = new Map(eligible.map((id, index) => [id, Math.floor(surplus / eligible.length) + (index < surplus % eligible.length ? 1 : 0)]));
    let cities = owner.civilization.cities.map(city => {
      if (shortage || city.population >= populationCap(city, rules)) return { ...city, workers: { ...city.workers } };
      const progress = sum([city.growthProgress, shares.get(city.id) ?? 0]);
      const threshold = infrastructureStats(city, rules).growthThreshold;
      const growth = Math.min(Math.floor(progress / threshold), rules.maxGrowthPerMaintenance, populationCap(city, rules) - city.population);
      const population = sum([city.population, growth]);
      if (growth > 0) alphaEvent(state, 'POPULATION_GROWN', `${city.name} cresceu para ${population} de população.`, [owner.id]);
      return { ...city, population, growthProgress: Math.min(threshold, progress - multiply(growth, threshold)), workers: { ...city.workers, unassigned: sum([city.workers.unassigned, growth]) } };
    });
    const overextended = deriveAdministration({ ...owner.civilization, cities }, rules, state.core.map).administrationStatus === 'OVEREXTENDED';
    if (overextended) alphaEvent(state, 'ADMINISTRATIVE_OVEREXTENSION', 'A administração está sobrecarregada; a estabilidade cai.', [owner.id]);

    const upkeep = { ...zero };
    for (const unit of state.units.filter(candidate => candidate.ownerId === owner.id)) for (const key of RESOURCE_KEYS) upkeep[key] += state.rules.units[unit.kind].upkeep[key];
    for (const key of RESOURCE_KEYS) ledger.upkeepRequired[key] += upkeep[key];
    const paid = alphaDrain(state, owner.id, upkeep, 'upkeepPaid');
    const unitShortage = RESOURCE_KEYS.some(key => paid[key] < upkeep[key]);
    if (unitShortage) alphaEvent(state, 'UPKEEP_SHORTAGE', 'Faltaram recursos para manter as peças. Estabilidade das cidades reduzida em 5.', [owner.id]);

    cities = cities.map(city => {
      const meta = state.cities.find(candidate => candidate.cityId === city.id);
      const moodDelta = meta ? state.rules.balance.moodEffects[meta.mood]!.stabilityDelta : 0;
      const delta = sum([governmentStabilityDelta(city, owner.civilization, rules), moodDelta, shortage ? -rules.shortageStabilityPenalty : 0, overextended ? -rules.administrativeRules.overextensionStabilityPenalty : 0, unitShortage ? -5 : 0]);
      return { ...city, stability: clampStability(sum([city.stability, delta])) };
    });
    for (const city of cities) {
      const meta = state.cities.find(candidate => candidate.cityId === city.id);
      if (!meta) continue;
      meta.level = cityLevelForPopulation(city.population);
      state.telemetry.moodSamples.push(meta.mood);
    }
    owner.civilization = refreshAdministration({ ...owner.civilization, cities }, rules, state.core.map);
    alphaEvent(state, 'UPKEEP', `Manutenção: ${required + upkeep.food} Alimentos e ${upkeep.wealth} Riqueza.`, [owner.id]);
  }
}

function runMaintenance(state: AlphaState): void {
  maintainTrade(state);
  resolveRaidBands(state);
  for (const player of state.players) applyRecurringEffects(state, player.playerId, 'MAINTENANCE', { enforceStorage: false });
  maintainCivilizations(state);
  for (const player of state.players) enforceStorageRecorded(state, player.playerId);
  state.players.forEach(player => { player.ready = false; });
  refreshKnowledge(state);
  refreshHegemony(state);
  alphaEvent(state, 'MAINTENANCE', `Manutenção da rodada ${state.core.round} concluída.`);
  resolutionEvent(state,{type:'ROUND_EVENT',actorId:null,visibleTo:null,message:`Manutenção da rodada ${state.core.round} concluída.`,unitIds:[]});
}

function buildRoundReports(state: AlphaState): void {
  for (const owner of state.core.players) {
    const ledger = ledgerOf(state, owner.id);
    const closing = alphaToLegacyResources(state.players.find(player => player.playerId === owner.id)!.resources);
    state.roundReports.push({
      playerId: owner.id, round: state.core.round, opening: ledger.opening, institutions: ledger.institutions, trade: ledger.trade, mining: ledger.mining,
      production: ledger.production, other: ledger.other, losses: ledger.losses, expenses: ledger.expenses, discarded: ledger.discarded,
      economy: null, upkeepRequired: ledger.upkeepRequired, upkeepPaid: ledger.upkeepPaid, closing,
      administrativeLoad: owner.civilization.administrativeLoad, administrativeCapacity: owner.civilization.administrativeCapacity,
      cities: owner.civilization.cities.map(city => {
        const before = ledger.cities.find(entry => entry.cityId === city.id);
        return { cityId: city.id, populationBefore: before?.population ?? city.population, populationAfter: city.population, stabilityBefore: before?.stability ?? city.stability, stabilityAfter: city.stability };
      }), resolution:state.resolutionEvents.filter(event=>event.round===state.core.round&&(event.visibleTo===null||event.visibleTo.includes(owner.id))),
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
  scoreAmbitions(state);
  buildRoundReports(state);
  refreshHegemony(state);
  const hegemon = hegemonyWinner(state);
  if (hegemon) {
    state.winner = { playerId: hegemon, reason: 'HEGEMONY', round: state.core.round }; state.core.status = 'FINISHED';
    state.telemetry.winner = hegemon; state.telemetry.victoryReason = 'HEGEMONY';
    alphaEvent(state, 'GAME_FINISHED', 'Uma civilização consolidou sua Hegemonia.'); return;
  }
  if (state.core.round >= state.rules.roundLimit) {
    const playerId = prestigeRanking(state)[0]!;
    state.winner = { playerId, reason: 'ROUND_LIMIT', round: state.core.round }; state.core.status = 'FINISHED';
    state.telemetry.winner = playerId; state.telemetry.victoryReason = 'ROUND_LIMIT';
    alphaEvent(state, 'GAME_FINISHED', 'Partida encerrada pelo limite de rodadas.'); return;
  }
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
