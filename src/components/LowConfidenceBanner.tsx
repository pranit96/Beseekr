// Low Confidence Banner - Prompts user to provide supplemental data
import React, { useState } from "react";
import { AlertTriangle, Upload, Edit3, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LowConfidenceKPI {
  kpi: string;
  confidence: number;
  value?: number;
  unit?: string;
  threshold: number;
  canImprove: boolean;
}

interface LowConfidenceBannerProps {
  sessionId: string;
  lowConfidenceKPIs: LowConfidenceKPI[];
  onUploadFiles: () => void;
  onEnterValues: () => void;
  onDismiss: () => void;
}

const formatKPIName = (kpi: string): string => {
  const names: Record<string, string> = {
    mrr: "Monthly Recurring Revenue",
    arr: "Annual Recurring Revenue",
    cac: "Customer Acquisition Cost",
    ltv: "Lifetime Value",
    customers: "Total Customers",
    churn_rate: "Churn Rate",
    conversion_rate: "Conversion Rate",
  };
  return names[kpi] || kpi.toUpperCase();
};

const formatValue = (
  value: number | undefined,
  unit: string | undefined,
): string => {
  if (value === undefined) return "Not found";
  if (unit === "USD") return `$${value.toLocaleString()}`;
  if (unit === "percent") return `${(value * 100).toFixed(1)}%`;
  return value.toLocaleString();
};

export const LowConfidenceBanner: React.FC<LowConfidenceBannerProps> = ({
  sessionId,
  lowConfidenceKPIs,
  onUploadFiles,
  onEnterValues,
  onDismiss,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="gap-2 bg-amber-500/10 border-amber-500/50 text-amber-600 hover:bg-amber-500/20"
        >
          <AlertTriangle className="w-4 h-4" />
          Low Confidence Detected
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-amber-500/50 bg-amber-500/5 shadow-lg animate-fade-in">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  Low Confidence Detected
                  <span className="text-xs font-normal text-muted-foreground">
                    ({lowConfidenceKPIs.length} metric
                    {lowConfidenceKPIs.length > 1 ? "s" : ""})
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Providing accurate data will significantly improve analysis
                  quality
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 -mt-1"
                onClick={onDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* KPI Details */}
            <div className="space-y-2 mb-4">
              {lowConfidenceKPIs.map((kpi) => (
                <div
                  key={kpi.kpi}
                  className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {formatKPIName(kpi.kpi)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Current: {formatValue(kpi.value, kpi.unit)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs font-medium text-amber-600">
                        {(kpi.confidence * 100).toFixed(0)}% confidence
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Target: {(kpi.threshold * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="w-12 h-12 flex-shrink-0">
                      <svg
                        className="w-full h-full -rotate-90"
                        viewBox="0 0 36 36"
                      >
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          className="stroke-muted"
                          strokeWidth="3"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          className="stroke-amber-500"
                          strokeWidth="3"
                          strokeDasharray={`${kpi.confidence * 100}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={onEnterValues}
                className="gap-2 flex-1 min-w-[140px]"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Enter Values
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onUploadFiles}
                className="gap-2 flex-1 min-w-[140px]"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="gap-2"
              >
                Continue with Estimates
              </Button>
            </div>

            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Providing accurate data can improve analysis quality by up to
                40%
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
