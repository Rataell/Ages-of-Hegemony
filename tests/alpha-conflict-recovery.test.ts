import { describe, expect, it } from 'vitest';
import { hexNeighbors } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService, type AlphaRoomView } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { CONFLICT_AFTER_RETRY, sendWithRecovery, type CommandTransport, type Reply, type SendOutcome } from '../apps/web/app/alpha/send-command.js';

const origin = 'https://alpha.example.test';

/** One browser: its cookie, the projection it last saw, and the exact requests it made (for counting). */
class Browser {
  room!: AlphaRoomView;
  readonly posts: Record<string, unknown>[] = [];
  readonly gets: string[] = [];
  constructor(private readonly http: AlphaHttp, public cookie = '') {}
  private async call(request: Request): Promise<Reply> {
    const response = await this.http.handle(request);
    const set = response.headers.get('set-cookie');
    if (set) this.cookie = set.split(';')[0]!;
    return await response.json() as Reply;
  }
  readonly transport: CommandTransport = {
    post: async body => { this.posts.push(body); return this.call(new Request(`${origin}/api/alpha`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: this.cookie }, body: JSON.stringify(body) })); },
    fetchRoom: async id => { this.gets.push(id); return this.call(new Request(`${origin}/api/alpha?gameId=${id}`, { headers: { Cookie: this.cookie } })); },
  };
  /** Same envelope the alpha shell builds: the command carries the version this browser currently believes. */
  async send(payload: Record<string, unknown>, operation: 'command' | 'lobby' = 'command'): Promise<SendOutcome> {
    const version = operation === 'command' ? this.room.game!.version : this.room.version;
    const outcome = await sendWithRecovery(this.transport, { operation, gameId: this.room.id, payload: { ...payload, expectedVersion: version } });
    if (outcome.latest) this.room = outcome.latest;
    if (outcome.reply.ok) this.room = outcome.reply.value;
    return outcome;
  }
  async refresh() { const reply = await this.transport.fetchRoom(this.room.id); if (reply.ok) this.room = reply.value; }
}

async function table() {
  const repository = new InMemoryAlphaRepository();
  const http = new AlphaHttp(new AlphaGameService(repository), new GuestSessions('recovery-secret-'.repeat(4)), origin, true);
  const a = new Browser(http), b = new Browser(http);
  const created = await a.transport.post({ operation: 'create', payload: { name: 'Mesa de teste', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 77, planningSeconds: 0 } });
  if (!created.ok) throw new Error(created.error.message);
  a.room = created.value;
  const joined = await b.transport.post({ operation: 'join', code: created.value.joinCode, displayName: 'Beto' });
  if (!joined.ok) throw new Error(joined.error.message);
  b.room = joined.value;
  for (const [browser, civilization] of [[a, 'aurelia'], [b, 'valgard']] as const) {
    await browser.refresh();
    for (const payload of [{ type: 'CHOOSE_CIVILIZATION', civilization }, { type: 'LOBBY_READY', ready: true }]) {
      const outcome = await browser.send(payload, 'lobby');
      if (!outcome.reply.ok) throw new Error(outcome.reply.error.message);
    }
  }
  await a.refresh();
  const started = await a.send({ type: 'START' }, 'lobby');
  if (!started.reply.ok) throw new Error(started.reply.error.message);
  await b.refresh();
  for (const browser of [a, b]) {
    const own = browser.room.game!.self;
    const chosen = await browser.send({ type: 'CHOOSE_AMBITIONS', cardIds: own.ambitions.slice(0, 2) });
    if (!chosen.reply.ok) throw new Error(chosen.reply.error.message);
  }
  await a.refresh(); await b.refresh();
  const server = async () => (await repository.find(a.room.id))!;
  return { a, b, repository, server, game: async () => (await server()).game! };
}
const posts = (browser: Browser) => browser.posts.filter(post => post.operation === 'command');
const readyCount = (game: { players: { ready: boolean }[] }) => game.players.filter(p => p.ready).length;

