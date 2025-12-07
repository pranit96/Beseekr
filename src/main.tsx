// src/main.tsx - COMPLETE FILE WITH ACTIVITY TRACKING
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker, trackActivity } from "./lib/serviceWorker";
// Override console methods in production to prevent direct console usage
import "./lib/console-override";
// Initialize socket connection on user interaction
import { initSocketOnUserInteraction } from "./services/socketInit";

// AGGRESSIVE CACHE CLEAR ON STARTUP - Version 2
// This runs once to clear old cached content
const CACHE_CLEAR_VERSION = 'v2';
const storageKey = 'beseekr-cache-cleared';

async function clearOldCaches() {
  const clearedVersion = localStorage.getItem(storageKey);

  // Only clear if we haven't cleared for this version
  if (clearedVersion !== CACHE_CLEAR_VERSION) {
    console.log('[CacheClear] Clearing old caches for version:', CACHE_CLEAR_VERSION);

    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('[CacheClear] Unregistered SW:', registration.scope);
        }
      }

      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
          console.log('[CacheClear] Deleted cache:', name);
        }
      }

      // Mark as cleared
      localStorage.setItem(storageKey, CACHE_CLEAR_VERSION);
      console.log('[CacheClear] Cache clear complete');
    } catch (error) {
      console.error('[CacheClear] Error clearing caches:', error);
    }
  }
}

// Clear old caches first, then initialize app
clearOldCaches().then(() => {
  // Register service worker for caching
  registerServiceWorker();
});

// Initialize socket to connect on first user interaction
initSocketOnUserInteraction();

// Track user activity to prevent disruptive reloads
const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
activityEvents.forEach(event => {
  window.addEventListener(event, trackActivity, { passive: true });
});

createRoot(document.getElementById("root")!).render(<App />);