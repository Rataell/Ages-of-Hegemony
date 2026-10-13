import { describe, expect, it } from 'vitest';
import type { AlphaCommand, AlphaState } from '@aoh/game-domain';
import { previewAction } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { apply, freshGame, meta, P1, P2, plan, seat, urban } from './v12-audit-urban-helpers.js';

/**
 * Gate "prévia jogável", item 8: what the player reads after the round (Resultados, Crônicas > Manutenção/Acontecimentos) names the PREDICTED cost, the APPLIED result and the
 * LOSSES, with the same numbers, and nobody but the actor reads the actor's numbers. Engine + projection only, deterministic.
 */
const governState = (): AlphaState => {
  const state = freshGame('aurelia');
  meta(state).mood = 1;
  state.core.players.find(player => player.id === P1)!.civilization.government = 'MONARCHY' as never;
  Object.assign(seat(state).resources, { culture: 6, wealth: 8 });
  return state;
};

describe('Crônica: predicted cost, applied result and losses', () => {
  it('Governar 2 levels: the Ficha prediction, the applied block of the round report and the Acontecimentos line say the same thing', () => {
    const state = governState();
    const cityId = meta(state).cityId;
    const asked = previewAction(state, P1, { expectedVersion: state.version, ...urban(cityId, 'PROMOTE_MOOD', { levels: 2 }) } as AlphaCommand);
    expect(asked.eligible).toBe(true);
    const round = state.core.round;
    const outcome = plan(state, [urban(cityId, 'PROMOTE_MOOD', { levels: 2 })]);
    expect(outcome.failures).toEqual([]);
    const report = outcome.after.roundReports.find(entry => entry.playerId === P1 && entry.round === round)!;
    const event = report.resolution.find(item => item.applied && item.cityId === cityId)!;
    expect(event.applied!.cost.resources).toEqual(asked.cost.resources);             // predicted cost == applied cost
    expect(event.applied!.cost.stockAfter).toEqual(asked.cost.stockAfter);
    expect(event.applied!.effects).toEqual(asked.effects);                           // Ânimo 1 → 3 both before and after
    expect(event.applied!.effects.find(effect => effect.kind === 'MOOD')).toMatchObject({ before: 1, after: 3 });
    const line = outcome.after.events.find(item => item.round === round && item.type === 'URBAN_ACTION' && item.message.includes('governou'));
    expect(line?.message).toMatch(/2 nível\(is\), Ânimo 1→3; pagou 2 Cultura/);       // the chronicle line carries the same numbers in prose
    expect(line?.audience).toEqual([P1]);
  });

  it('only the actor reads the numbers: the rival projection of the same round has no applied block and no line of the actor\'s failures or losses', () => {
    const state = governState();
    const cityId = meta(state).cityId;
    const round = state.core.round;
    const { after } = plan(state, [urban(cityId, 'PROMOTE_MOOD', { levels: 2 })]);
    const mine = alphaPlayerView(after, P1)!.roundReports.find((entry: { round: number }) => entry.round === round)!;
    const theirs = alphaPlayerView(after, P2)!.roundReports.find((entry: { round: number }) => entry.round === round)!;
    expect(mine.resolution.some((event: { applied?: unknown }) => event.applied)).toBe(true);
    expect(theirs.resolution.some((event: { applied?: unknown }) => event.applied)).toBe(false);
    expect(theirs.resolution.some((event: { actorId: string | null; type: string }) => event.actorId === P1 && ['FAILURE', 'LOSSES'].includes(event.type))).toBe(false);
    expect(alphaPlayerView(after, P2)!.events.some((event: { message: string }) => event.message.includes('governou'))).toBe(false);
  });

  it('a Governar the earlier plan made impossible fails at resolution as a FAILURE line (never silent) with the cause, and the actor alone reads it', () => {
    const state = governState();
    Object.assign(seat(state).resources, { culture: 1, wealth: 0 });
    const cityId = meta(state).cityId;
    const round = state.core.round;
    // the stock is edited by hand AFTER the plans are accepted, so the resolution (not the planning) is what refuses the action
    const first = apply(state, urban(cityId, 'PROMOTE_MOOD', { levels: 1 }));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    Object.assign(seat(first.value).resources, { culture: 0, wealth: 0 });
    const { after } = plan(first.value, []);
    const mine = alphaPlayerView(after, P1)!.roundReports.find((entry: { round: number }) => entry.round === round)!;
    const failure = mine.resolution.find((event: { type: string }) => event.type === 'FAILURE');
    expect(failure, 'the failed plan is a line of Resultados').toBeDefined();
    expect(failure!.message).toMatch(/Governar|Cultura|Riqueza/);
    expect(alphaPlayerView(after, P2)!.roundReports.find((entry: { round: number }) => entry.round === round)!.resolution.some((event: { type: string }) => event.type === 'FAILURE')).toBe(false);
  });
});
