import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', workers: 1, timeout: 90000,
  use: { baseURL: 'http://127.0.0.1:3107', headless: true, viewport: { width: 1440, height: 900 }, screenshot: 'only-on-failure' },
  webServer: { command: 'npm run compile && npm run dev -w @aoh/web -- --port 3107', url: 'http://127.0.0.1:3107', reuseExistingServer: false, timeout: 180000 },
});
