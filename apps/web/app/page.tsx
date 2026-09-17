import 'server-only';
import { buildTerritoryInspection } from '@aoh/server/debug';

export default async function Home() {
  const { view, trace, migration } = await buildTerritoryInspection();
  const civilization = view.player.civilization;
  return <main>
    <p className="eyebrow">v0.4 · ECONOMIA TERRITORIAL</p>
    <h1>Ages of Hegemony</h1>
    <p>Cenário local determinístico, somente leitura. Os valores abaixo são calculados no servidor pelo motor do jogo.</p>
    <section aria-labelledby="civilization"><h2 id="civilization">{view.player.name}</h2>
      <dl>
        <dt>Governo</dt><dd>{civilization.government}</dd>
        <dt>Capacidade administrativa</dt><dd>{civilization.administrativeCapacity}</dd>
        <dt>Carga administrativa</dt><dd>{civilization.administrativeLoad}</dd>
        <dt>Administração</dt><dd>{civilization.administrationStatus}</dd>
        <dt>Pontos de comando</dt><dd>{view.commandPoints}</dd>
        <dt>Rodada / fase</dt><dd>{view.round} / {view.phase}</dd>
      </dl>
      <h3>Recursos</h3><ul>{Object.entries(view.player.resources).map(([name, amount]) => <li key={name}>{name}: {amount}</li>)}</ul>
    </section>
    {civilization.cities.map((city) => <section key={city.id} aria-labelledby={`city-${city.id}`}>
      <h2 id={`city-${city.id}`}>{city.name}</h2>
      <dl>
        <dt>População</dt><dd>{city.population}</dd>
        <dt>Estabilidade</dt><dd>{city.stability} / 100</dd>
        <dt>Desenvolvimento</dt><dd>{city.development}</dd>
        <dt>Especialização</dt><dd>{city.specialization ?? 'Não escolhida'}</dd>
        <dt>Progresso de crescimento</dt><dd>{city.growthProgress}</dd>
        <dt>Hexágonos trabalhados</dt><dd>{city.workedHexIds.join(' · ') || 'Nenhum'}</dd>
        <dt>Distritos</dt><dd>{city.districts.map((district) => district.type).join(', ') || 'Nenhum'}</dd>
        <dt>Edifícios</dt><dd>{city.buildings.map((building) => building.type).join(', ') || 'Nenhum'}</dd>
        <dt>Limiar local de crescimento</dt><dd>{view.cityInfrastructure.find((entry) => entry.cityId === city.id)?.growthThreshold}</dd>
        <dt>Capacidade de guarnição (sem combate)</dt><dd>{view.cityInfrastructure.find((entry) => entry.cityId === city.id)?.garrisonCapacity}</dd>
      </dl>
      <h3>Alocação populacional</h3>
      <ul>{Object.entries(city.workers).map(([role, amount]) => <li key={role}>{role}: {amount}</li>)}</ul>
    </section>)}
    <section aria-labelledby="territory"><h2 id="territory">Território visível</h2>
      <div className="table-scroll"><table><thead><tr><th>q, r</th><th>Terreno / características</th><th>Proprietário / cidade</th><th>Melhoria</th><th>Yield F / M / W</th></tr></thead>
        <tbody>{view.visibleTerritory.map((tile) => <tr key={tile.id}><td>{tile.q}, {tile.r}</td><td>{tile.terrain}<br/>{tile.features.join(', ')}</td><td>{tile.ownerId ?? 'Livre'}<br/>{tile.controllerCityId ?? '—'}</td><td>{tile.improvement ?? '—'}</td><td>{tile.yield ? `${tile.yield.food} / ${tile.yield.materials} / ${tile.yield.wealth}` : tile.yieldError}</td></tr>)}</tbody>
      </table></div>
    </section>
    <section aria-labelledby="economy"><h2 id="economy">Última manutenção: produção detalhada</h2>
      {view.lastEconomy?.breakdown?.cities.map((city) => <div key={city.cityId}>
        <h3>{city.cityId}</h3><div className="table-scroll"><table><thead><tr><th>Fonte</th><th>Food</th><th>Materials</th><th>Wealth</th><th>Knowledge</th><th>Influence</th></tr></thead>
          <tbody>{city.sources.map((source) => <tr key={source.source}><th scope="row">{source.source}</th>{Object.entries(source.delta).map(([key, value]) => <td key={key}>{value}</td>)}</tr>)}
          <tr><th scope="row">Produção da cidade</th>{Object.entries(city.total).map(([key, value]) => <td key={key}>{value}</td>)}</tr></tbody>
        </table></div>
      </div>)}
      <h3>Reconciliação civilizacional</h3>
      <p>Ajuste administrativo: {JSON.stringify(view.lastEconomy?.breakdown?.administrativeAdjustment)}</p>
      <p>Crédito de produção: {JSON.stringify(view.lastEconomy?.breakdown?.credited)}</p>
      <p>Alimento consumido: {view.lastEconomy?.breakdown?.foodPaid}</p>
      <p>Variação líquida do estoque: {JSON.stringify(view.lastEconomy?.breakdown?.netChange)}</p>
      <p>Migração demonstrada: v{migration.from} → v{migration.to}; terreno {migration.terrain}.</p>
    </section>
    <section aria-labelledby="trace"><h2 id="trace">Fluxo demonstrado</h2><ol>{trace.map((step) => <li key={step}>{step}</li>)}</ol></section>
    <p className="note">Dados de demonstração. Sem conexão com partidas reais, comandos no navegador ou efeitos militares futuros.</p>
  </main>;
}
