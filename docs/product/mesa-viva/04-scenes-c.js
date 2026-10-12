/* ===== Cena C1 · Ciclo do Bando ===== */
(function sceneC1() {
  const g = new Grid(['sccpphhh', 'sscppfhh', 'sccpppmh', 'sscppfpp', 'sssccppp'], 40);
  const CITY = [4, 2], CAMP = [6, 1], ARMY0 = [3, 3];
  const own = (f) => [CITY, f === 5 ? CAMP : ARMY0];
  const FR = [
    ['R8 · Acampamento ativo', 'Três guerreiros (Infantaria ×2, Cavalaria) guardam a tenda. Nada se move fora da ativação. Visível porque está a 3 hexes de Mikena.'],
    ['R9 · O Bando sai e marcha', 'Bando II deixa o Acampamento e anda para a cidade mais próxima por terra e costa. A seta mostra só o próximo passo conhecido; o caminho real contorna o mar.'],
    ['R11 · Assalto', 'Bando II ataca Mikena: Ânimo 4 → 3. O Bando I também chegou, mas a cidade já sofreu seu assalto desta rodada, então espera ao lado (limite: 1 assalto por cidade por rodada).'],
    ['R11 · Recuo', 'Depois de assaltar, o Bando volta ao Acampamento. A mesma regra vale se o assalto foi a tropas no campo. Em recuo ele não ataca.'],
    ['R12 · Reorganização', 'O Bando fica 1 rodada no Acampamento, sem partir. A ampulheta marca o descanso; só volta na virada de Era ou por evento.'],
    ['R13 · Acampamento destruído', 'O exército próprio chega ao Acampamento e vence. Tenda caída, paliçada quebrada, estandarte no chão. Os guerreiros somem do mapa porque foram eliminados.'],
  ];
  let f = 0, fog = true, timer = null;
  const vis = (c, r, f) => !fog || own(f).some(p => g.dist(p, [c, r]) <= 3);
  function render() {
    const e = (c, r) => g.xy(c, r);
    let s = `<svg viewBox="${viewBox(g, 8)}" role="img" aria-label="Ciclo do Bando, quadro ${f + 1} de 6"><defs>${arrowDefs('arC', '#e0724f')}${arrowDefs('arW', '#9db0b3')}</defs>${mapBase(g, (c, r) => !vis(c, r, f), null, new Set([CITY, ARMY0, CAMP, [5, 1], [5, 2], [4, 1], [7, 4]].map(q => q.join(','))))}`;
    let [x, y] = e(...CITY);
    s += cityArt(x, y, 3, '#60a3e9', 'Mikena', f >= 2 && f <= 4 ? 3 : 4, { R: g.S });
    if (f >= 2 && f <= 4) s += `<g transform="translate(${f1(x + 26)} ${f1(y - 24)})"><rect x="-22" y="-8" width="44" height="16" rx="8" fill="#0f181c" stroke="#e58a74" stroke-width="1.3"/><text text-anchor="middle" y="4" font-family="Source Sans 3,sans-serif" font-weight="700" font-size="10" fill="#f0b8a8">Ânimo −1</text></g>`;
    if (f !== 5) { [x, y] = e(...ARMY0); s += ownFigure('INFANTRY', x - 11, y + 2, 26, 2) + ownFigure('CAVALRY', x + 11, y + 4, 26); }
    else { [x, y] = e(...CAMP); s += ownFigure('INFANTRY', x - 14, y + 8, 26, 2) + ownFigure('CAVALRY', x + 4, y + 10, 26); }
    [x, y] = e(...CAMP);
    s += campArt(x, y - 4, f === 5 ? 'ruin' : f === 4 ? 'rest' : 'active');
    const show = (cell, kinds, o = {}) => { const [bx, by] = e(...cell); return kinds.map((k, i) => threatFigure(k, bx + (i - (kinds.length - 1) / 2) * 17, by + 8, 24, k === 'INFANTRY' && kinds.length > 1 ? 2 : 0, o)).join(''); };
    const bandKinds = ['INFANTRY', 'CAVALRY'];
    if (f === 0) s += show(CAMP, bandKinds).replace(/translate\(([-\d.]+) ([-\d.]+)\)/, 'translate($1 $2)');
    if (f === 1) { s += pathLine(g, [[5, 1], [5, 2]], '#e0724f', { dash: '7 6', marker: 'arC', w: 2.6 }) + show([5, 1], bandKinds); }
    if (f === 2) { s += burst(...e(...CITY), 1.05) + show([5, 2], bandKinds) + show([4, 1], bandKinds, { ghost: true }); [x, y] = e(4, 1); s += `<g transform="translate(${f1(x)} ${f1(y - 24)})"><rect x="-44" y="-9" width="88" height="17" rx="8.5" fill="#0f181c" stroke="#e6b04c" stroke-width="1.2"/><text text-anchor="middle" y="3.5" font-family="Source Sans 3,sans-serif" font-weight="700" font-size="9.4" fill="#f2d79a">espera · 1 assalto/cidade</text></g>`; }
    if (f === 3) { s += pathLine(g, [[5, 2], [5, 1], [6, 1]], '#9db0b3', { dash: '3 6', marker: 'arW', w: 2.6 }) + show([5, 1], bandKinds, { ghost: true }); [x, y] = e(5, 2); s += `<g transform="translate(${f1(x)} ${f1(y - 24)})"><rect x="-24" y="-9" width="48" height="17" rx="8.5" fill="#0f181c" stroke="#9db0b3" stroke-width="1.2"/><text text-anchor="middle" y="3.5" font-family="Source Sans 3,sans-serif" font-weight="700" font-size="10" fill="#cfdadd">recuo ↩</text></g>`; s += show([5, 2], bandKinds, { ghost: true }); }
    if (f === 4) s += show(CAMP, bandKinds);
    if (f === 5) { [x, y] = e(...CAMP); s += `<g opacity=".5">${threatFigure('INFANTRY', x + 16, y + 12, 22)}</g><path d="M${f1(x + 8)},${f1(y + 4)} l16,16 M${f1(x + 24)},${f1(y + 4)} l-16,16" stroke="#e58a74" stroke-width="2.4" stroke-linecap="round"/>`; }
    // bando oculto: só aparece sem névoa; com névoa deixa o último avistamento
    const hid = [7, 4], [hx, hy] = e(...hid);
    if (vis(...hid, f)) s += show(hid, ['INFANTRY']); else s += threatFigure('INFANTRY', hx, hy, 22, 0, { ghost: true }) + `<text x="${f1(hx)}" y="${f1(hy + 24)}" text-anchor="middle" font-family="Source Sans 3,sans-serif" font-size="9" font-weight="700" fill="#e0a08f">último avistamento</text>`;
    $('#mapC1').innerHTML = s + '</svg>';
    $('#infoC1').innerHTML = `<b>${esc(FR[f][0])}</b><span>${esc(FR[f][1])}</span>`;
    $('#ctlC1').querySelector('input[type=range]').value = f;
    $('#ctlC1').querySelector('.step').innerHTML = FR.map((q, i) => `<button class="pill" data-f="${i}" aria-pressed="${i === f}">${i + 1}</button>`).join('');
  }
  $('#ctlC1').innerHTML = `<div class="step"></div><input class="slider" type="range" min="0" max="5" value="0" aria-label="Quadro do ciclo"><div class="row"><button class="ghost" id="playC1">Reproduzir</button><label class="sw"><input type="checkbox" id="fogC1" checked> Névoa de guerra</label></div><p class="mute" style="font-size:12.5px">Bandos e Acampamentos são peças reais: a composição mostrada é a do motor. Com a névoa desligada o mapa mostra o Bando oculto a leste.</p>`;
  const stop = () => { clearInterval(timer); timer = null; $('#playC1').textContent = 'Reproduzir'; };
  $('#ctlC1').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { stop(); f = +b.dataset.f; render(); } if (e.target.id === 'playC1') { if (timer) return stop(); $('#playC1').textContent = 'Pausar'; if (f >= 5) f = 0; timer = setInterval(() => { f++; render(); if (f >= 5) stop(); }, 1700); render(); } });
  $('#ctlC1').addEventListener('input', e => { if (e.target.type === 'range') { stop(); f = +e.target.value; render(); } });
  $('#ctlC1').addEventListener('change', e => { if (e.target.id === 'fogC1') { fog = e.target.checked; render(); } });
  render();
})();

