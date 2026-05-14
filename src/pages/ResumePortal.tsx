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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function ResumePortal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    resumeData,
    revisionHistory,
    isLoading,
    restoreSnapshot,
    deleteSnapshot,
    resetWorkspace,
  } = useResume();

  const hasActiveDraft =
    resumeData.personal_info?.name || resumeData.experience?.length > 0;

  const handleCreateNew = () => {
    // Prompt if discarding current draft (simple flow for now)
    resetWorkspace();
    navigate("/dashboard/resume/build");
  };

  const handleRestore = async (id: string) => {
    await restoreSnapshot(id);
    navigate("/dashboard/resume/workspace");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen bg-[#030712] text-slate-100 pb-12 px-4 sm:px-6 lg:px-8 space-y-12 pt-6"
    >
      {/* HERO HEADER SECTION */}
      <div className="relative max-w-6xl mx-auto text-center space-y-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-[120px] pointer-events-none -top-20" />

        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-indigo-300 text-xs font-medium mb-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          ATS-Grade Intelligence v3.0
        </motion.div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-50">
          Precision{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Resume Vault
          </span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-base">
          Construct interview-winning ATS-optimized resumes or revitalize
          existing documents with tailored keyword injection.
        </p>
      </div>

      {/* PRIMARY CTA GATEWAY */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OPTION 1: UPLOAD & SCAN */}
        <motion.div
          whileHover={{ y: -5 }}
          className="group relative border border-slate-800 hover:border-indigo-500/30 rounded-3xl p-8 bg-slate-900/20 backdrop-blur-xl transition-all duration-300 overflow-hidden cursor-pointer"
          onClick={() => navigate("/dashboard/resume/upload")}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[50px] group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />

          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-all mb-6 group-hover:bg-indigo-500/20 group-hover:text-indigo-300">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-2xl font-bold tracking-tight text-slate-100 mb-2 flex items-center gap-2">
            Scan & Score
            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-indigo-400" />
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Upload your existing PDF or DOCX resume. Our AI analyzes the
            structure and delivers a target ATS match score for any job
            description instantly.
          </p>

          <div className="flex flex-wrap gap-2 mt-auto">
            <Badge
              variant="secondary"
              className="bg-slate-800/60 text-slate-300 hover:bg-slate-800/60 border border-slate-700/40"
            >
              PDF / DOCX Ingestion
            </Badge>
            <Badge
              variant="secondary"
              className="bg-slate-800/60 text-slate-300 hover:bg-slate-800/60 border border-slate-700/40"
            >
              Keyword Profiling
            </Badge>
          </div>
        </motion.div>

        {/* OPTION 2: BUILD FROM SCRATCH */}
        <motion.div
          whileHover={{ y: -5 }}
          className="group relative border border-slate-800 hover:border-emerald-500/30 rounded-3xl p-8 bg-slate-900/20 backdrop-blur-xl transition-all duration-300 overflow-hidden cursor-pointer"
          onClick={handleCreateNew}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />

          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-all mb-6 group-hover:bg-emerald-500/20 group-hover:text-emerald-300">
            <Plus className="w-7 h-7" />
          </div>

          <h3 className="text-2xl font-bold tracking-tight text-slate-100 mb-2 flex items-center gap-2">
            AI Template Builder
            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-emerald-400" />
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Launch our structured editor with high-performing preset layouts.
            Effortlessly write bullet points backed by real-time LLM
            suggestions.
          </p>

          <div className="flex flex-wrap gap-2 mt-auto">
            <Badge
              variant="secondary"
              className="bg-slate-800/60 text-slate-300 hover:bg-slate-800/60 border border-slate-700/40"
            >
              Professional Presets
            </Badge>
            <Badge
              variant="secondary"
              className="bg-slate-800/60 text-slate-300 hover:bg-slate-800/60 border border-slate-700/40"
            >
              Typographic Grid
            </Badge>
          </div>
        </motion.div>
      </div>

      {/* ACTIVE DRAFT QUICK CONTINUE */}
      {hasActiveDraft && !isLoading && (
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative border border-slate-800 bg-slate-900/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md overflow-hidden shadow-2xl"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-lg border border-indigo-500/10">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 className="text-lg font-bold text-slate-100">
                  Active Draft Detected
                </h4>
                <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5" /> Currently working on:{" "}
                  <span className="text-indigo-300 font-semibold">
                    {resumeData.personal_info?.name || "Untitled"}
                  </span>
                </p>
              </div>
            </div>

            <Button
              onClick={() => navigate("/dashboard/resume/workspace")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 gap-2"
            >
              Continue in Workspace
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      )}

      {/* REVISION HISTORY / VAULT SECTION */}
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800/40 rounded-xl border border-slate-700/50">
              <History className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                Revision Vault
                <Badge className="bg-purple-500/10 hover:bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">
                  45-Day Lifespan
                </Badge>
              </h2>
              <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                Encrypted PII. Auto-purges stale versions after 45 days of
                inactivity.
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[160px] rounded-2xl bg-slate-900/30 border border-slate-800/50 animate-pulse"
              />
            ))}
          </div>
        ) : revisionHistory.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            <div className="w-12 h-12 bg-slate-800/50 border border-slate-700/30 rounded-full mx-auto flex items-center justify-center mb-3 text-slate-500">
              <History className="w-6 h-6" />
            </div>
            <p className="text-slate-400 text-sm font-medium">
              No archived revisions found
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Versions you explicitly snapshot will show up here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {revisionHistory.map((rev) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={rev.id}
                className="group border border-slate-800 hover:border-purple-500/20 bg-slate-900/30 p-5 rounded-2xl transition-all duration-300 relative overflow-hidden backdrop-blur-sm"
              >
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSnapshot(rev.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-col h-full justify-between gap-4">
                  <div className="space-y-2">
                    <Badge
                      variant="outline"
                      className="bg-purple-500/5 text-purple-300 border-purple-500/20 text-[10px]"
                    >
                      SNAPSHOT
                    </Badge>
                    <h4 className="font-bold text-slate-200 line-clamp-1 text-sm group-hover:text-purple-300 transition-colors pr-6">
                      {rev.name}
                    </h4>
                    <p className="text-slate-500 text-xs flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(rev.saved_at).toLocaleDateString()} at{" "}
                      {new Date(rev.saved_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 mt-2">
                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 block">
                        OWNER
                      </span>
                      <span className="text-xs text-slate-300 font-medium line-clamp-1">
                        {rev.resume.personal_info?.name || "Unknown"}
                      </span>
                    </div>

                    <Button
                      onClick={() => handleRestore(rev.id)}
                      size="sm"
                      className="bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white h-8 gap-1 rounded-lg text-xs border border-slate-700/50 hover:border-purple-500/20 shadow-sm transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
