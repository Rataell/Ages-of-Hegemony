import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { ADVANCEMENTS, AlphaStateSchema, type AlphaState, type AlphaUnit, type MapPreset, type MapSize } from '@aoh/game-domain';
import { alphaUnitOptions, beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { connectAlphaContext, muteTour, cloudNode, touchPiece } from './alpha-fixture.js';

// RC 2 · MOVER É DESCOBRIR. Seeded tables through the real UI: there is no Explorar; a Pioneiro (alone or with an escort) Moves into a closed Region and the same Move
// reveals it (auto orientation / choice), a soldier alone cannot, "Requer acesso naval.", a ship needs a Pioneiro aboard until Navegação Oceânica. Evidence in docs/evidence/rc2/move.
const origin = 'http://127.0.0.1:3107', evidence = 'docs/evidence/rc2/move';
let counter = 0;
type Want = 'choice' | 'auto' | 'blocked';
interface Options { sea?: boolean; carry?: boolean; unlock?: boolean; escort?: boolean; soldier?: boolean }

/** Researches an advancement with its prerequisite chain so the fixture state stays legal. */
function learn(state: AlphaState, id: string) {
  const player = state.players[0]!, order: string[] = [];
  const visit = (node: string) => { if (order.includes(node)) return; const a = ADVANCEMENTS.find(x => x.id === node)!; [...a.prerequisites, ...a.prerequisitesAny.slice(0, 1)].forEach(visit); order.push(node); };
  visit(id); player.era = 'ASCENSION';
  for (const node of order) if (!player.research.includes(node)) player.research.push(node);
}

/** A match where p1's piece stands beside a closed Region whose entry is `want`: 'choice' (>=2 orientations), 'auto' (1), 'blocked' (none, and no other Region in reach). */
function scenario(want: Want, discovery?: 'RUIN' | 'DEPOSIT', options: Options = {}) {
  const mapSize: MapSize = 'STANDARD';
  const presets: MapPreset[] = options.sea ? ['ARCHIPELAGO', 'INLAND_SEA'] : want === 'choice' ? ['MIXED'] : want === 'blocked' ? ['ARCHIPELAGO'] : ['ARCHIPELAGO', 'MIXED', 'CONTINENTAL'];
  for (const worldPreset of presets) for (let seed = 1; seed < 160; seed++) {
    const state = beginAlphaPlanning(createAlphaGame({ gameId: `9e2a5c9a-3d2e-4f8a-9b7c-1a2b3c4d${String(1000 + counter).padStart(4, '0')}`, seed, preset: 'QUICK', worldPreset, mapSize, players: [{ id: 'p1', name: 'Ana', civilization: 'valgard' }, { id: 'p2', name: 'Beto', civilization: 'kor' }] }));
    const pioneer = state.units.find(u => u.ownerId === 'p1' && u.kind === 'PIONEER')!;
    const lead: AlphaUnit = options.sea ? { ...pioneer, id: 'ship-lead', kind: 'FLEET' } : options.soldier ? { ...pioneer, id: 'soldier-lead', kind: 'INFANTRY' } : pioneer;
    if (lead !== pioneer) state.units.push(lead);
    if (options.carry) { pioneer.carrierId = lead.id; }
    const known = state.players[0]!.knownHexIds as string[];
    for (const at of [...known].sort()) {
      const tile = state.core.map.find(t => t.id === at)!;
      if (options.sea ? !['SEA', 'COAST'].includes(tile.terrain) : ['SEA', 'MOUNTAINS'].includes(tile.terrain)) continue;
      if (state.units.some(u => u.hexId === at && u !== lead && u !== pioneer && u.ownerId === 'p2')) continue;
      lead.hexId = at as never; if (options.carry) pioneer.hexId = at as never;
      if (options.unlock) learn(state, 'web-ocean-navigation');
      const frontier = alphaUnitOptions(state, 'p1' as never)[lead.id]!.frontier;
      if (want === 'blocked') {
        // A Region that is still face down but already holds water (a dormant rival ship fixes its orientation): a Pioneiro has no land entry ("Requer acesso naval.").
        const next = frontier.find(r => r.entries.some(e => e.path.length === 1) && !state.regions.find(x => x.id === r.regionId)!.templateId.startsWith('homeland'));
        if (!next) continue;
        const water = state.regions.find(r => r.id === next.regionId)!;
        for (const id of water.hexIds) { const t = state.core.map.find(x => x.id === id)!; t.terrain = 'SEA'; t.features = []; }
        state.units.push({ id: 'dormant-ship', ownerId: 'p2', kind: 'FLEET', hexId: water.hexIds[0], recruitedRound: 1, carrierId: null } as never);
        for (const other of frontier) if (other.regionId !== next.regionId) state.regions.find(r => r.id === other.regionId)!.revealedBy = ['p2' as never];
        const blockedNow = alphaUnitOptions(state, 'p1' as never)[lead.id]!.frontier.find(r => r.regionId === next.regionId);
        if (!blockedNow || blockedNow.block === null) continue;
        counter++;
        state.players.forEach(p => { p.pendingChoices = p.pendingChoices.filter(c => c.source !== 'PULSE'); p.ambitionsChosen = true; });
        return { state, region: water, at, entry: water.hexIds[0]! };
      }
      const fits = (r: (typeof frontier)[number]) => r.entries.some(e => e.path.length === 1 && (want === 'choice' ? e.rotations.length >= 2 && e.rotations.length <= 4 : (options.sea ? e.rotations.length >= 1 : e.rotations.length === 1)));
      const pick = frontier.find(r => r.block === null && fits(r) && !state.regions.find(x => x.id === r.regionId)!.templateId.startsWith('homeland'));
      if (!pick) continue;
      const region = state.regions.find(r => r.id === pick.regionId)!;
      counter++;
      if (options.escort) state.units.push({ id: 'escort-1', ownerId: 'p1', kind: 'INFANTRY', hexId: at as never, recruitedRound: 1, carrierId: null } as never);
      if (discovery) region.discovery = { kind: discovery, resolved: false, resolvedBy: null };
      state.players.forEach(p => { p.pendingChoices = p.pendingChoices.filter(c => c.source !== 'PULSE'); p.ambitionsChosen = true; });
      return { state, region, at, entry: pick.entries.find(e => e.path.length === 1 && (want === 'choice' ? e.rotations.length >= 2 && e.rotations.length <= 4 : options.sea ? e.rotations.length >= 1 : e.rotations.length === 1))!.hexId };
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
const entryHex = (id: string) => `g.hex.target[aria-label$=" ${id}"]`;
/** After the entry hex is clicked: a Region with several orientations asks for one (confirm the first), one orientation is queued at once. */
async function confirmIfAsked(page: Page) { const asked = page.locator('.table-cloud').filter({ hasText: /Orientação \d+ de \d+/ }); if (await asked.isVisible({ timeout: 1200 }).catch(() => false)) await page.getByRole('button', { name: /Confirmar movimento/ }).click(); }
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
const noExplore = async (page: Page) => { await expect(cloudNode(page, 'explore')).toHaveCount(0); await expect(page.getByRole('button', { name: /Explorar/ })).toHaveCount(0); };

test('Pioneiro with SEVERAL orientations: Mover → closed Region → abstract selector → ONE Move order → reveal as "Descoberta" → panel', async ({ browser }) => {
  const { state, region, at, entry } = scenario('choice', 'DEPOSIT');
  const { page, readyOther } = await serve(browser, state);
  await touchPiece(page, hexLabel(at));
  await noExplore(page);
  await expect(page.locator('.ctx-node.tone-dominant')).toHaveAttribute('data-node', 'move');
  await shot(page, '1-pioneer-cloud-mover');
  await cloudNode(page, 'move').click();
  expect(await page.locator('svg.world-map .region-back.is-target').count()).toBeGreaterThanOrEqual(1);
  await shot(page, '2-move-mode-closed-region');
  await page.locator(entryHex(entry)).first().click();
  const selector = page.locator('.table-cloud').filter({ hasText: /Orientação/ });
  await expect(selector).toBeVisible();
  await expect(selector).toContainText(/Orientação \d+ de \d+/);
  expect(await selector.innerText()).not.toMatch(/\b(mar|terra|colinas?|montanhas?|floresta|costa|planície)\b/i);
  await shot(page, '3-orientation-selector');
  await page.getByRole('button', { name: /Confirmar movimento/ }).click();
  await expect(page.getByText(/Mover · descobrir/).first()).toBeVisible();
  await shot(page, '4-one-move-planned');
  await resolveAndRecord(page, readyOther, '5-reveal');
  await expect(page.getByRole('dialog', { name: 'Região revelada' })).toBeVisible({ timeout: 15000 });
  await shot(page, '6-discovery-jazida');
  expect(region.id).toBeTruthy();
});

test('Pioneiro with ONE orientation: the Move is queued at once; the log says Descoberta, never Exploração; Vestígio opens its choice', async ({ browser }) => {
  const { state, at, entry } = scenario('auto', 'RUIN');
  const { page, readyOther } = await serve(browser, state);
  await touchPiece(page, hexLabel(at));
  await cloudNode(page, 'move').click();
  await page.locator(entryHex(entry)).first().click();
  await expect(page.locator('.table-cloud').filter({ hasText: /Orientação \d+ de \d+/ })).toHaveCount(0);
  await expect(page.getByText(/Mover · descobrir/).first()).toBeVisible();
  await shot(page, '7-auto-queued');
  await resolveAndRecord(page, readyOther, '8-auto-reveal');
  await expect(page.getByRole('dialog', { name: 'Região revelada' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/Continuar/).first()).toBeVisible();
  await shot(page, '9-discovery-vestigio');
});

test('Pioneiro + Infantaria: "Com escolta" moves both in ONE Move order into the closed Region', async ({ browser }) => {
  const { state, at, entry } = scenario('auto', 'DEPOSIT', { escort: true });
  const { page, readyOther } = await serve(browser, state);
  await touchPiece(page, hexLabel(at));
  await expect(cloudNode(page, 'escort')).toBeVisible();
  await shot(page, '10-escort-node');
  await cloudNode(page, 'escort').click();
  await page.locator(entryHex(entry)).first().click();
  await confirmIfAsked(page);
  await expect(page.getByText(/Mover · descobrir/).first()).toBeVisible();
  await expect(page.getByText(/Ordens planejadas 1 \/ 5|1 \/ 5/).first()).toBeVisible();
  await shot(page, '11-escort-planned');
  await resolveAndRecord(page, readyOther, '12-escort-reveal');
  await expect(page.getByRole('dialog', { name: 'Região revelada' })).toBeVisible({ timeout: 15000 });
});

test('Infantaria sozinha: Mover não destaca Região fechada e diz "Necessita de um Pioneiro"', async ({ browser }) => {
  const { state, at } = scenario('auto', undefined, { soldier: true });
  const { page } = await serve(browser, state);
  await touchPiece(page, hexLabel(at));
  await expect(page.locator('.table-cloud')).toContainText(/Necessita de um Pioneiro/);
  await shot(page, '13-soldier-needs-pioneer');
  await cloudNode(page, 'move').click();
  expect(await page.locator('svg.world-map .region-back.is-target').count()).toBe(0);
  await shot(page, '14-soldier-move-mode');
});

test('Arquipélago: a Pioneiro beside a Region without land entry gets "Requer acesso naval." and no Region target', async ({ browser }) => {
  const { state, at } = scenario('blocked');
  const { page } = await serve(browser, state);
  await touchPiece(page, hexLabel(at));
  await expect(page.locator('.table-cloud')).toContainText(/Requer acesso naval/);
  await shot(page, '15-naval-access-required');
  expect(await page.locator('svg.world-map .region-back.is-target').count()).toBe(0);
});

test('Navio SEM Pioneiro: sem destino na Região fechada; COM Pioneiro a bordo: Mover revela e a carga continua embarcada', async ({ browser }) => {
  const bare = scenario('auto', undefined, { sea: true });
  const bareServed = await serve(browser, bare.state);
  await touchPiece(bareServed.page, hexLabel(bare.at));
  await expect(bareServed.page.locator('.table-cloud')).toContainText(/Pioneiro embarcado|Navegação Oceânica/);
  await shot(bareServed.page, '16-ship-needs-pioneer');
  const { state, at, entry } = scenario('auto', 'DEPOSIT', { sea: true, carry: true });
  const { page, readyOther } = await serve(browser, state);
  await touchPiece(page, hexLabel(at));
  await noExplore(page);
  await cloudNode(page, 'move').click();
  await shot(page, '17-ship-with-pioneer-move-mode');
  await page.locator(entryHex(entry)).first().click();
  await confirmIfAsked(page);
  await expect(page.getByText(/Mover · descobrir/).first()).toBeVisible();
  await shot(page, '18-ship-planned');
  await resolveAndRecord(page, readyOther, '19-ship-reveal');
  await expect(page.getByRole('dialog', { name: 'Região revelada' })).toBeVisible({ timeout: 15000 });
  await shot(page, '20-ship-discovery');
});

test('Navegação Oceânica: o navio sozinho (sem Pioneiro) descobre ao Mover', async ({ browser }) => {
  const { state, at, entry } = scenario('auto', 'DEPOSIT', { sea: true, unlock: true });
  const { page, readyOther } = await serve(browser, state);
  await touchPiece(page, hexLabel(at));
  await cloudNode(page, 'move').click();
  await page.locator(entryHex(entry)).first().click();
  await confirmIfAsked(page);
  await expect(page.getByText(/Mover · descobrir/).first()).toBeVisible();
  await shot(page, '21-ocean-navigation-planned');
  await resolveAndRecord(page, readyOther, '22-ocean-navigation-reveal');
  await expect(page.getByRole('dialog', { name: 'Região revelada' })).toBeVisible({ timeout: 15000 });
});
