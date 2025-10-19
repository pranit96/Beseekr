import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
  data?: Record<string, any>;
  userAgent?: string;
  url?: string;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const logs: LogEntry[] = JSON.parse(event.body || '[]');
    
    // Log to console (visible in Netlify function logs)
    console.log('Received logs:', JSON.stringify(logs, null, 2));
    
    // Here you could:
    // - Send to external logging service (Datadog, LogRocket, etc.)
    // - Store in database
    // - Send to analytics platform
    // For now, just acknowledge receipt
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        received: logs.length 
      }),
    };
  } catch (error) {
    console.error('Error processing logs:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to process logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler };
