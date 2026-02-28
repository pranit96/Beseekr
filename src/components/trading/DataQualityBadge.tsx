import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface DataQualityBadgeProps {
  score: number;
  warnings?: string[];
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function DataQualityBadge({ 
  score, 
  warnings = [], 
  showIcon = true,
  size = 'md' 
}: DataQualityBadgeProps) {
  const getQualityLevel = (score: number) => {
    if (score >= 90) return { label: 'Excellent', variant: 'default' as const, color: 'text-green-500', icon: CheckCircle2 };
    if (score >= 70) return { label: 'Good', variant: 'secondary' as const, color: 'text-green-500', icon: CheckCircle2 };
    if (score >= 50) return { label: 'Fair', variant: 'secondary' as const, color: 'text-yellow-500', icon: AlertTriangle };
    return { label: 'Poor', variant: 'destructive' as const, color: 'text-red-500', icon: XCircle };
  };

  const quality = getQualityLevel(score);
  const Icon = quality.icon;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const content = (
    <Badge variant={quality.variant} className={sizeClasses[size]}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {score}/100 - {quality.label}
    </Badge>
  );

  if (warnings.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-semibold">Data Quality: {score}/100</p>
              {warnings.length > 0 && (
                <>
                  <p className="text-xs text-yellow-500">Warnings:</p>
                  <ul className="text-xs list-disc list-inside">
                    {warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

interface MarketStatusIndicatorProps {
  isOpen: boolean;
  canTrade: boolean;
  reason?: string;
  warning?: string;
}

export function MarketStatusIndicator({ 
  isOpen, 
  canTrade, 
  reason,
  warning 
}: MarketStatusIndicatorProps) {
  const getStatus = () => {
    if (!isOpen) return { label: 'CLOSED', variant: 'secondary' as const, icon: XCircle };
    if (!canTrade) return { label: 'BLOCKED', variant: 'destructive' as const, icon: XCircle };
    if (warning) return { label: 'CAUTION', variant: 'secondary' as const, icon: AlertTriangle };
    return { label: 'OPEN', variant: 'default' as const, icon: CheckCircle2 };
  };

  const status = getStatus();
  const Icon = status.icon;

  const content = (
    <Badge variant={status.variant}>
      <Icon className="h-3 w-3 mr-1" />
      {status.label}
    </Badge>
  );

  if (reason || warning) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-semibold">Market Status</p>
              {reason && <p className="text-xs text-red-500">{reason}</p>}
              {warning && <p className="text-xs text-yellow-500">{warning}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
