// src/main.tsx - COMPLETE FILE WITH ACTIVITY TRACKING
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker, trackActivity } from "./lib/serviceWorker";
// Override console methods in production to prevent direct console usage
import "./lib/console-override";
// Initialize socket connection on user interaction
import { initSocketOnUserInteraction } from "./services/socketInit";

// Register service worker for caching
registerServiceWorker();

// Initialize socket to connect on first user interaction
initSocketOnUserInteraction();

// Track user activity to prevent disruptive reloads
const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
activityEvents.forEach(event => {
  window.addEventListener(event, trackActivity, { passive: true });
});

createRoot(document.getElementById("root")!).render(<App />);