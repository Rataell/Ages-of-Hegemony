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

/**
 * Governar (canon §4, §10): +1 Ânimo per level paid, 1 Cultura or 2 Riqueza each (Cultura first, Riqueza when Cultura runs out), up to the
 * activation's Capacity, never above Próspera (6). Everything the client shows and the engine charges comes from `governQuote` below.
 */
export const GOVERN_MOOD_MAX = 6;
const GOVERN_WEALTH_PER_LEVEL = 2;

/** Cultura/Riqueza the first `levels` levels cost over `pool`, with the Conselho's free levels: Cultura while there is any, then 2 Riqueza per level. */
function governSchedule(freeLevels: number, culture: number, levels: number): { culture: number; wealth: number } {
  let remaining = culture, paidCulture = 0, wealth = 0;
  for (let level = 0; level < levels; level++) {
    if (level < freeLevels) continue;
    if (remaining >= 1) { remaining -= 1; paidCulture += 1; } else wealth += GOVERN_WEALTH_PER_LEVEL;
  }
  return { culture: paidCulture, wealth };
}
/** The state with the actor's resources replaced by `pool` (shallow: only the affordability checks read it). */
const withPool = (state: AlphaState, actor: PlayerId, pool: AlphaResourcePool): AlphaState => ({ ...state, players: state.players.map(player => player.playerId === actor ? { ...player, resources: pool } : player) });
/** The Pedra (and the Riqueza that stands in for a missing Pedra) a fortification repair would take from `pool`, or null when no repair applies or it cannot be paid. */
function repairCostFor(state: AlphaState, actor: PlayerId, fortification: string, pool: AlphaResourcePool): { stone: number; wealth: number } | null {
  if (fortification === 'INTACT') return null;
  if (hasUnlock(state, actor, 'rule:free-repair')) return { stone: 0, wealth: 0 };
  const cost = { ...emptyAlphaResourcePool(), stone: 1 };
  if (!alphaCanAfford(withPool(state, actor, pool), actor, cost)) return null;
  const paid = Math.min(pool.stone, 1);
  return { stone: paid, wealth: (1 - paid) * state.rules.balance.wealthConversionRate };
}

/** Total cost of Governar for `levels` levels, paid in order from the actor's stock; with a `cityId`, plus the Pedra of the fortification repair it would also do. */
export function governCost(state: AlphaState, actor: PlayerId, levels = 1, cityId?: string): AlphaResourcePool {
  const progress = state.players.find(player => player.playerId === actor);
  const pool = progress?.resources ?? emptyAlphaResourcePool();
  const scheduled = governSchedule(governmentEffects(state, actor).governFreeLevels, pool.culture, Math.max(0, levels));
  const cost = { ...emptyAlphaResourcePool(), culture: scheduled.culture, wealth: scheduled.wealth };
  const pair = cityId === undefined ? null : cityPair(state, cityId);
  if (pair) {
    const after = { ...pool, culture: Math.max(0, pool.culture - scheduled.culture), wealth: Math.max(0, pool.wealth - scheduled.wealth) };
    const repair = repairCostFor(state, actor, pair.meta.fortification.state, after);
    if (repair) { cost.stone += repair.stone; cost.wealth += repair.wealth; }
  }
  return cost;
}

