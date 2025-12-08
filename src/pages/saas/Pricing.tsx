import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { paymentsApi, type Plan } from '@/api/payments';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    Crown,
    Check,
    Zap,
    Loader2,
    Sparkles,
    ArrowRight,
} from 'lucide-react';

export function Pricing() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
    const [selectedTier, setSelectedTier] = useState<'standard' | 'pro'>('pro');
    const [isCreatingLink, setIsCreatingLink] = useState(false);

    // Fetch plans with caching (5 minutes stale time)
    const { data: plansData, isLoading } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: () => paymentsApi.getPlans(),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    });

    // Extract plans from response
    const plans = plansData?.plans;

    // Get plans by billing cycle using plan_type field
    const standardPlan = plans?.find(p => p.tier === 'standard' && p.plan_type === billingCycle);
    const proPlan = plans?.find(p => p.tier === 'pro' && p.plan_type === billingCycle);

    // Handle plan selection and payment
    const handleSelectPlan = async () => {
        if (!user) {
            navigate('/auth');
            return;
        }

        setIsCreatingLink(true);
        try {
            const planKey = `${selectedTier}_${billingCycle}`;
            const paymentLink = await paymentsApi.createPaymentLink(planKey);

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

            {/* Billing Toggle */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center"
            >
                <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-muted/50 border border-border/50 backdrop-blur-sm">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
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
                            "px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
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
            </motion.div>

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
                                    {standardPlan?.amount_display || (billingCycle === 'yearly' ? '₹2,999' : '₹299')}
                                </span>
                                <span className="text-muted-foreground">
                                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                                </span>
                            </div>
                            {billingCycle === 'yearly' && standardPlan?.per_month && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {standardPlan.per_month}/month billed annually
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
                            disabled={isCreatingLink && selectedTier === 'standard'}
                            variant={selectedTier === 'standard' ? 'default' : 'outline'}
                            className="w-full rounded-xl h-12"
                        >
                            {isCreatingLink && selectedTier === 'standard' ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Get Started
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Pro Plan */}
                    <div
                        onClick={() => setSelectedTier('pro')}
                        className={cn(
                            "relative p-6 sm:p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300",
                            selectedTier === 'pro'
                                ? "border-amber-500 bg-amber-500/5 shadow-xl shadow-amber-500/10"
                                : "border-border/50 hover:border-amber-500/50 hover:shadow-lg"
                        )}
                    >
                        <Badge className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Popular
                        </Badge>

                        <div className="mb-6">
                            <h3 className="text-xl font-bold mb-2">Pro</h3>
                            <p className="text-sm text-muted-foreground">For serious founders and agencies</p>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl sm:text-5xl font-bold">
                                    {proPlan?.amount_display || (billingCycle === 'yearly' ? '₹5,999' : '₹599')}
                                </span>
                                <span className="text-muted-foreground">
                                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                                </span>
                            </div>
                            {billingCycle === 'yearly' && proPlan?.per_month && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {proPlan.per_month}/month billed annually
                                </p>
                            )}
                        </div>

                        <ul className="space-y-3 mb-8">
                            {proPlan?.features?.length ? (
                                proPlan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))
                            ) : (
                                <>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                                        <span className="text-sm">Everything in Standard</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                                        <span className="text-sm">Unlimited idea validations</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                                        <span className="text-sm">Priority support</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                                        <span className="text-sm">Export reports (PDF/Markdown)</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                                        <span className="text-sm">Early access to new features</span>
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
                            disabled={isCreatingLink && selectedTier === 'pro'}
                            className="w-full rounded-xl h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90"
                        >
                            {isCreatingLink && selectedTier === 'pro' ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Zap className="h-4 w-4 mr-2" />
                                    Get Pro
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* FAQ or Trust Signals */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center text-sm text-muted-foreground space-y-2 pt-8"
            >
                <p>🔒 Secure payment via Razorpay • Cancel anytime</p>
                <p>Questions? <a href="mailto:support@beseekr.com" className="text-primary hover:underline">Contact us</a></p>
            </motion.div>
        </div>
    );
}

export default Pricing;
