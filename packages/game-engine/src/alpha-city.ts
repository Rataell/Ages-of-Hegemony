import {
  ALPHA_RESOURCE_KEYS, effectiveCapacity, effectiveLevel, elevateRequirement, emptyAlphaResourcePool, ladderStep, levelIndex, nextLevel, populationCeiling,
  type AlphaCity, type AlphaResourcePool, type AlphaState, type CityLevel, type CityPace, type CityState, type PlayerId,
} from '@aoh/game-domain';
import { tileYieldBreakdown } from './economy.js';
import { alphaCanAfford, alphaGain, alphaPay } from './alpha-resources.js';
import { hasUnlock } from './alpha-institutions.js';
import { hexBlockedByThreat } from './alpha-threats.js';
import { hexDistance } from './hex.js';
import { governmentEffects } from './alpha-government.js';

/**
 * The city rules of V5.1a (canon §4–§7): Capacity as the power of one activation, Elevar, population roles, sustenance and
 * growth, mobilization. Everything here is pure over the state so the action, the maintenance step and the client preview
 * read the same numbers.
 */

/** Ânimo in four states over the stored 0–6 scale (canon §10): 0–1 Revolta, 2–3 Abalada, 4 Estável, 5–6 Próspera. */
export type MoodBand = 'REVOLT' | 'SHAKEN' | 'STABLE' | 'PROSPEROUS';
export const moodBand = (mood: number): MoodBand => mood <= 1 ? 'REVOLT' : mood <= 3 ? 'SHAKEN' : mood === 4 ? 'STABLE' : 'PROSPEROUS';
export const MOOD_BAND_NAMES: Record<MoodBand, string> = { REVOLT: 'Revolta', SHAKEN: 'Abalada', STABLE: 'Estável', PROSPEROUS: 'Próspera' };

export function cityPair(state: AlphaState, cityId: string): { meta: AlphaCity; city: CityState; ownerId: PlayerId } | null {
  const meta = state.cities.find(candidate => candidate.cityId === cityId);
  if (!meta) return null;
  const owner = state.core.players.find(player => player.id === meta.currentOwnerId);
  const city = owner?.civilization.cities.find(candidate => candidate.id === cityId);
  return owner && city ? { meta, city, ownerId: owner.id } : null;
}

/** Built level, the level the population supports, and the Capacity the city operates with before Ânimo. */
export function cityLevels(meta: AlphaCity, city: CityState, pace: CityPace = 'STANDARD'): { built: CityLevel; effective: CityLevel; capacity: number; ceiling: number; degraded: boolean } {
  const effective = effectiveLevel(meta.level, city.population, pace);
  return { built: meta.level, effective, capacity: effectiveCapacity(meta.level, city.population, pace), ceiling: populationCeiling(meta.level, pace), degraded: effective !== meta.level };
}

/**
 * The Capacity the city operates with before Ânimo: the effective Capacity of its level, plus the capital's government and
 * Centralização bonus (Monarquia +1, Centralização +1) and capped by the Confederação limitation (canon §16, §12).
 */
export function operatingCapacity(state: AlphaState, cityId: string): number {
  const pair = cityPair(state, cityId);
  if (!pair) return 0;
  let capacity = cityLevels(pair.meta, pair.city, state.rules.pace).capacity;
  const owner = state.core.players.find(player => player.id === pair.ownerId);
  if (owner && owner.civilization.capitalCityId === cityId) {
    const effects = governmentEffects(state, pair.ownerId);
    capacity += effects.capitalCapacityBonus + (hasUnlock(state, pair.ownerId, 'rule:capital-capacity-plus-1') ? 1 : 0);
    if (effects.capitalCapacityCap !== null) capacity = Math.min(capacity, effects.capitalCapacityCap);
  }
  return capacity;
}

/**
 * Capacity of the next activation (canon §4, §10): effective Capacity, −1 (min 1) when Abalada, +1 on the first activation
 * of a Próspera city. A Revolta city has no productive Capacity.
 */
