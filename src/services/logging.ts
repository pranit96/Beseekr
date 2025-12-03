// Logging Service - Centralized logging for the application
// No direct console usage - all logs go through this service

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  component: string;
  level: LogLevel;
  message: string;
  data?: any;
}

export interface Logger {
  debug: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
}

class LoggingService {
  private isDevelopment = import.meta.env.DEV;
  private minLogLevel: LogLevel = this.isDevelopment ? 'debug' : 'info';
  private logQueue: LogEntry[] = [];
  private flushInterval: number | null = null;
  private readonly FLUSH_INTERVAL_MS = 5000;
  private readonly MAX_QUEUE_SIZE = 50;

  constructor() {
    // Start periodic flush in production
    if (!this.isDevelopment) {
      this.startPeriodicFlush();
    }
  }

  private startPeriodicFlush(): void {
    this.flushInterval = window.setInterval(() => {
      this.flushLogs();
    }, this.FLUSH_INTERVAL_MS);
  }

  private formatMessage(component: string, level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${component}] ${message}${dataStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.minLogLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  private logToConsole(level: LogLevel, message: string, data?: any): void {
    // Log to console in both development AND production for full visibility
    const consoleMethod = level === 'debug' ? 'log' : level;
    if (data !== undefined) {
      console[consoleMethod](message, data);
    } else {
      console[consoleMethod](message);
    }
  }

  private async logToService(entry: LogEntry): Promise<void> {
    // Add to queue
    this.logQueue.push(entry);

    // Flush if queue is full
    if (this.logQueue.length >= this.MAX_QUEUE_SIZE) {
      await this.flushLogs();
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      await this.sendToLogEndpoint(logsToSend);
    } catch (error) {
      // Silently fail - don't log errors about logging
      // In development, we can still see console output
      if (this.isDevelopment) {
        console.error('[LoggingService] Failed to send logs:', error);
      }
    }
  }

  private async sendToLogEndpoint(logs: LogEntry[]): Promise<void> {
    try {
      // Transform logs to match API expectation
      const transformedLogs = logs.map(log => ({
        timestamp: log.timestamp,
        level: log.level,
        source: log.component,
        message: log.message,
        data: log.data,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }));

      await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add API key if configured
          ...(import.meta.env.VITE_LOG_API_KEY ? {
            'Authorization': `Bearer ${import.meta.env.VITE_LOG_API_KEY}`
          } : {})
        },
        body: JSON.stringify(transformedLogs),
      });
    } catch (error) {
      // Silently fail
      if (this.isDevelopment) {
        console.error('[LoggingService] Failed to send to /api/log:', error);
      }
    }
  }

  private log(component: string, level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(component, level, message, data);

    // ALWAYS log to console for visibility (both dev and production)
    this.logToConsole(level, formattedMessage, data);

    // ALSO send to service in production for centralized logging
    if (!this.isDevelopment) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        component,
        level,
        message,
        data,
      };
      this.logToService(entry);
    }
  }

  createLogger(component: string): Logger {
    return {
      debug: (message: string, data?: any) => this.log(component, 'debug', message, data),
      info: (message: string, data?: any) => this.log(component, 'info', message, data),
      warn: (message: string, data?: any) => this.log(component, 'warn', message, data),
      error: (message: string, data?: any) => this.log(component, 'error', message, data),
    };
  }

  // Cleanup method
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushLogs(); // Final flush
  }
}

// Singleton instance
const loggingService = new LoggingService();

// Export factory function
export const createLogger = (component: string): Logger => {
  return loggingService.createLogger(component);
};

// Export service for cleanup
export default loggingService;
