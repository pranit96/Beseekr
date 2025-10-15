// src/lib/serviceWorker.ts - SERVICE WORKER REGISTRATION
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
    return;
  }

  // Register on page load
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SW] Service worker registered:', registration.scope);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('[SW] New version available');
              
              // Optionally notify user
              if (window.confirm('New version available! Reload to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        }
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Controller changed');
        window.location.reload();
      });

    } catch (error) {
      console.error('[SW] Registration failed:', error);
    }
  });
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
    console.log('[SW] Service worker unregistered:', unregistered);
    return unregistered;
  } catch (error) {
    console.error('[SW] Unregistration failed:', error);
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
    console.log('[SW] All caches cleared');
    return true;
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
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
    console.log('[SW] API cache clear requested');
    return true;
  } catch (error) {
    console.error('[SW] Failed to clear API cache:', error);
    return false;
  }
}