export function activationCapacity(state: AlphaState, cityId: string): number {
  const pair = cityPair(state, cityId);
  if (!pair) return 0;
  const band = moodBand(pair.meta.mood);
  if (band === 'REVOLT') return 0;
  const base = operatingCapacity(state, cityId);
  if (band === 'SHAKEN') return Math.max(1, base - 1);
  if (band === 'PROSPEROUS' && pair.meta.urbanActionsUsed === 0) return base + 1;
  return base;
}
/** Activations a city may take this round: two when Estável or Próspera, one when Abalada, none in Revolta except Governar. */
export const activationsAllowed = (meta: AlphaCity): number => moodBand(meta.mood) === 'REVOLT' ? 1 : moodBand(meta.mood) === 'SHAKEN' ? 1 : 2;

/** Buildings that let the third and later pairs of a role yield (canon §6). */
const ROLE_BUILDING: Record<'artisans' | 'merchants' | 'scholars', string> = { artisans: 'WORKSHOP', merchants: 'MARKET', scholars: 'LIBRARY' };
const pairs = (count: number, building: string, meta: AlphaCity, perOne = false): number => {
  const all = perOne ? count : Math.floor(count / 2);
  return meta.buildings.includes(building as never) ? all : Math.min(all, perOne ? 4 : 2);
};

export interface CityYield { output: AlphaResourcePool; /** Metal from mines on deposits, credited as mining. */ metal: number; hexes: string[]; capacity: number; notes: string[] }
/**
 * Produzir (canon §4–§6): the centre plus `capacity` worked hexes yield their terrain, feature and improvement (Fazenda +1 per
 * farm-bonus advance); Produtores without a hex add 1 Alimento per two; Artesãos, Mercadores and Eruditos add 1 of their
 * resource per two (the third pair needs the family building); districts add their flat yield.
 */
export function cityYield(state: AlphaState, cityId: string): CityYield {
  const pair = cityPair(state, cityId);
  const output = emptyAlphaResourcePool();
  if (!pair) return { output, metal: 0, hexes: [], capacity: 0, notes: [] };
  const { meta, city, ownerId } = pair;
  const capacity = activationCapacity(state, cityId);
  const notes: string[] = [];
  if (capacity === 0) return { output, metal: 0, hexes: [], capacity, notes: ['Revolta: a cidade não produz.'] };
  const rules = state.core.config;
  const centre = state.core.map.find(tile => tile.id === city.hexId);
  const worked = city.workedHexIds.slice(0, Math.min(capacity, city.workers.producers)).map(id => state.core.map.find(tile => tile.id === id)).filter((tile): tile is NonNullable<typeof tile> => tile !== undefined && !hexBlockedByThreat(state, tile.id));
  const farmBonus = state.players.find(player => player.playerId === ownerId)?.research.filter(id => ['web-irrigation', 'web-crop-rotation', 'web-agronomy'].includes(id)).length ?? 0;
  const tiles = centre ? [centre, ...worked] : worked;
  let metal = 0;
  for (const tile of tiles) {
    const yields = tileYieldBreakdown(tile, rules).total;
    output.food += yields.food + (tile.improvement === 'FARM' ? farmBonus : 0);
    output.wealth += yields.wealth;
    // Materials from the land split by what the hex is: stone from hills and mountains, wood elsewhere; a mine gives metal.
    if (tile.improvement === 'MINE' && tile.features.includes('METAL') && tile !== centre) metal += state.rules.balance.metalPerMine;
    else if (tile.terrain === 'HILLS' || tile.terrain === 'MOUNTAINS' || tile.improvement === 'MINE') output.stone += yields.materials;
    else output.wood += yields.materials;
  }
  // Moinho: +1 Alimento per Fazenda actually worked in this activation (the same slice as the yield above: capacity, no centre hex, no hex held by a threat), at most +2.
  if (meta.buildings.includes('MILL')) {
    const mill = Math.min(2, worked.filter(tile => tile.improvement === 'FARM').length);
    if (mill > 0) { output.food += mill; notes.push(`Moinho: +${mill} Alimento.`); }
  }
  const idleProducers = Math.max(0, city.workers.producers - worked.length);
  output.food += Math.floor(idleProducers / 2);
  output.wood += pairs(city.workers.artisans, ROLE_BUILDING.artisans, meta);
  output.wealth += pairs(city.workers.merchants, ROLE_BUILDING.merchants, meta);
  const effects = governmentEffects(state, ownerId);
  output.knowledge += pairs(city.workers.scholars, ROLE_BUILDING.scholars, meta, effects.scholarYieldsPerOne);
  for (const district of meta.districts) {
    if (district === 'AGRARIAN') output.food += 2;
    else if (district === 'COMMERCIAL') output.wealth += 1;
    else if (district === 'ACADEMIC') output.knowledge += 1;
    else if (district === 'INDUSTRIAL') { output.wood += 1; output.stone += 1; }
    else if (district === 'CULTURAL') output.culture += 1;
    else if (district === 'MARITIME') output.food += 1;
  }
  if (meta.buildings.includes('TEMPLE')) output.culture += 1 + effects.templeCulture;
  if (effects.shakenCitiesProduceNoWealth && moodBand(meta.mood) === 'SHAKEN' && output.wealth > 0) { output.wealth = 0; notes.push('Oligarquia: cidade Abalada não gera Riqueza.'); }
  if (worked.length < city.workedHexIds.length) notes.push(`Capacidade ${capacity}: ${city.workedHexIds.length - worked.length} hex(es) trabalhado(s) ficam fora desta ativação.`);
  return { output, metal, hexes: tiles.map(tile => tile.id), capacity, notes };
}

