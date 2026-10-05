import { describe, expect, it } from 'vitest';
import { ACTION_CLASS, AlphaCommandSchema, MapPresetSchema, PlayerIdSchema } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { CreateAlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { PLANNING_OPTIONS, WORLD_OPTIONS } from '../apps/web/app/alpha/alpha-options.js';
import { HEX_HALF_HEIGHT, HEX_HALF_WIDTH, clampCentre, clampZoom, mapFrame, position, viewBoxOf } from '../apps/web/app/play/map-frame.js';

const create = (extra: Record<string, unknown> = {}) => ({ name: 'Mesa', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 7, planningSeconds: 0, ...extra });

describe('creation options match the schemas', () => {
  it('offers exactly the world presets the domain knows, in Portuguese', () => {
    expect(WORLD_OPTIONS.map(([value]) => value)).toEqual([...MapPresetSchema.options]);
    expect(WORLD_OPTIONS.map(([, text]) => text)).toEqual(['Continental', 'Arquipélago', 'Mar Interior', 'Misto']);
  });

  it('offers only planning deadlines the room schema accepts, and none it rejects', () => {
    expect(PLANNING_OPTIONS.map(([value]) => value)).toEqual([0, 180, 300, 480, 3600, 14400, 28800]);
    expect(PLANNING_OPTIONS.map(([, text]) => text)).toEqual(['Sem prazo', '3 minutos', '5 minutos', '8 minutos', '1 hora', '4 horas', '8 horas']);
    for (const [value] of PLANNING_OPTIONS) expect(CreateAlphaRoomSchema.safeParse(create({ planningSeconds: value })).success, String(value)).toBe(true);
    for (const removed of [900, 43200, 86400]) expect(CreateAlphaRoomSchema.safeParse(create({ planningSeconds: removed })).success, String(removed)).toBe(false);
  });

  it('every offered world preset is stored with the room and reaches the running match', async () => {
    for (const [worldPreset] of WORLD_OPTIONS) {
      const repository = new InMemoryAlphaRepository(), service = new AlphaGameService(repository), a = { guestId: crypto.randomUUID() }, b = { guestId: crypto.randomUUID() };
      const created = await service.create(a, CreateAlphaRoomSchema.parse(create({ worldPreset })));
      if (!created.ok) throw new Error(created.error.message);
      expect(created.value.worldPreset).toBe(worldPreset);
      const joined = await service.join(b, created.value.joinCode, 'Beto'); if (!joined.ok) throw new Error(joined.error.message);
      let version = joined.value.version;
      for (const [actor, civilization] of [[a, 'aurelia'], [b, 'valgard']] as const) {
        const chosen = await service.lobby(actor, created.value.id, { type: 'CHOOSE_CIVILIZATION', expectedVersion: version, civilization }, 1000); if (!chosen.ok) throw new Error(chosen.error.message);
        const ready = await service.lobby(actor, created.value.id, { type: 'LOBBY_READY', expectedVersion: chosen.value.version, ready: true }, 1000); if (!ready.ok) throw new Error(ready.error.message);
        version = ready.value.version;
      }
      const started = await service.lobby(a, created.value.id, { type: 'START', expectedVersion: version }, 1000); if (!started.ok) throw new Error(started.error.message);
      expect((await repository.find(created.value.id))!.game!.rules.worldPreset).toBe(worldPreset);
    }
  });

  it('the world preset defaults to Misto when the client sends none', () => {
    expect(CreateAlphaRoomSchema.parse(create()).worldPreset).toBe('MIXED');
  });

  it('accepts only 3 to 6 Orders, defaults to 5, and classifies every command', () => {
    expect(CreateAlphaRoomSchema.parse(create()).actionsPerRound).toBe(5);
    for (const actionsPerRound of [3,4,5,6]) expect(CreateAlphaRoomSchema.safeParse(create({ actionsPerRound })).success).toBe(true);
    for (const actionsPerRound of [2,7]) expect(CreateAlphaRoomSchema.safeParse(create({ actionsPerRound })).success).toBe(false);
    const commandTypes=AlphaCommandSchema.options.map(option=>option.shape.type.value).sort();
    expect(Object.keys(ACTION_CLASS).sort()).toEqual(commandTypes);
  });
});

describe('atlas frame', () => {
  const tiles = [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 0, r: 1 }, { q: 1, r: 1 }];

  it('is the real bounds of the tiles plus padding, not a fixed minimum area', () => {
    const points = tiles.map(tile => position(tile.q, tile.r));
    const frame = mapFrame(tiles, { padding: 24, minWidth: 0, minHeight: 0 });
    expect(frame.x).toBeCloseTo(Math.min(...points.map(p => p.x)) - HEX_HALF_WIDTH - 24);
    expect(frame.y).toBeCloseTo(Math.min(...points.map(p => p.y)) - HEX_HALF_HEIGHT - 24);
    expect(frame.x + frame.width).toBeCloseTo(Math.max(...points.map(p => p.x)) + HEX_HALF_WIDTH + 24);
    expect(frame.y + frame.height).toBeCloseTo(Math.max(...points.map(p => p.y)) + HEX_HALF_HEIGHT + 24);
    expect(frame.width).toBeLessThan(600); expect(frame.height).toBeLessThan(500);
  });

  it('measures only the tiles it is given, so hexes the server did not project cannot widen it', () => {
    const near = mapFrame(tiles), withFar = mapFrame([...tiles, { q: 30, r: 20 }]);
    expect(withFar.width).toBeGreaterThan(near.width * 3);
    expect(mapFrame(tiles)).toEqual(near);
  });

  it('keeps a small floor only for a degenerate one-hex atlas and never returns an empty frame', () => {
    expect(mapFrame([{ q: 0, r: 0 }]).width).toBeGreaterThanOrEqual(300);
    expect(mapFrame([])).toMatchObject({ width: 600, height: 500 });
  });

  it('fits by default, zooms around a centre, and keeps zoom and centre inside sane limits', () => {
    const frame = mapFrame(tiles);
    expect(viewBoxOf(frame, null)).toBe(`${frame.x} ${frame.y} ${frame.width} ${frame.height}`);
    const [, , width] = viewBoxOf(frame, { cx: frame.cx, cy: frame.cy, zoom: 2 }).split(' ').map(Number);
    expect(width).toBeCloseTo(frame.width / 2);
    expect(clampZoom(0.01)).toBe(0.5); expect(clampZoom(99)).toBe(4);
    const far = clampCentre(frame, 1e6, -1e6);
    expect(far.cx).toBe(frame.x + frame.width); expect(far.cy).toBe(frame.y);
  });
});

