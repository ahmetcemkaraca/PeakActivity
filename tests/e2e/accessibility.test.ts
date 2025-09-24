import { test, expect } from '@playwright/test';
import AxeBuilder from 'axe-core/playwright';

test.describe('Accessibility Audit', () => {
  test('dashboard should be accessible', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Run axe-core audit
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login page should be accessible', async ({ page }) => {
    await page.goto('/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('settings page should be accessible', async ({ page }) => {
    await page.goto('/settings');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
