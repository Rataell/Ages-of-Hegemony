/* ===== Biblioteca: arte, grade hexagonal, ícones ===== */
const $ = (s, r = document) => r.querySelector(s);
const SQ3 = Math.sqrt(3), INK = '#0b1114', LIGHT = '#f4ecd8';
const f1 = n => Math.round(n * 10) / 10;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Silhuetas reais das peças (apps/web/app/alpha/table-art.ts, caixa de 32 unidades). */
const SHAPES = {
  INFANTRY: c => `<path d="M-11,-1 L11,-1 L11,10 Q11,13 8,13 L-8,13 Q-11,13 -11,10 Z" fill="${c}"/>` + [-7, 0, 7].map(x => `<path d="M${x - 1.6},-1 L${x - 1.6},-9 L${x},-14.5 L${x + 1.6},-9 L${x + 1.6},-1 Z" fill="${c}"/>`).join('') + `<path d="M-11,4 L11,4" stroke="${INK}" stroke-width="1.3"/>`,
  GUARD: c => `<path d="M0,-14 C9,-14 12,-11 12,-8 L12,2 C12,9 6,13 0,15 C-6,13 -12,9 -12,2 L-12,-8 C-12,-11 -9,-14 0,-14 Z" fill="${c}"/><path d="M0,-11 L0,12" stroke="${INK}" stroke-width="1.4"/><circle cy="-1" r="3" fill="${c}" stroke="${INK}" stroke-width="1.4"/>`,
  RANGED: c => `<path d="M-6,-14 C11,-10 11,10 -6,14 L-2,14 C5,8 5,-8 -2,-14 Z" fill="${c}"/><path d="M-5,-13 L-5,13" stroke="${INK}" stroke-width="1.2"/><path d="M-13,0 L11,0" stroke="${INK}" stroke-width="2.2"/><path d="M14,0 L8,-4 L8,4 Z" fill="${c}"/><path d="M-13,0 l-2,-3 M-13,0 l-2,3" stroke="${INK}" stroke-width="1.5"/>`,
  CAVALRY: c => `<path d="M-8,14 L-8,7 C-11,0 -8,-7 -2,-10 L0,-15 L3,-10 C9,-9 13,-3 13,2 L9,4.5 L5,1 C4,6 7,9 8,14 Z" fill="${c}"/><circle cx="4" cy="-5" r="1.5" fill="${INK}"/><path d="M-2,-10 C-6,-6 -7,0 -5,7" stroke="${INK}" stroke-width="1.2" fill="none"/>`,
  SIEGE: c => `<rect x="-13" y="4" width="26" height="5" rx="1" fill="${c}"/><path d="M-7,5 L0,-6 L7,5" stroke="${c}" stroke-width="3.2" fill="none"/><path d="M-12,1 L12,-12" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/><circle cx="12" cy="-12" r="3.2" fill="${c}"/><circle cx="-8" cy="11" r="3.6" fill="${c}"/><circle cx="8" cy="11" r="3.6" fill="${c}"/><circle cx="-8" cy="11" r="1.1" fill="${INK}"/><circle cx="8" cy="11" r="1.1" fill="${INK}"/>`,
  FLEET: c => `<path d="M-15,-5 L7,-5 Q14,-3 16,0 Q14,3 7,5 L-15,5 Q-17,5 -17,3 L-17,-3 Q-17,-5 -15,-5 Z" fill="${c}"/><path d="M-8,-5 l-2,-5 M-2,-5 l-2,-5 M4,-5 l-2,-5 M-8,5 l-2,5 M-2,5 l-2,5 M4,5 l-2,5" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/><path d="M-12,0 L8,0" stroke="${INK}" stroke-width="1.3"/>`,
  COASTAL_VESSEL: c => `<path d="M-12,-5 L5,-5 Q12,-3 14,0 Q12,3 5,5 L-12,5 Q-14,5 -14,3 L-14,-3 Q-14,-5 -12,-5 Z" fill="${c}"/><path d="M-6,-5 l-2,-6 M2,-5 l-2,-6 M-6,5 l-2,6 M2,5 l-2,6" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><circle cx="-3" r="2.2" fill="${INK}"/>`,
  PIONEER: c => `<path d="M-15,8 L-15,-1 Q-15,-10 -4,-10 Q7,-10 7,-1 L7,8 Z" fill="${c}"/><path d="M-9,8 L-9,1 Q-6,-3 -3,1 L-3,8 Z" fill="${INK}"/><circle cx="-10" cy="11" r="4" fill="${c}"/><circle cx="3" cy="11" r="4" fill="${c}"/><circle cx="-10" cy="11" r="1.3" fill="${INK}"/><circle cx="3" cy="11" r="1.3" fill="${INK}"/><path d="M12,13 L12,-14" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M12,-14 L20,-10 L12,-6 Z" fill="${c}"/>`,
  ENVOY: c => `<rect x="-13" y="-9" width="26" height="18" rx="2" fill="${c}"/><path d="M-12,-8 L0,1.5 L12,-8" stroke="${INK}" stroke-width="1.7" fill="none" stroke-linejoin="round"/><circle cy="2.5" r="4.2" fill="#b44a3a" stroke="${INK}" stroke-width="1.3"/>`,
};
const KIND_NAME = { INFANTRY: 'Infantaria', GUARD: 'Guarda', RANGED: 'Atiradores', CAVALRY: 'Cavalaria', SIEGE: 'Cerco', FLEET: 'Frota', COASTAL_VESSEL: 'Barca de Patrulha', PIONEER: 'Pioneiro', ENVOY: 'Enviado' };
function pieceArt(kind, color, px = 36, count = 0) {
  const body = (SHAPES[kind] || SHAPES.INFANTRY)(color), s = px / 32;
  const outline = body.split(color).join(INK).replace(/fill="(?!none)[^"]+"/g, `fill="${INK}"`).replace(/stroke-width="([\d.]+)"/g, (_m, w) => `stroke-width="${+w + 2.6}"`);
  let g = `<g transform="scale(${f1(s * 100) / 100})"><g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round">${outline}</g>${body}`;
  if (count > 1) g += `<circle cx="12" cy="11" r="6.4" fill="${INK}" stroke="${color}" stroke-width="1.4"/><text x="12" y="14.3" text-anchor="middle" font-family="Source Sans 3,sans-serif" font-weight="700" font-size="9.5" fill="${LIGHT}">${count}</text>`;
  return g + '</g>';
}
/* Ameaça: mesma silhueta, base de ferro angular (octógono) — lê-se em escala de cinza. */
function threatFigure(kind, x, y, px = 26, count = 0, opts = {}) {
  const o = 0.5 * px * 0.78, pts = Array.from({ length: 8 }, (_, i) => { const a = Math.PI / 4 * i + Math.PI / 8; return `${f1(Math.cos(a) * o * 1.15)},${f1(Math.sin(a) * o * 0.8 + px * 0.34)}`; }).join(' ');
  return `<g transform="translate(${f1(x)} ${f1(y)})" opacity="${opts.ghost ? 0.45 : 1}"${opts.cls ? ` class="${opts.cls}"` : ''}><polygon points="${pts}" fill="#2a1511" stroke="#b4533c" stroke-width="1.4"/><g transform="translate(${-px / 2} ${-px / 2}) translate(${px / 2} ${px / 2})">${pieceArt(kind, '#b4533c', px, count)}</g>${opts.ghost ? `<circle r="${px * 0.62}" fill="none" stroke="#b4533c" stroke-dasharray="3 3" stroke-width="1.2"/>` : ''}</g>`;
}
function ownFigure(kind, x, y, px = 28, count = 0, color = '#60a3e9', opts = {}) {
  return `<g transform="translate(${f1(x)} ${f1(y)})" opacity="${opts.ghost ? 0.5 : 1}"><ellipse cy="${px * 0.42}" rx="${px * 0.5}" ry="${px * 0.16}" fill="#000" opacity=".35"/>${pieceArt(kind, color, px, count)}${opts.ghost ? `<circle r="${px * 0.62}" fill="none" stroke="${color}" stroke-dasharray="3 3" stroke-width="1.3"/>` : ''}</g>`;
}

