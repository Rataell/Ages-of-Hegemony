import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaStateSchema, ADVANCEMENTS, type AlphaState } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, hexNeighbors, registerAdvance, spawnThreat } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { readyAll } from '../tests/alpha-rounds.js';
import { runScriptedMatch } from '../tests/alpha-match-scenario.js';
import { openArea } from './alpha-fixture.js';
import { connectAlphaContext, muteTour, cloudNode } from './alpha-fixture.js';

const origin = 'http://127.0.0.1:3107', evidence = 'docs/evidence/v51b-ui';
const p1 = 'p1' as never;
const clearPulse = (state: AlphaState): AlphaState => { state.players.forEach(player => { player.pendingChoices = player.pendingChoices.filter(choice => choice.source !== 'PULSE'); }); return state; };

/** A real 2-seat state, advanced the way a match would be: researched marks and sockets, a camp in sight of the capital. */
function seeded(extra: string[] = []): AlphaState {
  const state = clearPulse(beginAlphaPlanning(createAlphaGame({ gameId: `6f1b5c9a-3d2e-4f8a-9b7c-1a2b3c4d5e${String(60 + extra.length).padStart(2, '0')}`, seed: 11, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana', civilization: 'valgard' }, { id: 'p2', name: 'Beto', civilization: 'thalos' }] })));
  const me = state.players.find(player => player.playerId === p1)!;
  for (const id of ['web-writing', 'web-agriculture', 'web-masonry', 'web-guard-formations', ...extra]) { me.research.push(id); registerAdvance(state, p1, id); }
  const capital = state.core.players[0]!.civilization.cities[0]!;
  const tile = state.core.map.find(t => t.id === capital.hexId)!;
  const near = hexNeighbors(tile).map(point => state.core.map.find(t => t.q === point.q && t.r === point.r)).filter(t => t && !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain) && !state.units.some(u => u.hexId === t.id))[1];
  const threat = spawnThreat(state, 'CAMP');
  if (threat && near) { threat.hexId = near.id as never; threat.homeHexId = near.id as never; threat.level = 2; threat.composition = [{ kind: 'INFANTRY', count: 3 }, { kind: 'RANGED', count: 1 }]; }
  return AlphaStateSchema.parse(state);
}

async function open(browser: import('@playwright/test').Browser, state: AlphaState, viewport = { width: 1366, height: 768 }) {
  const repository = new InMemoryAlphaRepository(), sessions = new GuestSessions('v51b-browser-secret-'.repeat(4)), identity = sessions.issue(Date.now()), other = sessions.issue(Date.now());
  const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
  const room = AlphaRoomSchema.parse({ id: state.gameId, version: 0, name: 'Mesa V5.1b', joinCode: 'abcdefghijklmnopqrstuv', hostGuestId: identity.principal.guestId, preset: 'QUICK', seed: 11, seatLimit: 2, planningSeconds: 0, deadline: null,
    seats: state.players.map((p, i) => ({ guestId: (i === 0 ? identity : other).principal.guestId, playerId: p.playerId, name: i === 0 ? 'Ana' : 'Beto', civilization: p.civilization, ready: true })), game: state });
  await repository.create(room);
  const context = await browser.newContext({ viewport });
  await connectAlphaContext(context, http); await muteTour(context);
  await context.addCookies([{ name: 'aoh_alpha_session', value: identity.token, url: origin, httpOnly: true, sameSite: 'Strict' }]);
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  await page.goto(`/alpha?game=${room.id}`);
  await expect(page.locator('.world-map')).toBeVisible();
  const ambitions = page.getByRole('button', { name: /Ver o mapa primeiro/ }); if (await ambitions.isVisible().catch(() => false)) await ambitions.click();
  return { page, context };
}
const noGlobalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth + 1);

test('Mesa with the Faixa, the Tabuleiro da Civilização, the Teia, Herança, city card and a threat on the map', async ({ browser }) => {
  await mkdir(evidence, { recursive: true });
  const { page } = await open(browser, seeded());
  // Faixa: four filled sockets, the fifth one is next.
  await expect(page.locator('.alpha-strip .alpha-socket.is-full')).toHaveCount(4);
  await page.screenshot({ path: `${evidence}/01-mesa-1366.png` });
  expect(await noGlobalScroll(page)).toBe(true);
  // The sockets open the Tabuleiro.
  await page.locator('.alpha-strip .alpha-resonance').click();
  const board = page.getByRole('dialog', { name: 'Tabuleiro da Civilização' });
  await expect(board).toBeVisible();
  await expect(board.locator('.alpha-big-sockets .alpha-socket')).toHaveCount(5);
  await expect(board.locator('.alpha-big-sockets .alpha-socket.is-full')).toHaveCount(4);
  await expect(board.locator('.alpha-big-sockets .alpha-socket.is-fifth')).toHaveCount(1);
  await expect(board.getByLabel('Reserva de Marcos')).toBeVisible();
  await expect(board.locator('.alpha-node.is-done')).toHaveCount(4);
  await page.screenshot({ path: `${evidence}/02-tabuleiro-1366.png` });
  // Teia detail of a reachable node (the Teia is the first view of the Tabuleiro).
  await board.locator('.alpha-node.is-reachable').first().click();
  await expect(board.locator('.alpha-node-detail')).toBeVisible();
  await page.screenshot({ path: `${evidence}/03-teia-detalhe-1366.png` });
  // Herança has its own view.
  await board.getByRole('tab', { name: 'Herança' }).click();
  await expect(board.locator('.alpha-heritage')).toHaveCount(3);
  await expect(board.locator('.alpha-heritage.is-locked, .alpha-heritage.is-available').first()).toBeVisible();
  await page.screenshot({ path: `${evidence}/04-heranca-1366.png` });
  expect(await noGlobalScroll(page)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(board).toBeHidden();
  // City card (inspector) and the camp on the map.
  await page.getByRole('button', { name: 'Detalhes', exact: true }).click().catch(() => undefined);
  await page.screenshot({ path: `${evidence}/05-cidade-1366.png` });
  const camp = page.locator('.world-map [data-threat], .world-map .threat-mark, .world-map .alpha-threat').first();
  if (await camp.count()) { await camp.click({ force: true }); }
  await page.screenshot({ path: `${evidence}/06-ameaca-mapa-1366.png` });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('.alpha-strip .alpha-resonance').click();
  await expect(board).toBeVisible();
  await page.screenshot({ path: `${evidence}/02-tabuleiro-1440.png` });
  await page.keyboard.press('Escape');
  await page.screenshot({ path: `${evidence}/01-mesa-1440.png` });
});

test('the fifth advance opens the Repercussão as a parchment with two options', async ({ browser }) => {
  await mkdir(evidence, { recursive: true });
  const { page } = await open(browser, seeded(['web-coastal-navigation']));
  const parchment = page.locator('.alpha-parchment-pop .alpha-parchment');
  await expect(parchment).toBeVisible();
  await expect(parchment.getByRole('button')).toHaveCount(2);
  await page.screenshot({ path: `${evidence}/07-repercussao-1366.png` });
  await parchment.getByRole('button').first().click();
  await expect(parchment).toBeHidden();
  await expect(page.locator('.alpha-strip .alpha-socket.is-full')).toHaveCount(0);
});

test('the Era turn panel shows the nine steps with one dominant CTA', async ({ browser }) => {
  await mkdir(evidence, { recursive: true });
  let state = seeded();
  state.rules.roundsPerEra = 2; state.rules.roundLimit = 14;
  for (let guard = 0; guard < 60 && state.phase !== 'ERA_TURN'; guard++) state = readyAll(state);
  expect(state.phase).toBe('ERA_TURN');
  const { page } = await open(browser, AlphaStateSchema.parse(state));
  const panel = page.getByRole('dialog', { name: 'Virada de Era' });
  await expect(panel).toBeVisible();
  await expect(panel.locator('.alpha-era-steps li')).toHaveCount(9);
  await page.screenshot({ path: `${evidence}/08-virada-de-era-1366.png` });
  expect(ADVANCEMENTS.length).toBeGreaterThan(40);
});

test('combat: preview with Δ thresholds and the result card with outcome, losses and Graus', async ({ browser }) => {
  test.setTimeout(120000);
  await mkdir(evidence, { recursive: true });
  let beforeAttack: AlphaState | undefined;
  runScriptedMatch((name, state) => { if (name === 'beforeAttack') beforeAttack = state; });
  expect(beforeAttack).toBeDefined();
  const repository = new InMemoryAlphaRepository(), sessions = new GuestSessions('v51b-battle-secret-'.repeat(4)), identities = [sessions.issue(Date.now()), sessions.issue(Date.now())];
  const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
  const room = AlphaRoomSchema.parse({ id: beforeAttack!.gameId, version: 0, name: 'Prova de combate', joinCode: 'abcdefghijklmnopqrstuv', hostGuestId: identities[0]!.principal.guestId, preset: 'EPIC', seed: 61, seatLimit: 2, planningSeconds: 0, deadline: null,
    seats: beforeAttack!.players.map((p, i) => ({ guestId: identities[i]!.principal.guestId, playerId: p.playerId, name: i === 0 ? 'Aurélia' : 'Valgard', civilization: p.civilization, ready: true })), game: beforeAttack });
  await repository.create(room);
  const pages: Page[] = [];
  for (const [i, identity] of identities.entries()) {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    await connectAlphaContext(context, http); await muteTour(context);
    await context.addCookies([{ name: 'aoh_alpha_session', value: identity.token, url: origin, httpOnly: true, sameSite: 'Strict' }]);
    const page = await context.newPage(); page.setDefaultTimeout(15000); pages.push(page);
    await page.goto(`/alpha?game=${room.id}`);
    await expect(page.getByRole('heading', { name: i === 0 ? 'Aurélia' : 'Valgard', exact: true })).toBeVisible();
  }
  const a = pages[0]!, b = pages[1]!;
  await a.getByRole('status', { name: 'Resolvendo a rodada' }).getByRole('button', { name: 'Continuar' }).click();
  // The army is operated from its own cloud on the map: posture, then Atacar, then the target hex.
  await a.locator('svg.world-map g.hex[aria-label$=" 8,0"], svg.world-map g.hex[aria-label$=" 8,0, trabalhado"]').first().click();
  await cloudNode(a, 'posture').click(); await a.locator('.ctx-node', { hasText: 'Manobra' }).click();
  await cloudNode(a, 'attack').click();
  await a.getByRole('button', { name: 'Planície 9,0', exact: true }).click();
  await a.getByRole('button', { name: 'Detalhes', exact: true }).click();
  const preview = a.locator('.alpha-attack-preview');
  await expect(preview).toBeVisible(); await preview.locator('summary').first().evaluate(el => (el as HTMLElement).click()); await preview.scrollIntoViewIfNeeded();
  await a.screenshot({ path: `${evidence}/09-combate-previa-1366.png` });
  async function confirmRound() {
    const round = (await repository.find(room.id))!.game!.core.round;
    for (let guard = 0; guard < 14; guard++) {
      const current = (await repository.find(room.id))!;
      if (current.game!.core.status === 'FINISHED' || current.game!.core.round !== round) return;
      const index = current.game!.players.findIndex(p => !p.ready); const page = pages[index]!; await page.reload();
      const ready = page.getByRole('button', { name: /^(Confirmar planejamento|Concluir fase|Confirmar Virada|Passar \/ pronto)$/ });
      await expect(ready).toBeEnabled(); await ready.click();
      const anyway = page.getByRole('button', { name: 'Confirmar mesmo assim', exact: true }); if (await anyway.isVisible().catch(() => false)) await anyway.click();
      await expect.poll(async () => (await repository.find(room.id))!.version).toBeGreaterThan(current.version);
    }
  }
  await confirmRound();
  await a.reload();
  await a.screenshot({ path: `${evidence}/10a-combate-resolucao-1366.png` });
  await openArea(a, 'Crônicas');
  const battle = a.locator('.alpha-battle'); await expect(battle).toHaveCount(1);
  await expect(battle).toContainText(/Δ/);
  await battle.evaluate(el => { el.closest('details')?.setAttribute('open', ''); el.scrollIntoView({ block: 'start' }); });
  await a.screenshot({ path: `${evidence}/10-combate-resultado-1366.png` });
  void b;
});
