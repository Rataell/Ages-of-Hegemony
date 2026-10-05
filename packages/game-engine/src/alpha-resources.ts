import {
  ADVANCEMENTS, ALPHA_RESOURCE_KEYS, RESOURCE_KEYS, alphaToLegacyResources, emptyAlphaResourcePool, legacyToAlphaResources,
  type AlphaResourceKey, type AlphaResourcePool, type AlphaResourceType, type AlphaState, type PlayerId, type ResourcePool, type RoundLedger,
} from '@aoh/game-domain';
import { sum } from './arithmetic.js';
import { leaderStorageBonus } from './alpha-leaders.js';
import { governmentEffects } from './alpha-government.js';
import type { ResourcePayment } from './resources.js';

/**
 * Converts a cost to the seven-resource shape. A generic legacy `materials` cost never invents a metal requirement:
 * it is split evenly, or, when the payer's pool is known, taken from wood, then stone, then metal, with any shortfall
 * left on wood so the wealth-substitution rule prices it.
 */
export function alphaCost(cost: ResourcePool | AlphaResourcePool, available?: AlphaResourcePool): AlphaResourcePool {
  if (!('materials' in cost)) return { ...cost };
  let wood = Math.ceil(cost.materials / 2), stone = Math.floor(cost.materials / 2), metal = 0;
  if (available) {
    wood = Math.min(cost.materials, available.wood);
    stone = Math.min(cost.materials - wood, available.stone);
    metal = Math.min(cost.materials - wood - stone, available.metal);
    wood += cost.materials - wood - stone - metal;
  }
  return { food: cost.food, wood, stone, metal, wealth: cost.wealth, knowledge: cost.knowledge, influence: cost.influence, culture: 0 };
}

const zeroPool = (): ResourcePool => ({ food: 0, materials: 0, wealth: 0, knowledge: 0, influence: 0 });
const toLegacy = (pool: Partial<AlphaResourcePool>): ResourcePool => ({
  food: pool.food ?? 0, materials: (pool.wood ?? 0) + (pool.stone ?? 0) + (pool.metal ?? 0), wealth: pool.wealth ?? 0, knowledge: pool.knowledge ?? 0, influence: pool.influence ?? 0,
});
export type LedgerGain = 'production' | 'mining' | 'trade' | 'institutions' | 'other';
export type LedgerLoss = 'losses' | 'expenses' | 'upkeepPaid' | 'discarded';

/**
 * The player's ledger for the current round. It is created before the first mutation of the round (so its opening balance is
 * the balance before that change) and every gain, spend, loss, upkeep payment and storage discard is added to it. The round
 * report is built from it, so the report equation holds by construction.
 */
export function ledgerOf(state: AlphaState, actor: PlayerId): RoundLedger {
  const round = state.core.round;
  const existing = state.roundLedgers.find(entry => entry.playerId === actor && entry.round === round);
  if (existing) return existing;
  const pool = state.players.find(player => player.playerId === actor)?.resources ?? emptyAlphaResourcePool();
  const ledger: RoundLedger = {
    playerId: actor, round, opening: toLegacy(pool), production: zeroPool(), mining: zeroPool(), trade: zeroPool(), institutions: zeroPool(), other: zeroPool(),
    losses: zeroPool(), expenses: zeroPool(), upkeepRequired: zeroPool(), upkeepPaid: zeroPool(), discarded: zeroPool(),
    cities: (state.core.players.find(player => player.id === actor)?.civilization.cities ?? []).map(city => ({ cityId: city.id, population: city.population, stability: city.stability })),
  };
  state.roundLedgers.push(ledger);
  return ledger;
}
function addLedger(target: ResourcePool, amount: ResourcePool): void { for (const key of RESOURCE_KEYS) target[key] += amount[key]; }

export function syncLegacyResources(state: AlphaState, actor: PlayerId): void {
  const strategic = state.players.find(player => player.playerId === actor);
  const legacy = state.core.players.find(player => player.id === actor);
  if (strategic && legacy) legacy.resources = alphaToLegacyResources(strategic.resources);
}