export type GovernBlockerCode = 'NOT_OWN_CITY' | 'MOOD_FULL' | 'NO_RESOURCE' | 'REPAIR_NO_STONE' | 'LEVELS_EXCEED';
export interface GovernBlocker { code: GovernBlockerCode; message: string; missing?: { resource: 'culture' | 'wealth' | 'stone'; amount: number } }
export interface GovernLevelQuote { levels: number; moodAfter: number; costCulture: number; costWealth: number; stoneRepair?: number }
export interface GovernQuote {
  mood: number;
  /** Levels the activation may recover now: min(Ânimo room, Capacidade, levels the stock can pay). */
  maxLevels: number;
  /** Levels Ânimo leaves room for and levels the Capacidade allows (the two non-resource limits). */
  moodRoom: number; capacityLevels: number;
  limitedBy: 'MOOD' | 'CAPACITY' | 'RESOURCES';
  /** One entry per choosable number of levels (1..maxLevels): the Ânimo after, the total Cultura and Riqueza paid, and the Pedra when the fortification repair happens too. */
  levels: GovernLevelQuote[];
  /** Ânimo already Próspera: Governar only repairs the fortification. */
  repairOnly: boolean;
  blockers: GovernBlocker[];
}
const RES_PT: Record<'culture' | 'wealth' | 'stone', string> = { culture: 'Cultura', wealth: 'Riqueza', stone: 'Pedra' };
/** "1 Cultura, 2 Riqueza, 1 Pedra" for the non-zero parts of a Governar cost; "nada" when free. */
export const governCostText = (cost: Pick<AlphaResourcePool, 'culture' | 'wealth' | 'stone'>): string => (['culture', 'wealth', 'stone'] as const).filter(key => cost[key] > 0).map(key => `${cost[key]} ${RES_PT[key]}`).join(' + ') || 'nada';

/**
 * The single reading of what Governar can do in a city right now. The action, the planning gate and the projection all use it, so the number of levels, the
 * cost shown and the cost charged cannot drift apart (D4). Pure over the state; the planner calls it on a state already carrying the earlier plans.
 */
export function governQuote(state: AlphaState, actor: PlayerId, cityId: string): GovernQuote {
  const pair = cityPair(state, cityId);
  const empty = (blocker: GovernBlocker): GovernQuote => ({ mood: pair?.meta.mood ?? 0, maxLevels: 0, moodRoom: 0, capacityLevels: 0, limitedBy: 'MOOD', levels: [], repairOnly: false, blockers: [blocker] });
  if (!pair || pair.ownerId !== actor) return empty({ code: 'NOT_OWN_CITY', message: 'Escolha uma cidade própria.' });
  const progress = state.players.find(player => player.playerId === actor)!;
  const pool = progress.resources, freeLevels = governmentEffects(state, actor).governFreeLevels;
  const mood = pair.meta.mood, moodRoom = Math.max(0, GOVERN_MOOD_MAX - mood), capacityLevels = Math.max(1, operatingCapacity(state, cityId));
  const ceiling = Math.min(moodRoom, capacityLevels);
  const levels: GovernLevelQuote[] = [];
  for (let n = 1; n <= ceiling; n++) {
    const scheduled = governSchedule(freeLevels, pool.culture, n);
    if (scheduled.wealth > pool.wealth) break;
    const repair = repairCostFor(state, actor, pair.meta.fortification.state, { ...pool, culture: pool.culture - scheduled.culture, wealth: pool.wealth - scheduled.wealth });
    levels.push({ levels: n, moodAfter: mood + n, costCulture: scheduled.culture, costWealth: scheduled.wealth + (repair?.wealth ?? 0), ...(repair ? { stoneRepair: repair.stone } : {}) });
  }
  const maxLevels = levels.length;
  const limitedBy: GovernQuote['limitedBy'] = maxLevels < ceiling ? 'RESOURCES' : moodRoom <= capacityLevels ? 'MOOD' : 'CAPACITY';
  const blockers: GovernBlocker[] = [];
  const fortification = pair.meta.fortification.state;
  const repairOnly = moodRoom === 0 && fortification !== 'INTACT';
  if (moodRoom === 0) {
    if (fortification === 'INTACT') blockers.push({ code: 'MOOD_FULL', message: 'A cidade já está Próspera e íntegra: Governar não tem o que recuperar.' });
    else if (!repairCostFor(state, actor, fortification, pool)) blockers.push({ code: 'REPAIR_NO_STONE', message: `Governar só repararia a fortificação e falta Pedra: custa 1 Pedra e você tem ${pool.stone}. Sem efeito.`, missing: { resource: 'stone', amount: Math.max(1, 1 - pool.stone) } });
  } else if (maxLevels === 0) {
    const missing = GOVERN_WEALTH_PER_LEVEL - pool.wealth;
    blockers.push({ code: 'NO_RESOURCE', message: `Governar custa 1 Cultura ou ${GOVERN_WEALTH_PER_LEVEL} Riqueza por nível de Ânimo: faltam ${missing} Riqueza (ou 1 Cultura); você tem ${pool.culture} Cultura e ${pool.wealth} Riqueza.`, missing: { resource: 'wealth', amount: missing } });
  }
  return { mood, maxLevels, moodRoom, capacityLevels, limitedBy, levels, repairOnly, blockers };
}
/** Levels one Governar may recover now (0 when it is blocked). */
export const governReach = (state: AlphaState, actor: PlayerId, cityId: string): number => governQuote(state, actor, cityId).maxLevels;

