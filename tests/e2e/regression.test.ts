import { test, expect } from '@playwright/test';

test.describe('Regression Tests', () => {
  test('dashboard should render correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Snapshot test for dashboard layout
    await expect(page).toHaveScreenshot('dashboard.png');
  });

  test('activity list should display correctly', async ({ page }) => {
    await page.goto('/activities');
    
    // Snapshot test for activity list
    await expect(page.locator('[data-testid="activity-list"]')).toHaveScreenshot('activity-list.png');
  });

  test('settings page should maintain state', async ({ page }) => {
    await page.goto('/settings');
    
    // Change language and save
    await page.selectOption('[data-testid="language-select"]', 'en');
    await page.click('[data-testid="save-settings"]');
    
    // Reload and check if state is preserved
    await page.reload();
    await expect(page.locator('[data-testid="language-select"]')).toHaveValue('en');
    
    // Snapshot test
    await expect(page).toHaveScreenshot('settings-saved.png');
  });
});
