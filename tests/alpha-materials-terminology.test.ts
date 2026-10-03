import { describe, expect, it } from 'vitest';
import { ADVANCEMENTS, CIVILIZATIONS, PlayerIdSchema, alphaGainOf, emptyAlphaResourcePool } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, urbanOptions } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';

const p1 = PlayerIdSchema.parse('p1');
const game = (civilization: string) => {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'materials', seed: 9, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana', civilization }, { id: 'p2', name: 'Beto', civilization: 'meridia' }] }));
  for (const player of state.players) player.ambitionsChosen = true;
  return state;
};

describe('"Materiais" is not shown as a resource', () => {
  it('credits a legacy materials gain as Madeira and Pedra', () => {
    expect(alphaGainOf('materials', 1)).toEqual({ ...emptyAlphaResourcePool(), wood: 1 });
    expect(alphaGainOf('materials', 3)).toEqual({ ...emptyAlphaResourcePool(), wood: 2, stone: 1 });
  });

  it('describes every civilization emphasis in the seven resources', () => {
    for (const civilization of CIVILIZATIONS) expect(civilization.bias).not.toMatch(/Materiais/);
  });

  it.each(CIVILIZATIONS.filter(civilization => civilization.passives.some(effect => effect.kind === 'PRODUCTION' && effect.resource === 'materials')).map(civilization => civilization.id))('keeps urban options and the player view free of Materiais for %s', civilization => {
    const state = game(civilization);
    state.players[0]!.era = 'HEGEMONY';
    const options = urbanOptions(state, p1);
    const texts = [...Object.values(options.cities).flat(), ...options.research].map(option => option.effect);
    for (const text of texts) expect(text).not.toMatch(/Materiais/);
    const node = ADVANCEMENTS.find(advancement => advancement.effect.kind === 'PRODUCTION' && advancement.effect.resource === 'materials')!;
    expect(options.research.find(option => option.advancementId === node.id)?.effect).toBe('+1 Madeira por rodada, na manutenção');
    expect(JSON.stringify(alphaPlayerView(state, p1))).not.toMatch(/Materiais/);
  });
});
