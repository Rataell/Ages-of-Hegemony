import {
  ALPHA_RESOURCE_KEYS, alphaToLegacyResources, emptyAlphaResourcePool, legacyToAlphaResources,
  type AlphaResourcePool, type AlphaState, type PlayerId, type ResourcePool,
} from '@aoh/game-domain';
import { sum } from './arithmetic.js';

export function alphaCost(cost: ResourcePool | AlphaResourcePool): AlphaResourcePool {
  if ('materials' in cost) {
    return {
      food: cost.food,
      wood: Math.ceil(cost.materials / 2),
      stone: Math.floor(cost.materials / 2),
      metal: cost.materials >= 4 ? 1 : 0,
      wealth: cost.wealth,
      knowledge: cost.knowledge,
      influence: cost.influence,
    };
  }
  return { ...cost };
}

export function syncLegacyResources(state: AlphaState, actor: PlayerId): void {
  const strategic = state.players.find(player => player.playerId === actor);
  const legacy = state.core.players.find(player => player.id === actor);
  if (strategic && legacy) legacy.resources = alphaToLegacyResources(strategic.resources);
}

export function alphaCanAfford(state: AlphaState, actor: PlayerId, rawCost: ResourcePool | AlphaResourcePool): boolean {
  const pool = state.players.find(player => player.playerId === actor)?.resources;
  if (!pool) return false;
  const cost = alphaCost(rawCost);
  if (pool.food < cost.food || pool.knowledge < cost.knowledge || pool.influence < cost.influence) return false;
  const shortages = (['wood', 'stone', 'metal'] as const).reduce((total, key) => total + Math.max(0, cost[key] - pool[key]), 0);
  const materialCost = cost.wood + cost.stone + cost.metal;
  if (shortages > Math.floor(materialCost * state.rules.balance.wealthMaterialCostPercentMax / 100)) return false;
  return pool.wealth >= cost.wealth + shortages * state.rules.balance.wealthConversionRate;
}

export function alphaPay(state: AlphaState, actor: PlayerId, rawCost: ResourcePool | AlphaResourcePool): void {
  const player = state.players.find(candidate => candidate.playerId === actor);
  if (!player || !alphaCanAfford(state, actor, rawCost)) throw new Error('Recursos insuficientes para esta ação.');
  const cost = alphaCost(rawCost);
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
  syncLegacyResources(state, actor);
}

export function alphaGain(state: AlphaState, actor: PlayerId, gain: Partial<AlphaResourcePool>): void {
  const player = state.players.find(candidate => candidate.playerId === actor);
  if (!player) throw new Error('Civilização desconhecida.');
  for (const key of ALPHA_RESOURCE_KEYS) player.resources[key] = sum([player.resources[key], gain[key] ?? 0]);
  enforceStorage(state, actor);
  syncLegacyResources(state, actor);
}

export function alphaStorageCapacity(state: AlphaState, actor: PlayerId) {
  const cities = state.cities.filter(city => city.currentOwnerId === actor);
  const base = state.rules.balance.baseStorage;
  const capacity = {
    foodCapacity: base.foodCapacity * Math.max(1, cities.length),
    woodCapacity: base.woodCapacity * Math.max(1, cities.length),
    stoneCapacity: base.stoneCapacity * Math.max(1, cities.length),
    metalCapacity: base.metalCapacity * Math.max(1, cities.length),
    wealthCapacity: base.wealthCapacity * Math.max(1, cities.length),
  };
  for (const city of cities) for (const building of city.buildings) {
    const amount = state.rules.balance.storagePerBuilding[building];
    if (building === 'GRANARY') capacity.foodCapacity += amount;
    else if (building === 'TREASURY' || building === 'BANK') capacity.wealthCapacity += amount;
    else if (building === 'WAREHOUSE') { capacity.woodCapacity += amount; capacity.stoneCapacity += amount; capacity.metalCapacity += amount; }
  }
  return capacity;
}

export function enforceStorage(state: AlphaState, actor: PlayerId): AlphaResourcePool {
  const player = state.players.find(candidate => candidate.playerId === actor);
  if (!player) return emptyAlphaResourcePool();
  const capacity = alphaStorageCapacity(state, actor);
  const discarded = emptyAlphaResourcePool();
  const pairs = [['food', 'foodCapacity'], ['wood', 'woodCapacity'], ['stone', 'stoneCapacity'], ['metal', 'metalCapacity'], ['wealth', 'wealthCapacity']] as const;
  for (const [resource, limit] of pairs) {
    discarded[resource] = Math.max(0, player.resources[resource] - capacity[limit]);
    player.resources[resource] -= discarded[resource];
  }
  return discarded;
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

/**
 * Transitional bridge: economy code that still mutates the legacy five-resource pool leaves it ahead of or behind the
 * authoritative seven-resource pool. Because every alpha spend re-syncs the legacy view, the remaining difference is
 * exactly the unabsorbed legacy change; fold it into the seven-resource pool so no production or income is lost.
 */
export function reconcileLegacyPools(state: AlphaState): void {
  for (const player of state.players) {
    const legacy = state.core.players.find(candidate => candidate.id === player.playerId);
    if (!legacy) continue;
    const derived = alphaToLegacyResources(player.resources);
    for (const key of ['food', 'wealth', 'knowledge', 'influence'] as const) player.resources[key] = Math.max(0, player.resources[key] + legacy.resources[key] - derived[key]);
    let materials = legacy.resources.materials - derived.materials;
    if (materials > 0) { player.resources.wood += Math.ceil(materials / 2); player.resources.stone += Math.floor(materials / 2); }
    for (const key of ['wood', 'stone', 'metal'] as const) {
      if (materials >= 0) break;
      const taken = Math.min(player.resources[key], -materials);
      player.resources[key] -= taken;
      materials += taken;
    }
    syncLegacyResources(state, player.playerId);
  }
}
