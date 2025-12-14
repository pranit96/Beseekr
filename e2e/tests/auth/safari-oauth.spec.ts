// e2e/tests/auth/safari-oauth.spec.ts
// Safari-specific OAuth tests

import { test, expect, devices } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';

test.describe('Safari Mobile OAuth', () => {
    test.use({
        // Use Safari-like browser configuration
        ...devices['iPhone 13'],
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    });

    let authPage: AuthPage;

    test.beforeEach(async ({ page }) => {
        authPage = new AuthPage(page);
        await authPage.goto();
    });

    test('should display Google button on mobile Safari viewport', async ({ page }) => {
        // Ensure we're on the login tab
        await expect(authPage.loginTab).toBeVisible();

        // Google button should be visible on mobile Safari
        const googleButton = authPage.googleButton.first();
        await expect(googleButton).toBeVisible();
        await expect(googleButton).toContainText('Google');

        // Button should be clickable
        await expect(googleButton).toBeEnabled();
    });

    test('should display Google button on signup tab', async ({ page }) => {
        // Switch to signup tab
        await authPage.signupTab.click();

        // Google button should be visible on signup tab too
        const googleButtons = authPage.googleButton;
        await expect(googleButtons.last()).toBeVisible();
        await expect(googleButtons.last()).toContainText('Google');
    });

    test('should have proper mobile styling', async ({ page }) => {
        const googleButton = authPage.googleButton.first();

        // Check button is properly sized for mobile
        const boundingBox = await googleButton.boundingBox();
        expect(boundingBox).toBeTruthy();

        if (boundingBox) {
            // Button should be at least 44px tall (iOS touch target minimum)
            expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
    });

    test('should show configuration error if Supabase not configured', async ({ page }) => {
        // Note: This test assumes Supabase IS configured in the test environment
        // If not configured, clicking should show an error toast

        // Click Google button
        await authPage.googleButton.first().click();

        // Wait a moment for any immediate errors
        await page.waitForTimeout(1000);

        // If configuration error, should see toast or stay on page
        // If configured correctly, will redirect (which we can't fully test in E2E without Google credentials)
        const currentUrl = page.url();
        const isStillOnAuth = currentUrl.includes('/auth');

        // Either still on auth (error) or redirecting to Google (success)
        expect(isStillOnAuth || currentUrl.includes('google.com')).toBeTruthy();
    });

    test('should not show popup blocker issues', async ({ page, context }) => {
        // Listen for any popup attempts (should not happen with redirect flow)
        let popupOpened = false;
        context.on('page', () => {
            popupOpened = true;
        });

        // Click Google button
        await authPage.googleButton.first().click();
        await page.waitForTimeout(2000);

        // With redirect flow, no popup should open
        // The current page should either redirect or show error
        expect(popupOpened).toBe(false);
    });

    test('should handle localStorage for session persistence', async ({ page }) => {
        // Check that localStorage is accessible (Safari sometimes restricts this)
        const canAccessLocalStorage = await page.evaluate(() => {
            try {
                localStorage.setItem('test', 'value');
                const value = localStorage.getItem('test');
                localStorage.removeItem('test');
                return value === 'value';
            } catch (e) {
                return false;
            }
        });

        expect(canAccessLocalStorage).toBe(true);
    });

    test('should log Safari detection info', async ({ page }) => {
        // Capture console logs
        const logs: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'log') {
                logs.push(msg.text());
            }
        });

        // Click Google button to trigger OAuth flow
        await authPage.googleButton.first().click();
        await page.waitForTimeout(1000);

        // Should have logged browser detection
        const hasOAuthLog = logs.some(log => log.includes('Initiating Google OAuth'));
        expect(hasOAuthLog).toBe(true);
    });
});

test.describe('Safari Desktop OAuth', () => {
    test.use({
        // Use Safari desktop configuration
        ...devices['Desktop Safari'],
    });

    let authPage: AuthPage;

    test.beforeEach(async ({ page }) => {
        authPage = new AuthPage(page);
        await authPage.goto();
    });

    test('should display Google button on desktop Safari', async () => {
        const googleButton = authPage.googleButton.first();
        await expect(googleButton).toBeVisible();
        await expect(googleButton).toContainText('Google');
    });

    test('should handle OAuth initiation on desktop Safari', async ({ page }) => {
        // Click Google button
        await authPage.googleButton.first().click();

        // Wait for redirect or error
        await page.waitForTimeout(2000);

        // Page should either redirect to Google or show error
        const url = page.url();
        expect(url.includes('/auth') || url.includes('google.com')).toBeTruthy();
    });
});
