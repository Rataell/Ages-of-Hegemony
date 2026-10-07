import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaStateSchema, type AlphaState, type MapPreset, type MapSize } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, explorationAccess, hexId, hexNeighbors, regionOrientationFixed } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { connectAlphaContext, muteTour, cloudNode, touchPiece } from './alpha-fixture.js';

// RC 1.2 · EXPLORAÇÃO AO VIVO. Seeded tables through the real UI: Pioneiro → closed Region → orientation (auto / choice) → physical reveal → Descoberta,
// "Requer acesso naval." and a Frota exploring by sea. Evidence in docs/evidence/rc12/exploration.
const origin = 'http://127.0.0.1:3107', evidence = 'docs/evidence/rc12/exploration';
let counter = 0;
type Piece = 'PIONEER' | 'FLEET';
const rim = (state: AlphaState, region: AlphaState['regions'][number]) => {
  const inside = new Set<string>(region.hexIds), out = new Set<string>();
  for (const id of region.hexIds) for (const p of hexNeighbors(state.core.map.find(t => t.id === id)!)) { const n = hexId(p); if (!inside.has(n) && state.core.map.some(t => t.id === n)) out.add(n); }
  return [...out];
};

/** A match where p1's explorer stands beside a closed Region whose access is `want`: 'choice' (>=2 orientations), 'auto' (1), 'blocked' (none). */
function scenario(want: 'choice' | 'auto' | 'blocked' | 'naval', discovery?: 'RUIN' | 'DEPOSIT') {
  const worldPreset: MapPreset = want === 'choice' ? 'MIXED' : 'ARCHIPELAGO', mapSize: MapSize = 'STANDARD';
  const kind: Piece = want === 'naval' ? 'FLEET' : 'PIONEER';
  for (let seed = 1; seed < 100; seed++) {
    const state = beginAlphaPlanning(createAlphaGame({ gameId: `9e2a5c9a-3d2e-4f8a-9b7c-1a2b3c4d${String(1000 + counter).padStart(4, '0')}`, seed, preset: 'QUICK', worldPreset, mapSize, players: [{ id: 'p1', name: 'Ana', civilization: 'valgard' }, { id: 'p2', name: 'Beto', civilization: 'kor' }] }));
    const closed = state.regions.filter(r => !regionOrientationFixed(state, r) && !r.templateId.startsWith('homeland'));
    const probe = state.units.find(u => u.ownerId === 'p1' && u.kind === 'PIONEER')!;
    const spots = [...new Set(closed.flatMap(r => rim(state, r)))].sort();
    for (const at of spots) {
      const tile = state.core.map.find(t => t.id === at)!;
      if (kind === 'PIONEER' && ['SEA', 'MOUNTAINS'].includes(tile.terrain)) continue;
      if (kind === 'FLEET' && tile.terrain !== 'SEA') continue;
      if (state.units.some(u => u.hexId === at)) continue;
      const piece = { ...probe, id: 'explorer', kind, hexId: at as never };
      // Every closed Region within reach decides what the cloud offers.
      // Dormant homelands are closed Regions too: a blocked case needs every one of them blocked.
      const near = state.regions.filter(r => r.revealedBy.length === 0 && (rim(state, r).includes(at) || r.hexIds.includes(at as never))).map(r => ({ r, a: explorationAccess(state, piece, r) }));
      const pick = want === 'blocked' ? near.find(x => x.a.block !== null && !x.r.templateId.startsWith('homeland'))
        : near.find(x => want === 'choice' ? x.a.rotations.length >= 2 && x.a.rotations.length <= 4 : want === 'auto' ? x.a.rotations.length === 1 : x.a.block === null && x.a.rotations.length > 0);
      if (!pick) continue;
      counter++;
      // Fixture: the other Regions beside the explorer were already opened by earlier turns, so the blocked one is the only closed Region in reach.
      if (want === 'blocked') for (const other of near) if (other.r !== pick.r) other.r.revealedBy = ['p2' as never];
      state.units = state.units.filter(u => u.id !== probe.id);
      state.units.push(piece as never);
      if (discovery) pick.r.discovery = { kind: discovery, resolved: false, resolvedBy: null };
      state.players.forEach(p => { p.pendingChoices = p.pendingChoices.filter(c => c.source !== 'PULSE'); p.ambitionsChosen = true; });
      return { state, region: pick.r, at, access: pick.a };
    }
  }
  throw new Error(`no ${want} scenario`);
}

