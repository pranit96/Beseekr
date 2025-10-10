// src/hooks/use-logging.ts
import { useCallback } from 'react';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  component: string;
}

interface Logger {
  debug: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, error?: Error | any) => void;
}

class LoggingService {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isNetlify = process.env.REACT_APP_NETLIFY === 'true';

  private formatMessage(component: string, level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${component}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      try {
        // For errors, include stack trace if available
        if (data instanceof Error) {
          return `${baseMessage}\n${data.stack || data.message}`;
        }
        
        // For other data, stringify if it's an object
        if (typeof data === 'object') {
          return `${baseMessage}\n${JSON.stringify(data, null, 2)}`;
        }
        
        return `${baseMessage} ${String(data)}`;
      } catch {
        return `${baseMessage} [Unserializable data]`;
      }
    }
    
    return baseMessage;
  }

  private shouldLog(level: LogLevel): boolean {
    // In development, log everything
    if (this.isDevelopment) return true;
    
    // In production Netlify, log info and above
    if (this.isNetlify) {
      return level !== 'debug';
    }
    
    // In other production environments, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  private logToConsole(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const consoleMethod = console[level] || console.log;
    
    if (data) {
      consoleMethod(message, data);
    } else {
      consoleMethod(message);
    }
  }

  private async logToService(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) return;

    try {
      // Netlify Function logging
      if (this.isNetlify) {
        // Netlify automatically captures console logs in functions
        // For client-side, you might want to send to a logging endpoint
        await this.sendToNetlifyFunction(entry);
      } else {
        // For other environments, you can implement different logging services
        await this.sendToExternalService(entry);
      }
    } catch (error) {
      // Fallback to console if logging service fails
      console.error('Failed to send log to service:', error);
    }
  }

  private async sendToNetlifyFunction(entry: LogEntry): Promise<void> {
    // You can create a Netlify function to handle client-side logging
    // This is optional as Netlify already captures function logs
    if (typeof window !== 'undefined') {
      try {
        await fetch('/.netlify/functions/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry),
        });
      } catch (error) {
        // Silently fail - don't break the app if logging fails
        console.debug('Failed to send log to Netlify function:', error);
      }
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Implement other logging services here (Sentry, LogRocket, etc.)
    // This is a placeholder for future integration
  }

  createLogger(component: string): Logger {
    return {
      debug: (message: string, data?: any) => {
        const formatted = this.formatMessage(component, 'debug', message, data);
        this.logToConsole('debug', formatted, data);
        this.logToService({
          level: 'debug',
          message,
          data,
          timestamp: new Date(),
          component,
        });
      },
      
      info: (message: string, data?: any) => {
        const formatted = this.formatMessage(component, 'info', message, data);
        this.logToConsole('info', formatted, data);
        this.logToService({
          level: 'info',
          message,
          data,
          timestamp: new Date(),
          component,
        });
      },
      
      warn: (message: string, data?: any) => {
        const formatted = this.formatMessage(component, 'warn', message, data);
        this.logToConsole('warn', formatted, data);
        this.logToService({
          level: 'warn',
          message,
          data,
          timestamp: new Date(),
          component,
        });
      },
      
      error: (message: string, error?: Error | any) => {
        const formatted = this.formatMessage(component, 'error', message, error);
        this.logToConsole('error', formatted, error);
        this.logToService({
          level: 'error',
          message,
          data: error,
          timestamp: new Date(),
          component,
        });
      },
    };
  }
}

// Singleton instance
const loggingService = new LoggingService();

export const useLogging = (component: string): Logger => {
  return loggingService.createLogger(component);
};

export default loggingService;