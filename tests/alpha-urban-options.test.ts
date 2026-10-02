import { describe, expect, it } from 'vitest';
import { PlayerIdSchema, alphaToLegacyResources, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame, occupyCity, setAlphaPhase, urbanOptions, type UrbanOption } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { completeRound, must } from './alpha-rounds.js';

const p1 = PlayerIdSchema.parse('p1');
const base = (seed = 111): AlphaState => beginAlphaPlanning(createAlphaGame({ gameId: `options-${seed}`, seed, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));
const rich = (state: AlphaState) => { Object.assign(state.players[0]!.resources, { food: 20, wood: 14, stone: 14, metal: 8, wealth: 24, knowledge: 30, influence: 20 }); state.core.players[0]!.resources = alphaToLegacyResources(state.players[0]!.resources); return state; };
const command = (cityId: string, option: UrbanOption) => ({ type: 'URBAN_ACTION', cityId, action: option.action, ...(option.build ? { build: option.build } : {}), ...(option.unit ? { unit: option.unit } : {}), ...(option.advancementId ? { advancementId: option.advancementId } : {}) });

/** The preview must agree with the server on every option: unblocked means accepted, blocked means rejected with the same message. */
function expectParity(state: AlphaState) {
  const options = urbanOptions(state, p1);
  let unblocked = 0, blocked = 0;
  // Research is city-independent; compare it through the first city that can act.
  const actor = Object.entries(options.cities).find(([, list]) => list.find(o => o.action === 'PRODUCE')!.blocked === null)?.[0];
  for (const [cityId, list] of Object.entries(options.cities)) for (const option of cityId === actor ? [...list, ...options.research] : list) {
    const result = applyAlphaCommand(state, p1, { ...command(cityId, option), expectedVersion: state.version });
    const label = `${cityId} ${option.action} ${JSON.stringify(option.build ?? option.unit ?? option.advancementId ?? '')}`;
    if (option.blocked === null) { expect(result.ok, label + ' ' + (result.ok ? '' : result.error.message)).toBe(true); unblocked++; }
    else { expect(result.ok, label).toBe(false); if (!result.ok) expect(result.error.message, label).toBe(option.blocked); blocked++; }
  }
  return { unblocked, blocked };
}

describe('urban option preview', () => {
  it('agrees with the server for a fresh civilization', () => {
    const { unblocked, blocked } = expectParity(base());
    expect(unblocked).toBeGreaterThan(3);
    expect(blocked).toBeGreaterThan(10);
  });

  it('agrees with the server when the civilization is rich and advanced', () => {
    const state = rich(base(112));
    state.players[0]!.era = 'CIVILIZATION';
    state.core.players[0]!.civilization.cities[0]!.districts.push({ type: 'MILITARY', builtRound: 1 }, { type: 'AGRARIAN', builtRound: 1 });
    state.core.players[0]!.civilization.cities[0]!.development = 3;
    const { unblocked } = expectParity(state);
    expect(unblocked).toBeGreaterThan(10);
  });

  it('agrees with the server for occupied cities and after a city already acted', () => {
    const state = rich(base(113));
    const planned = must(state, p1, { type: 'URBAN_ACTION', cityId: 'capital-1', action: 'PRODUCE' });
    expectParity(planned);
    const occupied = rich(completeRound(base(114)));
    occupyCity(occupied, p1, 'capital-2' as never);
    expectParity(occupied);
  });

  it('agrees outside planning and after confirming', () => {
    const planning = beginAlphaPlanning(createAlphaGame({ gameId: 'options-planning', seed: 115, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));
    const chosen = must(planning, p1, { type: 'CHOOSE_AMBITIONS', cardIds: planning.players[0]!.ambitions.slice(0, 2) });
    const ready = must(chosen, p1, { type: 'READY' });
    for (const list of Object.values(urbanOptions(ready, p1).cities)) expect(list.every(o => o.blocked === 'Suas decisões já estão confirmadas para esta fase.')).toBe(true);
    const conflicts = structuredClone(planning); setAlphaPhase(conflicts, 'CONFLICTS');
    for (const list of Object.values(urbanOptions(conflicts, p1).cities)) expect(list.every(o => o.blocked === 'Disponível apenas no Planejamento.')).toBe(true);
  });

  it('shows cost, effect and the exact block reason for the interface', () => {
    const state = base(116);
    const [list] = Object.values(urbanOptions(state, p1).cities);
    const produce = list!.find(o => o.action === 'PRODUCE')!;
    expect(produce.blocked).toBeNull();
    expect(produce.effect).toContain('Sem esta escolha a cidade não produz');
    const siege = list!.find(o => o.unit === 'SIEGE')!;
    expect(siege.blocked).not.toBeNull();
    expect(siege.cost.metal).toBe(state.rules.units.SIEGE.metal);
    const mood = list!.find(o => o.action === 'PROMOTE_MOOD')!;
    expect(mood.cost.wealth).toBe(state.rules.balance.publicInvestmentCost);
  });

  it('is part of the projection and lists only the viewer\'s cities', () => {
    const state = base(117);
    const view = alphaPlayerView(state, p1)!;
    expect(Object.keys(view.urban.cities)).toEqual(['capital-1']);
    expect(view.urban.research.length).toBeGreaterThan(0);
    expect(view.urban.research.every(o => o.action === 'RESEARCH')).toBe(true);
  });
});
