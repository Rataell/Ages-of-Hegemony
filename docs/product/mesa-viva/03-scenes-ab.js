/* ===== Decisões no topo ===== */
$('#decisoes').innerHTML = [
  ['D1 · Mover', 'Uma Ordem desloca até 3 peças a destinos diferentes', 'Juntas ou separadas, custo e alcance por peça, confirmação única. Regra nova só em partidas novas.'],
  ['D2 · Descoberta', 'Perigo 50% mantido, nunca em silêncio', 'Aviso antes, evento de perda, resultado legível, Crônica e halo no mapa. Terreno incompatível nunca apaga peça.'],
  ['D3 · Saqueadores', '1 assalto por cidade por rodada', 'Recuo também após assalto a peças no campo; pilhagem pirata com limite. Bandos com peças reais.'],
  ['D4 · Governar', 'O jogador escolhe quantos níveis', 'Ânimo atual → previsto, custo total, Ordem e ativação, recurso reservado, bloqueios concretos.'],
  ['D5 · Bônus de movimento', 'Sem teto. O bônus tem de ser aceito', 'Motor e interface validam o mesmo alcance; teste com e sem bônus.'],
].map(([a, b, c]) => `<div class="dec"><b>${a}</b><strong>${b}</strong><span>${c}</span></div>`).join('');

