// Example usage of the logging service
// DO NOT import this file - it's just for reference

import { createLogger } from './logging';

// Create a logger for your component/module
const logger = createLogger('MyComponent');

// Usage examples:

// Debug level (only in development)
logger.debug('Component mounted', { props: { id: 123 } });

// Info level
logger.info('User action completed', { action: 'submit', userId: 'abc123' });

// Warning level
logger.warn('Deprecated API used', { api: 'oldMethod', replacement: 'newMethod' });

// Error level
logger.error('Failed to fetch data', { 
  error: 'Network timeout', 
  endpoint: '/api/data',
  retryCount: 3 
});

// In React components:
// import { createLogger } from '@/services/logging';
// const logger = createLogger('ChatInterface');
//
// useEffect(() => {
//   logger.info('Component mounted');
//   return () => logger.debug('Component unmounted');
// }, []);

// In API calls:
// const logger = createLogger('APIClient');
// try {
//   const response = await fetch(url);
//   logger.info('API call successful', { url, status: response.status });
// } catch (error) {
//   logger.error('API call failed', { url, error: error.message });
// }

// In socket handlers:
// const logger = createLogger('SocketService');
// socket.on('connect', () => {
//   logger.info('Socket connected', { socketId: socket.id });
// });
// socket.on('error', (error) => {
//   logger.error('Socket error', { error });
// });
