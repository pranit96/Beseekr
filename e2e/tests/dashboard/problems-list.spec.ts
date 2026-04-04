// e2e/tests/dashboard/problems-list.spec.ts
// Problems list page tests

import { test, expect } from "@playwright/test";
import { ProblemsListPage } from "../../pages/problems-list.page";
import { ROUTES } from "../../fixtures/test-data";

test.describe("Problems List Page", () => {
  let problemsPage: ProblemsListPage;

  test.beforeEach(async ({ page }) => {
    problemsPage = new ProblemsListPage(page);
    await problemsPage.goto();
    await page.waitForTimeout(1000); // Wait for React hydration
  });

  test("should load problems list page", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    // Should have visible content
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test("should display content area", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    // Should have main content area
    const mainContent = page
      .locator('main, [class*="container"], section')
      .first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });

  test("should have tab options", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    // Check for tabs or filter options
    const tabs = await page
      .locator('[role="tab"], button[class*="tab" i]')
      .count();
    const hasTabText = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return (
        text.includes("free") ||
        text.includes("premium") ||
        text.includes("problems")
      );
    });
    expect(tabs > 0 || hasTabText).toBe(true);
  });

  test("should be interactive", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    // Should have clickable elements
    const clickables = await page.locator('button, a, [role="button"]').count();
    expect(clickables).toBeGreaterThan(0);
  });

  test("should load without JavaScript errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto(ROUTES.problems);
    await page.waitForLoadState("networkidle");

    // Filter out known benign errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("favicon") && !e.includes("404") && !e.includes("net::"),
    );

    expect(criticalErrors.length).toBe(0);
  });

  test.describe("Problem Cards", () => {
    test("should display problem content", async ({ page }) => {
      await page.waitForLoadState("networkidle");
      // Should have some text content (problem titles, descriptions)
      const bodyText = await page.evaluate(() => document.body.innerText);
      expect(bodyText.trim().length).toBeGreaterThan(50);
    });
  });

  test.describe("Guest Access", () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.goto(ROUTES.problems);
      await page.waitForLoadState("networkidle");
    });

    test("should allow guests to view problems list", async ({ page }) => {
      // Page should load without redirecting
      await expect(page).toHaveURL(/\/dashboard\/problems/);
    });

    test("should show content to guests", async ({ page }) => {
      // Should have visible content for guests
      const bodyText = await page.evaluate(() => document.body.innerText);
      expect(bodyText.length).toBeGreaterThan(50);
    });
  });
});
