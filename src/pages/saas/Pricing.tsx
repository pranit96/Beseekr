import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentsApi, type Plan } from "@/api/payments";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Crown,
  Check,
  Loader2,
  Sparkles,
  ArrowRight,
  Globe,
  IndianRupee,
  DollarSign,
  Zap,
} from "lucide-react";

type Currency = "INR" | "USD";

// Detect if user is from India using timezone and language
function detectUserCountry(): Currency {
  try {
    // Check timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone?.includes("Kolkata") || timezone?.includes("India")) {
      return "INR";
    }

    // Check language as fallback
    const lang = navigator.language || (navigator as any).userLanguage;
    if (lang?.startsWith("hi") || lang === "en-IN") {
      return "INR";
    }

    return "USD";
  } catch {
    return "INR"; // Default to INR
  }
}

export function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [selectedTier, setSelectedTier] = useState<"pro" | "ultra">("ultra");
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [currency, setCurrency] = useState<Currency>("INR");

  // Detect user location on mount + SEO
  useEffect(() => {
    const detected = detectUserCountry();
    setCurrency(detected);

    // SEO - Update page meta tags
    document.title =
      "Pricing Plans - Affordable AI Learning & Market Research | beseekr";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Choose the perfect plan for AI-guided learning, instant Claude Sonnet generation, validated startup problems, and resume optimization. Plans from ₹99/month or $5/month.",
      );
    }
    return () => {
      document.title = "beseekr - Discover Validated Startup Problems";
    };
  }, []);

  // Fetch plans with caching (5 minutes stale time)
  const { data: plansData, isLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: () => paymentsApi.getPlans(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const plans = plansData?.plans;

  // Get active plans
  const proPlan =
    plans?.find((p) => p.tier === "pro" && p.plan_type === billingCycle) ||
    plans?.find((p) => p.tier === "pro");

  const ultraPlan =
    plans?.find((p) => p.tier === "ultra" && p.plan_type === billingCycle) ||
    plans?.find((p) => p.tier === "ultra");

  // Format price based on currency
  const formatPrice = (
    plan: Plan | undefined,
    fallbackInr: number,
    fallbackUsd: number,
  ): string => {
    if (!plan) {
      return currency === "USD" ? `$${fallbackUsd}` : `₹${fallbackInr}`;
    }
    if (currency === "USD") {
      return plan.amount_usd_display || `$${plan.amount_usd}`;
    }
    return plan.amount_inr_display || `₹${plan.amount_inr}`;
  };

  // Get per-month price for yearly plans
  const getPerMonth = (plan: Plan | undefined): string | null => {
    if (!plan || billingCycle !== "yearly") return null;
    if (currency === "USD") {
      return plan.per_month_usd;
    }
    return plan.per_month_inr;
  };

  // Handle plan selection and payment
  const handleSelectPlan = async (tier: "pro" | "ultra") => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setSelectedTier(tier);
    setIsCreatingLink(true);
    try {
      const planKey = `${tier}_${billingCycle}`;
      // Pass currency for international payments
      const paymentLink = await paymentsApi.createPaymentLink(
        planKey,
        currency === "USD" ? "USD" : undefined, // Only send USD explicitly
      );

      if (paymentLink.short_url) {
        window.location.href = paymentLink.short_url;
      }
    } catch (error) {
      console.error("Failed to create payment link:", error);
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
          Instant AI learning powered by Claude Sonnet, deep market
          intelligence, and comprehensive career tools.
        </p>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-green-500" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-green-500" />
            <span>Secure payments (Razorpay & PayPal)</span>
          </div>
        </div>
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
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all",
              billingCycle === "monthly"
                ? "bg-background shadow-md text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={cn(
              "px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
              billingCycle === "yearly"
                ? "bg-background shadow-md text-foreground"
                : "text-muted-foreground hover:text-foreground",
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
            onClick={() => setCurrency("INR")}
            className={cn(
              "px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5",
              currency === "INR"
                ? "bg-background shadow-md text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <IndianRupee className="h-3.5 w-3.5" />
            <span>INR</span>
          </button>
          <button
            onClick={() => setCurrency("USD")}
            className={cn(
              "px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5",
              currency === "USD"
                ? "bg-background shadow-md text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>USD</span>
          </button>
        </div>
      </motion.div>

      {/* PayPal Notice for USD */}
      {currency === "USD" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
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
          <Skeleton className="h-[520px] rounded-3xl" />
          <Skeleton className="h-[520px] rounded-3xl" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto px-4"
        >
          {/* Pro Plan */}
          <div
            onClick={() => setSelectedTier("pro")}
            className={cn(
              "relative p-6 sm:p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between",
              selectedTier === "pro"
                ? "border-teal-500 bg-teal-500/5 shadow-xl shadow-teal-500/10"
                : "border-border/50 hover:border-teal-500/50 hover:shadow-lg",
            )}
          >
            {selectedTier === "pro" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center"
              >
                <Check className="h-4 w-4 text-white" />
              </motion.div>
            )}

            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-foreground">
                  Pro
                  <Zap className="h-5 w-5 text-teal-400" />
                </h2>
                <p className="text-sm text-muted-foreground">
                  For active learners and builders
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-bold text-foreground">
                    {formatPrice(proPlan, 99, 5)}
                  </span>
                  <span className="text-muted-foreground">
                    /{billingCycle === "yearly" ? "year" : "month"}
                  </span>
                </div>
                {getPerMonth(proPlan) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {getPerMonth(proPlan)}/month billed annually
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                  <span className="text-sm">
                    <strong>Priority 1 Queue</strong> for AI Study Guides
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                  <span className="text-sm">Groq 120B reasoning model</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                  <span className="text-sm">10 Resume Tailor runs / month</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                  <span className="text-sm">All validated problems access</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited idea validations</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectPlan("pro");
              }}
              disabled={isCreatingLink}
              variant={selectedTier === "pro" ? "default" : "outline"}
              className={cn(
                "w-full rounded-xl h-12",
                selectedTier === "pro"
                  ? "bg-teal-500 hover:bg-teal-600 text-white"
                  : "",
              )}
            >
              {isCreatingLink && selectedTier === "pro" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Get Pro
            </Button>
          </div>

          {/* Ultra Plan (Flagship) */}
          <div
            onClick={() => setSelectedTier("ultra")}
            className={cn(
              "relative p-6 sm:p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between",
              selectedTier === "ultra"
                ? "border-amber-500 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-teal-500/10 shadow-xl shadow-amber-500/10"
                : "border-border/50 hover:border-amber-500/50 hover:shadow-lg",
            )}
          >
            {/* Popular / Ultimate Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md">
                <Sparkles className="h-3 w-3" />
                Ultra · Claude Sonnet Included
              </div>
            </div>

            {selectedTier === "ultra" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center"
              >
                <Check className="h-4 w-4 text-white" />
              </motion.div>
            )}

            <div>
              <div className="mb-6 pt-2">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-foreground">
                  Ultra
                  <Crown className="h-5 w-5 text-amber-500" />
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ultimate AI power & zero-wait experience
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    {formatPrice(ultraPlan, 299, 10)}
                  </span>
                  <span className="text-muted-foreground">
                    /{billingCycle === "yearly" ? "year" : "month"}
                  </span>
                </div>
                {getPerMonth(ultraPlan) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {getPerMonth(ultraPlan)}/month billed annually
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold text-amber-300">
                    Instant Synchronous Claude Sonnet AI
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-sm">
                    <strong>Zero wait time</strong> — instant study guides &
                    quizzes
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-sm">
                    Generous 8,000-token ceiling with automated fallback
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-sm">
                    <strong>100 Resume Tailor runs</strong> / month
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-sm">
                    Full Market Intelligence, Exports & Alerting
                  </span>
                </li>
              </ul>
            </div>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectPlan("ultra");
              }}
              disabled={isCreatingLink}
              className={cn(
                "w-full rounded-xl h-12 font-semibold shadow-lg shadow-amber-500/20",
                selectedTier === "ultra"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  : "",
              )}
              variant={selectedTier === "ultra" ? "default" : "outline"}
            >
              {isCreatingLink && selectedTier === "ultra" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Get Ultra
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
          Secure payments powered by Razorpay
          {currency === "USD" ? " & PayPal" : ""}
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
