import { test, expect } from '@playwright/test';

test.describe('Offline Mode Tests', () => {
  test('should handle offline mode gracefully', async ({ page }) => {
    // Set offline mode
    await page.route('**/*', route => route.fulfill({
      status: 0,
      path: '/offline.html'
    }));

    await page.goto('/dashboard');

    // Check if offline indicator is shown
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

    // Check if cached data is displayed
    await expect(page.locator('[data-testid="cached-activities"]')).toBeVisible();

    // Check if sync is queued
    await expect(page.locator('[data-testid="sync-queued"]')).toBeVisible();
  });

  test('should switch to online mode correctly', async ({ page }) => {
    // Set online mode
    await page.route('**/*', route => route.continue());

    // Simulate online event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('online'));
    });

    await page.goto('/dashboard');

    // Check if online state is restored
    await expect(page.locator('[data-testid="online-indicator"]')).toBeVisible();

    // Check if sync is performed
    await expect(page.locator('[data-testid="sync-completed"]')).toBeVisible({ timeout: 5000 });
  });

  test('should cache API responses for offline use', async ({ page }) => {
    // First visit to cache
    await page.goto('/api/activities');
    await expect(page.locator('[data-testid="activity-list"]')).toBeVisible();

    // Go offline
    await page.route('**/*', route => route.fulfill({
      status: 0,
      path: '/offline.html'
    }));

    await page.goto('/dashboard');

    // Should show cached data
    await expect(page.locator('[data-testid="cached-data"]')).toBeVisible();
  });
});