/* Ícones dos 8 recursos (traço/preenchimento simples, grade de 24). */
const RES = [
  ['food', 'Alimento', '#b2cf87', '<path d="M12 21V8M12 12l-4-3M12 12l4-3M12 16l-4-3M12 16l4-3M12 8V3" stroke="CC" fill="none" stroke-width="2" stroke-linecap="round"/>'],
  ['wood', 'Madeira', '#c69a68', '<circle cx="8" cy="15" r="4" stroke="CC" fill="none" stroke-width="2"/><circle cx="16" cy="15" r="4" stroke="CC" fill="none" stroke-width="2"/><circle cx="12" cy="8.5" r="4" stroke="CC" fill="none" stroke-width="2"/>'],
  ['stone', 'Pedra', '#aeb7b8', '<path d="M4 18L7 9L13 6L20 11L18 19Z" fill="CC"/>'],
  ['metal', 'Metal', '#9fb7c5', '<path d="M4 18L8 9H16L20 18Z" fill="CC"/><path d="M9 13H15" stroke="#0b1114" stroke-width="1.6"/>'],
  ['wealth', 'Riqueza', '#e6c173', '<circle cx="12" cy="12" r="8.5" fill="CC"/><circle cx="12" cy="12" r="5" fill="none" stroke="#0b1114" stroke-width="1.5"/>'],
  ['culture', 'Cultura', '#d9a8c9', '<path d="M8 4Q4 12 9 20M16 4Q20 12 15 20M8 4H16M10 8V20M14 8V20" stroke="CC" fill="none" stroke-width="2" stroke-linecap="round"/>'],
  ['knowledge', 'Conhecimento', '#94bed2', '<path d="M3 6H11V19H3ZM13 6H21V19H13Z" fill="CC"/>'],
  ['influence', 'Influência', '#c4a7d4', '<path d="M4 19L3 8L8.5 12L12 5L15.5 12L21 8L20 19Z" fill="CC"/>'],
];
const RESK = Object.fromEntries(RES.map(r => [r[0], r]));
const resIcon = k => { const r = RESK[k]; return `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">${r[3].split('CC').join(r[2])}</svg>`; };