describe('stale multiplayer commands recover once', () => {
  it('B acts on an old version: conflict, refresh, one retry, success', async () => {
    const { a, b, game } = await table();
    const staleVersion = b.room.game!.version;
    const first = await a.send({ type: 'LEADER_ABILITY' });
    expect(first.reply.ok).toBe(true);
    expect(b.room.game!.version).toBe(staleVersion);
    const before = await game();
    const getsBefore = b.gets.length;
    const outcome = await b.send({ type: 'READY' });
    expect(outcome.retried).toBe(true);
    expect(outcome.reply.ok).toBe(true);
    expect(posts(b).slice(-2).map(p => (p.payload as { expectedVersion: number }).expectedVersion)).toEqual([staleVersion, before.version]);
    expect(b.gets.length - getsBefore).toBe(1);
    const after = await game();
    expect(after.version).toBe(before.version + 1);
    expect(after.players[1]!.ready).toBe(true);
    expect(b.room.game!.self.ready).toBe(true);
  });

  it('recovers the phase confirmation that closes a phase', async () => {
    const { a, b, game } = await table();
    const ready = await a.send({ type: 'READY' });
    expect(ready.reply.ok).toBe(true);
    const outcome = await b.send({ type: 'READY' });
    expect(outcome.retried).toBe(true);
    expect(outcome.reply.ok).toBe(true);
    const after = await game();
    expect(after.phase).toBe('PLANNING');
    expect(after.core.round).toBe(2);
    expect(readyCount(after)).toBe(0);
  });

  it('recovers a planned urban action without acting twice', async () => {
    const { a, b, game } = await table();
    const cityA = a.room.game!.cityStates[0]!.cityId, cityB = b.room.game!.cityStates[0]!.cityId;
    expect((await a.send({ type: 'URBAN_ACTION', cityId: cityA, action: 'PRODUCE' })).reply.ok).toBe(true);
    const outcome = await b.send({ type: 'URBAN_ACTION', cityId: cityB, action: 'PRODUCE' });
    expect(outcome.retried).toBe(true);
    expect(outcome.reply.ok).toBe(true);
    expect((await game()).players.map(player => player.plannedActions.length)).toEqual([1, 1]);
    await a.refresh(); await a.send({ type: 'READY' });
    await b.refresh(); await b.send({ type: 'READY' });
    const after = await game();
    expect(after.players.map(player => player.plannedActions.length)).toEqual([0, 0]);
    expect(after.telemetry.actionsByType.PRODUCE).toBe(2);
    expect(after.events.filter(e => e.type === 'URBAN_ACTION')).toHaveLength(2);
  });

  it('recovers a queued order and queues it once', async () => {
    const { a, b, game } = await table();
    await a.send({ type: 'LEADER_ABILITY' });
    const state = await game();
    const unit = state.units.find(u => u.ownerId === state.players[1]!.playerId)!;
    const from = state.core.map.find(t => t.id === unit.hexId)!;
    // Only hexes of Regions open for Beto are legal steps (the capital sits on an outer hex of its Pátria).
    const open = new Set(b.room.game!.view.visibleTerritory.map(t => t.id as string));
    const target = hexNeighbors(from).map(t => state.core.map.find(tile => tile.id === `${t.q},${t.r}`)).find(t => t && open.has(t.id) && !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain))!;
    const outcome = await b.send({ type: 'QUEUE_ORDER', order: { id: 'order-recover', type: 'MOVE', unitIds: [unit.id], path: [target.id] } });
    expect(outcome.retried).toBe(true);
    expect(outcome.reply.ok).toBe(true);
    expect((await game()).players[1]!.orders.map(o => o.id)).toEqual(['order-recover']);
  });

  it('recovers LEADER_ABILITY exactly once', async () => {
    const { a, b, game } = await table();
    await a.send({ type: 'READY' });
    await b.refresh();
    const stale = b.room.game!.version;
    await a.send({ type: 'LEADER_ABILITY' }).catch(() => undefined);
    await a.refresh();
    const outcome = await b.send({ type: 'LEADER_ABILITY' });
    expect(outcome.reply.ok).toBe(true);
    expect(b.room.game!.self.leader!.eraAbilityUsed).toBe(true);
    const after = await game();
    expect(after.events.filter(e => e.type === 'LEADER_ABILITY' && e.audience?.includes(after.players[1]!.playerId))).toHaveLength(1);
    expect(stale).toBeLessThan(after.version);
  });

  it('shows the real domain error when the retried command became illegal', async () => {
    const { a, game } = await table();
    const stale = new Browser((a as unknown as { http: AlphaHttp }).http, a.cookie);
    stale.room = structuredClone(a.room);
    expect((await a.send({ type: 'LEADER_ABILITY' })).reply.ok).toBe(true);
    const before = await game();
    const outcome = await stale.send({ type: 'LEADER_ABILITY' });
    expect(outcome.retried).toBe(true);
    expect(outcome.reply).toMatchObject({ ok: false, error: { code: 'RULE_FAILURE' } });
    expect(outcome.reply.ok === false && outcome.reply.error.message).toContain('já foi usada');
    expect(await game()).toEqual(before);
  });

  it('executes each command once when both browsers act from the same old version at the same time', async () => {
    const { a, b, game } = await table();
    expect(a.room.game!.version).toBe(b.room.game!.version);
    const base = (await game()).version;
    const [x, y] = await Promise.all([a.send({ type: 'READY' }), b.send({ type: 'READY' })]);
    expect(x.reply.ok && y.reply.ok).toBe(true);
    expect([x.retried, y.retried].filter(Boolean)).toHaveLength(1);
    const after = await game();
    expect(after.version).toBe(base + 2);
    expect(after.phase).toBe('PLANNING');
    expect(after.core.round).toBe(2);
    const readyPosts = [...posts(a), ...posts(b)].filter(post => (post.payload as { type: string }).type === 'READY');
    expect(readyPosts).toHaveLength(3);
  });

  it('keeps the server compare-and-swap: a raw stale command is still refused and changes nothing', async () => {
    const { a, b, game } = await table();
    await a.send({ type: 'LEADER_ABILITY' });
    const before = await game();
    const raw = await b.transport.post({ operation: 'command', gameId: b.room.id, payload: { type: 'READY', expectedVersion: b.room.game!.version } });
    expect(raw).toMatchObject({ ok: false, error: { code: 'VERSION_CONFLICT' } });
    expect(await game()).toEqual(before);
  });

  it('keeps working after reconnecting with the same cookie', async () => {
    const { a, b, game } = await table();
    await a.send({ type: 'READY' });
    const fresh = new Browser((b as unknown as { http: AlphaHttp }).http, b.cookie);
    fresh.room = b.room;
    await fresh.refresh();
    expect(fresh.room.game!.version).toBeGreaterThan(b.room.game!.version);
    expect((await fresh.send({ type: 'READY' })).reply.ok).toBe(true);
    expect((await game()).phase).toBe('PLANNING');
    expect((await game()).core.round).toBe(2);
  });
});

