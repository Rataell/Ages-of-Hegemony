import { describe, expect, it } from 'vitest';
import { beginAlphaPlanning, createAlphaGame, forceContactSetup } from '@aoh/game-engine';
import { MemorySink, PlaytestRecorder, summarizeCommand } from '../apps/server/src/playtest-log.js';

const state = () => { const created = createAlphaGame({ gameId: 'tele', seed: 3, preset: 'STANDARD', players: [{ id: 'p1', name: 'Nome Pessoal' }, { id: 'p2', name: 'Outro' }] }); forceContactSetup(created); return beginAlphaPlanning(created); };

describe('human playtest telemetry', () => {
  it('records UI moments with server-relative timing and no free text', () => {
    let now = 1000; const sink = new MemorySink(), recorder = new PlaytestRecorder(sink, () => now);
    const game = state(); recorder.start(game); now += 2500;
    recorder.clientEvent(game, 'p1' as never, 'panel_open', 'diplomacy <script>');
    const ui = sink.events.find(event => event.type === 'ui')!;
    expect(ui).toMatchObject({ seat: 'p1', kind: 'panel_open', sinceOpenMs: 2500 });
    expect(ui.detail).toBe('diplomacyscript');
    expect(JSON.stringify(sink.events)).not.toContain('Nome Pessoal');
  });

  it('logs the contact the forced scenario produced and the casualty priority command by kind, not text', () => {
    const sink = new MemorySink(), recorder = new PlaytestRecorder(sink);
    recorder.start(state());
    expect(summarizeCommand({ type: 'SET_CASUALTY_PRIORITY', order: ['RANGED', 'GUARD'], hexId: null })).toMatchObject({ type: 'SET_CASUALTY_PRIORITY', casualtyOrder: ['RANGED', 'GUARD'], hexId: null });
    expect(sink.events.some(event => event.type === 'planning_open')).toBe(true);
  });
});
