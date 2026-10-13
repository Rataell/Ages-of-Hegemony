import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaStateSchema, type AlphaState } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { connectAlphaContext, muteTour, cloudNode, confirmFicha } from './alpha-fixture.js';

// Slice B2b · Ficha de Ação (UX board directive §1-3, decision D4). SEEDED states through the real HTTP boundary: every urban action opened from the cloud follows
// Estado atual → Elegibilidade → Custo → Previsto → Confirmar → Aplicado, with numbers from the engine's previewAction. Desktop (1280x720) and phone (390x844).
const origin = 'http://127.0.0.1:3107', evidence = 'docs/evidence/ux-board-b2b';
let counter = 0;
const p1 = 'p1' as never;
function seeded(edit: (state: AlphaState, meta: AlphaState['cities'][number]) => void): AlphaState {
  // The edits come BEFORE the planning phase opens, so the round report's opening balance is the edited one (a later edit breaks the report arithmetic when the round resolves).
  const base = createAlphaGame({ gameId: `7a1b5c9a-3d2e-4f8a-9b7c-1a2b3c4d70${String(10 + counter++).padStart(2, '0')}`, seed: 23, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana', civilization: 'aurelia' }, { id: 'p2', name: 'Beto', civilization: 'valgard' }] });
  edit(base, base.cities.find(c => c.currentOwnerId === p1)!);
  const state = beginAlphaPlanning(base);
  state.players.forEach(player => { player.pendingChoices = player.pendingChoices.filter(choice => choice.source !== 'PULSE'); player.ambitionsChosen = true; });
  AlphaStateSchema.parse(state);
  return state;
}
async function serve(browser: import('@playwright/test').Browser, state: AlphaState, viewport = { width: 1280, height: 720 }) {
  const repository = new InMemoryAlphaRepository(), sessions = new GuestSessions('ficha-b2b-secret-'.repeat(4)), identity = sessions.issue(Date.now()), other = sessions.issue(Date.now());
  const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
  const room = AlphaRoomSchema.parse({ id: state.gameId, version: 0, contentVersion: 'v1.2', name: 'Ficha de Ação', joinCode: 'abcdefghijklmnopqrstuv', hostGuestId: identity.principal.guestId, preset: 'QUICK', seed: 23, seatLimit: 2, planningSeconds: 0, actionsPerRound: 5, worldPreset: 'MIXED', revealMap: false, deadline: null,
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

test.describe('desktop', () => {
  test('Produzir permitido: the Ficha shows the six bands with the engine numbers, Confirmar plans it', async ({ browser }) => {
    const { page, repository, room } = await serve(browser, seeded((state, meta) => { meta.mood = 4; Object.assign(state.players[0]!.resources, { food: 12, wood: 10, stone: 6 }); }));
    await city(page).click({ force: true });
    await cloudNode(page, 'PRODUCE').click();
    const f = ficha(page);
    await expect(f).toBeVisible();
    await expect(f.locator('.afi-steps li')).toHaveCount(6);
    await expect(f.locator('[aria-label="Estado atual"]')).toContainText(/Estável 4\/6/);
    await expect(f.locator('[aria-label="Estado atual"]')).toContainText(/Ordens 0\/5/);
    await expect(f.locator('[data-band="eligibility"]')).toContainText('Pode agir');
    await expect(f.locator('[data-band="eligibility"]')).toContainText('Ordem disponível (0/5)');
    await expect(f.locator('[data-band="cost"]')).toContainText('Ordem Cidade 0/5 → 1/5');
    await expect(f.locator('[data-band="cost"]')).toContainText(/Ativação 0\/2 → 1\/2/);
    await expect(f.locator('[data-band="predicted"] [data-effect="RESOURCE"]').first()).toContainText('Alimento');
    await expect(f.locator('[data-band="predicted"]')).toContainText('nada foi aplicado');
    await expect(f.locator('[aria-label="Aplicado"]')).toBeVisible();
    const go = f.locator('.ctx-go');
    await expect(go).toBeEnabled();
    // the Ficha stands clear of the city it was born on (layering: it never covers the piece)
    const plate = (await page.locator('.table-cloud .ctx-plate').boundingBox())!, hex = (await city(page).locator('.hex-base').boundingBox())!;
    expect(plate.x + plate.width <= hex.x || hex.x + hex.width <= plate.x || plate.y + plate.height <= hex.y || hex.y + hex.height <= plate.y).toBe(true);
    await shot(page, 'desktop-produzir-ficha');
    await go.click();
    await expect(page.locator('.table-cloud')).toHaveCount(0);
    await expect.poll(async () => (await planned(repository, room.id)).some(a => a.type === 'URBAN_ACTION' && a.action === 'PRODUCE')).toBe(true);
  });

  test('Governar: choose 1 of 2 levels, Ânimo before -> after on seals, confirm, and the applied matches the preview after the phase resolves', async ({ browser }) => {
    const { page, repository, room, readyOther } = await serve(browser, seeded((state, meta) => {
      meta.mood = 1; state.core.players[0]!.civilization.government = 'MONARCHY';          // capital Capacidade 2: two levels are possible
      Object.assign(state.players[0]!.resources, { culture: 5, wealth: 8 });
    }));
    await city(page).click({ force: true });
    await cloudNode(page, 'PROMOTE_MOOD').click();
    const f = ficha(page);
    const out = f.locator('.afi-stepper output');
    await expect(out).toHaveText('2');                                                     // default: the most the quote allows
    await expect(f.locator('.afi-controls')).toContainText('de 2 possíveis');
    await f.getByRole('button', { name: 'Menos um nível' }).click();
    await expect(out).toHaveText('1');
    const mood = f.locator('[data-band="predicted"] [data-effect="MOOD"]');
    await expect(mood).toContainText('Ânimo 1 → 2');
    await expect(mood.locator('.mood-seal')).toHaveCount(2);                                // seal before and after
    await expect(f.locator('[data-band="cost"]')).toContainText('Cultura');
    await expect(f.locator('.ctx-go')).toContainText('Confirmar Governar · 1 nível');
    // 0 levels: nothing would change, so it cannot be confirmed, and it says why
    await f.getByRole('button', { name: 'Menos um nível' }).click();
    await expect(f.locator('.ctx-go')).toBeDisabled();
    await expect(f.locator('[data-why]')).toContainText('Sem efeito: escolha ao menos 1 nível');
    await f.getByRole('button', { name: 'Mais um nível' }).click();
    await expect(out).toHaveText('1');
    await shot(page, 'desktop-governar-ficha');
    await confirmFicha(page);
    await expect.poll(async () => (await planned(repository, room.id)).find(a => a.type === 'URBAN_ACTION' && a.action === 'PROMOTE_MOOD')).toMatchObject({ levels: 1 });
    // resolve the phase: the applied Ânimo is the one the Ficha promised
    await page.getByRole('button', { name: /Confirmar planejamento/ }).click();
    const anyway = page.getByRole('button', { name: /Confirmar mesmo assim/ });
    await anyway.waitFor({ timeout: 3000 }).then(() => anyway.click()).catch(() => undefined);   // the pre-confirmation reminder (idle pieces), when it shows
    await expect(page.locator('.alpha-round-bar')).toContainText('1 / 2 prontos');
    const ro = await readyOther();
    expect(ro.status).toBe(200);
    const result = page.locator('.alpha-resolution-phase [data-applied]');
    await expect(result).toBeVisible({ timeout: 40000 });          // the in-process harness has no stream: the browser's safety poll brings the resolution
    await expect(result).toContainText('Ânimo 1 → 2');
    await expect(result.locator('[data-compare="same"]')).toContainText('igual ao previsto');
    await shot(page, 'desktop-governar-resultado');
  });

  test('Recrutar blocked by an advance: the Ficha names the advance (and every other cause on its own line), Confirmar stays off with the first reason', async ({ browser }) => {
    const { page } = await serve(browser, seeded((state, meta) => { meta.mood = 4; Object.assign(state.players[0]!.resources, { food: 12, wood: 10, stone: 6, metal: 4, wealth: 4 }); }));
    await city(page).click({ force: true });
    await cloudNode(page, 'RECRUIT').click();
    const guard = page.locator('.ctx-node[data-node=\'["RECRUIT",null,"GUARD",null]\']');
    await guard.waitFor();
    await guard.dispatchEvent('click');                                                    // the nodes fly out from the centre: a coordinate click could land on a neighbour   // blocked nodes stay clickable: the Ficha names the cause
    const f = ficha(page);
    const lines = f.locator('[data-band="eligibility"] .afi-line.is-bad');
    await expect(lines.first()).toContainText('Formações de Guarda');
    await expect(f.locator('[data-band="eligibility"]')).toContainText('Pesquise Formações de Guarda');
    await expect(f.locator('[data-band="eligibility"]')).toContainText('Faltam Soldados');
    expect(await lines.count()).toBeGreaterThanOrEqual(2);
    await expect(f.locator('.afi-unit')).toContainText('Guarda');
    await expect(f.locator('.afi-unit svg')).toBeVisible();                                // the unit miniature
    await expect(f.locator('[data-band="predicted"]')).toContainText('Indisponível');
    await expect(f.locator('.ctx-go')).toBeDisabled();
    await expect(f.locator('[data-why]')).toContainText('Formações de Guarda');
    await shot(page, 'desktop-recrutar-bloqueado');
  });
});

test.describe('phone', () => {
  test('Governar on a phone: a compact sheet (no step row), clear of the city, fully on screen', async ({ browser }) => {
    const viewport = { width: 390, height: 844 };
    const { page, repository, room } = await serve(browser, seeded((state, meta) => {
      meta.mood = 1; state.core.players[0]!.civilization.government = 'MONARCHY';
      Object.assign(state.players[0]!.resources, { culture: 5, wealth: 8 });
    }), viewport);
    await city(page).click({ force: true });
    await shot(page, 'phone-cidade-nuvem');
    await cloudNode(page, 'PROMOTE_MOOD').click();
    const f = ficha(page);
    await expect(f).toBeVisible();
    await expect(f).toHaveClass(/is-compact/);
    await expect(f.locator('.afi-steps')).toHaveCount(0);
    await expect(f.locator('[aria-label="Estado atual"]')).toContainText(/Revolta 1\/6/);
    await expect(f.locator('[aria-label="Aplicado"]')).toHaveCount(0);
    const sheet = page.locator('.table-cloud .ctx-plate.is-sheet');
    await expect(sheet).toBeVisible();
    await page.waitForTimeout(350);
    const box = (await sheet.boundingBox())!, hex = (await city(page).locator('.hex-base').boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1); expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
    expect(box.y + box.height <= hex.y || hex.y + hex.height <= box.y).toBe(true);        // the sheet does not cover the city
    await shot(page, 'phone-governar-ficha');
    await f.locator('.ctx-go').scrollIntoViewIfNeeded();
    await f.locator('.ctx-go').click();
    await expect.poll(async () => (await planned(repository, room.id)).some(a => a.type === 'URBAN_ACTION' && a.action === 'PROMOTE_MOOD')).toBe(true);
  });
});
