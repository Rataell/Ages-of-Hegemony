import { DISCOVERY_NAMES, DISCOVERY_WEIGHTS, ENCOUNTER_CARDS, REGION_TEMPLATES, type AlphaState, type DiscoveryKind, type PlayerId } from '@aoh/game-domain';
import { alphaEvent } from './alpha-events.js';
import { regionOpenFor } from './alpha-world.js';
import { alphaRandomInteger } from './alpha-random.js';
import { alphaGain } from './alpha-resources.js';
import { hexDistance, hexId, hexNeighbors } from './hex.js';
import { isNavigableWater } from './alpha-water.js';
import { addPendingChoice } from './alpha-resonance.js';
import { applyThreatCommand } from './alpha-threats.js';

/**
 * Descobertas (canon §21, design I-26): the whole world is generated at creation and hidden. The explorer chooses which
 * Region to investigate, never what is in it. Content is drawn from the private RNG once, in region-id order.
 */
type Region = AlphaState['regions'][number];
const tileOf = (state: AlphaState, id: string) => state.core.map.find(tile => tile.id === id);
const hasWater = (state: AlphaState, region: Region) => region.hexIds.some(id => isNavigableWater(tileOf(state, id)));

/** Draws each frontier region's hidden content. Homelands hold nothing to find. Call after every other creation draw. */
export function generateDiscoveries(state: AlphaState): void {
  const total = DISCOVERY_WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0);
  for (const region of [...state.regions].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const template = REGION_TEMPLATES.find(candidate => candidate.id === region.templateId);
    if (template?.kind !== 'FRONTIER') { region.discovery = { kind: 'NONE', resolved: true, resolvedBy: null }; continue; }
    let roll = alphaRandomInteger(state, total), kind: DiscoveryKind = 'NONE';
    for (const [candidate, weight] of DISCOVERY_WEIGHTS) { if (roll < weight) { kind = candidate; break; } roll -= weight; }
    if (kind === 'ANCHORAGE' && !hasWater(state, region)) kind = 'NONE';
    region.discovery = { kind, resolved: kind === 'NONE', resolvedBy: null };
  }
}

/** Applies a region's content the first time any civilization reveals it. Later explorers only see it. */
export function applyDiscovery(state: AlphaState, actor: PlayerId, region: Region, unitId: string): void {
  const discovery = region.discovery;
  if (!discovery || discovery.resolved) return;
  discovery.resolved = true; discovery.resolvedBy = actor;
  const player = state.players.find(candidate => candidate.playerId === actor)!;
  const land = region.hexIds.map(id => tileOf(state, id)!).filter(tile => tile && !['SEA', 'UNKNOWN'].includes(tile.terrain));
  const say = (message: string) => alphaEvent(state, 'DISCOVERY', `${DISCOVERY_NAMES[discovery.kind]}: ${message}`, [actor]);
  switch (discovery.kind) {
    case 'RUIN': {
      const ruins = ENCOUNTER_CARDS.filter(card => card.id.startsWith('enc-ruin-')), card = ruins[alphaRandomInteger(state, ruins.length)]!;
      addPendingChoice(state, actor, { source: 'ENCOUNTER', cardId: card.id, title: card.title, text: card.text, mitigated: false, options: card.options });
      say('os exploradores encontraram algo que pede uma escolha.'); break;
    }
    case 'DEPOSIT': {
      const rock = land.find(tile => ['HILLS', 'MOUNTAINS'].includes(tile.terrain));
      if (rock && !rock.features.includes('METAL')) rock.features = [...rock.features, 'METAL'];
      alphaGain(state, actor, { stone: 2, metal: 1 });
      say('uma jazida rara rendeu +2 Pedra e +1 Metal.'); break;
    }
    case 'PASSAGE': {
      const centre = tileOf(state, region.hexIds[0]!)!;
      const path = [centre, ...hexNeighbors(centre).map(point => tileOf(state, hexId(point))).filter(tile => tile && region.hexIds.includes(tile.id) && !['SEA', 'MOUNTAINS'].includes(tile.terrain))].slice(0, 3);
      for (const tile of path) if (tile && !['SEA', 'MOUNTAINS'].includes(tile.terrain) && !state.roads.includes(tile.id)) state.roads.push(tile.id);
      say('uma passagem natural abriu estradas na região.'); break;
    }
    case 'ANCHORAGE': {
      const coast = land.find(tile => tile.terrain === 'COAST');
      if (coast && !coast.features.includes('FISH')) coast.features = [...coast.features, 'FISH'];
      alphaGain(state, actor, { wealth: 1 });
      say('um ancoradouro natural: +1 Riqueza e boa pesca na costa.'); break;
    }
    case 'DANGER': {
      const protectedBy = player.research.includes('web-experimental-method');
      const unit = state.units.find(candidate => candidate.id === unitId && candidate.ownerId === actor);
      if (!protectedBy && unit && alphaRandomInteger(state, 2) === 0) { state.units = state.units.filter(candidate => candidate.id !== unit.id); say('o perigo custou a peça que explorava.'); }
      else say(protectedBy ? 'o Método Experimental evitou o pior.' : 'a expedição escapou por pouco.');
      break;
    }
    case 'CAMP': {
      say('um acampamento de saqueadores se esconde na região.');
      applyThreatCommand(state, actor, { op: 'THREAT', command: 'SPAWN', kind: 'LAND' }, region.hexIds); break;
    }
    case 'NONE': break;
  }
}

