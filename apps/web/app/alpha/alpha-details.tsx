'use client';
import { useState, type ReactNode } from 'react';
import { stackCategory, stackLabel, type CityState, type StackCategory } from '@aoh/game-domain';
import type { AlphaPlayerView } from '@aoh/server/alpha';
import { PopulationManager } from '../play/inspectors';
import { ResourceDisplay } from '../play/resource-display';
import { label as resourceLabel } from '../play/presentation';
import { alphaLabel as text } from './alpha-copy';
import { CITY_LEVEL, FORTIFICATION, MOOD_BAND, cityActionGate, costText, AlphaUrban } from './alpha-panels';
import { compositionText, composition } from './alpha-army';
import { AttackPreview, postureText } from './alpha-combat';
import type { AlphaSend } from './alpha-board';

/**
 * NO-SCROLL UX · "trade content, don't stack content". Detalhes is ONE frame of fixed height inside the safe area: a fixed header,
 * 2–4 indicators, a row of segments and the content of the ACTIVE segment only. Switching segment swaps the content in place
 * (same width, same height, short fade); nothing grows, nothing scrolls. Actions stay in the cloud on the Mesa.
 */
type Game = AlphaPlayerView;
type Unit = Game['units'][number];

export function Segments<T extends string>({ label, value, onChange, items }: { label: string; value: T; onChange: (next: T) => void; items: readonly (readonly [T, string])[] }) {
  return <div className="alpha-seg" role="tablist" aria-label={label}>{items.map(([key, title]) => <button key={key} type="button" role="tab" aria-selected={value === key} onClick={() => onChange(key)}>{title}</button>)}</div>;
}
/** One frame: header + indicators + segments + the active page. The page is keyed so a swap fades in place. */
export function Frame({ title, subtitle, stats, segments, page, children }: { title: ReactNode; subtitle?: ReactNode; stats?: { key: string; label: string; value: ReactNode; warn?: boolean }[]; segments?: ReactNode; page: string; children: ReactNode }) {
  return <section className="alpha-frame">
    <header className="alpha-frame-head"><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</header>
    {stats && stats.length > 0 && <dl className="alpha-frame-stats">{stats.map(s => <div key={s.key} className={s.warn ? 'is-warn' : ''}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}</dl>}
    {segments}
    <div className="alpha-frame-body" key={page} role="tabpanel">{children}</div>
  </section>;
}

/** Livro pages: segments on top, ONE page below. A page may scroll internally only when it is naturally textual (`scroll`); never nested. */
export type BookPage = { key: string; title: string; node: ReactNode; alert?: boolean; scroll?: boolean };
export function Pages({ label, pages, initial }: { label: string; pages: BookPage[]; initial?: string }) {
  const [page, setPage] = useState(initial ?? pages[0]?.key ?? '');
  const active = pages.find(p => p.key === page) ?? pages[0];
  if (!active) return null;
  return <div className="alpha-pages">
    <div className="alpha-seg" role="tablist" aria-label={label}>{pages.map(p => <button key={p.key} type="button" role="tab" aria-selected={active.key === p.key} onClick={() => setPage(p.key)}>{p.title}{p.alert && <i className="alpha-seg-alert" aria-hidden="true" />}</button>)}</div>
    <div className={`alpha-page${active.scroll ? ' is-scroll' : ''}`} key={active.key} role="tabpanel">{active.node}</div>
  </div>;
}

/* ───────────────────────────── City ───────────────────────────── */
export type CityPage = 'summary' | 'population' | 'production' | 'defense' | 'actions';
const CITY_PAGES = [['summary', 'Resumo'], ['population', 'População'], ['production', 'Produção'], ['defense', 'Defesa'], ['actions', 'Ações']] as const;

export function CityDetails({ game, city, locked, send, manage, page, onPage }: { game: Game; city: CityState; locked: boolean; send: AlphaSend; manage: AlphaSend; page: CityPage; onPage: (page: CityPage) => void }) {
  const details = game.cityDetails.find(c => c.id === city.id), meta = game.cityStates.find(c => c.cityId === city.id), occupation = game.occupations.find(o => o.cityId === city.id);
  if (!details) return <p className="empty-inspector">Cidade sem detalhes.</p>;
  const level = meta ? ['OUTPOST', 'HAMLET', 'VILLAGE', 'CITY', 'GREAT_CITY', 'METROPOLIS', 'IMPERIAL_METROPOLIS'].indexOf(meta.level) + 1 : 0;
  const elevatePlanned = game.self.plannedActions.some(a => a.type === 'URBAN_ACTION' && a.cityId === city.id && a.action === 'ELEVATE');
  const garrison = game.units.filter(u => u.ownerId === game.self.playerId && u.hexId === city.hexId);
  const growth = details.growth, admin = game.administration;
  const stats = meta ? [
    { key: 'pop', label: 'Habitantes', value: `${city.population} / ${meta.ceiling}` },
    { key: 'mood', label: `Ânimo ${meta.mood}/6`, value: MOOD_BAND[meta.moodBand] ?? meta.mood, warn: meta.moodBand === 'REVOLT' || meta.moodBand === 'SHAKEN' },
    { key: 'cap', label: 'Capacidade', value: meta.degraded ? `${meta.capacity}/${meta.baseCapacity}` : meta.capacity, warn: meta.degraded },
    { key: 'act', label: 'Ativações', value: meta.activationsAllowed },
  ] : [];
  return <Frame title={city.name} subtitle={meta ? <><b className="alpha-city-seal" title="Nível construído · Capacidade da ativação">N{level}</b> {CITY_LEVEL[meta.level] ?? meta.level}{meta.degraded ? ` (opera como ${CITY_LEVEL[meta.effectiveLevel]})` : ''} · {city.population} hab.{meta.status === 'OCCUPIED' ? ` · Integração ${meta.integration}%` : ''}</> : undefined}
    stats={stats} page={`city-${page}`} segments={<Segments label="Detalhes da cidade" value={page} onChange={onPage} items={CITY_PAGES} />}>
    {page === 'summary' && <>
      {occupation && <p className="alpha-warning">Cidade ocupada: a integração é feita por Governar, a partir da rodada seguinte à captura.</p>}
      <p className="alpha-line">{growth.civilization.shortage ? 'Falta Alimento: cidades sem sustento perdem um habitante e Ânimo.' : growth.capped ? `No teto do nível (${growth.ceiling} hab.): Eleve a cidade para voltar a crescer.` : growth.willGrow ? `Esta cidade cresce nesta rodada (+1 por ${growth.growCost} Alimento).` : `Crescer custa ${growth.growCost} Alimento; não sobra para esta cidade agora.`}</p>
      {meta && <p className="alpha-line is-muted">Capacidade {meta.capacity}: Produzir trabalha centro + {meta.capacity} hex · Recrutar até {meta.capacity} · Governar recupera até {meta.capacity} de Ânimo{meta.activationsAllowed === 2 ? ' · a 2ª ativação custa 1 Ânimo' : ''}.</p>}
      {meta && <p className="alpha-line is-muted">Distritos {city.districts.length}/{meta.slots}{city.districts.length ? ` (${city.districts.map(d => text(d.type)).join(', ')})` : ''} · Edifícios {city.buildings.length ? city.buildings.map(b => text(b.type)).join(', ') : 'nenhum'} · Administração {admin.load}/{admin.capacity}{admin.overextended ? ' · sobre-extensão' : ''}.</p>}
      {meta?.elevate && <div className="alpha-elevate">
        <p className="alpha-line"><b>Elevar para {CITY_LEVEL[meta.elevate.next]}</b> · {meta.elevate.minPopulation} hab. {city.population >= meta.elevate.minPopulation ? '✓' : '✗'} · {costText(meta.elevate.cost)} · Era {text(meta.elevate.era)}{meta.elevate.advances.length ? ` · ${meta.elevate.advances.map(a => `${a.name} ${a.done ? '✓' : '✗'}`).join(', ')}` : ''}</p>
        <div className="alpha-elevate-row">{meta.elevate.block && <small role="note">{meta.elevate.block}</small>}
          <button type="button" disabled={locked || elevatePlanned || meta.elevate.block !== null || cityActionGate(game, city.id, 'ELEVATE') !== null} onClick={() => void send({ type: 'URBAN_ACTION', cityId: city.id, action: 'ELEVATE' })}>{elevatePlanned ? 'Elevar planejado' : 'Elevar (Ordem Cidade)'}</button></div></div>}
    </>}
    {page === 'population' && <PopulationManager key={`${city.id}-${city.population}-${JSON.stringify(city.workers)}`} city={city} send={async command => { await manage(command); }} busy={locked} />}
    {page === 'production' && <Production production={details.production} />}
    {page === 'defense' && <Defense game={game} city={city} fortification={meta ? FORTIFICATION[meta.fortification] ?? meta.fortification : '—'} garrison={garrison} />}
    {page === 'actions' && <AlphaUrban key={city.id} game={game} locked={locked} send={send} cityId={city.id} />}
  </Frame>;
}

type Production = Game['cityDetails'][number]['production'];
const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
const RES_NAME: Record<string, string> = { materials: 'Madeira/Pedra' };
function Production({ production }: { production: Production }) {
  const name = (key: string) => RES_NAME[key] ?? resourceLabel(key);
  const total = Object.entries(production.total).filter(([, n]) => n !== 0);
  return <div className="alpha-production">
    <p className="alpha-line is-muted">Estimativa por manutenção, já com o sustento.</p>
    <ul className="alpha-chip-row" aria-label="Total líquido">{total.length ? total.map(([key, n]) => <li key={key} className={n > 0 ? 'pos-val' : 'neg-val'}>{signed(n)} {name(key)}</li>) : <li>Nada produzido</li>}</ul>
    <ul className="alpha-sources" aria-label="Fontes">{production.sources.map(source => {
      const items = Object.entries(source.delta).filter(([, n]) => n !== 0);
      return items.length ? <li key={source.source}><b>{resourceLabel(source.source)}</b><span>{items.map(([key, n]) => `${signed(n)} ${name(key)}`).join(' · ')}</span></li> : null;
    })}</ul>
  </div>;
}

function Defense({ game, city, fortification, garrison }: { game: Game; city: CityState; fortification: string; garrison: Unit[] }) {
  const unsupplied = garrison.filter(u => u.supply && !u.supply.supplied).length;
  const threats = game.threatAlerts.filter(alert => alert.cityId === city.id);
  return <div className="alpha-defense">
    <dl className="alpha-kv"><div><dt>Fortificação</dt><dd>{fortification}</dd></div><div><dt>Guarnição</dt><dd>{garrison.length ? compositionText(garrison) : 'nenhuma peça'}</dd></div><div><dt>Suprimento</dt><dd>{garrison.length ? (unsupplied ? `${unsupplied} sem suprimento` : 'abastecida') : '—'}</dd></div></dl>
    {threats.map(alert => <p key={`${alert.kind}-${alert.distance}`} className="alpha-warning">{alert.kind === 'PIRATE' ? 'Piratas' : 'Um bando'} a {alert.distance} hex(es).</p>)}
    <p className="alpha-line is-muted">Ordens de defesa (reforçar, atacar) saem da nuvem da cidade e das peças no mapa.</p>
  </div>;
}

/* ───────────────────────────── Military stack ───────────────────────────── */
export type MilitaryPage = 'summary' | 'composition' | 'supply' | 'orders';
type Rules = Game['rules']['units'];
export function MilitaryDetails({ game, hexId, selected, onSelect, page, onPage, orderLabel, locked, send }: {
  game: Game; hexId: string | null; selected: string[]; onSelect: (ids: string[], on: boolean, hexId: string) => void; page: MilitaryPage; onPage: (page: MilitaryPage) => void;
  orderLabel: (order: Game['self']['orders'][number]) => string; locked: boolean; send: AlphaSend;
}) {
  const mine = game.units.filter(u => u.ownerId === game.self.playerId);
  const members = hexId ? mine.filter(u => u.hexId === hexId) : [];
  const orders = game.self.orders;
  if (!hexId || members.length === 0) return <Frame title="Peças" subtitle="Clique numa peça sua no mapa." page="mil-none" stats={[{ key: 'p', label: 'Peças', value: mine.length }, { key: 'o', label: 'Ordens', value: orders.length }]} >
    {orders.length ? <OrdersList game={game} orderLabel={orderLabel} locked={locked} send={send} /> : <p className="alpha-line is-muted">As ações (Mover, Atacar, Postura) nascem ao redor da peça, no mapa. Aqui ficam só os detalhes.</p>}
  </Frame>;
  const rules: Rules = game.rules.units, hex = game.stacks.hexes[hexId], ids = members.map(u => u.id);
  const military = members.some(u => (rules[u.kind]?.strength ?? 0) > 0), naval = members.some(u => rules[u.kind]?.domain === 'SEA');
  const unsupplied = members.filter(u => u.supply && !u.supply.supplied).length;
  const title = members.length === 1 ? text(members[0]!.kind) : `${naval ? 'Frota' : military ? 'Exército' : 'Civis'} · ${members.length} peças`;
  const items: (readonly [MilitaryPage, string])[] = [['summary', 'Resumo'], ['composition', 'Composição'], ['supply', 'Suprimento'], ...(orders.length ? [['orders', `Ordens · ${orders.length}`] as const] : [])];
  if (!items.some(([key]) => key === page)) page = 'summary';
  const chosen = ids.filter(id => selected.includes(id)).length;
  const present = new Set<StackCategory>(members.map(u => stackCategory(rules[u.kind]!)));
  return <Frame title={title} subtitle={hexId} page={`mil-${page}`} stats={[{ key: 'n', label: 'Peças', value: members.length }, { key: 's', label: 'Suprimento', value: unsupplied ? `${unsupplied} sem` : 'ok', warn: unsupplied > 0 }, { key: 'o', label: 'Ordens', value: orders.length }]}
    segments={<Segments label="Detalhes da pilha" value={page} onChange={onPage} items={items} />}>
    {page === 'summary' && <>
      <ul className="alpha-chip-row" aria-label="Composição">{composition(members).map(entry => <li key={entry.kind}>{entry.label}</li>)}</ul>
      {hex && <p className="alpha-line">{(['military', 'civilians', 'fleets'] as const).filter(c => present.has(c)).map(c => <span key={c} className="alpha-stack-tag" data-full={hex[c].used >= hex[c].limit} title="Limite de pilha por civilização e hex">{stackLabel(c, hex.city)} {hex[c].used}/{hex[c].limit} </span>)}</p>}
      <p className="alpha-line is-muted">Mover, Atacar e Postura saem da nuvem sobre a peça. Selecionar aqui só marca a pilha para a nuvem.</p>
      <button type="button" onClick={() => onSelect(ids, chosen !== ids.length, hexId)}>{chosen === ids.length ? 'Limpar seleção' : ids.length > 1 ? 'Selecionar todas' : 'Selecionar'}</button>
      <small className="alpha-army-count"> {chosen} / {ids.length} selecionadas</small>
    </>}
    {page === 'composition' && <ul className="alpha-piece-grid" aria-label="Peças da pilha">{members.map(unit => <li key={unit.id}><label className="alpha-piece-row"><input type="checkbox" checked={selected.includes(unit.id)} onChange={event => onSelect([unit.id], event.target.checked, hexId)} /><span>{text(unit.kind)}{game.grades[unit.kind] ? <i className="alpha-grau" title={`Grau ${['I', 'II', 'III'][game.grades[unit.kind]! - 1]}`}>{'▮'.repeat(game.grades[unit.kind]!)}</i> : null}</span></label></li>)}</ul>}
    {page === 'supply' && <>
      <dl className="alpha-kv"><div><dt>Abastecidas</dt><dd>{members.length - unsupplied} de {members.length}</dd></div><div><dt>Sem suprimento</dt><dd>{unsupplied}</dd></div></dl>
      <ul className="alpha-piece-grid" aria-label="Suprimento por peça">{members.map(unit => <li key={unit.id} className={unit.supply && !unit.supply.supplied ? 'is-warn' : ''}>{text(unit.kind)} · {unit.supply?.supplied ? 'abastecida' : 'sem suprimento'}</li>)}</ul>
      <p className="alpha-line is-muted">Sem suprimento, a peça perde Força em combate (ataque e defesa).</p>
    </>}
    {page === 'orders' && <OrdersList game={game} orderLabel={orderLabel} locked={locked} send={send} />}
  </Frame>;
}
function OrdersList({ game, orderLabel, locked, send }: { game: Game; orderLabel: (order: Game['self']['orders'][number]) => string; locked: boolean; send: AlphaSend }) {
  return <ul className="alpha-orders-list" aria-label="Ordens reservadas">{game.self.orders.map(o => <li className="alpha-order" key={o.id}><span>{orderLabel(o)}{o.type === 'ATTACK' ? ` · ${postureText(o.posture)}` : ''}</span><button type="button" disabled={locked} onClick={() => void send({ type: 'CANCEL_ORDER', orderId: o.id })}>Cancelar</button>{o.type === 'ATTACK' && game.orderPreviews[o.id] && <AttackPreview preview={game.orderPreviews[o.id]!} />}</li>)}</ul>;
}

/* ───────────────────────────── Territory ───────────────────────────── */
export type TerritoryPage = 'hex' | 'people' | 'threat' | 'culture';
export function TerritoryDetails({ onPing, title, selected, tile, sections, page, onPage, yields }: { onPing?: (() => void) | undefined; title: string; selected: string | null; tile: { owner: string | null; improvement: string | null } | null; sections: { key: TerritoryPage; title: string; node: ReactNode }[]; page: TerritoryPage; onPage: (p: TerritoryPage) => void; yields: Record<string, number> | null }) {
  const keys = sections.map(s => s.key), active = keys.includes(page) ? page : (keys[0] ?? 'hex');
  const current = sections.find(s => s.key === active);
  return <Frame title={title} subtitle={selected ?? undefined} page={`ter-${active}`} segments={sections.length > 1 ? <Segments label="Detalhes do território" value={active} onChange={onPage} items={sections.map(s => [s.key, s.title] as const)} /> : undefined}>
    {current?.node}
    {active === 'hex' && <>{yields && <ResourceDisplay values={yields} compact labels={{ materials: 'Madeira/Pedra' }} />}{tile && <p className="alpha-line">{tile.owner ? `Território de ${tile.owner}` : 'Território livre'} · {tile.improvement ?? 'Sem melhoria'}</p>}<p className="alpha-line is-muted">Reivindicar, Melhorar e Estrada nascem ao clicar no hex, ao redor dele.</p>{onPing && <button type="button" className="aoh-btn is-sm" onClick={onPing}>Marcar para todos</button>}</>}
  </Frame>;
}
