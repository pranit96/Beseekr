import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useResume } from "@/contexts/ResumeContext";
import { resumeApi } from "@/api/resume";
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Sparkles,
  Target,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function ResumeUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    setResumeData,
    jobDescription,
    setJobDescription,
    setAtsReport,
    saveActiveDraft,
  } = useResume();

  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<
    "reading" | "parsing" | "scoring" | "done"
  >("reading");
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileSelection = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setProcessStep("reading");

    try {
      // Delay slightly for animation UX
      await new Promise((r) => setTimeout(r, 800));
      setProcessStep("parsing");

      // 1. Trigger parser
      const parsed = await resumeApi.uploadAndParseResume(file);
      setResumeData(parsed);

      // 2. If job description present, run score
      if (jobDescription && jobDescription.trim().length > 20) {
        setProcessStep("scoring");
        try {
          const scoreResult = await resumeApi.scoreResume(
            parsed,
            jobDescription,
          );
          setAtsReport(scoreResult);
        } catch (scoreErr) {
          console.error("[Upload] Scoring error:", scoreErr);
          // Fail score silently to ensure user lands in workspace
        }
      }

      setProcessStep("done");

      // Persist parsed data immediately to backend
      await saveActiveDraft(parsed, jobDescription);

      await new Promise((r) => setTimeout(r, 600));

      toast({
        title: "Extraction Complete ✅",
        description:
          "Successfully parsed structure and synchronized with cloud vault.",
      });

      navigate("/dashboard/resume/workspace");
    } catch (err: any) {
      setIsProcessing(false);
      setFileName(null);
      toast({
        title: "Parsing Refused",
        description:
          err.message ||
          "Check file permissions and guarantee standard PDF/DOCX format.",
        variant: "destructive",
      });
    }
  };

  const stepMessages = {
    reading: "Mounting binary blobs and decoding strings...",
    parsing: "Orchestrating LLM context mapping...",
    scoring: "Computing ATS-compatibility matching profiles...",
    done: "Syncing structures to draft container...",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#030712] text-slate-100 pb-12 px-4 sm:px-6 lg:px-8 pt-6"
    >
      <div className="max-w-3xl mx-auto space-y-8">
        {/* CONTROL BAR */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 h-10 w-10"
            onClick={() => navigate("/dashboard/resume")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">
              Scan Existing Resume
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Upload an existing layout to initiate neural score extraction.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isProcessing ? (
            <motion.div
              key="upload-form"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* TARGET JOB DESCRIPTION BLOCK */}
              <div className="border border-slate-800 rounded-3xl p-6 bg-slate-900/20 backdrop-blur-xl relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                  <Label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-400" />
                    Target Job Description
                  </Label>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold uppercase tracking-wider">
                    Highly Recommended
                  </span>
                </div>

                <Textarea
                  placeholder="Paste the complete text of your target job listing here. Our scanner cross-references this listing to yield exact ATS-match percentages and missing keyword lists."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[160px] bg-slate-950/40 border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-sm text-slate-100 resize-none rounded-2xl p-4 leading-relaxed placeholder:text-slate-600 transition-all"
                />
                <p className="text-[11px] text-slate-500">
                  We utilize high-fidelity semantic comparison. Paste as much
                  description text as possible for the best results.
                </p>
              </div>

              {/* FILE UPLOAD ZONE */}
              <div className="relative border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-3xl p-12 bg-slate-900/10 hover:bg-indigo-500/[0.01] transition-all group text-center flex flex-col items-center cursor-pointer overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[80px] bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />

                <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:scale-105 transition-all shadow-xl mb-6 group-hover:border-indigo-500/30">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-bold text-slate-200 mb-2">
                  Upload Document Container
                </h3>
                <p className="text-slate-500 text-xs max-w-xs mx-auto leading-relaxed mb-8">
                  Select a PDF, DOCX, or Markdown file. Limits: 5MB. Highly
                  structured elements parse best.
                </p>

                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileSelection}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />

                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-xl font-bold h-11 relative z-0 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  Select Document
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="processing-animations"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="border border-slate-800 rounded-3xl p-12 bg-slate-900/20 backdrop-blur-xl flex flex-col items-center text-center space-y-8 relative overflow-hidden min-h-[380px] justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.02] to-transparent pointer-events-none" />

              <div className="relative">
                <div className="w-24 h-24 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 flex items-center justify-center relative z-10">
                  <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                </div>
                <motion.div
                  initial={{ opacity: 0.3, scale: 0.8 }}
                  animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.5,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl z-0"
                />
              </div>

              <div className="space-y-3 max-w-sm relative z-10">
                <motion.h3
                  key={processStep}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-extrabold text-slate-100 uppercase tracking-wide"
                >
                  {processStep === "reading" && "Reading Payload"}
                  {processStep === "parsing" && "Extracting Nodes"}
                  {processStep === "scoring" && "Evaluating Profile"}
                  {processStep === "done" && "Finalizing Draft"}
                </motion.h3>
                <p className="text-slate-400 text-sm min-h-[40px]">
                  {stepMessages[processStep]}
                </p>
              </div>

              {/* STEP TRACKER TIMELINE */}
              <div className="flex items-center justify-between w-full max-w-xs relative z-10">
                {["reading", "parsing", "scoring"].map((st, i) => {
                  const indexMap = {
                    reading: 0,
                    parsing: 1,
                    scoring: 2,
                    done: 3,
                  };
                  const currentIdx = indexMap[processStep];
                  const targetIdx = indexMap[st as keyof typeof indexMap];
                  const isDone = currentIdx > targetIdx;
                  const isActive = currentIdx === targetIdx;

                  return (
                    <div key={st} className="flex items-center gap-1">
                      <div
                        className={`h-2 w-2 rounded-full transition-all duration-500 ${
                          isDone
                            ? "bg-indigo-400 scale-100"
                            : isActive
                              ? "bg-indigo-500 animate-pulse scale-125 ring-4 ring-indigo-500/20"
                              : "bg-slate-800 scale-90"
                        }`}
                      />
                      {i < 2 && (
                        <div
                          className={`h-0.5 w-12 transition-all duration-500 ${currentIdx > targetIdx ? "bg-indigo-500/40" : "bg-slate-900"}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {fileName && (
                <div className="text-[11px] px-3 py-1 rounded-full bg-slate-950/50 border border-slate-800 text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  {fileName}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
