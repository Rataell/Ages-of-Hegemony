import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('local visual loop, authoritative feedback, map crash regression and visual evidence', async ({ page }) => {
  const sliceEvidence = 'docs/evidence/product-slice';
  const closureEvidence = 'docs/evidence/visual-closure-v1';
  await mkdir(sliceEvidence, { recursive: true });
  await mkdir(closureEvidence, { recursive: true });

  const browserErrors: string[] = [];
  page.on('pageerror', error => browserErrors.push(error.message));

  async function capture(screen: string) {
    for (const [width, height] of [[1440, 900], [1280, 800], [390, 844]] as const) {
      await page.setViewportSize({ width, height });
      if (screen === 'city' && width === 390) await page.locator('.context-inspector').scrollIntoViewIfNeeded();
      // Save for baseline compatibility
      await page.screenshot({ path: `${sliceEvidence}/${width}-${screen}.png` });
      // Save for visual closure v1 required evidence
      await page.screenshot({ path: `${closureEvidence}/${width}-${screen}.png` });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  await page.goto('/');
  await page.getByRole('button', { name: 'Nova Partida', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Aurélia', exact: true }).first()).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(11, 17, 20)');

  // PRIORITY 0 REGRESSION TEST: Aggressive map pointer interaction & bounds leaving
  const map = page.locator('svg.world-map');
  await map.dispatchEvent('pointerdown', { clientX: 300, clientY: 300, button: 0 });
  await map.dispatchEvent('pointermove', { clientX: 360, clientY: 340, buttons: 1 });
  await map.dispatchEvent('pointermove', { clientX: -100, clientY: -100, buttons: 1 }); // drag leaving component
  await map.dispatchEvent('pointercancel'); // pointer cancel
  await map.dispatchEvent('pointerdown', { clientX: 300, clientY: 300, button: 0 });
  await map.dispatchEvent('pointerup', { clientX: 300, clientY: 300 });

  // Map controls
  await page.getByRole('button', { name: 'Aumentar zoom' }).click();
  await page.getByRole('button', { name: 'Diminuir zoom' }).click();
  await page.getByRole('button', { name: 'Centralizar' }).click();

  // Onboarding verification: initial step, minimize, dismiss
  await expect(page.locator('.guidance')).toContainText('Passo 1/5: Conclua a Manutenção');
  await page.getByRole('button', { name: 'Minimizar' }).click();
  await expect(page.getByRole('button', { name: 'Expandir' })).toBeVisible();
  await page.getByRole('button', { name: 'Expandir' }).click();
  await page.getByRole('button', { name: 'Dispensar orientação' }).click();
  await expect(page.locator('.guidance')).toHaveCount(0);

  // In-game compendium verification: open, capture, switch categories, search, restart onboarding
  await page.getByRole('button', { name: '📖 Compêndio' }).click();
  await expect(page.locator('.compendium-dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Compêndio & Manual de Regras' })).toBeVisible();
  await capture('compendium');

  await page.getByRole('button', { name: 'Distritos', exact: true }).click();
  await expect(page.locator('.compendium-card').filter({ hasText: 'Agrário' })).toBeVisible();

  await page.getByRole('button', { name: 'Edifícios', exact: true }).click();
  await expect(page.locator('.compendium-card').filter({ hasText: 'Celeiro' })).toBeVisible();

  await page.getByRole('button', { name: 'Regras & Conceitos', exact: true }).click();
  await expect(page.locator('.compendium-card').filter({ hasText: 'Estabilidade Social' })).toBeVisible();

  await page.getByPlaceholder('Buscar no compêndio…').fill('Celeiro');
  await expect(page.locator('.compendium-card').filter({ hasText: 'Celeiro' })).toBeVisible();

  // Test onboarding restart button inside compendium
  await page.getByRole('button', { name: '✦ Reiniciar Tutorial' }).click();
  await expect(page.locator('.compendium-dialog')).not.toBeVisible();
  await expect(page.locator('.guidance')).toBeVisible();
  await page.getByRole('button', { name: 'Dispensar orientação' }).click();
  await expect(page.locator('.guidance')).toHaveCount(0);

  // 1. World Map Scene
  await capture('world-map');
  await capture('map');

  await page.getByRole('button', { name: 'Executar manutenção' }).click();
  await expect(page.getByText('Planejamento', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Fechar relatório' }).click();

  // 2. Selected City Scene
  await page.getByRole('button', { name: /★ Aurélia/ }).click();
  await page.getByLabel('Produtores', { exact: true }).fill('1');
  await page.getByLabel('Artesãos', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Aplicar distribuição' }).click();
  await expect(page.getByLabel('Artesãos', { exact: true })).toHaveValue('1');
  await expect(page.getByRole('status')).toContainText('Decisão aplicada');
  await capture('selected-city');
  await capture('city');

  await page.getByRole('button', { name: 'Planície 3,2', exact: true }).click();
  await page.getByRole('button', { name: 'Reivindicar território', exact: true }).click();
  await expect(page.locator('.top-bar .influence b')).toHaveText('19');
  await page.getByRole('button', { name: 'Melhorar território', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar Fazenda', exact: true }).click();
  await expect(page.locator('.top-bar .materials b')).toHaveText('49');

  await page.getByRole('button', { name: 'Cidade', exact: true }).click();
  await page.getByRole('button', { name: 'Atribuir território' }).click();
  await page.getByRole('button', { name: 'Planície 3,2', exact: true }).click();
  await page.getByRole('button', { name: 'Aplicar territórios' }).click();
  await expect(page.getByText('1 trabalhados · 2 elegíveis · 1 produtores')).toBeVisible();

  // 3. District / Building Decision Scene
  await page.getByRole('button', { name: 'Construir distrito', exact: true }).click();
  await capture('district-decision');
  await capture('district');
  await page.getByRole('button', { name: 'Confirmar Agrário', exact: true }).click();

  await page.getByRole('button', { name: 'Construir edifício', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar Celeiro', exact: true }).click();

  for (let i = 0; i < 4; i++) {
    const response = page.waitForResponse(
      r => r.url().endsWith('/api/local') && r.request().postDataJSON().action === 'advance'
    );
    await page.getByRole('button', { name: /Avançar fase/ }).click();
    await response;
    await expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');
  }

  // 4. Strategic Round Report Scene
  await page.getByRole('button', { name: 'Executar manutenção' }).click();
  await expect(page.getByRole('heading', { name: 'Relatório · Rodada 2' })).toBeVisible();
  await expect(page.getByText('Alimento consumido: 2 / necessário 2')).toBeVisible();
  await capture('round-report');
  await capture('report');
  await page.getByRole('button', { name: 'Fechar relatório' }).click();

  // Rejected command test
  const rejected = await page.evaluate(async () => {
    const query = async (body: unknown) =>
      (
        await fetch('/api/local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      ).json();
    const current = await query({ action: 'view' });
    return query({
      action: 'command',
      command: {
        type: 'DEVELOP_CITY',
        cityId: 'capital-2',
        playerId: current.data.view.player.id,
        expectedVersion: current.data.view.version,
      },
    });
  });
  expect(rejected.error).toContain('CITY_NOT_OWNED');

  // 5. Selected Territory Scene
  await page.getByRole('button', { name: 'Planície 3,2, trabalhado', exact: true }).click();
  await expect(page.getByText('Território já possui proprietário.')).toBeVisible();
  await capture('selected-territory');

  for (const [width, height] of [[1280, 800], [390, 844]]) {
    await page.setViewportSize({ width: width!, height: height! });
    await page.screenshot({ path: `${sliceEvidence}/${width}-territory-full.png`, fullPage: true });
    await page.screenshot({ path: `${closureEvidence}/${width}-territory-full.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  // 6. Government / Civilization Panel Scene
  await capture('government-panel');

  await page.getByRole('button', { name: 'Adotar governo', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar Monarquia', exact: true }).click();
  await expect(page.locator('.civ-brand')).toContainText('Monarquia');

  await page.getByRole('button', { name: 'Cidade', exact: true }).click();
  await page.getByText('Desenvolvimento e especialização', { exact: true }).click();
  await page.getByRole('button', { name: 'Desenvolver cidade', exact: true }).click();
  await expect(page.locator('.inspector-title')).toContainText('Desenvolvimento II');
  await page.getByRole('button', { name: 'Desenvolver cidade', exact: true }).click();
  await expect(page.locator('.inspector-title')).toContainText('Desenvolvimento III');

  await page.getByRole('button', { name: 'Planície 4,2', exact: true }).click();
  await page.getByRole('button', { name: 'Reivindicar território', exact: true }).click();
  await page.getByRole('button', { name: 'Fundar cidade', exact: true }).click();
  await page.getByLabel('Nome da cidade').fill('Fronteira');
  await page.getByRole('button', { name: 'Confirmar fundação', exact: true }).click();
  await expect(page.locator('.city-link').filter({ hasText: 'Fronteira' })).toBeVisible();

  await page.getByText('Developer / Hotseat', { exact: true }).click();
  await page.getByLabel('Ver como').selectOption('player-2');
  await expect(page.locator('.civ-brand')).toContainText('Valgard');
  await expect(page.locator('.city-link').filter({ hasText: 'Fronteira' })).toHaveCount(0);
  await page.getByLabel('Ver como').selectOption('player-1');
  await expect(page.locator('.city-link').filter({ hasText: 'Fronteira' })).toBeVisible();

  expect(browserErrors).toEqual([]);
});

test('HTTP boundary rejects foreign origins and scheduler command injection', async ({ request }) => {
  expect(
    (
      await request.post('/api/local', {
        headers: { Origin: 'https://example.invalid' },
        data: { action: 'start', count: 2 },
      })
    ).status()
  ).toBe(403);
  const headers = { Origin: 'http://127.0.0.1:3107' };
  const start = await request.post('/api/local', { headers, data: { action: 'start', count: 2 } });
  expect(start.ok()).toBe(true);
  const data = await start.json();
  const result = await request.post('/api/local', {
    headers,
    data: {
      action: 'command',
      command: { type: 'ADVANCE_PHASE', nextPhase: 'PLANNING', expectedVersion: data.data.view.version },
    },
  });
  expect(result.status()).toBe(409);
  expect((await result.json()).error).toContain('FORBIDDEN');
});
