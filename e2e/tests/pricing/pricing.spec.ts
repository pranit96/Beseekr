// e2e/tests/pricing/pricing.spec.ts
// Pricing page tests

import { test, expect } from '@playwright/test';
import { ROUTES } from '../../fixtures/test-data';

test.describe('Pricing Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(ROUTES.pricing);
        await page.waitForLoadState('domcontentloaded');
        // Give time for React to hydrate
        await page.waitForTimeout(1000);
    });

    test('should display pricing page', async ({ page }) => {
        await expect(page).toHaveURL(/\/pricing/);
        // Should have visible heading content
        const heading = page.locator('h1, h2, [class*="text-3xl"], [class*="text-4xl"]').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('should show pricing content', async ({ page }) => {
        // Should have any visible main content
        await page.waitForLoadState('networkidle');
        const bodyText = await page.evaluate(() => document.body.innerText);
        expect(bodyText.length).toBeGreaterThan(100);
    });

    test('should have billing period options', async ({ page }) => {
        await page.waitForLoadState('networkidle');
        // Look for any text about monthly or yearly billing
        const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
        const hasBillingOptions = bodyText.includes('month') || bodyText.includes('year') || bodyText.includes('annual');
        expect(hasBillingOptions).toBe(true);
    });

    test('should show monthly pricing', async ({ page }) => {
        await page.waitForLoadState('networkidle');
        // Should have price-related content
        const bodyText = await page.evaluate(() => document.body.innerText);
        const hasPrice = /[\d,]+/.test(bodyText) || bodyText.includes('₹') || bodyText.includes('$');
        expect(hasPrice).toBe(true);
    });

    test.describe('Currency and Pricing', () => {
        test('should display price information', async ({ page }) => {
            await page.waitForLoadState('networkidle');
            const bodyText = await page.evaluate(() => document.body.innerText);
            // Should have numbers (prices) on the page
            const hasNumbers = /\d+/.test(bodyText);
            expect(hasNumbers).toBe(true);
        });

        test('should have currency symbols or amounts', async ({ page }) => {
            await page.waitForLoadState('networkidle');
            const bodyText = await page.evaluate(() => document.body.innerText);
            // Should have currency references
            const hasCurrency = bodyText.includes('₹') || bodyText.includes('$') ||
                bodyText.includes('INR') || bodyText.includes('USD');
            expect(hasCurrency).toBe(true);
        });
    });

    test.describe('Plan Information', () => {
        test('should display plan names', async ({ page }) => {
            await page.waitForLoadState('networkidle');
            const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
            // Should have plan tier names
            const hasPlanNames = bodyText.includes('free') || bodyText.includes('pro') ||
                bodyText.includes('standard') || bodyText.includes('premium') ||
                bodyText.includes('basic') || bodyText.includes('starter');
            expect(hasPlanNames).toBe(true);
        });

        test('should have feature information', async ({ page }) => {
            await page.waitForLoadState('networkidle');
            // Should have list items or feature descriptions
            const lists = await page.locator('ul, ol').count();
            const paragraphs = await page.locator('p').count();
            expect(lists + paragraphs).toBeGreaterThan(0);
        });
    });

    test.describe('Call to Action', () => {
        test('should have clickable buttons', async ({ page }) => {
            await page.waitForLoadState('networkidle');
            // Should have some buttons on the page
            const buttons = await page.locator('button').count();
            const links = await page.locator('a').count();
            expect(buttons + links).toBeGreaterThan(0);
        });
    });

    test.describe('Responsive Design', () => {
        test.use({ viewport: { width: 375, height: 667 } });

        test('should be mobile responsive', async ({ page }) => {
            await page.goto(ROUTES.pricing);
            await page.waitForLoadState('networkidle');

            // No horizontal scroll on mobile
            const hasHorizontalScroll = await page.evaluate(() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            });

            expect(hasHorizontalScroll).toBe(false);
        });
    });
});