/** Why the city cannot Elevar now, or null (canon §4: population, cost, Web advances, Era). */
export function elevateBlock(state: AlphaState, actor: PlayerId, cityId: string): string | null {
  const pair = cityPair(state, cityId);
  if (!pair || pair.ownerId !== actor) return 'Escolha uma cidade própria.';
  const next = nextLevel(pair.meta.level);
  if (!next) return 'A cidade já é uma Metrópole Imperial.';
  const requirement = elevateRequirement(next, state.rules.pace)!;
  const progress = state.players.find(player => player.playerId === actor)!;
  const eras = ['FOUNDATION', 'EXPANSION', 'CONSOLIDATION', 'CIVILIZATION', 'EMPIRES', 'POWERS', 'ASCENSION'];
  if (pair.city.population < requirement.minPopulation) return `Elevar exige ${requirement.minPopulation} habitantes (a cidade tem ${pair.city.population}).`;
  if (eras.indexOf(progress.era) < eras.indexOf(requirement.era)) return 'Elevar a este nível exige uma Era posterior.';
  const missing = requirement.advances.filter(id => !progress.research.includes(id));
  if (missing.length) return `Elevar exige o avanço ${missing.join(', ')} na Teia.`;
  if (!alphaCanAfford(state, actor, requirement.cost)) return 'Recursos insuficientes para esta ação.';
  return null;
}
export function elevateCity(state: AlphaState, actor: PlayerId, cityId: string): CityLevel {
  const blocked = elevateBlock(state, actor, cityId);
  if (blocked) throw new Error(blocked);
  const pair = cityPair(state, cityId)!;
  const next = nextLevel(pair.meta.level)!;
  alphaPay(state, actor, elevateRequirement(next)!.cost);
  pair.meta.level = next;
  return next;
}

/** District slots of the built level (canon §5), plus one for Vila and above with Federalização. */
export function districtSlots(state: AlphaState, cityId: string): number {
  const pair = cityPair(state, cityId);
  if (!pair) return 0;
  // Federalização: +1 slot from Vila up. By level, not by the standard population minimum: the accelerated pace lowers that minimum.
  const bonus = hasUnlock(state, pair.ownerId, 'rule:slots-plus-1-village-up') && levelIndex(pair.meta.level) >= levelIndex('VILLAGE') ? 1 : 0;
  return ladderStep(pair.meta.level).slots + bonus;
}

