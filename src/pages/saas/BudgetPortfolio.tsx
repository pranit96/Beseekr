import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  TrendingUp, 
  Shield, 
  Target, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { stockStrategyApi } from '@/api/stockStrategy';

export default function BudgetPortfolio() {
  const navigate = useNavigate();
  const [budget, setBudget] = useState('5000');
  const [riskProfile, setRiskProfile] = useState('moderate');
  const [timeframe, setTimeframe] = useState('week');
  const [loading, setLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<any>(null);

  const handleGenerate = async () => {
    if (!budget || parseFloat(budget) < 1000) {
      toast.error('Minimum budget is ₹1,000');
      return;
    }

    setLoading(true);
    try {
      const result = await stockStrategyApi.generateBudgetPortfolio({
        budget: parseFloat(budget),
        risk_profile: riskProfile as 'conservative' | 'moderate' | 'aggressive',
        timeframe: timeframe as 'day' | 'week' | 'month' | 'year'
      });

      if (result.success) {
        setPortfolio(result);
        toast.success('Portfolio generated successfully!');
      } else {
        toast.error(result.message || 'Failed to generate portfolio');
        setPortfolio(result);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate portfolio');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (profile: string) => {
    switch (profile) {
      case 'conservative': return 'text-green-500';
      case 'moderate': return 'text-yellow-500';
      case 'aggressive': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getRiskDescription = (profile: string) => {
    switch (profile) {
      case 'conservative': return '1% risk per trade, 3 stocks max, 2.5:1 min RR';
      case 'moderate': return '2% risk per trade, 4 stocks max, 2:1 min RR';
      case 'aggressive': return '3% risk per trade, 5 stocks max, 1.5:1 min RR';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            Budget Portfolio Builder
          </h1>
          <p className="text-muted-foreground mt-2">
            Get personalized stock recommendations based on your budget and risk tolerance
          </p>
        </div>

        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Your Investment Details</CardTitle>
            <CardDescription>
              Tell us your budget and preferences, we'll suggest the best portfolio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Budget (₹)</Label>
                <Input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="5000"
                  min="1000"
                  step="1000"
                />
                <p className="text-xs text-muted-foreground mt-1">Minimum: ₹1,000</p>
              </div>

              <div>
                <Label>Risk Profile</Label>
                <Select value={riskProfile} onValueChange={setRiskProfile}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative (Low Risk)</SelectItem>
                    <SelectItem value="moderate">Moderate (Medium Risk)</SelectItem>
                    <SelectItem value="aggressive">Aggressive (High Risk)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {getRiskDescription(riskProfile)}
                </p>
              </div>

              <div>
                <Label>Time Horizon</Label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Intraday (1 day)</SelectItem>
                    <SelectItem value="week">Short-term (3-7 days)</SelectItem>
                    <SelectItem value="month">Swing (2-4 weeks)</SelectItem>
                    <SelectItem value="year">Positional (3-6 months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Portfolio...
                </>
              ) : (
                <>
                  Generate Portfolio
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Portfolio Results */}
        {portfolio && (
          <>
            {portfolio.success ? (
              <>
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Portfolio Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Investment</p>
                        <p className="text-2xl font-bold">₹{portfolio.portfolio.total_investment.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {portfolio.summary.cash_utilization} utilized
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Potential Profit</p>
                        <p className="text-2xl font-bold text-green-500">
                          ₹{portfolio.portfolio.total_potential_profit.toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          +{portfolio.summary.potential_return}
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Risk</p>
                        <p className="text-2xl font-bold text-red-500">
                          ₹{portfolio.portfolio.total_risk.toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {portfolio.summary.risk_percent}
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Diversification</p>
                        <p className="text-lg font-bold">
                          {portfolio.portfolio.diversification.stocks} Stocks
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {portfolio.portfolio.diversification.sectors} sectors
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-500">Recommendation</p>
                          <p className="text-sm">{portfolio.summary.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Validation */}
                {portfolio.portfolio.ai_validation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {portfolio.portfolio.ai_validation.suitable ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        AI Validation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Rating: {portfolio.portfolio.ai_validation.rating}/10</p>
                        <p className="text-sm text-muted-foreground">
                          {portfolio.portfolio.ai_validation.overall_assessment}
                        </p>
                      </div>

                      {portfolio.portfolio.ai_validation.strengths.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2 text-green-500">Strengths:</p>
                          <ul className="space-y-1">
                            {portfolio.portfolio.ai_validation.strengths.map((s: string, i: number) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {portfolio.portfolio.ai_validation.concerns.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2 text-yellow-500">Concerns:</p>
                          <ul className="space-y-1">
                            {portfolio.portfolio.ai_validation.concerns.map((c: string, i: number) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Stock Recommendations */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Recommended Stocks</h2>
                  
                  {portfolio.portfolio.recommendations.map((rec: any, index: number) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{rec.stock.symbol}</CardTitle>
                            <CardDescription>{rec.stock.name}</CardDescription>
                          </div>
                          <Badge variant="outline">{rec.strategy}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Investment Details */}
                        <div className="grid md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Investment</p>
                            <p className="text-lg font-bold">₹{rec.investment.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground">{rec.allocation_percent}% of budget</p>
                          </div>

                          <div>
                            <p className="text-sm text-muted-foreground">Shares</p>
                            <p className="text-lg font-bold">{rec.shares}</p>
                            <p className="text-xs text-muted-foreground">@ ₹{rec.entry_price.toFixed(2)}</p>
                          </div>

                          <div>
                            <p className="text-sm text-muted-foreground">Target</p>
                            <p className="text-lg font-bold text-green-500">₹{rec.target_price.toFixed(2)}</p>
                            <p className="text-xs text-green-500">
                              +₹{rec.potential_profit.toFixed(0)} profit
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-muted-foreground">Stop Loss</p>
                            <p className="text-lg font-bold text-red-500">₹{rec.stop_loss.toFixed(2)}</p>
                            <p className="text-xs text-red-500">
                              -₹{rec.potential_loss.toFixed(0)} loss
                            </p>
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="flex gap-4 flex-wrap">
                          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">RR: {rec.risk_reward.toFixed(1)}:1</span>
                          </div>

                          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Confidence: {rec.confidence.toFixed(0)}%</span>
                          </div>

                          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Risk: ₹{rec.risk_amount.toFixed(0)}</span>
                          </div>
                        </div>

                        {/* Holding Period */}
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <p className="text-sm">
                            <span className="font-semibold">Holding Period:</span> {rec.holding_period}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{rec.timeframe}</p>
                        </div>

                        {/* Action Button */}
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate(`/dashboard/stocks/signal/${rec.signal_id}`)}
                        >
                          View Signal Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                  <h3 className="text-lg font-semibold mb-2">{portfolio.message}</h3>
                  
                  {portfolio.suggestions && portfolio.suggestions.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        Here are some affordable stocks within your budget:
                      </p>
                      <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                        {portfolio.suggestions.map((stock: any, i: number) => (
                          <div key={i} className="p-4 border rounded-lg">
                            <p className="font-semibold">{stock.symbol}</p>
                            <p className="text-sm text-muted-foreground">{stock.name}</p>
                            <p className="text-lg font-bold mt-2">₹{stock.price.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              Can buy {stock.affordable_shares} shares
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
