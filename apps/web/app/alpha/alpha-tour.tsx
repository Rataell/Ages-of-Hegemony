'use client';
import { useEffect, useLayoutEffect, useState } from 'react';
import type { AlphaRoomView } from '@aoh/server/alpha';

type Game = NonNullable<AlphaRoomView['game']>;
/**
 * The tour and the tips (Mesa onboarding). A step points at a real element of the table and says what it is for.
 * The tour runs the steps in order; tips fire once each, the first time their situation appears, and every tip can be
 * reread from "Dicas". Progress is per browser (localStorage) and never leaves it.
 */
export interface TourStep {
  id: string;
  /** CSS selector of the element to point at; null = centered card. */
  anchor: string | null;
  title: string;
  text: string;
  /** When present, the tip fires by itself the first time this returns true. */
  when?: (game: Game) => boolean;
}
export const TOUR_STEPS: TourStep[] = [
  { id: 'mesa', anchor: null, title: 'Esta é a Mesa', text: 'O mapa é a mesa inteira. Tudo o mais aparece só quando você pede: a Faixa no topo, a Bandeja embaixo, as ações ao redor da peça que você toca, o Cofre e o Livro.' },
  { id: 'strip', anchor: '.alpha-strip-when', title: 'Era e rodada', text: 'A Faixa mostra a Era, a rodada e a fase. Os selos à direita são os outros lugares da mesa: ✓ quando alguém já confirmou, … enquanto ainda decide.' },
  { id: 'city', anchor: null, title: 'Toque na cidade', text: 'Clique numa cidade e suas ações nascem ao redor dela: Produzir, Construir, Recrutar, Governar. Cada cidade faz uma ação por rodada; sem “Produzir”, ela não produz nada nesta rodada.' },
  { id: 'pieces', anchor: 'svg.world-map .art-stack', title: 'Peças no mapa', text: 'A forma diz o que a peça é; a cor diz de quem é. Clique na peça: Mover, Fundar ou Atacar nascem ao redor dela, e o mapa mostra os destinos. Entrar numa Região fechada também é Mover. Uma Ordem por peça e por rodada.' },
  { id: 'explore', anchor: 'svg.world-map .art-stack', title: 'Mover é descobrir', text: 'Não existe uma Ordem de explorar: Mover o Pioneiro para uma Região fechada destacada a revela. Entrar é o último passo do movimento. Tropa só entra no desconhecido junto de um Pioneiro (escolta). Se houver mais de uma orientação possível, você escolhe uma. Nada aparece antes de a rodada ser resolvida.' },
  { id: 'details', anchor: '.alpha-context-open, .alpha-context', title: 'Detalhes', text: 'Detalhes é só leitura, uma página por vez: Resumo, População, Produção, Defesa. Agir é sempre pela nuvem ao redor da peça ou da cidade, no mapa.' },
  { id: 'civ', anchor: '.alpha-strip-civ', title: 'Tabuleiro da Civilização', text: 'Clique no selo da sua civilização: a Teia (pesquisa), a Ressonância (5 encaixes), a Herança, a Figura (uma Passiva e um Poder 1× por Era) e o Governo ficam ali, numa superfície só, sem rolar.' },
  { id: 'compendium', anchor: '.alpha-compendium-button', title: 'Compêndio', text: 'As 10 civilizações, as 30 Figuras, Heranças, Porto, Obras de Legado, Exploração, Descobertas e mapas, uma página curta para cada. Abra quando quiser conferir uma regra.' },
  { id: 'hand', anchor: '.alpha-hand-fan', title: 'Sua mão', text: 'As cartas ficam recolhidas aqui embaixo. Passe o mouse para levantar o leque e clique numa carta para vê-la em foco. A carta da sua Figura também está na mão: abra-a para ler a Passiva e usar o Poder (1× por Era). As cartas com a bandeira são da sua civilização e voltam a cada Era.' },
  { id: 'cofre', anchor: '.alpha-tray-cofre', title: 'Cofre', text: 'Seus oito recursos ficam sempre visíveis aqui, na Bandeja. Um número âmbar é armazém cheio: o excedente se perde. Toque para ver os limites e a Administração.' },
  { id: 'livro', anchor: '.alpha-strip-tools', title: 'Livro, Reagir e Áudio', text: 'O Livro guarda o Conselho (inclui Mesa: presença, suspender, votações), a Teia, as Cartas, a Diplomacia, as Eras e as Crônicas. Reagir manda um sinal social aos outros jogadores. Áudio liga a música (começa desligada) e os efeitos. Esc volta ao mapa.' },
  { id: 'tray', anchor: '.alpha-tray .advance-phase-btn', title: 'Uma decisão por vez', text: 'O único botão dourado é a próxima decisão. Quando terminar de planejar, confirme aqui. Todos planejam ao mesmo tempo; a rodada se resolve quando todos confirmam.' },
  { id: 'result', anchor: '.alpha-resolution-phase', title: 'Resultados', text: 'A cada rodada, o que aconteceu aparece aqui e também sobre o mapa: um halo marca o hex de cada acontecimento.', when: game => game.roundReports.some(report => report.resolution.length > 0) },
  { id: 'event', anchor: '.alpha-livro-button', title: 'Evento mundial', text: 'Um evento pede uma escolha: um recurso agora ou 1 Prestígio. Está em Cartas & Projetos, no Livro. O ponto no botão Livro avisa quando algo espera você.', when: game => !!game.worldEvent && game.worldDecisionPending },
  { id: 'contact', anchor: '.alpha-livro-button', title: 'Contato', text: 'Você avistou outra civilização. A Diplomacia abriu no Livro: tratados duram algumas rodadas, e responder a uma proposta não gasta ação.', when: game => game.self.contacts.length > 0 },
  { id: 'port', anchor: 'svg.world-map .art-stack[data-lead="COASTAL_VESSEL"], svg.world-map .art-stack[data-lead="FLEET"]', title: 'No mar', text: 'Navios saem do Porto, que vem no Distrito Marítimo (só em cidade com borda d’água navegável). Um navio abre uma Região do mar se levar um Pioneiro a bordo (ou, depois de Navegação Oceânica, sozinho). Peças terrestres embarcam num navio vizinho (1 ação) e navegam com ele; desembarcam numa costa ao lado. Um navio afundado leva a carga, salvo o que alcançar a costa.', when: game => game.units.some(unit => unit.ownerId === game.view.player.id && ['FLEET', 'COASTAL_VESSEL'].includes(unit.kind)) },
  { id: 'war', anchor: '.alpha-tray', title: 'Guerra', text: 'Em guerra, seu exército entra no território inimigo; entrar na cidade é sempre um ataque. Nos Conflitos, cartas de reação somam Força antes dos dados. Peças longe das suas cidades ficam sem suprimento e lutam pior.', when: game => game.wars.length > 0 },
  { id: 'naval', anchor: 'svg.world-map .art-stack', title: 'Requer acesso naval', text: 'Uma Região sem entrada por terra não pode ser aberta pelo Pioneiro a pé: só um navio a abre, levando um Pioneiro a bordo ou depois de Navegação Oceânica.', when: game => Object.values(game.unitOptions).some(option => option.frontier.some(region => region.block !== null)) },
  { id: 'works', anchor: '.alpha-livro-button', title: 'Obras de Legado', text: 'Uma cidade sua já pode iniciar uma Obra de Legado: três passos, um por Ordem de Legado; ao concluir, +4 Prestígio e um efeito permanente. Fica em Cartas & Projetos, no Livro.', when: game => game.legacyWorks.some(work => !work.progress && work.cities.some(city => city.blocker === null)) },
  { id: 'era', anchor: '.alpha-livro-button', title: 'Virada de Era', text: 'Esta é a última rodada da Era. Na próxima, todos passam juntos: novos avanços, peças e caminhos se abrem, o Poder da Figura volta e sua carta de civilização da Era volta à mão.', when: game => game.milestones.roundsUntilNext === 1 },
];
const KEY = (roomId: string) => `aoh-tour-${roomId}`;
type Progress = { done: string[]; tourDone: boolean; tipsOff: boolean };
const load = (roomId: string): Progress => { try { return { done: [], tourDone: false, tipsOff: false, ...JSON.parse(localStorage.getItem(KEY(roomId)) ?? '{}') }; } catch { return { done: [], tourDone: false, tipsOff: false }; } };
const save = (roomId: string, progress: Progress) => { try { localStorage.setItem(KEY(roomId), JSON.stringify(progress)); } catch { /* private mode: the tour repeats after reload */ } };

