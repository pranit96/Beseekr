import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { TrendingUp, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface Metrics {
  totalOrders: number;
  completedOrders: number;
  failedOrders: number;
  averageProcessingTime: number;
}

export function DeckMetricsCard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await apiClient.getDeckMetrics();
      if (response.success && response.data) {
        setMetrics(response.data);
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  const successRate = metrics.totalOrders > 0
    ? Math.round((metrics.completedOrders / metrics.totalOrders) * 100)
    : 0;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Your Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-2xl font-bold">{metrics.totalOrders}</p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-500">{successRate}%</p>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Completed</span>
            </div>
            <span className="font-medium">{metrics.completedOrders}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-muted-foreground">Failed</span>
            </div>
            <span className="font-medium">{metrics.failedOrders}</span>
          </div>

          {metrics.averageProcessingTime > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">Avg. Time</span>
              </div>
              <span className="font-medium">{formatTime(metrics.averageProcessingTime)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