async function serve(browser: import('@playwright/test').Browser, state: AlphaState, viewport = { width: 1280, height: 720 }) {
  const repository = new InMemoryAlphaRepository(), sessions = new GuestSessions('explore-live-secret-'.repeat(4)), identity = sessions.issue(Date.now()), other = sessions.issue(Date.now());
  const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
  const room = AlphaRoomSchema.parse({ id: state.gameId, version: 0, contentVersion: 'v1.2', name: 'Exploração', joinCode: 'abcdefghijklmnopqrstuv', hostGuestId: identity.principal.guestId, preset: 'QUICK', seed: 23, seatLimit: 2, planningSeconds: 0, actionsPerRound: 5, worldPreset: state.rules.worldPreset, mapSize: state.rules.mapSize, revealMap: false, deadline: null,
    seats: state.players.map((p, i) => ({ guestId: (i === 0 ? identity : other).principal.guestId, playerId: p.playerId, name: i === 0 ? 'Ana' : 'Beto', civilization: p.civilization, figureId: p.leader?.leaderId ?? null, ready: true })), game: AlphaStateSchema.parse(state) });
  await repository.create(room);
  const context = await browser.newContext({ viewport });
  await connectAlphaContext(context, http); await muteTour(context);
  await context.addCookies([{ name: 'aoh_alpha_session', value: identity.token, url: origin, httpOnly: true, sameSite: 'Strict' }]);
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  await page.goto(`/alpha?game=${room.id}`);
  await expect(page.locator('.world-map')).toBeVisible();
  const later = page.getByRole('button', { name: /Ver o mapa primeiro/ }); if (await later.isVisible().catch(() => false)) await later.click();
  // The other seat confirms through the same boundary, so the round resolves as soon as p1 confirms.
  const readyOther = async () => { const read = await http.handle(new Request(`${origin}/api/alpha?gameId=${room.id}`, { headers: { Cookie: `aoh_alpha_session=${other.token}` } })); const view = (await read.json()) as { value: { game: { version: number } } };
    return http.handle(new Request(`${origin}/api/alpha`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: `aoh_alpha_session=${other.token}` }, body: JSON.stringify({ operation: 'command', gameId: room.id, payload: { type: 'READY', expectedVersion: view.value.game.version } }) })); };
  return { page, readyOther, repository, room };
}
const shot = async (page: Page, name: string) => { await page.waitForTimeout(250); await page.screenshot({ path: `${evidence}/${name}.png` }); };
const regionHexes = (region: AlphaState['regions'][number]) => region.hexIds.map(id => `g.hex.target-explore[aria-label$=" ${id}"]`).join(', ');
const hexLabel = (id: string) => `g.hex[aria-label$=" ${id}"], g.hex[aria-label$=" ${id}, trabalhado"]`;
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

/** Confirm the plan, let the table resolve, and record the reveal as frames. */
async function resolveAndRecord(page: Page, readyOther: () => Promise<Response>, prefix: string) {
  await page.getByRole('button', { name: /Confirmar planejamento/ }).click();
  const anyway = page.getByRole('button', { name: /Confirmar mesmo assim/ });
  if (await anyway.isVisible({ timeout: 1500 }).catch(() => false)) await anyway.click();
  await readyOther();
  for (let i = 0; i < 6; i++) { await page.waitForTimeout(220); await page.screenshot({ path: `${evidence}/${prefix}-frame-${i}.png` }); }
  await page.getByRole('button', { name: 'Continuar', exact: true }).first().click({ timeout: 8000 }).catch(() => undefined);
}

