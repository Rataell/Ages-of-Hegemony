import { buildTerritoryInspection } from './debug-scenario.js';

const { view, trace, migration } = await buildTerritoryInspection();
console.log(JSON.stringify({ trace, migration, gameId: view.gameId, round: view.round, phase: view.phase, version: view.version, player: view.player, territory: view.visibleTerritory, lastEconomy: view.lastEconomy }, null, 2));
