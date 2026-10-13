import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaStateSchema, type AlphaState } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { connectAlphaContext, muteTour, cloudNode, confirmFicha } from './alpha-fixture.js';

// Governar matrix (decision D4, gate de prévia jogável): 1 level, several levels, sufficient balance, insufficient balance, a prior planned action that spends the stock. Derived from the Ficha spec. SEEDED states through the real HTTP boundary: every urban action opened from the cloud follows
// Estado atual → Elegibilidade → Custo → Previsto → Confirmar → Aplicado, with numbers from the engine's previewAction. Desktop (1280x720) and phone (390x844).
const origin = 'http://127.0.0.1:3107', evidence = 'docs/evidence/ux-board-governar';
let counter = 0;
const p1 = 'p1' as never;
function seeded(edit: (state: AlphaState, meta: AlphaState['cities'][number]) => void): AlphaState {
  // The edits come BEFORE the planning phase opens, so the round report's opening balance is the edited one (a later edit breaks the report arithmetic when the round resolves).
  const base = createAlphaGame({ gameId: `7a1b5c9a-3d2e-4f8a-9b7c-1a2b3c4d71${String(10 + counter++).padStart(2, '0')}`, seed: 23, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana', civilization: 'aurelia' }, { id: 'p2', name: 'Beto', civilization: 'valgard' }] });
  edit(base, base.cities.find(c => c.currentOwnerId === p1)!);
  const state = beginAlphaPlanning(base);
  state.players.forEach(player => { player.pendingChoices = player.pendingChoices.filter(choice => choice.source !== 'PULSE'); player.ambitionsChosen = true; });
  AlphaStateSchema.parse(state);
  return state;
}
async function serve(browser: import('@playwright/test').Browser, state: AlphaState, viewport = { width: 1280, height: 720 }) {
  const repository = new InMemoryAlphaRepository(), sessions = new GuestSessions('governar-matrix-secret-'.repeat(4)), identity = sessions.issue(Date.now()), other = sessions.issue(Date.now());
  const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
  const room = AlphaRoomSchema.parse({ id: state.gameId, version: 0, contentVersion: 'v1.2', name: 'Governar matriz', joinCode: 'abcdefghijklmnopqrstuv', hostGuestId: identity.principal.guestId, preset: 'QUICK', seed: 23, seatLimit: 2, planningSeconds: 0, actionsPerRound: 5, worldPreset: 'MIXED', revealMap: false, deadline: null,
    seats: state.players.map((p, i) => ({ guestId: (i === 0 ? identity : other).principal.guestId, playerId: p.playerId, name: i === 0 ? 'Ana' : 'Beto', civilization: p.civilization, figureId: p.leader?.leaderId ?? null, ready: true })), game: AlphaStateSchema.parse(state) });
  await repository.create(room);
  const context = await browser.newContext({ viewport, ...(viewport.width < 700 ? { hasTouch: true, isMobile: true } : {}) });
  await connectAlphaContext(context, http); await muteTour(context);
  await context.addCookies([{ name: 'aoh_alpha_session', value: identity.token, url: origin, httpOnly: true, sameSite: 'Strict' }]);
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  await page.goto(`/alpha?game=${room.id}`);
  await expect(page.locator('.world-map')).toBeVisible();
  const later = page.getByRole('button', { name: /Ver o mapa primeiro/ }); if (await later.isVisible().catch(() => false)) await later.click();
  // The other seat confirms through the same boundary, so the round resolves as soon as p1 confirms.
  const readyOther = async () => {
    const read = await http.handle(new Request(`${origin}/api/alpha?gameId=${room.id}`, { headers: { Cookie: `aoh_alpha_session=${other.token}` } }));
    const view = (await read.json()) as { value: { game: { version: number } } };
    return http.handle(new Request(`${origin}/api/alpha`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: `aoh_alpha_session=${other.token}` }, body: JSON.stringify({ operation: 'command', gameId: room.id, payload: { type: 'READY', expectedVersion: view.value.game.version } }) }));
  };
  return { page, repository, room, readyOther };
}
const shot = async (page: Page, name: string) => { await page.waitForTimeout(350); await page.screenshot({ path: `${evidence}/${name}.png` }); };
const city = (page: Page) => page.locator('g.hex.owner-1:has(.art-city)').first();
const planned = async (repository: InMemoryAlphaRepository, id: string) => (await repository.find(id))!.game!.players[0]!.plannedActions;
const ficha = (page: Page) => page.locator('.table-cloud .afi');
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });
const monarchy = (mood: number, resources: Record<string, number>) => seeded((state, meta) => { meta.mood = mood; state.core.players[0]!.civilization.government = 'MONARCHY'; Object.assign(state.players[0]!.resources, resources); });
// A blocked node stays clickable for people (the Ficha names the cause); Playwright refuses aria-disabled, so the click is dispatched.
const openGovernar = async (page: Page) => { await city(page).click({ force: true }); const node = cloudNode(page, 'PROMOTE_MOOD'); if (!(await node.isVisible({ timeout: 1500 }).catch(() => false))) await cloudNode(page, 'more').click();   // Governar lives under the overflow node once other options take the ring
  await node.waitFor(); await node.dispatchEvent('click'); };
