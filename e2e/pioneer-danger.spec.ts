import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaStateSchema, REGION_TEMPLATES, type AlphaState } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, entryRotations, hexId, hexNeighbors, regionOpenFor } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { completeRound } from '../tests/alpha-rounds.js';
import { connectAlphaContext, muteTour, cloudNode, touchPiece, confirmMove } from './alpha-fixture.js';

// Pioneiro revealing a Region with Perigo (decision D2): the 50% stays, but the loss is announced BEFORE (warning in the Ficha) and AFTER (LOSSES line + honest message
// in Resultados; Crônica marker is covered by tests/ux-repro-pioneer-reveal.test.ts). The RNG counter that decides the draw is found with the real round pipeline, so the e2e
// does not depend on luck: one run loses the piece, the other keeps it.
const origin = 'http://127.0.0.1:3107', evidence = 'docs/evidence/ux-board-perigo';
const p1 = 'p1' as never;
const tileOf = (state: AlphaState, id: string) => state.core.map.find(t => t.id === id)!;

function situation() {
  const base = beginAlphaPlanning(createAlphaGame({ gameId: '7a1b5c9a-3d2e-4f8a-9b7c-1a2b3c4d7301', seed: 3, preset: 'QUICK', worldPreset: 'ARCHIPELAGO', mapSize: 'STANDARD', players: [{ id: 'p1', name: 'Ana', civilization: 'aurelia' }, { id: 'p2', name: 'Beto', civilization: 'valgard' }] }));
  base.players.forEach(player => { player.pendingChoices = player.pendingChoices.filter(choice => choice.source !== 'PULSE'); player.ambitionsChosen = true; });
  for (const region of base.regions) region.discovery = { kind: 'NONE', resolved: true, resolvedBy: null };
  // the first closed Region with water that has an entry hex reachable from a land neighbour with exactly one orientation (so the Ficha's default is unambiguous)
  for (const region of base.regions) {
    if (regionOpenFor(base, region, p1) || !region.hexIds.some(id => ['SEA', 'COAST'].includes(tileOf(base, id).terrain))) continue;
    for (const entry of region.hexIds) {
      const from = hexNeighbors(tileOf(base, entry)).map(hexId).find(id => !region.hexIds.includes(id as never) && base.core.map.some(t => t.id === id && !['SEA', 'UNKNOWN'].includes(t.terrain)));
      const rotations = entryRotations(base, region, entry, 'LAND');
      if (!from || rotations.length !== 1) continue;
      region.discovery = { kind: 'DANGER', resolved: false, resolvedBy: null };
      const pioneer = base.units.find(u => u.ownerId === p1 && u.kind === 'PIONEER')!;
      pioneer.hexId = from as never;
      const progress = base.players.find(p => p.playerId === p1)!;
      if (!progress.knownHexIds.includes(from as never)) progress.knownHexIds.push(from as never);
      return { base, pioneer: pioneer.id, from, entry, rotation: rotations[0]!, regionName: REGION_TEMPLATES.find(t => t.id === region.templateId)!.name };
    }
  }
  throw new Error('no closed watery Region with a single orientation in this world');
}
/** The first RNG counter for which the whole round (not just the move) loses / keeps the Pioneiro. */
function counterFor(plan: ReturnType<typeof situation>, lose: boolean): number {
  for (let counter = 0; counter < 32; counter++) {
    const state = structuredClone(plan.base); state.privateRng.counter = counter;
    state.players.find(p => p.playerId === p1)!.orders = [{ id: 'probe', type: 'MOVE', unitIds: [plan.pioneer], path: [plan.entry], rotation: plan.rotation } as never];
    const after = completeRound(state);
    if (after.units.some(u => u.id === plan.pioneer) !== lose) return counter;
  }
  throw new Error(`no RNG counter ${lose ? 'loses' : 'keeps'} the Pioneiro`);
}

