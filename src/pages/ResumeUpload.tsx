import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useResume } from "@/contexts/ResumeContext";
import { resumeApi } from "@/api/resume";
import {
  ArrowLeft,
  Upload,
  FileText,
  File,
  Check,
  Loader2,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UploadPhase = "idle" | "uploading" | "parsing" | "success" | "error";

const FILE_TYPE_META: Record<string, { label: string; color: string }> = {
  "application/pdf": { label: "PDF", color: "text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { label: "DOCX", color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20" },
  "application/msword": { label: "DOC", color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20" },
  "text/plain": { label: "TXT", color: "text-zinc-500 bg-zinc-50 dark:bg-zinc-500/10 border-zinc-200 dark:border-zinc-500/20" },
  "text/markdown": { label: "MD", color: "text-zinc-500 bg-zinc-50 dark:bg-zinc-500/10 border-zinc-200 dark:border-zinc-500/20" },
};

const ALLOWED_TYPES = new Set(Object.keys(FILE_TYPE_META));
const ALLOWED_EXT = /\.(pdf|docx|doc|txt|md)$/i;
const MAX_SIZE = 5 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const PARSE_STAGES = [
  { label: "File uploaded successfully", icon: Check },
  { label: "Reading document content...", icon: FileText },
  { label: "Extracting structured data with AI...", icon: Sparkles },
  { label: "Resume parsed!", icon: Check },
];

export default function ResumeUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    setResumeData,
    setWorkspaceMode,
    saveActiveDraft,
    setShowOnboarding,
    setUploadSource,
  } = useResume();

  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [parseStage, setParseStage] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [parsedName, setParsedName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate
      if (!ALLOWED_TYPES.has(file.type) && !ALLOWED_EXT.test(file.name)) {
        setErrorMessage("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
        setPhase("error");
        return;
      }
      if (file.size > MAX_SIZE) {
        setErrorMessage("File too large. Maximum size is 5 MB.");
        setPhase("error");
        return;
      }

      setSelectedFile(file);
      setPhase("uploading");
      setUploadPercent(0);
      setParseStage(0);
      setErrorMessage("");

      try {
        // Lock context to upload workspace (skipFetch=true to avoid loading stale data)
        setWorkspaceMode("upload", true);

        const parsed = await resumeApi.uploadAndParseResumeWithProgress(
          file,
          (pct) => setUploadPercent(pct),
        );

        // Upload complete → show parsing animation stages
        setPhase("parsing");
        setParseStage(1); // File uploaded
        await new Promise((r) => setTimeout(r, 600));
        setParseStage(2); // Reading content
        await new Promise((r) => setTimeout(r, 1000));
        setParseStage(3); // Extracting
        await new Promise((r) => setTimeout(r, 800));
        setParseStage(4); // Done

        if (parsed?.personal_info?.name) {
          setParsedName(parsed.personal_info.name);
          setResumeData(parsed);
          setShowOnboarding(true);
          setUploadSource("fresh_upload");
          await saveActiveDraft(parsed, undefined);

          setPhase("success");
          toast({
            title: "Resume parsed!",
            description: `Loaded resume for ${parsed.personal_info.name}`,
          });

          // Auto-navigate after brief success display
          setTimeout(() => navigate("/dashboard/hired/resume/workspace"), 1500);
        } else {
          throw new Error("Could not extract resume details from this file. Please try a different format.");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Upload processing failed. Please try again.");
        setPhase("error");
      }
    },
    [setResumeData, setWorkspaceMode, saveActiveDraft, setShowOnboarding, setUploadSource, toast, navigate],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRetry = () => {
    setPhase("idle");
    setSelectedFile(null);
    setUploadPercent(0);
    setParseStage(0);
    setErrorMessage("");
  };

  const fileMeta = selectedFile ? FILE_TYPE_META[selectedFile.type] : null;

  return (
    <div className="w-full min-h-screen flex flex-col text-foreground bg-zinc-50 dark:bg-[#08080c]">
      {/* ── TOP BAR ── */}
      <div className="px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard/hired/resume")}
          className="h-8 w-8 rounded-lg bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase select-none">
          Get Hired · Upload Resume
        </span>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-xl space-y-6">
          <AnimatePresence mode="wait">
            {/* ── IDLE: Drop Zone ── */}
            {phase === "idle" && (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-black tracking-tight">Upload Your Resume</h1>
                  <p className="text-sm text-zinc-500">
                    Drop your file below or browse to select. We'll parse it in seconds.
                  </p>
                </div>

                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center gap-5 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 min-h-[280px]
                    ${isDragOver
                      ? "border-violet-400 bg-violet-50/50 dark:bg-violet-500/[0.06] dark:border-violet-500/40 scale-[1.01]"
                      : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.md"
                    onChange={handleFileInput}
                    className="hidden"
                  />

                  <div className={`h-16 w-16 rounded-2xl border flex items-center justify-center transition-all ${
                    isDragOver
                      ? "bg-violet-100 dark:bg-violet-500/15 border-violet-300 dark:border-violet-500/30 scale-110"
                      : "bg-zinc-100 dark:bg-white/[0.04] border-zinc-200 dark:border-white/[0.08]"
                  }`}>
                    <Upload className={`h-7 w-7 transition-colors ${isDragOver ? "text-violet-600 dark:text-violet-400" : "text-zinc-400"}`} />
                  </div>

                  <div className="text-center space-y-1.5">
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                      {isDragOver ? "Drop to upload" : "Drag & drop your resume here"}
                    </p>
                    <p className="text-xs text-zinc-500">or click to browse files</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {["PDF", "DOCX", "TXT"].map((ext) => (
                      <span
                        key={ext}
                        className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500"
                      >
                        {ext}
                      </span>
                    ))}
                    <span className="text-[10px] text-zinc-400 font-medium ml-1">Max 5 MB</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── UPLOADING: Progress Bar ── */}
            {phase === "uploading" && selectedFile && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-black tracking-tight">Uploading...</h2>
                  <p className="text-sm text-zinc-500">Sending your file for processing</p>
                </div>

                {/* File info */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className={`h-10 w-10 rounded-lg border flex items-center justify-center shrink-0 ${fileMeta?.color || "bg-zinc-100 border-zinc-200 text-zinc-500"}`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{selectedFile.name}</p>
                    <p className="text-[11px] text-zinc-500">
                      {fileMeta?.label || "Document"} · {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <span className="text-sm font-black text-zinc-900 dark:text-white tabular-nums">
                    {uploadPercent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${uploadPercent}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            )}

            {/* ── PARSING: Stage Indicators ── */}
            {phase === "parsing" && selectedFile && (
              <motion.div
                key="parsing"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-black tracking-tight">Processing Your Resume</h2>
                  <p className="text-sm text-zinc-500">AI is extracting your details</p>
                </div>

                <div className="space-y-3 p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  {PARSE_STAGES.map((stage, i) => {
                    const stageNum = i + 1;
                    const isDone = parseStage >= stageNum;
                    const isCurrent = parseStage === stageNum && stageNum < 4;
                    const isVisible = parseStage >= stageNum;
                    const Icon = stage.icon;

                    if (!isVisible) return null;

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className="flex items-center gap-3"
                      >
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isDone && !isCurrent
                            ? "bg-emerald-100 dark:bg-emerald-500/15"
                            : "bg-zinc-100 dark:bg-white/[0.04]"
                        }`}>
                          {isCurrent ? (
                            <Loader2 className="h-3.5 w-3.5 text-indigo-500 animate-spin" />
                          ) : (
                            <Icon className={`h-3.5 w-3.5 ${
                              isDone ? "text-emerald-500" : "text-zinc-400"
                            }`} />
                          )}
                        </div>
                        <span className={`text-sm font-medium ${
                          isDone && !isCurrent ? "text-emerald-700 dark:text-emerald-300" : isCurrent ? "text-zinc-900 dark:text-white" : "text-zinc-400"
                        }`}>
                          {stage.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── SUCCESS: Auto-navigate ── */}
            {phase === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col items-center gap-5 py-16"
              >
                <div className="h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
                  <Check className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-center space-y-1.5">
                  <h2 className="text-xl font-black tracking-tight">All set!</h2>
                  <p className="text-sm text-zinc-500">
                    Opening workspace for <span className="font-bold text-zinc-700 dark:text-zinc-200">{parsedName}</span>
                  </p>
                </div>
                <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />
              </motion.div>
            )}

            {/* ── ERROR: Retry ── */}
            {phase === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-5 py-16"
              >
                <div className="h-16 w-16 rounded-2xl bg-red-100 dark:bg-red-500/15 border border-red-200 dark:border-red-500/20 flex items-center justify-center">
                  <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-center space-y-1.5 max-w-sm">
                  <h2 className="text-xl font-black tracking-tight">Upload Failed</h2>
                  <p className="text-sm text-zinc-500">{errorMessage}</p>
                </div>
                <button
                  onClick={handleRetry}
                  className="h-10 px-6 rounded-xl text-sm font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all"
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
