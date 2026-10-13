import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaStateSchema, threatComposition, type AlphaState, type Threat } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, hexNeighbors } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { connectAlphaContext, muteTour, cloudNode, touchPiece, confirmMove } from './alpha-fixture.js';

// V12-UX-04 end to end: THREE different pieces, three different destinations, ONE Order (Ordens 0/5 → 1/5): the draft on the map with the engine's preview, one confirmation,
// persistence across a reload, resolution leg by leg, and the failure of ONE leg that neither cancels the others nor refunds the Order.
const origin = 'http://127.0.0.1:3107', evidence = 'docs/evidence/ux-board-coordinated';
let counter = 0;
const p1 = 'p1' as never;

function situation() {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: `7a1b5c9a-3d2e-4f8a-9b7c-1a2b3c4d72${String(10 + counter++).padStart(2, '0')}`, seed: 23, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana', civilization: 'aurelia' }, { id: 'p2', name: 'Beto', civilization: 'valgard' }] }));
  state.players.forEach(player => { player.pendingChoices = player.pendingChoices.filter(choice => choice.source !== 'PULSE'); player.ambitionsChosen = true; });
  // A straight strip of plains from the capital.
  const byId = new Map(state.core.map.map(t => [t.id as string, t])), cap = state.core.players[0]!.civilization.cities[0]!;
  let best: string[] = [];
  for (let dir = 0; dir < 6; dir++) {
    const ids: string[] = []; let cur = byId.get(cap.hexId as string)!;
    for (let i = 0; i < 8; i++) { const point = hexNeighbors(cur)[dir]!, t = byId.get(`${point.q},${point.r}`); if (!t) break; ids.push(t.id); cur = t; }
    if (ids.length > best.length) best = ids;
  }
  const progress = state.players[0]!;
  for (const id of best) for (const region of state.regions) if (region.hexIds.includes(id as never) && !region.revealedBy.includes(p1)) region.revealedBy.push(p1);
  for (const id of best) {
    const t = byId.get(id)!; t.terrain = 'PLAINS' as never; t.ownerId = null as never; t.features = [] as never;
    if (!progress.knownHexIds.includes(id as never)) progress.knownHexIds.push(id as never);
    state.units = state.units.filter(u => u.hexId !== id); state.threats = state.threats.filter(th => th.hexId !== id); state.independents = state.independents.filter(i => i.hexId !== id);
  }
  const [start, ...line] = best;
  expect(line.length).toBeGreaterThanOrEqual(6);
  state.units = state.units.filter(u => u.ownerId !== p1 || u.kind !== 'PIONEER');
  const piece = (id: string, kind: string, hexId: string) => ({ id, ownerId: p1, kind, hexId, recruitedRound: 1, carrierId: null }) as never;
  state.units.push(piece('t-a', 'INFANTRY', start!), piece('t-b', 'CAVALRY', line[2]!), piece('t-c', 'INFANTRY', line[4]!));
  AlphaStateSchema.parse(state);
  // a: start → line[0]; b: line[2] → line[1]; c: line[4] → line[5]. Three origins, three destinations.
  return { state, start: start!, legs: [{ id: 't-a', from: start!, to: line[0]! }, { id: 't-b', from: line[2]!, to: line[1]! }, { id: 't-c', from: line[4]!, to: line[5]! }] };
}

