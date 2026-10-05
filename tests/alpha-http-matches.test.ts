import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, CIVILIZATIONS } from '@aoh/game-domain';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService, type AlphaRoomView } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';

const origin = 'https://full-match.example.test';

async function completeHttpMatch(playerCount: 2 | 4 | 6) {
  const repository = new InMemoryAlphaRepository();
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

  const created = await call({ operation: 'create', payload: { name: `Mesa ${playerCount}`, displayName: 'P1', preset: 'QUICK', seatLimit: playerCount, seed: 700 + playerCount, planningSeconds: 0, actionsPerRound: 5 } });
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
}

describe('complete matches through the HTTP boundary', () => {
  it.each([2, 4, 6] as const)('finishes a deterministic QUICK match with %i players', async playerCount => {
    await completeHttpMatch(playerCount);
  }, 30_000);
});
