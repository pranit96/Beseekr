import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Shield, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface MarketRegime {
  regime: string;
  confidence: number;
  description: string;
  volatility: string;
  trend: string;
}

interface DrawdownStatus {
  canTrade: boolean;
  dailyDrawdown: number;
  weeklyDrawdown: number;
  monthlyDrawdown: number;
  consecutiveLosses: number;
  positionSizeMultiplier: number;
  status: string;
  reason?: string;
}

interface CorrelationMatrix {
  positions: number;
  matrix: any;
  avgCorrelation: number;
  diversificationScore: number;
  analysis: {
    rating: string;
    message: string;
    recommendation?: string;
  };
}

export default function MarketDashboard() {
  const navigate = useNavigate();
  const [regime, setRegime] = useState<MarketRegime | null>(null);
  const [drawdown, setDrawdown] = useState<DrawdownStatus | null>(null);
  const [correlation, setCorrelation] = useState<CorrelationMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const checkAuth = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error('Please login to access market dashboard');
      navigate('/login');
      return;
    }
    setIsAuthenticated(true);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [regimeRes, drawdownRes, correlationRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/stock-strategy/advanced/market-regime`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/stock-strategy/advanced/drawdown-status`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/stock-strategy/advanced/portfolio/correlation`, { headers })
      ]);

      if (regimeRes.status === 401 || drawdownRes.status === 401 || correlationRes.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      const [regimeData, drawdownData, correlationData] = await Promise.all([
        regimeRes.json(),
        drawdownRes.json(),
        correlationRes.json()
      ]);

      if (regimeData.success) setRegime(regimeData.data.regime);
      if (drawdownData.success) setDrawdown(drawdownData.data);
      if (correlationData.success) setCorrelation(correlationData.data);
    } catch (error) {
      toast.error('Failed to load market data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getRegimeColor = (regime: string) => {
    if (regime?.includes('BULL')) return 'bg-green-500';
    if (regime?.includes('BEAR')) return 'bg-red-500';
    if (regime === 'RANGING') return 'bg-blue-500';
    if (regime === 'VOLATILE') return 'bg-orange-500';
    if (regime === 'CRASH') return 'bg-red-700';
    return 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    if (status === 'NORMAL') return 'text-green-500';
    if (status === 'RECOVERY') return 'text-yellow-500';
    if (status === 'SUSPENDED') return 'text-red-500';
    return 'text-gray-500';
  };

  const getDiversificationColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-blue-500';
    if (score >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Activity className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-lg font-semibold">Loading Market Data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard/stocks')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Market Dashboard</h1>
              <p className="text-muted-foreground">Real-time market regime and risk monitoring</p>
            </div>
          </div>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Market Regime */}
        {regime && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Market Regime
              </CardTitle>
              <CardDescription>Current market condition and recommended strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Regime</p>
                  <Badge className={`${getRegimeColor(regime.regime)} text-white text-lg px-4 py-2`}>
                    {regime.regime.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Confidence</p>
                  <div className="text-3xl font-bold text-primary">{regime.confidence}%</div>
                  <Progress value={regime.confidence} className="mt-2" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Volatility</p>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {regime.volatility}
                  </Badge>
                </div>
              </div>
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm font-semibold mb-2">Description:</p>
                <p className="text-sm">{regime.description}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Drawdown Protection */}
        {drawdown && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Drawdown Protection
              </CardTitle>
              <CardDescription>Risk management and position sizing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Status */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      {drawdown.canTrade ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">Trading Status</span>
                    </div>
                    <Badge className={drawdown.canTrade ? 'bg-green-500' : 'bg-red-500'}>
                      {drawdown.canTrade ? 'ACTIVE' : 'SUSPENDED'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-medium">Status</span>
                    <span className={`font-bold ${getStatusColor(drawdown.status)}`}>
                      {drawdown.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-medium">Position Size</span>
                    <span className="font-bold text-primary">
                      {(drawdown.positionSizeMultiplier * 100).toFixed(0)}%
                    </span>
                  </div>

                  {drawdown.reason && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">{drawdown.reason}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Drawdown Metrics */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Daily Drawdown</span>
                      <span className={`font-semibold ${drawdown.dailyDrawdown < -2 ? 'text-red-500' : 'text-green-500'}`}>
                        {drawdown.dailyDrawdown.toFixed(2)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.abs(drawdown.dailyDrawdown / 3 * 100)} 
                      className={drawdown.dailyDrawdown < -2 ? 'bg-red-200' : 'bg-green-200'}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Limit: -3%</p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Weekly Drawdown</span>
                      <span className={`font-semibold ${drawdown.weeklyDrawdown < -3 ? 'text-red-500' : 'text-green-500'}`}>
                        {drawdown.weeklyDrawdown.toFixed(2)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.abs(drawdown.weeklyDrawdown / 5 * 100)} 
                      className={drawdown.weeklyDrawdown < -3 ? 'bg-red-200' : 'bg-green-200'}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Limit: -5%</p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Monthly Drawdown</span>
                      <span className={`font-semibold ${drawdown.monthlyDrawdown < -7 ? 'text-red-500' : 'text-green-500'}`}>
                        {drawdown.monthlyDrawdown.toFixed(2)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.abs(drawdown.monthlyDrawdown / 10 * 100)} 
                      className={drawdown.monthlyDrawdown < -7 ? 'bg-red-200' : 'bg-green-200'}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Limit: -10%</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-medium">Consecutive Losses</span>
                    <span className={`font-bold ${drawdown.consecutiveLosses >= 3 ? 'text-red-500' : 'text-green-500'}`}>
                      {drawdown.consecutiveLosses}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Correlation */}
        {correlation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Portfolio Diversification
              </CardTitle>
              <CardDescription>Correlation analysis of open positions</CardDescription>
            </CardHeader>
            <CardContent>
              {correlation.positions === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No open positions to analyze</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Open Positions</p>
                      <p className="text-3xl font-bold text-primary">{correlation.positions}</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Avg Correlation</p>
                      <p className="text-3xl font-bold">{(correlation.avgCorrelation * 100).toFixed(0)}%</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Diversification Score</p>
                      <p className={`text-3xl font-bold ${getDiversificationColor(correlation.diversificationScore)}`}>
                        {correlation.diversificationScore.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={
                        correlation.analysis.rating === 'EXCELLENT' ? 'bg-green-500' :
                        correlation.analysis.rating === 'GOOD' ? 'bg-blue-500' :
                        correlation.analysis.rating === 'FAIR' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }>
                        {correlation.analysis.rating}
                      </Badge>
                      <span className="font-semibold">{correlation.analysis.message}</span>
                    </div>
                    {correlation.analysis.recommendation && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {correlation.analysis.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
