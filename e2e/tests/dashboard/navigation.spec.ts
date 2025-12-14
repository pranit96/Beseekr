// e2e/tests/dashboard/navigation.spec.ts
// Dashboard navigation tests

import { test, expect } from '@playwright/test';
import { ROUTES } from '../../fixtures/test-data';

test.describe('Dashboard Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(ROUTES.problems);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000); // Wait for React hydration
    });

    test('should display header', async ({ page }) => {
        // Should have visible content in header area
        const header = page.locator('header, nav, [class*="TopBar"], [class*="Header"]').first();
        await expect(header).toBeVisible({ timeout: 10000 });
    });

    test('should load Problems page', async ({ page }) => {
        await page.goto('/dashboard/problems');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/dashboard\/problems/);
        // Should have content
        const bodyText = await page.evaluate(() => document.body.innerText);
        expect(bodyText.length).toBeGreaterThan(100);
    });

    test('should load Watchlist page', async ({ page }) => {
        await page.goto('/dashboard/watchlist');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/dashboard\/watchlist/);
    });

    test('should load Search page', async ({ page }) => {
        await page.goto('/dashboard/search');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/dashboard\/search/);
    });

    test('should load Feed page', async ({ page }) => {
        await page.goto('/dashboard/feed');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/dashboard\/feed/);
    });

    test('should load Validate page', async ({ page }) => {
        await page.goto('/dashboard/validate');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/dashboard\/validate/);
    });

    test('should load Pricing page', async ({ page }) => {
        await page.goto('/pricing');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/pricing/);
    });

    test.describe('Guest User', () => {
        test.beforeEach(async ({ page }) => {
            await page.context().clearCookies();
        });

        test('should allow viewing problems as guest', async ({ page }) => {
            await page.goto(ROUTES.problems);
            await page.waitForLoadState('networkidle');
            // Dashboard should be accessible (public)
            await expect(page).toHaveURL(/\/dashboard\/problems/);
        });

        test('should show sign in option for guests', async ({ page }) => {
            await page.goto(ROUTES.problems);
            await page.waitForLoadState('networkidle');
            // Should have sign in link or button somewhere
            const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
            const hasSignIn = bodyText.includes('sign in') || bodyText.includes('login') || bodyText.includes('log in');
            // Either has sign in text or redirected to auth
            expect(hasSignIn || page.url().includes('auth')).toBe(true);
        });
    });

    test.describe('Mobile Navigation', () => {
        test.use({ viewport: { width: 375, height: 667 } });

        test('should be responsive on mobile', async ({ page }) => {
            await page.goto(ROUTES.problems);
            await page.waitForLoadState('networkidle');

            // No horizontal scroll
            const hasHorizontalScroll = await page.evaluate(() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            });
            expect(hasHorizontalScroll).toBe(false);
        });

        test('should display content on mobile', async ({ page }) => {
            await page.goto(ROUTES.problems);
            await page.waitForLoadState('networkidle');

            // Should have visible content
            const bodyText = await page.evaluate(() => document.body.innerText);
            expect(bodyText.length).toBeGreaterThan(50);
        });
    });
});
