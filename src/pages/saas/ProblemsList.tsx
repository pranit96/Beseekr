import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    TrendingUp,
    ThumbsUp,
    FileText,
    Bookmark,
    BookmarkCheck,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Flame,
    Search,
    Sparkles,
    ArrowUpRight,
    Lock,
    Crown,
    Zap,
    Check,
    Loader2,
} from 'lucide-react';
import { problemsApi } from '@/api/problems';
import { paymentsApi, type Plan } from '@/api/payments';
import type { SortOption, ProblemListItem } from '@/types/problems';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS_PER_PAGE = 12;

// Skeleton loading
function ProblemSkeleton() {
    return (
        <div className="group relative p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
            <div className="space-y-3 sm:space-y-4">
                <div className="flex gap-2">
                    <Skeleton className="h-5 w-14 sm:w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 sm:w-20 rounded-full" />
                </div>
                <Skeleton className="h-5 sm:h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-3 sm:gap-4 pt-2">
                    <Skeleton className="h-5 w-12 sm:w-16" />
                    <Skeleton className="h-5 w-12 sm:w-16" />
                    <Skeleton className="h-5 w-12 sm:w-16" />
                </div>
            </div>
        </div>
    );
}

// Problem card with organic design
function ProblemCard({
    problem,
    isWatching,
    onWatchlistToggle,
    index,
}: {
    problem: ProblemListItem;
    isWatching: boolean;
    onWatchlistToggle: (id: string, add: boolean) => void;
    index: number;
}) {
    const navigate = useNavigate();

    const handleClick = () => navigate(`/dashboard/problems/${problem.id}`);

    const handleWatchlistClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onWatchlistToggle(problem.id, !isWatching);
    };

    const getScoreGradient = (score: number) => {
        if (score >= 70) return 'from-emerald-500/20 to-cyan-500/10';
        if (score >= 50) return 'from-amber-500/20 to-orange-500/10';
        return 'from-rose-500/20 to-pink-500/10';
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-emerald-500';
        if (score >= 50) return 'text-amber-500';
        return 'text-rose-500';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={handleClick}
            className={cn(
                "group relative cursor-pointer rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300",
                "bg-gradient-to-br from-background to-muted/30",
                "border border-border/50 hover:border-primary/30",
                "hover:shadow-xl hover:shadow-primary/5 active:scale-[0.98]",
                problem.has_brief && problem.brief_approved && "ring-2 ring-primary/20"
            )}
        >
            {/* Opportunity score badge - floating */}
            {problem.opportunity_score && (
                <div className={cn(
                    "absolute -top-2 -right-2 sm:-top-3 sm:-right-3 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg",
                    "bg-gradient-to-r", getScoreGradient(problem.opportunity_score),
                    "border border-border/50 backdrop-blur-sm",
                    getScoreColor(problem.opportunity_score)
                )}>
                    {problem.opportunity_score}
                </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                {problem.tags?.slice(0, 2).map((tag) => (
                    <span
                        key={tag}
                        className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-muted/80 text-muted-foreground"
                    >
                        {tag}
                    </span>
                ))}
                {problem.has_brief && problem.brief_approved && (
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-primary/10 text-primary flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        Brief Ready
                    </span>
                )}
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2 sm:mb-3 leading-snug">
                {problem.title}
            </h3>

            {/* Summary */}
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-4 sm:mb-6 leading-relaxed">
                {problem.summary || 'Discover validated pain points and market opportunities.'}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="font-medium">{problem.metrics?.frequency || 0}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
                    <ThumbsUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="font-medium">{problem.metrics?.upvote_score || 0}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="font-medium">{problem.metrics?.source_count || 0}</span>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Watchlist button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleWatchlistClick}
                    className={cn(
                        "p-2 rounded-lg sm:rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center",
                        isWatching
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    {isWatching ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                </motion.button>

                {/* Arrow indicator - hidden on mobile */}
                <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
            </div>
        </motion.div>
    );
}

export function ProblemsList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free');
    const [page, setPage] = useState(1);
    const [premiumPage, setPremiumPage] = useState(1);
    const [sortBy, setSortBy] = useState<SortOption>('hot');
    const [searchQuery, setSearchQuery] = useState('');
    const [showPayment, setShowPayment] = useState(false);
    const [selectedTier, setSelectedTier] = useState<'standard' | 'pro'>('standard');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
    const [isCreatingLink, setIsCreatingLink] = useState(false);

    // Fetch free problems
    const { data, isLoading, error } = useQuery({
        queryKey: ['problems', page, sortBy],
        queryFn: () => problemsApi.getProblems(sortBy, page, ITEMS_PER_PAGE),
    });

    // Fetch premium problems (requires auth)
    const { data: premiumData, isLoading: isLoadingPremium } = useQuery({
        queryKey: ['premium-problems', premiumPage],
        queryFn: () => problemsApi.getPremiumProblems(premiumPage, ITEMS_PER_PAGE),
        enabled: activeTab === 'premium',
    });

    // Fetch subscription plans when Premium tab is active
    const { data: plans, isLoading: isLoadingPlans } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: () => paymentsApi.getPlans(),
        enabled: activeTab === 'premium' && !premiumData?.is_premium,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    // Fetch watchlist (only for authenticated users)
    const { data: watchlist } = useQuery({
        queryKey: ['watchlist'],
        queryFn: () => problemsApi.getWatchlist(),
        enabled: !!user,
    });

    // Mutations
    const addToWatchlistMutation = useMutation({
        mutationFn: problemsApi.addToWatchlist,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
    });

    const removeFromWatchlistMutation = useMutation({
        mutationFn: problemsApi.removeFromWatchlist,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
    });

    const watchlistIds = useMemo(() => {
        if (!watchlist || !Array.isArray(watchlist)) return new Set<string>();
        return new Set(watchlist.map((item: { problem?: { id: string }; problem_id?: string }) =>
            item.problem?.id || item.problem_id
        ));
    }, [watchlist]);

    const handleWatchlistToggle = (problemId: string, add: boolean) => {
        if (add) {
            addToWatchlistMutation.mutate(problemId);
        } else {
            removeFromWatchlistMutation.mutate(problemId);
        }
    };

    // Handle plan selection and payment
    const handlePlanSelect = async () => {
        if (!user) {
            navigate('/auth');
            return;
        }

        setIsCreatingLink(true);
        try {
            const planKey = `${selectedTier}_${billingCycle}` as string;
            const paymentLink = await paymentsApi.createPaymentLink(planKey);

            // Redirect to Razorpay payment page
            if (paymentLink.short_url) {
                window.location.href = paymentLink.short_url;
            }
        } catch (error) {
            console.error('Failed to create payment link:', error);
            // Could add toast notification here
        } finally {
            setIsCreatingLink(false);
        }
    };

    // Get selected plan details
    const getSelectedPlan = (): Plan | undefined => {
        if (!plans) return undefined;
        return plans.find(p => p.tier === selectedTier && p.plan_type === billingCycle);
    };

    // Filter problems by search
    const problems = useMemo(() => {
        const items = data?.items || [];
        if (!searchQuery.trim()) return items;
        const query = searchQuery.toLowerCase();
        return items.filter((p: ProblemListItem) =>
            p.title.toLowerCase().includes(query) ||
            p.summary?.toLowerCase().includes(query) ||
            p.tags?.some(tag => tag.toLowerCase().includes(query))
        );
    }, [data?.items, searchQuery]);

    const totalPages = data?.total_pages || 1;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
                <p className="text-muted-foreground mb-6">We could not load the problems. Try again later.</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Hero Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-2xl mx-auto px-2"
            >
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                    Discover{' '}
                    <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                        Real Problems
                    </span>
                </h1>
                <p className="text-sm sm:text-lg text-muted-foreground">
                    Validated pain points from thousands of real conversations. Find your next startup idea.
                </p>
            </motion.div>

            {/* Gated Content Banner - Show for anonymous users */}
            {data?.gated && !user && activeTab === 'free' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="mx-auto max-w-2xl"
                >
                    <div className="relative p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 backdrop-blur-sm">
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                            <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <Lock className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <p className="font-semibold text-foreground">
                                    Showing {data.showing} of {data.total_available} problems
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {data.upgrade_message || 'Sign up free to access all validated problems'}
                                </p>
                            </div>
                            <Button
                                onClick={() => navigate('/auth')}
                                className="shrink-0 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                            >
                                Sign Up Free
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Tab Toggle - Free vs Premium */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.12 }}
                className="flex justify-center px-2"
            >
                <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as 'free' | 'premium')}
                    className="w-full max-w-md"
                >
                    <TabsList className="grid w-full grid-cols-2 h-11 sm:h-12 rounded-xl bg-muted/50 p-1">
                        <TabsTrigger
                            value="free"
                            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5 sm:gap-2 text-sm"
                        >
                            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden xs:inline">Free </span>Problems
                        </TabsTrigger>
                        <TabsTrigger
                            value="premium"
                            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/10 data-[state=active]:to-orange-500/10 data-[state=active]:text-amber-600 flex items-center gap-1.5 sm:gap-2 text-sm"
                        >
                            <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            Premium
                            {!user && <Lock className="h-3 w-3 ml-0.5 sm:ml-1" />}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </motion.div>

            {/* Free Problems Tab Content */}
            {activeTab === 'free' && (
                <>
                    {/* Search and Filter Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between"
                    >
                        {/* Search */}
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search problems..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 sm:pl-12 h-11 sm:h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors text-sm sm:text-base"
                            />
                        </div>

                        {/* Sort */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xs sm:text-sm text-muted-foreground">Sort by</span>
                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                                <SelectTrigger className="w-32 sm:w-40 h-11 sm:h-12 rounded-xl border-border/50 bg-muted/30 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="hot" className="rounded-lg">
                                        <span className="flex items-center gap-2">
                                            <Flame className="h-4 w-4" /> Hot
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="trending" className="rounded-lg">
                                        <span className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" /> Trending
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="newest" className="rounded-lg">
                                        <span className="flex items-center gap-2">
                                            <ThumbsUp className="h-4 w-4" /> Newest
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </motion.div>

                    {/* Problems Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <ProblemSkeleton key={i} />
                            ))}
                        </div>
                    ) : problems.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <AnimatePresence mode="wait">
                                {problems.map((problem: ProblemListItem, index: number) => (
                                    <ProblemCard
                                        key={problem.id}
                                        problem={problem}
                                        isWatching={watchlistIds.has(problem.id)}
                                        onWatchlistToggle={handleWatchlistToggle}
                                        index={index}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20"
                        >
                            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
                                <Search className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No problems found</h3>
                            <p className="text-muted-foreground">
                                {searchQuery ? 'Try adjusting your search terms.' : 'Check back soon for new opportunities.'}
                            </p>
                        </motion.div>
                    )}

                    {/* Premium Teaser on Free Tab */}
                    {!isLoading && problems.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20"
                        >
                            <div className="flex flex-col lg:flex-row gap-6 items-center">
                                {/* Premium Problem Preview */}
                                <div className="flex-1 w-full">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Crown className="h-5 w-5 text-amber-500" />
                                        <span className="text-sm font-medium text-amber-600">Featured Premium Problem</span>
                                    </div>
                                    {problems[0] && (
                                        <div
                                            className="p-4 rounded-xl bg-background/50 border border-amber-500/10 cursor-pointer hover:border-amber-500/30 transition-all"
                                            onClick={() => user ? setActiveTab('premium') : navigate('/auth')}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold line-clamp-1">{problems[0].title}</h4>
                                                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{problems[0].summary}</p>
                                                </div>
                                                <div className="shrink-0 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold">
                                                    85+
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* CTA */}
                                <div className="text-center lg:text-right shrink-0">
                                    <p className="text-sm text-muted-foreground mb-3">
                                        <span className="text-foreground font-semibold">20+</span> high-opportunity problems
                                    </p>
                                    <Button
                                        onClick={() => user ? setActiveTab('premium') : navigate('/auth')}
                                        className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90"
                                    >
                                        {user ? 'View Premium' : 'Get Premium Access'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Pagination */}
                    {!isLoading && problems.length > 0 && totalPages > 1 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center justify-center gap-2 sm:gap-4 pt-6 sm:pt-8"
                        >
                            <Button
                                variant="outline"
                                size="default"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="rounded-xl gap-1 sm:gap-2 h-10 sm:h-11 px-3 sm:px-4"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Previous</span>
                            </Button>

                            <div className="flex items-center gap-1 sm:gap-2">
                                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={page === pageNum ? 'default' : 'ghost'}
                                            size="icon"
                                            onClick={() => setPage(pageNum)}
                                            className="rounded-lg sm:rounded-xl w-9 h-9 sm:w-10 sm:h-10 text-sm"
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                                {totalPages > 3 && (
                                    <>
                                        <span className="text-muted-foreground text-sm">...</span>
                                        <Button
                                            variant={page === totalPages ? 'default' : 'ghost'}
                                            size="icon"
                                            onClick={() => setPage(totalPages)}
                                            className="rounded-lg sm:rounded-xl w-9 h-9 sm:w-10 sm:h-10 text-sm"
                                        >
                                            {totalPages}
                                        </Button>
                                    </>
                                )}
                            </div>

                            <Button
                                variant="outline"
                                size="default"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="rounded-xl gap-1 sm:gap-2 h-10 sm:h-11 px-3 sm:px-4"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </motion.div>
                    )}
                </>
            )}

            {/* Premium Problems Tab Content */}
            {activeTab === 'premium' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Guest user - show actual premium API response */}
                    {!user ? (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 mb-4">
                                    <Crown className="h-4 w-4" />
                                    <span className="text-sm font-medium">Premium Preview</span>
                                </div>
                                <h3 className="text-xl font-bold mb-2">High-Opportunity Problems</h3>
                                <p className="text-muted-foreground">
                                    Sign up to unlock full access and detailed insights
                                </p>
                            </div>

                            {/* Loading state */}
                            {isLoadingPremium ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <ProblemSkeleton key={i} />
                                    ))}
                                </div>
                            ) : premiumData?.problems ? (
                                // Show actual premium problems from API
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {premiumData.problems.map((item: any, index: number) => (
                                        <motion.div
                                            key={item.id || index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                            onClick={() => navigate('/auth')}
                                            className="group relative cursor-pointer p-6 rounded-2xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-all hover:shadow-lg hover:shadow-amber-500/10"
                                        >
                                            {/* Premium badge with actual score */}
                                            <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium flex items-center gap-1">
                                                <Crown className="h-3 w-3" />
                                                {item.problem?.opportunity_score || item.brief?.opportunity_score || '85+'}
                                            </div>

                                            <h4 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                                                {item.problem?.title || item.brief?.title || 'Premium Problem'}
                                            </h4>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                {item.problem?.description || item.brief?.problem_summary || ''}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <ThumbsUp className="h-4 w-4" />
                                                    {item.problem?.upvotes || item.brief?.total_mentions || 0}
                                                </div>
                                                <div className="flex items-center gap-1 text-amber-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Lock className="h-3 w-3" />
                                                    Sign up to view
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : premiumData?.preview ? (
                                // Show single preview problem
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        onClick={() => navigate('/auth')}
                                        className="group relative cursor-pointer p-6 rounded-2xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-all hover:shadow-lg hover:shadow-amber-500/10"
                                    >
                                        <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium flex items-center gap-1">
                                            <Crown className="h-3 w-3" />
                                            {premiumData.preview.problem?.opportunity_score || '85+'}
                                        </div>

                                        <h4 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                                            {premiumData.preview.problem?.title || 'Premium Problem'}
                                        </h4>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                            {premiumData.preview.problem?.description || ''}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <ThumbsUp className="h-4 w-4" />
                                                {premiumData.preview.problem?.upvotes || 0}
                                            </div>
                                            <div className="flex items-center gap-1 text-amber-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Lock className="h-3 w-3" />
                                                Sign up to view
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            ) : null}

                            {/* Signup banner */}
                            <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20">
                                <p className="text-muted-foreground mb-4">
                                    <span className="text-foreground font-semibold">{premiumData?.available_count || premiumData?.total || '20+'}  premium problems</span> with high opportunity scores
                                </p>
                                <Button
                                    onClick={() => navigate('/auth')}
                                    className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90"
                                >
                                    Sign Up Free to Unlock All
                                </Button>
                            </div>
                        </div>
                    ) : isLoadingPremium ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <ProblemSkeleton key={i} />
                            ))}
                        </div>
                    ) : premiumData?.is_premium === false ? (
                        // Free tier - show preview + upgrade with payment
                        <div className="space-y-6 sm:space-y-8">
                            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 text-center">
                                <Crown className="h-10 w-10 sm:h-12 sm:w-12 text-amber-500 mx-auto mb-3 sm:mb-4" />
                                <h3 className="text-lg sm:text-xl font-bold mb-2">Upgrade to Premium</h3>
                                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                                    {premiumData?.upgrade_message || `Access ${premiumData?.available_count || 0} high-opportunity problems`}
                                </p>
                                {!showPayment && (
                                    <Button
                                        onClick={() => setShowPayment(true)}
                                        className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 gap-2"
                                    >
                                        <Zap className="h-4 w-4" />
                                        View Plans
                                    </Button>
                                )}
                            </div>

                            {/* Plan Selection - Only shown after clicking CTA */}
                            {showPayment && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6"
                                >
                                    {/* Billing Cycle Toggle */}
                                    <div className="flex justify-center">
                                        <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-muted/50 border border-border/50">
                                            <button
                                                onClick={() => setBillingCycle('monthly')}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                                    billingCycle === 'monthly'
                                                        ? "bg-background shadow-sm text-foreground"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                Monthly
                                            </button>
                                            <button
                                                onClick={() => setBillingCycle('yearly')}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                                                    billingCycle === 'yearly'
                                                        ? "bg-background shadow-sm text-foreground"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                Yearly
                                                <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 font-semibold">
                                                    Save 17%
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Plan Cards */}
                                    {isLoadingPlans ? (
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <Skeleton className="h-64 rounded-2xl" />
                                            <Skeleton className="h-64 rounded-2xl" />
                                        </div>
                                    ) : (
                                        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                                            {/* Standard Plan */}
                                            <div
                                                onClick={() => setSelectedTier('standard')}
                                                className={cn(
                                                    "relative p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all",
                                                    selectedTier === 'standard'
                                                        ? "border-amber-500 bg-amber-500/5"
                                                        : "border-border/50 hover:border-amber-500/50"
                                                )}
                                            >
                                                {selectedTier === 'standard' && (
                                                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                                                        <Check className="h-3 w-3 text-white" />
                                                    </div>
                                                )}
                                                <h4 className="text-lg font-bold mb-2">Standard</h4>
                                                <div className="mb-4">
                                                    <span className="text-3xl font-bold">
                                                        ₹{plans?.find(p => p.tier === 'standard' && p.plan_type === billingCycle)?.amount || (billingCycle === 'yearly' ? '4,999' : '499')}
                                                    </span>
                                                    <span className="text-muted-foreground text-sm">
                                                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                                                    </span>
                                                </div>
                                                <ul className="space-y-2 text-sm text-muted-foreground">
                                                    <li className="flex items-center gap-2">
                                                        <Check className="h-4 w-4 text-green-500" />
                                                        Access all premium problems
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <Check className="h-4 w-4 text-green-500" />
                                                        Opportunity scores & insights
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <Check className="h-4 w-4 text-green-500" />
                                                        Email alerts for new problems
                                                    </li>
                                                </ul>
                                            </div>

                                            {/* Pro Plan */}
                                            <div
                                                onClick={() => setSelectedTier('pro')}
                                                className={cn(
                                                    "relative p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all",
                                                    selectedTier === 'pro'
                                                        ? "border-amber-500 bg-amber-500/5"
                                                        : "border-border/50 hover:border-amber-500/50"
                                                )}
                                            >
                                                <Badge className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px]">
                                                    Popular
                                                </Badge>
                                                <h4 className="text-lg font-bold mb-2">Pro</h4>
                                                <div className="mb-4">
                                                    <span className="text-3xl font-bold">
                                                        ₹{plans?.find(p => p.tier === 'pro' && p.plan_type === billingCycle)?.amount || (billingCycle === 'yearly' ? '9,999' : '999')}
                                                    </span>
                                                    <span className="text-muted-foreground text-sm">
                                                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                                                    </span>
                                                </div>
                                                <ul className="space-y-2 text-sm text-muted-foreground">
                                                    <li className="flex items-center gap-2">
                                                        <Check className="h-4 w-4 text-green-500" />
                                                        Everything in Standard
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <Check className="h-4 w-4 text-green-500" />
                                                        Unlimited idea validations
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <Check className="h-4 w-4 text-green-500" />
                                                        Priority support
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <Check className="h-4 w-4 text-green-500" />
                                                        Export reports (PDF/Markdown)
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {/* Continue Button */}
                                    <div className="flex justify-center">
                                        <Button
                                            onClick={handlePlanSelect}
                                            disabled={isCreatingLink || isLoadingPlans}
                                            size="lg"
                                            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 gap-2 min-w-[200px]"
                                        >
                                            {isCreatingLink ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Creating Payment...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="h-4 w-4" />
                                                    Continue with {selectedTier === 'pro' ? 'Pro' : 'Standard'}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {premiumData?.preview && (
                                <div>
                                    <h4 className="text-lg font-semibold mb-4">Preview Problem</h4>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <ProblemCard
                                            problem={premiumData.preview.problem}
                                            isWatching={false}
                                            onWatchlistToggle={() => { }}
                                            index={0}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Premium tier - show all problems
                        <div className="space-y-6">
                            {premiumData?.subscription && (
                                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                                    <div className="flex items-center gap-3">
                                        <Crown className="h-5 w-5 text-amber-500" />
                                        <span className="font-medium capitalize">{premiumData.subscription.tier} Plan</span>
                                    </div>
                                    {premiumData.subscription.days_remaining && (
                                        <span className="text-sm text-muted-foreground">
                                            {premiumData.subscription.days_remaining} days remaining
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {premiumData?.problems?.map((item: any, index: number) => (
                                    <ProblemCard
                                        key={item.id}
                                        problem={item.problem}
                                        isWatching={watchlistIds.has(item.problem?.id)}
                                        onWatchlistToggle={handleWatchlistToggle}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

export default ProblemsList;
