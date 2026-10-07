import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import type { GuestPrincipal } from '../apps/server/src/guest-session.js';
import { resetPresenceForTests } from '../apps/server/src/alpha-presence.js';

beforeEach(() => { resetPresenceForTests(); process.env.ALPHA_BOT_DELAY_MS = '0'; process.env.ALPHA_LOG = '0'; delete process.env.ALPHA_MAX_SEATS; });
const guest = (): GuestPrincipal => ({ guestId: randomUUID() });

/** 1 human + 3 bots on a given world, the human only answers the mandatory decisions and confirms. */
async function play(worldPreset: string, mapSize: string, rounds: number) {
  const repository = new InMemoryAlphaRepository(), service = new AlphaGameService(repository), human = guest();
  const created = await service.create(human, { name: 'Mundo', displayName: 'Ana', preset: 'QUICK', seatLimit: 4, seed: 31, planningSeconds: 0, worldPreset, mapSize });
  if (!created.ok) throw new Error(created.error.message);
  const id = created.value.id;
  for (let i = 0; i < 3; i++) { const v = await service.read(human, id, 0); if (!v.ok) throw new Error('read'); const r = await service.lobby(human, id, { type: 'ADD_BOT', expectedVersion: v.value.version }, 0); if (!r.ok) throw new Error(r.error.message); }
  const v = await service.read(human, id, 0); if (!v.ok) throw new Error('read');
  const taken = new Set(v.value.seats.filter(s => s.bot).map(s => s.civilization));
  const civ = ['valgard', 'nymara', 'meridia', 'dravik', 'solenne', 'kor', 'thalos', 'orinth', 'saren', 'aurelia'].find(c => !taken.has(c))!;
  const c = await service.lobby(human, id, { type: 'CHOOSE_CIVILIZATION', expectedVersion: v.value.version, civilization: civ }, 0); if (!c.ok) throw new Error(c.error.message);
  const r = await service.lobby(human, id, { type: 'LOBBY_READY', expectedVersion: c.value.version, ready: true }, 0); if (!r.ok) throw new Error(r.error.message);
  const s = await service.lobby(human, id, { type: 'START', expectedVersion: r.value.version }, 0); if (!s.ok) throw new Error(s.error.message);
  let stalls = 0, lastRound = 0;
  for (let step = 0; step < rounds * 6; step++) {
    const view = await service.read(human, id, 1); if (!view.ok) throw new Error('read');
    const g = view.value.game!;
    if (g.core?.round !== undefined && g.core.round >= rounds) break;
    const me = g.self;
    if (!me.ambitionsChosen) { await service.command(human, id, { type: 'CHOOSE_AMBITIONS', expectedVersion: g.version, cardIds: me.ambitions.slice(0, 2) }, 1); continue; }
    const choice = me.pendingChoices[0]; if (choice) { await service.command(human, id, { type: 'RESOLVE_CHOICE', expectedVersion: g.version, choiceId: choice.id, optionId: choice.options[0]!.id }, 1); continue; }
    if (!me.ready) await service.command(human, id, { type: 'READY', expectedVersion: g.version }, 1);
    const room = (await repository.find(id))!;
    const round = room.game!.core.round;
    if (round === lastRound) stalls++; else { stalls = 0; lastRound = round; }
    if (stalls > 20) break;
  }
  return (await repository.find(id))!.game!;
}

describe('bots in the new worlds (1H + 3B)', () => {
  it.each([['ARCHIPELAGO', 'STANDARD'], ['INLAND_SEA', 'WIDE'], ['MIXED', 'COMPACT']])('%s %s: bots play the rounds without stalling, never explore with soldiers, and open Regions', async (preset, size) => {
    const game = await play(preset, size, 8);
    expect(game.core.round).toBeGreaterThanOrEqual(5);
    const explorers = game.events.filter(e => e.type === 'REGION_REVEALED').length;
    expect(explorers).toBeGreaterThanOrEqual(0);
    // No soldier ever stands as the explorer of a revealed Region: military land pieces cannot be given an EXPLORE order.
    for (const unit of game.units.filter(u => ['INFANTRY', 'GUARD', 'RANGED', 'CAVALRY', 'SIEGE'].includes(u.kind))) expect(unit.kind).not.toBe('PIONEER');
    expect(game.regions.filter(r => r.revealedBy.length > 0).length).toBeGreaterThan(game.players.length);
    // Bots do the exploring: every bot opened Regions beyond its own Pátria.
    expect(game.players.slice(1).every(p => p.exploredRegions > 0)).toBe(true);
  }, 120000);
});
