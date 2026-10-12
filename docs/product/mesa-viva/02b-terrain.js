/* ===== Terrenos que dizem o que há neles: relevo, recursos (feature), melhorias e dono. Traço no mesmo espaço do terrainHex (raio 40). ===== */
const TERR_INFO = {
  p: ['Planície', 'Custo de movimento 1', 'Alimento. Fazenda: +1 Alimento.'],
  f: ['Floresta', 'Custo de movimento 2', 'Madeira. Acampamento de Lenha: +1 Madeira.'],
  h: ['Colinas', 'Custo de movimento 2', 'Pedra. Pedreira ou Mina.'],
  m: ['Montanha', 'Custo de movimento 3', 'Pedra e Metal. Pedreira ou Mina.'],
  c: ['Costa', 'Águas rasas: custo de movimento 1, pisa-se como terra e navios também passam', 'Alimento por Pesqueiro na margem. Porto.'],
  s: ['Mar', 'Intransponível por terra; só navios', 'Cardumes pescados por navios. Rotas e Ancoradouros.'],
  '?': ['Região fechada', 'Desconhecida', 'Exploração com Pioneiro.'],
};
const FEAT_INFO = { RIVER: ['Rio', 'Água doce que corta o hex.'], FERTILE: ['Terra fértil', 'Aceita Fazenda em qualquer terreno plano.'], TIMBER: ['Madeira', 'Toras prontas para o Acampamento de Lenha.'], STONE: ['Pedra', 'Afloramento para Pedreira.'], METAL: ['Jazida de Metal', 'Minério para Mina.'], FISH: ['Cardume costeiro', 'Pesqueiro na margem.'], SHOAL: ['Cardume de alto-mar', 'Só navios pescam: Frota ou Barca sobre o hex.'] };
const IMP_INFO = { FARM: ['Fazenda', '+1 Alimento'], LUMBER_CAMP: ['Acampamento de Lenha', '+1 Madeira'], QUARRY: ['Pedreira', '+1 Pedra'], MINE: ['Mina', '+2 Pedra/Metal'], FISHERY: ['Pesqueiro', '+1 Alimento'], FISHING_FLEET: ['Pesca de frota', '+2 Alimento (proposta)'], ROAD: ['Estrada', 'Movimento 1 para peças terrestres'] };
const IK = '#0b1114';
const FEAT_ART = {
  RIVER: () => `<path d="M-36,-12 C-20,-24 -8,4 6,-3 S28,18 36,10" fill="none" stroke="#244f6e" stroke-width="8" stroke-linecap="round"/><path d="M-36,-12 C-20,-24 -8,4 6,-3 S28,18 36,10" fill="none" stroke="#7db4d3" stroke-width="3.4" stroke-linecap="round"/><path d="M-20,-8 q3,-3 6,0 M8,2 q3,-3 6,0" stroke="#e8f4f8" stroke-width="1.2" fill="none" opacity=".8"/>`,
  FERTILE: () => `<ellipse cx="0" cy="6" rx="26" ry="15" fill="#a8bd52" opacity=".4"/>` + [[-14, 8], [-4, 12], [8, 8], [16, 14], [0, 2], [-18, 16]].map(([x, y]) => `<path d="M${x},${y} v-10 M${x},${y - 4} l-3.4,-3.4 M${x},${y - 4} l3.4,-3.4 M${x},${y - 8} l-2.6,-2.6 M${x},${y - 8} l2.6,-2.6" stroke="#f0cf62" stroke-width="1.5" stroke-linecap="round" fill="none"/>`).join(''),
  TIMBER: () => [[-10, 12, 0], [8, 12, 0], [-1, 5, 0]].map(([x, y]) => `<rect x="${x - 11}" y="${y - 5}" width="22" height="7" rx="3.5" fill="#8a5e3a" stroke="${IK}" stroke-width="1"/><ellipse cx="${x + 11}" cy="${y - 1.5}" rx="3" ry="3.5" fill="#d2a874" stroke="${IK}" stroke-width=".8"/><path d="M${x - 8},${y - 2} h12" stroke="#5e3f26" stroke-width=".9"/>`).join(''),
  STONE: () => `<polygon points="-18,12 -14,0 -4,-4 4,4 2,12" fill="#aeb7b8" stroke="${IK}" stroke-width="1.1"/><polygon points="-14,0 -4,-4 -2,2 -10,6" fill="#d3d9d9"/><polygon points="4,12 8,2 18,0 22,10 20,13" fill="#9aa3a4" stroke="${IK}" stroke-width="1.1"/><polygon points="8,2 18,0 16,6" fill="#c8cece"/>`,
  METAL: () => `<polygon points="-20,13 -16,2 -6,-2 2,6 0,13" fill="#7e8a94" stroke="${IK}" stroke-width="1.1"/><polygon points="-6,6 -2,-10 3,4" fill="#9fb7c5" stroke="${IK}" stroke-width="1"/><polygon points="4,13 8,-2 14,-8 20,2 18,13" fill="#8a97a2" stroke="${IK}" stroke-width="1.1"/><polygon points="8,-2 14,-8 14,0" fill="#c4d8e4"/><path d="M-2,-14 v8 M-6,-10 h8 M16,-14 v6 M13,-11 h6" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`,
  FISH: () => [[-10, 4], [6, -4], [10, 12]].map(([x, y], i) => `<g transform="translate(${x} ${y}) rotate(${i * 25 - 10})"><path d="M-7,0 q7,-6 14,0 q-7,6 -14,0Z M7,0 l6,-4 v8Z" fill="#dcecf2" stroke="${IK}" stroke-width=".9"/><circle cx="-3" cy="-1" r=".9" fill="${IK}"/></g>`).join('') + `<path d="M-20,16 q4,-3 8,0 t8,0 M6,18 q4,-3 8,0" stroke="#e8f4f8" stroke-width="1.2" fill="none" opacity=".75"/>`,
};
FEAT_ART.SHOAL = () => `<ellipse cx="0" cy="2" rx="22" ry="13" fill="#0e2b44" opacity=".45"/>` + Array.from({ length: 7 }, (_, i) => { const a = i / 7 * Math.PI * 2, x = Math.cos(a) * 12, y = Math.sin(a) * 7; return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a * 57.3 + 90)})"><path d="M-6,0 q6,-5 12,0 q-6,5 -12,0Z M6,0 l5,-4 v8Z" fill="#dcecf2" stroke="${IK}" stroke-width=".8"/><circle cx="-3" cy="-1" r=".8" fill="${IK}"/></g>`; }).join('') + `<circle cx="-16" cy="-12" r="1.6" fill="#e8f4f8" opacity=".8"/><circle cx="14" cy="-14" r="1.2" fill="#e8f4f8" opacity=".8"/>`;
const IMP_ART = {
  FARM: () => `<polygon points="-26,0 -2,-12 24,0 0,13" fill="#8a6a3c" stroke="${IK}" stroke-width="1.1"/>` + [-12, -4, 4, 12].map(k => `<path d="M${-22 + k * .4},${k * .5 - 3} l24,12" stroke="#7fa84a" stroke-width="2" opacity=".9"/>`).join('') + `<rect x="14" y="-18" width="12" height="9" fill="#a8483a" stroke="${IK}" stroke-width="1"/><polygon points="12,-18 20,-25 28,-18" fill="#6e2f26" stroke="${IK}" stroke-width="1"/><rect x="18" y="-14" width="4" height="5" fill="${IK}"/>`,
  LUMBER_CAMP: () => `<rect x="-22" y="-4" width="16" height="11" fill="#b98b5a" stroke="${IK}" stroke-width="1"/><polygon points="-24,-4 -14,-13 -4,-4" fill="#7a4b32" stroke="${IK}" stroke-width="1"/><rect x="-16" y="1" width="4" height="6" fill="${IK}"/>` + [[2, 10], [12, 10], [7, 3]].map(([x, y]) => `<rect x="${x - 7}" y="${y - 3.5}" width="14" height="6" rx="3" fill="#8a5e3a" stroke="${IK}" stroke-width=".9"/><ellipse cx="${x + 7}" cy="${y - .5}" rx="2.4" ry="3" fill="#d2a874" stroke="${IK}" stroke-width=".7"/>`).join('') + `<path d="M22,12 v-12 M18,2 l8,-4" stroke="#6e6e6e" stroke-width="2" stroke-linecap="round"/>`,
  QUARRY: () => `<polygon points="-24,12 -20,-2 -4,-6 8,2 6,12" fill="#6e7274" stroke="${IK}" stroke-width="1.1"/><polygon points="-20,-2 -4,-6 -2,0 -16,4" fill="#8e9294"/><rect x="6" y="3" width="10" height="7" fill="#c9cdcd" stroke="${IK}" stroke-width="1"/><rect x="14" y="-3" width="10" height="7" fill="#d6dada" stroke="${IK}" stroke-width="1"/><path d="M20,-14 v10 M12,-14 h14 M12,-14 l-4,5" stroke="#6a5a42" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  MINE: () => `<path d="M-14,13 v-16 a14,14 0 0 1 28,0 v16Z" fill="#171310" stroke="${IK}" stroke-width="1.2"/><path d="M-14,13 v-16 a14,14 0 0 1 28,0 v16 M-9,13 v-14 M9,13 v-14 M-12,-5 h24" fill="none" stroke="#8a5e3a" stroke-width="2.6"/><path d="M-20,15 h40 M-26,12 l12,3" stroke="#555" stroke-width="1.4"/><path d="M14,8 l3,-6 h10 l3,6Z" fill="#6e7a84" stroke="${IK}" stroke-width="1"/><circle cx="19" cy="0" r="2" fill="#9fb7c5"/><circle cx="24" cy="1" r="1.8" fill="#c4d8e4"/><circle cx="17" cy="11" r="2.2" fill="#333"/><circle cx="27" cy="11" r="2.2" fill="#333"/>`,
  FISHERY: () => `<rect x="-24" y="2" width="30" height="5" fill="#9a7d52" stroke="${IK}" stroke-width="1"/><path d="M-20,7 v8 M-8,7 v8 M4,7 v8" stroke="#3a2a18" stroke-width="2"/><path d="M-22,-10 v12 M-4,-10 v12" stroke="#6a4a2a" stroke-width="2"/><path d="M-22,-9 q9,10 18,0 M-22,-5 q9,10 18,0" fill="none" stroke="#e1dcc8" stroke-width="1.1"/><path d="M10,12 q10,5 20,0 l-3,-6 h-14Z" fill="#b98b5a" stroke="${IK}" stroke-width="1"/><path d="M20,6 v-12 l8,8Z" fill="#e8e1cc" stroke="${IK}" stroke-width=".9"/>`,
  ROAD: () => [0, 60, 120, 180, 240, 300].map(a => `<path d="M0,0 L${f1(Math.cos(a * Math.PI / 180) * 34.6)},${f1(Math.sin(a * Math.PI / 180) * 34.6)}" stroke="#4e3f2b" stroke-width="8" stroke-linecap="round"/><path d="M0,0 L${f1(Math.cos(a * Math.PI / 180) * 34.6)},${f1(Math.sin(a * Math.PI / 180) * 34.6)}" stroke="#c9b38a" stroke-width="5" stroke-linecap="round"/>`).join('') + `<circle r="8" fill="#c9b38a" stroke="#4e3f2b" stroke-width="1.6"/><circle r="4.4" fill="none" stroke="#7a6446" stroke-width="1.2" stroke-dasharray="2 2"/>`,
};
const TERR_EXTRA = {
  p: () => `<ellipse cx="-14" cy="12" rx="6" ry="3.6" fill="#4d6b3a"/><ellipse cx="18" cy="-10" rx="5" ry="3" fill="#4d6b3a"/>` + [[-4, -12], [12, 6], [-18, 2]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#f0d878"/>`).join(''),
  f: () => `<ellipse cx="0" cy="12" rx="22" ry="7" fill="#1f3326" opacity=".7"/>` + [[-14, 8, 1.25], [4, 10, 1.4], [16, 6, 1.15]].map(([x, y, k]) => `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-1.3" y="-1" width="2.6" height="6" fill="#4a3322"/><polygon points="0,-20 -7,-7 7,-7" fill="#274a35" stroke="${IK}" stroke-width=".8"/><polygon points="0,-13 -9,0 9,0" fill="#2f5a40" stroke="${IK}" stroke-width=".8"/></g>`).join(''),
  h: () => `<path d="M-30,10 Q-14,-6 2,10" fill="#7a6a42" stroke="${IK}" stroke-width=".9"/><path d="M-6,12 Q10,-10 30,12" fill="#8a7a50" stroke="${IK}" stroke-width=".9"/><path d="M-4,4 q2,-4 4,0 M12,2 q2,-4 4,0" stroke="#5a7a40" stroke-width="1.6" fill="none"/>`,
  m: () => `<path d="M-6,12 l12,-26 l12,26Z" fill="#7a828e" stroke="${IK}" stroke-width="1"/><path d="M0,-14 l-6,12 l5,-2.4 l4,3 l3,-4 l2.4,3.4Z" fill="#f4f6f8"/>`,
  c: () => [[-16, 0], [14, 6], [4, -10]].map(([x, y]) => `<path d="M${x},${y} v-8 M${x - 2},${y - 3} l2,-5 l2,5" stroke="#5d8a52" stroke-width="1.6" fill="none" stroke-linecap="round"/>`).join('') + [[-6, 6], [10, -2], [-22, 8]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="1.6" fill="#f0e6bd" opacity=".9"/>`).join(''),
  s: () => `<path d="M-30,6 q6,-6 12,0 t12,0 t12,0 t12,0" stroke="#4e86a6" stroke-width="1.6" fill="none" opacity=".8"/>`,
};
function hexArt(g, c, r, t, fog = false, det) {
  let d = hexArtBase(g, c, r, t, false);
  if (t !== '?' && (TERR_EXTRA[t] || det)) {
    const [x, y] = g.xy(c, r), u = g.S / 40;
    let extra = (TERR_EXTRA[t] ? TERR_EXTRA[t]() : '');
    if (det) {
      if (det.imp && IMP_ART[det.imp]) extra += IMP_ART[det.imp]();
      if (!det.imp) (det.feat || []).forEach(f => { if (FEAT_ART[f]) extra += FEAT_ART[f](); });
    }
    d += `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(u * 100) / 100})" pointer-events="none">${extra}</g>`;
    if (det && det.fishing) d += `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(u * 100) / 100})" pointer-events="none"><circle r="27" fill="none" stroke="#f0e6bd" stroke-width="1.6" stroke-dasharray="2 4"/><path d="M-27,0 H27 M0,-27 V27" stroke="#f0e6bd" stroke-width=".8" opacity=".5"/></g>`;
    if (det && det.owner) d += `<polygon points="${g.pts(c, r, .9)}" fill="none" stroke="${det.owner}" stroke-width="2.4" stroke-opacity=".95" pointer-events="none"/>`;
    const info = [TERR_INFO[t][0], ...(det && det.feat || []).map(f => FEAT_INFO[f][0]), ...(det && det.imp ? [IMP_INFO[det.imp][0]] : [])].join(' · ');
    d = `<g data-info="${esc(info)}"><title>${esc(info)}</title>${d}</g>`;
  }
  if (fog) d += `<polygon points="${g.pts(c, r)}" fill="#0a1114" opacity=".62"/>`;
  return d;
}

