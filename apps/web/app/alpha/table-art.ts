/**
 * Table art (Experience V2.2, UXDEC-016…020). Every function returns an SVG fragment centered on (0,0) for the map's hex
 * frame. Shape says what a thing is, the seat color says whose it is; the civilization mark (emblem, seal, banner, border)
 * says which civilization, so it survives another seat color, grayscale and 16 px.
 */
import type { CivilizationMark, Emblem } from '@aoh/game-domain';

export const INK = '#0b1114';
export const LIGHT = '#f4ecd8';
/** Seat colors: ownership only. No gold, so gold stays the dominant action's color (UXDEC-020). */
export const SEAT_COLORS = ['#6ca7d9', '#d48a6a', '#5cb3a5', '#a691d6', '#a9bf6a', '#c9889f'] as const;
export const seatColor = (index: number) => SEAT_COLORS[((index % SEAT_COLORS.length) + SEAT_COLORS.length) % SEAT_COLORS.length]!;

const f1 = (n: number) => Math.round(n * 10) / 10;
function rng(seed: number) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
export function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i]! - v) * t).toString(16).padStart(2, '0')).join('');
}
export const seedOf = (text: string) => [...text].reduce((total, ch) => (total * 31 + ch.charCodeAt(0)) >>> 0, 7);
export function hexPoints(r: number, cx = 0, cy = 0): [number, number][] { return Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number]; }); }
export function hexPath(r: number, cx = 0, cy = 0) { return hexPoints(r, cx, cy).map((p, i) => `${i ? 'L' : 'M'}${f1(p[0])},${f1(p[1])}`).join('') + 'Z'; }
const inHex = (x: number, y: number, r: number) => Math.abs(x) <= r * 0.866 && Math.abs(y) + Math.abs(x) / 1.732 <= r;

/* ------------------------------------------------------------------ cities */
const ROOFS = ['#cdbb98', '#bfa883', '#d8c8a6', '#b69c78', '#c7b08a'];
type Box = { x: number; y: number; w: number; h: number; rot: number; c: string };
/**
 * True top-down city that fills its hex (UXDEC-016 A). Level 1–7 reads through the urban plan — buildings, streets, civic
 * square, ring road, citadel — never through height. `depth` adds light shadows: the Focus/Inspector variant (B) only.
 */
