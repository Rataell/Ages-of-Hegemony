import { ADVANCEMENTS, AlphaEraSchema, civilizationKit, type Advancement, type AlphaState, type AlphaUnit, type HexId, type PlayerId, type ResourcePool } from '@aoh/game-domain';
import { hexId, hexNeighbors } from './hex.js';
import { stackBlock } from './alpha-stack.js';
import { alphaGain } from './alpha-resources.js';

/**
 * Civilization kits in the engine (DEC-011). The ids below are the hidden technical chassis of the Core 10 (RC 1.2):
 * valgard = Helênicos, nymara = Egípcios, meridia = Mesopotâmicos, dravik = Persas, solenne = Israel e Judá, kor = Romanos,
 * thalos = Nórdicos, orinth = Chineses, saren = Índia Antiga, aurelia = Incas. veyra and elyra are not selectable.
 * Each rule here is a kit item marked ACTIVE in `CIVILIZATION_KITS`; the rest stay
 * PLANNED there and do nothing. All of them reuse mechanisms the Alpha already has: costs, upkeep, research, exploration,
 * treaties, civic action, cultural contests, routes, movement and the starting position.
 */
export const civilizationOf = (state: AlphaState, actor: PlayerId): string | null => civilizationKit(state.players.find(p => p.playerId === actor)?.civilization)?.id ?? null;
const eraIndex = (era: string) => AlphaEraSchema.options.indexOf(era as never);

