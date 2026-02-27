// Market Regime Indicator Component
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketRegimeIndicatorProps {
  regime: {
    regime: string;
    description: string;
    strategies?: string[];
  };
  className?: string;
}

export function MarketRegimeIndicator({ regime, className }: MarketRegimeIndicatorProps) {
  const getRegimeConfig = (regimeName: string) => {
    if (regimeName.includes('BULL')) {
      return {
        icon: TrendingUp,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
      };
    }
    if (regimeName.includes('BEAR')) {
      return {
        icon: TrendingDown,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
      };
    }
    if (regimeName.includes('RANGING')) {
      return {
        icon: Activity,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
      };
    }
    return {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
    };
  };

  const config = getRegimeConfig(regime.regime);
  const Icon = config.icon;

  return (
    <Card className={cn("border-l-4", config.borderColor, className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-3 rounded-full", config.bgColor)}>
            <Icon className={cn("h-6 w-6", config.color)} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">Market Regime</h3>
              <Badge className={cn("gap-1", config.color, config.bgColor)}>
                {regime.regime}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{regime.description}</p>
            
            {regime.strategies && regime.strategies.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {regime.strategies.map((strategy, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {strategy}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
