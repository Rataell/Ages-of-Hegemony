'use client';
import { useEffect, useRef } from 'react';
import type { AlphaPlayerView } from '@aoh/server/alpha';

/**
 * In-game rules summary. Every number comes from the match's own rules, so the guide cannot drift from the engine.
 * Only what the Alpha implements is described here.
 */
export function AlphaGuide({ game, onClose }: { game: AlphaPlayerView; onClose: () => void }) {
  const rules = game.rules, units = rules.units, panel = useRef<HTMLElement | null>(null);
  // Keyboard: focus moves into the guide and Escape closes it.
  useEffect(() => { panel.current?.focus(); const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onClose]);
  return <div className="alpha-modal-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={panel} tabIndex={-1} className="alpha-modal alpha-guide" role="dialog" aria-modal="true" aria-labelledby="alpha-guide-title">
      <p className="eyebrow">GUIA RÁPIDO</p><h2 id="alpha-guide-title">Como jogar</h2>
      <h3>Como se vence</h3>
      <p>Ao fim de {rules.roundLimit} rodadas vence quem tiver mais <b>Prestígio</b> (empates: pesquisas, população, riqueza e, por fim, iniciativa). Antes disso, uma civilização na Era VII, Ascensão, pode declarar um caminho de Hegemonia e vencer ao manter os requisitos por {rules.hegemonyHoldRounds} rodadas completas.</p>
      <p>Prestígio vem de explorar regiões (+1), pesquisar (+1), avançar de era (+2), escolher Prestígio em eventos mundiais (+1), cumprir ambições secretas e concluir Obras de Legado (+4).</p>
      <h3>A rodada</h3>
      <ol>
        <li><b>Planejamento</b> — todos decidem ao mesmo tempo e em segredo. Você usa até {game.actions.limit} Ordens (Cidade, Expedição, Avanço, Influência, Legado; tipos podem repetir) e confirma.</li>
        <li><b>Resolução</b> — quando todos confirmam, tudo se resolve por iniciativa: ações das cidades, exploração e movimento, diplomacia, conflitos e manutenção.</li>
        <li><b>Resultados</b> — o painel mostra o que você pôde ver acontecer. A iniciativa gira a cada rodada.</li>
      </ol>
      <p>Confirmou cedo demais? "Voltar a planejar" retira a confirmação enquanto alguém ainda decide.</p>
      <h3>Civilização e Figura</h3>
      <p>Você joga uma das <b>10 civilizações históricas</b>: cada uma tem um Traço, uma Limitação, uma Assinatura e três Heranças. A <b>Figura</b> escolhida dá uma <b>Passiva</b> e um <b>Poder 1× por Era</b>. Nem toda Figura governou: há generais, heróis, sábios e profetas. Regras marcadas “planejada” ainda não mudam o jogo.</p>
      <h3>Cidades</h3>
      <p>Cada cidade faz <b>uma ação</b> por rodada: Produzir, Construir (distrito, edifício ou fortificação), Recrutar, Pesquisar, ou Ânimo/Comércio/Cívica. <b>Sem Produzir, a cidade não produz</b> naquela rodada. A barra do topo mostra os recursos e quanto cabe no armazém: o excedente é descartado.</p>
      <h3>Peças</h3>
      <p>Clique na peça no mapa: as ações nascem ao redor dela. Ao escolher Mover, Explorar ou Atacar, o mapa destaca os destinos legais e você clica no hex. Cada peça recebe uma ordem por rodada.</p>
      <ul>
        <li><b>{units.PIONEER.name}</b> — movimento {units.PIONEER.movement}; explora por terra uma Região vizinha e revela seus 7 hexes, ou funda uma cidade onde está e é consumido. Primeiro descobre, depois coloniza.</li>
        <li><b>Frota</b> e <b>Embarcação Costeira</b> — navegam e exploram Regiões pelo mar.</li>
        <li><b>Militares</b> — não exploram. Atacam peças ou cidades vizinhas de quem está em guerra com você. Longe das suas cidades e territórios ficam sem suprimento e lutam pior.</li>
      </ul>
      <h3>Exploração</h3>
      <p><b>Pioneiro explora terra. Frota explora mar. Tropa militar não explora.</b> Se a Região intacta admite várias orientações, você escolhe uma (“Orientação 1 de N”); com uma só, ela é aplicada sozinha. “Requer acesso naval.” quer dizer que só um navio entra ali. A ordem é secreta: o terreno e a Descoberta aparecem na resolução, só para quem revelou.</p>
      <h3>Porto e Obras de Legado</h3>
      <p>O <b>Distrito Marítimo</b> inclui o Porto básico e exige borda d’água navegável; Estaleiro e Farol são opcionais e ainda sem efeito. Uma <b>Obra de Legado</b> é única no mundo: três passos (uma Ordem de Legado cada), +4 Prestígio e um efeito permanente.</p>
      <h3>Contato, diplomacia e guerra</h3>
      <p>Avistar uma peça ou cidade de outra civilização estabelece contato e abre a negociação em Diplomacia. Acordos duram {rules.treatyDuration} rodadas depois de aceitos; responder a uma proposta não gasta ação.</p>
      <p>Em paz, também dá para trocar recursos: troca imediata, presente, promessa futura ou empréstimo. Ofertas valem até o fim da rodada; quem não paga uma promessa ou empréstimo no prazo perde Prestígio.</p>
      <p>Uma declaração de guerra planejada se resolve antes dos conflitos, então o ataque pode ser reservado na mesma rodada. Nos Conflitos, atacante e defensor podem jogar cartas de reação antes dos dados.</p>
      <h3>Eras</h3>
      <p>As Eras passam pelo calendário: {game.milestones.roundsPerEra} rodadas cada, e todos viram juntos. Na Virada, novos avanços, peças e caminhos se abrem e o Poder da Figura volta. Tudo isso está resumido no <b>Compêndio</b>.</p>
      <button className="primary" onClick={onClose}>Voltar ao jogo</button>
    </section>
  </div>;
}
