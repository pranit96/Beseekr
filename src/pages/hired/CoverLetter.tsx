import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { resumeApi, type ResumeSchema } from "../../api/resume";
import { useResume } from "../../contexts/ResumeContext";
import {
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
    resume_text: "",
  });

  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
  });

  const [letter, setLetter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingWord, setDownloadingWord] = useState(false);

  const hasResume = Boolean(resumeData?.personal_info?.name);

  const handleGenerate = async () => {
    if (!form.company_name.trim()) {
      toast({
        variant: "destructive",
        title: "Company name required",
        description: "Please enter the target company name to generate the cover letter.",
      });
      return;
    }
    if (!form.job_description.trim()) {
      toast({
        variant: "destructive",
        title: "Job description required",
        description: "Please paste the target job description.",
      });
      return;
    }
    if (!hasResume && !form.resume_text.trim()) {
      toast({
        variant: "destructive",
        title: "Resume text required",
        description: "Please paste your work history or resume text to let AI craft your letter.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const resumePayload: ResumeSchema = hasResume
        ? resumeData
        : ({
            personal_info: {
              name: personalInfo.fullName || "Candidate",
              email: personalInfo.email || "",
              phone: personalInfo.phone || "",
              location: personalInfo.location || "",
            },
            summary: "",
            experience: [],
            education: [],
            skills: [],
            projects: [],
            certifications: [],
            raw_text: form.resume_text,
          } as any);

      const result = await resumeApi.generateCoverLetter({
        resume: resumePayload,
        job_description: form.job_description,
        company_name: form.company_name,
        job_title: form.job_title || undefined,
        tone: form.tone,
      });

      setLetter(result);
      toast({
        title: "Cover Letter Ready",
        description: "AI successfully crafted your cover letter.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: "An error occurred during cover letter generation. Please try again.",
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

  const getActiveResumePayload = (): ResumeSchema => {
    return hasResume
      ? resumeData
      : ({
          personal_info: {
            name: personalInfo.fullName || "Candidate",
            email: personalInfo.email || "",
            phone: personalInfo.phone || "",
            location: personalInfo.location || "",
          },
          summary: "",
          experience: [],
          education: [],
          skills: [],
          projects: [],
          certifications: [],
          raw_text: form.resume_text,
        } as any);
  };

  const handleDownloadPdf = async () => {
    if (!letter) return;
    setDownloadingPdf(true);
    try {
      const resumePayload = getActiveResumePayload();
      const objectUrl = await resumeApi.downloadCoverLetterPdf(resumePayload, letter);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `cover-letter-${form.company_name.replace(/\s+/g, "_") || "draft"}.pdf`;
      a.click();
      window.URL.revokeObjectURL(objectUrl);
      toast({
        title: "Success",
        description: "PDF Cover Letter downloaded (compiled with LaTeX).",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "PDF generation failed",
        description: err.message || "Failed to download cover letter PDF.",
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadWord = async () => {
    if (!letter) return;
    setDownloadingWord(true);
    try {
      const resumePayload = getActiveResumePayload();
      const objectUrl = await resumeApi.downloadCoverLetterWord(resumePayload, letter);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `cover-letter-${form.company_name.replace(/\s+/g, "_") || "draft"}.docx`;
      a.click();
      window.URL.revokeObjectURL(objectUrl);
      toast({
        title: "Success",
        description: "Word Cover Letter downloaded (.docx).",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Word generation failed",
        description: err.message || "Failed to download cover letter Word document.",
      });
    } finally {
      setDownloadingWord(false);
    }
  };

  return (
    <HiredShell>
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
          {/* LEFT — Inputs */}
          <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.07] rounded-3xl p-6 space-y-5 self-start shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                Job Details
              </h2>
              {!hasResume && (
                <Badge className="bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[9px] font-bold py-0.5 rounded-lg flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> No Workspace Resume
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Company Name <span className="text-amber-500">*</span>
                </label>
                <Input
                  value={form.company_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, company_name: e.target.value }))
                  }
                  placeholder="e.g. Stripe"
                  className="bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.07] focus:border-amber-500/50 rounded-xl h-10 text-sm text-zinc-900 dark:text-zinc-200 font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Target Role
                </label>
                <Input
                  value={form.job_title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, job_title: e.target.value }))
                  }
                  placeholder="e.g. SWE II"
                  className="bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.07] focus:border-amber-500/50 rounded-xl h-10 text-sm text-zinc-900 dark:text-zinc-200 font-medium"
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
                rows={6}
                maxLength={12000}
                className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.07] focus:border-amber-500/50 rounded-xl p-3 text-sm text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-650 outline-none resize-none font-medium leading-relaxed"
              />
              <p className="text-right text-[9px] font-bold text-zinc-550 dark:text-zinc-450">
                {form.job_description.length}/12,000
              </p>
            </div>

            {/* Resume / details entry for candidates without a saved workspace resume */}
            {!hasResume && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4 pt-4 border-t border-zinc-200 dark:border-white/[0.07] overflow-hidden"
              >
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Your Profile Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Full Name
                    </label>
                    <Input
                      value={personalInfo.fullName}
                      onChange={(e) =>
                        setPersonalInfo((p) => ({ ...p, fullName: e.target.value }))
                      }
                      placeholder="e.g. Jane Doe"
                      className="bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.07] focus:border-amber-500/50 rounded-xl h-10 text-sm text-zinc-900 dark:text-zinc-200 font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Location
                    </label>
                    <Input
                      value={personalInfo.location}
                      onChange={(e) =>
                        setPersonalInfo((p) => ({ ...p, location: e.target.value }))
                      }
                      placeholder="e.g. San Francisco, CA"
                      className="bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.07] focus:border-amber-500/50 rounded-xl h-10 text-sm text-zinc-900 dark:text-zinc-200 font-medium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Email
                    </label>
                    <Input
                      value={personalInfo.email}
                      onChange={(e) =>
                        setPersonalInfo((p) => ({ ...p, email: e.target.value }))
                      }
                      placeholder="e.g. jane@example.com"
                      className="bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.07] focus:border-amber-500/50 rounded-xl h-10 text-sm text-zinc-900 dark:text-zinc-200 font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Phone Number
                    </label>
                    <Input
                      value={personalInfo.phone}
                      onChange={(e) =>
                        setPersonalInfo((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="e.g. +1 555-0199"
                      className="bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.07] focus:border-amber-500/50 rounded-xl h-10 text-sm text-zinc-900 dark:text-zinc-200 font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Paste Resume Text or Achievements <span className="text-amber-500">*</span>
                  </label>
                  <textarea
                    value={form.resume_text}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, resume_text: e.target.value }))
                    }
                    placeholder="Paste your resume summary, accomplishments, or role histories..."
                    rows={5}
                    className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.07] focus:border-amber-500/50 rounded-xl p-3 text-sm text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-650 outline-none resize-none font-medium leading-relaxed"
                  />
                </div>
              </motion.div>
            )}

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
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      form.tone === t.id
                        ? "border-amber-500/50 bg-amber-500/10"
                        : "border-zinc-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] hover:border-zinc-300 dark:hover:border-white/[0.12]"
                    }`}
                  >
                    <p
                      className={`text-xs font-bold ${
                        form.tone === t.id
                          ? "text-amber-600 dark:text-amber-300"
                          : "text-muted-foreground"
                      }`}
                    >
                      {t.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={
                isLoading ||
                !form.company_name.trim() ||
                !form.job_description.trim() ||
                (!hasResume && !form.resume_text.trim())
              }
              className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 border-none cursor-pointer"
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
                    <p className="text-zinc-900 dark:text-zinc-200 font-bold">
                      Drafting your letter...
                    </p>
                    <p className="text-xs text-zinc-500">
                      Cross-referencing achievements with target requirements.
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
                  <div className="p-8 flex-1 max-h-[600px] overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-950 flex justify-center border-b border-zinc-200 dark:border-white/[0.05]">
                    <div className="w-full max-w-2xl text-zinc-800 dark:text-zinc-200 font-serif leading-relaxed text-sm whitespace-pre-wrap select-text p-2">
                      {letter}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between px-6 py-4 bg-zinc-50 dark:bg-white/[0.01]">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                      <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                        Premium Layout Ready
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={handleCopy}
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-xs font-black text-muted-foreground hover:text-zinc-900 dark:hover:text-white rounded-xl gap-1.5"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                      <Button
                        onClick={handleDownloadWord}
                        disabled={downloadingWord}
                        size="sm"
                        className="h-8 px-3 text-xs font-black bg-muted border border-border text-foreground hover:bg-muted/80 rounded-xl gap-1.5 cursor-pointer"
                      >
                        {downloadingWord ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                        )}
                        Word (Docx)
                      </Button>
                      <Button
                        onClick={handleDownloadPdf}
                        disabled={downloadingPdf}
                        size="sm"
                        className="h-8 px-3 text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.05)]"
                      >
                        {downloadingPdf ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        PDF (LaTeX)
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="min-h-[500px] flex flex-col items-center justify-center text-center space-y-4 bg-white/50 dark:bg-white/[0.01] border border-dashed border-zinc-200 dark:border-white/[0.06] rounded-3xl p-8 shadow-inner"
                >
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-amber-500/40" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                      Your letter will appear here
                    </h3>
                    <p className="text-xs text-zinc-500 max-w-[250px] mt-1 leading-relaxed">
                      Fill in the job details, customize the tone, and we'll craft an executive-grade letter.
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