export function cityArt(level: number, r: number, o: { color: string; seed: number; depth?: boolean; detail?: boolean }) {
  const l = Math.max(1, Math.min(7, level)), col = o.color, B = !!o.depth, R = rng(o.seed * 131 + l * 17);
  const ext = r * [0.36, 0.5, 0.62, 0.74, 0.84, 0.9, 0.94][l - 1]!;
  const sw = r * (l >= 4 ? 0.07 : 0.055), street = l >= 4 ? '#8d8371' : '#75654c';
  let g = `<path d="${hexPath(r * 0.985)}" fill="${l >= 4 ? '#3d3a31' : '#3a3628'}"/>`;
  if (l <= 3) g += `<circle r="${f1(ext * 1.05)}" fill="#4a4433" opacity=".9"/>`;
  const segs: [number, number, number, number][] = [];
  const spoke = (a: number, len: number) => segs.push([0, 0, f1(Math.cos(a) * len), f1(Math.sin(a) * len)]);
  if (l === 1) spoke(Math.PI * 0.62, r * 0.9);
  if (l === 2) { spoke(Math.PI * 0.62, r); spoke(-Math.PI * 0.38, r * 0.7); }
  if (l >= 3) { segs.push([-r, 0, r, 0]); segs.push([0, -r, 0, r]); }
  if (l >= 4) for (const k of [-1, 1]) { segs.push([-r, k * ext * 0.5, r, k * ext * 0.5]); segs.push([k * ext * 0.5, -r, k * ext * 0.5, r]); }
  if (l >= 5) { spoke(Math.PI / 4, r); spoke(Math.PI * 5 / 4, r); }
  if (l >= 7) { spoke(-Math.PI / 4, r); spoke(Math.PI * 3 / 4, r); }
  const clip = `city-clip-${l}-${o.seed}-${Math.round(r)}${B ? 'b' : ''}`;
  g += `<clipPath id="${clip}"><path d="${hexPath(r * 0.97)}"/></clipPath><g clip-path="url(#${clip})">`;
  if (l >= 6) g += `<circle r="${f1(ext * 0.56)}" fill="none" stroke="${street}" stroke-width="${f1(sw * 1.25)}"/>`;
  for (const s of segs) g += `<line x1="${s[0]}" y1="${s[1]}" x2="${s[2]}" y2="${s[3]}" stroke="${street}" stroke-width="${f1(sw)}" stroke-linecap="round"/>`;
  const plaza = r * [0.08, 0.12, 0.14, 0.16, 0.19, 0.21, 0.27][l - 1]!;
  const nearSeg = (x: number, y: number, pad: number) => segs.some(([x1, y1, x2, y2]) => { const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy, t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / L2)); return Math.hypot(x - x1 - t * dx, y - y1 - t * dy) < pad; })
    || (l >= 6 && Math.abs(Math.hypot(x, y) - ext * 0.56) < pad);
  const blds: Box[] = [];
  const n = [3, 7, 14, 30, 48, 70, 92][l - 1]!, bs = r * [0.13, 0.12, 0.105, 0.09, 0.08, 0.072, 0.066][l - 1]!;
  for (let tries = 0; blds.length < n && tries < n * 60; tries++) {
    const a = R() * Math.PI * 2, d = plaza * 1.25 + Math.sqrt(R()) * (ext - plaza * 1.25);
    const x = Math.cos(a) * d, y = Math.sin(a) * d, w = bs * (0.8 + R() * 0.7), h = bs * (0.65 + R() * 0.5);
    if (!inHex(x, y, r * 0.86) || nearSeg(x, y, sw * 0.6 + Math.max(w, h) * 0.55)) continue;
    if (l >= 7 && Math.abs(x) < plaza * 1.15 && Math.abs(y) < plaza * 1.15) continue;
    if (blds.some(b => Math.abs(b.x - x) < (b.w + w) / 2 + bs * 0.18 && Math.abs(b.y - y) < (b.h + h) / 2 + bs * 0.18)) continue;
    blds.push({ x, y, w, h, rot: l <= 3 ? (R() - 0.5) * 50 : 0, c: ROOFS[Math.floor(R() * ROOFS.length)]! });
  }
  if (l >= 6) for (const a of [0.9, 2.6, 4.3, 5.7]) { const gx = Math.cos(a) * ext * 0.74, gy = Math.sin(a) * ext * 0.74; if (inHex(gx, gy, r * 0.8)) g += `<circle cx="${f1(gx)}" cy="${f1(gy)}" r="${f1(bs * 0.7)}" fill="#55704a"/>`; }
  const rot = (b: Box) => b.rot ? ` transform="rotate(${f1(b.rot)} ${f1(b.x)} ${f1(b.y)})"` : '';
  const rect = (b: Box, fill: string, dx = 0, dy = 0) => `<rect x="${f1(b.x - b.w / 2 + dx)}" y="${f1(b.y - b.h / 2 + dy)}" width="${f1(b.w)}" height="${f1(b.h)}" rx="${f1(Math.min(b.w, b.h) * 0.12)}" fill="${fill}"${rot(b)}/>`;
  if (B) for (const b of blds) g += rect(b, '#000000a0', bs * 0.32, bs * 0.42);
  for (const b of blds) {
    g += rect(b, b.c);
    if (B || o.detail) { const hor = b.w >= b.h; g += `<line x1="${f1(hor ? b.x - b.w / 2 : b.x)}" y1="${f1(hor ? b.y : b.y - b.h / 2)}" x2="${f1(hor ? b.x + b.w / 2 : b.x)}" y2="${f1(hor ? b.y : b.y + b.h / 2)}" stroke="#00000045" stroke-width="${f1(Math.max(0.6, bs * 0.08))}"${rot(b)}/>`; }
    if (B) g += rect({ ...b, h: b.h / 2, y: b.y - b.h / 4 }, '#ffffff30');
  }
  if (l >= 2) g += `<rect x="${f1(-plaza)}" y="${f1(-plaza)}" width="${f1(plaza * 2)}" height="${f1(plaza * 2)}" fill="#a39780" rx="${f1(plaza * 0.15)}"/>`;
  if (l < 7) {
    const cs = plaza * (l >= 2 ? 0.95 : 1.6);
    if (B) g += `<rect x="${f1(-cs / 2 + bs * 0.25)}" y="${f1(-cs / 2 + bs * 0.35)}" width="${f1(cs)}" height="${f1(cs)}" fill="#00000075"/>`;
    g += `<rect x="${f1(-cs / 2)}" y="${f1(-cs / 2)}" width="${f1(cs)}" height="${f1(cs)}" fill="${col}" stroke="${INK}" stroke-width="${f1(Math.max(0.8, r * 0.02))}"/>`;
    if (l >= 6) g += `<circle r="${f1(cs * 0.32)}" fill="${mix(col, '#ffffff', 0.45)}" stroke="${INK}" stroke-width="${f1(r * 0.012)}"/>`;
  } else {
    const c = plaza * 1.05;
    if (B) g += `<rect x="${f1(-c + bs * 0.3)}" y="${f1(-c + bs * 0.4)}" width="${f1(c * 2)}" height="${f1(c * 2)}" fill="#00000080"/>`;
    g += `<rect x="${f1(-c)}" y="${f1(-c)}" width="${f1(c * 2)}" height="${f1(c * 2)}" fill="${col}" stroke="${INK}" stroke-width="${f1(r * 0.022)}"/>`;
    g += `<rect x="${f1(-c * 0.55)}" y="${f1(-c * 0.55)}" width="${f1(c * 1.1)}" height="${f1(c * 1.1)}" fill="#a39780" stroke="${INK}" stroke-width="${f1(r * 0.012)}"/>`;
    g += `<circle r="${f1(c * 0.28)}" fill="${mix(col, '#ffffff', 0.45)}" stroke="${INK}" stroke-width="${f1(r * 0.012)}"/>`;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) g += `<circle cx="${f1(sx * c)}" cy="${f1(sy * c)}" r="${f1(c * 0.24)}" fill="${mix(col, INK, 0.25)}" stroke="${INK}" stroke-width="${f1(r * 0.014)}"/>`;
  }
  g += '</g>';
  g += `<path d="${hexPath(r * 0.985)}" fill="none" stroke="${col}" stroke-width="${f1(Math.max(1.5, r * 0.04))}" stroke-opacity=".9"/>`;
  return g;
}
/** Far zoom: compact seal with the level number. */
export function citySeal(level: number, r: number, color: string) {
  return `<path d="${hexPath(r)}" fill="${mix(color, INK, 0.55)}" stroke="${color}" stroke-width="${f1(r * 0.16)}"/><text y="${f1(r * 0.36)}" text-anchor="middle" font-family="Cinzel,Georgia,serif" font-weight="700" font-size="${f1(r * 1.05)}" fill="${LIGHT}">${level}</text>`;
}

