'use client';
import { useState } from 'react';
import { ALPHA_CARDS, ERA_TURN_STEPS } from '@aoh/game-domain';
import type { AlphaPlayerView } from '@aoh/server/alpha';
import { alphaLabel as text } from './alpha-copy';
import type { AlphaSend } from './alpha-board';
import { reformState } from './reform';

/** The Era turn (canon §22): nine steps, the first six already run, one CTA to confirm and move to the next Era. */
export function AlphaEraTurn({ game, locked, send }: { game: AlphaPlayerView; locked: boolean; send: AlphaSend }) {
  const turn = game.eraTurn;
  if (!turn) return null;
  const swapped = game.self.ambitionSwapEra === turn.era;
  const unfinished = game.self.ambitions.filter(id => !game.self.completedAmbitions.includes(id));
  const waiting = turn.awaiting.length;
  return <section className="alpha-era-turn" role="dialog" aria-label="Virada de Era">
    <p className="eyebrow">VIRADA DE ERA · {text(turn.era)}</p>
    <h2>Passo {turn.step} de 9: {ERA_TURN_STEPS[turn.step - 1]}</h2>
    <ol className="alpha-era-steps" aria-label="Passos da Virada">{ERA_TURN_STEPS.map((name, index) => {
      const step = index + 1, entry = turn.log.find(item => item.step === step);
      return <li key={name} data-state={step < turn.step ? 'done' : step === turn.step ? 'current' : 'next'} aria-current={step === turn.step ? 'step' : undefined}><b>{step}. {name}</b>{entry && <small>{entry.summary}</small>}</li>;
    })}</ol>
    {game.self.pendingChoices.length > 0 && <article className="alpha-card alpha-choices" aria-label="Decisões pendentes">{game.self.pendingChoices.map(choice => <div key={choice.id} className="alpha-choice">
      <small>{choice.source === 'REPERCUSSION' ? 'Repercussão' : choice.source === 'ENCOUNTER' ? 'Encontro' : 'Pulso'}</small><h3>{choice.title}</h3><p>{choice.text}</p>
      <div>{choice.options.map(option => <button key={option.id} disabled={locked} onClick={() => void send({type:'RESOLVE_CHOICE',choiceId:choice.id,optionId:option.id})}>{option.label}</button>)}</div></div>)}</article>}
    {unfinished.length > 0 && <details className="alpha-era-swap"><summary>Trocar uma Ambição não concluída{swapped ? ' (já trocada nesta Virada)' : ''}</summary>
      {unfinished.map(id => <p key={id}><span>{ALPHA_CARDS.find(card => card.id === id)?.name ?? id}</span><button disabled={locked || swapped} onClick={() => void send({type:'SWAP_AMBITION',cardId:id})}>Trocar</button></p>)}</details>}
    <small role="status">{game.self.ready ? 'Você confirmou. ' : 'Use “Confirmar Virada” na bandeja. '}{waiting ? `${waiting} civilização(ões) ainda não confirmaram.` : 'Todas confirmaram.'}</small>
  </section>;
}

/** Reform picker: visible only in the last round of an Era (reservation) and lists only governments the Web already opened. */
export function GovernmentReform({ game, locked, manage }: { game: AlphaPlayerView; locked: boolean; manage: AlphaSend }) {
  const info = game.government;
  if (game.phase !== 'PLANNING' || !info.window) return null;
  const others = info.options.filter(option => option.government !== info.current.government);
  // No eligible government: no false decision, one informative line.
  if (reformState(info) === 'none') return <p className="alpha-hint alpha-government-none" role="status">Reforma de governo: nenhuma reforma disponível. A Teia ainda não abriu outro governo. Siga com o planejamento.</p>;
  return <details className="alpha-government" open><summary>Reforma de governo · Ordem Influência{info.planned ? ' · reservada' : ''}</summary>
    {info.planned
      ? <p>Reforma para {text(info.planned)} reservada: acontece no passo 5 da Virada de Era, por {info.cost} Influência.</p>
      : <ul>{others.map(option => <li key={option.government} data-unlocked={option.unlocked}>
        <span><b>{option.name}</b><small>＋ {option.advantages.join(' · ')} · － {option.limitation}</small></span>
        <button disabled={locked || option.block !== null || !option.unlocked} title={option.block ?? `Custa ${info.cost} Influência`} onClick={() => void manage({type:'ADOPT_GOVERNMENT',government:option.government})}>{option.block ?? (option.unlocked ? `Reservar por ${info.cost} Influência` : 'Teia ainda não abriu')}</button></li>)}</ul>}
  </details>;
}

