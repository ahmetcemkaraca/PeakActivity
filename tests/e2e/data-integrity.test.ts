import { test, expect } from '@playwright/test';
import { createHash } from 'crypto';

test.describe('Data Integrity Tests', () => {
  test('should validate event checksums on sync', async ({ page }) => {
    // Add activity with checksum
    await page.goto('/dashboard');
    await page.click('[data-testid="add-activity"]');
    await page.fill('[data-testid="activity-title"]', 'Test Activity');
    await page.fill('[data-testid="duration"]', '3600');
    await page.click('[data-testid="save-activity"]');

    // Get the activity data with checksum
    const activityData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('pending-sync') || '{}');
    });

    // Verify checksum
    const expectedChecksum = createHash('md5')
      .update(JSON.stringify(activityData.data))
      .digest('hex');

    expect(activityData.checksum).toBe(expectedChecksum);

    // Simulate sync and verify integrity
    await page.click('[data-testid="sync-now"]');
    await expect(page.locator('[data-testid="sync-success"]')).toBeVisible();

    // Check if checksum is validated on server
    const syncLog = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('sync-log') || '{}');
    });

    expect(syncLog.validated).toBe(true);
    expect(syncLog.checksum).toBe(expectedChecksum);
  });

  test('should reject sync with invalid checksum', async ({ page }) => {
    // Add activity with tampered data
    await page.goto('/dashboard');
    await page.click('[data-testid="add-activity"]');
    await page.fill('[data-testid="activity-title"]', 'Tampered Activity');
    await page.fill('[data-testid="duration"]', '3600');
    await page.click('[data-testid="save-activity"]');

    // Tamper with data
    await page.evaluate(() => {
      const activity = JSON.parse(localStorage.getItem('pending-sync') || '{}');
      activity.data.title = 'Tampered Title';
      activity.checksum = 'invalid-checksum';
      localStorage.setItem('pending-sync', JSON.stringify(activity));
    });

    // Attempt sync
    await page.click('[data-testid="sync-now"]');

    // Should show integrity error
    await expect(page.locator('[data-testid="sync-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="integrity-failed"]')).toBeVisible();
  });
});
