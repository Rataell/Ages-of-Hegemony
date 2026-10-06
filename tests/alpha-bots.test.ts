import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAlphaGame, beginAlphaPlanning } from '@aoh/game-engine';
import { AlphaGameService, type AlphaRoomView } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import type { GuestPrincipal } from '../apps/server/src/guest-session.js';
import { redactStateForSeat } from '../apps/server/src/alpha-bot-view.js';
import { resetPresenceForTests, connect } from '../apps/server/src/alpha-presence.js';

const guest = (): GuestPrincipal => ({ guestId: randomUUID() });
beforeEach(() => { resetPresenceForTests(); process.env.ALPHA_BOT_DELAY_MS = '0'; process.env.ALPHA_LOG = '0'; delete process.env.ALPHA_MAX_SEATS; });

async function lobby(humans: number, bots: number, seatLimit = humans + bots) {
  const repository = new InMemoryAlphaRepository(), service = new AlphaGameService(repository), people = Array.from({ length: humans }, guest);
  const created = await service.create(people[0]!, { name: 'Bots', displayName: 'Ana', preset: 'QUICK', seatLimit, seed: 11, planningSeconds: 0 });
  if (!created.ok) throw new Error(created.error.message);
  const id = created.value.id;
  for (const [i, p] of people.slice(1).entries()) { const j = await service.join(p, created.value.joinCode, `H${i + 2}`, 0); if (!j.ok) throw new Error(j.error.message); }
  for (let i = 0; i < bots; i++) { const v = await service.read(people[0]!, id, 0); if (!v.ok) throw new Error('read'); const r = await service.lobby(people[0]!, id, { type: 'ADD_BOT', expectedVersion: v.value.version }, 0); if (!r.ok) throw new Error(r.error.message); }
  return { service, repository, people, id };
}
const CIVS = ['aurelia', 'valgard', 'thalos', 'ironmark'];
async function startTable(t: Awaited<ReturnType<typeof lobby>>) {
  for (const [i, p] of t.people.entries()) {
    const view = await t.service.read(p, t.id, 0); if (!view.ok) throw new Error('read');
    const taken = new Set(view.value.seats.filter(s => s.bot).map(s => s.civilization));
    const civ = CIVS.filter(c => !taken.has(c))[i]!;
    const c = await t.service.lobby(p, t.id, { type: 'CHOOSE_CIVILIZATION', expectedVersion: view.value.version, civilization: civ }, 0); if (!c.ok) throw new Error(c.error.message);
    const r = await t.service.lobby(p, t.id, { type: 'LOBBY_READY', expectedVersion: c.value.version, ready: true }, 0); if (!r.ok) throw new Error(r.error.message);
  }
  const v = await t.service.read(t.people[0]!, t.id, 0); if (!v.ok) throw new Error('read');
  const s = await t.service.lobby(t.people[0]!, t.id, { type: 'START', expectedVersion: v.value.version }, 0); if (!s.ok) throw new Error(s.error.message);
  return s.value;
}
/** A human answers the mandatory first-round decisions and confirms, exactly like the UI would. */
async function humanRound(t: Awaited<ReturnType<typeof lobby>>, p: GuestPrincipal, now = 1) {
  for (let n = 0; n < 6; n++) {
    const v = await t.service.read(p, t.id, now); if (!v.ok) throw new Error('read');
    const g = v.value.game!, me = g.self;
    if (!me.ambitionsChosen) { const r = await t.service.command(p, t.id, { type: 'CHOOSE_AMBITIONS', expectedVersion: g.version, cardIds: me.ambitions.slice(0, 2) }, now); if (!r.ok) throw new Error(r.error.message); continue; }
    const choice = me.pendingChoices[0]; if (choice) { await t.service.command(p, t.id, { type: 'RESOLVE_CHOICE', expectedVersion: g.version, choiceId: choice.id, optionId: choice.options[0]!.id }, now); continue; }
    if (me.ready) return v.value;
    const r = await t.service.command(p, t.id, { type: 'READY', expectedVersion: g.version }, now); if (!r.ok) throw new Error(r.error.message);
    return r.value;
  }
  return (await t.service.read(p, t.id, now) as { ok: true; value: AlphaRoomView }).value;
}

