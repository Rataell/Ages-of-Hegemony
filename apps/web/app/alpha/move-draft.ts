'use client';
import { useEffect, useState } from 'react';

/**
 * Mover coordenado (V12-UX-04, D1), client side. The Move is drafted on the Mesa as ONE Order: legs (pieces from one origin walking one path) are
 * chosen with chips and a lit destination, drawn as coloured trajectories, checked by the read-only `movePreview` operation and confirmed once.
 * Nothing here decides budgets or reach: ranges come from `unitOptions`, the numbers and the refusals from the server's `movePreview`.
 */
/** One colour per leg (Cena B of the Mesa Viva concept). */
export const LEG_COLORS = ['#e6c173', '#7fd0c4', '#e79ab5'] as const;

/** A leg of the draft: pieces that share an origin, the path of the slowest piece, and (Move + Discovery) the orientations that let every piece enter the closed Region at the end. */
export interface DraftLeg { ids: string[]; origin: string; dest: string; path: string[]; rotations: number[]; ri: number; regionId: string | null }
/** The leg as the engine takes it (`legs[]` of a coordinated MOVE, or `unitIds`/`path`/`rotation` of the legacy single-leg MOVE). */
export const legPayload = (leg: DraftLeg) => ({ unitIds: leg.ids, path: leg.path, ...(leg.rotations.length ? { rotation: leg.rotations[Math.min(leg.ri, leg.rotations.length - 1)] } : {}) });

export interface PreviewBlocker { code: string; message: string; unitId?: string; hexId?: string }
export interface PreviewLeg { index: number; ok: boolean; cost: number; budget: number; remaining: number; frontier: boolean; frontierRisk?: { danger: string; lossChance: number }; blockers: PreviewBlocker[] }
/** What `movePreview` answers (MoveOrderPreview of the engine): per leg, and for the whole Order. */
export interface MovePreviewData { ok: boolean; coordinated: boolean; legs: PreviewLeg[]; pieces: number; maxPieces: number; ordersBefore: number; ordersAfter: number; ordersLimit: number; blockers: PreviewBlocker[] }
export type PreviewState = { status: 'idle' } | { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: MovePreviewData };

/** Debounced, read-only preview of the draft: never saves, never bumps the version. Re-asked when the match changes (a card was played) so the numbers follow it. */
export function useMovePreview(roomId: string, legs: readonly DraftLeg[], version: number): PreviewState {
  const key = `${version}:${JSON.stringify(legs.map(legPayload))}`;
  const [answer, setAnswer] = useState<{ key: string; state: PreviewState } | null>(null);
  useEffect(() => {
    if (!legs.length) { setAnswer(null); return; }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch('/api/alpha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ operation: 'movePreview', gameId: roomId, payload: { legs: legs.map(legPayload) } }) });
          const reply = (await response.json()) as { ok: true; value: MovePreviewData } | { ok: false; error: { message: string } };
          if (controller.signal.aborted) return;
          setAnswer({ key, state: reply.ok ? { status: 'ready', data: reply.value } : { status: 'error', message: reply.error.message } });
        } catch {
          if (!controller.signal.aborted) setAnswer({ key, state: { status: 'error', message: 'Não foi possível conferir o movimento agora. Tente de novo.' } });
        }
      })();
    }, 220);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [key]);
  if (!legs.length) return { status: 'idle' };
  return answer && answer.key === key ? answer.state : { status: 'loading' };
}

/** The first thing that stops the Order, in the order a player would fix it: Order level, then leg by leg. Null when the server says it can go. */
export function previewBlock(state: PreviewState): string | null {
  if (state.status === 'idle') return 'Escolha um destino no mapa.';
  if (state.status === 'loading') return 'Conferindo o movimento…';
  if (state.status === 'error') return state.message;
  if (state.data.ok) return null;
  const first = state.data.blockers[0] ?? state.data.legs.flatMap(leg => leg.blockers)[0];
  return first?.message ?? 'O servidor recusou este movimento.';
}