/**
 * Governo (strategic surface): ONE frame. List mode: the government in force + the eligible ones as compact cards + "Ainda fechados: N".
 * Choosing a card swaps the same space for that government's detail ("← Voltar aos governos"). A reform can only be reserved in the
 * last round of an Era; outside that window the detail is read-only, so nothing is hidden.
 */
export function GovernmentPanel({ game, locked, manage }: { game: AlphaPlayerView; locked: boolean; manage: AlphaSend }) {
  const info = game.government, state = reformState(info);
  const [sel, setSel] = useState<string | null>(null), [showClosed, setShowClosed] = useState(false);
  const others = info.options.filter(option => option.government !== info.current.government);
  const eligible = others.filter(option => option.unlocked && option.block === null), closed = others.filter(option => !(option.unlocked && option.block === null));
  const open = info.window && !info.planned;
  const chosen = sel ? others.find(option => option.government === sel) ?? null : null;
  const note = info.planned ? <p className="alpha-line" role="status">Reforma para <b>{text(info.planned)}</b> reservada: acontece no passo 5 da Virada de Era, por {info.cost} Influência.</p>
    : !info.window ? <p className="alpha-line is-muted">A reforma se reserva na última rodada de cada Era (Ordem Influência).</p> : null;
  if (chosen) return <div className="alpha-government-panel is-detail">
    <button type="button" className="aoh-btn is-sm is-ghost alpha-back" onClick={() => setSel(null)}>← Voltar aos governos</button>
    <article className="alpha-gov-detail"><h4>{chosen.name}</h4><ul>{chosen.advantages.map(line => <li key={line}>＋ {line}</li>)}<li>－ {chosen.limitation}</li></ul>
      {chosen.unlocked && chosen.block === null
        ? <button type="button" className="alpha-recommended" disabled={locked || !open} title={open ? `Custa ${info.cost} Influência` : 'Abre na última rodada da Era'} onClick={() => void manage({ type: 'ADOPT_GOVERNMENT', government: chosen.government })}>{open ? `Reservar · ${info.cost} Influência` : 'Fora da janela de reforma'}</button>
        : <small role="note">{chosen.unlocked ? chosen.block : 'A Teia ainda não abriu este governo.'}</small>}
    </article></div>;
  return <div className="alpha-government-panel">
    {note}
    {state === 'none' && <p className="alpha-line is-muted" role="status">Nenhuma reforma disponível agora: a Teia ainda não abriu outro governo.</p>}
    <div className="alpha-gov-grid">
      <article className="alpha-gov-card is-current"><small>Governo atual</small><b>{info.current.name}</b><span>{info.current.advantages.map(line => `＋ ${line}`).join(' · ')} · － {info.current.limitation}</span></article>
      {eligible.map(option => <button type="button" key={option.government} className="alpha-gov-card" onClick={() => setSel(option.government)}><small>Elegível</small><b>{option.name}</b><span>{option.advantages[0] ? `＋ ${option.advantages[0]}` : ''}</span></button>)}
    </div>
    {closed.length > 0 && <div className="alpha-gov-closed"><button type="button" className="aoh-btn is-sm is-ghost" aria-expanded={showClosed} onClick={() => setShowClosed(!showClosed)}>Ainda fechados: {closed.length} {showClosed ? '▴' : '▾'}</button>
      {showClosed && <ul className="alpha-chip-row is-muted">{closed.map(option => <li key={option.government}><button type="button" onClick={() => setSel(option.government)}>{option.name}</button></li>)}</ul>}</div>}
  </div>;
}
