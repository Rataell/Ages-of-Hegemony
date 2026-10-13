'use client';
import { useEffect, useState } from 'react';
import type { ActionPreview } from '@aoh/server/alpha';

/**
 * Ficha de Ação (UX board directive, slice 4), client side. `useActionPreview` asks the read-only `preview` operation (previewAction of the engine) about ONE command and
 * answers `idle | loading | error | ready`. Same pattern as `useMovePreview`: debounced 220 ms, never saves, re-asked when the match version changes (a plan, a card, a
 * resolution) so the numbers follow the table. Nothing here decides costs or eligibility: every figure and every refusal is the engine's.
 */
export type ActionPreviewData = ActionPreview;
/** `previous` is the last answer while the next one is on its way, so the Ficha dims its numbers instead of blinking empty. */
export type ActionPreviewState = { status: 'idle' } | { status: 'loading'; previous?: ActionPreviewData } | { status: 'error'; message: string } | { status: 'ready'; data: ActionPreviewData };
export const IDLE_PREVIEW: ActionPreviewState = { status: 'idle' };

/** The command as the engine takes it, without the version (the server ignores `expectedVersion` on a preview; the schema still wants one). */
export type PreviewCommand = Record<string, unknown>;

export function useActionPreview(roomId: string, command: PreviewCommand | null, version: number): ActionPreviewState {
  const key = command ? `${version}:${JSON.stringify(command)}` : '';
  const [answer, setAnswer] = useState<{ key: string; state: ActionPreviewState } | null>(null);
  useEffect(() => {
    if (!command) { setAnswer(null); return; }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch('/api/alpha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ operation: 'preview', gameId: roomId, payload: { command: { ...command, expectedVersion: version } } }) });
          const reply = (await response.json()) as { ok: true; value: ActionPreviewData } | { ok: false; error: { message: string } };
          if (controller.signal.aborted) return;
          setAnswer({ key, state: reply.ok ? { status: 'ready', data: reply.value } : { status: 'error', message: reply.error.message } });
        } catch {
          if (!controller.signal.aborted) setAnswer({ key, state: { status: 'error', message: 'Não foi possível conferir esta ação agora. Tente de novo.' } });
        }
      })();
    }, 220);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [key]);
  if (!command) return IDLE_PREVIEW;
  if (answer && answer.key === key) return answer.state;
  return answer?.state.status === 'ready' ? { status: 'loading', previous: answer.state.data } : { status: 'loading' };
}
