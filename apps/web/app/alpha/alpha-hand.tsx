'use client';
import { useState } from 'react';
import { ALPHA_CARDS, AlphaEraSchema, civilizationKit, type AlphaEffect } from '@aoh/game-domain';
import type { AlphaRoomView } from '@aoh/server/alpha';
import type { AlphaSend } from './alpha-board';
import { bannerArt } from './table-art';

type Game = NonNullable<AlphaRoomView['game']>;
const RESOURCE: Record<string, string> = { food: 'Alimento', materials: 'Madeira/Pedra', wealth: 'Riqueza', knowledge: 'Conhecimento', influence: 'Influência', culture: 'Cultura' };
export function effectText(effect: AlphaEffect | null): string {
  if (!effect) return '';
  if (effect.kind === 'PRODUCTION') return `+${effect.amount} ${RESOURCE[effect.resource] ?? effect.resource}`;
  return `+${effect.amount} ${effect.kind === 'STRENGTH' ? 'Força nos conflitos' : effect.kind === 'MOVEMENT' ? 'movimento' : 'ação principal'} nesta rodada`;
}
type HandCard = { key: string; family: string; name: string; text: string; play: Record<string, unknown> | null; blocked: string | null; civ: boolean };

/**
 * The hand on the table (approved fan): collapsed at the map's lower edge, lifted by hover or click, one card in focus at a
 * time with the only dominant action; on a phone it is a horizontal drawer. The civilization board's own cards ride along,
 * marked with the civilization banner, so the identity cards never depend on a draw.
 */
export function AlphaHand({ game, locked, send, seatColor, onFocus }: { game: Game; locked: boolean; send: AlphaSend; seatColor: string; onFocus?: (focused: boolean) => void }) {
  const [focus, setFocusState] = useState<string | null>(null), [open, setOpen] = useState(false);
  /** While a card is in focus its button is the table's dominant action, so the board dims its own (UXDEC-020). */
  const setFocus = (key: string | null) => { setFocusState(key); onFocus?.(key !== null); };
  const self = game.self, limit = game.rules.cardsPerRound, spent = self.cardsPlayed >= limit;
  const kit = civilizationKit(self.civilization), era = AlphaEraSchema.options.indexOf(self.era);
  const cards: HandCard[] = [
    ...self.hand.map(id => {
      const card = ALPHA_CARDS.find(c => c.id === id)!;
      const blocked = locked ? 'Aguarde a sua vez de planejar.' : card.timing !== game.view.phase ? (card.timing === 'REACTION' ? 'Reação: só durante os Conflitos.' : 'Só no planejamento.') : spent ? `Limite de ${limit} cartas por rodada atingido.` : null;
      return { key: id, family: card.timing === 'REACTION' ? 'Reação' : 'Estratégia', name: card.name, text: effectText(card.effect), play: {type:'PLAY_CARD',cardId:id}, blocked, civ: false };
    }),
    ...(kit?.cards ?? []).map(card => {
      const lockedByEra = era < AlphaEraSchema.options.indexOf(card.unlockEra), used = self.civilizationCardsPlayed.some(entry => entry.cardId === card.id && entry.era === self.era);
      const blocked = lockedByEra ? `Libera na ${card.unlockEra === 'CIVILIZATION' ? 'Era IV' : 'Era VII'}.` : used ? 'Já usada nesta era.' : locked ? 'Aguarde a sua vez de planejar.' : game.phase !== 'PLANNING' ? 'Só no planejamento.' : spent ? `Limite de ${limit} cartas por rodada atingido.` : null;
      return { key: card.id, family: kit!.name, name: card.name, text: card.text, play: {type:'PLAY_CIVILIZATION_CARD',cardId:card.id}, blocked, civ: true };
    }),
  ];
  if (!cards.length) return null;
  const focused = cards.find(card => card.key === focus) ?? null;
  const banner = kit ? bannerArt(kit.mark, seatColor, 26) : '';
  return <>
    <button type="button" className="alpha-hand-toggle" aria-expanded={open} onClick={() => { setOpen(!open); setFocus(null); }}>Cartas · {cards.filter(card => !card.blocked).length}/{cards.length}</button>
    <div className={`alpha-hand-fan${open ? ' is-open' : ''}${focused ? ' has-focus' : ''}`} role="group" aria-label="Mão de cartas">
      {cards.map((card, i) => <button type="button" key={card.key} className={`alpha-hand-card${card.civ ? ' is-civ' : ''}${focused?.key === card.key ? ' is-focus' : ''}${card.blocked ? ' is-blocked' : ''}`}
        style={{ ['--i' as string]: i, ['--a' as string]: i - (cards.length - 1) / 2 }} aria-pressed={focused?.key === card.key} aria-label={`${card.name}: ${card.text}${card.blocked ? ` (${card.blocked})` : ''}`}
        onClick={() => setFocus(focused?.key === card.key ? null : card.key)}>
        <span className="hd">{card.family}{card.civ && <svg width="16" height="22" viewBox="-12 -36 24 38" aria-hidden="true" dangerouslySetInnerHTML={{ __html: banner }} />}</span>
        <span className="nm">{card.name}</span><span className="tx">{card.text}</span>
      </button>)}
      {focused && <div className="alpha-hand-play" role="dialog" aria-label={focused.name}>
        <b>{focused.name}</b><span>{focused.text}</span>
        <button type="button" className="primary" disabled={Boolean(focused.blocked) || !focused.play} onClick={() => { if (focused.play) void send(focused.play).then(ok => { if (ok) setFocus(null); }); }}>Jogar carta</button>
        <small>{focused.blocked ?? `${limit - self.cardsPlayed} de ${limit} nesta rodada · ação livre`}</small>
      </div>}
    </div>
  </>;
}
