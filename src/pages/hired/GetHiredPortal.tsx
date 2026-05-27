import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useResume } from "../../contexts/ResumeContext";
import { type ResumeSchema, type ResumeRevision } from "../../api/resume";
import { useToast } from "../../hooks/use-toast";
import {
  Upload,
  FileText,
  Clock,
  ArrowRight,
  Loader2,
  User,
  Sparkles,
  History,
  Trash2,
  Trophy,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import HiredShell from "./HiredShell";

interface DraftInfo {
  resume_data: ResumeSchema;
  job_description: string;
  history: ResumeRevision[];
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function GetHiredPortal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    setResumeData,
    setWorkspaceMode,
    setShowOnboarding,
    setUploadSource,
    fetchBothDrafts,
  } = useResume();

  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
  const [uploadDraft, setUploadDraft] = useState<DraftInfo | null>(null);
  const [templateDraft, setTemplateDraft] = useState<DraftInfo | null>(null);
  const [showCreateOptions, setShowCreateOptions] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadDrafts() {
      setIsLoadingDrafts(true);
      try {
        const drafts = await fetchBothDrafts();
        if (active) {
          setUploadDraft(drafts.upload);
          setTemplateDraft(drafts.template);
        }
      } catch (e) {
        console.error("Failed to load drafts", e);
      } finally {
        if (active) setIsLoadingDrafts(false);
      }
    }
    loadDrafts();
    return () => {
      active = false;
    };
  }, []);

  const handleContinueWorkspace = (
    mode: "upload" | "template",
    draft: DraftInfo,
  ) => {
    setWorkspaceMode(mode, true);
    setResumeData(draft.resume_data);
    setUploadSource(null);
    setShowOnboarding(false);
    navigate("resume/workspace");
  };

  const hasDraft = (draft: DraftInfo | null): boolean => {
    return Boolean(draft?.resume_data?.personal_info?.name);
  };

  const allHistory = [
    ...(uploadDraft?.history || []).map((h) => ({
      ...h,
      mode: "upload" as const,
    })),
    ...(templateDraft?.history || []).map((h) => ({
      ...h,
      mode: "template" as const,
    })),
  ].sort(
    (a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime(),
  );

  return (
    <HiredShell>
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-10 text-left font-sans select-none antialiased text-zinc-900 dark:text-zinc-100">
        {/* ── HEADER ── */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-black tracking-tight">Get Hired</h1>
          <p className="text-sm text-zinc-500 font-medium max-w-md mx-auto leading-relaxed">
            Build, optimize, and export your resume in minutes. Choose how you'd
            like to start.
          </p>
        </div>

        {/* ── TWO ACTION CARDS (OPTIMIZE RESUME FIRST) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* ATS Match & Tailor Card (Optimize First!) */}
          <motion.button
            whileHover={{
              y: -4,
              boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)",
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => navigate("resume/tailor")}
            className="relative group p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-left cursor-pointer transition-colors hover:border-indigo-300 dark:hover:border-indigo-500/30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent dark:from-indigo-500/[0.04] dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative space-y-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trophy className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black tracking-tight">
                  Optimize Resume
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  Align and optimize your resume for any specific job description.
                  Rewrite, score, and compile a tailored LaTeX PDF.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <span>Start Alignment</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>

          {/* Create New Resume Card (Combined Upload & Template) */}
          <motion.div
            layout
            whileHover={!showCreateOptions ? {
              y: -4,
              boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)",
            } : {}}
            whileTap={!showCreateOptions ? { scale: 0.98 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => {
              if (!showCreateOptions) setShowCreateOptions(true);
            }}
            className={`relative group p-6 rounded-2xl border transition-colors overflow-hidden ${
              showCreateOptions 
                ? "border-violet-300 dark:border-violet-500/30 bg-white dark:bg-zinc-900" 
                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:border-violet-300 dark:hover:border-violet-500/30"
            }`}
          >
            {/* Gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-transparent dark:from-violet-500/[0.03] dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <AnimatePresence mode="wait">
              {!showCreateOptions ? (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative space-y-4"
                >
                  <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-500/15 border border-violet-200 dark:border-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black tracking-tight">
                      Create New Resume
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                      Start fresh by uploading your existing PDF/Word resume or selecting from our professional design templates.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    <span>Create Resume</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 border border-violet-200 dark:border-violet-500/20 flex items-center justify-center">
                      <Sparkles className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCreateOptions(false);
                      }}
                      className="text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/60 hover:bg-zinc-200 dark:hover:bg-zinc-800 border-none rounded-lg px-2.5 py-1 transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black tracking-tight text-foreground">
                      Choose Starting Method
                    </h3>
                    <p className="text-[11px] text-zinc-500 leading-normal font-medium">
                      Select how you would like to initialize your new resume workspace:
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 pt-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("resume/upload");
                      }}
                      className="w-full py-2.5 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-left hover:border-violet-500 dark:hover:border-violet-500/50 hover:bg-violet-500/5 dark:hover:bg-violet-500/10 flex items-center justify-between text-xs font-bold transition-all text-zinc-800 dark:text-zinc-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        <span>Upload PDF or Word Resume</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-zinc-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("resume/templates");
                      }}
                      className="w-full py-2.5 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-left hover:border-emerald-500 dark:hover:border-emerald-500/50 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 flex items-center justify-between text-xs font-bold transition-all text-zinc-800 dark:text-zinc-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Browse Professional Templates</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-zinc-400" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── PAST WORKSPACES ── */}
        {isLoadingDrafts ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : hasDraft(uploadDraft) || hasDraft(templateDraft) ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="h-3.5 w-3.5 text-zinc-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Your Workspaces
              </h2>
            </div>

            <div className="space-y-2">
              {/* Upload Draft */}
              {hasDraft(uploadDraft) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">
                          {uploadDraft!.resume_data.personal_info.name}
                        </p>
                        <Badge className="bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20 text-violet-600 dark:text-violet-300 text-[8px] font-bold uppercase px-1.5 py-0 rounded">
                          Uploaded
                        </Badge>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {uploadDraft!.resume_data.personal_info.email ||
                          "Resume workspace"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleContinueWorkspace("upload", uploadDraft!)
                    }
                    className="shrink-0 h-8 px-4 rounded-lg text-[10px] font-bold bg-zinc-100 dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] transition-all flex items-center gap-1.5 uppercase tracking-wide"
                  >
                    Continue Editing
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </motion.div>
              )}

              {/* Template Draft */}
              {hasDraft(templateDraft) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">
                          {templateDraft!.resume_data.personal_info.name}
                        </p>
                        <Badge className="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[8px] font-bold uppercase px-1.5 py-0 rounded">
                          Template
                        </Badge>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {templateDraft!.resume_data.personal_info.email ||
                          "Template workspace"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleContinueWorkspace("template", templateDraft!)
                    }
                    className="shrink-0 h-8 px-4 rounded-lg text-[10px] font-bold bg-zinc-100 dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] transition-all flex items-center gap-1.5 uppercase tracking-wide"
                  >
                    Continue Editing
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </motion.div>
              )}
            </div>

            {/* Revision History */}
            {allHistory.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                  Saved Versions
                </h3>
                <div className="space-y-1">
                  {allHistory.slice(0, 5).map((rev) => (
                    <div
                      key={rev.id}
                      className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition-all text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Clock className="h-3 w-3 text-zinc-400 shrink-0" />
                        <span className="font-semibold truncate text-zinc-700 dark:text-zinc-300">
                          {rev.name}
                        </span>
                        <Badge className="bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-500 text-[8px] font-bold uppercase px-1.5 py-0 rounded shrink-0">
                          {rev.mode}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-medium shrink-0 ml-3">
                        {timeAgo(rev.saved_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </HiredShell>
  );
}