/* ===== Cena C2 · Terra, costa e mar ===== */
(function sceneC2() {
  const g = new Grid(['pcccccpp', 'pssssspp', 'psssssps'], 40);
  let who = 'band', old = false;
  const T = c => TER[g.t(...c)].n;
  function render() {
    let s = `<svg viewBox="${viewBox(g, 8)}" role="img" aria-label="Travessia legal e ilegal"><defs>${arrowDefs('okC', '#7fc79a')}${arrowDefs('noC', '#e58a74')}</defs>${mapBase(g, null, null, new Set(['7,1', '0,1', '5,1', '4,2', '3,0']))}`;
    let [x, y] = g.xy(7, 1); s += cityArt(x, y, 2, '#60a3e9', 'Tirinto', 4, { R: g.S });
    let msg, rows;
    if (who === 'band') {
      const legal = [[0, 1], [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [6, 1]];
      s += pathLine(g, legal, '#7fc79a', { w: 3.2, marker: 'okC', dots: true });
      if (old) { s += pathLine(g, [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1]], '#e58a74', { w: 2.4, dash: '6 6', marker: 'noC' }); [x, y] = g.xy(1, 1); s += `<g transform="translate(${f1(x)} ${f1(y)})"><circle r="11" fill="#0f181c" stroke="#e58a74" stroke-width="2"/><path d="M-5 -5 L5 5 M5 -5 L-5 5" stroke="#e58a74" stroke-width="2.2" stroke-linecap="round"/></g>`; }
      [x, y] = g.xy(0, 1); s += threatFigure('INFANTRY', x - 8, y + 6, 26, 2) + threatFigure('CAVALRY', x + 12, y + 8, 26);
      msg = old ? 'A linha reta antiga do jogo cruzava o Mar. O Bando nunca entra em Mar: o caminho real contorna pela Costa, que conta como terra.' : 'Caminho real: Planície → Costa ×5 → Planície → alvo. Cada passo é adjacente e legal. Costa são águas rasas: pisa-se como terra.';
      rows = ['Planície', 'Costa', 'Costa', 'Costa', 'Costa', 'Costa', 'Planície', 'Planície'];
    } else {
      const sea = [[5, 1], [4, 1], [3, 1], [2, 1]];
      s += pathLine(g, sea, '#7fc79a', { w: 3.2, marker: 'okC', dots: true }) + pathLine(g, [[3, 1], [3, 0]], '#e58a74', { w: 2.4, dash: '6 6', marker: 'noC' });
      [x, y] = g.xy(3, 0); s += `<g transform="translate(${f1(x)} ${f1(y)})"><circle r="11" fill="#0f181c" stroke="#e58a74" stroke-width="2"/><path d="M-5 -5 L5 5 M5 -5 L-5 5" stroke="#e58a74" stroke-width="2.2" stroke-linecap="round"/></g>`;
      [x, y] = g.xy(5, 1); s += threatFigure('COASTAL_VESSEL', x, y, 30);
      [x, y] = g.xy(4, 2); s += threatFigure('FLEET', x, y + 2, 28);
      msg = 'Piratas só navegam em Mar. Subir para a Costa é ilegal. Pilham o porto apenas se estiverem adjacentes a ele, no máximo 1 vez por porto por rodada.';
      rows = [];
    }
    $('#mapC2').innerHTML = s + '</svg>';
    $('#infoC2').innerHTML = `<b>${who === 'band' ? 'Bando (terra)' : 'Piratas (mar)'}</b><span>${esc(msg)}</span>`;
  }
  $('#ctlC2').innerHTML = `<div class="seg" role="group" aria-label="Ator"><button data-w="band" aria-pressed="true">Bando</button><button data-w="pirate" aria-pressed="false">Piratas</button></div><label class="sw"><input type="checkbox" id="oldC2"> Mostrar a linha reta antiga</label>
    <div class="row"><svg width="46" height="40" viewBox="-23 -20 46 40" aria-hidden="true">${hexArt(new Grid(['c'], 17), 0, 0, 'c').replace('data-hex', 'x')}</svg><span><b>Costa</b>: águas rasas turquesa com bancos de areia. Bando e exércitos vadeiam; navios também passam.</span></div>
    <div class="row"><svg width="46" height="40" viewBox="-23 -20 46 40" aria-hidden="true">${hexArt(new Grid(['s'], 17), 0, 0, 's').replace('data-hex', 'x')}</svg><span><b>Mar</b>: azul fundo com ondas e cardumes. Só navios navegam e pescam.</span></div>
    <p class="mute" style="font-size:12.5px">Na auditoria o motor estava correto (12 testes). O problema era visual: Costa e Mar tinham a mesma cor e textura, e a linha de rumo era reta. Aqui os dois terrenos se distinguem e a trilha segue o caminho real.</p>`;
  $('#ctlC2').addEventListener('click', e => { const b = e.target.closest('[data-w]'); if (!b) return; who = b.dataset.w; $('#ctlC2').querySelectorAll('[data-w]').forEach(x => x.setAttribute('aria-pressed', x === b)); render(); });
  $('#ctlC2').addEventListener('change', e => { if (e.target.id === 'oldC2') { old = e.target.checked; render(); } });
  render();
})();

