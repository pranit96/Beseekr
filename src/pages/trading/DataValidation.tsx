import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { tradingApi } from "@/api/trading";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Shield,
  BarChart3,
} from "lucide-react";

export default function DataValidation() {
  const [marketStatus, setMarketStatus] = useState<any>(null);
  const [validationMetrics, setValidationMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [status, metrics] = await Promise.all([
        tradingApi.getMarketStatus(),
        tradingApi.getValidationMetrics(7),
      ]);
      setMarketStatus(status);
      setValidationMetrics(metrics);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !marketStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Loading validation data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const failureRate = parseFloat(
    validationMetrics?.summary?.failure_rate || "0",
  );
  const avgQualityScore = parseFloat(
    validationMetrics?.summary?.avg_quality_score || "0",
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Data Validation & Quality</h1>
        <p className="text-muted-foreground mt-2">
          Real-time monitoring of data quality and validation metrics
        </p>
      </div>

      {/* Market Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Market Status
          </CardTitle>
          <CardDescription>
            Current market conditions and trading availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Market Open/Close */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {marketStatus?.market?.is_open ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">Market Status</span>
              </div>
              <Badge
                variant={
                  marketStatus?.market?.is_open ? "default" : "secondary"
                }
              >
                {marketStatus?.market?.status || "UNKNOWN"}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {marketStatus?.market?.market_hours}
              </p>
            </div>

            {/* Trading Allowed */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {marketStatus?.validation?.canTrade ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">Trading Status</span>
              </div>
              <Badge
                variant={
                  marketStatus?.validation?.canTrade ? "default" : "destructive"
                }
              >
                {marketStatus?.validation?.canTrade ? "ALLOWED" : "BLOCKED"}
              </Badge>
              {marketStatus?.validation?.reason && (
                <p className="text-sm text-muted-foreground">
                  {marketStatus.validation.reason}
                </p>
              )}
              {marketStatus?.validation?.warning && (
                <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {marketStatus.validation.warning}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Circuit Breaker */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Circuit Breaker</span>
              </div>
              <Badge
                variant={
                  marketStatus?.circuit_breaker?.state === "CLOSED"
                    ? "default"
                    : marketStatus?.circuit_breaker?.state === "OPEN"
                      ? "destructive"
                      : "secondary"
                }
              >
                {marketStatus?.circuit_breaker?.state || "UNKNOWN"}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Failures: {marketStatus?.circuit_breaker?.failures || 0}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Last updated: {new Date(marketStatus?.timestamp).toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Validation Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total Validations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {validationMetrics?.summary?.total_validations?.toLocaleString() ||
                "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={`text-2xl font-bold ${failureRate > 5 ? "text-red-500" : "text-green-500"}`}
              >
                {validationMetrics?.summary?.failure_rate || "0"}%
              </div>
              {failureRate > 5 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {failureRate > 5 ? "Above threshold" : "Within limits"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Avg Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={`text-2xl font-bold ${avgQualityScore < 70 ? "text-red-500" : avgQualityScore < 85 ? "text-yellow-500" : "text-green-500"}`}
              >
                {validationMetrics?.summary?.avg_quality_score || "0"}
              </div>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {avgQualityScore >= 85
                ? "Excellent"
                : avgQualityScore >= 70
                  ? "Good"
                  : "Poor"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Failed Validations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {validationMetrics?.summary?.total_failures?.toLocaleString() ||
                "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Metrics Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Daily Validation Metrics
          </CardTitle>
          <CardDescription>
            Validation performance over the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validationMetrics?.daily_metrics &&
          validationMetrics.daily_metrics.length > 0 ? (
            <div className="space-y-4">
              {validationMetrics.daily_metrics.map((day: any) => {
                const dayFailureRate =
                  day.total_validations > 0
                    ? (
                        (day.failed_validations / day.total_validations) *
                        100
                      ).toFixed(2)
                    : "0.00";

                return (
                  <div key={day.date} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">
                          {day.total_validations} validations
                        </span>
                        <span
                          className={
                            parseFloat(dayFailureRate) > 5
                              ? "text-red-500"
                              : "text-green-500"
                          }
                        >
                          {dayFailureRate}% failed
                        </span>
                        <span className="text-muted-foreground">
                          Quality:{" "}
                          {parseFloat(day.avg_quality_score).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          parseFloat(dayFailureRate) > 5
                            ? "bg-red-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(100, (day.failed_validations / day.total_validations) * 100 * 20)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No validation data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Failures */}
      {validationMetrics?.recent_failures &&
        validationMetrics.recent_failures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Recent Validation Failures
              </CardTitle>
              <CardDescription>
                Last 10 validation failures requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validationMetrics.recent_failures
                  .slice(0, 10)
                  .map((failure: any) => (
                    <div
                      key={failure.id}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">{failure.symbol}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {failure.validation_type}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(failure.created_at).toLocaleString()}
                        </span>
                      </div>
                      {failure.errors && failure.errors.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-red-500">
                            Errors:
                          </span>
                          <ul className="list-disc list-inside ml-2 text-muted-foreground">
                            {failure.errors.map(
                              (error: string, idx: number) => (
                                <li key={idx}>{error}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                      {failure.warnings && failure.warnings.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-yellow-500">
                            Warnings:
                          </span>
                          <ul className="list-disc list-inside ml-2 text-muted-foreground">
                            {failure.warnings.map(
                              (warning: string, idx: number) => (
                                <li key={idx}>{warning}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                      {failure.data_quality_score !== null && (
                        <div className="text-sm">
                          <span className="font-medium">Quality Score:</span>
                          <span
                            className={`ml-2 ${
                              failure.data_quality_score < 70
                                ? "text-red-500"
                                : "text-yellow-500"
                            }`}
                          >
                            {failure.data_quality_score}/100
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Info Alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Data Validation System:</strong> All trading data is
          automatically validated before use. Trades are blocked when data
          quality is insufficient or market conditions are unfavorable. This
          protects your capital from bad data and ensures professional-grade
          risk management.
        </AlertDescription>
      </Alert>
    </div>
  );
}
