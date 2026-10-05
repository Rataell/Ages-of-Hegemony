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
  { id: 'mesa', anchor: null, title: 'Esta é a Mesa', text: 'O mapa é a mesa inteira. Tudo o mais aparece só quando você pede: a Faixa no topo, a Bandeja embaixo, o Cartão ao lado do que você seleciona, o Cofre e o Livro.' },
  { id: 'strip', anchor: '.alpha-strip-when', title: 'Era e rodada', text: 'A Faixa mostra a Era, a rodada e a fase. Os selos à direita são os outros lugares da mesa: ✓ quando alguém já confirmou, … enquanto ainda decide.' },
  { id: 'city', anchor: '.alpha-context', title: 'O Cartão da cidade', text: 'Clique numa cidade e o Cartão abre ao lado. Cada cidade faz uma ação por rodada. Sem “Produzir”, ela não produz nada nesta rodada.' },
  { id: 'pieces', anchor: 'svg.world-map .art-stack', title: 'Peças no mapa', text: 'A forma diz o que a peça é; a cor diz de quem é. Caravana com bandeira: Pioneiro, que explora regiões e funda cidades (uma coisa por Ordem). Carta lacrada: Enviado. Clique na peça para dar ordens.' },
  { id: 'hand', anchor: '.alpha-hand-fan', title: 'Sua mão', text: 'As cartas ficam recolhidas aqui embaixo. Passe o mouse para levantar o leque e clique numa carta para vê-la em foco. As cartas com a bandeira são da sua civilização e voltam a cada Era.' },
  { id: 'cofre', anchor: '.alpha-strip-tools', title: 'Cofre e Livro', text: 'O Cofre abre seus recursos e limites de armazém. O Livro guarda o Conselho, a Teia, as Cartas, a Diplomacia, as Eras e as Crônicas. Esc volta ao mapa.' },
  { id: 'tray', anchor: '.alpha-tray .advance-phase-btn', title: 'Uma decisão por vez', text: 'O único botão dourado é a próxima decisão. Quando terminar de planejar, confirme aqui. Todos planejam ao mesmo tempo; a rodada se resolve quando todos confirmam.' },
  { id: 'result', anchor: '.alpha-resolution-phase', title: 'Resultados', text: 'A cada rodada, o que aconteceu aparece aqui e também sobre o mapa: um halo marca o hex de cada acontecimento.', when: game => game.roundReports.some(report => report.resolution.length > 0) },
  { id: 'event', anchor: '.alpha-livro-button', title: 'Evento mundial', text: 'Um evento pede uma escolha: um recurso agora ou 1 Prestígio. Está em Cartas & Projetos, no Livro. O ponto no botão Livro avisa quando algo espera você.', when: game => !!game.worldEvent && game.worldDecisionPending },
  { id: 'contact', anchor: '.alpha-livro-button', title: 'Contato', text: 'Você avistou outra civilização. A Diplomacia abriu no Livro: tratados duram algumas rodadas, e responder a uma proposta não gasta ação.', when: game => game.self.contacts.length > 0 },
  { id: 'port', anchor: 'svg.world-map .art-stack[data-lead="COASTAL_VESSEL"], svg.world-map .art-stack[data-lead="FLEET"]', title: 'No mar', text: 'Navios saem de cidades portuárias. Peças terrestres embarcam num navio vizinho (1 ação) e navegam com ele; desembarcam numa costa ao lado. Um navio afundado leva a carga, salvo o que alcançar a costa.', when: game => game.units.some(unit => unit.ownerId === game.view.player.id && ['FLEET', 'COASTAL_VESSEL'].includes(unit.kind)) },
  { id: 'war', anchor: '.alpha-tray', title: 'Guerra', text: 'Em guerra, seu exército entra no território inimigo; entrar na cidade é sempre um ataque. Nos Conflitos, cartas de reação somam Força antes dos dados. Peças longe das suas cidades ficam sem suprimento e lutam pior.', when: game => game.wars.length > 0 },
  { id: 'era', anchor: '.alpha-livro-button', title: 'Virada de Era', text: 'Esta é a última rodada da Era. Na próxima, todos passam juntos: novos avanços, peças e caminhos se abrem, o poder do Líder volta e sua carta de civilização da Era volta à mão.', when: game => game.milestones.roundsUntilNext === 1 },
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

export function AlphaTour({ game, roomId, open, onOpenChange }: { game: Game; roomId: string; open: 'tour' | 'tips' | null; onOpenChange: (open: 'tour' | 'tips' | null) => void }) {
  const [progress, setProgress] = useState<Progress>(() => load(roomId));
  const [step, setStep] = useState(0), [tip, setTip] = useState<TourStep | null>(null);
  const update = (next: Progress) => { setProgress(next); save(roomId, next); };
  const basics = TOUR_STEPS.filter(s => !s.when);
  // First match in this browser: the tour offers itself once; after that only situational tips fire.
  // The tour offers itself once per browser; `aoh-tour=off` in the URL (test harnesses) skips it.
  useEffect(() => { const off = typeof location !== 'undefined' && new URLSearchParams(location.search).get('aoh-tour') === 'off'; if (off) { try { localStorage.setItem('aoh-tour-off', '1'); } catch { /* no storage */ } } let muted = off; try { muted ||= localStorage.getItem('aoh-tour-off') === '1'; } catch { /* no storage */ } if (!muted && !progress.tourDone && open === null && game.view.round === 1) onOpenChange('tour'); }, []);
  useEffect(() => {
    let muted = false; try { muted = localStorage.getItem('aoh-tour-off') === '1'; } catch { /* no storage */ }
    if (open || tip || progress.tipsOff || !progress.tourDone || muted) return;
    const due = TOUR_STEPS.find(s => s.when && !progress.done.includes(s.id) && s.when(game));
    if (due) setTip(due);
  }, [game, open, tip, progress]);
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
  if (tip) return <Callout step={tip} index={0} total={1} mode="tip" onNext={closeTip} onClose={closeTip} onTips={() => { closeTip(); onOpenChange('tips'); }} />;
  return null;
}
