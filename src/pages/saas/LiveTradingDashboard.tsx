// Live Trading Dashboard with Real-Time Updates
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Activity, 
  TrendingUp, 
  RefreshCw, 
  Search,
  Bell,
  Filter,
  Zap,
  Target,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { useStockWebSocket } from '@/hooks/useStockWebSocket';
import { stockStrategyApi } from '@/api/stockStrategy';
import { LivePriceCard } from '@/components/stock/LivePriceCard';
import { SignalCard } from '@/components/stock/SignalCard';
import { MarketRegimeIndicator } from '@/components/stock/MarketRegimeIndicator';
import { TradeEntryModal } from '@/components/stock/TradeEntryModal';

export default function LiveTradingDashboard() {
  const navigate = useNavigate();
  const [signals, setSignals] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>(['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK']);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStrategy, setFilterStrategy] = useState<string>('all');
  const [marketRegimeData, setMarketRegimeData] = useState<any>(null);
  
  // Trade Modal State
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [selectedSignal, setSelectedSignal] = useState<any>(null);

  const {
    connected,
    prices,
    latestSignals,
    marketRegime,
    realtimePnL,
    systemHealth,
    analyticsData,
    subscribeToPrices,
    subscribeToSignals,
    subscribeToTrades,
    subscribeToPnL,
    subscribeToAnalytics,
    subscribeToHealth,
    requestScan,
    requestAnalytics,
    onSignalUpdate,
    onTradeExit,
    onMarketRegime,
  } = useStockWebSocket();

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (connected) {
      subscribeToPrices(watchlist);
      subscribeToSignals();
      subscribeToTrades();
      subscribeToPnL(); // USER-SPECIFIC P&L
      subscribeToAnalytics(); // USER-SPECIFIC analytics
      subscribeToHealth(); // System health
    }
  }, [connected, watchlist]);

  // Handle new signals
  useEffect(() => {
    if (latestSignals.length > 0) {
      setSignals(prev => [...latestSignals, ...prev].slice(0, 50));
      toast.success(`${latestSignals.length} new signals detected!`, {
        icon: <Zap className="h-4 w-4" />,
      });
    }
  }, [latestSignals]);

  // Handle market regime updates
  useEffect(() => {
    if (marketRegime) {
      setMarketRegimeData(marketRegime);
      toast.info(`Market regime changed to ${marketRegime.regime}`, {
        icon: <Activity className="h-4 w-4" />,
      });
    }
  }, [marketRegime]);

  // Handle trade exits
  useEffect(() => {
    const cleanup = onTradeExit((data) => {
      toast.success(`Trade exited: ${data.symbol} at ₹${data.exitPrice}`, {
        description: `${data.exitType} - P&L: ${data.pnlPercent.toFixed(2)}%`,
      });
    });
    return cleanup;
  }, [onTradeExit]);

  // Load initial data
  useEffect(() => {
    loadSignals();
    loadMarketRegime();
  }, []);

  const loadSignals = async () => {
    setLoading(true);
    try {
      const data = await stockStrategyApi.getSignals({ min_confidence: 60 });
      setSignals(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load signals');
    } finally {
      setLoading(false);
    }
  };

  const loadMarketRegime = async () => {
    try {
      const data = await stockStrategyApi.getMarketRegime();
      setMarketRegimeData(data.regime);
    } catch (error: any) {
      console.error('Failed to load market regime:', error);
    }
  };

  const handleScan = () => {
    requestScan();
    toast.info('Signal scan started...', {
      icon: <RefreshCw className="h-4 w-4 animate-spin" />,
    });
  };

  const handleTradeClick = (signal: any) => {
    setSelectedStock({
      symbol: signal.stocks.symbol,
      name: signal.stocks.name,
      currentPrice: prices.get(signal.stocks.symbol)?.price || signal.entry_price,
    });
    setSelectedSignal({
      entry_price: signal.entry_price,
      target_price: signal.target_price,
      stop_loss: signal.stop_loss,
      risk_reward: signal.risk_reward,
    });
    setTradeModalOpen(true);
  };

  const filteredSignals = signals.filter(signal => {
    const matchesSearch = signal.stocks.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         signal.stocks.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStrategy = filterStrategy === 'all' || signal.trading_strategies.name === filterStrategy;
    return matchesSearch && matchesStrategy;
  });

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className={connected ? "text-green-500 animate-pulse" : "text-gray-500"} />
            Live Trading Dashboard
          </h1>
          <p className="text-muted-foreground">
            {connected ? 'Real-time market data streaming' : 'Connecting to market data...'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleScan} disabled={loading || !connected} className="gap-2">
            <RefreshCw className={loading ? "animate-spin" : ""} />
            Scan Signals
          </Button>
          <Button onClick={() => navigate('/dashboard/stocks/positions')} variant="outline" className="gap-2">
            <Target />
            My Positions
          </Button>
          <Button variant="outline" className="gap-2">
            <Bell />
            Alerts
          </Button>
        </div>
      </div>

      {/* Market Regime */}
      {marketRegimeData && (
        <MarketRegimeIndicator regime={marketRegimeData} />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Watchlist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{watchlist.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Real-time P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${realtimePnL?.total_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {realtimePnL ? `₹${realtimePnL.total_pnl.toFixed(0)}` : '₹0'}
            </div>
            <div className="text-xs text-muted-foreground">
              {realtimePnL ? `${realtimePnL.total_pnl_percent.toFixed(2)}%` : '0%'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${
                systemHealth?.overall_status === 'healthy' ? 'bg-green-500' :
                systemHealth?.overall_status === 'degraded' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
              <span className="text-sm font-medium capitalize">
                {systemHealth?.overall_status || 'Unknown'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Risk/Reward</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {signals.length > 0
                ? (signals.reduce((sum, s) => sum + s.risk_reward, 0) / signals.length).toFixed(1)
                : 0}:1
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="signals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="signals" className="gap-2">
            <Target className="h-4 w-4" />
            Signals
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Watchlist
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <Activity className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signals" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search signals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Signals Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredSignals.map((signal) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                currentPrice={prices.get(signal.stocks.symbol)?.price}
                onTrade={() => handleTradeClick(signal)}
                onDetails={() => navigate(`/dashboard/stocks/signal/${signal.id}`)}
              />
            ))}
          </div>

          {filteredSignals.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No signals found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or run a new scan
                </p>
                <Button onClick={handleScan} className="gap-2">
                  <RefreshCw />
                  Scan for Signals
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchlist.map((symbol) => {
              const priceData = prices.get(symbol);
              return priceData ? (
                <LivePriceCard
                  key={symbol}
                  symbol={symbol}
                  price={priceData.price}
                  change={priceData.change}
                  changePercent={priceData.changePercent}
                  volume={priceData.volume}
                  onClick={() => navigate(`/dashboard/stocks/analysis/${symbol}`)}
                />
              ) : (
                <Card key={symbol}>
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-8 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Real-time P&L Card */}
            <Card>
              <CardHeader>
                <CardTitle>Real-time P&L</CardTitle>
              </CardHeader>
              <CardContent>
                {realtimePnL ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total P&L</div>
                      <div className={`text-3xl font-bold ${realtimePnL.total_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ₹{realtimePnL.total_pnl.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {realtimePnL.total_pnl_percent.toFixed(2)}%
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Value</div>
                        <div className="text-lg font-semibold">₹{realtimePnL.total_value.toFixed(0)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Positions</div>
                        <div className="text-lg font-semibold">{realtimePnL.positions.length}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No open positions
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Health Card */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                {systemHealth ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Overall Status</span>
                      <Badge variant={
                        systemHealth.overall_status === 'healthy' ? 'default' :
                        systemHealth.overall_status === 'degraded' ? 'secondary' :
                        'destructive'
                      }>
                        {systemHealth.overall_status}
                      </Badge>
                    </div>
                    {systemHealth.services && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Zerodha API</span>
                          <Badge variant={systemHealth.services.zerodha?.status === 'healthy' ? 'default' : 'secondary'}>
                            {systemHealth.services.zerodha?.status || 'unknown'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Claude AI</span>
                          <Badge variant={systemHealth.services.claude?.status === 'healthy' ? 'default' : 'secondary'}>
                            {systemHealth.services.claude?.status || 'unknown'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Database</span>
                          <Badge variant={systemHealth.services.database?.status === 'healthy' ? 'default' : 'secondary'}>
                            {systemHealth.services.database?.status || 'unknown'}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Loading health data...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analytics Actions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => requestAnalytics('strategy_performance')}
                    className="gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Strategy Performance
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => requestAnalytics('correlation')}
                    className="gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    Correlation
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => requestAnalytics('risk_attribution')}
                    className="gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Risk Attribution
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => requestAnalytics('portfolio_metrics')}
                    className="gap-2"
                  >
                    <Target className="h-4 w-4" />
                    Portfolio Metrics
                  </Button>
                </div>
                
                {analyticsData && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <pre className="text-xs overflow-auto max-h-96">
                      {JSON.stringify(analyticsData, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Trade Entry Modal */}
      {selectedStock && (
        <TradeEntryModal
          open={tradeModalOpen}
          onClose={() => {
            setTradeModalOpen(false);
            setSelectedStock(null);
            setSelectedSignal(null);
          }}
          stock={selectedStock}
          signal={selectedSignal}
        />
      )}
    </div>
  );
}