describe('what never gets retried', () => {
  const room = (version: number) => ({ id: 'g', version, game: { version } }) as unknown as AlphaRoomView;
  const conflict: Reply = { ok: false, error: { code: 'VERSION_CONFLICT', message: 'A partida mudou.' } };
  const envelope = { operation: 'command', gameId: 'g', payload: { type: 'READY', expectedVersion: 3 } };
  const script = (replies: Reply[], fetches: (Reply | Error)[] = []) => {
    const sent: Record<string, unknown>[] = []; let fetched = 0;
    const transport: CommandTransport = {
      post: async body => { sent.push(body); const next = replies.shift(); if (!next) throw new Error('unexpected extra post'); return next; },
      fetchRoom: async () => { const next = fetches[fetched++]; if (next instanceof Error) throw next; if (!next) throw new Error('unexpected extra fetch'); return next; },
    };
    return { transport, sent, fetched: () => fetched };
  };

  it('does not retry domain errors, timeouts, network failures or server errors', async () => {
    for (const code of ['RULE_FAILURE', 'WRONG_PHASE', 'FORBIDDEN', 'UNAVAILABLE', 'RATE_LIMIT', 'NOT_ACTIVE', 'ALREADY_READY']) {
      const s = script([{ ok: false, error: { code, message: code } }]);
      const outcome = await sendWithRecovery(s.transport, envelope);
      expect(outcome.retried).toBe(false);
      expect(s.sent).toHaveLength(1);
      expect(s.fetched()).toBe(0);
    }
    const down = { post: async () => { throw new TypeError('network'); }, fetchRoom: async () => { throw new Error('should not fetch'); } } as CommandTransport;
    await expect(sendWithRecovery(down, envelope)).rejects.toThrow('network');
  });

  it('does not retry when the refresh itself fails or returns no game', async () => {
    for (const fetches of [[new Error('offline')], [{ ok: false, error: { code: 'UNAVAILABLE', message: 'x' } } as Reply]]) {
      const s = script([conflict], fetches);
      const outcome = await sendWithRecovery(s.transport, envelope);
      expect(outcome.reply).toEqual(conflict);
      expect(s.sent).toHaveLength(1);
    }
    const lobby = script([conflict], [{ ok: true, value: { id: 'g', version: 9, game: null } as unknown as AlphaRoomView }]);
    const outcome = await sendWithRecovery(lobby.transport, { operation: 'command', gameId: 'g', payload: { type: 'READY', expectedVersion: 3 } });
    expect(outcome.retried).toBe(false);
    expect(lobby.sent).toHaveLength(1);
  });

  it('retries up to three times with a fresh version each time, then ends with a clear message and a refreshed screen', async () => {
    const s = script([conflict, conflict, conflict, conflict], [{ ok: true, value: room(7) }, { ok: true, value: room(8) }, { ok: true, value: room(9) }, { ok: true, value: room(10) }]);
    const outcome = await sendWithRecovery(s.transport, envelope, { delay: async () => {} });
    expect(s.sent).toHaveLength(4);
    expect(s.sent.map(body => (body.payload as { expectedVersion: number }).expectedVersion)).toEqual([3, 7, 8, 9]);
    expect(outcome.retried).toBe(true);
    expect(outcome.reply).toEqual({ ok: false, error: { code: 'VERSION_CONFLICT', message: CONFLICT_AFTER_RETRY } });
    expect(outcome.latest!.version).toBe(10);
  });

  it('succeeds on the third retry after two more lost races (6 seats confirming in the same second)', async () => {
    const ok: Reply = { ok: true, value: room(11) };
    const s = script([conflict, conflict, conflict, ok], [{ ok: true, value: room(7) }, { ok: true, value: room(8) }, { ok: true, value: room(9) }]);
    const outcome = await sendWithRecovery(s.transport, envelope, { delay: async () => {} });
    expect(outcome.reply).toEqual(ok);
    expect(s.sent).toHaveLength(4);
  });

  it('only recovers game commands and lobby actions, and keeps the version in every request', async () => {
    const created = script([conflict], [{ ok: true, value: room(2) }]);
    const outcome = await sendWithRecovery(created.transport, { operation: 'create', payload: { name: 'x' } });
    expect(created.sent).toHaveLength(1);
    expect(outcome.retried).toBe(false);
    const lobby = script([conflict, { ok: true, value: room(5) }], [{ ok: true, value: room(5) }]);
    const done = await sendWithRecovery(lobby.transport, { operation: 'lobby', gameId: 'g', payload: { type: 'LOBBY_READY', ready: true, expectedVersion: 4 } });
    expect(done.reply.ok).toBe(true);
    expect((lobby.sent[1]!.payload as { expectedVersion: number }).expectedVersion).toBe(5);
    expect(lobby.sent[1]!.payload).toMatchObject({ type: 'LOBBY_READY', ready: true });
  });

  it('resends exactly the same command with only the version replaced', async () => {
    const s = script([conflict, { ok: true, value: room(11) }], [{ ok: true, value: room(10) }]);
    const outcome = await sendWithRecovery(s.transport, { operation: 'command', gameId: 'g', payload: { type: 'URBAN_ACTION', cityId: 'c', action: 'PRODUCE', expectedVersion: 3 } });
    expect(outcome.reply.ok).toBe(true);
    expect(s.sent[1]).toEqual({ operation: 'command', gameId: 'g', payload: { type: 'URBAN_ACTION', cityId: 'c', action: 'PRODUCE', expectedVersion: 10 } });
  });
});
