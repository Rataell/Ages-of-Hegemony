import type { RememberedPreview } from './action-ficha-model';

/**
 * The previews the player confirmed in this browser session, kept to compare with what the resolution really applied ("igual ao previsto" / "Δ").
 * sessionStorage only: a per-viewer convenience that may be empty (private window, blocked storage); the Resultado then shows the applied alone.
 */
const keyOf = (room: string) => `aoh-ficha-memory-${room}`;
export function loadMemory(room: string): RememberedPreview[] {
  try {
    const raw = JSON.parse(sessionStorage.getItem(keyOf(room)) ?? '[]') as unknown;
    return Array.isArray(raw) ? (raw as RememberedPreview[]) : [];
  } catch { return []; }
}
export function saveMemory(room: string, entries: readonly RememberedPreview[]): void {
  try { sessionStorage.setItem(keyOf(room), JSON.stringify(entries.slice(-40))); } catch { /* storage blocked: the Resultado shows the applied alone */ }
}