async function serve(browser: import('@playwright/test').Browser, state: AlphaState, viewport = { width: 1280, height: 720 }) {
  const repository = new InMemoryAlphaRepository(), sessions = new GuestSessions('coordinated-secret-'.repeat(4)), identity = sessions.issue(Date.now()), other = sessions.issue(Date.now());
  const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
  const room = AlphaRoomSchema.parse({ id: state.gameId, version: 0, contentVersion: 'v1.2', name: 'Mover coordenado', joinCode: 'abcdefghijklmnopqrstuv', hostGuestId: identity.principal.guestId, preset: 'QUICK', seed: 23, seatLimit: 2, planningSeconds: 0, actionsPerRound: 5, worldPreset: 'MIXED', revealMap: false, deadline: null,
    seats: state.players.map((p, i) => ({ guestId: (i === 0 ? identity : other).principal.guestId, playerId: p.playerId, name: i === 0 ? 'Ana' : 'Beto', civilization: p.civilization, figureId: p.leader?.leaderId ?? null, ready: true })), game: AlphaStateSchema.parse(state) });
  await repository.create(room);
  const context = await browser.newContext({ viewport });
  await connectAlphaContext(context, http); await muteTour(context);
  await context.addCookies([{ name: 'aoh_alpha_session', value: identity.token, url: origin, httpOnly: true, sameSite: 'Strict' }]);
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  const open = async () => { await page.goto(`/alpha?game=${room.id}`); await expect(page.locator('.world-map')).toBeVisible(); const later = page.getByRole('button', { name: /Ver o mapa primeiro/ }); if (await later.isVisible().catch(() => false)) await later.click(); };
  await open();
  const readyOther = async () => {
    const read = await http.handle(new Request(`${origin}/api/alpha?gameId=${room.id}`, { headers: { Cookie: `aoh_alpha_session=${other.token}` } }));
    const view = (await read.json()) as { value: { game: { version: number } } };
    return http.handle(new Request(`${origin}/api/alpha`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: `aoh_alpha_session=${other.token}` }, body: JSON.stringify({ operation: 'command', gameId: room.id, payload: { type: 'READY', expectedVersion: view.value.game.version } }) }));
  };
  return { page, repository, room, readyOther, open };
}
const hexAt = (page: Page, id: string) => page.locator(`svg.world-map g.hex[data-hex="${id}"]`);
const unitsOf = async (repository: InMemoryAlphaRepository, id: string) => new Map((await repository.find(id))!.game!.units.map(u => [u.id as string, u.hexId as string]));
const shot = async (page: Page, name: string) => { await page.waitForTimeout(350); await page.screenshot({ path: `${evidence}/${name}.png` }); };

/** Draft the three legs on the map: piece, then its destination; the next piece is touched on the map without losing the draft. */
async function draftThree(page: Page, plan: ReturnType<typeof situation>) {
  await touchPiece(page, `g.hex[data-hex="${plan.start}"]`);
  await cloudNode(page, 'move').click();
  const ficha = page.locator('.ctx-ficha');
  await expect(ficha.locator('.ctx-piece')).toHaveCount(1);
  await hexAt(page, plan.legs[0]!.to).click();
  await expect(ficha.locator('.ctx-legs li')).toHaveCount(1);
  for (const [i, leg] of plan.legs.slice(1).entries()) {
    await hexAt(page, leg.from).locator('.art-piece').first().click({ force: true });
    await expect(ficha.locator(`.ctx-piece[data-unit="${leg.id}"]`)).toBeVisible();
    await hexAt(page, leg.to).click();
    await expect(ficha.locator('.ctx-legs li')).toHaveCount(i + 2);
  }
  await expect(ficha.locator('.ctx-ficha-count')).toContainText('3/3');
  for (let i = 0; i < 3; i++) await expect(ficha.locator('.ctx-leg-body').nth(i)).toContainText(/custo \d+\/\d+ · resta \d+/);   // the engine's preview, per leg
  await expect(page.locator('svg.world-map .art-draft-leg')).toHaveCount(3);
  await expect(page.locator('svg.world-map .art-draft-tag')).toHaveCount(3);
  await expect(ficha.locator('.ctx-go')).toBeEnabled();
}
const confirmPlanning = async (page: Page) => {
  await page.locator('.alpha-tray .advance-phase-btn').click();
  const anyway = page.getByRole('button', { name: 'Confirmar mesmo assim' });
  if (await anyway.isVisible({ timeout: 1500 }).catch(() => false)) await anyway.click();
};
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

