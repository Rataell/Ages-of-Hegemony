/**
 * Table art (Experience V2.2, UXDEC-016…020; RC 1.2 material culture). Every function returns an SVG fragment centered on (0,0)
 * for the map's hex frame. Shape says what a thing is; the SEAT color and the SEAT SEAL say which player; the civilization's
 * material culture (architecture, walls, port, standard, emblem) says which civilization, so it survives another seat color,
 * grayscale and 16 px. Pure string builders: no DOM, no imports at runtime (scripts/design-system.mjs bundles this file).
 */
import type { CivilizationMark, Emblem } from '@aoh/game-domain';

export const INK = '#0b1114';
export const LIGHT = '#f4ecd8';
/**
 * The six canonical ownership colors (RC 1.2). They identify the PLAYER, never the civilization. Picked on the dark board for
 * the largest minimum distance under normal vision, deuteranopia and protanopia, with a grayscale ladder (L* ≈ 48 · 57 · 65 ·
 * 73 · 82 · 90) so even a gray screenshot keeps them apart; the seat seal (below) removes any doubt. No gold (UXDEC-020).
 */
export const SEAT_COLORS = ['#60a3e9', '#dd220e', '#90e14e', '#d546f7', '#5bfadd', '#fe94b4'] as const;
export const SEAT_NAMES = ['Azul', 'Vermelho', 'Verde', 'Violeta', 'Ciano', 'Rosa'] as const;
const wrap6 = (index: number) => ((index % 6) + 6) % 6;
export const seatColor = (index: number) => SEAT_COLORS[wrap6(index)]!;

const f1 = (n: number) => Math.round(n * 10) / 10;
function rng(seed: number) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
export function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i]! - v) * t).toString(16).padStart(2, '0')).join('');
}
const sh = (c: string, t: number) => mix(c, '#000000', t);
const hi = (c: string, t: number) => mix(c, '#ffffff', t);
export const seedOf = (text: string) => [...text].reduce((total, ch) => (total * 31 + ch.charCodeAt(0)) >>> 0, 7);
export function hexPoints(r: number, cx = 0, cy = 0): [number, number][] { return Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number]; }); }
export function hexPath(r: number, cx = 0, cy = 0) { return hexPoints(r, cx, cy).map((p, i) => `${i ? 'L' : 'M'}${f1(p[0])},${f1(p[1])}`).join('') + 'Z'; }
const inHex = (x: number, y: number, r: number) => Math.abs(x) <= r * 0.866 && Math.abs(y) + Math.abs(x) / 1.732 <= r;
type Pt = [number, number];
const pd = (pts: readonly Pt[]) => 'M' + pts.map(p => `${f1(p[0])},${f1(p[1])}`).join('L') + 'Z';
const ell = (x: number, y: number, rx: number, ry: number) => `M${f1(x - rx)},${f1(y)}a${f1(rx)},${f1(ry)} 0 1,0 ${f1(2 * rx)},0a${f1(rx)},${f1(ry)} 0 1,0 ${f1(-2 * rx)},0Z`;
/** Small bounded string cache: the map asks for the same city, port and marker every render. */
const CACHE = new Map<string, string>();
function memo(key: string, build: () => string) {
  const hit = CACHE.get(key);
  if (hit !== undefined) return hit;
  const value = build();
  if (CACHE.size > 600) CACHE.clear();
  CACHE.set(key, value);
  return value;
}

/* --------------------------------------------------------------- seat seals */
/** Per-seat glyph, so six players separate without hue: dot · bar · chevron · diamond · ring · cross (seat index 0…5). */
export const SEAT_SEALS = ['dot', 'bar', 'chevron', 'diamond', 'ring', 'cross'] as const;
export function seatGlyph(index: number, size: number, color: string = INK) {
  const s = size, w = f1(s * 0.13);
  switch (SEAT_SEALS[wrap6(index)]) {
    case 'dot': return `<circle r="${f1(s * 0.17)}" fill="${color}"/>`;
    case 'bar': return `<rect x="${f1(-s * 0.27)}" y="${f1(-s * 0.085)}" width="${f1(s * 0.54)}" height="${f1(s * 0.17)}" rx="${f1(s * 0.03)}" fill="${color}"/>`;
    case 'chevron': return `<path d="M${f1(-s * 0.24)},${f1(s * 0.12)}L0,${f1(-s * 0.15)}L${f1(s * 0.24)},${f1(s * 0.12)}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    case 'diamond': return `<path d="M0,${f1(-s * 0.23)}L${f1(s * 0.19)},0L0,${f1(s * 0.23)}L${f1(-s * 0.19)},0Z" fill="${color}"/>`;
    case 'ring': return `<circle r="${f1(s * 0.19)}" fill="none" stroke="${color}" stroke-width="${f1(s * 0.1)}"/>`;
    default: return `<path d="M0,${f1(-s * 0.23)}V${f1(s * 0.23)}M${f1(-s * 0.23)},0H${f1(s * 0.23)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
  }
}
/** The seat seal: a disc in the seat color with the seat glyph in ink. Fragment centered on (0,0), `size` = diameter. */
export function seatSeal(index: number, color: string = seatColor(index), size = 16) {
  return `<g class="seat-seal" data-seat="${wrap6(index) + 1}"><circle r="${f1(size / 2)}" fill="${color}" stroke="${INK}" stroke-width="${f1(Math.max(0.8, size * 0.09))}"/>${seatGlyph(index, size)}</g>`;
}
/** The same seal as a standalone <svg> (strip, plates, lobby). */
export const seatSealSvg = (index: number, color: string = seatColor(index), px = 16) =>
  `<svg width="${px}" height="${px}" viewBox="${f1(-px / 2 - 1)} ${f1(-px / 2 - 1)} ${px + 2} ${px + 2}" aria-hidden="true">${seatSeal(index, color, px)}</svg>`;

/* -------------------------------------------------------- material culture */
export type CultureId = 'hellenes' | 'egyptians' | 'mesopotamians' | 'persians' | 'israel' | 'romans' | 'norse' | 'chinese' | 'india' | 'incas' | 'neutral';
type House = 'gable' | 'flat' | 'long' | 'curved' | 'thatch' | 'veranda';
type Pattern = 'meander' | 'lotus' | 'brick' | 'rosette' | 'pomegranate' | 'ovolo' | 'knot' | 'leiwen' | 'jali' | 'tocapu' | 'none';
type Tower = 'round' | 'square' | 'buttress' | 'timber' | 'pylon' | 'curved' | 'none';
type Boat = 'trireme' | 'papyrus' | 'quffa' | 'galley' | 'gaulos' | 'liburna' | 'drakkar' | 'junk' | 'dhow' | 'totora' | 'plain';
interface Culture { house: House; wall: string; top: string; roof: string; plinth: string; side: string; accent: string; metal: string; pattern: Pattern; wallMat: string; tower: Tower; boat: Boat; pier: string; timberPier: boolean; garden?: boolean; courtyard?: boolean }
/** Material culture of the ten civilizations (docs/product/aoh-historical-civilizations-core10-figures-v1.md §10 and per-civ blocks). The seat color is NOT here. */
const CULTURES: Record<CultureId, Culture> = {
  hellenes: { house: 'gable', wall: '#ece5d2', top: '#ece5d2', roof: '#b46d4c', plinth: '#d8cfb6', side: '#a3977b', accent: '#7f8a8f', metal: '#b8914d', pattern: 'meander', wallMat: '#dcd5c2', tower: 'round', boat: 'trireme', pier: '#d7cfba', timberPier: false },
  egyptians: { house: 'flat', wall: '#d6bf92', top: '#eadcb6', roof: '#eadcb6', plinth: '#e2d4a8', side: '#b09868', accent: '#3f8f9a', metal: '#c9a54e', pattern: 'lotus', wallMat: '#c9ad7a', tower: 'pylon', boat: 'papyrus', pier: '#ddcfa6', timberPier: false },
  mesopotamians: { house: 'flat', wall: '#b78c5e', top: '#cfa577', roof: '#cfa577', plinth: '#aa8259', side: '#7a5b3c', accent: '#2f6f8f', metal: '#c9a54e', pattern: 'brick', wallMat: '#a37a50', tower: 'buttress', boat: 'quffa', pier: '#a9825a', timberPier: false },
  persians: { house: 'flat', wall: '#c6bca6', top: '#d8cfb8', roof: '#d8cfb8', plinth: '#b9af99', side: '#857c68', accent: '#2f5f8f', metal: '#c9a54e', pattern: 'rosette', wallMat: '#b7ad96', tower: 'square', boat: 'galley', pier: '#b9af99', timberPier: false, garden: true },
  israel: { house: 'flat', wall: '#e2d6b4', top: '#ece2c6', roof: '#ece2c6', plinth: '#cfc19a', side: '#988864', accent: '#a8603f', metal: '#b08a4a', pattern: 'pomegranate', wallMat: '#d3c59f', tower: 'square', boat: 'gaulos', pier: '#d3c59f', timberPier: false, courtyard: true },
  romans: { house: 'gable', wall: '#e4d8bd', top: '#e4d8bd', roof: '#a8573a', plinth: '#a6a197', side: '#77726b', accent: '#8f8a82', metal: '#b8914d', pattern: 'ovolo', wallMat: '#b98a6c', tower: 'square', boat: 'liburna', pier: '#bdb7aa', timberPier: false },
  norse: { house: 'long', wall: '#5c4632', top: '#5c4632', roof: '#66703f', plinth: '#665640', side: '#3e3326', accent: '#8a3f3a', metal: '#9aa4a6', pattern: 'knot', wallMat: '#6e5439', tower: 'timber', boat: 'drakkar', pier: '#73583b', timberPier: true },
  chinese: { house: 'curved', wall: '#b9a27c', top: '#4c5357', roof: '#4c5357', plinth: '#958a78', side: '#655c4e', accent: '#9a4a3a', metal: '#b8914d', pattern: 'leiwen', wallMat: '#a8906b', tower: 'curved', boat: 'junk', pier: '#7d4b36', timberPier: true },
  india: { house: 'veranda', wall: '#d4a171', top: '#ead8ba', roof: '#ead8ba', plinth: '#c48c5b', side: '#8c5d39', accent: '#3d5f7a', metal: '#b8914d', pattern: 'jali', wallMat: '#c68e5e', tower: 'square', boat: 'dhow', pier: '#cc9c6b', timberPier: false },
  incas: { house: 'thatch', wall: '#aca796', top: '#c9ab66', roof: '#c6a45d', plinth: '#9c9786', side: '#6b6757', accent: '#a54a3a', metal: '#c9a54e', pattern: 'tocapu', wallMat: '#a39e8b', tower: 'none', boat: 'totora', pier: '#a39e8b', timberPier: false },
  neutral: { house: 'gable', wall: '#cdc5b1', top: '#cdc5b1', roof: '#8f8678', plinth: '#aaa496', side: '#77726a', accent: '#7d8a8a', metal: '#a89a7a', pattern: 'none', wallMat: '#aea797', tower: 'square', boat: 'plain', pier: '#aaa496', timberPier: false },
};
const CHASSIS_CULTURE: Record<string, CultureId> = { valgard: 'hellenes', nymara: 'egyptians', meridia: 'mesopotamians', dravik: 'persians', solenne: 'israel', kor: 'romans', thalos: 'norse', orinth: 'chinese', saren: 'india', aurelia: 'incas' };
/** Accepts the hidden chassis id (`valgard`…) or the CORE 10 id (`hellenes`…); anything else is the neutral style. */
export const cultureOf = (civilization?: string | null): CultureId =>
  !civilization ? 'neutral' : CHASSIS_CULTURE[civilization] ?? (civilization in CULTURES ? civilization as CultureId : 'neutral');
export const CULTURE_IDS: readonly CultureId[] = ['hellenes', 'egyptians', 'mesopotamians', 'persians', 'israel', 'romans', 'norse', 'chinese', 'india', 'incas'];

/* ------------------------------------------------------------ 3D primitives */
/** Cabinet projection: footprint (w × d) in plan, height h straight up the screen; light from the upper left. */
type Lod = 'mesa' | 'focus' | 'detail';
interface K { ol: string; lod: Lod; c: Culture; near: boolean }
const kOf = (c: Culture, lod: Lod, sw: number): K => ({ ol: ` stroke="#1d1810" stroke-opacity=".62" stroke-width="${f1(sw * 10) / 10}" stroke-linejoin="round"`, lod, c, near: lod !== 'mesa' });
const fl = (k: K, d: string, color: string, extra = '') => `<path d="${d}" fill="${color}"${k.ol}${extra}/>`;
const fp = (d: string, color: string, extra = '') => `<path d="${d}" fill="${color}"${extra}/>`;
const ln = (d: string, color: string, w: number, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${f1(w * 10) / 10}" stroke-linecap="round"${extra}/>`;
function box(k: K, x: number, y: number, w: number, d: number, h: number, front: string, top: string) {
  const l = x - w / 2, r = x + w / 2, t = y - d / 2, b = y + d / 2;
  return fl(k, pd([[l, b - h], [r, b - h], [r, b], [l, b]]), front) + fl(k, pd([[l, t - h], [r, t - h], [r, b - h], [l, b - h]]), top);
}
function door(k: K, x: number, b: number, w: number, h: number, color = '#2a221a') { return k.near ? fp(pd([[x - w / 2, b - h], [x + w / 2, b - h], [x + w / 2, b], [x - w / 2, b]]), color) : ''; }
/** Gable roof, ridge along x. */
function roofX(k: K, x: number, y: number, w: number, d: number, h: number, roof: string, ov = 1) {
  const l = x - w / 2 - ov, r = x + w / 2 + ov, t = y - d / 2 - h - ov * 0.3, b = y + d / 2 - h + ov * 0.7, m = y - h - d * 0.22;
  return fl(k, pd([[l, t], [r, t], [r, m], [l, m]]), hi(roof, 0.2)) + fl(k, pd([[l, m], [r, m], [r, b], [l, b]]), roof)
    + (k.near ? ln(`M${f1(l)},${f1(m)}H${f1(r)}`, sh(roof, 0.4), 0.5) + ln(`M${f1(l + 0.4)},${f1((m + b) / 2)}H${f1(r - 0.4)}`, sh(roof, 0.2), 0.3) : '');
}
function gableHouse(k: K, x: number, y: number, w: number, d: number, h: number, wall: string, roof: string) {
  const b = y + d / 2;
  return fl(k, pd([[x - w / 2, b - h], [x + w / 2, b - h], [x + w / 2, b], [x - w / 2, b]]), wall) + door(k, x - w * 0.15, b, Math.max(0.9, w * 0.14), h * 0.55) + roofX(k, x, y, w, d, h, roof, Math.min(1.2, w * 0.09));
}
function flatHouse(k: K, x: number, y: number, w: number, d: number, h: number, wall: string, top: string) {
  let g = box(k, x, y, w, d, h, wall, top);
  if (k.near) g += ln(`M${f1(x - w / 2 + 0.5)},${f1(y - d / 2 - h + 0.6)}H${f1(x + w / 2 - 0.5)}V${f1(y + d / 2 - h - 0.5)}`, sh(top, 0.18), 0.45) + door(k, x + w * 0.18, y + d / 2, Math.max(0.9, w * 0.13), h * 0.55);
  return g;
}
/** Hall with a gabled front (pediment) and a front colonnade; ridge along y. Base at y, standing on a stylobate. */
function temple(k: K, x: number, y: number, w: number, d: number, h: number, wall: string, roof: string, cols: number) {
  let g = box(k, x, y + 0.4, w + 2.2, d + 2.2, 1.4, sh(wall, 0.2), hi(wall, 0.05));
  const l = x - w / 2, r = x + w / 2, B = y + d / 2 - 1.4, T = y - d / 2 - 1.4, e = 1.5, ph = Math.min(w * 0.24, h * 0.62);
  g += fl(k, pd([[l, B - h], [r, B - h], [r, B], [l, B]]), sh(wall, 0.58));
  const cw = (w / cols) * 0.46;
  for (let i = 0; i < cols; i++) { const cx = l + (i + 0.5) * (w / cols); g += fp(pd([[cx - cw / 2, B - h], [cx + cw / 2, B - h], [cx + cw / 2, B], [cx - cw / 2, B]]), wall) + fp(pd([[cx + cw * 0.1, B - h], [cx + cw / 2, B - h], [cx + cw / 2, B], [cx + cw * 0.1, B]]), sh(wall, 0.14)); }
  const E = B - h;
  g += fl(k, pd([[l - 0.6, E - e], [r + 0.6, E - e], [r + 0.6, E], [l - 0.6, E]]), hi(wall, 0.06));
  g += fl(k, pd([[l - 0.8, T - h - e], [x, T - h - e - ph], [x, E - e - ph], [l - 0.8, E - e]]), hi(roof, 0.16));
  g += fl(k, pd([[x, T - h - e - ph], [r + 0.8, T - h - e], [r + 0.8, E - e], [x, E - e - ph]]), sh(roof, 0.16));
  g += fl(k, pd([[l - 0.8, E - e], [x, E - e - ph], [r + 0.8, E - e]]), hi(wall, 0.1));
  if (k.near) g += fp(pd([[l + 1.6, E - e - 0.4], [x, E - e - ph + 1.1], [r - 1.6, E - e - 0.4]]), sh(wall, 0.18));
  return g;
}
/** Long colonnade (stoa, portico, talar): dark interior, columns, a roof along x. */
function colonnade(k: K, x: number, y: number, w: number, d: number, h: number, col: string, roof: string, cols: number, flatTop = false) {
  const l = x - w / 2, r = x + w / 2, b = y + d / 2;
  let g = fl(k, pd([[l, b - h], [r, b - h], [r, b], [l, b]]), sh(col, 0.6));
  const cw = (w / cols) * 0.42;
  for (let i = 0; i < cols; i++) { const cx = l + (i + 0.5) * (w / cols); g += fp(pd([[cx - cw / 2, b - h], [cx + cw / 2, b - h], [cx + cw / 2, b], [cx - cw / 2, b]]), col); }
  return g + (flatTop ? fl(k, pd([[l - 0.6, y - d / 2 - h], [r + 0.6, y - d / 2 - h], [r + 0.6, b - h], [l - 0.6, b - h]]), roof) : roofX(k, x, y, w, d, h, roof, 1));
}
function cyl(k: K, x: number, y: number, rad: number, h: number, side: string, top: string) {
  const ry = rad * 0.42;
  return fl(k, `M${f1(x - rad)},${f1(y - h)}L${f1(x - rad)},${f1(y)}A${f1(rad)},${f1(ry)} 0 0 0 ${f1(x + rad)},${f1(y)}L${f1(x + rad)},${f1(y - h)}Z`, side)
    + fp(`M${f1(x + rad * 0.35)},${f1(y - h)}L${f1(x + rad * 0.35)},${f1(y + ry * 0.9)}A${f1(rad)},${f1(ry)} 0 0 0 ${f1(x + rad)},${f1(y)}L${f1(x + rad)},${f1(y - h)}Z`, '#00000026')
    + fl(k, ell(x, y - h, rad, ry), top);
}
function dome(k: K, x: number, y: number, rad: number, color: string, tall = 1) {
  return fl(k, `M${f1(x - rad)},${f1(y)}A${f1(rad)},${f1(rad * tall)} 0 0 1 ${f1(x + rad)},${f1(y)}A${f1(rad)},${f1(rad * 0.42)} 0 0 1 ${f1(x - rad)},${f1(y)}Z`, color)
    + fp(ell(x - rad * 0.35, y - rad * tall * 0.55, rad * 0.28, rad * tall * 0.2), '#ffffff40');
}
function cone(k: K, x: number, y: number, rad: number, h: number, color: string) {
  return fl(k, `M${f1(x - rad)},${f1(y)}L${f1(x)},${f1(y - h)}L${f1(x + rad)},${f1(y)}A${f1(rad)},${f1(rad * 0.42)} 0 0 1 ${f1(x - rad)},${f1(y)}Z`, color) + fp(pd([[x, y - h], [x + rad, y], [x + rad * 0.2, y + rad * 0.4]]), '#00000030');
}
function pyramid(k: K, x: number, y: number, w: number, d: number, h: number, c: string) {
  const l = x - w / 2, r = x + w / 2, t = y - d / 2, b = y + d / 2, A: Pt = [x, y - h];
  return fl(k, pd([[l, b], [l, t], A]), hi(c, 0.15)) + fl(k, pd([[r, t], [r, b], A]), sh(c, 0.3)) + fl(k, pd([[l, b], [r, b], A]), c);
}
function obelisk(k: K, x: number, y: number, w: number, h: number, c: string, tip: string) {
  return fl(k, pd([[x - w / 2, y], [x + w / 2, y], [x + w * 0.32, y - h], [x - w * 0.32, y - h]]), c) + fp(pd([[x, y], [x + w / 2, y], [x + w * 0.32, y - h], [x, y - h]]), '#00000024') + fl(k, pd([[x - w * 0.32, y - h], [x + w * 0.32, y - h], [x, y - h - w * 0.75]]), tip);
}
/** Hip roof with upturned eaves (Chinese). */
function curvedRoof(k: K, x: number, y: number, w: number, d: number, h: number, roof: string) {
  const ov = Math.max(1.3, w * 0.13), l = x - w / 2 - ov, r = x + w / 2 + ov, eb = y + d / 2 - h + ov * 0.35, et = y - d / 2 - h, ry = y - h - d * 0.3, hw = w * 0.28;
  let g = fl(k, pd([[l + ov * 0.6, et], [r - ov * 0.6, et], [x + hw, ry], [x - hw, ry]]), hi(roof, 0.22));
  g += fl(k, `M${f1(l)},${f1(eb - ov * 1.1)}Q${f1(l + ov * 0.5)},${f1(eb)} ${f1(l + ov * 1.6)},${f1(eb)}L${f1(r - ov * 1.6)},${f1(eb)}Q${f1(r - ov * 0.5)},${f1(eb)} ${f1(r)},${f1(eb - ov * 1.1)}L${f1(x + hw)},${f1(ry)}L${f1(x - hw)},${f1(ry)}Z`, roof);
  g += ln(`M${f1(x - hw - 1.2)},${f1(ry - 0.9)}L${f1(x + hw + 1.2)},${f1(ry - 0.9)}`, sh(roof, 0.45), 1.1);
  if (k.near) for (let i = 1; i < 5; i++) { const t = i / 5; g += ln(`M${f1(x - hw + (2 * hw) * t)},${f1(ry)}L${f1(l + ov * 1.6 + (r - l - ov * 3.2) * t)},${f1(eb)}`, sh(roof, 0.25), 0.35); }
  return g;
}
function curvedHall(k: K, x: number, y: number, w: number, d: number, h: number, wall: string, roof: string, post: string) {
  const l = x - w / 2, r = x + w / 2, b = y + d / 2;
  let g = fl(k, pd([[l, b - h], [r, b - h], [r, b], [l, b]]), wall);
  if (k.near) for (let i = 0; i <= 3; i++) { const px = l + (w * i) / 3; g += fp(pd([[px - 0.35, b - h], [px + 0.35, b - h], [px + 0.35, b], [px - 0.35, b]]), post); }
  return g + door(k, x, b, w * 0.18, h * 0.6, '#2a1d16') + curvedRoof(k, x, y, w, d, h, roof);
}
/** Boat-shaped timber longhouse with a turf roof (Norse). */
function longhouse(k: K, x: number, y: number, w: number, d: number, h: number, wall: string, roof: string) {
  const l = x - w / 2, r = x + w / 2, b = y + d / 2, t = y - d / 2;
  let g = fl(k, `M${f1(l + 0.6)},${f1(b - h)}Q${f1(x)},${f1(b - h + 1)} ${f1(r - 0.6)},${f1(b - h)}L${f1(r - 1.2)},${f1(b)}Q${f1(x)},${f1(b + 1)} ${f1(l + 1.2)},${f1(b)}Z`, wall);
  if (k.near) for (let i = 1; i < 6; i++) g += ln(`M${f1(l + (w * i) / 6)},${f1(b - h + 0.6)}V${f1(b + 0.3)}`, sh(wall, 0.35), 0.35);
  g += door(k, x - w * 0.2, b + 0.3, Math.max(1, w * 0.07), h * 0.6, '#1c140d');
  const ry = y - h - d * 0.45;
  g += fl(k, `M${f1(l - 0.6)},${f1(b - h + 0.7)}Q${f1(x)},${f1(b - h + 1.9)} ${f1(r + 0.6)},${f1(b - h + 0.7)}L${f1(r - 0.4)},${f1(ry)}Q${f1(x)},${f1(ry - 1.1)} ${f1(l + 0.4)},${f1(ry)}Z`, roof);
  g += fl(k, `M${f1(l + 0.4)},${f1(ry)}Q${f1(x)},${f1(ry - 1.1)} ${f1(r - 0.4)},${f1(ry)}L${f1(r - 1)},${f1(t - h - 0.3)}Q${f1(x)},${f1(t - h - 1.2)} ${f1(l + 1)},${f1(t - h - 0.3)}Z`, hi(roof, 0.22));
  g += ln(`M${f1(l + 0.4)},${f1(ry)}Q${f1(x)},${f1(ry - 1.1)} ${f1(r - 0.4)},${f1(ry)}`, sh(roof, 0.35), 0.6);
  if (k.near) g += ln(`M${f1(l - 0.2)},${f1(ry - 1.6)}l1.4,1.6M${f1(r + 0.2)},${f1(ry - 1.6)}l-1.4,1.6`, '#c9b48a', 0.45);
  return g;
}
/** Stone house with a steep straw roof (Inca). */
function thatchHouse(k: K, x: number, y: number, w: number, d: number, h: number, wall: string, roof: string) {
  const l = x - w / 2, r = x + w / 2, t = y - d / 2, b = y + d / 2, rh = Math.max(w, d) * 0.62, ov = 0.9, A = y - h - rh;
  let g = fl(k, pd([[l, b - h], [r, b - h], [r, b], [l, b]]), wall);
  if (k.near) g += fp(pd([[x - w * 0.09, b], [x - w * 0.06, b - h * 0.62], [x + w * 0.06, b - h * 0.62], [x + w * 0.09, b]]), '#2a241c') + ln(`M${f1(l)},${f1(b - h * 0.5)}L${f1(x - w * 0.18)},${f1(b - h * 0.42)}M${f1(x + w * 0.2)},${f1(b - h * 0.55)}L${f1(r)},${f1(b - h * 0.48)}`, sh(wall, 0.3), 0.3);
  g += fl(k, pd([[l - ov, t - h], [r + ov, t - h], [x + w * 0.1, A], [x - w * 0.1, A]]), hi(roof, 0.18));
  g += fl(k, pd([[l - ov, b - h + ov * 0.7], [r + ov, b - h + ov * 0.7], [x + w * 0.1, A], [x - w * 0.1, A]]), roof);
  if (k.near) for (let i = 1; i < 4; i++) g += ln(`M${f1(x - w * 0.1 + (w * 0.2 * i) / 4)},${f1(A + 0.4)}L${f1(l - ov + ((w + 2 * ov) * i) / 4)},${f1(b - h + ov * 0.7)}`, sh(roof, 0.3), 0.3);
  return g;
}
/** Adobe house with a front veranda (India). */
function verandaHouse(k: K, x: number, y: number, w: number, d: number, h: number, wall: string, top: string) {
  const b = y + d / 2, l = x - w / 2, r = x + w / 2;
  let g = box(k, x, y - 0.8, w, d - 1.6, h, wall, top);
  g += fl(k, pd([[l - 0.3, b - h * 0.62 - 0.8], [r + 0.3, b - h * 0.62 - 0.8], [r + 0.3, b - h * 0.62 + 0.3], [l - 0.3, b - h * 0.62 + 0.3]]), sh(top, 0.08));
  for (const px of [l + 0.6, x, r - 0.6]) g += fp(pd([[px - 0.3, b - h * 0.62 + 0.3], [px + 0.3, b - h * 0.62 + 0.3], [px + 0.3, b], [px - 0.3, b]]), sh(wall, 0.35));
  return g;
}
function merlons(k: K, x: number, y: number, w: number, c: string, n = 4) {
  let g = '';
  const s = w / (n * 2 - 1);
  for (let i = 0; i < n; i++) { const mx = x - w / 2 + i * 2 * s; g += fl(k, pd([[mx, y - s * 0.9], [mx + s, y - s * 0.9], [mx + s, y], [mx, y]]), c); }
  return g;
}
/** Stacked tiers (ziggurat, terraces, ushnu, acropolis rock). Base center at (x, y); returns svg and the top height. */
function tiers(k: K, x: number, y: number, list: readonly [number, number, number][], front: string, top: string) {
  let g = '', z = 0;
  for (const [w, d, h] of list) { g += box(k, x, y - z, w, d, h, front, top); z += h; }
  return { g, z };
}

/* ---------------------------------------------------------- civic hearts */
/** One dominant silhouette per culture and level band (1: N1–2 · 2: N3–4 · 3: N5 · 4: N6–7). Drawn at r = 50 around the base (0,0). */
type Heart = { g: string; w: number; d: number };
function heartOf(k: K, cid: CultureId, band: number): Heart {
  const c = k.c, S = '#e6dfcc';
  switch (cid) {
    case 'hellenes': {
      if (band === 1) return { g: gableHouse(k, 0, 0, 11, 8, 5, c.wall, c.roof) + (k.near ? `<circle cx="-7" cy="5" r="1.4" fill="#e08a3c"/>` : ''), w: 12, d: 9 };
      if (band === 2) return { g: fp(pd([[-15, 1], [15, 1], [17, 9], [-17, 9]]), hi(c.plinth, 0.18)) + colonnade(k, 0, -3, 26, 7, 6, c.wall, c.roof, 9), w: 28, d: 12 };
      const big = band === 4, rock = tiers(k, 0, 0, big ? [[34, 20, 5], [26, 15, 4]] : [[28, 16, 5], [20, 12, 3]], sh(c.side, 0.05), sh(c.plinth, 0.08));
      let g = rock.g + temple(k, 0, -rock.z - 1, big ? 18 : 15, big ? 10 : 8, big ? 8 : 7, S, c.roof, big ? 6 : 5);
      if (big) g = `<g>${ln('M-26,9A13,6 0 0,1 -6,9M-24,11A11,5 0 0,1 -8,11M-22,13A9,4 0 0,1 -10,13', sh(c.plinth, 0.3), 1.1)}</g>` + g + temple(k, 12, -rock.z + 4, 8, 6, 5, S, c.roof, 4);
      return { g, w: big ? 36 : 30, d: big ? 22 : 18 };
    }
    case 'egyptians': {
      if (band === 1) return { g: (k.near ? ln('M-10,-5H10V6H-10Z', '#b9a46a', 1, ' stroke-dasharray="0.6 0.8"') : '') + flatHouse(k, 0, 0, 12, 8, 5, c.wall, c.top), w: 14, d: 11 };
      if (band === 2) return { g: box(k, 0, -4, 14, 7, 8, c.wall, c.top) + colonnade(k, 0, 3, 16, 5, 6, S, c.top, 4, true), w: 18, d: 14 };
      const big = band === 4, ph = big ? 17 : 13;
      let g = big ? pyramid(k, 0, -14, 30, 14, 30, '#ddc88e') + fp(pd([[0, -44], [-3.2, -38.6], [3.2, -38.6]]), c.metal) : box(k, 0, -9, 22, 8, 7, c.wall, c.top);
      const pylon = (x: number) => fl(k, pd([[x - 6, 4 - ph], [x + 6, 4 - ph], [x + 7, 4], [x - 7, 4]]), hi(c.wall, 0.08)) + fl(k, pd([[x - 6, 4 - ph - 4], [x + 6, 4 - ph - 4], [x + 6, 4 - ph], [x - 6, 4 - ph]]), hi(c.top, 0.1)) + (k.near ? ln(`M${x - 4},${4 - ph + 2}V2M${x + 4},${4 - ph + 2}V2`, c.accent, 0.6) : '');
      g += pylon(-7) + pylon(7) + box(k, 0, 2, 3.4, 4, ph * 0.65, sh(c.wall, 0.12), c.top) + door(k, 0, 4, 2.2, ph * 0.45, '#2b2012');
      g += obelisk(k, -15, 10, 2.6, 13, hi(c.wall, 0.15), c.metal) + obelisk(k, 15, 10, 2.6, 13, hi(c.wall, 0.15), c.metal);
      if (big) for (const sx of [-4.5, 4.5]) for (const sy of [11, 15]) g += box(k, sx, sy, 2.4, 1.6, 1.4, '#cdb47c', '#e2cf9c');
      return { g, w: big ? 32 : 28, d: big ? 30 : 20 };
    }
    case 'mesopotamians': {
      if (band === 1) return { g: fl(k, 'M-9,4L-9,-1Q0,-9 9,-1L9,4Z', '#c7aa6c') + fl(k, 'M-9,-1Q0,-9 9,-1L9,1Q0,-7 -9,1Z', hi('#c7aa6c', 0.15)) + (k.near ? ln('M-6,4V-2M-3,4V-4M0,4V-5M3,4V-4M6,4V-2', '#8a7040', 0.4) : ''), w: 14, d: 8 };
      if (band === 2) { const p = tiers(k, 0, 0, [[20, 13, 4]], c.wall, c.top); return { g: p.g + box(k, 0, -4, 10, 6, 6, hi(c.wall, 0.05), c.top) + fp(pd([[-1.2, -5], [1.2, -5], [1.2, -1], [-1.2, -1]]), c.accent), w: 22, d: 15 }; }
      const big = band === 4, list: [number, number, number][] = big ? [[34, 20, 7], [25, 15, 7], [17, 10, 6], [10, 6, 5]] : [[27, 16, 6], [19, 11, 6], [12, 7, 5]];
      const z = tiers(k, 0, -3, list, c.wall, c.top);
      let g = z.g + fl(k, pd([[-2.4, -3 + list[0]![1] / 2], [2.4, -3 + list[0]![1] / 2], [1.6, -3 - list[0]![2] - list[1]![2]], [-1.6, -3 - list[0]![2] - list[1]![2]]]), hi(c.top, 0.15));
      if (k.near) for (let i = 1; i < 7; i++) g += ln(`M-2,${f1(-3 + list[0]![1] / 2 - i * 2)}H2`, sh(c.top, 0.25), 0.35);
      g += box(k, 0, -3 - z.z + 1.5, 5, 3, 3.5, c.accent, hi(c.accent, 0.3));
      if (big) g += box(k, 0, 13, 12, 3.5, 10, c.accent, hi(c.accent, 0.25)) + merlons(k, 0, 13 - 1.75 - 10 + 0.1, 12, hi(c.accent, 0.2), 5) + fp('M-2.2,14.75V9.5A2.2,2.2 0 0,1 2.2,9.5V14.75Z', '#13202a') + (k.near ? ln('M-5,11.5h1.4M3.6,11.5h1.4M-5,8h1.4M3.6,8h1.4', '#e8d9a8', 0.5) : '');
      return { g, w: big ? 36 : 29, d: big ? 30 : 20 };
    }
    case 'persians': {
      if (band === 1) return { g: box(k, 0, 0, 7, 7, 14, c.wall, c.top) + merlons(k, 0, 3.5 - 14, 7, c.top, 3) + door(k, 0, 3.5, 2, 4), w: 9, d: 9 };
      if (band === 2) return { g: fp(pd([[-21, 0], [-8, 0], [-8, 9], [-21, 9]]), '#6f8a4e') + ln('M-14.5,0V9M-21,4.5H-8', c.accent, 0.9) + box(k, 4, -3, 18, 9, 6, c.wall, c.top) + colonnade(k, 4, 3, 18, 3, 5, '#8a6440', c.top, 6, true), w: 30, d: 13 };
      const big = band === 4, W = big ? 36 : 30, D = big ? 22 : 18, H = big ? 6 : 5;
      let g = box(k, 0, 0, W, D, H, c.side, c.plinth);
      if (k.near && big) for (let i = 0; i < 16; i++) g += ln(`M${f1(-W / 2 + 2 + i * ((W - 4) / 15))},${f1(D / 2 - H + 1.6)}v${f1(H - 3)}`, i % 2 ? c.accent : c.metal, 0.5);
      g += fl(k, pd([[-9, D / 2], [-4, D / 2], [-2, D / 2 - H], [-7, D / 2 - H]]), hi(c.plinth, 0.12)) + fl(k, pd([[9, D / 2], [4, D / 2], [2, D / 2 - H], [7, D / 2 - H]]), hi(c.plinth, 0.12));
      const hw = big ? 24 : 20, hd = big ? 13 : 11, hh = big ? 9 : 8, by = -H - 1;
      g += fl(k, pd([[-hw / 2, by - hd / 2 - hh], [hw / 2, by - hd / 2 - hh], [hw / 2, by + hd / 2 - hh], [-hw / 2, by + hd / 2 - hh]]), c.top);
      g += fl(k, pd([[-hw / 2, by + hd / 2 - hh], [hw / 2, by + hd / 2 - hh], [hw / 2, by + hd / 2], [-hw / 2, by + hd / 2]]), sh(c.wall, 0.55));
      const n = big ? 8 : 6;
      for (let i = 0; i < n; i++) { const cx = -hw / 2 + (i + 0.5) * (hw / n); g += fp(pd([[cx - 0.5, by + hd / 2 - hh + 1.4], [cx + 0.5, by + hd / 2 - hh + 1.4], [cx + 0.5, by + hd / 2], [cx - 0.5, by + hd / 2]]), hi(c.wall, 0.2)) + fp(pd([[cx - 1.3, by + hd / 2 - hh], [cx + 1.3, by + hd / 2 - hh], [cx + 0.6, by + hd / 2 - hh + 1.4], [cx - 0.6, by + hd / 2 - hh + 1.4]]), c.metal); }
      g += fl(k, pd([[-hw / 2 - 0.5, by + hd / 2 - hh - 1.2], [hw / 2 + 0.5, by + hd / 2 - hh - 1.2], [hw / 2 + 0.5, by + hd / 2 - hh], [-hw / 2 - 0.5, by + hd / 2 - hh]]), hi(c.wall, 0.1));
      g += box(k, -5.5, D / 2 - H - 0.6, 2, 2.4, 3.5, hi(c.wall, 0.05), c.top) + box(k, 5.5, D / 2 - H - 0.6, 2, 2.4, 3.5, hi(c.wall, 0.05), c.top);
      return { g, w: W, d: D };
    }
    case 'israel': {
      if (band === 1) return { g: flatHouse(k, 0, 0, 12, 10, 4.5, c.wall, c.top) + (k.near ? ln('M-2,-9V-1M-2,-5H6', sh(c.top, 0.25), 0.5) : ''), w: 13, d: 11 };
      if (band === 2) return { g: box(k, 0, -6, 18, 6, 6, c.wall, c.top) + box(k, 0, 5, 14, 6, 7, hi(c.wall, 0.04), c.top) + fp(pd([[-1.6, 8], [1.6, 8], [1.6, 3], [-1.6, 3]]), '#2a2218') + (k.near ? ln('M-6,2.5V-1M-3.5,2.5V-1M3.5,2.5V-1M6,2.5V-1', sh(c.top, 0.3), 0.6) : ''), w: 20, d: 16 };
      const big = band === 4;
      let g = `<circle cx="-13" cy="8" r="2.6" fill="#2c3a40" stroke="${sh(c.plinth, 0.3)}" stroke-width="0.8"/>` + box(k, big ? 10 : 0, big ? 2 : -2, big ? 14 : 20, big ? 9 : 12, big ? 7 : 8, c.wall, c.top);
      if (k.near) g += ln(`M${big ? 3.5 : -9.5},${big ? 4.5 : 2.5}h${big ? 13 : 19}M${big ? 3.5 : -9.5},${big ? 2 : -0.5}h${big ? 13 : 19}`, sh(c.wall, 0.25), 0.35);
      if (big) {
        g = box(k, -3, -6, 9, 16, 13, '#cfc09a', '#ddd0ad') + box(k, -3, 3.5, 7, 3, 9, '#8a6a46', '#a07c52') + g;
        g = g + cyl(k, -5.4, 6, 0.9, 7, c.metal, hi(c.metal, 0.3)) + cyl(k, -0.6, 6, 0.9, 7, c.metal, hi(c.metal, 0.3));
      }
      return { g, w: big ? 30 : 22, d: big ? 22 : 14 };
    }
    case 'romans': {
      if (band === 1) return { g: gableHouse(k, 0, 0, 12, 8, 5, c.wall, c.roof), w: 13, d: 9 };
      const arches = (x: number, y: number, w: number, h: number, n: number) => { let a = fl(k, pd([[x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y], [x - w / 2, y]]), c.wallMat); const s = w / n; for (let i = 0; i < n; i++) { const ax = x - w / 2 + s * (i + 0.5); a += fp(`M${f1(ax - s * 0.32)},${f1(y)}V${f1(y - h * 0.55)}A${f1(s * 0.32)},${f1(s * 0.32)} 0 0,1 ${f1(ax + s * 0.32)},${f1(y - h * 0.55)}V${f1(y)}Z`, '#2a2018'); } return a + fl(k, pd([[x - w / 2, y - h - 1.2], [x + w / 2, y - h - 1.2], [x + w / 2, y - h], [x - w / 2, y - h]]), hi(c.wallMat, 0.2)); };
      if (band === 2) return { g: arches(-6, -12, 30, 7, 7) + fp(pd([[-13, 1], [13, 1], [14, 10], [-14, 10]]), hi(c.plinth, 0.22)) + gableHouse(k, 0, -3, 22, 7, 7, c.wall, c.roof), w: 28, d: 14 };
      if (band === 3) return { g: box(k, -3, -4, 16, 10, 6, c.wall, c.top) + dome(k, -3, -4 - 3 - 3, 5.5, '#b9b4aa') + box(k, 8, 7, 9, 3, 9, hi(c.wall, 0.05), c.top) + fp('M6.6,8.5V4.6A1.4,1.4 0 0,1 9.4,4.6V8.5Z', '#2a2018'), w: 24, d: 16 };
      let g = arches(-3, -15, 34, 6, 8);
      g += temple(k, 9, -4, 12, 9, 8, '#ede7d8', c.roof, 4);
      const ax = -8, ay = 6, rx = 11, ry = 6.5, ah = 8;
      g += fl(k, `M${ax - rx},${ay - ah}L${ax - rx},${ay}A${rx},${ry} 0 0,0 ${ax + rx},${ay}L${ax + rx},${ay - ah}Z`, c.wallMat);
      if (k.near) for (let i = 0; i < 9; i++) { const t = -Math.PI * 0.9 + (i * Math.PI * 0.8) / 8, px = ax - Math.cos(t) * rx * 0.98; g += fp(ell(px, ay - ah * 0.45 + Math.abs(Math.sin(t)) * 1.5, 0.55, 1.4), '#2a2018'); }
      g += fl(k, ell(ax, ay - ah, rx, ry), hi(c.wallMat, 0.18)) + fp(ell(ax, ay - ah + 0.6, rx * 0.62, ry * 0.55), '#cdb88f') + (k.near ? ln(`M${ax - rx * 0.82},${ay - ah}A${rx * 0.82},${ry * 0.8} 0 0,1 ${ax + rx * 0.82},${ay - ah}`, sh(c.wallMat, 0.25), 0.4) : '');
      return { g, w: 36, d: 26 };
    }
    case 'norse': {
      if (band === 1) return { g: longhouse(k, 0, 0, 16, 7, 4, c.wall, c.roof), w: 17, d: 8 };
      if (band === 2) return { g: ([0, 1, 2, 3, 4, 5, 6].map(i => { const a = -Math.PI * 0.15 + i * 0.5; return `<rect x="${f1(-14 + Math.cos(a) * 4.4 - 0.6)}" y="${f1(9 + Math.sin(a) * 2 - 2)}" width="1.2" height="2" fill="#9aa0a0" stroke="#1d1810" stroke-width=".3"/>`; }).join('')) + longhouse(k, 0, -3, 24, 9, 6, c.wall, c.roof) + fl(k, 'M8,9Q14,11.5 20,9L19,7.5Q14,9.5 9,7.5Z', '#3c2c1e') + ln('M14,9.5V5', '#3c2c1e', 0.6), w: 26, d: 14 };
      if (band === 3) {
        let g = fl(k, ell(0, 0, 17, 11), '#4f5a34') + fp(ell(0, 0.6, 13.5, 8.3), sh(c.plinth, 0.05)) + ln(ell(0, -0.6, 15.3, 9.7), '#6a7448', 2.2);
        g += longhouse(k, -5, -4, 8, 3.2, 2.6, c.wall, c.roof) + longhouse(k, 5, -4, 8, 3.2, 2.6, c.wall, c.roof) + longhouse(k, -5, 3, 8, 3.2, 2.6, c.wall, c.roof) + longhouse(k, 5, 3, 8, 3.2, 2.6, c.wall, c.roof);
        return { g, w: 34, d: 22 };
      }
      return { g: longhouse(k, 0, -3, 30, 11, 7, c.wall, c.roof) + (k.near ? ln('M-17,-12l3,3M-14,-12l-3,3M17,-12l-3,3M14,-12l3,3', '#c9b48a', 0.6) : '') + fl(k, 'M-14,11L-13,2Q-11.5,0.5 -10,2L-10,11Z', '#8e9494') + (k.near ? ln('M-12.6,4Q-11,6 -12.4,8', c.accent, 0.6) : ''), w: 32, d: 15 };
    }
    case 'chinese': {
      if (band === 1) return { g: curvedHall(k, 0, 0, 12, 7, 4.5, c.wall, '#9c8a5c', c.accent), w: 13, d: 8 };
      if (band === 2) return { g: curvedHall(k, -11, 3, 6, 9, 4, c.wall, c.roof, c.accent) + curvedHall(k, 11, 3, 6, 9, 4, c.wall, c.roof, c.accent) + curvedHall(k, 0, -4, 16, 8, 6, c.wall, c.roof, c.accent) + box(k, 13, 12, 5, 5, 7, c.accent, c.top) + curvedRoof(k, 13, 12, 5, 5, 7, c.roof), w: 30, d: 16 };
      if (band === 3) return { g: box(k, 0, 0, 24, 10, 7, c.wallMat, hi(c.wallMat, 0.15)) + fp('M-2,5V1A2,2 0 0,1 2,1V5Z', '#1d1510') + curvedHall(k, 0, -6.5, 16, 6, 5, c.accent, c.roof, sh(c.accent, 0.3)) + curvedRoof(k, 0, -6.5, 12, 5, 9.5, c.roof), w: 26, d: 12 };
      let g = box(k, 6, 2, 24, 13, 4, c.side, hi(c.plinth, 0.08)) + curvedHall(k, 6, -2, 18, 7, 6, c.accent, c.roof, sh(c.accent, 0.3)) + curvedRoof(k, 6, -2, 13, 6, 10, c.roof);
      g = (() => { let p = '', z = 0; for (let i = 0; i < 5; i++) { const s = 7.5 - i * 1.1; p += `<g transform="translate(0 ${f1(-z)})">${box(k, -11, -2, s, s * 0.8, 3.4, hi(c.accent, 0.05), c.top)}${curvedRoof(k, -11, -2, s, s * 0.8, 3.4, c.roof)}</g>`; z += 3.4 + 1.4; } return p + `<g transform="translate(0 ${f1(-z)})">${ln('M-11,-2.5v-5', c.metal, 0.8)}</g>`; })() + g;
      return { g, w: 34, d: 16 };
    }
    case 'india': {
      if (band === 1) return { g: verandaHouse(k, 0, 0, 12, 9, 5, c.wall, c.top) + `<circle cx="-10" cy="6" r="1.8" fill="#24343a" stroke="${sh(c.plinth, 0.3)}" stroke-width="0.7"/>`, w: 14, d: 10 };
      if (band === 2) {
        let g = fp(pd([[-16, 3], [-6, 3], [-6, 11], [-16, 11]]), sh(c.side, 0.1)) + fp(pd([[-14.6, 4.2], [-7.4, 4.2], [-7.4, 9.8], [-14.6, 9.8]]), sh(c.side, 0.35)) + fp(pd([[-13, 5.4], [-9, 5.4], [-9, 8.6], [-13, 8.6]]), '#1f3540');
        const mx = 6, mw = 17, md = 10, mh = 6;
        for (const py of [-md / 2 + 1, md / 2 - 1]) for (let n = 0; n < 4; n++) { const px = mx - mw / 2 + 1.5 + (n * (mw - 3)) / 3; g += fl(k, pd([[px - 0.55, py - mh], [px + 0.55, py - mh], [px + 0.55, py], [px - 0.55, py]]), py < 0 ? sh(c.wall, 0.25) : c.wall); }
        g += `<g transform="translate(0 ${-mh})">${box(k, mx, 0, mw + 1, md + 1, 1.6, sh(c.top, 0.1), c.top)}${dome(k, mx, -md / 2 - 1.6 + 1.2, 2.6, hi(c.top, 0.1))}</g>`;
        return { g, w: 30, d: 14 };
      }
      const stupa = (x: number, y: number, s: number) => cyl(k, x, y, 7 * s, 2.2 * s, sh(c.top, 0.12), c.top) + dome(k, x, y - 2.2 * s, 6 * s, hi(c.top, 0.08), 1.05) + box(k, x, y - 8.2 * s, 2.2 * s, 1.6 * s, 1.6 * s, c.wall, c.top) + ln(`M${f1(x)},${f1(y - 9.8 * s)}v${f1(-3 * s)}`, sh(c.wall, 0.3), 0.6) + fp(ell(x, y - 11.5 * s, 1.8 * s, 0.6 * s), c.metal) + fp(ell(x, y - 12.6 * s, 1.3 * s, 0.45 * s), c.metal);
      const torana = (x: number, y: number) => ln(`M${x - 4},${y}v-8M${x + 4},${y}v-8`, sh(c.wall, 0.25), 1.1) + ln(`M${x - 5.5},${y - 8}Q${x},${y - 9} ${x + 5.5},${y - 8}M${x - 5.5},${y - 6.3}Q${x},${y - 7.3} ${x + 5.5},${y - 6.3}M${x - 5},${y - 4.6}Q${x},${y - 5.6} ${x + 5},${y - 4.6}`, c.wall, 0.9);
      if (band === 3) return { g: stupa(0, -2, 1.05) + ln('M13,8V-12', '#d9c7a8', 1.4) + fp(ell(13, -12.4, 1.5, 0.8), c.metal) + torana(0, 10), w: 20, d: 16 };
      const sx = 9, sy = -5;
      let g = box(k, sx, sy, 11, 8, 3, c.wall, c.top);
      g += fl(k, `M${sx - 5},${sy - 3}C${sx - 5.5},${sy - 14} ${sx - 3},${sy - 22} ${sx},${sy - 25}C${sx + 3},${sy - 22} ${sx + 5.5},${sy - 14} ${sx + 5},${sy - 3}Z`, hi(c.wall, 0.06));
      if (k.near) for (let i = 1; i < 6; i++) g += ln(`M${f1(sx - 5 + i * 0.2)},${f1(sy - 3 - i * 3.6)}H${f1(sx + 5 - i * 0.2)}`, sh(c.wall, 0.25), 0.4);
      g += fl(k, ell(sx, sy - 25.5, 2.2, 0.9), c.metal) + fp(pd([[sx, sy - 25], [sx + 5, sy - 3], [sx + 2, sy - 3]]), '#00000022');
      return { g: stupa(-8, 1, 0.9) + g + torana(-8, 11), w: 30, d: 18 };
    }
    case 'incas': {
      const qollqa = (x: number, y: number) => cyl(k, x, y, 2.1, 2.6, c.wall, c.wall) + cone(k, x, y - 2.6, 2.5, 3.2, c.roof);
      if (band === 1) return { g: thatchHouse(k, 0, 0, 9, 7, 4, c.wall, c.roof) + qollqa(9, 3), w: 16, d: 9 };
      if (band === 2) {
        let g = '';
        for (let i = 0; i < 3; i++) g += fl(k, `M${-20 + i * 2},${-9 + i * 2.6}Q0,${-15 + i * 2.6} ${20 - i * 2},${-9 + i * 2.6}L${20 - i * 2},${-7 + i * 2.6}Q0,${-13 + i * 2.6} ${-20 + i * 2},${-7 + i * 2.6}Z`, i % 2 ? '#7f8a52' : '#8f9a5c');
        return { g: g + thatchHouse(k, -6, 0, 14, 6, 4, c.wall, c.roof) + qollqa(8, 1) + qollqa(13, 4) + qollqa(9, 7), w: 30, d: 14 };
      }
      const big = band === 4, t = tiers(k, 0, 0, big ? [[32, 20, 4], [25, 15, 4], [18, 11, 4], [12, 8, 3]] : [[24, 15, 4], [17, 11, 4], [11, 7, 3]], c.side, '#8f9a5c');
      let g = t.g;
      if (k.near) g += ln(`M-1.6,${big ? 10 : 7.5}V${big ? -1 : -1}M1.6,${big ? 10 : 7.5}V-1`, hi(c.wall, 0.2), 0.5);
      g += `<g transform="translate(0 ${f1(-t.z)})">${big ? thatchHouse(k, -3, -1, 6, 4, 3.4, c.wall, c.roof) + box(k, 3.5, -0.5, 4.5, 3, 3.2, hi(c.wall, 0.1), hi(c.wall, 0.2)) : box(k, 0, -0.5, 7, 4, 2.6, hi(c.wall, 0.08), hi(c.wall, 0.2))}</g>`;
      return { g, w: big ? 34 : 26, d: big ? 22 : 17 };
    }
    default: {
      if (band === 1) return { g: gableHouse(k, 0, 0, 11, 8, 5, c.wall, c.roof), w: 12, d: 9 };
      if (band === 2) return { g: gableHouse(k, 0, 0, 18, 9, 7, c.wall, c.roof), w: 20, d: 10 };
      return { g: box(k, 0, 0, 20, 12, band === 4 ? 10 : 8, c.wall, c.top) + dome(k, 0, -6 - (band === 4 ? 10 : 8), 6, '#9aa0a0'), w: 22, d: 14 };
    }
  }
}
function houseOf(k: K, x: number, y: number, w: number, d: number, h: number, rnd: number) {
  const c = k.c;
  switch (c.house) {
    case 'gable': return gableHouse(k, x, y, w, d, h, c.wall, rnd > 0.75 ? sh(c.roof, 0.12) : c.roof);
    case 'flat': {
      // Persian paradise gardens (pairidaeza) between the houses; Israelite four-room houses around a court.
      if (c.garden && rnd > 0.74) return fl(k, pd([[x - w / 2, y - d / 2], [x + w / 2, y - d / 2], [x + w / 2, y + d / 2], [x - w / 2, y + d / 2]]), '#6f8a4e') + ln(`M${f1(x)},${f1(y - d / 2)}V${f1(y + d / 2)}M${f1(x - w / 2)},${f1(y)}H${f1(x + w / 2)}`, c.accent, Math.max(0.5, w * 0.08)) + (k.near ? `<circle cx="${f1(x - w * 0.3)}" cy="${f1(y - d * 0.3)}" r="${f1(w * 0.1)}" fill="#4f6a38"/><circle cx="${f1(x + w * 0.3)}" cy="${f1(y + d * 0.25)}" r="${f1(w * 0.1)}" fill="#4f6a38"/>` : '');
      const g = flatHouse(k, x, y, w, d, h, rnd > 0.7 ? sh(c.wall, 0.06) : c.wall, c.top);
      return c.courtyard && w > d * 1.1 ? g + fp(pd([[x - w * 0.22, y - d * 0.3 - h], [x + w * 0.22, y - d * 0.3 - h], [x + w * 0.22, y + d * 0.12 - h], [x - w * 0.22, y + d * 0.12 - h]]), sh(c.top, 0.22)) : g;
    }
    case 'long': return longhouse(k, x, y, Math.max(w, d) * 1.6, Math.min(w, d) * 0.7, h * 0.75, c.wall, rnd > 0.5 ? c.roof : '#7a6a48');
    case 'curved': return curvedHall(k, x, y, w, d, h, c.wall, c.roof, c.accent);
    case 'thatch': return rnd > 0.78 ? cyl(k, x, y + d * 0.2, Math.min(w, d) * 0.38, h * 0.6, c.wall, c.wall) + cone(k, x, y + d * 0.2 - h * 0.6, Math.min(w, d) * 0.46, h * 0.75, c.roof) : thatchHouse(k, x, y, w, d, h, c.wall, c.roof);
    case 'veranda': return rnd > 0.8 ? flatHouse(k, x, y, w, d, h, hi(c.wall, 0.2), c.top) + dome(k, x, y - d / 2 - h + 1, Math.min(w, d) * 0.28, hi(c.top, 0.1)) : verandaHouse(k, x, y, w, d, h, c.wall, c.top);
  }
}

/* -------------------------------------------------------------- the plinth */
function smooth(pts: readonly Pt[]) {
  const n = pts.length; let d = `M${f1((pts[0]![0] + pts[1]![0]) / 2)},${f1((pts[0]![1] + pts[1]![1]) / 2)}`;
  for (let i = 1; i <= n; i++) { const p = pts[i % n]!, q = pts[(i + 1) % n]!; d += `Q${f1(p[0])},${f1(p[1])} ${f1((p[0] + q[0]) / 2)},${f1((p[1] + q[1]) / 2)}`; }
  return d + 'Z';
}
const LEVEL_EXT = [0.38, 0.45, 0.52, 0.58, 0.63, 0.67, 0.71] as const;
/** The city's raised base, in plan: an irregular patch at N1–2, a full regular mass at N6–7; kept inside the hex with room for walls. */
function blobRadius(seed: number, level: number, r: number) {
  const R = rng(seed * 977 + 13), a = R() * 6.28, b = R() * 6.28, c = R() * 6.28, irr = [0.13, 0.11, 0.08, 0.06, 0.05, 0.04, 0.035][level - 1]!, ext = r * LEVEL_EXT[level - 1]!;
  return (t: number) => ext * (1 + irr * (Math.sin(3 * t + a) * 0.55 + Math.sin(5 * t + b) * 0.3 + Math.sin(2 * t + c) * 0.25));
}
function ring(rad: (t: number) => number, scale: number, add: number, n: number, ys = 0.92): Pt[] {
  return Array.from({ length: n }, (_, i) => { const t = (i / n) * Math.PI * 2; const q = rad(t) * scale + add; return [Math.cos(t) * q, Math.sin(t) * q * ys] as Pt; });
}
function motif(p: Pattern, x: number, y: number, s: number, ink: string, accent: string) {
  const X = (v: number) => f1(x + v * s), Y = (v: number) => f1(y + v * s), w = f1(0.35 * s);
  switch (p) {
    case 'meander': return `<path d="M${X(-1.6)},${Y(1)}V${Y(-1)}H${X(1)}V${Y(0.6)}H${X(-0.4)}V${Y(-0.2)}" fill="none" stroke="${ink}" stroke-width="${w}"/>`;
    case 'leiwen': return `<path d="M${X(-1.4)},${Y(1)}H${X(1.4)}V${Y(-1)}H${X(-1)}V${Y(0.5)}H${X(0.8)}V${Y(-0.4)}H${X(-0.3)}" fill="none" stroke="${ink}" stroke-width="${w}"/>`;
    case 'lotus': return `<path d="M${X(0)},${Y(1)}L${X(-1.2)},${Y(-1)}M${X(0)},${Y(1)}V${Y(-1.3)}M${X(0)},${Y(1)}L${X(1.2)},${Y(-1)}" fill="none" stroke="${accent}" stroke-width="${w}"/>`;
    case 'brick': return `<path d="M${X(-1.6)},${Y(-0.9)}H${X(1.6)}V${Y(0.9)}H${X(-1.6)}ZM${X(0)},${Y(-0.9)}V${Y(0)}M${X(-1.6)},${Y(0)}H${X(1.6)}" fill="none" stroke="${ink}" stroke-width="${f1(0.28 * s)}"/>`;
    case 'rosette': return `<circle cx="${X(0)}" cy="${Y(0)}" r="${f1(0.95 * s)}" fill="none" stroke="${accent}" stroke-width="${w}"/><circle cx="${X(0)}" cy="${Y(0)}" r="${f1(0.3 * s)}" fill="${accent}"/>`;
    case 'pomegranate': return `<circle cx="${X(0)}" cy="${Y(0.2)}" r="${f1(0.85 * s)}" fill="${accent}"/><path d="M${X(-0.5)},${Y(-0.6)}L${X(0)},${Y(-1.3)}L${X(0.5)},${Y(-0.6)}" fill="none" stroke="${accent}" stroke-width="${w}"/>`;
    case 'ovolo': return `<ellipse cx="${X(0)}" cy="${Y(0)}" rx="${f1(0.75 * s)}" ry="${f1(1.05 * s)}" fill="none" stroke="${ink}" stroke-width="${w}"/>`;
    case 'knot': return `<path d="M${X(-1.6)},${Y(-0.9)}Q${X(0)},${Y(1.8)} ${X(1.6)},${Y(-0.9)}M${X(-1.6)},${Y(0.9)}Q${X(0)},${Y(-1.8)} ${X(1.6)},${Y(0.9)}" fill="none" stroke="${ink}" stroke-width="${w}"/>`;
    case 'jali': return `<path d="M${X(-1.2)},${Y(-1)}L${X(1.2)},${Y(1)}M${X(1.2)},${Y(-1)}L${X(-1.2)},${Y(1)}M${X(0)},${Y(-1.2)}V${Y(1.2)}" fill="none" stroke="${ink}" stroke-width="${f1(0.28 * s)}"/>`;
    case 'tocapu': return `<rect x="${X(-1.1)}" y="${Y(-1)}" width="${f1(1.1 * s)}" height="${f1(1 * s)}" fill="${accent}"/><rect x="${X(0)}" y="${Y(0)}" width="${f1(1.1 * s)}" height="${f1(1 * s)}" fill="${ink}"/>`;
    default: return '';
  }
}

/* ----------------------------------------------------------- fortification */
export const FORTIFICATION_ORDER = ['PALISADE', 'STONE_WALL', 'FORTRESS', 'BASTION', 'CITADEL'] as const;
const angDiff = (a: number, b: number) => Math.abs(((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
/**
 * The wall follows the city's base, never the hexagon (V2.1 §7). Per culture: polygonal stone with round towers, mudbrick with
 * a pylon gate, buttressed brick, casemate, brick and concrete with square towers, timber palisade on an earth ring, rammed
 * earth with a curved-roof gate, sandstone, a zigzag of fitted stone. DAMAGED opens one gap, BREACHED two, with rubble. The
 * wall opens on the water where the city has a port. Split in back/front so the city stands between them.
 */
function walls(k: K, cid: CultureId, lv: number, state: string, rad: (t: number) => number, r: number, harbor: number | null) {
  const c = k.c, u = r / 50, zig = cid === 'incas' && lv >= 2, n = zig ? 40 : 30;
  const pts = ring(rad, 1, r * (lv >= 3 ? 0.085 : 0.07), n).map((p, i) => zig ? [p[0] * (i % 2 ? 1.035 : 0.975), p[1] * (i % 2 ? 1.035 : 0.975)] as Pt : p);
  const palisade = lv === 1 && !['egyptians', 'mesopotamians'].includes(cid);
  const reeds = lv === 1 && !palisade;
  const timber = palisade || (cid === 'norse') || (cid === 'india' && lv <= 2);
  const mat = palisade || timber ? (cid === 'norse' && lv >= 2 ? '#6e5439' : '#7b5c3a') : reeds ? '#c3ab72' : c.wallMat;
  const hw = u * [3, 3.6, 4.3, 4.9, 5.4][lv - 1]!, th = u * [1.1, 1.6, 2, 2.4, 2.7][lv - 1]!;
  const gaps = state === 'BREACHED' ? [0.62, 2.5] : state === 'DAMAGED' ? [0.62] : [];
  const gate = lv >= 2 ? Math.PI / 2 : null;
  let back = '', front = '', rubble = '';
  if (lv >= 5) back += `<path d="${smooth(ring(rad, 1, r * 0.155, 36))}" fill="none" stroke="#25485a" stroke-width="${f1(u * 3)}" stroke-opacity=".9"/>`;
  if (cid === 'norse' && lv >= 2) back += `<path d="${smooth(ring(rad, 1, r * 0.085, 36))}" fill="none" stroke="#4f5a34" stroke-width="${f1(u * 5.5)}"/>`;
  const inGap = (t: number) => gaps.some(g => angDiff(t, g) < 0.3);
  const skip = (t: number) => (harbor !== null && angDiff(t, harbor) < 0.45) || (gate !== null && angDiff(t, gate) < 0.2) || inGap(t);
  const up = (p: Pt): Pt => [p[0], p[1] - hw];
  for (let i = 0; i < n; i++) {
    const a = pts[i]!, b = pts[(i + 1) % n]!, t = Math.atan2((a[1] + b[1]) / 2, (a[0] + b[0]) / 2);
    if (skip(t)) { if (inGap(t)) { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; rubble += fp(ell(mx, my + u * 0.4, u * 3.4, u * 1.5), '#1d1810', ' opacity=".45"') + [[-1.6, 0.6], [0.4, 1.1], [1.8, -0.2], [-0.4, -0.7], [1, 0.2]].map(([dx, dy], j) => `<circle cx="${f1(mx + dx! * u)}" cy="${f1(my + dy! * u)}" r="${f1(u * (j % 2 ? 0.8 : 1.15))}" fill="${hi(mat, 0.1)}" stroke="${INK}" stroke-width="${f1(u * 0.3)}"/>`).join(''); } continue; }
    const isFront = Math.sin(t) > 0;
    let seg = fl(k, pd([a, b, up(b), up(a)]), isFront ? sh(mat, 0.08) : sh(mat, 0.2)) + ln(`M${f1(a[0])},${f1(a[1] - hw)}L${f1(b[0])},${f1(b[1] - hw)}`, hi(mat, 0.22), th);
    if (palisade || (timber && lv <= 2)) seg += ln(`M${f1(a[0])},${f1(a[1] - hw - th * 0.4)}L${f1(b[0])},${f1(b[1] - hw - th * 0.4)}`, sh(mat, 0.3), th * 1.1, ` stroke-dasharray="${f1(u * 0.7)} ${f1(u * 0.55)}" stroke-linecap="butt"`);
    else if (reeds) seg += ln(`M${f1(a[0])},${f1(a[1] - hw)}L${f1(b[0])},${f1(b[1] - hw)}`, sh(mat, 0.2), th * 0.8, ` stroke-dasharray="${f1(u * 0.4)} ${f1(u * 0.4)}" stroke-linecap="butt"`);
    else if (cid !== 'norse') seg += ln(`M${f1(a[0])},${f1(a[1] - hw - th * 0.55)}L${f1(b[0])},${f1(b[1] - hw - th * 0.55)}`, hi(mat, 0.12), th * 0.6, ` stroke-dasharray="${f1(u * 0.9)} ${f1(u * 0.7)}" stroke-linecap="butt"`);
    if (cid === 'israel' && lv >= 2) seg += ln(`M${f1(a[0] * 0.95)},${f1(a[1] * 0.95 - hw)}L${f1(b[0] * 0.95)},${f1(b[1] * 0.95 - hw)}`, hi(mat, 0.1), th * 0.7);
    if (cid === 'mesopotamians' && lv >= 2 && isFront && i % 2 === 0) seg += box(k, a[0], a[1] + u * 0.6, u * 1.6, u * 1.2, hw * 1.08, sh(mat, 0.05), hi(mat, 0.15));
    if (isFront) front += seg; else back += seg;
  }
  // Towers: none on a palisade; denser with the level. The shape is the culture's.
  const towerShape: Tower = timber && lv <= 2 ? 'timber' : c.tower;
  if (lv >= 3 && towerShape !== 'none') {
    const every = lv === 3 ? 5 : lv === 4 ? 4 : 3;
    for (let i = 0; i < n; i += every) {
      const p = pts[i]!, t = Math.atan2(p[1], p[0]);
      if (skip(t)) continue;
      const tw = tower(k, towerShape, p[0], p[1], u, hw, mat, c);
      if (Math.sin(t) > 0) front += tw; else back += tw;
    }
  }
  if (gate !== null) {
    const p = pts.reduce((best, q) => angDiff(Math.atan2(q[1], q[0]), gate) < angDiff(Math.atan2(best[1], best[0]), gate) ? q : best, pts[0]!), gx = p[0], gy = p[1];
    if (cid === 'egyptians') front += [-1, 1].map(s => fl(k, pd([[gx + s * u * 2.2 - u * 2, gy - hw * 1.9], [gx + s * u * 2.2 + u * 2, gy - hw * 1.9], [gx + s * u * 2.2 + u * 2.5, gy], [gx + s * u * 2.2 - u * 2.5, gy]]), hi(mat, 0.08))).join('');
    else if (cid === 'chinese') front += box(k, gx, gy, u * 7, u * 3, hw * 1.25, mat, hi(mat, 0.15)) + fp(`M${f1(gx - u * 1.1)},${f1(gy)}V${f1(gy - hw * 0.7)}A${f1(u * 1.1)},${f1(u * 1.1)} 0 0,1 ${f1(gx + u * 1.1)},${f1(gy - hw * 0.7)}V${f1(gy)}Z`, '#1d1510') + `<g transform="translate(0 ${f1(-hw * 1.25)})">${curvedHall(k, gx, gy - u, u * 5.5, u * 2.4, u * 2, c.accent, c.roof, sh(c.accent, 0.3))}</g>`;
    else if (towerShape !== 'none' && lv >= 2) front += tower(k, towerShape === 'timber' ? 'timber' : towerShape === 'pylon' ? 'square' : towerShape, gx - u * 3.4, gy - u * 0.3, u, hw, mat, c) + tower(k, towerShape === 'timber' ? 'timber' : towerShape === 'pylon' ? 'square' : towerShape, gx + u * 3.4, gy - u * 0.3, u, hw, mat, c);
    else if (cid === 'incas') front += fl(k, pd([[gx - u * 2.2, gy - hw * 1.1], [gx + u * 2.2, gy - hw * 1.1], [gx + u * 2.6, gy], [gx - u * 2.6, gy]]), hi(mat, 0.05)) + fp(pd([[gx - u * 0.9, gy], [gx - u * 0.6, gy - hw * 0.8], [gx + u * 0.6, gy - hw * 0.8], [gx + u * 0.9, gy]]), '#241f18');
  }
  return { back, front: front + rubble, gaps: gaps.length };
}
function tower(k: K, shape: Tower, x: number, y: number, u: number, hw: number, mat: string, c: Culture) {
  const h = hw * 1.65, s = u * 2.6;
  switch (shape) {
    case 'round': return cyl(k, x, y + u, s * 0.62, h, sh(mat, 0.05), hi(mat, 0.2));
    case 'buttress': return box(k, x, y + u * 0.6, s * 1.05, s * 0.9, h, sh(mat, 0.04), hi(mat, 0.14)) + merlons(k, x, y + u * 0.6 - s * 0.45 - h + 0.2, s * 1.05, hi(mat, 0.1), 3);
    case 'timber': return box(k, x, y + u * 0.6, s * 0.9, s * 0.9, h, '#6a4e32', '#7d5f3e') + pyramid(k, x, y + u * 0.6 - h, s * 1.1, s * 0.9, s * 0.9, '#5a4128');
    case 'curved': return box(k, x, y + u * 0.6, s, s * 0.9, h, mat, hi(mat, 0.15)) + curvedRoof(k, x, y + u * 0.6, s, s * 0.9, h, c.roof);
    case 'pylon': return fl(k, pd([[x - s * 0.45, y + u - h], [x + s * 0.45, y + u - h], [x + s * 0.6, y + u], [x - s * 0.6, y + u]]), hi(mat, 0.06));
    default: return box(k, x, y + u * 0.6, s, s * 0.9, h, sh(mat, 0.04), hi(mat, 0.16)) + merlons(k, x, y + u * 0.6 - s * 0.45 - h + 0.2, s, hi(mat, 0.1), 3);
  }
}
/** Fortification on its own (previews, tests): around the base of a level-4 city of the given culture. `data-gaps` counts the breaches. */
export function fortificationArt(level: string, state: string, r: number, o: { civilization?: string | null; cityLevel?: number; seed?: number; harbor?: number | null } = {}) {
  const lv = FORTIFICATION_ORDER.indexOf(level as typeof FORTIFICATION_ORDER[number]) + 1;
  if (lv <= 0) return '';
  const cid = cultureOf(o.civilization), k = kOf(CULTURES[cid], 'focus', r / 50 * 0.5), w = walls(k, cid, lv, state, blobRadius(o.seed ?? 3, Math.max(1, Math.min(7, o.cityLevel ?? 4)), r), r, o.harbor ?? null);
  return `<g class="fortification" data-gaps="${w.gaps}">${w.back}${w.front}</g>`;
}

/* -------------------------------------------------------------------- city */
export interface CityPieceOptions {
  level: number;
  /** Seat color: the rim of the base and the standard. Ownership only. */
  color: string;
  seed: number;
  /** Hidden chassis id (or CORE 10 id) of the owner; unknown/null draws the neutral style. */
  civilization?: string | null;
  /** 'mesa' ≈ 42 px hex (mass, level, rim, walls, one dominant silhouette); 'focus' when zoomed in; 'detail' for the inspector. */
  lod?: Lod;
  fortification?: { level: string; state: string } | null;
  /** Angle (radians) from the city centre toward its harbor hex: the wall opens there (the pier itself is `harborArt`). */
  harbor?: number | null;
  work?: { workId: string; steps: number; complete: boolean } | null;
  /** Owner's standard and seat seal. */
  mark?: CivilizationMark | null;
  seat?: number | null;
}
const bandOf = (level: number) => level <= 2 ? 1 : level <= 4 ? 2 : level === 5 ? 3 : 4;
/**
 * The city as a sculpted miniature (V2.1): a raised stone base with the seat-colored rim, houses of the owner's material
 * culture whose number and height grow with N1–N7, one civic heart that is the culture's dominant silhouette, the wall
 * (fortification) around the base, the Obra de Legado and the owner's standard. Cached by its parameters.
 */
export function cityPieceArt(o: CityPieceOptions, r = 50): string {
  const level = Math.max(1, Math.min(7, Math.round(o.level))), lod = o.lod ?? 'mesa', cid = cultureOf(o.civilization);
  const key = ['city', level, r, o.color, o.seed, cid, lod, o.fortification?.level ?? '', o.fortification?.state ?? '', o.harbor === null || o.harbor === undefined ? '' : f1(o.harbor), o.work ? `${o.work.workId}:${o.work.steps}:${o.work.complete}` : '', o.mark ? `${o.mark.banner}:${o.mark.emblem}` : '', o.seat ?? ''].join('|');
  return memo(key, () => drawCity(o, level, lod, cid, r));
}
function drawCity(o: CityPieceOptions, level: number, lod: Lod, cid: CultureId, r: number) {
  const c = CULTURES[cid], u = r / 50, k = kOf(c, lod, (lod === 'mesa' ? 0.75 : lod === 'focus' ? 0.45 : 0.35) * u), R = rng(o.seed * 131 + level * 17);
  const rad = blobRadius(o.seed, level, r), top = ring(rad, 1, 0, 40), t = u * (lod === 'mesa' ? 3.8 : 3.2) * (level >= 5 ? 1.2 : 1);
  const shift = (pts: Pt[], dx: number, dy: number) => pts.map(p => [p[0] + dx, p[1] + dy] as Pt);
  let g = `<path d="${smooth(shift(top, u * 2, u * 4))}" fill="#000" opacity=".32"/>`;
  const fort = o.fortification && FORTIFICATION_ORDER.includes(o.fortification.level as typeof FORTIFICATION_ORDER[number]) ? walls(k, cid, FORTIFICATION_ORDER.indexOf(o.fortification.level as typeof FORTIFICATION_ORDER[number]) + 1, o.fortification.state, rad, r, o.harbor ?? null) : null;
  if (fort) g += fort.back;
  // The base: side band, top, a terrace for hill cities, the seat-colored rim.
  g += `<path d="${smooth(shift(top, 0, t))}" fill="${c.side}"/>` + `<path d="${smooth(top)}" fill="${c.plinth}"/>`;
  if (lod !== 'mesa' && c.pattern !== 'none') {
    for (let i = 0; i < 40; i++) {
      const th = (i / 40) * Math.PI * 2; if (Math.sin(th) < 0.18 || i % (lod === 'detail' ? 1 : 2)) continue;
      const q = rad(th); g += motif(c.pattern, Math.cos(th) * q, Math.sin(th) * q * 0.92 + t * 0.55, u * 0.62, sh(c.side, 0.45), c.accent);
    }
  }
  const terraced = (cid === 'israel' || cid === 'incas' || cid === 'mesopotamians') && level >= 3;
  if (terraced) { const inner = ring(rad, 0.68, 0, 32), lift = u * (cid === 'mesopotamians' ? 1.6 : 2.4); g += `<path d="${smooth(inner)}" fill="${sh(c.side, 0.05)}"/><path d="${smooth(shift(inner, 0, -lift))}" fill="${hi(c.plinth, 0.06)}"/>`; }
  g += `<path d="${smooth(top)}" fill="none" stroke="${o.color}" stroke-width="${f1(u * (lod === 'mesa' ? 3.6 : 2.4))}" stroke-linejoin="round"/>`;
  g += `<path d="${smooth(shift(top, 0, t))}" fill="none" stroke="${sh(o.color, 0.35)}" stroke-width="${f1(u * 1.1)}" stroke-dasharray="${f1(u * 4)} ${f1(u * 3)}" opacity=".75"/>`;
  // Streets from the heart (focus and detail): pale lanes the houses avoid.
  const streets: number[] = level >= 3 ? [0.35, 2.1, 3.7, 5.3].slice(0, level >= 6 ? 4 : level >= 4 ? 3 : 2).map(a => a + R() * 0.4) : [];
  if (lod !== 'mesa') for (const a of streets) { const q = rad(a) * 0.95; g += ln(`M0,0L${f1(Math.cos(a) * q)},${f1(Math.sin(a) * q * 0.92)}`, hi(c.plinth, 0.16), u * 2.2); }
  // Heart, Obra and standard spots; houses fill the rest, taller near the centre as the level grows.
  const band = bandOf(level), hk = kOf(c, lod, ((lod === 'mesa' ? 0.75 : lod === 'focus' ? 0.45 : 0.35) * u) / (u * (lod === 'mesa' ? 1.05 : 1))), heart = heartOf(hk, cid, band);
  const hs = u * (lod === 'mesa' ? 1.05 : 1) * Math.min(1, (rad(Math.PI / 2) * 1.75) / (heart.w * u + 1)), hy = -rad(-Math.PI / 2) * 0.12;
  const ext = rad(0), workAt: Pt = [ext * 0.58, -ext * 0.12], flagAt: Pt = [ext * 0.36, -ext * 0.66];
  const items: { y: number; svg: string }[] = [{ y: hy, svg: `<g transform="translate(0 ${f1(hy)}) scale(${f1(hs * 100) / 100})">${heart.g}</g>` }];
  const n = (lod === 'mesa' ? [2, 3, 5, 7, 9, 10, 12] : [3, 6, 9, 13, 17, 21, 25])[level - 1]! + (lod === 'detail' ? 5 : 0);
  const bs = u * (lod === 'mesa' ? 7.8 : 6.4) * (c.house === 'long' ? 0.85 : 1);
  const placed: { x: number; y: number; w: number; d: number }[] = [];
  const nearStreet = (x: number, y: number, pad: number) => lod !== 'mesa' && streets.some(a => { const dx = Math.cos(a), dy = Math.sin(a) * 0.92, along = x * dx + y * dy; return along > 0 && Math.abs(-x * dy + y * dx) < pad; });
  for (let tries = 0; placed.length < n && tries < n * 80; tries++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()), q = rad(a) * 0.86 * d, x = Math.cos(a) * q, y = Math.sin(a) * q * 0.92;
    const w = bs * (0.75 + R() * 0.55), dd = bs * (0.6 + R() * 0.35);
    if (Math.abs(x) < (heart.w * hs) / 2 + w * 0.45 && Math.abs(y - hy) < (heart.d * hs) / 2 + dd * 0.5) continue;
    if (o.work && Math.hypot(x - workAt[0], y - workAt[1]) < u * 9) continue;
    if (o.mark && Math.hypot(x - flagAt[0], y - flagAt[1]) < u * 5) continue;
    if (nearStreet(x, y, u * 1.4 + dd * 0.5)) continue;
    if (placed.some(p => Math.abs(p.x - x) < (p.w + w) / 2 + u * 0.8 && Math.abs(p.y - y) < (p.d + dd) / 2 + u * 0.6)) continue;
    if (!inHex(x, y, r * 0.8)) continue;
    placed.push({ x, y, w, d: dd });
    const h = u * (2.6 + level * 0.32) * (0.8 + R() * 0.5) * (1 + (level >= 4 ? 0.5 : 0.15) * (1 - d));
    items.push({ y, svg: houseOf(k, x, y, w, dd, h, R()) });
  }
  if (o.work) items.push({ y: workAt[1], svg: `<g transform="translate(${f1(workAt[0])} ${f1(workAt[1])})">${workArt(o.work.workId, u * (lod === 'mesa' ? 13 : 11), o.work.complete ? 3 : o.work.steps, true)}</g>` });
  if (o.mark) items.push({ y: flagAt[1], svg: `<g transform="translate(${f1(flagAt[0])} ${f1(flagAt[1])})">${bannerArt(o.mark, o.color, u * (lod === 'mesa' ? 24 : 20), 0)}</g>` });
  items.sort((a, b) => a.y - b.y);
  g += items.map(i => i.svg).join('');
  if (fort) g += fort.front;
  if (o.seat !== null && o.seat !== undefined) { const a = Math.PI * 0.4, q = rad(a); g += `<g transform="translate(${f1(Math.cos(a) * q)} ${f1(Math.sin(a) * q * 0.92 + t * 0.6)})">${seatSeal(o.seat, o.color, u * (lod === 'mesa' ? 11 : 8))}</g>`; }
  return `<g class="city-piece culture-${cid}" data-level="${level}" data-volumes="${placed.length + 1}">${g}</g>`;
}
/** Back-compatible entry (design previews, older callers): the miniature in the neutral style unless `civilization` is given. */
export function cityArt(level: number, r: number, o: { color: string; seed: number; depth?: boolean; detail?: boolean; civilization?: string | null; lod?: Lod }) {
  return cityPieceArt({ level, color: o.color, seed: o.seed, civilization: o.civilization ?? null, lod: o.lod ?? (o.depth || o.detail ? 'focus' : 'mesa') }, r);
}
/** Far zoom: compact seal with the level number. */
export function citySeal(level: number, r: number, color: string) {
  return `<path d="${hexPath(r)}" fill="${mix(color, INK, 0.55)}" stroke="${color}" stroke-width="${f1(r * 0.16)}"/><text y="${f1(r * 0.36)}" text-anchor="middle" font-family="Cinzel,Georgia,serif" font-weight="700" font-size="${f1(r * 1.05)}" fill="${LIGHT}">${level}</text>`;
}
/**
 * Detalhe: the same city larger, for the inspector/Details panel. A complete <svg> (default 220 px) with the ground hex, the
 * city at full detail, walls, the quay toward the water when it has a port, the Obra and the owner's standard.
 */
export function cityDetailArt(o: Omit<CityPieceOptions, 'lod' | 'harbor'> & { harbor?: boolean | number | null; px?: number; terrain?: string }): string {
  const px = o.px ?? 220, r = 100, harbor = o.harbor === true ? Math.PI / 3 : typeof o.harbor === 'number' ? o.harbor : null;
  const ground = o.terrain ?? '#5f6f45';
  let g = `<path d="${hexPath(r * 1.04)}" fill="${ground}" stroke="#0b1114" stroke-width="2"/>`;
  if (harbor !== null) { const x = Math.cos(harbor) * r * 1.866, y = Math.sin(harbor) * r * 1.866; g = `<path d="${hexPath(r * 1.04, x, y)}" fill="#264a5c" stroke="#0b1114" stroke-width="2"/>` + g; }
  g += cityPieceArt({ ...o, harbor, lod: 'detail' }, r);
  if (harbor !== null) g += harborArt(o.civilization, harbor, r, 'detail');
  // With a port the frame slides toward the water so the pier and its boat stay in view.
  const vx = harbor === null ? -118 : -118 + Math.cos(harbor) * 34, vy = harbor === null ? -118 : -118 + Math.sin(harbor) * 34;
  return `<svg class="city-detail-art" width="${px}" height="${px}" viewBox="${f1(vx)} ${f1(vy)} 236 236" role="img" aria-label="Cidade nível ${o.level}"><defs><clipPath id="city-detail-clip"><rect x="${f1(vx)}" y="${f1(vy)}" width="236" height="236"/></clipPath></defs><g clip-path="url(#city-detail-clip)">${g}</g></svg>`;
}

/* -------------------------------------------------------------------- port */
function boatArt(boat: Boat, L: number, k: K) {
  const w = L * 0.22, hl = L / 2, wood = '#5a4029', dk = '#2b1f14';
  const hull = (d: string, col = wood) => fl(k, d, col);
  switch (boat) {
    case 'trireme': return ln(Array.from({ length: 7 }, (_, i) => `M${f1(-hl * 0.6 + i * hl * 0.2)},${f1(-w * 0.5)}l-1,${f1(-w * 0.9)}M${f1(-hl * 0.6 + i * hl * 0.2)},${f1(w * 0.5)}l-1,${f1(w * 0.9)}`).join(''), '#c9b48a', 0.5) + hull(`M${-hl},${f1(-w / 2)}L${f1(hl * 0.8)},${f1(-w / 2)}L${hl + 2},0L${f1(hl * 0.8)},${f1(w / 2)}L${-hl},${f1(w / 2)}Q${-hl - 2},0 ${-hl},${f1(-w / 2)}Z`, '#3b3a3e') + `<circle cx="${f1(hl * 0.62)}" cy="0" r="0.7" fill="#e8dcc0"/>`;
    case 'papyrus': return hull(`M${-hl - 1},${f1(-w * 0.9)}Q${-hl * 0.6},${f1(w * 0.7)} 0,${f1(w * 0.6)}Q${hl * 0.6},${f1(w * 0.7)} ${hl + 1},${f1(-w * 0.9)}Q${hl * 0.5},${f1(-w * 0.2)} 0,${f1(-w * 0.35)}Q${-hl * 0.5},${f1(-w * 0.2)} ${-hl - 1},${f1(-w * 0.9)}Z`, '#cdb46e') + ln(`M${f1(-hl * 0.6)},${f1(-w * 0.1)}v${f1(w * 0.5)}M0,${f1(-w * 0.3)}v${f1(w * 0.8)}M${f1(hl * 0.6)},${f1(-w * 0.1)}v${f1(w * 0.5)}`, '#8a7440', 0.4) + fl(k, pd([[-2, -w * 0.4], [2, -w * 0.4], [2, w * 0.3], [-2, w * 0.3]]), '#e8dcc0');
    case 'quffa': return fl(k, ell(0, 0, w * 1.5, w * 1.5), '#7a5f3a') + fp(ell(0, 0, w * 1.05, w * 1.05), '#4a3a24') + ln(ell(0, 0, w * 1.3, w * 1.3), '#2a2018', 0.4, ' stroke-dasharray="0.6 0.6"');
    case 'galley': return hull(`M${-hl},${f1(-w / 2)}L${f1(hl * 0.7)},${f1(-w / 2)}Q${hl + 1},0 ${f1(hl * 0.7)},${f1(w / 2)}L${-hl},${f1(w / 2)}Z`) + fl(k, pd([[-1, -w * 1.3], [1.4, -w * 1.3], [1.4, w * 1.3], [-1, w * 1.3]]), '#e6dcc4') + ln(`M-1,${f1(-w * 0.4)}H1.4M-1,${f1(w * 0.4)}H1.4`, '#2f5f8f', 0.6);
    case 'gaulos': return hull(ell(0, 0, hl, w * 0.75), '#6a4a2e') + fl(k, pd([[-1.2, -w * 1.2], [1.2, -w * 1.2], [1.2, w * 1.2], [-1.2, w * 1.2]]), '#ece2c8') + ln(`M-1.2,${f1(-w * 0.6)}H1.2M-1.2,0H1.2M-1.2,${f1(w * 0.6)}H1.2`, '#a8603f', 0.5);
    case 'liburna': return ln(Array.from({ length: 5 }, (_, i) => `M${f1(-hl * 0.5 + i * hl * 0.25)},${f1(-w * 0.5)}l-1,${f1(-w * 0.8)}M${f1(-hl * 0.5 + i * hl * 0.25)},${f1(w * 0.5)}l-1,${f1(w * 0.8)}`).join(''), '#c9b48a', 0.5) + hull(`M${-hl},${f1(-w / 2)}L${f1(hl * 0.75)},${f1(-w / 2)}L${hl + 1.5},0L${f1(hl * 0.75)},${f1(w / 2)}L${-hl},${f1(w / 2)}Z`) + fl(k, pd([[-1, -w], [1, -w], [1, w], [-1, w]]), '#9a4a32');
    case 'drakkar': return hull(`M${-hl - 2},0Q${-hl * 0.6},${f1(-w * 0.75)} 0,${f1(-w * 0.62)}Q${hl * 0.6},${f1(-w * 0.75)} ${hl + 2},0Q${hl * 0.6},${f1(w * 0.75)} 0,${f1(w * 0.62)}Q${-hl * 0.6},${f1(w * 0.75)} ${-hl - 2},0Z`, '#4a3626') + Array.from({ length: 6 }, (_, i) => `<circle cx="${f1(-hl * 0.6 + i * hl * 0.24)}" cy="${f1(-w * 0.55)}" r="0.8" fill="${i % 2 ? '#c9b48a' : '#8a3f3a'}"/><circle cx="${f1(-hl * 0.6 + i * hl * 0.24)}" cy="${f1(w * 0.55)}" r="0.8" fill="${i % 2 ? '#8a3f3a' : '#c9b48a'}"/>`).join('') + fl(k, pd([[-1.4, -w * 1.4], [1.4, -w * 1.4], [1.4, w * 1.4], [-1.4, w * 1.4]]), '#e8dcc0') + [-0.84, -0.28, 0.28, 0.84].map(s => fp(pd([[-1.4, w * s - w * 0.14], [1.4, w * s - w * 0.14], [1.4, w * s + w * 0.14], [-1.4, w * s + w * 0.14]]), '#a23b30')).join('');
    case 'junk': return hull(`M${-hl},${f1(-w * 0.6)}L${f1(hl * 0.7)},${f1(-w * 0.55)}Q${hl + 1},0 ${f1(hl * 0.7)},${f1(w * 0.55)}L${-hl},${f1(w * 0.6)}Z`, '#5a3a26') + [-hl * 0.35, hl * 0.2].map(x => fl(k, pd([[x - 1.6, -w * 1.25], [x + 1.6, -w * 1.25], [x + 1.6, w * 1.25], [x - 1.6, w * 1.25]]), '#b5643e') + ln(`M${f1(x - 1.6)},${f1(-w * 0.6)}h3.2M${f1(x - 1.6)},0h3.2M${f1(x - 1.6)},${f1(w * 0.6)}h3.2`, '#4a2a1a', 0.4)).join('');
    case 'dhow': return hull(`M${-hl},${f1(-w * 0.45)}L${f1(hl * 0.6)},${f1(-w * 0.5)}L${hl + 2},0L${f1(hl * 0.6)},${f1(w * 0.5)}L${-hl},${f1(w * 0.45)}Z`, '#6e4a2c') + fl(k, pd([[-hl * 0.6, -w * 0.2], [hl * 0.7, -w * 1.6], [hl * 0.2, w * 0.4]]), '#f0e6d0');
    case 'totora': return [-w * 0.8, w * 0.8].map(y => fl(k, `M${-hl * 0.8},${f1(y)}Q0,${f1(y + w * 0.6)} ${f1(hl * 0.8)},${f1(y - w * 0.1)}L${hl},${f1(y - w * 0.8)}Q${f1(hl * 0.6)},${f1(y - w * 0.3)} 0,${f1(y - w * 0.35)}Q${-hl * 0.7},${f1(y - w * 0.3)} ${-hl * 0.8},${f1(y)}Z`, '#c9b16a')).join('');
    default: return hull(`M${-hl},${f1(-w / 2)}L${f1(hl * 0.7)},${f1(-w / 2)}Q${hl + 1},0 ${f1(hl * 0.7)},${f1(w / 2)}L${-hl},${f1(w / 2)}Z`) + `<circle r="1" fill="${dk}"/>`;
  }
}
/**
 * Porto: the only urban construction that leaves the city hex (V2.1 §1.2). From the base, a quay along the shared edge and a
 * pier across it into the navigable water, two bronze bollards on the edge, the culture's boat at the pier. `angle` points
 * from the city centre to the harbor hex centre. Drawn in the city's frame, above the neighbouring tiles.
 */
export function harborArt(civilization: string | null | undefined, angle: number, r = 50, lod: Lod = 'mesa') {
  const cid = cultureOf(civilization);
  return memo(`port|${cid}|${f1(angle)}|${r}|${lod}`, () => {
    const c = CULTURES[cid], u = r / 50, k = kOf(c, lod, (lod === 'mesa' ? 0.7 : 0.45) * u), deg = (angle * 180) / Math.PI, near = lod !== 'mesa';
    const e = r * 0.866, pier = c.pier, plank = sh(pier, 0.35), x0 = r * 0.6, x1 = r * 1.42, pw = u * (lod === 'mesa' ? 7.6 : 6.4);
    let g = '';
    // Quay along the edge (inside the city hex), then the pier and its head.
    if (cid === 'india') for (let i = 0; i < 3; i++) g += fl(k, pd([[e - u * (7 - i * 2.2), -r * 0.3 + i * u], [e - u * (5 - i * 2.2), -r * 0.3 + i * u], [e - u * (5 - i * 2.2), r * 0.3 - i * u], [e - u * (7 - i * 2.2), r * 0.3 - i * u]]), i % 2 ? sh(pier, 0.08) : pier);
    else g += fl(k, pd([[e - u * 6.5, -r * 0.3], [e + u * 0.5, -r * 0.3], [e + u * 0.5, r * 0.3], [e - u * 6.5, r * 0.3]]), pier);
    if (cid === 'mesopotamians') g += ln(`M${f1(e - u * 3)},${f1(-r * 0.28)}V${f1(r * 0.28)}`, '#2f6f8f', u * 1.2);
    g += fl(k, pd([[x0, -pw / 2], [x1, -pw / 2], [x1, pw / 2], [x0, pw / 2]]), pier);
    g += fl(k, pd([[x1 - u * 3, -pw * 1.25], [x1 + u * 1.5, -pw * 1.25], [x1 + u * 1.5, pw * 1.25], [x1 - u * 3, pw * 1.25]]), hi(pier, 0.06));
    if (near) {
      if (c.timberPier) for (let x = x0 + u * 2; x < x1; x += u * 2.2) g += ln(`M${f1(x)},${f1(-pw / 2)}V${f1(pw / 2)}`, plank, 0.35);
      else for (let x = x0 + u * 3; x < x1; x += u * 4.4) g += ln(`M${f1(x)},${f1(-pw / 2)}V${f1(pw / 2)}M${f1(x + u * 2.2)},${f1(-pw / 2)}V0`, plank, 0.3);
      if (cid === 'romans') for (let x = x0 + u * 4; x < x1 - u * 2; x += u * 4) g += fp(`M${f1(x - u)},${f1(pw / 2)}A${f1(u)},${f1(u)} 0 0,1 ${f1(x + u)},${f1(pw / 2)}Z`, '#1d2a30');
    }
    // Two bronze bollards where the city touches the water (obelisk-like for the Egyptians).
    for (const s of [-1, 1]) g += cid === 'egyptians' && near ? obelisk(k, e + u * 0.6, s * pw * 0.95 + u, u * 1.4, u * 3.4, '#e2d6b4', c.metal) : `<circle cx="${f1(e + u * 0.6)}" cy="${f1(s * pw * 0.95)}" r="${f1(u * 1.25)}" fill="${c.metal}" stroke="${INK}" stroke-width="${f1(u * 0.35)}"/>`;
    g += `<g transform="translate(${f1(r * 1.34)} ${f1(pw * 0.5 + u * 6.4)})">${boatArt(c.boat, u * (lod === 'mesa' ? 26 : 22), k)}</g>`;
    return `<g class="harbor culture-${cid}"><g transform="translate(${f1(u * 1.4)} ${f1(u * 2.2)}) rotate(${f1(deg)})" opacity=".35"><path d="${pd([[x0, -pw / 2], [x1 + u * 1.5, -pw / 2], [x1 + u * 1.5, pw / 2], [x0, pw / 2]])}" fill="#000"/></g><g transform="rotate(${f1(deg)})">${g}</g></g>`;
  });
}

/* ---------------------------------------------------------- Obras de Legado */
export const LEGACY_WORK_IDS = ['archive-of-horizons', 'house-of-accord', 'tidal-exchange', 'monument-of-voices', 'watch-citadel', 'road-of-communities', 'sky-instrument', 'inquiry-campus', 'world-council', 'common-mint', 'terraced-reserves', 'shared-foundry'] as const;
const WK = kOf(CULTURES.neutral, 'detail', 0.9);
const ST = '#ddd3bb', ST2 = '#b9ae94', BRZ = '#c39a52', WD = '#6b4a32';
/** Each Obra at a 100-unit design scale: base ground at y ≈ +32, top ≈ −44 (LEGACY_WORK_IDENTITY silhouettes). */
const WORKS: Record<string, () => string> = {
  'archive-of-horizons': () => { const k = WK; let g = box(k, 0, 24, 58, 18, 11, ST2, ST); for (let i = 0; i < 6; i++) g += fp(`M${-24 + i * 9.6},${33}V${27}A3,3 0 0,1 ${-18 + i * 9.6},27V33Z`, '#3a2f24') + `<circle cx="${-21 + i * 9.6}" cy="30" r="1.2" fill="#e8d9a8"/>`; g += box(k, 0, 15, 40, 12, 9, ST2, ST); for (let i = 0; i < 4; i++) g += fp(`M${-15 + i * 9},${21}V${16.5}A2.4,2.4 0 0,1 ${-10.2 + i * 9},16.5V21Z`, '#3a2f24'); return g + cyl(k, 0, 9, 8, 34, ST2, ST) + ln('M-8,-6H8M-8,-14H8', '#8f8570', 0.8) + cyl(k, 0, -25, 5, 7, '#f2d79a', BRZ) + dome(k, 0, -32, 5.2, BRZ) + `<circle cx="0" cy="-28" r="7" fill="#f6d27a" opacity=".22"/>`; },
  'house-of-accord': () => box(WK, 0, 26, 70, 26, 3, ST2, ST) + temple(WK, 0, 22, 62, 20, 15, ST, '#a8573a', 8),
  'tidal-exchange': () => { const k = WK; let g = fp('M-44,30Q-30,26 -16,30T12,30T40,30L44,38L-44,38Z', '#2f5f78') + ln('M-40,34q6,-3 12,0t12,0t12,0t12,0t12,0', '#9cc4d4', 0.8); g += fl(k, pd([[-34, 0], [24, 0], [24, 30], [-34, 30]]), ST2); for (let i = 0; i < 4; i++) g += fp(`M${-30 + i * 14},30V${18}A5,5 0 0,1 ${-20 + i * 14},18V30Z`, '#1f3540'); g += box(k, -5, 2, 62, 14, 1.5, ST2, ST) + gableHouse(k, -5, -2, 50, 12, 10, ST, '#7a6a5a'); return g + ln('M30,30V-30L46,-26', WD, 2.6) + ln('M30,-22L38,-29', WD, 1.4) + ln('M43,-27V-8', '#2a2018', 0.7) + box(k, 43, -4, 6, 4, 4, '#8a6a42', '#a8875a'); },
  'monument-of-voices': () => { const k = WK; let back = '', front = ''; const ped = cyl(k, 0, 30, 34, 4, ST2, ST); for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + 0.2, x = Math.cos(a) * 27, y = 24 + Math.sin(a) * 9, col = cyl(k, x, y, 2.4, 22, ST2, ST) + box(k, x, y - 22, 6, 3, 1.4, ST, hi(ST, 0.1)); if (Math.sin(a) < 0) back += col; else front += col; } return ped + back + fl(k, pd([[-6, 26], [6, 26], [4.5, -30], [0, -40], [-4.5, -30]]), '#cfc4aa') + fp(pd([[0, 26], [6, 26], [4.5, -30], [0, -40]]), '#00000022') + ln('M-2,20V-26M2,18V-24', '#8a7f68', 0.7) + fl(k, pd([[-4.5, -30], [0, -40], [4.5, -30], [0, -33]]), BRZ) + front; },
  'watch-citadel': () => { const k = WK, tw = (x: number, y: number, h: number) => box(k, x, y, 10, 9, h, ST2, ST) + merlons(k, x, y - 4.5 - h + 0.3, 10, ST, 3); return box(k, 0, 22, 56, 26, 8, ST2, ST) + tw(-24, 10, 24) + tw(24, 10, 24) + box(k, 0, 18, 18, 14, 46, ST2, ST) + merlons(k, 0, 11 - 46 + 0.3, 18, ST, 4) + ln('M0,-35V-41', WD, 1.2) + `<circle cx="0" cy="-44" r="3.4" fill="#f08a3a"/><circle cx="0" cy="-45" r="1.6" fill="#ffd27a"/>` + tw(-24, 34, 22) + tw(24, 34, 22); },
  'road-of-communities': () => { const k = WK; let g = fp('M-34,40L34,40L7,-4L-7,-4Z', '#b6a684') + ln('M-17,40L-3.5,-4M17,40L3.5,-4M-24,30H24M-17,20H17M-12,10H12M-8,2H8', '#8a7a5a', 0.7); g += box(k, 0, 14, 34, 8, 30, ST2, ST) + fp('M-7,18V2A7,7 0 0,1 7,2V18Z', '#3a3024') + fl(k, pd([[-18, -16], [18, -16], [18, -12], [-18, -12]]), hi(ST, 0.1)); return g + ln('M-18,-21H18', BRZ, 1.2) + cyl(k, 26, 34, 3.2, 10, ST2, ST) + fp(ell(26, 24, 3.2, 1.3), BRZ); },
  'sky-instrument': () => { const k = WK; let g = box(k, 0, 30, 26, 14, 9, ST2, ST) + cyl(k, 0, 21, 4, 14, ST2, ST); g += `<g fill="none" stroke="${INK}" stroke-width="4.4" stroke-opacity=".55"><ellipse cx="0" cy="-14" rx="21" ry="21"/><ellipse cx="0" cy="-14" rx="21" ry="7"/><ellipse cx="0" cy="-14" rx="21" ry="6" transform="rotate(-32 0 -14)"/></g><g fill="none" stroke="${BRZ}" stroke-width="2.6"><ellipse cx="0" cy="-14" rx="21" ry="21"/><ellipse cx="0" cy="-14" rx="21" ry="7"/><ellipse cx="0" cy="-14" rx="21" ry="6" transform="rotate(-32 0 -14)"/></g>`; return g + ln('M-6,6L6,-34', '#7a5a2a', 1.4) + `<circle cx="0" cy="-14" r="3.6" fill="#3d5f7a" stroke="${INK}" stroke-width=".8"/>`; },
  'inquiry-campus': () => { const k = WK; let g = box(k, 0, 2, 58, 8, 10, ST2, '#a8573a') + box(k, -25, 18, 8, 26, 8, ST2, '#a8573a') + box(k, 25, 18, 8, 26, 8, ST2, '#a8573a'); g += fp(pd([[-21, 6], [21, 6], [21, 30], [-21, 30]]), '#8f9a5c') + ln('M0,6V30M-21,18H21', '#cfc4aa', 1.4) + cyl(k, 0, 20, 6, 3, ST2, '#4f8fa8') + ln('M0,15V9', '#9cd4e4', 1); g += fl(k, pd([[-29, 28], [29, 28], [29, 37], [-29, 37]]), sh(ST, 0.45)); for (let i = 0; i < 9; i++) g += fp(pd([[-27 + i * 6.6, 29], [-25.4 + i * 6.6, 29], [-25.4 + i * 6.6, 37], [-27 + i * 6.6, 37]]), ST); return g + fl(k, pd([[-30, 24], [30, 24], [30, 28], [-30, 28]]), '#a8573a'); },
  'world-council': () => { const k = WK; let g = cyl(k, 0, 36, 38, 3, ST2, ST) + cyl(k, 0, 32, 32, 3, ST2, ST) + cyl(k, 0, 28, 26, 3, ST2, ST) + cyl(k, 0, 25, 20, 18, ST2, ST); for (let i = 0; i < 9; i++) g += ln(`M${-16 + i * 4},${10}V${26 + Math.sin((i / 8) * Math.PI) * 6}`, '#8f8570', 0.9); return g + fl(k, ell(0, 7, 21, 8.8), ST) + dome(k, 0, 7, 20, BRZ, 0.55) + fp(ell(0, -3.6, 3, 1.2), '#3a2f24'); },
  'common-mint': () => { const k = WK; let g = box(k, 0, 30, 36, 22, 26, ST2, ST) + fl(k, pd([[-20, -18], [20, -18], [20, -15], [-20, -15]]), hi(ST, 0.1)) + fp('M-6,41V28A6,6 0 0,1 6,28V41Z', '#2e251c'); g += ln('M0,26V17M-11,18.5H11', BRZ, 1.8) + ln('M-11,18.5L-13.5,23M-11,18.5L-8.5,23M11,18.5L8.5,23M11,18.5L13.5,23', BRZ, 0.7) + fl(k, 'M-14.5,23Q-11,26 -7.5,23Z', BRZ) + fl(k, 'M7.5,23Q11,26 14.5,23Z', BRZ) + `<circle cx="0" cy="16" r="1.6" fill="${BRZ}" stroke="${INK}" stroke-width=".5"/>`; return g + cyl(k, 23, 40, 3.4, 2, BRZ, hi(BRZ, 0.3)) + cyl(k, 23, 38, 3.4, 2, BRZ, hi(BRZ, 0.3)) + cyl(k, 30, 41, 3.4, 2, BRZ, hi(BRZ, 0.3)); },
  'terraced-reserves': () => { const k = WK, q = (x: number, y: number) => cyl(k, x, y, 3.6, 5, ST2, ST2) + cone(k, x, y - 5, 4.4, 6, '#c6a45d'); return box(k, 0, 34, 70, 16, 7, ST2, '#8f9a5c') + q(-24, 32) + q(24, 32) + box(k, 0, 22, 54, 14, 7, ST2, '#8f9a5c') + q(-16, 19) + q(16, 19) + box(k, 0, 11, 38, 12, 7, ST2, '#8f9a5c') + q(-8, 8) + q(0, 10) + q(8, 8) + ln('M-2,42V26M2,42V26', hi(ST, 0.2), 1); },
  'shared-foundry': () => { const k = WK; return `<circle cx="20" cy="-40" r="6" fill="#d8d4cc" opacity=".35"/><circle cx="26" cy="-49" r="4.4" fill="#d8d4cc" opacity=".25"/>` + box(k, 20, 18, 9, 9, 52, '#8a5a40', '#a06a4c') + merlons(k, 20, 13.5 - 52 + 0.3, 9, '#a06a4c', 2) + gableHouse(k, -6, 28, 42, 20, 18, ST2, '#4f565a') + fp('M-12,38V30A4,4 0 0,1 -4,30V38Z', '#f08a3a') + `<circle cx="-8" cy="33" r="5" fill="#f6b24a" opacity=".25"/>`; },
};
/**
 * An Obra de Legado as one physical piece — the SAME silhouette on the card and on the city (LEGACY_WORK_IDENTITY). Fragment
 * fitting in ±size around (0,0). `progress` = steps done (0 planned · 1 scaffold · 2 rising · 3 finished, bronze-crowned).
 */
export function workArt(workId: string, size = 48, progress = 3, onCity = false): string {
  const steps = Math.max(0, Math.min(3, Math.round(progress)));
  return memo(`work|${workId}|${f1(size)}|${steps}|${onCity}`, () => {
    const draw = WORKS[workId] ?? WORKS['house-of-accord']!, s = size / 50, id = `wk-${workId}-${steps}`;
    const base = `${fp(ell(2, 38, 46, 10), '#000', ' opacity=".28"')}${fl(WK, ell(0, 36, 44, 9.5), onCity ? '#c9bfa6' : '#b3a98f')}`;
    let body = draw();
    if (steps < 3) {
      const cut = steps <= 1 ? 26 : -4;
      body = `<clipPath id="${id}"><rect x="-60" y="${cut}" width="120" height="80"/></clipPath><g opacity="${steps === 0 ? 0.25 : 1}"><g clip-path="url(#${id})">${body}</g><g opacity=".22">${body}</g></g>`;
      const top = steps <= 1 ? 6 : -22;
      body += `<g stroke="${WD}" stroke-width="1.6" fill="none" stroke-linecap="round">${[-30, -15, 0, 15, 30].map(x => `<path d="M${x},36V${top}"/>`).join('')}${Array.from({ length: Math.floor((36 - top) / 9) }, (_, i) => `<path d="M-32,${36 - (i + 1) * 9}H32"/>`).join('')}<path d="M-30,36L-15,${top + 4}M15,36L30,${top + 4}"/></g>`;
    } else body += `<path d="M0,-50l1.4,3.2l3.4,0.2l-2.6,2.2l0.9,3.3l-3.1,-1.8l-3.1,1.8l0.9,-3.3l-2.6,-2.2l3.4,-0.2Z" fill="${BRZ}" stroke="${INK}" stroke-width=".6" transform="translate(${onCity ? 0 : 30} ${onCity ? -2 : 6})"/>`;
    return `<g class="legacy-work" data-work="${workId}" data-steps="${steps}" transform="scale(${f1(s * 100) / 100}) translate(0 -2)">${base}${body}</g>`;
  });
}

/* ------------------------------------------------------- discovery markers */
/** Kinds that keep a permanent marker on the map (mirrors DISCOVERY_INFO[kind].marker). Perigo and Terra comum leave none. */
export const DISCOVERY_MARKERS: ReadonlySet<string> = new Set(['RUIN', 'DEPOSIT', 'PASSAGE', 'ANCHORAGE', 'CAMP']);
const DISCOVERIES: Record<string, () => string> = {
  RUIN: () => { const k = WK, broken = (x: number, y: number, h: number) => fl(k, `M${x - 4},${y}V${y - h}L${x - 1.5},${y - h - 2.4}L${x + 1},${y - h + 0.6}L${x + 4},${y - h - 1.6}V${y}A4,1.7 0 0,1 ${x - 4},${y}Z`, ST2) + fp(pd([[x + 1.5, y - h + 0.3], [x + 4, y - h - 1.6], [x + 4, y], [x + 1.5, y + 1.5]]), '#00000026'); return fp(ell(2, 30, 42, 11), '#000', ' opacity=".25"') + fl(k, ell(0, 28, 40, 10), '#9a8f74') + broken(-16, 26, 26) + box(k, -4, 24, 18, 6, 5, ST2, ST) + broken(8, 22, 34) + broken(20, 30, 14) + fl(k, `M-30,34L-12,36A2,2 0 0,0 -11,32L-29,30A2,2 0 0,0 -30,34Z`, ST) + `<circle cx="-24" cy="27" r="2.4" fill="#6f8a4e"/><circle cx="14" cy="33" r="2" fill="#6f8a4e"/>`; },
  DEPOSIT: () => { const k = WK; return fp(ell(2, 30, 42, 11), '#000', ' opacity=".25"') + fl(k, ell(0, 28, 40, 10), '#7f7766') + fl(k, pd([[-30, 30], [-22, 4], [-8, -6], [6, 2], [14, -12], [28, 8], [32, 30]]), '#857b68') + fp(pd([[-8, -6], [6, 2], [2, 30], [-22, 30], [-22, 4]]), '#9a8f7a') + fp(pd([[14, -12], [28, 8], [32, 30], [10, 30], [6, 2]]), '#6a6152') + fl(k, pd([[-6, 10], [-3, -14], [0, 10]]), '#7fb3c4') + fl(k, pd([[1, 12], [5, -6], [8, 12]]), '#5f97ab') + fl(k, pd([[-12, 14], [-10, -2], [-7, 14]]), '#9cc8d4') + ln('M14,6L20,16L26,14M-24,20L-14,24L-6,22', '#c0763a', 1.8); },
  PASSAGE: () => { const k = WK; return fp(ell(2, 30, 42, 11), '#000', ' opacity=".25"') + fl(k, ell(0, 28, 40, 10), '#8a8268') + fl(k, pd([[-40, 28], [-34, -2], [-24, -16], [-14, -4], [-10, 28]]), '#77705e') + fl(k, pd([[10, 28], [16, -8], [26, -20], [36, 0], [40, 28]]), '#6c6556') + fp(pd([[-24, -16], [-14, -4], [-10, 28], [-22, 28]]), '#00000022') + ln('M-6,38C-10,28 4,20 -2,10C-7,2 3,-6 0,-16', '#a39874', 6) + ln('M-6,38C-10,28 4,20 -2,10C-7,2 3,-6 0,-16', '#eadcb2', 1.6, ' stroke-dasharray="2.6 2"') + cyl(k, 8, 20, 4, 3, ST2, ST) + cyl(k, 8, 17, 3, 3, ST2, ST) + cyl(k, 8, 14, 2, 2.6, ST2, ST); },
  ANCHORAGE: () => { const k = WK; return fp(ell(2, 30, 42, 11), '#000', ' opacity=".25"') + fl(k, 'M-40,28C-40,8 -20,-6 0,-6C20,-6 40,8 40,28C30,22 18,10 0,10C-18,10 -30,22 -40,28Z', '#8f8a6a') + fl(k, 'M-28,28C-22,18 -10,12 0,12C10,12 22,18 28,28C18,34 -18,34 -28,28Z', '#2f6a80') + ln('M-16,24q4,-2 8,0t8,0t8,0', '#9cc4d4', 0.9) + fl(k, pd([[18, 14], [30, 10], [32, 16], [22, 20]]), '#77705e') + cyl(k, 24, 14, 1.6, 9, WD, hi(WD, 0.3)) + `<g transform="translate(-6 24) rotate(-12)">${boatArt('plain', 16, k)}</g>`; },
  CAMP: () => { const k = WK, tent = (x: number, y: number, s: number, c: string) => fl(k, pd([[x - 10 * s, y], [x, y - 16 * s], [x + 10 * s, y]]), c) + fp(pd([[x, y - 16 * s], [x + 10 * s, y], [x + 2 * s, y]]), '#00000030') + fp(pd([[x - 2 * s, y], [x, y - 7 * s], [x + 2 * s, y]]), '#1d1510') + ln(`M${x},${y - 16 * s}l-2,-4M${x},${y - 16 * s}l2,-4`, WD, 1); return fp(ell(2, 30, 42, 11), '#000', ' opacity=".25"') + fl(k, ell(0, 28, 40, 10), '#7a6a50') + tent(-14, 20, 1.15, '#8a5a40') + tent(16, 18, 0.9, '#9a6a46') + `<circle cx="2" cy="31" r="4.2" fill="#3a2a1c"/><path d="M-1,31Q2,22 5,31Z" fill="#f08a3a"/><path d="M0.6,31Q2,26 3.4,31Z" fill="#ffd27a"/><circle cx="4" cy="16" r="3.6" fill="#cfcac0" opacity=".3"/>` + ln('M26,34L34,14M34,34L26,14', '#4a3a2a', 1.4) + fp(pd([[33, 14], [35.5, 10], [34.8, 15]]), '#b9b4aa') + fp(pd([[27, 14], [24.5, 10], [25.2, 15]]), '#b9b4aa'); },
  DANGER: () => { const k = WK; return fp(ell(2, 30, 42, 11), '#000', ' opacity=".25"') + fl(k, ell(0, 28, 40, 10), '#6a5a48') + fp('M-30,28L-14,22L-6,30L6,20L14,30L30,24', 'none', ` stroke="#1d1510" stroke-width="2.4"`) + fl(k, pd([[-20, 26], [-14, 4], [-8, 26]]), '#5a5048') + fl(k, pd([[4, 26], [12, -2], [18, 26]]), '#4e4640') + fl(k, pd([[-4, 26], [0, 12], [4, 26]]), '#625850'); },
  NONE: () => { const k = WK; return fp(ell(2, 30, 42, 11), '#000', ' opacity=".25"') + fl(k, ell(0, 28, 40, 10), '#71844f') + ln('M-14,28q2,-8 4,0M-6,30q2,-10 4,0M8,28q2,-8 4,0M16,31q2,-7 4,0', '#4f6a38', 1.4); },
};
/** A Descoberta as a small 3D marker; fragment fitting in ±size around (0,0). The map draws only `DISCOVERY_MARKERS` kinds. */
export function discoveryArt(kind: string, size = 48): string {
  return memo(`disc|${kind}|${f1(size)}`, () => `<g class="discovery-art" data-kind="${kind}" transform="scale(${f1((size / 46) * 100) / 100}) translate(0 -8)">${(DISCOVERIES[kind] ?? DISCOVERIES.NONE!)()}</g>`);
}

/* ------------------------------------------------- exploration orientation */
/**
 * Abstract orientation mark for a face-down Region (never terrain): a ring of six notches with the chosen one lit and an
 * arrow pointing to it. `rotation` 0–5, 0 = up; each step turns 60°.
 */
export function orientationArt(rotation: number, size = 40) {
  const s = size / 40, rot = (((Math.round(rotation) % 6) + 6) % 6) * 60;
  let g = `<circle r="${f1(14 * s)}" fill="#0b1114" fill-opacity=".72" stroke="#e8dcc0" stroke-opacity=".55" stroke-width="${f1(1.4 * s)}"/>`;
  for (let i = 0; i < 6; i++) { const a = ((i * 60 - 90) * Math.PI) / 180; g += `<circle cx="${f1(Math.cos(a) * 17.5 * s)}" cy="${f1(Math.sin(a) * 17.5 * s)}" r="${f1(1.6 * s)}" fill="#e8dcc0" fill-opacity="${i * 60 === rot ? 1 : 0.3}"/>`; }
  g += `<g transform="rotate(${rot})"><path d="M0,${f1(-19 * s)}L${f1(5.5 * s)},${f1(-9 * s)}L${f1(2 * s)},${f1(-9 * s)}L${f1(2 * s)},${f1(6 * s)}L${f1(-2 * s)},${f1(6 * s)}L${f1(-2 * s)},${f1(-9 * s)}L${f1(-5.5 * s)},${f1(-9 * s)}Z" fill="#c9a45c" stroke="#0b1114" stroke-width="${f1(1.1 * s)}" stroke-linejoin="round"/></g>`;
  return `<g class="orientation-art" data-rotation="${rot / 60}">${g}</g>`;
}

/* ------------------------------------------------------------------ pieces */
/**
 * 32-unit design box. Every piece on the map is its own silhouette in the seat color with an ink outline — the civil pieces
 * too (UXDEC-018: no generic discs on the map). Discs are kept for inhabitants inside a city.
 */
export type PieceKind = 'INFANTRY' | 'GUARD' | 'RANGED' | 'CAVALRY' | 'SIEGE' | 'FLEET' | 'PIONEER' | 'ENVOY' | 'COASTAL_VESSEL';
const SHAPES: Record<PieceKind, (c: string) => string> = {
  INFANTRY: c => `<path d="M-11,-1 L11,-1 L11,10 Q11,13 8,13 L-8,13 Q-11,13 -11,10 Z" fill="${c}"/>` + [-7, 0, 7].map(x => `<path d="M${x - 1.6},-1 L${x - 1.6},-9 L${x},-14.5 L${x + 1.6},-9 L${x + 1.6},-1 Z" fill="${c}"/>`).join('') + `<path d="M-11,4 L11,4" stroke="${INK}" stroke-width="1.3"/>`,
  GUARD: c => `<path d="M0,-14 C9,-14 12,-11 12,-8 L12,2 C12,9 6,13 0,15 C-6,13 -12,9 -12,2 L-12,-8 C-12,-11 -9,-14 0,-14 Z" fill="${c}"/><path d="M0,-11 L0,12" stroke="${INK}" stroke-width="1.4"/><circle cy="-1" r="3" fill="${c}" stroke="${INK}" stroke-width="1.4"/>`,
  RANGED: c => `<path d="M-6,-14 C11,-10 11,10 -6,14 L-2,14 C5,8 5,-8 -2,-14 Z" fill="${c}"/><path d="M-5,-13 L-5,13" stroke="${INK}" stroke-width="1.2"/><path d="M-13,0 L11,0" stroke="${INK}" stroke-width="2.2"/><path d="M14,0 L8,-4 L8,4 Z" fill="${c}"/><path d="M-13,0 l-2,-3 M-13,0 l-2,3" stroke="${INK}" stroke-width="1.5"/>`,
  CAVALRY: c => `<path d="M-8,14 L-8,7 C-11,0 -8,-7 -2,-10 L0,-15 L3,-10 C9,-9 13,-3 13,2 L9,4.5 L5,1 C4,6 7,9 8,14 Z" fill="${c}"/><circle cx="4" cy="-5" r="1.5" fill="${INK}"/><path d="M-2,-10 C-6,-6 -7,0 -5,7" stroke="${INK}" stroke-width="1.2" fill="none"/>`,
  SIEGE: c => `<rect x="-13" y="4" width="26" height="5" rx="1" fill="${c}"/><path d="M-7,5 L0,-6 L7,5" stroke="${c}" stroke-width="3.2" fill="none"/><path d="M-12,1 L12,-12" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/><circle cx="12" cy="-12" r="3.2" fill="${c}"/><circle cx="-8" cy="11" r="3.6" fill="${c}"/><circle cx="8" cy="11" r="3.6" fill="${c}"/><circle cx="-8" cy="11" r="1.1" fill="${INK}"/><circle cx="8" cy="11" r="1.1" fill="${INK}"/>`,
  FLEET: c => `<path d="M-15,-5 L7,-5 Q14,-3 16,0 Q14,3 7,5 L-15,5 Q-17,5 -17,3 L-17,-3 Q-17,-5 -15,-5 Z" fill="${c}"/><path d="M-8,-5 l-2,-5 M-2,-5 l-2,-5 M4,-5 l-2,-5 M-8,5 l-2,5 M-2,5 l-2,5 M4,5 l-2,5" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/><path d="M-12,0 L8,0" stroke="${INK}" stroke-width="1.3"/>`,
  // Barca de Patrulha (COASTAL_VESSEL): a short open boat with two oars a side — the light warship of Era I.
  COASTAL_VESSEL: c => `<path d="M-12,-5 L5,-5 Q12,-3 14,0 Q12,3 5,5 L-12,5 Q-14,5 -14,3 L-14,-3 Q-14,-5 -12,-5 Z" fill="${c}"/><path d="M-6,-5 l-2,-6 M2,-5 l-2,-6 M-6,5 l-2,6 M2,5 l-2,6" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><circle cx="-3" r="2.2" fill="${INK}"/>`,
  // Pioneiro (original silhouette): a small caravan — arched cover on two wheels with a founding banner on a pole. A group that travels and settles.
  PIONEER: c => `<path d="M-15,8 L-15,-1 Q-15,-10 -4,-10 Q7,-10 7,-1 L7,8 Z" fill="${c}"/><path d="M-9,8 L-9,1 Q-6,-3 -3,1 L-3,8 Z" fill="${INK}"/><circle cx="-10" cy="11" r="4" fill="${c}"/><circle cx="3" cy="11" r="4" fill="${c}"/><circle cx="-10" cy="11" r="1.3" fill="${INK}"/><circle cx="3" cy="11" r="1.3" fill="${INK}"/><path d="M12,13 L12,-14" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M12,-14 L20,-10 L12,-6 Z" fill="${c}"/>`,
  // Envoy: a sealed letter — diplomacy, integration, influence.
  ENVOY: c => `<rect x="-13" y="-9" width="26" height="18" rx="2" fill="${c}"/><path d="M-12,-8 L0,1.5 L12,-8" stroke="${INK}" stroke-width="1.7" fill="none" stroke-linejoin="round"/><circle cy="2.5" r="4.2" fill="#b44a3a" stroke="${INK}" stroke-width="1.3"/>`,
};
export const CIVIL_PIECES: ReadonlySet<string> = new Set(['PIONEER', 'ENVOY']);
/** `signature`: the civilization's signature variant of this family (drawn with a star). `seat`: the seat index, drawn as the seat seal on the piece's rim so grayscale still tells the owner. */
export function pieceArt(kind: string, color: string, px = 36, count = 0, signature = false, seat: number | null = null) {
  const shape = SHAPES[kind as PieceKind] ?? SHAPES.INFANTRY, body = shape(color), s = px / 32;
  const outline = body.split(color).join(INK).replace(/fill="(?!none)[^"]+"/g, `fill="${INK}"`).replace(/stroke-width="([\d.]+)"/g, (_m, w: string) => `stroke-width="${+w + 2.6}"`);
  let g = `<g transform="scale(${f1(s * 100) / 100})"><g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round">${outline}</g>${body}`;
  if (signature) { const p: string[] = []; for (let i = 0; i < 8; i++) { const a = Math.PI / 4 * i - Math.PI / 2, rr = i % 2 ? 2.1 : 5; p.push(`${f1(12 + Math.cos(a) * rr)},${f1(-12 + Math.sin(a) * rr)}`); } g += `<path d="M${p.join('L')}Z" fill="${LIGHT}" stroke="${INK}" stroke-width="1.1"/>`; }
  if (seat !== null) g += `<g transform="translate(-13 11)">${seatSeal(seat, color, 10)}</g>`;
  if (count > 1) g += `<circle cx="12" cy="11" r="6.4" fill="${INK}" stroke="${color}" stroke-width="1.4"/><text x="12" y="14.3" text-anchor="middle" font-family="'Source Sans 3',sans-serif" font-weight="700" font-size="9.5" fill="${LIGHT}">${count}</text>`;
  return g + '</g>';
}

/* ------------------------------------------------------------------ emblems */
const star = (n: number, ro: number, ri: number, cy = 0) => 'M' + Array.from({ length: n * 2 }, (_, i) => { const a = (Math.PI * i) / n - Math.PI / 2, q = i % 2 ? ri : ro; return `${f1(Math.cos(a) * q)},${f1(cy + Math.sin(a) * q)}`; }).join('L') + 'Z';
const circleD = (x: number, y: number, rr: number) => `M${f1(x - rr)},${f1(y)}a${rr},${rr} 0 1,0 ${f1(2 * rr)},0a${rr},${rr} 0 1,0 ${f1(-2 * rr)},0`;
/** Stroked part of each emblem (±12 box). The CORE 10 emblems are historical and material; no modern flags or living religious symbols. */
const EMBLEMS: Record<Emblem, string> = {
  espiga: 'M0,10L0,-10M0,-6l-5,-4M0,-6l5,-4M0,-1l-5,-4M0,-1l5,-4M0,4l-5,-4M0,4l5,-4',
  passo: 'M-11,8L-5,-7L0,3L5,-7L11,8M-3,8L-3,2L3,2L3,8',
  ondas: 'M-11,-3q5.5,-6 11,0t11,0M-11,5q5.5,-6 11,0t11,0',
  farol: 'M-4,10L-2,-6L2,-6L4,10ZM-2,-6L0,-10L2,-6M3,-8L10,-11M3,-5L10,-3',
  tresvozes: 'M0,-6m-3.6,0a3.6,3.6 0 1,0 7.2,0a3.6,3.6 0 1,0 -7.2,0M-6,6m-3.6,0a3.6,3.6 0 1,0 7.2,0a3.6,3.6 0 1,0 -7.2,0M6,6m-3.6,0a3.6,3.6 0 1,0 7.2,0a3.6,3.6 0 1,0 -7.2,0',
  bigorna: 'M-10,-4L10,-4L6,1L3,1L3,5L6,9L-6,9L-3,5L-3,1L-10,1Z',
  olho: 'M-11,0Q0,-10 11,0Q0,10 -11,0ZM0,0m-3,0a3,3 0 1,0 6,0a3,3 0 1,0 -6,0',
  folha: 'M0,10L0,-2M0,8C-10,0 -6,-10 0,-10C6,-10 10,0 0,8',
  encruzilhada: 'M-10,-10L-4,-4M4,4L10,10M10,-10L4,-4M-4,4L-10,10M0,0m-5,0a5,5 0 1,0 10,0a5,5 0 1,0 -10,0',
  sol: 'M-9,5a9,9 0 0,1 18,0ZM0,-8L0,-12M-7,-5L-10,-8M7,-5L10,-8M-11,5L11,5',
  arcos: 'M-11,9L-11,-4L11,-4L11,9M-11,9a3.6,5 0 0,1 7.3,0M-3.6,9a3.6,5 0 0,1 7.3,0M3.7,9a3.6,5 0 0,1 7.3,0',
  chama: 'M0,10C-7,6 -6,-2 0,-10C6,-2 7,6 0,10ZM0,8C-2,5 -2,2 0,-2C2,2 2,5 0,8',
  moeda: 'M-8,-6a8,3 0 1,0 16,0a8,3 0 1,0 -16,0M-8,-6L-8,6a8,3 0 0,0 16,0L8,-6M-8,0a8,3 0 0,0 16,0',
  prisma: 'M0,-9L9,7L-9,7ZM-12,-1L-4,0M4,-1L12,-5M4,1L12,2M4,3L11,8',
  presa: 'M-9,10C-11,-3 -2,-11 10,-10C2,-6 -3,0 -4,10ZM2,10C2,4 5,0 10,-1',
  espiral: 'M0,0a2,2 0 0,1 4,0a4,4 0 0,1 -8,0a6,6 0 0,1 12,0a8,8 0 0,1 -16,0',
  elos: 'M-7,0m-4.5,0a4.5,4.5 0 1,0 9,0a4.5,4.5 0 1,0 -9,0M7,0m-4.5,0a4.5,4.5 0 1,0 9,0a4.5,4.5 0 1,0 -9,0M0,0m-4.5,0a4.5,4.5 0 1,0 9,0a4.5,4.5 0 1,0 -9,0',
  floco: 'M0,-11L0,11M-9.5,-5.5L9.5,5.5M-9.5,5.5L9.5,-5.5M0,-7l-3,-3M0,-7l3,-3M0,7l-3,3M0,7l3,3M-6,-3.5l-4,0M6,3.5l4,0M-6,3.5l-4,0M6,-3.5l4,0',
  // Helênicos — aspis: round bronze shield with a meander ring (the ticks) and a boss.
  aspis: circleD(0, 0, 10.5) + circleD(0, 0, 6.6) + Array.from({ length: 8 }, (_, i) => { const a = (Math.PI * i) / 4; return `M${f1(Math.cos(a) * 6.6)},${f1(Math.sin(a) * 6.6)}L${f1(Math.cos(a) * 10.5)},${f1(Math.sin(a) * 10.5)}`; }).join(''),
  // Egípcios — sema-tauy: windpipe tied with lotus (left) and papyrus (right).
  semtauy: 'M0,5V-7M-1.6,7C-6.6,5.6 -8,0 -7,-4.6M1.6,7C6.6,5.6 8,0 7,-4.6M-4.4,1.6Q0,4.4 4.4,1.6',
  // Mesopotâmicos — eight-pointed star on a wedge.
  estrela8: 'M-6,11L6,11L0,7Z',
  // Persas — royal eagle, wings spread level, over a shield arc.
  aguia: 'M-7,10.5Q0,6.8 7,10.5',
  // Israel e Judá — standing lion (tradition): tail with tuft.
  leao: 'M9.2,-3.4Q12.6,-3.6 11.4,-8',
  // Romanos — aquila: wings raised, on a bar over a laurel.
  aquila: '',
  // Nórdicos — raven in profile, wing raised.
  corvo: '',
  // Chineses — ding: ritual bronze tripod with two upright ears.
  ding: 'M-6,-3.5V-8.5H-3V-3.5M3,-3.5V-8.5H6V-3.5M-5.5,5L-7,11M5.5,5L7,11M0,7V11.5',
  // Índia Antiga — peacock on an arched hill (Maurya coins).
  pavao: 'M-9,11a3,3 0 0,1 6,0a3,3 0 0,1 6,0a3,3 0 0,1 6,0M-6,8a3,3 0 0,1 6,0a3,3 0 0,1 6,0M-3,5a3,3 0 0,1 6,0M0.4,2Q-0.2,-3 -1.8,-5.5',
  // Incas — mascaipacha: the royal red fringe hanging from the llautu band.
  mascaipacha: 'M-10.5,-6.4Q0,-11 10.5,-6.4M0,-9.6V-13.2M-2.6,-9.4L-3.8,-12.6M2.6,-9.4L3.8,-12.6',
};
/** Filled part of an emblem (silhouettes read better than lines at 16–22 px). */
const EMBLEM_FILLS: Partial<Record<Emblem, string>> = {
  aspis: circleD(0, 0, 2.6),
  semtauy: 'M0,4.4C-4.2,4.4 -5,9 -3.2,11.6L3.2,11.6C5,9 4.2,4.4 0,4.4ZM-7,-4L-11,-9.4L-8.4,-8.6L-7,-12L-5.6,-8.6L-3,-9.4ZM7,-4L2.8,-10.6Q7,-12.8 11.2,-10.6Z',
  estrela8: star(8, 10.5, 4.4, -1.5),
  aguia: 'M0,-11.3a2.1,2.1 0 1,0 0.1,0ZM1.6,-10L4.4,-9.4L1.7,-8.6ZM-2,-7.2Q0,-9.4 2,-7.2L2.6,2.6L0,5.6L-2.6,2.6ZM-2,-5.6L-11,-7.4L-12.4,-4.2L-10.2,-4.6L-11.2,-1.8L-8.6,-2.6L-9,0.2L-6.4,-0.8L-2,0.4ZM2,-5.6L11,-7.4L12.4,-4.2L10.2,-4.6L11.2,-1.8L8.6,-2.6L9,0.2L6.4,-0.8L2,0.4ZM-2.6,2.6L-3.8,7.2L0,6L3.8,7.2L2.6,2.6Z',
  leao: star(14, 5.6, 4.2, 0).replace(/(-?[\d.]+),(-?[\d.]+)/g, (_m, x: string, y: string) => `${f1(+x - 6.4)},${f1(+y - 4.4)}`) + 'M-10.8,-5.4L-13,-3.6L-10.8,-2.2ZM-4,-6.2Q2,-6.8 7.6,-5Q9.8,-4 9.4,-0.8L9.6,9H7.6L7,2.4L4.4,2.6L4,9H2L1.6,2.2L-2,2L-2.6,9H-4.6L-4.8,1.2L-5.6,0.4L-6.8,9H-8.8L-8.4,-0.4ZM10.4,-9.8a1.6,1.6 0 1,0 0.1,0Z',
  aquila: 'M0,-11.8a2,2 0 1,0 0.1,0ZM-1.6,-10.6L-4.4,-10L-1.7,-9.2ZM-2,-7.2Q0,-9.2 2,-7.2L2.4,2.4L0,5L-2.4,2.4ZM-2,-4L-5.6,-12.4L-7.8,-11.4L-7.2,-8.4L-9.8,-9.4L-9,-5.8L-11.2,-5.8L-8.2,-1.8L-2,0.8ZM2,-4L5.6,-12.4L7.8,-11.4L7.2,-8.4L9.8,-9.4L9,-5.8L11.2,-5.8L8.2,-1.8L2,0.8ZM-2.4,2.4L-3.2,6.4L3.2,6.4L2.4,2.4ZM-8,6.8H8V9H-8Z',
  corvo: 'M-8.4,-0.6a2.6,2.6 0 1,0 0.1,0ZM-10.4,-1.4L-13.6,0.6L-10.2,1.6ZM-7,0.8Q-2,-2.4 3,0L10,3.4L3,4.4Q-2.4,5.6 -7,2.6ZM-3.4,0L0.6,-11.4L2.6,-9.2L3.8,-11.8L5.4,-8.2L7.2,-10.4L7.2,-5L4.2,1.6ZM8.4,2.2L12.8,0.2L12.8,5.6ZM-2,4.4L-2.6,8.6M1.4,4.2L1,8.6',
  ding: 'M-10,-4.6H10V-2.6H-10ZM-8.8,-2.6H8.8L7.6,4Q0,8.2 -7.6,4Z',
  pavao: 'M-1.8,-6.6a1.3,1.3 0 1,0 0.1,0ZM-2.6,-7.4L-4.4,-6.6L-2.4,-6.2ZM-0.6,2.2Q-2.8,-0.6 -0.6,-3.6L1.2,-4Q2.6,-1 1.4,2.4ZM1,-1.2Q7,-3.4 11.6,0.6L10,2.6Q6,0.4 1.2,1.6Z',
  mascaipacha: 'M-5.2,-6L5.2,-6L6.6,8L5.3,11L4,8L2.7,11L1.3,8L0,11L-1.3,8L-2.7,11L-4,8L-5.3,11L-6.6,8Z',
};
export function emblemArt(emblem: Emblem, x: number, y: number, s: number, color: string, w = 2) {
  const stroke = EMBLEMS[emblem], fillD = EMBLEM_FILLS[emblem];
  return `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})">${fillD ? `<path d="${fillD}" fill="${color}"/>` : ''}${stroke ? `<path d="${stroke}" fill="none" stroke="${color}" stroke-width="${f1(w / s * Math.max(1, s * 0.9))}" stroke-linecap="round" stroke-linejoin="round"/>` : ''}</g>`;
}
function sealFrame(shape: CivilizationMark['seal'], r: number) {
  if (shape === 'CIRCLE') return `M${-r},0a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;
  if (shape === 'HEXAGON') return hexPath(r);
  return `M0,${-r * 1.12}L${r * 1.12},0L0,${r * 1.12}L${-r * 1.12},0Z`;
}
export function sealArt(mark: CivilizationMark, color: string, r = 16) {
  return `<path d="${sealFrame(mark.seal, r)}" fill="#0f181c" stroke="${color}" stroke-width="${f1(r * 0.16)}"/>${emblemArt(mark.emblem, 0, 0, r / 15, color, 2)}`;
}

/* ------------------------------------------------------------------ standards */
const POLE = `<line x1="0" y1="2" x2="0" y2="-38" stroke="${INK}" stroke-width="3.4"/><line x1="0" y1="2" x2="0" y2="-38" stroke="#c9b48a" stroke-width="1.8"/>`;
const CROSSBAR = `<line x1="-11" y1="-36.5" x2="11" y2="-36.5" stroke="${INK}" stroke-width="3"/><line x1="-11" y1="-36.5" x2="11" y2="-36.5" stroke="#c9b48a" stroke-width="1.6"/>`;
const CLOTH = (d: string, color: string) => `<path d="${d}" fill="${color}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
const OLD_BANNERS: Partial<Record<CivilizationMark['banner'], string>> = {
  STRAIGHT: 'M-9,-36L9,-36L9,-12L-9,-12Z',
  SWALLOWTAIL: 'M-9,-36L9,-36L9,-10L0,-18L-9,-10Z',
  PENNANT: 'M-9,-36L9,-36L0,-8Z',
  GONFALON: 'M-9,-36L9,-36L9,-12L6,-17L3,-12L0,-17L-3,-12L-6,-17L-9,-12Z',
  ROUNDED: 'M-9,-36L9,-36L9,-19A9,9 0 0,1 -9,-19Z',
};
/** Each CORE 10 standard is a different object, so it reads at 22 px before any emblem does. Field = seat color. */
const STANDARDS: Partial<Record<CivilizationMark['banner'], (color: string, emblem: Emblem) => string>> = {
  // Aspis: a round bronze-rimmed shield on a spear.
  SHIELD: color => `<line x1="0" y1="2" x2="0" y2="-41" stroke="${INK}" stroke-width="3.4"/><line x1="0" y1="2" x2="0" y2="-41" stroke="#c9b48a" stroke-width="1.8"/><path d="M-2,-40L0,-45L2,-40Z" fill="#c9b48a" stroke="${INK}" stroke-width="1"/><circle cy="-25" r="12" fill="${color}" stroke="${INK}" stroke-width="1.8"/><circle cy="-25" r="9.6" fill="none" stroke="#c39a52" stroke-width="1.6"/><circle cy="-25" r="7.6" fill="none" stroke="${INK}" stroke-width="1.1" stroke-dasharray="2.2 1.3"/><circle cy="-25" r="2.8" fill="#c39a52" stroke="${INK}" stroke-width="1"/>`,
  // Nome standard: a disc in a crescent cradle with two streamers.
  POLE: (color, emblem) => POLE + `<path d="M-6.8,-32Q0,-25.6 6.8,-32" fill="none" stroke="${INK}" stroke-width="3"/><path d="M-6.8,-32Q0,-25.6 6.8,-32" fill="none" stroke="#c39a52" stroke-width="1.6"/>` + CLOTH('M0.8,-28.4C6,-29 9.6,-25.6 15,-27.4L16,-23.6C10.6,-22 6.6,-25 0.8,-24.8Z', color) + CLOTH('M0.8,-23.4C5,-23 8.4,-20.4 12.6,-21.2L13.2,-18.2C8.6,-17.6 5,-20.2 0.8,-20.2Z', color) + `<circle cy="-36" r="6.6" fill="${color}" stroke="${INK}" stroke-width="1.6"/>` + emblemArt(emblem, 0, -36, 0.42, INK, 1.2),
  // Standard of Ur: a mosaic panel with three registers.
  PANEL: color => POLE + `<path d="M-13,-39L13,-39L11.6,-41.2L-11.6,-41.2Z" fill="${hi(color, 0.25)}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>` + CLOTH('M-13,-39L13,-39L13,-20L-13,-20Z', color) + `<path d="M-13,-32.7H13M-13,-26.3H13" stroke="${INK}" stroke-width="1.3"/><g fill="${INK}" opacity=".7">${[-9.6, -4.8, 0, 4.8, 9.6].map(x => `<rect x="${x - 1.1}" y="-37.6" width="2.2" height="3.8"/><rect x="${x + 1.3}" y="-31.1" width="2.2" height="3.6"/><rect x="${x - 1.1}" y="-24.7" width="2.2" height="3.6"/>`).join('')}</g>`,
  // Royal eagle on a staff, over a small shield.
  EAGLE: color => POLE + `<circle cy="-26.5" r="4.4" fill="#c39a52" stroke="${INK}" stroke-width="1.3"/><g transform="translate(0 -36) scale(1.18)"><path d="${EMBLEM_FILLS.aguia}" fill="${color}" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/></g>`,
  // Degel: a tribal cloth on the side of the staff, the fly edge waving, the lion on it.
  DEGEL: (color, emblem) => POLE + CLOTH('M0.8,-38.4L20,-37.4Q22.4,-33.6 20.2,-31Q18,-28 21.2,-24.2L0.8,-23.6Z', color) + emblemArt(emblem, 10.6, -30.8, 0.52, INK, 1.4),
  // Vexillum: a square cloth hanging from a crossbar, fringed, under a spear point.
  VEXILLUM: (color, emblem) => `<line x1="0" y1="2" x2="0" y2="-42" stroke="${INK}" stroke-width="3.4"/><line x1="0" y1="2" x2="0" y2="-42" stroke="#c9b48a" stroke-width="1.8"/><path d="M-2.2,-41L0,-47L2.2,-41Z" fill="#c39a52" stroke="${INK}" stroke-width="1"/>` + `<line x1="-12" y1="-35" x2="12" y2="-35" stroke="${INK}" stroke-width="3"/><line x1="-12" y1="-35" x2="12" y2="-35" stroke="#c39a52" stroke-width="1.6"/>` + CLOTH('M-10,-35L10,-35L10,-17L-10,-17Z', color) + `<path d="${Array.from({ length: 10 }, (_, i) => `M${-9 + i * 2},-17V-14.2`).join('')}" stroke="${INK}" stroke-width="1.1"/>` + emblemArt(emblem, 0, -26, 0.6, INK, 1.4),
  // Raven banner: a triangular cloth with a tabbed curved edge.
  RAVEN: (color, emblem) => POLE + CLOTH(`M0.8,-38.6L21,-37.6${Array.from({ length: 5 }, (_, i) => { const t0 = i / 5, t1 = (i + 1) / 5, q = (t: number) => [21 * (1 - t) * (1 - t) + 2 * (1 - t) * t * 15 + t * t * 0.8, -37.6 * (1 - t) * (1 - t) + 2 * (1 - t) * t * -25 + t * t * -19.4]; const b = q(t1), m = q((t0 + t1) / 2); return `Q${f1(m[0]! + 2.4)},${f1(m[1]! + 2.4)} ${f1(b[0]!)},${f1(b[1]!)}`; }).join('')}Z`, color) + emblemArt(emblem, 7.6, -31.6, 0.44, INK, 1.3),
  // Cauldron streamer: a long vertical band with two tails.
  STREAMER: (color, emblem) => POLE + `<line x1="-7" y1="-37" x2="7" y2="-37" stroke="${INK}" stroke-width="3"/><line x1="-7" y1="-37" x2="7" y2="-37" stroke="#c39a52" stroke-width="1.6"/>` + CLOTH('M-5.2,-37L5.2,-37L5.2,-13L2.6,-7.4L0,-13L-2.6,-7.4L-5.2,-13Z', color) + `<path d="M-6.6,-37Q-9,-30 -7.6,-22M6.6,-37Q9,-30 7.6,-22" fill="none" stroke="${color}" stroke-width="1.4"/>` + emblemArt(emblem, 0, -29.6, 0.4, INK, 1.2),
  // Dhvaja: a long narrow pennon flying from the top, swallow-tailed.
  LONG: (color, emblem) => POLE + CLOTH('M0.8,-39L28,-35.4L22.6,-33.6L28,-31.4L0.8,-28.2Z', color) + `<path d="M0.8,-26.6L14,-25.4L0.8,-23.8Z" fill="${color}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>` + emblemArt(emblem, 7.4, -33.8, 0.36, INK, 1.1),
  // Unancha: a square cloth of tocapu checks.
  SQUARE: color => POLE + CLOTH('M0.8,-38.6L16.8,-38.6L16.8,-22.6L0.8,-22.6Z', color) + `<g fill="${sh(color, 0.5)}">${[0, 1, 2, 3].flatMap(i => [0, 1, 2, 3].map(j => (i + j) % 2 ? `<rect x="${f1(0.8 + i * 4)}" y="${f1(-38.6 + j * 4)}" width="4" height="4"/>` : '')).join('')}</g><path d="M0.8,-30.6H16.8M8.8,-38.6V-22.6" stroke="${INK}" stroke-width="1"/><path d="M0.8,-38.6L16.8,-38.6L16.8,-22.6L0.8,-22.6Z" fill="none" stroke="${INK}" stroke-width="1.6"/>`,
};
/** Small standard on a pole; origin at the pole foot. Field = seat color, object and drawing = civilization; optional seat seal at the foot. */
export function bannerArt(mark: CivilizationMark, color: string, px = 40, tilt = 0, seat: number | null = null) {
  const special = STANDARDS[mark.banner];
  const body = special ? special(color, mark.emblem) : POLE + CROSSBAR + CLOTH(OLD_BANNERS[mark.banner] ?? OLD_BANNERS.STRAIGHT!, color) + emblemArt(mark.emblem, 0, -26, 0.55, INK, 1.5);
  return `<g class="standard" data-banner="${mark.banner}" transform="scale(${f1(px / 40 * 100) / 100})${tilt ? ` rotate(${tilt})` : ''}">${body}${seat !== null ? `<g transform="translate(0 1)">${seatSeal(seat, color, 9)}</g>` : ''}</g>`;
}
/** Stroke attributes for one territorial edge: seat color, civilization pattern. */
export function borderStrokes(pattern: CivilizationMark['border'], color: string, w = 3): string[] {
  const line = (width: number, extra = '') => `stroke="${color}" stroke-width="${f1(width)}" fill="none" stroke-linecap="round"${extra}`;
  switch (pattern) {
    case 'SOLID': return [line(w)];
    case 'DASHED': return [line(w, ` stroke-dasharray="${f1(w * 3.4)} ${f1(w * 2)}"`)];
    case 'DOTTED': return [line(w * 1.3, ` stroke-dasharray="0.1 ${f1(w * 2.1)}"`)];
    case 'DOUBLE': return [line(w * 2.6), `stroke="${INK}" stroke-width="${f1(w * 0.9)}" fill="none"`];
    case 'DASH_DOT': return [line(w, ` stroke-dasharray="${f1(w * 3.4)} ${f1(w * 1.4)} 0.1 ${f1(w * 1.4)}"`)];
    case 'BAND': return [`stroke="${color}" stroke-opacity=".28" stroke-width="${f1(w * 3.6)}" fill="none"`, line(w)];
  }
}

/* ------------------------------------------------------------ threats (D3) */
/**
 * Mesa Viva threats: the SAME silhouettes as the player's pieces in the threat colour on an angular iron base (an octagon), so the grayscale and the
 * hex tell "not a player" without a label. A Bando shows up to three real classes of `composition` with a "+N"; a camp stands on the tent of the concept
 * (two tents, fire, low palisade, torn standard); pirates stand on the same base over the water (Barca de Patrulha / Frota).
 */
export const THREAT_COLOR = '#b4533c';
const THREAT_IRON = '#2a1511';
export function threatFigureArt(kind: string, px = 26, count = 0, ghost = false): string {
  const o = 0.5 * px * 0.78;
  const pts = Array.from({ length: 8 }, (_, i) => { const a = (Math.PI / 4) * i + Math.PI / 8; return `${f1(Math.cos(a) * o * 1.15)},${f1(Math.sin(a) * o * 0.8 + px * 0.34)}`; }).join(' ');
  return `<g class="threat-figure" data-kind="${kind}"${ghost ? ' opacity=".45"' : ''}><polygon points="${pts}" fill="${THREAT_IRON}" stroke="${THREAT_COLOR}" stroke-width="1.4"/>${pieceArt(kind, THREAT_COLOR, px, count)}${ghost ? `<circle r="${f1(px * 0.62)}" fill="none" stroke="${THREAT_COLOR}" stroke-dasharray="3 3" stroke-width="1.2"/>` : ''}</g>`;
}
/** The camp marker of the concept (MK.camp) with the torn standard; `rest` adds the hourglass (it cannot leave yet). */
export function campArt(state: 'active' | 'rest' = 'active', scale = 1): string {
  const OL = 'stroke="#0b0b0bcc" stroke-width=".7" vector-effect="non-scaling-stroke" stroke-linejoin="round"';
  const poly = (pts: readonly Pt[], fill: string) => `<polygon points="${pts.map(p => `${f1(p[0])},${f1(p[1])}`).join(' ')}" fill="${fill}" ${OL}/>`;
  let body = `<ellipse cx="0" cy="3" rx="19" ry="6" fill="#7a6a4a" opacity=".7"/>`;
  for (const [x, y, w, c] of [[-10, 2, 9, '#6a3a30'], [10, 2, 8, '#5a4632']] as const) body += poly([[x - w, y], [x, y - w * 1.4], [x + w, y]], c) + poly([[x - 2, y], [x, y - w * 0.7], [x + 2, y]], '#241f1a');
  body += poly([[-3, 4], [0, -4], [3, 4]], '#5a3a2a') + `<circle cx="0" cy="3" r="2.6" fill="#c9783a"/><circle cx="0" cy="2" r="1.4" fill="#ffd36a"/>`;
  body += Array.from({ length: 9 }, (_, i) => `<path d="M${-16 + i * 4},6 l1.2,-6" stroke="#4a3626" stroke-width="1.6" stroke-linecap="round"/>`).join('');
  let g = `<g transform="scale(1.3)">${body}</g><path d="M0 -4 v-26" stroke="#c9b48a" stroke-width="1.8"/><path d="M0 -30 l12 2 l-3 3 l3 3 l-3 3 l3 3 l-12 -1Z" fill="#7a2c20" stroke="${INK}" stroke-width="1"/><path d="M3 -25 l4 4 M7 -25 l-4 4" stroke="#e6c9a0" stroke-width="1.1"/>`;
  if (state === 'rest') g += hourglassBadge(26, -18);
  return `<g class="camp-art" data-state="${state}" transform="scale(${f1(scale * 100) / 100})">${g}</g>`;
}
const hourglassBadge = (x: number, y: number) => `<g class="threat-badge is-wait" transform="translate(${x} ${y})"><circle r="8" fill="#0f181c" stroke="#e6b04c" stroke-width="1.4"/><path d="M-3.5 -4.5 h7 l-3.5 4.5 l3.5 4.5 h-7 l3.5 -4.5Z" fill="none" stroke="#e6b04c" stroke-width="1.3"/></g>`;
const retreatBadge = (x: number, y: number) => `<g class="threat-badge is-retreat" transform="translate(${x} ${y})"><circle r="8" fill="#0f181c" stroke="#e6b04c" stroke-width="1.4"/><path d="M3.5 3.5 H-1 a3.6 3.6 0 0 1 0 -7.2 H3 M0.5 -6.4 L-2.6 -3.7 L0.5 -1" fill="none" stroke="#e6b04c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
export interface ThreatMarkOptions {
  kind: string; status: string; level: number; composition: readonly { kind: string; count: number }[];
  /** The engine's intent.state (FRESH | WAITING | MARCHING | WITHDRAWING | IDLE). */
  state?: string | undefined; fresh?: boolean | undefined; reorganizing?: boolean | undefined;
  /** On a city or sharing the hex with pieces: a smaller row without the plaque. */
  compact?: boolean;
}
export const THREAT_ROMAN = ['I', 'II', 'III'] as const;
export function threatName(kind: string, status: string): string { return kind === 'PIRATE' ? (status === 'CAMPED' ? 'Ancoradouro pirata' : 'Piratas') : status === 'CAMPED' ? 'Acampamento' : 'Bando'; }
/** Fragment centred on the hex: background (camp/anchorage), up to 3 classes of the composition, "+N", the Grau plaque and the state badge. */
export function threatMarkArt(o: ThreatMarkOptions): string {
  const camped = o.status === 'CAMPED', roman = THREAT_ROMAN[Math.max(0, Math.min(2, o.level - 1))]!;
  const classes = [...o.composition].sort((a, b) => b.count - a.count), shown = classes.slice(0, 3), extra = classes.slice(3).reduce((n, c) => n + c.count, 0);
  const px = o.compact ? 18 : camped ? 20 : 28, gap = o.compact ? 16 : camped ? 18 : 24, rowY = o.compact ? 0 : camped ? 17 : -2;
  const wait = camped && (o.fresh || o.reorganizing), retreat = o.state === 'WITHDRAWING';
  let g = '';
  if (!o.compact && camped) g += o.kind === 'PIRATE' ? `<g transform="translate(0 -6)">${discoveryArt('ANCHORAGE', 34)}</g>` : `<g transform="translate(0 -2)">${campArt('active', 0.98)}</g>`;
  const row = shown.map((c, i) => `<g transform="translate(${f1((i - (shown.length - 1) / 2) * gap)} ${rowY})" data-class="${c.kind}">${threatFigureArt(c.kind, px, c.count)}</g>`).join('');
  g += row;
  const half = ((shown.length - 1) / 2) * gap + px / 2;
  if (extra > 0) g += `<g transform="translate(${f1(half + 7)} ${rowY + px * 0.3})"><rect x="-8" y="-6.5" width="16" height="13" rx="6.5" fill="${INK}" stroke="${THREAT_COLOR}" stroke-width="1.1"/><text y="3.2" text-anchor="middle" font-family="'Source Sans 3',sans-serif" font-weight="700" font-size="9" fill="${LIGHT}">+${extra}</text></g>`;
  if (o.compact) g += `<g transform="translate(${f1(-half - 8)} ${rowY})"><polygon points="-7,-2 -3,-7 3,-7 7,-2 7,2 3,7 -3,7 -7,2" fill="${THREAT_IRON}" stroke="${THREAT_COLOR}" stroke-width="1.2"/><text y="3.3" text-anchor="middle" font-family="'Source Sans 3',sans-serif" font-weight="700" font-size="8.6" fill="${LIGHT}">${roman}</text></g>`;
  else { const name = `${threatName(o.kind, o.status)} ${roman}`, w = Math.max(40, name.length * 5.4 + 14); g += `<g transform="translate(0 33)"><rect x="${f1(-w / 2)}" y="-7" width="${f1(w)}" height="14" rx="7" fill="${THREAT_IRON}" stroke="${THREAT_COLOR}" stroke-width="1.2"/><text y="3.2" text-anchor="middle" font-family="'Source Sans 3',sans-serif" font-weight="700" font-size="9" fill="${LIGHT}">${name}</text></g>`; }
  const bx = o.compact ? half + 8 : Math.max(half, 22) + 4, by = o.compact ? rowY - 9 : -20;
  if (retreat) g += retreatBadge(bx, by); else if (wait) g += hourglassBadge(bx, by);
  return `<g class="threat-art" data-kind="${o.kind}" data-status="${o.status}" data-level="${o.level}"${retreat ? ' data-retreat="1"' : ''}${wait ? ' data-wait="1"' : ''}>${g}</g>`;
}
/** Amber triangle of the concept's `danger` marker: a closed Region MAY hold a Perigo (never says whether it does). */
export function dangerMarkArt(size = 12): string {
  const s = size / 12;
  return `<g class="danger-mark" transform="scale(${f1(s * 100) / 100})"><path d="M0,-11 L11,9 H-11Z" fill="#e6a03c" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M0,-3 V3.4" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><circle cy="6.2" r="1.3" fill="${INK}"/></g>`;
}
