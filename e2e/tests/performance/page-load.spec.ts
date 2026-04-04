// e2e/tests/performance/page-load.spec.ts
// Performance tests for page load times

import { test, expect } from "@playwright/test";
import {
  measureWebVitals,
  checkPerformanceThresholds,
  formatMetrics,
} from "../../utils/performance";
import { ROUTES, PERFORMANCE_THRESHOLDS } from "../../fixtures/test-data";

test.describe("Page Load Performance", () => {
  // Store metrics for report
  const performanceResults: Array<{
    page: string;
    metrics: any;
    passed: boolean;
  }> = [];

  test.afterAll(async () => {
    // Log performance summary
    console.log("\n📊 Performance Test Summary:");
    console.log("═".repeat(60));

    for (const result of performanceResults) {
      const status = result.passed ? "✅" : "❌";
      console.log(`${status} ${result.page}`);
      console.log(
        `   Load: ${result.metrics.pageLoadTime?.toFixed(0)}ms | TTI: ${result.metrics.timeToInteractive?.toFixed(0)}ms`,
      );
    }

    console.log("═".repeat(60));
  });

  test("Landing page should load within threshold", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const metrics = await measureWebVitals(page);
    const { passed, violations } = checkPerformanceThresholds(metrics);

    performanceResults.push({ page: "Landing", metrics, passed });

    console.log(formatMetrics(metrics));

    expect(metrics.pageLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
  });

  test("Auth page should load within threshold", async ({ page }) => {
    await page.goto(ROUTES.auth);
    await page.waitForLoadState("networkidle");

    const metrics = await measureWebVitals(page);
    const { passed, violations } = checkPerformanceThresholds(metrics);

    performanceResults.push({ page: "Auth", metrics, passed });

    expect(metrics.pageLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
  });

  test("Problems list should load within threshold", async ({ page }) => {
    await page.goto(ROUTES.problems);
    await page.waitForLoadState("networkidle");

    const metrics = await measureWebVitals(page);
    const { passed, violations } = checkPerformanceThresholds(metrics);

    performanceResults.push({ page: "Problems List", metrics, passed });

    expect(metrics.pageLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
  });

  test("Pricing page should load within threshold", async ({ page }) => {
    await page.goto(ROUTES.pricing);
    await page.waitForLoadState("networkidle");

    const metrics = await measureWebVitals(page);
    const { passed, violations } = checkPerformanceThresholds(metrics);

    performanceResults.push({ page: "Pricing", metrics, passed });

    expect(metrics.pageLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
  });

  test("Watchlist page should load within threshold", async ({ page }) => {
    await page.goto("/dashboard/watchlist");
    await page.waitForLoadState("networkidle");

    const metrics = await measureWebVitals(page);
    const { passed, violations } = checkPerformanceThresholds(metrics);

    performanceResults.push({ page: "Watchlist", metrics, passed });

    expect(metrics.pageLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
  });

  test("Search page should load within threshold", async ({ page }) => {
    await page.goto("/dashboard/search");
    await page.waitForLoadState("networkidle");

    const metrics = await measureWebVitals(page);
    const { passed, violations } = checkPerformanceThresholds(metrics);

    performanceResults.push({ page: "Search", metrics, passed });

    expect(metrics.pageLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
  });
});

test.describe("Core Web Vitals", () => {
  test("LCP should be under threshold on problems page", async ({ page }) => {
    await page.goto(ROUTES.problems);
    await page.waitForLoadState("networkidle");

    const metrics = await measureWebVitals(page);

    console.log(
      `📊 LCP: ${metrics.largestContentfulPaint?.toFixed(0)} ms(threshold: ${PERFORMANCE_THRESHOLDS.lcp}ms)`,
    );

    // LCP threshold
    if (metrics.largestContentfulPaint > 0) {
      expect(metrics.largestContentfulPaint).toBeLessThan(
        PERFORMANCE_THRESHOLDS.lcp,
      );
    }
  });

  test("Time to Interactive should be under threshold", async ({ page }) => {
    await page.goto(ROUTES.problems);
    await page.waitForLoadState("networkidle");

    const metrics = await measureWebVitals(page);

    console.log(
      `📊 TTI: ${metrics.timeToInteractive?.toFixed(0)} ms(threshold: ${PERFORMANCE_THRESHOLDS.tti}ms)`,
    );

    expect(metrics.timeToInteractive).toBeLessThan(PERFORMANCE_THRESHOLDS.tti);
  });
});

test.describe("Bundle Size Impact", () => {
  test("should not have excessive JavaScript", async ({ page }) => {
    const jsRequests: number[] = [];

    page.on("response", async (response) => {
      const url = response.url();
      if (url.endsWith(".js") || url.includes(".js?")) {
        const headers = response.headers();
        const contentLength = parseInt(headers["content-length"] || "0", 10);
        jsRequests.push(contentLength);
      }
    });

    await page.goto(ROUTES.problems);
    await page.waitForLoadState("networkidle");

    const totalJsSize = jsRequests.reduce((a, b) => a + b, 0);
    const totalJsSizeKB = totalJsSize / 1024;

    console.log(`📊 Total JS: ${totalJsSizeKB.toFixed(0)} KB`);

    // Warn if JS is over 2MB
    if (totalJsSizeKB > 2048) {
      console.warn(`⚠️ Large JS bundle: ${totalJsSizeKB.toFixed(0)} KB`);
    }
  });
});