/* ===== Cena A · Mesa e visão geral ===== */
(function sceneA() {
  const g = new Grid(['sssccpfh??', 'sscppffhm?', 'sccppppmh?', 'sscpphppf?', 'sssccppfp?', 'ssssccp???', 'sssssc????'], 40);
  const own = { mikena: [3, 3], tirinto: [6, 5], army: [4, 3], pioneer: [4, 2], fleet: [1, 3] };
  const OWN = '#60a3e9';
  const DET = { '3,2': { feat: ['FERTILE'], owner: OWN }, '1,3': { feat: ['SHOAL'], fishing: true, owner: OWN }, '0,5': { feat: ['SHOAL'] }, '3,4': { imp: 'FISHERY', owner: OWN }, '2,3': { feat: ['FISH'], owner: OWN }, '5,3': { imp: 'MINE', owner: OWN }, '5,4': { imp: 'FARM', owner: OWN }, '5,1': { imp: 'LUMBER_CAMP' }, '6,0': { feat: ['TIMBER'] }, '4,1': { feat: ['RIVER'] }, '7,2': { feat: ['METAL'] }, '7,1': { feat: ['STONE'] }, '4,3': { owner: OWN }, '3,3': { owner: OWN }, '4,2': { owner: OWN }, '6,4': { owner: OWN }, '6,5': { owner: OWN } };
  const OCC = new Set(['3,3', '6,5', '4,3', '4,2', '1,3', '7,0', '6,1', '1,5', '8,3']);
  const ROADS = ['4,3', '5,3', '5,4', '6,4'], CITYC = [[3, 3], [6, 5]];
  const sight = Object.values(own);
  const vis = (c, r) => sight.some(p => g.dist(p, [c, r]) <= 3);
  const INFO = {
    mikena: ['Mikena · cidade N3 · porto', 'Ânimo 4/6, Estável. Capacidade 2, ativações 1/2. Produz, recruta e constrói a partir daqui.', ['INFANTRY']],
    tirinto: ['Tirinto · cidade N2', 'Revolta (Ânimo 1/6): não produz. Governar ou Recuperação emergencial. Alimento curto: perde 1 habitante na manutenção se nada mudar.', []],
    army: ['Exército próprio · 3 peças', 'Infantaria ×2 e Cavalaria. Pode entrar numa Ordem de Mover junto ou separado (Cena B).', ['INFANTRY', 'CAVALRY']],
    pioneer: ['Pioneiro', 'Funda cidades e explora Regiões fechadas. Perigo ao revelar pode custar a peça (Cena C).', ['PIONEER']],
    fleet: ['Frota própria', 'Navega em Mar e Costa. Dá vista de 3 hexes sobre a água.', ['FLEET']],
    camp: ['Acampamento de Saqueadores · memória', 'Visto na rodada 7. Fora da vista agora, por isso aparece esmaecido. Guarda 3 guerreiros (Infantaria ×2, Cavalaria).', ['INFANTRY', 'CAVALRY']],
    band: ['Bando II · em marcha · avistado agora', 'Composição real: Infantaria ×2, Cavalaria. Alvo previsto: Mikena. A linha tracejada mostra o próximo passo conhecido.', ['INFANTRY', 'CAVALRY']],
    pirate: ['Piratas · Barca de Patrulha', 'Avistada pela Frota. Navega só em Mar e Costa; pilha portos adjacentes (−2 Riqueza, 1 por porto por rodada).', ['COASTAL_VESSEL']],
    ghost: ['Último avistamento · rodada 7', 'Um Bando foi visto aqui. Não se sabe onde está agora: sem posição atual por causa da névoa.', ['INFANTRY']],
  };
  const hit = (k, x, y, label) => `<g class="ent" data-k="${k}" tabindex="0" role="button" aria-label="${esc(label)}" style="cursor:pointer"><circle cx="${f1(x)}" cy="${f1(y)}" r="27" fill="transparent"/></g>`;
  function map(sel, hexSel) {
    let s = `<svg viewBox="${viewBox(g, 8, matchMedia('(min-width:761px)').matches ? 56 : 0, matchMedia('(min-width:761px)').matches ? 70 : 0)}" role="img" aria-label="Mapa hexagonal da mesa"><defs>${arrowDefs('arA', '#e0724f')}</defs>${mapBase(g, (c, r) => !vis(c, r) && g.t(c, r) !== '?', DET, OCC)}${roadLayer(g, ROADS, CITYC, DET, OCC)}`;
    const P = k => g.xy(...own[k] || k);
    // trilha do Bando (intenção conhecida)
    s += pathLine(g, [[6, 1], [5, 2]], '#e0724f', { dash: '7 6', marker: 'arA', w: 2.6 });
    // cidades
    for (const [k, nm, lv, mood, o] of [['mikena', 'Mikena', 3, 4, { port: 3, fort: 1, districts: [{ d: 'MARITIME', b: ['PORT'] }, { d: 'COMMERCIAL', b: ['MARKET'] }] }], ['tirinto', 'Tirinto', 2, 1, {}]]) { const [x, y] = P(k); s += cityArt(x, y, lv, '#60a3e9', nm, mood, { R: g.S, ...o }) + hit(k, x, y, nm); }
    // exército (2 figuras próprias lado a lado)
    let [x, y] = P('army'); s += ownFigure('INFANTRY', x - 11, y + 2, 28, 2) + ownFigure('CAVALRY', x + 11, y + 4, 28) + hit('army', x, y, 'Exército próprio');
    [x, y] = P('pioneer'); s += ownFigure('PIONEER', x, y, 28) + hit('pioneer', x, y, 'Pioneiro');
    [x, y] = P('fleet'); s += ownFigure('FLEET', x, y, 30) + hit('fleet', x, y, 'Frota');
    // ameaças: acampamento (memória), bando visível, pirata visível, último avistamento
    [x, y] = g.xy(7, 0); s += `<g opacity=".78">${campArt(x, y, 'active')}</g><circle cx="${f1(x)}" cy="${f1(y + 4)}" r="31" fill="none" stroke="#b4533c" stroke-dasharray="4 5" stroke-width="1.2" opacity=".7"/>` + hit('camp', x, y, 'Acampamento');
    [x, y] = g.xy(6, 1); s += threatFigure('INFANTRY', x - 10, y + 2, 26, 2) + threatFigure('CAVALRY', x + 11, y + 4, 26) + hit('band', x, y, 'Bando II');
    [x, y] = g.xy(1, 5); s += threatFigure('COASTAL_VESSEL', x, y, 30) + hit('pirate', x, y, 'Piratas');
    [x, y] = g.xy(8, 3); s += threatFigure('INFANTRY', x, y, 24, 0, { ghost: true }) + `<text x="${f1(x)}" y="${f1(y + 27)}" text-anchor="middle" font-family="Source Sans 3,sans-serif" font-size="9" font-weight="700" fill="#e0a08f">visto R7</text>` + hit('ghost', x, y, 'Último avistamento');
    if (sel) { const q = sel === 'camp' ? g.xy(7, 0) : sel === 'band' ? g.xy(6, 1) : sel === 'pirate' ? g.xy(1, 5) : sel === 'ghost' ? g.xy(8, 3) : P(sel); s += `<circle cx="${f1(q[0])}" cy="${f1(q[1])}" r="33" fill="none" stroke="#c9a867" stroke-width="2.4" stroke-dasharray="6 4"/>`; }
    if (hexSel) { const [hx, hy] = g.xy(...hexSel); s += `<polygon points="${g.pts(...hexSel, 1)}" fill="none" stroke="#c9a867" stroke-width="3" stroke-dasharray="6 4" pointer-events="none"/>`; }
    return s + '</svg>';
  }
  const pips = (n, u) => Array.from({ length: n }, (_, i) => `<svg width="12" height="12" viewBox="-6 -6 12 12" aria-hidden="true"><path d="M0 -5.5 L4.8 -2.7 V2.7 L0 5.5 L-4.8 2.7 V-2.7Z" fill="${i < u ? '#c9a867' : 'none'}" stroke="#c9a867" stroke-width="1.2"/></svg>`).join('');
  const wheels = (n, u) => Array.from({ length: n }, (_, i) => `<svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true"><circle r="5.6" fill="${i < u ? '#7fd0c4' : 'none'}" stroke="#7fd0c4" stroke-width="1.3"/><path d="M0 -5.6V5.6M-5.6 0H5.6" stroke="${i < u ? '#0b1114' : '#7fd0c4'}" stroke-width="1"/></svg>`).join('');
  $('#stripA').innerHTML = `${sealCiv(28)}<span class="civname">Leontia</span>
    <button class="pill" data-pop="leader" aria-label="Líder Agamenon: abrir passiva e poder">${portrait(26)}Agamenon</button>
    <span class="pill">Era II</span><span class="pill">Rodada 9/21</span><span class="pill ok">Planejamento</span><span class="sp"></span>
    <button class="pill bad" data-pop="revolt">Revolta 1</button><button class="pill warn" data-pop="hunger">Fome 1</button><button class="pill warn" data-pop="upkeep">Manutenção −1 Metal</button><button class="pill" data-pop="todo">Pendências 3</button>`;
  $('#trayA').innerHTML = `${resBar('food', 12, 3, 15)}${resBar('wood', 8, 0, 15)}${resBar('stone', 4, -1, 15)}${resBar('metal', 2, -1, 15)}${resBar('wealth', 9, 2, 15)}${resBar('culture', 3, -2, 15)}${resBar('knowledge', 5, 1, 15)}${resBar('influence', 15, 0, 15)}<span class="sp"></span>
    <span class="pill" title="Ordens globais da civilização">Ordens ${pips(5, 3)} 3/5</span><span class="pill" title="Ativações da cidade selecionada">Mikena ${wheels(2, 1)} 1/2</span><button class="go">Confirmar planejamento</button>`;
  const POP = {
    leader: ['Agamenon · Líder', 'Passiva e Poder 1×/Era aparecem aqui, lidos do motor. Poder disponível nesta Era.'],
    revolt: ['Revolta · Tirinto', 'Ânimo 1/6: a cidade não produz. Governar custa 1 Cultura ou 2 Riqueza por nível; a Recuperação emergencial é grátis (1× por episódio) e leva o Ânimo a 4.'],
    hunger: ['Fome · Tirinto', 'Alimento 3, sustento previsto 4. Sem mudança, perde 1 habitante e 1 Ânimo na manutenção.'],
    upkeep: ['Manutenção', 'Metal 2, manutenção militar prevista 3. Peça sem manutenção custa −1 Ânimo em todas as cidades.'],
    todo: ['3 pendências', 'Mikena sem ação (não produz) · Tirinto sem ação · Pioneiro ocioso.'],
  };
  const pop = $('#popA');
  $('#stripA').addEventListener('click', e => { const b = e.target.closest('[data-pop]'); if (!b) return; const k = b.dataset.pop; if (!pop.hidden && pop.dataset.k === k) { pop.hidden = true; return; } pop.dataset.k = k; pop.innerHTML = `<b>${POP[k][0]}</b>${POP[k][1]}`; pop.hidden = false; });
  $('#legA').innerHTML = `<span><svg viewBox="-16 -16 32 32">${pieceArt('INFANTRY', '#60a3e9', 28)}</svg>Peça própria: cor do assento</span><span><svg viewBox="-16 -16 32 32">${threatFigure('INFANTRY', 0, 0, 26)}</svg>Ameaça: base de ferro angular</span><span><svg viewBox="-20 -20 40 40">${hexArt(new Grid(['c'], 14), 0, 0, 'c').replace('data-hex', 'x')}</svg>Costa: pisa-se</span><span><svg viewBox="-20 -20 40 40">${hexArt(new Grid(['s'], 14), 0, 0, 's').replace('data-hex', 'x')}</svg>Mar: só navios</span><span><svg viewBox="-16 -16 32 32">${moodSeal(4, 28, false)}</svg>Anel de Ânimo na cidade</span>`;
  function show(k) {
    const [t, d, kinds] = INFO[k];
    const cluster = kinds.length ? `<svg width="${kinds.length * 36}" height="34" viewBox="0 0 ${kinds.length * 36} 34">${kinds.map((kd, i) => `<g transform="translate(${i * 36 + 18} 18)">${(k === 'camp' || k === 'band' || k === 'pirate' || k === 'ghost') ? threatFigure(kd, 0, 0, 26) : pieceArt(kd, '#60a3e9', 26)}</g>`).join('')}</svg>` : '';
    $('#infoA').innerHTML = `<b>${esc(t)}</b><div class="row">${cluster}<span>${esc(d)}</span></div>`;
    $('#mapA').innerHTML = map(k);
  }
  function showHex(c, r) {
    const t = g.t(c, r), det = DET[c + ',' + r] || {}, [nm, mv, yl] = TERR_INFO[t];
    const lines = [mv, yl, ...(det.feat || []).map(f => FEAT_INFO[f][0] + ': ' + FEAT_INFO[f][1]), ...(det.imp ? [IMP_INFO[det.imp][0] + ': ' + IMP_INFO[det.imp][1]] : []), ROADS.includes(c + ',' + r) ? 'Estrada: movimento 1 para peças terrestres; liga aos hexes vizinhos com estrada ou cidade, nas 6 direções.' : null, det.owner ? 'Território de Leontia.' : 'Sem dono.'].filter(Boolean);
    const one = new Grid([t === '?' ? '?' : t], 30);
    $('#infoA').innerHTML = `<b>${esc(nm)}${det.imp ? ' · ' + esc(IMP_INFO[det.imp][0]) : ''}</b><div class="row"><svg width="64" height="64" viewBox="-34 -34 68 68">${hexArt(one, 0, 0, t === '?' ? '?' : t, false, det)}</svg><span>${lines.map(esc).join('<br>')}</span></div>`;
    $('#mapA').innerHTML = map(null, [c, r]);
  }
  $('#mapA').addEventListener('click', e => { const n = e.target.closest('.ent'); if (n) { show(n.dataset.k); return; } const h = e.target.closest('[data-hex]'); if (h) { const [c, r] = h.dataset.hex.split(',').map(Number); showHex(c, r); } });
  $('#mapA').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { const n = e.target.closest('.ent'); if (n) { e.preventDefault(); show(n.dataset.k); } } });
  show('band');
  const cat = (kind, title, t, det, sub) => { const one = new Grid([t], 34); return `<figure><svg viewBox="-38 -40 76 80" role="img" aria-label="${esc(title)}">${hexArt(one, 0, 0, t, false, det)}</svg><figcaption><span class="kind">${kind}</span><b>${esc(title)}</b>${esc(sub)}</figcaption></figure>`; };
  $('#terrA').innerHTML = ['p', 'f', 'h', 'm', 'c', 's'].map(t => cat('Terreno', TERR_INFO[t][0], t, null, TERR_INFO[t][1].replace('Custo de movimento ', 'mov. ').replace(' (conta como terra)', '').replace('Águas rasas: custo de movimento 1, pisa-se como terra e navios também passam', 'águas rasas · mov. 1 · pisa-se'))).join('')
    + [['RIVER', 'p'], ['FERTILE', 'p'], ['TIMBER', 'f'], ['STONE', 'h'], ['METAL', 'm'], ['FISH', 'c'], ['SHOAL', 's']].map(([f, t]) => cat('Recurso', FEAT_INFO[f][0], t, { feat: [f] }, 'em ' + TERR_INFO[t][0])).join('')
    + [['FARM', 'p'], ['LUMBER_CAMP', 'f'], ['QUARRY', 'h'], ['MINE', 'm'], ['FISHERY', 'c'], ['ROAD', 'p']].map(([i, t]) => cat('Melhoria', IMP_INFO[i][0], t, { imp: i, owner: '#60a3e9' }, IMP_INFO[i][1])).join('')
    + `<figure><svg viewBox="-38 -40 76 80" role="img" aria-label="Pesca de frota">${hexArt(new Grid(['s'], 34), 0, 0, 's', false, { feat: ['SHOAL'], fishing: true, owner: '#60a3e9' })}<g transform="translate(0 -2)">${ownFigure('FLEET', 0, 0, 28)}</g></svg><figcaption><span class="kind">Pesca de frota</span><b>Navio sobre o cardume</b>+2 Alimento (proposta)</figcaption></figure>`;
})();

