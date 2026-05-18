// e2e/utils/performance.ts
// Performance measurement utilities

import { Page } from "@playwright/test";
import { PERFORMANCE_THRESHOLDS } from "../fixtures/test-data";

export interface PerformanceMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  largestContentfulPaint: number;
  firstContentfulPaint: number;
  domContentLoaded: number;
  apiResponseTimes: Map<string, number>;
}

export interface PerformanceReport {
  url: string;
  timestamp: Date;
  metrics: PerformanceMetrics;
  passed: boolean;
  violations: string[];
}

// Measure Core Web Vitals
export async function measureWebVitals(
  page: Page,
): Promise<PerformanceMetrics> {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType("paint");

    const fcp = paint.find((p) => p.name === "first-contentful-paint");

    return {
      pageLoadTime: navigation.loadEventEnd - navigation.startTime,
      timeToInteractive: navigation.domInteractive - navigation.startTime,
      domContentLoaded:
        navigation.domContentLoadedEventEnd - navigation.startTime,
      firstContentfulPaint: fcp?.startTime || 0,
      largestContentfulPaint: 0, // Will be measured separately via observer
    };
  });

  // Measure LCP via Performance Observer
  const lcp = await page
    .evaluate(() => {
      return new Promise<number>((resolve) => {
        let lcpValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          lcpValue = lastEntry.startTime;
        });

        observer.observe({ type: "largest-contentful-paint", buffered: true });

        // Wait a bit for LCP to be recorded
        setTimeout(() => {
          observer.disconnect();
          resolve(lcpValue);
        }, 1000);
      });
    })
    .catch(() => 0);

  return {
    ...metrics,
    largestContentfulPaint: lcp,
    apiResponseTimes: new Map(),
  };
}

// Check if metrics pass thresholds
export function checkPerformanceThresholds(metrics: PerformanceMetrics): {
  passed: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  if (metrics.pageLoadTime > PERFORMANCE_THRESHOLDS.pageLoad) {
    violations.push(
      `Page load time ${metrics.pageLoadTime}ms exceeds threshold ${PERFORMANCE_THRESHOLDS.pageLoad}ms`,
    );
  }

  if (metrics.timeToInteractive > PERFORMANCE_THRESHOLDS.tti) {
    violations.push(
      `Time to Interactive ${metrics.timeToInteractive}ms exceeds threshold ${PERFORMANCE_THRESHOLDS.tti}ms`,
    );
  }

  if (metrics.largestContentfulPaint > PERFORMANCE_THRESHOLDS.lcp) {
    violations.push(
      `LCP ${metrics.largestContentfulPaint}ms exceeds threshold ${PERFORMANCE_THRESHOLDS.lcp}ms`,
    );
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

// Generate performance report
export function generateReport(
  url: string,
  metrics: PerformanceMetrics,
): PerformanceReport {
  const { passed, violations } = checkPerformanceThresholds(metrics);

  return {
    url,
    timestamp: new Date(),
    metrics,
    passed,
    violations,
  };
}

// Measure API response time
export async function measureApiResponseTime(
  page: Page,
  urlPattern: string | RegExp,
  action: () => Promise<void>,
): Promise<number> {
  const startTime = Date.now();

  const [response] = await Promise.all([
    page.waitForResponse(urlPattern),
    action(),
  ]);

  const endTime = Date.now();
  return endTime - startTime;
}

// Format metrics for logging
export function formatMetrics(metrics: PerformanceMetrics): string {
  return `
  📊 Performance Metrics:
  ├── Page Load Time: ${metrics.pageLoadTime.toFixed(0)}ms
  ├── Time to Interactive: ${metrics.timeToInteractive.toFixed(0)}ms
  ├── First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(0)}ms
  ├── Largest Contentful Paint: ${metrics.largestContentfulPaint.toFixed(0)}ms
  └── DOM Content Loaded: ${metrics.domContentLoaded.toFixed(0)}ms
  `;
}
