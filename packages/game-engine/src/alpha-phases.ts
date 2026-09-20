import {
  ALPHA_CARDS, AlphaStateSchema, RESOURCE_KEYS, WORLD_PULSE_CARDS, alphaToLegacyResources,
  type AlphaCommand, type AlphaResourcePool, type AlphaRoundPhase, type AlphaState, type PlayerId, type RoundPhase, type StrategicOrder,
} from '@aoh/game-domain';
import { clampStability, deriveAdministration, governmentStabilityDelta, multiply, populationCap, refreshAdministration, sum } from './civilization.js';
import { infrastructureStats } from './urban.js';
import { alphaEvent } from './alpha-events.js';
import { alphaRandomInteger } from './alpha-random.js';
import { alphaDrain, alphaGain, alphaLose, enforceStorageRecorded, ledgerOf } from './alpha-resources.js';
import { maintainCards, scoreAmbitions } from './alpha-cards.js';
import { establishRoute, maintainTrade, resolveInfluence, settleTreaties } from './alpha-diplomacy.js';
import { exploreRegion, refreshKnowledge } from './alpha-world.js';
import { validateMilitaryOrder } from './alpha-military.js';
import { resolveBattle } from './alpha-combat.js';
import { hegemonyWinner, refreshHegemony } from './alpha-hegemony.js';
import { applyRecurringEffects } from './alpha-institutions.js';

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
export const INTERACTIVE_PHASES: readonly AlphaRoundPhase[] = ['PLANNING', 'URBAN_ACTIONS', 'DIPLOMACY_TRADE', 'CONFLICTS'];

type CommandType = AlphaCommand['type'];
const planning: CommandType[] = [
  'MANAGE', 'QUEUE_ORDER', 'CANCEL_ORDER', 'SETTLE', 'DECLARE_HEGEMONY', 'CHOOSE_AMBITIONS', 'PLAY_CARD', 'HIRE_ADVISOR',
  'WORLD_CHOICE', 'BUILD_PROJECT', 'PROPOSE_TREATY', 'RESPOND_TREATY', 'END_TREATY', 'DECLARE_WAR', 'BUILD_ROAD',
  'ADVANCE_ERA', 'CIVILIZATION_ABILITY', 'LEADER_ABILITY', 'SET_DEFENSE_POSTURE', 'READY',
];
/** Commands legal in each phase. Everything else is rejected with WRONG_PHASE before any rule runs. */
export const LEGAL_COMMANDS: Readonly<Record<AlphaRoundPhase, ReadonlySet<CommandType>>> = {
  WORLD_PULSE: new Set(),
  PLANNING: new Set(planning),
  URBAN_ACTIONS: new Set<CommandType>(['URBAN_ACTION', 'READY']),
  ORDERS_MOVEMENT: new Set(),
  DIPLOMACY_TRADE: new Set<CommandType>(['PROPOSE_TREATY', 'RESPOND_TREATY', 'END_TREATY', 'DECLARE_WAR', 'READY']),
  CONFLICTS: new Set<CommandType>(['PLAY_CARD', 'READY']),
  INTEGRATION_MAINTENANCE: new Set(),
  END_ROUND: new Set(),
};

const RESOURCE_OF_MODULE = { FOOD: 'food', WOOD: 'wood', STONE: 'stone', METAL: 'metal', WEALTH: 'wealth', KNOWLEDGE: 'knowledge', INFLUENCE: 'influence' } as const;

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
  alphaEvent(state, 'WORLD_PULSE', `Pulso do mundo: ${card.name}.`);
}

/**
 * WORLD_PULSE opens a round: ledgers open at the current balances, strategy cards and the world event advance, one Pulse is
 * drawn, ROUND_START effects are credited, and the round enters PLANNING. No city output is credited here.
 */
