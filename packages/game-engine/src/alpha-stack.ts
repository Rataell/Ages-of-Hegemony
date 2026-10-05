import {
  stackCategory, stackVerdict, type AlphaState, type AlphaUnit, type PlayerId, type StackCategory, type StackHex, type StackUsage, type StackView,
} from '@aoh/game-domain';

import { governmentEffects } from './alpha-government.js';
const CATEGORIES: readonly StackCategory[] = ['military', 'civilians', 'fleets'];
export const unitCategory = (state: AlphaState, unit: AlphaUnit): StackCategory => stackCategory(state.rules.units[unit.kind]);
const cityAt = (state: AlphaState, hexId: string) => state.core.players.flatMap(player => player.civilization.cities).find(city => city.hexId === hexId);
const researched = (state: AlphaState, owner: PlayerId, id: string) => state.players.find(player => player.playerId === owner)!.research.includes(id);

/** Command II implies Command I: the second advancement requires the first in the catalogue. */
function landLimit(state: AlphaState, owner: PlayerId): number {
  const config = state.rules.balance.stack;
  const base = researched(state, owner, config.upgrades.commandTwo) ? config.militaryCommandTwo : researched(state, owner, config.upgrades.commandOne) ? config.militaryCommandOne : config.military;
  // Autocracia (canon §16): Exército máximo +1.
  return base + governmentEffects(state, owner).armyMaxBonus;
}
/** Base garrison plus military district, fortification level and protection doctrine, capped. */
function garrisonLimit(state: AlphaState, owner: PlayerId, cityId: string): number {
  const config = state.rules.balance.stack, city = state.core.players.flatMap(player => player.civilization.cities).find(candidate => candidate.id === cityId)!;
  const level = state.cities.find(entry => entry.cityId === cityId)?.fortification.level ?? 'NONE';
  const bonus = (city.districts.some(district => district.type === 'MILITARY') ? config.cityBonus.militaryDistrict : 0)
    + config.cityBonus.fortification[level] + (researched(state, owner, config.upgrades.doctrine) ? config.cityBonus.doctrine : 0);
  return Math.min(config.cityMax, config.cityBase + bonus);
}
/** Limit for one civilization's pieces of one category on one hex. */
export function stackLimit(state: AlphaState, owner: PlayerId, hexId: string, category: StackCategory): number {
  const config = state.rules.balance.stack;
  if (category === 'civilians') return config.civilians;
  if (category === 'fleets') return researched(state, owner, config.upgrades.naval) ? config.fleetsUpgraded : config.fleets;
  const city = cityAt(state, hexId);
  return city ? garrisonLimit(state, owner, city.id) : landLimit(state, owner);
}
/** Pieces already on the hex, minus `ignore` (the ones about to move). */
export function stackUsed(state: AlphaState, owner: PlayerId, hexId: string, category: StackCategory, ignore: ReadonlySet<string> = new Set()): number {
  // Cargo rides in its fleet's slots, not in the hex's land stacks.
  return state.units.filter(unit => unit.ownerId === owner && unit.hexId === hexId && !ignore.has(unit.id) && !unit.carrierId && unitCategory(state, unit) === category).length;
}
const usage = (state: AlphaState, owner: PlayerId, hexId: string, category: StackCategory, ignore?: ReadonlySet<string>): StackUsage => ({ used: stackUsed(state, owner, hexId, category, ignore), limit: stackLimit(state, owner, hexId, category) });
export const stackHex = (state: AlphaState, owner: PlayerId, hexId: string): StackHex => ({
  hexId, city: cityAt(state, hexId) !== undefined, military: usage(state, owner, hexId, 'military'), civilians: usage(state, owner, hexId, 'civilians'), fleets: usage(state, owner, hexId, 'fleets'),
});

/** How many of `movers` fit on the hex, per category, taking pieces in id order. */
export function stackRoom(state: AlphaState, owner: PlayerId, movers: readonly AlphaUnit[], hexId: string): { fits: AlphaUnit[]; stays: AlphaUnit[] } {
  const ignore = new Set(movers.map(unit => unit.id)), fits: AlphaUnit[] = [], stays: AlphaUnit[] = [];
  for (const category of CATEGORIES) {
    const room = Math.max(0, stackLimit(state, owner, hexId, category) - stackUsed(state, owner, hexId, category, ignore));
    const group = movers.filter(unit => unit.ownerId === owner && unitCategory(state, unit) === category).sort((a, b) => (a.id < b.id ? -1 : 1));
    fits.push(...group.slice(0, room)); stays.push(...group.slice(room));
  }
  return { fits, stays };
}

/**
 * Why `movers` cannot end on `hexId`, or null. `pending` are pieces of the same civilization already ordered to end there this round.
 * Existing stacks above a limit (starting forces, a lowered limit) are never touched; only new arrivals are refused.
 */
export function stackBlock(state: AlphaState, owner: PlayerId, movers: readonly AlphaUnit[], hexId: string, pending: readonly AlphaUnit[] = []): string | null {
  const ignore = new Set(movers.map(unit => unit.id));
  for (const category of CATEGORIES) {
    const arriving = [...movers, ...pending.filter(unit => !ignore.has(unit.id))].filter(unit => unitCategory(state, unit) === category).length;
    const verdict = stackVerdict(category, cityAt(state, hexId) !== undefined, usage(state, owner, hexId, category, ignore), arriving, hexId);
    if (verdict) return verdict;
  }
  return null;
}
/** Own pieces other orders of this player already send to `hexId`. */
export function pendingArrivals(state: AlphaState, owner: PlayerId, hexId: string, exceptOrderId: string): AlphaUnit[] {
  const orders = state.players.find(player => player.playerId === owner)!.orders;
  const ids = orders.flatMap(order => (order.type === 'MOVE' && order.id !== exceptOrderId && order.path.at(-1) === hexId ? order.unitIds : []));
  return state.units.filter(unit => unit.ownerId === owner && ids.includes(unit.id));
}
/** Projection data: every hex where the player has pieces, a city or an incoming order, with queued arrivals counted as used. */
export function stackView(state: AlphaState, actor: PlayerId): StackView {
  const config = state.rules.balance.stack, ids = new Set<string>();
  for (const unit of state.units) if (unit.ownerId === actor) ids.add(unit.hexId);
  for (const city of state.core.players.find(player => player.id === actor)!.civilization.cities) ids.add(city.hexId);
  const orders = state.players.find(player => player.playerId === actor)!.orders;
  for (const order of orders) if (order.type === 'MOVE') ids.add(order.path.at(-1)!);
  const hexes: Record<string, StackHex> = {};
  for (const id of [...ids].sort()) {
    const base = stackHex(state, actor, id);
    for (const category of CATEGORIES) {
      const queued = orders.flatMap(order => (order.type === 'MOVE' && order.path.at(-1) === id ? order.unitIds : []))
        .filter(unitId => { const unit = state.units.find(candidate => candidate.id === unitId); return unit && unit.hexId !== id && unitCategory(state, unit) === category; }).length;
      base[category] = { used: base[category].used + queued, limit: base[category].limit };
    }
    hexes[id] = base;
  }
  const defaults = { military: landLimit(state, actor), civilians: config.civilians, fleets: researched(state, actor, config.upgrades.naval) ? config.fleetsUpgraded : config.fleets };
  return { defaults, hexes };
}
