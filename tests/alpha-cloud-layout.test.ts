import { describe, expect, it } from 'vitest';
import { DEFAULT_SAFE, NODE, PHONE_BOTTOM, layoutCloud, phoneSafe } from '../apps/web/app/alpha/cloud-layout.js';

// Interaction Model V2: the cloud is anchored to the piece, always inside the safe area, never on top of the piece and never overlapping itself.
const size = { w: 1280, h: 720 }, plate = { w: 184, h: 54 }, card = { w: 252, h: 168 };
const rect = (r: { x: number; y: number; w: number; h: number }) => ({ l: r.x - r.w / 2, r: r.x + r.w / 2, t: r.y - r.h / 2, b: r.y + r.h / 2 });
const overlap = (a: ReturnType<typeof rect>, b: ReturnType<typeof rect>) => a.l < b.r - 2 && b.l < a.r - 2 && a.t < b.b - 2 && b.t < a.b - 2;
const anchors = [[640, 360], [40, 100], [1240, 100], [40, 640], [1240, 640], [640, 90], [640, 620], [20, 360]];

describe('Table cloud layout', () => {
  for (const [x, y] of anchors) for (const count of [1, 3, 5, 6]) it(`anchor ${x},${y} with ${count} node(s) stays inside the safe area and apart`, () => {
    const anchor = { x: x!, y: y!, r: 16 }, place = layoutCloud(anchor, size, DEFAULT_SAFE, count, plate);
    const all = [...place.nodes, place.plate];
    for (const r of all) {
      const box = rect(r);
      expect(box.l).toBeGreaterThanOrEqual(DEFAULT_SAFE.left - 0.5); expect(box.r).toBeLessThanOrEqual(size.w - DEFAULT_SAFE.right + 0.5);
      expect(box.t).toBeGreaterThanOrEqual(DEFAULT_SAFE.top - 0.5); expect(box.b).toBeLessThanOrEqual(size.h - DEFAULT_SAFE.bottom + 0.5);
    }
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(overlap(rect(all[i]!), rect(all[j]!)), `${i} overlaps ${j}`).toBe(false);
  });

  it('opens toward the middle of the table: an anchor at the left edge gets its nodes to its right', () => {
    const place = layoutCloud({ x: 60, y: 360, r: 16 }, size, DEFAULT_SAFE, 4, plate);
    expect(place.nodes.every(node => node.x > 60)).toBe(true);
  });

  it('never covers the piece it belongs to: a confirm card with no nodes stands clear of the anchor', () => {
    for (const [x, y] of anchors) {
      const anchor = { x: x!, y: y!, r: 18 }, place = layoutCloud(anchor, size, DEFAULT_SAFE, 0, card), box = rect(place.plate);
      const nearestX = Math.max(box.l, Math.min(anchor.x, box.r)), nearestY = Math.max(box.t, Math.min(anchor.y, box.b));
      expect(Math.hypot(anchor.x - nearestX, anchor.y - nearestY), `card over the piece at ${x},${y}`).toBeGreaterThan(anchor.r - 1);
    }
  });

  it('keeps nodes big enough to touch', () => {
    expect(NODE.h).toBeGreaterThanOrEqual(36); expect(NODE.w).toBeGreaterThanOrEqual(96);
  });
});

describe('phone safe area', () => {
  it('keeps a Ficha or sheet above the 118 px tray, the map tools and the hand drawer on phones only', () => {
    expect(phoneSafe(DEFAULT_SAFE, 390).bottom).toBe(PHONE_BOTTOM);
    expect(phoneSafe(DEFAULT_SAFE, 760).bottom).toBe(PHONE_BOTTOM);
    expect(phoneSafe(DEFAULT_SAFE, 1280)).toBe(DEFAULT_SAFE);
    expect(phoneSafe({ ...DEFAULT_SAFE, bottom: 220 }, 390).bottom).toBe(220);   // never reduces a larger margin
  });
});
