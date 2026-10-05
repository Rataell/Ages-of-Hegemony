import type { AlphaRoomView } from '@aoh/server/alpha';

export type Reply = { ok: true; value: AlphaRoomView } | { ok: false; error: { code: string; message: string } };
/** The only two effects the client needs from the network. Network failures are thrown by `post` and are never retried. */
export interface CommandTransport {
  post(payload: Record<string, unknown>): Promise<Reply>;
  fetchRoom(gameId: string): Promise<Reply>;
}
export interface SendOutcome {
  reply: Reply;
  /** True when the command was sent a second time after a refresh. */
  retried: boolean;
  /** Fresh room from the recovery refresh, when one happened. */
  latest: AlphaRoomView | null;
}
export const CONFLICT_AFTER_RETRY = 'A partida mudou de novo enquanto você agia. A tela foi atualizada; confira o estado e tente outra vez.';

interface Envelope extends Record<string, unknown> { operation: string; gameId?: string; payload?: Record<string, unknown> }
const RECOVERABLE = new Set(['command', 'lobby']);

export const MAX_CONFLICT_RETRIES = 3;
export interface RecoveryOptions { maxRetries?: number; delay?: (attempt: number) => Promise<void> }
/** Small jittered pause (40-120 ms, growing with the attempt) so seats that collided do not collide again in lockstep. */
const jitter = (attempt: number) => new Promise<void>(resolve => { setTimeout(resolve, 40 * attempt + Math.floor(Math.random() * 80)); });

/**
 * Sends one game command. Only when the server answers with an explicit VERSION_CONFLICT (so the command was NOT applied) it
 * fetches a fresh projection, replaces `expectedVersion` with the fresh version and sends the SAME command again, up to
 * MAX_CONFLICT_RETRIES times with a short jitter (E-2: at 4-6 seats several players confirm in the same second).
 * Anything else (success, a domain error, a network failure, a failed refresh) ends the attempt. The server stays authoritative:
 * every retry carries its own version and can still be rejected, and that real error is what the player then sees.
 */
export async function sendWithRecovery(transport: CommandTransport, envelope: Envelope, options: RecoveryOptions = {}): Promise<SendOutcome> {
  const maxRetries = options.maxRetries ?? MAX_CONFLICT_RETRIES, delay = options.delay ?? jitter;
  const first = await transport.post(envelope);
  if (first.ok || first.error.code !== 'VERSION_CONFLICT' || !RECOVERABLE.has(envelope.operation) || !envelope.gameId || !envelope.payload) return { reply: first, retried: false, latest: null };
  let latestRoom: AlphaRoomView | null = null, retried = false;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let latest: Reply;
    try { latest = await transport.fetchRoom(envelope.gameId); } catch { return { reply: first, retried, latest: latestRoom }; }
    if (!latest.ok) return { reply: first, retried, latest: latestRoom };
    latestRoom = latest.value;
    const version = envelope.operation === 'lobby' ? latest.value.version : latest.value.game?.version;
    if (version === undefined) return { reply: first, retried, latest: latest.value };
    if (attempt > 1) await delay(attempt - 1);
    const next = await transport.post({ ...envelope, payload: { ...envelope.payload, expectedVersion: version } });
    retried = true;
    if (next.ok || next.error.code !== 'VERSION_CONFLICT') return { reply: next, retried, latest: latest.value };
  }
  // Conflicts on every attempt: stop, refresh once more for the screen and explain.
  let refreshed: AlphaRoomView | null = latestRoom;
  try { const again = await transport.fetchRoom(envelope.gameId); if (again.ok) refreshed = again.value; } catch { /* keep the earlier projection */ }
  return { reply: { ok: false, error: { code: 'VERSION_CONFLICT', message: CONFLICT_AFTER_RETRY } }, retried, latest: refreshed };
}
