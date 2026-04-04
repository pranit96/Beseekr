// src/lib/cache.ts - ENHANCED CACHING UTILITY
import { createLogger } from "@/services/logging";

const logger = createLogger("CacheManager");

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  storage?: "memory" | "localStorage" | "sessionStorage";
  prefix?: string;
}

class CacheManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_MEMORY_ENTRIES = 100;
  private cleanupInterval: number | null = null;

  constructor() {
    // Start cleanup interval
    this.startCleanup();

    // Clear expired entries on page visibility change
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          this.cleanup();
        }
      });
    }
  }

  private startCleanup() {
    // Run cleanup every 2 minutes
    this.cleanupInterval = window.setInterval(
      () => {
        this.cleanup();
      },
      2 * 60 * 1000,
    );
  }

  private cleanup() {
    const now = Date.now();
    let removed = 0;

    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt < now) {
        this.memoryCache.delete(key);
        removed++;
      }
    }

    // Clean localStorage
    if (typeof localStorage !== "undefined") {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith("cache:")) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const entry = JSON.parse(item);
              if (entry.expiresAt < now) {
                localStorage.removeItem(key);
                removed++;
              }
            }
          } catch (e) {
            // Invalid entry, remove it
            localStorage.removeItem(key);
          }
        }
      }
    }

    if (removed > 0) {
      logger.debug("Cleanup completed", { removedEntries: removed });
    }
  }

  private enforceMemoryLimit() {
    if (this.memoryCache.size > this.MAX_MEMORY_ENTRIES) {
      // Remove oldest entries
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = entries.slice(
        0,
        this.memoryCache.size - this.MAX_MEMORY_ENTRIES,
      );
      toRemove.forEach(([key]) => this.memoryCache.delete(key));

      logger.debug("Memory limit enforced", { removed: toRemove.length });
    }
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const {
      ttl = this.DEFAULT_TTL,
      storage = "memory",
      prefix = "cache",
    } = options;

    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    };

    const cacheKey = `${prefix}:${key}`;

    try {
      if (storage === "memory") {
        this.memoryCache.set(cacheKey, entry);
        this.enforceMemoryLimit();
      } else if (
        storage === "localStorage" &&
        typeof localStorage !== "undefined"
      ) {
        localStorage.setItem(cacheKey, JSON.stringify(entry));
      } else if (
        storage === "sessionStorage" &&
        typeof sessionStorage !== "undefined"
      ) {
        sessionStorage.setItem(cacheKey, JSON.stringify(entry));
      }

      logger.debug("Cache set", { key: cacheKey, storage, ttl });
    } catch (error) {
      logger.error("Failed to set cache", { key: cacheKey, error });
    }
  }

  get<T>(key: string, options: CacheOptions = {}): T | null {
    const { storage = "memory", prefix = "cache" } = options;

    const cacheKey = `${prefix}:${key}`;
    const now = Date.now();

    try {
      let entry: CacheEntry<T> | null = null;

      if (storage === "memory") {
        entry = this.memoryCache.get(cacheKey) || null;
      } else if (
        storage === "localStorage" &&
        typeof localStorage !== "undefined"
      ) {
        const item = localStorage.getItem(cacheKey);
        if (item) {
          entry = JSON.parse(item);
        }
      } else if (
        storage === "sessionStorage" &&
        typeof sessionStorage !== "undefined"
      ) {
        const item = sessionStorage.getItem(cacheKey);
        if (item) {
          entry = JSON.parse(item);
        }
      }

      if (!entry) {
        return null;
      }

      // Check if expired
      if (entry.expiresAt < now) {
        this.delete(key, options);
        logger.debug("Cache expired", { key: cacheKey });
        return null;
      }

      logger.debug("Cache hit", { key: cacheKey, age: now - entry.timestamp });
      return entry.data;
    } catch (error) {
      logger.error("Failed to get cache", { key: cacheKey, error });
      return null;
    }
  }

  delete(key: string, options: CacheOptions = {}): void {
    const { storage = "memory", prefix = "cache" } = options;

    const cacheKey = `${prefix}:${key}`;

    try {
      if (storage === "memory") {
        this.memoryCache.delete(cacheKey);
      } else if (
        storage === "localStorage" &&
        typeof localStorage !== "undefined"
      ) {
        localStorage.removeItem(cacheKey);
      } else if (
        storage === "sessionStorage" &&
        typeof sessionStorage !== "undefined"
      ) {
        sessionStorage.removeItem(cacheKey);
      }

      logger.debug("Cache deleted", { key: cacheKey });
    } catch (error) {
      logger.error("Failed to delete cache", { key: cacheKey, error });
    }
  }

  clear(
    options: {
      storage?: "memory" | "localStorage" | "sessionStorage";
      prefix?: string;
    } = {},
  ): void {
    const { storage, prefix = "cache" } = options;

    try {
      if (!storage || storage === "memory") {
        if (prefix) {
          // Clear only entries with specific prefix
          for (const key of this.memoryCache.keys()) {
            if (key.startsWith(`${prefix}:`)) {
              this.memoryCache.delete(key);
            }
          }
        } else {
          this.memoryCache.clear();
        }
      }

      if (!storage || storage === "localStorage") {
        if (typeof localStorage !== "undefined") {
          const keys = Object.keys(localStorage);
          for (const key of keys) {
            if (key.startsWith(`${prefix}:`)) {
              localStorage.removeItem(key);
            }
          }
        }
      }

      if (!storage || storage === "sessionStorage") {
        if (typeof sessionStorage !== "undefined") {
          const keys = Object.keys(sessionStorage);
          for (const key of keys) {
            if (key.startsWith(`${prefix}:`)) {
              sessionStorage.removeItem(key);
            }
          }
        }
      }

      logger.info("Cache cleared", { storage, prefix });
    } catch (error) {
      logger.error("Failed to clear cache", { error });
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let memoryCount = 0;
    let memoryExpired = 0;

    for (const entry of this.memoryCache.values()) {
      memoryCount++;
      if (entry.expiresAt < now) {
        memoryExpired++;
      }
    }

    return {
      memoryEntries: memoryCount,
      memoryExpired,
      memorySize: this.memoryCache.size,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.memoryCache.clear();
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Helper functions for common use cases
export const cache = {
  // Set with default options
  set: <T>(key: string, data: T, ttl?: number) => {
    cacheManager.set(key, data, { ttl, storage: "memory" });
  },

  // Get with default options
  get: <T>(key: string): T | null => {
    return cacheManager.get<T>(key, { storage: "memory" });
  },

  // Set in localStorage with longer TTL
  setPersistent: <T>(key: string, data: T, ttl = 24 * 60 * 60 * 1000) => {
    cacheManager.set(key, data, { ttl, storage: "localStorage" });
  },

  // Get from localStorage
  getPersistent: <T>(key: string): T | null => {
    return cacheManager.get<T>(key, { storage: "localStorage" });
  },

  // Delete from all storages
  delete: (key: string) => {
    cacheManager.delete(key, { storage: "memory" });
    cacheManager.delete(key, { storage: "localStorage" });
    cacheManager.delete(key, { storage: "sessionStorage" });
  },

  // Clear all caches
  clearAll: () => {
    cacheManager.clear();
  },
};
