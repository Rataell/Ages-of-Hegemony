import { describe, expect, it } from 'vitest';
import { boxInsideHex, composeHex, composeProblems, type HexInput } from '../apps/web/app/alpha/hex-compose';

// Visual hierarchy of the Mesa Viva: priority illustrations (pieces, cities, camps, troops) keep their space, and every secondary element
// (level, Ânimo, worked seal, resource seals, name, cost) sits in a free slot INSIDE the same hex, with no overlap. Hard cases from the owner's list.
const R = 52;
const base: HexInput = { feature: 'none', own: 0, foreign: 0, threat: 0, people: false, level: false, mood: false, worked: false, resourceSeals: 0, label: false, cost: false };
const run = (over: Partial<HexInput>, radius = R) => { const layout = composeHex(radius, { ...base, ...over }); return { layout, problems: composeProblems(radius, layout) }; };
const item = (l: ReturnType<typeof composeHex>, id: string) => l.items.find(i => i.id === id)!;

describe('hex composition: the hard cases', () => {
  it('city alone: level, Ânimo, worked seal and name fit around it', () => {
    const { layout, problems } = run({ feature: 'city', level: true, mood: true, worked: true, label: true });
    expect(problems).toEqual([]);
    expect(layout.labelShown).toBe(true);
  });
  it('city with three unit classes: three figures in the bottom band, seals in the corners, the name yields', () => {
    const { layout, problems } = run({ feature: 'city', own: 3, level: true, mood: true, worked: true, label: true });
    expect(problems).toEqual([]);
    expect(layout.labelShown).toBe(false);                      // the bottom band belongs to the troops
    expect(item(layout, 'own')).toMatchObject({ figs: 3, overflow: 0 });
    expect(item(layout, 'own').px).toBeGreaterThanOrEqual(20);
  });
  it('city with four unit classes: two figures and a "+" pill, never shrunk to fit', () => {
    const { layout, problems } = run({ feature: 'city', own: 4, level: true, mood: true, worked: true, resourceSeals: 2 });
    expect(problems).toEqual([]);
    expect(item(layout, 'own')).toMatchObject({ figs: 2, overflow: 2 });
    expect(item(layout, 'own').px).toBeGreaterThanOrEqual(20);
  });
  it('city with two classes: both figures, no pill', () => {
    const { layout, problems } = run({ feature: 'city', own: 2, level: true, mood: true });
    expect(problems).toEqual([]);
    expect(item(layout, 'own')).toMatchObject({ figs: 2, overflow: 0 });
  });
  it('city with a road, a mine seal and a worked seal: the resource seal takes a side slot', () => {
    const { problems } = run({ feature: 'city', own: 1, level: true, mood: true, worked: true, resourceSeals: 2 });
    expect(problems).toEqual([]);
  });
  it('camp with its warriors: both read', () => {
    const { layout, problems } = run({ feature: 'camp', threat: 3, resourceSeals: 2 });
    expect(problems).toEqual([]);
    expect(item(layout, 'threat')).toMatchObject({ figs: 3, overflow: 0 });
    const two = run({ feature: 'camp', threat: 2 });
    expect(two.problems).toEqual([]);
    expect(item(two.layout, 'threat')).toMatchObject({ figs: 2, overflow: 0 });
  });
  it('camp with warriors and a waiting badge', () => {
    const { problems } = run({ feature: 'camp', threat: 2, status: true, resourceSeals: 1 });
    expect(problems).toEqual([]);
  });
  it('a marching band in the field with its badge and a lit-target cost', () => {
    const { problems } = run({ threat: 3, status: true, cost: true });
    expect(problems).toEqual([]);
  });
  it('a draft move arriving at a hex with own troops: the ghosts take the second slot', () => {
    const { layout, problems } = run({ feature: 'city', own: 2, ghost: 2, level: true, mood: true, cost: true });
    expect(problems).toEqual([]);
    expect(layout.items.find(i => i.id === 'ghost')!.figs).toBe(2);
  });
  it('a third group is reported as hidden, never dropped silently', () => {
    const { layout } = run({ own: 1, foreign: 1, threat: 1 });
    expect(layout.hidden).toEqual(['foreign']);                 // the threat and the own group win the two slots
  });
  it('own army inside the camp hex: two groups share the bottom band', () => {
    const { layout, problems } = run({ feature: 'camp', own: 2, threat: 2, resourceSeals: 1 });
    expect(problems).toEqual([]);
    expect(item(layout, 'own').figs).toBe(2);
    expect(item(layout, 'threat').figs).toBe(2);
  });
  it('fleet over a sea resource: the resource is a seal, the fleet keeps the centre at full size', () => {
    const { layout, problems } = run({ own: 1, resourceSeals: 1 });
    expect(problems).toEqual([]);
    expect(item(layout, 'own').px).toBe(30);
  });
  it('two armies in the field (own + foreign) with a worked seal, resource seals and a lit-target cost', () => {
    const { problems } = run({ own: 2, foreign: 2, worked: true, cost: true, resourceSeals: 2 });
    expect(problems).toEqual([]);
  });
  it('a lit target over a city with troops: the cost number has its own slot', () => {
    const { problems } = run({ feature: 'city', own: 2, level: true, mood: true, cost: true });
    expect(problems).toEqual([]);
  });
  it('independent people with troops standing on it', () => {
    const { problems } = run({ people: true, own: 2, label: false, resourceSeals: 1 });
    expect(problems).toEqual([]);
  });
  it('independent people with a name plate and resource seals', () => {
    const { layout, problems } = run({ people: true, label: true, resourceSeals: 2, cost: true });
    expect(problems).toEqual([]);
    expect(layout.labelShown).toBe(true);
  });
  it('holds at the minimum, normal and maximum zoom radii (slots scale with R; the compositor never shrinks a figure to fit)', () => {
    for (const radius of [26, 34, 52, 64]) {
      const { problems } = run({ feature: 'city', own: 3, level: true, mood: true, worked: true, label: true, resourceSeals: 1 }, radius);
      expect(problems, `R=${radius}`).toEqual([]);
    }
  });
  it('every placed box stays inside the hexagon', () => {
    const { layout } = run({ feature: 'city', own: 2, foreign: 1, level: true, mood: true, worked: true, resourceSeals: 2, cost: true, label: true });
    for (const it of layout.items) expect(boxInsideHex(R, it.box), it.id).toBe(true);
  });
});
