import {
  CityIdSchema, cityLevelForPopulation, emptyAlphaResourcePool, unassignedPopulation,
  type AlphaCommand, type AlphaResourcePool, type AlphaState, type PlayerId,
} from '@aoh/game-domain';
import { refreshAdministration } from './civilization.js';
import { alphaCanAfford, alphaGain, alphaPay } from './alpha-resources.js';
import { alphaEvent } from './alpha-events.js';

type IndependentCommand = Extract<AlphaCommand, { type: 'INDEPENDENT_ACTION' }>;
type People = AlphaState['independents'][number];

export const INDEPENDENT_RULES = {
  tradeCost: { ...emptyAlphaResourcePool(), wealth: 1 },
  tradeGain: { ...emptyAlphaResourcePool(), food: 2 },
  negotiateCost: { ...emptyAlphaResourcePool(), wealth: 1 },
  influenceCost: { ...emptyAlphaResourcePool(), influence: 1 },
  protectInfluence: 2,
  integrateInfluence: 3,
  conquerStrength: { VILLAGE: 2, TOWN: 3, CITY_STATE: 4 },
} as const satisfies Record<string, unknown>;

const attitudes = ['HOSTILE', 'WARY', 'NEUTRAL', 'FRIENDLY'] as const;
const cost = (value: AlphaResourcePool) => value;
const ATTITUDE_NAMES: Record<string, string> = { HOSTILE: 'Hostil', WARY: 'Desconfiado', NEUTRAL: 'Neutro', FRIENDLY: 'Amistoso' };
/** "atitude Amistosa (agora Neutro), influência 1 de 3": only the conditions still unmet. */
const missing = (people: People, influence: number, required: number) => [
  people.attitude !== 'FRIENDLY' ? `atitude Amistosa (agora ${ATTITUDE_NAMES[people.attitude]})` : null,
  influence < required ? `influência ${influence} de ${required}` : null,
].filter(Boolean).join(', ');

function requireKnown(state: AlphaState, actor: PlayerId, peopleId: string): People {
  const people = state.independents.find(candidate => candidate.id === peopleId);
  if (!people || !state.players.find(player => player.playerId === actor)?.knownHexIds.includes(people.hexId)) throw new Error('Povo independente desconhecido.');
  if (people.integratedBy !== null) throw new Error('Este povo independente já foi integrado.');
  return people;
}

function createIndependentCity(state: AlphaState, actor: PlayerId, people: People, peaceful: boolean): void {
  const owner = state.core.players.find(player => player.id === actor)!;
  const tile = state.core.map.find(candidate => candidate.id === people.hexId)!;
  if (tile.ownerId !== null && tile.ownerId !== actor) throw new Error('O território independente está sob controle estrangeiro.');
  const cityId = CityIdSchema.parse(`city-${people.id}`);
  if (state.core.players.some(player => player.civilization.cities.some(city => city.id === cityId))) throw new Error('Este povo já originou uma cidade.');
  const population = ({ VILLAGE: 1, TOWN: 2, CITY_STATE: 3 } as const)[people.type];
  owner.civilization.cities.push({
    id: cityId, ownerId: actor, hexId: people.hexId, name: people.id.replace('independent-', 'Povo '), population,
    workers: unassignedPopulation(population), stability: peaceful ? 60 : 40, development: 1, specialization: null,
    growthProgress: 0, foundedRound: state.core.round, workedHexIds: [], districts: [], buildings: [],
  });
  if (owner.civilization.capitalCityId === null) owner.civilization.capitalCityId = cityId;
  tile.ownerId = actor; tile.controllerCityId = cityId;
  owner.civilization = refreshAdministration(owner.civilization, state.core.config, state.core.map);
  const identity = state.players.find(player => player.playerId === actor)?.civilization ?? `native-${actor}`;
  state.cities.push({
    cityId, originalOwnerId: actor, currentOwnerId: actor, nativeIdentity: people.id, status: 'OWNED', integration: 100,
    mood: peaceful ? 3 : 1, level: cityLevelForPopulation(population), capital: owner.civilization.capitalCityId === cityId,
    districts: [], buildings: [], fortification: { level: 'NONE', state: 'INTACT' }, foreignPresence: [],
    localCohesion: peaceful ? 60 : 30, culturalAnchor: identity, urbanActionsUsed: 0,
  });
  // The owner's identity is not foreign presence; no cultural anchor exists without predominant presence.
  state.cities.at(-1)!.culturalAnchor = null;
  people.integratedBy = actor;
  people.protectorId = peaceful ? actor : null;
  state.telemetry.cityIntegration += 1;
}

