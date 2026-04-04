// Initialize socket connection on user interaction
import { deepAnalyticsSocket } from "./deepAnalyticsSocket";

/**
 * Initialize socket to connect on first user interaction
 * Call this once in your app entry point (main.tsx or App.tsx)
 */
export function initSocketOnUserInteraction(): void {
  deepAnalyticsSocket.initUserInteractionListener();
}
