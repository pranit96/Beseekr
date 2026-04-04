// src/lib/performance.ts - PERFORMANCE MONITORING UTILITY
import { createLogger } from "@/services/logging";

const logger = createLogger("Performance");

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private readonly MAX_METRICS = 100;

  // Start measuring a metric
  start(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.metrics.set(name, metric);
    logger.debug("Performance measurement started", { name, metadata });
  }

  // End measuring a metric
  end(name: string): number | null {
    const metric = this.metrics.get(name);

    if (!metric) {
      logger.warn("Performance metric not found", { name });
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    logger.info("Performance measurement completed", {
      name,
      duration: metric.duration.toFixed(2) + "ms",
      metadata: metric.metadata,
    });

    // Clean up old metrics
    if (this.metrics.size > this.MAX_METRICS) {
      const firstKey = this.metrics.keys().next().value;
      this.metrics.delete(firstKey);
    }

    return metric.duration;
  }

  // Measure a function execution
  async measure<T>(
    name: string,
    fn: () => T | Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    this.start(name, metadata);

    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  // Get metric by name
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  // Get all metrics
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  // Get metrics summary
  getSummary(): {
    total: number;
    completed: number;
    averageDuration: number;
    slowest: PerformanceMetric | null;
  } {
    const metrics = this.getAllMetrics();
    const completed = metrics.filter((m) => m.duration !== undefined);

    const totalDuration = completed.reduce(
      (sum, m) => sum + (m.duration || 0),
      0,
    );
    const averageDuration =
      completed.length > 0 ? totalDuration / completed.length : 0;

    const slowest = completed.reduce(
      (prev, current) => {
        if (!prev || (current.duration || 0) > (prev.duration || 0)) {
          return current;
        }
        return prev;
      },
      null as PerformanceMetric | null,
    );

    return {
      total: metrics.length,
      completed: completed.length,
      averageDuration,
      slowest,
    };
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
    logger.debug("Performance metrics cleared");
  }

  // Report Web Vitals
  reportWebVitals(): void {
    if (typeof window === "undefined" || !("performance" in window)) {
      return;
    }

    // First Contentful Paint (FCP)
    const fcpEntry = performance.getEntriesByName("first-contentful-paint")[0];
    if (fcpEntry) {
      logger.info("FCP", { value: fcpEntry.startTime.toFixed(2) + "ms" });
    }

    // Largest Contentful Paint (LCP)
    if ("PerformanceObserver" in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          logger.info("LCP", { value: lastEntry.startTime.toFixed(2) + "ms" });
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      } catch (e) {
        // Observer not supported
      }
    }

    // Cumulative Layout Shift (CLS) - throttled logging
    if ("PerformanceObserver" in window) {
      try {
        let clsValue = 0;
        let lastLogTime = 0;
        const LOG_INTERVAL = 5000; // Only log every 5 seconds

        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }

          // Only log if enough time has passed since last log
          const now = Date.now();
          if (now - lastLogTime >= LOG_INTERVAL) {
            logger.info("CLS", { value: clsValue.toFixed(4) });
            lastLogTime = now;
          }
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });
      } catch (e) {
        // Observer not supported
      }
    }

    // First Input Delay (FID)
    if ("PerformanceObserver" in window) {
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstInput = entries[0];
          const fid =
            (firstInput as any).processingStart - firstInput.startTime;
          logger.info("FID", { value: fid.toFixed(2) + "ms" });
        });
        fidObserver.observe({ entryTypes: ["first-input"] });
      } catch (e) {
        // Observer not supported
      }
    }

    // Navigation Timing
    const navTiming = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    if (navTiming) {
      logger.info("Navigation Timing", {
        domContentLoaded:
          (
            navTiming.domContentLoadedEventEnd -
            navTiming.domContentLoadedEventStart
          ).toFixed(2) + "ms",
        loadComplete:
          (navTiming.loadEventEnd - navTiming.loadEventStart).toFixed(2) + "ms",
        domInteractive:
          (navTiming.domInteractive - navTiming.fetchStart).toFixed(2) + "ms",
      });
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper functions
export const perf = {
  start: (name: string, metadata?: Record<string, any>) => {
    performanceMonitor.start(name, metadata);
  },

  end: (name: string) => {
    return performanceMonitor.end(name);
  },

  measure: async <T>(
    name: string,
    fn: () => T | Promise<T>,
    metadata?: Record<string, any>,
  ) => {
    return performanceMonitor.measure(name, fn, metadata);
  },

  getSummary: () => {
    return performanceMonitor.getSummary();
  },

  reportWebVitals: () => {
    performanceMonitor.reportWebVitals();
  },
};

// Auto-report web vitals on load
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    setTimeout(() => {
      performanceMonitor.reportWebVitals();
    }, 0);
  });
}
