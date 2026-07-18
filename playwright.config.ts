import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  timeout: 30_000,
  use: {
    trace: 'retain-on-failure',
  },
});
