import { test, expect } from '@playwright/test';

test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load chat interface', async ({ page }) => {
    await expect(page).toHaveTitle(/Chat/i);
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test('should send a message', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="message"]');
    await input.fill('Hello, test message');
    await page.keyboard.press('Enter');
    await expect(page.locator('text=Hello, test message')).toBeVisible();
  });

  test('should navigate with keyboard', async ({ page }) => {
    await page.keyboard.press('Control+/');
    await expect(page.locator('text=Keyboard Shortcuts')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('should be accessible', async ({ page }) => {
    const accessibilityScanResults = await page.accessibility.snapshot();
    expect(accessibilityScanResults).toBeTruthy();
  });
});
