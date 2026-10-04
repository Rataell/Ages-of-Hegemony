import { ALPHA_RESOURCE_KEYS, type AlphaCommand, type AlphaResourcePool, type AlphaState, type PlayerId } from '@aoh/game-domain';
import { alphaGain, alphaPay } from './alpha-resources.js';
import { atWar, hasTreaty } from './alpha-diplomacy.js';
import { alphaEvent, resolutionEvent } from './alpha-events.js';
import { kitTradeBonus } from './alpha-kits.js';

type Offer = AlphaState['tradeOffers'][number];
type Propose = Extract<AlphaCommand, { type: 'PROPOSE_TRADE' }>;
type Respond = Extract<AlphaCommand, { type: 'RESPOND_TRADE' }>;

/** Prestige lost by whoever fails to pay a promise or a loan on its due round. */
export const TRADE_DEFAULT_PRESTIGE = 2;

const empty = (pool: AlphaResourcePool) => ALPHA_RESOURCE_KEYS.every(key => pool[key] === 0);
/** Trades move the named goods, so nothing may be substituted by wealth as action costs allow. */
function holds(state: AlphaState, actor: PlayerId, pool: AlphaResourcePool): boolean {
  const resources = state.players.find(player => player.playerId === actor)?.resources;
  return !!resources && ALPHA_RESOURCE_KEYS.every(key => resources[key] >= pool[key]);
}
function transfer(state: AlphaState, from: PlayerId, to: PlayerId, pool: AlphaResourcePool): void {
  if (empty(pool)) return;
  alphaPay(state, from, pool);
  alphaGain(state, to, pool, { category: 'trade' });
}
const name = (state: AlphaState, id: PlayerId) => state.core.players.find(player => player.id === id)?.name ?? 'Uma civilização';
const goods = (pool: AlphaResourcePool) => {
  const names: Record<string, string> = { food: 'Alimento', wood: 'Madeira', stone: 'Pedra', metal: 'Metal', wealth: 'Riqueza', knowledge: 'Conhecimento', influence: 'Influência' };
  return ALPHA_RESOURCE_KEYS.filter(key => pool[key] > 0).map(key => `${pool[key]} ${names[key]}`).join(', ') || 'nada';
};

/**
 * Why a proposal is refused, or null. TRADE_INSTANT swaps both sides on acceptance; GIFT gives `offer` and asks nothing;
 * FUTURE_PROMISE takes `request` now and owes `offer` by the due round; LOAN lends `offer` now and expects `request` back by
 * the due round. Offers are private to both parties and lapse at the end of the round if unanswered.
 */
export function tradeBlock(state: AlphaState, actor: PlayerId, command: Propose): string | null {
  const player = state.players.find(candidate => candidate.playerId === actor);
  if (!player || command.recipientId === actor || !player.contacts.includes(command.recipientId)) return 'Estabeleça contato antes de negociar.';
  if (atWar(state, actor, command.recipientId)) return 'Não há comércio entre civilizações em guerra.';
  if (hasTreaty(state, actor, command.recipientId, 'EMBARGO')) return 'Um embargo impede o comércio entre vocês.';
  if (empty(command.offer) && empty(command.request)) return 'Inclua algum recurso na oferta.';
  const deferred = command.offerType === 'FUTURE_PROMISE' || command.offerType === 'LOAN';
  if (command.offerType === 'GIFT' && !empty(command.request)) return 'Um presente não pede nada em troca.';
  if (command.offerType === 'GIFT' && empty(command.offer)) return 'Escolha o que oferecer.';
  if (deferred && (command.dueRound === null || command.dueRound <= state.core.round || command.dueRound > state.rules.roundLimit)) return `Escolha um prazo entre a rodada ${state.core.round + 1} e a ${state.rules.roundLimit}.`;
  if (!deferred && command.dueRound !== null) return 'Só promessas e empréstimos têm prazo.';
  if (command.offerType === 'FUTURE_PROMISE' && (empty(command.offer) || empty(command.request))) return 'Uma promessa troca algo agora por algo no prazo.';
  if (command.offerType === 'LOAN' && (empty(command.offer) || empty(command.request))) return 'Um empréstimo entrega agora e pede a devolução no prazo.';
  // What the proposer hands over at acceptance must exist now.
  const now = command.offerType === 'FUTURE_PROMISE' ? null : command.offer;
  if (now && !holds(state, actor, now)) return 'Você não tem agora os recursos oferecidos.';
  if (state.tradeOffers.filter(offer => offer.proposerId === actor && offer.status === 'PROPOSED').length >= 4) return 'Limite de 4 ofertas abertas ao mesmo tempo.';
  return null;
}