/* ---------------------------------------------------------- fortifications */
export const FORTIFICATION_ORDER = ['PALISADE', 'STONE_WALL', 'FORTRESS', 'BASTION', 'CITADEL'] as const;
/**
 * Independent layer on the hex rim (UXDEC-017): the city and its defence are separate states. DAMAGED opens one gap,
 * BREACHED two, each with rubble.
 */
export function fortificationArt(level: string, state: string, r: number) {
  const lv = FORTIFICATION_ORDER.indexOf(level as typeof FORTIFICATION_ORDER[number]) + 1;
  if (lv <= 0) return '';
  const pts = hexPoints(r), breaches = state === 'BREACHED' ? [3, 0] : state === 'DAMAGED' ? [3] : [];
  const wallW = Math.max(lv === 1 ? 3.4 : 3, r * [0.07, 0.085, 0.11, 0.11, 0.12][lv - 1]!), wallC = lv === 1 ? '#b88d55' : '#a9a397';
  const line = (a: [number, number], b: [number, number], t0: number, t1: number, extra = '') => {
    const p = (t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const [x1, y1] = p(t0), [x2, y2] = p(t1);
    return `<line x1="${f1(x1!)}" y1="${f1(y1!)}" x2="${f1(x2!)}" y2="${f1(y2!)}" stroke="${INK}" stroke-width="${f1(wallW + 2)}"/><line x1="${f1(x1!)}" y1="${f1(y1!)}" x2="${f1(x2!)}" y2="${f1(y2!)}" stroke="${wallC}" stroke-width="${f1(wallW)}"${extra}/>`;
  };
  const stakes = lv === 1 ? ` stroke-dasharray="${f1(Math.max(2.4, r * 0.035))} ${f1(Math.max(1.8, r * 0.025))}"` : '';
  let g = '';
  if (lv >= 5) g += `<path d="${hexPath(r * 1.12)}" fill="none" stroke="#3d5a66" stroke-width="${f1(r * 0.1)}" opacity=".85"/>`;
  for (let i = 0; i < 6; i++) {
    const a = pts[i]!, b = pts[(i + 1) % 6]!;
    if (breaches.includes(i)) {
      g += line(a, b, 0, 0.38, stakes) + line(a, b, 0.62, 1, stakes);
      for (const t of [0.45, 0.5, 0.56]) g += `<circle cx="${f1(a[0] + (b[0] - a[0]) * t)}" cy="${f1(a[1] + (b[1] - a[1]) * t + r * 0.03)}" r="${f1(wallW * 0.35)}" fill="${wallC}"/>`;
    } else g += line(a, b, 0, 1, stakes);
  }
  pts.forEach(([x, y], i) => {
    if (lv === 2 && !(i % 2)) g += `<rect x="${f1(x - wallW)}" y="${f1(y - wallW)}" width="${f1(wallW * 2)}" height="${f1(wallW * 2)}" fill="${wallC}" stroke="${INK}" stroke-width="1.2"/>`;
    if (lv === 3) g += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(wallW * 1.25)}" fill="${wallC}" stroke="${INK}" stroke-width="1.2"/>`;
    if (lv >= 4) { const a = Math.atan2(y, x), s = wallW * 2.1, tip = [x + Math.cos(a) * s * 1.2, y + Math.sin(a) * s * 1.2], l1 = [x + Math.cos(a + 1.9) * s, y + Math.sin(a + 1.9) * s], l2 = [x + Math.cos(a - 1.9) * s, y + Math.sin(a - 1.9) * s]; g += `<path d="M${f1(l1[0]!)},${f1(l1[1]!)}L${f1(tip[0]!)},${f1(tip[1]!)}L${f1(l2[0]!)},${f1(l2[1]!)}L${f1(x)},${f1(y)}Z" fill="${wallC}" stroke="${INK}" stroke-width="1.2"/>`; }
  });
  if (lv >= 3) g += `<rect x="${f1(-wallW * 1.6)}" y="${f1(r * 0.98 - wallW * 1.4)}" width="${f1(wallW * 3.2)}" height="${f1(wallW * 2)}" fill="${wallC}" stroke="${INK}" stroke-width="1.2"/>`;
  if (lv >= 5) g += `<path d="${hexPath(r * 0.5)}" fill="none" stroke="${INK}" stroke-width="${f1(wallW * 0.7 + 2)}"/><path d="${hexPath(r * 0.5)}" fill="none" stroke="${wallC}" stroke-width="${f1(wallW * 0.7)}"/>`;
  return g;
}

