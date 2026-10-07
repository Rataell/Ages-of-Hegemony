import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaStateSchema, type AlphaState } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, registerAdvance } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { connectAlphaContext, muteTour } from './alpha-fixture.js';

// RC4 · CUBOS DE AVANÇO. The permanent marker is a CUBE of the player's colour on the node; the tray holds ECHOES of those cubes. (Was RC2 · Ressonância física.) A seeded table whose advances are added one at a time while the browser watches (the safety poll picks each one up),
// so the real animation runs: the cube lands on its Teia node, an echo travels to the next cavity, the fifth makes the five respond and the
// Repercussão card appears; resolving it clears the tray while the permanent marks stay. Evidence in docs/evidence/rc4/resonance.
const origin = 'http://127.0.0.1:3107', evidence = 'docs/evidence/rc4/resonance';
const ADVANCES = ['web-writing', 'web-agriculture', 'web-masonry', 'web-exchange', 'web-common-narratives'];
let counter = 0;

function baseState(advances: string[] = []): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: `7c1d4e22-5b6a-4c3d-8e9f-0a1b2c3d${String(2000 + counter++).padStart(4, '0')}`, seed: 11, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana', civilization: 'valgard' }, { id: 'p2', name: 'Beto', civilization: 'meridia' }] }));
  state.players.forEach(p => { p.pendingChoices = p.pendingChoices.filter(c => c.source !== 'PULSE'); p.ambitionsChosen = true; });
  give(state, advances);
  return state;
}
const give = (state: AlphaState, ids: string[], who = 'p1') => ids.forEach(id => { const me = state.players.find(p => p.playerId === who)!; if (!me.research.includes(id)) me.research.push(id); registerAdvance(state, who as never, id); });

async function serve(browser: import('@playwright/test').Browser, state: AlphaState, viewport = { width: 1280, height: 720 }, who: 'p1' | 'p2' = 'p1') {
  const repository = new InMemoryAlphaRepository(), sessions = new GuestSessions('resonance-live-secret-'.repeat(4)), identity = sessions.issue(Date.now()), other = sessions.issue(Date.now());
  const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
  const room = AlphaRoomSchema.parse({ id: state.gameId, version: 0, contentVersion: 'v1.2', name: 'Ressonância', joinCode: 'abcdefghijklmnopqrstuv', hostGuestId: identity.principal.guestId, preset: 'QUICK', seed: 11, seatLimit: 2, planningSeconds: 0, actionsPerRound: 5, worldPreset: state.rules.worldPreset, mapSize: state.rules.mapSize, revealMap: false, deadline: null,
    seats: state.players.map((p, i) => ({ guestId: (i === 0 ? identity : other).principal.guestId, playerId: p.playerId, name: i === 0 ? 'Ana' : 'Beto', civilization: p.civilization, figureId: p.leader?.leaderId ?? null, ready: true })), game: AlphaStateSchema.parse(state) });
  await repository.create(room);
  const context = await browser.newContext({ viewport });
  await connectAlphaContext(context, http); await muteTour(context);
  await context.addCookies([{ name: 'aoh_alpha_session', value: (who === 'p1' ? identity : other).token, url: origin, httpOnly: true, sameSite: 'Strict' }]);
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  await page.goto(`/alpha?game=${room.id}`);
  await expect(page.locator('.world-map')).toBeVisible();
  const later = page.getByRole('button', { name: /Ver o mapa primeiro/ }); if (await later.isVisible().catch(() => false)) await later.click();
  /** Adds advances to the saved room (as the engine would when p1 buys them); the page's safety poll shows them within a few seconds. */
  const acquire = async (ids: string[]) => {
    const current = (await repository.find(room.id))!, game = AlphaStateSchema.parse(current.game);
    give(game, ids, who);
    await repository.save({ ...current, version: current.version + 1, game: AlphaStateSchema.parse(game) }, current.version);
  };
  return { page, acquire, context };
}
const shot = async (page: Page, name: string, wait = 300) => { await page.waitForTimeout(wait); await page.screenshot({ path: `${evidence}/${name}.png` }); };
const openBoard = async (page: Page) => { await page.locator('.alpha-strip .alpha-resonance').click(); await expect(page.getByRole('dialog', { name: 'Tabuleiro da Civilização' })).toBeVisible(); };
const filled = (page: Page, count: number) => expect(page.locator('.alpha-big-sockets .alpha-socket.is-full')).toHaveCount(count, { timeout: 12000 });
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

