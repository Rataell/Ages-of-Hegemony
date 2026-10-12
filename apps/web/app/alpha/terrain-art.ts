/**
 * Terrain art (Mesa Viva, Cena A "Terrenos, recursos e melhorias"; docs/product/mesa-viva/02b-terrain.js + terrainHex of 00-aoh-concept.js).
 * Relief, resource (tile.features) and improvement (tile.improvement) are drawn as art, never as glyphs. Pure string builders, no DOM, no
 * imports at runtime (same contract as table-art.ts). The map builds the symbols ONCE (`terrainDefs`) and every hex only `<use>`s them.
 * Hex radius of the map is 52; the extras are authored at radius 40 and scaled by `EXTRA_SCALE`.
 */
export const TERRAIN_KEYS = ['PLAINS', 'FOREST', 'HILLS', 'MOUNTAINS', 'COAST', 'SEA'] as const;
export type TerrainKey = (typeof TERRAIN_KEYS)[number];
export const TERRAIN_VARIANTS = 3;
export const HEX_RADIUS = 52;
export const EXTRA_SCALE = HEX_RADIUS / 40;
/** Relief extras stay in the background; resource and improvement art is smaller and shifted up-left so the centre stays free for pieces and the city (tested against crowded hexes). */
export const BASE_SCALE = 0.85, DETAIL_SCALE = 0.7, DETAIL_OFFSET = 0.16;
/** Terrain colours of the concept. COAST is shallow turquoise water you can wade (walkable), SEA is deep blue (ships only). */
export const TERRAIN_COLORS: Record<TerrainKey, string> = { PLAINS: '#5d7350', FOREST: '#394f3e', HILLS: '#766f50', MOUNTAINS: '#60656b', COAST: '#46a6ad', SEA: '#264f68' };
const IK = '#0b1114';
const n2 = (v: number) => Math.round(v * 100) / 100;
const P = (pts: readonly (readonly [number, number])[]) => pts.map(p => `${n2(p[0])},${n2(p[1])}`).join(' ');
const hexPts = (R: number) => [0, 1, 2, 3, 4, 5].map(i => { const a = ((60 * i - 90) * Math.PI) / 180; return [R * Math.cos(a), R * Math.sin(a)] as const; });
const rnd = (seed: number) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

