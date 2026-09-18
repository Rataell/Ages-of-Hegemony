import { useState } from 'react';
import type { LocalAction, LocalView } from '@aoh/server/local-play';
import { label, roman, ruleMessage } from './presentation';
import { ResourceDisplay } from './resource-display';
type City = LocalView['view']['player']['civilization']['cities'][number];
export type Send = (command: Record<string, unknown>) => Promise<void>;
export function ActionButton({ action, title, run, busy }: { action: LocalAction | undefined; title: string; run: (a: LocalAction) => void; busy: boolean }) {
  if (!action) return null;
  return <div className="action-option"><button disabled={busy || !action.available} title={action.reason ? ruleMessage(action.reason) : title} onClick={() => run(action)}>{title}</button>{action.cost && <ResourceDisplay values={action.cost} compact />}{action.reason && <small className="reason">{ruleMessage(action.reason)}</small>}</div>;
}
export function PopulationManager({ city, send, busy }: { city: City; send: Send; busy: boolean }) {
  const [workers, setWorkers] = useState(city.workers);
  const total = Object.values(workers).reduce((a, b) => a + b, 0);
  return <section><h3>População</h3><p>{total} / {city.population} distribuídos · inclua habitantes livres</p>
    {Object.entries(workers).map(([role, n]) => <label className="population-row" key={role}><span>{label(role)}</span><input aria-label={label(role)} type="number" min={0} max={city.population} value={n} onChange={e => setWorkers(w => ({ ...w, [role]: Number(e.target.value) }))} /></label>)}
    <button disabled={busy || total !== city.population || Object.values(workers).some(n => n < 0 || !Number.isInteger(n))} onClick={() => void send({ type: 'ASSIGN_POPULATION', cityId: city.id, workers })}>Aplicar distribuição</button>
    <small>Reduza territórios trabalhados antes de reduzir produtores abaixo desse total.</small>
  </section>;
}
export function EconomyTable({ production }: { production: LocalView['cities'][number]['production'] }) {
  return <div className="table-scroll"><table><caption>Produção por manutenção</caption><thead><tr><th>Fonte</th>{Object.keys(production.total).map(k => <th key={k}>{label(k)}</th>)}</tr></thead><tbody>{production.sources.map(s => <tr key={s.source}><th>{label(s.source)}</th>{Object.values(s.delta).map((v, i) => <td key={i}>{v > 0 ? '+' : ''}{v}</td>)}</tr>)}<tr><th>Total</th>{Object.values(production.total).map((v, i) => <td key={i}>{v}</td>)}</tr></tbody></table></div>;
}
export function CityInspector({ data, city, send, run, busy, browse, assign }: { data: LocalView; city: City; send: Send; run: (a: LocalAction) => void; busy: boolean; browse: (kind: string) => void; assign: () => void }) {
  const details = data.cities.find(c => c.id === city.id); const config = data.view.config;
  const infrastructure = data.view.cityInfrastructure.find(c => c.cityId === city.id);
  return <><div className="inspector-title"><span className="eyebrow">{city.id === data.view.player.civilization.capitalCityId ? 'CAPITAL' : 'CIDADE'}</span><h2>{city.name}</h2><p>{city.population} habitantes · Desenvolvimento {roman[city.development]}</p></div>
    <section><h3 title="Ordem local e coesão institucional.">Estabilidade <b>{city.stability}</b></h3><meter min="0" max="100" value={city.stability} aria-label="Estabilidade" /><small>{label(details?.category ?? '')}</small><p>Fundada na rodada {city.foundedRound} · Crescimento {city.growthProgress} / {infrastructure?.growthThreshold}</p></section>
    <details open><summary>Habitantes e trabalho</summary><PopulationManager key={`${city.id}-${data.view.version}`} city={city} send={send} busy={busy || data.view.phase !== 'PLANNING'} /><h3>Território</h3><p>{city.workedHexIds.length} trabalhados · {data.workable.length} elegíveis · {city.workers.producers} produtores</p><button disabled={busy || data.view.phase !== 'PLANNING'} onClick={assign}>Atribuir território</button></details>
    <details><summary>Desenvolvimento e especialização</summary><p title="Capacidade urbana da cidade.">Desenvolvimento {roman[city.development]} · Limite populacional {config.developmentPopulationCaps[city.development - 1]}</p>{city.development < config.maxDevelopment && <p>Próximo: {roman[city.development + 1]} · Limite {config.developmentPopulationCaps[city.development]}</p>}<ActionButton action={data.actions.find(a => a.command.type === 'DEVELOP_CITY')} title="Desenvolver cidade" run={run} busy={busy} /><p>Especialização: {city.specialization ? label(city.specialization) : 'Não escolhida'}</p><button onClick={() => browse('SPECIALIZE_CITY')}>Escolher especialização</button></details>
    <details open><summary>Distritos e edifícios</summary><p>{city.districts.length} / {config.territory.districtSlots[city.development - 1]} slots</p><div className="slots">{city.districts.map(d => <div className="slot" key={d.type}><b>{label(d.type)}</b><small>{city.buildings.filter(b => config.territory.buildings[b.type].district === d.type).map(b => label(b.type)).join(', ') || 'Sem edifício'}</small></div>)}</div><div className="button-row"><button onClick={() => browse('BUILD_DISTRICT')}>Construir distrito</button><button onClick={() => browse('BUILD_BUILDING')}>Construir edifício</button></div></details>
    <details><summary>Economia e administração</summary>{details && <EconomyTable production={details.production} />}<p>Capacidade administrativa da infraestrutura: +{infrastructure?.administrativeCapacity}</p><p>Guarnição: {infrastructure?.garrisonCapacity} · sem combate</p></details>
  </>;
}
export function HexInspector({ data, hexId, run, busy, browse }: { data: LocalView; hexId: string; run: (a: LocalAction) => void; busy: boolean; browse: (kind: string) => void }) {
  const tile = data.view.visibleTerritory.find(t => t.id === hexId); if (!tile) return null;
  const cities = [...data.view.player.civilization.cities, ...data.view.visibleCities];
  const worked = data.view.player.civilization.cities.find(c => c.workedHexIds.includes(tile.id));
  return <><div className="inspector-title"><span className="eyebrow">TERRITÓRIO {tile.id}</span><h2>{label(tile.terrain)}</h2><p>{tile.features.map(label).join(' · ') || 'Sem características especiais'}</p></div><dl><dt>Proprietário</dt><dd>{data.players.find(p => p.id === tile.ownerId)?.name ?? 'Livre'}</dd><dt>Controle</dt><dd>{cities.find(c => c.id === tile.controllerCityId)?.name ?? 'Nenhum'}</dd><dt>Melhoria</dt><dd>{tile.improvement ? label(tile.improvement) : 'Nenhuma'}</dd><dt>Trabalhado por</dt><dd>{worked?.name ?? (tile.ownerId && tile.ownerId !== data.view.player.id ? 'Informação privada' : 'Ninguém')}</dd><dt>Distância da cidade</dt><dd>{data.distance} hexes</dd></dl><h3>Produção territorial</h3>{tile.yield && <ResourceDisplay values={tile.yield} />}<p>Produção creditada quando trabalhado por um produtor.</p><ActionButton action={data.actions.find(a => a.command.type === 'CLAIM_HEX')} title="Reivindicar território" run={run} busy={busy} /><button onClick={() => browse('IMPROVE_HEX')}>Melhorar território</button><ActionButton action={data.actions.find(a => a.command.type === 'FOUND_CITY')} title="Fundar cidade" run={() => browse('FOUND_CITY')} busy={busy} /><p>Distância mínima entre cidades: {data.view.config.territory.minimumCityDistance} hexes.</p></>;
}
