/**
 * SYSTEM MONITORING DASHBOARD
 * 
 * Real-time monitoring of trading system health, performance, and alerts
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Database,
  Zap,
  Clock,
  RefreshCw,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { stockStrategyApi } from '@/api/stockStrategy';

export default function SystemMonitoring() {
  const [metrics, setMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadData();
    
    if (autoRefresh) {
      const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      const [metricsData, alertsData] = await Promise.all([
        stockStrategyApi.getSystemMetrics(),
        stockStrategyApi.getSystemAlerts()
      ]);

      setMetrics(metricsData);
      setAlerts(alertsData || []);
    } catch (error: any) {
      toast.error('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const testAlerts = async () => {
    try {
      await stockStrategyApi.testAlerts();
      toast.success('Test alerts sent to all configured channels');
    } catch (error: any) {
      toast.error('Failed to send test alerts');
    }
  };

  const resetMetrics = async () => {
    try {
      await stockStrategyApi.resetMetrics();
      toast.success('Metrics reset successfully');
      loadData();
    } catch (error: any) {
      toast.error('Failed to reset metrics');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'unhealthy': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-6 w-6" />;
      case 'degraded': return <AlertTriangle className="h-6 w-6" />;
      case 'unhealthy': return <XCircle className="h-6 w-6" />;
      default: return <Activity className="h-6 w-6" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">Real-time performance and health metrics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/dashboard/stocks'}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={autoRefresh ? 'animate-spin' : ''} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={testAlerts}>
            <Bell />
            Test Alerts
          </Button>
          <Button variant="destructive" size="sm" onClick={resetMetrics}>
            Reset Metrics
          </Button>
        </div>
      </div>

      {/* Health Status */}
      <Card className="border-2" style={{
        borderColor: metrics?.health?.status === 'healthy' ? 'rgb(34, 197, 94)' : 
                     metrics?.health?.status === 'degraded' ? 'rgb(234, 179, 8)' : 
                     'rgb(239, 68, 68)'
      }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={getHealthColor(metrics?.health?.status)}>
                {getHealthIcon(metrics?.health?.status)}
              </div>
              <div>
                <h2 className="text-2xl font-bold capitalize">{metrics?.health?.status}</h2>
                <p className="text-muted-foreground">
                  Uptime: {formatUptime(metrics?.uptime || 0)}
                </p>
              </div>
            </div>
            {metrics?.health?.issues?.length > 0 && (
              <div className="text-right">
                <p className="text-sm font-semibold text-red-500">Issues Detected:</p>
                {metrics.health.issues.map((issue: string, i: number) => (
                  <p key={i} className="text-sm text-muted-foreground">{issue}</p>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={
                    alert.severity === 'high' ? 'destructive' : 
                    alert.severity === 'medium' ? 'default' : 
                    'secondary'
                  }>
                    {alert.severity.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{alert.type}</span>
                </div>
                <p className="text-sm">{alert.message}</p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Value: {alert.value}</span>
                  <span>Threshold: {alert.threshold}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Metrics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="indicators">Indicators</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Total Analyses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.analysis?.count || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Avg Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.analysis?.avgDuration || 0}ms</div>
                <p className="text-xs text-muted-foreground mt-1">
                  P95: {metrics?.analysis?.p95Duration || 0}ms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Error Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.analysis?.errorRate || '0%'}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics?.analysis?.errorCount || 0} errors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  P99 Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.analysis?.p99Duration || 0}ms</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Cache Hit Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.cache?.hitRate || '0%'}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cache Hits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{metrics?.cache?.hits || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cache Misses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{metrics?.cache?.misses || 0}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="indicators" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(metrics?.indicators || {}).map(([name, stats]: [string, any]) => (
              <Card key={name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{name.toUpperCase()}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Count:</span>
                    <span className="font-semibold">{stats.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Duration:</span>
                    <span className="font-semibold">{Math.round(stats.avgDuration)}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Success Rate:</span>
                    <span className="font-semibold">{(stats.successRate * 100).toFixed(1)}%</span>
                  </div>
                  {stats.errors > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Errors:</span>
                      <span className="font-semibold text-red-500">{stats.errors}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          {metrics?.errors?.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Top Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.errors.map((error: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-mono flex-1">{error.error}</p>
                        <Badge variant="destructive">{error.count}x</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Errors</h3>
                <p className="text-muted-foreground">System is running smoothly</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
