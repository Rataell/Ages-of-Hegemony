import { describe, expect, it } from 'vitest';
import type { AlphaCommand } from '@aoh/game-domain';
import { previewAction } from '@aoh/game-engine';
import { apply, freshGame, meta, P1, plan, seat, urban } from './v12-audit-urban-helpers.js';

/**
 * Regression (RC6 gate, E-A1-08 investigation): the Ficha's preview simulates the resolution on a clone moved to URBAN_ACTIONS. The real transition resets each city's
 * per-round activation count; the clone did not, so in the round AFTER a city had acted the preview answered "Esta cidade já usou suas ativações nesta rodada" (blocking
 * Produzir for no reason) while the planner and the projection said two activations were free.
 */
describe('the preview does not inherit last round\'s activation count', () => {
  const nextPlanning = () => {
    const state = freshGame('aurelia');
    Object.assign(seat(state).resources, { food: 4, culture: 4, wealth: 6 });
    const cityId = meta(state).cityId;
    const { after } = plan(state, [urban(cityId, 'PRODUCE'), urban(cityId, 'PROMOTE_MOOD')]);
    expect(after.cities.find(c => c.cityId === cityId)!.urbanActionsUsed).toBeGreaterThan(0);   // the stale count is really there at the next planning
    return { after, cityId };
  };
  const ask = (state: ReturnType<typeof nextPlanning>['after'], cityId: string, action: string) => previewAction(state, P1, { expectedVersion: state.version, ...urban(cityId, action) } as AlphaCommand);

  it('the first action of the next round is not "already used"', () => {
    const { after, cityId } = nextPlanning();
    const messages = ask(after, cityId, 'PRODUCE').blockers.map(b => b.message).join(' ');
    expect(messages).not.toMatch(/já usou suas ativações/);
  });

  it('with one plan already made in the next round (the trial path) the second activation is still free', () => {
    const { after, cityId } = nextPlanning();
    const first = apply(after, urban(cityId, 'PRODUCE'));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const messages = ask(first.value, cityId, 'PROMOTE_MOOD').blockers.map(b => b.message).join(' ');
    expect(messages).not.toMatch(/já usou suas ativações/);
  });
});
