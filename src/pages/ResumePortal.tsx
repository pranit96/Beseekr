import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useResume } from "@/contexts/ResumeContext";
import {
  FileText,
  UploadCloud,
  Plus,
  History,
  ArrowRight,
  Trash2,
  RotateCcw,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Layers,
  Compass,
  Zap,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ResumePortal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPurgeDialogOpen, setIsPurgeDialogOpen] = useState(false);

  const {
    resumeData,
    revisionHistory,
    isLoading,
    restoreSnapshot,
    deleteSnapshot,
    resetWorkspace,
    workspaceMode,
    setWorkspaceMode,
    purgeWorkspace,
    atsReport,
    jobDescription,
  } = useResume();

  const handlePurgeWorkspace = () => {
    setIsPurgeDialogOpen(true);
  };

  const hasActiveDraft =
    resumeData.personal_info?.name || resumeData.experience?.length > 0;

  const handleOpenUpload = () => {
    setWorkspaceMode("upload");
    navigate("/dashboard/hired/resume/upload");
  };

  const handleCreateNew = () => {
    setWorkspaceMode("template");
    resetWorkspace();
    navigate("/dashboard/hired/resume/templates");
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreSnapshot(id);
      navigate("/dashboard/hired/resume/workspace");
      toast({
        title: "Version Restored",
        description:
          "Successfully synchronized the workspace with the selected historical snapshot.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Restoration Failed",
        description:
          error.message || "Could not recover the archived snapshot.",
      });
    }
  };

  return (
    <div className="w-full text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
        {/* HERO & CONTROL HEADER */}
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase flex items-center select-none">
              GET HIRED <span className="mx-2 opacity-50 text-[8px]">•</span>{" "}
              HOME
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] flex flex-col gap-1">
              <span className="text-white">Your Resume.</span>
              <span className="text-zinc-700">
                Build it. Score it. Download it.
              </span>
            </h1>
          </div>
        </div>

        {/* INTERACTIVE WORKFLOW PIPELINE ROADMAP */}
        <div className="bg-[#0b0b12]/50 border border-white/[0.05] rounded-3xl p-6 relative overflow-hidden shadow-2xl text-left">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.01] rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 mb-6 select-none">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            Resume Optimization Roadmap
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative">
            {[
              {
                step: "1",
                title: "Initialize Profile",
                desc: "Upload DOCX/PDF or pick a design template.",
                active: true,
                completed: !!hasActiveDraft,
              },
              {
                step: "2",
                title: "Draft & Structure",
                desc: "Add experiences, education, and credentials.",
                active: !!hasActiveDraft,
                completed: !!(
                  resumeData.experience?.length || resumeData.skills?.length
                ),
              },
              {
                step: "3",
                title: "JD Alignment",
                desc: "Paste target job description to match skills.",
                active: !!(
                  resumeData.experience?.length || resumeData.skills?.length
                ),
                completed: !!jobDescription,
              },
              {
                step: "4",
                title: "AI ATS Scoring",
                desc: "Get real-time score & tailored improvements.",
                active: !!jobDescription,
                completed: !!atsReport?.score,
              },
              {
                step: "5",
                title: "Publish & Export",
                desc: "Download high-fidelity PDF ready to submit.",
                active: !!atsReport?.score,
                completed: false,
              },
            ].map((s, idx) => {
              const isActive = s.active;
              const isCompleted = s.completed;
              return (
                <div
                  key={idx}
                  className={`relative p-4 rounded-2xl border transition-all duration-300 ${
                    isCompleted
                      ? "bg-indigo-500/[0.03] border-indigo-500/20 text-indigo-300"
                      : isActive
                        ? "bg-white/[0.02] border-white/10 text-white"
                        : "bg-transparent border-white/[0.04] text-zinc-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        isCompleted
                          ? "bg-indigo-500/10 text-indigo-400"
                          : isActive
                            ? "bg-white/10 text-white"
                            : "bg-white/[0.02] text-zinc-500"
                      }`}
                    >
                      Stage {s.step}
                    </span>
                    {isCompleted && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 animate-in scale-in duration-200" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold leading-tight mb-1">
                    {s.title}
                  </h4>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIVE WORKSPACE DASHBOARD */}
        {hasActiveDraft && !isLoading ? (
          <div className="bg-[#0b0b12]/60 border border-white/[0.06] rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl text-left">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-indigo-500/50" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Context */}
              <div className="space-y-4 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-block text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full select-none">
                    Active Draft
                  </span>
                  <span className="inline-block text-[9px] font-black uppercase tracking-widest text-zinc-500 bg-white/[0.02] border border-white/[0.05] px-2.5 py-0.5 rounded-full font-mono select-none">
                    Mode:{" "}
                    {workspaceMode === "upload"
                      ? "ATS Calibration"
                      : "Builder Workspace"}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {resumeData.personal_info?.name || "Untitled Candidate"}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5 font-medium flex items-center gap-1">
                    {resumeData.personal_info?.email ||
                      "No contact email provided"}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl">
                    <p className="text-sm font-black text-white">
                      {resumeData.experience?.length || 0}
                    </p>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      Experience Entries
                    </p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl">
                    <p className="text-sm font-black text-white">
                      {resumeData.skills?.flatMap((s) => s.items || [])
                        .length ||
                        resumeData.skills?.length ||
                        0}
                    </p>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      Skills Mapped
                    </p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl col-span-2 sm:col-span-1">
                    <p className="text-sm font-black text-white truncate max-w-[150px]">
                      {jobDescription ? "Aligned" : "Unaligned"}
                    </p>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      Target Role
                    </p>
                  </div>
                </div>
              </div>

              {/* Middle/Right: Score Gauge Indicator */}
              <div className="flex items-center gap-6 bg-white/[0.01] border border-white/[0.04] p-5 rounded-2xl shrink-0 lg:max-w-xs w-full lg:w-auto">
                {atsReport?.score ? (
                  <div className="flex items-center gap-4 text-left">
                    <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          className="stroke-white/[0.04] fill-none"
                          strokeWidth="4"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          className="stroke-indigo-500 fill-none transition-all duration-500"
                          strokeWidth="4"
                          strokeDasharray={`${atsReport.score * 1.76}, 176`}
                        />
                      </svg>
                      <span className="absolute text-sm font-black text-white">
                        {atsReport.score}
                      </span>
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-black text-zinc-300 flex items-center gap-1 uppercase tracking-wider">
                        <Zap className="w-3 h-3 text-indigo-400" /> ATS Rating
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-semibold mt-0.5 leading-relaxed">
                        Calibrated against pasted job specifications.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-500 shrink-0 select-none">
                      <Zap className="w-5 h-5 opacity-40" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">
                        Alignment Pending
                      </h4>
                      <p className="text-[10px] text-zinc-600 font-semibold leading-relaxed mt-0.5">
                        Launch builder and paste a target Job Description to see
                        your match rating.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.04]">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePurgeWorkspace}
                  className="bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 text-red-400 font-extrabold h-9 px-4 rounded-xl text-xs gap-1.5 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Start Fresh
                </Button>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  onClick={() => navigate("/dashboard/hired/resume/workspace")}
                  className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 font-extrabold h-10 px-6 rounded-xl text-xs gap-1.5 cursor-pointer hover:scale-[1.01] transition-all"
                >
                  <span>Launch Workspace Editor</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* PRIMARY ACTION GATEWAYS IF NO ACTIVE DRAFT */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* UPLOAD GATEWAY */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={handleOpenUpload}
              className="group relative border border-white/[0.08] hover:border-white/[0.15] rounded-3xl p-8 bg-white/[0.02] backdrop-blur-3xl shadow-2xl cursor-pointer overflow-hidden flex flex-col justify-between min-h-[260px] transition-colors duration-300"
            >
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-indigo-500/5 rounded-full blur-[60px] group-hover:bg-indigo-500/10 transition-all duration-500 pointer-events-none" />

              <div className="space-y-5">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 group-hover:scale-105 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <div className="space-y-2 text-left">
                  <h3 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    Upload & Score
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-zinc-500" />
                  </h3>
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-medium">
                    Upload your existing resume. We'll read it, score it against
                    a job description, and show you what to improve.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-6 mt-auto">
                <Badge className="bg-white/[0.03] text-zinc-400 hover:bg-white/[0.05] border-white/[0.06] rounded-lg px-2.5 py-0.5 text-[10px] font-bold select-none">
                  PDF / DOCX
                </Badge>
                <Badge className="bg-white/[0.03] text-zinc-400 hover:bg-white/[0.05] border-white/[0.06] rounded-lg px-2.5 py-0.5 text-[10px] font-bold select-none">
                  ATS Score
                </Badge>
              </div>
            </motion.div>

            {/* BUILDER GATEWAY */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={handleCreateNew}
              className="group relative border border-white/[0.08] hover:border-white/[0.15] rounded-3xl p-8 bg-white/[0.02] backdrop-blur-3xl shadow-2xl cursor-pointer overflow-hidden flex flex-col justify-between min-h-[260px] transition-colors duration-300"
            >
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/5 rounded-full blur-[60px] group-hover:bg-emerald-500/10 transition-all duration-500 pointer-events-none" />

              <div className="space-y-5">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 group-hover:scale-105 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all duration-300">
                  <Plus className="w-6 h-6" />
                </div>

                <div className="space-y-2 text-left">
                  <h3 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    Build from Template
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-zinc-500" />
                  </h3>
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-medium">
                    Start from a clean template, fill in your details, and
                    download a polished PDF ready for job applications.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-6 mt-auto">
                <Badge className="bg-white/[0.03] text-zinc-400 hover:bg-white/[0.05] border-white/[0.06] rounded-lg px-2.5 py-0.5 text-[10px] font-bold select-none">
                  Ready-made Layouts
                </Badge>
                <Badge className="bg-white/[0.03] text-zinc-400 hover:bg-white/[0.05] border-white/[0.06] rounded-lg px-2.5 py-0.5 text-[10px] font-bold select-none">
                  PDF Export
                </Badge>
              </div>
            </motion.div>
          </div>
        )}

        {/* SECONDARY Fresh-Start Gateways (shown only when active draft exists to let them start a new draft) */}
        {hasActiveDraft && (
          <div className="space-y-4 text-left pt-6 border-t border-white/[0.04]">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 select-none">
                Create New Workspace Draft
              </h3>
              <p className="text-[11px] text-zinc-600 mt-0.5 font-semibold">
                Start fresh with another document. Your current active draft
                will be safely backed up.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleOpenUpload}
                className="flex items-center justify-between text-xs text-zinc-400 hover:text-white bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] hover:border-white/[0.08] rounded-xl px-4 py-3 text-left transition-all group"
              >
                <span className="font-bold flex items-center gap-2">
                  <UploadCloud className="w-3.5 h-3.5 text-indigo-400" /> Upload
                  new resume to optimize
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
              </button>
              <button
                onClick={handleCreateNew}
                className="flex items-center justify-between text-xs text-zinc-400 hover:text-white bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] hover:border-white/[0.08] rounded-xl px-4 py-3 text-left transition-all group"
              >
                <span className="font-bold flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-emerald-400" /> Select
                  layout to build new draft
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* SNAPSHOT ARCHIVES / VAULT CONTAINER */}
        <div className="space-y-6 pt-4 border-t border-white/[0.04]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <History className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2.5">
                  Saved Versions
                  <Badge className="bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 border border-purple-500/10 font-mono text-[9px] rounded-full px-2 py-0">
                    45 days
                  </Badge>
                </h2>
                <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1.5 select-none font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 opacity-80 text-zinc-400" />
                  Your data is encrypted.
                </p>
              </div>
            </div>

            {/* Multi-Mode Segmented Control Vault Selector */}
            <div className="flex bg-zinc-950 border border-white/[0.05] p-1 rounded-2xl shrink-0 self-start sm:self-center shadow-2xl">
              <button
                onClick={() => setWorkspaceMode("template")}
                className={`px-4 sm:px-5 py-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-2 ${
                  workspaceMode === "template"
                    ? "bg-white text-black shadow-lg scale-[1.02]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                Template drafts
              </button>
              <button
                onClick={() => setWorkspaceMode("upload")}
                className={`px-4 sm:px-5 py-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-2 ${
                  workspaceMode === "upload"
                    ? "bg-white text-black shadow-lg scale-[1.02]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                }`}
              >
                <UploadCloud className="w-3 h-3" />
                Uploaded Resume Drafts
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-[140px] rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse"
                />
              ))}
            </div>
          ) : revisionHistory.length === 0 ? (
            <div className="text-center py-14 border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.01] backdrop-blur-sm">
              <div className="w-10 h-10 bg-white/[0.03] border border-white/[0.08] rounded-xl mx-auto flex items-center justify-center mb-4 text-zinc-500">
                <History className="w-5 h-5 opacity-70" />
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm font-bold tracking-tight">
                No saved versions yet
              </p>
              <p className="text-zinc-500 text-[11px] mt-1.5 max-w-xs mx-auto font-medium">
                Save a version while editing and it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {revisionHistory.map((rev) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={rev.id}
                  className="group border border-white/[0.06] hover:border-white/[0.12] bg-white/[0.01] hover:bg-white/[0.02] p-5 rounded-2xl transition-all duration-300 relative flex flex-col justify-between gap-4 min-h-[140px] overflow-hidden"
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSnapshot(rev.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-2.5 text-left pr-6">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400/50" />
                      <span className="text-[9px] tracking-[0.15em] font-black uppercase text-zinc-500 font-mono">
                        REVISION
                      </span>
                    </div>

                    <h4 className="font-bold text-zinc-200 line-clamp-1 text-sm group-hover:text-white transition-colors tracking-tight">
                      {rev.name}
                    </h4>

                    <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium font-mono">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(rev.saved_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        •{" "}
                        {new Date(rev.saved_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.04] mt-1 select-none">
                    <div className="text-left space-y-0.5 min-w-0 flex-1 pr-2">
                      <span className="text-[8px] text-zinc-500 block tracking-[0.1em] font-black uppercase font-mono">
                        NAME
                      </span>
                      <span className="text-xs text-zinc-400 font-bold tracking-tight line-clamp-1">
                        {rev.resume.personal_info?.name || "Untitled"}
                      </span>
                    </div>

                    <Button
                      onClick={() => handleRestore(rev.id)}
                      size="sm"
                      className="bg-white/[0.03] border border-white/[0.08] hover:bg-white hover:text-black hover:border-transparent text-zinc-300 font-bold h-7.5 px-3 rounded-lg text-[11px] gap-1 shadow-sm transition-all duration-200"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={isPurgeDialogOpen} onOpenChange={setIsPurgeDialogOpen}>
        <AlertDialogContent className="bg-[#0c0c0e] border border-white/[0.08] rounded-3xl max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <AlertDialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-white">
              Delete This Workspace?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-sm leading-relaxed font-medium">
              This will permanently delete your{" "}
              <span className="text-white font-bold tracking-tight">
                {workspaceMode === "upload"
                  ? "Upload & Score"
                  : "Template Builder"}
              </span>{" "}
              workspace and all saved versions in it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3 flex-col sm:flex-row">
            <AlertDialogCancel className="bg-transparent border border-white/[0.08] text-zinc-400 hover:bg-white/[0.03] hover:text-white rounded-xl font-bold text-xs px-5 py-2 h-10 transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={purgeWorkspace}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs px-5 py-2 h-10 transition-all border-none shadow-lg flex items-center gap-1.5 justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