/** Sustenance (canon §7): 1 Alimento per 2 inhabitants per city, rounded up. */
export const citySustenance = (population: number): number => Math.ceil(population / 2);
/** Military upkeep (canon §7, §11): 1 Alimento per 2 land pieces; 1 Riqueza per ship; civilians nothing. */
export function militaryUpkeep(state: AlphaState, actor: PlayerId): { food: number; wealth: number } {
  const own = state.units.filter(unit => unit.ownerId === actor);
  const land = own.filter(unit => state.rules.units[unit.kind].domain === 'LAND' && state.rules.units[unit.kind].strength > 0).length;
  const ships = own.filter(unit => state.rules.units[unit.kind].domain === 'SEA').length;
  return { food: Math.ceil(land / 2), wealth: Math.max(0, ships - shipyardExemption(state, actor)) };
}
/**
 * Estaleiro: up to 2 ships anchored at the city (its hex or a hex next to it) pay no Riqueza upkeep. Each ship is claimed by one Estaleiro only (cities in id order);
 * an occupied city grants nothing. Used by the maintenance, the forecast and the projection through `militaryUpkeep`.
 */
export function shipyardExemption(state: AlphaState, actor: PlayerId): number {
  const yards = state.cities.filter(city => city.currentOwnerId === actor && city.status !== 'OCCUPIED' && city.buildings.includes('SHIPYARD')).sort((a, b) => (a.cityId < b.cityId ? -1 : 1));
  if (!yards.length) return 0;
  const tiles = new Map(state.core.map.map(tile => [tile.id as string, tile]));
  const hexOf = (cityId: string) => state.core.players.flatMap(owner => owner.civilization.cities).find(city => city.id === cityId)?.hexId;
  const claimed = new Set<string>();
  let exempt = 0;
  for (const yard of yards) {
    const centre = tiles.get(hexOf(yard.cityId) ?? '');
    if (!centre) continue;
    const near = state.units.filter(unit => unit.ownerId === actor && state.rules.units[unit.kind].domain === 'SEA' && !claimed.has(unit.id) && tiles.get(unit.hexId) && hexDistance(centre, tiles.get(unit.hexId)!) <= 1).sort((a, b) => (a.id < b.id ? -1 : 1)).slice(0, 2);
    for (const ship of near) claimed.add(ship.id);
    exempt += near.length;
  }
  return exempt;
}
/** Crescer (canon §7): 3 Alimento for +1 Disponível; 2 in a city with Celeiro (and everywhere with Agronomia). */
export function growCost(state: AlphaState, cityId: string): number {
  const pair = cityPair(state, cityId);
  if (!pair) return 3;
  return pair.meta.buildings.includes('GRANARY') ? 2 : 3;
}
export function canGrow(meta: AlphaCity, city: CityState, pace: CityPace = 'STANDARD'): boolean {
  return city.population < populationCeiling(meta.level, pace);
}

/**
 * Pieces one Recrutar activation may raise (canon §4: "peças recrutadas ≤ Capacidade", and §5: the Militar district recruits
 * without the Capacity limit). The Soldados always bound it (mobilization). Monarquia lifts the limit in the capital;
 * Meritocracia caps it at 1 (canon §16).
 */
export function recruitLimit(state: AlphaState, actor: PlayerId, cityId: string): number {
  const pair = cityPair(state, cityId);
  if (!pair) return 0;
  const effects = governmentEffects(state, actor);
  const isCapital = state.core.players.find(player => player.id === actor)?.civilization.capitalCityId === cityId;
  const unlimited = pair.city.districts.some(district => district.type === 'MILITARY') || (isCapital && effects.capitalRecruitIgnoresCapacity);
  let limit = unlimited ? 6 : Math.max(1, activationCapacity(state, cityId));
  if (effects.recruitPerActivationMax !== null) limit = Math.min(limit, effects.recruitPerActivationMax);
  return limit;
}

