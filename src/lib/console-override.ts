// Console Override - Prevents direct console usage in production
// Import this early in your app to disable console methods

const isDevelopment = import.meta.env.DEV;

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

// No-op function for production
const noop = () => { };

// DISABLED: Override console methods in production
// Console logs are now handled by the logging service
// and we want to see server-side logs in Vercel
// if (!isDevelopment) {
//   console.log = noop;
//   console.info = noop;
//   console.warn = noop;
//   console.error = noop;
//   console.debug = noop;
// }

// Export original console for emergency debugging
export const devConsole = originalConsole;

// Export a function to temporarily enable console for debugging
export const enableConsoleTemporarily = (durationMs: number = 60000) => {
  if (!isDevelopment) {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;

    setTimeout(() => {
      console.log = noop;
      console.info = noop;
      console.warn = noop;
      console.error = noop;
      console.debug = noop;
    }, durationMs);
  }
};

// Export a function to disable console (if needed for specific use cases)
export const disableConsole = () => {
  if (!isDevelopment) {
    console.log = noop;
    console.info = noop;
    console.warn = noop;
    console.error = noop;
    console.debug = noop;
  }
};