function Callout({ step, index, total, onNext, onClose, onTips, mode }: { step: TourStep; index: number; total: number; onNext: () => void; onClose: () => void; onTips: () => void; mode: 'tour' | 'tip' }) {
  const [box, setBox] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => { const el = step.anchor ? document.querySelector(step.anchor) : null; const r = el?.getBoundingClientRect(); setBox(r && r.width > 0 ? { top: r.top, left: r.left, width: r.width, height: r.height } : null); };
    measure(); const id = window.setInterval(measure, 400); window.addEventListener('resize', measure);
    return () => { window.clearInterval(id); window.removeEventListener('resize', measure); };
  }, [step]);
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'Enter') onNext(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onClose, onNext]);
  // The card sits under or beside its anchor, kept inside the viewport.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1366, vh = typeof window !== 'undefined' ? window.innerHeight : 768, W = Math.min(340, vw - 24);
  let style: React.CSSProperties = { left: (vw - W) / 2, top: vh * 0.3 };
  if (box) {
    const below = box.top + box.height + 12, above = box.top - 12, left = Math.max(12, Math.min(vw - W - 12, box.left + box.width / 2 - W / 2));
    style = below + 180 < vh ? { left, top: below } : above - 180 > 0 ? { left, bottom: vh - above } : { left: Math.max(12, Math.min(vw - W - 12, box.left - W - 12)), top: Math.max(12, box.top) };
  }
  return <div className="alpha-tour" role="dialog" aria-modal="false" aria-labelledby="alpha-tour-title">
    {box && <div className="alpha-tour-halo" style={{ top: box.top - 6, left: box.left - 6, width: box.width + 12, height: box.height + 12 }} aria-hidden="true" />}
    <section className="alpha-tour-card aoh-glass" style={{ ...style, width: W }}>
      <p className="aoh-eyebrow">{mode === 'tour' ? `Tour · ${index + 1} de ${total}` : 'Dica'}</p>
      <h3 id="alpha-tour-title">{step.title}</h3><p>{step.text}</p>
      <div className="alpha-tour-actions">
        {mode === 'tour' ? <><button type="button" className="aoh-btn is-sm is-ghost" onClick={onClose}>Pular tour</button><button type="button" className="aoh-btn is-sm" onClick={onNext}>{index + 1 < total ? 'Próximo' : 'Começar a jogar'}</button></> : <><button type="button" className="aoh-btn is-sm is-ghost" onClick={onTips}>Todas as dicas</button><button type="button" className="aoh-btn is-sm" onClick={onClose}>Entendi</button></>}
      </div>
    </section>
  </div>;
}

