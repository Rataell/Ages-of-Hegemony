import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaStateSchema, PlayerIdSchema, threatComposition, type AlphaState, type Threat } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, hexId, hexNeighbors } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { connectAlphaContext, muteTour } from './alpha-fixture.js';

// Visual hierarchy (docs/product/ux-board-layering.md): the HARD CASES on the real Mesa. Hand-built state through the real HTTP boundary; the check reads the DOM boxes of
// every priority illustration and every marker and fails when two of them overlap, anywhere on the map (so a name or a seal also never covers a neighbour's miniature).
const origin = 'http://127.0.0.1:3107', evidence = 'docs/evidence/ux-board-layout';
const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
const unit = (id: string, ownerId: typeof p1, kind: string, hex: string) => ({ id, ownerId, kind, hexId: hex, recruitedRound: 1, carrierId: null }) as never;

function hardState(): AlphaState {
  const state = createAlphaGame({ gameId: '7a1b5c9a-3d2e-4f8a-9b7c-1a2b3c4d7101', seed: 23, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana', civilization: 'aurelia' }, { id: 'p2', name: 'Beto', civilization: 'valgard' }] });
  const tile = (id: string) => state.core.map.find(t => t.id === id)!;
  const cap = tile(state.core.players[0]!.civilization.cities[0]!.hexId);
  const ring = hexNeighbors(cap).map(hexId).map(id => state.core.map.find(t => t.id === id)).filter((t): t is NonNullable<typeof t> => t !== undefined && !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain));
  const [A, B, C, D] = ring;
  expect(ring.length).toBeGreaterThanOrEqual(4);
  state.units.push(unit('hc-1', p1, 'INFANTRY', cap.id), unit('hc-2', p1, 'GUARD', cap.id), unit('hc-3', p1, 'CAVALRY', cap.id), unit('hc-4', p1, 'RANGED', cap.id));   // city with four classes
  cap.features = ['RIVER', 'FERTILE'];                                                                                  // city with resource seals
  state.roads = [A!.id, D!.id];                                                                                        // roads reaching the city
  state.units.push(unit('hc-5', p1, 'INFANTRY', A!.id), unit('hc-6', p1, 'CAVALRY', A!.id), unit('hc-7', p2, 'RANGED', B!.id), unit('hc-8', p2, 'GUARD', B!.id));   // two armies side by side
  D!.terrain = 'HILLS'; D!.ownerId = p1; D!.controllerCityId = state.core.players[0]!.civilization.cities[0]!.id as never; D!.improvement = 'MINE';                                                                       // a mine under a piece
  state.units.push(unit('hc-9', p1, 'INFANTRY', D!.id));
  const camp: Threat = { id: 'camp-hc', kind: 'CAMP', hexId: C!.id as never, homeHexId: C!.id as never, level: 3, status: 'CAMPED', composition: threatComposition('CAMP', 3, 0), createdRound: 1, lastActedRound: 0, rewardPaid: false, fresh: true, withdrawing: false, readyRound: 0 };
  state.threats = [camp];
  state.units.push(unit('hc-10', p1, 'INFANTRY', C!.id), unit('hc-11', p1, 'RANGED', C!.id));                          // own army inside the camp hex
  const coast = state.core.map.find(t => t.terrain === 'COAST' && !state.units.some(u => u.hexId === t.id) && hexNeighbors(cap).map(hexId).includes(t.id) === false);
  if (coast) { coast.features = ['FISH']; state.units.push(unit('hc-12', p1, 'FLEET', coast.id)); }                      // a fleet over a fishing resource
  const next = beginAlphaPlanning(state);
  next.players.forEach(player => { player.pendingChoices = player.pendingChoices.filter(choice => choice.source !== 'PULSE'); player.ambitionsChosen = true; player.knownHexIds = next.core.map.map(t => t.id); });
  AlphaStateSchema.parse(next);
  return next;
}

async function open(browser: import('@playwright/test').Browser, viewport: { width: number; height: number }) {
  const state = hardState(), repository = new InMemoryAlphaRepository(), sessions = new GuestSessions('layout-secret-'.repeat(5)), identity = sessions.issue(Date.now()), other = sessions.issue(Date.now());
  const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
  const room = AlphaRoomSchema.parse({ id: state.gameId, version: 0, contentVersion: 'v1.2', name: 'Layout', joinCode: 'abcdefghijklmnopqrstuv', hostGuestId: identity.principal.guestId, preset: 'QUICK', seed: 23, seatLimit: 2, planningSeconds: 0, actionsPerRound: 5, worldPreset: 'MIXED', revealMap: false, deadline: null,
    seats: state.players.map((p, i) => ({ guestId: (i === 0 ? identity : other).principal.guestId, playerId: p.playerId, name: i === 0 ? 'Ana' : 'Beto', civilization: p.civilization, figureId: p.leader?.leaderId ?? null, ready: true })), game: state });
  await repository.create(room);
  const context = await browser.newContext({ viewport, ...(viewport.width < 700 ? { hasTouch: true, isMobile: true } : {}) });
  await connectAlphaContext(context, http); await muteTour(context);
  await context.addCookies([{ name: 'aoh_alpha_session', value: identity.token, url: origin, httpOnly: true, sameSite: 'Strict' }]);
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  await page.goto(`/alpha?game=${room.id}`);
  await expect(page.locator('.world-map')).toBeVisible();
  const later = page.getByRole('button', { name: /Ver o mapa primeiro/ }); if (await later.isVisible().catch(() => false)) await later.click();
  await page.waitForTimeout(600);
  return page;
}

/** Every priority illustration and marker on the map, as screen boxes; returns the pairs that overlap by more than `tol` px in both axes. */
async function collisions(page: Page, tol = 1.5) {
  return page.evaluate(tolerance => {
    const sel = ['.art-city', '.art-piece', '.threat-art [data-class]', '.threat-tent', '.alpha-people', '.art-level-seal', '.art-mood', '.worked-seal', '.hex-seal', '.art-label'];
    const nodes = [...document.querySelectorAll<SVGGraphicsElement>(sel.map(s => `.world-map ${s}`).join(','))];
    const items = nodes.map(el => { const b = el.getBoundingClientRect(); return { fig: el.matches('.art-piece, [data-class]'), group: el.closest('.art-stack') ?? el.closest('.threat-art'), name: el.getAttribute('class')?.split(' ')[0] ?? el.getAttribute('data-class') ?? el.tagName, hex: el.closest('[data-hex]')?.getAttribute('data-hex') ?? '-', x: b.left, y: b.top, w: b.width, h: b.height }; }).filter(i => i.w > 0 && i.h > 0);
    const bad: string[] = [];
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const a = items[i]!, b = items[j]!; if (a.fig && b.fig && a.group && a.group === b.group) continue;   // figures of one stack overlap by design (0.8 step)
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox > tolerance && oy > tolerance) bad.push(`${a.name}@${a.hex} x ${b.name}@${b.hex} (${ox.toFixed(1)}x${oy.toFixed(1)})`);
    }
    return { count: items.length, bad };
  }, tol);
}

