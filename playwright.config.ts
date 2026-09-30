import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', workers: 1, timeout: 90000,
  use: { baseURL: 'http://127.0.0.1:3107', headless: true, viewport: { width: 1440, height: 900 }, screenshot: 'only-on-failure' },
  globalSetup: './e2e/global-setup.ts',
});
