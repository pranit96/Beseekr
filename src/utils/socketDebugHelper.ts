// Socket debugging helper utilities
import { deepAnalyticsSocket } from '@/services/deepAnalyticsSocket';
import { createLogger } from '@/services/logging';

const logger = createLogger('SocketDebugHelper');

/**
 * Test the socket subscription flow with detailed logging
 */
export async function testSocketSubscription(sessionId: string): Promise<void> {
  logger.info('🧪 [TEST] Starting socket subscription test', { sessionId });

  // Step 1: Check initial state
  const initialStats = deepAnalyticsSocket.getStats();
  logger.info('📊 [TEST] Initial stats', initialStats);

  // Step 2: Connect if not connected
  if (!deepAnalyticsSocket.isConnected()) {
    logger.info('🔌 [TEST] Connecting socket...');
    deepAnalyticsSocket.connect();
    
    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      const checkConnection = setInterval(() => {
        if (deepAnalyticsSocket.isConnected()) {
          clearInterval(checkConnection);
          clearTimeout(timeout);
          logger.info('✅ [TEST] Socket connected');
          resolve();
        }
      }, 100);
    });
  } else {
    logger.info('✅ [TEST] Socket already connected');
  }

  // Step 3: Check stats after connection
  const connectedStats = deepAnalyticsSocket.getStats();
  logger.info('📊 [TEST] Connected stats', connectedStats);

  // Step 4: Subscribe to session
  logger.info('📡 [TEST] Subscribing to session...', { sessionId });
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Subscription timeout - no confirmation received'));
    }, 15000);

    deepAnalyticsSocket.subscribeToSession(sessionId, {
      onConnected: (data) => {
        logger.info('✅ [TEST] onConnected callback', data);
      },
      onSubscribed: (data) => {
        logger.info('✅ [TEST] onSubscribed callback', data);
        clearTimeout(timeout);
        
        // Check final stats
        const finalStats = deepAnalyticsSocket.getStats();
        logger.info('📊 [TEST] Final stats after subscription', finalStats);
        
        resolve();
      },
      onProgress: (data) => {
        logger.info('📊 [TEST] onProgress callback', data);
      },
      onError: (error) => {
        logger.error('❌ [TEST] onError callback', error);
        clearTimeout(timeout);
        reject(error);
      },
    });
  });
}

/**
 * Monitor socket events for debugging
 */
export function startSocketMonitoring(): () => void {
  logger.info('👀 [MONITOR] Starting socket event monitoring');

  const interval = setInterval(() => {
    const stats = deepAnalyticsSocket.getStats();
    logger.debug('📊 [MONITOR] Current stats', {
      connected: stats.connected,
      socketId: stats.socketId,
      userId: stats.userId,
      subscriptions: stats.activeSubscriptions.length,
      sessionIds: stats.activeSubscriptions
    });
  }, 5000);

  return () => {
    logger.info('🛑 [MONITOR] Stopping socket event monitoring');
    clearInterval(interval);
  };
}

/**
 * Verify session ID matches between frontend and backend
 */
export function verifySessionId(sessionId: string, jobId?: string): void {
  logger.info('🔍 [VERIFY] Session ID verification', {
    sessionId,
    jobId,
    sessionIdType: typeof sessionId,
    sessionIdLength: sessionId?.length,
    isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)
  });

  if (!sessionId) {
    logger.error('❌ [VERIFY] Session ID is missing!');
    return;
  }

  if (sessionId === jobId) {
    logger.warn('⚠️ [VERIFY] Session ID and Job ID are the same - this might be incorrect');
  }
}

/**
 * Test the complete flow: queue analysis -> subscribe -> wait for result
 */
export async function testCompleteFlow(
  queueFn: () => Promise<{ sessionId: string; jobId: string }>,
  subscribeFn: (sessionId: string) => void
): Promise<void> {
  logger.info('🧪 [FLOW] Starting complete flow test');

  try {
    // Step 1: Queue analysis
    logger.info('📤 [FLOW] Queueing analysis...');
    const { sessionId, jobId } = await queueFn();
    logger.info('✅ [FLOW] Analysis queued', { sessionId, jobId });

    // Step 2: Verify IDs
    verifySessionId(sessionId, jobId);

    // Step 3: Wait a bit to ensure backend is ready
    logger.info('⏳ [FLOW] Waiting 1 second for backend to be ready...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Subscribe
    logger.info('📡 [FLOW] Subscribing to session...');
    subscribeFn(sessionId);

    logger.info('✅ [FLOW] Flow test initiated successfully');
  } catch (error: any) {
    logger.error('❌ [FLOW] Flow test failed', { error: error.message });
    throw error;
  }
}