describe('bot view: no privileged information', () => {
  it('a seat-redacted state hides rivals\' private data, closed Regions, unseen pieces and the future', () => {
    const real = beginAlphaPlanning(createAlphaGame({ gameId: randomUUID(), seed: 3, privateSeed: 'a'.repeat(64), preset: 'QUICK', players: [{ id: 'p1', name: 'A', civilization: 'aurelia' }, { id: 'p2', name: 'B', civilization: 'valgard' }, { id: 'p3', name: 'C', civilization: 'thalos' }] }));
    const view = redactStateForSeat(real, 'p1' as never);
    const rival = view.players.find(p => p.playerId === 'p2')!, own = view.players.find(p => p.playerId === 'p1')!;
    expect(rival.hand).toEqual([]); expect(rival.ambitions).toEqual([]); expect(rival.orders).toEqual([]); expect(rival.research).toEqual([]);
    expect(own.ambitions.length).toBeGreaterThan(0); // its own are its own
    expect(view.privateRng.seed).toBe('0'.repeat(64)); expect(view.cards.strategyDeck).toEqual([]); expect(view.worldPulse.deck).toEqual([]);
    // Pátrias are public (a rival capital is on the table for everyone); what is NOT in sight is gone.
    const rivalCities = view.core.players.filter(p => p.id !== 'p1').flatMap(p => p.civilization.cities);
    expect(rivalCities.every(c => view.core.map.find(t => t.id === c.hexId)!.terrain !== 'UNKNOWN')).toBe(true);
    expect(view.units.filter(u => u.ownerId !== 'p1').every(u => view.core.map.find(t => t.id === u.hexId)!.terrain !== 'UNKNOWN')).toBe(true);
    const closed = view.regions.filter(r => r.templateId === 'hidden'); expect(closed.length).toBeGreaterThan(0);
    for (const region of closed) for (const hex of region.hexIds) expect(view.core.map.find(t => t.id === hex)!.terrain).toBe('UNKNOWN'); // face-down Regions reveal nothing to the bot
    // The real state is untouched.
    expect(real.players.find(p => p.playerId === 'p2')!.ambitions.length).toBeGreaterThan(0);
  });
});

