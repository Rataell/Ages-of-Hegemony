import type { MatchReportV1 } from '@aoh/game-domain';
import { buildMatchReport, type MatchReportContext } from '@aoh/game-engine';
import type { AlphaRepository, AlphaRoom } from './alpha-room.js';
import { alphaLog, short } from './alpha-log.js';

/** Seat metadata the final state does not carry: human or bot, and the bot persona. Display names, guest ids and the invite code are deliberately NOT passed. */
export function reportContext(room: AlphaRoom, appVersion: string | null, finishedAt: string | null, origin: MatchReportContext['origin'] = 'LIVE'): MatchReportContext {
  return {
    seats: room.seats.map(seat => ({ playerId: seat.playerId, kind: seat.bot ? 'BOT' as const : 'HUMAN' as const, botPersona: seat.botPersona })),
    origin, contentVersion: room.contentVersion, appVersion, finishedAt,
  };
}

/** The stored report, or (for a room that finished before reports existed) one rebuilt in memory and marked RECONSTRUCTED. Null when it cannot be built. Never writes. */
export function reportOf(room: AlphaRoom, appVersion: string | null = null): MatchReportV1 | null {
  if (room.report) return room.report;
  if (!room.game || room.game.core.status !== 'FINISHED') return null;
  try { return buildMatchReport(room.game, reportContext(room, appVersion, null, 'RECONSTRUCTED')); } catch (error) { alphaLog('REPORT_FAILED', { room: short(room.id), reason: error instanceof Error ? error.message.slice(0, 80) : 'unknown' }); return null; }
}

/**
 * Generates the MatchReportV1 exactly once, in the save that makes the match FINISHED (every path to FINISHED goes through `save`: commands, expiry, bot timers, guards).
 * It never blocks the end of the match: any failure is logged and the room is saved without a report (the read path rebuilds it on demand). A report already stored is
 * never touched, so a finished report cannot change silently with a later patch.
 */
export class ReportingAlphaRepository implements AlphaRepository {
  constructor(private readonly inner: AlphaRepository, private readonly appVersion: string | null = null, private readonly clock: () => Date = () => new Date()) {}
  find(id: string): Promise<AlphaRoom | null> { return this.inner.find(id); }
  findByCode(code: string): Promise<AlphaRoom | null> { return this.inner.findByCode(code); }
  create(room: AlphaRoom): Promise<boolean> { return this.inner.create(room); }
  async save(room: AlphaRoom, expectedVersion: number): Promise<boolean> {
    let toSave = room;
    if (room.report === null && room.game?.core.status === 'FINISHED') {
      try { toSave = { ...room, report: buildMatchReport(room.game, reportContext(room, this.appVersion, this.clock().toISOString())) }; }
      catch (error) { alphaLog('REPORT_FAILED', { room: short(room.id), reason: error instanceof Error ? error.message.slice(0, 80) : 'unknown' }); }
    }
    return this.inner.save(toSave, expectedVersion);
  }
}