/** Recruitment cost after the kit: Veyra's envoys cost 1 Wealth less (trait), Valgard's +1 Influence and Elyra's siege +1 Metal (limitations); then the recruiting city's Arsenal (Cavalaria/Cerco −1 Metal) or Estaleiro (Frota/Barca −1 Riqueza). */
export function kitUnitCost(state: AlphaState, actor: PlayerId, kind: AlphaUnit['kind'], cityId?: string): { cost: ResourcePool; metal: number } {
  const entry = state.rules.units[kind], civ = civilizationOf(state, actor), cost = { ...entry.cost };
  let metal = entry.metal;
  if (civ === 'veyra' && kind === 'ENVOY') cost.wealth = Math.max(0, cost.wealth - 1);
  if (civ === 'valgard' && kind === 'ENVOY') cost.influence += 1;
  if (civ === 'elyra' && kind === 'SIEGE') metal += 1;
  // RC5 buildings, applied after the civilization adjustments and only to the city that recruits. The Arsenal never replaces Era, district or advances: those are checked before the price.
  const buildings = cityId ? state.cities.find(city => city.cityId === cityId)?.buildings ?? [] : [];
  if (buildings.includes('ARSENAL') && (kind === 'CAVALRY' || kind === 'SIEGE')) metal = Math.max(0, metal - 1);
  if (buildings.includes('SHIPYARD') && (kind === 'FLEET' || kind === 'COASTAL_VESSEL')) cost.wealth = Math.max(0, cost.wealth - 1);
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
/** Solenne defends its cultural presence with +1. */
export const kitCultureDefense = (_state: AlphaState, civilizationId: string) => civilizationId === 'solenne' ? 1 : 0;
/** Dravik's routes yield 1 Wealth less. */
export const kitRouteIncome = (state: AlphaState, actor: PlayerId) => civilizationOf(state, actor) === 'dravik' ? -1 : 0;
/** Kor's fleets move 1 less. */
export const kitMovement = (state: AlphaState, actor: PlayerId, kind: AlphaUnit['kind']) => civilizationOf(state, actor) === 'kor' && kind === 'FLEET' ? -1 : 0;
/**
 * Supply range of a piece, by kit. Helênicos: +1 on their own territory. Persas (Estrada Real): +1 on a hex with a road.
 * Nórdicos: land armies have −1 outside their own territory.
 */
export function kitSupplyBonus(state: AlphaState, unit: AlphaUnit): number {
  const civ = civilizationOf(state, unit.ownerId), tile = state.core.map.find(t => t.id === unit.hexId);
  if (civ === 'valgard' && tile?.ownerId === unit.ownerId) return 1;
  if (civ === 'dravik' && state.roads.includes(unit.hexId)) return 1;
  if (civ === 'thalos' && state.rules.units[unit.kind].domain === 'LAND' && state.rules.units[unit.kind].strength > 0 && tile?.ownerId !== unit.ownerId) return -1;
  return 0;
}
/** Romanos (Via Militar): a piece on a road, or on its own hex next to a road, is supplied. The same road network every other rule reads. */
export function kitRoadSupply(state: AlphaState, unit: AlphaUnit): boolean {
  if (civilizationOf(state, unit.ownerId) !== 'kor') return false;
  const tile = state.core.map.find(t => t.id === unit.hexId);
  if (!tile) return false;
  return state.roads.includes(tile.id) || (tile.ownerId === unit.ownerId && hexNeighbors(tile).some(point => state.roads.includes(hexId(point))));
}
/** Egípcios (Cheia do Nilo): a drought costs 1 Food less, and a drought stopped by Irrigação still returns 1 Food. Never immunity. */
export const isDroughtPulse = (card: { mitigatedBy: readonly string[] }) => card.mitigatedBy.includes('web-irrigation');
export const kitDroughtRelief = (state: AlphaState, actor: PlayerId, card: { mitigatedBy: readonly string[] }, loss: number): number => civilizationOf(state, actor) === 'nymara' && isDroughtPulse(card) ? Math.max(0, loss - 1) : loss;
export const kitDroughtRecovery = (state: AlphaState, actor: PlayerId, card: { mitigatedBy: readonly string[] }): number => civilizationOf(state, actor) === 'nymara' && isDroughtPulse(card) ? 1 : 0;
/** Egípcios (Casa da Eternidade): every Legacy Work they complete earns 2 more Prestige. */
export const kitLegacyPrestige = (state: AlphaState, actor: PlayerId): number => civilizationOf(state, actor) === 'nymara' ? 2 : 0;
/** Merídia's walls stop at the Stone Wall until Era IV (Impérios). */
export function kitFortificationBlock(state: AlphaState, actor: PlayerId, next: string): string | null {
  const player = state.players.find(p => p.playerId === actor);
  if (civilizationOf(state, actor) === 'meridia' && player && eraIndex(player.era) < eraIndex('EMPIRES') && !['PALISADE', 'STONE_WALL'].includes(next)) return 'Os Mesopotâmicos não passam da Muralha de Pedra antes da Era IV.';
  return null;
}
/** Extra food upkeep: Saren and Orinth pay 1 more per Cavalry; Aurélia pays 1 more for every 4 military pieces. */
export function kitFoodUpkeep(state: AlphaState, actor: PlayerId): number {
  const civ = civilizationOf(state, actor), own = state.units.filter(unit => unit.ownerId === actor);
  if (civ === 'saren' || civ === 'orinth') return own.filter(unit => unit.kind === 'CAVALRY').length;
  if (civ === 'aurelia') return Math.floor(own.filter(unit => state.rules.units[unit.kind].strength > 0).length / 4);
  return 0;
}

/** Extra yield when a city PRODUCES: Kor +1 Stone per worked quarry on Hills; Aurélia +1 Food per worked farm. */
export function kitProduceBonus(state: AlphaState, actor: PlayerId, cityId: string): { food: number; stone: number } {
  const civ = civilizationOf(state, actor), city = state.core.players.find(p => p.id === actor)?.civilization.cities.find(c => c.id === cityId);
  if (!city || (civ !== 'kor' && civ !== 'aurelia')) return { food: 0, stone: 0 };
  const worked = city.workedHexIds.map(id => state.core.map.find(t => t.id === id)).filter(t => t !== undefined);
  return {
    food: civ === 'aurelia' ? worked.filter(t => t.improvement === 'FARM').length : 0,
    stone: civ === 'kor' ? worked.filter(t => t.improvement === 'QUARRY' && t.terrain === 'HILLS').length : 0,
  };
}
/** Persas: roads and improvements cost 1 Wood/Stone (legacy materials) less. Incas (Qhapaq Ñan): a road on Hills or Mountains costs 1 less. */
export function kitWorksCost(state: AlphaState, actor: PlayerId, cost: ResourcePool, road?: { terrain: string }): ResourcePool {
  const civ = civilizationOf(state, actor);
  if (civ === 'dravik' || (civ === 'aurelia' && road && (road.terrain === 'HILLS' || road.terrain === 'MOUNTAINS'))) return { ...cost, materials: Math.max(0, cost.materials - 1) };
  return cost;
}
/** Merídia: +1 Wealth for the first trade offer it settles in a round (as proposer or recipient). */
export function kitTradeBonus(state: AlphaState, parties: readonly PlayerId[]): void {
  for (const id of parties) {
    if (civilizationOf(state, id) !== 'meridia') continue;
    if (state.events.some(event => event.type === 'KIT_FIRST_TRADE' && event.round === state.core.round && event.audience?.includes(id))) continue;
    alphaGain(state, id, { wealth: 1 }, { category: 'trade' });
    state.events.push({ id: `event-${state.events.length + 1}`, round: state.core.round, type: 'KIT_FIRST_TRADE', message: 'Feira das margens: +1 Riqueza pela primeira troca da rodada.', audience: [id] });
  }
}

/**
 * Signature pieces are variants of a family, not new classes: every piece of that family of the civilization is the signature.
 * Valgard's Guards are the Shield Guard (+1 guard each when defending a fortified city); Kor's Siege are Siege Engineers
 * (+1 breach against stone or better); Thalos' Infantry is Naval Infantry (no amphibious penalty); Elyra's Explorers are
 * Cartographers (entering the unknown costs them no movement).
 */
export const isSignature = (state: AlphaState, unit: Pick<AlphaUnit, 'ownerId' | 'kind'>) => { const kit = civilizationKit(state.players.find(p => p.playerId === unit.ownerId)?.civilization); return !!kit && kit.signature.item.status === 'ACTIVE' && kit.signature.family === unit.kind; };
/** Movement an unknown-Region entry costs this piece: UNKNOWN (1), nothing for Elyra's Cartographer Pioneiros (the old "reveal up to two hexes away"). */
export const kitFrontierCost = (state: AlphaState, unit: Pick<AlphaUnit, 'ownerId' | 'kind'>, base: number): number => civilizationOf(state, unit.ownerId) === 'elyra' && unit.kind === 'PIONEER' ? 0 : base;

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
    if (civ === 'thalos' || civ === 'elyra') place('PIONEER', 2);
    if (civ === 'saren') { place('ENVOY', 1); player.resources.influence += 2; }
    if (civ === 'veyra') { place('ENVOY', 1); place('ENVOY', 2); }
    if (civ === 'kor' && meta && meta.fortification.level === 'NONE') meta.fortification = { level: 'PALISADE', state: 'INTACT' };
    if (civ === 'orinth') player.resources.knowledge += 2;
    if (civ === 'solenne' && meta) meta.mood = Math.min(6, meta.mood + 1);
    if (civ === 'nymara') player.resources.food += 3;
    if (civ === 'aurelia') { player.resources.food += 2; player.resources.wood += 1; player.resources.stone += 1; }
    if (civ === 'dravik') player.resources.stone += 2;
  }
}
