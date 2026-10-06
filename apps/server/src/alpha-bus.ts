import type { AlphaRepository, AlphaRoom } from './alpha-room.js';

/**
 * In-process push channel for the shared table (SSE). It carries no game data, only "this room reached version N": every client then reads its own
 * authoritative projection, so a push can never show a state the server has not saved. It lives on globalThis so a dev hot reload keeps subscribers.
 * Limitation: one server process (Railway single instance). With several instances a shared bus (Postgres LISTEN/NOTIFY, Redis) replaces it; the
 * clients' slow safety poll still converges either way.
 */
/** Public, ephemeral table events that are not game state: they are never saved. Reactions and pings carry only a seat id and a fixed code. */
export type AlphaTableEvent={type:'PRESENCE'}|{type:'REACTION';playerId:string;reaction:string}|{type:'PING';playerId:string;hexId:string;reaction:string};
export interface AlphaPush { gameId: string; version: number; at: number; event?: AlphaTableEvent }
type Listener = (push: AlphaPush) => void;
const shared = globalThis as typeof globalThis & { aohAlphaBus?: Map<string, Set<Listener>> };
const channels = (): Map<string, Set<Listener>> => (shared.aohAlphaBus ??= new Map());
export function subscribeAlpha(gameId: string, listener: Listener): () => void {
  const map = channels(), set = map.get(gameId) ?? new Set<Listener>();
  set.add(listener); map.set(gameId, set);
  return () => { set.delete(listener); if (set.size === 0) map.delete(gameId); };
}
export function publishAlpha(gameId: string, version: number, at = Date.now(), event?: AlphaTableEvent): void {
  for (const listener of [...(channels().get(gameId) ?? [])]) { try { listener(event ? { gameId, version, at, event } : { gameId, version, at }); } catch { /* a dead stream never blocks a save */ } }
}
export function publishAlphaEvent(gameId: string, event: AlphaTableEvent, at = Date.now()): void { publishAlpha(gameId, -2, at, event); }
/** Announces every successful save (create excluded: nobody listens to a room that does not exist yet) once it is committed. */
export class PublishingAlphaRepository implements AlphaRepository {
  constructor(private readonly inner: AlphaRepository) {}
  find(id: string): Promise<AlphaRoom | null> { return this.inner.find(id); }
  findByCode(code: string): Promise<AlphaRoom | null> { return this.inner.findByCode(code); }
  create(room: AlphaRoom): Promise<boolean> { return this.inner.create(room); }
  async save(room: AlphaRoom, expectedVersion: number): Promise<boolean> {
    const saved = await this.inner.save(room, expectedVersion);
    if (saved) publishAlpha(room.id, room.version);
    return saved;
  }
}