describe('the atlas shows the whole public board but only content of open Regions', () => {
  const state = () => beginAlphaPlanning(createAlphaGame({ gameId: 'ux-fog', seed: 23, preset: 'QUICK', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));

  it('projects every Region of the footprint (layer A) but content tiles only for open ones', () => {
    const game = state(), view = alphaPlayerView(game, PlayerIdSchema.parse('p1'))!;
    expect(view.board).toHaveLength(30);
    expect(view.board.flatMap(region => region.hexIds)).toHaveLength(210);
    const content = new Set([...view.view.visibleTerritory, ...view.knownTerritory].map(tile => tile.id));
    const open = new Set(view.board.filter(region => !region.closed).flatMap(region => region.hexIds as string[]));
    for (const id of content) expect(open.has(id), id).toBe(true);
    const text = JSON.stringify([view.view.visibleTerritory, view.knownTerritory]);
    for (const region of view.board.filter(entry => entry.closed)) for (const id of region.hexIds) expect(text.includes(`"id":"${id}"`), id).toBe(false);
    expect(view.board.filter(region => !region.closed).length).toBe(2); // the two Pátrias; the frontier starts closed
  });

  it('the other player\'s Pátria is open on the table with its owner, the frontier is face down, and the whole board fits one frame', () => {
    const game = state(), view = alphaPlayerView(game, PlayerIdSchema.parse('p1'))!;
    const other = view.board.find(region => region.homeOf === PlayerIdSchema.parse('p2'))!;
    expect(other.closed).toBe(false);
    const content = new Set([...view.view.visibleTerritory, ...view.knownTerritory].map(tile => tile.id));
    expect(other.hexIds.every(id => content.has(id))).toBe(true);
    const frontier = view.board.filter(region => region.homeOf === null);
    expect(frontier.every(region => region.closed)).toBe(true);
    const all = view.board.flatMap(region => region.hexIds.map(id => { const [q, r] = id.split(',').map(Number); return { q: q!, r: r! }; }));
    expect(mapFrame(all).width).toBeGreaterThan(mapFrame(game.core.map).width * 0.95);
  });
});
