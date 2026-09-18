'use client';
import { useRef, useState } from 'react';
import type { LocalAction, LocalView } from '@aoh/server/local-play';
import { HexMap } from './hex-map';
import { CityInspector, HexInspector } from './inspectors';
import { ActionBrowser, GovernmentEffects } from './action-browser';
import { ResourceDisplay } from './resource-display';
import { CompendiumModal } from './compendium-modal';
import { label, ruleMessage } from './presentation';

function eventText(event: LocalView['events'][number], data: LocalView) {
  const city = 'cityId' in event ? data.view.player.civilization.cities.find(c => c.id === event.cityId)?.name ?? 'Cidade' : '';
  switch (event.type) {
    case 'CITY_DEVELOPED': return `${city}: desenvolvimento avançou para ${event.development}.`;
    case 'CITY_SPECIALIZED': return `${city}: adotou a especialização ${label(event.specialization)}.`;
    case 'POPULATION_ASSIGNED': return `${city}: população redistribuída entre funções cívicas.`;
    case 'POPULATION_GROWN': return `${city} expandiu para ${event.population} habitantes.`;
    case 'GROWTH_PROGRESS_CHANGED': return `${city}: progresso demográfico de ${event.from} para ${event.to}.`;
    case 'FOOD_SHORTAGE': return `Crise de abastecimento: déficit de ${event.deficit} alimentos.`;
    case 'STABILITY_CHANGED': return `${city}: estabilidade alterada de ${event.from} para ${event.to}.`;
    case 'GOVERNMENT_ADOPTED': return `Forma institucional adotada: ${label(event.government)}.`;
    case 'ADMINISTRATIVE_OVEREXTENSION': return `Alerta de sobre-extensão: carga ${event.load} / capacidade ${event.capacity}.`;
    case 'RESOURCES_PRODUCED': return `Produção territorial e urbana creditada na rodada ${event.round}.`;
    case 'FOOD_CONSUMED': return `${event.amount} alimentos consumidos pela população.`;
    case 'HEX_CLAIMED': return `${city}: fronteira expandida sobre o território ${event.hexId}.`;
    case 'WORKED_HEXES_ASSIGNED': return `${city}: ${event.hexIds.length} territórios rurais alocados a produtores.`;
    case 'HEX_IMPROVED': return `Infraestrutura agrária: ${label(event.improvement)} concluída em ${event.hexId}.`;
    case 'CITY_FOUNDED': return `Novo polo civilizacional: cidade ${event.name} fundada.`;
    case 'DISTRICT_BUILT': return `${city}: distrito ${label(event.district)} estabelecido.`;
    case 'BUILDING_BUILT': return `${city}: edifício cívico ${label(event.building)} erguido.`;
    default: return '';
  }
}

function getOnboardingStep(data: LocalView | null, cityId: string | null) {
  if (!data) {
    return {
      title: 'Primeiros Passos da Civilização',
      instruction: '1. Avance para Planejamento. 2. Selecione a capital. 3. Distribua habitantes e reivindique um vizinho. 4. Atribua o território trabalhado e avance as fases.',
    };
  }

  const civ = data.view.player.civilization;
  const currentCity = civ.cities.find(c => c.id === cityId);
  const claimedCount = data.view.visibleTerritory.filter(t => t.ownerId === data.view.player.id).length;
  const totalWorked = civ.cities.reduce((sum, c) => sum + c.workedHexIds.length, 0);

  if (data.view.phase === 'MAINTENANCE') {
    return {
      title: 'Passo 1/5: Conclua a Manutenção',
      instruction: 'Clique em "Executar manutenção" na barra inferior para entrar na fase de Planejamento.',
    };
  }

  if (!currentCity) {
    return {
      title: 'Passo 2/5: Selecione sua Capital',
      instruction: `Clique em ★ ${civ.cities[0]?.name ?? 'sua capital'} no conselho civilizacional à esquerda ou no atlas.`,
    };
  }

  if (currentCity.workers.producers === 0 && currentCity.workers.artisans === 0) {
    return {
      title: 'Passo 3/5: Aloque os Habitantes',
      instruction: 'Abra "Habitantes & Trabalho" no inspetor à direita e defina 1 Produtor e 1 Artesão.',
    };
  }

  if (claimedCount <= 1) {
    return {
      title: 'Passo 4/5: Reivindique Território',
      instruction: 'Clique em um hexágono vizinho com borda tracejada no atlas e selecione "Reivindicar território" (1 Influência).',
    };
  }

  if (totalWorked === 0) {
    return {
      title: 'Passo 5/5: Trabalhe a Terra',
      instruction: 'Na cidade, clique em "Atribuir território", clique no hexágono no mapa e confirme a atribuição.',
    };
  }

  return {
    title: 'Orientação: Governança Ativa',
    instruction: 'Excelente! Desenvolva a cidade, construa distritos e avance as fases no botão inferior para colher a produção.',
  };
}

