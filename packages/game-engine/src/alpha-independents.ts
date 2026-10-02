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
      if (people.attitude !== 'FRIENDLY' || influence < INDEPENDENT_RULES.protectInfluence) throw new Error('Proteção exige atitude amistosa e influência suficiente.');
      if (people.protectorId !== null && people.protectorId !== actor) throw new Error('Este povo já possui outro protetor.');
      people.protectorId = actor;
      break;
    case 'INTEGRATE':
      if (people.attitude !== 'FRIENDLY' || influence < INDEPENDENT_RULES.integrateInfluence) throw new Error('Integração exige atitude amistosa e influência suficiente.');
      createIndependentCity(state, actor, people, true);
      break;
    case 'CONQUER': {
      const strength = state.units.filter(unit => unit.ownerId === actor && unit.hexId === people.hexId)
        .reduce((total, unit) => total + state.rules.units[unit.kind].strength, 0);
      if (strength < INDEPENDENT_RULES.conquerStrength[people.type]) throw new Error('Força militar insuficiente para conquistar este povo.');
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
  }));
}
