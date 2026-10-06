/** Playtest-only human telemetry: short enum tokens about what a person did on screen. Off unless the server says the playtest log is on. */
export type UiKind = 'panel_open' | 'panel_close' | 'decision_shown' | 'decision_done' | 'era_turn_shown' | 'planning_idle' | 'casualty_panel' | 'diplomacy_panel';

export function trackUi(enabled: boolean, gameId: string, kind: UiKind, detail: string): void {
  if (!enabled || typeof fetch === 'undefined') return;
  try {
    void fetch('/api/alpha', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-aoh-telemetry': '1' }, body: JSON.stringify({ operation: 'telemetry', gameId, kind, detail: detail.slice(0, 40) }), keepalive: true }).catch(() => undefined);
  } catch { /* telemetry never blocks play */ }
}
