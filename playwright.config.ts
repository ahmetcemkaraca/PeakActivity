import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['json', { outputFile: 'test-results.json' }]],
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    baseURL: 'http://localhost:3000', // Adjust to your frontend URL
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 667 },
      },
    },
  ],
  webServer: {
    command: 'npm run start', // Adjust to your start command
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