/* ------------------------------------------------------------------ pieces */
/**
 * 32-unit design box. Every piece on the map is its own silhouette in the seat color with an ink outline — the civil pieces
 * too (UXDEC-018: no generic discs on the map). Discs are kept for inhabitants inside a city.
 */
export type PieceKind = 'INFANTRY' | 'GUARD' | 'RANGED' | 'CAVALRY' | 'SIEGE' | 'FLEET' | 'COLONIST' | 'ENVOY' | 'COASTAL_VESSEL';
const SHAPES: Record<PieceKind, (c: string) => string> = {
  INFANTRY: c => `<path d="M-11,-1 L11,-1 L11,10 Q11,13 8,13 L-8,13 Q-11,13 -11,10 Z" fill="${c}"/>` + [-7, 0, 7].map(x => `<path d="M${x - 1.6},-1 L${x - 1.6},-9 L${x},-14.5 L${x + 1.6},-9 L${x + 1.6},-1 Z" fill="${c}"/>`).join('') + `<path d="M-11,4 L11,4" stroke="${INK}" stroke-width="1.3"/>`,
  GUARD: c => `<path d="M0,-14 C9,-14 12,-11 12,-8 L12,2 C12,9 6,13 0,15 C-6,13 -12,9 -12,2 L-12,-8 C-12,-11 -9,-14 0,-14 Z" fill="${c}"/><path d="M0,-11 L0,12" stroke="${INK}" stroke-width="1.4"/><circle cy="-1" r="3" fill="${c}" stroke="${INK}" stroke-width="1.4"/>`,
  RANGED: c => `<path d="M-6,-14 C11,-10 11,10 -6,14 L-2,14 C5,8 5,-8 -2,-14 Z" fill="${c}"/><path d="M-5,-13 L-5,13" stroke="${INK}" stroke-width="1.2"/><path d="M-13,0 L11,0" stroke="${INK}" stroke-width="2.2"/><path d="M14,0 L8,-4 L8,4 Z" fill="${c}"/><path d="M-13,0 l-2,-3 M-13,0 l-2,3" stroke="${INK}" stroke-width="1.5"/>`,
  CAVALRY: c => `<path d="M-8,14 L-8,7 C-11,0 -8,-7 -2,-10 L0,-15 L3,-10 C9,-9 13,-3 13,2 L9,4.5 L5,1 C4,6 7,9 8,14 Z" fill="${c}"/><circle cx="4" cy="-5" r="1.5" fill="${INK}"/><path d="M-2,-10 C-6,-6 -7,0 -5,7" stroke="${INK}" stroke-width="1.2" fill="none"/>`,
  SIEGE: c => `<rect x="-13" y="4" width="26" height="5" rx="1" fill="${c}"/><path d="M-7,5 L0,-6 L7,5" stroke="${c}" stroke-width="3.2" fill="none"/><path d="M-12,1 L12,-12" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/><circle cx="12" cy="-12" r="3.2" fill="${c}"/><circle cx="-8" cy="11" r="3.6" fill="${c}"/><circle cx="8" cy="11" r="3.6" fill="${c}"/><circle cx="-8" cy="11" r="1.1" fill="${INK}"/><circle cx="8" cy="11" r="1.1" fill="${INK}"/>`,
  FLEET: c => `<path d="M-15,-5 L7,-5 Q14,-3 16,0 Q14,3 7,5 L-15,5 Q-17,5 -17,3 L-17,-3 Q-17,-5 -15,-5 Z" fill="${c}"/><path d="M-8,-5 l-2,-5 M-2,-5 l-2,-5 M4,-5 l-2,-5 M-8,5 l-2,5 M-2,5 l-2,5 M4,5 l-2,5" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/><path d="M-12,0 L8,0" stroke="${INK}" stroke-width="1.3"/>`,
  // Coastal vessel: a short open boat with two oars a side — explores the coast, never fights.
  COASTAL_VESSEL: c => `<path d="M-12,-5 L5,-5 Q12,-3 14,0 Q12,3 5,5 L-12,5 Q-14,5 -14,3 L-14,-3 Q-14,-5 -12,-5 Z" fill="${c}"/><path d="M-6,-5 l-2,-6 M2,-5 l-2,-6 M-6,5 l-2,6 M2,5 l-2,6" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><circle cx="-3" r="2.2" fill="${INK}"/>`,
  // Colono (original silhouette): a small caravan — arched cover on two wheels with a founding banner on a pole. A group that travels and settles.
  COLONIST: c => `<path d="M-15,8 L-15,-1 Q-15,-10 -4,-10 Q7,-10 7,-1 L7,8 Z" fill="${c}"/><path d="M-9,8 L-9,1 Q-6,-3 -3,1 L-3,8 Z" fill="${INK}"/><circle cx="-10" cy="11" r="4" fill="${c}"/><circle cx="3" cy="11" r="4" fill="${c}"/><circle cx="-10" cy="11" r="1.3" fill="${INK}"/><circle cx="3" cy="11" r="1.3" fill="${INK}"/><path d="M12,13 L12,-14" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M12,-14 L20,-10 L12,-6 Z" fill="${c}"/>`,
  // Envoy: a sealed letter — diplomacy, integration, influence.
  ENVOY: c => `<rect x="-13" y="-9" width="26" height="18" rx="2" fill="${c}"/><path d="M-12,-8 L0,1.5 L12,-8" stroke="${INK}" stroke-width="1.7" fill="none" stroke-linejoin="round"/><circle cy="2.5" r="4.2" fill="#b44a3a" stroke="${INK}" stroke-width="1.3"/>`,
};
export const CIVIL_PIECES: ReadonlySet<string> = new Set(['COLONIST', 'ENVOY']);
/** `signature`: the civilization's signature variant of this family (drawn with a star, as in the atlas). */
export function pieceArt(kind: string, color: string, px = 36, count = 0, signature = false) {
  const shape = SHAPES[kind as PieceKind] ?? SHAPES.INFANTRY, body = shape(color), s = px / 32;
  const outline = body.split(color).join(INK).replace(/fill="(?!none)[^"]+"/g, `fill="${INK}"`).replace(/stroke-width="([\d.]+)"/g, (_m, w: string) => `stroke-width="${+w + 2.6}"`);
  let g = `<g transform="scale(${f1(s * 100) / 100})"><g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round">${outline}</g>${body}`;
  if (signature) { const p: string[] = []; for (let i = 0; i < 8; i++) { const a = Math.PI / 4 * i - Math.PI / 2, rr = i % 2 ? 2.1 : 5; p.push(`${f1(12 + Math.cos(a) * rr)},${f1(-12 + Math.sin(a) * rr)}`); } g += `<path d="M${p.join('L')}Z" fill="${LIGHT}" stroke="${INK}" stroke-width="1.1"/>`; }
  if (count > 1) g += `<circle cx="12" cy="11" r="6.4" fill="${INK}" stroke="${color}" stroke-width="1.4"/><text x="12" y="14.3" text-anchor="middle" font-family="'Source Sans 3',sans-serif" font-weight="700" font-size="9.5" fill="${LIGHT}">${count}</text>`;
  return g + '</g>';
}

