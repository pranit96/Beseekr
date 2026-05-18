// src/main.tsx - SERVICE WORKER DISABLED
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Console override in production
import "./lib/console-override";

// Socket initialization
import { initSocketOnUserInteraction } from "./services/socketInit";

// =============================================
// SERVICE WORKER COMPLETELY DISABLED
// =============================================

// Clean up any existing service workers on startup
async function cleanupServiceWorkers() {
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log(
          "[Cleanup] Unregistered service worker:",
          registration.scope,
        );
      }
    } catch (e) {
      // Ignore errors
    }
  }

  // Clear all caches
  if ("caches" in window) {
    try {
      const names = await caches.keys();
      for (const name of names) {
        await caches.delete(name);
        console.log("[Cleanup] Deleted cache:", name);
      }
    } catch (e) {
      // Ignore errors
    }
  }
}

// Run cleanup on startup
cleanupServiceWorkers();

// Initialize socket on user interaction
initSocketOnUserInteraction();

// Render app
createRoot(document.getElementById("root")!).render(<App />);
