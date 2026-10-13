import { describe, expect, it } from 'vitest';
import type { AlphaCommand, AlphaState } from '@aoh/game-domain';
import { previewAction } from '@aoh/game-engine';
import { apply, freshGame, meta, P1, seat, shape, urban } from './v12-audit-urban-helpers.js';

/**
 * RC6 gate · the planning-acceptance repros (U-01 .. U-08, E-A1-05 in docs/audit/ux-itfails-register.md) are `it.fails` at the RAW command boundary: the engine still stores a
 * plan that the player's own earlier plan will break at resolution. The Ficha de Ação asks `previewAction` (the real engine on the state the earlier plans leave) BEFORE it
 * lets the player confirm. This file proves that for each of those scenarios the Ficha refuses the second plan, naming a cause, so a human playing through the interface cannot
 * burn an Order that way. The raw-command repros stay open (bots and scripts can still queue them).
 */
const rich = (state: AlphaState, pool: Partial<ReturnType<typeof seat>['resources']> = {}) => { Object.assign(seat(state).resources, { food: 12, wood: 10, stone: 8, wealth: 0, knowledge: 8, influence: 8, culture: 0, metal: 0 }, pool); };
const ficha = (state: AlphaState, command: Record<string, unknown>) => previewAction(state, P1, { expectedVersion: state.version, ...command } as AlphaCommand);
function after(state: AlphaState, first: Record<string, unknown>[]): AlphaState {
  let current = state;
  for (const command of first) { const result = apply(current, command); if (!result.ok) throw new Error(result.error.message); current = result.value; }
  return current;
}
const refuses = (state: AlphaState, first: Record<string, unknown>[], second: Record<string, unknown>) => {
  const preview = ficha(after(state, first), second);
  expect(preview.eligible, preview.blockers.map(b => b.message).join(' | ')).toBe(false);
  expect(preview.blockers.length).toBeGreaterThan(0);
  expect(preview.blockers[0]!.message.length).toBeGreaterThan(10);
  return preview;
};

describe('the Ficha refuses what the raw planner still accepts', () => {
  it('U-01: two Construir that each fit the stock but not together', () => {
    const state = freshGame();
    shape(state, 'VILLAGE', 6, { producers: 3, scholars: 3 }); seat(state).research.push('web-agriculture', 'web-masonry'); rich(state, { wood: 4, stone: 0, wealth: 0 });
    const id = meta(state).cityId;
    refuses(state, [urban(id, 'BUILD', { build: { kind: 'DISTRICT', district: 'AGRARIAN' } })], urban(id, 'BUILD', { build: { kind: 'DISTRICT', district: 'INDUSTRIAL' } }));
  });
  it('U-02a: the same district twice', () => {
    const state = freshGame();
    shape(state, 'VILLAGE', 6, { producers: 3, scholars: 3 }); seat(state).research.push('web-agriculture'); rich(state);
    const id = meta(state).cityId, build = urban(id, 'BUILD', { build: { kind: 'DISTRICT', district: 'AGRARIAN' } });
    refuses(state, [build], build);
  });
  it('U-02b: two districts for one free slot', () => {
    const state = freshGame();
    shape(state, 'OUTPOST', 4, { producers: 2, scholars: 2 }); seat(state).research.push('web-agriculture', 'web-masonry'); rich(state);
    const id = meta(state).cityId;
    refuses(state, [urban(id, 'BUILD', { build: { kind: 'DISTRICT', district: 'AGRARIAN' } })], urban(id, 'BUILD', { build: { kind: 'DISTRICT', district: 'INDUSTRIAL' } }));
  });
  it('U-03 / E-A1-05: a second Elevar after the first', () => {
    const state = freshGame();
    shape(state, 'OUTPOST', 8, { producers: 4, scholars: 4 }); seat(state).research.push('web-agriculture', 'web-masonry'); rich(state, { wood: 12, stone: 6, wealth: 4 });
    const id = meta(state).cityId;
    refuses(state, [urban(id, 'ELEVATE')], urban(id, 'ELEVATE'));
  });
  it('U-04: Elevar after a Recrutar that takes the inhabitant Elevar needs', () => {
    const state = freshGame();
    shape(state, 'OUTPOST', 4, { producers: 2, soldiers: 1, unassigned: 1 }); seat(state).research.push('web-agriculture'); rich(state, { wood: 6, food: 10 });
    const id = meta(state).cityId;
    refuses(state, [urban(id, 'RECRUIT', { unit: 'INFANTRY' })], urban(id, 'ELEVATE'));
  });
  it('U-06: the third 2-Conhecimento advance with 4 Conhecimento', () => {
    const state = freshGame(); rich(state, { knowledge: 4 });
    const id = meta(state).cityId;
    refuses(state, [urban(id, 'RESEARCH', { advancementId: 'web-agriculture' }), urban(id, 'RESEARCH', { advancementId: 'web-masonry' })], urban(id, 'RESEARCH', { advancementId: 'web-writing' }));
  });
  it('U-08: Recrutar x3 after a Produzir (it would be the 2nd activation)', () => {
    const state = freshGame();
    shape(state, 'VILLAGE', 6, { producers: 3, soldiers: 3 }); meta(state).mood = 5; rich(state, { wood: 12, food: 12 });
    const id = meta(state).cityId;
    refuses(state, [urban(id, 'PRODUCE')], urban(id, 'RECRUIT', { unit: 'INFANTRY', count: 3 }));
  });
});
