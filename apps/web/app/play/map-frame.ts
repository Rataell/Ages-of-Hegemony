/** Pure geometry for the atlas: where tiles sit and which frame shows exactly the tiles the server projected. No React, no state. */
export const position = (q: number, r: number) => ({
  x: 80 + 56 * Math.sqrt(3) * (q + r / 2),
  y: 80 + 84 * r,
});

/** A pointy-top hex of radius 52 spans about 90 by 104 units. */
export const HEX_HALF_WIDTH = 45;
export const HEX_HALF_HEIGHT = 52;

export interface MapFrame { x: number; y: number; width: number; height: number; cx: number; cy: number }
export interface FrameOptions { padding?: number; minWidth?: number; minHeight?: number }

/**
 * The frame that fits the given tiles plus a small margin. Only the tiles passed in are measured, so nothing the server did not
 * project can widen it. The minimum size only guards against a degenerate one-hex atlas; it is far below the old 600 x 500.
 */
export function mapFrame(tiles: readonly { q: number; r: number }[], { padding = 24, minWidth = 300, minHeight = 260 }: FrameOptions = {}): MapFrame {
  if (tiles.length === 0) return { x: 0, y: 0, width: 600, height: 500, cx: 300, cy: 250 };
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
  for (const tile of tiles) {
    const { x, y } = position(tile.q, tile.r);
    left = Math.min(left, x - HEX_HALF_WIDTH); right = Math.max(right, x + HEX_HALF_WIDTH);
    top = Math.min(top, y - HEX_HALF_HEIGHT); bottom = Math.max(bottom, y + HEX_HALF_HEIGHT);
  }
  const cx = (left + right) / 2, cy = (top + bottom) / 2;
  const width = Math.max(right - left + 2 * padding, minWidth), height = Math.max(bottom - top + 2 * padding, minHeight);
  return { x: cx - width / 2, y: cy - height / 2, width, height, cx, cy };
}

export const MIN_ZOOM = 0.5, MAX_ZOOM = 4;
export const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

/** The viewBox for a fitted atlas (view === null) or a zoomed one centred on (cx, cy); zoom 1 shows the whole frame. */
export function viewBoxOf(frame: MapFrame, view: { cx: number; cy: number; zoom: number } | null): string {
  if (!view) return `${frame.x} ${frame.y} ${frame.width} ${frame.height}`;
  const width = frame.width / view.zoom, height = frame.height / view.zoom;
  return `${view.cx - width / 2} ${view.cy - height / 2} ${width} ${height}`;
}
/** Keeps the centre inside the known area so the atlas can never be dragged into empty space. */
export const clampCentre = (frame: MapFrame, cx: number, cy: number) => ({
  cx: Math.min(frame.x + frame.width, Math.max(frame.x, cx)), cy: Math.min(frame.y + frame.height, Math.max(frame.y, cy)),
});

/** Tooltip / accessible text of a tile. Unexplored tiles say nothing about owner or control: "Livre" would claim knowledge the player does not have. */
export function tileSummary(tile: { terrain: string; id: string; ownerName: string | undefined; controllerCityId: string | null }, terrainLabel: string): string {
  if (tile.terrain === 'UNKNOWN') return `${terrainLabel} · ${tile.id}`;
  return `${terrainLabel} · ${tile.id} · ${tile.ownerName ?? 'Livre'} · Controle: ${tile.controllerCityId ?? 'nenhum'}`;
}

/** Table camera (Mesa): the whole board always fits inside the safe rectangle, i.e. clear of the top strip, the bottom tray and the hand. */
export interface SafeInsets { top: number; bottom: number; left: number; right: number }
export interface ViewportSize { w: number; h: number }
export const DEFAULT_SAFE: SafeInsets = { top: 76, bottom: 132, left: 16, right: 16 };
/** Pixels per map unit that make `frame` just fit the safe rectangle. */
export const fitScale = (frame: MapFrame, size: ViewportSize, safe: SafeInsets) =>
  Math.max(0.05, Math.min((size.w - safe.left - safe.right) / frame.width, (size.h - safe.top - safe.bottom) / frame.height));
/** viewBox for a camera: `view === null` is MESA (whole board fitted); otherwise zoom is relative to that fit and (cx, cy) lands on the centre of the safe rectangle. */
export function cameraBox(frame: MapFrame, size: ViewportSize, safe: SafeInsets, view: { cx: number; cy: number; zoom: number } | null): { viewBox: string; scale: number } {
  const scale = fitScale(frame, size, safe) * (view?.zoom ?? 1), cx = view?.cx ?? frame.cx, cy = view?.cy ?? frame.cy;
  const sx = (safe.left + (size.w - safe.right)) / 2, sy = (safe.top + (size.h - safe.bottom)) / 2;
  return { viewBox: `${cx - sx / scale} ${cy - sy / scale} ${size.w / scale} ${size.h / scale}`, scale };
}
/** The outline of a group of equal hexes (radius r, centres given): the edges that belong to exactly one hex, as an SVG path. */
export function regionOutline(centres: readonly { x: number; y: number }[], r: number): string {
  const key = (x: number, y: number) => `${x.toFixed(1)},${y.toFixed(1)}`, edges = new Map<string, [number, number, number, number]>(), count = new Map<string, number>();
  for (const c of centres) {
    const corners = Array.from({ length: 6 }, (_, i) => { const a = ((60 * i - 30) * Math.PI) / 180; return [c.x + r * Math.cos(a), c.y + r * Math.sin(a)] as const; });
    for (let i = 0; i < 6; i++) {
      const a = corners[i]!, b = corners[(i + 1) % 6]!, id = [key(a[0], a[1]), key(b[0], b[1])].sort().join('|');
      edges.set(id, [a[0], a[1], b[0], b[1]]); count.set(id, (count.get(id) ?? 0) + 1);
    }
  }
  return [...edges].filter(([id]) => count.get(id) === 1).map(([, e]) => `M${e[0].toFixed(1)},${e[1].toFixed(1)}L${e[2].toFixed(1)},${e[3].toFixed(1)}`).join('');
}