/* ===== Cena C3 · Pioneiro e descoberta (Região de 7 hexes, peças e marcadores do artifact de cultura material) ===== */
(function sceneC3() {
  const st = { method: false, rot: 0, lost: true };
  const R = 30, INVALID = [1, 3, 5], LET = ['P', 'H', 'F', 'M', 'C', 'S', 'S'];
  const pos = FP(R), px = -2 * SQ3 * R;
  const ctx = [[-2, 0, 'PLAINS'], [-2, 1, 'FOREST'], [-3, 1, 'PLAINS'], [-3, 0, 'HILLS'], [-2, -1, 'PLAINS']].map(([q, r, t], i) => `<g transform="translate(${n2(SQ3 * R * (q + r / 2))},${n2(1.5 * R * r)})">${terrainHex(R, t, 40 + i)}</g>`).join('');
  function chips() {
    return `<div class="row" style="gap:8px">${[0, 1, 2, 3, 4, 5].map(k => { const bad = INVALID.includes(k), on = k === st.rot;
      return `<button class="chip-u" data-rot="${k}" aria-pressed="${on}" ${bad ? 'disabled' : ''} aria-label="Orientação ${k + 1}${bad ? ', sem entrada terrestre' : ''}" style="padding:4px;flex-direction:column;gap:2px;position:relative"><svg viewBox="-34 -34 68 68" width="52" height="52"><g transform="scale(.34)">${regionBack(40, on)}</g><g transform="rotate(${k * 60})"><path d="M0,-30 l-5,-7 h10z" fill="#d1a95a"/></g>${bad ? '<path d="M-26 -26 L26 26 M26 -26 L-26 26" stroke="#e58a74" stroke-width="3" stroke-linecap="round"/>' : ''}</svg><span style="font-size:10.5px">${bad ? 'sem entrada' : 'Orientação ' + (k + 1)}</span></button>`; }).join('')}</div>`;
  }
  function p1() {
    const [ex, ey] = pos[4];
    return `<svg viewBox="0 0 380 250" role="img" aria-label="Pioneiro ao lado de Região fechada"><rect width="380" height="250" fill="#0f181c"/><g transform="translate(250,124)">${ctx}${regionBack(R, true)}<polygon points="${P(hexPts(R * .97).map(p => [p[0] + ex, p[1] + ey]))}" fill="none" stroke="#d1a95a" stroke-width="3"/><g transform="translate(${n2(px)},0)">${terrainHex(R, 'PLAINS', 77)}${ownFigure('PIONEER', 0, 2, 32)}</g></g><text x="14" y="24" fill="#9fb1b5" font-size="12" font-family="Source Sans 3,sans-serif">Pioneiro a 1 hex da Região fechada</text></svg>`;
  }
  function p2(eff) {
    const [ex, ey] = pos[4], bad = eff === 'perdeu';
    return `<svg viewBox="0 0 380 250" role="img" aria-label="Região revelada com Perigo"><rect width="380" height="250" fill="#0f181c"/><g transform="translate(250,124)">${ctx}${regionFront(R, LET, 70)}<polygon points="${P(hexPts(R * .97).map(p => [p[0] + ex, p[1] + ey]))}" fill="${bad ? '#e0583f' : '#7fc79a'}" fill-opacity=".22" stroke="${bad ? '#e58a74' : '#7fc79a'}" stroke-width="3" class="pulse"/><g transform="translate(${n2(pos[2][0])},${n2(pos[2][1] + R * .1)}) scale(${n2(R / 38)})" opacity="${st.method ? .5 : 1}">${MK.danger()}</g>`
      + `<g transform="translate(${n2(px)},0)">${terrainHex(R, 'PLAINS', 77)}</g>`
      + (bad ? `<g transform="translate(${n2(ex)},${n2(ey)})">${ownFigure('PIONEER', 0, 2, 30, 0, '#60a3e9', { ghost: true })}<path d="M-14 -14 l28 28 M14 -14 l-28 28" stroke="#e58a74" stroke-width="3" stroke-linecap="round"/></g>` : `<g transform="translate(${n2(ex)},${n2(ey)})">${ownFigure('PIONEER', 0, 2, 32)}</g>`)
      + `</g><text x="14" y="24" fill="#9fb1b5" font-size="12" font-family="Source Sans 3,sans-serif">Região revelada: Costa, Planície, Colinas, Mar</text></svg>`;
  }
  function render() {
    const eff = st.method ? 'escapou' : st.lost ? 'perdeu' : 'escapou';
    const risk = st.method ? '<span class="ok">Método Experimental: Perigo não custa a peça.</span>' : '<span class="warn">Perigo possível: se a Região esconder Perigo, 50% de perder o Pioneiro.</span>';
    $('#framesC3').innerHTML = `
    <div style="display:grid;gap:8px"><span class="cap">1 · Antes: aviso e orientação</span><div class="mesa">${p1()}<div class="info"><b>Explorar Região fechada</b>${chips()}<span style="font-size:13px">Só orientações com entrada terrestre são oferecidas. As marcadas ✕ deixariam o Pioneiro sem entrada: o motor as bloqueia, nunca as aplica nem remove a peça.</span>${risk}<label class="sw"><input type="checkbox" id="metC3" ${st.method ? 'checked' : ''}> Tenho Método Experimental</label></div></div></div>
    <div style="display:grid;gap:8px"><span class="cap">2 · Revelação</span><div class="mesa">${p2(eff)}<div class="legend"><span>Marcador de Perigo (do artifact)</span><span class="${eff === 'perdeu' ? 'bad' : 'ok'}">${eff === 'perdeu' ? 'Pioneiro perdido' : 'Pioneiro seguro'}</span></div></div></div>
    <div style="display:grid;gap:8px"><span class="cap">3 · Resultado e Crônica</span><div class="panel"><div class="seg" role="group" aria-label="Sorteio"><button data-lost="1" aria-pressed="${st.lost && !st.method}" ${st.method ? 'disabled' : ''}>Sorteio: perdeu</button><button data-lost="0" aria-pressed="${!st.lost || st.method}">Sorteio: escapou</button></div>
      <div class="${eff === 'perdeu' ? 'pred' : 'applied'}" style="${eff === 'perdeu' ? 'border:1.5px solid var(--b-bad)' : ''}"><b class="${eff === 'perdeu' ? 'bad' : 'ok'}">Perigo · Terraços do Cobre</b><span>${eff === 'perdeu' ? 'Pioneiro perdido ao entrar na Região.' : st.method ? 'Perigo evitado pelo Método Experimental.' : 'Pioneiro escapou e ocupa o hex de entrada (Costa).'}</span><span class="mute">Evento de perda explícito (LOSSES) com o hex de entrada e a peça.</span></div>
      <div class="band"><span class="cap">Crônica</span><span style="font:italic 500 17px var(--serif);color:var(--b-ink)">Rodada 9 · Leontia explorou os Terraços do Cobre. ${eff === 'perdeu' ? 'O perigo custou o Pioneiro.' : 'O Pioneiro seguiu em frente.'}</span></div>
      <div class="band"><span class="cap">No mapa</span><span>${eff === 'perdeu' ? 'Halo vermelho 1 rodada no hex de entrada, peça fantasma tracejada.' : 'Peça sobre a Costa (águas rasas), visível, com anel verde.'}</span></div></div></div>`;
  }
  $('#framesC3').addEventListener('click', e => { const r = e.target.closest('[data-rot]'); if (r && !r.disabled) { st.rot = +r.dataset.rot; render(); } const l = e.target.closest('[data-lost]'); if (l && !l.disabled) { st.lost = l.dataset.lost === '1'; render(); } });
  $('#framesC3').addEventListener('change', e => { if (e.target.id === 'metC3') { st.method = e.target.checked; render(); } });
  render();
})();
