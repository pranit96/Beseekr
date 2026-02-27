// Live Price Card Component with Real-Time Updates
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LivePriceCardProps {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  onClick?: () => void;
}

export function LivePriceCard({
  symbol,
  name,
  price,
  change,
  changePercent,
  volume,
  onClick
}: LivePriceCardProps) {
  const [priceAnimation, setPriceAnimation] = useState<'up' | 'down' | null>(null);
  const [prevPrice, setPrevPrice] = useState(price);

  useEffect(() => {
    if (price !== prevPrice) {
      setPriceAnimation(price > prevPrice ? 'up' : 'down');
      setPrevPrice(price);
      
      const timer = setTimeout(() => setPriceAnimation(null), 500);
      return () => clearTimeout(timer);
    }
  }, [price, prevPrice]);

  const isPositive = change >= 0;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg",
        priceAnimation === 'up' && "bg-green-500/5 border-green-500/20",
        priceAnimation === 'down' && "bg-red-500/5 border-red-500/20"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">{symbol}</h3>
              <Activity className="h-4 w-4 text-muted-foreground animate-pulse" />
            </div>
            {name && <p className="text-sm text-muted-foreground">{name}</p>}
          </div>
          
          <Badge variant={isPositive ? "default" : "destructive"} className="gap-1">
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {changePercent.toFixed(2)}%
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-2xl font-bold transition-colors",
              priceAnimation === 'up' && "text-green-500",
              priceAnimation === 'down' && "text-red-500"
            )}>
              ₹{price.toFixed(2)}
            </span>
            <span className={cn(
              "text-sm font-medium",
              isPositive ? "text-green-500" : "text-red-500"
            )}>
              {isPositive ? '+' : ''}{change.toFixed(2)}
            </span>
          </div>

          {volume && (
            <div className="text-xs text-muted-foreground">
              Vol: {(volume / 1000000).toFixed(2)}M
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