const sizes = [{ name: '1440x900', width: 1440, height: 900 }, { name: '1280x720', width: 1280, height: 720 }, { name: '390x844', width: 390, height: 844 }];
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });
for (const size of sizes) {
  test(`hard cases at ${size.name}: no priority illustration or marker overlaps another`, async ({ browser }) => {
    const page = await open(browser, size);
    const probe = await collisions(page);
    await page.screenshot({ path: `${evidence}/${size.name}.png` });
    expect(probe.count).toBeGreaterThan(6);
    expect(probe.bad, probe.bad.join('\n')).toEqual([]);
    // Close up (Focar) and the other zoom limits: the boxes scale with the map, so the composition must hold at every zoom.
    await page.getByRole('button', { name: 'Focar' }).click();
    await page.waitForTimeout(700);
    const close = await collisions(page);
    await page.screenshot({ path: `${evidence}/${size.name}-focar.png` });
    expect(close.bad, close.bad.join('\n')).toEqual([]);
    for (let i = 0; i < 3; i++) { await page.locator('button:text-is("+")').first().click({ force: true }); await page.waitForTimeout(250); }
    const zoomed = await collisions(page);
    await page.screenshot({ path: `${evidence}/${size.name}-zoom.png` });
    expect(zoomed.bad, zoomed.bad.join('\n')).toEqual([]);
  });
}
