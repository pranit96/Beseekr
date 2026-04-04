// Trial Welcome Banner - Shows when user has active trial
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, ArrowRight, X, Crown, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrialWelcomeBannerProps {
  daysRemaining: number;
  onDismiss?: () => void;
  variant?: "full" | "compact";
}

const TRIAL_BANNER_DISMISSED_KEY = "beseekr_trial_banner_dismissed";
const TRIAL_BANNER_DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const TrialWelcomeBanner: React.FC<TrialWelcomeBannerProps> = ({
  daysRemaining,
  onDismiss,
  variant = "full",
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  // Check if banner was recently dismissed
  useEffect(() => {
    try {
      const dismissedAt = localStorage.getItem(TRIAL_BANNER_DISMISSED_KEY);
      if (dismissedAt) {
        const dismissTime = parseInt(dismissedAt, 10);
        if (Date.now() - dismissTime < TRIAL_BANNER_DISMISS_DURATION) {
          setIsVisible(false);
        } else {
          localStorage.removeItem(TRIAL_BANNER_DISMISSED_KEY);
        }
      }
    } catch {
      // localStorage might be disabled
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(TRIAL_BANNER_DISMISSED_KEY, Date.now().toString());
    } catch {
      // localStorage might be disabled
    }
    onDismiss?.();
  };

  const handleExplore = () => {
    navigate("/dashboard/problems?tab=premium");
  };

  if (!isVisible) return null;

  // Compact variant for smaller spaces
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20"
      >
        <Gift className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-medium text-foreground">
          {daysRemaining} {daysRemaining === 1 ? "day" : "days"} of Pro left
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleExplore}
          className="h-6 px-2 text-xs text-primary hover:text-primary/80"
        >
          Upgrade
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </motion.div>
    );
  }

  // Full variant - clean professional banner
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="relative rounded-xl mb-6 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20"
      >
        {/* Content */}
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left side - Message */}
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>

              <div className="flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2 flex-wrap">
                  <span>🎉</span>
                  <span>
                    You have {daysRemaining}{" "}
                    {daysRemaining === 1 ? "day" : "days"} of Pro access!
                  </span>
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs sm:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    Premium problems
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    Deep research
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    Unlimited analysis
                  </span>
                </div>
              </div>
            </div>

            {/* Right side - CTA */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={handleExplore}
                size="sm"
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-2"
              >
                <Crown className="h-4 w-4" />
                <span className="hidden sm:inline">Explore Premium</span>
                <span className="sm:hidden">Explore</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground h-8 w-8 p-0 shrink-0"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TrialWelcomeBanner;
