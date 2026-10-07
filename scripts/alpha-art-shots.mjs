// RC 1.2 table art sheets. Renders the pure SVG factories of apps/web/app/alpha/table-art.ts into standalone pages and
// screenshots them at 1280x720 into docs/evidence/rc12/art/ (no server needed).
//   node scripts/alpha-art-shots.mjs            -> every sheet
//   node scripts/alpha-art-shots.mjs cities     -> only sheets whose name contains "cities"
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import ts from 'typescript';
import { chromium } from 'playwright';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, 'docs', 'evidence', 'rc12', 'art');
const TMP = join(tmpdir(), `aoh-art-${process.pid}`);
mkdirSync(OUT, { recursive: true }); mkdirSync(TMP, { recursive: true });
const source = readFileSync(join(ROOT, 'apps', 'web', 'app', 'alpha', 'table-art.ts'), 'utf8');
writeFileSync(join(TMP, 'table-art.mjs'), ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const A = await import(pathToFileURL(join(TMP, 'table-art.mjs')).href);

const CORE = [
  ['valgard', 'Helênicos', { emblem: 'aspis', seal: 'HEXAGON', banner: 'SHIELD', border: 'DOUBLE' }],
  ['nymara', 'Egípcios', { emblem: 'semtauy', seal: 'DIAMOND', banner: 'POLE', border: 'DOTTED' }],
  ['meridia', 'Mesopotâmicos', { emblem: 'estrela8', seal: 'CIRCLE', banner: 'PANEL', border: 'BAND' }],
  ['dravik', 'Persas', { emblem: 'aguia', seal: 'HEXAGON', banner: 'EAGLE', border: 'DASHED' }],
  ['solenne', 'Israel e Judá', { emblem: 'leao', seal: 'HEXAGON', banner: 'DEGEL', border: 'SOLID' }],
  ['kor', 'Romanos', { emblem: 'aquila', seal: 'DIAMOND', banner: 'VEXILLUM', border: 'SOLID' }],
  ['thalos', 'Nórdicos', { emblem: 'corvo', seal: 'CIRCLE', banner: 'RAVEN', border: 'DASH_DOT' }],
  ['orinth', 'Chineses', { emblem: 'ding', seal: 'HEXAGON', banner: 'STREAMER', border: 'DOUBLE' }],
  ['saren', 'Índia Antiga', { emblem: 'pavao', seal: 'DIAMOND', banner: 'LONG', border: 'DOTTED' }],
  ['aurelia', 'Incas', { emblem: 'mascaipacha', seal: 'CIRCLE', banner: 'SQUARE', border: 'BAND' }],
];
const T = { plains: '#71844f', forest: '#3f6148', hills: '#857c68', sea: '#264a5c', coast: '#3f6d7c', unknown: '#37413f' };
const page = (body, extra = '') => `<!doctype html><meta charset="utf-8"><style>
body{margin:0;width:1280px;height:720px;overflow:hidden;background:#0b1114;color:#eee8da;font:13px/1.35 'Source Sans 3',system-ui,sans-serif}
h1{font:600 17px Georgia,serif;letter-spacing:.06em;margin:10px 16px 4px;color:#e8dcc0}h1 small{font:12px system-ui;color:#8fa0a0;letter-spacing:0;margin-left:10px}
.lbl{font-size:11px;color:#b3c0bd;text-align:center}.row{display:flex;gap:10px;padding:0 16px;align-items:flex-end}.cell{display:grid;justify-items:center;gap:2px}
${extra}</style>${body}`;
const svg = (w, h, vb, inner, attrs = '') => `<svg width="${w}" height="${h}" viewBox="${vb}" ${attrs}>${inner}</svg>`;
const hex = (fill, r = 52, x = 0, y = 0) => `<path d="${A.hexPath(r, x, y)}" fill="${fill}" stroke="#0b1114" stroke-width="1.5"/>`;
const deut = `<svg width="0" height="0" style="position:absolute"><filter id="deut" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="0.367 0.861 -0.228 0 0  0.280 0.673 0.047 0 0  -0.012 0.043 0.969 0 0  0 0 0 1 0"/></filter></svg>`;

const sheets = {};
/* 1. Six player colors + seals, normal / grayscale / deuteranopia */
sheets['colors-six-players'] = () => {
  const strip = (label, style) => `<div style="${style}"><div class="lbl" style="text-align:left;margin:4px 16px">${label}</div><div class="row" style="gap:14px">${A.SEAT_COLORS.map((c, i) => {
    const mark = CORE[i * 2 % 10][2];
    return `<div class="cell">${svg(186, 132, '-96 -64 192 132', `${hex(T.plains, 52, -46, 0)}<path d="${A.hexPath(47, -46, 0)}" fill="${c}" fill-opacity=".12"/><path d="${A.hexPath(52, -46, 0)}" fill="none" stroke="${c}" stroke-width="3.5"/><g transform="translate(-46 2)">${A.pieceArt('INFANTRY', c, 40, 3, false, i)}</g>${hex(T.plains, 52, 46, 0)}<g transform="translate(46 4)">${A.cityPieceArt({ level: 3, color: c, seed: 11 + i, civilization: CORE[i * 2 % 10][0], lod: 'mesa', mark, seat: i }, 50)}</g>`)}
      <div style="display:flex;gap:6px;align-items:center;padding:3px 10px;border-radius:99px;border:1px solid ${c};background:#121b20">${A.seatSealSvg(i, c, 16)}<b style="font:600 12px Georgia">${A.SEAT_NAMES[i]}</b></div></div>`;
  }).join('')}</div></div>`;
  return page(`${deut}<h1>Seis cores de jogador + selo do assento<small>cor = jogador · selo: ponto, barra, divisa, losango, anel, cruz</small></h1>${strip('Normal', '')}${strip('Escala de cinza', 'filter:grayscale(1)')}${strip('Deuteranopia (simulação)', 'filter:url(#deut)')}`, '.row svg{display:block}');
};
/* 2. Ten standards and ten emblems at 22 / 40 / 76 px */
sheets['banners-emblems'] = () => {
  const c = A.SEAT_COLORS;
  const col = (i) => { const [, name, mark] = CORE[i], color = c[i % 6];
    return `<div class="cell" style="width:118px">
      <div style="display:flex;gap:8px;align-items:flex-end;height:92px">${svg(18, 26, '-9 -24 18 26', A.bannerArt(mark, color, 22))}${svg(32, 46, '-16 -44 32 46', A.bannerArt(mark, color, 40))}${svg(56, 92, '-28 -88 56 92', A.bannerArt(mark, color, 76))}</div>
      <div style="display:flex;gap:8px;align-items:center">${svg(22, 22, '-12 -12 24 24', A.emblemArt(mark.emblem, 0, 0, 0.8, color, 2))}${svg(40, 40, '-20 -20 40 40', A.sealArt(mark, color, 15))}${svg(22, 22, '-12 -12 24 24', A.emblemArt(mark.emblem, 0, 0, 0.8, '#e8dcc0', 2))}</div>
      <div class="lbl"><b>${name}</b><br>${mark.banner} · ${mark.emblem}</div></div>`; };
  const zoom = CORE.map(([, , mark], i) => svg(110, 110, '-14 -46 28 50', A.bannerArt(mark, c[i % 6], 40))).join('');
  const emb = CORE.map(([, , mark]) => svg(110, 110, '-13 -13 26 26', A.emblemArt(mark.emblem, 0, 0, 1, '#e8dcc0', 1.6))).join('');
  return page(`<h1>Estandartes e emblemas Core 10<small>tamanho real: estandarte 22 px (mapa) · 40 px (roster) · 76 px (Pátria) · emblema 22 px · selo 40 px</small></h1><div class="row" style="gap:6px;align-items:flex-start">${CORE.map((_, i) => col(i)).join('')}</div><h1>Ampliados (inspeção)</h1><div class="row" style="gap:12px">${zoom}</div><div class="row" style="gap:12px">${emb}</div>`);
};
/* 3. Cities: each civilization at N1/N3/N5/N7, Mesa (≈42 px hex) and Focar (≈100 px hex) */
const citySheet = (from, title) => () => {
  const cell = (civ, mark, i, level, lod) => svg(124, 128, '-58 -64 116 122', `${hex(T.plains)}${A.cityPieceArt({ level, color: A.SEAT_COLORS[(from + i) % 6], seed: 5 + level, civilization: civ, lod, mark, seat: (from + i) % 6, fortification: level >= 5 ? { level: level === 7 ? 'BASTION' : 'STONE_WALL', state: 'INTACT' } : null }, 50)}`);
  const rows = CORE.slice(from, from + 5).map(([civ, name, mark], i) => `<div class="row" style="gap:2px;align-items:center"><div class="lbl" style="width:80px;text-align:right;margin-right:6px">${name}</div>${[1, 3, 5, 7].map(level => cell(civ, mark, i, level, 'mesa')).join('')}<div style="width:18px"></div>${[1, 3, 5, 7].map(level => cell(civ, mark, i, level, 'focus')).join('')}</div>`).join('');
  return page(`<h1>${title}<small>esquerda: Mesa (ampliada 2,5×; ≈ 42 px na mesa) · direita: Focar · N1 · N3 · N5 · N7 (N5 Muralha, N7 Bastião)</small></h1>${rows}`);
};
sheets['cities-a'] = citySheet(0, 'Cultura material · Helênicos a Israel e Judá');
sheets['cities-b'] = citySheet(5, 'Cultura material · Romanos a Incas');
// Development zoom (not part of the evidence set): node scripts/alpha-art-shots.mjs zoom-<from>-<lod>
for (const from of [0, 2, 4, 6, 8]) for (const lod of ['focus', 'mesa']) sheets[`zoom-${from}-${lod}`] = () => page(CORE.slice(from, from + 2).map(([civ, name, mark], i) => `<div class="row" style="gap:0">${[1, 3, 5, 7].map(level => svg(300, 316, '-58 -64 116 122', `${hex(T.plains)}${A.cityPieceArt({ level, color: A.SEAT_COLORS[(from + i) % 6], seed: 5 + level, civilization: civ, lod, mark, seat: (from + i) % 6, fortification: level >= 5 ? { level: level === 7 ? 'BASTION' : 'STONE_WALL', state: 'INTACT' } : null }, 50)}`)).join('')}<div class="lbl">${name}</div></div>`).join(''));
sheets['cities-mesa-1to1'] = () => {
  const cells = CORE.map(([civ, name, mark], i) => `<div class="cell">${svg(240, 132, '-120 -66 240 132', [-1, 1].map(s => `<g transform="translate(${s * 56} 0)">${hex(T.plains)}${A.cityPieceArt({ level: s < 0 ? 3 : 6, color: A.SEAT_COLORS[i % 6], seed: 9 + i, civilization: civ, lod: 'mesa', mark, seat: i % 6, fortification: s > 0 ? { level: 'FORTRESS', state: 'INTACT' } : null }, 50)}</g>`).join(''), 'style="width:96px;height:53px"')}<div class="lbl">${name}</div></div>`).join('');
  const big = CORE.map(([civ, name, mark], i) => `<div class="cell">${svg(112, 118, '-58 -64 116 122', `${hex(T.plains)}${A.cityPieceArt({ level: 6, color: A.SEAT_COLORS[i % 6], seed: 9 + i, civilization: civ, lod: 'focus', mark, seat: i % 6, fortification: { level: 'FORTRESS', state: 'INTACT' } }, 50)}`)}<div class="lbl">${name} · N6</div></div>`).join('');
  return page(`<h1>Mesa 1:1 (hex ≈ 42 px) · N3 e N6 com Fortaleza<small>a mesma peça em Focar abaixo</small></h1><div class="row" style="flex-wrap:wrap;gap:10px 18px">${cells}</div><h1>Focar · N6</h1><div class="row" style="flex-wrap:wrap;gap:4px 10px">${big}</div>`);
};
/* 4. Fortification variants */
sheets['fortifications'] = () => {
  const lv = ['PALISADE', 'STONE_WALL', 'FORTRESS', 'BASTION', 'CITADEL'];
  const rows = [['valgard', 'Helênicos'], ['nymara', 'Egípcios'], ['thalos', 'Nórdicos'], ['orinth', 'Chineses'], ['aurelia', 'Incas']].map(([civ, name], i) => `<div class="row" style="gap:4px;align-items:center"><div class="lbl" style="width:84px;text-align:right">${name}</div>${[...lv.map(l => [l, 'INTACT']), ['FORTRESS', 'DAMAGED'], ['FORTRESS', 'BREACHED']].map(([l, s]) => svg(164, 134, '-52 -55 104 106', `${hex(T.plains)}${A.cityPieceArt({ level: 4, color: A.SEAT_COLORS[i], seed: 21, civilization: civ, lod: 'focus', fortification: { level: l, state: s } }, 50)}`)).join('')}</div>`).join('');
  return page(`<h1>Fortificação por cultura<small>Paliçada · Muralha · Fortaleza · Bastião · Cidadela · Danificada · Rompida</small></h1>${rows}`);
};
/* 5. Port: coastal city with harbor toward the water hex, per culture */
sheets['ports'] = () => {
  const cells = CORE.map(([civ, name, mark], i) => {
    const ang = [0, -Math.PI / 3, Math.PI / 3, Math.PI * 2 / 3, Math.PI][i % 5] ?? 0, wx = Math.cos(ang) * 97, wy = Math.sin(ang) * 97;
    return `<div class="cell">${svg(236, 290, `${wx / 2 - 100} ${wy / 2 - 123} 200 246`, `${hex(T.sea, 52, wx, wy)}<path d="M${wx - 30},${wy}q8,-5 16,0t16,0" stroke="#5d8a9c" fill="none"/>${hex(T.coast, 52, -wx, -wy)}${hex(T.plains)}${A.cityPieceArt({ level: 5, color: A.SEAT_COLORS[i % 6], seed: 3 + i, civilization: civ, lod: 'focus', mark, seat: i % 6, harbor: ang, fortification: { level: 'STONE_WALL', state: 'INTACT' } }, 50)}${A.harborArt(civ, ang, 50, 'focus')}`)}<div class="lbl">${name}</div></div>`;
  }).join('');
  return page(`<h1>Porto: a única construção que cruza a aresta<small>cais na aresta, píer até a água navegável, dois cabeços de bronze, barco da cultura; a muralha abre no mar</small></h1><div class="row" style="flex-wrap:wrap;gap:0 4px">${cells}</div>`);
};
/* 6. Twelve Obras de Legado, plus progress */
sheets['works'] = () => {
  const cells = A.LEGACY_WORK_IDS.map(id => `<div class="cell" style="width:150px">${svg(120, 120, '-50 -54 100 100', A.workArt(id, 48, 3))}<div style="display:flex;gap:4px">${[1, 2].map(p => svg(44, 44, '-50 -54 100 100', A.workArt(id, 48, p))).join('')}${svg(44, 44, '-58 -64 116 122', hex(T.plains) + A.cityPieceArt({ level: 4, color: A.SEAT_COLORS[0], seed: 4, civilization: 'valgard', lod: 'focus', work: { workId: id, steps: 3, complete: true } }, 50))}</div><div class="lbl">${id}</div></div>`).join('');
  return page(`<h1>12 Obras de Legado<small>peça completa · passo 1 (andaime) · passo 2 · na cidade</small></h1><div class="row" style="flex-wrap:wrap;gap:6px 6px">${cells}</div>`);
};
/* 6b. Detalhe: cityDetailArt for the inspector (the Details panel calls it) */
sheets['city-detail'] = () => page(`<h1>Detalhe · cityDetailArt (painel da cidade)<small>a mesma miniatura em escala de inspeção, com Porto, Obra e muralha</small></h1><div class="row" style="flex-wrap:wrap;gap:8px">${CORE.map(([civ, name, mark], i) => `<div class="cell">${A.cityDetailArt({ level: [6, 5, 7, 6, 5][i % 5], color: A.SEAT_COLORS[i % 6], seed: 30 + i, civilization: civ, mark, seat: i % 6, harbor: i % 2 === 0, fortification: { level: 'FORTRESS', state: 'INTACT' }, work: i % 3 === 0 ? { workId: A.LEGACY_WORK_IDS[i], steps: 3, complete: true } : null, px: 228 })}<div class="lbl">${name}</div></div>`).join('')}</div>`);
/* 7. Discovery markers */
sheets['discoveries'] = () => {
  const kinds = [['RUIN', 'Vestígio'], ['DEPOSIT', 'Jazida'], ['PASSAGE', 'Passagem'], ['ANCHORAGE', 'Ancoradouro'], ['CAMP', 'Acampamento']];
  const big = kinds.map(([k, n]) => `<div class="cell">${svg(200, 200, '-50 -50 100 100', A.discoveryArt(k, 46))}<div class="lbl"><b>${n}</b> · painel</div></div>`).join('');
  const map = kinds.map(([k, n], i) => `<div class="cell">${svg(240, 200, '-120 -100 240 200', `${hex([T.hills, T.hills, T.forest, T.coast, T.plains][i], 52, -46, -42)}${hex(T.plains, 52, 46, -42)}${hex(T.plains, 52, 0, 42)}${hex(T.forest, 52, -92, 42)}${hex(T.hills, 52, 92, 42)}<g transform="translate(14 -26)" opacity=".92">${A.discoveryArt(k, 15)}</g>`, 'style="width:120px;height:100px"')}${svg(240, 200, '-120 -100 240 200', `${hex([T.hills, T.hills, T.forest, T.coast, T.plains][i], 52, -46, -42)}${hex(T.plains, 52, 46, -42)}${hex(T.plains, 52, 0, 42)}<g transform="translate(14 -26)">${A.discoveryArt(k, 18)}</g>`)}<div class="lbl">${n} · Mesa (pequeno) · Focar</div></div>`).join('');
  return page(`<h1>Marcos de Descoberta<small>Perigo e Terra comum não deixam marco</small></h1><div class="row">${big}</div><div class="row" style="gap:6px">${map}</div>`);
};
/* 8. Closed Region, orientation mark and the physical reveal, rendered with the product's own CSS (tokens.css, style.css, alpha.css). */
const CSS = ['apps/web/app/design/tokens.css', 'apps/web/app/style.css', 'apps/web/app/alpha/alpha.css'].map(f => readFileSync(join(ROOT, f), 'utf8')).join('\n');
const POINTS = A.hexPoints(52).map(p => p.map(v => v.toFixed(1)).join(',')).join(' '), INNER = A.hexPoints(47).map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
const pos = (q, r) => ({ x: 80 + 56 * Math.sqrt(3) * (q + r / 2), y: 80 + 84 * r });
const REGION = [[0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [-1, 2], [0, 2]].map(([q, r]) => pos(q + 1, r));
const TERR = ['PLAINS', 'FOREST', 'HILLS', 'PLAINS', 'COAST', 'SEA', 'MOUNTAINS'];
const outline = (centres, r = 56) => { const key = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`, edges = new Map(), cnt = new Map(); for (const c of centres) { const k = A.hexPoints(r, c.x, c.y); for (let i = 0; i < 6; i++) { const a = k[i], b = k[(i + 1) % 6], id = [key(...a), key(...b)].sort().join('|'); edges.set(id, [...a, ...b]); cnt.set(id, (cnt.get(id) ?? 0) + 1); } } return [...edges].filter(([id]) => cnt.get(id) === 1).map(([, e]) => `M${e[0].toFixed(1)},${e[1].toFixed(1)}L${e[2].toFixed(1)},${e[3].toFixed(1)}`).join(''); };
const backBody = (centres, oriented) => { const cx = centres.reduce((n, c) => n + c.x, 0) / centres.length, cy = centres.reduce((n, c) => n + c.y, 0) / centres.length; return `${centres.map(c => `<polygon class="region-back-hex" points="${POINTS}" transform="translate(${c.x} ${c.y}) scale(1.08)"/>`).join('')}${centres.map(c => `<polygon class="region-back-inset" points="${INNER}" transform="translate(${c.x} ${c.y}) scale(.62)"/>`).join('')}<path class="region-back-edge" d="${outline(centres)}"/>${oriented === null ? `<g class="region-back-mark" transform="translate(${cx} ${cy})"><circle r="15"/><path d="M0 -11L3 0L0 11L-3 0Z M-11 0L0 -3L11 0L0 3Z"/></g>` : `<g transform="translate(${cx} ${cy}) scale(1.4)">${A.orientationArt(oriented, 40)}</g>`}`; };
const revealPage = () => `<!doctype html><meta charset="utf-8"><style>${CSS}\nbody{margin:0;background:#0b1114;width:1280px;height:720px;overflow:hidden}svg{display:block}#m{width:420px!important;height:420px!important;max-width:none!important;max-height:none!important;position:static!important;margin:0!important;padding:0!important;border:0!important;background:#0b1114!important}</style>
<svg id="m" class="world-map art-mode has-board zoom-near" width="420" height="420" viewBox="40 0 330 330">
<g id="back" class="region-back">${backBody(REGION, null)}</g>
<g id="ghost"></g>
<g id="tiles">${REGION.map((c, i) => `<g class="hex terrain-${TERR[i]} owner-0 reveal-hidden" transform="translate(${c.x} ${c.y})" style="--hx:${c.x}px;--hy:${c.y}px"><polygon class="hex-base" points="${POINTS}"/><polygon class="hex-texture" points="${INNER}"/><polygon class="hex-border" points="${POINTS}"/></g>`).join('')}</g></svg>
<script>
window.phase = (name, rotation) => {
  const back = document.getElementById('back'), ghost = document.getElementById('ghost'), tiles = [...document.querySelectorAll('#tiles .hex')];
  if (name === 'closed') { back.style.display = ''; ghost.innerHTML = ''; tiles.forEach(t => t.setAttribute('class', t.getAttribute('class').replace(/ reveal-(hidden|land)/, '') + ' reveal-hidden')); return; }
  if (name === 'oriented') { back.innerHTML = ${JSON.stringify(backBody(REGION, 2))}; back.setAttribute('class', 'region-back is-oriented'); return; }
  back.style.display = 'none';
  if (['lift', 'turn', 'flip'].includes(name)) {
    if (!ghost.firstChild) ghost.innerHTML = '<g class="region-reveal" style="--turn:' + rotation + 'deg"><g class="region-reveal-shadow">' + ${JSON.stringify(REGION.map(c => `<polygon points="${POINTS}" transform="translate(${c.x + 6} ${c.y + 12}) scale(1.08)"/>`).join(''))} + '</g><g class="region-reveal-piece">' + ${JSON.stringify(backBody(REGION, 2))} + '</g></g>';
    ghost.firstChild.setAttribute('class', 'region-reveal phase-' + name); return;
  }
  ghost.innerHTML = ''; tiles.forEach(t => t.setAttribute('class', t.getAttribute('class').replace(/ reveal-(hidden|land)/, '') + (name === 'land' ? ' reveal-land' : '')));
};
</script>`;
async function revealFrames(browserPage) {
  const file = join(TMP, 'reveal.html'); writeFileSync(file, revealPage());
  await browserPage.goto(pathToFileURL(file).href);
  const clip = { x: 0, y: 0, width: 420, height: 420 }, frames = [];
  const grab = async name => { const f = join(TMP, `rv-${name}.png`); await browserPage.screenshot({ path: f, clip }); frames.push([name, f]); };
  await browserPage.evaluate(() => window.phase('closed')); await browserPage.waitForTimeout(80); await grab('fechada');
  await browserPage.evaluate(() => window.phase('oriented')); await browserPage.waitForTimeout(80); await grab('orientacao');
  // The map's own schedule: lift 0 ms · turn 220 ms · flip 520 ms · land 760 ms · done 1150 ms.
  await browserPage.evaluate(() => window.phase('lift', -24)); await browserPage.waitForTimeout(160); await grab('1-destaque');
  await browserPage.evaluate(() => window.phase('turn', -24)); await browserPage.waitForTimeout(260); await grab('2-gira');
  await browserPage.evaluate(() => window.phase('flip', -24)); await browserPage.waitForTimeout(150); await grab('3-vira');
  await browserPage.evaluate(() => window.phase('land')); await browserPage.waitForTimeout(110); await grab('4-terreno');
  await browserPage.waitForTimeout(400); await grab('5-assentada');
  const titles = { fechada: 'Região fechada', orientacao: 'Orientação escolhida (abstrata)', '1-destaque': '1 · destaque (0–0,22 s)', '2-gira': '2 · ergue e gira (0,22–0,52 s)', '3-vira': '3 · vira de lado (0,52–0,76 s)', '4-terreno': '4 · terreno pousa (0,76–1,15 s)', '5-assentada': '5 · assentada' };
  return page(`<h1>Região fechada · orientação · virada física<small>quadros reais do CSS da mesa; a marca de orientação é abstrata e nenhum terreno aparece antes da virada (≈ 1,15 s)</small></h1><div class="row" style="flex-wrap:wrap;gap:6px 10px">${frames.map(([n, f]) => `<div class="cell"><img src="${pathToFileURL(f).href}" width="292" height="292" style="border-radius:8px"><div class="lbl">${titles[n]}</div></div>`).join('')}</div>`);
}
sheets['region-reveal'] = revealFrames;

const only = process.argv[2];
const browser = await chromium.launch();
const pageObj = await browser.newPage({ viewport: { width: 1280, height: 720 } });
for (const [name, build] of Object.entries(sheets)) {
  if (only ? !name.includes(only) : name.startsWith('zoom-')) continue;
  const html = build.length ? await build(pageObj) : build();
  const file = join(TMP, `${name}.html`); writeFileSync(file, html);
  await pageObj.goto(pathToFileURL(file).href); await pageObj.waitForTimeout(150);
  const target = name.startsWith('zoom-') ? join(process.env.AOH_ART_TMP ?? TMP, `${name}.png`) : join(OUT, `${name}.png`);
  await pageObj.screenshot({ path: target });
  console.log('wrote', target.replace(ROOT + '/', ''));
}
await browser.close();
