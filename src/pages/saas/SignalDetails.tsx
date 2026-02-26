import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stockStrategyApi } from '@/api/stockStrategy';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Zap, 
  Calendar,
  Calculator,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function SignalDetails() {
  const { signalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [signal, setSignal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validation, setValidation] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  
  // Position sizing inputs
  const [accountSize, setAccountSize] = useState('100000');
  const [riskPercent, setRiskPercent] = useState('2');
  const [positionSize, setPositionSize] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  
  // Trade recording
  const [shares, setShares] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    loadSignal();
  }, [signalId]);

  const loadSignal = async () => {
    setLoading(true);
    try {
      const data = await stockStrategyApi.getSignalDetails(signalId!);
      setSignal(data);
      setEntryPrice(data.entry_price.toString());
    } catch (error) {
      toast.error('Failed to load signal');
      navigate('/dashboard/stocks');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/stock-strategy/signals/${signalId}/validate`
      );
      const result = await response.json();
      setValidation(result.data);
      
      if (result.data.still_valid) {
        toast.success('Signal validated by AI');
      } else {
        toast.warning('AI suggests caution on this signal');
      }
    } catch (error) {
      toast.error('Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleCalculatePosition = async () => {
    if (!accountSize || !signal) return;
    
    setCalculating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/stock-strategy/calculate-position`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_size: parseFloat(accountSize),
            risk_percent: parseFloat(riskPercent),
            entry_price: signal.entry_price,
            stop_loss: signal.stop_loss
          })
        }
      );
      
      const result = await response.json();
      setPositionSize(result.data);
      setShares(result.data.recommended_shares.toString());
      toast.success('Position size calculated');
    } catch (error) {
      toast.error('Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  const handleRecordTrade = async () => {
    if (!user) {
      toast.error('Please sign in to record trades');
      navigate('/auth');
      return;
    }
    
    if (!shares || !entryPrice) {
      toast.error('Please enter shares and entry price');
      return;
    }
    
    setRecording(true);
    try {
      await stockStrategyApi.recordTrade({
        signal_id: signalId!,
        entry_price: parseFloat(entryPrice),
        shares: parseInt(shares),
        notes
      });
      
      toast.success('Trade recorded successfully!');
      navigate('/dashboard/stocks/trades');
    } catch (error) {
      toast.error('Failed to record trade');
    } finally {
      setRecording(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading signal...</p>
        </div>
      </div>
    );
  }

  if (!signal) return null;

  const priceChange = signal.current_price 
    ? ((signal.current_price - signal.entry_price) / signal.entry_price * 100).toFixed(2)
    : '0.00';

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/stocks')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{signal.stocks.symbol}</h1>
              <p className="text-muted-foreground">{signal.stocks.name}</p>
            </div>
          </div>
          
          <Badge variant="outline" className="text-lg px-4 py-2">
            {signal.trading_strategies.name}
          </Badge>
        </div>

        {/* Current Price Alert */}
        {signal.current_price && (
          <Card className={parseFloat(priceChange) >= 0 ? 'border-green-500/50' : 'border-red-500/50'}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="text-3xl font-bold">₹{signal.current_price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Change from Entry</p>
                  <p className={`text-2xl font-bold ${parseFloat(priceChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {parseFloat(priceChange) >= 0 ? '+' : ''}{priceChange}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="position">Position Sizing</TabsTrigger>
            <TabsTrigger value="validation">AI Validation</TabsTrigger>
            <TabsTrigger value="record">Record Trade</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Entry Price</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">₹{signal.entry_price.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Target Price</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">₹{signal.target_price.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    +{((signal.target_price - signal.entry_price) / signal.entry_price * 100).toFixed(2)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Stop Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-500">₹{signal.stop_loss.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    -{((signal.entry_price - signal.stop_loss) / signal.entry_price * 100).toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Risk/Reward Ratio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-500">{signal.risk_reward.toFixed(2)}:1</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Excellent ratio - Risk ₹1 to make ₹{signal.risk_reward.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Confidence Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-yellow-500">{signal.confidence_score.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Based on {Object.values(signal.criteria_met).filter(Boolean).length} criteria met
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Criteria Met */}
            <Card>
              <CardHeader>
                <CardTitle>Setup Criteria</CardTitle>
                <CardDescription>Technical conditions that triggered this signal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {Object.entries(signal.criteria_met).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      {value ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Position Sizing Tab */}
          <TabsContent value="position" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Position Size Calculator
                </CardTitle>
                <CardDescription>
                  Calculate optimal position size based on your risk tolerance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Account Size (₹)</Label>
                    <Input
                      type="number"
                      value={accountSize}
                      onChange={(e) => setAccountSize(e.target.value)}
                      placeholder="100000"
                    />
                  </div>
                  <div>
                    <Label>Risk Per Trade (%)</Label>
                    <Input
                      type="number"
                      value={riskPercent}
                      onChange={(e) => setRiskPercent(e.target.value)}
                      placeholder="2"
                      step="0.1"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleCalculatePosition} 
                  disabled={calculating}
                  className="w-full"
                >
                  {calculating ? 'Calculating...' : 'Calculate Position Size'}
                </Button>

                {positionSize && (
                  <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recommended Shares:</span>
                      <span className="font-bold">{positionSize.recommended_shares}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Position Value:</span>
                      <span className="font-bold">₹{positionSize.position_value.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risk Amount:</span>
                      <span className="font-bold text-red-500">₹{positionSize.risk_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Position Size:</span>
                      <span className="font-bold">{positionSize.position_size_percent.toFixed(2)}%</span>
                    </div>

                    {positionSize.warnings.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                          <div className="space-y-1">
                            {positionSize.warnings.map((warning: string, i: number) => (
                              <p key={i} className="text-sm text-yellow-500">{warning}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {positionSize.targets && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Profit Targets:</p>
                        {positionSize.targets.map((target: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Target {i + 1} ({target.ratio}:1):</span>
                            <span className="font-semibold text-green-500">
                              ₹{target.price.toFixed(2)} (+{target.gain_percent.toFixed(2)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Validation Tab */}
          <TabsContent value="validation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Validation</CardTitle>
                <CardDescription>
                  Get Claude's expert opinion on this trading setup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleValidate} 
                  disabled={validating}
                  className="w-full"
                >
                  {validating ? 'Validating...' : 'Validate with AI'}
                </Button>

                {validation && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${validation.still_valid ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {validation.still_valid ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-semibold">
                          {validation.still_valid ? 'Signal Valid' : 'Signal Invalid'}
                        </span>
                      </div>
                      <p className="text-sm">{validation.reason}</p>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-semibold mb-2">Recommendation:</p>
                      <Badge variant={
                        validation.action === 'ENTER' ? 'default' :
                        validation.action === 'WAIT' ? 'secondary' : 'destructive'
                      }>
                        {validation.action}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Record Trade Tab */}
          <TabsContent value="record" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Record Trade</CardTitle>
                <CardDescription>
                  Track this trade in your journal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Number of Shares</Label>
                  <Input
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    placeholder="100"
                  />
                </div>

                <div>
                  <Label>Entry Price (₹)</Label>
                  <Input
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    placeholder={signal.entry_price.toString()}
                    step="0.01"
                  />
                </div>

                <div>
                  <Label>Notes (Optional)</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Why I'm taking this trade..."
                  />
                </div>

                {shares && entryPrice && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Investment:</span>
                      <span className="font-bold">
                        ₹{(parseInt(shares) * parseFloat(entryPrice)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Potential Profit:</span>
                      <span className="font-bold text-green-500">
                        ₹{(parseInt(shares) * (signal.target_price - parseFloat(entryPrice))).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Loss:</span>
                      <span className="font-bold text-red-500">
                        ₹{(parseInt(shares) * (parseFloat(entryPrice) - signal.stop_loss)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleRecordTrade} 
                  disabled={recording || !shares || !entryPrice}
                  className="w-full"
                >
                  {recording ? 'Recording...' : 'Record Trade'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
