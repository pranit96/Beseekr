// src/main.tsx - COMPLETE FILE WITH ACTIVITY TRACKING
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker, trackActivity } from "./lib/serviceWorker";

// Register service worker for caching
registerServiceWorker();

// Track user activity to prevent disruptive reloads
const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
activityEvents.forEach(event => {
  window.addEventListener(event, trackActivity, { passive: true });
});

createRoot(document.getElementById("root")!).render(<App />);