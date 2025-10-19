import { useMemo } from 'react';
import { abTesting } from '@/lib/ab-testing';
import { useAuth } from '@/contexts/AuthContext';

export function useABTest(experimentId: string): string {
  const { user } = useAuth();
  
  const variant = useMemo(() => {
    return abTesting.getVariant(experimentId, user?.id);
  }, [experimentId, user?.id]);

  return variant;
}
