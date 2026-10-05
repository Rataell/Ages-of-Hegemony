import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaStateSchema, type AlphaState } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, hexNeighbors, spawnThreat } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { connectAlphaContext, muteTour } from './alpha-fixture.js';

// SEEDED evidence (not played naturally): states built with the engine and served through the real HTTP boundary, only to validate
// how the UI looks. The natural runs of scripts/alpha-ui-playtest.mjs are in docs/evidence/v51b-ui-playtest/run-*; this folder is labelled SEEDED.
const origin = 'http://127.0.0.1:3107', evidence = 'docs/evidence/v51b-ui-playtest/seeded';
const p1 = 'p1' as never;
let counter = 0;

function base(): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: `7a1b5c9a-3d2e-4f8a-9b7c-1a2b3c4d5e${String(10 + counter++).padStart(2, '0')}`, seed: 23, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana', civilization: 'aurelia' }, { id: 'p2', name: 'Beto', civilization: 'valgard' }] }));
  state.players.forEach(player => { player.pendingChoices = player.pendingChoices.filter(choice => choice.source !== 'PULSE'); });
  return state;
}
const capitalOf = (state: AlphaState) => state.core.players[0]!.civilization.cities[0]!;
const tileNear = (state: AlphaState, hexId: string, avoidUnits = true) => {
  const tile = state.core.map.find(t => t.id === hexId)!;
  return hexNeighbors(tile).map(point => state.core.map.find(t => t.q === point.q && t.r === point.r)).find(t => t && !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(t.terrain) && (!avoidUnits || !state.units.some(u => u.hexId === t.id)))!;
};

async function serve(browser: import('@playwright/test').Browser, state: AlphaState, viewport = { width: 1366, height: 768 }) {
  const repository = new InMemoryAlphaRepository(), sessions = new GuestSessions('v51b-seeded-secret-'.repeat(4)), identity = sessions.issue(Date.now()), other = sessions.issue(Date.now());
  const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
  const room = AlphaRoomSchema.parse({ id: state.gameId, version: 0, name: 'Mesa semeada', joinCode: 'abcdefghijklmnopqrstuv', hostGuestId: identity.principal.guestId, preset: 'QUICK', seed: 23, seatLimit: 2, planningSeconds: 0, deadline: null,
    seats: state.players.map((p, i) => ({ guestId: (i === 0 ? identity : other).principal.guestId, playerId: p.playerId, name: i === 0 ? 'Ana' : 'Beto', civilization: p.civilization, ready: true })), game: AlphaStateSchema.parse(state) });
  await repository.create(room);
  const context = await browser.newContext({ viewport });
  await connectAlphaContext(context, http); await muteTour(context);
  await context.addCookies([{ name: 'aoh_alpha_session', value: identity.token, url: origin, httpOnly: true, sameSite: 'Strict' }]);
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  await page.goto(`/alpha?game=${room.id}`);
  await expect(page.locator('.world-map')).toBeVisible();
  const ambitions = page.getByRole('button', { name: /Ver o mapa primeiro/ }); if (await ambitions.isVisible().catch(() => false)) await ambitions.click();
  return { page, repository, room };
}
const shot = (page: Page, name: string) => page.screenshot({ path: `${evidence}/SEEDED-${name}.png` });

test('SEEDED: Acampamento before activation, Bando marching, Pirata on the map', async ({ browser }) => {
  await mkdir(evidence, { recursive: true });
  const state = base();
  const capital = capitalOf(state);
  const near = tileNear(state, capital.hexId);
  const camp = spawnThreat(state, 'CAMP');
  if (camp) { camp.hexId = near.id as never; camp.homeHexId = near.id as never; camp.level = 2; camp.status = 'CAMPED'; camp.composition = [{ kind: 'INFANTRY', count: 3 }, { kind: 'RANGED', count: 1 }]; }
  let { page } = await serve(browser, state);
  await shot(page, 'acampamento-antes-de-ativar');
  // the same camp, marching
  const marching = base();
  const away = tileNear(marching, capitalOf(marching).hexId);
  const band = spawnThreat(marching, 'CAMP');
  if (band) { band.hexId = away.id as never; band.homeHexId = away.id as never; band.level = 2; band.status = 'MARCHING'; band.composition = [{ kind: 'INFANTRY', count: 3 }, { kind: 'RANGED', count: 1 }]; }
  ({ page } = await serve(browser, marching));
  await shot(page, 'bando-em-marcha');
  // pirate
  const sea = base();
  const pirate = spawnThreat(sea, 'PIRATE');
  expect(pirate).not.toBeNull();
  // put it in sight of the capital, as the player would first see it
  const water = hexNeighbors(sea.core.map.find(t => t.id === capitalOf(sea).hexId)!).map(point => sea.core.map.find(t => t.q === point.q && t.r === point.r)).find(t => t?.terrain === 'SEA' || t?.terrain === 'COAST');
  if (pirate && water) { pirate.hexId = water.id as never; pirate.homeHexId = water.id as never; pirate.status = 'MARCHING'; }
  ({ page } = await serve(browser, sea));
  await shot(page, 'pirata-no-mar');
});

test('SEEDED: city N6 and N7, and a devastated city with degraded Capacidade', async ({ browser }) => {
  await mkdir(evidence, { recursive: true });
  const n6 = base();
  const meta6 = n6.cities.find(c => c.currentOwnerId === p1)!;
  meta6.level = 'METROPOLIS';
  const city6 = capitalOf(n6); city6.population = 15; city6.workers = { producers: 7, artisans: 3, merchants: 2, scholars: 2, soldiers: 1, unassigned: 0 };
  let { page } = await serve(browser, n6);
  await shot(page, 'cidade-n6');
  const n7 = base();
  const meta7 = n7.cities.find(c => c.currentOwnerId === p1)!;
  meta7.level = 'IMPERIAL_METROPOLIS';
  const city7 = capitalOf(n7); city7.population = 19; city7.workers = { producers: 9, artisans: 3, merchants: 3, scholars: 3, soldiers: 1, unassigned: 0 };
  ({ page } = await serve(browser, n7));
  await shot(page, 'cidade-n7');
  const degraded = base();
  const metaD = degraded.cities.find(c => c.currentOwnerId === p1)!;
  metaD.level = 'METROPOLIS';
  const cityD = capitalOf(degraded); cityD.population = 7; cityD.workers = { producers: 4, artisans: 1, merchants: 1, scholars: 1, soldiers: 0, unassigned: 0 };
  ({ page } = await serve(browser, degraded));
  await expect(page.locator('.alpha-city-seal').first()).toContainText(/N6/);
  await shot(page, 'cidade-capacidade-degradada');
});