/** Mobilization (canon §6): a land piece takes one Soldado, or a Disponível when no Soldado is assigned. */
export function mobilizationBlock(state: AlphaState, cityId: string, kind: string): string | null {
  const pair = cityPair(state, cityId);
  if (!pair) return 'Escolha uma cidade própria.';
  const entry = state.rules.units[kind as never] as { domain: string; strength: number } | undefined;
  if (!entry || entry.domain !== 'LAND' || entry.strength === 0) return null;
  if (pair.city.workers.soldiers + pair.city.workers.unassigned < 1) return 'Sem Soldado nem habitante Disponível para mobilizar.';
  // I-38: mobilization never empties a city. Found by the bot playtest: a one-habitant colony recruited itself down to 0.
  if (pair.city.population <= 1) return 'A cidade precisa manter ao menos 1 habitante: não pode mobilizar o último.';
  return null;
}
export function mobilize(state: AlphaState, cityId: string, kind: string): void {
  const blocked = mobilizationBlock(state, cityId, kind);
  if (blocked) throw new Error(blocked);
  const pair = cityPair(state, cityId)!;
  const entry = state.rules.units[kind as never] as { domain: string; strength: number };
  if (entry.domain !== 'LAND' || entry.strength === 0) return;
  const workers = { ...pair.city.workers };
  if (workers.soldiers > 0) workers.soldiers -= 1; else workers.unassigned -= 1;
  replaceCity(state, cityId, { ...pair.city, population: pair.city.population - 1, workers });
}
/** Demobilization: the piece returns as one Disponível in the own city it stands in. */
export function demobilize(state: AlphaState, actor: PlayerId, unitId: string): string {
  const unit = state.units.find(candidate => candidate.id === unitId && candidate.ownerId === actor);
  if (!unit) throw new Error('Escolha uma peça própria.');
  const entry = state.rules.units[unit.kind];
  if (entry.domain !== 'LAND' || entry.strength === 0) throw new Error('Só peças militares terrestres são desmobilizadas.');
  const pair = state.cities.map(meta => cityPair(state, meta.cityId)).find(candidate => candidate && candidate.ownerId === actor && candidate.meta.status === 'OWNED' && candidate.city.hexId === unit.hexId);
  if (!pair) throw new Error('Desmobilize dentro de uma cidade própria.');
  state.units = state.units.filter(candidate => candidate.id !== unitId);
  replaceCity(state, pair.city.id, { ...pair.city, population: pair.city.population + 1, workers: { ...pair.city.workers, unassigned: pair.city.workers.unassigned + 1 } });
  return pair.city.id;
}

/**
 * The legacy `development` field is a mirror of the built level, kept only so the core's claim radius reads the canon
 * raio de reivindicação (1 for N1–2, 2 for N3–5, 3 for N6–7 through the legacy cityRadii [1,1,2,2,3]). Nothing else reads it.
 */
export function mirrorDevelopment(state: AlphaState): void {
  for (const meta of state.cities) {
    const pair = cityPair(state, meta.cityId);
    if (!pair) continue;
    const index = ['OUTPOST', 'HAMLET', 'VILLAGE', 'CITY', 'GREAT_CITY', 'METROPOLIS', 'IMPERIAL_METROPOLIS'].indexOf(meta.level);
    const development = index <= 1 ? 1 : index <= 4 ? 3 : 5;
    if (pair.city.development !== development) replaceCity(state, meta.cityId, { ...pair.city, development });
  }
}
/** Writes a city back into the core (the core keeps cities immutable). */
export function replaceCity(state: AlphaState, cityId: string, original: CityState): void {
  // I-39: a city never works more hexes than it has Produtores. Famine, mobilization or capture can remove a Produtor; the last worked hexes are released.
  const next = original.workedHexIds.length > original.workers.producers ? { ...original, workedHexIds: original.workedHexIds.slice(0, original.workers.producers) } : original;
  for (const player of state.core.players) {
    const index = player.civilization.cities.findIndex(candidate => candidate.id === cityId);
    if (index >= 0) { player.civilization = { ...player.civilization, cities: player.civilization.cities.map((candidate, i) => i === index ? next : candidate) }; return; }
  }
}

