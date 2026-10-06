import { describe, expect, it } from 'vitest';
import { effectiveCasualtyList } from '../apps/web/app/alpha/alpha-casualties.js';

const defaults = ['INFANTRY', 'GUARD', 'RANGED', 'CAVALRY', 'SIEGE'];
describe('effectiveCasualtyList', () => {
  const all = new Set(defaults);
  it('shows the engine default when nothing was saved', () => expect(effectiveCasualtyList(defaults, { order: [], byHex: {} }, null, all)).toEqual(defaults));
  it('shows the saved order first and completes it with the remaining kinds', () => expect(effectiveCasualtyList(defaults, { order: ['CAVALRY', 'GUARD'], byHex: {} }, null, all)).toEqual(['CAVALRY', 'GUARD', 'INFANTRY', 'RANGED', 'SIEGE']));
  it('a stack override wins over the civilization list', () => expect(effectiveCasualtyList(defaults, { order: ['CAVALRY'], byHex: { '1,1': ['RANGED'] } }, '1,1', all)).toEqual(['RANGED', 'INFANTRY', 'GUARD', 'CAVALRY', 'SIEGE']));
  it('lists only the kinds the stack fields', () => expect(effectiveCasualtyList(defaults, { order: [], byHex: {} }, null, new Set(['GUARD', 'SIEGE']))).toEqual(['GUARD', 'SIEGE']));
});
