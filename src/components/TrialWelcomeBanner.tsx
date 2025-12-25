// Trial Welcome Banner - Shows when user has active trial
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, Sparkles, ArrowRight, X, Crown, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TrialWelcomeBannerProps {
    daysRemaining: number;
    onDismiss?: () => void;
    variant?: 'full' | 'compact';
}

const TRIAL_BANNER_DISMISSED_KEY = 'beseekr_trial_banner_dismissed';
const TRIAL_BANNER_DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const TrialWelcomeBanner: React.FC<TrialWelcomeBannerProps> = ({
    daysRemaining,
    onDismiss,
    variant = 'full'
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isAnimating, setIsAnimating] = useState(true);

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

        // Stop the initial animation after a delay
        const timer = setTimeout(() => setIsAnimating(false), 3000);
        return () => clearTimeout(timer);
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

    if (!isVisible) return null;

    // Compact variant for smaller spaces
    if (variant === 'compact') {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30"
            >
                <PartyPopper className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-sm font-medium text-foreground">
                    {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} of Pro left
                </span>
                <Link to="/dashboard/pricing">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-amber-600 hover:text-amber-700">
                        Upgrade
                        <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                </Link>
            </motion.div>
        );
    }

    // Full variant - the main welcome banner
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                className="relative overflow-hidden rounded-2xl mb-6"
            >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-30" />
                </div>

                {/* Floating sparkles animation */}
                {isAnimating && (
                    <>
                        <motion.div
                            animate={{
                                y: [0, -20, 0],
                                opacity: [0.5, 1, 0.5],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                            className="absolute top-4 left-[10%] text-white/30"
                        >
                            <Sparkles className="h-6 w-6" />
                        </motion.div>
                        <motion.div
                            animate={{
                                y: [0, -15, 0],
                                opacity: [0.3, 0.8, 0.3],
                                scale: [1, 1.3, 1],
                            }}
                            transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse', delay: 0.5 }}
                            className="absolute top-6 right-[15%] text-white/20"
                        >
                            <Crown className="h-5 w-5" />
                        </motion.div>
                        <motion.div
                            animate={{
                                y: [0, -10, 0],
                                opacity: [0.4, 0.9, 0.4],
                            }}
                            transition={{ duration: 1.8, repeat: Infinity, repeatType: 'reverse', delay: 1 }}
                            className="absolute bottom-4 left-[25%] text-white/25"
                        >
                            <Zap className="h-4 w-4" />
                        </motion.div>
                    </>
                )}

                {/* Content */}
                <div className="relative px-4 sm:px-6 py-4 sm:py-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Left side - Message */}
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                            <motion.div
                                animate={isAnimating ? {
                                    rotate: [0, -10, 10, -10, 0],
                                    scale: [1, 1.1, 1],
                                } : {}}
                                transition={{ duration: 0.6, repeat: isAnimating ? 3 : 0 }}
                                className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                            >
                                <PartyPopper className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </motion.div>

                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                                    <span>🎉</span>
                                    <span>You have {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} of Pro access!</span>
                                </h3>
                                <p className="text-white/80 text-xs sm:text-sm mt-0.5">
                                    Unlock premium problem insights, deep research, and unlimited analysis
                                </p>
                            </div>
                        </div>

                        {/* Right side - CTA */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Link to="/dashboard/problems?tab=premium" className="flex-1 sm:flex-none">
                                <Button
                                    size="sm"
                                    className="w-full sm:w-auto bg-white text-purple-700 hover:bg-white/90 shadow-lg font-semibold gap-2"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    <span className="hidden sm:inline">Explore Premium Features</span>
                                    <span className="sm:hidden">Explore Premium</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleDismiss}
                                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0 shrink-0"
                                aria-label="Dismiss banner"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Trial timer indicator */}
                    <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2 text-white/70 text-xs">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                            Your trial {daysRemaining <= 3 ? 'ends soon' : 'is active'} •
                            <Link to="/dashboard/pricing" className="text-white hover:underline ml-1">
                                View pricing plans
                            </Link>
                        </span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TrialWelcomeBanner;
