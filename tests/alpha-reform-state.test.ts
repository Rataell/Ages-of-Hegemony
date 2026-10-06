import { describe, expect, it } from 'vitest';
import { reformState, type ReformInfo } from '../apps/web/app/alpha/reform.js';

const info = (patch: Partial<ReformInfo> = {}): ReformInfo => ({ window: true, planned: null, current: { government: 'TRIBAL' }, options: [
  { government: 'TRIBAL', unlocked: true, block: null }, { government: 'MONARCHY', unlocked: false, block: null }, { government: 'REPUBLIC', unlocked: false, block: null }], ...patch });

describe('government reform surface (Virada de Era)', () => {
  it('outside the last round of the Era there is nothing to show', () => expect(reformState(info({ window: false }))).toBe('closed'));
  it('with no eligible government it is an informative state, not a decision', () => expect(reformState(info())).toBe('none'));
  it('an unlocked government that is blocked by cost or timing is not eligible either', () => {
    expect(reformState(info({ options: [{ government: 'TRIBAL', unlocked: true, block: null }, { government: 'MONARCHY', unlocked: true, block: 'Influência insuficiente' }] }))).toBe('none');
  });
  it('an unlocked, unblocked government other than the current one opens the decision', () => {
    expect(reformState(info({ options: [{ government: 'TRIBAL', unlocked: true, block: null }, { government: 'MONARCHY', unlocked: true, block: null }] }))).toBe('choose');
  });
  it('the current government never counts as an eligible reform', () => expect(reformState(info({ options: [{ government: 'TRIBAL', unlocked: true, block: null }] }))).toBe('none'));
  it('a reserved reform stays visible as reserved', () => expect(reformState(info({ planned: 'MONARCHY' }))).toBe('planned'));
});
