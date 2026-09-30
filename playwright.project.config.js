import { defineConfig } from '@playwright/test'
import config from './playwright.config.js'

export default defineConfig({
  ...config,
  use: { ...config.use, baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:4174/dev_tools/' },
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'npm run build:project && npm run preview -- --host 127.0.0.1 --port 4174 --strictPort --base /dev_tools/',
    url: 'http://127.0.0.1:4174/dev_tools/',
    reuseExistingServer: false,
  },
})
