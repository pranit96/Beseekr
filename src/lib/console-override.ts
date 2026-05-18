// Console Override - Disables all console methods globally
// Import this early in main.tsx to ensure absolutely nothing is printed to the browser console

const noop = () => {};

// Override all console methods
console.log = noop;
console.info = noop;
console.warn = noop;
console.error = noop;
console.debug = noop;
console.trace = noop;
console.dir = noop;
console.table = noop;
console.group = noop;
console.groupCollapsed = noop;
console.groupEnd = noop;
console.time = noop;
console.timeEnd = noop;
console.count = noop;
console.assert = noop;

// Export empty devConsole object to maintain module signature compatibility
export const devConsole = {
  log: noop,
  info: noop,
  warn: noop,
  error: noop,
  debug: noop,
};

// Export fallback empty functions to prevent any compiler errors in dependent modules
export const enableConsoleTemporarily = () => {};
export const disableConsole = () => {};
