import { CityIdSchema, createDefaultRules, emptyResourcePool, type GameRulesConfig, type GameState, type ManagementCommand } from '@aoh/game-domain';
import { advancePhase, applyCommand, createGame } from '@aoh/game-engine';
import { input, playerId, secondPlayerId, unwrap } from './helpers.js';

export const cityId = CityIdSchema.parse('city-1');
export const enemyCityId = CityIdSchema.parse('city-2');
export function cityInput(config: GameRulesConfig = createDefaultRules()) {
  return {
    ...input(), config,
    players: [
      { id: playerId, name: 'First', resources: { ...emptyResourcePool(), food: 20, materials: 50 } },
      { id: secondPlayerId, name: 'Second', resources: { ...emptyResourcePool(), food: 20, materials: 50 } },
    ],
    map: [{ id: '0,0', q: 0, r: 0 }, { id: '2,0', q: 2, r: 0 }],
    initialCities: [
      { id: cityId, ownerId: playerId, hexId: '0,0', name: 'First City', population: 2, workers: workers(2) },
      { id: enemyCityId, ownerId: secondPlayerId, hexId: '2,0', name: 'Second City', population: 2, workers: workers(2) },
    ],
  };
}
export const workers = (producers = 0, unassigned = 0) => ({ producers, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned });
export const cityGame = (config = createDefaultRules()): GameState => unwrap(createGame(cityInput(config)));
export const maintain = (state: GameState): GameState => unwrap(advancePhase(state, 'PLANNING', state.version));
export const planning = (config = createDefaultRules()): GameState => maintain(cityGame(config));
export function firstPlayer(state: GameState) {
  const player = state.players[0];
  if (!player) throw new Error('Missing fixture player');
  return player;
}
export function firstCity(state: GameState) {
  const city = firstPlayer(state).civilization.cities[0];
  if (!city) throw new Error('Missing fixture city');
  return city;
}
export type ManagementIntent = { [K in ManagementCommand['type']]: Omit<Extract<ManagementCommand, { type: K }>, 'expectedVersion' | 'playerId'> }[ManagementCommand['type']];
export function manage(state: GameState, command: ManagementIntent): GameState {
  return unwrap(applyCommand(state, { ...command, playerId, expectedVersion: state.version }));
}
export function cycle(state: GameState): GameState {
  let next = state;
  for (const phase of ['RESOLUTION', 'REACTION', 'END_ROUND', 'MAINTENANCE', 'PLANNING'] as const) next = unwrap(advancePhase(next, phase, next.version));
  return next;
}
