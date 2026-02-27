// My Positions - Paper Trading Portfolio
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  X, 
  RefreshCw,
  DollarSign,
  Target,
  Shield,
  Clock,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { stockStrategyApi } from '@/api/stockStrategy';
import { useStockWebSocket } from '@/hooks/useStockWebSocket';
import { cn } from '@/lib/utils';

export default function MyPositions() {
  const [positions, setPositions] = useState<any[]>([]);
  const [closedTrades, setClosedTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const { prices, onTradeExit, subscribeToPrices } = useStockWebSocket();

  useEffect(() => {
    loadData();
  }, []);

  // Subscribe to prices for open positions
  useEffect(() => {
    if (positions.length > 0) {
      const symbols = positions.map(p => p.stocks.symbol);
      subscribeToPrices(symbols);
    }
  }, [positions, subscribeToPrices]);

  // Handle trade exits from WebSocket
  useEffect(() => {
    const cleanup = onTradeExit((data) => {
      toast.success(`Position closed: ${data.symbol}`, {
        description: `${data.exitType} - P&L: ${data.pnlPercent > 0 ? '+' : ''}${data.pnlPercent.toFixed(2)}%`,
      });
      loadData(); // Refresh data
    });
    return cleanup;
  }, [onTradeExit]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tradesData, statsData] = await Promise.all([
        stockStrategyApi.getUserTrades(),
        stockStrategyApi.getPerformanceStats(),
      ]);

      const open = tradesData.filter((t: any) => t.status === 'OPEN');
      const closed = tradesData.filter((t: any) => t.status === 'CLOSED');

      setPositions(open);
      setClosedTrades(closed);
      setStats(statsData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePosition = async (tradeId: string, currentPrice: number) => {
    try {
      await stockStrategyApi.closeTrade(tradeId, {
        exit_price: currentPrice,
        exit_type: 'MANUAL',
      });

      toast.success('Position closed successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to close position');
    }
  };

  const calculatePnL = (position: any) => {
    const currentPrice = prices.get(position.stocks.symbol)?.price || position.entry_price;
    const pnl = position.trade_type === 'BUY'
      ? (currentPrice - position.entry_price) * position.quantity
      : (position.entry_price - currentPrice) * position.quantity;
    const pnlPercent = (pnl / (position.entry_price * position.quantity)) * 100;
    return { pnl, pnlPercent, currentPrice };
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Positions</h1>
          <p className="text-muted-foreground">Paper trading portfolio & performance</p>
        </div>
        <Button onClick={loadData} disabled={loading} className="gap-2">
          <RefreshCw className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                stats.total_pnl >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {stats.total_pnl >= 0 ? '+' : ''}₹{stats.total_pnl?.toFixed(2) || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total_pnl_percent >= 0 ? '+' : ''}{stats.total_pnl_percent?.toFixed(2) || 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.win_rate?.toFixed(1) || 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.winning_trades || 0}W / {stats.losing_trades || 0}L
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{positions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active trades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_trades || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Positions Tabs */}
      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Open Positions ({positions.length})
          </TabsTrigger>
          <TabsTrigger value="closed" className="gap-2">
            <Clock className="h-4 w-4" />
            Trade History ({closedTrades.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {positions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No open positions</h3>
                <p className="text-muted-foreground">
                  Start trading by clicking "Trade" on any signal
                </p>
              </CardContent>
            </Card>
          ) : (
            positions.map((position) => {
              const { pnl, pnlPercent, currentPrice } = calculatePnL(position);
              const isProfit = pnl >= 0;

              return (
                <Card key={position.id} className="border-l-4" style={{
                  borderLeftColor: isProfit ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
                }}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold">{position.stocks.symbol}</h3>
                          <Badge variant={position.trade_type === 'BUY' ? 'default' : 'destructive'}>
                            {position.trade_type}
                          </Badge>
                          <Badge variant="outline">{position.quantity} shares</Badge>
                        </div>

                        {/* Prices */}
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Entry</div>
                            <div className="font-semibold">₹{position.entry_price.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Current</div>
                            <div className="font-semibold">₹{currentPrice.toFixed(2)}</div>
                          </div>
                          {position.target_price && (
                            <div>
                              <div className="text-xs text-green-600 flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                Target
                              </div>
                              <div className="font-semibold text-green-600">
                                ₹{position.target_price.toFixed(2)}
                              </div>
                            </div>
                          )}
                          {position.stop_loss && (
                            <div>
                              <div className="text-xs text-red-600 flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                Stop Loss
                              </div>
                              <div className="font-semibold text-red-600">
                                ₹{position.stop_loss.toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* P&L */}
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Unrealized P&L (Gross)</div>
                            <div className={cn(
                              "text-lg font-bold flex items-center gap-1",
                              isProfit ? "text-green-500" : "text-red-500"
                            )}>
                              {isProfit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              {isProfit ? '+' : ''}₹{pnl.toFixed(2)} ({pnlPercent.toFixed(2)}%)
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Est. Net P&L (After Costs)</div>
                            <div className={cn(
                              "text-sm font-semibold",
                              isProfit ? "text-green-600" : "text-red-600"
                            )}>
                              {isProfit ? '+' : ''}₹{(pnl * 0.97).toFixed(2)} (~3% costs)
                            </div>
                          </div>
                        </div>

                        {/* Time */}
                        <div className="text-xs text-muted-foreground">
                          Opened: {new Date(position.created_at).toLocaleString()}
                        </div>
                      </div>

                      {/* Actions */}
                      <Button
                        onClick={() => handleClosePosition(position.id, currentPrice)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Close Position
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          {closedTrades.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No trade history</h3>
                <p className="text-muted-foreground">
                  Closed trades will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            closedTrades.map((trade) => {
              const isProfit = trade.pnl >= 0;

              return (
                <Card key={trade.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold">{trade.stocks.symbol}</h3>
                          <Badge variant={trade.trade_type === 'BUY' ? 'default' : 'destructive'}>
                            {trade.trade_type}
                          </Badge>
                          <Badge variant="outline">{trade.quantity} shares</Badge>
                          <Badge variant={isProfit ? 'default' : 'destructive'}>
                            {trade.exit_type}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-5 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-muted-foreground">Entry</div>
                            <div className="font-semibold">₹{trade.entry_price.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Exit</div>
                            <div className="font-semibold">₹{trade.exit_price.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Gross P&L</div>
                            <div className={cn(
                              "font-semibold",
                              isProfit ? "text-green-500" : "text-red-500"
                            )}>
                              {isProfit ? '+' : ''}₹{(trade.gross_pnl || trade.pnl).toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Net P&L (After Costs)</div>
                            <div className={cn(
                              "font-semibold",
                              isProfit ? "text-green-600" : "text-red-600"
                            )}>
                              {isProfit ? '+' : ''}₹{trade.pnl.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Return</div>
                            <div className={cn(
                              "font-semibold",
                              isProfit ? "text-green-500" : "text-red-500"
                            )}>
                              {isProfit ? '+' : ''}{trade.pnl_percent.toFixed(2)}%
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {new Date(trade.created_at).toLocaleDateString()} → {new Date(trade.exit_time).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
