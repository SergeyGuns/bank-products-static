import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:9999',
    headless: true,
  },
  webServer: {
    command: 'node src/scripts/server.js',
    port: 9999,
    reuseExistingServer: true,
  },
});
