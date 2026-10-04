import { ADVANCEMENTS, AlphaEraSchema, civilizationKit, type Advancement, type AlphaState, type AlphaUnit, type HexId, type PlayerId, type ResourcePool } from '@aoh/game-domain';
import { hexId, hexNeighbors } from './hex.js';
import { stackBlock } from './alpha-stack.js';

/**
 * Civilization kits in the engine (DEC-011). Each rule here is a kit item marked ACTIVE in `CIVILIZATION_KITS`; the rest stay
 * PLANNED there and do nothing. All of them reuse mechanisms the Alpha already has: costs, upkeep, research, exploration,
 * treaties, civic action, cultural contests, routes, movement and the starting position.
 */
export const civilizationOf = (state: AlphaState, actor: PlayerId): string | null => civilizationKit(state.players.find(p => p.playerId === actor)?.civilization)?.id ?? null;
const eraIndex = (era: string) => AlphaEraSchema.options.indexOf(era as never);

/** Recruitment cost after the kit: Veyra's envoys cost 1 Wealth less (trait), Valgard's +1 Influence and Elyra's siege +1 Metal (limitations). */
export function kitUnitCost(state: AlphaState, actor: PlayerId, kind: AlphaUnit['kind']): { cost: ResourcePool; metal: number } {
  const entry = state.rules.units[kind], civ = civilizationOf(state, actor), cost = { ...entry.cost };
  let metal = entry.metal;
  if (civ === 'veyra' && kind === 'ENVOY') cost.wealth = Math.max(0, cost.wealth - 1);
  if (civ === 'valgard' && kind === 'ENVOY') cost.influence += 1;
  if (civ === 'elyra' && kind === 'SIEGE') metal += 1;
  return { cost, metal };
}
/** Research cost after the kit: Orinth's first advancement of each domain costs 1 less; Solenne's Era I Knowledge advancements 1 more. */
export function kitAdvancementCost(state: AlphaState, actor: PlayerId, node: Advancement): ResourcePool {
  const civ = civilizationOf(state, actor), cost = { ...node.cost }, research = state.players.find(p => p.playerId === actor)?.research ?? [];
  if (civ === 'orinth' && !research.some(id => ADVANCEMENTS.find(a => a.id === id)?.domain === node.domain)) cost.knowledge = Math.max(1, cost.knowledge - 1);
  if (civ === 'solenne' && node.domain === 'KNOWLEDGE' && node.era === 'FOUNDATION') cost.knowledge += 1;
  return cost;
}
/** Knowledge for revealing a region: Elyra always, Thalos when the region touches the sea. */
export function kitExplorationKnowledge(state: AlphaState, actor: PlayerId, hexIds: readonly string[]): number {
  const civ = civilizationOf(state, actor);
  if (civ === 'elyra') return 1;
  if (civ === 'thalos' && hexIds.some(id => ['COAST', 'SEA'].includes(state.core.map.find(t => t.id === id)?.terrain ?? ''))) return 1;
  return 0;
}
/** Saren's treaties last one round more. */
export const kitTreatyRounds = (state: AlphaState, a: PlayerId, b: PlayerId) => [a, b].some(id => civilizationOf(state, id) === 'saren') ? 1 : 0;
/** Nymara's civic action yields 1 Influence more. */
export const kitCivicInfluence = (state: AlphaState, actor: PlayerId) => civilizationOf(state, actor) === 'nymara' ? 1 : 0;
/** Solenne defends its cultural presence with +1. */
export const kitCultureDefense = (_state: AlphaState, civilizationId: string) => civilizationId === 'solenne' ? 1 : 0;
/** Dravik's routes yield 1 Wealth less. */
export const kitRouteIncome = (state: AlphaState, actor: PlayerId) => civilizationOf(state, actor) === 'dravik' ? -1 : 0;
/** Kor's fleets move 1 less. */
export const kitMovement = (state: AlphaState, actor: PlayerId, kind: AlphaUnit['kind']) => civilizationOf(state, actor) === 'kor' && kind === 'FLEET' ? -1 : 0;
/** Valgard: +1 supply range for pieces standing on its own territory. */
export function kitSupplyBonus(state: AlphaState, unit: AlphaUnit): number {
  return civilizationOf(state, unit.ownerId) === 'valgard' && state.core.map.find(t => t.id === unit.hexId)?.ownerId === unit.ownerId ? 1 : 0;
}
/** Merídia's walls stop at the Stone Wall until Era IV (Impérios). */
export function kitFortificationBlock(state: AlphaState, actor: PlayerId, next: string): string | null {
  const player = state.players.find(p => p.playerId === actor);
  if (civilizationOf(state, actor) === 'meridia' && player && eraIndex(player.era) < eraIndex('EMPIRES') && !['PALISADE', 'STONE_WALL'].includes(next)) return 'Merídia não passa da Muralha de Pedra antes da Era IV.';
  return null;
}
/** Extra food upkeep: Saren and Orinth pay 1 more per Cavalry; Aurélia pays 1 more for every 4 military pieces. */
export function kitFoodUpkeep(state: AlphaState, actor: PlayerId): number {
  const civ = civilizationOf(state, actor), own = state.units.filter(unit => unit.ownerId === actor);
  if (civ === 'saren' || civ === 'orinth') return own.filter(unit => unit.kind === 'CAVALRY').length;
  if (civ === 'aurelia') return Math.floor(own.filter(unit => state.rules.units[unit.kind].strength > 0).length / 4);
  return 0;
}

