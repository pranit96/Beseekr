import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentsApi, type Plan } from "@/api/payments";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Crown,
  Check,
  Loader2,
  Sparkles,
  Globe,
  IndianRupee,
  DollarSign,
  Zap,
} from "lucide-react";

type Currency = "INR" | "USD";

function detectUserCountry(): Currency {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone?.includes("Kolkata") || timezone?.includes("India")) {
      return "INR";
    }
    const lang = navigator.language || (navigator as any).userLanguage;
    if (lang?.startsWith("hi") || lang === "en-IN") {
      return "INR";
    }
    return "USD";
  } catch {
    return "INR";
  }
}

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTier?: "pro" | "ultra";
}

export function PricingDialog({
  open,
  onOpenChange,
  defaultTier = "ultra",
}: PricingDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedTier, setSelectedTier] = useState<"pro" | "ultra">(defaultTier);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [currency, setCurrency] = useState<Currency>("INR");

  useEffect(() => {
    setCurrency(detectUserCountry());
  }, []);

  const { data: plansData, isLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: () => paymentsApi.getPlans(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const plans = plansData?.plans;

  const proPlan =
    plans?.find((p) => p.tier === "pro" && p.plan_type === billingCycle) ||
    plans?.find((p) => p.tier === "pro");

  const ultraPlan =
    plans?.find((p) => p.tier === "ultra" && p.plan_type === billingCycle) ||
    plans?.find((p) => p.tier === "ultra");

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

  const getPerMonth = (plan: Plan | undefined): string | null => {
    if (!plan || billingCycle !== "yearly") return null;
    if (currency === "USD") {
      return plan.per_month_usd;
    }
    return plan.per_month_inr;
  };

  const handleSelectPlan = async (tier: "pro" | "ultra") => {
    if (!user) {
      onOpenChange(false);
      navigate("/auth");
      return;
    }

    setSelectedTier(tier);
    setIsCreatingLink(true);
    try {
      const planKey = `${tier}_${billingCycle}`;
      const paymentLink = await paymentsApi.createPaymentLink(
        planKey,
        currency === "USD" ? "USD" : undefined,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 sm:p-8 bg-background/95 backdrop-blur-xl border border-border/60 shadow-2xl rounded-3xl z-[10000]">
        <DialogHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-teal-500/15 border border-amber-500/30 text-xs font-semibold text-amber-400">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              Upgrade Learning & AI Features
            </div>
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
            Choose Your AI Learning Plan
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground max-w-lg mx-auto">
            Get instant Claude Sonnet AI generation, zero-wait study guides, prioritized hands-on challenges, and full market intelligence.
          </DialogDescription>
        </DialogHeader>

        {/* Toggles Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 my-2">
          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/50 backdrop-blur-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                billingCycle === "monthly"
                  ? "bg-background shadow-sm text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1",
                billingCycle === "yearly"
                  ? "bg-background shadow-sm text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Yearly
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 font-bold">
                Save 17%
              </span>
            </button>
          </div>

          {/* Currency Toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/50 backdrop-blur-sm">
            <button
              onClick={() => setCurrency("INR")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1",
                currency === "INR"
                  ? "bg-background shadow-sm text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <IndianRupee className="h-3 w-3" />
              <span>INR</span>
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1",
                currency === "USD"
                  ? "bg-background shadow-sm text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <DollarSign className="h-3 w-3" />
              <span>USD</span>
            </button>
          </div>
        </div>

        {/* Currency Notice */}
        {currency === "USD" && (
          <div className="flex justify-center -mt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
              <Globe className="h-3 w-3" />
              <span>PayPal available for international payments</span>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4 mt-2">
            <Skeleton className="h-[400px] rounded-2xl" />
            <Skeleton className="h-[400px] rounded-2xl" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 mt-2">
            {/* Pro Plan */}
            <div
              onClick={() => setSelectedTier("pro")}
              className={cn(
                "relative p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between",
                selectedTier === "pro"
                  ? "border-teal-500 bg-teal-500/5 shadow-xl shadow-teal-500/10"
                  : "border-border/50 hover:border-teal-500/50 hover:shadow-lg bg-card/10",
              )}
            >
              {selectedTier === "pro" && (
                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}

              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-1.5 text-foreground">
                    Pro Plan
                    <Zap className="h-4 w-4 text-teal-400" />
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    For active learners & builders
                  </p>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold text-foreground">
                      {formatPrice(proPlan, 99, 5)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      /{billingCycle === "yearly" ? "year" : "month"}
                    </span>
                  </div>
                  {getPerMonth(proPlan) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getPerMonth(proPlan)}/mo billed annually
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2 text-foreground">
                    <Check className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Priority 1 Queue</strong> for Study Guides</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>Groq 120B reasoning model</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>10 Resume Tailor runs / month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>All validated problem reports</span>
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
                  "w-full rounded-xl h-10 text-sm font-semibold",
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

            {/* Ultra Plan */}
            <div
              onClick={() => setSelectedTier("ultra")}
              className={cn(
                "relative p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between",
                selectedTier === "ultra"
                  ? "border-amber-500 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-teal-500/10 shadow-xl shadow-amber-500/10"
                  : "border-border/50 hover:border-amber-500/50 hover:shadow-lg bg-card/10",
              )}
            >
              {/* Popular Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-md">
                  <Sparkles className="h-3 w-3" />
                  Ultra · Claude Sonnet
                </div>
              </div>

              {selectedTier === "ultra" && (
                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}

              <div>
                <div className="mb-4 pt-1">
                  <h3 className="text-lg font-bold flex items-center gap-1.5 text-foreground">
                    Ultra Plan
                    <Crown className="h-4 w-4 text-amber-500" />
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Instant AI generation & zero wait time
                  </p>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                      {formatPrice(ultraPlan, 299, 10)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      /{billingCycle === "yearly" ? "year" : "month"}
                    </span>
                  </div>
                  {getPerMonth(ultraPlan) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getPerMonth(ultraPlan)}/mo billed annually
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2 text-amber-300 font-semibold">
                    <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Instant Synchronous Claude Sonnet AI</span>
                  </li>
                  <li className="flex items-start gap-2 text-foreground">
                    <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Zero wait time</strong> — instant study guides</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>8,000-token ceiling with automated fallback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>100 Resume Tailor runs / month</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPlan("ultra");
                }}
                disabled={isCreatingLink}
                className="w-full rounded-xl h-10 text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20"
              >
                {isCreatingLink && selectedTier === "ultra" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Get Ultra
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-green-500" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-green-500" />
            <span>Secure payments (Razorpay & PayPal)</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default PricingDialog;
