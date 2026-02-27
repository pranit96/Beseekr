// Trade Entry Modal - Manual Paper Trading
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Target, Shield, DollarSign, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { stockStrategyApi } from '@/api/stockStrategy';

interface TradeEntryModalProps {
  open: boolean;
  onClose: () => void;
  stock: {
    symbol: string;
    name: string;
    currentPrice: number;
  };
  signal?: {
    entry_price: number;
    target_price: number;
    stop_loss: number;
    risk_reward: number;
  };
}

export function TradeEntryModal({ open, onClose, stock, signal }: TradeEntryModalProps) {
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState(signal?.entry_price || stock.currentPrice);
  const [quantity, setQuantity] = useState(1);
  const [targetPrice, setTargetPrice] = useState(signal?.target_price || 0);
  const [stopLoss, setStopLoss] = useState(signal?.stop_loss || 0);
  const [useSignalPrices, setUseSignalPrices] = useState(!!signal);
  const [loading, setLoading] = useState(false);

  // Update prices when stock changes
  useEffect(() => {
    if (signal && useSignalPrices) {
      setEntryPrice(signal.entry_price);
      setTargetPrice(signal.target_price);
      setStopLoss(signal.stop_loss);
    } else {
      setEntryPrice(stock.currentPrice);
    }
  }, [stock, signal, useSignalPrices]);

  // Calculate metrics
  const investment = entryPrice * quantity;
  const potentialProfit = tradeType === 'BUY' 
    ? (targetPrice - entryPrice) * quantity 
    : (entryPrice - targetPrice) * quantity;
  const potentialLoss = tradeType === 'BUY'
    ? (entryPrice - stopLoss) * quantity
    : (stopLoss - entryPrice) * quantity;
  const riskReward = potentialLoss > 0 ? (potentialProfit / potentialLoss).toFixed(2) : 'N/A';
  const profitPercent = ((potentialProfit / investment) * 100).toFixed(2);
  const lossPercent = ((potentialLoss / investment) * 100).toFixed(2);

  const handleSubmit = async () => {
    // Validation
    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (entryPrice <= 0) {
      toast.error('Entry price must be greater than 0');
      return;
    }
    if (targetPrice > 0 && stopLoss > 0) {
      if (tradeType === 'BUY' && targetPrice <= entryPrice) {
        toast.error('Target price must be higher than entry price for BUY');
        return;
      }
      if (tradeType === 'BUY' && stopLoss >= entryPrice) {
        toast.error('Stop loss must be lower than entry price for BUY');
        return;
      }
      if (tradeType === 'SELL' && targetPrice >= entryPrice) {
        toast.error('Target price must be lower than entry price for SELL');
        return;
      }
      if (tradeType === 'SELL' && stopLoss <= entryPrice) {
        toast.error('Stop loss must be higher than entry price for SELL');
        return;
      }
    }

    setLoading(true);
    try {
      await stockStrategyApi.recordTrade({
        symbol: stock.symbol,
        trade_type: tradeType,
        entry_price: entryPrice,
        quantity,
        target_price: targetPrice || null,
        stop_loss: stopLoss || null,
        status: 'OPEN',
        trade_mode: 'PAPER', // Paper trading
      });

      toast.success(`Paper trade recorded: ${tradeType} ${quantity} ${stock.symbol} @ ₹${entryPrice}`, {
        description: 'Position is now being monitored for exit conditions',
      });

      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to record trade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Paper Trade Entry
          </DialogTitle>
          <DialogDescription>
            Record a virtual trade for {stock.symbol} - {stock.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Price */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Current Market Price</span>
            <span className="text-xl font-bold">₹{stock.currentPrice.toFixed(2)}</span>
          </div>

          {/* Trade Type */}
          <div className="space-y-2">
            <Label>Trade Type</Label>
            <RadioGroup value={tradeType} onValueChange={(value) => setTradeType(value as 'BUY' | 'SELL')}>
              <div className="grid grid-cols-2 gap-4">
                <div className={`flex items-center space-x-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  tradeType === 'BUY' ? 'border-green-500 bg-green-500/10' : 'border-border'
                }`}>
                  <RadioGroupItem value="BUY" id="buy" />
                  <Label htmlFor="buy" className="flex items-center gap-2 cursor-pointer flex-1">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="font-semibold">BUY (Long)</span>
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  tradeType === 'SELL' ? 'border-red-500 bg-red-500/10' : 'border-border'
                }`}>
                  <RadioGroupItem value="SELL" id="sell" />
                  <Label htmlFor="sell" className="flex items-center gap-2 cursor-pointer flex-1">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    <span className="font-semibold">SELL (Short)</span>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Signal Prices Toggle */}
          {signal && (
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <span className="text-sm">Use signal's recommended prices</span>
              <Button
                variant={useSignalPrices ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUseSignalPrices(!useSignalPrices)}
              >
                {useSignalPrices ? 'Using Signal' : 'Manual'}
              </Button>
            </div>
          )}

          {/* Entry Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry">Entry Price (₹)</Label>
              <Input
                id="entry"
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                placeholder="Entry price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                placeholder="Number of shares"
              />
            </div>
          </div>

          {/* Exit Strategy */}
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Exit Strategy (Optional)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target" className="flex items-center gap-2">
                  <Target className="h-3 w-3 text-green-500" />
                  Target Price (₹)
                </Label>
                <Input
                  id="target"
                  type="number"
                  step="0.01"
                  value={targetPrice || ''}
                  onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Target price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stoploss" className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-red-500" />
                  Stop Loss (₹)
                </Label>
                <Input
                  id="stoploss"
                  type="number"
                  step="0.01"
                  value={stopLoss || ''}
                  onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                  placeholder="Stop loss"
                />
              </div>
            </div>
          </div>

          {/* Calculations */}
          {targetPrice > 0 && stopLoss > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Trade Metrics
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground">Investment</div>
                    <div className="text-lg font-bold">₹{investment.toFixed(2)}</div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground">Risk/Reward</div>
                    <div className="text-lg font-bold">{riskReward}:1</div>
                  </div>

                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <div className="text-xs text-green-600">Potential Profit</div>
                    <div className="text-lg font-bold text-green-600">
                      ₹{potentialProfit.toFixed(2)} ({profitPercent}%)
                    </div>
                  </div>

                  <div className="p-3 bg-red-500/10 rounded-lg">
                    <div className="text-xs text-red-600">Potential Loss</div>
                    <div className="text-lg font-bold text-red-600">
                      ₹{potentialLoss.toFixed(2)} ({lossPercent}%)
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Warning */}
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-600">
              <strong>Paper Trading:</strong> This is a virtual trade. No real money will be used. 
              The system will monitor this position and notify you when exit conditions are met.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Recording...' : `Record ${tradeType} Trade`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
