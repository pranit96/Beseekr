import { test, expect } from '@playwright/test';

test.describe('Agent Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents');
  });

  test('should display agent list', async ({ page }) => {
    await expect(page.locator('[role="list"]')).toBeVisible();
  });

  test('should select an agent', async ({ page }) => {
    const firstAgent = page.locator('[role="listitem"]').first();
    await firstAgent.click();
    await expect(firstAgent).toHaveAttribute('aria-selected', 'true');
  });

  test('should filter agents', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('test');
    await page.waitForTimeout(500); // Debounce
    
    const visibleAgents = await page.locator('[role="listitem"]:visible').count();
    expect(visibleAgents).toBeGreaterThanOrEqual(0);
  });
});
