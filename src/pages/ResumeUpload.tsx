import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useResume } from "@/contexts/ResumeContext";
import { resumeApi, type ResumeSchema } from "@/api/resume";
import {
  ArrowLeft,
  Upload,
  FileText,
  Check,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UploadPhase = "idle" | "processing" | "success" | "error";

const FILE_TYPE_META: Record<string, { label: string; color: string }> = {
  "application/pdf": {
    label: "PDF",
    color:
      "text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20",
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    label: "DOCX",
    color:
      "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
  },
  "application/msword": {
    label: "DOC",
    color:
      "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
  },
  "text/plain": {
    label: "TXT",
    color:
      "text-zinc-500 bg-zinc-50 dark:bg-zinc-500/10 border-zinc-200 dark:border-zinc-500/20",
  },
  "text/markdown": {
    label: "MD",
    color:
      "text-zinc-500 bg-zinc-50 dark:bg-zinc-500/10 border-zinc-200 dark:border-zinc-500/20",
  },
};

const ALLOWED_TYPES = new Set(Object.keys(FILE_TYPE_META));
const ALLOWED_EXT = /\.(pdf|docx|doc|txt|md)$/i;
const MAX_SIZE = 5 * 1024 * 1024;

// 2 minutes to reach 99%
const TOTAL_DURATION_MS = 120_000;
const TICK_MS = 200; // Update every 200ms for smooth animation

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Easing function: starts fast, slows down near end (feels natural)
function easeOutProgress(elapsed: number, total: number): number {
  const t = Math.min(elapsed / total, 1);
  // Quadratic ease-out scaled to 99
  return Math.floor(99 * (1 - (1 - t) * (1 - t)));
}

// Stage labels for the right side of the progress
function getStageLabel(pct: number): string {
  if (pct < 5) return "Uploading file...";
  if (pct < 20) return "Reading document...";
  if (pct < 45) return "Extracting text content...";
  if (pct < 70) return "Analyzing structure with AI...";
  if (pct < 90) return "Mapping fields & sections...";
  return "Finalizing extraction...";
}

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
  const [displayPercent, setDisplayPercent] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [parsedName, setParsedName] = useState("");
  const [showSlowWarning, setShowSlowWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refs to coordinate between progress timer and API response
  const apiResultRef = useRef<ResumeSchema | null>(null);
  const apiDoneRef = useRef(false);
  const apiErrorRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Finalize: animate to 100%, then success + redirect
  const finalize = useCallback(
    async (parsed: ResumeSchema) => {
      if (!isMountedRef.current) return;

      // Smoothly go to 100% over ~2 seconds
      setDisplayPercent(100);
      await new Promise((r) => setTimeout(r, 2500));
      if (!isMountedRef.current) return;

      // Set all context
      setParsedName(parsed.personal_info?.name || "Your resume");
      setResumeData(parsed);
      setShowOnboarding(true);
      setUploadSource("fresh_upload");
      await saveActiveDraft(parsed, undefined);

      setPhase("success");
      toast({
        title: "Resume parsed!",
        description: `Loaded resume for ${parsed.personal_info?.name || "your resume"}`,
      });

      // Auto-navigate after brief display
      setTimeout(() => {
        if (isMountedRef.current) {
          navigate("/dashboard/hired/resume/workspace");
        }
      }, 1500);
    },
    [
      setResumeData,
      setShowOnboarding,
      setUploadSource,
      saveActiveDraft,
      toast,
      navigate,
    ],
  );

  const handleFile = useCallback(
    async (file: File) => {
      // Validate
      if (!ALLOWED_TYPES.has(file.type) && !ALLOWED_EXT.test(file.name)) {
        setErrorMessage(
          "Unsupported file type. Please upload a PDF, DOCX, or TXT file.",
        );
        setPhase("error");
        return;
      }
      if (file.size > MAX_SIZE) {
        setErrorMessage("File too large. Maximum size is 5 MB.");
        setPhase("error");
        return;
      }

      // Reset all state
      setSelectedFile(file);
      setPhase("processing");
      setDisplayPercent(0);
      setErrorMessage("");
      setShowSlowWarning(false);
      apiResultRef.current = null;
      apiDoneRef.current = false;
      apiErrorRef.current = null;

      // Lock context
      setWorkspaceMode("upload", true);

      // ── 1. Start the progress timer (0→99% over 2 minutes) ──
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        if (!isMountedRef.current) {
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }

        const elapsed = Date.now() - startTimeRef.current;
        const newPct = easeOutProgress(elapsed, TOTAL_DURATION_MS);

        // If API already responded, accelerate to 99 quickly
        if (apiDoneRef.current && !apiErrorRef.current) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Jump to 99, then finalize after 2-3s
          setDisplayPercent(99);
          setTimeout(() => {
            if (isMountedRef.current && apiResultRef.current) {
              finalize(apiResultRef.current);
            }
          }, 2500);
          return;
        }

        // If API errored, stop
        if (apiErrorRef.current) {
          if (timerRef.current) clearInterval(timerRef.current);
          setErrorMessage(apiErrorRef.current);
          setPhase("error");
          return;
        }

        // Normal tick
        if (newPct >= 99) {
          setDisplayPercent(99);
          if (timerRef.current) clearInterval(timerRef.current);
          // Reached 99% but no response yet → show slow warning
          setShowSlowWarning(true);
          // Start polling for response
          const pollRef = setInterval(() => {
            if (!isMountedRef.current) {
              clearInterval(pollRef);
              return;
            }
            if (apiErrorRef.current) {
              clearInterval(pollRef);
              setErrorMessage(apiErrorRef.current);
              setPhase("error");
              return;
            }
            if (apiDoneRef.current && apiResultRef.current) {
              clearInterval(pollRef);
              // Response arrived! Wait 2-3s, then finish to 100 and redirect
              setTimeout(() => {
                if (isMountedRef.current && apiResultRef.current) {
                  finalize(apiResultRef.current);
                }
              }, 2500);
            }
          }, 300);
        } else {
          setDisplayPercent(newPct);
        }
      }, TICK_MS);

      // ── 2. Start the actual API call in parallel ──
      try {
        // Production path: signed upload to Supabase + async parse via worker + socket progress
        const signed = await resumeApi.getSignedResumeUploadUrl(file);
        await resumeApi.uploadResumeToSignedUrl({
          bucket: signed.bucket,
          storagePath: signed.storagePath,
          token: signed.token,
          file,
        });

        const { jobId } = await resumeApi.enqueueResumeParseFromStorage({
          bucket: signed.bucket,
          storagePath: signed.storagePath,
          originalname: file.name,
          mimetype: file.type,
        });

        // Subscribe to realtime progress + completion on /resume namespace
        const { io } = await import("socket.io-client");
        const SOCKET_URL = import.meta.env.VITE_API_BASE_URL;
        const socket = io(`${SOCKET_URL}/resume`, {
          withCredentials: true,
          transports: ["websocket", "polling"],
        });

        const cleanup = () => {
          try {
            socket.removeAllListeners();
            socket.disconnect();
          } catch {}
        };

        const onError = (payload: any) => {
          const msg =
            payload?.message ||
            payload?.error ||
            payload?.details ||
            "Upload processing failed. Please try again.";
          apiErrorRef.current = msg;
          apiDoneRef.current = true;
          cleanup();
        };

        socket.on("connect", () => {
          socket.emit("subscribe:tailor", jobId);
        });

        socket.on("progress", (data: any) => {
          if (data?.jobId !== jobId) return;
          // Let the visual timer keep animating; we only extend stage text via displayPercent thresholds.
          // (If you want exact progress, we can map data.progress into displayPercent later.)
        });

        socket.on("complete", (res: any) => {
          // Parse job completes with kind=upload_parse and data=<ResumeSchema>
          if (res?.jobId !== jobId) return;
          const parsed = (res as any)?.data as ResumeSchema | undefined;
          if (!parsed) {
            onError({ message: "Upload completed but resume data was missing." });
            return;
          }
          if (!parsed?.personal_info?.name) {
            onError({
              message:
                "Could not extract resume details from this file. Please try a different format.",
            });
            return;
          }
          apiResultRef.current = parsed;
          apiDoneRef.current = true;
          cleanup();
        });

        socket.on("error", onError);

        // Result is set by socket "complete".
      } catch (err: any) {
        apiErrorRef.current =
          err.message || "Upload processing failed. Please try again.";
        apiDoneRef.current = true;
      }
    },
    [setWorkspaceMode, finalize],
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
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("idle");
    setSelectedFile(null);
    setDisplayPercent(0);
    setErrorMessage("");
    setShowSlowWarning(false);
    apiResultRef.current = null;
    apiDoneRef.current = false;
    apiErrorRef.current = null;
  };

  const fileMeta = selectedFile ? FILE_TYPE_META[selectedFile.type] : null;

  return (
    <div className="w-full h-full flex flex-col text-foreground bg-zinc-50 dark:bg-[#08080c]">
      {/* ── TOP BAR ── */}
      <div className="px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard/hired")}
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
                  <h1 className="text-2xl font-black tracking-tight">
                    Upload Your Resume
                  </h1>
                  <p className="text-sm text-zinc-500">
                    Drop your file below or browse to select. We'll parse it in
                    seconds.
                  </p>
                </div>

                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center gap-5 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 min-h-[280px]
                    ${
                      isDragOver
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

                  <div
                    className={`h-16 w-16 rounded-2xl border flex items-center justify-center transition-all ${
                      isDragOver
                        ? "bg-violet-100 dark:bg-violet-500/15 border-violet-300 dark:border-violet-500/30 scale-110"
                        : "bg-zinc-100 dark:bg-white/[0.04] border-zinc-200 dark:border-white/[0.08]"
                    }`}
                  >
                    <Upload
                      className={`h-7 w-7 transition-colors ${isDragOver ? "text-violet-600 dark:text-violet-400" : "text-zinc-400"}`}
                    />
                  </div>

                  <div className="text-center space-y-1.5">
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                      {isDragOver
                        ? "Drop to upload"
                        : "Drag & drop your resume here"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      or click to browse files
                    </p>
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
                    <span className="text-[10px] text-zinc-400 font-medium ml-1">
                      Max 5 MB
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── PROCESSING: Unified progress view ── */}
            {phase === "processing" && selectedFile && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-black tracking-tight">
                    {displayPercent >= 100
                      ? "Wrapping up..."
                      : "Processing Your Resume"}
                  </h2>
                  <p className="text-sm text-zinc-500">
                    {displayPercent >= 100
                      ? "Almost there, preparing your workspace"
                      : getStageLabel(displayPercent)}
                  </p>
                </div>

                {/* File info card */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div
                    className={`h-10 w-10 rounded-lg border flex items-center justify-center shrink-0 ${fileMeta?.color || "bg-zinc-100 border-zinc-200 text-zinc-500"}`}
                  >
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {fileMeta?.label || "Document"} ·{" "}
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <span className="text-lg font-black text-zinc-900 dark:text-white tabular-nums">
                    {displayPercent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-3">
                  <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500"
                      style={{ backgroundSize: "200% 100%" }}
                      animate={{
                        width: `${displayPercent}%`,
                        backgroundPosition:
                          displayPercent < 100 ? ["0% 0%", "100% 0%"] : "0% 0%",
                      }}
                      transition={{
                        width: {
                          duration: displayPercent >= 99 ? 2 : 0.4,
                          ease: "easeOut",
                        },
                        backgroundPosition: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        },
                      }}
                    />
                  </div>

                  {/* Stage milestones */}
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-400 px-0.5">
                    <span
                      className={displayPercent >= 5 ? "text-violet-500" : ""}
                    >
                      Upload
                    </span>
                    <span
                      className={displayPercent >= 20 ? "text-violet-500" : ""}
                    >
                      Read
                    </span>
                    <span
                      className={displayPercent >= 45 ? "text-violet-500" : ""}
                    >
                      Extract
                    </span>
                    <span
                      className={displayPercent >= 70 ? "text-violet-500" : ""}
                    >
                      Analyze
                    </span>
                    <span
                      className={
                        displayPercent >= 100 ? "text-emerald-500" : ""
                      }
                    >
                      Done
                    </span>
                  </div>
                </div>

                {/* Slow warning */}
                <AnimatePresence>
                  {showSlowWarning && displayPercent < 100 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/[0.06] border border-amber-200 dark:border-amber-500/15"
                    >
                      <Clock className="h-4 w-4 text-amber-500 shrink-0 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                          Taking longer than usual
                        </p>
                        <p className="text-[11px] text-amber-600/80 dark:text-amber-400/60">
                          Complex documents need more processing time. Please
                          wait...
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  <h2 className="text-xl font-black tracking-tight">
                    All set!
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Opening workspace for{" "}
                    <span className="font-bold text-zinc-700 dark:text-zinc-200">
                      {parsedName}
                    </span>
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
                  <h2 className="text-xl font-black tracking-tight">
                    Upload Failed
                  </h2>
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
