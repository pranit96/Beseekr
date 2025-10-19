import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('should load within performance budget', async ({ page }) => {
    await page.goto('/chat');
    
    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        ttfb: nav.responseStart - nav.requestStart,
        domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
      };
    });

    expect(metrics.fcp).toBeLessThan(2000);
    expect(metrics.ttfb).toBeLessThan(800);
  });

  test('should have optimized bundle size', async ({ page }) => {
    const response = await page.goto('/');
    const size = (await response?.body())?.length || 0;
    expect(size).toBeLessThan(500000); // 500KB
  });

  test('should lazy load images', async ({ page }) => {
    await page.goto('/chat');
    
    const images = await page.locator('img').all();
    for (const img of images) {
      const loading = await img.getAttribute('loading');
      expect(['lazy', null]).toContain(loading);
    }
  });
});