/** Where a cost is paid: 'BUILD' is Construir (Mercado Regional lets Riqueza cover 60% there, canon §12). */
export type PaymentScope = 'BUILD';
const buildCoverPercent = (state: AlphaState, actor: PlayerId): number => state.players.find(player => player.playerId === actor)?.research.some(id => ADVANCEMENTS.find(node => node.id === id)?.unlocks.includes('rule:wealth-covers-60-build')) ? 60 : 0;
export function alphaCanAfford(state: AlphaState, actor: PlayerId, rawCost: ResourcePool | AlphaResourcePool, scope?: PaymentScope): boolean {
  const pool = state.players.find(player => player.playerId === actor)?.resources;
  if (!pool) return false;
  const cost = alphaCost(rawCost, pool);
  if (pool.food < cost.food || pool.knowledge < cost.knowledge || pool.influence < cost.influence) return false;
  const shortages = (['wood', 'stone', 'metal'] as const).reduce((total, key) => total + Math.max(0, cost[key] - pool[key]), 0);
  const materialCost = cost.wood + cost.stone + cost.metal;
  if (shortages > Math.floor(materialCost * Math.max(state.rules.balance.wealthMaterialCostPercentMax, governmentEffects(state, actor).wealthCoverPercent, scope === 'BUILD' ? buildCoverPercent(state, actor) : 0) / 100)) return false;
  return pool.wealth >= cost.wealth + shortages * state.rules.balance.wealthConversionRate;
}

export function alphaPay(state: AlphaState, actor: PlayerId, rawCost: ResourcePool | AlphaResourcePool, scope?: PaymentScope): void {
  const player = state.players.find(candidate => candidate.playerId === actor);
  if (!player || !alphaCanAfford(state, actor, rawCost, scope)) throw new Error('Recursos insuficientes para esta ação.');
  const ledger = ledgerOf(state, actor);
  const before = toLegacy(player.resources);
  const cost = alphaCost(rawCost, player.resources);
  player.resources.food -= cost.food;
  player.resources.knowledge -= cost.knowledge;
  player.resources.influence -= cost.influence;
  let wealth = cost.wealth;
  for (const key of ['wood', 'stone', 'metal'] as const) {
    const paid = Math.min(player.resources[key], cost[key]);
    player.resources[key] -= paid;
    wealth += (cost[key] - paid) * state.rules.balance.wealthConversionRate;
  }
  player.resources.wealth -= wealth;
  const after = toLegacy(player.resources);
  addLedger(ledger.expenses, { food: before.food - after.food, materials: before.materials - after.materials, wealth: before.wealth - after.wealth, knowledge: before.knowledge - after.knowledge, influence: before.influence - after.influence });
  syncLegacyResources(state, actor);
}

/** Lets shared city/territory rules charge Alpha's authoritative seven-resource pool directly. */
export function alphaResourcePayment(state: AlphaState, scope?: PaymentScope): ResourcePayment {
  return (corePlayer, cost) => {
    if (!alphaCanAfford(state, corePlayer.id, cost, scope)) return false;
    alphaPay(state, corePlayer.id, cost, scope);
    const strategic = state.players.find(player => player.playerId === corePlayer.id)!;
    corePlayer.resources = alphaToLegacyResources(strategic.resources);
    return true;
  };
}

/**
 * Adds resources. Storage caps apply immediately (overflow is discarded and recorded as an event) unless the caller is a
 * round-maintenance step that defers enforcement to one recorded pass at the end of maintenance.
 */
export function alphaGain(state: AlphaState, actor: PlayerId, gain: Partial<AlphaResourcePool>, options: { enforceStorage?: boolean; category?: LedgerGain } = {}): void {
  const player = state.players.find(candidate => candidate.playerId === actor);
  if (!player) throw new Error('Civilização desconhecida.');
  addLedger(ledgerOf(state, actor)[options.category ?? 'other'], toLegacy(gain));
  for (const key of ALPHA_RESOURCE_KEYS) player.resources[key] = sum([player.resources[key], gain[key] ?? 0]);
  syncLegacyResources(state, actor);
  if (options.enforceStorage ?? true) enforceStorageRecorded(state, actor);
}

