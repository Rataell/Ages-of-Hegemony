import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, CIVILIZATIONS, type MatchReportV1 } from '@aoh/game-domain';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService, type AlphaRoomView } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { ReportingAlphaRepository } from '../apps/server/src/alpha-report.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';

const origin = 'https://full-match.example.test';

async function completeHttpMatch(playerCount: 2 | 4 | 6, pace: 'STANDARD' | 'ACCELERATED' = 'STANDARD') {
  const repository = new ReportingAlphaRepository(new InMemoryAlphaRepository(), 'rc5-test');   // the production wiring: the report is stored when the match finishes
  const http = new AlphaHttp(new AlphaGameService(repository), new GuestSessions('full-match-secret-'.repeat(4)), origin, true);
  let now = 1_000;
  const call = async (body: unknown, cookie = '') => {
    now += 1_000;
    const response = await http.handle(new Request(`${origin}/api/alpha`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie }, body: JSON.stringify(body),
    }), now);
    const payload = await response.json() as { ok: boolean; value?: AlphaRoomView; error?: { code: string; message: string } };
    if (!payload.ok || !payload.value) throw new Error(`${response.status} ${payload.error?.code}: ${payload.error?.message}`);
    return { view: payload.value, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? cookie };
  };
  const read = async (gameId: string, cookie: string) => {
    now += 1_000;
    const response = await http.handle(new Request(`${origin}/api/alpha?gameId=${gameId}`, { headers: { Cookie: cookie } }), now);
    const payload = await response.json() as { ok: boolean; value?: AlphaRoomView; error?: { code: string; message: string } };
    if (!payload.ok || !payload.value) throw new Error(`${response.status} ${payload.error?.code}: ${payload.error?.message}`);
    return payload.value;
  };

  const created = await call({ operation: 'create', payload: { name: `Mesa ${playerCount}`, displayName: 'P1', preset: 'QUICK', seatLimit: playerCount, seed: 700 + playerCount, planningSeconds: 0, ...(pace === 'ACCELERATED' ? { pace } : {}), actionsPerRound: 5 } });
  const cookies = [created.cookie];
  let current = created.view;
  for (let index = 1; index < playerCount; index++) {
    const joined = await call({ operation: 'join', code: current.joinCode, displayName: `P${index + 1}` });
    cookies.push(joined.cookie); current = joined.view;
  }
  for (let index = 0; index < playerCount; index++) {
    current = (await call({ operation: 'lobby', gameId: current.id, payload: { type: 'CHOOSE_CIVILIZATION', expectedVersion: current.version, civilization: CIVILIZATIONS[index]!.id } }, cookies[index])).view;
    current = (await call({ operation: 'lobby', gameId: current.id, payload: { type: 'LOBBY_READY', expectedVersion: current.version, ready: true } }, cookies[index])).view;
  }
  current = (await call({ operation: 'lobby', gameId: current.id, payload: { type: 'START', expectedVersion: current.version } }, cookies[0])).view;

  for (let round = 1; round <= 21; round++) {
    for (let index = 0; index < playerCount; index++) {
      let view = await read(current.id, cookies[index]!);
      if (!view.game!.self.ambitionsChosen) await call({ operation: 'command', gameId: current.id, payload: { type: 'CHOOSE_AMBITIONS', expectedVersion: view.game!.version, cardIds: view.game!.self.ambitions.slice(0, 2) } }, cookies[index]);
      view = await read(current.id, cookies[index]!);
      // A city a Bando drove into Revolta only accepts Governar (canon §10): the bot governs it instead of producing.
      const revolt = view.game!.cityStates.find(city => city.cityId === `capital-${index + 1}`)?.moodBand === 'REVOLT';
      await call({ operation: 'command', gameId: current.id, payload: { type: 'URBAN_ACTION', expectedVersion: view.game!.version, cityId: `capital-${index + 1}`, action: revolt ? 'CIVIC_ACTION' : 'PRODUCE' } }, cookies[index]);
    }
    for (let index = 0; index < playerCount; index++) {
      const view = await read(current.id, cookies[index]!);
      current = (await call({ operation: 'command', gameId: current.id, payload: { type: 'READY', expectedVersion: view.game!.version } }, cookies[index])).view;
    }
    // The last round of an Era rests in the Era turn (canon §22): everyone confirms it too.
    if ((await repository.find(current.id))!.game!.phase === 'ERA_TURN') {
      for (let index = 0; index < playerCount; index++) {
        const view = await read(current.id, cookies[index]!);
        current = (await call({ operation: 'command', gameId: current.id, payload: { type: 'READY', expectedVersion: view.game!.version } }, cookies[index])).view;
      }
    }
    const aggregate = (await repository.find(current.id))!.game!;
    expect(aggregate.players.every(player => player.plannedActions.length === 0)).toBe(true);
    expect(aggregate.core.round).toBe(Math.min(round + 1, 21));
  }

  const aggregate = (await repository.find(current.id))!.game!;
  expect(aggregate.core.status).toBe('FINISHED');
  expect(aggregate.core.round).toBe(21);
  expect(aggregate.winner).not.toBeNull();
  expect(aggregate.roundReports).toHaveLength(playerCount * 21);
  expect(AlphaStateSchema.safeParse(aggregate).success).toBe(true);
  expect(aggregate.rules.pace).toBe(pace);
  // The Crônica da Partida of a real, finished match: every seat reads the stored report over HTTP; it carries the pace, the eight resources and nothing private.
  for (const cookie of cookies) {
    now += 1_000;
    const response = await http.handle(new Request(`${origin}/api/alpha?gameId=${current.id}&report=1`, { headers: { Cookie: cookie } }), now);
    const payload = await response.json() as { ok: boolean; value?: MatchReportV1 };
    expect(response.status).toBe(200);
    expect(payload.value!.match).toMatchObject({ pace, roundsPlayed: 21, players: playerCount });
    expect(Object.keys(payload.value!.economy.perSeat[0]!.stock).sort()).toEqual(['culture', 'food', 'influence', 'knowledge', 'metal', 'stone', 'wealth', 'wood']);
    expect(payload.value!.seats.every(seat => seat.kind === 'HUMAN')).toBe(true);
    expect(JSON.stringify(payload.value)).not.toMatch(/joinCode|guestId|privateRng/);
  }
  expect((await repository.find(current.id))!.report).not.toBeNull();
}

describe('complete matches through the HTTP boundary', () => {
  it.each([2, 4, 6] as const)('finishes a deterministic QUICK match with %i players', async playerCount => {
    await completeHttpMatch(playerCount);
  }, 30_000);
  it('finishes an ACCELERATED short match over HTTP and serves its Crônica (pace identified)', async () => {
    await completeHttpMatch(2, 'ACCELERATED');
  }, 30_000);
});
