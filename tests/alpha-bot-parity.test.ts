import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';
import type { AlphaState } from '@aoh/game-domain';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { redactStateForSeat } from '../apps/server/src/alpha-bot-view.js';
import { confirmBotSeat, planBotSeat } from '../apps/server/src/alpha-bot.js';
import { AlphaRoomSchema } from '../apps/server/src/alpha-room.js';
import { encodeRoom } from '../apps/server/src/alpha-prisma-repository.js';

process.env.ALPHA_LOG = '0';
/** A few rounds played by bots through the real engine, so the table has moved pieces, claimed land, cities and open Regions. */
function playedState(rounds: number): AlphaState {
  let game = beginAlphaPlanning(createAlphaGame({ gameId: randomUUID(), seed: 9, privateSeed: 'b'.repeat(64), preset: 'QUICK', players: [{ id: 'p1', name: 'A', civilization: 'aurelia' }, { id: 'p2', name: 'B', civilization: 'valgard' }, { id: 'p3', name: 'C', civilization: 'thalos' }] }));
  const target = game.core.round + rounds;
  for (let guard = 0; guard < 60 && game.core.round < target && game.core.status === 'ACTIVE'; guard++) {
    for (const id of ['p1', 'p2', 'p3'] as const) {
      if (game.players.find(p => p.playerId === id)!.ready) continue;
      if (game.phase === 'PLANNING' || game.phase === 'ERA_TURN') game = planBotSeat('parity', game, id as never, 'balanced', 9).game;
      game = confirmBotSeat('parity', game, id as never).game;
    }
  }
  return game;
}
const ids = (list: { id: string }[]) => list.map(x => x.id).sort();

describe('projection parity: the bot sees what a human in that seat is sent', () => {
  const state = playedState(4);
  for (const seat of ['p1', 'p2', 'p3'] as const) it(`${seat}: terrain, cities, pieces, threats, peoples, Regions, battles and events match the human projection`, () => {
    const human = alphaPlayerView(state, seat as never)!, bot = redactStateForSeat(state, seat as never);
    // Terrain: the tiles a human can read (visible + known) are exactly the tiles the bot can read, with the same terrain; everything else is UNKNOWN to the bot.
    const humanTiles = new Map([...human.view.visibleTerritory, ...human.knownTerritory].map(t => [t.id as string, t.terrain]));
    for (const tile of bot.core.map) {
      if (tile.terrain === 'UNKNOWN') expect(humanTiles.get(tile.id) ?? 'UNKNOWN', `${tile.id} must be unknown to both`).toBe('UNKNOWN');
      else expect(humanTiles.get(tile.id), `${tile.id} readable by the bot must be readable by the human`).toBe(tile.terrain);
    }
    for (const [id, terrain] of humanTiles) if (terrain !== 'UNKNOWN') expect(bot.core.map.find(t => t.id === id)!.terrain, `${id} readable by the human is readable by the bot`).toBe(terrain);
    // Cities: own + the visible ones.
    const humanCities = [...human.view.player.civilization.cities, ...human.view.visibleCities].map(c => c.id).sort();
    expect(bot.core.players.flatMap(p => p.civilization.cities).map(c => c.id).sort()).toEqual(humanCities);
    // Physical pieces (Pioneiros, Enviados, armies, fleets) — never cargo of a rival fleet.
    expect(ids(bot.units)).toEqual(ids(human.units));
    // World threats, independent peoples, open Regions, battles and the event feed.
    expect(ids(bot.threats)).toEqual(ids(human.threats));
    expect(ids(bot.independents)).toEqual(ids(human.independents));
    expect(bot.regions.filter(r => r.templateId !== 'hidden').map(r => r.id).sort()).toEqual(human.regions.map(r => r.id).sort());
    expect(ids(bot.battles)).toEqual(ids(human.battles));
    expect(ids(bot.events)).toEqual(ids(human.events));
    // Fortifications and ownership of what is visible are the public marks.
    for (const mark of human.cityMarks) { const meta = bot.cities.find(c => c.cityId === mark.cityId); expect(meta?.fortification).toEqual(state.cities.find(c => c.cityId === mark.cityId)!.fortification); }
    for (const tile of human.view.visibleTerritory) expect(bot.core.map.find(t => t.id === tile.id)!.ownerId).toBe(tile.ownerId);
  });

  it('what stays private for a human stays private for the bot', () => {
    const bot = redactStateForSeat(state, 'p1' as never);
    for (const rival of bot.players.filter(p => p.playerId !== 'p1')) { expect(rival.hand).toEqual([]); expect(rival.ambitions).toEqual([]); expect(rival.orders).toEqual([]); expect(rival.plannedActions).toEqual([]); expect(rival.pendingChoices).toEqual([]); expect(rival.research).toEqual([]); expect(rival.defensePosture).toBe('HOLD'); }
    expect(bot.privateRng.seed).toBe('0'.repeat(64)); expect(bot.cards.strategyDeck).toEqual([]); expect(bot.worldPulse.deck).toEqual([]);
    for (const region of bot.regions.filter(r => r.templateId === 'hidden')) for (const hex of region.hexIds) expect(bot.core.map.find(t => t.id === hex)!.terrain).toBe('UNKNOWN');
  });
});

describe('room format: V1 rollback keeps rooms without bots readable; rooms with bots are V1.1+', () => {
  const host = randomUUID();
  const room = (bots: boolean) => AlphaRoomSchema.parse({ id: randomUUID(), version: 0, name: 'Mesa', joinCode: 'a'.repeat(22), hostGuestId: host, preset: 'QUICK', worldPreset: 'MIXED', seed: 1, seatLimit: 3, actionsPerRound: 5, revealMap: false, planningSeconds: 0, deadline: null, game: null,
    seats: [{ guestId: host, playerId: 'player-1', name: 'Ana', civilization: null, ready: false }, ...(bots ? [{ guestId: randomUUID(), playerId: 'player-2', name: 'Bot 1', civilization: 'valgard', ready: true, bot: true, botPersona: 'warrior' }] : [])] });
  it('a room without bots is stored with the exact V1 seat shape (no bot keys)', () => {
    const stored = JSON.parse(JSON.stringify(encodeRoom(room(false)))) as { seats: Record<string, unknown>[] };
    expect(Object.keys(stored.seats[0]!).sort()).toEqual(['civilization', 'guestId', 'name', 'playerId', 'ready']);
  });
  it('a room with bots is stored with explicit bot seats and still round-trips in V1.1; nothing converts a bot into a human', () => {
    const stored = JSON.parse(JSON.stringify(encodeRoom(room(true)))) as { seats: { bot?: boolean; botPersona?: string }[] };
    expect(stored.seats[1]).toMatchObject({ bot: true, botPersona: 'warrior' }); expect(stored.seats[0]!.bot).toBeUndefined();
    const back = AlphaRoomSchema.parse(stored);
    expect(back.seats.map(s => s.bot)).toEqual([false, true]);
  });
});
