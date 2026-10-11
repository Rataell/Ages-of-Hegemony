import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { AlphaState } from '@aoh/game-domain';
import { cityActivations, urbanBlock } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { tipsSuspended } from '../apps/web/app/alpha/tour-gate.js';
import { apply, freshGame, meta, seat, shape, urban, P1 } from './v12-audit-urban-helpers.js';

const web = (file: string) => readFileSync(new URL(`../apps/web/app/alpha/${file}`, import.meta.url), 'utf8');

/**
 * Alpha V1.2 · F-01 and F-14 (docs/audit/alpha-v1.2-lane-f-ui-regressions.md).
 * F-01: the automatic tips (z-index 60) covered the Era turn (40). F-14: the client counted every planned urban action (Avanço included) against a fixed 2
 * while the engine allows 2 when Estável/Próspera, 1 when Abalada/Sobre-extensão and does not count Avanço; the counter lied and the false block won.
 */
describe('F-01 · tips never cover a blocking surface', () => {
  const idle = { phase: 'PLANNING', conflictCall: false, replay: false, winner: false };
  it('is suspended during the Era turn, the conflict call, the round replay and the final screen, and only then', () => {
    expect(tipsSuspended(idle)).toBe(false);
    expect(tipsSuspended({ ...idle, phase: 'ERA_TURN' })).toBe(true);
    expect(tipsSuspended({ ...idle, conflictCall: true })).toBe(true);
    expect(tipsSuspended({ ...idle, replay: true })).toBe(true);
    expect(tipsSuspended({ ...idle, winner: true })).toBe(true);
    for (const phase of ['WORLD_PULSE', 'PLANNING', 'URBAN_ACTIONS', 'ORDERS_MOVEMENT', 'DIPLOMACY_TRADE', 'CONFLICTS', 'INTEGRATION_MAINTENANCE', 'END_ROUND']) expect(tipsSuspended({ ...idle, phase }), phase).toBe(false);
  });
  it('the board hands the gate to AlphaTour, which neither fires nor shows a tip while suspended (the tip stays pending)', () => {
    const board = web('alpha-board.tsx'), tour = web('alpha-tour.tsx');
    expect(board).toMatch(/<AlphaTour [^>]*suspended=\{tipsSuspended\(\{phase:game\.phase,conflictCall,replay:!!replay,winner:!!game\.winner\}\)\}/);
    expect(tour).toMatch(/if \(open \|\| tip \|\| suspended \|\|/);        // does not pick a new tip
    expect(tour).toMatch(/if \(tip && !suspended\) return <Callout/);       // does not draw the pending one
    expect(tour).not.toMatch(/setTip\(null\)[^;]*suspended/);                // closing is the only thing that clears it
  });
});

describe('F-14 · activations left in a city: the engine decides, the projection ships it, the client does not recompute', () => {
  const planned = (state: AlphaState) => seat(state).plannedActions.filter(action => action.type === 'URBAN_ACTION' && action.action !== 'RESEARCH').length;
  const limitMessage = /ação planejada|ativações planejadas/;
  const setup = (mood: number) => { const state = freshGame(); shape(state, 'VILLAGE', 6, { producers: 3, scholars: 3 }); meta(state).mood = mood; Object.assign(seat(state).resources, { food: 15, wood: 10, stone: 8, wealth: 10, knowledge: 8, culture: 4 }); return state; };
  const plan = (state: AlphaState, action: string, extra = {}) => { const result = apply(state, urban(meta(state).cityId, action, extra)); if (!result.ok) throw new Error(result.error.message); return result.value; };
  const left = (state: AlphaState) => cityActivations(state, P1, meta(state).cityId)!;
  const view = (state: AlphaState) => alphaPlayerView(state, P1)!.cityStates.find(city => city.cityId === meta(state).cityId)!;

  it('Estável: two activations; a third is refused with the engine message, and the projection agrees at every step', () => {
    let state = setup(4);
    expect(left(state)).toMatchObject({ allowed: 2, count: 0, left: 2 });
    expect(view(state).activations).toEqual(left(state));
    state = plan(state, 'PRODUCE');
    expect(left(state)).toMatchObject({ left: 1 }); expect(view(state).activations).toEqual(left(state));
    expect(String(urbanBlock(state, P1, meta(state).cityId, 'PROMOTE_MOOD'))).not.toMatch(limitMessage);
    state = plan(state, 'PROMOTE_MOOD');
    expect(left(state)).toMatchObject({ allowed: 2, count: 2, left: 0 }); expect(view(state).activations).toEqual(left(state));
    expect(urbanBlock(state, P1, meta(state).cityId, 'PRODUCE')).toBe('Esta cidade já tem as duas ativações planejadas nesta rodada.');
  });

  it('Abalada: one activation, and the client no longer shows "2 / 2"', () => {
    let state = setup(3);
    expect(left(state)).toMatchObject({ allowed: 1, left: 1 });
    state = plan(state, 'PRODUCE');
    expect(left(state)).toMatchObject({ allowed: 1, left: 0 }); expect(view(state).activations).toEqual(left(state));
    expect(urbanBlock(state, P1, meta(state).cityId, 'PROMOTE_MOOD')).toBe('Esta cidade já possui sua ação planejada para esta rodada.');
  });

  it('Sobre-extensão: no second activation anywhere, even for an Estável city', () => {
    const state = setup(4);
    for (const id of ['taken-1', 'taken-2']) { const occupied = structuredClone(meta(state)); occupied.cityId = id as never; occupied.status = 'OCCUPIED'; occupied.capital = false; occupied.districts = []; occupied.buildings = []; state.cities.push(occupied); }
    expect(left(state)).toMatchObject({ allowed: 1, left: 1 }); expect(view(state).activations).toEqual(left(state));
  });

  it('Avanço is its own Order: a planned research does not use an activation (the false block of the old client counter)', () => {
    let state = setup(4);
    state = plan(state, 'RESEARCH', { advancementId: 'web-agriculture' });
    expect(planned(state)).toBe(0);
    expect(seat(state).plannedActions.filter(action => action.type === 'URBAN_ACTION')).toHaveLength(1); // what the old client counted: 1 of 2 …
    expect(left(state)).toMatchObject({ allowed: 2, count: 0, left: 2 });                              // … where the engine still has both activations
    expect(view(state).plannedUrbanActions).toBe(1); expect(view(state).activations.left).toBe(2);
    state = plan(state, 'PRODUCE'); state = plan(state, 'PROMOTE_MOOD');
    expect(left(state).left).toBe(0);
  });

  it('every number the client shows comes from `activations`: the old recomputation is gone from the three views', () => {
    const panels = web('alpha-panels.tsx'), details = web('alpha-details.tsx');
    expect(panels).not.toMatch(/state\.plannedUrbanActions\s*>=/);
    expect(panels).not.toMatch(/balance\.cityActions-state\.plannedUrbanActions/);
    expect(panels).toMatch(/state\.activations\.left/);
    expect(panels).toMatch(/state\.activations\.allowed/);
    expect(details).toMatch(/activations\.left/);
  });
});