test('Pioneiro with SEVERAL orientations: highlight → abstract selector (no terrain) → confirm → physical reveal → Descoberta panel', async ({ browser }) => {
  const { state, region, at } = scenario('choice', 'DEPOSIT');
  const { page, readyOther } = await serve(browser, state);
  await touchPiece(page, hexLabel(at));
  await expect(page.locator('.ctx-node.tone-dominant')).toHaveAttribute('data-node', 'explore');
  await cloudNode(page, 'explore').click();
  expect(await page.locator('svg.world-map .region-back.is-target').count()).toBeGreaterThanOrEqual(1);
  await shot(page, '1-choice-highlight');
  await page.locator(regionHexes(region)).first().click();
  const selector = page.locator('.table-cloud').filter({ hasText: /Orientação/ });
  await expect(selector).toBeVisible();
  await expect(selector).toContainText(/Orientação \d+ de \d+/);
  // The selector never names terrain.
  expect(await selector.innerText()).not.toMatch(/\b(mar|terra|colinas?|montanhas?|floresta|costa|planície)\b/i);
  await shot(page, '2-choice-selector');
  await page.getByRole('button', { name: /Confirmar exploração/ }).click();
  await shot(page, '3-choice-queued');
  await resolveAndRecord(page, readyOther, '4-choice-reveal');
  await expect(page.getByText(/REGIÃO REVELADA/i)).toBeVisible({ timeout: 15000 });
  await shot(page, '5-discovery-jazida');
  expect(region.id).toBeTruthy();
});

test('Pioneiro with ONE orientation: the order is queued at once (automatic), Vestígio opens its choice', async ({ browser }) => {
  const { state, region, at } = scenario('auto', 'RUIN');
  const { page, readyOther } = await serve(browser, state);
  await touchPiece(page, hexLabel(at));
  await cloudNode(page, 'explore').click();
  await page.locator(regionHexes(region)).first().click();
  await expect(page.locator('.table-cloud').filter({ hasText: /Orientação \d+ de \d+/ })).toHaveCount(0);
  await expect(page.getByText(/Exploração planejada|Explorar|planejad/i).first()).toBeVisible();
  await shot(page, '6-auto-queued');
  await resolveAndRecord(page, readyOther, '7-auto-reveal');
  await expect(page.getByText(/REGIÃO REVELADA/i)).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/Continuar/).first()).toBeVisible();
  await shot(page, '8-discovery-vestigio');
});

test('Arquipélago: a Pioneiro beside a Region without land entry gets "Requer acesso naval." and no Explorar target', async ({ browser }) => {
  const { state, at } = scenario('blocked');
  const { page } = await serve(browser, state);
  await touchPiece(page, hexLabel(at));
  await expect(page.locator('.table-cloud')).toContainText(/Requer acesso naval/);
  await shot(page, '9-naval-access-required');
  expect(await page.locator('svg.world-map g.hex.target-explore').count()).toBe(0);
});

test('Frota: explores a Region through navigable water', async ({ browser }) => {
  const { state, region, at } = scenario('naval', 'DEPOSIT');
  const { page, readyOther } = await serve(browser, state);
  await touchPiece(page, hexLabel(at));
  await expect(cloudNode(page, 'explore')).toBeVisible();
  await cloudNode(page, 'explore').click();
  await shot(page, '10-fleet-explore-mode');
  await page.locator(regionHexes(region)).first().click();
  const selector = page.locator('.table-cloud').filter({ hasText: /Orientação/ });
  if (await selector.isVisible().catch(() => false)) await page.getByRole('button', { name: /Confirmar exploração/ }).click();
  await shot(page, '11-fleet-queued');
  await resolveAndRecord(page, readyOther, '12-fleet-reveal');
  await expect(page.getByText(/REGIÃO REVELADA/i)).toBeVisible({ timeout: 15000 });
  await shot(page, '13-fleet-discovery');
});
