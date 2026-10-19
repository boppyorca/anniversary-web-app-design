import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  timeout: 45000,
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 390, height: 844 },
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 14'],
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 7'],
      },
    },
  ],
})