/* Ânimo: quatro selos originais (anel + traços de expressão + número). Forma, cor e rótulo dizem o estado. */
const MOOD = { 0: ['Revolta', '#e0583f'], 1: ['Revolta', '#e0583f'], 2: ['Abalada', '#e6a03c'], 3: ['Abalada', '#e6a03c'], 4: ['Estável', '#9fcf86'], 5: ['Próspera', '#e8c46e'], 6: ['Próspera', '#e8c46e'] };
const moodName = n => MOOD[n][0];
function moodSeal(n, px = 34, showNum = true) {
  const [name, c] = MOOD[n], band = name;
  let ring = `<circle r="15" fill="#0f181c" stroke="${c}" stroke-width="3"/>`, face = '';
  const eyes = `<circle cx="-5.2" cy="-3" r="1.9" fill="${c}"/><circle cx="5.2" cy="-3" r="1.9" fill="${c}"/>`;
  if (band === 'Próspera') {
    ring += [-40, -20, 0, 20, 40].map(a => `<path d="M0 -17.5 L0 -21.5" stroke="${c}" stroke-width="2" stroke-linecap="round" transform="rotate(${a})"/>`).join('');
    face = eyes + `<path d="M-6.5 3 Q0 10 6.5 3" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`;
  } else if (band === 'Estável') {
    face = eyes + `<path d="M-5 5.5 H5" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`;
  } else if (band === 'Abalada') {
    ring = `<circle r="15" fill="#0f181c" stroke="${c}" stroke-width="3" stroke-dasharray="11 3 7 3 9 3"/>`;
    face = eyes + `<path d="M-8.5 -5.5 L-3 -8.5 M8.5 -5.5 L3 -8.5" stroke="${c}" stroke-width="1.7" stroke-linecap="round"/><path d="M-6.5 6.5 Q-3.2 3 0 6.5 T6.5 6.5" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`;
  } else {
    ring = `<path d="M-13 -8 A15 15 0 0 1 3 -14.7 M9 -12 A15 15 0 0 1 14.6 -3 M14.5 4 A15 15 0 0 1 4 14.5 M-3 14.7 A15 15 0 0 1 -14.5 3" fill="none" stroke="${c}" stroke-width="3.2"/><circle r="12.5" fill="#0f181c"/>` + `<path d="M-3 -15 L-1 -21 L1.5 -16 L4 -22 L5.5 -15 M-10 -12 L-12 -17 L-7 -14" fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/>`;
    face = `<circle cx="-5" cy="-2" r="1.8" fill="${c}"/><circle cx="5" cy="-2" r="1.8" fill="${c}"/><path d="M-9 -7 L-3 -4.5 M9 -7 L3 -4.5" stroke="${c}" stroke-width="2" stroke-linecap="round"/><path d="M-5.5 9 Q0 3 5.5 9" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`;
  }
  const num = showNum ? `<circle cx="12" cy="12" r="6.3" fill="${INK}" stroke="${c}" stroke-width="1.3"/><text x="12" y="15.2" text-anchor="middle" font-family="Source Sans 3,sans-serif" font-weight="700" font-size="9.5" fill="${LIGHT}">${n}</text>` : '';
  return `<svg viewBox="-24 -24 48 48" width="${px}" height="${px}" role="img" aria-label="Ânimo ${n} de 6, ${name}">${ring}${face}${num}</svg>`;
}

