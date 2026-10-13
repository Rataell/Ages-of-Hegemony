/**
 * Composition of ONE hexagon (Mesa Viva, visual hierarchy rule of the owner): pieces, cities, camps and troops are the priority illustrations and keep their
 * silhouettes; everything else (level seal, Ânimo, worked seal, resource seals, name, target cost) goes into FREE SLOTS of the same hex. Nothing is drawn outside
 * the hexagon (so it never covers a miniature of a neighbour), nothing overlaps another element, and a crowded hex keeps its figures at their size: a stack that
 * does not fit shows fewer figures and a "+N" pill, it is never shrunk to fit. Pure functions, no DOM: the map draws what this module places and the tests prove
 * the hard cases. The same slot table lives in the Mesa Viva artifact (docs/product/mesa-viva/06-compose.js).
 *
 * Coordinates are relative to the hex centre; the pointy-top hex has circumradius `R` (52 on the game map) and apothem R·√3/2. y grows downward.
 */
export interface Box { x: number; y: number; w: number; h: number }
export type PlaceKind = 'feature' | 'own' | 'foreign' | 'threat' | 'people' | 'level' | 'mood' | 'worked' | 'resource' | 'label' | 'cost' | 'status' | 'ghost';
/** `figs` = miniatures drawn; `overflow` = classes not drawn (the "+N" pill takes the last position of the row). */
export interface Placement { id: string; kind: PlaceKind; x: number; y: number; scale: number; px: number; figs: number; overflow: number; box: Box }
export interface HexInput {
  /** The static feature of the hex: a city, a camp, or nothing. */
  feature: 'none' | 'city' | 'camp';
  /** Classes of the viewer's own stack, of a foreign stack and of a threat's warriors (miniatures wanted, before the cap). */
  own: number; foreign: number; threat: number;
  /** An independent people. */
  people: boolean;
  /** Markers wanted. */
  level: boolean; mood: boolean; worked: boolean; resourceSeals: number;
  /** The name plate wanted (city or people); dropped when the bottom band is taken. */
  label: boolean; labelWidth?: number;
  /** The cost number of a lit target. */
  cost: boolean;
  /** A threat's state badge (waiting hourglass, retreat arrow). */
  status?: boolean;
  /** Classes of the ghost pieces of a draft move arriving here (Mover coordenado). */
  ghost?: number;
}
/** `hidden` = groups of figures that did not get a slot (a third group in one hex): the map names them in the hex title, never silently. */
export interface HexLayout { items: Placement[]; labelShown: boolean; hidden: string[] }

export const hexApothem = (R: number) => (R * Math.sqrt(3)) / 2;
/** Is the point inside the hexagon (pointy top, circumradius R)? */
export function insideHex(R: number, x: number, y: number): boolean {
  const a = hexApothem(R), ax = Math.abs(x), ay = Math.abs(y);
  return ax <= a + 1e-6 && ay <= R - ax / Math.sqrt(3) + 1e-6;
}
export const boxCorners = (b: Box): [number, number][] => [[b.x - b.w / 2, b.y - b.h / 2], [b.x + b.w / 2, b.y - b.h / 2], [b.x - b.w / 2, b.y + b.h / 2], [b.x + b.w / 2, b.y + b.h / 2]];
export const boxInsideHex = (R: number, b: Box) => boxCorners(b).every(([x, y]) => insideHex(R, x, y));
export const boxesOverlap = (a: Box, b: Box, gap = 0) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 + gap && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + gap;

/** Miniatures of one group: the width of a row of `n` figures of `px` with a 0.8 step; a figure's art (count badge, seat seal) reaches 1.16 of its nominal size. */
const rowWidth = (n: number, px: number) => Math.max(0, n - 1) * px * 0.8 + px * 1.16;

