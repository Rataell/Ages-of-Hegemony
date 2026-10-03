import { describe, expect, it } from 'vitest';
import { type AlphaResourcePool, type AlphaState } from '@aoh/game-domain';
import { advanceAfterReady, applyAlphaCommand, beginAlphaPlanning, createAlphaGame, TRADE_DEFAULT_PRESTIGE } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';

const pool = (values: Partial<AlphaResourcePool>): AlphaResourcePool => ({ food: 0, wood: 0, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0, ...values });
function setup(): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'trade', seed: 9, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana' }, { id: 'p2', name: 'Beto' }, { id: 'p3', name: 'Caio' }] }));
  for (const player of state.players) { player.ambitionsChosen = true; player.contacts = state.players.map(other => other.playerId).filter(id => id !== player.playerId); player.resources = pool({ food: 10, wood: 6, stone: 6, wealth: 10, knowledge: 5, influence: 5 }); }
  // The round's ledgers opened with the old balances; reopen them so the report arithmetic starts from these.
  state.roundLedgers = state.roundLedgers.filter(ledger => ledger.round !== state.core.round);
  return state;
}
const run = (state: AlphaState, actor: string, command: Record<string, unknown>) => applyAlphaCommand(state, actor as never, { ...command, expectedVersion: state.version });
const must = (state: AlphaState, actor: string, command: Record<string, unknown>) => { const result = run(state, actor, command); if (!result.ok) throw new Error(result.error.message); return result.value; };
const res = (state: AlphaState, id: string) => state.players.find(player => player.playerId === id)!.resources;
const propose = (offerType: string, offer: Partial<AlphaResourcePool>, request: Partial<AlphaResourcePool>, dueRound: number | null = null) => ({ type: 'PROPOSE_TRADE', recipientId: 'p2', offerType, offer: pool(offer), request: pool(request), treatyTerms: [], dueRound });
/** Everyone confirms until the round has ended (planning, no reactions). */
function endRound(state: AlphaState): AlphaState { for (const player of state.players) if (!player.ready) state = must(state, player.playerId, { type: 'READY' }); return state; }

describe('trade offers between civilizations', () => {
  it('swaps both sides atomically on an accepted instant trade, privately to the two parties', () => {
    let state = must(setup(), 'p1', propose('TRADE_INSTANT', { wood: 3 }, { knowledge: 2 }));
    const offer = state.tradeOffers[0]!;
    expect(alphaPlayerView(state, 'p2' as never)!.tradeOffers.map(o => o.id)).toEqual([offer.id]);
    expect(alphaPlayerView(state, 'p3' as never)!.tradeOffers).toEqual([]);
    state = must(state, 'p2', { type: 'RESPOND_TRADE', offerId: offer.id, accept: true });
    expect(res(state, 'p1')).toMatchObject({ wood: 3, knowledge: 7 });
    expect(res(state, 'p2')).toMatchObject({ wood: 9, knowledge: 3 });
    expect(state.tradeOffers[0]!.status).toBe('SETTLED');
  });

  it('never substitutes missing goods with wealth, and the proposer must hold what it offers', () => {
    const state = setup();
    expect(run(state, 'p1', propose('TRADE_INSTANT', { metal: 1 }, { food: 1 }))).toMatchObject({ ok: false, error: { message: 'Você não tem agora os recursos oferecidos.' } });
    const open = must(state, 'p1', propose('TRADE_INSTANT', { food: 1 }, { metal: 2 }));
    expect(run(open, 'p2', { type: 'RESPOND_TRADE', offerId: open.tradeOffers[0]!.id, accept: true })).toMatchObject({ ok: false, error: { message: 'Você não tem os recursos pedidos.' } });
  });

  it('refuses trade between civilizations at war', () => {
    const state = setup(); state.wars.push(['p1', 'p2'] as never);
    expect(run(state, 'p1', propose('GIFT', { food: 2 }, {}))).toMatchObject({ ok: false, error: { message: 'Não há comércio entre civilizações em guerra.' } });
  });

  it('settles a promise on its due round, or defaults with a Prestige penalty seen by both', () => {
    for (const pays of [true, false]) {
      let state = must(setup(), 'p1', propose('FUTURE_PROMISE', { stone: 4 }, { food: 3 }, 2));
      state = must(state, 'p2', { type: 'RESPOND_TRADE', offerId: state.tradeOffers[0]!.id, accept: true });
      expect(res(state, 'p1').food).toBe(13); expect(state.tradeOffers[0]!.status).toBe('ACCEPTED');
      state = endRound(state);
      expect(state.core.round).toBe(2);
      state.players.find(player => player.playerId === 'p1')!.prestige = 5;
      if (!pays) state.players.find(player => player.playerId === 'p1')!.resources.stone = 0;
      state.roundLedgers = state.roundLedgers.filter(ledger => ledger.round !== state.core.round);
      const before = res(state, 'p2').stone;
      state = endRound(state);
      const offer = state.tradeOffers[0]!;
      expect(offer.status).toBe(pays ? 'SETTLED' : 'DEFAULTED');
      expect(res(state, 'p2').stone - before).toBe(pays ? 4 : 0);
      expect(state.players.find(player => player.playerId === 'p1')!.prestige).toBe(pays ? 5 : 5 - TRADE_DEFAULT_PRESTIGE);
      for (const viewer of ['p1', 'p2']) expect(state.roundReports.find(report => report.round === 2 && report.playerId === viewer)!.resolution.some(event => event.type === 'TRADE')).toBe(true);
    }
  });

  it('lends now and collects on the due round; unanswered offers lapse at the end of the round', () => {
    let state = must(setup(), 'p1', propose('LOAN', { wealth: 4 }, { wealth: 6 }, 2));
    state = must(state, 'p1', { ...propose('GIFT', { food: 1 }, {}), recipientId: 'p3' });
    state = must(state, 'p2', { type: 'RESPOND_TRADE', offerId: state.tradeOffers[0]!.id, accept: true });
    expect(res(state, 'p2').wealth).toBe(14);
    state = endRound(state);
    expect(state.tradeOffers[1]!.status).toBe('DECLINED');
    state = endRound(state);
    expect(state.tradeOffers[0]!.status).toBe('SETTLED');
  });

  it('validates the shape of each offer type', () => {
    const state = setup();
    expect(run(state, 'p1', propose('GIFT', { food: 1 }, { food: 1 }))).toMatchObject({ ok: false, error: { message: 'Um presente não pede nada em troca.' } });
    expect(run(state, 'p1', propose('LOAN', { wealth: 1 }, { wealth: 2 }, 1))).toMatchObject({ ok: false, error: { message: `Escolha um prazo entre a rodada 2 e a ${state.rules.roundLimit}.` } });
    expect(run(state, 'p1', propose('TRADE_INSTANT', {}, {}))).toMatchObject({ ok: false, error: { message: 'Inclua algum recurso na oferta.' } });
    expect(advanceAfterReady).toBeTypeOf('function');
  });
});
