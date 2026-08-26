import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Layers,
  Play,
  RotateCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Sparkles,
  BookOpen,
  FileText,
  HelpCircle,
  Code2,
  ChevronRight,
  User,
  Calendar,
  Zap,
  Filter,
  Check,
  X,
  Eye,
  SlidersHorizontal,
} from "lucide-react";

export function AdminEducation() {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<"queue" | "plans">("queue");

  // Queue Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // Plan Filters & Details
  const [planSearch, setPlanSearch] = useState<string>("");
  const [planPage, setPlanPage] = useState<number>(1);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  // Triggering state tracker (jobId => boolean)
  const [triggeringJobId, setTriggeringJobId] = useState<string | null>(null);
  const [queueingPlanId, setQueueingPlanId] = useState<string | null>(null);

  // ─── 1. Queries ─────────────────────────────────────────────────────────────
  const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ["admin", "education", "metrics"],
    queryFn: () => apiClient.getEducationQueueMetrics(),
    refetchInterval: 10000,
  });

  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ["admin", "education", "jobs", statusFilter, typeFilter, searchQuery, page],
    queryFn: () =>
      apiClient.getEducationQueueJobs({
        status: statusFilter,
        job_type: typeFilter,
        search: searchQuery,
        page,
        limit: 25,
      }),
    refetchInterval: 10000,
  });

  const { data: plansData, isLoading: plansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ["admin", "education", "plans", planSearch, planPage],
    queryFn: () =>
      apiClient.getEducationAdminPlans({
        search: planSearch,
        page: planPage,
        limit: 25,
      }),
    refetchInterval: 15000,
  });

  const { data: planDetailsData, isLoading: planDetailsLoading, refetch: refetchPlanDetails } = useQuery({
    queryKey: ["admin", "education", "planDetails", selectedPlanId],
    queryFn: () => (selectedPlanId ? apiClient.getEducationAdminPlanDetails(selectedPlanId) : null),
    enabled: !!selectedPlanId,
  });

  // ─── 2. Mutations ───────────────────────────────────────────────────────────
  const triggerJobMutation = useMutation({
    mutationFn: (jobId: string) => apiClient.triggerEducationJob(jobId),
    onMutate: (jobId) => setTriggeringJobId(jobId),
    onSuccess: (_, jobId) => {
      toast({
        title: "Job Executed Successfully",
        description: `Job ${jobId.slice(0, 8)} was generated immediately.`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "education"] });
    },
    onError: (err: any) => {
      toast({
        title: "Manual Execution Failed",
        description: err?.message || "Failed to trigger job.",
        variant: "destructive",
      });
    },
    onSettled: () => setTriggeringJobId(null),
  });

  const retryJobMutation = useMutation({
    mutationFn: (jobId: string) => apiClient.retryEducationJob(jobId),
    onSuccess: () => {
      toast({
        title: "Job Reset to Pending",
        description: "Job will be picked up in the next worker cycle.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "education"] });
    },
    onError: (err: any) => {
      toast({
        title: "Retry Failed",
        description: err?.message || "Failed to retry job.",
        variant: "destructive",
      });
    },
  });

  const retryAllMutation = useMutation({
    mutationFn: () => apiClient.retryAllEducationJobs(),
    onSuccess: (res: any) => {
      toast({
        title: "All Failed Jobs Reset",
        description: `Reset ${res?.count || 0} failed jobs back to pending.`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "education"] });
    },
    onError: (err: any) => {
      toast({
        title: "Batch Retry Failed",
        description: err?.message || "Failed to retry jobs.",
        variant: "destructive",
      });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: (jobId: string) => apiClient.deleteEducationJob(jobId),
    onSuccess: () => {
      toast({
        title: "Job Removed",
        description: "The job has been removed from the queue.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "education"] });
    },
    onError: (err: any) => {
      toast({
        title: "Delete Failed",
        description: err?.message || "Failed to delete job.",
        variant: "destructive",
      });
    },
  });

  const cleanJobsMutation = useMutation({
    mutationFn: (daysToKeep: number) => apiClient.cleanEducationJobs(daysToKeep),
    onSuccess: (res) => {
      toast({
        title: "Completed Jobs Cleared",
        description: res?.message || "Queue cleanup completed.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "education"] });
    },
    onError: (err: any) => {
      toast({
        title: "Cleanup Failed",
        description: err?.message || "Failed to clean jobs.",
        variant: "destructive",
      });
    },
  });

  const queueMissingMutation = useMutation({
    mutationFn: ({ planId, priority }: { planId: string; priority: number }) =>
      apiClient.queueMissingEducationPlanContent(planId, priority),
    onMutate: ({ planId }) => setQueueingPlanId(planId),
    onSuccess: (res) => {
      toast({
        title: "Missing Content Queued",
        description: res?.message || "Queued missing components.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "education"] });
    },
    onError: (err: any) => {
      toast({
        title: "Queue Missing Content Failed",
        description: err?.message || "Failed to queue missing components.",
        variant: "destructive",
      });
    },
    onSettled: () => setQueueingPlanId(null),
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => apiClient.deleteEducationAdminPlan(planId),
    onSuccess: () => {
      toast({
        title: "Plan Deleted",
        description: "Study plan, topics, exams, and queue jobs have been purged.",
      });
      setSelectedPlanId(null);
      setDeletingPlanId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "education"] });
    },
    onError: (err: any) => {
      toast({
        title: "Delete Plan Failed",
        description: err?.message || "Failed to delete study plan.",
        variant: "destructive",
      });
      setDeletingPlanId(null);
    },
  });

  const metrics = metricsData?.data || {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    byType: { prep_content: 0, hands_on: 0, exam: 0, insights: 0 },
    byPriority: { ultra: 0, retry: 0, pro: 0, free: 0 },
  };

  const jobsList = jobsData?.data || [];
  const jobsPagination = jobsData?.pagination || { page: 1, total: 0, totalPages: 1 };
  const plansList = plansData?.data || [];
  const plansPagination = plansData?.pagination || { page: 1, total: 0, totalPages: 1 };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-screen-2xl mx-auto w-full">
      {/* ── METRIC CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Total Queue Jobs</span>
            <Layers className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.total}</span>
            <span className="text-[10px] text-zinc-500 font-mono">records</span>
          </div>
        </div>

        <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400/90 text-xs font-semibold">
            <span>Pending Jobs</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{metrics.pending}</span>
            <span className="text-[10px] text-amber-400/60 font-mono">awaiting worker</span>
          </div>
        </div>

        <div className="bg-blue-500/[0.04] border border-blue-500/20 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-400/90 text-xs font-semibold">
            <span>In Processing</span>
            <Zap className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-400">{metrics.processing}</span>
            <span className="text-[10px] text-blue-400/60 font-mono">active LLM</span>
          </div>
        </div>

        <div className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400/90 text-xs font-semibold">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{metrics.completed}</span>
            <span className="text-[10px] text-emerald-400/60 font-mono">generated</span>
          </div>
        </div>

        <div className="bg-red-500/[0.04] border border-red-500/20 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-400/90 text-xs font-semibold">
            <span>Failed Jobs</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-400">{metrics.failed}</span>
            <span className="text-[10px] text-red-400/60 font-mono">needs retry</span>
          </div>
        </div>
      </div>

      {/* ── SUB-TAB SELECTOR & GLOBAL ACTIONS ────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-2 bg-zinc-900/80 p-1 border border-white/[0.06] rounded-xl">
          <button
            onClick={() => setSubTab("queue")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subTab === "queue"
                ? "bg-white/[0.1] text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Queue Monitor ({metrics.pending} pending)
          </button>
          <button
            onClick={() => setSubTab("plans")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subTab === "plans"
                ? "bg-white/[0.1] text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            User Study Plans & Missing Content
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {subTab === "queue" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => retryAllMutation.mutate()}
                disabled={metrics.failed === 0 || retryAllMutation.isPending}
                className="h-8 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${retryAllMutation.isPending ? "animate-spin" : ""}`} />
                Retry All Failed ({metrics.failed})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => cleanJobsMutation.mutate(0)}
                disabled={cleanJobsMutation.isPending}
                className="h-8 text-xs border-white/[0.08] text-zinc-400 hover:text-white"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                Clear Completed
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              refetchMetrics();
              refetchJobs();
              refetchPlans();
            }}
            className="h-8 text-xs text-zinc-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── TAB 1: QUEUE MONITOR ─────────────────────────────────────── */}
      {subTab === "queue" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search by topic name, job ID, or error message..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="h-9 pl-9 bg-zinc-900/60 border-white/[0.08] text-xs text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-full bg-zinc-900/60 border border-white/[0.08] rounded-md text-xs text-zinc-300 px-3 focus:outline-none focus:border-white/20"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-full bg-zinc-900/60 border border-white/[0.08] rounded-md text-xs text-zinc-300 px-3 focus:outline-none focus:border-white/20"
              >
                <option value="all">All Job Types</option>
                <option value="prep_content">Study Prep Summary</option>
                <option value="hands_on">Hands-on Exercises</option>
                <option value="exam">Quiz / Exam</option>
                <option value="insights">Plan Insights</option>
              </select>
            </div>
          </div>

          {/* Jobs Table */}
          <div className="bg-zinc-900/40 border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-zinc-900/80 text-zinc-400 font-semibold">
                    <th className="py-3 px-4">Job Type</th>
                    <th className="py-3 px-4">Topic / Payload</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Attempts</th>
                    <th className="py-3 px-4">Created / Error</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {jobsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                        Loading queue telemetry...
                      </td>
                    </tr>
                  ) : jobsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-500">
                        No queue jobs match the current filters.
                      </td>
                    </tr>
                  ) : (
                    jobsList.map((job: any) => {
                      const isTriggering = triggeringJobId === job.id;
                      const topicName = job.payload?.topic_name || job.payload?.subject || "Topic";
                      return (
                        <tr key={job.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-mono capitalize ${
                                job.job_type === "prep_content"
                                  ? "border-purple-500/30 text-purple-400 bg-purple-500/10"
                                  : job.job_type === "hands_on"
                                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                  : job.job_type === "exam"
                                  ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
                                  : "border-zinc-500/30 text-zinc-400 bg-zinc-500/10"
                              }`}
                            >
                              {job.job_type.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white truncate max-w-xs">{topicName}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">Job: {job.id.slice(0, 13)}...</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                job.priority === 0
                                  ? "bg-red-500/15 text-red-400 border border-red-500/20"
                                  : job.priority === 1
                                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                  : job.priority === 2
                                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                                  : "bg-zinc-800 text-zinc-400"
                              }`}
                            >
                              {job.priority === 0
                                ? "P0 (Ultra)"
                                : job.priority === 1
                                ? "P1 (Retry)"
                                : job.priority === 2
                                ? "P2 (Pro)"
                                : "P3 (Free)"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                                job.status === "completed"
                                  ? "text-emerald-400"
                                  : job.status === "processing"
                                  ? "text-blue-400"
                                  : job.status === "failed"
                                  ? "text-red-400"
                                  : "text-amber-400"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  job.status === "completed"
                                    ? "bg-emerald-400"
                                    : job.status === "processing"
                                    ? "bg-blue-400 animate-pulse"
                                    : job.status === "failed"
                                    ? "bg-red-400"
                                    : "bg-amber-400"
                                }`}
                              />
                              {job.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-400">
                            {job.attempts || 0} / {job.max_attempts || 3}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="text-zinc-400 text-[10px]">
                              {new Date(job.created_at).toLocaleString()}
                            </div>
                            {job.error_msg && (
                              <div
                                className="text-red-400 text-[10px] truncate mt-0.5"
                                title={job.error_msg}
                              >
                                ⚠ {job.error_msg}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => triggerJobMutation.mutate(job.id)}
                                disabled={isTriggering}
                                className="h-7 px-2.5 text-[10px] font-bold border-white/[0.08] text-white hover:bg-white/[0.06]"
                                title="Execute this AI generation job immediately"
                              >
                                <Play className={`w-3 h-3 mr-1 text-emerald-400 ${isTriggering ? "animate-spin" : ""}`} />
                                {isTriggering ? "Generating..." : "Generate Now"}
                              </Button>

                              {job.status === "failed" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => retryJobMutation.mutate(job.id)}
                                  className="h-7 w-7 p-0 text-amber-400 hover:bg-amber-500/10 rounded-md"
                                  title="Reset to pending"
                                >
                                  <RotateCw className="w-3.5 h-3.5" />
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteJobMutation.mutate(job.id)}
                                className="h-7 w-7 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md"
                                title="Remove from queue"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {jobsPagination.totalPages > 1 && (
              <div className="p-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500">
                <span>
                  Showing page {jobsPagination.page} of {jobsPagination.totalPages} ({jobsPagination.total} total jobs)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="h-7 text-xs border-white/[0.06]"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= jobsPagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-7 text-xs border-white/[0.06]"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: USER STUDY PLANS & SYLLABUS INSPECTOR ─────────────── */}
      {subTab === "plans" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search plans by subject or title..."
                value={planSearch}
                onChange={(e) => {
                  setPlanSearch(e.target.value);
                  setPlanPage(1);
                }}
                className="h-9 pl-9 bg-zinc-900/60 border-white/[0.08] text-xs text-white"
              />
            </div>
            <div className="text-xs text-zinc-500">
              Total active student plans: <span className="font-bold text-white">{plansPagination.total}</span>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-zinc-900/80 text-zinc-400 font-semibold">
                    <th className="py-3 px-4">Subject & Student</th>
                    <th className="py-3 px-4">Topics Progress</th>
                    <th className="py-3 px-4">Missing Components</th>
                    <th className="py-3 px-4">Active Queue</th>
                    <th className="py-3 px-4">Target Exam Date</th>
                    <th className="py-3 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {plansLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                        Loading study plans...
                      </td>
                    </tr>
                  ) : plansList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        No study plans found.
                      </td>
                    </tr>
                  ) : (
                    plansList.map((plan: any) => {
                      const isQueueing = queueingPlanId === plan.id;
                      return (
                        <tr key={plan.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white text-sm">{plan.subject}</div>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                              <User className="w-3 h-3 text-zinc-500" />
                              <span>{plan.user?.email || "student"}</span>
                              {plan.user?.role === "admin" && (
                                <Badge variant="outline" className="text-[9px] h-4 border-red-500/30 text-red-400">
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-between text-[11px] text-zinc-300 mb-1">
                              <span>
                                {plan.completed_topics} / {plan.total_topics} completed
                              </span>
                              <span className="font-bold">{plan.progress}%</span>
                            </div>
                            <div className="w-36 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${plan.progress}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {plan.has_missing_content ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {plan.missing_prep_count > 0 && (
                                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                                    {plan.missing_prep_count} Prep
                                  </Badge>
                                )}
                                {plan.missing_handson_count > 0 && (
                                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                                    {plan.missing_handson_count} Hands-on
                                  </Badge>
                                )}
                                {plan.missing_exam_count > 0 && (
                                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                                    {plan.missing_exam_count} Quiz
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                                <Check className="w-3.5 h-3.5" /> All Generated
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {plan.active_jobs_count > 0 ? (
                              <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/20 text-[10px]">
                                <Zap className="w-3 h-3 mr-1 animate-pulse" />
                                {plan.active_jobs_count} queued
                              </Badge>
                            ) : (
                              <span className="text-zinc-500 text-[11px]">Idle</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                            {plan.exam_date ? new Date(plan.exam_date).toLocaleDateString() : "Flexible"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedPlanId(plan.id)}
                                className="h-7 px-2.5 text-[11px] font-bold border-white/[0.08] text-white hover:bg-white/[0.06]"
                              >
                                <Eye className="w-3 h-3 mr-1 text-blue-400" />
                                Inspect Topics
                              </Button>

                              {plan.has_missing_content && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => queueMissingMutation.mutate({ planId: plan.id, priority: 1 })}
                                  disabled={isQueueing}
                                  className="h-7 px-2 text-[10px] border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                  title="Queue all missing materials for this plan"
                                >
                                  <Sparkles className={`w-3 h-3 mr-1 ${isQueueing ? "animate-spin" : ""}`} />
                                  {isQueueing ? "Queueing..." : "Queue Missing"}
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeletingPlanId(plan.id)}
                                className="h-7 w-7 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md"
                                title="Delete this plan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Plans Pagination */}
            {plansPagination.totalPages > 1 && (
              <div className="p-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500">
                <span>
                  Showing page {plansPagination.page} of {plansPagination.totalPages} ({plansPagination.total} total plans)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={planPage <= 1}
                    onClick={() => setPlanPage((p) => p - 1)}
                    className="h-7 text-xs border-white/[0.06]"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={planPage >= plansPagination.totalPages}
                    onClick={() => setPlanPage((p) => p + 1)}
                    className="h-7 text-xs border-white/[0.06]"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PLAN TOPICS INSPECTION MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {selectedPlanId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0e0e11] border border-white/[0.1] rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/[0.06] flex items-center justify-between bg-zinc-900/60">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-[10px]">
                      Syllabus Inspector
                    </Badge>
                    <span className="text-zinc-500 text-xs font-mono">
                      ID: {selectedPlanId.slice(0, 13)}...
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {planDetailsData?.data?.plan?.subject || "Study Plan Details"}
                  </h2>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    User: <span className="text-white font-medium">{planDetailsData?.data?.user?.email}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => queueMissingMutation.mutate({ planId: selectedPlanId, priority: 1 })}
                    disabled={queueingPlanId === selectedPlanId}
                    className="h-8 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Queue All Missing
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedPlanId(null)}
                    className="h-8 w-8 p-0 text-zinc-400 hover:text-white rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {planDetailsLoading ? (
                  <div className="py-12 text-center text-zinc-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-400" />
                    Inspecting syllabus topics and components...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {planDetailsData?.data?.topics?.map((topic: any) => (
                      <div
                        key={topic.id}
                        className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-white/[0.12] transition-colors"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[10px] flex items-center justify-center">
                              {topic.index}
                            </span>
                            <span className="font-bold text-white text-sm">{topic.topic_name}</span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] capitalize ${
                                topic.status === "completed"
                                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                  : topic.status === "in_progress"
                                  ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
                                  : "border-zinc-700 text-zinc-400"
                              }`}
                            >
                              {topic.status.replace("_", " ")}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 text-xs flex-wrap pt-1">
                            {/* Prep summary indicator */}
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] ${
                                topic.has_prep ? "text-emerald-400" : "text-amber-400 font-medium"
                              }`}
                            >
                              {topic.has_prep ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                              Prep Notes ({topic.flashcard_count} flashcards)
                            </span>

                            {/* Hands-on indicator */}
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] ${
                                topic.has_handson ? "text-emerald-400" : "text-amber-400 font-medium"
                              }`}
                            >
                              {topic.has_handson ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                              Hands-On ({topic.hands_on_count} exercises)
                            </span>

                            {/* Quiz indicator */}
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] ${
                                topic.has_exam ? "text-emerald-400" : "text-amber-400 font-medium"
                              }`}
                            >
                              {topic.has_exam ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                              Quiz ({topic.exam?.question_count || 5} questions)
                            </span>
                          </div>
                        </div>

                        {/* Topic Action */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {topic.scheduled_date || "Not dated"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM DELETE PLAN MODAL ─────────────────────────────────── */}
      <AnimatePresence>
        {deletingPlanId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121216] border border-red-500/20 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-400">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Delete Study Plan?</h3>
                  <p className="text-xs text-zinc-400">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Deleting this study plan will permanently cascade-delete all of its syllabus topics, flashcards, hands-on exercises, generated exams, and active queue jobs.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingPlanId(null)}
                  disabled={deletePlanMutation.isPending}
                  className="h-8 text-xs border-white/[0.08]"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deletePlanMutation.mutate(deletingPlanId)}
                  disabled={deletePlanMutation.isPending}
                  className="h-8 text-xs bg-red-600 hover:bg-red-700 font-bold"
                >
                  {deletePlanMutation.isPending ? "Deleting..." : "Delete Plan Permanently"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminEducation;