/* Retrato do Líder (miniatura): busto com coroa de louros. Provisório, como no jogo. */
function portrait(px = 34) {
  return `<svg viewBox="-20 -20 40 40" width="${px}" height="${px}" role="img" aria-label="Retrato do Líder Agamenon"><defs><clipPath id="pc${px}"><circle r="17"/></clipPath></defs><circle r="18" fill="#1a2a30" stroke="#c9a867" stroke-width="2"/><g clip-path="url(#pc${px})"><path d="M-18 20 Q-16 6 0 5 Q16 6 18 20Z" fill="#6b3d33"/><path d="M-5 5 L0 11 L5 5Z" fill="#d9b98a"/><circle cy="-3" r="8.5" fill="#d9b98a"/><path d="M-9 -4 Q-9 -13 0 -13 Q9 -13 9 -4 Q5 -8 0 -8 Q-5 -8 -9 -4Z" fill="#2c211c"/></g><path d="M-12 -4 Q-14 -10 -6 -14 M12 -4 Q14 -10 6 -14" fill="none" stroke="#c9a867" stroke-width="1.8" stroke-linecap="round"/></svg>`;
}
function sealCiv(px = 30, color = '#60a3e9') {
  return `<svg class="seal" viewBox="-18 -18 36 36" width="${px}" height="${px}" role="img" aria-label="Selo de Leontia"><path d="M0 -16 L14 -8 L14 8 L0 16 L-14 8 L-14 -8Z" fill="#0f181c" stroke="${color}" stroke-width="2.4"/><circle r="8" fill="none" stroke="${color}" stroke-width="2"/><circle r="3" fill="${color}"/><path d="M-8 0 H8" stroke="${color}" stroke-width="1.4" stroke-dasharray="1.5 2"/></svg>`;
}