/** Resource key → the balance's resource type. */
const TYPE_OF: Record<AlphaResourceKey, AlphaResourceType> = { food: 'FOOD', wood: 'WOOD', stone: 'STONE', metal: 'METAL', wealth: 'WEALTH', knowledge: 'KNOWLEDGE', influence: 'INFLUENCE', culture: 'CULTURE' };

/**
 * Storage limit per resource for one civilization (canon §9): base 15/10, +5 per infrastructure (one of each counts, the
 * Armazém raises Madeira and Pedra), +3 on everything from the first Metrópole, the leader's passive, never above the hard cap 30/20.
 */
export function alphaStorageCapacity(state: AlphaState, actor: PlayerId): Record<AlphaResourceKey, number> {
  const cities = state.cities.filter(city => city.currentOwnerId === actor);
  const { base, hardCap, metropolisBonus } = state.rules.balance.limits;
  const capacity = Object.fromEntries(ALPHA_RESOURCE_KEYS.map(key => [key, base[TYPE_OF[key]]])) as Record<AlphaResourceKey, number>;
  const counted = new Set<string>();
  for (const city of cities) for (const building of city.buildings) {
    if (counted.has(building)) continue;
    const bonus = state.rules.balance.storagePerBuilding[building];
    if (!bonus) continue;
    counted.add(building);
    const key = ALPHA_RESOURCE_KEYS.find(candidate => TYPE_OF[candidate] === bonus.resource)!;
    capacity[key] += bonus.amount;
    if (building === 'WAREHOUSE') capacity.stone += bonus.amount;
  }
  if (cities.some(city => ['METROPOLIS', 'IMPERIAL_METROPOLIS'].includes(city.level))) for (const key of ALPHA_RESOURCE_KEYS) capacity[key] += metropolisBonus;
  for (const key of ALPHA_RESOURCE_KEYS) capacity[key] = Math.min(hardCap[TYPE_OF[key]], capacity[key] + leaderStorageBonus(state, actor, key));
  return capacity;
}

export function enforceStorage(state: AlphaState, actor: PlayerId): AlphaResourcePool {
  const player = state.players.find(candidate => candidate.playerId === actor);
  if (!player) return emptyAlphaResourcePool();
  const capacity = alphaStorageCapacity(state, actor);
  const discarded = emptyAlphaResourcePool();
  for (const key of ALPHA_RESOURCE_KEYS) {
    discarded[key] = Math.max(0, player.resources[key] - capacity[key]);
    player.resources[key] -= discarded[key];
  }
  return discarded;
}

/** Discarded amounts in the legacy five-resource vocabulary used by round reports (materials = wood + stone + metal). */
export function discardedToLegacy(discarded: AlphaResourcePool): ResourcePool {
  return { food: discarded.food, materials: discarded.wood + discarded.stone + discarded.metal, wealth: discarded.wealth, knowledge: discarded.knowledge, influence: discarded.influence };
}

/** Applies storage caps, keeps the legacy view in sync and records any discard in the event log. */
export function enforceStorageRecorded(state: AlphaState, actor: PlayerId): AlphaResourcePool {
  const discarded = enforceStorage(state, actor);
  const lost = ALPHA_RESOURCE_KEYS.filter(key => discarded[key] > 0);
  if (lost.length === 0) return discarded;
  addLedger(ledgerOf(state, actor).discarded, discardedToLegacy(discarded));
  syncLegacyResources(state, actor);
  const labels: Record<string, string> = { food: 'Alimentos', wood: 'Madeira', stone: 'Pedra', metal: 'Metal', wealth: 'Riqueza', knowledge: 'Conhecimento', influence: 'Influência' };
  state.events.push({
    id: `event-${state.events.length + 1}`, round: state.core.round, type: 'STORAGE_DISCARD', audience: [actor],
    message: `Armazenamento cheio; descartado: ${lost.map(key => `${discarded[key]} ${labels[key]}`).join(', ')}.`,
  });
  return discarded;
}

export interface MetalSite { cityId: string; hexId: string }

/**
 * Metal needs three things together: a Producer assigned to work the hex, a metal deposit on it and a Mine on it.
 * A generic producer, a deposit without a Mine or a Mine without a deposit yields no metal. Occupied cities extract nothing
 * until integrated.
 */
