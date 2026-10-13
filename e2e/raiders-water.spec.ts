import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaStateSchema, threatComposition, type AlphaState, type Threat } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, hexDistance } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { connectAlphaContext, muteTour } from './alpha-fixture.js';

// Saqueadores (Bando) and Piratas on the water (decision D3): the route the table DRAWS is the engine's own and a land Bando only crosses COAST (shallow, walkable), never SEA;
// a Pirata stays on SEA. The march itself (round by round) is proven in tests/ux-repro-bando-water.test.ts; this spec proves what the player SEES in the real app.
const origin = 'http://127.0.0.1:3107', evidence = 'docs/evidence/ux-board-water';
let counter = 0;
const tileOf = (state: AlphaState, id: string) => state.core.map.find(t => t.id === id)!;
const capital = (state: AlphaState) => tileOf(state, state.core.players[0]!.civilization.cities[0]!.hexId);
const ring = (state: AlphaState, from: number, to = from) => state.core.map.filter(t => { const d = hexDistance(capital(state), t); return d >= from && d <= to; });
/** Terrain edits keep the state valid: water carries no resource features and no owner. */
const setTerrain = (t: AlphaState['core']['map'][number], terrain: string) => { t.terrain = terrain as never; t.features = [] as never; t.ownerId = null as never; };
const isCity = (state: AlphaState, id: string) => state.core.players.some(p => p.civilization.cities.some(c => c.hexId === id));

function world() {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: `7a1b5c9a-3d2e-4f8a-9b7c-1a2b3c4d74${String(10 + counter++).padStart(2, '0')}`, seed: 173, preset: 'QUICK', worldPreset: 'MIXED', mapSize: 'STANDARD', players: [{ id: 'p1', name: 'Ana', civilization: 'aurelia' }, { id: 'p2', name: 'Beto', civilization: 'valgard' }] }));
  state.players.forEach(player => { player.knownHexIds = state.core.map.map(t => t.id); player.pendingChoices = []; player.ambitionsChosen = true; });
  state.threats = [];
  for (const region of state.regions) if (!region.revealedBy.includes('p1' as never)) region.revealedBy.push('p1' as never);   // an open table: the camp is seen, and so is its whole route
  const other = tileOf(state, state.core.players[1]!.civilization.cities[0]!.hexId);
  for (const t of state.core.map) if (hexDistance(other, t) === 2 && !isCity(state, t.id)) setTerrain(t, 'SEA');    // only the first city is reachable
  return state;
}
const threat = (kind: 'CAMP' | 'PIRATE', hex: string): Threat => ({ id: `${kind.toLowerCase()}-water`, kind, hexId: hex as never, homeHexId: hex as never, level: 1, status: 'MARCHING', composition: threatComposition(kind, 1, 0), createdRound: 1, lastActedRound: 0, rewardPaid: false, fresh: false, withdrawing: false, readyRound: 0 });

async function serve(browser: import('@playwright/test').Browser, state: AlphaState) {
  const repository = new InMemoryAlphaRepository(), sessions = new GuestSessions('agua-secret-'.repeat(4)), identity = sessions.issue(Date.now()), other = sessions.issue(Date.now());
  const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
  const room = AlphaRoomSchema.parse({ id: state.gameId, version: 0, contentVersion: 'v1.2', name: 'Água', joinCode: 'abcdefghijklmnopqrstuv', hostGuestId: identity.principal.guestId, preset: 'QUICK', seed: 173, seatLimit: 2, planningSeconds: 0, actionsPerRound: 5, worldPreset: 'MIXED', revealMap: false, deadline: null,
    seats: state.players.map((p, i) => ({ guestId: (i === 0 ? identity : other).principal.guestId, playerId: p.playerId, name: i === 0 ? 'Ana' : 'Beto', civilization: p.civilization, figureId: p.leader?.leaderId ?? null, ready: true })), game: AlphaStateSchema.parse(state) });
  await repository.create(room);
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await connectAlphaContext(context, http); await muteTour(context);
  await context.addCookies([{ name: 'aoh_alpha_session', value: identity.token, url: origin, httpOnly: true, sameSite: 'Strict' }]);
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  await page.goto(`/alpha?game=${room.id}`);
  await expect(page.locator('.world-map')).toBeVisible();
  const later = page.getByRole('button', { name: /Ver o mapa primeiro/ }); if (await later.isVisible().catch(() => false)) await later.click();
  return page;
}
/** What the client received (the projection the map draws from): each visible threat and the planned path it publishes; terrain comes from the seeded (authoritative) state. */
const seen = async (page: Page, state: AlphaState) => {
  const raw = await page.evaluate(async () => {
    const id = new URLSearchParams(location.search).get('game');
    const view = (await (await fetch(`/api/alpha?gameId=${id}`)).json()) as { value: { game: { threats: { id: string; hexId: string; intent?: { pathHexIds?: string[]; state: string } }[] } } };
    return view.value.game.threats.map(t => ({ id: t.id, hex: t.hexId, state: t.intent?.state, path: t.intent?.pathHexIds ?? [] }));
  });
  return raw.map(t => ({ ...t, at: tileOf(state, t.hex).terrain, steps: t.path.map(hex => ({ hex, terrain: tileOf(state, hex).terrain })) }));
};

