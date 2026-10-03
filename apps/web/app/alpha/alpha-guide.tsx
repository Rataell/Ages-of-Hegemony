'use client';
import type { AlphaPlayerView } from '@aoh/server/alpha';

/**
 * In-game rules summary. Every number comes from the match's own rules, so the guide cannot drift from the engine.
 * Only what the Alpha implements is described here.
 */
export function AlphaGuide({ game, onClose }: { game: AlphaPlayerView; onClose: () => void }) {
  const rules = game.rules, units = rules.units;
  return <div className="alpha-modal-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="alpha-modal alpha-guide" role="dialog" aria-modal="true" aria-labelledby="alpha-guide-title">
      <p className="eyebrow">GUIA RÁPIDO</p><h2 id="alpha-guide-title">Como jogar</h2>
      <h3>Como se vence</h3>
      <p>Ao fim de {rules.roundLimit} rodadas vence quem tiver mais <b>Prestígio</b> (empates: pesquisas, população, riqueza). Antes disso, uma civilização na Era da Hegemonia pode declarar um caminho de Hegemonia e vencer ao manter os requisitos por {rules.hegemonyHoldRounds} rodadas completas.</p>
      <p>Prestígio vem de explorar regiões (+1), pesquisar (+1), avançar de era (+2), escolher Prestígio em eventos mundiais (+1), cumprir ambições secretas e concluir Grandes Projetos.</p>
      <h3>A rodada</h3>
      <ol>
        <li><b>Planejamento</b> — todos decidem ao mesmo tempo e em segredo. Você reserva até {game.actions.limit} ações principais e confirma.</li>
        <li><b>Resolução</b> — quando todos confirmam, tudo se resolve por iniciativa: ações das cidades, exploração e movimento, diplomacia, conflitos e manutenção.</li>
        <li><b>Resultados</b> — o painel mostra o que você pôde ver acontecer. A iniciativa gira a cada rodada.</li>
      </ol>
      <p>Confirmou cedo demais? "Voltar a planejar" retira a confirmação enquanto alguém ainda decide.</p>
      <h3>Cidades</h3>
      <p>Cada cidade faz <b>uma ação</b> por rodada: Produzir, Construir (distrito, edifício ou fortificação), Recrutar, Pesquisar, ou Ânimo/Comércio/Cívica. <b>Sem Produzir, a cidade não produz</b> naquela rodada. A barra do topo mostra os recursos e quanto cabe no armazém: o excedente é descartado.</p>
      <h3>Peças</h3>
      <p>Selecione peças no Conselho: o mapa destaca para onde podem ir e o que podem explorar. Cada peça recebe uma ordem por rodada.</p>
      <ul>
        <li><b>{units.PIONEER.name}</b> — funda uma nova cidade onde está (custo de fundação; longe o bastante de outras cidades).</li>
        <li><b>{units.EXPLORER.name}</b> — movimento {units.EXPLORER.movement}; explora uma região vizinha e revela seus 7 hexes.</li>
        <li><b>Militares</b> — atacam peças ou cidades vizinhas de quem está em guerra com você. Longe das suas cidades e territórios ficam sem suprimento e lutam pior.</li>
      </ul>
      <h3>Contato, diplomacia e guerra</h3>
      <p>Avistar uma peça ou cidade de outra civilização estabelece contato e abre a negociação em Diplomacia. Acordos duram {rules.treatyDuration} rodadas depois de aceitos; responder a uma proposta não gasta ação.</p>
      <p>Uma declaração de guerra planejada se resolve antes dos conflitos, então o ataque pode ser reservado na mesma rodada. Nos Conflitos, atacante e defensor podem jogar cartas de reação antes dos dados.</p>
      <h3>Eras</h3>
      <p>Eras & Hegemonia mostra os critérios da próxima era. Quando bastarem, avance de era: novos avanços, peças e caminhos se abrem.</p>
      <button className="primary" onClick={onClose}>Voltar ao jogo</button>
    </section>
  </div>;
}
