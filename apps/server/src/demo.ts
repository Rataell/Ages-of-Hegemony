import { buildDebugInspection } from './debug-scenario.js';

const { view, trace } = await buildDebugInspection();
console.log(JSON.stringify({ trace, gameId: view.gameId, round: view.round, phase: view.phase, version: view.version, player: view.player, commandPoints: view.commandPoints }, null, 2));