test('Bando: the drawn route crosses the COAST bridge of a SEA moat and never a SEA hex', async ({ browser }) => {
  await mkdir(evidence, { recursive: true });
  const state = world();
  const cap = capital(state);
  const moat = ring(state, 2).filter(t => !isCity(state, t.id));
  const start = ring(state, 5).filter(t => !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain) && t.ownerId === null && !state.units.some(u => u.hexId === t.id)).sort((a, b) => (a.id < b.id ? -1 : 1))[0]!;
  const bridge = [...moat].sort((a, b) => hexDistance(a, start) - hexDistance(b, start) || (a.id < b.id ? -1 : 1))[0]!;
  for (const t of moat) setTerrain(t, t.id === bridge.id ? 'COAST' : 'SEA');
  state.threats.push(threat('CAMP', start.id));
  expect(cap).toBeDefined();
  const page = await serve(browser, state);
    const [bando] = await seen(page, state);
  expect(bando!.steps.length).toBeGreaterThan(0);                                                // the engine publishes the route it will walk
  expect(bando!.steps.some(step => step.hex === bridge.id && step.terrain === 'COAST')).toBe(true);
  for (const step of bando!.steps) expect(['SEA', 'UNKNOWN']).not.toContain(step.terrain);       // never over deep water
  await expect(page.locator('svg.world-map .alpha-threat-path')).toHaveCount(1);                // and the table draws that route
  await page.waitForTimeout(350); await page.screenshot({ path: `${evidence}/bando-coast-bridge.png` });
});

test('Bando with a closed SEA moat: no route is drawn (it waits), it is never shown crossing the water', async ({ browser }) => {
  const state = world();
  const moat = ring(state, 2).filter(t => !isCity(state, t.id));
  const start = ring(state, 5).filter(t => !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain) && t.ownerId === null && !state.units.some(u => u.hexId === t.id)).sort((a, b) => (a.id < b.id ? -1 : 1))[0]!;
  for (const t of moat) setTerrain(t, 'SEA');
  state.threats.push(threat('CAMP', start.id));
  const page = await serve(browser, state);
  const [bando] = await seen(page, state);
  expect(bando!.path).toEqual([]);
  expect(bando!.state).toBe('IDLE');
  await expect(page.locator('svg.world-map .alpha-threat-path')).toHaveCount(0);
  await page.waitForTimeout(350); await page.screenshot({ path: `${evidence}/bando-sea-moat.png` });
});

test('Pirata: sits on SEA and every hex of its drawn route is SEA (never COAST or land)', async ({ browser }) => {
  const state = world();
  const c = capital(state);
  for (const t of ring(state, 1, 3)) if (!isCity(state, t.id) && !state.units.some(u => u.hexId === t.id)) setTerrain(t, 'SEA');
  const start = ring(state, 2).filter(t => t.terrain === 'SEA')[0]!;   // inside the city's own sight
  state.threats.push(threat('PIRATE', start.id));
  expect(c).toBeDefined();
  const page = await serve(browser, state);
  const [pirate] = await seen(page, state);
  expect(pirate!.steps.length).toBeGreaterThan(0);                                              // it is heading for a port
  expect(pirate!.at).toBe('SEA');
  for (const step of pirate!.steps) expect(step.terrain).toBe('SEA');
  await page.waitForTimeout(350); await page.screenshot({ path: `${evidence}/pirate-sea.png` });
});