export interface ExplorationHint { regionId: string; biome: string | null; danger: boolean | null; coast: boolean | null }
const BIOME_NAMES: Record<string, string> = { PLAINS: 'planície', FOREST: 'floresta', HILLS: 'colinas', MOUNTAINS: 'montanhas', COAST: 'costa', SEA: 'mar' };
/**
 * Partial information the Web gives before exploring (canon §21): Matemática names the biome, Método Experimental warns of danger
 * and coast, Cartografia shows coast. Only regions near an own piece are listed; nothing else about the region leaks.
 */
export function explorationHints(state: AlphaState, actor: PlayerId): ExplorationHint[] {
  const player = state.players.find(candidate => candidate.playerId === actor);
  if (!player) return [];
  const math = player.research.includes('web-mathematics'), method = player.research.includes('web-experimental-method'), cartography = player.research.includes('web-cartography');
  if (!math && !method && !cartography) return [];
  const mine = state.units.filter(unit => unit.ownerId === actor).map(unit => tileOf(state, unit.hexId)!).filter(Boolean);
  // Observatório: closed Regions up to 6 hexes from a city that has one are listed too, with the same fields (and each field still needs its advance). Information only.
  const observatories = state.cities.filter(city => city.currentOwnerId === actor && city.status !== 'OCCUPIED' && city.buildings.includes('OBSERVATORY')).map(city => state.core.players.flatMap(owner => owner.civilization.cities).find(candidate => candidate.id === city.cityId)).map(city => city ? tileOf(state, city.hexId) : undefined).filter((tile): tile is NonNullable<typeof tile> => tile !== undefined);
  return state.regions.filter(region => !regionOpenFor(state, region, actor) && region.hexIds.some(id => mine.some(tile => hexDistance(tile, tileOf(state, id)!) <= 4) || observatories.some(tile => hexDistance(tile, tileOf(state, id)!) <= 6))).map(region => {
    const counts = new Map<string, number>();
    for (const id of region.hexIds) { const terrain = tileOf(state, id)?.terrain ?? 'UNKNOWN'; counts.set(terrain, (counts.get(terrain) ?? 0) + 1); }
    const dominant = [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] ?? 'UNKNOWN';
    return {
      regionId: region.id, biome: math ? BIOME_NAMES[dominant] ?? null : null,
      danger: method ? region.discovery?.kind === 'DANGER' || region.discovery?.kind === 'CAMP' : null,
      coast: method || cartography ? hasWater(state, region) : null,
    };
  });
}
