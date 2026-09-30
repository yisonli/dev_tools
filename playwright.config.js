import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e', timeout: 30000, fullyParallel: true, workers: process.env.CI ? 2 : 3,
  reporter: [['list']], outputDir: 'test-results',
  use: { baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:4173', viewport: { width: 1366, height: 768 }, trace: 'retain-on-failure', launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined } },
  webServer: process.env.E2E_BASE_URL ? undefined : { command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
})