/** Sum of a pool, for messages. */
export const poolTotal = (pool: AlphaResourcePool): number => ALPHA_RESOURCE_KEYS.reduce((total, key) => total + pool[key], 0);

/**
 * Administration (canon §4): load 1 per integrated city, 2 per Ocupada; capacity 2 (base) + 1 capital + 1 per Administrativo
 * district + 1 Chancelaria (one per civilization) + government (Conselho +1, Confederação +2) + Web (Códigos +1, Urbanismo +1).
 * No city ever weighs zero. Over the capacity the civilization is in Sobre-extensão.
 */
export interface Administration { load: number; capacity: number; overextended: boolean; parts: { base: number; capital: number; districts: number; chancellery: number; government: number; web: number } }
export function administration(state: AlphaState, actor: PlayerId): Administration {
  const owner = state.core.players.find(player => player.id === actor);
  const progress = state.players.find(player => player.playerId === actor);
  if (!owner || !progress) return { load: 0, capacity: 0, overextended: false, parts: { base: 0, capital: 0, districts: 0, chancellery: 0, government: 0, web: 0 } };
  const metas = state.cities.filter(meta => meta.currentOwnerId === actor);
  const load = metas.reduce((total, meta) => total + (meta.status === 'OCCUPIED' || state.occupations.some(occupation => occupation.cityId === meta.cityId) ? 2 : 1), 0);
  const parts = {
    base: state.rules.balance.administrationBase,
    capital: owner.civilization.capitalCityId && metas.some(meta => meta.cityId === owner.civilization.capitalCityId) ? 1 : 0,
    districts: metas.filter(meta => meta.districts.includes('ADMINISTRATIVE')).length,
    chancellery: metas.some(meta => meta.buildings.includes('CHANCELLERY')) ? 1 : 0,
    government: governmentEffects(state, actor).administrationBonus,
    web: (hasUnlock(state, actor, 'rule:admin-capacity-plus-1') ? progress.research.filter(id => ['web-codes', 'web-urbanism'].includes(id)).length : 0),
  };
  const capacity = parts.base + parts.capital + parts.districts + parts.chancellery + parts.government + parts.web;
  return { load, capacity, overextended: load > capacity, parts };
}
/** Writes the canon administration into the core civilization record every consumer already reads. */
export function refreshAlphaAdministration(state: AlphaState): void {
  for (const owner of state.core.players) {
    const result = administration(state, owner.id);
    owner.civilization = { ...owner.civilization, administrativeLoad: result.load, administrativeCapacity: result.capacity, administrationStatus: result.overextended ? 'OVEREXTENDED' : 'WITHIN_CAPACITY' };
  }
}

/** Governar (canon §4, §10): +1 Ânimo per level paid, 1 Cultura or 2 Riqueza each, up to the activation's Capacity, never above Próspera (6). */
export function governCost(state: AlphaState, actor: PlayerId): AlphaResourcePool {
  const progress = state.players.find(player => player.playerId === actor);
  return progress && progress.resources.culture >= 1 ? { ...emptyAlphaResourcePool(), culture: 1 } : { ...emptyAlphaResourcePool(), wealth: 2 };
}
export function governBlock(state: AlphaState, actor: PlayerId, cityId: string): string | null {
  const pair = cityPair(state, cityId);
  if (!pair || pair.ownerId !== actor) return 'Escolha uma cidade própria.';
  if (pair.meta.mood >= 6 && pair.meta.fortification.state === 'INTACT') return 'A cidade já está Próspera e íntegra: Governar não tem o que recuperar.';
  if (pair.meta.mood < 6 && governmentEffects(state, actor).governFreeLevels === 0 && !alphaCanAfford(state, actor, governCost(state, actor))) return 'Governar custa 1 Cultura ou 2 Riqueza por nível de Ânimo.';
  return null;
}
/**
 * Recuperação emergencial de Revolta (E-1). A city in Revolta cannot produce, and Governar needs Cultura or Riqueza that only producing brings, so a city
 * that fell during a famine could not climb back. Once per episode of Revolta, one Ordem and one activation, no Cultura or Riqueza, take the city to Ânimo 4
 * (Estável): the target survives a hungry round with unpaid pieces (-2) and still leaves the city Abalada, with the Capacity to Produzir the next round.
 * It does not produce, feed or repair anything. The episode ends when the city closes a LATER round Estável or better (`rearmRevoltEmergency`), so leaving
 * Revolta for an instant and falling back never gives a second benefit.
 */
