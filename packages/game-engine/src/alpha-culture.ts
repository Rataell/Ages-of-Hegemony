import {
  CulturalPresenceLevelSchema,
  type AlphaCommand,
  type AlphaState,
  type CityId,
  type PlayerId,
} from '@aoh/game-domain';
import { alphaEvent } from './alpha-events.js';
import { alphaRandomInteger } from './alpha-random.js';
import { kitCultureDefense } from './alpha-kits.js';

type Contest = Extract<AlphaCommand, { type: 'CONTEST_PRESENCE' }>;
type Presence = AlphaState['cities'][number]['foreignPresence'][number];

const levels = CulturalPresenceLevelSchema.options;
const rank = (presence: Presence) => levels.indexOf(presence.level);
const promoted = (presence: Presence): Presence => ({ ...presence, level: levels[Math.min(levels.length - 1, rank(presence) + 1)]! });

export function culturalIdentityOf(state: AlphaState, playerId: PlayerId): string {
  const civilization = state.players.find(player => player.playerId === playerId)?.civilization;
  return civilization ?? state.cities.find(city => city.originalOwnerId === playerId)?.nativeIdentity ?? `native-${playerId}`;
}

function playerForCivilization(state: AlphaState, civilizationId: string) {
  return state.players.find(player => culturalIdentityOf(state, player.playerId) === civilizationId);
}

/** Rebuilds compatibility counters from the city presence records, their only authority. */
export function refreshCulturalMetrics(state: AlphaState): void {
  for (const player of state.players) {
    const civilization = culturalIdentityOf(state, player.playerId);
    player.influencedCities = state.cities
      .filter(city => city.currentOwnerId !== player.playerId && city.foreignPresence.some(presence => presence.civilizationId === civilization))
      .map(city => city.cityId)
      .sort();
    player.foreignInfluence = player.influencedCities.length;
  }
}

export function culturalPresenceCount(state: AlphaState, actor: PlayerId): number {
  const civilization = culturalIdentityOf(state, actor);
  return state.cities.filter(city => city.currentOwnerId !== actor && city.foreignPresence.some(presence => presence.civilizationId === civilization)).length;
}

/** Adds the first presence level through the existing envoy influence order. */
export function establishCulturalPresence(state: AlphaState, actor: PlayerId, cityId: CityId): void {
  const city = state.cities.find(candidate => candidate.cityId === cityId);
  if (!city || city.currentOwnerId === actor) throw new Error('A presença cultural exige uma cidade estrangeira.');
  const civilizationId = culturalIdentityOf(state, actor);
  if (city.foreignPresence.some(presence => presence.civilizationId === civilizationId)) throw new Error('Sua civilização já mantém presença nesta cidade.');
  if (city.foreignPresence.length >= state.rules.balance.cultureSlots) throw new Error('A cidade já ocupa os três espaços de presença cultural.');
  city.foreignPresence.push({ civilizationId, level: 'CONTACT' });
  refreshCulturalMetrics(state);
}

function modifier(state: AlphaState, civilizationId: string, presence: Presence, anchor: string | null): number {
  const player = playerForCivilization(state, civilizationId);
  if (!player) return rank(presence);
  const culturalDistricts = state.core.players.find(owner => owner.id === player.playerId)?.civilization.cities
    .reduce((total, city) => total + city.districts.filter(district => district.type === 'CULTURAL').length, 0) ?? 0;
  return rank(presence) + Math.min(state.rules.balance.cultureSlots, culturalDistricts) + Number(anchor === civilizationId);
}

function removeOrDemote(list: Presence[], civilizationId: string): Presence[] {
  const presence = list.find(candidate => candidate.civilizationId === civilizationId)!;
  if (presence.level === 'CONTACT') return list.filter(candidate => candidate.civilizationId !== civilizationId);
  const next = levels[Math.max(0, rank(presence) - 1)]!;
  return list.map(candidate => candidate.civilizationId === civilizationId ? { ...candidate, level: next } : candidate);
}

