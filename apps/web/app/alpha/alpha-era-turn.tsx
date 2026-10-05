'use client';
import { ALPHA_CARDS, ERA_TURN_STEPS } from '@aoh/game-domain';
import type { AlphaPlayerView } from '@aoh/server/alpha';
import { alphaLabel as text } from './alpha-copy';
import type { AlphaSend } from './alpha-board';

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
  return <details className="alpha-government" open><summary>Reforma de governo · Ordem Influência{info.planned ? ' · reservada' : ''}</summary>
    {info.planned
      ? <p>Reforma para {text(info.planned)} reservada: acontece no passo 5 da Virada de Era, por {info.cost} Influência.</p>
      : <ul>{others.map(option => <li key={option.government} data-unlocked={option.unlocked}>
        <span><b>{option.name}</b><small>＋ {option.advantages.join(' · ')} · － {option.limitation}</small></span>
        <button disabled={locked || option.block !== null || !option.unlocked} title={option.block ?? `Custa ${info.cost} Influência`} onClick={() => void manage({type:'ADOPT_GOVERNMENT',government:option.government})}>{option.block ?? (option.unlocked ? `Reservar por ${info.cost} Influência` : 'Teia ainda não abriu')}</button></li>)}</ul>}
  </details>;
}
