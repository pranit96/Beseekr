import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  AlertTriangle,
  Users,
  TrendingUp,
  Target,
  Clock,
  DollarSign,
  Rocket,
  MessageSquare,
  Lightbulb,
  Flame,
  Building2,
  ArrowUpRight,
  Shield,
  Zap,
  Quote,
  ThumbsUp,
  Briefcase,
  LineChart,
  Award,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Eye,
} from "lucide-react";
import { problemsApi } from "@/api/problems";
import { paymentsApi } from "@/api/payments";
import { useAuth } from "@/contexts/AuthContext";
import { useResearchSocket, addPendingJob } from "@/hooks/use-research-socket";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// ============================================================================
// BENTO GRID PROBLEM DETAILS - Apple-Inspired Feature Grid Layout
// Not tabs, not slides, not endless scroll - A visual grid that tells a story
// ============================================================================

// Animated Score Ring
function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 70)
      return {
        stroke: "#22c55e",
        glow: "drop-shadow(0 0 20px rgba(34, 197, 94, 0.4))",
      };
    if (s >= 50)
      return {
        stroke: "#3b82f6",
        glow: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))",
      };
    if (s >= 30)
      return {
        stroke: "#f59e0b",
        glow: "drop-shadow(0 0 20px rgba(245, 158, 11, 0.4))",
      };
    return {
      stroke: "#ef4444",
      glow: "drop-shadow(0 0 20px rgba(239, 68, 68, 0.4))",
    };
  };

  const colors = getColor(score);

  return (
    <div
      className="relative"
      style={{ width: size, height: size, filter: colors.glow }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/10"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold tracking-tight"
          style={{ color: colors.stroke }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground font-medium">/100</span>
      </div>
    </div>
  );
}

// Bento Card Component - The building block
function BentoCard({
  children,
  className,
  gradient,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/50 bg-card p-6",
        "hover:border-border transition-colors duration-300",
        gradient,
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

// Mini Stat Display
function MiniStat({
  icon: Icon,
  label,
  value,
  color = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: "default" | "green" | "amber" | "blue" | "rose";
}) {
  const colors = {
    default: "text-muted-foreground",
    green: "text-green-500",
    amber: "text-amber-500",
    blue: "text-blue-500",
    rose: "text-rose-500",
  };

  return (
    <div className="flex items-center gap-3">
      <div className={cn("p-2 rounded-xl bg-muted/50", colors[color])}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

// Main Component
export function ProblemDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch subscription plans to check tier
  const { data: plansData } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: () => paymentsApi.getPlans(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const isPremiumUser = plansData?.user?.is_premium === true;
  const userTier =
    (plansData?.user as any)?.subscription?.tier ||
    (plansData?.user as any)?.tier ||
    "free";

  const {
    data: problem,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["problem", id],
    queryFn: () => problemsApi.getProblemDetails(id!),
    enabled: !!id,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const { data: watchlistData } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => problemsApi.getWatchlist(),
  });

  // Check for existing research report
  const { data: existingResearchData, isLoading: isLoadingResearch } = useQuery(
    {
      queryKey: ["research-status", id],
      queryFn: () => problemsApi.getResearchStatus(id!),
      enabled: !!id && !!user && isPremiumUser,
      staleTime: 30 * 1000, // Cache for 30 seconds
    },
  );

  // Determine if research exists and get report ID
  const existingReportId =
    existingResearchData?.job?.status === "completed"
      ? existingResearchData.job.report_id
      : null;

  const isInWatchlist =
    Array.isArray(watchlistData) &&
    watchlistData.some((item) => item.problem_id === id);

  const addMutation = useMutation({
    mutationFn: problemsApi.addToWatchlist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  const removeMutation = useMutation({
    mutationFn: problemsApi.removeFromWatchlist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  const handleWatchlistToggle = () => {
    if (!id) return;
    isInWatchlist ? removeMutation.mutate(id) : addMutation.mutate(id);
  };

  // ========== RESEARCH STATE WITH PERSISTENCE ==========
  const RESEARCH_KEY = `research_job_${id}`;

  // Initialize from localStorage if exists
  const getStoredResearch = useCallback(() => {
    try {
      const stored = localStorage.getItem(RESEARCH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if job is still recent (less than 10 minutes old)
        if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
          return parsed;
        } else {
          localStorage.removeItem(RESEARCH_KEY);
        }
      }
    } catch {
      localStorage.removeItem(RESEARCH_KEY);
    }
    return null;
  }, [RESEARCH_KEY]);

  const [researchStatus, setResearchStatus] = useState<
    "idle" | "loading" | "polling" | "complete" | "error"
  >(() => {
    const stored = getStoredResearch();
    return stored?.status === "polling" ? "polling" : "idle";
  });
  const [researchJobId, setResearchJobId] = useState<string | null>(() => {
    const stored = getStoredResearch();
    return stored?.jobId || null;
  });
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save research state to localStorage
  const saveResearchState = useCallback(
    (status: string, jobId: string | null) => {
      if (status === "polling" && jobId) {
        localStorage.setItem(
          RESEARCH_KEY,
          JSON.stringify({
            status,
            jobId,
            timestamp: Date.now(),
          }),
        );
      } else {
        localStorage.removeItem(RESEARCH_KEY);
      }
    },
    [RESEARCH_KEY],
  );

  // Start research mutation
  const startResearchMutation = useMutation({
    mutationFn: () => problemsApi.startResearch(id!),
    onSuccess: (data) => {
      setResearchJobId(data.job_id);
      setResearchStatus("polling");
      saveResearchState("polling", data.job_id);
      // Register with socket hook for cross-tab updates
      addPendingJob(data.job_id, id!);
    },
    onError: () => {
      setResearchStatus("error");
      saveResearchState("error", null);
    },
  });

  // Poll for research completion
  const pollResearchStatus = useCallback(async () => {
    if (!id) return;
    try {
      const { job } = await problemsApi.getResearchStatus(id);
      if (job.status === "completed" && job.report_id) {
        setResearchStatus("complete");
        saveResearchState("complete", null);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        navigate(`/dashboard/validate/${job.report_id}`);
      } else if (job.status === "failed") {
        setResearchStatus("error");
        saveResearchState("error", null);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
      // If still processing, keep polling
    } catch (err) {
      // Keep polling on network error
    }
  }, [id, navigate, saveResearchState]);

  // Check for pending research on mount and start polling if needed
  useEffect(() => {
    const stored = getStoredResearch();
    if (stored?.status === "polling") {
      // Check status immediately on mount
      pollResearchStatus();
    }
  }, [getStoredResearch, pollResearchStatus]);

  // Start/stop polling based on status
  useEffect(() => {
    if (researchStatus === "polling" && !pollingIntervalRef.current) {
      // Poll every 5 seconds
      pollingIntervalRef.current = setInterval(pollResearchStatus, 5000);
    }
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [researchStatus, pollResearchStatus]);

  // Use research socket hook for WebSocket events (handles toasts and navigation)
  const { isConnected: isSocketConnected, lastEvent } = useResearchSocket({
    problemId: id,
    autoNavigate: true,
    showToasts: true,
  });

  // Handle WebSocket event completion (stops polling when socket event arrives)
  useEffect(() => {
    if (
      lastEvent &&
      lastEvent.status === "completed" &&
      "report_id" in lastEvent
    ) {
      setResearchStatus("complete");
      saveResearchState("complete", null);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    } else if (lastEvent && lastEvent.status === "failed") {
      setResearchStatus("error");
      saveResearchState("error", null);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [lastEvent, saveResearchState]);

  const handleStartResearch = () => {
    if (researchStatus !== "idle" && researchStatus !== "error") return;
    setResearchStatus("loading");
    startResearchMutation.mutate();
  };

  // Loading
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl col-span-2" />
          <Skeleton className="h-64 rounded-3xl col-span-2" />
          <Skeleton className="h-64 rounded-3xl col-span-2" />
        </div>
      </div>
    );
  }

  // Error
  if (isError || !problem) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-12 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Problem not found</h2>
          <p className="text-muted-foreground mb-6">
            {error instanceof Error
              ? error.message
              : "Unable to load problem details"}
          </p>
          <Button size="lg" onClick={() => navigate("/dashboard/problems")}>
            <ArrowLeft className="h-5 w-5 mr-2" /> Back to Problems
          </Button>
        </div>
      </div>
    );
  }

  // Extract data - cast to any for dynamic API structure
  const report = problem?.report as any;
  const brief = problem?.brief as any;
  const summary = report?.executive_summary;
  const market = report?.section_2_market || problem?.market_sizing;
  const validation = (report?.section_3_validation ||
    problem?.validation_strength) as any;
  const competition = (report?.section_4_competition ||
    problem?.competitor_intel) as any;
  const action = (report?.section_5_action_plan ||
    problem?.build_estimate ||
    problem?.go_to_market) as any;

  const score =
    summary?.score || (problem?.opportunity_score as any)?.value || 0;
  const verdict = summary?.verdict || "Analyzing...";
  const audience = brief?.target_audience?.primary;

  return (
    <div className="min-h-screen">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/problems")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button
            variant={isInWatchlist ? "default" : "outline"}
            size="sm"
            onClick={handleWatchlistToggle}
            disabled={addMutation.isPending || removeMutation.isPending}
          >
            {isInWatchlist ? (
              <BookmarkCheck className="h-4 w-4 mr-2" />
            ) : (
              <Bookmark className="h-4 w-4 mr-2" />
            )}
            {isInWatchlist ? "Saved" : "Save"}
          </Button>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* BENTO GRID LAYOUT                                                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-min">
          {/* ══════ HERO CARD - Score & Title (Wide) ══════ */}
          <BentoCard
            className="col-span-2 md:col-span-4 lg:col-span-4 row-span-2"
            gradient="bg-gradient-to-br from-card via-card to-primary/5"
            delay={0}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <ScoreRing score={score} />
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-3">
                  {problem.category && (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 capitalize">
                      {problem.category.replace(/_/g, " ")}
                    </Badge>
                  )}
                  {problem.domain?.map((d: string) => (
                    <Badge key={d} variant="outline" className="text-xs">
                      {d}
                    </Badge>
                  ))}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
                  {problem.title}
                </h1>
                <Badge
                  className={cn(
                    "text-sm px-4 py-1.5",
                    score >= 70
                      ? "bg-green-500/10 text-green-600 border-green-500/30"
                      : score >= 50
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/30",
                  )}
                  variant="outline"
                >
                  {verdict}
                </Badge>
              </div>
            </div>

            {/* One-liner description */}
            <p className="text-muted-foreground mt-6 text-base leading-relaxed">
              {summary?.one_liner || problem.description}
            </p>
          </BentoCard>

          {/* ══════ MARKET SIZE CARD (Tall) ══════ */}
          <BentoCard
            className="col-span-2 row-span-2"
            gradient="bg-gradient-to-b from-green-500/5 to-card"
            delay={0.1}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-xl bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="font-semibold">Market Opportunity</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">TAM</p>
                <p className="text-2xl font-bold text-green-500">
                  {market?.tam?.display || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">SAM</p>
                <p className="text-xl font-semibold">
                  {market?.sam?.display || "N/A"}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">
                  Your Opportunity (SOM)
                </p>
                <p className="text-2xl font-bold text-primary">
                  {market?.som?.display || "N/A"}
                </p>
              </div>
              {market?.growth_rate && (
                <div className="flex items-center gap-2 text-green-500">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="font-medium">
                    {market.growth_rate.display ||
                      `${market.growth_rate.value}% YoY`}
                  </span>
                </div>
              )}
            </div>
          </BentoCard>

          {/* ══════ TARGET AUDIENCE CARD ══════ */}
          <BentoCard
            className="col-span-2 md:col-span-2"
            gradient="bg-gradient-to-br from-blue-500/5 to-card"
            delay={0.2}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="font-semibold">Target Audience</h3>
            </div>

            {audience ? (
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-semibold">{audience.role}</p>
                  <p className="text-sm text-muted-foreground">
                    {audience.industry} • {audience.company_size}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Pain Level: </span>
                  <span className="font-bold text-orange-500">
                    {audience.pain_level}/10
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No audience data</p>
            )}
          </BentoCard>

          {/* ══════ COMPETITION CARD ══════ */}
          <BentoCard className="col-span-1" delay={0.25}>
            <div className="p-2 rounded-xl bg-amber-500/10 w-fit mb-3">
              <Target className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground mb-1">Competition</p>
            <p className="text-xl font-bold capitalize">
              {brief?.market_validation?.competition?.level ||
                (problem as any)?.market_validation?.competition?.level ||
                (problem as any)?.competition_level ||
                "N/A"}
            </p>
          </BentoCard>

          {/* ══════ MVP TIMELINE CARD ══════ */}
          <BentoCard className="col-span-1" delay={0.3}>
            <div className="p-2 rounded-xl bg-purple-500/10 w-fit mb-3">
              <Clock className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-xs text-muted-foreground mb-1">MVP Timeline</p>
            <p className="text-xl font-bold">{action?.mvp_timeline || "—"}</p>
          </BentoCard>

          {/* ══════ VALIDATION SCORE CARD ══════ */}
          <BentoCard
            className="col-span-2"
            gradient="bg-gradient-to-br from-violet-500/5 to-card"
            delay={0.35}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-violet-500/10">
                  <Shield className="h-5 w-5 text-violet-500" />
                </div>
                <h3 className="font-semibold">Validation</h3>
              </div>
              <span className="text-2xl font-bold">
                {validation?.score || 0}/{validation?.max_score || 100}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  (validation?.score || 0) >= 60
                    ? "bg-green-500"
                    : (validation?.score || 0) >= 40
                      ? "bg-amber-500"
                      : "bg-red-500",
                )}
                initial={{ width: 0 }}
                animate={{ width: `${validation?.score || 0}%` }}
                transition={{ duration: 0.8, delay: 0.4 }}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              {validation?.verdict || "Validation pending"}
            </p>

            {/* Research CTA for weak validation */}
            {(validation?.score || 0) < 60 && (
              <motion.div
                className="mt-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {/* Guest User - Sign In Required */}
                {!user && (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      🔒 Sign in to run deep research on this problem
                    </p>
                    <Button
                      size="sm"
                      onClick={() =>
                        navigate(
                          "/auth?mode=login&redirect=" +
                            encodeURIComponent(window.location.pathname),
                        )
                      }
                      className="w-full bg-violet-500 hover:bg-violet-600 text-white"
                    >
                      Sign In to Research
                    </Button>
                  </>
                )}

                {/* Free Tier User - Upgrade Required */}
                {user && !isPremiumUser && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">
                        ✨ Deep Research is a Pro feature
                      </p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {userTier} Plan
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate("/dashboard/pricing")}
                      className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </>
                )}

                {/* Premium User - Can Use Research */}
                {user && isPremiumUser && (
                  <>
                    {/* Existing research - Show View Analysis */}
                    {existingReportId ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground">
                            ✅ Research complete! View your analysis.
                          </p>
                          <Badge
                            variant="outline"
                            className="text-xs bg-green-500/10 border-green-500/30 text-green-600"
                          >
                            Ready
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() =>
                            navigate(`/dashboard/validate/${existingReportId}`)
                          }
                          className="w-full bg-green-500 hover:bg-green-600 text-white"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Analysis
                        </Button>
                      </>
                    ) : isLoadingResearch ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-violet-500 animate-spin" />
                        <p className="text-xs text-muted-foreground">
                          Checking research status...
                        </p>
                      </div>
                    ) : researchStatus === "idle" ||
                      researchStatus === "error" ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground">
                            {researchStatus === "error"
                              ? "❌ Research failed. Try again?"
                              : "💡 Need more validation? Run deep research."}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-xs bg-violet-500/10 border-violet-500/30 text-violet-600"
                          >
                            Pro
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleStartResearch}
                          className="w-full bg-violet-500 hover:bg-violet-600 text-white"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Run Deep Research
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-violet-500 animate-spin" />
                        <div>
                          <p className="text-sm font-medium">Researching...</p>
                          <p className="text-xs text-muted-foreground">
                            We'll notify you when it's ready (2-3 min)
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </BentoCard>

          {/* ══════ BUDGET RANGE CARD ══════ */}
          <BentoCard
            className="col-span-2"
            gradient="bg-gradient-to-br from-emerald-500/5 to-card"
            delay={0.4}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="font-semibold">Budget Range</h3>
            </div>

            {brief?.target_audience?.budget_range ? (
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-bold text-emerald-500">
                  ${brief.target_audience.budget_range.min.toLocaleString()}
                </span>
                <span className="text-muted-foreground">–</span>
                <span className="text-2xl font-bold text-emerald-500">
                  ${brief.target_audience.budget_range.max.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
            ) : (
              <p className="text-muted-foreground">No budget data</p>
            )}
          </BentoCard>

          {/* ══════ COMPETITORS CARD (Wide) ══════ */}
          <BentoCard className="col-span-2 md:col-span-4" delay={0.45}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-orange-500/10">
                <Briefcase className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="font-semibold">Competitor Landscape</h3>
              <Badge variant="outline" className="ml-auto">
                {problem.competitors?.length || 0} analyzed
              </Badge>
            </div>

            {problem.competitors?.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {problem.competitors.slice(0, 4).map((comp: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{comp.name}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {comp.sentiment}
                      </Badge>
                    </div>
                    {comp.weaknesses?.[0] && (
                      <p className="text-xs text-rose-500 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {comp.weaknesses[0]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No competitor data
              </p>
            )}

            {competition?.positioning && (
              <div className="mt-4 p-3 rounded-2xl bg-primary/5 border border-primary/20">
                <p className="text-sm">
                  <span className="font-medium">Your angle: </span>
                  {competition.positioning}
                </p>
              </div>
            )}
          </BentoCard>

          {/* ══════ SIGNALS GRID CARD ══════ */}
          <BentoCard className="col-span-2" delay={0.5}>
            <h3 className="font-semibold mb-4">Validation Signals</h3>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat
                icon={MessageSquare}
                label="Discussions"
                value={
                  validation?.signals?.discussions ||
                  problem.metrics?.frequency ||
                  0
                }
                color="blue"
              />
              <MiniStat
                icon={ExternalLink}
                label="Sources"
                value={
                  validation?.signals?.sources || problem.sources?.length || 0
                }
                color="green"
              />
              <MiniStat
                icon={Quote}
                label="Quotes"
                value={
                  validation?.signals?.quotes || problem.top_quotes?.length || 0
                }
                color="amber"
              />
              <MiniStat
                icon={Zap}
                label="External"
                value={validation?.signals?.external_signals || 0}
                color="rose"
              />
            </div>
          </BentoCard>

          {/* ══════ FIRST 10 CUSTOMERS CARD (Wide) ══════ */}
          <BentoCard
            className="col-span-2 md:col-span-4"
            gradient="bg-gradient-to-br from-primary/5 to-card"
            delay={0.55}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">How to Get First 10 Customers</h3>
            </div>

            {action?.first_10_customers?.length > 0 ? (
              <div className="space-y-2">
                {action.first_10_customers
                  .slice(0, 3)
                  .map((strategy: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl bg-muted/30"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-sm leading-relaxed">{strategy}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No customer acquisition strategies yet
              </p>
            )}
          </BentoCard>

          {/* ══════ BUILD ESTIMATE CARD ══════ */}
          <BentoCard className="col-span-2" delay={0.6}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-indigo-500/10">
                <Award className="h-5 w-5 text-indigo-500" />
              </div>
              <h3 className="font-semibold">Build Estimate</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Complexity
                </span>
                <Badge variant="outline" className="capitalize">
                  {action?.complexity ||
                    problem.build_estimate?.complexity ||
                    "Medium"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Solo Feasible
                </span>
                {action?.solo_feasible !== undefined ? (
                  action.solo_feasible ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-500" />
                  )
                ) : (
                  <span>—</span>
                )}
              </div>
              {action?.estimated_cost?.solo && (
                <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                  <p className="text-xs text-muted-foreground">Solo Cost</p>
                  <p className="font-semibold text-green-600">
                    {action.estimated_cost.solo}
                  </p>
                </div>
              )}
            </div>
          </BentoCard>

          {/* ══════ KEY INSIGHTS CARD ══════ */}
          {brief?.target_audience?.key_insights?.length > 0 && (
            <BentoCard
              className="col-span-2 md:col-span-3"
              gradient="bg-gradient-to-br from-amber-500/5 to-card"
              delay={0.65}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-amber-500/10">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                </div>
                <h3 className="font-semibold">Key Insights</h3>
              </div>

              <div className="space-y-3">
                {brief.target_audience.key_insights.map(
                  (insight: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <Quote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-muted-foreground italic">{insight}</p>
                    </div>
                  ),
                )}
              </div>
            </BentoCard>
          )}

          {/* ══════ COMMUNITIES CARD ══════ */}
          {action?.communities_to_target?.length > 0 && (
            <BentoCard className="col-span-2 md:col-span-3" delay={0.7}>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-cyan-500/10">
                  <Building2 className="h-5 w-5 text-cyan-500" />
                </div>
                <h3 className="font-semibold">Target Communities</h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {action.communities_to_target.map(
                  (community: string, i: number) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="px-3 py-1.5 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                    >
                      {community}
                    </Badge>
                  ),
                )}
              </div>
            </BentoCard>
          )}

          {/* ══════ WARNINGS CARD ══════ */}
          {summary?.warnings?.length > 0 && (
            <BentoCard
              className="col-span-2 md:col-span-4 lg:col-span-6"
              gradient="bg-gradient-to-r from-amber-500/5 via-card to-amber-500/5"
              delay={0.75}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-amber-500/10">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <h3 className="font-semibold text-amber-600">
                  Things to Consider
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {summary.warnings.map((warning: string, i: number) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="px-3 py-1.5 border-amber-500/30 text-amber-600 bg-amber-500/5"
                  >
                    {warning}
                  </Badge>
                ))}
              </div>
            </BentoCard>
          )}

          {/* ══════ RELATED DISCUSSIONS CARD ══════ */}
          {problem.related_posts?.length > 0 && (
            <BentoCard
              className="col-span-2 md:col-span-4 lg:col-span-6"
              delay={0.8}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-orange-500/10">
                  <MessageSquare className="h-5 w-5 text-orange-500" />
                </div>
                <h3 className="font-semibold">Related Discussions</h3>
                <Badge variant="outline" className="ml-auto">
                  {problem.related_posts.length} posts
                </Badge>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {problem.related_posts
                  .slice(0, 6)
                  .map((post: any, i: number) => (
                    <a
                      key={i}
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all group"
                    >
                      <div className="flex flex-col items-center p-2 rounded-lg bg-orange-500/10 text-orange-500">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold mt-0.5">
                          {post.ups}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2 group-hover:text-orange-500 transition-colors">
                          {post.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          r/{post.source_identifier} • {post.num_comments}{" "}
                          comments
                        </p>
                      </div>
                    </a>
                  ))}
              </div>
            </BentoCard>
          )}

          {/* ══════ SIMILAR PROBLEMS CARD ══════ */}
          {(problem as any).explore_more?.length > 0 && (
            <BentoCard
              className="col-span-2 md:col-span-4 lg:col-span-6"
              gradient="bg-gradient-to-br from-indigo-500/5 to-card"
              delay={0.85}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-indigo-500/10">
                  <Lightbulb className="h-5 w-5 text-indigo-500" />
                </div>
                <h3 className="font-semibold">Explore Similar Problems</h3>
                <Badge variant="outline" className="ml-auto">
                  {(problem as any).explore_more.length} more
                </Badge>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(problem as any).explore_more
                  .slice(0, 6)
                  .map((item: any, i: number) => (
                    <motion.div
                      key={item.id || i}
                      className="p-4 rounded-2xl bg-muted/30 border border-border/50 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all cursor-pointer group"
                      onClick={() => navigate(`/dashboard/problems/${item.id}`)}
                      whileHover={{ y: -2 }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-indigo-500 transition-colors flex-1">
                          {item.title}
                        </h4>
                        <div
                          className={cn(
                            "shrink-0 px-2 py-1 rounded-full text-xs font-bold",
                            item.opportunity_score >= 70
                              ? "bg-green-500/10 text-green-600"
                              : item.opportunity_score >= 50
                                ? "bg-blue-500/10 text-blue-600"
                                : "bg-amber-500/10 text-amber-600",
                          )}
                        >
                          {item.opportunity_score}
                        </div>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.category}
                        </Badge>
                        {item.domain && (
                          <Badge variant="secondary" className="text-xs">
                            {item.domain}
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </div>
            </BentoCard>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProblemDetails;
