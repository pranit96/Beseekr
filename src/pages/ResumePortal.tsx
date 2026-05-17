import { useState, useEffect } from "react";
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
  Compass,
  Zap,
  Building2,
  GraduationCap,
  Layers,
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
import { resumeApi, ResumeSchema } from "@/api/resume";

export default function ResumePortal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    revisionHistory,
    isLoading: isGlobalLoading,
    restoreSnapshot,
    deleteSnapshot,
    workspaceMode,
    setWorkspaceMode,
    resetWorkspace,
  } = useResume();

  const [templateDraft, setTemplateDraft] = useState<{
    resume_data: ResumeSchema;
    job_description: string;
  } | null>(null);
  
  const [uploadDraft, setUploadDraft] = useState<{
    resume_data: ResumeSchema;
    job_description: string;
  } | null>(null);
  
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);
  const [purgeTargetMode, setPurgeTargetMode] = useState<"template" | "upload" | null>(null);
  const [isPurgeDialogOpen, setIsPurgeDialogOpen] = useState(false);

  // Load both workspaces on mount
  const loadWorkspaces = async () => {
    setIsWorkspaceLoading(true);
    try {
      const [tDraft, uDraft] = await Promise.all([
        resumeApi.getResumeDraft("template"),
        resumeApi.getResumeDraft("upload"),
      ]);
      setTemplateDraft(tDraft);
      setUploadDraft(uDraft);
    } catch (err) {
      console.error("Failed to fetch workspaces:", err);
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const hasUploadDraft =
    uploadDraft &&
    uploadDraft.resume_data &&
    (uploadDraft.resume_data.personal_info?.name ||
      uploadDraft.resume_data.experience?.length > 0 ||
      uploadDraft.resume_data.skills?.flatMap((s) => s.items || []).length > 0);

  const hasTemplateDraft =
    templateDraft &&
    templateDraft.resume_data &&
    (templateDraft.resume_data.personal_info?.name ||
      templateDraft.resume_data.experience?.length > 0 ||
      templateDraft.resume_data.skills?.flatMap((s) => s.items || []).length > 0);

  const openWorkspace = (mode: "template" | "upload", action: "edit" | "create") => {
    setWorkspaceMode(mode);
    if (action === "create" && mode === "template") {
      resetWorkspace();
      navigate("/dashboard/hired/resume/templates");
    } else if (action === "create" && mode === "upload") {
      resetWorkspace();
      navigate("/dashboard/hired/resume/upload");
    } else {
      navigate("/dashboard/hired/resume/workspace");
    }
  };

  const confirmPurgeWorkspace = (mode: "template" | "upload") => {
    setPurgeTargetMode(mode);
    setIsPurgeDialogOpen(true);
  };

  const handlePurgeWorkspace = async () => {
    if (!purgeTargetMode) return;
    setIsWorkspaceLoading(true);
    try {
      await resumeApi.purgeResumeDraft(purgeTargetMode);
      if (purgeTargetMode === "template") {
        setTemplateDraft(null);
      } else {
        setUploadDraft(null);
      }
      
      // If current active context mode matches, reset it too
      if (workspaceMode === purgeTargetMode) {
        resetWorkspace();
      }
      
      toast({
        title: "Workspace Purged",
        description: `Successfully wiped the ${
          purgeTargetMode === "template" ? "AI Template Builder" : "Upload & Score"
        } workspace.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to Purge",
        description: "An error occurred while clearing your workspace.",
      });
    } finally {
      setIsWorkspaceLoading(false);
      setIsPurgeDialogOpen(false);
      setPurgeTargetMode(null);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreSnapshot(id);
      navigate("/dashboard/hired/resume/workspace");
      toast({
        title: "Version Restored",
        description: "Successfully synchronized active workspace draft with target snapshot.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Restoration Failed",
        description: error.message || "Could not recover the archived snapshot.",
      });
    }
  };

  return (
    <div className="w-full text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
        
        {/* HERO HEADER */}
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase flex items-center select-none">
              GET HIRED <span className="mx-2 opacity-50 text-[8px]">•</span> RESUME INTELLIGENCE
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] flex flex-col gap-1">
                <span className="text-white">Resume Intelligence</span>
                <span className="text-zinc-600 text-lg sm:text-2xl font-bold mt-2">
                  Build and score your resumes in two dedicated, secure workspaces.
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* ROADMAP / COMPASS CONTAINER */}
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
                desc: "Upload existing resume or select a premium design template.",
                active: true,
                completed: !!(hasUploadDraft || hasTemplateDraft),
              },
              {
                step: "2",
                title: "Draft & Calibrate",
                desc: "Optimize content blocks, achievements, and technical stack.",
                active: !!(hasUploadDraft || hasTemplateDraft),
                completed: !!(
                  (uploadDraft?.resume_data?.experience?.length) ||
                  (templateDraft?.resume_data?.experience?.length)
                ),
              },
              {
                step: "3",
                title: "Paste Target JD",
                desc: "Paste your target job description to match keywords.",
                active: !!(hasUploadDraft || hasTemplateDraft),
                completed: !!(uploadDraft?.job_description || templateDraft?.job_description),
              },
              {
                step: "4",
                title: "AI ATS Audit",
                desc: "Trigger high-performance ATS scoring and review gaps.",
                active: !!(uploadDraft?.job_description || templateDraft?.job_description),
                completed: false, // interactive score
              },
              {
                step: "5",
                title: "Download PDF",
                desc: "Download high-fidelity formatted PDF ready to send.",
                active: false,
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
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
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

        {/* WORKSPACE SELECTION PILLARS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* UPLOAD & SCORE WORKSPACE CARD */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="group relative border border-white/[0.07] hover:border-indigo-500/30 rounded-3xl p-6 sm:p-8 bg-[#0b0b12]/60 backdrop-blur-3xl shadow-2xl overflow-hidden flex flex-col justify-between min-h-[360px] text-left transition-colors duration-300"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.02] rounded-full blur-[80px] group-hover:bg-indigo-500/[0.04] transition-all duration-500 pointer-events-none" />
            <div className="absolute top-0 left-0 bottom-0 w-[4px] bg-indigo-500/40 rounded-l-3xl" />
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest font-mono">
                  ATS Calibrator
                </Badge>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Upload & Score Workspace
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-medium">
                  Upload your existing PDF or Word resume. Run automated keywords audits, verify ATS compatibility, and refine against target JDs.
                </p>
              </div>

              {/* Status Info Block */}
              <div className="pt-2 border-t border-white/[0.04]">
                {isWorkspaceLoading ? (
                  <div className="h-20 bg-white/[0.02] rounded-xl animate-pulse" />
                ) : hasUploadDraft ? (
                  <div className="bg-white/[0.01] border border-white/[0.04] p-4 rounded-2xl space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black text-white leading-tight">
                          {uploadDraft?.resume_data?.personal_info?.name || "Anonymous Candidate"}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-semibold truncate mt-0.5 max-w-[180px] sm:max-w-none">
                          {uploadDraft?.resume_data?.personal_info?.email || "No email mapped"}
                        </p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-white/[0.03] border border-white/[0.07] px-2 py-0.5 rounded font-mono">
                        Active Slot
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-white/[0.02] border border-white/[0.06] px-3 py-2 rounded-xl text-left">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Experiences</span>
                        <span className="text-xs font-bold text-zinc-300">{uploadDraft?.resume_data?.experience?.length || 0} Entries</span>
                      </div>
                      <div className="bg-white/[0.02] border border-white/[0.06] px-3 py-2 rounded-xl text-left">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Skills Mapped</span>
                        <span className="text-xs font-bold text-zinc-300">
                          {uploadDraft?.resume_data?.skills?.flatMap((s) => s.items || []).length || 0} Skills
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 border border-dashed border-white/[0.06] rounded-2xl bg-white/[0.01] text-center">
                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">No Active Upload Draft</p>
                    <p className="text-[10px] text-zinc-600 font-semibold mt-0.5 max-w-[240px] mx-auto">
                      Import your resume to benchmark ATS gaps.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between gap-4 pt-6 border-t border-white/[0.04] mt-6">
              {hasUploadDraft ? (
                <>
                  <Button
                    onClick={() => confirmPurgeWorkspace("upload")}
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold h-9.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Wipe
                  </Button>
                  <Button
                    onClick={() => openWorkspace("upload", "edit")}
                    className="bg-white text-black hover:bg-zinc-200 font-extrabold h-9.5 px-5 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all shadow-md"
                  >
                    <span>Launch Editor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => openWorkspace("upload", "create")}
                  className="w-full bg-white text-black hover:bg-zinc-200 font-extrabold h-10 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload & Score Resume</span>
                </Button>
              )}
            </div>
          </motion.div>

          {/* TEMPLATE BUILDER WORKSPACE CARD */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="group relative border border-white/[0.07] hover:border-emerald-500/30 rounded-3xl p-6 sm:p-8 bg-[#0b0b12]/60 backdrop-blur-3xl shadow-2xl overflow-hidden flex flex-col justify-between min-h-[360px] text-left transition-colors duration-300"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.015] rounded-full blur-[80px] group-hover:bg-emerald-500/[0.03] transition-all duration-500 pointer-events-none" />
            <div className="absolute top-0 left-0 bottom-0 w-[4px] bg-emerald-500/40 rounded-l-3xl" />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all duration-300">
                  <Sparkles className="w-6 h-6" />
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest font-mono">
                  AI Premium Builder
                </Badge>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Template Builder Workspace
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-medium">
                  Build a premium resume from scratch. Pick a design template, add sections with real-time AI styling assistance, and export a high-fidelity PDF.
                </p>
              </div>

              {/* Status Info Block */}
              <div className="pt-2 border-t border-white/[0.04]">
                {isWorkspaceLoading ? (
                  <div className="h-20 bg-white/[0.02] rounded-xl animate-pulse" />
                ) : hasTemplateDraft ? (
                  <div className="bg-white/[0.01] border border-white/[0.04] p-4 rounded-2xl space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black text-white leading-tight">
                          {templateDraft?.resume_data?.personal_info?.name || "Anonymous Candidate"}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-semibold truncate mt-0.5 max-w-[180px] sm:max-w-none">
                          {templateDraft?.resume_data?.personal_info?.email || "No email mapped"}
                        </p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-white/[0.03] border border-white/[0.07] px-2 py-0.5 rounded font-mono">
                        Active Slot
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-white/[0.02] border border-white/[0.06] px-3 py-2 rounded-xl text-left">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Experiences</span>
                        <span className="text-xs font-bold text-zinc-300">{templateDraft?.resume_data?.experience?.length || 0} Entries</span>
                      </div>
                      <div className="bg-white/[0.02] border border-white/[0.06] px-3 py-2 rounded-xl text-left">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Skills Mapped</span>
                        <span className="text-xs font-bold text-zinc-300">
                          {templateDraft?.resume_data?.skills?.flatMap((s) => s.items || []).length || 0} Skills
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 border border-dashed border-white/[0.06] rounded-2xl bg-white/[0.01] text-center">
                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">No Active Template Draft</p>
                    <p className="text-[10px] text-zinc-600 font-semibold mt-0.5 max-w-[240px] mx-auto">
                      Build your profile using designer layouts.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between gap-4 pt-6 border-t border-white/[0.04] mt-6">
              {hasTemplateDraft ? (
                <>
                  <Button
                    onClick={() => confirmPurgeWorkspace("template")}
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold h-9.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Wipe
                  </Button>
                  <Button
                    onClick={() => openWorkspace("template", "edit")}
                    className="bg-white text-black hover:bg-zinc-200 font-extrabold h-9.5 px-5 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all shadow-md"
                  >
                    <span>Launch Editor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => openWorkspace("template", "create")}
                  className="w-full bg-white text-black hover:bg-zinc-200 font-extrabold h-10 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create from Template</span>
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* REVISION VAULT ARCHIVES */}
        <div className="space-y-6 pt-4 border-t border-white/[0.04] text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <History className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2.5">
                  Saved Versions Vault
                  <Badge className="bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 border border-purple-500/10 font-mono text-[9px] rounded-full px-2 py-0">
                    45 days
                  </Badge>
                </h2>
                <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1.5 select-none font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 opacity-80 text-zinc-400" />
                  All revision checkpoints are encrypted.
                </p>
              </div>
            </div>

            {/* Segmented Controller for Vault Filter */}
            <div className="flex bg-zinc-950 border border-white/[0.05] p-1 rounded-2xl shrink-0 self-start sm:self-center shadow-2xl">
              <button
                onClick={() => setWorkspaceMode("template")}
                className={`px-4 sm:px-5 py-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer ${
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
                className={`px-4 sm:px-5 py-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  workspaceMode === "upload"
                    ? "bg-white text-black shadow-lg scale-[1.02]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                }`}
              >
                <UploadCloud className="w-3 h-3" />
                Uploaded drafts
              </button>
            </div>
          </div>

          {isGlobalLoading ? (
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
                No archived checkpoints yet
              </p>
              <p className="text-zinc-500 text-[11px] mt-1.5 max-w-xs mx-auto font-medium">
                Save manual checkpoints inside the workspace editor, and they will securely archive here.
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
                      className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-all cursor-pointer"
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
                        CHECKPOINT
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
                        CANDIDATE
                      </span>
                      <span className="text-xs text-zinc-400 font-bold tracking-tight line-clamp-1">
                        {rev.resume.personal_info?.name || "Untitled"}
                      </span>
                    </div>

                    <Button
                      onClick={() => handleRestore(rev.id)}
                      size="sm"
                      className="bg-white/[0.03] border border-white/[0.08] hover:bg-white hover:text-black hover:border-transparent text-zinc-300 font-bold h-7.5 px-3 rounded-lg text-[11px] gap-1 shadow-sm transition-all duration-200 cursor-pointer"
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
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-white text-left">
              Delete This Workspace?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-sm leading-relaxed font-medium text-left">
              This will permanently delete your{" "}
              <span className="text-white font-bold tracking-tight">
                {purgeTargetMode === "upload" ? "Upload & Score" : "Template Builder"}
              </span>{" "}
              workspace and all saved versions in it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3 flex flex-col sm:flex-row sm:justify-end">
            <AlertDialogCancel className="bg-transparent border border-white/[0.08] text-zinc-400 hover:bg-white/[0.03] hover:text-white rounded-xl font-bold text-xs px-5 py-2 h-10 transition-all cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurgeWorkspace}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs px-5 py-2 h-10 transition-all border-none shadow-lg flex items-center gap-1.5 justify-center cursor-pointer"
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
