/* ===== Estradas em rede (BUILD_ROAD: 1 Material por hex, 1 Ordem de cidade; custo de movimento 1 para peças terrestres) ===== */
(function roadsDemo() {
  const g = new Grid(['ppffhhmpp', 'ppppffhpp', 'pccchhphp', 'pppfffpcp', 'sppppfppp'], 40);
  const A = [1, 1], B = [6, 3], det = { '4,2': { feat: ['RIVER'] } };
  let roads = new Set(['2,1', '3,2', '4,2', '5,2', '5,3']);
  const cityKeys = new Set([A.join(','), B.join(',')]);
  const PRESETS = { star: ['5,2', '3,2', '4,1', '3,1', '4,3', '3,3', '4,2'], cross: ['4,2', '5,2', '3,2', '4,1', '4,3'], ring: ['5,2', '4,1', '3,1', '3,2', '3,3', '4,3'], line: ['2,1', '3,2', '4,2', '5,2', '5,3'], none: [] };
  function route(set) { const R = g.reach(A, 99, { roads: set }); const k = B.join(','); return R.cost[k] === undefined ? null : { cost: R.cost[k], path: g.path(R.prev, A, B) }; }
  function render() {
    const withR = route(roads), without = route(new Set());
    let s = `<svg viewBox="${viewBox(g, 8)}" role="img" aria-label="Rede de estradas">${mapBase(g, null, det)}${roadLayer(g, [...roads], [A, B], det)}`;
    if (withR) s += pathLine(g, withR.path, '#e6c173', { w: 2.6, dash: '2 6', dots: false });
    for (const [c, r, nm, lv] of [[...A, 'Aurea', 2], [...B, 'Tirinto', 2]]) { const [x, y] = g.xy(c, r); s += cityArt(x, y, lv, '#60a3e9', nm, 4, { R: g.S }); }
    s += Array.from({ length: g.R }, (_, r) => Array.from({ length: g.C }, (_, c) => `<polygon data-hex="${c},${r}" points="${g.pts(c, r)}" fill="transparent" style="cursor:pointer"/>`).join('')).join('');
    $('#mapR').innerHTML = s + '</svg>';
    let deg = { 0: 0, 1: 0, 2: 0, 3: 0 }, ends = 0, junc = 0;
    for (const k of roads) { const [c, r] = k.split(',').map(Number); const n = g.nb(c, r).filter(([x, y]) => roads.has(x + ',' + y) || cityKeys.has(x + ',' + y)).length; if (n === 1) ends++; if (n >= 3) junc++; }
    $('#panelR').innerHTML = `<h4>Rede de estradas</h4>
      <div class="row"><div class="seg" role="group" aria-label="Exemplos">${[['line', 'Ligação'], ['cross', 'Cruzamento'], ['star', 'Estrela 6 direções'], ['ring', 'Anel'], ['none', 'Limpar']].map(([k, n]) => `<button data-p="${k}">${n}</button>`).join('')}</div></div>
      <div class="band on"><span class="cap">Marcha de Aurea a Tirinto (infantaria)</span><span>Sem estrada: <b>${without ? without.cost : 'sem caminho'}</b> pontos de movimento · Com esta rede: <b class="${withR && without && withR.cost < without.cost ? 'ok' : ''}">${withR ? withR.cost : 'sem caminho'}</b></span><span class="mute" style="font-size:12.5px">${withR ? 'A linha dourada pontilhada é o caminho mais barato.' : 'A rede não alcança a outra cidade.'}</span></div>
      <div class="band"><span class="cap">Rede</span><span>${roads.size} hexes com estrada · ${ends} pontas · ${junc} cruzamentos ou estrelas</span><span>Construir: <b>${roads.size} Materiais</b> (1 por hex) e 1 Ordem de cidade por estrada</span></div>
      <div class="band"><span class="cap">Como se lê</span><span style="font-size:13px">Ponta: hex com estrada ligada a um só vizinho. Curva e reta: dois vizinhos. Cruzamento: 3 ou mais, com cantaria no centro. Passadiço de tábuas em Costa. Ponte sobre o Rio. Estrada em Mar não existe.</span></div>
      <div class="toast" role="status" id="msgR"></div>`;
  }
  $('#mapR').addEventListener('click', e => {
    const h = e.target.closest('[data-hex]'); if (!h) return; const k = h.dataset.hex, [c, r] = k.split(',').map(Number), t = g.t(c, r);
    if (cityKeys.has(k)) { render(); $('#msgR').textContent = 'Cidade: já está na rede.'; return; }
    if (t === 's') { render(); $('#msgR').textContent = 'Mar: estrada não pode ser construída.'; return; }
    roads.has(k) ? roads.delete(k) : roads.add(k); render();
  });
  $('#panelR').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) { roads = new Set(PRESETS[b.dataset.p]); render(); } });
  render();
})();
