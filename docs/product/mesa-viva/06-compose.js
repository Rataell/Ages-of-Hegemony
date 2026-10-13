/* ===== Composição de um hexágono (porta de apps/web/app/alpha/hex-compose.ts): peça, cidade, acampamento e tropa são a ilustração prioritária; todo o resto vai
   para slots livres DENTRO do mesmo hex, sem sobreposição. Figura que não cabe vira "+N", nunca é encolhida. A ocupação vem das ENTIDADES, não de listas à mão. ===== */
const hexApothem = R => R * Math.sqrt(3) / 2;
const insideHex = (R, x, y) => { const a = hexApothem(R), ax = Math.abs(x), ay = Math.abs(y); return ax <= a + 1e-6 && ay <= R - ax / Math.sqrt(3) + 1e-6; };
const boxCorners = b => [[b.x - b.w / 2, b.y - b.h / 2], [b.x + b.w / 2, b.y - b.h / 2], [b.x - b.w / 2, b.y + b.h / 2], [b.x + b.w / 2, b.y + b.h / 2]];
const boxInsideHex = (R, b) => boxCorners(b).every(([x, y]) => insideHex(R, x, y));
const boxesOverlap = (a, b, gap = 0) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 + gap && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + gap;
const rowWidth = (n, px) => Math.max(0, n - 1) * px * 0.8 + px * 1.16;
const EMPTY_IN = { feature: 'none', own: 0, foreign: 0, threat: 0, ghost: 0, people: false, level: false, mood: false, worked: false, resourceSeals: 0, label: false, labelWidth: 44, cost: false, status: false };
function composeHex(R, inp) {
  inp = { ...EMPTY_IN, ...inp };
  const k = R / 52, items = [];
  const put = (id, kind, x, y, w, h, extra = {}) => items.push({ id, kind, x: x * k, y: y * k, scale: 1, px: 0, figs: 0, overflow: 0, box: { x: x * k, y: y * k, w: w * k, h: h * k }, ...extra });
  const hasF = inp.feature !== 'none', all = [];
  if (inp.own > 0) all.push({ id: 'own', classes: inp.own });
  if (inp.ghost) all.push({ id: 'ghost', classes: inp.ghost });
  if (inp.foreign > 0) all.push({ id: 'foreign', classes: inp.foreign });
  if (inp.threat > 0) all.push({ id: 'threat', classes: inp.threat });
  const wanted = ['threat', 'own', 'ghost', 'foreign'].filter(id => all.some(g => g.id === id)).slice(0, 2);
  const shown = all.filter(g => wanted.includes(g.id)), crowd = shown.length > 0;
  let labelShown = false;
  if (inp.feature === 'city') { const s = crowd ? 0.62 : 0.85; put('feature', 'feature', 0, crowd ? -10 : 0, 48 * s, 44 * s, { scale: s * k }); }
  if (inp.feature === 'camp') { const s = crowd && shown.length > 1 ? 0.7 : 1; put('feature', 'feature', 0, crowd ? -10 : -6, 40 * s, 28 * s, { scale: s * k }); }
  if (inp.people && !hasF) put('people', 'people', 0, crowd ? -28 : -6, 26, 20);
  shown.forEach((g, slot) => {
    const two = shown.length > 1, px = hasF ? (two ? 17 : 20) : (two ? 20 : 30), cap = two ? 2 : 3, slots = Math.min(cap, g.classes), overflow = g.classes > cap ? g.classes - (cap - 1) : 0, figs = overflow > 0 ? cap - 1 : slots;
    const x = two ? (slot === 0 ? -20.4 : 20.4) : 0, y = hasF ? 19 : inp.people ? 12 : 0;
    put(g.id, g.id, x, y, rowWidth(slots, px), px * 1.16, { px: px * k, figs, overflow });
  });
  if (inp.level && inp.feature === 'city') put('level', 'level', -30.5, -19, 20, 14);
  if (inp.mood && inp.feature === 'city') put('mood', 'mood', 30.5, -17, 20, 20);
  if (inp.worked) { if (inp.feature === 'city') put('worked', 'worked', 36, 2, 14, 14); else put('worked', 'worked', 33, -20, 14, 14); }
  const seals = hasF ? [[-36, 0], [-36, 18]] : [[-33, -20], [-32, 20]];
  for (let i = 0; i < Math.min(2, inp.resourceSeals); i++) put('resource-' + i, 'resource', seals[i][0], seals[i][1], 15, 15);
  if (inp.cost) put('cost', 'cost', 0, inp.status && !hasF ? 33 : -34, 36, 13);
  if (inp.status) { if (hasF) put('status', 'status', 29, -12, 14, 14); else put('status', 'status', 0, -30, 14, 14); }
  if (inp.label && !(crowd && hasF)) { labelShown = true; put('label', 'label', 0, 33, Math.min(inp.labelWidth, 44), 11); }
  return { items, labelShown, hidden: all.filter(g => !wanted.includes(g.id)).map(g => g.id) };
}
function composeProblems(R, layout, gap = 0) {
  const out = [], its = layout.items;
  for (const it of its) if (!boxInsideHex(R, it.box)) out.push(it.id + ' sai do hex');
  for (let i = 0; i < its.length; i++) for (let j = i + 1; j < its.length; j++) if (boxesOverlap(its[i].box, its[j].box, gap)) out.push(its[i].id + ' sobrepõe ' + its[j].id);
  return out;
}

