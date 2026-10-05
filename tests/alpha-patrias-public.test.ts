import { describe, expect, it } from 'vitest';
import { PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, hexDistance, refreshKnowledge, serializeAlphaState, HOMELANDS_PUBLIC, regionOpenFor } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';

const make = (count: number, seed: number): AlphaState => createAlphaGame({ gameId: `patrias-${count}-${seed}`, seed, preset: 'QUICK', players: Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` })) });
const ids = (count: number) => Array.from({ length: count }, (_, i) => PlayerIdSchema.parse(`p${i + 1}`));

describe('Pátrias públicas (canon: todas as Pátrias começam abertas)', () => {
  it('HOMELANDS_PUBLIC is on', () => { expect(HOMELANDS_PUBLIC).toBe(true); });

  it.each([2, 4, 6])('%i players: every Pátria is open for every seat in the first snapshot; the frontier is closed', count => {
    for (const seed of [1, 7, 23]) {
      const state = beginAlphaPlanning(make(count, seed));
      for (const viewer of ids(count)) {
        const open = state.regions.filter(region => regionOpenFor(state, region, viewer));
        expect(open.map(region => region.id).sort(), `${count}p seed ${seed}`).toEqual(state.regions.filter(region => region.templateId.startsWith('homeland-') && Number(region.templateId.split('-')[1]) <= count).map(region => region.id).sort());
        const view = alphaPlayerView(state, viewer)!;
        expect(view.board.filter(region => !region.closed)).toHaveLength(count);
        expect(view.view.visibleCities).toHaveLength(count - 1);
      }
    }
  });

  it.each([2, 4, 6])('%i players: every capital stands on a real, buildable hex INSIDE its own Pátria, deterministically from the seed', count => {
    for (const seed of [1, 7, 23, 42]) {
      const state = make(count, seed);
      expect(serializeAlphaState(make(count, seed))).toBe(serializeAlphaState(state));
      state.core.players.forEach(owner => {
        const capital = owner.civilization.cities[0]!, region = state.regions.find(item => item.hexIds.includes(capital.hexId))!;
        expect(region.templateId, `${owner.id} seed ${seed}`).toBe(`homeland-${Number(owner.id.slice(1))}`);
        const tile = state.core.map.find(item => item.id === capital.hexId)!;
        expect(['PLAINS', 'FOREST', 'HILLS', 'COAST']).toContain(tile.terrain);
        expect(state.units.filter(unit => unit.hexId === capital.hexId && unit.ownerId === owner.id).length).toBeGreaterThan(0);
        // not bent for privacy: the centre of the Pátria whenever it can hold a city
        expect(capital.hexId).toBe(region.hexIds[0]);
      });
    }
  });

  it.each([2, 4, 6])('%i players: seeing every Pátria creates NO diplomatic Contato', count => {
    const state = beginAlphaPlanning(make(count, 5));
    refreshKnowledge(state);
    for (const player of state.players) expect(player.contacts, String(player.playerId)).toEqual([]);
    for (const viewer of ids(count)) { const view = alphaPlayerView(state, viewer)!; expect(view.self.contacts).toEqual([]); }
  });

  it('Contato appears only with proximity: a piece of one civilization within one hex of the other', () => {
    const state = beginAlphaPlanning(make(2, 5));
    const [a, b] = ids(2), capitalB = state.core.players[1]!.civilization.cities[0]!;
    expect(state.players[0]!.contacts).toEqual([]);
    const tileB = state.core.map.find(tile => tile.id === capitalB.hexId)!;
    const near = state.core.map.find(tile => hexDistance(tile, tileB) === 1 && !['SEA', 'MOUNTAINS'].includes(tile.terrain) && !state.units.some(unit => unit.hexId === tile.id))!;
    const piece = state.units.find(unit => unit.ownerId === a)!;
    piece.hexId = near.id as never;
    refreshKnowledge(state);
    expect(state.players[0]!.contacts).toEqual([b]);
    expect(state.players[1]!.contacts).toEqual([a]);
  });

  it('opening a Pátria does not open the frontier: a frontier Region opens for everyone only when somebody explores it', () => {
    const state = beginAlphaPlanning(make(4, 9));
    const frontier = state.regions.find(region => region.templateId.startsWith('frontier-'))!;
    for (const viewer of ids(4)) expect(regionOpenFor(state, frontier, viewer)).toBe(false);
    frontier.revealedBy.push(PlayerIdSchema.parse('p3'));
    for (const viewer of ids(4)) expect(regionOpenFor(state, frontier, viewer)).toBe(true);
  });
});
