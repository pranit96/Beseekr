// e2e/fixtures/auth.fixture.ts
// Authentication fixtures for tests that require logged-in state

import { test as base, Page } from "@playwright/test";

// Test user credentials from environment
const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "Test123!@#";

export interface AuthFixtures {
  authenticatedPage: Page;
  guestPage: Page;
}

// Extend base test with auth fixtures
export const test = base.extend<AuthFixtures>({
  // Page with authenticated user
  authenticatedPage: async ({ page }, use) => {
    // Try to login
    await page.goto("/auth");

    // Check if already logged in (redirected to dashboard)
    if (page.url().includes("/dashboard")) {
      await use(page);
      return;
    }

    // Fill login form
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard or error
    await Promise.race([
      page.waitForURL(/\/dashboard/, { timeout: 10000 }),
      page.waitForSelector('[class*="destructive"]', { timeout: 10000 }),
    ]).catch(() => {
      // Login might have failed, continue anyway for test to handle
    });

    await use(page);
  },

  // Page without authentication (guest user)
  guestPage: async ({ page }, use) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.goto("/");
    await use(page);
  },
});

export { expect } from "@playwright/test";

// Helper to check if user is authenticated
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for user menu button (only visible when logged in)
    const userMenu = page.locator('button[aria-label="User menu"]');
    return await userMenu.isVisible({ timeout: 2000 });
  } catch {
    return false;
  }
}

// Helper to logout
export async function logout(page: Page): Promise<void> {
  const userMenu = page.locator('button[aria-label="User menu"]');
  if (await userMenu.isVisible()) {
    await userMenu.click();
    await page.click("text=Sign Out");
    await page.waitForURL("/");
  }
}

// Helper to login with specific credentials
export async function loginAs(
  page: Page,
  email: string,
  password: string,
): Promise<boolean> {
  await page.goto("/auth");

  // If already on dashboard, logout first
  if (page.url().includes("/dashboard")) {
    await logout(page);
    await page.goto("/auth");
  }

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for navigation or error
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}
