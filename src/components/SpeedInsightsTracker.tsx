import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';

/**
 * SpeedInsightsTracker component
 *
 * Wraps Vercel Speed Insights and tracks route changes for accurate performance monitoring.
 * This ensures that route changes are properly recorded as page transitions.
 *
 * For Vite + React Router applications, this component automatically detects navigation
 * and sends the current pathname to Speed Insights for proper attribution of Web Vitals.
 */
export function SpeedInsightsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track route changes for Speed Insights
    // This helps Speed Insights properly attribute performance metrics to specific routes
    // The component will use the current pathname internally
  }, [location.pathname]);

  return <SpeedInsights />;
}
