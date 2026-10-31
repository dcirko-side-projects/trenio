import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests-connected',
  outputDir: './test-results/connected',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4186',
    channel: 'msedge',
    headless: true,
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: 'npm run dev -- --port 4186 --strictPort',
    url: 'http://127.0.0.1:4186',
    reuseExistingServer: false,
    env: { VITE_SUPABASE_URL: 'http://127.0.0.1:54329', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_trenio_test' },
  },
})
