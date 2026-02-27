// Signal Card Component with Enhanced UI
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Target, 
  Shield, 
  Calendar,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignalCardProps {
  signal: {
    id: string;
    stocks: { symbol: string; name: string };
    trading_strategies: { name: string };
    entry_price: number;
    target_price: number;
    stop_loss: number;
    risk_reward: number;
    confidence_score: number;
    status: string;
    created_at: string;
  };
  currentPrice?: number;
  onTrade?: () => void;
  onDetails?: () => void;
}

export function SignalCard({ signal, currentPrice, onTrade, onDetails }: SignalCardProps) {
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (score >= 60) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  const getRRColor = (rr: number) => {
    if (rr >= 3) return 'text-green-500';
    if (rr >= 2) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const potentialProfit = currentPrice 
    ? ((signal.target_price - currentPrice) / currentPrice * 100).toFixed(2)
    : ((signal.target_price - signal.entry_price) / signal.entry_price * 100).toFixed(2);

  const potentialLoss = currentPrice
    ? ((currentPrice - signal.stop_loss) / currentPrice * 100).toFixed(2)
    : ((signal.entry_price - signal.stop_loss) / signal.entry_price * 100).toFixed(2);

  return (
    <Card className="hover:shadow-lg transition-all border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              {signal.stocks.symbol}
              <Sparkles className="h-4 w-4 text-primary" />
            </CardTitle>
            <p className="text-sm text-muted-foreground">{signal.stocks.name}</p>
          </div>
          
          <Badge className={cn("gap-1", getConfidenceColor(signal.confidence_score))}>
            {signal.confidence_score}% Confidence
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Strategy */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            {signal.trading_strategies.name}
          </Badge>
          <Badge variant="outline" className={cn("gap-1", getRRColor(signal.risk_reward))}>
            {signal.risk_reward.toFixed(1)}:1 RR
          </Badge>
        </div>

        {/* Price Levels */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowRight className="h-3 w-3" />
              Entry
            </div>
            <div className="font-bold">₹{signal.entry_price.toFixed(2)}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-green-500">
              <Target className="h-3 w-3" />
              Target
            </div>
            <div className="font-bold text-green-500">₹{signal.target_price.toFixed(2)}</div>
            <div className="text-xs text-green-500">+{potentialProfit}%</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-red-500">
              <Shield className="h-3 w-3" />
              Stop Loss
            </div>
            <div className="font-bold text-red-500">₹{signal.stop_loss.toFixed(2)}</div>
            <div className="text-xs text-red-500">-{potentialLoss}%</div>
          </div>
        </div>

        {/* Current Price */}
        {currentPrice && (
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Current Price</span>
            <span className="font-bold">₹{currentPrice.toFixed(2)}</span>
          </div>
        )}

        {/* Time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {new Date(signal.created_at).toLocaleDateString()} at {new Date(signal.created_at).toLocaleTimeString()}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={onTrade} className="flex-1 gap-2">
            <TrendingUp className="h-4 w-4" />
            Trade Now
          </Button>
          <Button onClick={onDetails} variant="outline" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