async function resolveRound(page: Page, readyOther: () => Promise<Response>) {
  await page.getByRole('button', { name: /Confirmar planejamento/ }).click();
  const anyway = page.getByRole('button', { name: /Confirmar mesmo assim/ });
  await anyway.waitFor({ timeout: 3000 }).then(() => anyway.click()).catch(() => undefined);
  await expect(page.locator('.alpha-round-bar')).toContainText('1 / 2 prontos');
  expect((await readyOther()).status).toBe(200);
}

test('several levels with enough balance: Ânimo 1 → 3 predicted, planned with levels 2, applied equal to the preview', async ({ browser }) => {
  const { page, repository, room, readyOther } = await serve(browser, monarchy(1, { culture: 6, wealth: 8 }));
  await openGovernar(page);
  const f = ficha(page), out = f.locator('.afi-stepper output');
  await expect(out).toHaveText('2');
  await expect(f.locator('[data-band="predicted"] [data-effect="MOOD"]')).toContainText('Ânimo 1 → 3');
  await expect(f.locator('.ctx-go')).toContainText('Confirmar Governar · 2 níveis');
  await expect(f.locator('.ctx-go')).toBeEnabled();
  await shot(page, 'desktop-governar-2-niveis');
  await confirmFicha(page);
  await expect.poll(async () => (await planned(repository, room.id)).find(a => a.type === 'URBAN_ACTION' && a.action === 'PROMOTE_MOOD')).toMatchObject({ levels: 2 });
  const stock = (await repository.find(room.id))!.game!.players[0]!.resources;
  await resolveRound(page, readyOther);
  const result = page.locator('.alpha-resolution-phase [data-applied]');
  await expect(result).toBeVisible({ timeout: 40000 });
  await expect(result).toContainText('Ânimo 1 → 3');
  await expect(result.locator('[data-compare="same"]')).toContainText('igual ao previsto');
  expect(stock).toBeDefined();
});

test('insufficient balance: nothing to pay, Confirmar stays off, the Ficha names the missing resource', async ({ browser }) => {
  const { page, repository, room } = await serve(browser, monarchy(2, { culture: 0, wealth: 0 }));
  await openGovernar(page);
  const f = ficha(page);
  await expect(f.locator('.ctx-go')).toBeDisabled();
  await expect(f.locator('[data-why]')).toContainText(/Cultura|Riqueza/);
  await expect(f.locator('[data-band="predicted"]')).toContainText('Indisponível');
  await shot(page, 'desktop-governar-sem-saldo');
  expect((await planned(repository, room.id)).length).toBe(0);                             // blocked: no Order was spent
});

test('balance for ONE level only: the Ficha caps the stepper at what the stock pays and says why', async ({ browser }) => {
  const { page } = await serve(browser, monarchy(1, { culture: 1, wealth: 0 }));
  await openGovernar(page);
  const f = ficha(page);
  await expect(f.locator('.afi-stepper output')).toHaveText('1');
  await expect(f.locator('.afi-controls')).toContainText('de 1 possíve');
  await expect(f.locator('[data-band="predicted"] [data-effect="MOOD"]')).toContainText('Ânimo 1 → 2');
  await expect(f.locator('.ctx-go')).toBeEnabled();
});

test('a prior planned Governar already spends the only Cultura: the second one is blocked naming the first, and no Order is wasted', async ({ browser }) => {
  const { page, repository, room } = await serve(browser, monarchy(4, { culture: 1, wealth: 0 }));
  await openGovernar(page);
  await expect(ficha(page).locator('.ctx-go')).toContainText('Confirmar Governar');
  await confirmFicha(page);
  await expect.poll(async () => (await planned(repository, room.id)).filter(a => a.type === 'URBAN_ACTION' && a.action === 'PROMOTE_MOOD').length).toBe(1);
  await openGovernar(page);
  const f = ficha(page);
  await expect(f.locator('.ctx-go')).toBeDisabled();
  await expect(f).not.toContainText('Conferindo a ação');
  await expect(f.locator('[data-why]')).toContainText(/Planos anteriores desta rodada: Governar em .* \(gasta 1 Cultura\)/);
  await shot(page, 'desktop-governar-plano-anterior');
  expect((await planned(repository, room.id)).filter(a => a.type === 'URBAN_ACTION').length).toBe(1);
});
