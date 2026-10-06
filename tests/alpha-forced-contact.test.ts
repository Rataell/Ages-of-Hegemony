import { describe, expect, it } from 'vitest';
import { AlphaStateSchema } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, forceContactSetup, hexDistance } from '@aoh/game-engine';

const game = (count: number, seed: number) => createAlphaGame({ gameId: `forced-${count}-${seed}`, seed, preset: 'STANDARD', players: Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` })) });
const contactsOf = (state: ReturnType<typeof game>) => state.players.map(player => player.contacts.filter(id => id !== player.playerId));

describe('forced-contact scenario (playtest tooling)', () => {
  it('a normal game starts with nobody in Contact', () => {
    for (const count of [2, 4, 6]) expect(contactsOf(game(count, 1)).every(list => list.length === 0)).toBe(true);
  });

  it('puts the two nearest Pátrias in Contact at the start (round 1) through the real proximity rule, for 2/4/6 seats and 10 seeds', () => {
    for (const count of [2, 4, 6]) for (let seed = 1; seed <= 10; seed++) {
      const state = game(count, seed), forced = forceContactSetup(state);
      expect(state.core.round, `${count}p seed ${seed}`).toBe(1);
      const [a, b] = forced.seats, seatA = state.players.find(p => p.playerId === a)!, seatB = state.players.find(p => p.playerId === b)!;
      expect(seatA.contacts, `${count}p seed ${seed}`).toContain(b);
      expect(seatB.contacts).toContain(a);
      // The rule that produced it: the two scouts stand on adjacent hexes.
      const tile = (id: string) => state.core.map.find(t => t.id === id)!;
      expect(hexDistance(tile(forced.hexes[0]), tile(forced.hexes[1]))).toBe(1);
      const scouts = forced.scouts.map(id => state.units.find(u => u.id === id)!);
      expect(scouts.map(u => u.kind)).toEqual(['PIONEER', 'PIONEER']);
      expect(scouts.map(u => u.hexId)).toEqual(forced.hexes);
      // Nobody else is dragged into the scenario.
      for (const player of state.players) if (![a, b].includes(player.playerId)) expect(player.contacts.filter(id => id !== player.playerId)).toEqual([]);
      expect(AlphaStateSchema.safeParse(beginAlphaPlanning(state)).success).toBe(true);
    }
  });

  it('is deterministic for a seed and announces itself on the public table log', () => {
    const one = game(2, 5), two = game(2, 5);
    expect(forceContactSetup(one)).toEqual(forceContactSetup(two));
    expect(one.events.find(event => event.type === 'SCENARIO')).toMatchObject({ audience: null });
  });
});
