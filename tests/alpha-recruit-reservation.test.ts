import { describe, expect, it } from 'vitest';
import { PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame, replaceCity, urbanOptions } from '@aoh/game-engine';

const p1 = PlayerIdSchema.parse('p1');
function planning(): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'recruit-reservation', seed: 5, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um', civilization: 'saren' }, { id: 'p2', name: 'Dois', civilization: 'valgard' }] }));
  state.players.forEach(player => { player.ambitionsChosen = true; });
  const city = state.core.players[0]!.civilization.cities[0]!;
  // Population 3 with exactly one Soldier and nobody Disponível: one mobilization is possible, a second is not (E-1).
  replaceCity(state, city.id, { ...city, population: 3, workers: { producers: 1, artisans: 0, merchants: 1, scholars: 0, soldiers: 1, unassigned: 0 } });
  state.players[0]!.resources = { ...state.players[0]!.resources, food: 15, wood: 15, stone: 15, wealth: 15, metal: 10 };
  return state;
}
const recruit = (state: AlphaState) => applyAlphaCommand(state, p1, { type: 'URBAN_ACTION', expectedVersion: state.version, cityId: 'capital-1', action: 'RECRUIT', unit: 'INFANTRY' });

describe('E-1: planned Recrutar reserves its Soldier', () => {
  it('accepts the first plan and refuses the second at planning time with the reason', () => {
    const first = recruit(planning());
    expect(first.ok).toBe(true);
    const second = recruit((first as { value: AlphaState }).value);
    expect(second.ok).toBe(false);
    expect((second as { error: { message: string } }).error.message).toMatch(/Soldado|Disponível|habitante/);
  });

  it('projects the second option as blocked with the reason, not as available', () => {
    const planned = (recruit(planning()) as { value: AlphaState }).value;
    const option = urbanOptions(planned, p1).cities['capital-1']!.find(item => item.action === 'RECRUIT' && item.unit === 'INFANTRY');
    expect(option?.blocked).toBeTruthy();
  });
});
