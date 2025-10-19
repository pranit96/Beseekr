// src/lib/serviceWorker.ts - FIXED (Silent Updates in Background)
import { createLogger } from '@/services/logging';

const logger = createLogger('ServiceWorker');

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    logger.info('Service workers not supported');
    return;
  }

  // Register on page load
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always fetch fresh SW file
      });

      logger.info('Service worker registered', { scope: registration.scope });

      // SILENT UPDATE: Check for updates but don't prompt user
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

      // Handle updates SILENTLY
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available - activate silently
              logger.info('New version available, will update on next page load');
              
              // Option 1: Auto-activate silently (recommended)
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              
              // Option 2: Only show notification (no prompt)
              // showUpdateNotification();
            }
          });
        }
      });

      // Handle controller change - reload only if necessary
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        logger.info('Controller changed');
        
        // Only reload if user is not actively typing/interacting
        if (document.hidden || !isUserActive()) {
          refreshing = true;
          window.location.reload();
        }
      });

    } catch (error) {
      logger.error('Registration failed', { error });
    }
  });
}

/**
 * Check if user is actively interacting
 */
function isUserActive(): boolean {
  // Check if any input/textarea is focused
  const activeElement = document.activeElement;
  if (activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.getAttribute('contenteditable') === 'true'
  )) {
    return true;
  }
  
  // Check for recent activity (last 5 seconds)
  const lastActivity = (window as any)._lastActivity || 0;
  return Date.now() - lastActivity < 5000;
}

/**
 * Track user activity (call this from your app)
 */
export function trackActivity() {
  (window as any)._lastActivity = Date.now();
}

/**
 * Show subtle update notification (optional)
 */
function showUpdateNotification() {
  // Only show a small non-intrusive toast, no prompt
  const event = new CustomEvent('sw-update-available', {
    detail: { message: 'App updated - refresh when convenient' }
  });
  window.dispatchEvent(event);
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const unregistered = await registration.unregister();
    logger.info('Service worker unregistered', { unregistered });
    return unregistered;
  } catch (error) {
    logger.error('Unregistration failed', { error });
    return false;
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches() {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(name => caches.delete(name))
    );
    logger.info('All caches cleared');
    return true;
  } catch (error) {
    logger.error('Failed to clear caches', { error });
    return false;
  }
}

/**
 * Clear API cache only
 */
export async function clearApiCache() {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    return false;
  }

  try {
    navigator.serviceWorker.controller.postMessage({ 
      type: 'CLEAR_API_CACHE' 
    });
    logger.info('API cache clear requested');
    return true;
  } catch (error) {
    logger.error('Failed to clear API cache', { error });
    return false;
  }
}