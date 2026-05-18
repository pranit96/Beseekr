type AnalyticsEvent = {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
};

class Analytics {
  private events: AnalyticsEvent[] = [];
  private endpoint: string | null = null;
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.startAutoFlush();
      window.addEventListener("beforeunload", () => this.flush());
    }
  }

  configure(endpoint: string) {
    this.endpoint = endpoint;
  }

  track(name: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
    };

    this.events.push(event);

    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  page(path: string, properties?: Record<string, any>) {
    this.track("page_view", { path, ...properties });
  }

  identify(userId: string, traits?: Record<string, any>) {
    this.track("identify", { userId, ...traits });
  }

  private startAutoFlush() {
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  private async flush() {
    if (this.events.length === 0 || !this.endpoint) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: eventsToSend }),
      });
    } catch (error) {
      console.error("Analytics flush failed:", error);
      // Re-add events on failure
      this.events.unshift(...eventsToSend);
    }
  }
}

export const analytics = new Analytics();