/* Grade hexagonal "odd-r", hex de ponta para cima (mesma orientação do mapa do jogo). */
const TER = {
  p: { n: 'Planície', c: '#56683b', cost: 1 }, f: { n: 'Floresta', c: '#2f4b34', cost: 2 }, h: { n: 'Colinas', c: '#6f5d3c', cost: 2 },
  m: { n: 'Montanha', c: '#5b6370', cost: 3 }, c: { n: 'Costa', c: '#4b8d8d', cost: 1 }, s: { n: 'Mar', c: '#183650', cost: Infinity }, '?': { n: 'Região fechada', c: '#121b20', cost: 1 },
};
class Grid {
  constructor(rows, S = 34) { this.rows = rows; this.S = S; this.R = rows.length; this.C = Math.max(...rows.map(r => r.length)); }
  t(c, r) { return (this.rows[r] || '')[c]; }
  xy(c, r) { return [this.S * SQ3 * (c + (r & 1 ? 0.5 : 0)), this.S * 1.5 * r]; }
  nb(c, r) {
    const d = r & 1 ? [[1, 0], [-1, 0], [1, -1], [0, -1], [1, 1], [0, 1]] : [[1, 0], [-1, 0], [0, -1], [-1, -1], [0, 1], [-1, 1]];
    return d.map(([a, b]) => [c + a, r + b]).filter(([x, y]) => this.t(x, y) !== undefined);
  }
  cube(c, r) { const x = c - (r - (r & 1)) / 2, z = r; return [x, -x - z, z]; }
  dist(a, b) { const A = this.cube(...a), B = this.cube(...b); return Math.max(Math.abs(A[0] - B[0]), Math.abs(A[1] - B[1]), Math.abs(A[2] - B[2])); }
  pts(c, r, k = 1) { const [x, y] = this.xy(c, r); return Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return `${f1(x + this.S * k * Math.cos(a))},${f1(y + this.S * k * Math.sin(a))}`; }).join(' '); }
  /* Dijkstra por custo de terreno; peças terrestres não entram em Mar. Retorna {cost, prev}. */
  reach(from, budget, opts = {}) {
    const key = (c, r) => c + ',' + r, cost = { [key(...from)]: 0 }, prev = {}, q = [[0, from]];
    while (q.length) {
      q.sort((a, b) => a[0] - b[0]); const [d, [c, r]] = q.shift();
      if (d > cost[key(c, r)]) continue;
      for (const [x, y] of this.nb(c, r)) {
        const t = this.t(x, y), step = (opts.naval ? (t === 's' || t === 'c' ? 1 : Infinity) : TER[t].cost);
        if (!isFinite(step) || (opts.block && opts.block(x, y))) continue;
        const nd = d + step;
        if (nd <= budget && (cost[key(x, y)] === undefined || nd < cost[key(x, y)])) { cost[key(x, y)] = nd; prev[key(x, y)] = [c, r]; q.push([nd, [x, y]]); }
      }
    }
    return { cost, prev };
  }
  path(prev, from, to) { const key = (c, r) => c + ',' + r, out = [to]; let cur = to; while (key(...cur) !== key(...from)) { cur = prev[key(...cur)]; if (!cur) return null; out.unshift(cur); } return out; }
}

