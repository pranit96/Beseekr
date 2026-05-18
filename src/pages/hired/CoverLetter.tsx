import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { resumeApi } from "../../api/resume";
import { useResume } from "../../contexts/ResumeContext";
import {
  Loader2,
  FileText,
  Wand2,
  Copy,
  Download,
  CheckCircle2,
  UploadCloud,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../hooks/use-toast";
import HiredShell from "./HiredShell";

const TONES = [
  { id: "professional", label: "Professional", desc: "Formal & polished" },
  { id: "conversational", label: "Conversational", desc: "Warm & personable" },
  { id: "enthusiastic", label: "Enthusiastic", desc: "Energetic & bold" },
];

export default function CoverLetter() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resumeData } = useResume();

  const [form, setForm] = useState({
    company_name: "",
    job_title: "",
    job_description: "",
    tone: "professional",
  });
  const [letter, setLetter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasResume = Boolean(resumeData?.personal_info?.name);

  const handleGenerate = async () => {
    if (!hasResume || !form.job_description.trim()) return;
    setIsLoading(true);
    try {
      const result = await resumeApi.generateCoverLetter({
        resume: resumeData,
        job_description: form.job_description,
        company_name: form.company_name || undefined,
        job_title: form.job_title || undefined,
        tone: form.tone,
      });
      setLetter(result);
      toast({
        title: "Cover Letter Ready",
        description: "AI crafted your personalized letter.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!letter) return;
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Cover letter copied to clipboard.",
    });
  };

  const handleDownload = () => {
    if (!letter) return;
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${form.company_name || "draft"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!hasResume) {
    return (
      <HiredShell>
        <div className="max-w-xl mx-auto py-24 px-4 flex flex-col items-center justify-center text-center space-y-8">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <UploadCloud className="w-9 h-9 text-amber-500 dark:text-amber-400/70" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Resume Required
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
              The Cover Letter Engine analyzes your resume to craft a perfectly
              tailored letter. Upload or build your resume first.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/dashboard/hired/resume")}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold h-11 px-6 rounded-2xl"
            >
              Upload Resume
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard/hired")}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white h-11 px-6 rounded-2xl"
            >
              Back to Portal
            </Button>
          </div>
        </div>
      </HiredShell>
    );
  }

  return (
    <HiredShell>
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            AI Cover Letter
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter text-zinc-900 dark:text-white">
            Cover Letter <span className="text-amber-500">Engine.</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Generate a tailored, job-specific letter in under 10 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-8">
          {/* LEFT — Inputs */}
          <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-6 space-y-6 self-start shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
              Job Details
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Company
                </label>
                <Input
                  value={form.company_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, company_name: e.target.value }))
                  }
                  placeholder="e.g. Stripe"
                  className="bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.07] focus:border-amber-500/50 rounded-xl h-10 text-sm text-zinc-900 dark:text-zinc-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Role
                </label>
                <Input
                  value={form.job_title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, job_title: e.target.value }))
                  }
                  placeholder="e.g. SWE II"
                  className="bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.07] focus:border-amber-500/50 rounded-xl h-10 text-sm text-zinc-900 dark:text-zinc-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Job Description <span className="text-amber-500">*</span>
              </label>
              <textarea
                value={form.job_description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, job_description: e.target.value }))
                }
                placeholder="Paste the full job description here..."
                rows={8}
                maxLength={12000}
                className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.07] focus:border-amber-500/50 rounded-xl p-3 text-sm text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none resize-none font-medium leading-relaxed"
              />
              <p className="text-right text-[9px] font-bold text-zinc-600">
                {form.job_description.length}/12,000
              </p>
            </div>

            {/* Tone selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Tone
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setForm((p) => ({ ...p, tone: t.id }))}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      form.tone === t.id
                        ? "border-amber-500/50 bg-amber-500/10"
                        : "border-zinc-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] hover:border-zinc-300 dark:hover:border-white/[0.12]"
                    }`}
                  >
                    <p
                      className={`text-xs font-bold ${form.tone === t.id ? "text-amber-600 dark:text-amber-300" : "text-muted-foreground"}`}
                    >
                      {t.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isLoading || !hasResume || !form.job_description.trim()}
              className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" /> Generate Cover Letter
                </>
              )}
            </Button>
          </div>

          {/* RIGHT — Output */}
          <div>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-h-[500px] bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-center shadow-sm"
                >
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <div className="space-y-1">
                    <p className="text-zinc-900 dark:text-muted-foreground font-bold">
                      Drafting your letter...
                    </p>
                    <p className="text-xs text-zinc-500">
                      Cross-referencing your resume with the JD.
                    </p>
                  </div>
                </motion.div>
              ) : letter ? (
                <motion.div
                  key="letter"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.07] rounded-3xl flex flex-col h-full overflow-hidden shadow-sm"
                >
                  <div className="p-8 flex-1 max-h-[600px] overflow-y-auto custom-scrollbar">
                    <p className="text-sm text-zinc-800 dark:text-muted-foreground leading-8 whitespace-pre-wrap font-[450]">
                      {letter}
                    </p>
                  </div>
                  <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-white/[0.05] bg-zinc-50 dark:bg-white/[0.01]">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold text-muted-foreground">
                        Ready to use
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCopy}
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-xs font-bold text-muted-foreground hover:text-zinc-900 dark:hover:text-white rounded-xl gap-1.5"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                      <Button
                        onClick={handleDownload}
                        size="sm"
                        className="h-8 px-4 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 rounded-xl gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="min-h-[500px] flex flex-col items-center justify-center text-center space-y-4 bg-white/50 dark:bg-white/[0.01] border border-dashed border-zinc-200 dark:border-white/[0.06] rounded-3xl p-8"
                >
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-amber-500/40" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                      Your letter will appear here
                    </h3>
                    <p className="text-xs text-zinc-500 max-w-[250px] mt-1 leading-relaxed">
                      Fill in the job details and we'll cross-reference it with
                      your resume.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </HiredShell>
  );
}
