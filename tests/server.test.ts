import { describe, expect, it } from 'vitest';
import { advancePhase, submitOrder } from '@aoh/game-engine';
import { PlayerIdSchema } from '@aoh/game-domain';
import { GameService, playerView } from '../apps/server/src/game-service.js';
import { InMemoryGameRepository } from '../apps/server/src/repository.js';
import { createHttpServer } from '../apps/server/src/http.js';
import { game, gameId, input, playerId, secondPlayerId, unwrap } from './helpers.js';

describe('server application boundary', () => {
  it('rejects impersonation and player phase control', async () => {
    const service = new GameService(new InMemoryGameRepository());
    unwrap(await service.create(input()));
    unwrap(await service.advance(gameId, 'PLANNING', 0));
    expect(await service.submit(gameId, { playerId }, { type: 'SUBMIT_ORDER', expectedVersion: 1, order: { id: 'x', playerId: secondPlayerId, type: 'BUILD' } })).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect(await service.submit(gameId, { playerId }, { type: 'ADVANCE_PHASE', nextPhase: 'RESOLUTION', expectedVersion: 1 })).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect(await service.create(input())).toMatchObject({ ok: false, error: { code: 'ALREADY_EXISTS' } });
  });
  it('allows only one competing write and exposes only the player view', async () => {
    const repository = new InMemoryGameRepository();
    const service = new GameService(repository);
    unwrap(await service.create(input()));
    unwrap(await service.advance(gameId, 'PLANNING', 0));
    const results = await Promise.all([playerId, secondPlayerId].map((id, i) => service.submit(gameId, { playerId: id }, { type: 'SUBMIT_ORDER', expectedVersion: 1, order: { id: `order-${i}`, playerId: id, type: 'EXPLORE' } })));
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toMatchObject([{ error: { code: 'VERSION_CONFLICT' } }]);
    const first = results[0];
    if (!first) throw new Error('Missing result');
    expect(unwrap(first)).not.toHaveProperty('eventLog');
    expect(unwrap(first)).not.toHaveProperty('seed');
    expect((await repository.find(gameId))?.version).toBe(2);
  });
  it('does not leak opponents orders through event logs or references', () => {
    let state = unwrap(advancePhase(game(), 'PLANNING', 0));
    state = unwrap(submitOrder(state, { id: 'secret-order', playerId: secondPlayerId, type: 'RESEARCH' }, 1));
    const view = playerView(state, playerId);
    expect(JSON.stringify(view)).not.toContain('secret-order');
    expect(view).not.toHaveProperty('eventLog');
    expect(view).not.toHaveProperty('players');
    if (!view) throw new Error('Missing view');
    view.player.resources.food = 100;
    expect(state.players[0]?.resources.food).toBe(0);
    expect(playerView(state, PlayerIdSchema.parse('outsider'))).toBeNull();
  });
  it('repository copies writes and reads and rejects stale updates', async () => {
    const repository = new InMemoryGameRepository();
    const state = game();
    expect(await repository.create(state)).toBe(true);
    state.config.baseCommandPoints = 99;
    const loaded = await repository.find(gameId);
    expect(loaded?.config.baseCommandPoints).toBe(4);
    if (!loaded) throw new Error('Missing state');
    loaded.config.baseCommandPoints = 80;
    expect((await repository.find(gameId))?.config.baseCommandPoints).toBe(4);
    const next = unwrap(advancePhase(game(), 'PLANNING', 0));
    expect(await repository.save(next, 0)).toBe(true);
    expect(await repository.save(next, 0)).toBe(false);
  });
  it('serves health and leaves gameplay routes closed', async () => {
    const server = createHttpServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Missing address');
      const base = `http://127.0.0.1:${address.port}`;
      expect(await (await fetch(`${base}/health`)).json()).toMatchObject({ status: 'ok' });
      expect((await fetch(`${base}/games`, { method: 'POST' })).status).toBe(404);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });
});
