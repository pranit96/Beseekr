import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
  data?: Record<string, any>;
  userAgent?: string;
  url?: string;
  traceId?: string;
}

interface EnrichedLogEntry extends LogEntry {
  id: string;
  receivedAt: string;
  ip: string;
  environment: string;
}

// Configuration
const CONFIG = {
  MAX_LOGS_PER_REQUEST: 100,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_BODY_SIZE: 1024 * 1024, // 1MB
  MAX_SOURCE_LENGTH: 100,
  MAX_URL_LENGTH: 2048,
  MAX_USER_AGENT_LENGTH: 500,
  MAX_DATA_DEPTH: 5,
  MAX_DATA_KEYS: 50,
  MAX_ARRAY_LENGTH: 20,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 100,
} as const;

// In-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// ============================================================================
// Validation
// ============================================================================

function isValidLogEntry(entry: any): entry is LogEntry {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  // Required fields
  if (typeof entry.timestamp !== 'string' || !entry.timestamp) {
    return false;
  }

  if (!['debug', 'info', 'warn', 'error'].includes(entry.level)) {
    return false;
  }

  if (typeof entry.source !== 'string' || !entry.source || entry.source.length > CONFIG.MAX_SOURCE_LENGTH) {
    return false;
  }

  if (typeof entry.message !== 'string' || !entry.message || entry.message.length > CONFIG.MAX_MESSAGE_LENGTH) {
    return false;
  }

  // Optional fields validation
  if (entry.data !== undefined && (typeof entry.data !== 'object' || Array.isArray(entry.data))) {
    return false;
  }

  if (entry.userAgent !== undefined && typeof entry.userAgent !== 'string') {
    return false;
  }

  if (entry.url !== undefined && typeof entry.url !== 'string') {
    return false;
  }

  if (entry.traceId !== undefined && typeof entry.traceId !== 'string') {
    return false;
  }

  return true;
}

function isValidTimestamp(timestamp: string): boolean {
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
}

// ============================================================================
// Sanitization
// ============================================================================

function sanitizeLogEntry(entry: LogEntry): LogEntry {
  const sanitized: LogEntry = {
    timestamp: entry.timestamp.slice(0, 50),
    level: entry.level,
    source: entry.source.slice(0, CONFIG.MAX_SOURCE_LENGTH).trim(),
    message: sanitizeString(entry.message, CONFIG.MAX_MESSAGE_LENGTH),
  };

  if (entry.data) {
    sanitized.data = sanitizeData(entry.data);
  }

  if (entry.userAgent) {
    sanitized.userAgent = sanitizeString(entry.userAgent, CONFIG.MAX_USER_AGENT_LENGTH);
  }

  if (entry.url) {
    sanitized.url = sanitizeUrl(entry.url);
  }

  if (entry.traceId) {
    sanitized.traceId = sanitizeString(entry.traceId, 100);
  }

  return sanitized;
}

function sanitizeString(str: string, maxLength: number): string {
  // Remove control characters and trim
  return str
    .replace(/[\x00-\x1F\x7F]/g, '')
    .slice(0, maxLength)
    .trim();
}

function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return url.slice(0, CONFIG.MAX_URL_LENGTH);
  } catch {
    return '';
  }
}

function sanitizeData(data: Record<string, any>, depth = 0): Record<string, any> {
  if (depth > CONFIG.MAX_DATA_DEPTH) {
    return { _truncated: 'Max depth exceeded' };
  }

  const sanitized: Record<string, any> = {};
  let keyCount = 0;

  for (const [key, value] of Object.entries(data)) {
    if (keyCount++ >= CONFIG.MAX_DATA_KEYS) {
      sanitized._truncated = `Max keys exceeded (${CONFIG.MAX_DATA_KEYS})`;
      break;
    }

    const sanitizedKey = sanitizeString(key, 100);
    if (!sanitizedKey) continue;

    if (value === null || value === undefined) {
      sanitized[sanitizedKey] = value;
    } else if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeString(value, 1000);
    } else if (typeof value === 'number') {
      sanitized[sanitizedKey] = isFinite(value) ? value : null;
    } else if (typeof value === 'boolean') {
      sanitized[sanitizedKey] = value;
    } else if (Array.isArray(value)) {
      const arr = value.slice(0, CONFIG.MAX_ARRAY_LENGTH);
      sanitized[sanitizedKey] = arr.map(item => {
        if (typeof item === 'object' && item !== null) {
          return sanitizeData(item, depth + 1);
        }
        return item;
      });
    } else if (typeof value === 'object') {
      sanitized[sanitizedKey] = sanitizeData(value, depth + 1);
    }
  }

  return sanitized;
}

// ============================================================================
// Rate Limiting
// ============================================================================

function getClientIdentifier(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  return ip;
}

function checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);

  // Clean up expired entries
  if (record && now > record.resetAt) {
    rateLimitStore.delete(clientId);
  }

  const current = rateLimitStore.get(clientId);

  if (!current) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetAt: now + CONFIG.RATE_LIMIT_WINDOW,
    });
    return { allowed: true, remaining: CONFIG.RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (current.count >= CONFIG.RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  current.count++;
  return { allowed: true, remaining: CONFIG.RATE_LIMIT_MAX_REQUESTS - current.count };
}

// ============================================================================
// Logging Utilities
// ============================================================================

function formatLogForConsole(log: EnrichedLogEntry): string {
  const timestamp = new Date(log.timestamp).toISOString();
  const emoji = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  }[log.level];

  let output = `${emoji} [${timestamp}] [${log.level.toUpperCase()}] [${log.source}]\n`;
  output += `   Message: ${log.message}\n`;

  if (log.traceId) {
    output += `   Trace ID: ${log.traceId}\n`;
  }

  if (log.url) {
    output += `   URL: ${log.url}\n`;
  }

  if (log.data) {
    output += `   Data: ${JSON.stringify(log.data, null, 2).split('\n').join('\n   ')}\n`;
  }

  return output;
}

function groupLogsByLevel(logs: EnrichedLogEntry[]): Record<string, number> {
  return logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

// ============================================================================
// Main Handler
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Method validation
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only POST requests are accepted',
    });
  }

  // Content-Type validation
  const contentType = req.headers['content-type'];
  if (!contentType?.includes('application/json')) {
    return res.status(415).json({
      success: false,
      error: 'Unsupported media type',
      message: 'Content-Type must be application/json',
    });
  }

  // Optional: API Key authentication
  const apiKey = process.env.LOG_API_KEY;
  if (apiKey) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Valid API key required',
      });
    }
  }

  // Rate limiting
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId);
  
  res.setHeader('X-RateLimit-Limit', CONFIG.RATE_LIMIT_MAX_REQUESTS.toString());
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());

  if (!rateLimit.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: `Rate limit exceeded. Maximum ${CONFIG.RATE_LIMIT_MAX_REQUESTS} requests per minute.`,
      retryAfter: 60,
    });
  }

  try {
    const body = req.body;

    // Body validation
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        message: 'Request body must be a JSON object or array',
      });
    }

    // Support both array and single log entry
    const logsArray = Array.isArray(body) ? body : [body];

    // Array size validation
    if (logsArray.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Empty request',
        message: 'At least one log entry is required',
      });
    }

    if (logsArray.length > CONFIG.MAX_LOGS_PER_REQUEST) {
      return res.status(400).json({
        success: false,
        error: 'Batch size exceeded',
        message: `Maximum ${CONFIG.MAX_LOGS_PER_REQUEST} logs per request. Received ${logsArray.length}.`,
      });
    }

    // Validate and sanitize entries
    const validLogs: LogEntry[] = [];
    const errors: Array<{ index: number; reason: string }> = [];

    for (let i = 0; i < logsArray.length; i++) {
      const entry = logsArray[i];

      if (!isValidLogEntry(entry)) {
        errors.push({ index: i, reason: 'Invalid log entry structure' });
        continue;
      }

      if (!isValidTimestamp(entry.timestamp)) {
        errors.push({ index: i, reason: 'Invalid timestamp format' });
        continue;
      }

      validLogs.push(sanitizeLogEntry(entry));
    }

    // No valid logs
    if (validLogs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'No valid log entries found',
        details: errors,
      });
    }

    // Enrich logs with metadata
    const environment = process.env.NODE_ENV || 'production';
    const enrichedLogs: EnrichedLogEntry[] = validLogs.map(log => ({
      ...log,
      id: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
      ip: clientId,
      environment,
    }));

    // Log to console
    const logsByLevel = groupLogsByLevel(enrichedLogs);
    const summary = Object.entries(logsByLevel)
      .map(([level, count]) => `${level}: ${count}`)
      .join(', ');

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 Received ${enrichedLogs.length} log(s) from ${clientId}`);
    console.log(`📈 Summary: ${summary}`);
    console.log(`${'='.repeat(80)}\n`);

    // Log details based on environment and level
    const isDev = environment === 'development';
    
    if (isDev) {
      // In development, log everything
      enrichedLogs.forEach(log => {
        console.log(formatLogForConsole(log));
      });
    } else {
      // In production, only log warnings and errors
      const criticalLogs = enrichedLogs.filter(log => 
        log.level === 'error' || log.level === 'warn'
      );

      if (criticalLogs.length > 0) {
        console.log(`\n⚠️  Critical logs (${criticalLogs.length}):\n`);
        criticalLogs.forEach(log => {
          console.log(formatLogForConsole(log));
        });
      }

      // Log summary of debug/info
      const nonCriticalCount = enrichedLogs.length - criticalLogs.length;
      if (nonCriticalCount > 0) {
        console.log(`✅ ${nonCriticalCount} debug/info log(s) received (suppressed in production)\n`);
      }
    }

    // TODO: Send to external logging service
    // await sendToLoggingService(enrichedLogs);
    // Example: await sendToDatadog(enrichedLogs);
    // Example: await sendToCloudWatch(enrichedLogs);

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Logs processed successfully',
      received: validLogs.length,
      rejected: errors.length > 0 ? errors.length : undefined,
      errors: errors.length > 0 && isDev ? errors : undefined,
    });

  } catch (error) {
    console.error('\n❌ Error processing logs:', error);

    const isDev = process.env.NODE_ENV === 'development';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process logs',
      details: isDev ? errorMessage : undefined,
    });
  }
}