/* ===== Cena F · Composição: casos difíceis calculados por entidades ===== */
(function sceneF() {
  const OWN = '#60a3e9', RIVAL = '#dd220e';
  const city = (id, hex, name, level, mood, extra = {}) => ({ id, type: 'city', hex, name, level, mood, cap: 2, ...extra });
  const stack = (id, hex, kinds, own = true, extra = {}) => ({ id, type: 'stack', own, hex, name: id, kinds: kinds.map(([kind, n]) => ({ kind, n })), ...extra });
  const threat = (id, hex, kind, status, comp, extra = {}) => ({ id, type: 'threat', hex, kind, status, level: 2, name: id, comp: comp.map(([k, n]) => ({ kind: k, n })), ...extra });
  const CASES = [
    { title: 'Cidade com três unidades', note: 'Cidade a 62% no alto; tropas na faixa de baixo; nível, Ânimo e território trabalhado nos cantos; o nome cede.', rows: ['pp', 'pp'], ents: [city('c', '0,0', 'Mikena', 3, 4, { worked: true }), stack('s', '0,0', [['INFANTRY', 2], ['CAVALRY', 1], ['RANGED', 1]])], det: {} },
    { title: 'Cidade com estrada e mina', note: 'A estrada chega até a borda da cidade. A mina vira selo no hex ocupado; o rio e a fértil viram selos na borda esquerda da cidade.', rows: ['pph', 'ppp'], ents: [city('c', '1,0', 'Aurea', 2, 5), stack('s', '2,0', [['INFANTRY', 1]])], det: { '2,0': { imp: 'MINE', owner: OWN }, '1,0': { feat: ['RIVER', 'FERTILE'] } }, roads: ['0,0', '2,0', '1,1'] },
    { title: 'Acampamento com Bando', note: 'Tenda no alto; guerreiros na faixa de baixo; ampulheta no canto. O exército próprio divide a faixa sem esconder ninguém.', rows: ['hh', 'hf'], ents: [threat('t', '0,0', 'CAMP', 'CAMPED', [['INFANTRY', 2], ['CAVALRY', 1], ['RANGED', 1]], { fresh: true }), stack('s', '0,0', [['INFANTRY', 2], ['SIEGE', 1]])], det: { '0,0': { feat: ['STONE'] } } },
    { title: 'Frota sobre recurso marítimo', note: 'O cardume vira selo; a rede envolve o hex e a Frota mantém o centro em tamanho cheio.', rows: ['ss', 'sc'], ents: [stack('f', '0,0', [['FLEET', 1]])], det: { '0,0': { feat: ['SHOAL'], fishing: true, owner: OWN } } },
    { title: 'Dois exércitos próximos', note: 'Dois hexes vizinhos: cada exército fica dentro do seu hex, sem encostar no vizinho.', rows: ['ppp', 'ppp'], ents: [stack('a', '0,0', [['INFANTRY', 3], ['CAVALRY', 1]]), stack('b', '1,0', [['RANGED', 2], ['GUARD', 1]], false, { color: RIVAL }), stack('c', '1,1', [['INFANTRY', 1]])], det: {} },
    { title: 'Vários marcadores de Ânimo', note: 'Três cidades vizinhas: Próspera, Abalada e Revolta. Cada selo fica no canto do próprio hex.', rows: ['ppp', 'ppp'], ents: [city('a', '0,0', 'Arkos', 4, 6), city('b', '1,0', 'Beron', 3, 2), city('c', '2,0', 'Cido', 2, 1), stack('s', '1,0', [['GUARD', 1]])], det: {} },
    { title: 'Trajetórias simultâneas', note: 'Três trajetos por baixo das miniaturas; fantasmas e etiquetas (n · custo/orçamento) nos slots do destino.', rows: ['pppp', 'pppp', 'pppp'], ents: [stack('a', '0,1', [['INFANTRY', 2]]), stack('b', '0,2', [['CAVALRY', 1]]), stack('c', '1,0', [['RANGED', 1], ['GUARD', 1]]), city('d', '3,1', 'Ponte', 2, 4)],
      legs: [{ id: 1, from: [0, 1], path: [[1, 1], [2, 1]], color: '#e6c173', kinds: ['INFANTRY', 'INFANTRY'], tag: '1 · 2/2' }, { id: 2, from: [0, 2], path: [[1, 2], [2, 2]], color: '#7fd0c4', kinds: ['CAVALRY'], tag: '2 · 2/4' }, { id: 3, from: [1, 0], path: [[2, 0], [3, 0]], color: '#e79ab5', kinds: ['RANGED', 'GUARD'], tag: '3 · 2/2' }], det: {} },
  ];
  let Z = 40, slots = false;
  function render() {
    let total = 0, bad = 0;
    $('#casesF').innerHTML = CASES.map((cs, ci) => {
      const g = new Grid(cs.rows, Z), ents = cs.ents, occ = occupiedSet(ents), legs = cs.legs || [];
      const dr = drawEntities(g, ents, cs.det, { legs });
      let svg = `<svg style="width:${Math.round(100 * Z / 64)}%;max-width:100%" viewBox="${viewBox(g, 6)}" role="img" aria-label="${esc(cs.title)}"><defs>${legs.map(l => arrowDefs('arL' + l.id, l.color)).join('')}</defs>${mapBase(g, null, cs.det, occ)}${cs.roads ? roadLayer(g, cs.roads, ents.filter(e => e.type === 'city').map(e => e.hex.split(',').map(Number)), cs.det, occ) : ''}${dr.under}${dr.over}`;
      if (slots) for (const [key, lay] of Object.entries(dr.layouts)) { const [c, r] = key.split(',').map(Number), [cx, cy] = g.xy(c, r); svg += lay.items.map(it => `<rect x="${f1(cx + it.box.x - it.box.w / 2)}" y="${f1(cy + it.box.y - it.box.h / 2)}" width="${f1(it.box.w)}" height="${f1(it.box.h)}" fill="#e6c17322" stroke="#e6c173" stroke-width=".8" stroke-dasharray="2 2" pointer-events="none"/>`).join(''); }
      svg += '</svg>';
      const n = Object.values(dr.layouts).reduce((a, l) => a + l.items.length, 0); total += n; bad += dr.problems.length;
      return `<div style="display:grid;gap:8px"><h3>${esc(cs.title)}</h3><div class="mesa"><div class="map">${svg}</div><div class="info"><span>${esc(cs.note)}</span><span class="${dr.problems.length ? 'bad' : 'ok'}">${dr.problems.length ? '✗ ' + esc(dr.problems.join(' · ')) : `✓ ${n} elementos, nenhuma sobreposição, tudo dentro do hex`}</span></div></div></div>`;
    }).join('');
    $('#statF').textContent = bad ? `${bad} colisões` : `${total} elementos conferidos · 0 colisões`;
    $('#statF').className = 'pill ' + (bad ? 'bad' : 'ok');
    $('#segZ').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.z === Z));
  }
  $('#segZ').addEventListener('click', e => { const b = e.target.closest('[data-z]'); if (b) { Z = +b.dataset.z; render(); } });
  $('#slotsF').addEventListener('change', e => { slots = e.target.checked; render(); });
  render();
})();
