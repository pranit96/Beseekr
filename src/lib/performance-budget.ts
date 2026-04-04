type Budget = {
  fcp: number; // First Contentful Paint (ms)
  lcp: number; // Largest Contentful Paint (ms)
  fid: number; // First Input Delay (ms)
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte (ms)
  bundleSize: number; // Total bundle size (KB)
};

const DEFAULT_BUDGET: Budget = {
  fcp: 1800,
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  ttfb: 600,
  bundleSize: 1000,
};

class PerformanceBudget {
  private budget: Budget;
  private violations: string[] = [];

  constructor(budget: Partial<Budget> = {}) {
    this.budget = { ...DEFAULT_BUDGET, ...budget };
  }

  check() {
    this.violations = [];

    if (typeof window === "undefined") return;

    // Check Web Vitals
    if ("PerformanceObserver" in window) {
      this.checkFCP();
      this.checkLCP();
      this.checkFID();
      this.checkCLS();
    }

    // Check TTFB
    this.checkTTFB();

    // Report violations
    if (this.violations.length > 0) {
      console.warn("Performance budget violations:", this.violations);
    }

    return this.violations;
  }

  private checkFCP() {
    const entry = performance.getEntriesByName("first-contentful-paint")[0];
    if (entry && entry.startTime > this.budget.fcp) {
      this.violations.push(
        `FCP: ${entry.startTime.toFixed(0)}ms > ${this.budget.fcp}ms`,
      );
    }
  }

  private checkLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      if (lastEntry.renderTime > this.budget.lcp) {
        this.violations.push(
          `LCP: ${lastEntry.renderTime.toFixed(0)}ms > ${this.budget.lcp}ms`,
        );
      }
    });
    observer.observe({ entryTypes: ["largest-contentful-paint"] });
  }

  private checkFID() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.processingStart - entry.startTime > this.budget.fid) {
          this.violations.push(
            `FID: ${(entry.processingStart - entry.startTime).toFixed(0)}ms > ${this.budget.fid}ms`,
          );
        }
      });
    });
    observer.observe({ entryTypes: ["first-input"] });
  }

  private checkCLS() {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      if (clsValue > this.budget.cls) {
        this.violations.push(
          `CLS: ${clsValue.toFixed(3)} > ${this.budget.cls}`,
        );
      }
    });
    observer.observe({ entryTypes: ["layout-shift"] });
  }

  private checkTTFB() {
    const navTiming = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    if (navTiming) {
      const ttfb = navTiming.responseStart - navTiming.requestStart;
      if (ttfb > this.budget.ttfb) {
        this.violations.push(
          `TTFB: ${ttfb.toFixed(0)}ms > ${this.budget.ttfb}ms`,
        );
      }
    }
  }
}

export const performanceBudget = new PerformanceBudget();
