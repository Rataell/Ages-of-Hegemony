import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { connectAlphaContext, muteTour } from './alpha-fixture.js';

const shots = process.env.UX_SHOTS_DIR ?? 'docs/evidence/alpha-ux-round-1/after';
const origin = 'http://127.0.0.1:3107';

test('lobby invites, creation options, leaving and returning, and the atlas at the start of a match', async ({ browser }) => {
  test.setTimeout(120000);
  const repository = new InMemoryAlphaRepository();
  const http = new AlphaHttp(new AlphaGameService(repository), new GuestSessions('ux-round-1-secret-'.repeat(4)), origin, false);
  const a = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const b = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await connectAlphaContext(a, http);await muteTour(a); await connectAlphaContext(b, http);await muteTour(b);
  const pa = await a.newPage(), pb = await b.newPage(); pa.setDefaultTimeout(15000); pb.setDefaultTimeout(15000);
  await mkdir(shots, { recursive: true });
  try {
    // Creation: only schema-valid deadlines, and the world preset travels with the create request.
    await pa.goto('/alpha'); await pa.getByLabel('Seu nome', { exact: true }).fill('Ana');
    await pa.getByText('Opções da mesa', { exact: true }).click(); // advanced table options are folded away
    const options = async (label: string) => pa.getByLabel(label, { exact: false }).first().locator('option').allTextContents();
    expect(await options('Prazo por fase')).toEqual(['Sem prazo', '3 minutos', '5 minutos', '8 minutos', '1 hora', '4 horas', '8 horas']);
    expect(await options('Mundo')).toEqual(['Continental', 'Arquipélago', 'Mar Interior', 'Misto']);
    await pa.getByLabel('Mundo', { exact: false }).first().selectOption('INLAND_SEA');
    await pa.getByLabel('Prazo por fase', { exact: false }).selectOption('480');
    const created = pa.waitForRequest(request => request.url().includes('/api/alpha') && request.method() === 'POST');
    await pa.getByRole('button', { name: 'Criar partida', exact: true }).click();
    const sent = (await created).postDataJSON() as { payload: { worldPreset: string; planningSeconds: number } };
    expect(sent.payload).toMatchObject({ worldPreset: 'INLAND_SEA', planningSeconds: 480 });
    await expect(pa.getByRole('heading', { name: 'Seu tabuleiro de civilização' })).toBeVisible();
    const code = await pa.locator('.alpha-lobby-heading code').innerText();
    const roomId = new URL(pa.url()).searchParams.get('game')!;
    expect(await repository.find(roomId)).toMatchObject({ worldPreset: 'INLAND_SEA', planningSeconds: 480 });

    // Invites: code and link are separate actions with their own confirmation.
    await pa.getByRole('button', { name: 'Copiar código', exact: true }).click();
    await expect(pa.getByRole('status').filter({ hasText: 'Código copiado' })).toBeVisible();
    expect(await pa.evaluate(() => navigator.clipboard.readText())).toBe(code);
    await pa.getByRole('button', { name: 'Copiar link', exact: true }).click();
    await expect(pa.getByRole('status').filter({ hasText: 'Link copiado' })).toBeVisible();
    expect(await pa.evaluate(() => navigator.clipboard.readText())).toBe(`${origin}/alpha/join/${code}`);
    await pa.screenshot({ path: `${shots}/lobby-invites.png` });

    // Manual entry by code still works, and leaving the lobby is client-only.
    await pb.goto('/alpha'); await pb.getByLabel('Seu nome', { exact: true }).fill('Beto');
    await pb.getByLabel('Código de convite', { exact: true }).fill(code); await pb.getByRole('button', { name: 'Entrar na partida', exact: true }).click();
    await expect(pb.getByRole('heading', { name: 'Seu tabuleiro de civilização' })).toBeVisible();
    const seated = (await repository.find(roomId))!;
    expect(seated.seats.map(seat => seat.name)).toEqual(['Ana', 'Beto']);
    await pb.getByRole('button', { name: 'Sair da partida', exact: true }).click();
    await pb.getByRole('button', { name: 'Sair e poder voltar', exact: true }).click();
    await expect(pb.getByRole('heading', { name: 'Preparar uma mesa' })).toBeVisible();
    expect(new URL(pb.url()).search).toBe('');
    // Leaving only closes this session: the room is remembered and flagged as left (the entry offers "Voltar à minha partida").
    expect(await pb.evaluate(() => localStorage.getItem('aoh-alpha-left'))).toBe('1');
    const afterLeave = (await repository.find(roomId))!;
    expect(afterLeave.version).toBe(seated.version); expect(afterLeave.seats).toEqual(seated.seats);
    await pb.getByLabel('Seu nome', { exact: true }).fill('Beto');
    await pb.getByLabel('Código de convite', { exact: true }).fill(code); await pb.getByRole('button', { name: 'Entrar na partida', exact: true }).click();
    await expect(pb.getByRole('heading', { name: 'Seu tabuleiro de civilização' })).toBeVisible();
    expect((await repository.find(roomId))!.seats).toHaveLength(2);

    // Regression: two players reach a running match.
    await pa.getByRole('button').filter({ has: pa.getByRole('heading', { name: 'Aurélia', exact: true }) }).click(); await pa.getByRole('button', { name: 'Estou pronto', exact: true }).click();
    await pb.getByRole('button').filter({ has: pb.getByRole('heading', { name: 'Valgard', exact: true }) }).click(); await pb.getByRole('button', { name: 'Estou pronto', exact: true }).click();
    await expect(pa.getByRole('button', { name: 'Iniciar partida', exact: true })).toBeEnabled();
    await pa.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
    await expect(pa.locator('.alpha-player-board h1')).toHaveText('Aurélia');
    await expect(pb.locator('.alpha-player-board h1')).toHaveText('Valgard');
    expect((await repository.find(roomId))!.game!.rules.worldPreset).toBe('INLAND_SEA');

    // The atlas draws exactly the projected tiles and they fill the stage.
    const projected = await new AlphaGameService(repository).read({ guestId: seated.seats[0]!.guestId }, roomId, Date.now());
    if (!projected.ok) throw new Error(projected.error.message);
    const game = projected.value.game!;
    const expected = game.view.visibleTerritory.length + game.knownTerritory.length + game.board.filter(region => region.closed).flatMap(region => region.hexIds).filter(id => !game.view.visibleTerritory.some(tile => tile.id === id)).length;
    await expect(pa.locator('svg.world-map g.hex')).toHaveCount(expected);
    // The first-round ambitions dialog may be postponed to look at the atlas first.
    await pa.getByRole('dialog', { name: 'Escolha duas ambições secretas' }).getByRole('button', { name: 'Ver o mapa primeiro', exact: true }).click();
    const fill = async () => pa.evaluate(() => {
      const stage = document.querySelector('.map-stage')!.getBoundingClientRect(), hexes = Array.from(document.querySelectorAll('svg.world-map g.hex')).map(node => node.getBoundingClientRect());
      const left = Math.min(...hexes.map(r => r.left)), right = Math.max(...hexes.map(r => r.right)), top = Math.min(...hexes.map(r => r.top)), bottom = Math.max(...hexes.map(r => r.bottom));
      return { width: (right - left) / stage.width, height: (bottom - top) / stage.height, inside: left >= stage.left - 1 && right <= stage.right + 1 && top >= stage.top - 1 && bottom <= stage.bottom + 1 };
    });
    for (const [width, height] of [[1366, 768], [1440, 900], [1920, 1080]] as const) {
      await pa.setViewportSize({ width, height }); await pa.waitForTimeout(250);
      const measured = await fill();
      expect(measured.inside).toBe(true);
      expect(Math.max(measured.width, measured.height), `${width}x${height}`).toBeGreaterThan(0.6);
      await pa.screenshot({ path: `${shots}/${width}x${height}-start-map.png` });
      expect(await pa.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }

    // Zoom and pan stay possible, and "Centralizar" fits the known area again.
    await pa.setViewportSize({ width: 1440, height: 900 });
    const before = await fill();
    await pa.getByRole('button', { name: 'Aumentar zoom' }).click(); await pa.getByRole('button', { name: 'Aumentar zoom' }).click();
    expect((await fill()).width).toBeGreaterThan(before.width);
    await pa.getByRole('button', { name: 'Mesa', exact: true }).click();
    expect((await fill()).width).toBeCloseTo(before.width, 1);

    // Mesa: the map is the whole table; the context card floats over it and closes away.
    const stageWidth = async () => (await pa.locator('.map-stage').boundingBox())!.width;
    expect(await stageWidth()).toBeGreaterThan(1440 * 0.95);
    // The Inspector is "Detalhes": closed until asked for, and the map is the whole table either way.
    await expect(pa.getByRole('complementary', { name: 'Cartão do contexto' })).toHaveCount(0);
    await pa.getByRole('button', { name: 'Detalhes', exact: true }).click();
    await expect(pa.getByRole('complementary', { name: 'Cartão do contexto' })).toBeVisible();
    await pa.getByRole('button', { name: 'Fechar cartão', exact: true }).click();
    await expect(pa.getByRole('button', { name: 'Detalhes', exact: true })).toBeVisible();
    await pa.screenshot({ path: `${shots}/1440x900-panels-collapsed.png` });
    await pa.setViewportSize({ width: 1920, height: 1080 }); await pa.waitForTimeout(250);
    await pa.screenshot({ path: `${shots}/1920x1080-panels-collapsed.png` });
    await pa.setViewportSize({ width: 1440, height: 900 });
    await pa.getByRole('button', { name: 'Detalhes', exact: true }).click();
    await expect(pa.getByRole('complementary', { name: 'Cartão do contexto' })).toBeVisible();

    // Leaving a running match forgets it in this browser only; the code brings the person back to the same match.
    const running = (await repository.find(roomId))!;
    await pb.getByRole('dialog', { name: 'Escolha duas ambições secretas' }).getByRole('button', { name: 'Ver o mapa primeiro', exact: true }).click();
    await pb.getByRole('button', { name: 'Sair da partida', exact: true }).click();
    await expect(pb.getByRole('dialog', { name: 'SAIR DESTA SESSÃO?' })).toBeVisible();
    await pb.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(pb.locator('.alpha-player-board h1')).toHaveText('Valgard');
    await pb.getByRole('button', { name: 'Sair da partida', exact: true }).click(); await pb.getByRole('button', { name: 'Sair e poder voltar', exact: true }).click();
    await expect(pb.getByRole('heading', { name: 'Preparar uma mesa' })).toBeVisible();
    expect(new URL(pb.url()).search).toBe('');
    const afterRunningLeave = (await repository.find(roomId))!;
    expect(afterRunningLeave.version).toBe(running.version); expect(afterRunningLeave.game).toEqual(running.game); expect(afterRunningLeave.seats).toEqual(running.seats);
    await pb.getByLabel('Seu nome', { exact: true }).fill('Beto');
    await pb.getByLabel('Código de convite', { exact: true }).fill(code); await pb.getByRole('button', { name: 'Entrar na partida', exact: true }).click();
    await expect(pb.locator('.alpha-player-board h1')).toHaveText('Valgard');
  } finally { await Promise.allSettled([a.close(), b.close()]); }
});