export function proposeTrade(state: AlphaState, actor: PlayerId, command: Propose): void {
  const blocked = tradeBlock(state, actor, command); if (blocked) throw new Error(blocked);
  state.tradeOffers.push({ id: `offer-${actor}-${state.version}`, type: command.offerType, proposerId: actor, recipientId: command.recipientId, offer: command.offer, request: command.request, treatyTerms: command.treatyTerms, status: 'PROPOSED', createdRound: state.core.round, dueRound: command.dueRound });
  state.telemetry.tradeOffers += 1;
  alphaEvent(state, 'TRADE_OFFER', `${name(state, actor)} enviou uma oferta comercial a ${name(state, command.recipientId)}.`, [actor, command.recipientId]);
}

/** The recipient accepts or declines; the proposer may withdraw (accept: false) while it is still open. */
export function respondTrade(state: AlphaState, actor: PlayerId, command: Respond): void {
  const offer = state.tradeOffers.find(candidate => candidate.id === command.offerId);
  if (!offer || offer.status !== 'PROPOSED') throw new Error('Esta oferta não está mais aberta.');
  if (actor === offer.proposerId && !command.accept) { offer.status = 'DECLINED'; return; }
  if (actor !== offer.recipientId) throw new Error('Somente o destinatário pode responder a esta oferta.');
  if (!command.accept) { offer.status = 'DECLINED'; alphaEvent(state, 'TRADE_DECLINED', `${name(state, actor)} recusou a oferta comercial.`, [offer.proposerId, offer.recipientId]); return; }
  if (atWar(state, offer.proposerId, offer.recipientId)) throw new Error('Não há comércio entre civilizações em guerra.');
  const proposerNow = offer.type === 'FUTURE_PROMISE' ? null : offer.offer;
  const recipientNow = offer.type === 'TRADE_INSTANT' || offer.type === 'FUTURE_PROMISE' ? offer.request : null;
  if (proposerNow && !holds(state, offer.proposerId, proposerNow)) throw new Error(`${name(state, offer.proposerId)} não tem mais os recursos oferecidos.`);
  if (recipientNow && !holds(state, offer.recipientId, recipientNow)) throw new Error('Você não tem os recursos pedidos.');
  if (proposerNow) transfer(state, offer.proposerId, offer.recipientId, proposerNow);
  if (recipientNow) transfer(state, offer.recipientId, offer.proposerId, recipientNow);
  offer.status = offer.type === 'FUTURE_PROMISE' || offer.type === 'LOAN' ? 'ACCEPTED' : 'SETTLED';
  state.telemetry.acceptedTrades += 1;
  kitTradeBonus(state, [offer.proposerId, offer.recipientId]);
  resolutionEvent(state, { type: 'TRADE', actorId: actor, visibleTo: [offer.proposerId, offer.recipientId], message: `${name(state, offer.recipientId)} aceitou a oferta de ${name(state, offer.proposerId)}.`, unitIds: [] });
}

/**
 * Maintenance: due promises and loans are paid by their debtor or default (Prestige penalty, both parties told), and
 * offers left unanswered this round lapse.
 */
export function settleTradeOffers(state: AlphaState): void {
  for (const offer of state.tradeOffers) {
    if (offer.status === 'PROPOSED' && offer.createdRound <= state.core.round) { offer.status = 'DECLINED'; continue; }
    if (offer.status !== 'ACCEPTED' || offer.dueRound === null || offer.dueRound > state.core.round) continue;
    const [debtor, creditor, due] = offer.type === 'FUTURE_PROMISE' ? [offer.proposerId, offer.recipientId, offer.offer] : [offer.recipientId, offer.proposerId, offer.request];
    const audience = [offer.proposerId, offer.recipientId];
    if (holds(state, debtor, due)) {
      transfer(state, debtor, creditor, due);
      offer.status = 'SETTLED';
      resolutionEvent(state, { type: 'TRADE', actorId: debtor, visibleTo: audience, message: `${name(state, debtor)} pagou ${goods(due)} a ${name(state, creditor)} no prazo.`, unitIds: [] });
    } else {
      offer.status = 'DEFAULTED';
      const player = state.players.find(candidate => candidate.playerId === debtor)!;
      player.prestige = Math.max(0, player.prestige - TRADE_DEFAULT_PRESTIGE);
      resolutionEvent(state, { type: 'TRADE', actorId: debtor, visibleTo: audience, message: `${name(state, debtor)} não pagou ${goods(due)} a ${name(state, creditor)}: calote, −${TRADE_DEFAULT_PRESTIGE} Prestígio.`, unitIds: [] });
    }
  }
}

export const tradeOfferView = (state: AlphaState, actor: PlayerId): Offer[] => state.tradeOffers.filter(offer => offer.proposerId === actor || offer.recipientId === actor);
