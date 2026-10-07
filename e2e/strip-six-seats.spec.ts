import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaStateSchema } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { connectAlphaContext, muteTour } from './alpha-fixture.js';

// RC2 · the top strip with SIX seats: Era, round, Ressonância and phase must never be clipped (they were at 1280 px in the RC1 playtest).
const origin = 'http://127.0.0.1:3107', evidence = 'docs/evidence/rc2/strip';
const CIVS = ['valgard', 'kor', 'aurelia', 'thalos', 'orinth', 'saren'];

for (const width of [1280, 1366, 1440]) {
  test(`six seats at ${width}px: the strip keeps Era, round, Ressonância and phase whole`, async ({ browser }) => {
    await mkdir(evidence, { recursive: true });
    const state = beginAlphaPlanning(createAlphaGame({ gameId: `5a1b5c9a-3d2e-4f8a-9b7c-1a2b3c4d${String(width).padStart(4, '0')}`, seed: 9, preset: 'STANDARD', mapSize: 'WIDE', players: CIVS.map((civilization, i) => ({ id: `p${i + 1}`, name: ['Ana', 'Beto', 'Caio', 'Dani', 'Eva', 'Fabi'][i]!, civilization })) }));
    state.players.forEach(p => { p.pendingChoices = p.pendingChoices.filter(c => c.source !== 'PULSE'); p.ambitionsChosen = true; });
    const repository = new InMemoryAlphaRepository(), sessions = new GuestSessions('strip-six-secret-'.repeat(4)), identity = sessions.issue(Date.now());
    const http = new AlphaHttp(new AlphaGameService(repository), sessions, origin, false);
    const guests = CIVS.map((_, i) => (i === 0 ? identity : sessions.issue(Date.now())));
    const room = AlphaRoomSchema.parse({ id: state.gameId, version: 0, contentVersion: 'v1.2', name: 'Faixa', joinCode: 'abcdefghijklmnopqrstuv', hostGuestId: identity.principal.guestId, preset: 'STANDARD', seed: 9, seatLimit: 6, planningSeconds: 0, actionsPerRound: 5, worldPreset: 'MIXED', mapSize: 'WIDE', revealMap: false, deadline: null,
      seats: state.players.map((p, i) => ({ guestId: guests[i]!.principal.guestId, playerId: p.playerId, name: ['Ana', 'Beto', 'Caio', 'Dani', 'Eva', 'Fabi'][i]!, civilization: p.civilization, figureId: p.leader?.leaderId ?? null, ready: i > 0 })), game: AlphaStateSchema.parse(state) });
    await repository.create(room);
    const context = await browser.newContext({ viewport: { width, height: 720 } });
    await connectAlphaContext(context, http); await muteTour(context);
    await context.addCookies([{ name: 'aoh_alpha_session', value: identity.token, url: origin, httpOnly: true, sameSite: 'Strict' }]);
    const page = await context.newPage(); page.setDefaultTimeout(20000);
    await page.goto(`/alpha?game=${room.id}`);
    await expect(page.locator('.world-map')).toBeVisible();
    const later = page.getByRole('button', { name: /Ver o mapa primeiro/ }); if (await later.isVisible().catch(() => false)) await later.click();
    const when = page.locator('.alpha-strip-when');
    await expect(when).toContainText(/Era/);
    const box = await when.evaluate(el => ({ client: el.clientWidth, scroll: el.scrollWidth }));
    expect(box.scroll, `strip-when clipped: ${JSON.stringify(box)}`).toBeLessThanOrEqual(box.client + 1);
    await expect(page.locator('.alpha-strip-when .alpha-resonance')).toBeVisible();
    await expect(page.locator('.alpha-strip-when .aoh-tag')).toBeVisible();
    const strip = await page.locator('.alpha-strip').evaluate(el => ({ client: el.clientWidth, scroll: el.scrollWidth }));
    expect(strip.scroll).toBeLessThanOrEqual(strip.client + 1);
    await page.screenshot({ path: `${evidence}/strip-${width}.png`, clip: { x: 0, y: 0, width, height: 90 } });
    // The worst case: a strip alert ("Alimento curto") joins the strip. It gives way to a compact mark; Era, round, Ressonância and phase stay whole.
    await page.evaluate(() => { const chip = document.createElement('span'); chip.className = 'aoh-chip alpha-strip-alert'; chip.textContent = 'Alimento curto'; chip.title = 'Alimento curto: a produção não cobre o consumo'; document.querySelector('.alpha-strip')!.insertBefore(chip, document.querySelector('.alpha-strip-tools')); });
    const withAlert = await page.locator('.alpha-strip').evaluate(el => ({ client: el.clientWidth, scroll: el.scrollWidth, when: (el.querySelector('.alpha-strip-when') as HTMLElement).scrollWidth - (el.querySelector('.alpha-strip-when') as HTMLElement).clientWidth, parts: [...el.children].map(c => `${c.className.split(' ')[0]}:${Math.round(c.getBoundingClientRect().width)}`).join(' ') }));
    expect(withAlert.scroll, `strip with an alert overflows: ${JSON.stringify(withAlert)}`).toBeLessThanOrEqual(withAlert.client + 1);
    expect(withAlert.when).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `${evidence}/strip-${width}-alert.png`, clip: { x: 0, y: 0, width, height: 90 } });
  });
}