export const REVOLT_EMERGENCY_MOOD = 4;
export function emergencyGovernBlock(state: AlphaState, actor: PlayerId, cityId: string): string | null {
  const pair = cityPair(state, cityId);
  if (!pair || pair.ownerId !== actor) return 'Escolha uma cidade própria.';
  if (moodBand(pair.meta.mood) !== 'REVOLT') return 'A recuperação emergencial só existe para uma cidade em Revolta.';
  if (pair.meta.revoltEmergencyRound !== null) return 'A recuperação emergencial já foi usada neste episódio de Revolta: Governe pagando Cultura ou Riqueza.';
  return null;
}
export function emergencyGovern(state: AlphaState, actor: PlayerId, cityId: string): number {
  const blocked = emergencyGovernBlock(state, actor, cityId);
  if (blocked) throw new Error(blocked);
  const pair = cityPair(state, cityId)!;
  const gained = REVOLT_EMERGENCY_MOOD - pair.meta.mood;
  pair.meta.mood = REVOLT_EMERGENCY_MOOD;
  pair.meta.revoltEmergencyRound = state.core.round;
  return gained;
}
/** End-of-round: a city that closes a round after the one it used the emergency in with Ânimo Estável or better has left the episode; the recovery is available again. */
export function rearmRevoltEmergency(state: AlphaState): void {
  for (const meta of state.cities) if (meta.revoltEmergencyRound !== null && state.core.round > meta.revoltEmergencyRound && meta.mood >= REVOLT_EMERGENCY_MOOD) meta.revoltEmergencyRound = null;
}

/** Applies Governar: pays level by level while there is Capacity and Ânimo to recover; repairs one fortification step (1 Pedra, free with Fortificação). Returns what happened. */
export function governCity(state: AlphaState, actor: PlayerId, cityId: string): { moodGained: number; repaired: boolean } {
  const blocked = governBlock(state, actor, cityId);
  if (blocked) throw new Error(blocked);
  const pair = cityPair(state, cityId)!;
  const reach = Math.max(1, operatingCapacity(state, cityId));
  const effects = governmentEffects(state, actor);
  let moodGained = 0;
  while (moodGained < reach && pair.meta.mood < 6) {
    // Conselho: the first level of each Governar is free (canon §16 "Governar custa 1 a menos").
    const free = moodGained < effects.governFreeLevels;
    if (!free && !alphaCanAfford(state, actor, governCost(state, actor))) break;
    if (!free) alphaPay(state, actor, governCost(state, actor));
    pair.meta.mood += 1; moodGained += 1;
  }
  if (effects.governKnowledge > 0) alphaGain(state, actor, { knowledge: effects.governKnowledge }, { category: 'other' });
  let repaired = false;
  if (pair.meta.fortification.state !== 'INTACT') {
    const free = hasUnlock(state, actor, 'rule:free-repair');
    const cost = { ...emptyAlphaResourcePool(), stone: free ? 0 : 1 };
    if (alphaCanAfford(state, actor, cost)) {
      alphaPay(state, actor, cost);
      pair.meta.fortification = { ...pair.meta.fortification, state: pair.meta.fortification.state === 'BREACHED' ? 'DAMAGED' : 'INTACT' };
      repaired = true;
    }
  }
  return { moodGained, repaired };
}