/* ===== Modelo de entidades: a mesa é descrita por entidades; ocupação e layout saem delas. ===== */
const hexKey = e => e.hex;
function entitiesAt(ents, key) { return ents.filter(e => e.hex === key); }
function occupiedSet(ents) { return new Map(ents.filter(e => ['city', 'stack', 'threat', 'people'].includes(e.type)).map(e => [e.hex, ents.some(x => x.hex === e.hex && x.type === 'city') ? 'city' : ents.some(x => x.hex === e.hex && x.type === 'threat' && x.kind !== 'PIRATE' && x.status === 'CAMPED') ? 'camp' : 'busy'])); }
function sealKinds(det) { if (!det) return []; return det.imp ? [det.imp] : (det.feat || []); }
function inputFor(ents, key, det, extra = {}) {
  const here = entitiesAt(ents, key), city = here.find(e => e.type === 'city'), thr = here.find(e => e.type === 'threat'), own = here.find(e => e.type === 'stack' && e.own), foreign = here.find(e => e.type === 'stack' && !e.own), people = here.find(e => e.type === 'people');
  const camp = thr && thr.kind !== 'PIRATE' && thr.status === 'CAMPED';
  return { feature: city ? 'city' : camp ? 'camp' : 'none', own: own ? own.kinds.length : 0, foreign: foreign ? foreign.kinds.length : 0, threat: thr ? thr.comp.length : 0, people: !!people, level: !!city, mood: !!(city && city.mood !== undefined), worked: !!(city && city.worked) || !!(det && det.worked), resourceSeals: Math.min(2, sealKinds(det).length), label: !!city, labelWidth: city ? city.name.length * 5.4 : 0, status: !!(thr && (thr.state === 'WITHDRAWING' || thr.status === 'CAMPED' && (thr.fresh || thr.rest))), ...extra };
}
/* Desenha as entidades de um mapa nos slots calculados. `legs` (opcional) = trajetórias do rascunho de Mover: linhas ficam EMBAIXO das miniaturas. */
function drawEntities(g, ents, det = {}, o = {}) {
  const keys = [...new Set(ents.map(e => e.hex))], S = g.S, k = S / 52, out = { under: '', over: '', problems: [], layouts: {}, hits: [] };
  const legs = o.legs || [], ghostsAt = {};
  legs.forEach((leg, i) => { const d = leg.path[leg.path.length - 1].join(','); (ghostsAt[d] ||= []).push({ leg, i }); });
  for (const key of new Set([...keys, ...Object.keys(ghostsAt)])) {
    const [c, r] = key.split(',').map(Number), [cx, cy] = g.xy(c, r), here = entitiesAt(ents, key);
    const ghost = ghostsAt[key] ? new Set(ghostsAt[key][0].leg.kinds).size : 0, tag = !!ghostsAt[key];
    const inp = inputFor(ents, key, det[key], { ghost, cost: tag });
    const lay = composeHex(S, inp); out.layouts[key] = lay; out.problems.push(...composeProblems(S, lay).map(p => key + ': ' + p));
    const slot = id => lay.items.find(i => i.id === id), at = (it, dx = 0, dy = 0) => [cx + it.x + dx, cy + it.y + dy];
    const city = here.find(e => e.type === 'city'), thr = here.find(e => e.type === 'threat'), own = here.find(e => e.type === 'stack' && e.own), foreign = here.find(e => e.type === 'stack' && !e.own);
    const F = slot('feature');
    const hit = (e, it) => { if (e && e.id && it) { const [x, y] = at(it); out.hits.push({ id: e.id, x, y, name: e.name || e.id }); } };
    hit(city, F); hit(own, slot('own')); hit(foreign, slot('foreign')); hit(thr, slot('threat') || F);
    if (city && F) { const [x, y] = at(F); out.over += cityArt(x, y, city.level, city.color || '#60a3e9', city.name, city.mood, { R: S * F.scale / k * 0.74, seal: false, label: false, port: city.port, districts: city.districts, fort: city.fort }); }
    if (thr && thr.kind !== 'PIRATE' && thr.status === 'CAMPED' && F) { const [x, y] = at(F); out.over += `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(F.scale / k * 100) / 100})">${campArt(0, 0, thr.rest ? 'rest' : 'active')}</g>`; }
    const drawRow = (it, kinds, fig, color, ghosted) => { const slots = it.figs + (it.overflow > 0 ? 1 : 0), step = it.px * 0.8; let s = ''; kinds.slice(0, it.figs).forEach((kd, i) => { const [x, y] = at(it, (i - (slots - 1) / 2) * step, 0); s += fig(kd.kind, x, y, it.px, kd.n, color, ghosted); }); if (it.overflow > 0) { const [x, y] = at(it, (slots - 1 - (slots - 1) / 2) * step, 0); s += `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(k * 100) / 100})"><rect x="-8" y="-6.5" width="16" height="13" rx="6.5" fill="${INK}" stroke="${ghosted ? '#e6c173' : '#60a3e9'}" stroke-width="1.1"/><text y="3.2" text-anchor="middle" font-family="Source Sans 3,sans-serif" font-weight="700" font-size="8.5" fill="${LIGHT}">+${kinds.slice(it.figs).reduce((a, q) => a + q.n, 0)}</text></g>`; } return s; };
    const ownFig = (kind, x, y, px, n, color, ghost) => ownFigure(kind, x, y, px, n, color, { ghost });
    const thrFig = (kind, x, y, px, n) => threatFigure(kind, x, y, px, n);
    if (own && slot('own')) out.over += drawRow(slot('own'), own.kinds, ownFig, '#60a3e9', false);
    if (foreign && slot('foreign')) out.over += drawRow(slot('foreign'), foreign.kinds, ownFig, foreign.color || '#dd220e', false);
    if (thr && slot('threat')) out.over += drawRow(slot('threat'), thr.comp, thrFig, '#b4533c', false);
    if (ghostsAt[key] && slot('ghost')) out.over += drawRow(slot('ghost'), ghostsAt[key][0].leg.kinds.map(kd => ({ kind: kd, n: 0 })), (kd, x, y, px, n, color) => ownFigure(kd, x, y, px, 0, color, { ghost: true }), '#60a3e9', true);
    if (slot('level')) { const [x, y] = at(slot('level')); out.over += `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(k * 100) / 100})"><rect x="-10" y="-7" width="20" height="14" rx="7" fill="#0f181c" stroke="${city.color || '#60a3e9'}" stroke-width="1.2"/><text text-anchor="middle" y="3.2" font-family="Source Sans 3,sans-serif" font-weight="700" font-size="8.5" fill="${LIGHT}">${city.level}·${city.cap || 2}</text></g>`; }
    if (slot('mood')) { const [x, y] = at(slot('mood')); const px = 20 * k * 1.0; out.over += `<g transform="translate(${f1(x - px / 2)} ${f1(y - px / 2)})">${moodSeal(city.mood, px, true).replace('<svg ', '<svg ')}</g>`; }
    if (slot('worked')) { const [x, y] = at(slot('worked')); out.over += `<g transform="translate(${f1(x)} ${f1(y)})"><circle r="${f1(6.4 * k)}" fill="#0f181c" stroke="#e6c173" stroke-width="1.2"/><circle r="${f1(3.8 * k)}" fill="#e6c173"/></g>`; }
    if (slot('label') && city) { const [x, y] = at(slot('label')); out.over += `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(k * 100) / 100})"><rect x="${f1(-slot('label').box.w / k / 2)}" y="${f1(-slot('label').box.h / k / 2)}" width="${f1(slot('label').box.w / k)}" height="${f1(slot('label').box.h / k)}" rx="3" fill="#0f181c" stroke="${city.color || '#60a3e9'}" stroke-width="1"/><text text-anchor="middle" y="3" font-family="Source Sans 3,sans-serif" font-weight="700" font-size="8.2" fill="#e8dcc0" textLength="${f1(Math.min(slot('label').box.w / k - 6, city.name.length * 5.4))}" lengthAdjust="spacingAndGlyphs">${esc(city.name)}</text></g>`; }
    if (slot('status') && thr) { const [x, y] = at(slot('status')); out.over += `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(k * 100) / 100})"><circle r="7" fill="#0f181c" stroke="#e6b04c" stroke-width="1.3"/><path d="M-3 -4.2 h6 l-3 4.2 l3 4.2 h-6 l3 -4.2Z" fill="none" stroke="#e6b04c" stroke-width="1.2"/></g>`; }
    if (ghostsAt[key]) ghostsAt[key].forEach(({ leg, i }, j) => { const t = slot('cost'); const [x, y] = at(t, 0, j * 13 * k); out.over += `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(k * 100) / 100})"><rect x="-18" y="-6.5" width="36" height="13" rx="6.5" fill="#0f181c" stroke="${leg.color}" stroke-width="1.5"/><text text-anchor="middle" y="3.4" font-family="Source Sans 3,sans-serif" font-weight="700" font-size="9.5" fill="${LIGHT}">${leg.tag}</text></g>`; });
  }
  for (const leg of legs) { out.under += pathLine(g, leg.path.length ? [leg.from, ...leg.path] : [leg.from], leg.color, { w: 3, marker: 'arL' + leg.id, dots: false }); }
  return out;
}
