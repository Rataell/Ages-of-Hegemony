// Emits a MatchReportV1 for a finished headless match (bot simulations), with the same generator the live server uses.
// Opt-in: only when a report directory is given. Needs `npm run compile` (reads packages/*/dist).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildMatchReport } from '../../packages/game-engine/dist/index.js';

/** `result` is what `playMatch` returns ({ state, ctx }); the bots are the table, so every seat is a BOT with its persona (and skill as policy). */
export function emitMatchReport(result, dir, { name, appVersion = null } = {}) {
  const { state, ctx } = result;
  if (state.core.status !== 'FINISHED') return null;
  const report = buildMatchReport(state, {
    origin: 'SIMULATION', appVersion, contentVersion: null,
    seats: ctx.seats.map(seat => ({ playerId: seat.id, kind: 'BOT', botPersona: seat.persona ?? null, policy: ctx.skill ?? null })),
  });
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${name ?? report.match.gameId}.json`);
  writeFileSync(file, JSON.stringify(report));
  return file;
}
