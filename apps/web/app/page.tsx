import 'server-only';
import { buildDebugInspection } from '@aoh/server/debug';

export default async function Home() {
  const { view, trace } = await buildDebugInspection();
  const civilization = view.player.civilization;
  return <main>
    <p className="eyebrow">v0.3 · INSPEÇÃO DE CIVILIZAÇÃO</p>
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
      </dl>
      <h3>Alocação populacional</h3>
      <ul>{Object.entries(city.workers).map(([role, amount]) => <li key={role}>{role}: {amount}</li>)}</ul>
    </section>)}
    <section aria-labelledby="trace"><h2 id="trace">Fluxo demonstrado</h2><ol>{trace.map((step) => <li key={step}>{step}</li>)}</ol></section>
    <p className="note">Dados de demonstração. Sem conexão com partidas reais, comandos no navegador ou efeitos militares futuros.</p>
  </main>;
}