describe('bots in the room', () => {
  it('adds and removes bots only in the lobby, host only, up to the seat limit; at least one human', async () => {
    const t = await lobby(1, 2, 3);
    const v = await t.service.read(t.people[0]!, t.id, 0); if (!v.ok) throw new Error('read');
    expect(v.value.seats.filter(s => s.bot).map(s => s.name)).toEqual(['Bot 1', 'Bot 2']);
    expect(v.value.seats.filter(s => s.bot).every(s => s.civilization !== null && s.ready)).toBe(true);
    const full = await t.service.lobby(t.people[0]!, t.id, { type: 'ADD_BOT', expectedVersion: v.value.version }, 0); expect(full.ok).toBe(false);
    const removed = await t.service.lobby(t.people[0]!, t.id, { type: 'REMOVE_BOT', expectedVersion: v.value.version, playerId: 'player-3' }, 0);
    expect(removed.ok && removed.value.seats.length).toBe(2);
    const human = await t.service.lobby(t.people[0]!, t.id, { type: 'REMOVE_BOT', expectedVersion: removed.ok ? removed.value.version : 0, playerId: 'player-1' }, 0); expect(human.ok).toBe(false);
  });
  it('A: 1 human + 1 bot — bot chooses Ambições, plans and confirms by itself; two rounds resolve', async () => {
    const t = await lobby(1, 1); const started = await startTable(t);
    const bot = started.seats.find(s => s.bot)!;
    expect(bot.presence).toBe('BOT');
    const botView = (await t.repository.find(t.id))!.game!.players.find(p => p.playerId === bot.playerId)!;
    expect(botView.ambitionsChosen).toBe(true); expect(botView.ready).toBe(true);
    let view = await humanRound(t, t.people[0]!);
    expect(view.game!.view.round).toBe(2);
    view = await humanRound(t, t.people[0]!);
    expect(view.game!.view.round).toBe(3);
    expect((await t.repository.find(t.id))!.game!.players.find(p => p.playerId === bot.playerId)!.ready).toBe(true);
  });
  it('B: 1 human + 3 bots — four civilizations, every bot plans and confirms, nothing waits on a modal', async () => {
    const t = await lobby(1, 3); const started = await startTable(t);
    expect(started.seats.filter(s => s.bot)).toHaveLength(3); expect(new Set(started.seats.map(s => s.civilization)).size).toBe(4);
    const room = (await t.repository.find(t.id))!;
    expect(room.game!.players.filter(p => p.playerId !== 'player-1').every(p => p.ready && p.ambitionsChosen)).toBe(true);
    const view = await humanRound(t, t.people[0]!); expect(view.game!.view.round).toBe(2);
    const after = (await t.repository.find(t.id))!.game!;
    expect(after.players.filter(p => p.playerId !== 'player-1').every(p => p.ready)).toBe(true);
  });
  it('C: 2 humans + 2 bots — humans keep reacting and the round needs both humans', async () => {
    const t = await lobby(2, 2); await startTable(t);
    for (const p of t.people) connect(t.id, p.guestId, 0);
    const first = await humanRound(t, t.people[0]!); expect(first.game!.view.round).toBe(1); // the other human has not confirmed yet
    const second = await humanRound(t, t.people[1]!); expect(second.game!.view.round).toBe(2);
    const react = await t.service.roomAction(t.people[0]!, t.id, { type: 'REACT', reaction: 'CHEER' }, 9000); expect(react.ok).toBe(true);
  });
  it('bots never host, vote, get removed by vote, or end the match', async () => {
    const t = await lobby(1, 3); await startTable(t); connect(t.id, t.people[0]!.guestId, 0);
    const end = await t.service.roomAction(t.people[0]!, t.id, { type: 'PROPOSE_END' }, 10);
    expect(end.ok && end.value.lifecycle).toBe('CLOSED'); // the one human is the whole electorate: they decide; the three bots have no vote either way
    const t2 = await lobby(2, 2); await startTable(t2); connect(t2.id, t2.people[0]!.guestId, 0); connect(t2.id, t2.people[1]!.guestId, 0);
    const endTwo = await t2.service.roomAction(t2.people[0]!, t2.id, { type: 'PROPOSE_END' }, 5);
    expect(endTwo.ok && endTwo.value.lifecycle).toBe('ACTIVE'); expect(endTwo.ok && endTwo.value.vote?.needed).toBe(2); // 2 humans: both must agree; 2 bots add nothing
    await t2.service.roomAction(t2.people[0]!, t2.id, { type: 'CANCEL_VOTE' }, 6);
    const refuse = await t2.service.roomAction(t2.people[0]!, t2.id, { type: 'PROPOSE_REMOVE', target: 'player-3' }, 10); expect(refuse.ok).toBe(false);
    await t2.service.roomAction(t2.people[0]!, t2.id, { type: 'LEAVE' }, 20);
    const view = await t2.service.read(t2.people[1]!, t2.id, 30);
    expect(view.ok && view.value.isHost).toBe(true); // host moved to the other HUMAN, never a bot
  });
  it('E: suspended tables do not move; resuming lets the bot continue', async () => {
    const t = await lobby(1, 1); await startTable(t);
    await humanRound(t, t.people[0]!);
    // safe point: resolve whatever is open, then suspend
    const sus = await t.service.roomAction(t.people[0]!, t.id, { type: 'SUSPEND' }, 5);
    expect(sus.ok && sus.value.lifecycle).toBe('SUSPENDED');
    const before = (await t.repository.find(t.id))!.game!.version;
    await t.service.read(t.people[0]!, t.id, 50); await t.service.read(t.people[0]!, t.id, 90);
    expect((await t.repository.find(t.id))!.game!.version).toBe(before);
    const res = await t.service.roomAction(t.people[0]!, t.id, { type: 'RESUME' }, 100); expect(res.ok && res.value.lifecycle).toBe('ACTIVE');
    const v = await humanRound(t, t.people[0]!, 101); expect(v.game!.view.round).toBeGreaterThanOrEqual(3);
  });
  it('D: bot seats persist (restart = new service over the same repository), no duplicate bot, no human replaced', async () => {
    const t = await lobby(1, 2); await startTable(t); await humanRound(t, t.people[0]!);
    const restarted = new AlphaGameService(t.repository);
    const v = await restarted.read(t.people[0]!, t.id, 5000); if (!v.ok) throw new Error('read');
    expect(v.value.seats.map(s => s.bot)).toEqual([false, true, true]);
    const room = (await t.repository.find(t.id))!;
    expect(room.seats.filter(s => s.bot)).toHaveLength(2);
    expect(room.game!.players.filter(p => p.playerId !== 'player-1').every(p => p.ready)).toBe(true); // a restarted server still has the bots ready/replanned
  });
});

