'use client';
import { useRef, useState } from 'react';
import type { LocalAction, LocalView } from '@aoh/server/local-play';
import { HexMap } from './hex-map';
import { CityInspector, HexInspector } from './inspectors';
import { ActionBrowser, GovernmentEffects } from './action-browser';
import { ResourceDisplay } from './resource-display';
import { label, ruleMessage } from './presentation';

function eventText(event: LocalView['events'][number], data: LocalView) {
  const city = 'cityId' in event ? data.view.player.civilization.cities.find(c => c.id === event.cityId)?.name ?? 'Cidade' : '';
  switch (event.type) {
    case 'CITY_DEVELOPED': return `${city}: desenvolvimento ${event.development}.`;
    case 'CITY_SPECIALIZED': return `${city}: especialização ${label(event.specialization)}.`;
    case 'POPULATION_ASSIGNED': return `${city}: população redistribuída.`;
    case 'POPULATION_GROWN': return `${city} cresceu para ${event.population} habitantes.`;
    case 'GROWTH_PROGRESS_CHANGED': return `${city}: crescimento ${event.from} para ${event.to}.`;
    case 'FOOD_SHORTAGE': return `Faltaram ${event.deficit} alimentos.`;
    case 'STABILITY_CHANGED': return `${city}: estabilidade ${event.from} para ${event.to}.`;
    case 'GOVERNMENT_ADOPTED': return `Governo adotado: ${label(event.government)}.`;
    case 'ADMINISTRATIVE_OVEREXTENSION': return `Sobre-extensão: carga ${event.load} / capacidade ${event.capacity}.`;
    case 'RESOURCES_PRODUCED': return `Produção creditada na rodada ${event.round}.`;
    case 'FOOD_CONSUMED': return `${event.amount} alimentos consumidos.`;
    case 'HEX_CLAIMED': return `${city}: território ${event.hexId} reivindicado.`;
    case 'WORKED_HEXES_ASSIGNED': return `${city}: ${event.hexIds.length} territórios trabalhados.`;
    case 'HEX_IMPROVED': return `${label(event.improvement)} concluída em ${event.hexId}.`;
    case 'CITY_FOUNDED': return `${event.name} fundada.`;
    case 'DISTRICT_BUILT': return `${city}: distrito ${label(event.district)} concluído.`;
    case 'BUILDING_BUILT': return `${city}: ${label(event.building)} concluído.`;
    default: return '';
  }
}
export default function GameShell() {
  const [data, setData] = useState<LocalView | null>(null); const [count, setCount] = useState(2);
  const [cityId, setCityId] = useState<string | null>(null); const [hexId, setHexId] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null); const [inspector, setInspector] = useState('city');
  const [modal, setModal] = useState<string | null>(null); const [busy, setBusy] = useState(false); const locked = useRef(false);
  const [error, setError] = useState<string | null>(null); const [notice, setNotice] = useState('');
  const [help, setHelp] = useState(true); const [working, setWorking] = useState(false); const [worked, setWorked] = useState<string[]>([]);
  const [tab, setTab] = useState('Civilização'); const [report, setReport] = useState(false);
  async function request(body: Record<string, unknown>) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(null);
    try {
      const response = await fetch('/api/local', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cityId, hexId, ...body }) });
      const result = await response.json() as { data?: LocalView; error?: string };
      if (result.data) { setData(result.data); setCityId(result.data.selectedCityId); }
      if (result.error) setError(ruleMessage(result.error));
      else if (body.action === 'command') {
        const event = result.data?.events.at(-1);
        setNotice('Decisão aplicada. ' + (event && result.data ? eventText(event, result.data) : 'Estado atualizado.'));
        setModal(null); setWorking(false);
      }
      else if (body.action === 'advance') { setNotice('Fase avançada.'); if (data?.view.phase === 'MAINTENANCE') setReport(true); }
      return result.data;
    } catch { setError('Servidor indisponível. Tente novamente; a sessão pode ter sido encerrada.'); }
    finally { locked.current = false; setBusy(false); }
  }
  async function send(command: Record<string, unknown>) { if (data) await request({ action: 'command', command: { ...command, playerId: data.view.player.id, expectedVersion: data.view.version } }); }
  function run(action: LocalAction) { void send(action.command); }
  function selectHex(id: string) {
    if (busy || !data) return;
    if (working) { if (data.workable.includes(id)) setWorked(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]); return; }
    const city = data.view.player.civilization.cities.find(c => c.hexId === id);
    setHexId(id); setInspector(city ? 'city' : 'hex');
    void request({ action: 'view', hexId: id, cityId: city?.id ?? cityId });
  }
  if (!data) return <main className="landing"><div className="landing-map" aria-hidden="true" /><section className="landing-card"><span className="eyebrow">FIRST PLAYABLE PRODUCT SLICE</span><h1>AGES <i>of</i><br />HEGEMONY</h1><p className="lead">O território é o começo.<br />A civilização é sua construção.</p><div className="start-options"><label>Jogadores locais<select value={count} onChange={e => setCount(Number(e.target.value))}>{[2,3,4,5,6].map(n => <option key={n}>{n}</option>)}</select></label><span>{count === 2 ? 'Duel' : count <= 4 ? 'Standard' : 'Epic'} · mapa fixo</span></div><button className="primary" disabled={busy} onClick={() => void request({ action: 'start', count })}>{busy ? 'Preparando mapa…' : 'Nova Partida'}</button><button disabled={busy} onClick={() => void request({ action: 'view' })}>Retomar sessão local</button><p className="muted">Hotseat / perspectivas de debug · sem IA<br />Sessão de desenvolvimento. Progresso temporário.</p>{error && <p role="alert" className="error">{error}</p>}</section><p className="landing-footer">CARTOGRAFIA · INSTITUIÇÕES · EXPANSÃO</p></main>;
  const { view } = data; const civ = view.player.civilization; const city = civ.cities.find(c => c.id === cityId);
  const over = civ.administrationStatus === 'OVEREXTENDED'; const last = view.lastEconomy?.breakdown;
  return <main className={`game-shell player-${data.players.findIndex(p => p.id === view.player.id) + 1}`} aria-busy={busy}>
    <header className="top-bar"><div className="civ-brand"><span className="seal">AH</span><div><span className="eyebrow">AGES OF HEGEMONY</span><h1>{view.player.name}</h1><small>{label(civ.government)}</small></div></div><ResourceDisplay key={view.version} values={view.player.resources} /><div className={`admin ${over ? 'warning' : ''}`} title={`Sobre-extensão aplica ${view.config.administrativeRules.overextensionEconomicPercent}% da produção não alimentar e penalidade de estabilidade ${view.config.administrativeRules.overextensionStabilityPenalty} por manutenção.`}><small>Administração</small><b>{civ.administrativeLoad} / {civ.administrativeCapacity}</b><meter min={0} max={Math.max(civ.administrativeCapacity, civ.administrativeLoad, 1)} value={civ.administrativeLoad} />{over && <strong>Sobre-extensão · Overextended</strong>}</div><div className="round-label"><small>{label(view.era)}</small><b>Rodada {view.round}</b><span>{label(view.phase)}</span></div></header>
    <nav className="main-nav" aria-label="Áreas do jogo">{['Civilização','Pesquisa','Diplomacia','Militar','Mundo'].map(t => <button key={t} aria-current={tab === t ? 'page' : undefined} onClick={() => setTab(t)}>{t}</button>)}<span>Hegemonia · bloqueada</span></nav>
    <div className="play-layout"><aside className="civilization-panel"><span className="eyebrow">CONSELHO CIVILIZACIONAL</span><h2>{view.player.name}</h2><section><h3>Governo</h3><p>{label(civ.government)}</p>{civ.government === 'PROTO_GOVERNANCE' ? <button onClick={() => setModal('ADOPT_GOVERNMENT')}>Adotar governo</button> : <GovernmentEffects data={data} government={civ.government} />}</section><section><h3>Cidades <small>{civ.cities.length}</small></h3>{civ.cities.map(c => <button className={`city-link ${cityId === c.id ? 'active' : ''}`} disabled={busy} key={c.id} onClick={() => { setFocus(c.hexId); setInspector('city'); setHexId(c.hexId); setWorking(false); void request({ action: 'view', cityId: c.id, hexId: c.hexId }); }}><b>{c.id === civ.capitalCityId ? '★ ' : ''}{c.name}</b><small>{c.population} habitantes · Nível {c.development}</small></button>)}</section><section><h3>Território</h3><p>{view.visibleTerritory.filter(t => t.ownerId === view.player.id).length} hexes controlados</p><small title="Capacidade do estado para administrar cidades, população e território.">Carga {civ.administrativeLoad} · Capacidade {civ.administrativeCapacity}</small></section><details className="developer"><summary>Developer / Hotseat</summary><label>Ver como<select disabled={busy} value={view.player.id} onChange={e => { setHexId(null); setFocus(null); setWorking(false); setInspector('city'); void request({ action: 'perspective', playerId: e.target.value, cityId: null, hexId: null }); }}>{data.players.map((p,i) => <option key={p.id} value={p.id}>Jogador {i+1} · {p.name}</option>)}</select></label><small>Game ID: {view.gameId}<br />Snapshot v3 · Estado v{view.version}<br />Fase: {view.phase}</small></details><p className="session-note">Local Development Gameplay Session<br />Progresso temporário · sem multiplayer</p><button onClick={() => { setData(null); setCityId(null); setHexId(null); setFocus(null); }}>Tela inicial</button></aside>
      <div className="world-column">{help && <div className="guidance"><div><b>Seu primeiro conselho</b><p>1. Avance para Planejamento. 2. Selecione a capital. 3. Distribua habitantes e reivindique um vizinho. 4. Trabalhe o território e avance as fases.</p></div><button aria-label="Dispensar orientação" onClick={() => setHelp(false)}>×</button></div>}{!['Civilização','Mundo'].includes(tab) && <div className="future-panel"><h2>{tab}</h2><p>Sistema futuro · Ainda não disponível.</p><button onClick={() => setTab('Mundo')}>Voltar ao mapa</button></div>}<HexMap data={data} selected={hexId} focus={focus} working={working} worked={worked} onSelect={selectHex} />
      {working && city && <div className="assignment-bar"><b>Trabalhados: {worked.length} / {city.workers.producers} produtores</b><button className="primary" disabled={busy || worked.length > city.workers.producers} onClick={() => void send({ type: 'ASSIGN_WORKED_HEXES', cityId: city.id, hexIds: worked })}>Aplicar territórios</button><button onClick={() => setWorking(false)}>Cancelar</button></div>}</div>
      <aside className="context-inspector"><div className="inspector-tabs"><button aria-pressed={inspector === 'city'} onClick={() => setInspector('city')}>Cidade</button><button disabled={!hexId} aria-pressed={inspector === 'hex'} onClick={() => setInspector('hex')}>Território</button></div>{inspector === 'city' && city ? <CityInspector data={data} city={city} send={send} run={run} busy={busy} browse={setModal} assign={() => { setWorked([...city.workedHexIds]); setWorking(true); }} /> : hexId ? <HexInspector data={data} hexId={hexId} run={run} busy={busy} browse={setModal} /> : <p>Selecione um território no mapa.</p>}</aside></div>
    <footer className="action-bar"><div className="feedback" role="status">{error ? <p className="error" role="alert">{error}</p> : busy ? 'Consultando conselho…' : notice || 'Selecione uma cidade ou território para governar.'}{['RESOLUTION','REACTION'].includes(view.phase) && <small>Resolução estratégica em desenvolvimento. Nenhum efeito estratégico pendente nesta slice.</small>}</div><button onClick={() => setReport(r => !r)}>Relatório e eventos</button><button className="primary" disabled={busy} onClick={() => void request({ action: 'advance', expectedVersion: view.version })}>{view.phase === 'MAINTENANCE' ? 'Executar manutenção' : 'Avançar fase'} <span>›</span></button></footer>
    {report && <section className="round-report" aria-label="Relatório da rodada"><header><h2>Relatório · Rodada {view.lastEconomy?.round ?? view.round}</h2><button aria-label="Fechar relatório" onClick={() => setReport(false)}>×</button></header>{last ? <><h3>Produção creditada</h3><ResourceDisplay values={last.credited} /><p>Alimento consumido: {last.foodPaid} / necessário {last.foodRequired}</p><h3>Variação dos estoques</h3><ResourceDisplay values={last.netChange} /><h3>Ajuste administrativo</h3><ResourceDisplay values={last.administrativeAdjustment} compact /><p>Carga {civ.administrativeLoad} / Capacidade {civ.administrativeCapacity}</p></> : <p>Execute manutenção para produzir o primeiro relatório.</p>}<h3>Histórico da perspectiva atual</h3><ol className="event-feed">{[...data.events].reverse().map((e,i) => <li key={`${e.version}-${i}`}><small>R{e.round}</small> {eventText(e,data)}</li>)}</ol></section>}
    {modal && <ActionBrowser kind={modal} data={data} run={run} close={() => setModal(null)} busy={busy} />}<p className="mobile-note">Experiência ideal no desktop. Role para acessar os painéis.</p>
  </main>;
}