test('three different pieces, three destinations, ONE Order: preview, confirmation, persistence, resolution', async ({ browser }) => {
  const plan = situation();
  const { page, repository, room, readyOther, open } = await serve(browser, plan.state);
  await draftThree(page, plan);
  await shot(page, 'desktop-three-legs-draft');
  await confirmMove(page);
  // ONE Order carrying the three legs (one Expedição), nothing resolved yet
  await expect.poll(async () => { const orders = (await repository.find(room.id))!.game!.players[0]!.orders; return orders.length === 1 && orders[0]!.type === 'MOVE' && orders[0]!.legs?.length === 3; }).toBe(true);
  expect([...(await unitsOf(repository, room.id)).entries()].filter(([id]) => id.startsWith('t-')).map(([, hex]) => hex).sort()).toEqual([plan.legs[0]!.from, plan.legs[1]!.from, plan.legs[2]!.from].sort());
  await expect(page.locator('.art-mark.tone-plan')).toHaveCount(3);
  // Persistence: a fresh load of the page reads the same Order from the server.
  await open();
  await expect(page.locator('.art-mark.tone-plan')).toHaveCount(3);
  await page.locator('details.alpha-action-queue summary').click();
  await expect(page.locator('details.alpha-action-queue')).toContainText('Movimento coordenado');
  await shot(page, 'desktop-three-legs-planned');
  // Resolution: each leg lands where it was drafted.
  await confirmPlanning(page);
  expect((await readyOther()).status).toBe(200);
  await expect.poll(async () => { const at = await unitsOf(repository, room.id); return plan.legs.every(leg => at.get(leg.id) === leg.to); }, { timeout: 20000 }).toBe(true);
  const result = page.locator('.alpha-resolution-phase');
  await expect(result).toBeVisible({ timeout: 40000 });                    // the in-process harness has no stream: the safety poll brings the resolution
  await expect(result).toContainText('moveu-se');
  await shot(page, 'desktop-three-legs-resolved');
  const events = (await repository.find(room.id))!.game!.roundReports.filter(r => r.playerId === p1).at(-1)!.resolution.filter(e => e.type === 'MOVEMENT');
  expect(events.length).toBe(3);
  expect(events.every(e => e.fromHexId !== undefined && e.hexId !== undefined)).toBe(true);
});

test('one leg fails at resolution: the other two still move, the Order is not refunded, and the failure names the leg', async ({ browser }) => {
  const plan = situation();
  const { page, repository, room, readyOther, open } = await serve(browser, plan.state);
  await draftThree(page, plan);
  await confirmMove(page);
  await expect.poll(async () => (await repository.find(room.id))!.game!.players[0]!.orders.length).toBe(1);
  // Between the plan and the resolution a Acampamento settles on the destination of leg 3 (a legal plan that became illegal).
  const stored = (await repository.find(room.id))!;
  const camp: Threat = { id: 'camp-late', kind: 'CAMP', hexId: plan.legs[2]!.to as never, homeHexId: plan.legs[2]!.to as never, level: 3, status: 'CAMPED', composition: threatComposition('CAMP', 3, 0), createdRound: 1, lastActedRound: 0, rewardPaid: false, fresh: true, withdrawing: false, readyRound: 0 };
  stored.game!.threats.push(camp);
  await repository.save({ ...stored, version: stored.version + 1 }, stored.version);
  await open();
  await confirmPlanning(page);
  expect((await readyOther()).status).toBe(200);
  await expect.poll(async () => { const at = await unitsOf(repository, room.id); return at.get('t-a') === plan.legs[0]!.to && at.get('t-b') === plan.legs[1]!.to; }, { timeout: 20000 }).toBe(true);
  const at = await unitsOf(repository, room.id);
  expect(at.get('t-c')).toBe(plan.legs[2]!.from);                          // the third piece stays where it was
  const result = page.locator('.alpha-resolution-phase');
  await expect(result).toBeVisible({ timeout: 40000 });
  await expect(result).toContainText(/trajeto 3 de 3/);                    // the failure names the leg
  await expect(result).toContainText('moveu-se');                          // the other legs are reported as done
  await shot(page, 'desktop-one-leg-failed');
  const report = (await repository.find(room.id))!.game!.roundReports.filter(r => r.playerId === p1).at(-1)!;
  expect(report.resolution.filter(e => e.type === 'MOVEMENT').length).toBe(2);
  expect(report.resolution.some(e => e.type === 'FAILURE' && /trajeto 3 de 3/.test(e.message))).toBe(true);
  expect((await repository.find(room.id))!.game!.players[0]!.orders.length).toBe(0);   // the Order was consumed once, not left pending
});