export default function GameShell() {
  const [data, setData] = useState<LocalView | null>(null);
  const [count, setCount] = useState(2);
  const [cityId, setCityId] = useState<string | null>(null);
  const [hexId, setHexId] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [inspector, setInspector] = useState('city');
  const [modal, setModal] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [help, setHelp] = useState(true);
  const [helpMinimized, setHelpMinimized] = useState(false);
  const [working, setWorking] = useState(false);
  const [worked, setWorked] = useState<string[]>([]);
  const [tab, setTab] = useState('Civilização');
  const [report, setReport] = useState(false);
  const [compendiumOpen, setCompendiumOpen] = useState(false);

  const onboardingStep = getOnboardingStep(data, cityId);

  async function request(body: Record<string, unknown>) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId, hexId, ...body }),
      });
      const result = (await response.json()) as { data?: LocalView; error?: string };
      if (result.data) {
        setData(result.data);
        setCityId(result.data.selectedCityId);
      }
      if (result.error) {
        setError(ruleMessage(result.error));
      } else if (body.action === 'command') {
        const event = result.data?.events.at(-1);
        setNotice('Decisão aplicada. ' + (event && result.data ? eventText(event, result.data) : 'Estado institucional atualizado.'));
        setModal(null);
        setWorking(false);
      } else if (body.action === 'advance') {
        setNotice('Fase avançada.');
        if (data?.view.phase === 'MAINTENANCE') setReport(true);
      }
      return result.data;
    } catch {
      setError('Servidor indisponível. Tente novamente; a sessão pode ter sido encerrada.');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  async function send(command: Record<string, unknown>) {
    if (data) {
      await request({
        action: 'command',
        command: {
          ...command,
          playerId: data.view.player.id,
          expectedVersion: data.view.version,
        },
      });
    }
  }

  function run(action: LocalAction) {
    void send(action.command);
  }

  function selectHex(id: string) {
    if (busy || !data) return;
    if (working) {
      if (data.workable.includes(id)) {
        setWorked(w => (w.includes(id) ? w.filter(x => x !== id) : [...w, id]));
      }
      return;
    }
    const city = data.view.player.civilization.cities.find(c => c.hexId === id);
    setHexId(id);
    setInspector(city ? 'city' : 'hex');
    void request({ action: 'view', hexId: id, cityId: city?.id ?? cityId });
  }

  if (!data) {
    return (
      <main className="landing">
        <div className="landing-map" aria-hidden="true" />
        <section className="landing-card">
          <span className="eyebrow">FIRST PLAYABLE PRODUCT SLICE</span>
          <h1>
            AGES <i>of</i>
            <br />
            HEGEMONY
          </h1>
          <p className="lead">
            O território é o começo.
            <br />
            A civilização é sua construção.
          </p>
          <div className="start-options">
            <label>
              Jogadores locais
              <select value={count} onChange={e => setCount(Number(e.target.value))}>
                {[2, 3, 4, 5, 6].map(n => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <span>{count === 2 ? 'Duel (2 Civs)' : count <= 4 ? 'Standard (3-4 Civs)' : 'Epic (5-6 Civs)'} · mapa cartográfico</span>
          </div>
          <button className="primary" disabled={busy} onClick={() => void request({ action: 'start', count })}>
            {busy ? 'Preparando mapa…' : 'Nova Partida'}
          </button>
          <button disabled={busy} onClick={() => void request({ action: 'view' })}>
            Retomar sessão local
          </button>
          <p className="muted">
            Hotseat local / perspectivas de comando · motor determinístico
            <br />
            Sessão de desenvolvimento. Progresso temporário.
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </section>
        <p className="landing-footer">CARTOGRAFIA · INSTITUIÇÕES · EXPANSÃO HISTÓRICA</p>
      </main>
    );
  }

  const { view } = data;
  const civ = view.player.civilization;
  const city = civ.cities.find(c => c.id === cityId);
  const over = civ.administrationStatus === 'OVEREXTENDED';
  const last = view.lastEconomy?.breakdown;
  const playerIndex = data.players.findIndex(p => p.id === view.player.id) + 1;

  return (
    <main className={`game-shell player-${playerIndex}`} aria-busy={busy}>
      {/* 1. TOP STATUS & RESOURCES BAR */}
      <header className="top-bar">
        <div className="civ-brand">
          <span className="seal">AH</span>
          <div>
            <span className="eyebrow">AGES OF HEGEMONY</span>
            <h1>{view.player.name}</h1>
            <small>{label(civ.government)}</small>
          </div>
        </div>

        <ResourceDisplay key={view.version} values={view.player.resources} />

        <div
          className={`admin ${over ? 'warning' : ''}`}
          title={`Sobre-extensão aplica ${view.config.administrativeRules.overextensionEconomicPercent}% da produção não alimentar e penalidade de estabilidade ${view.config.administrativeRules.overextensionStabilityPenalty} por manutenção.`}
        >
          <small>Administração</small>
          <b>
            {civ.administrativeLoad} / {civ.administrativeCapacity}
          </b>
          <meter
            min={0}
            max={Math.max(civ.administrativeCapacity, civ.administrativeLoad, 1)}
            value={civ.administrativeLoad}
          />
          {over && <strong>Sobre-extensão · Overextended</strong>}
        </div>

        <div className="round-label">
          <small>{label(view.era)}</small>
          <b>Rodada {view.round}</b>
          <span>{label(view.phase)}</span>
        </div>
      </header>

      {/* 2. AREA NAVIGATION */}
      <nav className="main-nav" aria-label="Áreas do jogo">
        {['Civilização', 'Pesquisa', 'Diplomacia', 'Militar', 'Mundo'].map(t => (
          <button
            key={t}
            aria-current={tab === t ? 'page' : undefined}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
        <button
          type="button"
          className="compendium-nav-btn"
          onClick={() => setCompendiumOpen(true)}
          title="Abrir compêndio de regras, governos, distritos e conceitos"
        >
          📖 Compêndio
        </button>
        <span className="future-system-tag">Hegemonia · em desenvolvimento</span>
      </nav>

      {/* 3. MAIN PRODUCT SHELL LAYOUT */}
      <div className="play-layout">
        {/* LEFT: CIVILIZATION CONTEXT */}
        <aside className="civilization-panel">
          <span className="eyebrow">CONSELHO CIVILIZACIONAL</span>
          <h2>{view.player.name}</h2>

          <section>
            <h3>Forma de Governo</h3>
            <p className="gov-title">{label(civ.government)}</p>
            {civ.government === 'PROTO_GOVERNANCE' ? (
              <button className="primary" onClick={() => setModal('ADOPT_GOVERNMENT')}>
                Adotar governo
              </button>
            ) : (
              <GovernmentEffects data={data} government={civ.government} />
            )}
          </section>

          <section>
            <div className="section-head">
              <h3>Cidades</h3>
              <span className="count-pill">{civ.cities.length}</span>
            </div>
            {civ.cities.map(c => (
              <button
                className={`city-link ${cityId === c.id ? 'active' : ''}`}
                disabled={busy}
                key={c.id}
                onClick={() => {
                  setFocus(c.hexId);
                  setInspector('city');
                  setHexId(c.hexId);
                  setWorking(false);
                  void request({ action: 'view', cityId: c.id, hexId: c.hexId });
                }}
              >
                <b>{c.id === civ.capitalCityId ? '★ ' : ''}{c.name}</b>
                <small>{c.population} habitantes · Nível {c.development}</small>
              </button>
            ))}
          </section>

          <section>
            <h3>Território Sob Controle</h3>
            <p className="territory-stat">
              <b>{view.visibleTerritory.filter(t => t.ownerId === view.player.id).length}</b> hexes soberanos
            </p>
            <small title="Capacidade do estado para administrar cidades, população e território.">
              Carga {civ.administrativeLoad} · Capacidade {civ.administrativeCapacity}
            </small>
          </section>

          <details className="developer">
            <summary>Developer / Hotseat</summary>
            <label>
              Ver como
              <select
                disabled={busy}
                value={view.player.id}
                onChange={e => {
                  setHexId(null);
                  setFocus(null);
                  setWorking(false);
                  setInspector('city');
                  void request({
                    action: 'perspective',
                    playerId: e.target.value,
                    cityId: null,
                    hexId: null,
                  });
                }}
              >
                {data.players.map((p, i) => (
                  <option key={p.id} value={p.id}>
                    Jogador {i + 1} · {p.name}
                  </option>
                ))}
              </select>
            </label>
            <small>
              Game ID: {view.gameId}
              <br />
              Snapshot v3 · Estado v{view.version}
              <br />
              Fase: {view.phase}
            </small>
          </details>

          <p className="session-note">
            Local Development Gameplay Session
            <br />
            Progresso em memória · sem multiplayer
          </p>

          <button
            className="action-secondary"
            onClick={() => {
              setData(null);
              setCityId(null);
              setHexId(null);
              setFocus(null);
            }}
          >
            Tela inicial
          </button>
        </aside>

        {/* CENTER: WORLD COLUMN & MAP */}
        <div className="world-column">
          {help && (
            <div className={`guidance ${helpMinimized ? 'minimized' : ''}`}>
              <div className="guidance-content">
                <div className="guidance-head">
                  <span className="guidance-seal">✦</span>
                  <b>{onboardingStep.title}</b>
                </div>
                {!helpMinimized && (
                  <p>
                    {onboardingStep.instruction}
                  </p>
                )}
              </div>
              <div className="guidance-actions">
                <button
                  type="button"
                  className="guidance-toggle"
                  onClick={() => setHelpMinimized(m => !m)}
                >
                  {helpMinimized ? 'Expandir' : 'Minimizar'}
                </button>
                <button
                  type="button"
                  className="guidance-close"
                  aria-label="Dispensar orientação"
                  onClick={() => setHelp(false)}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {!['Civilização', 'Mundo'].includes(tab) && (
            <div className="future-panel">
              <h2>{tab}</h2>
              <p>Sistema planejado · Módulo estratégico ainda em desenvolvimento para as próximas rodadas.</p>
              <button className="primary" onClick={() => setTab('Mundo')}>
                Voltar ao mapa
              </button>
            </div>
          )}

          <HexMap
            data={data}
            selected={hexId}
            focus={focus}
            working={working}
            worked={worked}
            onSelect={selectHex}
          />

          {working && city && (
            <div className="assignment-bar">
              <div className="assignment-info">
                <b>Trabalhados: {worked.length} / {city.workers.producers} produtores</b>
                <small>Clique nos hexágonos elegíveis marcados no mapa para trabalhar a terra.</small>
              </div>
              <div className="assignment-actions">
                <button
                  className="primary"
                  disabled={busy || worked.length > city.workers.producers}
                  onClick={() =>
                    void send({
                      type: 'ASSIGN_WORKED_HEXES',
                      cityId: city.id,
                      hexIds: worked,
                    })
                  }
                >
                  Aplicar territórios
                </button>
                <button onClick={() => setWorking(false)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: CONTEXT INSPECTOR */}
        <aside className="context-inspector">
          <div className="inspector-tabs">
            <button
              aria-pressed={inspector === 'city'}
              onClick={() => setInspector('city')}
            >
              Cidade
            </button>
            <button
              disabled={!hexId}
              aria-pressed={inspector === 'hex'}
              onClick={() => setInspector('hex')}
            >
              Território
            </button>
          </div>

          {inspector === 'city' && city ? (
            <CityInspector
              data={data}
              city={city}
              send={send}
              run={run}
              busy={busy}
              browse={setModal}
              assign={() => {
                setWorked([...city.workedHexIds]);
                setWorking(true);
              }}
            />
          ) : hexId ? (
            <HexInspector
              data={data}
              hexId={hexId}
              run={run}
              busy={busy}
              browse={setModal}
            />
          ) : (
            <div className="empty-inspector">
              <p>Selecione uma cidade ou território no atlas para inspecionar.</p>
            </div>
          )}
        </aside>
      </div>

      {/* 4. BOTTOM ACTION & FEEDBACK BAR */}
      <footer className="action-bar">
        <div className="feedback" role="status">
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : busy ? (
            <span className="busy-pill">Consultando conselho de estado…</span>
          ) : (
            notice || 'Selecione uma cidade ou território para governar.'
          )}
          {['RESOLUTION', 'REACTION'].includes(view.phase) && (
            <small>Resolução estratégica em desenvolvimento. Nenhum efeito pendente nesta slice.</small>
          )}
        </div>

        <button
          type="button"
          className="report-toggle-btn"
          onClick={() => setReport(r => !r)}
        >
          Relatório e eventos
        </button>

        <button
          className="primary advance-phase-btn"
          disabled={busy}
          onClick={() =>
            void request({
              action: 'advance',
              expectedVersion: view.version,
            })
          }
        >
          <span>{view.phase === 'MAINTENANCE' ? 'Executar manutenção' : 'Avançar fase'}</span>
          <span className="advance-icon">›</span>
        </button>
      </footer>

      {/* 5. STRATEGIC ROUND REPORT MODAL */}
      {report && (
        <section className="round-report" aria-label="Relatório da rodada">
          <header>
            <div className="report-header-titles">
              <span className="eyebrow">BALANÇO INSTITUCIONAL DA ERA</span>
              <h2>Relatório · Rodada {view.lastEconomy?.round ?? view.round}</h2>
            </div>
            <button
              type="button"
              className="close-report-btn"
              aria-label="Fechar relatório"
              onClick={() => setReport(false)}
            >
              ×
            </button>
          </header>

          <div className="report-body">
            {last ? (
              <>
                <div className="report-card">
                  <h3>Produção creditada</h3>
                  <ResourceDisplay values={last.credited} />
                  <p className="food-consumption-stat">
                    Alimento consumido: {last.foodPaid} / necessário {last.foodRequired}
                  </p>
                </div>

                <div className="report-card">
                  <h3>Variação dos estoques</h3>
                  <ResourceDisplay values={last.netChange} />
                </div>

                <div className="report-card">
                  <h3>Ajuste administrativo</h3>
                  <ResourceDisplay values={last.administrativeAdjustment} compact />
                  <p className="admin-status-stat">
                    Carga {civ.administrativeLoad} / Capacidade {civ.administrativeCapacity}
                    {over && <span className="warning-pill"> · Sobre-extensão Ativa</span>}
                  </p>
                </div>
              </>
            ) : (
              <p className="empty-report-note">Execute manutenção para produzir o primeiro relatório.</p>
            )}

            <div className="report-events-section">
              <h3>Histórico da perspectiva atual</h3>
              <ol className="event-feed">
                {[...data.events].reverse().map((e, i) => (
                  <li key={`${e.version}-${i}`}>
                    <small>R{e.round}</small> {eventText(e, data)}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* 6. DECISION MODAL */}
      {modal && (
        <ActionBrowser
          kind={modal}
          data={data}
          run={run}
          close={() => setModal(null)}
          busy={busy}
        />
      )}

      {/* 7. COMPENDIUM & RULES MODAL */}
      {compendiumOpen && (
        <CompendiumModal
          isOpen={compendiumOpen}
          onClose={() => setCompendiumOpen(false)}
          onRestartTutorial={() => {
            setHelp(true);
            setHelpMinimized(false);
          }}
        />
      )}

      <p className="mobile-note">Experiência ideal no desktop. Role para acessar os painéis.</p>
    </main>
  );
}