/* Arte de terreno: cada tipo se lê sem rótulo; COSTA tem areia e espuma (pisa-se), MAR tem ondas fundas (não se pisa). */
function hexArt(g, c, r, t, fog = false) {
  const [x, y] = g.xy(c, r), S = g.S, k = TER[t].c;
  let d = `<polygon points="${g.pts(c, r)}" fill="${k}" stroke="#0b1114" stroke-opacity=".55" stroke-width="1"/>`;
  const seed = (c * 7 + r * 13) % 5;
  if (t === 'p') d += [[-9, 4], [5, 8], [10, -6], [-3, -9]].map(([a, b], i) => `<path d="M${f1(x + a)},${f1(y + b)} l1.6,-4.4 m2.2,4.4 l1.2,-3.4" stroke="#7f9558" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="${(i + seed) % 2 ? .9 : .5}"/>`).join('');
  if (t === 'f') d += [[-9, 5], [4, 7], [-2, -4], [11, -2]].map(([a, b]) => `<path d="M${f1(x + a)},${f1(y + b)} l4.4,-9.6 l4.4,9.6Z" fill="#1d3322" stroke="#0b1114" stroke-width=".8"/><path d="M${f1(x + a + 4.4)},${f1(y + b)} v3" stroke="#4a3322" stroke-width="1.5"/>`).join('');
  if (t === 'h') d += `<path d="M${f1(x - 14)},${f1(y + 7)} q7,-12 14,0 M${f1(x - 2)},${f1(y + 9)} q8,-14 15,0" fill="none" stroke="#8d7a50" stroke-width="2" stroke-linecap="round"/>`;
  if (t === 'm') d += `<path d="M${f1(x - 15)},${f1(y + 9)} l9,-19 l9,19Z M${f1(x - 2)},${f1(y + 9)} l9,-14 l8,14Z" fill="#6c7482" stroke="#0b1114" stroke-width="1"/><path d="M${f1(x - 6)},${f1(y - 10)} l-3.2,6.2 l3,-1.4 l2.6,1.4Z" fill="#eef0f2"/>`;
  if (t === 'c') d += `<polygon points="${g.pts(c, r, .88)}" fill="none" stroke="#e1cf9d" stroke-opacity=".75" stroke-width="2.6" stroke-dasharray="1 5" stroke-linecap="round"/><path d="M${f1(x - 13)},${f1(y + 4)} q4,-4 8,0 t8,0 t8,0 M${f1(x - 11)},${f1(y - 6)} q4,-4 8,0 t8,0" fill="none" stroke="#d8f0ee" stroke-opacity=".7" stroke-width="1.5" stroke-linecap="round"/>`;
  if (t === 's') d += `<path d="M${f1(x - 15)},${f1(y + 3)} q5,-5 10,0 t10,0 t10,0 M${f1(x - 11)},${f1(y - 8)} q5,-5 10,0 t10,0 M${f1(x - 9)},${f1(y + 12)} q5,-5 10,0 t8,0" fill="none" stroke="#2e6188" stroke-width="1.5" stroke-linecap="round" opacity=".85"/>`;
  if (t === '?') d = `<polygon points="${g.pts(c, r)}" fill="#121b20" stroke="#2a3d45" stroke-width="1"/><path d="M${f1(x - 18)},${f1(y)} h36 M${f1(x - 9)},${f1(y - 16)} l18,32 M${f1(x + 9)},${f1(y - 16)} l-18,32" stroke="#1d2b32" stroke-width="1"/>`;
  if (fog) d += `<polygon points="${g.pts(c, r)}" fill="#0a1114" opacity=".62"/>`;
  return `<g data-hex="${c},${r}">${d}</g>`;
}
function mapBase(g, fogFn) { let s = ''; for (let r = 0; r < g.R; r++) for (let c = 0; c < g.C; c++) { const t = g.t(c, r); if (t) s += hexArt(g, c, r, t, fogFn ? fogFn(c, r) : false); } return s; }
function viewBox(g, pad = 40, top = 0, bottom = 0) { const w = g.S * SQ3 * (g.C + 0.5), h = g.S * 1.5 * g.R + g.S * 0.5; return `${f1(-g.S * SQ3 / 2 - pad)} ${f1(-g.S - pad - top)} ${f1(w + pad * 2)} ${f1(h + pad * 2 + top + bottom)}`; }
function arrowDefs(id, color) { return `<marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10Z" fill="${color}"/></marker>`; }
function pathLine(g, cells, color, o = {}) {
  const pts = cells.map(([c, r]) => g.xy(c, r));
  const dd = pts.map((p, i) => `${i ? 'L' : 'M'}${f1(p[0])},${f1(p[1])}`).join('');
  return `<path d="${dd}" fill="none" stroke="${INK}" stroke-width="${(o.w || 3) + 3}" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/><path d="${dd}" fill="none" stroke="${color}" stroke-width="${o.w || 3}" stroke-linecap="round" stroke-linejoin="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.marker ? ` marker-end="url(#${o.marker})"` : ''}/>` + (o.dots ? pts.slice(0, -1).map(p => `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="2.6" fill="${color}" stroke="${INK}" stroke-width="1"/>`).join('') : '');
}

