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

/**
 * Sends one game command. Only when the server answers with an explicit VERSION_CONFLICT (so the command was NOT applied) it
 * fetches a fresh projection, replaces \`expectedVersion\` with the fresh version and sends the SAME command exactly once more.
 * Anything else (success, a domain error, a network failure, a failed refresh) ends the attempt. The server stays authoritative:
 * the retry carries its own version and can still be rejected, and that real error is what the player then sees.
 */
export async function sendWithRecovery(transport: CommandTransport, envelope: Envelope): Promise<SendOutcome> {
  const first = await transport.post(envelope);
  if (first.ok || first.error.code !== 'VERSION_CONFLICT' || !RECOVERABLE.has(envelope.operation) || !envelope.gameId || !envelope.payload) return { reply: first, retried: false, latest: null };
  let latest: Reply;
  try { latest = await transport.fetchRoom(envelope.gameId); } catch { return { reply: first, retried: false, latest: null }; }
  if (!latest.ok) return { reply: first, retried: false, latest: null };
  const version = envelope.operation === 'lobby' ? latest.value.version : latest.value.game?.version;
  if (version === undefined) return { reply: first, retried: false, latest: latest.value };
  const second = await transport.post({ ...envelope, payload: { ...envelope.payload, expectedVersion: version } });
  if (!second.ok && second.error.code === 'VERSION_CONFLICT') {
    // Two conflicts in a row: stop, refresh once more for the screen and explain, never a third attempt.
    let refreshed: AlphaRoomView | null = latest.value;
    try { const again = await transport.fetchRoom(envelope.gameId); if (again.ok) refreshed = again.value; } catch { /* keep the earlier projection */ }
    return { reply: { ok: false, error: { code: 'VERSION_CONFLICT', message: CONFLICT_AFTER_RETRY } }, retried: true, latest: refreshed };
  }
  return { reply: second, retried: true, latest: latest.value };
}