export function metalSites(state: AlphaState, actor: PlayerId): MetalSite[] {
  const owner = state.core.players.find(player => player.id === actor);
  if (!owner) return [];
  const sites: MetalSite[] = [];
  for (const city of owner.civilization.cities) {
    if (state.occupations.some(occupation => occupation.cityId === city.id)) continue;
    let producers = city.workers.producers;
    for (const hexId of city.workedHexIds) {
      const tile = state.core.map.find(candidate => candidate.id === hexId);
      if (producers <= 0 || !tile || tile.ownerId !== actor || tile.controllerCityId !== city.id) continue;
      if (tile.features.includes('METAL') && tile.improvement === 'MINE') { sites.push({ cityId: city.id, hexId }); producers--; }
    }
  }
  return sites;
}

export function initializeAlphaResources(state: AlphaState): void {
  for (const player of state.players) {
    if (ALPHA_RESOURCE_KEYS.every(key => player.resources[key] === 0)) {
      const core = state.core.players.find(candidate => candidate.id === player.playerId);
      if (core) player.resources = legacyToAlphaResources(core.resources);
    }
    syncLegacyResources(state, player.playerId);
  }
}

const legacyPool = (pool: Partial<ResourcePool>): ResourcePool => ({ food: 0, materials: 0, wealth: 0, knowledge: 0, influence: 0, ...pool });

/** Gain expressed in the legacy five-resource vocabulary that authored content still uses (for example `materials`). */
export function alphaGainLegacy(state: AlphaState, actor: PlayerId, gain: Partial<ResourcePool>, options: { enforceStorage?: boolean; category?: LedgerGain } = {}): void {
  alphaGain(state, actor, legacyToAlphaResources(legacyPool(gain)), options);
}

/** Pays as much of a legacy-shaped charge as the player holds and returns what was paid (upkeep never fails outright). */
export function alphaDrain(state: AlphaState, actor: PlayerId, charge: ResourcePool, category: 'expenses' | 'upkeepPaid' = 'expenses'): ResourcePool {
  const player = state.players.find(candidate => candidate.playerId === actor);
  if (!player) throw new Error('Civilização desconhecida.');
  const ledger = ledgerOf(state, actor);
  const paid: ResourcePool = { food: 0, materials: 0, wealth: 0, knowledge: 0, influence: 0 };
  for (const key of ['food', 'wealth', 'knowledge', 'influence'] as const) {
    paid[key] = Math.min(player.resources[key], charge[key]);
    player.resources[key] -= paid[key];
  }
  let materials = charge.materials;
  for (const key of ['wood', 'stone', 'metal'] as const) {
    const taken = Math.min(player.resources[key], materials);
    player.resources[key] -= taken;
    materials -= taken;
    paid.materials += taken;
  }
  addLedger(ledger[category], paid);
  syncLegacyResources(state, actor);
  return paid;
}

/** Involuntary loss (for example a world event): takes what is there, never below zero, and records it as a loss. */
export function alphaLose(state: AlphaState, actor: PlayerId, loss: Partial<AlphaResourcePool>): void {
  const player = state.players.find(candidate => candidate.playerId === actor);
  if (!player) throw new Error('Civilização desconhecida.');
  const ledger = ledgerOf(state, actor);
  const taken: Partial<AlphaResourcePool> = {};
  for (const key of ALPHA_RESOURCE_KEYS) {
    const amount = Math.min(player.resources[key], loss[key] ?? 0);
    player.resources[key] -= amount;
    taken[key] = amount;
  }
  addLedger(ledger.losses, toLegacy(taken));
  syncLegacyResources(state, actor);
}

/** A legacy-shaped cost plus metal, resolved against the payer's pool so wood and stone are spent before metal. */
export function alphaCostWithMetal(state: AlphaState, actor: PlayerId, cost: ResourcePool, metal: number): AlphaResourcePool {
  const pool = state.players.find(candidate => candidate.playerId === actor)?.resources ?? emptyAlphaResourcePool();
  const base = alphaCost(cost, pool);
  return { ...base, metal: base.metal + metal };
}
