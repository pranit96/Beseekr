import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';

export function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    analytics.page(location.pathname);
  }, [location]);

  return {
    track: analytics.track.bind(analytics),
    identify: analytics.identify.bind(analytics),
  };
}
