import {
  ALPHA_RESOURCE_KEYS, effectiveCapacity, effectiveLevel, elevateRequirement, emptyAlphaResourcePool, ladderStep, nextLevel, populationCeiling,
  type AlphaCity, type AlphaResourcePool, type AlphaState, type CityLevel, type CityState, type PlayerId,
} from '@aoh/game-domain';
import { tileYieldBreakdown } from './economy.js';
import { alphaCanAfford, alphaPay } from './alpha-resources.js';
import { hasUnlock } from './alpha-institutions.js';

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
export function cityLevels(meta: AlphaCity, city: CityState): { built: CityLevel; effective: CityLevel; capacity: number; ceiling: number; degraded: boolean } {
  const effective = effectiveLevel(meta.level, city.population);
  return { built: meta.level, effective, capacity: effectiveCapacity(meta.level, city.population), ceiling: populationCeiling(meta.level), degraded: effective !== meta.level };
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
  const base = cityLevels(pair.meta, pair.city).capacity;
  if (band === 'SHAKEN') return Math.max(1, base - 1);
  if (band === 'PROSPEROUS' && pair.meta.urbanActionsUsed === 0) return base + 1;
  return base;
}
/** Activations a city may take this round: two when Estável or Próspera, one when Abalada, none in Revolta except Governar. */
export const activationsAllowed = (meta: AlphaCity): number => moodBand(meta.mood) === 'REVOLT' ? 1 : moodBand(meta.mood) === 'SHAKEN' ? 1 : 2;

/** Buildings that let the third and later pairs of a role yield (canon §6). */
const ROLE_BUILDING: Record<'artisans' | 'merchants' | 'scholars', string> = { artisans: 'WORKSHOP', merchants: 'MARKET', scholars: 'LIBRARY' };
const pairs = (count: number, building: string, meta: AlphaCity): number => {
  const all = Math.floor(count / 2);
  return meta.buildings.includes(building as never) ? all : Math.min(all, 2);
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
  const worked = city.workedHexIds.slice(0, Math.min(capacity, city.workers.producers)).map(id => state.core.map.find(tile => tile.id === id)).filter(tile => tile !== undefined);
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
  const idleProducers = Math.max(0, city.workers.producers - worked.length);
  output.food += Math.floor(idleProducers / 2);
  output.wood += pairs(city.workers.artisans, ROLE_BUILDING.artisans, meta);
  output.wealth += pairs(city.workers.merchants, ROLE_BUILDING.merchants, meta);
  output.knowledge += pairs(city.workers.scholars, ROLE_BUILDING.scholars, meta);
  for (const district of meta.districts) {
    if (district === 'AGRARIAN') output.food += 2;
    else if (district === 'COMMERCIAL') output.wealth += 1;
    else if (district === 'ACADEMIC') output.knowledge += 1;
    else if (district === 'INDUSTRIAL') { output.wood += 1; output.stone += 1; }
    else if (district === 'CULTURAL') output.culture += 1;
    else if (district === 'MARITIME') output.food += 1;
  }
  if (meta.buildings.includes('TEMPLE')) output.culture += 1;
  if (worked.length < city.workedHexIds.length) notes.push(`Capacidade ${capacity}: ${city.workedHexIds.length - worked.length} hex(es) trabalhado(s) ficam fora desta ativação.`);
  return { output, metal, hexes: tiles.map(tile => tile.id), capacity, notes };
}

/** Why the city cannot Elevar now, or null (canon §4: population, cost, Web advances, Era). */
export function elevateBlock(state: AlphaState, actor: PlayerId, cityId: string): string | null {
  const pair = cityPair(state, cityId);
  if (!pair || pair.ownerId !== actor) return 'Escolha uma cidade própria.';
  const next = nextLevel(pair.meta.level);
  if (!next) return 'A cidade já é uma Metrópole Imperial.';
  const requirement = elevateRequirement(next)!;
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
  const bonus = hasUnlock(state, pair.ownerId, 'rule:slots-plus-1-village-up') && ladderStep(pair.meta.level).minPopulation >= 6 ? 1 : 0;
  return ladderStep(pair.meta.level).slots + bonus;
}

/** Sustenance (canon §7): 1 Alimento per 2 inhabitants per city, rounded up. */
export const citySustenance = (population: number): number => Math.ceil(population / 2);
/** Military upkeep (canon §7, §11): 1 Alimento per 2 land pieces; 1 Riqueza per ship; civilians nothing. */
export function militaryUpkeep(state: AlphaState, actor: PlayerId): { food: number; wealth: number } {
  const own = state.units.filter(unit => unit.ownerId === actor);
  const land = own.filter(unit => state.rules.units[unit.kind].domain === 'LAND' && state.rules.units[unit.kind].strength > 0).length;
  const ships = own.filter(unit => state.rules.units[unit.kind].domain === 'SEA').length;
  return { food: Math.ceil(land / 2), wealth: ships };
}
/** Crescer (canon §7): 3 Alimento for +1 Disponível; 2 in a city with Celeiro (and everywhere with Agronomia). */
export function growCost(state: AlphaState, cityId: string): number {
  const pair = cityPair(state, cityId);
  if (!pair) return 3;
  return pair.meta.buildings.includes('GRANARY') ? 2 : 3;
}
export function canGrow(meta: AlphaCity, city: CityState): boolean {
  return city.population < populationCeiling(meta.level);
}

/** Mobilization (canon §6): a land piece takes one Soldado, or a Disponível when no Soldado is assigned. */
export function mobilizationBlock(state: AlphaState, cityId: string, kind: string): string | null {
  const pair = cityPair(state, cityId);
  if (!pair) return 'Escolha uma cidade própria.';
  const entry = state.rules.units[kind as never] as { domain: string; strength: number } | undefined;
  if (!entry || entry.domain !== 'LAND' || entry.strength === 0) return null;
  if (pair.city.workers.soldiers + pair.city.workers.unassigned < 1) return 'Sem Soldado nem habitante Disponível para mobilizar.';
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

/** Writes a city back into the core (the core keeps cities immutable). */
export function replaceCity(state: AlphaState, cityId: string, next: CityState): void {
  for (const player of state.core.players) {
    const index = player.civilization.cities.findIndex(candidate => candidate.id === cityId);
    if (index >= 0) { player.civilization = { ...player.civilization, cities: player.civilization.cities.map((candidate, i) => i === index ? next : candidate) }; return; }
  }
}

/** Sum of a pool, for messages. */
export const poolTotal = (pool: AlphaResourcePool): number => ALPHA_RESOURCE_KEYS.reduce((total, key) => total + pool[key], 0);
