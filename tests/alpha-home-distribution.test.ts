import { describe, expect, it } from 'vitest';
import { HOME_SLOTS, layoutBoard, regionDistances } from '@aoh/game-domain';
import { createAlphaGame } from '@aoh/game-engine';

// Canon (2026-10): the Pátrias maximise the smallest Region-graph distance between any two seats, then the total distance, then the fairness
// of the split; the seed only picks among equal layouts. No fixed distance: whatever the footprint allows.
const board = layoutBoard(2);
const d = (a: string, b: string) => regionDistances(board.cells, a).get(b)!;
const eligible = board.cells.filter(c => c.neighbors.length >= 5).map(c => c.id).filter(id => id !== [...board.cells].sort((a, b) => Math.hypot(a.center.q, a.center.r) - Math.hypot(b.center.q, b.center.r))[0]!.id);
const metrics = (set: readonly string[]) => { const v: number[] = []; for (let a = 0; a < set.length; a++) for (let b = a + 1; b < set.length; b++) v.push(d(set[a]!, set[b]!)); return { min: Math.min(...v), total: v.reduce((x, y) => x + y, 0) }; };
const subsets = (items: string[], size: number): string[][] => size === 0 ? [[]] : items.flatMap((item, i) => subsets(items.slice(i + 1), size - 1).map(rest => [item, ...rest]));

describe('Pátrias initial distribution (maximin on the Region graph)', () => {
  for (const n of [2, 3, 4, 5, 6]) for (const seed of [1, 2, 7, 23]) it(`${n} seats, seed ${seed}: no eligible alternative separates them better`, () => {
    const homes = layoutBoard(n, seed).homeSlots.slice(0, n), got = metrics(homes);
    let bestMin = 0, bestTotal = 0;
    for (const set of subsets(eligible, n)) { const m = metrics(set); if (m.min > bestMin || (m.min === bestMin && m.total > bestTotal)) { bestMin = m.min; bestTotal = m.total; } }
    expect(got.min).toBe(bestMin);
    expect(got.total).toBe(bestTotal);
  });

  it('keeps the seats apart for every table size: nobody starts next to another when an alternative exists', () => {
    for (const n of [2, 3, 4, 5, 6]) expect(metrics(layoutBoard(n, 3).homeSlots.slice(0, n)).min, `${n} seats`).toBeGreaterThanOrEqual(2);
    expect(metrics(layoutBoard(2, 3).homeSlots.slice(0, 2)).min).toBeGreaterThanOrEqual(4);
    expect(metrics(layoutBoard(3, 3).homeSlots.slice(0, 3)).min).toBeGreaterThanOrEqual(4);
    expect(metrics(layoutBoard(4, 3).homeSlots.slice(0, 4)).min).toBeGreaterThanOrEqual(3);
  });

  it('every Pátria has room to grow and the six slots are distinct Regions', () => {
    for (const n of [2, 3, 4, 5, 6]) {
      const slots = layoutBoard(n, 5).homeSlots;
      expect(slots).toHaveLength(HOME_SLOTS); expect(new Set(slots).size).toBe(HOME_SLOTS);
      for (const id of slots) expect(board.cells.find(c => c.id === id)!.neighbors.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('is reproducible for the same seed and size, and the seed changes which Regions are Pátrias', () => {
    expect(layoutBoard(4, 11).homeSlots).toEqual(layoutBoard(4, 11).homeSlots);
    const variants = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(seed => layoutBoard(2, seed).homeSlots.slice(0, 2).join('|')));
    expect(variants.size).toBeGreaterThan(1);
  });

  it('the game uses those Regions: each seat\'s capital stands inside its own Pátria, and nobody else\'s', () => {
    for (const n of [2, 4, 6]) {
      const state = createAlphaGame({ gameId: `home-${n}`, seed: 9, preset: 'QUICK', players: Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` })) });
      const slots = layoutBoard(n, 9).homeSlots;
      state.core.players.forEach((owner, i) => {
        const region = state.regions.find(r => r.id === slots[i])!;
        expect(region.revealedBy).toEqual([owner.id]);
        expect(region.hexIds).toContain(owner.civilization.cities[0]!.hexId);
      });
    }
  });
});