/** The base relief of a hex (terrainHex of the concept): colour, clipped scatter of marks, hairline rim. */
function terrainHex(R: number, t: TerrainKey, seed: number, id: string): string {
  const r = rnd(seed), sc = Math.min(1, R / 60), cnt = (b: number) => Math.max(2, Math.round(b * Math.max(0.3, sc)));
  let s = `<clipPath id="${id}"><polygon points="${P(hexPts(R))}"/></clipPath><g clip-path="url(#${id})"><rect x="${-R}" y="${-R}" width="${2 * R}" height="${2 * R}" fill="${TERRAIN_COLORS[t]}"/>`;
  const rp = () => [(r() * 2 - 1) * R * 0.78, (r() * 2 - 1) * R * 0.8] as const, lw = Math.max(0.6, R * 0.011);
  if (t === 'PLAINS') for (let i = 0; i < cnt(8); i++) { const [x, y] = rp(); s += `<path d="M${n2(x)},${n2(y)} l${n2(-R * 0.025)},${n2(-R * 0.045)} M${n2(x)},${n2(y)} l${n2(R * 0.02)},${n2(-R * 0.05)}" stroke="#7a9266" stroke-width="${lw}" fill="none" stroke-linecap="round"/>`; }
  if (t === 'FOREST') for (let i = 0; i < cnt(10); i++) { const [x, y] = rp(), a = R * 0.09; s += `<polygon points="${P([[x, y - a * 1.9], [x - a * 0.8, y], [x + a * 0.8, y]])}" fill="#2b4033"/><polygon points="${P([[x, y - a * 1.9], [x - a * 0.8, y], [x, y]])}" fill="#35503e"/>`; }
  if (t === 'HILLS') for (let i = 0; i < cnt(4); i++) { const [x, y] = rp(), a = R * 0.2; s += `<path d="M${n2(x - a)},${n2(y)} Q${n2(x)},${n2(y - a * 0.85)} ${n2(x + a)},${n2(y)} Z" fill="#877f5c" stroke="#5a5439" stroke-width="${lw}"/>`; }
  if (t === 'SEA') for (let i = 0; i < cnt(6); i++) { const [x, y] = rp(), a = R * 0.07; s += `<path d="M${n2(x - a * 2)},${n2(y)} q${n2(a)},${n2(-a)} ${n2(a * 2)},0 q${n2(a)},${n2(a)} ${n2(a * 2)},0" stroke="#5f8ea6" stroke-width="${lw}" fill="none"/>`; }
  if (t === 'COAST') {
    s += `<ellipse cx="${n2(R * 0.1)}" cy="${n2(R * 0.05)}" rx="${n2(R * 0.8)}" ry="${n2(R * 0.62)}" fill="#7fcfc4" opacity=".6"/>`;
    for (let i = 0; i < 4; i++) { const [x, y] = rp(); s += `<ellipse cx="${n2(x * 0.9)}" cy="${n2(y * 0.9)}" rx="${n2(R * (0.16 + r() * 0.12))}" ry="${n2(R * 0.07)}" fill="#e6d8a6" opacity=".62"/>`; }
    for (let i = 0; i < 4; i++) { const [x, y] = rp(), a = R * 0.06; s += `<path d="M${n2(x - a * 2)},${n2(y)} q${n2(a)},${n2(-a)} ${n2(a * 2)},0 q${n2(a)},${n2(a)} ${n2(a * 2)},0" stroke="#e9fbf8" stroke-width="${lw}" fill="none" opacity=".85"/>`; }
  }
  return `${s}</g><polygon points="${P(hexPts(R))}" fill="none" stroke="#0a1115" stroke-width="${Math.max(0.7, R * 0.012)}"/>`;
}