test('Ressonância física: Teia vazia → 1 → 3/5 → 4/5 → quinto encaixe → Repercussão → resolução → marcas permanentes', async ({ browser }) => {
  const { page, acquire } = await serve(browser, baseState());
  // The Faixa shows a compact count; the click goes straight to the Tabuleiro with the tray beside the Teia.
  await expect(page.locator('.alpha-strip .alpha-res-count')).toHaveText('0/5');
  await openBoard(page);
  await expect(page.locator('.alpha-big-sockets .alpha-socket')).toHaveCount(5);
  await filled(page, 0);
  await shot(page, 'A-zero-avancos', 1700);

  await acquire(ADVANCES.slice(0, 1));
  await filled(page, 1);
  await shot(page, 'B0-um-avanco-cubo-pousando', 900);
  await shot(page, 'B-um-avanco-cubo', 2600);
  await expect(page.locator('.alpha-node.is-done .aoh-cube.is-placed')).toHaveCount(1);
  // The cube is the PLAYER's: every placed cube carries the same owner colour whatever its domain, and the echo in the tray is the same cube.
  const seats = async () => page.locator('.aoh-cube').evaluateAll(list => [...new Set(list.map(el => (el as HTMLElement).style.getPropertyValue('--seat')))]);
  expect((await seats()).length).toBe(1);

  await acquire(ADVANCES.slice(1, 3));
  await filled(page, 3);
  await shot(page, 'C0-tres-avancos', 3200);
  await expect(page.locator('.alpha-node.is-done .aoh-cube.is-placed')).toHaveCount(3);

  await acquire(ADVANCES.slice(3, 4));
  await filled(page, 4);
  await expect(page.locator('.alpha-big-sockets .alpha-socket.is-fifth')).toHaveCount(1);
  await expect(page.locator('.alpha-node.is-done .aoh-cube.is-placed')).toHaveCount(4);
  await shot(page, 'C-quatro-cubos-permanentes-na-teia', 100);
  await shot(page, 'D-ressonancia-4-de-5', 3000);
  await page.locator('.alpha-big-sockets').screenshot({ path: `${evidence}/D-bandeja-detalhe.png` });
  await page.locator('.alpha-web-grid').first().screenshot({ path: `${evidence}/C-teia-detalhe.png` });

  // The fifth advance: token lands, the courier flies to the fifth socket, the five respond, the Repercussão card appears.
  await acquire(ADVANCES.slice(4));
  await expect(page.locator('.alpha-big-sockets.is-complete')).toBeVisible({ timeout: 12000 });
  await shot(page, 'E-quinto-cubo-entrando', 900);
  await shot(page, 'E1-quinto-encaixe', 1400);
  await shot(page, 'E2-cinco-respondem', 1000);
  await expect(page.locator('.alpha-big-sockets .alpha-socket.is-full')).toHaveCount(5);
  const card = page.locator('.alpha-civ-choices .alpha-parchment');
  await expect(card).toContainText(/REPERCUSSÃO/);
  await shot(page, 'F-5-de-5-repercussao', 800);

  // Resolve through the real UI: the tray empties, the permanent marks stay on the Teia.
  await card.locator('.alpha-parchment-options button').first().click();
  await expect(page.locator('.alpha-big-sockets.is-complete')).toHaveCount(0, { timeout: 12000 });
  await shot(page, 'G0-limpando', 250);
  await shot(page, 'G-ressonancia-0-de-5', 1400);
  await expect(page.locator('.alpha-big-sockets .alpha-socket.is-full')).toHaveCount(0);
  await expect(page.locator('.alpha-node.is-done .aoh-cube.is-placed')).toHaveCount(5);
  expect((await seats()).length).toBe(1);
  await shot(page, 'H-cubos-permanentes-ainda-na-teia', 300);

  // Not colour alone: grayscale and a deuteranopia-like matrix keep every token readable by shape and glyph.
  await page.evaluate(() => { document.documentElement.style.filter = 'grayscale(1)'; });
  await shot(page, 'I-escala-de-cinza', 300);
  await page.evaluate(() => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.innerHTML = '<filter id="deut"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"/></filter>'; document.body.appendChild(svg);
    document.documentElement.style.filter = 'url(#deut)';
  });
  await shot(page, 'J-daltonismo-deuteranopia', 300);
});

test('Ressonância no celular (390×844): bandeja 3/5 sem rolagem horizontal', async ({ browser }) => {
  const mobile = await serve(browser, baseState(ADVANCES.slice(0, 3)), { width: 390, height: 844 });
  await openBoard(mobile.page);
  await expect(mobile.page.locator('.alpha-big-sockets .alpha-socket.is-full')).toHaveCount(3);
  expect(await mobile.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await shot(mobile.page, 'M-mobile-3-de-5', 600);
  await mobile.context.close();
});

test('O cubo é do jogador, não do domínio: Ana e Beto, cores diferentes, mesmos avanços e glifos', async ({ browser }) => {
  const colors: string[] = [];
  for (const who of ['p1', 'p2'] as const) {
    const state = baseState();
    give(state, ADVANCES.slice(0, 4), who);
    const { page, context } = await serve(browser, state, { width: 1280, height: 720 }, who);
    await openBoard(page);
    await expect(page.locator('.alpha-node.is-done .aoh-cube.is-placed')).toHaveCount(4);
    const seat = await page.locator('.aoh-cube').evaluateAll(list => [...new Set(list.map(el => (el as HTMLElement).style.getPropertyValue('--seat')))]);
    expect(seat.length).toBe(1);
    colors.push(seat[0]!);
    // Four different domains, four different glyphs, one owner colour.
    expect(await page.locator('.alpha-node.is-done .aoh-cube.is-placed').evaluateAll(list => new Set(list.map(el => (el as HTMLElement).dataset.glyph)).size)).toBe(4);
    await shot(page, `I-${who === 'p1' ? 'ana' : 'beto'}-cubos-4-de-5`, 2800);
    await context.close();
  }
  expect(colors[0]).not.toBe(colors[1]);
});