async function serve(browser: import('@playwright/test').Browser, state: AlphaState) {
  const repository = new InMemoryAlphaRepository(), sessions = new GuestSessions('perigo-secret-'.repeat(4)), identity = sessions.issue(Date.now()), other = sessions.issue(Date.now());
  const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
  const room = AlphaRoomSchema.parse({ id: state.gameId, version: 0, contentVersion: 'v1.2', name: 'Perigo', joinCode: 'abcdefghijklmnopqrstuv', hostGuestId: identity.principal.guestId, preset: 'QUICK', seed: 3, seatLimit: 2, planningSeconds: 0, actionsPerRound: 5, worldPreset: 'ARCHIPELAGO', revealMap: false, deadline: null,
    seats: state.players.map((p, i) => ({ guestId: (i === 0 ? identity : other).principal.guestId, playerId: p.playerId, name: i === 0 ? 'Ana' : 'Beto', civilization: p.civilization, figureId: p.leader?.leaderId ?? null, ready: true })), game: AlphaStateSchema.parse(state) });
  await repository.create(room);
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await connectAlphaContext(context, http); await muteTour(context);
  await context.addCookies([{ name: 'aoh_alpha_session', value: identity.token, url: origin, httpOnly: true, sameSite: 'Strict' }]);
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  await page.goto(`/alpha?game=${room.id}`);
  await expect(page.locator('.world-map')).toBeVisible();
  const later = page.getByRole('button', { name: /Ver o mapa primeiro/ }); if (await later.isVisible().catch(() => false)) await later.click();
  const readyOther = async () => {
    const read = await http.handle(new Request(`${origin}/api/alpha?gameId=${room.id}`, { headers: { Cookie: `aoh_alpha_session=${other.token}` } }));
    const view = (await read.json()) as { value: { game: { version: number } } };
    return http.handle(new Request(`${origin}/api/alpha`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: `aoh_alpha_session=${other.token}` }, body: JSON.stringify({ operation: 'command', gameId: room.id, payload: { type: 'READY', expectedVersion: view.value.game.version } }) }));
  };
  return { page, repository, room, readyOther };
}

for (const lose of [true, false]) {
  test(`Pioneiro enters a closed Region: warned before, ${lose ? 'lost to the Perigo and the table says so' : 'spared and the Region is revealed'}`, async ({ browser }) => {
    await mkdir(evidence, { recursive: true });
    const plan = situation();
    plan.base.privateRng.counter = counterFor(plan, lose);
    const { page, repository, room, readyOther } = await serve(browser, plan.base);
    // Under load the first touch can land while the map is still settling: retry until the cloud offers Mover.
    for (let attempt = 0; attempt < 3 && !(await cloudNode(page, 'move').isVisible().catch(() => false)); attempt++) {
      await touchPiece(page, `g.hex[data-hex="${plan.from}"]`);
      await cloudNode(page, 'move').waitFor({ timeout: 5000 }).catch(() => undefined);
    }
    await cloudNode(page, 'move').click();
    const target = page.locator(`svg.world-map g.hex[data-hex="${plan.entry}"]`);
    await expect(target).toHaveClass(/target/);                                           // the closed Region is lit as a destination
    await target.click();
    const ficha = page.locator('.ctx-ficha');
    await expect(ficha.locator('.ctx-legs li')).toHaveCount(1);
    await expect(ficha).toContainText('Perigo possível');                                 // BEFORE: the explicit warning (50%), without revealing what the Region holds
    await expect(ficha.locator('.ctx-go')).toBeEnabled();
    await page.waitForTimeout(350); await page.screenshot({ path: `${evidence}/${lose ? 'lost' : 'spared'}-1-warning.png` });
    await confirmMove(page);
    await expect.poll(async () => (await repository.find(room.id))!.game!.players[0]!.orders.some(o => o.type === 'MOVE')).toBe(true);
    await page.getByRole('button', { name: /Confirmar planejamento/ }).click();
    const anyway = page.getByRole('button', { name: /Confirmar mesmo assim/ });
    await anyway.waitFor({ timeout: 3000 }).then(() => anyway.click()).catch(() => undefined);
    expect((await readyOther()).status).toBe(200);
    const result = page.locator('.alpha-resolution-phase');
    await expect(result).toBeVisible({ timeout: 40000 });                                 // AFTER: the Resultados overlay
    const stored = (await repository.find(room.id))!.game!;
    const alive = stored.units.some(u => u.id === plan.pioneer);
    expect(alive).toBe(!lose);
    if (lose) {
      await expect(result).toContainText(`Perigo: a peça Pioneiro foi perdida ao entrar em ${plan.regionName}.`);
      await expect(result).not.toContainText('Região revelada');
      expect(stored.resolutionEvents.some(e => e.type === 'LOSSES' && e.unitIds.includes(plan.pioneer))).toBe(true);
    } else {
      await expect(result).not.toContainText('Perigo: a peça');
      expect(stored.units.find(u => u.id === plan.pioneer)!.hexId).toBe(plan.entry);
    }
    await page.waitForTimeout(350); await page.screenshot({ path: `${evidence}/${lose ? 'lost' : 'spared'}-2-result.png` });
  });
}
