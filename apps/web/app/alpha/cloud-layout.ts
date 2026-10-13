/** Geometry of the Table cloud, kept free of React so it can be tested: where the nodes and the plate go around an anchor. */
export interface Safe { top: number; right: number; bottom: number; left: number }
export const DEFAULT_SAFE: Safe = { top: 78, right: 16, bottom: 98, left: 16 };
/** On a phone the tray is 118 px tall with the map tools and the hand drawer above it (alpha.css): a Ficha or sheet must end above all of that, or the bar hides its Confirmar button. */
export const PHONE_BOTTOM = 174;
export function phoneSafe(safe: Safe, width: number): Safe { return width <= 760 && safe.bottom < PHONE_BOTTOM ? { ...safe, bottom: PHONE_BOTTOM } : safe; }
export interface Anchor { x: number; y: number; r: number }
export interface Size { w: number; h: number }

export const NODE = { w: 112, h: 38 };
export const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));
/** Arc of nodes facing the middle of the table, pushed inside the safe area and apart from each other. The plate sits on the far side. */
export type Box = { x: number; y: number; w: number; h: number };
const hits = (a: Box, b: Box, gap = 6) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 + gap && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + gap;

/**
 * Nodes on an arc facing the middle of the table; each takes the free spot nearest its ideal angle (then a wider ring) that is inside the safe
 * area, clear of the piece and of the others. The plate stands on the far side, also clear of the piece. Corner anchors therefore fan out
 * instead of piling up against the wall.
 */
export function layoutCloud(anchor: Anchor, size: Size, safe: Safe, count: number, plate: Size, avoid: readonly Box[] = []) {
  const radius = Math.max(92, anchor.r + 58);
  const cx = (safe.left + size.w - safe.right) / 2, cy = (safe.top + size.h - safe.bottom) / 2;
  const toward = Math.hypot(cx - anchor.x, cy - anchor.y) < 40 ? -Math.PI / 2 : Math.atan2(cy - anchor.y, cx - anchor.x);
  const step = count > 1 ? Math.min(54, 200 / (count - 1)) * Math.PI / 180 : 0;
  const inside = (b: Box) => b.x - b.w / 2 >= safe.left && b.x + b.w / 2 <= size.w - safe.right && b.y - b.h / 2 >= safe.top && b.y + b.h / 2 <= size.h - safe.bottom;
  const piece: Box = { x: anchor.x, y: anchor.y, w: anchor.r * 2 + 10, h: anchor.r * 2 + 10 };
  const taken: Box[] = [piece, ...avoid];
  const free = (b: Box) => inside(b) && !taken.some(other => hits(b, other));
  const around = (ideal: number, w: number, h: number, radii: number[]): Box | null => {
    for (const r of radii) for (let k = 0; k <= 15; k++) for (const sign of k === 0 ? [1] : [1, -1]) {
      const angle = ideal + sign * k * (12 * Math.PI) / 180, box = { x: anchor.x + r * Math.cos(angle), y: anchor.y + r * Math.sin(angle), w, h };
      if (free(box)) return box;
    }
    return null;
  };
  const rects: Box[] = new Array(count);
  const mid = (count - 1) / 2, order = Array.from({ length: count }, (_, i) => i).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b);
  for (const i of order) {
    const ideal = toward + (i - mid) * step;
    const spot = around(ideal, NODE.w, NODE.h, Array.from({ length: 8 }, (_, k) => radius + k * 46)) ?? { x: clamp(anchor.x + radius * Math.cos(ideal), safe.left + NODE.w / 2, size.w - safe.right - NODE.w / 2), y: clamp(anchor.y + radius * Math.sin(ideal), safe.top + NODE.h / 2, size.h - safe.bottom - NODE.h / 2), w: NODE.w, h: NODE.h };
    rects[i] = spot; taken.push(spot);
  }
  const side = count === 0 ? toward : toward + Math.PI;
  const reach = Math.abs(Math.cos(side)) * plate.w / 2 + Math.abs(Math.sin(side)) * plate.h / 2 + anchor.r + 14;
  const radii = Array.from({ length: 14 }, (_, k) => Math.max(radius * 0.9, reach) + k * 22);
  const box = around(side, plate.w, plate.h, radii) ?? { x: clamp(anchor.x + radii[0]! * Math.cos(side), safe.left + plate.w / 2, size.w - safe.right - plate.w / 2), y: clamp(anchor.y + radii[0]! * Math.sin(side), safe.top + plate.h / 2, size.h - safe.bottom - plate.h / 2), w: plate.w, h: plate.h };
  return { nodes: rects, plate: box };
}
