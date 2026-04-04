// e2e/pages/base.page.ts
// Base page object with common actions and assertions

import { Page, Locator, expect } from "@playwright/test";

export class BasePage {
  readonly page: Page;

  // Common selectors
  readonly loadingSpinner: Locator;
  readonly toastNotification: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loadingSpinner = page.locator(
      '[data-testid="loading"], .animate-spin, [class*="Loader"]',
    );
    this.toastNotification = page.locator(
      '[data-sonner-toast], [role="status"]',
    );
    this.errorMessage = page.locator(
      '[class*="destructive"], [class*="error"]',
    );
  }

  // Navigation helpers
  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  async waitForApiResponse(urlPattern: string | RegExp) {
    return this.page.waitForResponse(urlPattern);
  }

  // Assertion helpers
  async expectUrl(path: string) {
    await expect(this.page).toHaveURL(new RegExp(path));
  }

  async expectTitle(title: string | RegExp) {
    await expect(this.page).toHaveTitle(title);
  }

  async expectVisible(locator: Locator) {
    await expect(locator).toBeVisible();
  }

  async expectNotVisible(locator: Locator) {
    await expect(locator).not.toBeVisible();
  }

  async expectText(locator: Locator, text: string | RegExp) {
    await expect(locator).toContainText(text);
  }

  // Toast helpers
  async expectSuccessToast(message?: string) {
    await expect(this.toastNotification).toBeVisible();
    if (message) {
      await expect(this.toastNotification).toContainText(message);
    }
  }

  async expectErrorToast(message?: string) {
    const errorToast = this.page.locator(
      '[data-sonner-toast][data-type="error"], [class*="destructive"]',
    );
    await expect(errorToast.or(this.toastNotification)).toBeVisible();
    if (message) {
      await expect(errorToast.or(this.toastNotification)).toContainText(
        message,
      );
    }
  }

  // Wait helpers
  async waitForLoadingToFinish() {
    // Wait for any loading spinners to disappear
    await this.loadingSpinner
      .waitFor({ state: "detached", timeout: 30000 })
      .catch(() => {});
  }

  // Screenshot for debugging
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `e2e/reports/${name}.png`,
      fullPage: true,
    });
  }

  // Performance measurement
  async measurePageLoad(): Promise<number> {
    const timing = await this.page.evaluate(() => {
      const perf = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      return perf.loadEventEnd - perf.startTime;
    });
    return timing;
  }

  async measureTimeToInteractive(): Promise<number> {
    const tti = await this.page.evaluate(() => {
      return new Promise<number>((resolve) => {
        if (document.readyState === "complete") {
          resolve(performance.now());
        } else {
          window.addEventListener("load", () => resolve(performance.now()));
        }
      });
    });
    return tti;
  }
}
