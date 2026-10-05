import { describe, expect, it } from 'vitest';
import { PlayerIdSchema } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';

const p1 = PlayerIdSchema.parse('p1');
const start = () => beginAlphaPlanning(createAlphaGame({ gameId: 'research-order', seed: 11, players: [{ id: 'p1', name: 'Ana' }, { id: 'p2', name: 'Beto' }], preset: 'STANDARD' }));
const send = (state: ReturnType<typeof start>, command: object) => applyAlphaCommand(state, p1, { ...command, expectedVersion: state.version } as never);

describe('E-1: Avanço is its own Order, not a city activation (canon §2)', () => {
  it('lets a city Produzir and carry a research in the same round, even in Revolta', () => {
    let state = start();
    state.players[0]!.resources.knowledge = 9;
    const city = state.core.players[0]!.civilization.cities[0]!.id;
    let result = send(state, { type: 'URBAN_ACTION', cityId: city, action: 'PRODUCE' });
    expect(result.ok).toBe(true); if (result.ok) state = result.value;
    result = send(state, { type: 'URBAN_ACTION', cityId: city, action: 'RESEARCH', advancementId: 'web-writing' });
    expect(result.ok).toBe(true); if (result.ok) state = result.value;
    // A second ordinary activation is still available (the research did not use one) ...
    result = send(state, { type: 'URBAN_ACTION', cityId: city, action: 'PRODUCE' });
    expect(result.ok).toBe(true);
    // ... and a city in Revolta can still carry the research (Governar is its only own action).
    const revolt = start();
    revolt.players[0]!.resources.knowledge = 9;
    revolt.cities.find(meta => meta.cityId === city)!.mood = 0;
    expect(send(revolt, { type: 'URBAN_ACTION', cityId: city, action: 'PRODUCE' }).ok).toBe(false);
    expect(send(revolt, { type: 'URBAN_ACTION', cityId: city, action: 'RESEARCH', advancementId: 'web-writing' }).ok).toBe(true);
  });

  it('still counts against the five Orders of the round', () => {
    let state = start();
    state.players[0]!.resources.knowledge = 9;
    const city = state.core.players[0]!.civilization.cities[0]!.id;
    const result = send(state, { type: 'URBAN_ACTION', cityId: city, action: 'RESEARCH', advancementId: 'web-writing' });
    expect(result.ok).toBe(true);
    if (result.ok) state = result.value;
    expect(state.players[0]!.plannedActions.filter(action => action.type === 'URBAN_ACTION' && action.action === 'RESEARCH')).toHaveLength(1);
  });
});