/** Starting heritage, applied once when the match is created. Pieces that do not fit the capital stand on a free neighbour. */
export function applyCivilizationHeritage(state: AlphaState): void {
  for (const player of state.players) {
    const civ = civilizationOf(state, player.playerId), core = state.core.players.find(p => p.id === player.playerId)!;
    const capital = core.civilization.cities[0];
    if (!civ || !capital) continue;
    const place = (kind: AlphaUnit['kind'], n: number) => {
      const center = state.core.map.find(t => t.id === capital.hexId)!;
      const spots = [center, ...hexNeighbors(center).map(hexId).map(id => state.core.map.find(t => t.id === id)).filter(t => t !== undefined)]
        .filter(t => (t.id === capital.hexId || t.ownerId === player.playerId || t.ownerId === null) && !['SEA', 'UNKNOWN'].includes(t.terrain) && !state.units.some(other => other.hexId === t.id && other.ownerId !== player.playerId));
      const unit: AlphaUnit = { id: `heritage-${player.playerId}-${kind.toLowerCase()}-${n}`, ownerId: player.playerId, kind, hexId: capital.hexId, recruitedRound: 1, carrierId: null };
      const spot = spots.find(t => stackBlock(state, player.playerId, [{ ...unit, hexId: t.id as HexId }], t.id) === null);
      if (spot) state.units.push({ ...unit, hexId: spot.id as HexId });
    };
    const meta = state.cities.find(entry => entry.cityId === capital.id);
    if (civ === 'valgard') {
      place('GUARD', 1);
      const quarry = state.core.map.filter(t => t.ownerId === player.playerId && ['HILLS', 'MOUNTAINS'].includes(t.terrain) && t.improvement === null && t.id !== capital.hexId).sort((a, b) => a.id.localeCompare(b.id))[0];
      if (quarry) quarry.improvement = 'QUARRY';
    }
    if (civ === 'meridia') player.resources.wealth += 3;
    if (civ === 'thalos' || civ === 'elyra') place('EXPLORER', 2);
    if (civ === 'saren') { place('ENVOY', 1); player.resources.influence += 2; }
    if (civ === 'veyra') { place('ENVOY', 1); place('ENVOY', 2); }
    if (civ === 'kor' && meta && meta.fortification.level === 'NONE') meta.fortification = { level: 'PALISADE', state: 'INTACT' };
    if (civ === 'orinth') player.resources.knowledge += 2;
    if (civ === 'nymara' && meta) meta.mood = Math.min(6, meta.mood + 1);
    if (civ === 'dravik') player.resources.stone += 2;
  }
}
