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
    <div className="w-full py-6 px-2 sm:px-4 lg:px-6 selection:bg-white/10">
      {/* HERO HEADER OUTSIDE CARD */}
      <div className="flex flex-col gap-4 mb-10 animate-in fade-in slide-in-from-top-4 duration-500 text-left max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("/dashboard/resume")}
            className="h-8 w-8 rounded-full bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.08] shrink-0 shadow-sm"
            title="Back to Portal"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase flex items-center select-none">
            RESUME INTELLIGENCE{" "}
            <span className="mx-2 opacity-50 text-[8px]">•</span> INGESTION
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] flex flex-col gap-1 text-white">
          <span>Scan Existing Profile.</span>
          <span className="text-zinc-700">Extract Neural ATS Score.</span>
        </h1>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
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
              <div className="border border-zinc-800/80 rounded-3xl p-6 bg-zinc-900/20 backdrop-blur-xl relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
                  <Label className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                    <Target className="w-4 h-4 text-white" />
                    Target Job Description
                  </Label>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold uppercase tracking-wider select-none">
                    Recommended
                  </span>
                </div>

                <Textarea
                  placeholder="Paste the complete text of your target job listing here. Our scanner cross-references this listing to yield exact ATS-match percentages and missing keyword lists."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[160px] bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 focus:ring-1 focus:ring-white/40 focus:border-white/40 text-sm text-white resize-none rounded-2xl p-4 leading-relaxed placeholder:text-zinc-600 transition-all duration-200"
                />
                <p className="text-[11px] text-zinc-500 tracking-wide">
                  We utilize high-fidelity semantic comparison. Paste as much
                  description text as possible for the best results.
                </p>
              </div>

              {/* FILE UPLOAD ZONE */}
              <div className="relative border-2 border-dashed border-zinc-800 hover:border-white/40 rounded-3xl p-12 bg-zinc-950/20 hover:bg-zinc-900/10 transition-all duration-300 group text-center flex flex-col items-center cursor-pointer overflow-hidden">
                <div className="w-16 h-16 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:scale-105 transition-all shadow-xl mb-6 group-hover:border-zinc-700">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-bold text-zinc-200 mb-2">
                  Upload Document Container
                </h3>
                <p className="text-zinc-500 text-xs max-w-xs mx-auto leading-relaxed mb-8">
                  Select a PDF, DOCX, or Markdown file. Limits: 5MB. Highly
                  structured elements parse best.
                </p>

                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileSelection}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />

                <Button className="bg-white hover:bg-zinc-200 text-black px-8 rounded-xl font-bold h-11 relative z-0 transition-all duration-300 shadow-sm tracking-tight">
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
              className="border border-zinc-800 rounded-3xl p-12 bg-zinc-950/50 backdrop-blur-xl flex flex-col items-center text-center space-y-8 relative overflow-hidden min-h-[380px] justify-center shadow-2xl"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl border border-zinc-800 bg-zinc-900 flex items-center justify-center relative z-10 shadow-xl">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
              </div>

              <div className="space-y-3 max-w-sm relative z-10">
                <motion.h3
                  key={processStep}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-extrabold text-white uppercase tracking-widest"
                >
                  {processStep === "reading" && "Reading Payload"}
                  {processStep === "parsing" && "Extracting Nodes"}
                  {processStep === "scoring" && "Evaluating Profile"}
                  {processStep === "done" && "Finalizing Draft"}
                </motion.h3>
                <p className="text-zinc-400 text-sm min-h-[40px] tracking-wide">
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
                            ? "bg-zinc-400 scale-100"
                            : isActive
                              ? "bg-white animate-pulse scale-125 ring-4 ring-white/10"
                              : "bg-zinc-800 scale-90"
                        }`}
                      />
                      {i < 2 && (
                        <div
                          className={`h-0.5 w-12 transition-all duration-500 ${currentIdx > targetIdx ? "bg-zinc-500" : "bg-zinc-800"}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {fileName && (
                <div className="text-[11px] px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center gap-1.5 select-none shadow-lg font-mono">
                  <FileText className="w-3.5 h-3.5 text-zinc-300" />
                  {fileName}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
