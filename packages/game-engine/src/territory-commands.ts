import { RESOURCE_KEYS, connectedTo, improvementCompatible, productiveTile, type GameEvent, type GameRuleError, type GameState, type HexTile, type PlayerState, type ResourcePool, type TerritoryCommand } from '@aoh/game-domain';
import { err, ok, type Result } from '@aoh/shared';
import { hexDistance } from './hex.js';
import { canAfford } from './resources.js';
import { refreshAdministration } from './civilization.js';
import { foundCityAt } from './founding.js';

export function applyTerritoryCommand(state: GameState, command: TerritoryCommand, version: number): Result<{ player: PlayerState; map: HexTile[]; event: GameEvent }, GameRuleError> {
  if (state.phase !== 'PLANNING') return err({ code: 'WRONG_PHASE', message: 'Territory management requires PLANNING' });
  const original = state.players.find((player) => player.id === command.playerId);
  if (!original) return err({ code: 'UNKNOWN_PLAYER', message: 'Unknown player' });
  let player = structuredClone(original); let map = structuredClone(state.map);
  const rules = state.config.territory; const base = { playerId: player.id, round: state.round, version };
  const pay = (cost: ResourcePool): boolean => {
    if (!canAfford(player.resources, cost)) return false;
    for (const key of RESOURCE_KEYS) player.resources[key] -= cost[key];
    return true;
  };
  const funds: GameRuleError = { code: 'INSUFFICIENT_RESOURCES', message: 'Cannot afford configured cost' };
  let event: GameEvent;
  if (command.type === 'FOUND_CITY' || command.type === 'IMPROVE_HEX') {
    const tile = map.find((tile) => tile.id === command.hexId);
    if (!tile) return err({ code: 'UNKNOWN_HEX', message: 'Unknown hex' });
    if (tile.ownerId !== player.id) return err({ code: 'HEX_NOT_OWNED', message: 'Hex is not owned by player' });
    if (command.type === 'IMPROVE_HEX') {
      if (tile.improvement !== null) return err({ code: 'ALREADY_IMPROVED', message: 'Replacing improvements is not available' });
      if (!improvementCompatible(tile, command.improvement, rules)) return err({ code: 'INVALID_IMPROVEMENT', message: 'Improvement is incompatible with terrain/features' });
      const cost = rules.improvementCatalog[command.improvement].cost;
      if (!pay(cost)) return err(funds);
      tile.improvement = command.improvement;
      event = { ...base, type: 'HEX_IMPROVED', hexId: tile.id, improvement: command.improvement, cost };
    } else {
      const founded=foundCityAt(state,player,map,command,version);
      if(!founded.ok)return founded;
      event=founded.value;
    }
  } else {
    const city = player.civilization.cities.find((city) => city.id === command.cityId);
    if (!city) return err({ code: 'CITY_NOT_OWNED', message: 'City is not owned by player' });
    const center = map.find((tile) => tile.id === city.hexId);
    if (!center) return err({ code: 'INVALID_STATE', message: 'Missing city center' });
    switch (command.type) {
      case 'CLAIM_HEX': {
        const tile = map.find((tile) => tile.id === command.hexId);
        if (!tile) return err({ code: 'UNKNOWN_HEX', message: 'Unknown hex' });
        if (tile.ownerId !== null) return err({ code: 'HEX_NOT_FREE', message: 'Only unowned hexes can be claimed; contested claims need a future resolver' });
        if (tile.terrain === 'SEA' || tile.terrain === 'UNKNOWN') return err({ code: 'INVALID_TERRITORY', message: 'SEA and UNKNOWN cannot be claimed' });
        if (hexDistance(center, tile) > (rules.cityRadii[city.development - 1] ?? 0)) return err({ code: 'OUT_OF_RANGE', message: 'Target exceeds city administrative radius' });
        const candidate = { ...tile, ownerId: player.id, controllerCityId: city.id };
        const nextMap = map.map((entry) => entry.id === candidate.id ? candidate : entry);
        if (!connectedTo(nextMap, candidate, center)) return err({ code: 'DISCONNECTED_TERRITORY', message: 'A continuous owned path to the controlling city is required' });
        if (!pay(rules.claimCost)) return err(funds);
        map = nextMap;
        event = { ...base, cityId: city.id, type: 'HEX_CLAIMED', hexId: tile.id, cost: rules.claimCost };
        break;
      }
      case 'ASSIGN_WORKED_HEXES': {
        if (new Set(command.hexIds).size !== command.hexIds.length || command.hexIds.length > city.workers.producers) return err({ code: 'INVALID_WORKED_HEXES', message: 'One unique hex per producer at most' });
        for (const id of command.hexIds) {
          const tile = map.find((entry) => entry.id === id);
          if (!tile || tile.ownerId !== player.id || tile.controllerCityId !== city.id || hexDistance(center, tile) > (rules.cityRadii[city.development - 1] ?? 0) || !productiveTile(tile, rules) || state.players.some((entry) => entry.civilization.cities.some((other) => other.id !== city.id && other.workedHexIds.includes(id)))) return err({ code: 'INVALID_WORKED_HEXES', message: 'Hex must be productive, owned, in range and assigned to this city alone' });
        }
        city.workedHexIds = [...command.hexIds].sort();
        event = { ...base, cityId: city.id, type: 'WORKED_HEXES_ASSIGNED', hexIds: city.workedHexIds };
        break;
      }
      case 'BUILD_DISTRICT': {
        if (city.districts.some((entry) => entry.type === command.district)) return err({ code: 'DUPLICATE_DISTRICT', message: 'One district of each type per city' });
        if (city.districts.length >= (rules.districtSlots[city.development - 1] ?? 0)) return err({ code: 'DISTRICT_LIMIT', message: 'No district slots available' });
        const entry = rules.districts[command.district];
        if (city.development < entry.minimumDevelopment) return err({ code: 'DEVELOPMENT_REQUIRED', message: 'District development requirement not met' });
        if (!pay(entry.cost)) return err(funds);
        city.districts.push({ type: command.district, builtRound: state.round });
        event = { ...base, cityId: city.id, type: 'DISTRICT_BUILT', district: command.district, cost: entry.cost };
        break;
      }
      case 'BUILD_BUILDING': {
        const entry = rules.buildings[command.building];
        if (!city.districts.some((district) => district.type === entry.district)) return err({ code: 'MISSING_DISTRICT', message: 'Building requires its matching district' });
        if (city.buildings.some((building) => building.type === command.building)) return err({ code: 'DUPLICATE_BUILDING', message: 'Building already exists' });
        if (city.development < entry.minimumDevelopment) return err({ code: 'DEVELOPMENT_REQUIRED', message: 'Building development requirement not met' });
        if (!pay(entry.cost)) return err(funds);
        city.buildings.push({ type: command.building, builtRound: state.round });
        event = { ...base, cityId: city.id, type: 'BUILDING_BUILT', building: command.building, cost: entry.cost };
        break;
      }
    }
  }
  player = { ...player, civilization: refreshAdministration(player.civilization, state.config, map) };
  return ok({ player, map, event });
}
