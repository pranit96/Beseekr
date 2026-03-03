import { useState } from 'react';
import { tradingApi } from '@/api/trading';
import {
    Target, TrendingUp, TrendingDown, AlertCircle, Loader2,
    IndianRupee, Shield, Clock, BarChart3, Zap, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Recommendation {
    signal_id: string;
    stock: { symbol: string; name: string; sector?: string };
    strategy: string;
    entry_price: number;
    current_price: number;
    target_price: number;
    stop_loss: number;
    shares: number;
    investment: number;
    risk_amount: number;
    potential_profit: number;
    potential_loss: number;
    risk_reward: number;
    confidence: number;
    holding_period: string;
    holding_days: number;
    allocation_percent: string;
    net_profit_after_costs: number;
    net_return_percent: number;
    trade_viable: boolean;
    cost_warnings: string[];
    transaction_costs: {
        total: number;
        break_even_price: number;
        break_even_move_percent: number;
        breakdown: {
            brokerage: { total: number };
            stt: number;
            gst: number;
            stampDuty: number;
            slippage: number;
        };
    };
}

interface PortfolioResult {
    success: boolean;
    message?: string;
    budget: number;
    risk_profile: string;
    timeframe: string;
    portfolio: {
        recommendations: Recommendation[];
        total_investment: number;
        remaining_cash: number;
        total_risk: number;
        total_potential_profit: number;
        diversification: { stocks: number; sectors: number; strategies: number };
    };
    summary: {
        total_stocks: number;
        total_investment: number;
        remaining_cash: number;
        cash_utilization: string;
        total_risk: number;
        risk_percent: string;
        potential_profit: number;
        potential_return: string;
        avg_risk_reward: string;
        avg_confidence: string;
        diversification: string;
        recommendation: string;
    };
}

const RISK_PROFILES = [
    { value: 'conservative', label: 'Conservative', desc: '1% risk per trade, min 2.5 R:R', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
    { value: 'moderate', label: 'Moderate', desc: '2% risk per trade, min 2.0 R:R', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    { value: 'aggressive', label: 'Aggressive', desc: '3% risk per trade, min 1.5 R:R', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
];

const TIMEFRAMES = [
    { value: 'day', label: 'Intraday', desc: 'Exit same day', icon: '⚡' },
    { value: 'week', label: 'Swing', desc: '3-7 days', icon: '📊' },
    { value: 'month', label: 'Positional', desc: '2-4 weeks', icon: '📈' },
    { value: 'year', label: 'Long-term', desc: '3-6 months', icon: '🏦' },
];

export default function DailyPicks() {
    const [budget, setBudget] = useState<string>('50000');
    const [riskProfile, setRiskProfile] = useState('moderate');
    const [timeframe, setTimeframe] = useState('week');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PortfolioResult | null>(null);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    const handleGenerate = async () => {
        const budgetNum = parseFloat(budget);
        if (isNaN(budgetNum) || budgetNum < 1000) {
            setError('Please enter a budget of at least ₹1,000');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setResult(null);

            const data = await tradingApi.generateDailyPicks({
                budget: budgetNum,
                risk_profile: riskProfile as 'conservative' | 'moderate' | 'aggressive',
                timeframe: timeframe as 'day' | 'week' | 'month' | 'year',
            });

            if (!data.success) {
                setError(data.message || 'No suitable stocks found. Try again later or adjust your budget.');
            } else {
                setResult(data);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to generate picks. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (n: number) => {
        if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
        if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
        return `₹${n.toFixed(2)}`;
    };

    const formatPercent = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Target className="h-8 w-8 text-amber-400" />
                    Daily Picks
                </h1>
                <p className="text-slate-400 mt-1">
                    Tell me your budget — I'll tell you exactly what to buy, how many shares, and when to exit.
                </p>
            </div>

            {/* Input Form */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6">
                {/* Budget Input */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Your Budget
                    </label>
                    <div className="relative">
                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="e.g. 50000"
                            min="1000"
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-lg font-semibold placeholder-slate-500 
                         focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all outline-none"
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">Minimum ₹1,000 required</p>
                </div>

                {/* Risk Profile */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Risk Profile
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {RISK_PROFILES.map((rp) => (
                            <button
                                key={rp.value}
                                onClick={() => setRiskProfile(rp.value)}
                                className={cn(
                                    'p-3 rounded-lg border text-left transition-all',
                                    riskProfile === rp.value
                                        ? rp.bg + ' ring-1 ring-offset-0'
                                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                )}
                            >
                                <div className={cn('text-sm font-semibold', riskProfile === rp.value ? rp.color : 'text-slate-300')}>
                                    {rp.label}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">{rp.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Timeframe */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Holding Period
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                        {TIMEFRAMES.map((tf) => (
                            <button
                                key={tf.value}
                                onClick={() => setTimeframe(tf.value)}
                                className={cn(
                                    'p-3 rounded-lg border text-center transition-all',
                                    timeframe === tf.value
                                        ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20'
                                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                )}
                            >
                                <div className="text-lg mb-0.5">{tf.icon}</div>
                                <div className={cn('text-sm font-semibold', timeframe === tf.value ? 'text-amber-400' : 'text-slate-300')}>
                                    {tf.label}
                                </div>
                                <div className="text-xs text-slate-500">{tf.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className={cn(
                        'w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2',
                        loading
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/20 active:scale-[0.98]'
                    )}
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Analyzing stocks & calculating positions...
                        </>
                    ) : (
                        <>
                            <Zap className="h-5 w-5" />
                            Generate My Picks
                        </>
                    )}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <div className="text-red-400 font-medium">Could not generate picks</div>
                        <div className="text-sm text-slate-400 mt-1">{error}</div>
                    </div>
                </div>
            )}

            {/* Results */}
            {result && result.portfolio && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <SummaryCard
                            label="Total Investment"
                            value={formatCurrency(result.summary.total_investment)}
                            sub={`${result.summary.cash_utilization} of budget`}
                            icon={<IndianRupee className="h-4 w-4" />}
                            color="text-white"
                        />
                        <SummaryCard
                            label="Potential Return"
                            value={result.summary.potential_return}
                            sub={formatCurrency(result.summary.potential_profit)}
                            icon={<TrendingUp className="h-4 w-4" />}
                            color="text-green-400"
                        />
                        <SummaryCard
                            label="Total Risk"
                            value={result.summary.risk_percent}
                            sub={formatCurrency(result.summary.total_risk)}
                            icon={<Shield className="h-4 w-4" />}
                            color="text-red-400"
                        />
                        <SummaryCard
                            label="Avg Risk/Reward"
                            value={result.summary.avg_risk_reward}
                            sub={`${result.summary.avg_confidence} confidence`}
                            icon={<BarChart3 className="h-4 w-4" />}
                            color="text-amber-400"
                        />
                    </div>

                    {/* Portfolio Recommendation Banner */}
                    <div className={cn(
                        'rounded-xl p-4 border flex items-center gap-3',
                        result.summary.recommendation.includes('EXCELLENT') ? 'bg-green-500/10 border-green-500/30' :
                            result.summary.recommendation.includes('GOOD') ? 'bg-blue-500/10 border-blue-500/30' :
                                result.summary.recommendation.includes('HIGH RISK') || result.summary.recommendation.includes('LOW') ? 'bg-red-500/10 border-red-500/30' :
                                    'bg-yellow-500/10 border-yellow-500/30'
                    )}>
                        <Info className="h-5 w-5 text-slate-300 flex-shrink-0" />
                        <div className="text-sm text-slate-300">
                            <span className="font-semibold">{result.summary.recommendation}</span>
                            <span className="text-slate-500 ml-2">
                                • {result.summary.diversification}
                            </span>
                        </div>
                    </div>

                    {/* Stock Pick Cards */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-white">
                            Your Picks ({result.portfolio.recommendations.length} stocks)
                        </h2>
                        {result.portfolio.recommendations.map((rec, idx) => (
                            <PickCard
                                key={rec.signal_id || idx}
                                rec={rec}
                                index={idx + 1}
                                expanded={expandedCard === rec.signal_id}
                                onToggle={() => setExpandedCard(expandedCard === rec.signal_id ? null : rec.signal_id)}
                            />
                        ))}
                    </div>

                    {/* Remaining Cash */}
                    {result.portfolio.remaining_cash > 0 && (
                        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 text-center">
                            <span className="text-slate-400">Remaining cash: </span>
                            <span className="text-white font-bold">{formatCurrency(result.portfolio.remaining_cash)}</span>
                            <span className="text-slate-500 text-sm ml-2">(keep as buffer)</span>
                        </div>
                    )}

                    {/* Disclaimer */}
                    <div className="text-xs text-slate-600 text-center py-2">
                        ⚠️ These are AI-generated recommendations, not financial advice. Always do your own research before trading with real money.
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Sub-components ---

function SummaryCard({ label, value, sub, icon, color }: {
    label: string; value: string; sub: string; icon: React.ReactNode; color: string;
}) {
    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-2">
                {icon}
                {label}
            </div>
            <div className={cn('text-xl font-bold', color)}>{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
        </div>
    );
}

function PickCard({ rec, index, expanded, onToggle }: {
    rec: Recommendation; index: number; expanded: boolean; onToggle: () => void;
}) {
    const isProfit = rec.net_profit_after_costs > 0;
    const entryPrice = rec.current_price || rec.entry_price;
    const targetPercent = ((rec.target_price - entryPrice) / entryPrice * 100);
    const stopPercent = ((entryPrice - rec.stop_loss) / entryPrice * 100);

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            {/* Main Row */}
            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold text-sm">
                            {index}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-white">{rec.stock.symbol?.replace('NSE:', '')}</span>
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400">BUY</span>
                                {!rec.trade_viable && (
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400">HIGH COST</span>
                                )}
                            </div>
                            <div className="text-xs text-slate-500">{rec.stock.name} • {rec.strategy}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-500">Confidence</div>
                        <div className={cn(
                            'text-lg font-bold',
                            rec.confidence >= 75 ? 'text-green-400' : rec.confidence >= 60 ? 'text-yellow-400' : 'text-red-400'
                        )}>
                            {rec.confidence.toFixed(0)}%
                        </div>
                    </div>
                </div>

                {/* Action Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <ActionItem
                        label="Buy Shares"
                        value={`${rec.shares} shares`}
                        sub={`@ ₹${entryPrice.toFixed(2)}`}
                        highlight
                    />
                    <ActionItem
                        label="Investment"
                        value={`₹${rec.investment.toFixed(0)}`}
                        sub={`${rec.allocation_percent}% of budget`}
                    />
                    <ActionItem
                        label="Target"
                        value={`₹${rec.target_price.toFixed(2)}`}
                        sub={`+${targetPercent.toFixed(1)}% upside`}
                        color="text-green-400"
                    />
                    <ActionItem
                        label="Stop Loss"
                        value={`₹${rec.stop_loss.toFixed(2)}`}
                        sub={`-${stopPercent.toFixed(1)}% downside`}
                        color="text-red-400"
                    />
                </div>

                {/* Profit/Risk Row */}
                <div className="grid grid-cols-3 gap-4 p-3 bg-slate-800/50 rounded-lg">
                    <div>
                        <div className="text-xs text-slate-500">Net Profit (after costs)</div>
                        <div className={cn('text-sm font-bold', isProfit ? 'text-green-400' : 'text-red-400')}>
                            {isProfit ? '+' : ''}₹{rec.net_profit_after_costs.toFixed(2)}
                            <span className="text-xs ml-1">({rec.net_return_percent?.toFixed(2)}%)</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">Risk Amount</div>
                        <div className="text-sm font-bold text-red-400">
                            -₹{rec.risk_amount.toFixed(2)}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">Hold Duration</div>
                        <div className="text-sm font-bold text-white flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {rec.holding_period}
                        </div>
                    </div>
                </div>

                {/* Risk/Reward Bar */}
                <div className="mt-3 flex items-center gap-2">
                    <div className="text-xs text-slate-500 w-16">R:R {rec.risk_reward.toFixed(1)}:1</div>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                            className="h-full bg-red-500 rounded-l-full"
                            style={{ width: `${(1 / (1 + rec.risk_reward)) * 100}%` }}
                        />
                        <div
                            className="h-full bg-green-500 rounded-r-full"
                            style={{ width: `${(rec.risk_reward / (1 + rec.risk_reward)) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Cost Warnings */}
                {rec.cost_warnings && rec.cost_warnings.length > 0 && (
                    <div className="mt-3 space-y-1">
                        {rec.cost_warnings.map((w, i) => (
                            <div key={i} className="text-xs text-yellow-500">{w}</div>
                        ))}
                    </div>
                )}
            </div>

            {/* Expandable Cost Details */}
            <button
                onClick={onToggle}
                className="w-full px-5 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 hover:bg-slate-800/50 transition-colors"
            >
                <span>Transaction Cost Details</span>
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {expanded && rec.transaction_costs && (
                <div className="px-5 pb-4 space-y-2 text-xs border-t border-slate-800/50 pt-3">
                    <CostRow label="Brokerage" value={rec.transaction_costs.breakdown?.brokerage?.total} />
                    <CostRow label="STT" value={rec.transaction_costs.breakdown?.stt} />
                    <CostRow label="GST" value={rec.transaction_costs.breakdown?.gst} />
                    <CostRow label="Stamp Duty" value={rec.transaction_costs.breakdown?.stampDuty} />
                    <CostRow label="Est. Slippage" value={rec.transaction_costs.breakdown?.slippage} />
                    <div className="border-t border-slate-800 pt-1.5 flex justify-between font-semibold text-slate-300">
                        <span>Total Costs</span>
                        <span>₹{rec.transaction_costs.total?.toFixed(2)}</span>
                    </div>
                    <div className="text-slate-500 pt-1">
                        Break-even price: ₹{rec.transaction_costs.break_even_price?.toFixed(2)}
                        ({rec.transaction_costs.break_even_move_percent?.toFixed(3)}% move needed)
                    </div>
                </div>
            )}
        </div>
    );
}

function ActionItem({ label, value, sub, color = 'text-white', highlight = false }: {
    label: string; value: string; sub: string; color?: string; highlight?: boolean;
}) {
    return (
        <div className={cn(
            'rounded-lg p-2.5',
            highlight ? 'bg-amber-500/10 border border-amber-500/20' : ''
        )}>
            <div className="text-xs text-slate-500">{label}</div>
            <div className={cn('text-sm font-bold', highlight ? 'text-amber-400' : color)}>{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
        </div>
    );
}

function CostRow({ label, value }: { label: string; value?: number }) {
    return (
        <div className="flex justify-between text-slate-400">
            <span>{label}</span>
            <span>₹{(value || 0).toFixed(2)}</span>
        </div>
    );
}
