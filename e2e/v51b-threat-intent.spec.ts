import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaStateSchema, type AlphaState } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, hexDistance, landTarget, spawnThreat } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { connectAlphaContext, muteTour } from './alpha-fixture.js';

// SEEDED evidence for V51B-05: the Bando's target is the engine's own intention, drawn by the map exactly as received.
// Three situations: target inside the player's vision, target beyond the fog, and a RECÉM-SURGIDO Acampamento (D-1).
const origin = 'http://127.0.0.1:3107', evidence = 'docs/evidence/v51b-d1-d3/ameaca-alvo';
let counter = 0;
const base = (): AlphaState => {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: `7a1b5c9a-3d2e-4f8a-9b7c-1a2b3c4d5f${String(10 + counter++).padStart(2, '0')}`, seed: 23, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana', civilization: 'aurelia' }, { id: 'p2', name: 'Beto', civilization: 'valgard' }] }));
  state.players.forEach(player => { player.pendingChoices = player.pendingChoices.filter(choice => choice.source !== 'PULSE'); });
  return state;
};
const capitalOf = (state: AlphaState, index: number) => state.core.players[index]!.civilization.cities[0]!;
const land = (state: AlphaState) => state.core.map.filter(tile => !['SEA', 'UNKNOWN', 'MOUNTAINS'].includes(tile.terrain));

/** The Inspector is "Detalhes": closed until asked for. */
const details = async (page: Page) => { if (!(await page.locator('.alpha-inspector').isVisible().catch(() => false))) await page.getByRole('button', { name: 'Detalhes', exact: true }).click(); };
async function serve(browser: import('@playwright/test').Browser, state: AlphaState) {
  const repository = new InMemoryAlphaRepository(), sessions = new GuestSessions('v51b-intent-secret-'.repeat(4)), identity = sessions.issue(Date.now()), other = sessions.issue(Date.now());
  const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
  const room = AlphaRoomSchema.parse({ id: state.gameId, version: 0, name: 'Mesa semeada', joinCode: 'abcdefghijklmnopqrstuw', hostGuestId: identity.principal.guestId, preset: 'QUICK', seed: 23, seatLimit: 2, planningSeconds: 0, deadline: null,
    seats: state.players.map((p, i) => ({ guestId: (i === 0 ? identity : other).principal.guestId, playerId: p.playerId, name: i === 0 ? 'Ana' : 'Beto', civilization: p.civilization, ready: true })), game: AlphaStateSchema.parse(state) });
  await repository.create(room);
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await connectAlphaContext(context, http); await muteTour(context);
  await context.addCookies([{ name: 'aoh_alpha_session', value: identity.token, url: origin, httpOnly: true, sameSite: 'Strict' }]);
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  await page.goto(`/alpha?game=${room.id}`);
  await expect(page.locator('.world-map')).toBeVisible();
  const ambitions = page.getByRole('button', { name: /Ver o mapa primeiro/ }); if (await ambitions.isVisible().catch(() => false)) await ambitions.click();
  return page;
}
const select = async (page: Page, hexId: string) => {
  await page.locator(`svg.world-map g.hex[aria-label$=" ${hexId}"], svg.world-map g.hex[aria-label*=" ${hexId},"]`).first().click({ force: true });
  const territory = page.getByRole('button', { name: 'Território', exact: true }); if (await territory.isVisible().catch(() => false)) await territory.click();
};
const shot = (page: Page, name: string) => page.screenshot({ path: `${evidence}/SEEDED-${name}.png` });

test('SEEDED: a Bando marching on the viewer\'s city shows its authoritative target; the target of a Bando on the open table is public', async ({ browser }) => {
  await mkdir(evidence, { recursive: true });
  // 1. target inside vision: a Bando 3 hexes from Ana's capital, marching on it; Ana sees the line and the target.
  const near = base(), home = capitalOf(near, 0), homeTile = near.core.map.find(t => t.id === home.hexId)!;
  const start = land(near).filter(t => hexDistance(homeTile, t) === 3 && !near.units.some(u => u.hexId === t.id)).find(t => {
    const probe = spawnThreat(near, 'CAMP')!; probe.hexId = t.id as never; probe.status = 'MARCHING'; const ok = landTarget(near, probe)?.id === home.id; near.threats = near.threats.filter(x => x.id !== probe.id); return ok;
  })!;
  const band = spawnThreat(near, 'CAMP')!; band.hexId = start.id as never; band.homeHexId = start.id as never; band.status = 'MARCHING'; band.fresh = false; band.level = 2;
  band.composition = [{ kind: 'INFANTRY', count: 3 }, { kind: 'RANGED', count: 1 }];
  near.regions.find(region => region.hexIds.includes(start.id as never))!.revealedBy.push(near.players[0]!.playerId); // the Region was explored: the Bando is on the table
  let page = await serve(browser, near);
  await select(page, start.id);
  await details(page); await expect(page.locator('.alpha-people-panel.is-raid')).toContainText('Alvo: cidade');
  await expect(page.locator('.alpha-threat-intent.is-target')).toHaveCount(1);
  await shot(page, '1-bando-alvo-visivel');

  // 2. the target is a rival's Pátria: public as well (every Pátria is open), so the line runs to Beto's capital.
  const far = base(), rival = capitalOf(far, 1), rivalTile = far.core.map.find(t => t.id === rival.hexId)!;
  const spot = land(far).filter(t => hexDistance(rivalTile, t) === 3 && !far.units.some(u => u.hexId === t.id)).find(t => {
    const probe = spawnThreat(far, 'CAMP')!; probe.hexId = t.id as never; probe.status = 'MARCHING'; const ok = landTarget(far, probe)?.id === rival.id; far.threats = far.threats.filter(x => x.id !== probe.id); return ok;
  })!;
  const wild = spawnThreat(far, 'CAMP')!; wild.hexId = spot.id as never; wild.homeHexId = spot.id as never; wild.status = 'MARCHING'; wild.fresh = false;
  far.regions.find(region => region.hexIds.includes(spot.id as never))!.revealedBy.push(far.players[0]!.playerId);
  page = await serve(browser, far);
  await select(page, spot.id);
  await details(page); await expect(page.locator('.alpha-people-panel.is-raid')).toContainText('Alvo: cidade');
  await expect(page.locator('.alpha-threat-intent.is-target')).toHaveCount(1);
  await shot(page, '2-bando-alvo-patria-rival');

  // 3. RECÉM-SURGIDO: a fresh Acampamento in sight says it cannot leave yet.
  const fresh = base(), keep = capitalOf(fresh, 0), keepTile = fresh.core.map.find(t => t.id === keep.hexId)!;
  const site = land(fresh).find(t => hexDistance(keepTile, t) === 2 && t.ownerId === null && !fresh.units.some(u => u.hexId === t.id))!;
  const camp = spawnThreat(fresh, 'CAMP')!; camp.hexId = site.id as never; camp.homeHexId = site.id as never; camp.fresh = true;
  fresh.regions.find(region => region.hexIds.includes(site.id as never))!.revealedBy.push(fresh.players[0]!.playerId);
  page = await serve(browser, fresh);
  await select(page, site.id);
  await details(page); await expect(page.locator('.alpha-people-panel.is-raid')).toContainText('Recém-surgido');
  await shot(page, '3-acampamento-recem-surgido');
});
