import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaStateSchema } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { connectAlphaContext, muteTour } from './alpha-fixture.js';

// Evidence of the initial Pátria distribution: the Mesa at the start for 2, 3, 4 and 6 seats (every Pátria is public, the frontier stays face down).
const origin = 'http://127.0.0.1:3107', evidence = 'docs/evidence/v51b-home-distribution';

for (const count of [2, 3, 4, 6]) test(`${count} seats: the Pátrias are spread over the Mesa`, async ({ browser }) => {
  await mkdir(evidence, { recursive: true });
  const state = beginAlphaPlanning(createAlphaGame({ gameId: `7a1b5c9a-3d2e-4f8a-9b7c-1a2b3c4d70${count}0`, seed: 23, preset: 'QUICK', players: Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `Jogador ${i + 1}` })) }));
  state.players.forEach(player => { player.pendingChoices = []; });
  const repository = new InMemoryAlphaRepository(), sessions = new GuestSessions('home-distribution-secret-'.repeat(3)), guests = state.players.map(() => sessions.issue(Date.now()));
  const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
  await repository.create(AlphaRoomSchema.parse({ id: state.gameId, version: 0, contentVersion: 'v1.2', name: 'Mesa semeada', joinCode: 'abcdefghijklmnopqrstuv', hostGuestId: guests[0]!.principal.guestId, preset: 'QUICK', seed: 23, seatLimit: count, planningSeconds: 0, actionsPerRound: 5, worldPreset: 'MIXED', revealMap: false, deadline: null,
    seats: state.players.map((p, i) => ({ guestId: guests[i]!.principal.guestId, playerId: p.playerId, name: `Jogador ${i + 1}`, civilization: p.civilization, figureId: p.leader?.leaderId ?? null, ready: true })), game: AlphaStateSchema.parse(state) }));
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await connectAlphaContext(context, http); await muteTour(context);
  await context.addCookies([{ name: 'aoh_alpha_session', value: guests[0]!.token, url: origin, httpOnly: true, sameSite: 'Strict' }]);
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  await page.goto(`/alpha?game=${state.gameId}`);
  await expect(page.locator('.world-map')).toBeVisible();
  const later = page.getByRole('button', { name: /Ver o mapa primeiro/ }); if (await later.isVisible().catch(() => false)) await later.click();
  await expect(page.locator('.seat-plate')).toHaveCount(count);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${evidence}/mesa-${count}p.png` });
});
