import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Activity, AlertCircle, RefreshCw, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { stockStrategyApi } from '@/api/stockStrategy';

export default function StockStrategyDashboard() {
  const navigate = useNavigate();
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marketRegime, setMarketRegime] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch signals using API
      const signalsData = await stockStrategyApi.getSignals();
      setSignals(signalsData);

      // Fetch market regime using API
      const regimeData = await stockStrategyApi.getMarketRegime();
      setMarketRegime(regimeData.regime);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getRegimeColor = (regime: string) => {
    if (regime?.includes('BULL')) return 'text-green-500';
    if (regime?.includes('BEAR')) return 'text-red-500';
    return 'text-blue-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Redirect Notice to New Trading System */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-blue-400 mb-1">🎉 New Professional Trading System Available!</div>
            <div className="text-sm text-slate-300 mb-3">
              We've launched a completely redesigned trading system with real-time updates, advanced analytics, 
              and 10 professional pages. Click below to access the new system.
            </div>
            <Button 
              onClick={() => navigate('/trading/overview')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to New Trading System →
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Stock Trading Dashboard</h1>
          <p className="text-muted-foreground">AI-powered trading signals and analysis</p>
        </div>
        <Button onClick={fetchData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Market Regime */}
      <Card>
        <CardHeader>
          <CardTitle>Market Regime</CardTitle>
          <CardDescription>Current market conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Activity className="h-8 w-8 text-blue-500" />
            <div>
              <p className={`text-2xl font-bold ${marketRegime ? getRegimeColor(marketRegime.regime) : ''}`}>
                {marketRegime?.regime || 'Loading...'}
              </p>
              <p className="text-sm text-muted-foreground">
                Confidence: {marketRegime?.confidence || 'N/A'}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signals */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Signals</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Loading signals...</p>
              </CardContent>
            </Card>
          ) : signals.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active signals</p>
                  <Button className="mt-4" onClick={() => navigate('/dashboard/stocks/budget')}>
                    Generate Budget Portfolio
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            signals.map((signal: any) => (
              <Card key={signal.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/dashboard/stocks/signal/${signal.id}`)}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">{signal.stocks?.symbol || signal.symbol}</h3>
                        <Badge variant={signal.action === 'BUY' ? 'default' : 'destructive'}>
                          {signal.action}
                        </Badge>
                        <Badge variant="outline">
                          {signal.confidence || signal.confidence_score}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{signal.strategy}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">₹{signal.entry_price}</p>
                      <p className="text-sm text-muted-foreground">
                        Target: ₹{signal.target_price}
                      </p>
                      <p className="text-sm text-red-500">
                        Stop: ₹{signal.stop_loss}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Signal history coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/dashboard/stocks/advanced/RELIANCE')}>
          <CardContent className="p-6">
            <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
            <h3 className="font-bold">Advanced Analysis</h3>
            <p className="text-sm text-muted-foreground">Technical & Fundamental</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/dashboard/stocks/market')}>
          <CardContent className="p-6">
            <Activity className="h-8 w-8 text-blue-500 mb-2" />
            <h3 className="font-bold">Market Dashboard</h3>
            <p className="text-sm text-muted-foreground">Regime & Events</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/dashboard/stocks/budget')}>
          <CardContent className="p-6">
            <DollarSign className="h-8 w-8 text-yellow-500 mb-2" />
            <h3 className="font-bold">Budget Portfolio</h3>
            <p className="text-sm text-muted-foreground">AI-Generated</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