export function openRound(state: AlphaState): void {
  if (state.phase !== 'WORLD_PULSE') throw new Error('Uma rodada só abre a partir do Pulso do mundo.');
  state.roundLedgers = state.roundLedgers.filter(ledger => ledger.round >= state.core.round);
  for (const player of state.players) { player.ready = false; player.spentCommands = 0; player.orders = []; ledgerOf(state, player.playerId); }
  maintainCards(state);
  drawWorldPulse(state);
  for (const player of state.players) applyRecurringEffects(state, player.playerId, 'ROUND_START');
  setAlphaPhase(state, 'PLANNING');
  alphaEvent(state, 'ROUND_STARTED', `Rodada ${state.core.round}: Planejamento.`);
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
        refreshKnowledge(candidate); refreshHegemony(candidate); Object.assign(state, AlphaStateSchema.parse(candidate));
        const message = ({ EXPLORE: 'Região explorada.', MOVE: 'Movimento concluído.', TRADE: 'Rota de comércio estabelecida.', ATTACK: 'Conflito resolvido; consulte dados e perdas.', INFLUENCE: 'Influência aplicada.' })[type];
        alphaEvent(state, 'ORDER_RESOLVED', message, [id]);
      } catch (error: unknown) { alphaEvent(state, 'ORDER_FAILED', error instanceof Error ? error.message : 'Ordem não pôde ser executada.', [id]); }
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
      const delta = sum([governmentStabilityDelta(city, owner.civilization, rules), shortage ? -rules.shortageStabilityPenalty : 0, overextended ? -rules.administrativeRules.overextensionStabilityPenalty : 0, unitShortage ? -5 : 0]);
      return { ...city, stability: clampStability(sum([city.stability, delta])) };
    });
    owner.civilization = refreshAdministration({ ...owner.civilization, cities }, rules, state.core.map);
    alphaEvent(state, 'UPKEEP', `Manutenção: ${required + upkeep.food} Alimentos e ${upkeep.wealth} Riqueza.`, [owner.id]);
  }
}

function runMaintenance(state: AlphaState): void {
  maintainTrade(state);
  for (const player of state.players) applyRecurringEffects(state, player.playerId, 'MAINTENANCE', { enforceStorage: false });
  maintainCivilizations(state);
  for (const player of state.players) enforceStorageRecorded(state, player.playerId);
  state.players.forEach(player => { player.ready = false; });
  refreshKnowledge(state);
  refreshHegemony(state);
  alphaEvent(state, 'MAINTENANCE', `Manutenção da rodada ${state.core.round} concluída.`);
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
      }),
    });
  }
}

export function prestigeRanking(state: AlphaState): PlayerId[] {
  const metrics = (id: PlayerId) => {
    const progress = state.players.find(player => player.playerId === id)!; const owner = state.core.players.find(player => player.id === id)!;
    return [progress.prestige, progress.research.length, owner.civilization.cities.reduce((total, city) => total + city.population, 0), owner.resources.wealth];
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

const REACTION_CARD = (id: string) => ALPHA_CARDS.find(card => card.id === id)?.timing === 'REACTION';

/**
 * Every player confirmed. Closes the current phase and runs every automatic phase after it until the next one that waits for
 * players (or the match ends). A phase cannot be skipped: each one runs in order and its required work happens in it.
 */
export function advanceAfterReady(state: AlphaState): void {
  for (let guard = 0; guard < 16; guard++) {
    switch (state.phase) {
      case 'PLANNING':
        state.players.forEach(player => { player.ready = false; });
        state.cities.forEach(city => { city.urbanActionsUsed = 0; });
        setAlphaPhase(state, 'URBAN_ACTIONS');
        alphaEvent(state, 'PHASE', 'Ações urbanas: cada cidade pode agir uma vez.');
        return;
      case 'URBAN_ACTIONS':
        setAlphaPhase(state, 'ORDERS_MOVEMENT');
        resolveOrders(state, ['EXPLORE', 'MOVE', 'TRADE']);
        alphaEvent(state, 'RESOLUTION', 'Ordens de exploração, movimento e comércio resolvidas por iniciativa explícita.');
        setAlphaPhase(state, 'DIPLOMACY_TRADE');
        state.players.forEach(player => { player.ready = false; });
        return;
      case 'DIPLOMACY_TRADE': {
        settleTreaties(state);
        setAlphaPhase(state, 'CONFLICTS');
        const conflict = state.players.some(player => player.orders.some(order => order.type === 'ATTACK'));
        state.players.forEach(player => { player.ready = !(conflict && player.cardsPlayed < state.rules.cardsPerRound && player.hand.some(REACTION_CARD)); });
        if (state.players.some(player => !player.ready)) return;
        break;
      }
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
