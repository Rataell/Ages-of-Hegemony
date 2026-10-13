/**
 * Road art (Mesa Viva, "Estradas em rede"; docs/product/mesa-viva/02b-terrain.js `roadLayer` and 03b-roads.js). A road is not a pair of straight half-lines: every hex with a
 * road links to ALL of its neighbours that have a road or a city, in the six directions, and the hex reads by how many links it has:
 *   - 0 links  an isolated stretch (a short ellipse)        - 1 link   a dead end (a stone cap)
 *   - 2 links  a straight stretch or a curve (one smooth stroke through the hex)
 *   - 3+ links a junction or a star: strokes meet in a dressed-stone (cantaria) disc
 * On COAST the road is a boardwalk of planks over the shallow water; on a hex with a RIVER it gets a plank bridge across the first link. A city hex only draws the
 * strokes that run from its centre toward the neighbours that have a road (the city piece is drawn over them). The road model (`state.roads`) is unchanged.
 * Pure string builders, no DOM, no imports (same contract as terrain-art.ts and table-art.ts). Coordinates are local to the hex centre; `mids` are the points where
 * each link crosses the shared edge, i.e. half of the vector toward that neighbour.
 */
const f1 = (n: number) => Math.round(n * 10) / 10;

export interface RoadTile {
  /** Where each link leaves the hex: half of the vector from this hex centre to the linked neighbour (road hex or city). */
  mids: readonly (readonly [number, number])[];
  /** COAST hex: shallow water you can wade, so the road is a boardwalk. */
  coast: boolean;
  /** The hex has a RIVER feature: a bridge crosses it along the first link. */
  river: boolean;
  /** City hex: only the strokes toward the road neighbours, no caps, no junction disc; they stop at the edge of the city piece (`CITY_REACH`), never under it. */
  city: boolean;
  /** A visible piece or threat stands here (no city): the road fades to `BUSY_OPACITY` and loses the hub, the cap, the isolated stretch and the bridge, so it never competes with the piece (docs/product/ux-board-layering.md). */
  busy?: boolean;
}
/** Fraction of the way from the hex centre to the edge crossing where a road toward a city stops. */
export const CITY_REACH = 0.4;
export const BUSY_OPACITY = 0.42;

/** One stroke of the road: dark edge, packed-earth body and a light dashed centre line; or, on the coast, the white foam, the boards and the plank dashes. */
function stroke(d: string, coast: boolean, S: number): string {
  return coast
    ? `<path d="${d}" fill="none" stroke="#e9fbf8" stroke-opacity=".8" stroke-width="${f1(S * 0.22)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#6a4a2a" stroke-width="${f1(S * 0.15)}" stroke-linecap="butt"/><path d="${d}" fill="none" stroke="#c9a56e" stroke-width="${f1(S * 0.1)}" stroke-dasharray="${f1(S * 0.05)} ${f1(S * 0.07)}"/>`
    : `<path d="${d}" fill="none" stroke="#3f3322" stroke-opacity=".9" stroke-width="${f1(S * 0.2)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#c9b38a" stroke-width="${f1(S * 0.13)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#efe3bd" stroke-width="${f1(S * 0.02)}" stroke-dasharray="${f1(S * 0.06)} ${f1(S * 0.09)}"/>`;
}

/** The road of one hex, centred on (0,0), for a hex of circumradius `S` (the map draws hexes at 52). */
export function roadTileArt(tile: RoadTile, S = 52): string {
  const { mids, coast, river, city } = tile, busy = Boolean(tile.busy) && !city;
  let out = '';
  if (mids.length === 2 && !city) out += stroke(`M${f1(mids[0]![0])},${f1(mids[0]![1])} Q0,0 ${f1(mids[1]![0])},${f1(mids[1]![1])}`, coast, S);
  else for (const m of mids) out += stroke(`M${f1(m[0])},${f1(m[1])} L${city ? `${f1(m[0] * (1 - CITY_REACH))},${f1(m[1] * (1 - CITY_REACH))}` : '0,0'}`, coast, S);
  if (city) return out;
  if (busy) return out ? `<g class="road-busy" opacity="${BUSY_OPACITY}">${out}</g>` : '';
  if (mids.length >= 3) out += `<circle r="${f1(S * 0.17)}" fill="#c9b38a" stroke="#3f3322" stroke-width="1.4"/><circle r="${f1(S * 0.09)}" fill="none" stroke="#7a6446" stroke-width="1" stroke-dasharray="2 2"/>`;
  else if (mids.length === 1) out += `<circle r="${f1(S * 0.1)}" fill="#c9b38a" stroke="#3f3322" stroke-width="1.2"/>`;
  else out += `<ellipse rx="${f1(S * 0.22)}" ry="${f1(S * 0.12)}" fill="#c9b38a" stroke="#3f3322" stroke-width="1.2"/>`;
  if (river && mids.length) {
    const angle = Math.atan2(mids[0]![1], mids[0]![0]) * 180 / Math.PI;
    out += `<g transform="rotate(${f1(angle)})"><rect x="${f1(-S * 0.3)}" y="${f1(-S * 0.13)}" width="${f1(S * 0.6)}" height="${f1(S * 0.26)}" fill="#9a7d52" stroke="#2a1d10" stroke-width="1.2"/><path d="M${f1(-S * 0.3)},${f1(-S * 0.13)} h${f1(S * 0.6)} M${f1(-S * 0.3)},${f1(S * 0.13)} h${f1(S * 0.6)}" stroke="#3a2a18" stroke-width="2"/>${[-0.2, -0.07, 0.07, 0.2].map(k => `<path d="M${f1(S * k)},${f1(-S * 0.13)} v${f1(S * 0.26)}" stroke="#2a1d10" stroke-width=".9"/>`).join('')}</g>`;
  }
  return out;
}

/** Roads never exist on open sea or on a face-down hex. */
export const roadCanStand = (terrain: string): boolean => terrain !== 'SEA' && terrain !== 'UNKNOWN';
