import { expect, test, type Page } from '@playwright/test';
import { AlphaStateSchema, type AlphaState } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { connectAlphaContext, muteTour, cloudNode, confirmFicha } from './alpha-fixture.js';

// V1.2 · urban planning and the emergency recovery from Revolta, through the real HTTP boundary with SEEDED states (same harness as interaction-v2).
// E-1: in Revolta with nothing to pay Governar with, the free EMERGENCY_GOVERN leads the cloud. F-14: the activations left of a city come from the engine
// (Estável: two; Abalada: one), and the cloud does not offer what the engine would refuse.
const origin = 'http://127.0.0.1:3107';
let counter = 0;
const p1 = 'p1' as never;
function base(): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: `7a1b5c9a-3d2e-4f8a-9b7c-1a2b3c4d6f${String(40 + counter++).padStart(2, '0')}`, seed: 23, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana', civilization: 'aurelia' }, { id: 'p2', name: 'Beto', civilization: 'valgard' }] }));
  state.players.forEach(player => { player.pendingChoices = player.pendingChoices.filter(choice => choice.source !== 'PULSE'); });
  return state;
}
async function serve(browser: import('@playwright/test').Browser, state: AlphaState, viewport = { width: 1280, height: 720 }) {
  const repository = new InMemoryAlphaRepository(), sessions = new GuestSessions('v2-interaction-secret-'.repeat(4)), identity = sessions.issue(Date.now()), other = sessions.issue(Date.now());
  const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
  const room = AlphaRoomSchema.parse({ id: state.gameId, version: 0, contentVersion: 'v1.2', name: 'Mesa semeada', joinCode: 'abcdefghijklmnopqrstuv', hostGuestId: identity.principal.guestId, preset: 'QUICK', seed: 23, seatLimit: 2, planningSeconds: 0, actionsPerRound: 5, worldPreset: 'MIXED', revealMap: false, deadline: null,
    seats: state.players.map((p, i) => ({ guestId: (i === 0 ? identity : other).principal.guestId, playerId: p.playerId, name: i === 0 ? 'Ana' : 'Beto', civilization: p.civilization, figureId: p.leader?.leaderId ?? null, ready: true })), game: AlphaStateSchema.parse(state) });
  await repository.create(room);
  const context = await browser.newContext({ viewport });
  await connectAlphaContext(context, http); await muteTour(context);
  await context.addCookies([{ name: 'aoh_alpha_session', value: identity.token, url: origin, httpOnly: true, sameSite: 'Strict' }]);
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  await page.goto(`/alpha?game=${room.id}`);
  await expect(page.locator('.world-map')).toBeVisible();
  const later = page.getByRole('button', { name: /Ver o mapa primeiro/ }); if (await later.isVisible().catch(() => false)) await later.click();
  return { page, repository, room };
}
const noGlobalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight && document.documentElement.scrollWidth <= window.innerWidth && getComputedStyle(document.body).overflow === 'hidden' && [document.documentElement, document.body, ...Array.from(document.querySelectorAll('.alpha-mesa, .world-column, .map-stage'))].every(el => el.scrollTop === 0 && el.scrollLeft === 0));
const city = (page: Page) => page.locator('g.hex.owner-1:has(.art-city)').first();


function seeded(edit: (state: AlphaState, meta: AlphaState['cities'][number]) => void): AlphaState {
  const state = base();
  const meta = state.cities.find(c => c.currentOwnerId === p1)!;
  edit(state, meta);
  AlphaStateSchema.parse(state);
  return state;
}
const planned = async (repository: InMemoryAlphaRepository, id: string) => (await repository.find(id))!.game!.players[0]!.plannedActions;

test('Revolta without Cultura or Riqueza: the free emergency recovery leads the cloud, is planned with one click and cannot be planned twice', async ({ browser }) => {
  const state = seeded((game, meta) => {
    meta.mood = 1;
    Object.assign(game.players[0]!.resources, { culture: 0, wealth: 0 });
    game.core.players[0]!.civilization.government = 'REPUBLIC';             // no free first level of Governar
  });
  const { page, repository, room } = await serve(browser, state);
  await city(page).click({ force: true });
  await expect(page.locator('.ctx-node.tone-dominant')).toHaveAttribute('data-node', 'EMERGENCY_GOVERN');
  await expect(cloudNode(page, 'PRODUCE')).toHaveAttribute('aria-disabled', 'true');
  await expect(cloudNode(page, 'PRODUCE')).toHaveAttribute('title', /Revolta/);
  await cloudNode(page, 'EMERGENCY_GOVERN').click();
  await confirmFicha(page);
  await expect(page.locator('.table-cloud')).toHaveCount(0);
  await expect.poll(async () => (await planned(repository, room.id)).some(a => a.type === 'URBAN_ACTION' && a.action === 'EMERGENCY_GOVERN')).toBe(true);
  // The city has its only activation planned: the cloud now offers to swap the plan, not a second action.
  await city(page).click({ force: true });
  await expect(page.locator('.ctx-node.tone-dominant')).toHaveAttribute('data-node', 'cancel');
  expect(await noGlobalScroll(page)).toBe(true);
});

test('a city that already used the recovery in this episode is not offered it again', async ({ browser }) => {
  const state = seeded((game, meta) => {
    meta.mood = 1; meta.revoltEmergencyRound = 1;
    Object.assign(game.players[0]!.resources, { culture: 0, wealth: 0 });
    game.core.players[0]!.civilization.government = 'REPUBLIC';
  });
  const { page } = await serve(browser, state);
  await city(page).click({ force: true });
  await expect(cloudNode(page, 'EMERGENCY_GOVERN')).toHaveCount(0);
  await expect(cloudNode(page, 'PROMOTE_MOOD')).toBeVisible();
});

test('Estável city: two activations; the second action is still offered after the first is planned', async ({ browser }) => {
  const state = seeded((game, meta) => { meta.mood = 4; Object.assign(game.players[0]!.resources, { wood: 12, stone: 12, food: 12 }); });
  const { page, repository, room } = await serve(browser, state);
  await city(page).click({ force: true });
  await cloudNode(page, 'PRODUCE').click();
  await confirmFicha(page);
  await expect.poll(async () => (await planned(repository, room.id)).filter(a => a.type === 'URBAN_ACTION').length).toBe(1);
  await city(page).click({ force: true });
  await expect(cloudNode(page, 'BUILD')).not.toHaveAttribute('aria-disabled', 'true');   // the engine still has one activation for this city
});

test('Abalada city: one activation; after Produzir is planned the cloud says the city already has its action', async ({ browser }) => {
  const state = seeded((game, meta) => { meta.mood = 3; Object.assign(game.players[0]!.resources, { wood: 12, stone: 12, food: 12 }); });
  const { page, repository, room } = await serve(browser, state);
  await city(page).click({ force: true });
  await cloudNode(page, 'PRODUCE').click();
  await confirmFicha(page);
  await expect.poll(async () => (await planned(repository, room.id)).filter(a => a.type === 'URBAN_ACTION').length).toBe(1);
  await city(page).click({ force: true });
  await expect(cloudNode(page, 'cancel')).toBeVisible();                                   // the plan can be swapped
  await expect(cloudNode(page, 'BUILD')).toHaveAttribute('aria-disabled', 'true');
  await expect(cloudNode(page, 'BUILD')).toHaveAttribute('title', /já possui sua ação/);
});