/* ===== Rede de estradas: cada hex com estrada liga a TODOS os vizinhos que tenham estrada ou cidade, nas 6 direções. Estrada em Costa vira passadiço; sobre Rio, ponte. ===== */
function roadLayer(g, roads, cityCells = [], det = {}) {
  const set = new Set(roads), cities = new Set(cityCells.map(c => c.join(',')));
  const linked = (c, r) => g.nb(c, r).filter(([x, y]) => set.has(x + ',' + y) || cities.has(x + ',' + y));
  const mid = (a, b) => { const [x1, y1] = g.xy(...a), [x2, y2] = g.xy(...b); return [(x1 + x2) / 2, (y1 + y2) / 2]; };
  const stroke = (d, coast) => coast
    ? `<path d="${d}" fill="none" stroke="#e9fbf8" stroke-opacity=".8" stroke-width="${f1(g.S * .22)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#6a4a2a" stroke-width="${f1(g.S * .15)}" stroke-linecap="butt"/><path d="${d}" fill="none" stroke="#c9a56e" stroke-width="${f1(g.S * .1)}" stroke-dasharray="${f1(g.S * .05)} ${f1(g.S * .07)}"/>`
    : `<path d="${d}" fill="none" stroke="#3f3322" stroke-opacity=".9" stroke-width="${f1(g.S * .2)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#c9b38a" stroke-width="${f1(g.S * .13)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#efe3bd" stroke-width="${f1(g.S * .02)}" stroke-dasharray="${f1(g.S * .06)} ${f1(g.S * .09)}"/>`;
  let out = '';
  const nodes = [...roads.map(k => k.split(',').map(Number)), ...cityCells];
  for (const [c, r] of nodes) {
    const t = g.t(c, r); if (!t || t === 's' || t === '?') continue;
    const isCity = cities.has(c + ',' + r), [x, y] = g.xy(c, r);
    const nbs = linked(c, r).filter(([a, b]) => !isCity || set.has(a + ',' + b));
    const mids = nbs.map(n => mid([c, r], n)), coast = t === 'c', river = (det[c + ',' + r] && (det[c + ',' + r].feat || []).includes('RIVER'));
    if (mids.length === 2 && !isCity) out += stroke(`M${f1(mids[0][0])},${f1(mids[0][1])} Q${f1(x)},${f1(y)} ${f1(mids[1][0])},${f1(mids[1][1])}`, coast);
    else mids.forEach(m => { out += stroke(`M${f1(m[0])},${f1(m[1])} L${f1(x)},${f1(y)}`, coast); });
    if (!isCity) {
      if (mids.length >= 3) out += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(g.S * .17)}" fill="#c9b38a" stroke="#3f3322" stroke-width="1.4"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(g.S * .09)}" fill="none" stroke="#7a6446" stroke-width="1" stroke-dasharray="2 2"/>`;
      else if (mids.length === 1) out += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(g.S * .1)}" fill="#c9b38a" stroke="#3f3322" stroke-width="1.2"/>`;
      else if (mids.length === 0) out += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(g.S * .22)}" ry="${f1(g.S * .12)}" fill="#c9b38a" stroke="#3f3322" stroke-width="1.2"/>`;
      if (river && mids.length) { const [m0] = mids; const ang = Math.atan2(m0[1] - y, m0[0] - x) * 180 / Math.PI; out += `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)})"><rect x="${f1(-g.S * .3)}" y="${f1(-g.S * .13)}" width="${f1(g.S * .6)}" height="${f1(g.S * .26)}" fill="#9a7d52" stroke="#2a1d10" stroke-width="1.2"/><path d="M${f1(-g.S * .3)},${f1(-g.S * .13)} h${f1(g.S * .6)} M${f1(-g.S * .3)},${f1(g.S * .13)} h${f1(g.S * .6)}" stroke="#3a2a18" stroke-width="2"/>${[-.2, -.07, .07, .2].map(k => `<path d="M${f1(g.S * k)},${f1(-g.S * .13)} v${f1(g.S * .26)}" stroke="#2a1d10" stroke-width=".9"/>`).join('')}</g>`; }
    }
  }
  return `<g class="roads" pointer-events="none">${out}</g>`;
}
