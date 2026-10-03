'use client';
import { useState } from 'react';
import type { LocalAction, LocalView } from '@aoh/server/local-play';
import { label, roman, ruleMessage } from './presentation';
import { ResourceDisplay } from './resource-display';

type City = LocalView['view']['player']['civilization']['cities'][number];
export type Send = (command: Record<string, unknown>) => Promise<void>;

export function ActionButton({
  action,
  title,
  run,
  busy,
  isPrimary = false,
}: {
  action: LocalAction | undefined;
  title: string;
  run: (a: LocalAction) => void;
  busy: boolean;
  isPrimary?: boolean;
}) {
  if (!action) return null;
  const isAvailable = action.available && !busy;
  const reasonText = action.reason ? ruleMessage(action.reason) : null;

  return (
    <div className={`action-item ${isPrimary ? 'action-item-primary' : ''}`}>
      <button
        type="button"
        className={isPrimary ? 'primary' : ''}
        disabled={!isAvailable}
        title={reasonText ?? title}
        onClick={() => run(action)}
      >
        <span>{title}</span>
      </button>
      {action.cost && <ResourceDisplay values={action.cost} compact />}
      {reasonText && <small className="reason-badge" role="note">{reasonText}</small>}
    </div>
  );
}

export function PopulationManager({
  city,
  send,
  busy,
}: {
  city: City;
  send: Send;
  busy: boolean;
}) {
  const [workers, setWorkers] = useState(city.workers);
  const total = Object.values(workers).reduce((a, b) => a + b, 0);
  const isValid =
    !busy &&
    total === city.population &&
    Object.values(workers).every(n => n >= 0 && Number.isInteger(n));

  return (
    <section className="inspector-section population-section">
      <div className="section-header">
        <h4>Alocação de Habitantes</h4>
        <span className={`pop-counter ${total === city.population ? 'valid' : 'invalid'}`}>
          {total} / {city.population} alocados
        </span>
      </div>

      <div className="population-grid">
        {Object.entries(workers).map(([role, n]) => (
          <label className="population-row" key={role}>
            <div className="role-meta">
              <span className="role-title">{label(role)}</span>
              <small className="role-desc">
                {role === 'producers' ? 'Trabalham o território exterior' :
                 role === 'artisans' ? 'Produzem manufaturas e materiais' :
                 role === 'merchants' ? 'Geram riqueza e mantêm o tesouro' :
                 role === 'scholars' ? 'Desenvolvem conhecimento e arquivos' :
                 role === 'soldiers' ? 'Ainda sem efeito: não produz nem defende' : 'Mão de obra livre'}
              </small>
            </div>
            <input
              aria-label={label(role)}
              type="number"
              min={0}
              max={city.population}
              value={n}
              onChange={e => setWorkers(w => ({ ...w, [role]: Number(e.target.value) }))}
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        className="primary apply-pop-btn"
        disabled={!isValid}
        onClick={() => void send({ type: 'ASSIGN_POPULATION', cityId: city.id, workers })}
      >
        Aplicar distribuição
      </button>
      <small className="hint-text">
        Dica: Reduza territórios trabalhados antes de reduzir produtores abaixo desse total.
      </small>
    </section>
  );
}

export function EconomyTable({
  production,
  labels = {},
  help,
}: {
  production: LocalView['cities'][number]['production'];
  /** Column names that differ from the shared labels (the alpha shows legacy materials as Madeira/Pedra). */
  labels?: Partial<Record<string, string>>;
  help?: string;
}) {
  return (
    <div className="table-scroll">
      <table className="economy-matrix">
        <caption>Produção estimada por manutenção{help && <small> {help}</small>}</caption>
        <thead>
          <tr>
            <th>Fonte</th>
            {Object.keys(production.total).map(k => (
              <th key={k}>{labels[k] ?? label(k)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {production.sources.map(s => (
            <tr key={s.source}>
              <th>{label(s.source)}</th>
              {Object.values(s.delta).map((v, i) => (
                <td key={i} className={v > 0 ? 'pos-val' : v < 0 ? 'neg-val' : ''}>
                  {v > 0 ? `+${v}` : v}
                </td>
              ))}
            </tr>
          ))}
          <tr className="total-row">
            <th>Total Líquido</th>
            {Object.values(production.total).map((v, i) => (
              <td key={i} className={v > 0 ? 'pos-val' : v < 0 ? 'neg-val' : ''}>
                {v > 0 ? `+${v}` : v}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function CityInspector({
  data,
  city,
  send,
  run,
  busy,
  browse,
  assign,
}: {
  data: LocalView;
  city: City;
  send: Send;
  run: (a: LocalAction) => void;
  busy: boolean;
  browse: (kind: string) => void;
  assign: () => void;
}) {
  const details = data.cities.find(c => c.id === city.id);
  const config = data.view.config;
  const infrastructure = data.view.cityInfrastructure.find(c => c.cityId === city.id);
  const isCapital = city.id === data.view.player.civilization.capitalCityId;
  const maxDev = city.development >= config.maxDevelopment;

  return (
    <div className="inspector-content">
      {/* 1. OVERVIEW */}
      <div className="inspector-title">
        <span className="eyebrow">{isCapital ? 'CAPITAL DO REINO' : 'MUNICÍPIO URBANO'}</span>
        <h2>{city.name}</h2>
        <p>{city.population} habitantes · Desenvolvimento {roman[city.development]}</p>
        <div className="vital-badges">
          <span className="badge-pill pop-badge">👥 {city.population} hab</span>
          <span className="badge-pill dev-badge">Nível {roman[city.development]}</span>
          <span className={`badge-pill stability-badge ${details?.category?.toLowerCase()}`}>
            {label(details?.category ?? 'STABLE')} ({city.stability})
          </span>
        </div>
      </div>

      <div className="overview-strip">
        <div className="stability-meter-box">
          <div className="meter-label">
            <span title="Ordem local e coesão das instituições urbanas.">Estabilidade Social</span>
            <b>{city.stability} / 100</b>
          </div>
          <meter min="0" max="100" value={city.stability} aria-label="Estabilidade" />
        </div>
        <p className="meta-line">
          Fundada na Rodada {city.foundedRound} · Crescimento: {city.growthProgress} / {infrastructure?.growthThreshold} alimento
        </p>
      </div>

      {/* 2. ECONOMY */}
      <details open className="inspector-collapsible">
        <summary>Economia & Produção</summary>
        <div className="collapsible-body">
          {details && <EconomyTable production={details.production} />}
          <div className="admin-stat-row">
            <span>Aporte administrativo da infraestrutura:</span>
            <b>+{infrastructure?.administrativeCapacity ?? 0}</b>
          </div>
          <div className="admin-stat-row">
            <span>Capacidade da guarnição defensiva:</span>
            <b>{infrastructure?.garrisonCapacity ?? 0}</b>
          </div>
        </div>
      </details>

      {/* 3. POPULATION */}
      <details open className="inspector-collapsible">
        <summary>Habitantes & Trabalho</summary>
        <div className="collapsible-body">
          <PopulationManager
            key={`${city.id}-${data.view.version}`}
            city={city}
            send={send}
            busy={busy || data.view.phase !== 'PLANNING'}
          />
        </div>
      </details>

      {/* 4. TERRITORY */}
      <details open className="inspector-collapsible">
        <summary>Território Trabalhado</summary>
        <div className="collapsible-body">
          <div className="territory-stat-card">
            <div className="stat-value">
              <b>{city.workedHexIds.length}</b> / {city.workers.producers}
            </div>
            <p>
              {city.workedHexIds.length} trabalhados · {data.workable.length} elegíveis · {city.workers.producers} produtores
            </p>
            <button
              type="button"
              className="action-secondary"
              disabled={busy || data.view.phase !== 'PLANNING'}
              onClick={assign}
            >
              Atribuir território
            </button>
          </div>
        </div>
      </details>

      {/* 5. DEVELOPMENT */}
      <details className="inspector-collapsible">
        <summary>Desenvolvimento e especialização</summary>
        <div className="collapsible-body">
          <div className="tier-info">
            <p title="Capacidade urbana da cidade.">
              Desenvolvimento {roman[city.development]} · Limite populacional {config.developmentPopulationCaps[city.development - 1]}
            </p>
            {!maxDev && (
              <p className="next-tier-hint">
                Próximo: {roman[city.development + 1]} · Limite {config.developmentPopulationCaps[city.development]}
              </p>
            )}
          </div>

          <ActionButton
            action={data.actions.find(a => a.command.type === 'DEVELOP_CITY')}
            title="Desenvolver cidade"
            run={run}
            busy={busy}
            isPrimary
          />

          <div className="specialization-card">
            <span className="spec-label">Especialização Municipal:</span>
            <b>{city.specialization ? label(city.specialization) : 'Não definida'}</b>
            {!city.specialization && (
              <button
                type="button"
                className="action-secondary"
                disabled={busy || data.view.phase !== 'PLANNING'}
                onClick={() => browse('SPECIALIZE_CITY')}
              >
                Escolher especialização
              </button>
            )}
          </div>
        </div>
      </details>

      {/* 6. DISTRICTS & BUILDINGS */}
      <details open className="inspector-collapsible">
        <summary>Distritos & Edifícios</summary>
        <div className="collapsible-body">
          <div className="slots-header">
            <span>Capacidade de Distritos:</span>
            <b>{city.districts.length} / {config.territory.districtSlots[city.development - 1]} slots</b>
          </div>

          <div className="slots">
            {city.districts.map(d => (
              <div className="slot" key={d.type}>
                <div className="slot-head">
                  <b>{label(d.type)}</b>
                  <span className="slot-badge">Distrito</span>
                </div>
                <small className="slot-building">
                  {city.buildings
                    .filter(b => config.territory.buildings[b.type].district === d.type)
                    .map(b => label(b.type))
                    .join(', ') || 'Sem edifício construído'}
                </small>
              </div>
            ))}
            {city.districts.length === 0 && (
              <p className="empty-hint">Nenhum distrito construído. Use slots disponíveis para expandir a cidade.</p>
            )}
          </div>

          <div className="button-row">
            <button
              type="button"
              className="action-secondary"
              disabled={busy || data.view.phase !== 'PLANNING'}
              onClick={() => browse('BUILD_DISTRICT')}
            >
              Construir distrito
            </button>
            <button
              type="button"
              className="action-secondary"
              disabled={busy || data.view.phase !== 'PLANNING'}
              onClick={() => browse('BUILD_BUILDING')}
            >
              Construir edifício
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}

export function HexInspector({
  data,
  hexId,
  run,
  busy,
  browse,
}: {
  data: LocalView;
  hexId: string;
  run: (a: LocalAction) => void;
  busy: boolean;
  browse: (kind: string) => void;
}) {
  const tile = data.view.visibleTerritory.find(t => t.id === hexId);
  if (!tile) return null;

  const cities = [...data.view.player.civilization.cities, ...data.view.visibleCities];
  const worked = data.view.player.civilization.cities.find(c => c.workedHexIds.includes(tile.id));
  const isOwner = tile.ownerId === data.view.player.id;
  const ownerPlayer = data.players.find(p => p.id === tile.ownerId);

  return (
    <div className="inspector-content hex-inspector">
      {/* 1. OVERVIEW */}
      <div className="inspector-title">
        <span className="eyebrow">TERRITÓRIO HEXAGONAL {tile.id}</span>
        <h2>{label(tile.terrain)}</h2>
        <p className="features-list">
          {tile.features.map(label).join(' · ') || 'Sem características geomorfológicas especiais'}
        </p>
      </div>

      {/* 2. SOVEREIGNTY & STATUS */}
      <dl className="status-grid">
        <dt>Soberania</dt>
        <dd className={isOwner ? 'owner-player' : ownerPlayer ? 'owner-foreign' : 'owner-free'}>
          {ownerPlayer?.name ?? 'Livre (Não reclamado)'}
        </dd>

        <dt>Controle Urbano</dt>
        <dd>{cities.find(c => c.id === tile.controllerCityId)?.name ?? 'Nenhum'}</dd>

        <dt>Melhoria</dt>
        <dd>{tile.improvement ? label(tile.improvement) : 'Nenhuma'}</dd>

        <dt>Trabalhado por</dt>
        <dd>
          {worked?.name ?? (tile.ownerId && tile.ownerId !== data.view.player.id ? 'Informação protegida' : 'Ninguém')}
        </dd>

        <dt>Distância da capital</dt>
        <dd>{data.distance} hexes</dd>
      </dl>

      {/* 3. PRODUCTION POTENTIAL */}
      <div className="yield-card">
        <h3>Produção Territorial</h3>
        {tile.yield && <ResourceDisplay values={tile.yield} />}
        <small className="yield-note">
          Rendimento creditado a cada manutenção quando alocado a um produtor ativo.
        </small>
      </div>

      {/* 4. ACTIONS */}
      <div className="hex-actions-panel">
        <h3>Ações Territoriais</h3>
        
        <ActionButton
          action={data.actions.find(a => a.command.type === 'CLAIM_HEX')}
          title="Reivindicar território"
          run={run}
          busy={busy}
          isPrimary
        />

        <div className="action-item">
          <button
            type="button"
            className="action-secondary"
            disabled={busy || data.view.phase !== 'PLANNING' || !isOwner}
            onClick={() => browse('IMPROVE_HEX')}
          >
            Melhorar território
          </button>
        </div>

        <ActionButton
          action={data.actions.find(a => a.command.type === 'FOUND_CITY')}
          title="Fundar cidade"
          run={() => browse('FOUND_CITY')}
          busy={busy}
          isPrimary
        />

        <p className="rule-note">
          Distância mínima entre centros urbanos: {data.view.config.territory.minimumCityDistance} hexes.
        </p>
      </div>
    </div>
  );
}
