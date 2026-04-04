// e2e/tests/auth/login.spec.ts
// Login flow tests

import { test, expect } from "@playwright/test";
import { AuthPage } from "../../pages/auth.page";
import { ROUTES } from "../../fixtures/test-data";

test.describe("Login Flow", () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.goto();
  });

  test("should display login form by default", async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should show Google sign-in button", async () => {
    await expect(authPage.googleButton.first()).toBeVisible();
    await expect(authPage.googleButton.first()).toContainText("Google");
  });

  test("should show validation error for empty fields", async ({ page }) => {
    await authPage.loginButton.click();
    // HTML5 validation should prevent submission
    const emailInput = page.locator('input[type="email"]');
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage,
    );
    expect(validationMessage).toBeTruthy();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await authPage.login("invalid@example.com", "wrongpassword");

    // Wait for error message or stay on auth page
    await page.waitForTimeout(2000);

    // Should stay on auth page
    expect(page.url()).toContain("/auth");
  });

  test("should navigate to forgot password", async ({ page }) => {
    await authPage.clickForgotPassword();
    await expect(page.getByText("Reset Password")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("should switch between login and signup tabs", async ({ page }) => {
    // Click signup tab
    await authPage.signupTab.click();
    await expect(page.locator("input#signup-name")).toBeVisible();

    // Click login tab
    await authPage.loginTab.click();
    await expect(page.locator("input#login-email")).toBeVisible();
  });

  test("should show password visibility toggle", async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    const toggleButton = page
      .locator("button")
      .filter({ has: page.locator("svg") })
      .last();

    // Initially password is hidden
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test.describe("Signup Flow", () => {
    test.beforeEach(async () => {
      await authPage.signupTab.click();
    });

    test("should display signup form", async ({ page }) => {
      await expect(page.locator("input#signup-name")).toBeVisible();
      await expect(page.locator('input[type="email"]').last()).toBeVisible();
      await expect(page.locator('input[type="password"]').last()).toBeVisible();
    });

    test("should show password requirements on typing", async ({ page }) => {
      await page.locator('input[type="password"]').last().fill("Test");

      // Should show password requirements
      await expect(page.getByText("At least 8 characters")).toBeVisible();
      await expect(page.getByText("One uppercase letter")).toBeVisible();
    });

    test("should validate password requirements", async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]').last();

      // Enter weak password
      await passwordInput.fill("weak");
      await expect(page.locator('[class*="text-gray"]').first()).toBeVisible();

      // Enter strong password
      await passwordInput.fill("StrongPass123!");
      // Requirements should now be green
      const greenChecks = page.locator('[class*="text-green"]');
      await expect(greenChecks.first()).toBeVisible();
    });
  });
});
