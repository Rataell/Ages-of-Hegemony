import { RESOURCE_KEYS, type GameEvent, type GameRuleError, type GameState, type ManagementCommand, type PlayerState } from '@aoh/game-domain';
import { err, ok, type Result } from '@aoh/shared';
import { canAfford } from './resources.js';
import { refreshAdministration, stabilityCategory } from './civilization.js';

export function manageCivilization(state: GameState, command: ManagementCommand, version: number): Result<{ player: PlayerState; event: GameEvent }, GameRuleError> {
  if (state.phase !== 'PLANNING') return err({ code: 'WRONG_PHASE', message: 'Civilization management requires PLANNING' });
  const player = state.players.find((entry) => entry.id === command.playerId);
  if (!player) return err({ code: 'UNKNOWN_PLAYER', message: 'Player is not in this game' });
  const base = { playerId: player.id, round: state.round, version };
  const rules = state.config;
  if (command.type === 'ADOPT_GOVERNMENT') {
    if (player.civilization.government !== 'PROTO_GOVERNANCE') return err({ code: 'GOVERNMENT_ALREADY_ADOPTED', message: 'Government changes require a future reform system' });
    return ok({ player: { ...player, civilization: refreshAdministration({ ...player.civilization, government: command.government }, rules) }, event: { ...base, type: 'GOVERNMENT_ADOPTED', government: command.government } });
  }
  const owned = player.civilization.cities.find((city) => city.id === command.cityId);
  if (!owned) return err({ code: 'CITY_NOT_OWNED', message: 'City is not owned by this player' });
  let city = { ...owned };
  const resources = { ...player.resources };
  let event: GameEvent;
  switch (command.type) {
    case 'ASSIGN_POPULATION': {
      const allocated = Object.values(command.workers).reduce((total, value) => total + BigInt(value), 0n);
      if (allocated !== BigInt(city.population)) return err({ code: 'INVALID_ALLOCATION', message: 'Workers must sum to city population' });
      city = { ...city, workers: { ...command.workers } };
      event = { ...base, cityId: city.id, type: 'POPULATION_ASSIGNED', workers: city.workers };
      break;
    }
    case 'DEVELOP_CITY': {
      if (city.development >= rules.maxDevelopment) return err({ code: 'MAX_DEVELOPMENT', message: 'City is at maximum development' });
      if (rules.blockDevelopmentAtCritical && stabilityCategory(city.stability, rules) === 'CRITICAL') return err({ code: 'CRITICAL_STABILITY', message: 'Critical stability blocks development' });
      const cost = rules.developmentCosts[city.development - 1];
      if (!cost || !canAfford(resources, cost)) return err({ code: 'INSUFFICIENT_RESOURCES', message: 'Cannot afford city development' });
      for (const key of RESOURCE_KEYS) resources[key] -= cost[key];
      city = { ...city, development: city.development + 1 };
      event = { ...base, cityId: city.id, type: 'CITY_DEVELOPED', development: city.development, cost };
      break;
    }
    case 'SPECIALIZE_CITY': {
      if (city.specialization !== null) return err({ code: 'ALREADY_SPECIALIZED', message: 'Respecialization is not available' });
      if (city.development < rules.specializationMinimumDevelopment) return err({ code: 'DEVELOPMENT_REQUIRED', message: 'City needs more development to specialize' });
      city = { ...city, specialization: command.specialization };
      event = { ...base, cityId: city.id, type: 'CITY_SPECIALIZED', specialization: command.specialization };
      break;
    }
  }
  return ok({ player: { ...player, resources, civilization: refreshAdministration({ ...player.civilization, cities: player.civilization.cities.map((existing) => existing.id === city.id ? city : existing) }, rules) }, event });
}