/* Cidade: platô, casas e muralha crescem com o nível; faixa de nível e selo de Ânimo ficam no hex, legíveis no relance. */
function cityArt(x, y, level, color, name, mood, o = {}) {
  const houses = [[-11, 5], [2, 7], [-3, -1], [10, 1], [-13, -4], [6, -6]].slice(0, 2 + Math.min(4, Math.ceil(level / 1.5)));
  let s = `<g transform="translate(${f1(x)} ${f1(y)})"><ellipse cy="11" rx="25" ry="8" fill="#000" opacity=".35"/><path d="M-24 8 Q-24 -4 0 -4 Q24 -4 24 8 Q24 15 0 15 Q-24 15 -24 8Z" fill="#6b6246" stroke="${INK}" stroke-width="1.4"/>`;
  if (level >= 3) s += `<path d="M-22 5 Q-22 -2 0 -2 Q22 -2 22 5" fill="none" stroke="#b7ab86" stroke-width="3.4"/><path d="M-22 5 Q-22 -2 0 -2 Q22 -2 22 5" fill="none" stroke="${INK}" stroke-width=".8" stroke-dasharray="3 2"/>`;
  s += houses.map(([a, b], i) => { const w = 7 + (i % 3), h = 5 + ((i * 2) % 4) + Math.floor(level / 3); return `<path d="M${a - w / 2},${b} v${-h} l${w / 2},-4 l${w / 2},4 v${h}Z" fill="${i % 2 ? '#d8cba3' : '#c8b88c'}" stroke="${INK}" stroke-width="1"/><path d="M${a - w / 2 - 1},${b - h} l${w / 2 + 1},-4.6 l${w / 2 + 1},4.6Z" fill="${i % 2 ? '#9c4e3c' : '#7f4036'}" stroke="${INK}" stroke-width=".9"/>`; }).join('');
  if (level >= 5) s += `<path d="M-2 -7 v-11 h4 v11Z" fill="#cfc29b" stroke="${INK}" stroke-width="1"/><path d="M-3 -18 h6 l-3 -5Z" fill="#7f4036" stroke="${INK}" stroke-width=".9"/>`;
  if (o.port) s += `<path d="M-30 12 h14 M-30 15 h12" stroke="#8a6b43" stroke-width="2.4" stroke-linecap="round"/>`;
  s += `<path d="M18 -1 v-20" stroke="#c9b48a" stroke-width="1.8"/><path d="M18 -21 l9 3.5 l-9 3.5Z" fill="${color}" stroke="${INK}" stroke-width="1"/>`;
  s += `<g transform="translate(-40 -30)">${moodSeal(mood, 32, true)}</g>`;
  s += `<g transform="translate(0 21)"><rect x="-27" y="-7" width="54" height="13" rx="6.5" fill="#0f181c" stroke="${color}" stroke-width="1.2"/><text text-anchor="middle" y="2.8" font-family="Source Sans 3,sans-serif" font-weight="700" font-size="8.4" fill="#e8e3d3">${esc(name)} · N${level}</text></g></g>`;
  return s;
}
/* Acampamento de Saqueadores: paliçada baixa, duas tendas, fogueira e estandarte rasgado. Estados: ativo, reorganizando, destruído. */
function campArt(x, y, state = 'active', n = 3) {
  const stakes = Array.from({ length: 11 }, (_, i) => { const a = Math.PI * 2 * i / 11; return [Math.cos(a) * 20, Math.sin(a) * 10 + 6]; });
  let s = `<g transform="translate(${f1(x)} ${f1(y)})"><ellipse cy="9" rx="24" ry="11" fill="#000" opacity=".35"/>`;
  if (state === 'ruin') {
    s += `<ellipse cy="7" rx="21" ry="9" fill="#2b2420" opacity=".85"/>` + stakes.map(([a, b], i) => i % 3 ? '' : `<path d="M${f1(a)},${f1(b)} l${i % 2 ? 2 : -2},-5" stroke="#3a2c22" stroke-width="2" stroke-linecap="round"/>`).join('')
      + `<path d="M-14 11 l8 -3 l7 4Z M3 12 l9 -4 l5 5Z" fill="#6a2f24" stroke="${INK}" stroke-width="1" opacity=".9"/><path d="M-4 5 q3 -6 0 -12 M2 6 q4 -7 1 -14" stroke="#8d8f90" stroke-width="2" fill="none" opacity=".5" stroke-linecap="round"/><path d="M12 -2 l8 8" stroke="#2a1511" stroke-width="3"/><path d="M8 -1 q4 -2 8 1 l-4 4Z" fill="#7a3224" stroke="${INK}" stroke-width=".8"/>`;
  } else {
    s += stakes.map(([a, b]) => `<path d="M${f1(a)},${f1(b)} v-7" stroke="#6b4a31" stroke-width="2.4" stroke-linecap="round"/><path d="M${f1(a)},${f1(b - 7)} l-1.4,-2.4 l2.8,0Z" fill="#6b4a31"/>`).join('')
      + `<path d="M-15 8 l9 -15 l9 15Z" fill="#8a3b2c" stroke="${INK}" stroke-width="1.2"/><path d="M-6 8 l0 -9" stroke="${INK}" stroke-width="1"/><path d="M3 9 l8 -12 l8 12Z" fill="#9c5b36" stroke="${INK}" stroke-width="1.2"/><path d="M11 9 l0 -8" stroke="${INK}" stroke-width="1"/>`
      + `<circle cx="-1" cy="11" r="2.6" fill="#f0a448" class="${state === 'active' ? 'pulse' : ''}"/><path d="M-1 7 q-2 -4 0 -8" stroke="#aeb2b2" stroke-width="1.6" fill="none" opacity=".55" stroke-linecap="round"/>`
      + `<path d="M0 -3 v-24" stroke="#c9b48a" stroke-width="1.8"/><path d="M0 -27 l12 2 l-3 3 l3 3 l-3 3 l3 3 l-12 -1Z" fill="#7a2c20" stroke="${INK}" stroke-width="1"/><path d="M3 -22 l4 4 M7 -22 l-4 4" stroke="#e6c9a0" stroke-width="1.1"/>`;
  }
  if (state === 'rest') s += `<g transform="translate(24 -16)"><circle r="8" fill="#0f181c" stroke="#e6b04c" stroke-width="1.4"/><path d="M-3.5 -4.5 h7 l-3.5 4.5 l3.5 4.5 h-7 l3.5 -4.5Z" fill="none" stroke="#e6b04c" stroke-width="1.3"/></g>`;
  s += `</g>`;
  return s;
}
/* Clash: estrelas de impacto sobre o hex atacado. */
function burst(x, y, k = 1) {
  const pts = Array.from({ length: 16 }, (_, i) => { const a = Math.PI * 2 * i / 16, r = (i % 2 ? 9 : 19) * k; return `${f1(x + Math.cos(a) * r)},${f1(y + Math.sin(a) * r)}`; }).join(' ');
  return `<polygon points="${pts}" fill="#e6b04c" opacity=".3" stroke="#f0cf8a" stroke-width="1.6" class="pulse"/>`;
}
function resBar(k, v, d, cap) {
  const r = RESK[k];
  return `<span class="res${v >= cap ? ' full' : ''}" title="${r[1]}${cap ? ` · armazém ${v}/${cap}` : ''}">${resIcon(k)}<b>${v}</b>${d ? `<i class="${d > 0 ? 'up' : 'dn'}">${d > 0 ? '+' : '−'}${Math.abs(d)}</i>` : ''}</span>`;
}
function chipCost(k, n, from, to) { const r = RESK[k]; return `<span class="cost">${resIcon(k)}${r[1]} ${n}${from !== undefined ? ` <small>${from} → ${to}</small>` : ''}</span>`; }
