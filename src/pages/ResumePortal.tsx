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
  } = useResume();

  const handlePurgeWorkspace = () => {
    setIsPurgeDialogOpen(true);
  };

  const hasActiveDraft =
    resumeData.personal_info?.name || resumeData.experience?.length > 0;

  const handleOpenUpload = () => {
    setWorkspaceMode("upload");
    navigate("/dashboard/resume/upload");
  };

  const handleCreateNew = () => {
    setWorkspaceMode("template");
    resetWorkspace();
    navigate("/dashboard/resume/build");
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreSnapshot(id);
      navigate("/dashboard/resume/workspace");
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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
        {/* HERO & CONTROL HEADER */}
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase flex items-center select-none">
              RESUME INTELLIGENCE{" "}
              <span className="mx-2 opacity-50 text-[8px]">•</span> VAULT PORTAL
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] flex flex-col gap-1">
              <span className="text-white">Precision Vault.</span>
              <span className="text-zinc-700">
                Access. Optimize. Accelerate.
              </span>
            </h1>

            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] px-3 py-1.5 rounded-full text-zinc-400 text-xs shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>ATS-Grade Intelligence v3.0</span>
            </div>
          </div>
        </div>

        {/* PRIMARY ACTION GATEWAY (DOCK GRID) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* UPLOAD GATEWAY */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={handleOpenUpload}
            className="group relative border border-white/[0.08] hover:border-white/[0.15] rounded-3xl p-8 bg-white/[0.02] backdrop-blur-3xl shadow-2xl cursor-pointer overflow-hidden flex flex-col justify-between min-h-[260px] transition-colors duration-300"
          >
            {/* Soft Glow Top-Right */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-indigo-500/5 rounded-full blur-[60px] group-hover:bg-indigo-500/10 transition-all duration-500 pointer-events-none" />

            <div className="space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 group-hover:scale-105 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300">
                <UploadCloud className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                  Scan & Score
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-zinc-500" />
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-medium">
                  Import an existing resume. Our algorithm breaks down
                  hierarchy, verifies standard compliance, and generates
                  optimization routes for target jobs.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-6 mt-auto">
              <Badge className="bg-white/[0.03] text-zinc-400 hover:bg-white/[0.05] border-white/[0.06] rounded-lg px-2.5 py-0.5 text-[10px] font-bold select-none">
                PDF / DOCX Ingestion
              </Badge>
              <Badge className="bg-white/[0.03] text-zinc-400 hover:bg-white/[0.05] border-white/[0.06] rounded-lg px-2.5 py-0.5 text-[10px] font-bold select-none">
                Keyword Analysis
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
            {/* Soft Glow Top-Right */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/5 rounded-full blur-[60px] group-hover:bg-emerald-500/10 transition-all duration-500 pointer-events-none" />

            <div className="space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 group-hover:scale-105 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all duration-300">
                <Plus className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                  AI Template Builder
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-zinc-500" />
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-medium">
                  Launch a fresh interactive editor pre-configured with proven
                  typographic templates. Harness structured fields to generate
                  clean ATS PDF schemas.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-6 mt-auto">
              <Badge className="bg-white/[0.03] text-zinc-400 hover:bg-white/[0.05] border-white/[0.06] rounded-lg px-2.5 py-0.5 text-[10px] font-bold select-none">
                Premium Layouts
              </Badge>
              <Badge className="bg-white/[0.03] text-zinc-400 hover:bg-white/[0.05] border-white/[0.06] rounded-lg px-2.5 py-0.5 text-[10px] font-bold select-none">
                Baseline Matrix Grid
              </Badge>
            </div>
          </motion.div>
        </div>

        {/* ACTIVE WORKSPACE SENTINEL */}
        {hasActiveDraft && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative border border-white/[0.08] bg-gradient-to-r from-white/[0.01] to-transparent rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl shadow-xl group overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500/40 group-hover:bg-indigo-500 transition-all" />

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-indigo-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-left space-y-0.5">
                <h4 className="text-base font-bold text-zinc-100">
                  Active {workspaceMode === "upload" ? "Uploaded" : "Builder"}{" "}
                  Workspace
                </h4>
                <p className="text-zinc-400 text-xs flex items-center gap-1.5">
                  <Clock className="w-3 h-3 opacity-70" />
                  In flight:{" "}
                  <span className="text-zinc-200 font-semibold font-mono tracking-tight">
                    {resumeData.personal_info?.name || "Untitled Document"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
              <Button
                variant="outline"
                onClick={handlePurgeWorkspace}
                className="border-red-900/30 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold px-4 py-2 h-9 text-[11px] sm:text-xs rounded-xl shadow-2xl active:scale-[0.98] transition-all flex items-center gap-1.5 w-full sm:w-auto justify-center select-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Workspace
              </Button>

              <Button
                onClick={() => navigate("/dashboard/resume/workspace")}
                className="bg-white text-black hover:bg-zinc-200 font-bold px-5 py-2 h-9 text-[11px] sm:text-xs rounded-xl shrink-0 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all border-none flex items-center gap-1.5 w-full sm:w-auto justify-center select-none"
              >
                Continue Editing
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
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
                  Snapshot Repository
                  <Badge className="bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 border border-purple-500/10 font-mono text-[9px] rounded-full px-2 py-0">
                    45d Lifecycle
                  </Badge>
                </h2>
                <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1.5 select-none font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 opacity-80 text-zinc-400" />
                  End-to-end encryption applied.
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
                AI Builder Vault
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
                Scan & Score Vault
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
                No encrypted snapshots archived
              </p>
              <p className="text-zinc-500 text-[11px] mt-1.5 max-w-xs mx-auto font-medium">
                Snapshots created during workspace synchronization will reside
                here securely.
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
                        METADATA OWNER
                      </span>
                      <span className="text-xs text-zinc-400 font-bold tracking-tight line-clamp-1">
                        {rev.resume.personal_info?.name || "Unknown Agent"}
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
              Absolute Cloud Purge
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-sm leading-relaxed font-medium">
              This will permanently evict your active{" "}
              <span className="text-white font-bold tracking-tight">
                {workspaceMode === "upload" ? "Scan & Score" : "AI Builder"}
              </span>{" "}
              workspace container. All database pointers and snapshot logs for
              this slot will be destroyed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3 flex-col sm:flex-row">
            <AlertDialogCancel className="bg-transparent border border-white/[0.08] text-zinc-400 hover:bg-white/[0.03] hover:text-white rounded-xl font-bold text-xs px-5 py-2 h-10 transition-all">
              Cancel Sweep
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={purgeWorkspace}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs px-5 py-2 h-10 transition-all border-none shadow-lg flex items-center gap-1.5 justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Confirm Purge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
