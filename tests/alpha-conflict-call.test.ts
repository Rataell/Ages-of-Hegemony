import { describe, expect, it } from 'vitest';
import { ALPHA_CARDS, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame, hexDistance } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';

const reactions = ALPHA_CARDS.filter(card => card.timing === 'REACTION').map(card => card.id);
/** Three seats; p1's infantry stands next to p2's pioneer. Every player holds a reaction card and has chosen ambitions. */
function setup(): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'conflict-call', seed: 5, preset: 'QUICK', players: [1, 2, 3].map(i => ({ id: `p${i}`, name: `Pessoa ${i}` })) }));
  // Each card lives in exactly one zone: move each player's hand to the discard, then hand out distinct reaction cards.
  for (const player of state.players) { state.cards.discarded.push(...player.hand); player.hand = []; }
  for (const [index, player] of state.players.entries()) {
    player.ambitionsChosen = true; player.contacts = state.players.map(other => other.playerId).filter(id => id !== player.playerId);
    const card = reactions[index]!;
    state.cards.strategyDeck = state.cards.strategyDeck.filter(id => id !== card); state.cards.discarded = state.cards.discarded.filter(id => id !== card);
    player.hand = [card];
  }
  const target = state.units.find(unit => unit.ownerId === 'p2')!;
  const land = state.core.map.find(tile => hexDistance(tile, state.core.map.find(t => t.id === target.hexId)!) === 1 && ['PLAINS', 'FOREST', 'HILLS'].includes(tile.terrain))!;
  state.units.push({ id: 'p1-infantry', ownerId: 'p1' as never, kind: 'INFANTRY', hexId: land.id, recruitedRound: 1 });
  const scout = state.players.find(player => player.playerId === 'p1')!;
  scout.knownHexIds = [...new Set([...scout.knownHexIds, land.id, target.hexId])].sort() as never;
  return state;
}
const must = (state: AlphaState, actor: string, command: Record<string, unknown>) => {
  const result = applyAlphaCommand(state, actor as never, { ...command, expectedVersion: state.version });
  if (!result.ok) throw new Error(`${actor} ${String(command.type)}: ${result.error.message}`);
  return result.value;
};

describe('declaring war and attacking in the same round', () => {
  it('refuses an attack in peace, accepts it once the declaration is planned, and resolves both in one round', () => {
    let state = setup();
    const target = state.units.find(unit => unit.ownerId === 'p2')!.hexId;
    const attack = { type: 'QUEUE_ORDER', order: { id: 'strike', type: 'ATTACK', unitIds: ['p1-infantry'], target, posture: 'ASSAULT' } };
    expect(applyAlphaCommand(state, 'p1' as never, { ...attack, expectedVersion: state.version })).toMatchObject({ ok: false, error: { message: 'Declare guerra antes de ordenar um ataque a outra civilização.' } });
    state = must(state, 'p1', { type: 'DECLARE_WAR', targetId: 'p2' });
    state = must(state, 'p1', attack);
    for (const id of ['p1', 'p2', 'p3']) state = must(state, id, { type: 'READY' });
    expect(state.wars).toEqual([['p1', 'p2']]);
    // Only attacker and defender are asked to react; the uninvolved seat is not held up.
    expect(state.phase).toBe('CONFLICTS');
    expect(state.players.map(player => [player.playerId, player.ready])).toEqual([['p1', false], ['p2', false], ['p3', true]]);
    const defender = alphaPlayerView(state, 'p2' as never)!, bystander = alphaPlayerView(state, 'p3' as never)!, attacker = alphaPlayerView(state, 'p1' as never)!;
    expect(defender.incomingAttacks).toEqual([{ attackerId: 'p1', target }]);
    expect(bystander.incomingAttacks).toEqual([]);
    expect(attacker.incomingAttacks).toEqual([]);
    state = must(state, 'p2', { type: 'READY' });
    state = must(state, 'p1', { type: 'READY' });
    expect(state.battles).toHaveLength(1);
    const messages = state.roundReports.find(report => report.round === 1 && report.playerId === 'p2')!.resolution.map(event => event.message);
    expect(messages).toContain('Pessoa 1 declarou guerra a Pessoa 2.');
    expect(messages.some(message => /^Pessoa 1 atacou Pessoa 2 em .+ \(Ataque -?\d+ × Defesa -?\d+, Δ [+-]?\d+\)\.$/.test(message))).toBe(true);
  });
});