export function independentAction(state: AlphaState, actor: PlayerId, command: IndependentCommand): void {
  const people = requireKnown(state, actor, command.peopleId);
  const influence = people.influenceByPlayer[actor] ?? 0;
  switch (command.action) {
    case 'TRADE':
      if (people.attitude === 'HOSTILE') throw new Error('Povos hostis não comerciam.');
      alphaPay(state, actor, cost(INDEPENDENT_RULES.tradeCost));
      alphaGain(state, actor, INDEPENDENT_RULES.tradeGain, { category: 'trade' });
      break;
    case 'NEGOTIATE': {
      if (people.attitude === 'FRIENDLY') throw new Error('Este povo já está amistoso.');
      alphaPay(state, actor, cost(INDEPENDENT_RULES.negotiateCost));
      const index = attitudes.indexOf(people.attitude);
      people.attitude = attitudes[Math.min(attitudes.length - 1, index + 1)]!;
      break;
    }
    case 'INFLUENCE':
      if (people.attitude === 'HOSTILE') throw new Error('Negocie antes de influenciar um povo hostil.');
      alphaPay(state, actor, cost(INDEPENDENT_RULES.influenceCost));
      people.influenceByPlayer[actor] = influence + 1;
      break;
    case 'PROTECT':
      if (people.attitude !== 'FRIENDLY' || influence < INDEPENDENT_RULES.protectInfluence) throw new Error(`Falta: ${missing(people, influence, INDEPENDENT_RULES.protectInfluence)}.`);
      if (people.protectorId !== null && people.protectorId !== actor) throw new Error('Este povo já possui outro protetor.');
      people.protectorId = actor;
      break;
    case 'INTEGRATE':
      if (people.attitude !== 'FRIENDLY' || influence < INDEPENDENT_RULES.integrateInfluence) throw new Error(`Falta: ${missing(people, influence, INDEPENDENT_RULES.integrateInfluence)}.`);
      createIndependentCity(state, actor, people, true);
      break;
    case 'CONQUER': {
      const strength = state.units.filter(unit => unit.ownerId === actor && unit.hexId === people.hexId)
        .reduce((total, unit) => total + state.rules.units[unit.kind].strength, 0);
      if (strength < INDEPENDENT_RULES.conquerStrength[people.type]) throw new Error(`Força militar neste hex: ${strength} de ${INDEPENDENT_RULES.conquerStrength[people.type]}.`);
      createIndependentCity(state, actor, people, false);
      break;
    }
  }
  alphaEvent(state, 'INDEPENDENT_ACTION', `Ação ${command.action} resolvida com ${people.id}.`, [actor]);
}

export function independentPeopleView(state: AlphaState, actor: PlayerId) {
  const known = new Set(state.players.find(player => player.playerId === actor)?.knownHexIds ?? []);
  return state.independents.filter(people => known.has(people.hexId)).map(people => ({
    id: people.id, hexId: people.hexId, type: people.type, attitude: people.attitude,
    yourInfluence: people.influenceByPlayer[actor] ?? 0, protectorId: people.protectorId, integratedBy: people.integratedBy,
    canAffordTrade: alphaCanAfford(state, actor, INDEPENDENT_RULES.tradeCost),
    actions: INDEPENDENT_ACTIONS.map(action => ({ action, effect: INDEPENDENT_EFFECTS[action](people.type), cost: INDEPENDENT_COSTS[action] ?? null, blocked: independentBlock(state, actor, people.id, action) })),
  }));
}

const INDEPENDENT_ACTIONS = ['TRADE', 'NEGOTIATE', 'INFLUENCE', 'PROTECT', 'INTEGRATE', 'CONQUER'] as const;
const INDEPENDENT_COSTS: Partial<Record<(typeof INDEPENDENT_ACTIONS)[number], AlphaResourcePool>> = { TRADE: INDEPENDENT_RULES.tradeCost, NEGOTIATE: INDEPENDENT_RULES.negotiateCost, INFLUENCE: INDEPENDENT_RULES.influenceCost };
const INDEPENDENT_EFFECTS: Record<(typeof INDEPENDENT_ACTIONS)[number], (type: People['type']) => string> = {
  TRADE: () => `Troca imediata: +${INDEPENDENT_RULES.tradeGain.food} Alimento. Povos hostis não comerciam.`,
  NEGOTIATE: () => 'A atitude do povo melhora um passo (Hostil, Desconfiado, Neutro, Amistoso).',
  INFLUENCE: () => '+1 da sua influência sobre este povo. Exige que não seja hostil.',
  PROTECT: () => `Torna-se protetor. Exige atitude Amistosa e influência ${INDEPENDENT_RULES.protectInfluence}.`,
  INTEGRATE: () => `O povo se une a você como cidade, em paz. Exige atitude Amistosa e influência ${INDEPENDENT_RULES.integrateInfluence}.`,
  CONQUER: type => `Toma o povo como cidade à força. Exige Força ${INDEPENDENT_RULES.conquerStrength[type]} das suas peças militares neste hex.`,
};
/** The refusal the action would give now (dry run on a copy), or null. Every option is one main action in planning. */
function independentBlock(state: AlphaState, actor: PlayerId, peopleId: string, action: (typeof INDEPENDENT_ACTIONS)[number]): string | null {
  if (state.phase !== 'PLANNING') return 'Disponível no Planejamento.';
  try { independentAction(structuredClone(state), actor, { type: 'INDEPENDENT_ACTION', expectedVersion: state.version, peopleId, action }); return null; }
  catch (error) { return error instanceof Error ? error.message : 'Ação indisponível.'; }
}
