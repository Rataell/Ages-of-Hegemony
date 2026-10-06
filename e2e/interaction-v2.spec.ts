import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaStateSchema, type AlphaState } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, hexNeighbors, spawnThreat } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { connectAlphaContext, muteTour, cloudNode, touchPiece } from './alpha-fixture.js';

// Interaction Model V2 · TABLE FIRST. SEEDED states served through the real HTTP boundary: what matters here is where each decision is born
// (on the touched piece), that the map answers spatial decisions, and that the page itself never scrolls.
const origin = 'http://127.0.0.1:3107', evidence = 'docs/evidence/v51b-interaction-v2';
let counter = 0;
const p1 = 'p1' as never;

function base(): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: `7a1b5c9a-3d2e-4f8a-9b7c-1a2b3c4d6f${String(10 + counter++).padStart(2, '0')}`, seed: 23, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana', civilization: 'aurelia' }, { id: 'p2', name: 'Beto', civilization: 'valgard' }] }));
  state.players.forEach(player => { player.pendingChoices = player.pendingChoices.filter(choice => choice.source !== 'PULSE'); });
  return state;
}
const capital = (state: AlphaState) => state.core.players[0]!.civilization.cities[0]!;
const neighbour = (state: AlphaState, hexId: string, skip = 0) => {
  const tile = state.core.map.find(t => t.id === hexId)!;
  return hexNeighbors(tile).map(point => state.core.map.find(t => t.q === point.q && t.r === point.r)).filter(t => t && !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain))[skip]!;
};

async function serve(browser: import('@playwright/test').Browser, state: AlphaState, viewport = { width: 1280, height: 720 }) {
  const repository = new InMemoryAlphaRepository(), sessions = new GuestSessions('v2-interaction-secret-'.repeat(4)), identity = sessions.issue(Date.now()), other = sessions.issue(Date.now());
  const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
  const room = AlphaRoomSchema.parse({ id: state.gameId, version: 0, name: 'Mesa semeada', joinCode: 'abcdefghijklmnopqrstuv', hostGuestId: identity.principal.guestId, preset: 'QUICK', seed: 23, seatLimit: 2, planningSeconds: 0, actionsPerRound: 5, worldPreset: 'MIXED', revealMap: false, deadline: null,
    seats: state.players.map((p, i) => ({ guestId: (i === 0 ? identity : other).principal.guestId, playerId: p.playerId, name: i === 0 ? 'Ana' : 'Beto', civilization: p.civilization, ready: true })), game: AlphaStateSchema.parse(state) });
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
/** Screenshots wait for the 150 ms cloud transition to settle. */
const shot = async (page: Page, name: string) => { await page.waitForTimeout(350); await page.screenshot({ path: `${evidence}/${name}.png` }); };
const noGlobalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight && document.documentElement.scrollWidth <= window.innerWidth && getComputedStyle(document.body).overflow === 'hidden' && [document.documentElement, document.body, ...Array.from(document.querySelectorAll('.alpha-mesa, .world-column, .map-stage'))].every(el => el.scrollTop === 0 && el.scrollLeft === 0));
const city = (page: Page) => page.locator('g.hex.owner-1:has(.art-city)').first();