export function AlphaTour({ game, roomId, open, onOpenChange, suspended = false }: { game: Game; roomId: string; open: 'tour' | 'tips' | null; onOpenChange: (open: 'tour' | 'tips' | null) => void; suspended?: boolean }) {
  const [progress, setProgress] = useState<Progress>(() => load(roomId));
  const [step, setStep] = useState(0), [tip, setTip] = useState<TourStep | null>(null);
  const update = (next: Progress) => { setProgress(next); save(roomId, next); };
  const basics = TOUR_STEPS.filter(s => !s.when);
  // First match in this browser: the tour offers itself once; after that only situational tips fire.
  // The tour offers itself once per browser; `aoh-tour=off` in the URL (test harnesses) skips it.
  useEffect(() => { const off = typeof location !== 'undefined' && new URLSearchParams(location.search).get('aoh-tour') === 'off'; if (off) { try { localStorage.setItem('aoh-tour-off', '1'); } catch { /* no storage */ } } let muted = off; try { muted ||= localStorage.getItem('aoh-tour-off') === '1'; } catch { /* no storage */ } if (!muted && !progress.tourDone && open === null && game.view.round === 1) onOpenChange('tour'); }, []);
  useEffect(() => {
    let muted = false; try { muted = localStorage.getItem('aoh-tour-off') === '1'; } catch { /* no storage */ }
    if (open || tip || suspended || progress.tipsOff || !progress.tourDone || muted) return;
    const due = TOUR_STEPS.find(s => s.when && !progress.done.includes(s.id) && s.when(game));
    if (due) setTip(due);
  }, [game, open, tip, progress, suspended]);
  const finishTour = () => { update({ ...progress, tourDone: true, done: [...new Set([...progress.done, ...basics.map(s => s.id)])] }); setStep(0); onOpenChange(null); };
  const closeTip = () => { if (tip) update({ ...progress, done: [...new Set([...progress.done, tip.id])] }); setTip(null); };
  if (open === 'tour') { const current = basics[step]!; return <Callout step={current} index={step} total={basics.length} mode="tour" onNext={() => step + 1 < basics.length ? setStep(step + 1) : finishTour()} onClose={finishTour} onTips={() => onOpenChange('tips')} />; }
  if (open === 'tips') return <div className="alpha-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onOpenChange(null); }}>
    <section className="alpha-modal alpha-tips" role="dialog" aria-modal="true" aria-labelledby="alpha-tips-title">
      <p className="eyebrow">DICAS</p><h2 id="alpha-tips-title">Como a Mesa funciona</h2>
      <div className="alpha-tips-list">{TOUR_STEPS.map(s => <article key={s.id} className={progress.done.includes(s.id) ? 'is-seen' : ''}><h3>{s.title}</h3><p>{s.text}</p></article>)}</div>
      <div className="alpha-tour-actions">
        <label className="alpha-tips-toggle"><input type="checkbox" checked={!progress.tipsOff} onChange={e => update({ ...progress, tipsOff: !e.target.checked })} /> Mostrar dicas automáticas quando algo novo acontecer</label>
        <button type="button" className="aoh-btn is-sm" onClick={() => { setStep(0); onOpenChange('tour'); }}>Refazer o tour</button>
        <button type="button" className="aoh-btn is-sm" onClick={() => onOpenChange(null)}>Voltar ao jogo</button>
      </div>
    </section>
  </div>;
  if (tip && !suspended) return <Callout step={tip} index={0} total={1} mode="tip" onNext={closeTip} onClose={closeTip} onTips={() => { closeTip(); onOpenChange('tips'); }} />;
  return null;
}
