import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { paymentsApi, type Plan } from '@/api/payments';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    Crown,
    Check,
    Loader2,
    Sparkles,
    ArrowRight,
    Globe,
    IndianRupee,
    DollarSign,
} from 'lucide-react';

type Currency = 'INR' | 'USD';

// Detect if user is from India using timezone and language
function detectUserCountry(): Currency {
    try {
        // Check timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone?.includes('Kolkata') || timezone?.includes('India')) {
            return 'INR';
        }

        // Check language as fallback
        const lang = navigator.language || (navigator as any).userLanguage;
        if (lang?.startsWith('hi') || lang === 'en-IN') {
            return 'INR';
        }

        return 'USD';
    } catch {
        return 'INR'; // Default to INR
    }
}

export function Pricing() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
    const [selectedTier, setSelectedTier] = useState<'standard' | 'pro'>('pro');
    const [isCreatingLink, setIsCreatingLink] = useState(false);
    const [currency, setCurrency] = useState<Currency>('INR');

    // Detect user location on mount
    useEffect(() => {
        const detected = detectUserCountry();
        setCurrency(detected);
    }, []);

    // Fetch plans with caching (5 minutes stale time)
    const { data: plansData, isLoading } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: () => paymentsApi.getPlans(),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const plans = plansData?.plans;

    // Get plans by billing cycle
    const standardPlan = plans?.find(p => p.tier === 'standard' && p.plan_type === billingCycle);
    const proPlan = plans?.find(p => p.tier === 'pro' && p.plan_type === billingCycle);

    // Format price based on currency
    const formatPrice = (plan: Plan | undefined): string => {
        if (!plan) return currency === 'INR' ? '₹--' : '$--';
        if (currency === 'USD') {
            return plan.amount_usd_display || `$${plan.amount_usd}`;
        }
        return plan.amount_inr_display || `₹${plan.amount_inr}`;
    };

    // Get per-month price for yearly plans
    const getPerMonth = (plan: Plan | undefined): string | null => {
        if (!plan || billingCycle !== 'yearly') return null;
        if (currency === 'USD') {
            return plan.per_month_usd;
        }
        return plan.per_month_inr;
    };

    // Handle plan selection and payment
    const handleSelectPlan = async () => {
        if (!user) {
            navigate('/auth');
            return;
        }

        setIsCreatingLink(true);
        try {
            const planKey = `${selectedTier}_${billingCycle}`;
            // Pass currency for international payments
            const paymentLink = await paymentsApi.createPaymentLink(
                planKey,
                currency === 'USD' ? 'USD' : undefined // Only send USD explicitly
            );

            if (paymentLink.short_url) {
                window.location.href = paymentLink.short_url;
            }
        } catch (error) {
            console.error('Failed to create payment link:', error);
        } finally {
            setIsCreatingLink(false);
        }
    };

    return (
        <div className="space-y-8 sm:space-y-12">
            {/* Hero Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Premium Plans</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                    Unlock Your Full Potential
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
                    Get access to premium problems, unlimited validations, and powerful insights to build your next successful product.
                </p>
            </motion.div>

            {/* Toggles Row */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
                {/* Billing Cycle Toggle */}
                <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-muted/50 border border-border/50 backdrop-blur-sm">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={cn(
                            "px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all",
                            billingCycle === 'monthly'
                                ? "bg-background shadow-md text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={cn(
                            "px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                            billingCycle === 'yearly'
                                ? "bg-background shadow-md text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Yearly
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-semibold">
                            Save 17%
                        </span>
                    </button>
                </div>

                {/* Currency Toggle */}
                <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-muted/50 border border-border/50 backdrop-blur-sm">
                    <button
                        onClick={() => setCurrency('INR')}
                        className={cn(
                            "px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5",
                            currency === 'INR'
                                ? "bg-background shadow-md text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <IndianRupee className="h-3.5 w-3.5" />
                        <span>INR</span>
                    </button>
                    <button
                        onClick={() => setCurrency('USD')}
                        className={cn(
                            "px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5",
                            currency === 'USD'
                                ? "bg-background shadow-md text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>USD</span>
                    </button>
                </div>
            </motion.div>

            {/* PayPal Notice for USD */}
            {currency === 'USD' && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex justify-center"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-600 dark:text-blue-400">
                        <Globe className="h-4 w-4" />
                        <span>PayPal available for international payments</span>
                    </div>
                </motion.div>
            )}

            {/* Pricing Cards */}
            {isLoading ? (
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <Skeleton className="h-[450px] rounded-3xl" />
                    <Skeleton className="h-[450px] rounded-3xl" />
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto px-4"
                >
                    {/* Standard Plan */}
                    <div
                        onClick={() => setSelectedTier('standard')}
                        className={cn(
                            "relative p-6 sm:p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300",
                            selectedTier === 'standard'
                                ? "border-primary bg-primary/5 shadow-xl shadow-primary/10"
                                : "border-border/50 hover:border-primary/50 hover:shadow-lg"
                        )}
                    >
                        {selectedTier === 'standard' && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                            >
                                <Check className="h-4 w-4 text-white" />
                            </motion.div>
                        )}

                        <div className="mb-6">
                            <h3 className="text-xl font-bold mb-2">Standard</h3>
                            <p className="text-sm text-muted-foreground">Perfect for indie hackers and solopreneurs</p>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl sm:text-5xl font-bold">
                                    {formatPrice(standardPlan)}
                                </span>
                                <span className="text-muted-foreground">
                                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                                </span>
                            </div>
                            {getPerMonth(standardPlan) && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {getPerMonth(standardPlan)}/month billed annually
                                </p>
                            )}
                        </div>

                        <ul className="space-y-3 mb-8">
                            {standardPlan?.features?.length ? (
                                standardPlan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))
                            ) : (
                                <>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                                        <span className="text-sm">All premium problems access</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                                        <span className="text-sm">10 idea validations per month</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                                        <span className="text-sm">Opportunity scores & insights</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                                        <span className="text-sm">Email alerts for new problems</span>
                                    </li>
                                </>
                            )}
                        </ul>

                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTier('standard');
                                handleSelectPlan();
                            }}
                            disabled={isCreatingLink}
                            variant={selectedTier === 'standard' ? 'default' : 'outline'}
                            className="w-full rounded-xl h-12"
                        >
                            {isCreatingLink && selectedTier === 'standard' ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Get Standard
                        </Button>
                    </div>

                    {/* Pro Plan */}
                    <div
                        onClick={() => setSelectedTier('pro')}
                        className={cn(
                            "relative p-6 sm:p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300",
                            selectedTier === 'pro'
                                ? "border-amber-500 bg-gradient-to-br from-amber-500/10 to-orange-500/10 shadow-xl shadow-amber-500/10"
                                : "border-border/50 hover:border-amber-500/50 hover:shadow-lg"
                        )}
                    >
                        {/* Popular Badge */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <div className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                Most Popular
                            </div>
                        </div>

                        {selectedTier === 'pro' && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-4 right-4 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center"
                            >
                                <Check className="h-4 w-4 text-white" />
                            </motion.div>
                        )}

                        <div className="mb-6 pt-2">
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                Pro
                                <Crown className="h-5 w-5 text-amber-500" />
                            </h3>
                            <p className="text-sm text-muted-foreground">For serious entrepreneurs and teams</p>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                                    {formatPrice(proPlan)}
                                </span>
                                <span className="text-muted-foreground">
                                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                                </span>
                            </div>
                            {getPerMonth(proPlan) && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {getPerMonth(proPlan)}/month billed annually
                                </p>
                            )}
                        </div>

                        <ul className="space-y-3 mb-8">
                            {proPlan?.features?.length ? (
                                proPlan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))
                            ) : (
                                <>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-amber-500 shrink-0" />
                                        <span className="text-sm">Everything in Standard</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-amber-500 shrink-0" />
                                        <span className="text-sm">Unlimited idea validations</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-amber-500 shrink-0" />
                                        <span className="text-sm">Priority access to new problems</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-amber-500 shrink-0" />
                                        <span className="text-sm">Advanced market analysis</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-amber-500 shrink-0" />
                                        <span className="text-sm">Export reports & data</span>
                                    </li>
                                </>
                            )}
                        </ul>

                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTier('pro');
                                handleSelectPlan();
                            }}
                            disabled={isCreatingLink}
                            className={cn(
                                "w-full rounded-xl h-12",
                                selectedTier === 'pro'
                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90"
                                    : ""
                            )}
                            variant={selectedTier === 'pro' ? 'default' : 'outline'}
                        >
                            {isCreatingLink && selectedTier === 'pro' ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Get Pro
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Trust Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center space-y-4 pt-8"
            >
                <p className="text-muted-foreground text-sm">
                    Secure payments powered by Razorpay{currency === 'USD' ? ' & PayPal' : ''}
                </p>
                <div className="flex items-center justify-center gap-6 text-muted-foreground/60">
                    <span className="text-xs">🔒 SSL Secured</span>
                    <span className="text-xs">💳 PCI Compliant</span>
                    <span className="text-xs">🔄 Cancel Anytime</span>
                </div>
            </motion.div>
        </div>
    );
}

export default Pricing;