test('city: the cloud is born on the city, morphs in place and acts without a side panel', async ({ browser }) => {
  await mkdir(evidence, { recursive: true });
  const state = base();
  const meta = state.cities.find(c => c.currentOwnerId === p1)!; meta.mood = 1;
  const { page, repository, room } = await serve(browser, state);
  await expect(page.locator('.alpha-inspector')).toHaveCount(0);
  await city(page).click({ force: true });
  const cloud = page.locator('.table-cloud');
  await expect(cloud.locator('.ctx-plate')).toContainText('Celeiro Áureo');
  // Revolta: GOVERNAR is the dominant node (ordered visually, nothing hidden).
  await expect(page.locator('.ctx-node.tone-dominant')).toHaveAttribute('data-node', 'PROMOTE_MOOD');
  for (const id of ['PRODUCE', 'BUILD', 'RECRUIT', 'more']) await expect(cloudNode(page, id)).toBeVisible();
  expect(await page.locator('.ctx-node').count()).toBeLessThanOrEqual(5);
  // No Inspector, no camera move to make room.
  await expect(page.locator('.alpha-inspector')).toHaveCount(0);
  await shot(page, 'A-city-cloud');
  // Morph: Construir turns the SAME surface into the build level; Esc goes back one level, Esc again closes.
  await cloudNode(page, 'BUILD').click();
  await expect(cloud.locator('.ctx-plate')).toContainText('Construir');
  await expect(cloud.locator('.ctx-back')).toBeVisible();
  await shot(page, 'A2-city-build-morph');
  await page.keyboard.press('Escape');
  await expect(cloudNode(page, 'PRODUCE')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(cloud).toHaveCount(0);
  // In Revolta only Governar is open: Produzir stays visible but says why it is off (nothing is hidden).
  await city(page).click({ force: true });
  await expect(cloudNode(page, 'PRODUCE')).toHaveAttribute('aria-disabled', 'true');
  await expect(cloudNode(page, 'PRODUCE')).toHaveAttribute('title', /Revolta/);
  // A simple action is local: Governar plans the action, the cloud folds away and the result is on the map.
  await cloudNode(page, 'PROMOTE_MOOD').click();
  await expect(cloud).toHaveCount(0);
  await expect(page.locator('.art-mark.tone-plan')).toContainText('Governar');
  await expect.poll(async () => (await repository.find(room.id))!.game!.players[0]!.plannedActions.some(a => a.type === 'URBAN_ACTION' && a.action === 'PROMOTE_MOOD')).toBe(true);
  // Touching it again offers to swap the plan instead of a second dominant action.
  await city(page).click({ force: true });
  await expect(page.locator('.ctx-node.tone-dominant')).toHaveAttribute('data-node', 'cancel');
  expect(await noGlobalScroll(page)).toBe(true);
});

test('Pioneiro: Explorar, Mover and Fundar answer on the map; clicking elsewhere closes, another piece swaps the context', async ({ browser }) => {
  const state = base();
  const near = neighbour(state, capital(state).hexId);
  const { page, repository, room } = await serve(browser, state);
  await touchPiece(page, 'g.hex.owner-1:has(.art-city)');
  const plate = page.locator('.table-cloud .ctx-plate');
  await expect(plate).toContainText('PIONEIRO');
  for (const id of ['explore', 'move', 'found', 'more']) await expect(cloudNode(page, id)).toBeVisible();
  await shot(page, 'B-pioneer-cloud');
  // Mover: the cloud folds into one pill and the MAP lights the legal destinations.
  await cloudNode(page, 'move').click();
  await expect(page.locator('.table-cloud .ctx-node')).toHaveCount(0);
  await expect(page.locator('.ctx-chip')).toContainText('Mover');
  expect(await page.locator('svg.world-map g.hex.target-move').count()).toBeGreaterThan(0);
  await shot(page, 'D-move-mode');
  // Esc leaves target mode and the cloud is back on the piece.
  await page.keyboard.press('Escape');
  await expect(cloudNode(page, 'move')).toBeVisible();
  await cloudNode(page, 'move').click();
  await page.locator(`svg.world-map g.hex.target-move[aria-label$=" ${near.id}"], svg.world-map g.hex.target-move[aria-label$=" ${near.id}, trabalhado"]`).first().click();
  await expect(page.locator('.table-cloud')).toHaveCount(0);
  await expect.poll(async () => (await repository.find(room.id))!.game!.players[0]!.orders.length).toBe(1);
  await expect(page.locator('.art-mark.tone-plan')).toContainText('Mover');
  // A piece that already has an order offers to swap it and says why the rest is off.
  await touchPiece(page, 'g.hex.owner-1:has(.art-city)');
  await expect(page.locator('.ctx-node.tone-dominant')).toHaveAttribute('data-node', 'cancel');
  // Clicking the bare table closes the cloud.
  await page.locator('svg.world-map').click({ position: { x: 4, y: 200 } });
  await expect(page.locator('.table-cloud')).toHaveCount(0);
  expect(await noGlobalScroll(page)).toBe(true);
});

test('Pioneiro next to a closed Region: Explorar is dominant and the Region lights up on the map', async ({ browser }) => {
  const state = base();
  // Walk the second Pioneiro to the edge of the Pátria, beside a face-down Region (a legal hex of its own region).
  const own = state.regions.find(r => r.hexIds.includes(capital(state).hexId))!;
  const closed = state.regions.find(r => r.revealedBy.length === 0 && r.hexIds.some(id => hexNeighbors(state.core.map.find(t => t.id === id)!).some(point => own.hexIds.includes(`${point.q},${point.r}` as never))))!;
  const edge = own.hexIds.find(id => hexNeighbors(state.core.map.find(t => t.id === id)!).some(point => closed.hexIds.includes(`${point.q},${point.r}` as never)))!;
  const scout = state.units.find(u => u.ownerId === p1 && u.kind === 'PIONEER')!;
  scout.hexId = edge as never;
  const { page } = await serve(browser, state);
  await touchPiece(page, `g.hex[aria-label$=" ${edge}"], g.hex[aria-label$=" ${edge}, trabalhado"]`);
  await expect(page.locator('.ctx-node.tone-dominant')).toHaveAttribute('data-node', 'explore');
  await cloudNode(page, 'explore').click();
  await expect(page.locator('.ctx-chip')).toContainText('Explorar');
  expect(await page.locator('svg.world-map g.hex.target-explore').count()).toBeGreaterThanOrEqual(7);
  expect(await page.locator('svg.world-map .region-back.is-target').count()).toBeGreaterThanOrEqual(1);
  await shot(page, 'E-explore-mode');
});

test('military stack: Mover, Atacar and Postura live on the stack; Atacar lights the adjacent target', async ({ browser }) => {
  const state = base();
  const cap = capital(state), spot = neighbour(state, cap.hexId);
  state.units.push(...['INFANTRY', 'INFANTRY', 'GUARD'].map((kind, i) => ({ id: `v2-army-${i}`, ownerId: p1, kind: kind as never, hexId: spot.id as never, recruitedRound: 1 })));
  // The enemy stands on a hex the player can see (inside its own open Region), next to the stack.
  const home = state.regions.find(r => r.hexIds.includes(cap.hexId))!;
  const foe = hexNeighbors(state.core.map.find(t => t.id === spot.id)!).map(point => state.core.map.find(t => t.q === point.q && t.r === point.r)).find(t => t && t.id !== cap.hexId && home.hexIds.includes(t.id) && !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain))!;
  state.units.push({ id: 'v2-foe', ownerId: 'p2' as never, kind: 'INFANTRY' as never, hexId: foe.id as never, recruitedRound: 1 });
  state.wars = [['p1' as never, 'p2' as never]];
  const { page } = await serve(browser, state);
  await touchPiece(page, `g.hex[aria-label$=" ${spot.id}"], g.hex[aria-label$=" ${spot.id}, trabalhado"]`);
  await expect(page.locator('.table-cloud .ctx-plate')).toContainText('MILITARES · 3');
  for (const id of ['move', 'attack', 'posture', 'more']) await expect(cloudNode(page, id)).toBeVisible();
  await shot(page, 'C-army-cloud');
  await cloudNode(page, 'posture').click();
  await expect(page.locator('.ctx-node.is-active')).toContainText('Assalto');
  await page.locator('.ctx-node', { hasText: 'Manter' }).click();
  await expect(cloudNode(page, 'posture')).toContainText('Manter');
  await cloudNode(page, 'attack').click();
  await expect(page.locator(`svg.world-map g.hex.target-attack`)).toHaveCount(1);
  await shot(page, 'D2-attack-mode');
  expect(await noGlobalScroll(page)).toBe(true);
});