/* ------------------------------------------------------------------ emblems */
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
};
export function emblemArt(emblem: Emblem, x: number, y: number, s: number, color: string, w = 2) {
  return `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})"><path d="${EMBLEMS[emblem]}" fill="none" stroke="${color}" stroke-width="${f1(w / s * Math.max(1, s * 0.9))}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}
function sealFrame(shape: CivilizationMark['seal'], r: number) {
  if (shape === 'CIRCLE') return `M${-r},0a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;
  if (shape === 'HEXAGON') return hexPath(r);
  return `M0,${-r * 1.12}L${r * 1.12},0L0,${r * 1.12}L${-r * 1.12},0Z`;
}
export function sealArt(mark: CivilizationMark, color: string, r = 16) {
  return `<path d="${sealFrame(mark.seal, r)}" fill="#0f181c" stroke="${color}" stroke-width="${f1(r * 0.16)}"/>${emblemArt(mark.emblem, 0, 0, r / 15, color, 2)}`;
}
const BANNER_PATHS: Record<CivilizationMark['banner'], string> = {
  STRAIGHT: 'M-9,-36L9,-36L9,-12L-9,-12Z',
  SWALLOWTAIL: 'M-9,-36L9,-36L9,-10L0,-18L-9,-10Z',
  PENNANT: 'M-9,-36L9,-36L0,-8Z',
  GONFALON: 'M-9,-36L9,-36L9,-12L6,-17L3,-12L0,-17L-3,-12L-6,-17L-9,-12Z',
  SHIELD: 'M-9,-36L9,-36L9,-20L0,-10L-9,-20Z',
  ROUNDED: 'M-9,-36L9,-36L9,-19A9,9 0 0,1 -9,-19Z',
};
/** Small standard on a T pole; origin at the pole foot. Field = seat color, drawing = civilization. */
export function bannerArt(mark: CivilizationMark, color: string, px = 40, tilt = 0) {
  return `<g transform="scale(${f1(px / 40 * 100) / 100})${tilt ? ` rotate(${tilt})` : ''}"><line x1="0" y1="2" x2="0" y2="-38" stroke="${INK}" stroke-width="3.4"/><line x1="0" y1="2" x2="0" y2="-38" stroke="#c9b48a" stroke-width="1.8"/><line x1="-11" y1="-36.5" x2="11" y2="-36.5" stroke="${INK}" stroke-width="3"/><line x1="-11" y1="-36.5" x2="11" y2="-36.5" stroke="#c9b48a" stroke-width="1.6"/><path d="${BANNER_PATHS[mark.banner]}" fill="${color}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>${emblemArt(mark.emblem, 0, -26, 0.55, INK, 1.5)}</g>`;
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
