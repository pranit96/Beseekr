import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { resumeApi, type JobApplication } from "../../api/resume";
import {
  Plus,
  Search,
  ExternalLink,
  MoreVertical,
  Clock,
  Building2,
  Loader2,
  X,
  FileText,
  Link,
  KanbanSquare,
  LayoutGrid,
  Sparkles,
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Bookmark,
  Flame,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import HiredShell from "./HiredShell";

// ─── Types ────────────────────────────────────────────────────────────────────
type AppStatus = JobApplication["status"];

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<
  string,
  { color: string; dot: string; icon: React.ElementType }
> = {
  Offer: {
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  Interviewing: {
    color: "text-purple-400 bg-purple-500/10 border-purple-500/25",
    dot: "bg-purple-500",
    icon: Target,
  },
  Applied: {
    color: "text-sky-400 bg-sky-500/10 border-sky-500/25",
    dot: "bg-sky-500",
    icon: TrendingUp,
  },
  Rejected: {
    color: "text-red-400 bg-red-500/10 border-red-500/25",
    dot: "bg-red-500",
    icon: XCircle,
  },
  Bookmarked: {
    color: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    dot: "bg-amber-500",
    icon: Bookmark,
  },
};
const getCfg = (s: string) => STATUS_CFG[s] ?? STATUS_CFG.Applied;

const ALL_STATUSES: AppStatus[] = [
  "Bookmarked",
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
];

// ─── StatusMenu (OUTSIDE parent to prevent remount on every render) ───────────
interface StatusMenuProps {
  app: JobApplication;
  onUpdateStatus: (id: string, status: AppStatus) => void;
  onDelete: (id: string) => void;
}

const StatusMenu = React.memo(function StatusMenu({
  app,
  onUpdateStatus,
  onDelete,
}: StatusMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-500 hover:text-white rounded-lg shrink-0 relative z-20"
          aria-label="Application options"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={4}
        avoidCollisions={false}
        className="bg-[#111113] border border-white/[0.08] text-zinc-300 rounded-xl p-1 shadow-2xl min-w-[140px]"
      >
        <p className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-600">
          Move to
        </p>
        {ALL_STATUSES.filter((s) => s !== "Rejected" && s !== app.status).map(
          (s) => (
            <DropdownMenuItem
              key={s}
              onSelect={() => onUpdateStatus(app.id, s)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-white/[0.05] hover:text-white rounded-lg cursor-pointer transition-colors outline-none"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${getCfg(s).dot}`} />
              {s}
            </DropdownMenuItem>
          ),
        )}
        {app.status !== "Rejected" && (
          <>
            <DropdownMenuSeparator className="my-1 bg-white/[0.06]" />
            <DropdownMenuItem
              onSelect={() => onUpdateStatus(app.id, "Rejected")}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg cursor-pointer transition-colors outline-none"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Rejected
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem
          onSelect={() => onDelete(app.id)}
          className="flex items-center px-3 py-2 text-xs font-bold text-red-500/70 hover:bg-red-600/10 hover:text-red-400 rounded-lg cursor-pointer transition-colors outline-none"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

// ─── Add Modal ────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  company_name: "",
  job_title: "",
  status: "Applied" as AppStatus,
  job_url: "",
  jd_text: "",
  notes: "",
};

interface AddModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (d: Partial<JobApplication>) => Promise<void>;
  isSaving: boolean;
}

function AddModal({ open, onClose, onSave, isSaving }: AddModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const { toast } = useToast();

  const set = useCallback(
    (k: string, v: string) => setForm((p) => ({ ...p, [k]: v })),
    [],
  );

  const handleAiAutofill = async () => {
    if (!form.job_url) return;
    setIsParsingUrl(true);
    try {
      const parsed = await resumeApi.parseJobUrl(form.job_url);
      setForm((p) => ({
        ...p,
        company_name: parsed.company_name || p.company_name,
        job_title: parsed.job_title || p.job_title,
        jd_text: parsed.jd_text || p.jd_text,
      }));
      toast({
        title: "Autofilled from AI 🪄",
        description: `Successfully extracted details for ${parsed.company_name || "the company"}.`,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Autofill failed",
        description: e.message || "Failed to extract job details from the URL.",
      });
    } finally {
      setIsParsingUrl(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.job_title) return;
    await onSave(form);
    setForm(EMPTY_FORM);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg bg-[#111113] border border-white/[0.09] rounded-[28px] p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  New Application
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Paste the JD to unlock AI Prep Kit later.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { k: "company_name", label: "Company", ph: "Google" },
                  { k: "job_title", label: "Role", ph: "SWE II" },
                ].map((f) => (
                  <div key={f.k} className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      {f.label} *
                    </label>
                    <Input
                      value={(form as any)[f.k]}
                      onChange={(e) => set(f.k, e.target.value)}
                      placeholder={f.ph}
                      required
                      className="bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/50 rounded-xl h-10 text-sm text-zinc-200"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  className="w-full h-10 bg-white/[0.03] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-3 text-sm text-zinc-200 font-medium outline-none"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-zinc-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                    <Link className="w-3 h-3" /> Job URL
                  </label>
                  {form.job_url && (
                    <button
                      type="button"
                      onClick={handleAiAutofill}
                      disabled={isParsingUrl}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 disabled:text-zinc-600 flex items-center gap-1 transition-colors"
                    >
                      {isParsingUrl ? (
                        <>
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          Autofilling…
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-2.5 h-2.5" />
                          AI Autofill 🪄
                        </>
                      )}
                    </button>
                  )}
                </div>
                <Input
                  value={form.job_url}
                  onChange={(e) => set("job_url", e.target.value)}
                  placeholder="https://..."
                  type="url"
                  className="bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/50 rounded-xl h-10 text-sm text-zinc-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Job Description
                  <span className="text-indigo-400 font-bold normal-case tracking-normal text-[10px]">
                    → powers AI Prep Kit
                  </span>
                </label>
                <textarea
                  value={form.jd_text}
                  onChange={(e) => set("jd_text", e.target.value)}
                  placeholder="Paste the full JD here…"
                  rows={4}
                  maxLength={12000}
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl p-3 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none resize-none font-medium leading-relaxed transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1 h-11 text-zinc-500 hover:text-white rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || !form.company_name || !form.job_title}
                  className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Add Application"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
const Stat = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) => (
  <div
    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${accent}`}
  >
    <span className="text-lg font-black leading-none">{value}</span>
    <span className="opacity-70">{label}</span>
  </div>
);

// ─── App Card ─────────────────────────────────────────────────────────────────
interface AppCardProps {
  app: JobApplication;
  isFlashing: boolean;
  onUpdateStatus: (id: string, status: AppStatus) => void;
  onDelete: (id: string) => void;
  onHover: (id: string | null) => void;
  onPrepKit: (app: JobApplication) => void;
}

const AppCard = React.memo(function AppCard({
  app,
  isFlashing,
  onUpdateStatus,
  onDelete,
  onHover,
  onPrepKit,
}: AppCardProps) {
  const cfg = getCfg(app.status);
  return (
    <motion.div
      layout
      key={app.id}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      onMouseEnter={() => onHover(app.id)}
      onMouseLeave={() => onHover(null)}
      className={`group relative bg-white/[0.02] border rounded-2xl p-5 transition-colors duration-300 hover:shadow-xl hover:shadow-black/30 ${
        isFlashing
          ? "border-indigo-500/50 shadow-indigo-500/10 shadow-lg"
          : "border-white/[0.07] hover:border-white/[0.13]"
      }`}
    >
      {/* Status accent bar */}
      <div
        className={`absolute top-0 left-5 right-5 h-px ${cfg.dot} opacity-60 rounded-full`}
      />

      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center ${cfg.color}`}
        >
          <cfg.icon className="w-4 h-4" />
        </div>
        <StatusMenu
          app={app}
          onUpdateStatus={onUpdateStatus}
          onDelete={onDelete}
        />
      </div>

      <div className="space-y-0.5 mb-4">
        <h3 className="text-base font-bold text-white tracking-tight line-clamp-1">
          {app.job_title}
        </h3>
        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5 truncate">
          <Building2 className="w-3 h-3 shrink-0" />
          {app.company_name}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${cfg.color}`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {app.status}
        </span>
        {app.jd_text && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            JD Ready
          </span>
        )}
        {app.job_url && (
          <a
            href={app.job_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-white/[0.08] text-zinc-500 hover:text-white transition-colors"
          >
            <ExternalLink className="w-2.5 h-2.5" /> Link
          </a>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.05] pt-3">
        <span className="text-[10px] text-zinc-700 font-bold flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(app.created_at).toLocaleDateString()}
        </span>
        <button
          onClick={() => onPrepKit(app)}
          className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-indigo-400 transition-colors"
        >
          <Sparkles className="w-3 h-3" /> Prep Kit
        </button>
      </div>
    </motion.div>
  );
});

// ─── Kanban Card ──────────────────────────────────────────────────────────────
interface KanbanCardProps {
  app: JobApplication;
  isFlashing: boolean;
  onUpdateStatus: (id: string, status: AppStatus) => void;
  onDelete: (id: string) => void;
  onHover: (id: string | null) => void;
  onPrepKit: (app: JobApplication) => void;
}

const KanbanCard = React.memo(function KanbanCard({
  app,
  isFlashing,
  onUpdateStatus,
  onDelete,
  onHover,
  onPrepKit,
}: KanbanCardProps) {
  return (
    <div
      className={`bg-white/[0.02] border rounded-xl p-3.5 transition-all ${
        isFlashing
          ? "border-indigo-500/40"
          : "border-white/[0.07] hover:border-white/[0.12]"
      }`}
      onMouseEnter={() => onHover(app.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-white line-clamp-1">
            {app.job_title}
          </p>
          <p className="text-xs text-zinc-500 font-medium truncate">
            {app.company_name}
          </p>
        </div>
        <StatusMenu
          app={app}
          onUpdateStatus={onUpdateStatus}
          onDelete={onDelete}
        />
      </div>
      <div className="flex items-center justify-between border-t border-white/[0.05] pt-2 mt-2">
        <span className="text-[10px] text-zinc-700 font-bold">
          {new Date(app.created_at).toLocaleDateString()}
        </span>
        <button
          onClick={() => onPrepKit(app)}
          className="text-[10px] font-bold text-zinc-600 hover:text-indigo-400 flex items-center gap-1 transition-colors"
        >
          <Sparkles className="w-3 h-3" /> Prep Kit
        </button>
      </div>
    </div>
  );
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function JobTracker() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("grid");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [updatedIds, setUpdatedIds] = useState<Set<string>>(new Set());
  const [hoveredAppId, setHoveredAppId] = useState<string | null>(null);
  const [coachInsights, setCoachInsights] = useState<any>(null);
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);
  const [streak, setStreak] = useState(0);
  const [completedChecklist, setCompletedChecklist] = useState<Set<string>>(
    new Set(),
  );

  // ── Prefetch prep kit on hover ───────────────────────────────────────────
  useEffect(() => {
    if (!hoveredAppId) return;
    const app = applications.find((a) => a.id === hoveredAppId);
    if (!app?.jd_text) return;
    const t = setTimeout(async () => {
      try {
        if (sessionStorage.getItem(`prepKit:${app.id}`)) return;
        const draft = await resumeApi.getResumeDraft("template");
        if (!draft?.resume_data || !Object.keys(draft.resume_data).length)
          return;
        const kit = await resumeApi.generateInterviewPrep({
          resume: draft.resume_data,
          job_description: app.jd_text,
          company_name: app.company_name,
          job_title: app.job_title,
        });
        sessionStorage.setItem(`prepKit:${app.id}`, JSON.stringify(kit));
      } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [hoveredAppId, applications]);

  // ── Coach insights ───────────────────────────────────────────────────────
  const fetchCoachInsights = useCallback(async () => {
    setIsLoadingCoach(true);
    try {
      const res = await resumeApi.getCoachInsights();
      setCoachInsights(res);
      const saved = localStorage.getItem("job_tracker_completed_tasks");
      if (saved) {
        try {
          setCompletedChecklist(new Set(JSON.parse(saved)));
        } catch {}
      }
    } catch {
      console.warn("Failed to fetch AI Coach insights");
    } finally {
      setIsLoadingCoach(false);
    }
  }, []);

  const handleToggleTask = useCallback((taskId: string) => {
    setCompletedChecklist((prev) => {
      const updated = new Set(prev);
      if (updated.has(taskId)) {
        updated.delete(taskId);
      } else {
        updated.add(taskId);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
      }
      localStorage.setItem(
        "job_tracker_completed_tasks",
        JSON.stringify(Array.from(updated)),
      );
      return updated;
    });
  }, []);

  // ── Applications fetch ───────────────────────────────────────────────────
  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      setApplications(await resumeApi.getApplications());
    } catch {
      toast({ variant: "destructive", title: "Failed to load applications" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ── Streak logic ─────────────────────────────────────────────────────────
  useEffect(() => {
    const today = new Date().toDateString();
    const lastActive = localStorage.getItem("job_tracker_last_active");
    const savedStreak = localStorage.getItem("job_tracker_streak");
    let currentStreak = savedStreak ? parseInt(savedStreak, 10) : 0;

    if (lastActive) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastActive === yesterday.toDateString()) {
        currentStreak += 1;
        localStorage.setItem("job_tracker_streak", currentStreak.toString());
      } else if (lastActive !== today) {
        currentStreak = 1;
        localStorage.setItem("job_tracker_streak", "1");
      }
    } else {
      currentStreak = 1;
      localStorage.setItem("job_tracker_streak", "1");
    }

    setStreak(currentStreak);
    localStorage.setItem("job_tracker_last_active", today);
  }, []);

  useEffect(() => {
    fetchApplications();
    fetchCoachInsights();
  }, [fetchApplications, fetchCoachInsights]);

  // ── Flash highlight ──────────────────────────────────────────────────────
  const flash = useCallback((id: string) => {
    setUpdatedIds((p) => new Set(p).add(id));
    setTimeout(() => {
      setUpdatedIds((p) => {
        const s = new Set(p);
        s.delete(id);
        return s;
      });
    }, 1500);
  }, []);

  // ── CRUD handlers ────────────────────────────────────────────────────────
  const handleAdd = async (data: Partial<JobApplication>) => {
    setIsSaving(true);
    try {
      const app = await resumeApi.createApplication(data);
      setApplications((p) => [app, ...p]);
      setShowAddModal(false);
      toast({
        title: "Application Added",
        description: `${data.company_name} added to pipeline.`,
      });
    } catch {
      toast({ variant: "destructive", title: "Failed to add application" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = useCallback(
    async (id: string, status: AppStatus) => {
      const prev = [...applications];
      setApplications((p) =>
        p.map((a) => (a.id === id ? { ...a, status } : a)),
      );
      flash(id);
      try {
        await resumeApi.updateApplication(id, { status });
      } catch {
        setApplications(prev);
        toast({ variant: "destructive", title: "Update failed" });
      }
    },
    [applications, flash, toast],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const prev = [...applications];
      setApplications((p) => p.filter((a) => a.id !== id));
      try {
        await resumeApi.deleteApplication(id);
      } catch {
        setApplications(prev);
        toast({ variant: "destructive", title: "Deletion failed" });
      }
    },
    [applications, toast],
  );

  const handlePrepKit = useCallback(
    (app: JobApplication) => {
      navigate("/dashboard/hired/prep", { state: { app } });
    },
    [navigate],
  );

  // ── Derived data ─────────────────────────────────────────────────────────
  const filtered = applications.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      (a.company_name.toLowerCase().includes(q) ||
        a.job_title.toLowerCase().includes(q)) &&
      (filterStatus === "all" || a.status === filterStatus)
    );
  });

  const counts = {
    total: applications.length,
    interviewing: applications.filter((a) => a.status === "Interviewing")
      .length,
    offer: applications.filter((a) => a.status === "Offer").length,
    rejected: applications.filter((a) => a.status === "Rejected").length,
  };

  const level =
    counts.total === 0 ? "Novice" : counts.total < 5 ? "Amateur" : "Pro Finder";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <AddModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAdd}
        isSaving={isSaving}
      />
      <HiredShell>
        <div className="max-w-6xl mx-auto space-y-6 py-7 px-4 sm:px-6 lg:px-8">
          {/* HEADER */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Job Tracker
              </h1>
              <p className="text-zinc-500 text-sm mt-0.5">
                Your full application pipeline at a glance.
              </p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-10 px-5 shadow-lg shadow-indigo-500/20 flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Application
            </Button>
          </div>

          {/* STATS */}
          {!isLoading && applications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Stat
                label="total"
                value={counts.total}
                accent="text-zinc-400 bg-white/[0.03] border-white/[0.07]"
              />
              <Stat
                label="interviewing"
                value={counts.interviewing}
                accent="text-purple-400 bg-purple-500/10 border-purple-500/20"
              />
              <Stat
                label="offers"
                value={counts.offer}
                accent="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              />
              <Stat
                label="rejected"
                value={counts.rejected}
                accent="text-red-400 bg-red-500/10 border-red-500/20"
              />
            </div>
          )}

          {/* AI CAREER COACH */}
          <div className="bg-[#131316] border border-white/[0.06] rounded-[24px] p-6 shadow-xl relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-[200px] h-[200px] bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center border-b border-white/[0.05] pb-5 mb-5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-white tracking-tight">
                      AI Career Coach
                    </h2>
                    <Badge
                      variant="secondary"
                      className="bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-bold text-[10px] uppercase py-0 px-2 rounded-full"
                    >
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Your personalized habit streak and daily action planner.
                  </p>
                </div>
              </div>

              {/* Streak Widget */}
              <div className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] p-2.5 px-4 rounded-2xl shrink-0">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">
                      Streak
                    </p>
                    <p className="text-sm font-black text-white mt-1 leading-none">
                      {streak} Days
                    </p>
                  </div>
                </div>
                <div className="h-6 w-px bg-white/[0.08]" />
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">
                      Level
                    </p>
                    <p className="text-sm font-black text-white mt-1 leading-none">
                      {level}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {isLoadingCoach ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                <p className="text-xs text-zinc-500 font-bold mt-2.5">
                  AI Coach is analyzing your pipeline…
                </p>
              </div>
            ) : coachInsights ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
                {/* Daily Checklist */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      AI Daily Actions Checklist
                    </h3>
                    <span className="text-[10px] font-bold text-zinc-500">
                      {completedChecklist.size} /{" "}
                      {coachInsights.checklist?.length ?? 0} Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {coachInsights.checklist?.map((task: any) => {
                      const done = completedChecklist.has(task.id);
                      return (
                        <div
                          key={task.id}
                          onClick={() => handleToggleTask(task.id)}
                          className={`group cursor-pointer flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-300 ${
                            done
                              ? "bg-indigo-500/5 border-indigo-500/20 text-zinc-500"
                              : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] text-zinc-300"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                              done
                                ? "bg-indigo-500 border-indigo-500 text-white"
                                : "border-white/[0.15] group-hover:border-indigo-500/50"
                            }`}
                          >
                            {done && (
                              <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                            )}
                          </div>
                          <span
                            className={`text-xs font-bold leading-relaxed transition-all ${
                              done ? "line-through text-zinc-600" : ""
                            }`}
                          >
                            {task.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pep Talk */}
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 mt-3">
                    <p className="text-xs italic text-zinc-400 leading-relaxed">
                      "{coachInsights.pep_talk}"
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mt-2">
                      — AI Coach Assistant
                    </p>
                  </div>
                </div>

                {/* Strategy */}
                <div className="space-y-4 lg:border-l lg:border-white/[0.05] lg:pl-6">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-purple-400" />
                    AI Search Strategy
                  </h3>
                  <div className="space-y-3">
                    {coachInsights.next_strategic_steps?.map(
                      (step: string, i: number) => (
                        <div key={i} className="flex gap-2.5 items-start">
                          <div className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-purple-400 mt-0.5">
                            {i + 1}
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed font-bold">
                            {step}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                  <div className="pt-2">
                    <Button
                      onClick={fetchCoachInsights}
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs font-bold text-zinc-500 hover:text-white hover:bg-white/[0.05] rounded-xl flex items-center gap-1.5 h-9"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh AI Strategy
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-xs text-zinc-500 font-bold">
                  Start adding jobs to generate a tailored AI Coaching pipeline
                  checklist!
                </p>
                <Button
                  onClick={fetchCoachInsights}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl mt-3 h-9 text-xs px-4"
                >
                  Load AI Coach Insights
                </Button>
              </div>
            )}
          </div>

          {/* TOOLBAR */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 group max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              <Input
                placeholder="Search company or role…"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                className="bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/50 pl-9 h-9 rounded-xl text-sm text-zinc-200"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/[0.07] rounded-xl p-1 overflow-x-auto">
              {["all", ...ALL_STATUSES].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`h-7 px-3 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${
                    filterStatus === s
                      ? "bg-white text-black"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex bg-white/[0.03] border border-white/[0.07] p-1 rounded-xl gap-0.5">
              {(
                [
                  { mode: "grid", Icon: LayoutGrid },
                  { mode: "kanban", Icon: KanbanSquare },
                ] as const
              ).map(({ mode, Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === mode
                      ? "bg-white/[0.1] text-white"
                      : "text-zinc-500 hover:text-white"
                  }`}
                  aria-label={`${mode} view`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* CONTENT */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 bg-white/[0.02] border border-white/[0.06] rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/[0.07] rounded-2xl bg-white/[0.01] space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6 text-zinc-700" />
              </div>
              <div>
                <p className="text-zinc-400 font-bold">
                  No applications
                  {applications.length > 0 ? " matching filters" : " yet"}
                </p>
                <p className="text-zinc-600 text-sm mt-1">
                  {applications.length === 0
                    ? "Start tracking your job search."
                    : "Try adjusting the filter or search."}
                </p>
              </div>
              {applications.length === 0 && (
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-5 h-10"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add First Application
                </Button>
              )}
            </div>
          ) : viewMode === "kanban" && filterStatus === "all" ? (
            /* KANBAN */
            <div className="flex gap-4 overflow-x-auto pb-6 snap-x -mx-4 px-4">
              {ALL_STATUSES.map((status) => {
                const col = filtered.filter((a) => a.status === status);
                const cfg = getCfg(status);
                return (
                  <div key={status} className="flex-none w-[280px] snap-start">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                        {status}
                      </span>
                      <span
                        className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${cfg.color}`}
                      >
                        {col.length}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {col.map((app) => (
                        <KanbanCard
                          key={app.id}
                          app={app}
                          isFlashing={updatedIds.has(app.id)}
                          onUpdateStatus={handleUpdateStatus}
                          onDelete={handleDelete}
                          onHover={setHoveredAppId}
                          onPrepKit={handlePrepKit}
                        />
                      ))}
                      {col.length === 0 && (
                        <div className="h-20 border border-dashed border-white/[0.05] rounded-xl flex items-center justify-center">
                          <span className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider">
                            Empty
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
              <AnimatePresence mode="popLayout">
                {filtered.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    isFlashing={updatedIds.has(app.id)}
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={handleDelete}
                    onHover={setHoveredAppId}
                    onPrepKit={handlePrepKit}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </HiredShell>
    </>
  );
}
