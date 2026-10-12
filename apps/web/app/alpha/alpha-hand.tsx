'use client';
import { useState } from 'react';
import { ALPHA_CARDS, AlphaEraSchema, LEADERS, civilizationDisplayName, civilizationKit, figureById, type AlphaEffect } from '@aoh/game-domain';
import type { AlphaRoomView } from '@aoh/server/alpha';
import type { AlphaSend } from './alpha-board';
import { bannerArt, sealArt } from './table-art';
import { InitialsSeal } from './alpha-card';
import { figurePortraitSvg } from './figure-portraits';

type Game = NonNullable<AlphaRoomView['game']>;
const RESOURCE: Record<string, string> = { food: 'Alimento', materials: 'Madeira/Pedra', wealth: 'Riqueza', knowledge: 'Conhecimento', influence: 'Influência', culture: 'Cultura' };
export function effectText(effect: AlphaEffect | null): string {
  if (!effect) return '';
  if (effect.kind === 'PRODUCTION') return `+${effect.amount} ${RESOURCE[effect.resource] ?? effect.resource}`;
  return `+${effect.amount} ${effect.kind === 'STRENGTH' ? 'Força nos conflitos' : effect.kind === 'MOVEMENT' ? 'movimento' : 'ação principal'} nesta rodada`;
}
/** `figure` marks the Figura of the civilization: it rides in the hand with its own illustration (the civilization seal and the Figura's initials) and plays the Poder 1× por Era. */
type FigureFace = { name: string; passive: { name: string; text: string } | null; power: { name: string; text: string } | null };
type HandCard = { key: string; family: string; name: string; text: string; play: Record<string, unknown> | null; blocked: string | null; civ: boolean; figure?: FigureFace; playLabel?: string };

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
  // The Figura (RC5): the civilization's leader card sits in the hand with the others; its Poder is used from here (same command and gates as the Figura page).
  const leaderId = self.leader?.leaderId ?? null, figure = leaderId ? figureById(leaderId) : undefined, leader = leaderId ? LEADERS.find(entry => entry.id === leaderId) : undefined;
  const figureCard: HandCard[] = leaderId && (figure || leader) ? (() => {
    const name = figure?.name ?? leader?.name ?? 'Figura', used = self.leader!.eraAbilityUsed;
    const passive = figure ? { name: figure.passive.name, text: leader?.passiveAbility.description ?? figure.passive.text } : leader ? { name: leader.passiveAbility.name, text: leader.passiveAbility.description } : null;
    const power = figure ? { name: figure.power.name, text: leader?.eraAbility.description ?? figure.power.text } : leader ? { name: leader.eraAbility.name, text: leader.eraAbility.description } : null;
    const blocked = used ? 'O Poder da Figura já foi usado nesta Era.' : locked ? 'Aguarde a sua vez de planejar.' : game.phase !== 'PLANNING' ? 'Disponível na fase Planejamento.' : self.ready ? 'Você já confirmou esta fase.' : game.leaderBlock;
    return [{ key: `figure:${leaderId}`, family: 'Figura', name, text: power ? `Poder: ${power.name}` : '', play: { type: 'LEADER_ABILITY' }, blocked, civ: true, figure: { name, passive, power }, playLabel: 'Usar o Poder' }];
  })() : [];
  const cards: HandCard[] = [
    ...figureCard,
    ...self.hand.map(id => {
      const card = ALPHA_CARDS.find(c => c.id === id)!;
      const blocked = locked ? 'Aguarde a sua vez de planejar.' : card.timing !== game.view.phase ? (card.timing === 'REACTION' ? 'Reação: só durante os Conflitos.' : 'Só no planejamento.') : spent ? `Limite de ${limit} cartas por rodada atingido.` : null;
      return { key: id, family: card.timing === 'REACTION' ? 'Reação' : 'Estratégia', name: card.name, text: effectText(card.effect), play: {type:'PLAY_CARD',cardId:id}, blocked, civ: false };
    }),
    ...(kit?.cards ?? []).map(card => {
      const lockedByEra = era < AlphaEraSchema.options.indexOf(card.unlockEra), used = self.civilizationCardsPlayed.some(entry => entry.cardId === card.id && entry.era === self.era);
      const blocked = lockedByEra ? `Libera na ${card.unlockEra === 'CIVILIZATION' ? 'Era IV' : 'Era VII'}.` : used ? 'Já usada nesta era.' : locked ? 'Aguarde a sua vez de planejar.' : game.phase !== 'PLANNING' ? 'Só no planejamento.' : spent ? `Limite de ${limit} cartas por rodada atingido.` : null;
      return { key: card.id, family: civilizationDisplayName(self.civilization), name: card.name, text: card.text, play: {type:'PLAY_CIVILIZATION_CARD',cardId:card.id}, blocked, civ: true };
    }),
  ];
  if (!cards.length) return null;
  const focused = cards.find(card => card.key === focus) ?? null;
  const banner = kit ? bannerArt(kit.mark, seatColor, 26) : '';
  /** The Figura's illustration: the seal of her civilization, with the Figura's initials as the provisional portrait. */
  const portrait = (face: FigureFace, size: number) => {
    const art = figurePortraitSvg(face.name);
    // The approved portrait of the Figura; only a Figura the concept has no portrait for falls back to the civilization seal with her initials.
    if (art) return <span className="alpha-hand-portrait is-art" style={{ width: size, height: Math.round(size * 1.25) }} role="img" aria-label={`Retrato de ${face.name}`} dangerouslySetInnerHTML={{ __html: art }} />;
    return <span className="alpha-hand-portrait" style={{ width: size, height: size }} aria-hidden="true">{kit && <svg viewBox="-34 -34 68 68" width={size} height={size} dangerouslySetInnerHTML={{ __html: sealArt(kit.mark, seatColor, 28) }} />}<InitialsSeal name={face.name} size={Math.round(size * 0.5)} /></span>;
  };
  return <>
    <button type="button" className="alpha-hand-toggle" aria-expanded={open} onClick={() => { setOpen(!open); setFocus(null); }}>Cartas · {cards.filter(card => !card.blocked).length}/{cards.length}</button>
    <div className={`alpha-hand-fan${open ? ' is-open' : ''}${focused ? ' has-focus' : ''}`} role="group" aria-label="Mão de cartas">
      {cards.map((card, i) => <button type="button" key={card.key} className={`alpha-hand-card${card.civ ? ' is-civ' : ''}${card.figure ? ' is-figure' : ''}${focused?.key === card.key ? ' is-focus' : ''}${card.blocked ? ' is-blocked' : ''}`}
        style={{ ['--i' as string]: i, ['--a' as string]: i - (cards.length - 1) / 2 }} aria-pressed={focused?.key === card.key} aria-label={`${card.name}: ${card.text}${card.blocked ? ` (${card.blocked})` : ''}`}
        onClick={() => setFocus(focused?.key === card.key ? null : card.key)}>
        <span className="hd">{card.family}{card.civ && <svg width="16" height="22" viewBox="-12 -36 24 38" aria-hidden="true" dangerouslySetInnerHTML={{ __html: banner }} />}</span>
        {card.figure && portrait(card.figure, 56)}
        <span className="nm">{card.name}</span><span className="tx">{card.text}</span>
      </button>)}
      {focused && <div className="alpha-hand-play" role="dialog" aria-label={focused.name}>
        {focused.figure && portrait(focused.figure, 84)}
        <b>{focused.name}</b>
        {focused.figure
          ? <>{focused.figure.passive && <span><i>Passiva · {focused.figure.passive.name}.</i> {focused.figure.passive.text}</span>}{focused.figure.power && <span><i>Poder 1× por Era · {focused.figure.power.name}.</i> {focused.figure.power.text}</span>}</>
          : <span>{focused.text}</span>}
        <button type="button" className="primary" disabled={Boolean(focused.blocked) || !focused.play} onClick={() => { if (focused.play) void send(focused.play).then(ok => { if (ok) setFocus(null); }); }}>{focused.playLabel ?? 'Jogar carta'}</button>
        <small>{focused.blocked ?? (focused.figure ? 'Poder da Figura: 1× por Era · ação livre' : `${limit - self.cardsPlayed} de ${limit} nesta rodada · ação livre`)}</small>
      </div>}
    </div>
  </>;
}
