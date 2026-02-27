// Advanced Filters Page for Signal Customization
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Filter, Save, RotateCcw, TrendingUp, Shield, Target, Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function AdvancedFilters() {
  const [filters, setFilters] = useState({
    // Technical Filters
    minConfidence: 60,
    minRiskReward: 2.0,
    maxRiskReward: 10.0,
    rsiMin: 0,
    rsiMax: 100,
    volumeMultiplier: 1.5,
    
    // Fundamental Filters
    minMarketCap: 0,
    maxMarketCap: 1000000,
    minPiotroskiScore: 0,
    sectors: [],
    
    // Strategy Filters
    strategies: ['all'],
    timeframes: ['day', 'week'],
    
    // Risk Management
    maxPositionSize: 10,
    maxCorrelation: 0.7,
    enableDrawdownProtection: true,
    
    // Event Filters
    avoidEarnings: false,
    requireCatalyst: false,
    
    // AI Validation
    enableClaudeValidation: true,
    minClaudeConfidence: 60,
  });

  const handleSave = () => {
    localStorage.setItem('stockFilters', JSON.stringify(filters));
    toast.success('Filters saved successfully!');
  };

  const handleReset = () => {
    setFilters({
      minConfidence: 60,
      minRiskReward: 2.0,
      maxRiskReward: 10.0,
      rsiMin: 0,
      rsiMax: 100,
      volumeMultiplier: 1.5,
      minMarketCap: 0,
      maxMarketCap: 1000000,
      minPiotroskiScore: 0,
      sectors: [],
      strategies: ['all'],
      timeframes: ['day', 'week'],
      maxPositionSize: 10,
      maxCorrelation: 0.7,
      enableDrawdownProtection: true,
      avoidEarnings: false,
      requireCatalyst: false,
      enableClaudeValidation: true,
      minClaudeConfidence: 60,
    });
    toast.info('Filters reset to defaults');
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Filter className="h-8 w-8" />
            Advanced Signal Filters
          </h1>
          <p className="text-muted-foreground">Customize signal detection criteria</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technical Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Technical Filters
            </CardTitle>
            <CardDescription>Configure technical analysis criteria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Minimum Confidence Score: {filters.minConfidence}%</Label>
              <Slider
                value={[filters.minConfidence]}
                onValueChange={([value]) => setFilters({ ...filters, minConfidence: value })}
                min={0}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Risk/Reward Range: {filters.minRiskReward} - {filters.maxRiskReward}</Label>
              <div className="flex gap-4">
                <Input
                  type="number"
                  value={filters.minRiskReward}
                  onChange={(e) => setFilters({ ...filters, minRiskReward: parseFloat(e.target.value) })}
                  step={0.1}
                />
                <Input
                  type="number"
                  value={filters.maxRiskReward}
                  onChange={(e) => setFilters({ ...filters, maxRiskReward: parseFloat(e.target.value) })}
                  step={0.1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>RSI Range: {filters.rsiMin} - {filters.rsiMax}</Label>
              <div className="flex gap-4">
                <Input
                  type="number"
                  value={filters.rsiMin}
                  onChange={(e) => setFilters({ ...filters, rsiMin: parseInt(e.target.value) })}
                  min={0}
                  max={100}
                />
                <Input
                  type="number"
                  value={filters.rsiMax}
                  onChange={(e) => setFilters({ ...filters, rsiMax: parseInt(e.target.value) })}
                  min={0}
                  max={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Volume Multiplier: {filters.volumeMultiplier}x</Label>
              <Slider
                value={[filters.volumeMultiplier]}
                onValueChange={([value]) => setFilters({ ...filters, volumeMultiplier: value })}
                min={1}
                max={5}
                step={0.1}
              />
            </div>
          </CardContent>
        </Card>

        {/* Risk Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Management
            </CardTitle>
            <CardDescription>Configure risk and position sizing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Max Position Size: {filters.maxPositionSize}%</Label>
              <Slider
                value={[filters.maxPositionSize]}
                onValueChange={([value]) => setFilters({ ...filters, maxPositionSize: value })}
                min={1}
                max={20}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Correlation: {filters.maxCorrelation}</Label>
              <Slider
                value={[filters.maxCorrelation]}
                onValueChange={([value]) => setFilters({ ...filters, maxCorrelation: value })}
                min={0}
                max={1}
                step={0.05}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Enable Drawdown Protection</Label>
              <Switch
                checked={filters.enableDrawdownProtection}
                onCheckedChange={(checked) => setFilters({ ...filters, enableDrawdownProtection: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label>Avoid Earnings Events</Label>
              <Switch
                checked={filters.avoidEarnings}
                onCheckedChange={(checked) => setFilters({ ...filters, avoidEarnings: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Require Event Catalyst</Label>
              <Switch
                checked={filters.requireCatalyst}
                onCheckedChange={(checked) => setFilters({ ...filters, requireCatalyst: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Strategy Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Strategy Selection
            </CardTitle>
            <CardDescription>Choose trading strategies and timeframes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Strategies</Label>
              <div className="flex flex-wrap gap-2">
                {['All', 'Mean Reversion', 'Trend Following', 'Breakout', 'Momentum'].map((strategy) => (
                  <Badge
                    key={strategy}
                    variant={filters.strategies.includes(strategy.toLowerCase()) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const strategyKey = strategy.toLowerCase();
                      setFilters({
                        ...filters,
                        strategies: filters.strategies.includes(strategyKey)
                          ? filters.strategies.filter(s => s !== strategyKey)
                          : [...filters.strategies, strategyKey]
                      });
                    }}
                  >
                    {strategy}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Timeframes</Label>
              <div className="flex flex-wrap gap-2">
                {['Day', 'Week', 'Month'].map((timeframe) => (
                  <Badge
                    key={timeframe}
                    variant={filters.timeframes.includes(timeframe.toLowerCase()) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const timeframeKey = timeframe.toLowerCase();
                      setFilters({
                        ...filters,
                        timeframes: filters.timeframes.includes(timeframeKey)
                          ? filters.timeframes.filter(t => t !== timeframeKey)
                          : [...filters.timeframes, timeframeKey]
                      });
                    }}
                  >
                    {timeframe}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Validation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              AI Validation
            </CardTitle>
            <CardDescription>Configure Claude AI validation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label>Enable Claude Validation</Label>
              <Switch
                checked={filters.enableClaudeValidation}
                onCheckedChange={(checked) => setFilters({ ...filters, enableClaudeValidation: checked })}
              />
            </div>

            {filters.enableClaudeValidation && (
              <div className="space-y-2">
                <Label>Minimum Claude Confidence: {filters.minClaudeConfidence}%</Label>
                <Slider
                  value={[filters.minClaudeConfidence]}
                  onValueChange={([value]) => setFilters({ ...filters, minClaudeConfidence: value })}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
