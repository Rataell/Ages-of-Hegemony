/* global window */
/* AoH Experience V2.2 — shared table art (concept, not product code).
 * Every function returns an SVG fragment string centered on (0,0), so the atlas,
 * the Mesa demo and the playable prototype draw the same pieces.
 * Rule: shape identifies, seat color only says who owns it. */
(function (G) {
  'use strict';
  const INK = '#0b1114', LIGHT = '#f4ecd8';
  const f1 = n => +n.toFixed(1);

  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function mix(a, b, t) {
    const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  /* pointy-top hexagon, circumradius r */
  function hexPts(r, cx = 0, cy = 0) { const p = []; for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i - 30); p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return p; }
  function hexD(r, cx = 0, cy = 0) { return hexPts(r, cx, cy).map((p, i) => (i ? 'L' : 'M') + f1(p[0]) + ',' + f1(p[1])).join('') + 'Z'; }
  function inHex(x, y, r) { return Math.abs(x) <= r * 0.866 && Math.abs(y) + Math.abs(x) / 1.732 <= r; }

  /* ---------------------------------------------------------------- cities */
  const LEVELS = ['Posto', 'Aldeia', 'Vila', 'Cidade', 'Grande Cidade', 'Metrópole', 'Metrópole Imperial'];
  const ROOFS = ['#cdbb98', '#bfa883', '#d8c8a6', '#b69c78', '#c7b08a'];

  /* Top-down city that fills its hex. variant 'A' = flat plan, 'B' = plan with light depth (shadows, ridges).
   * Growth reads through the urban plan: buildings, streets, civic center, second ring, citadel. */
  function city(level, r, o = {}) {
    const l = Math.max(1, Math.min(7, level)), col = o.col || '#6ca7d9', B = o.variant === 'B', R = rng((o.seed || 7) * 131 + l * 17);
    const ext = r * [0.36, 0.5, 0.62, 0.74, 0.84, 0.9, 0.94][l - 1];
    const sw = r * (l >= 4 ? 0.07 : 0.055), street = l >= 4 ? '#8d8371' : '#75654c';
    const ground = l >= 4 ? '#3d3a31' : '#3a3628';
    let g = `<g class="city">`;
    g += `<path d="${hexD(r * 0.985)}" fill="${ground}"/>`;
    if (l <= 3) g += `<circle r="${f1(ext * 1.05)}" fill="#4a4433" opacity=".9"/>`;
    // streets: list of segments [x1,y1,x2,y2]
    const segs = [];
    const spoke = (a, len) => segs.push([0, 0, f1(Math.cos(a) * len), f1(Math.sin(a) * len)]);
    if (l === 1) spoke(Math.PI * 0.62, r * 0.9);
    if (l === 2) { spoke(Math.PI * 0.62, r); spoke(-Math.PI * 0.38, r * 0.7); }
    if (l >= 3) { segs.push([-r, 0, r, 0]); segs.push([0, -r, 0, r]); }
    if (l >= 4) { for (const k of [-1, 1]) { segs.push([-r, k * ext * 0.5, r, k * ext * 0.5]); segs.push([k * ext * 0.5, -r, k * ext * 0.5, r]); } }
    if (l >= 5) { spoke(Math.PI / 4, r); spoke(Math.PI * 5 / 4, r); }
    if (l >= 7) { spoke(-Math.PI / 4, r); spoke(Math.PI * 3 / 4, r); }
    const clip = `cl${l}${o.variant || 'A'}${(o.seed || 7)}${Math.round(r)}`;
    g += `<clipPath id="${clip}"><path d="${hexD(r * 0.97)}"/></clipPath><g clip-path="url(#${clip})">`;
    if (l >= 6) g += `<circle r="${f1(ext * 0.56)}" fill="none" stroke="${street}" stroke-width="${f1(sw * 1.25)}"/>`;
    for (const s of segs) g += `<line x1="${s[0]}" y1="${s[1]}" x2="${s[2]}" y2="${s[3]}" stroke="${street}" stroke-width="${f1(sw)}" stroke-linecap="round"/>`;
    // civic center
    const plaza = r * [0.08, 0.12, 0.14, 0.16, 0.19, 0.21, 0.27][l - 1];
    const nearSeg = (x, y, pad) => segs.some(([x1, y1, x2, y2]) => { const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy, t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / L2)); return Math.hypot(x - x1 - t * dx, y - y1 - t * dy) < pad; })
      || (l >= 6 && Math.abs(Math.hypot(x, y) - ext * 0.56) < pad);
    const blds = [];
    const n = [3, 7, 14, 30, 48, 70, 92][l - 1], bs = r * [0.13, 0.12, 0.105, 0.09, 0.08, 0.072, 0.066][l - 1];
    let tries = 0;
    while (blds.length < n && tries < n * 60) {
      tries++;
      const a = R() * Math.PI * 2, d = plaza * 1.25 + Math.sqrt(R()) * (ext - plaza * 1.25);
      const x = Math.cos(a) * d, y = Math.sin(a) * d;
      const w = bs * (0.8 + R() * 0.7), h = bs * (0.65 + R() * 0.5);
      if (!inHex(x, y, r * 0.86)) continue;
      if (nearSeg(x, y, sw * 0.6 + Math.max(w, h) * 0.55)) continue;
      if (l >= 7 && Math.abs(x) < plaza * 1.15 && Math.abs(y) < plaza * 1.15) continue;
      if (blds.some(b => Math.abs(b.x - x) < (b.w + w) / 2 + bs * 0.18 && Math.abs(b.y - y) < (b.h + h) / 2 + bs * 0.18)) continue;
      blds.push({ x, y, w, h, rot: l <= 3 ? (R() - 0.5) * 50 : 0, c: ROOFS[Math.floor(R() * ROOFS.length)] });
    }
    // gardens from the Metrópole on
    if (l >= 6) for (const a of [0.9, 2.6, 4.3, 5.7]) { const gx = Math.cos(a) * ext * 0.74, gy = Math.sin(a) * ext * 0.74; if (inHex(gx, gy, r * 0.8)) g += `<circle cx="${f1(gx)}" cy="${f1(gy)}" r="${f1(bs * 0.7)}" fill="#55704a"/>`; }
    const rect = (b, fill, dx = 0, dy = 0) => `<rect x="${f1(b.x - b.w / 2 + dx)}" y="${f1(b.y - b.h / 2 + dy)}" width="${f1(b.w)}" height="${f1(b.h)}" rx="${f1(Math.min(b.w, b.h) * 0.12)}" fill="${fill}"${b.rot ? ` transform="rotate(${f1(b.rot)} ${f1(b.x)} ${f1(b.y)})"` : ''}/>`;
    if (B) for (const b of blds) g += rect(b, '#000000a0', bs * 0.32, bs * 0.42);
    for (const b of blds) {
      g += rect(b, b.c);
      if (B || o.detail) { const hor = b.w >= b.h; g += `<line x1="${f1(hor ? b.x - b.w / 2 : b.x)}" y1="${f1(hor ? b.y : b.y - b.h / 2)}" x2="${f1(hor ? b.x + b.w / 2 : b.x)}" y2="${f1(hor ? b.y : b.y + b.h / 2)}" stroke="#00000045" stroke-width="${f1(Math.max(0.6, bs * 0.08))}"${b.rot ? ` transform="rotate(${f1(b.rot)} ${f1(b.x)} ${f1(b.y)})"` : ''}/>`; }
      if (B) g += rect({ ...b, w: b.w, h: b.h / 2, y: b.y - b.h / 4 }, '#ffffff30');
    }
    // plaza and civic building (seat color marks ownership inside the city)
    if (l >= 2) g += `<rect x="${f1(-plaza)}" y="${f1(-plaza)}" width="${f1(plaza * 2)}" height="${f1(plaza * 2)}" fill="#a39780" rx="${f1(plaza * 0.15)}"/>`;
    if (l < 7) {
      const cs = plaza * (l >= 2 ? 0.95 : 1.6);
      if (B) g += `<rect x="${f1(-cs / 2 + bs * 0.25)}" y="${f1(-cs / 2 + bs * 0.35)}" width="${f1(cs)}" height="${f1(cs)}" fill="#00000075"/>`;
      g += `<rect x="${f1(-cs / 2)}" y="${f1(-cs / 2)}" width="${f1(cs)}" height="${f1(cs)}" fill="${col}" stroke="${INK}" stroke-width="${f1(Math.max(0.8, r * 0.02))}"/>`;
      if (l >= 6) g += `<circle r="${f1(cs * 0.32)}" fill="${mix(col, '#ffffff', 0.45)}" stroke="${INK}" stroke-width="${f1(r * 0.012)}"/>`;
    } else {
      // citadel: walled compound with courtyard and four corner towers
      const c = plaza * 1.05;
      if (B) g += `<rect x="${f1(-c + bs * 0.3)}" y="${f1(-c + bs * 0.4)}" width="${f1(c * 2)}" height="${f1(c * 2)}" fill="#00000080"/>`;
      g += `<rect x="${f1(-c)}" y="${f1(-c)}" width="${f1(c * 2)}" height="${f1(c * 2)}" fill="${col}" stroke="${INK}" stroke-width="${f1(r * 0.022)}"/>`;
      g += `<rect x="${f1(-c * 0.55)}" y="${f1(-c * 0.55)}" width="${f1(c * 1.1)}" height="${f1(c * 1.1)}" fill="#a39780" stroke="${INK}" stroke-width="${f1(r * 0.012)}"/>`;
      g += `<circle r="${f1(c * 0.28)}" fill="${mix(col, '#ffffff', 0.45)}" stroke="${INK}" stroke-width="${f1(r * 0.012)}"/>`;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g += `<circle cx="${f1(sx * c)}" cy="${f1(sy * c)}" r="${f1(c * 0.24)}" fill="${mix(col, INK, 0.25)}" stroke="${INK}" stroke-width="${f1(r * 0.014)}"/>`;
    }
    g += `</g>`;
    if (o.emblem && l >= 2 && o.detail) g += emblem(o.emblem, 0, 0, plaza * 0.06, INK);
    g += `<path d="${hexD(r * 0.985)}" fill="none" stroke="${col}" stroke-width="${f1(Math.max(1.5, r * 0.04))}" stroke-opacity=".9"/>`;
    return g + `</g>`;
  }
  /* far zoom: compact seal + level */
  function citySeal(level, r, col) {
    return `<g><path d="${hexD(r)}" fill="${mix(col, INK, 0.55)}" stroke="${col}" stroke-width="${f1(r * 0.16)}"/>` +
      `<text y="${f1(r * 0.36)}" text-anchor="middle" font-family="Cinzel,Georgia,serif" font-weight="700" font-size="${f1(r * 1.05)}" fill="${LIGHT}">${level}</text></g>`;
  }

  /* ---------------------------------------------------------- fortifications */
  const FORTS = ['Paliçada', 'Muralha de Pedra', 'Fortaleza', 'Baluarte', 'Cidadela'];
  /* overlay drawn on top of the city hex; integrity 0..1 opens breaches */
  function fort(level, r, o = {}) {
    if (!level) return '';
    const integ = o.integrity ?? 1, R0 = r * 1.0, pts = hexPts(R0);
    const breaches = integ >= 1 ? [] : [3, 0, 4, 1, 5, 2].slice(0, Math.ceil((1 - integ) * 4));
    let g = '<g class="fort">';
    if (level >= 5) g += `<path d="${hexD(r * 1.12)}" fill="none" stroke="#3d5a66" stroke-width="${f1(r * 0.1)}" opacity=".85"/>`;
    const wallW = Math.max(level === 1 ? 3.4 : 3, r * [0.07, 0.085, 0.11, 0.11, 0.12][level - 1]);
    const wallC = level === 1 ? '#b88d55' : '#a9a397';
    for (let i = 0; i < 6; i++) {
      if (breaches.includes(i)) {
        const [a, b] = [pts[i], pts[(i + 1) % 6]];
        g += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(a[0] + (b[0] - a[0]) * 0.38)}" y2="${f1(a[1] + (b[1] - a[1]) * 0.38)}" stroke="${wallC}" stroke-width="${f1(wallW)}"/>`;
        g += `<line x1="${f1(a[0] + (b[0] - a[0]) * 0.62)}" y1="${f1(a[1] + (b[1] - a[1]) * 0.62)}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${wallC}" stroke-width="${f1(wallW)}"/>`;
        for (const t of [0.45, 0.5, 0.56]) g += `<circle cx="${f1(a[0] + (b[0] - a[0]) * t)}" cy="${f1(a[1] + (b[1] - a[1]) * t + r * 0.03)}" r="${f1(wallW * 0.35)}" fill="${wallC}"/>`;
        continue;
      }
      const [a, b] = [pts[i], pts[(i + 1) % 6]];
      if (level === 1) g += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${INK}" stroke-width="${f1(wallW + 2)}"/><line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${wallC}" stroke-width="${f1(wallW)}" stroke-dasharray="${f1(Math.max(2.4, r * 0.035))} ${f1(Math.max(1.8, r * 0.025))}"/>`;
      else g += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${INK}" stroke-width="${f1(wallW + 2)}"/><line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${wallC}" stroke-width="${f1(wallW)}"/>`;
    }
    pts.forEach(([x, y], i) => {
      if (level === 2 && i % 2) return;
      if (level === 2 || level === 3) g += level === 2
        ? `<rect x="${f1(x - wallW)}" y="${f1(y - wallW)}" width="${f1(wallW * 2)}" height="${f1(wallW * 2)}" fill="${wallC}" stroke="${INK}" stroke-width="1.2"/>`
        : `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(wallW * 1.25)}" fill="${wallC}" stroke="${INK}" stroke-width="1.2"/>`;
      if (level >= 4) { const a = Math.atan2(y, x), s = wallW * 2.1; const tip = [x + Math.cos(a) * s * 1.2, y + Math.sin(a) * s * 1.2], l1 = [x + Math.cos(a + 1.9) * s, y + Math.sin(a + 1.9) * s], l2 = [x + Math.cos(a - 1.9) * s, y + Math.sin(a - 1.9) * s]; g += `<path d="M${f1(l1[0])},${f1(l1[1])}L${f1(tip[0])},${f1(tip[1])}L${f1(l2[0])},${f1(l2[1])}L${f1(x)},${f1(y)}Z" fill="${wallC}" stroke="${INK}" stroke-width="1.2"/>`; }
    });
    if (level >= 3) { const gy = r * 0.98; g += `<rect x="${f1(-wallW * 1.6)}" y="${f1(gy - wallW * 1.4)}" width="${f1(wallW * 3.2)}" height="${f1(wallW * 2)}" fill="${wallC}" stroke="${INK}" stroke-width="1.2"/>`; }
    if (level >= 5) g += `<path d="${hexD(r * 0.5)}" fill="none" stroke="${INK}" stroke-width="${f1(wallW * 0.7 + 2)}"/><path d="${hexD(r * 0.5)}" fill="none" stroke="${wallC}" stroke-width="${f1(wallW * 0.7)}"/>`;
    return g + '</g>';
  }

  /* ------------------------------------------------------------------ pieces */
  /* 32-unit design box. Military pieces: silhouette in seat color with ink outline.
   * Civil pieces: parchment disc ringed in seat color, ink glyph. Signature: family silhouette + variation + star badge. */
  const PIECES = {
    infantaria: { name: 'Infantaria', cls: 'mil' }, guarda: { name: 'Guarda', cls: 'mil' }, atiradores: { name: 'Atiradores', cls: 'mil' },
    cavalaria: { name: 'Cavalaria', cls: 'mil' }, cerco: { name: 'Cerco', cls: 'mil' },
    explorador: { name: 'Explorador', cls: 'civ' }, pioneiro: { name: 'Pioneiro', cls: 'civ' }, enviado: { name: 'Enviado', cls: 'civ' },
    escudos: { name: 'Guarda de Escudos', cls: 'sig', base: 'guarda', civ: 'Valgard' }, elefantes: { name: 'Elefantes de Guerra', cls: 'sig', base: 'cavalaria', civ: 'Targan' },
    estepes: { name: 'Cavalaria das Estepes', cls: 'sig', base: 'cavalaria', civ: 'DEC-011' }, naval: { name: 'Infantaria Naval', cls: 'sig', base: 'infantaria', civ: 'Thalos' },
    engenheiros: { name: 'Engenheiros de Cerco', cls: 'sig', base: 'cerco', civ: 'Kor' },
  };
  const SH = {
    infantaria: c => `<path d="M-11,-1 L11,-1 L11,10 Q11,13 8,13 L-8,13 Q-11,13 -11,10 Z" fill="${c}"/>` +
      [-7, 0, 7].map(x => `<path d="M${x - 1.6},-1 L${x - 1.6},-9 L${x},-14.5 L${x + 1.6},-9 L${x + 1.6},-1 Z" fill="${c}"/>`).join('') +
      `<path d="M-11,4 L11,4" stroke="${INK}" stroke-width="1.3"/>`,
    guarda: c => `<path d="M0,-14 C9,-14 12,-11 12,-8 L12,2 C12,9 6,13 0,15 C-6,13 -12,9 -12,2 L-12,-8 C-12,-11 -9,-14 0,-14 Z" fill="${c}"/><path d="M0,-11 L0,12" stroke="${INK}" stroke-width="1.4"/><circle cy="-1" r="3" fill="${c}" stroke="${INK}" stroke-width="1.4"/>`,
    atiradores: c => `<path d="M-6,-14 C11,-10 11,10 -6,14 L-2,14 C5,8 5,-8 -2,-14 Z" fill="${c}"/><path d="M-5,-13 L-5,13" stroke="${INK}" stroke-width="1.2"/><path d="M-13,0 L11,0" stroke="${INK}" stroke-width="2.2"/><path d="M14,0 L8,-4 L8,4 Z" fill="${c}"/><path d="M-13,0 l-2,-3 M-13,0 l-2,3" stroke="${INK}" stroke-width="1.5"/>`,
    cavalaria: c => `<path d="M-8,14 L-8,7 C-11,0 -8,-7 -2,-10 L0,-15 L3,-10 C9,-9 13,-3 13,2 L9,4.5 L5,1 C4,6 7,9 8,14 Z" fill="${c}"/><circle cx="4" cy="-5" r="1.5" fill="${INK}"/><path d="M-2,-10 C-6,-6 -7,0 -5,7" stroke="${INK}" stroke-width="1.2" fill="none"/>`,
    cerco: c => `<rect x="-13" y="4" width="26" height="5" rx="1" fill="${c}"/><path d="M-7,5 L0,-6 L7,5" stroke="${c}" stroke-width="3.2" fill="none"/><path d="M-12,1 L12,-12" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/><circle cx="12" cy="-12" r="3.2" fill="${c}"/><circle cx="-8" cy="11" r="3.6" fill="${c}"/><circle cx="8" cy="11" r="3.6" fill="${c}"/><circle cx="-8" cy="11" r="1.1" fill="${INK}"/><circle cx="8" cy="11" r="1.1" fill="${INK}"/>`,
  };
  const CIVIL = {
    explorador: `<path d="M0,-13.5L3.2,-3.2L13.5,0L3.2,3.2L0,13.5L-3.2,3.2L-13.5,0L-3.2,-3.2Z" fill="${INK}"/><path d="M0,-7L1.6,0L0,7L-1.6,0Z" fill="#e8dbbb" transform="rotate(45)"/><circle r="2" fill="#e8dbbb"/>`,
    pioneiro: `<path d="M-11,1 L-4.5,-5 L2,1 L2,10 L-11,10 Z" fill="${INK}"/><path d="M5,11 L5,-12" stroke="${INK}" stroke-width="2"/><path d="M5,-12 L13,-8.5 L5,-5 Z" fill="${INK}"/>`,
    enviado: `<rect x="-11" y="-7.5" width="22" height="15" rx="1.5" fill="${INK}"/><path d="M-10,-6.5L0,2L10,-6.5" stroke="#e8dbbb" stroke-width="1.7" fill="none" stroke-linejoin="round"/><circle cy="2.5" r="3.8" fill="#b44a3a" stroke="#e8dbbb" stroke-width="1.2"/>`,
  };
  function star(x, y, s) { const p = []; for (let i = 0; i < 8; i++) { const a = Math.PI / 4 * i - Math.PI / 2, rr = i % 2 ? s * 0.42 : s; p.push(f1(x + Math.cos(a) * rr) + ',' + f1(y + Math.sin(a) * rr)); } return `<path d="M${p.join('L')}Z" fill="${LIGHT}" stroke="${INK}" stroke-width="1.1"/>`; }
  function sigShape(k, c) {
    if (k === 'escudos') return [-8.5, 8.5, 0].map(x => `<g transform="translate(${x},${x ? -1 : 3}) scale(.62)">${SH.guarda(c)}</g>`).join('');
    if (k === 'elefantes') return `<ellipse cx="-9" cy="-3" rx="6" ry="8" fill="${c}"/><ellipse cx="9" cy="-3" rx="6" ry="8" fill="${c}"/><path d="M-6,-11 C-6,-15 6,-15 6,-11 L6,0 C6,4 3,5 3,9 L3,14 L-1,14 L-1,8 C-1,5 -6,4 -6,0 Z" fill="${c}"/><path d="M-5,2 C-9,4 -10,8 -8,10 M5,2 C9,4 10,8 8,10" stroke="${LIGHT}" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="-3" cy="-6" r="1.2" fill="${INK}"/><circle cx="3" cy="-6" r="1.2" fill="${INK}"/>`;
    if (k === 'estepes') return `<path d="M-14,-12 C-5,-6 -5,8 -14,13" stroke="${c}" stroke-width="2.6" fill="none"/>` + `<g transform="translate(3,0)">${SH.cavalaria(c)}</g>`;
    if (k === 'naval') return SH.infantaria(c) + `<g stroke="${INK}" stroke-width="1.5" fill="none"><path d="M0,5.5 L0,12 M-3.5,6.5 L3.5,6.5 M-4,10 Q0,13.5 4,10"/></g>`;
    if (k === 'engenheiros') return SH.cerco(c) + `<path d="M-14,-12 L-6,-4" stroke="${INK}" stroke-width="2"/><rect x="-16.5" y="-15.5" width="6" height="4" fill="${c}" stroke="${INK}" stroke-width="1" transform="rotate(45 -13.5 -13.5)"/>`;
    return '';
  }
  /* piece(kind, seatColor, px, {n, tier}) */
  function piece(kind, col, px = 36, o = {}) {
    const P = PIECES[kind], s = px / 32;
    let g = `<g transform="scale(${f1(s * 100) / 100})">`;
    if (P.cls === 'civ') g += `<circle r="14.5" fill="#e8dbbb" stroke="${col}" stroke-width="3.6"/><circle r="16.3" fill="none" stroke="${INK}" stroke-width="1.1"/>${CIVIL[kind]}`;
    else {
      const body = P.cls === 'sig' ? sigShape(kind, col) : SH[kind](col);
      // outline pass: same shapes in ink, every stroke widened, so the silhouette survives on any terrain
      const outline = body.split(col).join(INK).split(LIGHT).join(INK).replace(/fill="(?!none)[^"]+"/g, `fill="${INK}"`).replace(/stroke-width="([\d.]+)"/g, (m, w) => `stroke-width="${+w + 2.6}"`);
      g += `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round">${outline}</g>`;
      g += body;
      if (P.cls === 'sig') g += star(12, -12, 5);
    }
    if (o.tier) for (let i = 0; i < o.tier; i++) g += `<circle cx="${f1(-4 + i * 4)}" cy="17.5" r="1.5" fill="${LIGHT}" stroke="${INK}" stroke-width=".8"/>`;
    if (o.n > 1) g += `<circle cx="12" cy="11" r="6.4" fill="${INK}" stroke="${col}" stroke-width="1.4"/><text x="12" y="14.3" text-anchor="middle" font-family="'Source Sans 3',sans-serif" font-weight="700" font-size="9.5" fill="${LIGHT}">${o.n}</text>`;
    return g + '</g>';
  }

  /* ------------------------------------------------------------------- ships */
  const SHIPS = {
    batel: { name: 'Embarcação Costeira', fn: 'exploração costeira e pesca; remos curtos', l: 30, w: 11, bow: 7 },
    mercante: { name: 'Mercante', fn: 'comércio: porões quadrados, casco largo', l: 40, w: 20, bow: 11 },
    galera: { name: 'Galera', fn: 'escolta e transporte leve; muitos remos', l: 56, w: 11, bow: 10 },
    guerra: { name: 'Galera de Guerra', fn: 'combate: esporão na proa, escudos na amurada', l: 56, w: 12, bow: 10 },
    transporte: { name: 'Nau de Transporte', fn: 'leva peças: vagas marcadas no convés', l: 50, w: 20, bow: 12 },
    carraca: { name: 'Carraca', fn: 'carga e alto-mar: castelos de proa e popa', l: 48, w: 22, bow: 12 },
    fragata: { name: 'Fragata', fn: 'combate de longo alcance: portinholas, três mastros', l: 60, w: 15, bow: 16 },
  };
  function hull(l, w, bow) { const a = -l / 2, b = l / 2, h = w / 2, st = Math.min(5, w * 0.3); return `M${a + st},${-h}L${b - bow},${-h}Q${b - bow * 0.15},${-h * 0.55} ${b},0Q${b - bow * 0.15},${h * 0.55} ${b - bow},${h}L${a + st},${h}Q${a},${h} ${a},${h - st}L${a},${-h + st}Q${a},${-h} ${a + st},${-h}Z`; }
  /* ship(kind, seatColor, px) — px is the hull length on the table; bow points right */
  function ship(kind, col, px = 64) {
    const S = SHIPS[kind], s = px / 64, { l, w, bow } = S, h = w / 2, deck = mix(col, '#ffffff', 0.35);
    let g = `<g transform="scale(${f1(s * 100) / 100})">`;
    const oars = (k, len) => { let o = ''; for (let i = 0; i < k; i++) { const x = -l / 2 + 7 + i * ((l - bow - 10) / Math.max(1, k - 1)); o += `<path d="M${f1(x)},${-h} l-2,${-len} M${f1(x)},${h} l-2,${len}" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`; } return o; };
    if (kind === 'batel') g += oars(2, 5);
    if (kind === 'galera') g += oars(7, 6);
    if (kind === 'guerra') { g += oars(8, 6); g += `<path d="M${l / 2 - 3},-2.5 L${l / 2 + 9},0 L${l / 2 - 3},2.5 Z" fill="${INK}"/>`; }
    g += `<path d="${hull(l, w, bow)}" fill="${col}" stroke="${INK}" stroke-width="2"/>`;
    g += `<path d="${hull(l - 7, w - 6, bow * 0.8)}" fill="${deck}" transform="translate(-1,0)"/>`;
    const mast = (x, span, sail) => (sail ? `<rect x="${f1(x - 2)}" y="${f1(-span)}" width="4" height="${f1(span * 2)}" fill="${LIGHT}" stroke="${INK}" stroke-width="1"/>` : `<line x1="${f1(x)}" y1="${f1(-span)}" x2="${f1(x)}" y2="${f1(span)}" stroke="${INK}" stroke-width="1.6"/>`) + `<circle cx="${f1(x)}" r="1.8" fill="${INK}"/>`;
    if (kind === 'mercante') { for (const x of [-11, -3]) g += `<rect x="${x}" y="-4" width="6" height="8" fill="none" stroke="${INK}" stroke-width="1.4"/>`; g += mast(7, h + 3, 1); }
    if (kind === 'galera') g += mast(2, h + 1, 0);
    if (kind === 'guerra') { for (let i = 0; i < 7; i++) { const x = -l / 2 + 8 + i * 5.5; g += `<circle cx="${x}" cy="${-h + 2}" r="1.6" fill="${LIGHT}" stroke="${INK}" stroke-width=".8"/><circle cx="${x}" cy="${h - 2}" r="1.6" fill="${LIGHT}" stroke="${INK}" stroke-width=".8"/>`; } g += mast(0, h, 0); }
    if (kind === 'transporte') { for (const x of [-14, -6, 2]) for (const y of [-4, 4]) g += `<circle cx="${x}" cy="${y}" r="2.6" fill="none" stroke="${INK}" stroke-width="1.4"/>`; g += mast(-18, h + 2, 1) + mast(10, h + 2, 1); }
    if (kind === 'carraca') { g += `<rect x="${-l / 2 + 2}" y="${-h + 3}" width="10" height="${w - 6}" fill="${mix(col, INK, 0.3)}" stroke="${INK}" stroke-width="1.2"/><path d="M${l / 2 - 14},${-h + 4} L${l / 2 - 5},0 L${l / 2 - 14},${h - 4} Z" fill="${mix(col, INK, 0.3)}" stroke="${INK}" stroke-width="1.2"/>`; g += mast(-8, h + 3, 1) + mast(2, h + 4, 1) + mast(11, h + 2, 1); }
    if (kind === 'fragata') { for (let i = 0; i < 8; i++) { const x = -l / 2 + 8 + i * 5.2; g += `<rect x="${x - 1}" y="${-h - 0.5}" width="2.4" height="2" fill="${INK}"/><rect x="${x - 1}" y="${h - 1.5}" width="2.4" height="2" fill="${INK}"/>`; } g += mast(-14, h + 4, 1) + mast(-2, h + 5, 1) + mast(10, h + 3, 1); }
    if (kind === 'batel') g += `<line x1="-6" y1="0" x2="4" y2="0" stroke="${INK}" stroke-width="1.2"/>`;
    return g + '</g>';
  }

  /* ---------------------------------------------------------------- emblems */
  /* single-stroke emblems, 24-unit box; legible at 12–16 px */
  const EMB = {
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
  function emblem(k, x, y, s, col, w = 2) { return `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})"><path d="${EMB[k]}" fill="none" stroke="${col}" stroke-width="${f1(w / s * Math.max(1, s * 0.9))}" stroke-linecap="round" stroke-linejoin="round"/></g>`; }

  /* ----------------------------------------------------------- civilizations */
  /* identity = emblem + seal frame + banner shape + border pattern. Seat color is separate. */
  const CIVS = [
    ['aurelia', 'Aurélia', 'espiga', 'circulo', 'gonfalao', 'solida', 1],
    ['valgard', 'Valgard', 'passo', 'hexagono', 'escudo', 'tracejada', 1],
    ['meridia', 'Merídia', 'ondas', 'circulo', 'bifurcada', 'pontilhada', 1],
    ['thalos', 'Thalos', 'farol', 'losango', 'flamula', 'pontilhada', 1],
    ['saren', 'Saren', 'tresvozes', 'hexagono', 'reta', 'dupla', 1],
    ['kor', 'Kor', 'bigorna', 'losango', 'escudo', 'solida', 1],
    ['orinth', 'Orinth', 'olho', 'losango', 'arredondada', 'tracoponto', 1],
    ['nymara', 'Nymara', 'folha', 'circulo', 'arredondada', 'faixa', 1],
    ['veyra', 'Veyra', 'encruzilhada', 'hexagono', 'bifurcada', 'tracoponto', 1],
    ['solenne', 'Solenne', 'sol', 'circulo', 'reta', 'faixa', 1],
    ['dravik', 'Dravik', 'arcos', 'hexagono', 'gonfalao', 'dupla', 1],
    ['elyra', 'Elyra', 'chama', 'circulo', 'flamula', 'tracejada', 1],
    ['kaedor', 'Kaedor', 'moeda', 'losango', 'reta', 'tracejada', 0],
    ['lumaris', 'Lumaris', 'prisma', 'hexagono', 'flamula', 'faixa', 0],
    ['targan', 'Targan', 'presa', 'losango', 'bifurcada', 'solida', 0],
    ['iskara', 'Iskara', 'espiral', 'losango', 'gonfalao', 'pontilhada', 0],
    ['veloria', 'Veloria', 'elos', 'hexagono', 'arredondada', 'solida', 0],
    ['norvak', 'Norvak', 'floco', 'circulo', 'escudo', 'dupla', 0],
  ].map(([id, name, em, seal, banner, border, alpha]) => ({ id, name, em, seal, banner, border, alpha: !!alpha }));
  const CIV = Object.fromEntries(CIVS.map(c => [c.id, c]));
  const BANNERS = { reta: 'Reta', bifurcada: 'Bifurcada', flamula: 'Flâmula', gonfalao: 'Gonfalão', escudo: 'Escudo', arredondada: 'Arredondada' };
  const SEALS = { circulo: 'Círculo', hexagono: 'Hexágono', losango: 'Losango' };
  const BORDERS = { solida: 'Sólida', tracejada: 'Tracejada', pontilhada: 'Pontilhada', dupla: 'Dupla', tracoponto: 'Traço-ponto', faixa: 'Faixa interna' };

  /* banner hanging from a T pole; box ~ 24 × 40 units, origin at the pole foot */
  function bannerPath(shape) {
    const w = 18, top = -36, bot = -12, x0 = -9;
    const x1 = x0 + w;
    return {
      reta: `M${x0},${top}L${x1},${top}L${x1},${bot}L${x0},${bot}Z`,
      bifurcada: `M${x0},${top}L${x1},${top}L${x1},${bot + 2}L0,${bot - 6}L${x0},${bot + 2}Z`,
      flamula: `M${x0},${top}L${x1},${top}L0,${bot + 4}Z`,
      gonfalao: `M${x0},${top}L${x1},${top}L${x1},${bot}L${x1 - 3},${bot - 5}L${x1 - 6},${bot}L0,${bot - 5}L${x0 + 6},${bot}L${x0 + 3},${bot - 5}L${x0},${bot}Z`,
      escudo: `M${x0},${top}L${x1},${top}L${x1},${bot - 8}L0,${bot + 2}L${x0},${bot - 8}Z`,
      arredondada: `M${x0},${top}L${x1},${top}L${x1},${bot - 7}A9,9 0 0,1 ${x0},${bot - 7}Z`,
    }[shape];
  }
  function banner(civId, col, px = 40, o = {}) {
    const c = CIV[civId], s = px / 40;
    let g = `<g transform="scale(${f1(s * 100) / 100})${o.tilt ? ` rotate(${o.tilt} 0 0)` : ''}">`;
    g += `<line x1="0" y1="2" x2="0" y2="-38" stroke="${INK}" stroke-width="3.4"/><line x1="0" y1="2" x2="0" y2="-38" stroke="#c9b48a" stroke-width="1.8"/>`;
    g += `<line x1="-11" y1="-36.5" x2="11" y2="-36.5" stroke="${INK}" stroke-width="3"/><line x1="-11" y1="-36.5" x2="11" y2="-36.5" stroke="#c9b48a" stroke-width="1.6"/>`;
    g += `<path d="${bannerPath(c.banner)}" fill="${col}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
    g += emblem(c.em, 0, -26, 0.55, o.ink || INK, 1.5);
    return g + '</g>';
  }
  function sealFrame(shape, r) {
    if (shape === 'circulo') return `M${-r},0a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;
    if (shape === 'hexagono') return hexD(r);
    return `M0,${-r * 1.12}L${r * 1.12},0L0,${r * 1.12}L${-r * 1.12},0Z`;
  }
  function seal(civId, col, r = 16) {
    const c = CIV[civId];
    return `<g><path d="${sealFrame(c.seal, r)}" fill="#0f181c" stroke="${col}" stroke-width="${f1(r * 0.16)}"/>${emblem(c.em, 0, 0, r / 15, col, 2)}</g>`;
  }
  function borderStyle(civId, col, w = 3) {
    const b = CIV[civId].border;
    const line = (width, extra = '') => `stroke="${col}" stroke-width="${f1(width)}" fill="none" stroke-linecap="round"${extra}`;
    return {
      solida: [line(w)],
      tracejada: [line(w, ` stroke-dasharray="${f1(w * 3.4)} ${f1(w * 2)}"`)],
      pontilhada: [line(w * 1.3, ` stroke-dasharray="0.1 ${f1(w * 2.1)}"`)],
      dupla: [line(w * 2.6), `stroke="#0b1114" stroke-width="${f1(w * 0.9)}" fill="none"`],
      tracoponto: [line(w, ` stroke-dasharray="${f1(w * 3.4)} ${f1(w * 1.4)} 0.1 ${f1(w * 1.4)}"`)],
      faixa: [`stroke="${col}" stroke-opacity=".28" stroke-width="${f1(w * 3.6)}" fill="none"`, line(w)],
    }[b];
  }


  G.AOH = { INK, LIGHT, rng, mix, hexPts, hexD, LEVELS, city, citySeal, FORTS, fort, PIECES, piece, SHIPS, ship, EMB, emblem, CIVS, CIV, BANNERS, SEALS, BORDERS, banner, seal, sealFrame, borderStyle, star };
})(typeof window !== 'undefined' ? window : globalThis);
