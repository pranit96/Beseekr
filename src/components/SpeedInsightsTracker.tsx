import { SpeedInsights } from "@vercel/speed-insights/react";

/**
 * SpeedInsightsTracker component
 *
 * Wraps Vercel Speed Insights for performance monitoring.
 * NOTE: This component is rendered outside BrowserRouter, so we cannot use useLocation.
 * Speed Insights automatically tracks Web Vitals (LCP, FID, CLS, INP, TTFB).
 */
export function SpeedInsightsTracker() {
  return <SpeedInsights />;
}