test('empty territory: Reivindicar and Melhorar are nodes of the hex, never a list in the Inspector', async ({ browser }) => {
  const state = base();
  const target = neighbour(state, capital(state).hexId);
  const { page } = await serve(browser, state);
  await page.locator(`svg.world-map g.hex[aria-label$=" ${target.id}"]`).first().click();
  await expect(page.locator('.table-cloud .ctx-plate')).toContainText(target.id);
  await expect(page.locator('.alpha-inspector')).toHaveCount(0);
  await shot(page, 'H-hex-cloud');
});

test('strategic surfaces are glass over the Mesa: Teia keeps its own pan/zoom and focus, the page never scrolls', async ({ browser }) => {
  const { page } = await serve(browser, base());
  await page.locator('.alpha-strip-civ').click();
  const surface = page.locator('.strategic-surface.alpha-civ');
  await expect(surface).toBeVisible();
  // Glass: translucent background with blur, the map still behind.
  const look = await surface.evaluate(el => { const c = getComputedStyle(el); return { blur: c.backdropFilter || (c as unknown as { webkitBackdropFilter: string }).webkitBackdropFilter, bg: c.backgroundColor }; });
  expect(look.blur).toContain('blur');
  expect(look.bg).toMatch(/rgba|color\(/);
  // Five sockets always in view next to the Teia.
  await expect(surface.locator('.alpha-big-sockets .alpha-socket')).toHaveCount(5);
  // Teia: own pan/zoom, no vertical page scroll; selecting an advancement keeps its neighbours lit and dims the rest.
  const web = surface.locator('.pan-zoom');
  await expect(web).toBeVisible();
  const before = await web.locator('.pan-zoom-layer').evaluate(el => getComputedStyle(el).transform);
  await web.getByRole('button', { name: 'Aumentar zoom' }).click();
  expect(await web.locator('.pan-zoom-layer').evaluate(el => getComputedStyle(el).transform)).not.toBe(before);
  await web.locator('.alpha-node.is-reachable').first().click();
  await expect(web.locator('.alpha-node.is-selected')).toHaveCount(1);
  expect(await web.locator('.is-dim').count()).toBeGreaterThan(0);
  await shot(page, 'F-teia-glass-focus');
  // Governo: the one in force first, closed ones folded away.
  await surface.getByRole('tab', { name: 'Identidade e Governo' }).click();
  // One page at a time: Governo is a segment of its own; the closed governments are one compact chip until asked.
  await surface.locator('.alpha-civ-identity').getByRole('tab', { name: 'Governo' }).click();
  await expect(surface.locator('.alpha-gov-closed')).toBeVisible();
  await shot(page, 'G-tabuleiro-glass');
  expect(await noGlobalScroll(page)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(surface).toHaveCount(0);
  await page.getByRole('button', { name: 'Livro', exact: true }).click();
  expect(await page.locator('.strategic-surface.alpha-livro').evaluate(el => getComputedStyle(el).backdropFilter)).toContain('blur');
  expect(await noGlobalScroll(page)).toBe(true);
});

test('narrow viewport: the cloud stays on the piece, no sidebar comes back, nothing scrolls', async ({ browser }) => {
  const { page } = await serve(browser, base(), { width: 390, height: 844 });
  await touchPiece(page, 'g.hex.owner-1:has(.art-city)');
  await expect(page.locator('.table-cloud .ctx-plate')).toBeVisible();
  await expect(page.locator('.alpha-inspector')).toHaveCount(0);
  await page.waitForTimeout(400);
  const box = (await page.locator('.ctx-node').first().boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(box.height).toBeGreaterThanOrEqual(40);
  await shot(page, 'B2-pioneer-cloud-390');
  expect(await noGlobalScroll(page)).toBe(true);
});

// ---- the rest of the Mesa: threats, independent peoples, foreign cities, the work of a city ----
const hexOf = (page: Page, id: string) => page.locator(`svg.world-map g.hex[aria-label$=" ${id}"], svg.world-map g.hex[aria-label$=" ${id}, trabalhado"]`).first();
const withArmy = (state: AlphaState, at: string) => state.units.push(...['INFANTRY', 'INFANTRY', 'GUARD'].map((kind, i) => ({ id: `v2-army-${at.replace(/[^0-9a-z]/gi, "n")}-${i}`, ownerId: p1, kind: kind as never, hexId: at as never, recruitedRound: 1 })));

test('threat: the Acampamento shows its state and is attacked from the adjacent stack, no side panel', async ({ browser }) => {
  const state = base();
  const cap = capital(state), camp = neighbour(state, cap.hexId);
  const band = spawnThreat(state, 'CAMP')!; band.hexId = camp.id as never; band.homeHexId = camp.id as never; band.level = 2; band.status = 'CAMPED'; band.fresh = true;
  band.composition = [{ kind: 'INFANTRY', count: 3 }, { kind: 'RANGED', count: 1 }];
  withArmy(state, cap.hexId);
  const { page, repository, room } = await serve(browser, state);
  await hexOf(page, camp.id).click({ force: true });
  await expect(page.locator('.table-cloud .ctx-plate')).toContainText('Acampamento');
  await expect(page.locator('.table-cloud .ctx-note')).toContainText('Recém-surgido');
  await expect(page.locator('.alpha-inspector')).toHaveCount(0);
  await shot(page, 'I-threat-cloud');
  await cloudNode(page, 'attack').click();
  await expect(page.locator('.table-cloud')).toHaveCount(0);
  await expect.poll(async () => (await repository.find(room.id))!.game!.players[0]!.orders.some(o => o.type === 'ATTACK')).toBe(true);
  await expect(page.locator('.art-mark.tone-plan')).toContainText('Ataque');
});

test('independent people: its actions are nodes with a confirmation card, the dominant one follows the attitude', async ({ browser }) => {
  const state = base();
  const spot = neighbour(state, capital(state).hexId);
  const people = state.independents[0]!; people.hexId = spot.id as never; people.attitude = 'FRIENDLY';
  const { page } = await serve(browser, state);
  await hexOf(page, spot.id).click({ force: true });
  const plate = page.locator('.table-cloud .ctx-plate');
  await expect(plate).toContainText('Amistoso');
  await expect(page.locator('.ctx-node.tone-dominant')).toHaveAttribute('data-node', 'TRADE');
  await cloudNode(page, 'TRADE').click();
  await expect(page.locator('.ctx-card .ctx-go')).toBeVisible();
  await shot(page, 'J-people-confirm');
  await page.keyboard.press('Escape');
  await cloudNode(page, 'more').click();
  await expect(page.locator('.ctx-node[data-node="details"]')).toBeVisible();
  await expect(page.locator('.alpha-inspector')).toHaveCount(0);
});

test('foreign city: Atacar needs a stack beside it, at peace the cloud leads to Diplomacia; at war the order is one click', async ({ browser }) => {
  const peace = base();
  const rival = peace.core.players[1]!.civilization.cities[0]!, edge = neighbour(peace, rival.hexId);
  withArmy(peace, edge.id);
  const first = await serve(browser, peace);
  let page = first.page;
  await hexOf(page, rival.hexId).click({ force: true });
  await expect(page.locator('.table-cloud .ctx-plate')).toContainText('em paz');
  await shot(page, 'K-foreign-city-peace');
  await cloudNode(page, 'attack').click();
  await expect(page.locator('.table-cloud .ctx-plate')).toContainText('Em paz');
  await expect(cloudNode(page, 'diplomacy')).toBeVisible();
  const war = base();
  const rival2 = war.core.players[1]!.civilization.cities[0]!, edge2 = neighbour(war, rival2.hexId);
  withArmy(war, edge2.id); war.wars = [['p1' as never, 'p2' as never]];
  const second = await serve(browser, war);
  const { repository, room } = second;
  page = second.page;
  await hexOf(page, rival2.hexId).click({ force: true });
  await expect(page.locator('.ctx-node.tone-dominant')).toHaveAttribute('data-node', 'attack');
  await cloudNode(page, 'attack').click();
  await expect.poll(async () => (await repository.find(room.id))!.game!.players[0]!.orders.some(o => o.type === 'ATTACK')).toBe(true);
});

test('work of a city: Trabalhar turns the map into the chooser, Confirmar sends the hexes', async ({ browser }) => {
  const state = base();
  const cap = capital(state), meta = state.core.players[0]!.civilization.cities[0]!;
  const owned = [neighbour(state, cap.hexId, 0), neighbour(state, cap.hexId, 1)];
  for (const tile of owned) { tile.ownerId = p1; tile.controllerCityId = cap.id as never; }
  void meta;
  const { page, repository, room } = await serve(browser, state);
  await hexOf(page, owned[0]!.id).click({ force: true });
  await cloudNode(page, 'work').click();
  await expect(page.locator('.ctx-chip')).toContainText('Trabalho de');
  await shot(page, 'L-work-mode');
  await hexOf(page, owned[1]!.id).click({ force: true });
  await page.locator('.ctx-chip .ctx-go').click();
  await expect(page.locator('.ctx-chip')).toHaveCount(0);
  await expect.poll(async () => (await repository.find(room.id))!.game!.core.players[0]!.civilization.cities[0]!.workedHexIds.length).toBeGreaterThan(0);
});