/* ===== Cena B · Movimento coordenado ===== */
(function sceneB() {
  const g = new Grid(['sccpfhmh', 'scppffhm', 'sccppphh', 'sscppfpp', 'sssccppp'], 40);
  const U0 = { u1: { kind: 'INFANTRY', mov: 2, cell: [3, 2] }, u2: { kind: 'INFANTRY', mov: 2, cell: [3, 2] }, u3: { kind: 'RANGED', mov: 2, cell: [3, 2] }, u4: { kind: 'CAVALRY', mov: 4, cell: [3, 2] }, u5: { kind: 'PIONEER', mov: 2, cell: [2, 3] } };
  const NAME = { u1: 'Infantaria A', u2: 'Infantaria B', u3: 'Atiradores', u4: 'Cavalaria', u5: 'Pioneiro' };
  const COLORS = ['#e6c173', '#7fd0c4', '#e79ab5'];
  let U, st;
  const key = ([c, r]) => c + ',' + r;
  function reset() { U = JSON.parse(JSON.stringify(U0)); st = { bonus: false, mode: 'pieces', sel: [], legs: [], done: null, msg: '', anim: null }; }
  reset();
  const budget = ids => Math.min(...ids.map(i => U[i].mov)) + (st.bonus ? 2 : 0);
  const base = ids => Math.min(...ids.map(i => U[i].mov));
  const inLegs = id => st.legs.findIndex(l => l.ids.includes(id));
  const usedPieces = () => st.legs.reduce((a, l) => a + l.ids.length, 0);
  const full = (extraPieces, extraLegs) => st.mode === 'pieces' ? usedPieces() + extraPieces > 3 : st.legs.length + extraLegs > 3;
  function occupants(cell) { return Object.entries(U).filter(([, u]) => key(u.cell) === key(cell)).map(([id]) => id); }
  function selReach() { if (!st.sel.length) return null; const o = U[st.sel[0]].cell; return { o, ...g.reach(o, budget(st.sel) + (st.bonus ? 0 : 2)) }; }
  function draw() {
    const R = selReach();
    let s = `<svg viewBox="${viewBox(g, 10)}" role="img" aria-label="Mapa de movimento coordenado"><defs>${COLORS.map((c, i) => arrowDefs('arB' + i, c)).join('')}</defs>${mapBase(g, null, null, new Set([...Object.values(U).map(u => key(u.cell)), ...st.legs.map(l => key(l.dest))]))}`;
    if (R) {
      const b = budget(st.sel), bb = base(st.sel);
      for (const k of Object.keys(R.cost)) {
        const [c, r] = k.split(',').map(Number), cost = R.cost[k]; if (k === key(R.o)) continue;
        const [x, y] = g.xy(c, r), inBase = cost <= bb, inBonus = cost > bb && cost <= bb + 2;
        if (cost > b && !(!st.bonus && inBonus)) continue;
        if (cost <= b) s += `<polygon points="${g.pts(c, r, .94)}" fill="${inBase ? '#c9a867' : '#7fd0c4'}" fill-opacity="${inBase ? .26 : .3}" stroke="${inBase ? '#e6c173' : '#7fd0c4'}" stroke-width="2"/><text x="${f1(x + 0)}" y="${f1(y + 29)}" text-anchor="middle" font-family="Source Sans 3,sans-serif" font-weight="700" font-size="11" fill="${inBase ? '#f4e2b0' : '#bff1e9'}">${cost}${inBase ? '' : ' · +2'}</text>`;
        else s += `<polygon points="${g.pts(c, r, .94)}" fill="none" stroke="#7fd0c4" stroke-width="1.6" stroke-dasharray="2 5" opacity=".8"/><text x="${f1(x)}" y="${f1(y + 29)}" text-anchor="middle" font-family="Source Sans 3,sans-serif" font-weight="700" font-size="10" fill="#7fd0c4" opacity=".85">${cost} · com carta</text>`;
      }
      const [ox, oy] = g.xy(...R.o); s += `<polygon points="${g.pts(...R.o, 1.02)}" fill="none" stroke="#fff" stroke-width="2.2" stroke-dasharray="5 4"/>`;
    }
    st.legs.forEach((l, i) => {
      s += pathLine(g, l.path, COLORS[i], { w: 3.2, marker: 'arB' + i, dots: true });
      const [dx, dy] = g.xy(...l.dest); const idx = st.legs.slice(0, i).filter(o => key(o.dest) === key(l.dest)).reduce((a, o) => a + o.ids.length, 0);
      l.ids.forEach((id, j) => { s += ownFigure(U[id].kind, dx - 10 + (idx + j) * 11, dy + 4, 22, 0, '#60a3e9', { ghost: true }); });
      s += `<g transform="translate(${f1(dx + 20)} ${f1(dy - 22)})"><rect x="-22" y="-8" width="44" height="16" rx="8" fill="#0f181c" stroke="${COLORS[i]}" stroke-width="1.4"/><text text-anchor="middle" y="4" font-family="Source Sans 3,sans-serif" font-weight="700" font-size="10.5" fill="#f4ecd8">${i + 1} · ${l.cost}/${l.budget}</text></g>`;
    });
    // peças (posição atual ou animada)
    const byCell = {};
    for (const [id, u] of Object.entries(U)) (byCell[key(u.cell)] ||= []).push(id);
    for (const [k, ids] of Object.entries(byCell)) {
      const [c, r] = k.split(',').map(Number), [x, y] = g.xy(c, r);
      ids.forEach((id, i) => {
        if (st.anim && st.anim[id]) return;
        const many = ids.length > 1, off = many ? [[-11, -7], [11, -7], [-11, 11], [11, 11]][i % 4] : [0, 3], px = many ? 22 : 28;
        const li = inLegs(id), moved = li >= 0, sel = st.sel.includes(id);
        s += `<g opacity="${moved ? .55 : 1}">${ownFigure(U[id].kind, x + off[0], y + off[1], px)}</g>`;
        if (sel) s += `<circle cx="${f1(x + off[0])}" cy="${f1(y + off[1])}" r="${px * .72}" fill="none" stroke="#fff" stroke-width="2"/>`;
        if (moved) s += `<g transform="translate(${f1(x + off[0] + px * .45)} ${f1(y + off[1] - px * .5)})"><circle r="7" fill="${COLORS[li]}" stroke="${INK}" stroke-width="1.2"/><text text-anchor="middle" y="3.6" font-family="Source Sans 3,sans-serif" font-weight="700" font-size="10" fill="${INK}">${li + 1}</text></g>`;
      });
    }
    if (st.anim) for (const [id, p] of Object.entries(st.anim)) s += ownFigure(U[id].kind, p[0], p[1], 26);
    s += Array.from({ length: g.R }, (_, r) => Array.from({ length: g.C }, (_, c) => `<polygon data-hex="${c},${r}" points="${g.pts(c, r)}" fill="transparent" style="cursor:pointer"/>`).join('')).join('');
    return s + '</svg>';
  }
  function panel() {
    const cap = st.mode === 'pieces' ? `${usedPieces()}/3 peças` : `${st.legs.length}/3 trajetos`;
    const chips = Object.keys(U).map(id => { const li = inLegs(id); return `<button class="chip-u" data-u="${id}" aria-pressed="${st.sel.includes(id)}" ${st.done ? 'disabled' : ''}><svg viewBox="-16 -16 32 32">${pieceArt(U[id].kind, '#60a3e9', 26)}</svg><span>${NAME[id]}<br><span class="n">${li >= 0 ? 'na Ordem #' + (li + 1) : 'livre · mov ' + (U[id].mov + (st.bonus ? 2 : 0))}</span></span></button>`; }).join('');
    const legs = st.legs.length ? `<table class="mini"><tr><th>#</th><th>Peças</th><th>Destino</th><th>Custo</th><th></th></tr>${st.legs.map((l, i) => `<tr><td style="color:${COLORS[i]}"><b>${i + 1}</b></td><td>${l.ids.map(x => NAME[x]).join(', ')}</td><td>${TER[g.t(...l.dest)].n}</td><td>${l.cost}/${l.budget} <span class="mute">resta ${l.budget - l.cost}</span></td><td>${st.done ? '' : `<button class="ghost" data-rm="${i}" aria-label="Remover trajeto ${i + 1}">✕</button>`}</td></tr>`).join('')}</table>` : `<span class="mute">Nenhuma peça na Ordem. Escolha peças e toque num destino iluminado.</span>`;
    const res = st.done ? `<div class="applied"><b class="ok">Resultado aplicado</b>${st.done.map((l, i) => `<span>${i + 1} · ${l.ids.map(x => NAME[x]).join(', ')} chegou a ${TER[g.t(...l.dest)].n}, custou ${l.cost} de ${l.budget} <span class="ok">✓ igual ao previsto</span></span>`).join('')}<span class="mute">Ordem consumida uma vez: Expedição, Ordens 3/5 → 4/5.</span></div>` : `<div class="pred"><span class="cap">Previsto</span><span>Ordens da civilização <b>3/5 → ${st.legs.length ? '4/5' : '3/5'}</b> · uma Ordem de Expedição, sem custo de recurso</span><span class="mute">Cada trajeto paga terreno e alcance da própria peça; o bônus vale para todas.</span></div>`;
    $('#panelB').innerHTML = `<h4>Ordem de Mover</h4>
      <div class="row"><span class="pill ${full(0, 0) ? 'warn' : ''}">${cap}</span><div class="seg" role="group" aria-label="Limite da regra"><button data-mode="pieces" aria-pressed="${st.mode === 'pieces'}">3 peças</button><button data-mode="legs" aria-pressed="${st.mode === 'legs'}">3 trajetos</button></div></div>
      <p class="mute" style="font-size:12.5px">${st.mode === 'pieces' ? 'Leitura literal: pilha de 4 peças já não anda junta numa só Ordem. Isso é uma regressão militar.' : 'Pilha andando junta conta como 1 trajeto, então não há regressão. Até 3 destinos por Ordem.'}</p>
      <label class="sw"><input type="checkbox" id="bonusB" ${st.bonus ? 'checked' : ''} ${st.done ? 'disabled' : ''}> Carta Marcha Orientada: +2 de movimento nesta rodada</label>
      <div class="cap">Peças (toque para escolher; várias da mesma origem andam juntas)</div><div class="row">${chips}</div>
      <div class="cap">Trajetos da Ordem</div>${legs}
      <div class="toast" role="status">${esc(st.msg)}</div>${res}
      <div class="row"><button class="go" id="okB" ${!st.legs.length || st.done ? 'disabled' : ''}>Confirmar Ordem</button><button class="ghost" id="clrB">${st.done ? 'Novo planejamento' : 'Limpar'}</button></div>`;
  }
  function render() { $('#mapB').innerHTML = draw(); panel(); }
  $('#legB').innerHTML = `<span><svg viewBox="-20 -20 40 40"><polygon points="${new Grid(['p'], 14).pts(0, 0)}" transform="translate(0 0)" fill="#c9a867" fill-opacity=".35" stroke="#e6c173" stroke-width="1.4"/></svg>Alcance base (número = custo de terreno)</span><span><svg viewBox="-20 -20 40 40"><polygon points="${new Grid(['p'], 14).pts(0, 0)}" fill="#7fd0c4" fill-opacity=".35" stroke="#7fd0c4" stroke-width="1.4"/></svg>Alcançado só pelo +2</span><span><svg viewBox="-20 -20 40 40"><polygon points="${new Grid(['p'], 14).pts(0, 0)}" fill="none" stroke="#7fd0c4" stroke-dasharray="2 4" stroke-width="1.4"/></svg>Alcançaria com a carta</span><span>Planície 1 · Costa 1 · Floresta/Colinas 2 · Montanha 3 · Mar: fechado para terra</span>`;
  function setLeg(dest) {
    const R = selReach(), k = key(dest), ids = [...st.sel];
    if (key(dest) === key(R.o)) { st.msg = 'A peça já está nesse hex.'; return; }
    const b = budget(ids);
    if (R.cost[k] === undefined || R.cost[k] > b) {
      const t = g.t(...dest);
      if (t === 's') st.msg = 'Mar: peças terrestres não entram. Costa sim; navios navegam o Mar.';
      else { const far = g.reach(R.o, 99).cost[k]; st.msg = far === undefined ? 'Sem caminho para esse hex.' : `Alcance insuficiente: o caminho mais barato custa ${far}, o grupo tem ${b}.` + (st.bonus ? '' : far <= b + 2 ? ' Com a carta +2 alcança.' : ' Nem com a carta +2.'); }
      return;
    }
    const others = st.legs.map(l => ({ ...l, ids: l.ids.filter(i => !ids.includes(i)) })).filter(l => l.ids.length);
    const prevLegs = st.legs; st.legs = others;
    if (full(ids.length, 1)) { st.legs = prevLegs; st.msg = st.mode === 'pieces' ? 'Limite de playtest: 3 peças por Ordem. Remova uma peça antes.' : 'Limite de playtest: 3 trajetos por Ordem. Remova um trajeto antes.'; return; }
    st.legs.push({ ids, dest, path: g.path(R.prev, R.o, dest), cost: R.cost[k], budget: b });
    st.sel = []; st.msg = '';
  }
  $('#mapB').addEventListener('click', e => {
    if (st.done) return; const h = e.target.closest('[data-hex]'); if (!h) return; const cell = h.dataset.hex.split(',').map(Number);
    if (st.sel.length) { setLeg(cell); render(); return; }
    const occ = occupants(cell).filter(i => inLegs(i) < 0);
    if (occ.length === 1) { st.sel = occ; st.msg = ''; } else st.msg = occ.length > 1 ? 'Pilha: escolha as peças nos botões ao lado.' : 'Escolha uma peça para mover.';
    render();
  });
  $('#panelB').addEventListener('click', e => {
    const u = e.target.closest('[data-u]'), rm = e.target.closest('[data-rm]'), md = e.target.closest('[data-mode]');
    if (u && !st.done) {
      const id = u.dataset.u; const i = inLegs(id);
      if (i >= 0) { const l = st.legs[i]; l.ids = l.ids.filter(x => x !== id); if (!l.ids.length) st.legs.splice(i, 1); st.sel = []; st.msg = 'Peça retirada da Ordem.'; }
      else if (st.sel.includes(id)) st.sel = st.sel.filter(x => x !== id);
      else if (st.sel.length && key(U[st.sel[0]].cell) !== key(U[id].cell)) { st.sel = [id]; st.msg = 'Origens diferentes viram trajetos separados: escolhi só esta peça.'; }
      else { st.sel.push(id); st.msg = ''; }
      render();
    }
    if (rm) { st.legs.splice(+rm.dataset.rm, 1); st.msg = ''; render(); }
    if (md) { st.mode = md.dataset.mode; st.legs = []; st.sel = []; st.msg = 'Limite trocado; a Ordem foi limpa para comparar.'; render(); }
    if (e.target.id === 'clrB') { if (st.done) reset(); else { st.legs = []; st.sel = []; st.msg = ''; } render(); }
    if (e.target.id === 'okB') confirm();
  });
  $('#panelB').addEventListener('change', e => { if (e.target.id === 'bonusB') { st.bonus = e.target.checked; st.legs = []; st.sel = []; st.msg = st.bonus ? 'Bônus +2 ativo: os trajetos foram recalculados, replaneje.' : ''; render(); } });
  function confirm() {
    const legs = st.legs.map(l => ({ ...l })), reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    const finish = () => { legs.forEach(l => l.ids.forEach(id => { U[id].cell = l.dest; })); st.legs = legs; st.done = legs; st.anim = null; st.sel = []; st.msg = ''; render(); };
    if (reduce) return finish();
    const t0 = performance.now(), T = 1100;
    const pts = {}; legs.forEach(l => l.ids.forEach((id, j) => { pts[id] = { cells: l.path.map(c => g.xy(...c)), j }; }));
    st.legs = []; st.msg = 'Resolvendo a Ordem…'; panel();
    (function tick(now) {
      const t = Math.min(1, (now - t0) / T); st.anim = {};
      for (const [id, p] of Object.entries(pts)) { const f = t * (p.cells.length - 1), i = Math.min(p.cells.length - 2, Math.floor(f)), a = p.cells[i], b = p.cells[i + 1], u = f - i; st.anim[id] = [a[0] + (b[0] - a[0]) * u + p.j * 6, a[1] + (b[1] - a[1]) * u]; }
      $('#mapB').innerHTML = draw();
      if (t < 1) requestAnimationFrame(tick); else finish();
    })(t0);
  }
  render();
})();