/** Why Governar cannot be done now (with `levels` when the player chose how many), or null. The messages say which resource is missing and by how much. */
export function governBlock(state: AlphaState, actor: PlayerId, cityId: string, levels?: number): string | null {
  const quote = governQuote(state, actor, cityId);
  if (quote.blockers.length) return quote.blockers[0]!.message;
  if (levels === undefined) return null;
  if (quote.repairOnly) return 'A cidade já está Próspera: Governar só repara a fortificação, sem níveis de Ânimo.';
  if (!Number.isInteger(levels) || levels < 1) return 'Escolha ao menos 1 nível de Ânimo.';
  if (levels <= quote.maxLevels) return null;
  if (levels > quote.moodRoom) return `A cidade está com Ânimo ${quote.mood}/6: só cabem ${quote.moodRoom} nível(is).`;
  if (levels > quote.capacityLevels) return `A Capacidade da cidade permite no máximo ${quote.capacityLevels} nível(is) por Governar.`;
  const pool = state.players.find(player => player.playerId === actor)!.resources;
  const cost = governCost(state, actor, levels);
  const missing = cost.wealth - pool.wealth;
  return `Governar ${levels} nível(is) custa ${governCostText(cost)}: faltam ${missing} Riqueza (você tem ${pool.culture} Cultura e ${pool.wealth} Riqueza). Máximo agora: ${quote.maxLevels}.`;
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

export interface GovernResult { levels: number; moodBefore: number; moodAfter: number; moodGained: number; repaired: boolean; paid: AlphaResourcePool }
/**
 * Applies Governar: pays level by level (`levels` when the player chose, otherwise as many as `governReach` allows) and repairs one fortification step
 * (1 Pedra, free with Fortificação). Returns what happened, with the Ânimo before and after and what was paid.
 */
export function governCity(state: AlphaState, actor: PlayerId, cityId: string, levels?: number): GovernResult {
  const blocked = governBlock(state, actor, cityId, levels);
  if (blocked) throw new Error(blocked);
  const pair = cityPair(state, cityId)!;
  const progress = state.players.find(player => player.playerId === actor)!;
  const before = { ...progress.resources };
  const moodBefore = pair.meta.mood;
  const quote = governQuote(state, actor, cityId);
  const target = quote.repairOnly ? 0 : levels ?? quote.maxLevels;
  const effects = governmentEffects(state, actor);
  let moodGained = 0;
  while (moodGained < target && pair.meta.mood < GOVERN_MOOD_MAX) {
    // Conselho: the first level of each Governar is free (canon §16 "Governar custa 1 a menos").
    const free = moodGained < effects.governFreeLevels;
    const price = { ...emptyAlphaResourcePool(), ...(progress.resources.culture >= 1 ? { culture: 1 } : { wealth: GOVERN_WEALTH_PER_LEVEL }) };
    if (!free && !alphaCanAfford(state, actor, price)) break;
    if (!free) alphaPay(state, actor, price);
    pair.meta.mood += 1; moodGained += 1;
  }
  if (levels !== undefined && moodGained < levels) throw new Error(`Governar ${levels} nível(is) não pôde ser pago por inteiro: ${moodGained} aplicado(s).`);
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
  const paid = emptyAlphaResourcePool();
  for (const key of ['culture', 'wealth', 'stone'] as const) paid[key] = Math.max(0, before[key] - progress.resources[key]);
  return { levels: moodGained, moodBefore, moodAfter: pair.meta.mood, moodGained, repaired, paid };
}