/** Resolves one private two-dice contest and records every number needed to replay its outcome. */
export function contestPresence(state: AlphaState, actor: PlayerId, command: Contest): void {
  const city = state.cities.find(candidate => candidate.cityId === command.cityId);
  if (!city) throw new Error('Cidade desconhecida.');
  const attackerCivilizationId = culturalIdentityOf(state, actor);
  if (city.currentOwnerId === actor) throw new Error('Não dispute presença estrangeira em uma cidade própria.');
  if (attackerCivilizationId === command.defenderCivilizationId) throw new Error('Escolha outra presença para disputar.');
  const attacker = city.foreignPresence.find(presence => presence.civilizationId === attackerCivilizationId);
  const defender = city.foreignPresence.find(presence => presence.civilizationId === command.defenderCivilizationId);
  if (!attacker || !defender) throw new Error('As duas civilizações precisam manter presença nesta cidade.');
  const attackDice = [alphaRandomInteger(state, 6) + 1, alphaRandomInteger(state, 6) + 1] as [number, number];
  const defenseDice = [alphaRandomInteger(state, 6) + 1, alphaRandomInteger(state, 6) + 1] as [number, number];
  const attackModifier = modifier(state, attackerCivilizationId, attacker, city.culturalAnchor);
  const defenseModifier = modifier(state, command.defenderCivilizationId, defender, city.culturalAnchor) + kitCultureDefense(state, command.defenderCivilizationId);
  const attackTotal = attackDice[0] + attackDice[1] + attackModifier;
  const defenseTotal = defenseDice[0] + defenseDice[1] + defenseModifier;
  const attackerWins = attackTotal > defenseTotal;
  const winnerCivilizationId = attackerWins ? attackerCivilizationId : command.defenderCivilizationId;
  const loserCivilizationId = attackerWins ? command.defenderCivilizationId : attackerCivilizationId;

  city.foreignPresence = removeOrDemote(city.foreignPresence, loserCivilizationId)
    .map(presence => presence.civilizationId === winnerCivilizationId ? promoted(presence) : presence);
  const winner = city.foreignPresence.find(presence => presence.civilizationId === winnerCivilizationId)!;
  const loser = city.foreignPresence.find(presence => presence.civilizationId === loserCivilizationId);
  if (loser && rank(loser) > rank(winner)) loser.level = winner.level;
  if (city.culturalAnchor === loserCivilizationId) city.culturalAnchor = null;
  if (winner.level === 'PREDOMINANT') city.culturalAnchor = winnerCivilizationId;
  city.localCohesion = Math.max(0, Math.min(100, city.localCohesion + (attackerWins ? -5 : 5)));

  state.cultureContests.push({
    id: `culture-${state.cultureContests.length + 1}`, round: state.core.round, cityId: city.cityId,
    attackerCivilizationId, defenderCivilizationId: command.defenderCivilizationId,
    attackDice, defenseDice, attackModifier, defenseModifier, attackTotal, defenseTotal,
    winnerCivilizationId, loserCivilizationId,
  });
  state.telemetry.culturalContests += 1;
  state.telemetry.culturalContestResults[winnerCivilizationId] = (state.telemetry.culturalContestResults[winnerCivilizationId] ?? 0) + 1;
  refreshCulturalMetrics(state);
  alphaEvent(state, 'CULTURAL_CONTEST', `Disputa cultural resolvida em ${city.cityId}.`);
}

/** Allow-listed culture records for known cities; no aggregate or hidden map data escapes. */
export function culturalPresenceView(state: AlphaState, actor: PlayerId) {
  const known = new Set(state.players.find(player => player.playerId === actor)?.knownHexIds ?? []);
  const hexByCity = new Map(state.core.players.flatMap(owner => owner.civilization.cities.map(city => [city.id, city.hexId] as const)));
  return state.cities.filter(city => known.has(hexByCity.get(city.cityId)!)).map(city => ({
    cityId: city.cityId, currentOwnerId: city.currentOwnerId,
    foreignPresence: city.foreignPresence.map(presence => ({ ...presence })),
    localCohesion: city.currentOwnerId === actor ? city.localCohesion : null,
    culturalAnchor: city.culturalAnchor,
  }));
}
