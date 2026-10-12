import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AlphaGameService, type AlphaRoomView } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository, MovePreviewRequestSchema } from '../apps/server/src/alpha-room.js';
import type { GuestPrincipal } from '../apps/server/src/guest-session.js';

/** V12-UX-04 · Mover coordenado on the server: new matches carry the rule, the projection says which pieces are in an Order, and the preview is read-only. */
const principal = (): GuestPrincipal => ({ guestId: randomUUID() });
async function started() {
  const repository = new InMemoryAlphaRepository(), service = new AlphaGameService(repository), a = principal(), b = principal();
  const created = await service.create(a, { name: 'Mesa', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 123, planningSeconds: 0 });
  if (!created.ok) throw new Error(created.error.message);
  const joined = await service.join(b, created.value.joinCode, 'Beto'); if (!joined.ok) throw new Error(joined.error.message);
  let view: AlphaRoomView = joined.value;
  for (const [actor, civilization] of [[a, 'aurelia'], [b, 'valgard']] as const) {
    const chosen = await service.lobby(actor, view.id, { type: 'CHOOSE_CIVILIZATION', expectedVersion: view.version, civilization }, 0); if (!chosen.ok) throw new Error(chosen.error.message); view = chosen.value;
    const ready = await service.lobby(actor, view.id, { type: 'LOBBY_READY', expectedVersion: view.version, ready: true }, 0); if (!ready.ok) throw new Error(ready.error.message); view = ready.value;
  }
  const go = await service.lobby(a, view.id, { type: 'START', expectedVersion: view.version }, 1000); if (!go.ok) throw new Error(go.error.message);
  return { repository, service, a, b, view: go.value };
}

describe('coordinated move on the server', () => {
  it('a NEW match carries the rule, and the projection exposes the cap and the pieces', async () => {
    const f = await started(), game = f.view.game!;
    expect(game.rules.coordinatedMove).toBe(true);
    expect(game.coordinatedMove.enabled).toBe(true);
    expect(game.coordinatedMove.maxPieces).toBe(3);
    expect(game.coordinatedMove.usedPieces).toBe(0);
    expect(game.coordinatedMove.pieces.length).toBe(game.units.filter(u => u.ownerId === f.view.selfPlayerId).length);
  });
  it('movePreview answers per leg, writes nothing, and refuses strangers and malformed bodies', async () => {
    const f = await started(), game = f.view.game!, mine = game.units.filter(u => u.ownerId === f.view.selfPlayerId);
    const withMoves = mine.filter(u => Object.keys(game.unitOptions[u.id]!.moves).length > 0).slice(0, 2);
    expect(withMoves.length).toBe(2);
    const leg = (u: typeof mine[number]) => { const moves = game.unitOptions[u.id]!.moves; return { unitIds: [u.id], path: moves[Object.keys(moves).sort()[0]!]! }; };
    const before = await f.repository.find(f.view.id), versionBefore = before!.version;
    const asked = await f.service.movePreview(f.a, f.view.id, { legs: withMoves.map(leg) });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.value.coordinated).toBe(true);
    expect(asked.value.legs.length).toBe(2);
    expect(asked.value.legs.every(l => l.cost > 0 && l.budget >= l.cost && l.remaining === l.budget - l.cost)).toBe(true);
    expect((await f.repository.find(f.view.id))!.version).toBe(versionBefore);
    expect((await f.repository.find(f.view.id))!.game!.players.every(p => p.orders.length === 0)).toBe(true);
    expect((await f.service.movePreview(principal(), f.view.id, { legs: withMoves.map(leg) })).ok).toBe(false);
    expect((await f.service.movePreview(f.a, f.view.id, { legs: [] })).ok).toBe(false);
    expect((await f.service.movePreview(f.a, f.view.id, { legs: withMoves.map(leg), extra: 1 })).ok).toBe(false);
    // the other seat's pieces are not mine: the preview refuses them without revealing anything else
    const theirs = game.units.find(u => u.ownerId !== f.view.selfPlayerId);
    if (theirs) { const refused = await f.service.movePreview(f.a, f.view.id, { legs: [{ unitIds: [theirs.id], path: ['0,0'] }] }); expect(refused.ok && refused.value.ok).toBe(false); }
    expect(MovePreviewRequestSchema.safeParse({ legs: [1, 2, 3, 4].map(i => ({ unitIds: [`u${i}`], path: ['1,1'] })) }).success).toBe(false);
  });
  it('a coordinated command goes through the real command path and shows up in the projection', async () => {
    const f = await started(), game = f.view.game!, mine = game.units.filter(u => u.ownerId === f.view.selfPlayerId);
    const withMoves = mine.filter(u => Object.keys(game.unitOptions[u.id]!.moves).length > 0);
    const [x, y] = withMoves;
    const first = (u: typeof x) => { const moves = game.unitOptions[u!.id]!.moves; return moves[Object.keys(moves).sort()[0]!]!; };
    const sent = await f.service.command(f.a, f.view.id, { type: 'QUEUE_ORDER', expectedVersion: game.version, order: { id: 'coord-1', type: 'MOVE', legs: [{ unitIds: [x!.id], path: first(x) }, { unitIds: [y!.id], path: first(y) }] } }, 2000);
    expect(sent.ok, sent.ok ? '' : sent.error.message).toBe(true);
    if (!sent.ok) return;
    const after = sent.value.game!;
    expect(after.actions.used).toBe(1);
    expect(after.coordinatedMove.usedPieces).toBe(2);
    expect(after.coordinatedMove.queued).toEqual([{ orderId: 'coord-1', pieces: 2, legs: 2 }]);
    expect(after.coordinatedMove.pieces.find(p => p.unitId === x!.id)).toMatchObject({ inOrder: true, legIndex: 0, orderId: 'coord-1' });
    // the rival never sees it
    const rival = await f.service.read(f.b, f.view.id, 2000);
    expect(rival.ok && JSON.stringify(rival.value.game)).not.toContain('coord-1');
  });
});
