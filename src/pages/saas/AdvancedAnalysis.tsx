import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  Shield, 
  Zap,
  ArrowLeft,
  Lock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Target,
  DollarSign,
  Percent,
  LineChart
} from 'lucide-react';
import { toast } from 'sonner';

interface AdvancedAnalysisData {
  symbol: string;
  timestamp: string;
  technical?: any;
  fundamental?: any;
  aiValidation?: any;
  finalRecommendation?: any;
}

export default function AdvancedAnalysis() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AdvancedAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comprehensive');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && symbol) {
      loadAnalysis();
    }
  }, [symbol, isAuthenticated, activeTab]);

  const checkAuth = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error('Please login to access advanced analysis');
      navigate('/login');
      return;
    }
    setIsAuthenticated(true);
  };

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      let endpoint = '';

      switch (activeTab) {
        case 'comprehensive':
          endpoint = `/api/stock-strategy/advanced/comprehensive/${symbol}`;
          break;
        case 'technical':
          endpoint = `/api/stock-strategy/advanced/technical/${symbol}`;
          break;
        case 'fundamental':
          endpoint = `/api/stock-strategy/advanced/fundamental/${symbol}`;
          break;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      const result = await response.json();
      if (result.success) {
        setAnalysis(result.data);
      } else {
        toast.error(result.error || 'Failed to load analysis');
      }
    } catch (error) {
      toast.error('Failed to load advanced analysis');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getSignalColor = (signal: string) => {
    if (signal?.includes('BUY')) return 'text-green-500';
    if (signal?.includes('SELL')) return 'text-red-500';
    return 'text-gray-500';
  };

  const getSignalBadge = (signal: string) => {
    if (signal?.includes('STRONG_BUY')) return 'bg-green-500';
    if (signal?.includes('BUY')) return 'bg-green-400';
    if (signal?.includes('STRONG_SELL')) return 'bg-red-500';
    if (signal?.includes('SELL')) return 'bg-red-400';
    return 'bg-gray-400';
  };

  const getGradeColor = (grade: string) => {
    if (grade === 'A') return 'text-green-500';
    if (grade === 'B') return 'text-blue-500';
    if (grade === 'C') return 'text-yellow-500';
    if (grade === 'D') return 'text-orange-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Activity className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-lg font-semibold">Analyzing {symbol}...</p>
            <p className="text-muted-foreground">Running institutional-grade analysis</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
              <p className="text-muted-foreground mb-4">Unable to load analysis data</p>
              <Button onClick={() => navigate('/dashboard/stocks')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
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
              <h1 className="text-3xl font-bold">{symbol}</h1>
              <p className="text-muted-foreground">Institutional-Grade Analysis</p>
            </div>
            <Badge variant="outline" className="ml-2">
              <Lock className="mr-1 h-3 w-3" />
              Premium
            </Badge>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            Last updated: {new Date(analysis.timestamp).toLocaleString()}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comprehensive">
              <Zap className="mr-2 h-4 w-4" />
              Comprehensive
            </TabsTrigger>
            <TabsTrigger value="technical">
              <LineChart className="mr-2 h-4 w-4" />
              Technical
            </TabsTrigger>
            <TabsTrigger value="fundamental">
              <BarChart3 className="mr-2 h-4 w-4" />
              Fundamental
            </TabsTrigger>
          </TabsList>

          {/* Comprehensive Tab */}
          <TabsContent value="comprehensive" className="space-y-6">
            {analysis.finalRecommendation && (
              <>
                {/* Final Recommendation Card */}
                <Card className="border-2 border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Final Recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Action</p>
                        <Badge className={`${getSignalBadge(analysis.finalRecommendation.action)} text-white text-lg px-4 py-2`}>
                          {analysis.finalRecommendation.action}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Confidence</p>
                        <div className="text-3xl font-bold text-primary">
                          {analysis.finalRecommendation.confidence}%
                        </div>
                        <Progress value={analysis.finalRecommendation.confidence} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
                        <div className="text-3xl font-bold text-primary">
                          {analysis.finalRecommendation.finalScore}
                        </div>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm font-semibold mb-4">Score Breakdown:</p>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm">Technical</span>
                          <span className="font-bold">{analysis.finalRecommendation.breakdown.technical}/100</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm">Fundamental</span>
                          <span className="font-bold">{analysis.finalRecommendation.breakdown.fundamental}/100</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm">AI Validation</span>
                          <span className="font-bold">{analysis.finalRecommendation.breakdown.ai}/100</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Technical Summary */}
                {analysis.technical && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Technical Analysis Summary</CardTitle>
                      <CardDescription>6 Institutional-Grade Indicators</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <span className="font-medium">Overall Signal</span>
                          <Badge className={getSignalBadge(analysis.technical.overallSignal.signal)}>
                            {analysis.technical.overallSignal.signal}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <span className="font-medium">Confidence</span>
                          <span className="font-bold text-primary">{analysis.technical.overallSignal.confidence}%</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <span className="font-medium">Buy Signals</span>
                          <span className="font-bold text-green-500">{analysis.technical.overallSignal.buySignals}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <span className="font-medium">Sell Signals</span>
                          <span className="font-bold text-red-500">{analysis.technical.overallSignal.sellSignals}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Fundamental Summary */}
                {analysis.fundamental && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Fundamental Analysis Summary</CardTitle>
                      <CardDescription>5 Multi-Factor Models</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <span className="font-medium">Overall Grade</span>
                          <span className={`text-2xl font-bold ${getGradeColor(analysis.fundamental.overallScore.grade)}`}>
                            {analysis.fundamental.overallScore.grade}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <span className="font-medium">Score</span>
                          <span className="font-bold text-primary">{analysis.fundamental.overallScore.score}/100</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <span className="font-medium">Recommendation</span>
                          <Badge className={getSignalBadge(analysis.fundamental.recommendation.action)}>
                            {analysis.fundamental.recommendation.action}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <span className="font-medium">Confidence</span>
                          <span className="font-bold text-primary">{analysis.fundamental.recommendation.confidence}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Technical Tab */}
          <TabsContent value="technical" className="space-y-6">
            {analysis.technical && (
              <>
                {/* Ichimoku Cloud */}
                {analysis.technical.ichimoku && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Ichimoku Cloud
                      </CardTitle>
                      <CardDescription>Japanese institutional trend indicator</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Signal</span>
                            <Badge className={getSignalBadge(analysis.technical.ichimoku.signal.signal)}>
                              {analysis.technical.ichimoku.signal.signal}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Strength</span>
                            <span className="font-semibold">{analysis.technical.ichimoku.signal.strength}%</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Tenkan-Sen</span>
                            <span className="font-semibold">₹{analysis.technical.ichimoku.tenkanSen.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Kijun-Sen</span>
                            <span className="font-semibold">₹{analysis.technical.ichimoku.kijunSen.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      {analysis.technical.ichimoku.signal.reasons && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-semibold mb-2">Reasons:</p>
                          <div className="flex flex-wrap gap-2">
                            {analysis.technical.ichimoku.signal.reasons.map((reason: string, idx: number) => (
                              <Badge key={idx} variant="secondary">{reason}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Volume Profile */}
                {analysis.technical.volumeProfile && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Volume Profile
                      </CardTitle>
                      <CardDescription>Institutional order flow analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">POC</p>
                          <p className="text-lg font-bold">₹{analysis.technical.volumeProfile.poc.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Point of Control</p>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">VAH</p>
                          <p className="text-lg font-bold">₹{analysis.technical.volumeProfile.valueAreaHigh.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Value Area High</p>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">VAL</p>
                          <p className="text-lg font-bold">₹{analysis.technical.volumeProfile.valueAreaLow.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Value Area Low</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Other Technical Indicators */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Supertrend */}
                  {analysis.technical.supertrend && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Supertrend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Trend</span>
                            <Badge variant={analysis.technical.supertrend.trend === 'UP' ? 'default' : 'destructive'}>
                              {analysis.technical.supertrend.trend}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Signal</span>
                            <Badge className={getSignalBadge(analysis.technical.supertrend.signal)}>
                              {analysis.technical.supertrend.signal}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Stochastic RSI */}
                  {analysis.technical.stochRSI && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Stochastic RSI</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">%K</span>
                            <span className="font-semibold">{analysis.technical.stochRSI.k.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">%D</span>
                            <span className="font-semibold">{analysis.technical.stochRSI.d.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Signal</span>
                            <Badge className={getSignalBadge(analysis.technical.stochRSI.signal.signal)}>
                              {analysis.technical.stochRSI.signal.signal}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* Fundamental Tab */}
          <TabsContent value="fundamental" className="space-y-6">
            {analysis.fundamental && (
              <>
                {/* Piotroski F-Score */}
                {analysis.fundamental.piotroskiScore && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Piotroski F-Score
                      </CardTitle>
                      <CardDescription>9-point fundamental strength score</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-primary mb-2">
                            {analysis.fundamental.piotroskiScore.score}/9
                          </div>
                          <Badge className={
                            analysis.fundamental.piotroskiScore.rating === 'EXCELLENT' ? 'bg-green-500' :
                            analysis.fundamental.piotroskiScore.rating === 'GOOD' ? 'bg-blue-500' :
                            analysis.fundamental.piotroskiScore.rating === 'AVERAGE' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }>
                            {analysis.fundamental.piotroskiScore.rating}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Criteria Met:</p>
                          {Object.entries(analysis.fundamental.piotroskiScore.criteria).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              {value ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <p className="text-sm">{analysis.fundamental.piotroskiScore.interpretation}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Altman Z-Score */}
                {analysis.fundamental.altmanZScore && analysis.fundamental.altmanZScore.zScore && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Altman Z-Score
                      </CardTitle>
                      <CardDescription>Bankruptcy prediction model</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-primary mb-2">
                            {analysis.fundamental.altmanZScore.zScore}
                          </div>
                          <Badge className={
                            analysis.fundamental.altmanZScore.rating === 'SAFE' ? 'bg-green-500' :
                            analysis.fundamental.altmanZScore.rating === 'GREY_ZONE' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }>
                            {analysis.fundamental.altmanZScore.rating}
                          </Badge>
                        </div>
                        <div className="flex items-center">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Bankruptcy Risk:</span>
                              <Badge variant="outline">{analysis.fundamental.altmanZScore.bankruptcyRisk}</Badge>
                            </div>
                            <p className="text-sm">{analysis.fundamental.altmanZScore.interpretation}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Magic Formula & Graham Number */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Magic Formula */}
                  {analysis.fundamental.magicFormula && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Magic Formula</CardTitle>
                        <CardDescription>Quality + Value</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">ROC</span>
                            <span className="font-semibold">{analysis.fundamental.magicFormula.roc}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Earnings Yield</span>
                            <span className="font-semibold">{analysis.fundamental.magicFormula.earningsYield}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Rating</span>
                            <Badge className={
                              analysis.fundamental.magicFormula.rating === 'EXCELLENT' ? 'bg-green-500' :
                              analysis.fundamental.magicFormula.rating === 'GOOD' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }>
                              {analysis.fundamental.magicFormula.rating}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Graham Number */}
                  {analysis.fundamental.grahamNumber && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Graham Number</CardTitle>
                        <CardDescription>Intrinsic Value</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Intrinsic Value</span>
                            <span className="font-semibold">₹{analysis.fundamental.grahamNumber.grahamNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Current Price</span>
                            <span className="font-semibold">₹{analysis.fundamental.grahamNumber.currentPrice}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Margin of Safety</span>
                            <span className={`font-semibold ${parseFloat(analysis.fundamental.grahamNumber.marginOfSafety) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {analysis.fundamental.grahamNumber.marginOfSafety}%
                            </span>
                          </div>
                          <Badge className={getSignalBadge(analysis.fundamental.grahamNumber.rating)}>
                            {analysis.fundamental.grahamNumber.rating}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