/** Recognisable relief on top of the base (authored at radius 40). */
const TERR_EXTRA: Record<TerrainKey, () => string> = {
  PLAINS: () => `<ellipse cx="-14" cy="12" rx="6" ry="3.6" fill="#4d6b3a"/><ellipse cx="18" cy="-10" rx="5" ry="3" fill="#4d6b3a"/>` + [[-4, -12], [12, 6], [-18, 2]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#f0d878"/>`).join(''),
  FOREST: () => `<ellipse cx="0" cy="12" rx="22" ry="7" fill="#1f3326" opacity=".7"/>` + ([[-14, 8, 1.25], [4, 10, 1.4], [16, 6, 1.15]] as const).map(([x, y, k]) => `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-1.3" y="-1" width="2.6" height="6" fill="#4a3322"/><polygon points="0,-20 -7,-7 7,-7" fill="#274a35" stroke="${IK}" stroke-width=".8"/><polygon points="0,-13 -9,0 9,0" fill="#2f5a40" stroke="${IK}" stroke-width=".8"/></g>`).join(''),
  HILLS: () => `<path d="M-30,10 Q-14,-6 2,10" fill="#7a6a42" stroke="${IK}" stroke-width=".9"/><path d="M-6,12 Q10,-10 30,12" fill="#8a7a50" stroke="${IK}" stroke-width=".9"/><path d="M-4,4 q2,-4 4,0 M12,2 q2,-4 4,0" stroke="#5a7a40" stroke-width="1.6" fill="none"/>`,
  MOUNTAINS: () => `<path d="M-15,9 l9,-19 l9,19Z M-2,9 l9,-14 l8,14Z" fill="#6c7482" stroke="${IK}" stroke-width="1"/><path d="M-6,-10 l-3.2,6.2 l3,-1.4 l2.6,1.4Z" fill="#eef0f2"/><path d="M-6,12 l12,-26 l12,26Z" fill="#7a828e" stroke="${IK}" stroke-width="1"/><path d="M0,-14 l-6,12 l5,-2.4 l4,3 l3,-4 l2.4,3.4Z" fill="#f4f6f8"/>`,
  COAST: () => ([[-16, 0], [14, 6], [4, -10]] as const).map(([x, y]) => `<path d="M${x},${y} v-8 M${x - 2},${y - 3} l2,-5 l2,5" stroke="#5d8a52" stroke-width="1.6" fill="none" stroke-linecap="round"/>`).join('') + ([[-6, 6], [10, -2], [-22, 8]] as const).map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="1.6" fill="#f0e6bd" opacity=".9"/>`).join(''),
  SEA: () => `<path d="M-30,6 q6,-6 12,0 t12,0 t12,0 t12,0" stroke="#4e86a6" stroke-width="1.6" fill="none" opacity=".8"/>`,
};

export type FeatureKey = 'RIVER' | 'FERTILE' | 'TIMBER' | 'STONE' | 'METAL' | 'FISH';
export type ImprovementKey = 'FARM' | 'LUMBER_CAMP' | 'QUARRY' | 'MINE' | 'FISHERY';
export const FEATURE_KEYS: readonly FeatureKey[] = ['RIVER', 'FERTILE', 'TIMBER', 'STONE', 'METAL', 'FISH'];
export const IMPROVEMENT_KEYS: readonly ImprovementKey[] = ['FARM', 'LUMBER_CAMP', 'QUARRY', 'MINE', 'FISHERY'];

const FEAT_ART: Record<FeatureKey, () => string> = {
  RIVER: () => `<path d="M-36,-12 C-20,-24 -8,4 6,-3 S28,18 36,10" fill="none" stroke="#244f6e" stroke-width="8" stroke-linecap="round"/><path d="M-36,-12 C-20,-24 -8,4 6,-3 S28,18 36,10" fill="none" stroke="#7db4d3" stroke-width="3.4" stroke-linecap="round"/><path d="M-20,-8 q3,-3 6,0 M8,2 q3,-3 6,0" stroke="#e8f4f8" stroke-width="1.2" fill="none" opacity=".8"/>`,
  FERTILE: () => `<ellipse cx="0" cy="6" rx="26" ry="15" fill="#a8bd52" opacity=".4"/>` + [[-14, 8], [-4, 12], [8, 8], [16, 14], [0, 2], [-18, 16]].map(([x, y]) => `<path d="M${x},${y} v-10 M${x},${y! - 4} l-3.4,-3.4 M${x},${y! - 4} l3.4,-3.4 M${x},${y! - 8} l-2.6,-2.6 M${x},${y! - 8} l2.6,-2.6" stroke="#f0cf62" stroke-width="1.5" stroke-linecap="round" fill="none"/>`).join(''),
  TIMBER: () => [[-10, 12], [8, 12], [-1, 5]].map(([x, y]) => `<rect x="${x! - 11}" y="${y! - 5}" width="22" height="7" rx="3.5" fill="#8a5e3a" stroke="${IK}" stroke-width="1"/><ellipse cx="${x! + 11}" cy="${y! - 1.5}" rx="3" ry="3.5" fill="#d2a874" stroke="${IK}" stroke-width=".8"/><path d="M${x! - 8},${y! - 2} h12" stroke="#5e3f26" stroke-width=".9"/>`).join(''),
  STONE: () => `<polygon points="-18,12 -14,0 -4,-4 4,4 2,12" fill="#aeb7b8" stroke="${IK}" stroke-width="1.1"/><polygon points="-14,0 -4,-4 -2,2 -10,6" fill="#d3d9d9"/><polygon points="4,12 8,2 18,0 22,10 20,13" fill="#9aa3a4" stroke="${IK}" stroke-width="1.1"/><polygon points="8,2 18,0 16,6" fill="#c8cece"/>`,
  METAL: () => `<polygon points="-20,13 -16,2 -6,-2 2,6 0,13" fill="#7e8a94" stroke="${IK}" stroke-width="1.1"/><polygon points="-6,6 -2,-10 3,4" fill="#9fb7c5" stroke="${IK}" stroke-width="1"/><polygon points="4,13 8,-2 14,-8 20,2 18,13" fill="#8a97a2" stroke="${IK}" stroke-width="1.1"/><polygon points="8,-2 14,-8 14,0" fill="#c4d8e4"/><path d="M-2,-14 v8 M-6,-10 h8 M16,-14 v6 M13,-11 h6" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`,
  FISH: () => ([[-10, 4], [6, -4], [10, 12]] as const).map(([x, y], i) => `<g transform="translate(${x} ${y}) rotate(${i * 25 - 10})"><path d="M-7,0 q7,-6 14,0 q-7,6 -14,0Z M7,0 l6,-4 v8Z" fill="#dcecf2" stroke="${IK}" stroke-width=".9"/><circle cx="-3" cy="-1" r=".9" fill="${IK}"/></g>`).join('') + `<path d="M-20,16 q4,-3 8,0 t8,0 M6,18 q4,-3 8,0" stroke="#e8f4f8" stroke-width="1.2" fill="none" opacity=".75"/>`,
};
const IMP_ART: Record<ImprovementKey, () => string> = {
  FARM: () => `<polygon points="-26,0 -2,-12 24,0 0,13" fill="#8a6a3c" stroke="${IK}" stroke-width="1.1"/>` + [-12, -4, 4, 12].map(k => `<path d="M${-22 + k * 0.4},${k * 0.5 - 3} l24,12" stroke="#7fa84a" stroke-width="2" opacity=".9"/>`).join('') + `<rect x="14" y="-18" width="12" height="9" fill="#a8483a" stroke="${IK}" stroke-width="1"/><polygon points="12,-18 20,-25 28,-18" fill="#6e2f26" stroke="${IK}" stroke-width="1"/><rect x="18" y="-14" width="4" height="5" fill="${IK}"/>`,
  LUMBER_CAMP: () => `<rect x="-22" y="-4" width="16" height="11" fill="#b98b5a" stroke="${IK}" stroke-width="1"/><polygon points="-24,-4 -14,-13 -4,-4" fill="#7a4b32" stroke="${IK}" stroke-width="1"/><rect x="-16" y="1" width="4" height="6" fill="${IK}"/>` + [[2, 10], [12, 10], [7, 3]].map(([x, y]) => `<rect x="${x! - 7}" y="${y! - 3.5}" width="14" height="6" rx="3" fill="#8a5e3a" stroke="${IK}" stroke-width=".9"/><ellipse cx="${x! + 7}" cy="${y! - 0.5}" rx="2.4" ry="3" fill="#d2a874" stroke="${IK}" stroke-width=".7"/>`).join('') + `<path d="M22,12 v-12 M18,2 l8,-4" stroke="#6e6e6e" stroke-width="2" stroke-linecap="round"/>`,
  QUARRY: () => `<polygon points="-24,12 -20,-2 -4,-6 8,2 6,12" fill="#6e7274" stroke="${IK}" stroke-width="1.1"/><polygon points="-20,-2 -4,-6 -2,0 -16,4" fill="#8e9294"/><rect x="6" y="3" width="10" height="7" fill="#c9cdcd" stroke="${IK}" stroke-width="1"/><rect x="14" y="-3" width="10" height="7" fill="#d6dada" stroke="${IK}" stroke-width="1"/><path d="M20,-14 v10 M12,-14 h14 M12,-14 l-4,5" stroke="#6a5a42" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  MINE: () => `<path d="M-14,13 v-16 a14,14 0 0 1 28,0 v16Z" fill="#171310" stroke="${IK}" stroke-width="1.2"/><path d="M-14,13 v-16 a14,14 0 0 1 28,0 v16 M-9,13 v-14 M9,13 v-14 M-12,-5 h24" fill="none" stroke="#8a5e3a" stroke-width="2.6"/><path d="M-20,15 h40 M-26,12 l12,3" stroke="#555" stroke-width="1.4"/><path d="M14,8 l3,-6 h10 l3,6Z" fill="#6e7a84" stroke="${IK}" stroke-width="1"/><circle cx="19" cy="0" r="2" fill="#9fb7c5"/><circle cx="24" cy="1" r="1.8" fill="#c4d8e4"/><circle cx="17" cy="11" r="2.2" fill="#333"/><circle cx="27" cy="11" r="2.2" fill="#333"/>`,
  FISHERY: () => `<rect x="-24" y="2" width="30" height="5" fill="#9a7d52" stroke="${IK}" stroke-width="1"/><path d="M-20,7 v8 M-8,7 v8 M4,7 v8" stroke="#3a2a18" stroke-width="2"/><path d="M-22,-10 v12 M-4,-10 v12" stroke="#6a4a2a" stroke-width="2"/><path d="M-22,-9 q9,10 18,0 M-22,-5 q9,10 18,0" fill="none" stroke="#e1dcc8" stroke-width="1.1"/><path d="M10,12 q10,5 20,0 l-3,-6 h-14Z" fill="#b98b5a" stroke="${IK}" stroke-width="1"/><path d="M20,6 v-12 l8,8Z" fill="#e8e1cc" stroke="${IK}" stroke-width=".9"/>`,
};

/** Names and short texts (concept TERR_INFO / FEAT_INFO / IMP_INFO). Costs and yields come from the engine's rules when the map is given them. */
export const TERRAIN_INFO: Record<TerrainKey, { name: string; move: string; yields: string }> = {
  PLAINS: { name: 'Planície', move: 'Custo de movimento 1', yields: 'Alimento. Fazenda: +1 Alimento.' },
  FOREST: { name: 'Floresta', move: 'Custo de movimento 2', yields: 'Madeira. Acampamento de Lenha: +1 Madeira.' },
  HILLS: { name: 'Colinas', move: 'Custo de movimento 2', yields: 'Pedra. Pedreira ou Mina.' },
  MOUNTAINS: { name: 'Montanha', move: 'Custo de movimento 3', yields: 'Pedra e Metal. Pedreira ou Mina.' },
  COAST: { name: 'Costa', move: 'Águas rasas: custo de movimento 1, pisa-se como terra e navios também passam', yields: 'Alimento por Pesqueiro na margem. Porto.' },
  SEA: { name: 'Mar', move: 'Intransponível por terra; só navios', yields: 'Rotas e Ancoradouros.' },
};
export const FEATURE_INFO: Record<FeatureKey, { name: string; text: string }> = {
  RIVER: { name: 'Rio', text: 'Água doce que corta o hex.' },
  FERTILE: { name: 'Terra fértil', text: 'Aceita Fazenda em qualquer terreno plano.' },
  TIMBER: { name: 'Madeira', text: 'Toras prontas para o Acampamento de Lenha.' },
  STONE: { name: 'Pedra', text: 'Afloramento para Pedreira.' },
  METAL: { name: 'Jazida de Metal', text: 'Minério para Mina.' },
  FISH: { name: 'Cardume', text: 'Pesca na Costa.' },
};
export const IMPROVEMENT_INFO: Record<ImprovementKey, { name: string; text: string }> = {
  FARM: { name: 'Fazenda', text: '+1 Alimento' },
  LUMBER_CAMP: { name: 'Acampamento de Lenha', text: '+1 Madeira' },
  QUARRY: { name: 'Pedreira', text: '+1 Pedra' },
  MINE: { name: 'Mina', text: '+2 Pedra/Metal' },
  FISHERY: { name: 'Pesqueiro', text: '+1 Alimento' },
};

export const terrainId = (terrain: TerrainKey, variant: number) => `aoh-t-${terrain}-${variant}`;
export const featureId = (feature: FeatureKey) => `aoh-f-${feature}`;
export const improvementId = (improvement: ImprovementKey) => `aoh-i-${improvement}`;
/** Same tile, same variant, so the board never shimmers between renders. */
export const terrainVariant = (q: number, r: number) => (((q * 31 + r * 17) % 97) + 97) % 97 % TERRAIN_VARIANTS;
export const isTerrainKey = (value: string): value is TerrainKey => (TERRAIN_KEYS as readonly string[]).includes(value);
export const isFeatureKey = (value: string): value is FeatureKey => (FEATURE_KEYS as readonly string[]).includes(value);
export const isImprovementKey = (value: string): value is ImprovementKey => (IMPROVEMENT_KEYS as readonly string[]).includes(value);

let DEFS: string | null = null;
/** Every symbol of the board, once: relief per terrain and variant (with the recognisable extras), the six resources and the five improvements. */
export function terrainDefs(): string {
  if (DEFS !== null) return DEFS;
  const u = n2(EXTRA_SCALE);
  let s = '';
  for (const t of TERRAIN_KEYS) for (let v = 0; v < TERRAIN_VARIANTS; v++) {
    const id = terrainId(t, v);
    s += `<g id="${id}">${terrainHex(HEX_RADIUS, t, (v * 31 + 17) % 97 + 3 + TERRAIN_KEYS.indexOf(t) * 11, `${id}-clip`)}<g transform="scale(${n2(u * BASE_SCALE)})">${TERR_EXTRA[t]()}</g></g>`;
  }
  for (const f of FEATURE_KEYS) s += `<g id="${featureId(f)}"><g transform="translate(${n2(-HEX_RADIUS * DETAIL_OFFSET)} ${n2(-HEX_RADIUS * DETAIL_OFFSET)}) scale(${n2(u * DETAIL_SCALE)})">${FEAT_ART[f]()}</g></g>`;
  for (const i of IMPROVEMENT_KEYS) s += `<g id="${improvementId(i)}"><g transform="translate(${n2(-HEX_RADIUS * DETAIL_OFFSET)} ${n2(-HEX_RADIUS * DETAIL_OFFSET)}) scale(${n2(u * DETAIL_SCALE)})">${IMP_ART[i]()}</g></g>`;
  DEFS = s;
  return s;
}

/**
 * The text of a hex for assistive tech and the hover inspector: relief, resource, improvement, owner. `moveCosts` are the engine's rules (movementCosts)
 * when the caller has them; without them the concept's copy is used.
 */
export function terrainSummary(o: { terrain: string; features?: readonly string[]; improvement?: string | null; owner?: string | null | undefined; moveCosts?: Readonly<Record<string, number>> | undefined }): { short: string; lines: string[] } {
  const info = isTerrainKey(o.terrain) ? TERRAIN_INFO[o.terrain] : null;
  const feats = (o.features ?? []).filter(isFeatureKey), imp = o.improvement && isImprovementKey(o.improvement) ? o.improvement : null;
  const short = [info?.name ?? 'Região fechada', ...feats.map(f => FEATURE_INFO[f].name), ...(imp ? [IMPROVEMENT_INFO[imp].name] : []), ...(o.owner ? [o.owner] : [])].join(' · ');
  if (!info) return { short, lines: [short, 'Desconhecida. Exploração com Pioneiro.'] };
  const cost = o.moveCosts?.[o.terrain];
  const move = o.terrain === 'SEA' ? info.move : cost !== undefined ? `Custo de movimento ${cost}${o.terrain === 'COAST' ? ' (conta como terra)' : ''}` : info.move;
  return { short, lines: [short, move, info.yields, ...feats.map(f => `${FEATURE_INFO[f].name}: ${FEATURE_INFO[f].text}`), ...(imp ? [`${IMPROVEMENT_INFO[imp].name}: ${IMPROVEMENT_INFO[imp].text}`] : []), o.owner ? `Território de ${o.owner}.` : 'Sem dono.'] };
}