describe('F: a bot takes part in a combat with no manual input', () => {
  it('a human attacks the bot\'s Pátria; the bot plans, confirms planning and the conflicts phase by itself, and the engine resolves the battle', async () => {
    const { applyAlphaCommand, hexDistance } = await import('@aoh/game-engine');
    const { confirmBotSeat, planBotSeat } = await import('../apps/server/src/alpha-bot.js');
    let game = beginAlphaPlanning(createAlphaGame({ gameId: randomUUID(), seed: 5, preset: 'QUICK', players: [{ id: 'p1', name: 'Humano', civilization: 'aurelia' }, { id: 'p2', name: 'Bot 1', civilization: 'valgard' }] }));
    for (const p of game.players) { p.ambitionsChosen = true; p.contacts = game.players.map(o => o.playerId).filter(id => id !== p.playerId); }
    const target = game.units.find(u => u.ownerId === 'p2')!;
    const land = game.core.map.find(t => hexDistance(t, game.core.map.find(x => x.id === target.hexId)!) === 1 && ['PLAINS', 'FOREST', 'HILLS'].includes(t.terrain))!;
    game.units.push({ id: 'p1-inf', ownerId: 'p1' as never, kind: 'INFANTRY', hexId: land.id, recruitedRound: 1 });
    game.players[0]!.knownHexIds = [...new Set([...game.players[0]!.knownHexIds, land.id, target.hexId])].sort() as never;
    const step = (cmd: Record<string, unknown>) => { const r = applyAlphaCommand(game, 'p1' as never, { ...cmd, expectedVersion: game.version }); if (!r.ok) throw new Error(r.error.message); game = r.value; };
    step({ type: 'DECLARE_WAR', targetId: 'p2' });
    step({ type: 'QUEUE_ORDER', order: { id: 'strike', type: 'ATTACK', unitIds: ['p1-inf'], target: target.hexId, posture: 'ASSAULT' } });
    const round = game.core.round;
    for (let i = 0; i < 8 && game.core.round === round && game.core.status === 'ACTIVE'; i++) {
      for (const id of ['p1', 'p2']) {
        if (game.players.find(p => p.playerId === id)!.ready) continue;
        if (id === 'p2') { if (game.phase === 'PLANNING') game = planBotSeat('arena-room', game, 'p2' as never, 'warrior', 7).game; const done = confirmBotSeat('arena-room', game, 'p2' as never); expect(done.ok).toBe(true); game = done.game; }
        else step({ type: 'READY' });
      }
    }
    expect(game.core.round).toBe(round + 1);
    expect(game.battles.length).toBeGreaterThan(0);
    expect(game.battles[0]).toMatchObject({ attackerId: 'p1', defenderId: 'p2' });
  });
});
