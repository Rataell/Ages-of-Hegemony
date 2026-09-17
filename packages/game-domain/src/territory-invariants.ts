import type { CityState } from './model.js';
import type { GameRulesConfig } from './rules.js';
import type { HexTile, ImprovementType } from './core.js';
import type { TerritoryRules } from './territory.js';

// Relational snapshot integrity. The engine owns command transitions and production.
export function axialDistance(a: { q: number; r: number }, b: { q: number; r: number }): number {
  const q = a.q - b.q; const r = a.r - b.r;
  return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
}
export function improvementCompatible(tile: HexTile, improvement: ImprovementType, rules: TerritoryRules): boolean {
  if (tile.terrain === 'UNKNOWN' || tile.terrain === 'SEA') return false;
  const entry = rules.improvementCatalog[improvement];
  return (entry.terrains.includes(tile.terrain) || (entry.alternateFeature !== null && tile.features.includes(entry.alternateFeature))) && (entry.requiredFeature === null || tile.features.includes(entry.requiredFeature));
}
export function connectedTo(map: readonly HexTile[], tile: HexTile, center: HexTile): boolean {
  const seen = new Set([center.id]); const queue = [center];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]; if (!current) continue;
    if (current.id === tile.id) return true;
    for (const next of map) if (next.ownerId === center.ownerId && !seen.has(next.id) && axialDistance(current, next) === 1) { seen.add(next.id); queue.push(next); }
  }
  return false;
}
export function productiveTile(tile: HexTile, rules: TerritoryRules): boolean {
  if (tile.terrain === 'UNKNOWN' || tile.terrain === 'SEA') return false;
  return [rules.terrainYields[tile.terrain], ...tile.features.map((feature) => rules.featureCatalog[feature].yield), ...(tile.improvement === null ? [] : [rules.improvementCatalog[tile.improvement].yield])].some((yieldValue) => Object.values(yieldValue).some((amount) => amount > 0));
}
export function territorialInvariantErrors(state: { config: GameRulesConfig; players: { civilization: { cities: CityState[] } }[]; map: HexTile[]; round: number }): string[] {
  const errors: string[] = []; const rules = state.config.territory;
  const cities = state.players.flatMap((player) => player.civilization.cities);
  const worked = new Set<string>();
  for (const tile of state.map) {
    if (new Set(tile.features).size !== tile.features.length || tile.features.some((feature) => !rules.featureCatalog[feature].terrains.includes(tile.terrain))) errors.push('Incompatible or duplicate terrain features');
    if (tile.terrain === 'UNKNOWN' && (tile.features.length > 0 || tile.improvement !== null)) errors.push('UNKNOWN tile cannot have features or improvements');
    if ((tile.ownerId === null) !== (tile.controllerCityId === null)) errors.push('Territory owner/controller must be paired');
    if (tile.terrain === 'SEA' && (tile.ownerId !== null || tile.improvement !== null)) errors.push('SEA economy is disabled');
    if (tile.improvement !== null && (tile.ownerId === null || !improvementCompatible(tile, tile.improvement, rules))) errors.push('Invalid tile improvement');
    if (tile.controllerCityId !== null) {
      const city = cities.find((entry) => entry.id === tile.controllerCityId);
      const center = state.map.find((entry) => entry.id === city?.hexId);
      if (!city || !center || city.ownerId !== tile.ownerId) errors.push('Unknown or foreign territorial controller');
      else if (axialDistance(center, tile) > (rules.cityRadii[city.development - 1] ?? 0) || !connectedTo(state.map, tile, center)) errors.push('Territory outside range or disconnected from controller');
    }
  }
  for (const city of cities) {
    const center = state.map.find((tile) => tile.id === city.hexId);
    if (!center || center.ownerId !== city.ownerId || center.controllerCityId !== city.id || center.terrain === 'SEA') errors.push('City center must belong to its city');
    if (new Set(city.workedHexIds).size !== city.workedHexIds.length || city.workedHexIds.length > city.workers.producers) errors.push('Worked hexes exceed producers or contain duplicates');
    for (const id of city.workedHexIds) {
      const tile = state.map.find((entry) => entry.id === id);
      if (!tile || tile.ownerId !== city.ownerId || tile.controllerCityId !== city.id || worked.has(id) || !productiveTile(tile, rules)) errors.push('Invalid worked hex');
      worked.add(id);
    }
    if (city.districts.length > (rules.districtSlots[city.development - 1] ?? 0) || new Set(city.districts.map((district) => district.type)).size !== city.districts.length) errors.push('District slots or uniqueness violated');
    for (const district of city.districts) if (district.builtRound < city.foundedRound || district.builtRound > state.round || city.development < rules.districts[district.type].minimumDevelopment) errors.push('Invalid district requirements');
    if (new Set(city.buildings.map((building) => building.type)).size !== city.buildings.length) errors.push('Duplicate building');
    for (const building of city.buildings) {
      const entry = rules.buildings[building.type];
      const district = city.districts.find((district) => district.type === entry.district);
      if (!district || building.builtRound < district.builtRound || building.builtRound > state.round || city.development < entry.minimumDevelopment) errors.push('Missing building district or invalid requirements');
    }
  }
  return errors;
}
