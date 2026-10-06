import { defineConfig } from '@playwright/test';
/** Runs the external gate against a deployed alpha: ALPHA_BASE_URL=https://... ALPHA_ACCESS_CODE=... npx playwright test -c playwright.external.config.ts */
export default defineConfig({
  testDir: './e2e', testMatch: /external-(gate|bots).spec.ts/, workers: 1, timeout: 120000, retries: 0,
  use: { baseURL: process.env.ALPHA_BASE_URL, headless: true, viewport: { width: 1366, height: 768 }, screenshot: 'only-on-failure' },
});
