/* ===== Cena D · Economia e cidade ===== */
(function sceneD() {
  const pips = (n, u) => Array.from({ length: n }, (_, i) => `<svg width="13" height="13" viewBox="-6 -6 12 12" aria-hidden="true"><path d="M0 -5.5 L4.8 -2.7 V2.7 L0 5.5 L-4.8 2.7 V-2.7Z" fill="${i < u ? '#c9a867' : 'none'}" stroke="#c9a867" stroke-width="1.2"/></svg>`).join('');
  const wheels = (n, u) => Array.from({ length: n }, (_, i) => `<svg width="16" height="16" viewBox="-7 -7 14 14" aria-hidden="true"><circle r="5.6" fill="${i < u ? '#7fd0c4' : 'none'}" stroke="#7fd0c4" stroke-width="1.3"/><path d="M0 -5.6V5.6M-5.6 0H5.6" stroke="${i < u ? '#0b1114' : '#7fd0c4'}" stroke-width="1"/></svg>`).join('');
  $('#framesD').innerHTML = '<div class="panel" id="dEco"></div><div class="panel" id="dGov"></div><div class="panel" id="dRec"></div><div class="panel" id="dMood"></div>';

  /* D1 · Produção, consumo, fome, Ordens × ativações */
  const eco = { scn: 'prod', stock: 12 };
  function renderEco() {
    const prod = eco.scn === 'prod', gain = prod ? 7 : 0, sust = 4, grow = 3;
    let end = eco.stock + gain - sust; const famine = end < 0; const willGrow = !famine && end >= grow; if (willGrow) end -= grow;
    const rows = [['food', 'Fazenda ×2 e Moinho', 5, 0], ['food', 'Frota pescando cardume (Porto)', 2, 0], ['wood', 'Floresta trabalhada', 2, 2], ['stone', 'Colina', 1, 0], ['wealth', 'Mercado', 2, 0]];
    $('#dEco').innerHTML = `<h4>Mikena · Produção e consumo</h4>
      <div class="row"><svg width="92" height="76" viewBox="-40 -34 80 70" aria-hidden="true">${cityArt(0, 4, 3, '#60a3e9', 'Mikena', 4, { R: 26, label: false, port: 3, districts: [{ d: 'MARITIME', b: ['PORT'] }, { d: 'COMMERCIAL', b: ['MARKET'] }] })}</svg>${moodSeal(4, 40)}<span><b>Estável</b> · 8 habitantes<br><span class="mute">Capacidade 2 · 3 hexes produtivos</span></span></div>
      <div class="row" style="gap:16px"><span title="Limite global da civilização" class="pill">Ordens da civilização ${pips(5, 3)} 3/5</span><span title="Limite desta cidade" class="pill">Ativações de Mikena ${wheels(2, 1)} 1/2</span></div>
      <p class="mute" style="font-size:12.5px">Selos hexagonais dourados são Ordens (valem para toda a civilização). Rodas verde-água são ativações (valem só nesta cidade).</p>
      <div class="seg" role="group" aria-label="Plano da cidade"><button data-s="prod" aria-pressed="${prod}">Produzir</button><button data-s="gov" aria-pressed="${eco.scn === 'gov'}">Governar</button><button data-s="build" aria-pressed="${eco.scn === 'build'}">Construir</button></div>
      <div class="seg" role="group" aria-label="Alimento em estoque"><button data-k="12" aria-pressed="${eco.stock === 12}">Alimento 12</button><button data-k="3" aria-pressed="${eco.stock === 3}">Alimento 3</button></div>
      <table class="mini"><tr><th>Recurso</th><th>De onde</th><th>Rende</th><th>Perdido</th></tr>${rows.map(r => `<tr><td>${resIcon(r[0])}</td><td>${r[1]}</td><td class="${prod ? 'ok' : 'mute'}">${prod ? '+' + r[2] : '0'}</td><td class="${r[3] ? 'warn' : 'mute'}">${r[3] ? '−' + r[3] + ' (hex sem trabalhador)' : '-'}</td></tr>`).join('')}</table>
      <div class="band on"><span class="cap">Alimento ao fim da rodada</span>
        <span>${eco.stock} atual ${prod ? '<b class="ok">+' + gain + '</b> produção ' : ''}<b class="bad">−4</b> sustento (8 hab ÷ 2) ${willGrow ? '<b class="bad">−3</b> crescer (+1 hab)' : ''} = <b class="${famine ? 'bad' : 'ok'}">${end}</b></span>
        ${famine ? `<span class="bad">Fome: perde 1 habitante e 1 Ânimo (4 → 3). Produza ou reduza o consumo.</span>` : willGrow ? '<span class="ok">Sem risco. A cidade cresce para 9 habitantes.</span>' : '<span class="ok">Sem risco de fome.</span>'}</div>`;
  }
  $('#dEco').addEventListener('click', e => { const s = e.target.closest('[data-s]'), k = e.target.closest('[data-k]'); if (s) eco.scn = s.dataset.s; if (k) eco.stock = +k.dataset.k; renderEco(); });
  renderEco();

  /* D2 · Governar com escolha */
  const gv = { mood: 1, lv: 2, pay: 'culture', before: false, done: false };
  const CAP = 2;
  function maxLv() { return Math.min(CAP, 6 - gv.mood); }
  function renderGov() {
    const mx = maxLv(); if (gv.lv > mx) gv.lv = mx;
    const unit = gv.pay === 'culture' ? 1 : 2, total = gv.lv * unit, key = gv.pay === 'culture' ? 'culture' : 'wealth';
    const have = gv.pay === 'culture' ? 3 : 9, reserved = gv.before && gv.pay === 'culture' ? 2 : 0, avail = have - reserved;
    const after = gv.mood + gv.lv, bl = [];
    if (gv.mood >= 6) bl.push('Ânimo já é 6 (Próspera): Governar não tem efeito.');
    else if (gv.lv === 0) bl.push('Escolha ao menos 1 nível. Sem efeito, a Ordem seria desperdiçada.');
    if (gv.lv > 0 && total > avail) bl.push(`${RESK[key][1]} insuficiente na resolução: saldo ${avail}${reserved ? ` (2 reservadas para Construir Templo)` : ''}, precisa ${total}.` + (gv.pay === 'culture' ? ` Riqueza cobriria (${gv.lv * 2} de 9).` : ''));
    $('#dGov').innerHTML = `<h4>Tirinto · Governar</h4>
      <div class="row"><div class="seg" role="group" aria-label="Ânimo atual">${[1, 2, 4, 6].map(m => `<button data-m="${m}" aria-pressed="${gv.mood === m}">${m} ${moodName(m)}</button>`).join('')}</div></div>
      <div class="row" style="justify-content:center;gap:14px"><div style="text-align:center">${moodSeal(gv.mood, 54)}<div class="cap">${moodName(gv.mood)}</div></div><span style="font-size:26px;color:var(--b-brass)" aria-hidden="true">→</span><div style="text-align:center">${moodSeal(Math.min(6, after), 54)}<div class="cap">${moodName(Math.min(6, after))}</div></div></div>
      <div class="row"><span class="cap">Níveis a recuperar</span><button class="ghost" data-lv="-1" aria-label="Menos um nível" ${gv.lv <= 0 ? 'disabled' : ''}>−</button><b style="min-width:2ch;text-align:center">${gv.lv}</b><button class="ghost" data-lv="1" aria-label="Mais um nível" ${gv.lv >= mx ? 'disabled' : ''}>+</button><span class="mute">de ${mx} possíveis (Capacidade real ${CAP}, também em Revolta)</span></div>
      <div class="row"><div class="seg" role="group" aria-label="Pagar com"><button data-p="culture" aria-pressed="${gv.pay === 'culture'}">Cultura (1/nível)</button><button data-p="wealth" aria-pressed="${gv.pay === 'wealth'}">Riqueza (2/nível)</button></div><label class="sw"><input type="checkbox" id="befG" ${gv.before ? 'checked' : ''}> Construir Templo planejado antes</label></div>
      <div class="band ${bl.length ? 'nob' : 'okb'}"><span class="cap">Elegibilidade</span>${bl.length ? bl.map(b => `<span class="bad">✗ ${esc(b)}</span>`).join('') : '<span class="ok">✓ Pode agir</span>'}</div>
      <div class="band on"><span class="cap">Custo total</span><div class="costs">${chipCost(key, total, have, have - total)}<span class="cost">Ordem Cidade 3/5 → 4/5</span><span class="cost">Ativação 0/1 → 1/1</span></div>${gv.pay === 'culture' && gv.lv > 0 ? `<span class="mute" style="font-size:12.5px">Reservado ao confirmar: ${total} Cultura. Saldo na resolução: ${Math.max(0, avail - total)}.</span>` : ''}</div>
      ${gv.mood <= 1 ? `<div class="band"><span class="cap">Recuperação emergencial</span><span>Grátis, leva o Ânimo a 4 (Estável), uma vez por episódio de Revolta.</span><div class="row"><span class="pill ok">Ânimo 1 → 4</span><span class="pill">sem custo de recurso</span></div></div>` : ''}
      ${gv.done ? `<div class="applied"><b class="ok">Resultado aplicado</b><span>Ânimo ${gv.mood} → ${Math.min(6, after)} <span class="ok">✓ igual ao previsto</span></span><span>${RESK[key][1]} −${total} <span class="ok">✓</span></span></div>` : ''}
      <div class="row"><button class="go" id="okG" ${bl.length || gv.done ? 'disabled' : ''}>${gv.lv === 0 ? 'Sem efeito' : `Confirmar Governar · ${gv.lv} ${gv.lv > 1 ? 'níveis' : 'nível'}`}</button>${gv.done ? '<button class="ghost" id="rstG">Refazer</button>' : ''}</div>`;
  }
  $('#dGov').addEventListener('click', e => {
    const m = e.target.closest('[data-m]'), l = e.target.closest('[data-lv]'), p = e.target.closest('[data-p]');
    if (m) { gv.mood = +m.dataset.m; gv.lv = maxLv(); gv.done = false; }
    if (l) { gv.lv = Math.max(0, Math.min(maxLv(), gv.lv + +l.dataset.lv)); gv.done = false; }
    if (p) { gv.pay = p.dataset.p; gv.done = false; }
    if (e.target.id === 'okG') gv.done = true;
    if (e.target.id === 'rstG') gv.done = false;
    renderGov();
  });
  $('#dGov').addEventListener('change', e => { if (e.target.id === 'befG') { gv.before = e.target.checked; gv.done = false; renderGov(); } });
  renderGov();

  /* D3 · Recrutar */
  const REC = { INFANTRY: { c: { food: 2, wood: 1 }, adv: null }, GUARD: { c: { stone: 2, metal: 1 }, adv: 'Formações de Guarda', own: true }, RANGED: { c: { wood: 2, metal: 1 }, adv: 'Metalurgia' }, CAVALRY: { c: { food: 3, metal: 2 }, adv: 'Treino de Manobras' }, SIEGE: { c: { wood: 3, metal: 3 }, adv: 'Engenharia' } };
  const STOCK = { food: 12, wood: 8, stone: 4, metal: 2 }, SOLD = 3;
  const rc = { kind: 'INFANTRY', qty: 2, done: false };
  function renderRec() {
    const d = REC[rc.kind], bl = [];
    if (d.adv && !d.own) bl.push(`Exige o avanço da Teia ${d.adv}.`);
    for (const [k, n] of Object.entries(d.c)) if (n * rc.qty > STOCK[k]) bl.push(`Faltam ${n * rc.qty - STOCK[k]} ${RESK[k][1]} (tem ${STOCK[k]}, precisa ${n * rc.qty}).`);
    if (rc.qty > SOLD) bl.push(`Faltam Soldados: ${SOLD} disponíveis, ${rc.qty} pedidos.`);
    const minis = Array.from({ length: rc.qty }, (_, i) => `<g transform="translate(${50 + i * 24} 28)">${pieceArt(rc.kind, '#60a3e9', 24)}</g>`).join('');
    $('#dRec').innerHTML = `<h4>Mikena · Recrutar</h4>
      <div class="row">${Object.keys(REC).map(k => `<button class="chip-u" data-k="${k}" aria-pressed="${rc.kind === k}"><svg viewBox="-16 -16 32 32">${pieceArt(k, '#60a3e9', 26)}</svg><span>${KIND_NAME[k]}</span></button>`).join('')}</div>
      <div class="row"><span class="cap">Quantidade</span><button class="ghost" data-q="-1" aria-label="Menos uma peça" ${rc.qty <= 1 ? 'disabled' : ''}>−</button><b style="min-width:2ch;text-align:center">${rc.qty}</b><button class="ghost" data-q="1" aria-label="Mais uma peça" ${rc.qty >= 4 ? 'disabled' : ''}>+</button><span class="mute">Soldados livres: ${SOLD}</span></div>
      <div class="band ${bl.length ? 'nob' : 'okb'}"><span class="cap">Elegibilidade</span>${bl.length ? bl.map(b => `<span class="bad">✗ ${esc(b)}</span>`).join('') : '<span class="ok">✓ Pode agir</span>'}<span class="mute">Distrito Militar ✓${d.adv ? (d.own ? ' · ' + d.adv + ' ✓' : '') : ''}</span></div>
      <div class="band on"><span class="cap">Custo (×${rc.qty})</span><div class="costs">${Object.entries(d.c).map(([k, n]) => chipCost(k, n * rc.qty, STOCK[k], STOCK[k] - n * rc.qty)).join('')}<span class="cost">Ordem Cidade</span><span class="cost">Ativação 1/2 → 2/2</span></div><span class="warn" style="font-size:13px">2ª ativação: −1 Ânimo (4 → 3). Manutenção futura: +${rc.qty} por rodada.</span></div>
      <div class="band"><span class="cap">${rc.done ? 'Resultado' : 'Previsto na cidade'}</span><svg viewBox="0 0 240 64" width="100%" style="max-width:300px;background:#121b20;border-radius:8px;border:${rc.done ? '1px solid #7fc79a' : '1px dashed #c9a867'}" aria-label="Peças recrutadas na cidade"><g opacity="${rc.done ? 1 : .6}">${cityArt(26, 30, 3, '#60a3e9', 'Mikena', 4, { R: 22, label: false })}${minis}</g></svg></div>
      <div class="row"><button class="go" id="okR" ${bl.length || rc.done ? 'disabled' : ''}>Confirmar Recrutar</button>${rc.done ? '<button class="ghost" id="rstR">Refazer</button>' : ''}</div><p class="mute" style="font-size:12px">Custos, avanços e Soldados são ilustrativos; no jogo vêm de <code>previewAction</code>.</p>`;
  }
  $('#dRec').addEventListener('click', e => {
    const k = e.target.closest('[data-k]'), q = e.target.closest('[data-q]');
    if (k) { rc.kind = k.dataset.k; rc.done = false; }
    if (q) { rc.qty = Math.max(1, Math.min(4, rc.qty + +q.dataset.q)); rc.done = false; }
    if (e.target.id === 'okR') rc.done = true;
    if (e.target.id === 'rstR') rc.done = false;
    renderRec();
  });
  renderRec();

  /* D4 · Ânimo */
  const MD = [[6, 'Próspera', 'Ânimo 5 a 6', '+1 Capacidade na 1ª ativação; 2 ativações. Anel dourado com raios e sorriso.'], [4, 'Estável', 'Ânimo 4', 'Funcionamento normal; 2 ativações. Anel verde liso.'], [2, 'Abalada', 'Ânimo 2 a 3', '−1 Capacidade; 1 ativação. Anel quebrado âmbar e sobrancelhas tensas.'], [1, 'Revolta', 'Ânimo 0 a 1', 'Não produz; só aceita Governar. Anel partido vermelho com faíscas.']];
  $('#dMood').innerHTML = `<h4>Ânimo urbano</h4><p class="mute" style="font-size:13px">Forma, cor e número dizem o mesmo. Funciona em escala de cinza e para daltonismo. Desenho próprio do AoH.</p>${MD.map(m => `<div class="row" style="flex-wrap:nowrap;align-items:flex-start">${moodSeal(m[0], 52)}<span><b>${m[1]}</b> <span class="mute">· ${m[2]}</span><br><span style="font-size:13px">${m[3]}</span></span></div>`).join('')}`;
})();

/* ===== Cena E · Ficha de Ação ===== */
(function sceneE() {
  const ACT = {
    produzir: {
      n: 'Produzir', who: 'Mikena', est: 'Mikena · N3 · Estável 4/6 · Ordens 3/5 · ativações 1/2',
      ok: ['Cidade livre, sem ocupação', 'Ativação disponível (1/2)', 'Ordem disponível (3/5)'],
      no: ['Sem ativação: Mikena já usou 2/2 nesta rodada. Escolha outra cidade ou espere a próxima.'],
      cost: [['cost', 'Ordem Cidade 3/5 → 4/5'], ['cost', 'Ativação 1/2 → 2/2']], warn: '2ª ativação: −1 Ânimo (4 → 3)',
      rows: [['food', '+5', ''], ['wood', '+2', 'perde −2: hex sem trabalhador'], ['stone', '+1', ''], ['wealth', '+2', '']], mood: '4 → 3',
    },
    governar: {
      n: 'Governar', who: 'Tirinto', est: 'Tirinto · N2 · Revolta 1/6 · Capacidade real 2 · ativações 0/1',
      ok: ['Níveis 1 a 2 disponíveis', 'Cultura suficiente (3)', 'Ordem disponível'],
      no: ['Cultura insuficiente: faltam 1 (tem 1, precisa 2). Riqueza cobriria: 4 de 9.'],
      cost: [['culture', 'Cultura 2 · 3 → 1'], ['cost', 'Ordem Cidade'], ['cost', 'Ativação 0/1 → 1/1']], warn: '',
      rows: [['', 'Ânimo 1 → 3', 'Revolta → Abalada: volta a produzir'], ['', '2 níveis', '']], mood: '',
    },
    mover: {
      n: 'Mover', who: '2 trajetos', est: 'Ordem de Mover · Infantaria A, Cavalaria · Ordens 3/5',
      ok: ['Infantaria A → Colinas: custo 2 de 2', 'Cavalaria → Planície: custo 3 de 4'],
      no: ['Pioneiro → Montanha: custa 3, o grupo tem 2. Com a carta +2 alcança.'],
      cost: [['cost', 'Ordem Expedição 3/5 → 4/5'], ['cost', 'sem custo de recurso']], warn: '',
      rows: [['', 'Trajeto 1 e 2 chegam nesta rodada', ''], ['', 'Sem Região fechada: sem risco de Perigo', '']], mood: '',
    },
    recrutar: {
      n: 'Recrutar', who: 'Mikena', est: 'Mikena · N3 · Soldados livres 3 · Metal 2',
      ok: ['Avanço Formações de Guarda ✓', 'Distrito Militar ✓', 'Soldados: 3 livres'],
      no: ['Exige o avanço Treino de Manobras (ver na Teia).', 'Faltam 2 Metal (tem 2, precisa 4).'],
      cost: [['stone', 'Pedra 4 · 4 → 0'], ['metal', 'Metal 2 · 2 → 0'], ['cost', 'Ordem Cidade']], warn: 'Manutenção futura +2 por rodada',
      rows: [['', 'Guarda ×2 aparecem em Mikena', ''], ['', 'Ocupam 2 Soldados', '']], mood: '',
    },
  };
  const FLOW = ['Estado', 'Elegibilidade', 'Custo', 'Prévia', 'Confirmar', 'Resultado'];
  const S = { a: 'produzir', s: 'allow' };
  $('#segAct').innerHTML = Object.entries(ACT).map(([k, v]) => `<button data-a="${k}">${v.n}</button>`).join('');
  $('#segState').innerHTML = [['allow', 'Permitida'], ['block', 'Bloqueada'], ['done', 'Concluída']].map(([k, v]) => `<button data-s="${k}">${v}</button>`).join('');
  const costChip = ([k, t]) => `<span class="cost">${RESK[k] ? resIcon(k) : ''}${esc(t)}</span>`;
  function ficha(compact) {
    const a = ACT[S.a], st = S.s, block = st === 'block', done = st === 'done';
    const on = block ? 2 : done ? 6 : 5;
    const flow = `<div class="step" aria-label="Etapas">${FLOW.map((f, i) => `<span class="pill" style="${i < on ? (block && i === 1 ? 'border-color:var(--b-bad);color:var(--b-bad)' : 'border-color:var(--b-brass);color:var(--b-brass)') : 'opacity:.4'}">${i + 1} ${f}</span>`).join('')}</div>`;
    const elig = block ? `<div class="band nob"><span class="cap">Elegibilidade</span>${a.no.map(t => `<span class="bad">✗ ${esc(t)}</span>`).join('')}<span class="mute">${a.ok.slice(0, 1).map(esc).join('')}</span></div>` : `<div class="band okb"><span class="cap">Elegibilidade</span>${a.ok.map(t => `<span class="ok">✓ ${esc(t)}</span>`).join('')}</div>`;
    const cost = `<div class="band ${block ? '' : 'on'}" style="${block ? 'opacity:.55' : ''}"><span class="cap">Custo</span><div class="costs">${a.cost.map(costChip).join('')}</div>${a.warn ? `<span class="warn" style="font-size:13px">${esc(a.warn)}</span>` : ''}</div>`;
    const rowsHtml = a.rows.map(([k, v, n]) => `<span>${k ? resIcon(k) + ' ' : ''}<b>${esc(v)}</b> ${n ? `<span class="mute">${esc(n)}</span>` : ''}${done ? ' <span class="ok">✓ igual</span>' : ''}</span>`).join('') + (a.mood ? `<span>Ânimo <b>${a.mood}</b>${done ? ' <span class="ok">✓ igual</span>' : ''}</span>` : '');
    const prev = block ? `<div class="band" style="opacity:.55"><span class="cap">Previsto</span><span class="mute">Indisponível até resolver o bloqueio acima.</span></div>` : done ? `<div class="applied"><b class="ok">Aplicado (autoritativo)</b>${rowsHtml}${S.a === 'produzir' ? '<span class="warn">Madeira rendeu +2, não +4: 1 hex sem trabalhador, como previsto.</span>' : ''}</div>` : `<div class="pred"><span class="cap">Previsto, nada foi aplicado</span>${rowsHtml}</div>`;
    const act = done ? '<div class="row"><span class="pill ok">Resolvido</span></div>' : `<div class="row"><button class="ghost">Cancelar</button><button class="go" ${block ? 'disabled' : ''}>Confirmar ${a.n}</button></div>`;
    return `<div class="panel" style="${compact ? 'gap:7px;padding:10px;font-size:13px' : ''}"><div class="row" style="justify-content:space-between"><h4>${a.n} · ${a.who}</h4><span class="pill">${esc(a.est.split(' · ')[1] || '')}</span></div>${compact ? '' : flow}<div class="band"><span class="cap">Estado atual</span><span class="mute">${esc(a.est)}</span></div>${elig}${cost}${prev}${act}</div>`;
  }
  function mini(w) {
    const g = new Grid(['sccppp', 'sscppf', 'sccppp'], w === 'phone' ? 36 : 40);
    let s = `<svg viewBox="${viewBox(g, 8)}" role="img" aria-label="Contexto no mapa">${mapBase(g)}`;
    const [cx, cy] = g.xy(3, 1);
    if (S.a === 'governar') s += cityArt(cx, cy, 2, '#60a3e9', 'Tirinto', S.s === 'done' ? 2 : 1, { R: g.S });
    else s += cityArt(cx, cy, 3, '#60a3e9', 'Mikena', S.a === 'produzir' && S.s === 'done' ? 3 : 4, { R: g.S });
    if (S.a === 'mover') { const [ax, ay] = g.xy(2, 1), [bx, by] = g.xy(4, 2); s += `<defs>${arrowDefs('arE', '#e6c173')}</defs>` + pathLine(g, [[2, 1], [3, 2], [4, 2]], '#e6c173', { w: 3, marker: 'arE', dots: true }) + ownFigure('INFANTRY', ax, ay + 4, 24) + (S.s === 'done' ? ownFigure('CAVALRY', bx, by + 4, 24) : ownFigure('CAVALRY', bx, by + 4, 24, 0, '#60a3e9', { ghost: true })); }
    if (S.a === 'recrutar' && S.s === 'done') s += ownFigure('GUARD', cx - 14, cy + 22, 22) + ownFigure('GUARD', cx + 12, cy + 22, 22);
    if (S.s === 'block') s += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${S.a === 'mover' ? 0 : 40}" fill="none" stroke="#e58a74" stroke-width="2" stroke-dasharray="5 4"/>`;
    return s + '</svg>';
  }
  function render() {
    $('#segAct').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.a === S.a));
    $('#segState').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.s === S.s));
    $('#mapE').innerHTML = mini('desk') + `<div style="margin:-34px 10px 10px;position:relative"><div style="position:absolute;left:46%;top:-7px;width:14px;height:14px;background:var(--glass);border-left:1px solid var(--board-line);border-top:1px solid var(--board-line);transform:rotate(45deg)"></div>${ficha(false)}</div>`;
    $('#phoneE').innerHTML = `<div class="strip" style="position:static;border-radius:0;border-inline:0;padding:4px 8px"><span class="pill">Leontia</span><span class="pill">Era II · R9/21</span><span class="sp"></span><span class="pill warn">!3</span></div>${mini('phone')}<div style="margin:-18px 6px 0;position:relative">${ficha(true)}</div><div class="tray" style="position:static;border-radius:0;border-inline:0;border-bottom:0;margin-top:6px;gap:4px">${['food', 'wood', 'stone', 'metal', 'wealth', 'culture', 'knowledge', 'influence'].map(k => `<span class="res" style="padding:1px 4px">${resIcon(k)}<b>${{ food: 12, wood: 8, stone: 4, metal: 2, wealth: 9, culture: 3, knowledge: 5, influence: 15 }[k]}</b></span>`).join('')}<span class="sp"></span><span class="pill" style="font-size:11px">Ordens 3/5</span></div>`;
  }
  document.addEventListener('click', e => { const a = e.target.closest('#segAct [data-a]'), s = e.target.closest('#segState [data-s]'); if (a) { S.a = a.dataset.a; render(); } if (s) { S.s = s.dataset.s; render(); } });
  render();
})();