/** The slot table, in units of a hex of circumradius 52. */
export function composeHex(R: number, input: HexInput): HexLayout {
  const k = R / 52, items: Placement[] = [];
  const put = (id: string, kind: PlaceKind, x: number, y: number, w: number, h: number, extra: Partial<Placement> = {}) => {
    items.push({ id, kind, x: x * k, y: y * k, scale: 1, px: 0, figs: 0, overflow: 0, box: { x: x * k, y: y * k, w: w * k, h: h * k }, ...extra });
  };
  const hasFeature = input.feature !== 'none';
  const all: { id: 'own' | 'foreign' | 'threat' | 'ghost'; classes: number }[] = [];
  if (input.own > 0) all.push({ id: 'own', classes: input.own });
  if (input.ghost) all.push({ id: 'ghost', classes: input.ghost });
  if (input.foreign > 0) all.push({ id: 'foreign', classes: input.foreign });
  if (input.threat > 0) all.push({ id: 'threat', classes: input.threat });
  // Two slots: the threat and the viewer's own group win; a foreign stack waits (named in `hidden`) when both are there. Display order: own, ghost, foreign, threat.
  const wanted = (['threat', 'own', 'ghost', 'foreign'] as const).filter(id => all.some(g => g.id === id)).slice(0, 2);
  const shown = all.filter(g => wanted.includes(g.id)), groups = all, crowd = shown.length > 0;
  let labelShown = false;

  // ---- priority illustrations
  if (input.feature === 'city') { const s = crowd ? 0.62 : 0.85; put('feature', 'feature', 0, crowd ? -10 : 0, 48 * s, 44 * s, { scale: s * k }); }
  if (input.feature === 'camp') { const s = crowd && shown.length > 1 ? 0.7 : 1; put('feature', 'feature', 0, crowd ? -10 : -6, 40 * s, 28 * s, { scale: s * k }); }
  if (input.people && !hasFeature) put('people', 'people', 0, crowd ? -28 : -6, 26, 20);
  shown.forEach((g, slot) => {
    // City or camp: the troops stand in the bottom band; in the field they take the centre. Two groups split the width.
    const two = shown.length > 1, px = hasFeature ? (two ? 17 : 22) : (two ? 20 : 30);
    const cap = hasFeature || two ? 2 : 3, slots = Math.min(cap, g.classes), overflow = g.classes > cap ? g.classes - (cap - 1) : 0;
    const figs = overflow > 0 ? cap - 1 : slots;
    const x = two ? (slot === 0 ? -20.4 : 20.4) : 0, y = hasFeature ? 19 : input.people ? 12 : 0;
    put(g.id, g.id, x, y, rowWidth(slots, px), px * 1.16, { px: px * k, figs, overflow });
  });

  // ---- free slots for the secondary elements (corners and sides of the hex)
  if (input.level && input.feature === 'city') put('level', 'level', -30.5, -19, 20, 14);
  if (input.mood && input.feature === 'city') put('mood', 'mood', 30.5, -17, 20, 20);
  if (input.worked) { if (input.feature === 'city') put('worked', 'worked', 36, 2, 14, 14); else put('worked', 'worked', 33, -20, 14, 14); }
  const sealSlots: [number, number][] = input.feature === 'city' ? [[-36, 2], [-36, 18]] : [[-33, -20], [-32, 20]];
  for (let i = 0; i < Math.min(2, input.resourceSeals); i++) put(`resource-${i}`, 'resource', sealSlots[i]![0], sealSlots[i]![1], 15, 15);
  if (input.cost) put('cost', 'cost', 0, input.status && !hasFeature ? 33 : -34, 36, 13);
  if (input.status) { if (hasFeature) put('status', 'status', 29, -12, 14, 14); else put('status', 'status', 0, -30, 14, 14); }
  if (input.label && !(crowd && hasFeature)) { labelShown = true; put('label', 'label', 0, 33, Math.min(input.labelWidth ?? 44, 44), 11); }
  return { items, labelShown, hidden: groups.filter(g => !wanted.includes(g.id)).map(g => g.id) };
}

/** Every pair of placements that overlap or leave the hex: the hard cases must return []. */
export function composeProblems(R: number, layout: HexLayout, gap = 0): string[] {
  const out: string[] = [], items = layout.items;
  for (const it of items) if (!boxInsideHex(R, it.box)) out.push(`${it.id} leaves the hex`);
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) if (boxesOverlap(items[i]!.box, items[j]!.box, gap)) out.push(`${items[i]!.id} overlaps ${items[j]!.id}`);
  return out;
}
