import { createDefaultRules, type GameRulesConfig, type GameState, type ManagementCommand, type TerritoryCommand } from '@aoh/game-domain';
import { advancePhase, applyCommand, createGame } from '@aoh/game-engine';
import { gameId, playerId, secondPlayerId, unwrap } from './helpers.js';
import { cityId, enemyCityId, workers } from './civilization-helpers.js';

export function territoryInput(config: GameRulesConfig = createDefaultRules()) {
  return { gameId, seed: 42, config,
    players: [playerId, secondPlayerId].map((id) => ({ id, name: id, resources: { food: 100, materials: 100, wealth: 100, knowledge: 100, influence: 100 } })),
    map: [
      { id: '0,0', q: 0, r: 0, terrain: 'PLAINS', features: [] },
      { id: '1,0', q: 1, r: 0, terrain: 'PLAINS', features: ['RIVER', 'FERTILE'] },
      { id: '2,0', q: 2, r: 0, terrain: 'HILLS', features: ['METAL'] },
      { id: '3,0', q: 3, r: 0, terrain: 'PLAINS', features: [] },
      { id: '0,1', q: 0, r: 1, terrain: 'MOUNTAINS', features: ['STONE'] },
      { id: '-1,1', q: -1, r: 1, terrain: 'FOREST', features: ['TIMBER'] },
      { id: '1,-1', q: 1, r: -1, terrain: 'COAST', features: ['FISH'] },
      { id: '-1,0', q: -1, r: 0, terrain: 'SEA', features: ['FISH'] },
      { id: '0,-1', q: 0, r: -1, terrain: 'UNKNOWN', features: [] },
      { id: '5,0', q: 5, r: 0, terrain: 'FOREST', features: [] },
    ],
    initialCities: [{ id: cityId, ownerId: playerId, hexId: '0,0', name: 'Capital', population: 2, workers: workers(2) }, { id: enemyCityId, ownerId: secondPlayerId, hexId: '5,0', name: 'Foreign', population: 2, workers: workers(2) }],
  };
}
export const territorialGame = (rules = createDefaultRules()): GameState => unwrap(createGame(territoryInput(rules)));
export const territorialPlanning = (rules = createDefaultRules()): GameState => { const state = territorialGame(rules); return unwrap(advancePhase(state, 'PLANNING', state.version)); };
type Commands = TerritoryCommand | ManagementCommand;
export type Intent = { [K in Commands['type']]: Omit<Extract<Commands, { type: K }>, 'playerId' | 'expectedVersion'> }[Commands['type']];
export const execute = (state: GameState, intent: Intent): GameState => unwrap(applyCommand(state, { ...intent, playerId, expectedVersion: state.version }));
export const claim = (state: GameState, hexId: string): GameState => unwrap(applyCommand(state, { type: 'CLAIM_HEX', cityId, hexId, playerId, expectedVersion: state.version }));
export const developRadius = (state: GameState): GameState => execute(execute(state, { type: 'DEVELOP_CITY', cityId }), { type: 'DEVELOP_CITY', cityId });
