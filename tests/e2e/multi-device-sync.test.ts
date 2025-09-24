import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';

test.describe('Multi-Device Sync Tests', () => {
  test('should sync data across multiple devices', async ({ browser }) => {
    // Launch two browser contexts to simulate two devices
    const context1 = await browser.newContext({ userAgent: 'Device 1' });
    const context2 = await browser.newContext({ userAgent: 'Device 2' });

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login on device 1
    await page1.goto('/login');
    await page1.fill('[data-testid="email"]', 'user1@example.com');
    await page1.fill('[data-testid="password"]', 'password123');
    await page1.click('[data-testid="login-button"]');
    await expect(page1).toHaveURL('/dashboard');

    // Add activity on device 1
    await page1.click('[data-testid="add-activity"]');
    await page1.fill('[data-testid="activity-title"]', 'Test Activity');
    await page1.fill('[data-testid="duration"]', '3600');
    await page1.selectOption('[data-testid="category"]', 'development');
    await page1.click('[data-testid="save-activity"]');

    // Wait for sync
    await page1.waitForSelector('[data-testid="sync-status"]', { state: 'visible' });

    // Login on device 2
    await page2.goto('/login');
    await page2.fill('[data-testid="email"]', 'user1@example.com');
    await page2.fill('[data-testid="password"]', 'password123');
    await page2.click('[data-testid="login-button"]');
    await expect(page2).toHaveURL('/dashboard');

    // Check if activity is synced to device 2
    await expect(page2.locator('[data-testid="activity-item"]')).toHaveCount(1);
    await expect(page2.locator('[data-testid="activity-title"]')).toContainText('Test Activity');

    // Update activity on device 2
    await page2.click('[data-testid="edit-activity"]');
    await page2.fill('[data-testid="duration"]', '7200');
    await page2.click('[data-testid="save-activity"]');

    // Verify update synced back to device 1
    await page1.reload();
    await expect(page1.locator('[data-testid="activity-duration"]')).toContainText('7200');

    await context1.close();
    await context2.close();
  });

  test('should handle concurrent updates from multiple devices', async ({ browser }) => {
    const context1 = await browser.newContext({ userAgent: 'Device 1' });
    const context2 = await browser.newContext({ userAgent: 'Device 2' });

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login on both devices
    await Promise.all([
      page1.goto('/login'),
      page2.goto('/login')
    ]);

    await Promise.all([
      page1.fill('[data-testid="email"]', 'user2@example.com'),
      page2.fill('[data-testid="email"]', 'user2@example.com')
    ]);

    await Promise.all([
      page1.fill('[data-testid="password"]', 'password123'),
      page2.fill('[data-testid="password"]', 'password123')
    ]);

    await Promise.all([
      page1.click('[data-testid="login-button"]'),
      page2.click('[data-testid="login-button"]')
    ]);

    await Promise.all([
      expect(page1).toHaveURL('/dashboard'),
      expect(page2).toHaveURL('/dashboard')
    ]);

    // Add activity on device 1
    await page1.click('[data-testid="add-activity"]');
    await page1.fill('[data-testid="activity-title"]', 'Concurrent Test');
    await page1.fill('[data-testid="duration"]', '1800');
    await page1.click('[data-testid="save-activity"]');

    // Wait for sync on device 1
    await page1.waitForSelector('[data-testid="sync-status"]', { state: 'visible' });

    // Add different activity on device 2 simultaneously
    await page2.click('[data-testid="add-activity"]');
    await page2.fill('[data-testid="activity-title"]', 'Concurrent Test 2');
    await page2.fill('[data-testid="duration"]', '2400');
    await page2.click('[data-testid="save-activity"]');

    // Wait for sync on device 2
    await page2.waitForSelector('[data-testid="sync-status"]', { state: 'visible' });

    // Verify both activities are present on both devices
    await Promise.all([
      expect(page1.locator('[data-testid="activity-item"]')).toHaveCount(2),
      expect(page2.locator('[data-testid="activity-item"]')).toHaveCount(2)
    ]);

    // Check specific titles
    await expect(page1.locator('[data-testid="activity-title"]')).toContainText('Concurrent Test');
    await expect(page1.locator('[data-testid="activity-title"]')).toContainText('Concurrent Test 2');
    await expect(page2.locator('[data-testid="activity-title"]')).toContainText('Concurrent Test');
    await expect(page2.locator('[data-testid="activity-title"]')).toContainText('Concurrent Test 2');

    await context1.close();
    await context2.close();
  });
});
