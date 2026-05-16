import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { resumeApi } from "../../api/resume";
import { useResume } from "../../contexts/ResumeContext";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Wand2,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../hooks/use-toast";

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

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-zinc-100 overflow-hidden">
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard/hired")}
              className="text-zinc-500 hover:text-white gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Portal
            </Button>
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              AI Cover Letter Engine
            </Badge>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter">
              Cover Letter <span className="text-amber-400">Intelligence.</span>
            </h1>
            <p className="text-zinc-500 font-medium">
              Generate a tailored, job-specific cover letter in under 10
              seconds.
            </p>
          </div>

          {/* Resume status banner */}
          {!hasResume && (
            <div className="flex items-center gap-3 bg-amber-500/[0.07] border border-amber-500/20 rounded-2xl px-5 py-3.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300/80 font-medium flex-1">
                No resume loaded. Please build or upload your resume first.
              </p>
              <button
                onClick={() => navigate("/dashboard/hired/resume")}
                className="text-[11px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors"
              >
                Load Resume →
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
            {/* LEFT — Inputs */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-[28px] p-8 space-y-6 self-start">
              <h2 className="text-base font-bold tracking-tight text-white">
                Job Details
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                    Company
                  </label>
                  <Input
                    value={form.company_name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, company_name: e.target.value }))
                    }
                    placeholder="e.g. Stripe"
                    className="bg-white/[0.03] border-white/[0.08] focus:border-amber-500/50 rounded-xl h-11 text-zinc-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                    Role
                  </label>
                  <Input
                    value={form.job_title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, job_title: e.target.value }))
                    }
                    placeholder="e.g. SWE II"
                    className="bg-white/[0.03] border-white/[0.08] focus:border-amber-500/50 rounded-xl h-11 text-zinc-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  Job Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.job_description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, job_description: e.target.value }))
                  }
                  placeholder="Paste the full job description here..."
                  rows={8}
                  maxLength={12000}
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-amber-500/50 rounded-xl p-4 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none transition-all resize-none font-medium leading-relaxed"
                />
                <p className="text-right text-[10px] text-zinc-600">
                  {form.job_description.length}/12,000
                </p>
              </div>

              {/* Tone selector */}
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  Tone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setForm((p) => ({ ...p, tone: t.id }))}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        form.tone === t.id
                          ? "border-amber-500/50 bg-amber-500/10"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                      }`}
                    >
                      <p
                        className={`text-xs font-bold ${form.tone === t.id ? "text-amber-300" : "text-zinc-300"}`}
                      >
                        {t.label}
                      </p>
                      <p className="text-[10px] text-zinc-600 font-medium">
                        {t.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={
                  isLoading || !hasResume || !form.job_description.trim()
                }
                className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-2"
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
                    className="min-h-[580px] bg-white/[0.02] border border-white/[0.08] rounded-[28px] p-8 animate-pulse flex flex-col gap-4"
                  >
                    {[100, 85, 90, 70, 95, 80, 75, 88, 60].map((w, i) => (
                      <div
                        key={i}
                        style={{ width: `${w}%` }}
                        className="h-3.5 bg-white/[0.05] rounded-full"
                      />
                    ))}
                  </motion.div>
                ) : letter ? (
                  <motion.div
                    key="letter"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/[0.02] border border-white/[0.08] rounded-[28px] overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-bold text-white">
                          Generated Letter
                        </span>
                        {form.company_name && (
                          <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-none font-bold">
                            {form.company_name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCopy}
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-xs font-bold text-zinc-400 hover:text-white rounded-xl gap-1.5"
                        >
                          {copied ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          {copied ? "Copied!" : "Copy"}
                        </Button>
                        <Button
                          onClick={handleDownload}
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-xs font-bold text-zinc-400 hover:text-white rounded-xl gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </Button>
                      </div>
                    </div>
                    <div className="p-8 max-h-[600px] overflow-y-auto custom-scrollbar">
                      <p className="text-sm text-zinc-300 leading-8 whitespace-pre-wrap font-[450]">
                        {letter}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="min-h-[580px] flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.01] border border-dashed border-white/[0.06] rounded-[28px] p-8"
                  >
                    <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <FileText className="w-9 h-9 text-amber-400/70" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-white">
                        Your letter will appear here
                      </h3>
                      <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                        Fill in the job details on the left and click generate.
                        The AI will tailor it to your resume automatically.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
