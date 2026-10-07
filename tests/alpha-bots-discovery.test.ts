import { describe, expect, it } from 'vitest';
import { frontierRegionOf } from '@aoh/game-engine';
import { planBotSeat } from '../apps/server/src/alpha-bot.js';
import { anyLandCase, learn, p1, SEAS, seaCase } from './alpha-move-fixtures.js';
import type { AlphaState } from '@aoh/game-domain';

/** Bots think MOVE: Discovery is the last step of a Move that carries an orientation. They never queue the legacy EXPLORE. */
const orders = (game: AlphaState) => game.players.find(p => p.playerId === p1)!.orders;
const plan = (game: AlphaState, tag: string) => planBotSeat(`bot-discovery-${tag}`, game, p1, 'explorer', 5).game;
const enters = (game: AlphaState, before: AlphaState) => orders(game).filter(order => order.type === 'MOVE' && order.rotation !== undefined && frontierRegionOf(before, p1, order) !== null);

describe('bots: Move + Discovery', () => {
  it('a bot Pioneiro enters a closed Region with one MOVE order (never EXPLORE) ', () => {
    const { state } = anyLandCase();
    // The seat starts with two Pioneiros: one founds, the other opens Regions.
    const next = plan(state, 'land');
    expect(orders(next).some(order => order.type === 'EXPLORE')).toBe(false);
    const found = enters(next, state);
    expect(found.length).toBeGreaterThan(0);
    expect(found.every(order => order.type === 'MOVE' && order.unitIds.every(id => state.units.find(unit => unit.id === id)!.kind === 'PIONEER'))).toBe(true);
  });

  it('a bot ship with a Pioneiro aboard opens a Region; without a Pioneiro (and before Navegação Oceânica) it does not', () => {
    const { state, ship, region } = SEAS();
    const bare = plan(structuredClone(state), 'ship-bare');
    expect(enters(bare, state).some(order => order.type === 'MOVE' && order.unitIds.includes(ship.id))).toBe(false);
    const pioneer = state.units.find(unit => unit.ownerId === p1 && unit.kind === 'PIONEER')!;
    pioneer.carrierId = ship.id; pioneer.hexId = ship.hexId;
    const crewed = plan(structuredClone(state), 'ship-crew');
    const moves = enters(crewed, state).filter(order => order.type === 'MOVE' && order.unitIds.includes(ship.id));
    expect(moves.length).toBe(1);
    expect(region.regionId).toBeTruthy();
  });

  it('after Navegação Oceânica a bot ship (Frota or Barca de Patrulha) opens Regions alone', () => {
    for (const kind of ['FLEET', 'COASTAL_VESSEL'] as const) {
      const found = seaCase(kind);
      if (!found) throw new Error('no sea case');
      learn(found.state, p1, 'web-ocean-navigation');
      const next = plan(found.state, `ship-ocean-${kind}`);
      expect(enters(next, found.state).some(order => order.type === 'MOVE' && order.unitIds.includes(found.ship.id))).toBe(true);
    }
  });
});
