// src/pages/ResumeWorkspace.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useResume, EMPTY_RESUME } from "@/contexts/ResumeContext";
import {
  FileText,
  Sparkles,
  Trophy,
  Download,
  Briefcase,
  GraduationCap,
  Cpu,
  User,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
  History,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ATSAnalysis, resumeApi } from "@/api/resume";

export default function ResumeWorkspace() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Inject Global Context Engine
  const {
    resumeData,
    setResumeData,
    jobDescription,
    setJobDescription,
    atsReport,
    setAtsReport,
    isScoring,
    setIsScoring,
    isOptimizing,
    setIsOptimizing,
    saveStatus,
    saveSnapshot,
  } = useResume();

  // Local Visual/Action States
  const [injectedKeywords, setInjectedKeywords] = useState<string[]>([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleBackupToVault = async () => {
    setIsBackingUp(true);
    try {
      await saveSnapshot();
    } finally {
      setIsBackingUp(false);
    }
  };

  // ── Handlers: Workspace Operations ─────────────────────────────────
  const handleRunATSAnalysis = async () => {
    setIsScoring(true);
    try {
      const result = await resumeApi.scoreResume(resumeData, jobDescription);
      setAtsReport(result);
      toast({
        title: "Analysis Computed",
        description: `Scored ${result.score}/100! Review improvement suggestions.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Scoring error",
        description: error.message,
      });
    } finally {
      setIsScoring(false);
    }
  };

  const handleOptimizeBullets = async () => {
    setIsOptimizing(true);
    try {
      const optimized = await resumeApi.optimizeResume(
        resumeData,
        jobDescription,
      );
      setResumeData(optimized);
      toast({
        title: "Agent Polish Applied!",
        description: "Rewrote highlights for maximum professional impact.",
      });
      // Trigger automatic score refresh if report existed
      if (atsReport) handleRunATSAnalysis();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "AI Refactor Failed",
        description: error.message,
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleExportPdf = async () => {
    setIsDownloading(true);
    try {
      const url = await resumeApi.downloadResumePdf(resumeData);

      // Auto download trigger
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${resumeData.personal_info.name || "User"}_Resume.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exported Successfully!",
        description: "Your dynamic resume is ready.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: error.message,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Handlers: Sub-field Mutators ────────────────────────────────────
  const updatePersonalInfo = (
    field: keyof typeof EMPTY_RESUME.personal_info,
    value: string,
  ) => {
    setResumeData((prev) => ({
      ...prev,
      personal_info: { ...prev.personal_info, [field]: value },
    }));
  };

  const updateStyleConfig = (field: string, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      styles: { ...(prev.styles || {}), [field]: value },
    }));
  };

  const addExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          company: "",
          position: "",
          location: "",
          period: "",
          highlights: [""],
        },
      ],
    }));
  };

  const deleteExperience = (idx: number) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx),
    }));
  };

  const updateExperience = (idx: number, field: any, value: any) => {
    setResumeData((prev) => {
      const updated = [...prev.experience];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, experience: updated };
    });
  };

  const addSkillCategory = () => {
    setResumeData((prev) => ({
      ...prev,
      skills: [...prev.skills, { category: "New Category", items: [] }],
    }));
  };

  const updateSkillGroup = (
    idx: number,
    category: string,
    itemsStr: string,
  ) => {
    setResumeData((prev) => {
      const updated = [...prev.skills];
      updated[idx] = {
        category,
        items: itemsStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      return { ...prev, skills: updated };
    });
  };

  const addEducation = () => {
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { institution: "", degree: "", period: "", location: "" },
      ],
    }));
  };

  const deleteEducation = (idx: number) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx),
    }));
  };

  const updateEducation = (idx: number, field: any, value: any) => {
    setResumeData((prev) => {
      const updated = [...prev.education];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, education: updated };
    });
  };

  const addProject = () => {
    setResumeData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        { name: "", description: "", link: "", highlights: [""] },
      ],
    }));
  };

  const deleteProject = (idx: number) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx),
    }));
  };

  const updateProject = (idx: number, field: any, value: any) => {
    setResumeData((prev) => {
      const updated = [...prev.projects];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, projects: updated };
    });
  };

  const addCertification = () => {
    setResumeData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, ""],
    }));
  };

  const updateCertification = (idx: number, value: string) => {
    setResumeData((prev) => {
      const updated = [...prev.certifications];
      updated[idx] = value;
      return { ...prev, certifications: updated };
    });
  };

  const deleteCertification = (idx: number) => {
    setResumeData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== idx),
    }));
  };

  const applyRefactor = (original: string, improved: string) => {
    // Normalize for robust fuzzy matching — strip punctuation, collapse whitespace
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    
    const normalizedOriginal = normalize(original);
    const normalizedImproved = normalize(improved);

    let hasMatched = false;

    // Compute updated structures synchronously before applying state
    const updatedExp = resumeData.experience.map((job) => {
      const bulletIdx = job.highlights.findIndex((h) => {
        const nh = normalize(h);
        return (
          nh === normalizedOriginal ||
          normalizedOriginal.includes(nh) ||
          nh.includes(normalizedOriginal)
        );
      });
      if (bulletIdx !== -1) {
        hasMatched = true;
        const newHighlights = [...job.highlights];
        newHighlights[bulletIdx] = improved;
        return { ...job, highlights: newHighlights };
      }
      return job;
    });

    const updatedProj = resumeData.projects.map((proj) => {
      const bulletIdx = (proj.highlights || []).findIndex((h) => {
        const nh = normalize(h);
        return (
          nh === normalizedOriginal ||
          normalizedOriginal.includes(nh) ||
          nh.includes(normalizedOriginal)
        );
      });
      if (bulletIdx !== -1) {
        hasMatched = true;
        const newHighlights = [...(proj.highlights || [])];
        newHighlights[bulletIdx] = improved;
        return { ...proj, highlights: newHighlights };
      }
      return proj;
    });

    // Record immediate tracking event for bulletproof visual persistence
    setAppliedSuggestions((prev) => {
      if (!prev.includes(normalizedImproved)) {
        return [...prev, normalizedImproved];
      }
      return prev;
    });

    if (hasMatched) {
      setResumeData((prev) => ({
        ...prev,
        experience: updatedExp,
        projects: updatedProj,
      }));

      toast({
        title: "Suggestion Applied ✅",
        description: "Bullet point upgraded successfully in your resume.",
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(improved);
      toast({
        title: "Copied to Clipboard",
        description:
          "Couldn't auto-match the exact bullet — copied to clipboard so you can paste manually.",
      });
    }
  };

  return (
    <div className="w-full py-6 px-2 sm:px-4 lg:px-6 selection:bg-white/10">
      {/* HERO & CONTROL HEADER OUTSIDE GRID (MATCHES CHAT PAGE STANDARD) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="space-y-4 text-left">
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
              RESUME INTELLIGENCE <span className="mx-2 opacity-50 text-[8px]">•</span> WORKSPACE
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] flex flex-col gap-1 text-white">
            <span>Craft With Precision.</span>
            <span className="text-zinc-700">Optimize to ATS Perfection.</span>
          </h1>
        </div>

        {/* TOP DOCK ACTIONS */}
        <div className="flex items-center gap-3 flex-wrap justify-start md:justify-end shrink-0 pb-1">
          {/* Persistent Sync Sentinel */}
          <div className="mr-1">
            {saveStatus === "saving" && (
              <Badge className="bg-zinc-800 text-zinc-300 border-none px-3.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 animate-pulse font-mono">
                <Loader2 className="h-2.5 w-2.5 animate-spin" /> Auto-Saving
              </Badge>
            )}
            {saveStatus === "saved" && (
              <Badge className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-3.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 select-none font-mono">
                <ShieldCheck className="h-3 w-3 text-white" /> Secured
              </Badge>
            )}
            {saveStatus === "error" && (
              <Badge className="bg-zinc-950 border border-red-900 text-red-400 px-3.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 font-mono">
                <X className="h-3 w-3" /> Sync Offline
              </Badge>
            )}
          </div>

          <Button
            onClick={handleBackupToVault}
            disabled={isBackingUp}
            variant="outline"
            className="rounded-xl font-bold border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:text-white hover:bg-white/[0.08] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 h-10 text-xs tracking-tight"
          >
            {isBackingUp ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <History className="h-4 w-4 mr-2 text-zinc-400" />
            )}
            Archive Snapshot
          </Button>

          <Button
            onClick={handleExportPdf}
            disabled={isDownloading}
            className="rounded-xl font-bold bg-white text-black hover:bg-zinc-200 hover:text-black shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 h-10 text-xs tracking-tight border-none"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      {/* WORKSPACE SPLIT CANVAS GRID */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="grid lg:grid-cols-12 gap-8"
      >
        {/* LEFT COLUMN: Workspace Editor Panel (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" /> Document Outline
              </h2>
              <p className="text-xs text-muted-foreground/80 mt-0.5">
                Fields populate dynamic pdf render schema in real-time.
              </p>
            </div>
          </div>

          {/* Accordion Fields */}
          <Accordion
            type="multiple"
            defaultValue={["personal", "experience"]}
            className="space-y-4 border-none"
          >
            {/* Section Theme Styling */}
            <AccordionItem
              value="styling"
              className="border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.08] backdrop-blur-3xl rounded-[24px] px-6 py-2 transition-all duration-300 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex items-center gap-3 font-bold text-zinc-100 text-sm tracking-tight">
                  <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                  </div>
                  Professional Theme
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-2 pb-6">
                <div className="grid md:grid-cols-2 gap-6 border-t border-white/[0.03] pt-5">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-500">
                      Accent Color Block
                    </Label>
                    <div className="flex items-center gap-3 py-1">
                      {[
                        {
                          name: "Classic Navy",
                          primary: "#1A365D",
                          accent: "#3182CE",
                        },
                        {
                          name: "Modern Emerald",
                          primary: "#065F46",
                          accent: "#059669",
                        },
                        {
                          name: "Ruby Burgundy",
                          primary: "#7F1D1D",
                          accent: "#DC2626",
                        },
                        {
                          name: "Deep Onyx",
                          primary: "#111827",
                          accent: "#4B5563",
                        },
                      ].map((theme) => (
                        <button
                          key={theme.name}
                          type="button"
                          title={theme.name}
                          onClick={() => {
                            updateStyleConfig("primaryColor", theme.primary);
                            updateStyleConfig("accentColor", theme.accent);
                          }}
                          className={`relative h-9 w-9 rounded-full border transition-all flex items-center justify-center ${
                            (resumeData.styles?.primaryColor || "#1A365D") ===
                            theme.primary
                              ? "border-white scale-110 ring-4 ring-white/10 shadow-lg"
                              : "border-white/10 hover:scale-105 hover:border-white/30"
                          }`}
                          style={{ backgroundColor: theme.primary }}
                        >
                          {(resumeData.styles?.primaryColor || "#1A365D") ===
                            theme.primary && (
                            <CheckCircle2 className="h-4 w-4 text-white bg-black/30 rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-500">
                      Typography Engine
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => updateStyleConfig("fontFamily", "Sans")}
                        className={`rounded-2xl h-10 font-bold text-xs tracking-tight border-white/[0.05] bg-white/[0.02] transition-all duration-300 ${
                          (resumeData.styles?.fontFamily || "Sans") === "Sans"
                            ? "border-indigo-500/30 bg-indigo-500/10 text-white shadow-inner shadow-indigo-500/10"
                            : "hover:bg-white/[0.05] text-zinc-400"
                        }`}
                      >
                        Sans-Serif
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => updateStyleConfig("fontFamily", "Serif")}
                        className={`rounded-2xl h-10 font-serif text-xs font-black tracking-tight border-white/[0.05] bg-white/[0.02] transition-all duration-300 ${
                          resumeData.styles?.fontFamily === "Serif"
                            ? "border-indigo-500/30 bg-indigo-500/10 text-white shadow-inner shadow-indigo-500/10"
                            : "hover:bg-white/[0.05] text-zinc-400"
                        }`}
                      >
                        Serif Style
                      </Button>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section A: Personal */}
            <AccordionItem
              value="personal"
              className="border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.08] backdrop-blur-3xl rounded-[24px] px-6 py-2 transition-all duration-300 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex items-center gap-3 font-bold text-zinc-100 text-sm tracking-tight">
                  <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                    <User className="h-4 w-4 text-indigo-400" />
                  </div>
                  Personal Details
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-5 pt-2 pb-6 border-t border-white/[0.03]">
                <div className="grid grid-cols-2 gap-5 mt-5">
                  <div className="space-y-2 text-left">
                    <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 ml-1">Full Name</Label>
                    <Input
                      value={resumeData.personal_info.name}
                      onChange={(e) =>
                        updatePersonalInfo("name", e.target.value)
                      }
                      placeholder="Agent Identity"
                      className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-indigo-500/40 focus:ring-0 text-zinc-200 rounded-2xl h-11 px-4 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] text-sm"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 ml-1">Email Address</Label>
                    <Input
                      value={resumeData.personal_info.email}
                      onChange={(e) =>
                        updatePersonalInfo("email", e.target.value)
                      }
                      placeholder="mail@workspace.io"
                      className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-indigo-500/40 focus:ring-0 text-zinc-200 rounded-2xl h-11 px-4 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] text-sm"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 ml-1">Phone Number</Label>
                    <Input
                      value={resumeData.personal_info.phone}
                      onChange={(e) =>
                        updatePersonalInfo("phone", e.target.value)
                      }
                      placeholder="Access Direct"
                      className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-indigo-500/40 focus:ring-0 text-zinc-200 rounded-2xl h-11 px-4 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] text-sm"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 ml-1">Website / Link</Label>
                    <Input
                      value={resumeData.personal_info.website}
                      onChange={(e) =>
                        updatePersonalInfo("website", e.target.value)
                      }
                      placeholder="github.com/alias"
                      className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-indigo-500/40 focus:ring-0 text-zinc-200 rounded-2xl h-11 px-4 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2 text-left">
                  <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 ml-1">Professional Narrative Summary</Label>
                  <Textarea
                    value={resumeData.personal_info.summary}
                    onChange={(e) =>
                      updatePersonalInfo("summary", e.target.value)
                    }
                    placeholder="A high-end technical outline encapsulating core value delivery..."
                    className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-indigo-500/40 focus:ring-0 text-zinc-200 rounded-2xl min-h-[90px] px-4 py-3 leading-relaxed transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] text-sm resize-none"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section B: Experience */}
            <AccordionItem
              value="experience"
              className="border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.08] backdrop-blur-3xl rounded-[24px] px-6 py-2 transition-all duration-300 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex items-center gap-3 font-bold text-zinc-100 text-sm tracking-tight">
                  <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
                    <Briefcase className="h-4 w-4 text-sky-400" />
                  </div>
                  Work Matrix
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-2 pb-6 border-t border-white/[0.03]">
                {resumeData.experience.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.03] border border-white/[0.05] relative space-y-5 transition-all shadow-md group/exp"
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteExperience(idx)}
                      className="absolute top-3 right-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover/exp:opacity-100 transition-all duration-300 h-8 w-8 rounded-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>

                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">Company Entity</Label>
                        <Input
                          value={exp.company}
                          onChange={(e) =>
                            updateExperience(idx, "company", e.target.value)
                          }
                          placeholder="e.g., Stripe"
                          className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-sky-500/40 text-sm text-zinc-200 rounded-2xl h-10 px-3.5 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">Position / Title</Label>
                        <Input
                          value={exp.position}
                          onChange={(e) =>
                            updateExperience(idx, "position", e.target.value)
                          }
                          placeholder="Staff Engineer"
                          className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-sky-500/40 text-sm text-zinc-200 rounded-2xl h-10 px-3.5 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">Timeline Period</Label>
                        <Input
                          value={exp.period}
                          onChange={(e) =>
                            updateExperience(idx, "period", e.target.value)
                          }
                          placeholder="2022 - Present"
                          className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-sky-500/40 text-sm text-zinc-200 rounded-2xl h-10 px-3.5 transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">Locality Location</Label>
                        <Input
                          value={exp.location}
                          onChange={(e) =>
                            updateExperience(idx, "location", e.target.value)
                          }
                          placeholder="San Francisco, CA"
                          className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-sky-500/40 text-sm text-zinc-200 rounded-2xl h-10 px-3.5 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 ml-1 mt-1">
                        <Sparkles className="h-3 w-3 text-sky-400 animate-pulse" /> Bulleted Highlights
                      </Label>
                      <div className="space-y-2.5">
                        {exp.highlights.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex gap-2 group/bullet">
                            <Textarea
                              value={bullet}
                              onChange={(e) => {
                                const nextHighlights = [...exp.highlights];
                                nextHighlights[bIdx] = e.target.value;
                                updateExperience(
                                  idx,
                                  "highlights",
                                  nextHighlights,
                                );
                              }}
                              className="bg-white/[0.01] border-white/[0.06] focus:border-sky-500/40 min-h-[60px] text-sm text-zinc-200 rounded-xl px-3 py-2 leading-relaxed resize-none transition-all shadow-sm"
                              placeholder="Formulate high-impact deliverable using metrics..."
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                const nextHighlights = exp.highlights.filter(
                                  (_, i) => i !== bIdx,
                                );
                                updateExperience(
                                  idx,
                                  "highlights",
                                  nextHighlights,
                                );
                              }}
                              className="h-9 w-9 shrink-0 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent rounded-lg opacity-0 group-hover/bullet:opacity-100 transition-all duration-200 mt-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updateExperience(idx, "highlights", [
                            ...exp.highlights,
                            "",
                          ])
                        }
                        className="text-[11px] text-sky-400 hover:text-sky-300 font-bold px-1.5 hover:bg-sky-500/5 transition-all flex items-center gap-1.5 mt-1 rounded-lg"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Highlight Node
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  onClick={addExperience}
                  variant="outline"
                  className="w-full h-12 border-dashed border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.12] text-zinc-400 hover:text-zinc-200 rounded-2xl text-xs font-bold transition-all shadow-inner"
                >
                  <Plus className="h-4 w-4 mr-2 opacity-60" /> Add New Experience Matrix Row
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* Section C: Skills */}
            <AccordionItem
              value="skills"
              className="border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.08] backdrop-blur-3xl rounded-[24px] px-6 py-2 transition-all duration-300 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex items-center gap-3 font-bold text-zinc-100 text-sm tracking-tight">
                  <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <Cpu className="h-4 w-4 text-purple-400" />
                  </div>
                  Tech Proficiency
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-6 border-t border-white/[0.03]">
                <div className="space-y-4 pt-4">
                  {resumeData.skills.map((skill, idx) => (
                    <div key={idx} className="flex gap-4 items-start group/skill relative bg-white/[0.01] hover:bg-white/[0.02] p-4 border border-white/[0.04] rounded-2xl transition-all">
                      <div className="w-1/3 space-y-1.5 text-left">
                        <Label className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-500 ml-1">Skill Class</Label>
                        <Input
                          value={skill.category}
                          onChange={(e) =>
                            updateSkillGroup(
                              idx,
                              e.target.value,
                              skill.items.join(", "),
                            )
                          }
                          placeholder="e.g., Frontend"
                          className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-purple-500/40 text-xs text-zinc-200 font-bold rounded-xl h-10 transition-all"
                        />
                      </div>
                      <div className="flex-1 space-y-1.5 text-left">
                        <Label className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-500 ml-1">Proficiencies</Label>
                        <Input
                          value={skill.items.join(", ")}
                          onChange={(e) =>
                            updateSkillGroup(idx, skill.category, e.target.value)
                          }
                          placeholder="React, TypeScript, CSS..."
                          className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-purple-500/40 text-xs text-zinc-200 rounded-xl h-10 transition-all"
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setResumeData((p) => ({
                            ...p,
                            skills: p.skills.filter((_, i) => i !== idx),
                          }))
                        }
                        className="mt-6 h-10 w-10 shrink-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent rounded-xl opacity-0 group-hover/skill:opacity-100 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={addSkillCategory}
                  variant="outline"
                  className="w-full h-11 mt-3 border-dashed border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.12] text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-bold transition-all"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Inject Skills Classifier Set
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* Section D: Education */}
            <AccordionItem
              value="education"
              className="border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.08] backdrop-blur-3xl rounded-[24px] px-6 py-2 transition-all duration-300 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex items-center gap-3 font-bold text-zinc-100 text-sm tracking-tight">
                  <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <GraduationCap className="h-4 w-4 text-emerald-400" />
                  </div>
                  Academic Foundation
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-5 pt-2 pb-6 border-t border-white/[0.03]">
                {resumeData.education.map((edu, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.03] border border-white/[0.05] relative space-y-4 transition-all shadow-sm group/edu mt-4"
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteEducation(idx)}
                      className="absolute top-3 right-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover/edu:opacity-100 transition-all duration-300 h-8 w-8 rounded-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">
                          Institution Name
                        </Label>
                        <Input
                          value={edu.institution}
                          onChange={(e) =>
                            updateEducation(idx, "institution", e.target.value)
                          }
                          placeholder="University System"
                          className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-emerald-500/40 text-sm text-zinc-200 rounded-xl h-10 px-3.5 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">Degree / Credential</Label>
                        <Input
                          value={edu.degree}
                          onChange={(e) =>
                            updateEducation(idx, "degree", e.target.value)
                          }
                          placeholder="B.S. / M.S. Discipline"
                          className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-emerald-500/40 text-sm text-zinc-200 rounded-xl h-10 px-3.5 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">Term Interval</Label>
                        <Input
                          value={edu.period}
                          onChange={(e) =>
                            updateEducation(idx, "period", e.target.value)
                          }
                          placeholder="e.g., 2019 - 2023"
                          className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-emerald-500/40 text-sm text-zinc-200 font-mono rounded-xl h-10 px-3.5 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">Locality</Label>
                        <Input
                          value={edu.location}
                          onChange={(e) =>
                            updateEducation(idx, "location", e.target.value)
                          }
                          placeholder="City, ST"
                          className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-emerald-500/40 text-sm text-zinc-200 rounded-xl h-10 px-3.5 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={addEducation}
                  variant="outline"
                  className="w-full h-12 border-dashed border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.12] text-zinc-400 hover:text-zinc-200 rounded-2xl text-xs font-bold transition-all shadow-inner"
                >
                  <Plus className="h-4 w-4 mr-2 opacity-60" /> Add Academic Matrix Node
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* Section E: Projects */}
            <AccordionItem
              value="projects"
              className="border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.08] backdrop-blur-3xl rounded-[24px] px-6 py-2 transition-all duration-300 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex items-center gap-3 font-bold text-zinc-100 text-sm tracking-tight">
                  <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
                    <FileText className="h-4 w-4 text-sky-400" />
                  </div>
                  Key Project Nodes
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-2 pb-6 border-t border-white/[0.03]">
                {resumeData.projects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.03] border border-white/[0.05] relative space-y-4 transition-all shadow-sm group/proj mt-4"
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteProject(idx)}
                      className="absolute top-3 right-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover/proj:opacity-100 transition-all duration-300 h-8 w-8 rounded-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">Project Title</Label>
                        <Input
                          value={proj.name}
                          onChange={(e) =>
                            updateProject(idx, "name", e.target.value)
                          }
                          placeholder="Core Module System"
                          className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-sky-500/40 text-sm text-zinc-200 rounded-xl h-10 px-3.5 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1 flex items-center gap-1">
                          Target Link <span className="text-[8px] opacity-40">(Optional)</span>
                        </Label>
                        <Input
                          value={proj.link}
                          onChange={(e) =>
                            updateProject(idx, "link", e.target.value)
                          }
                          placeholder="github.com/repo"
                          className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-sky-500/40 text-sm text-zinc-200 font-mono rounded-xl h-10 px-3.5 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 ml-1">Architecture Summary</Label>
                      <Input
                        value={proj.description}
                        onChange={(e) =>
                          updateProject(idx, "description", e.target.value)
                        }
                        placeholder="Abstract encapsulating technical stack and overall system deliverables..."
                        className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-sky-500/40 text-sm text-zinc-200 rounded-xl h-10 px-3.5 transition-all"
                      />
                    </div>
                    <div className="space-y-3 text-left">
                      <Label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 ml-1 mt-1">
                        Project Delivery Highlights
                      </Label>
                      <div className="space-y-2.5">
                        {proj.highlights?.map((b, bIdx) => (
                          <div key={bIdx} className="flex gap-2 group/proj-bullet">
                            <Input
                              value={b}
                              onChange={(e) => {
                                const nextH = [...(proj.highlights || [])];
                                nextH[bIdx] = e.target.value;
                                updateProject(idx, "highlights", nextH);
                              }}
                              className="bg-white/[0.01] border-white/[0.06] focus:border-sky-500/40 text-sm text-zinc-200 rounded-xl px-3.5 h-10 transition-all flex-1"
                              placeholder="System optimization metrics achieved..."
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                const nextH = proj.highlights.filter(
                                  (_, i) => i !== bIdx,
                                );
                                updateProject(idx, "highlights", nextH);
                              }}
                              className="h-10 w-10 shrink-0 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent rounded-xl opacity-0 group-hover/proj-bullet:opacity-100 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updateProject(idx, "highlights", [
                            ...(proj.highlights || []),
                            "",
                          ])
                        }
                        className="text-[11px] text-sky-400 hover:text-sky-300 font-bold px-1.5 hover:bg-sky-500/5 transition-all flex items-center gap-1.5 mt-1 rounded-lg"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Project Metric
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={addProject}
                  variant="outline"
                  className="w-full h-12 border-dashed border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.12] text-zinc-400 hover:text-zinc-200 rounded-2xl text-xs font-bold transition-all shadow-inner"
                >
                  <Plus className="h-4 w-4 mr-2 opacity-60" /> Append Project Matrix Node
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* Section F: Certifications */}
            <AccordionItem
              value="certifications"
              className="border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.08] backdrop-blur-3xl rounded-[24px] px-6 py-2 transition-all duration-300 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex items-center gap-3 font-bold text-zinc-100 text-sm tracking-tight">
                  <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <Trophy className="h-4 w-4 text-amber-400" />
                  </div>
                  Industry Credentials
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-6 border-t border-white/[0.03]">
                <div className="space-y-3 pt-4">
                  {resumeData.certifications.map((cert, idx) => (
                    <div key={idx} className="flex gap-3 group/cert">
                      <Input
                        value={cert}
                        onChange={(e) => updateCertification(idx, e.target.value)}
                        placeholder="e.g., AWS Certified Architect"
                        className="bg-white/[0.02] focus:bg-white/[0.04] border-white/[0.06] focus:border-amber-500/40 text-sm text-zinc-200 rounded-xl h-11 px-3.5 transition-all flex-1"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteCertification(idx)}
                        className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent rounded-xl h-11 w-11 shrink-0 opacity-0 group-hover/cert:opacity-100 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={addCertification}
                  variant="outline"
                  className="w-full h-11 border-dashed border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.12] text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-bold transition-all mt-2"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Credential Node
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* RIGHT COLUMN: ATS Intelligence Hub & Actions (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 space-y-6">
            {/* Job Description + ATS Trigger */}
            <Card className="p-7 border border-white/[0.08] bg-[#0a0a0f] backdrop-blur-3xl rounded-[32px] space-y-5 relative overflow-hidden shadow-[0_32px_64px_-24px_rgba(0,0,0,0.9)]">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

              <div className="flex items-center gap-2.5 mb-1 select-none">
                <div className="p-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-zinc-400">
                  <Trophy className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-xs font-black tracking-[0.15em] uppercase text-zinc-400 font-mono">
                  ATS Analytical Core
                </h3>
              </div>

              {/* JD Input */}
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-500 ml-1 flex items-center gap-1.5">
                  <span>🎯 Target Job Matrix</span>
                </Label>
                <Textarea
                  placeholder="Paste raw Job Description to calibrate parser index..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[90px] bg-white/[0.02] border-white/[0.06] focus:bg-white/[0.03] focus:border-white/[0.15] focus:ring-0 text-sm text-zinc-200 resize-none rounded-2xl px-4 py-3 leading-relaxed placeholder:text-zinc-600 transition-all"
                />
              </div>

              {/* Primary ATS Button — Monolithic Stark Aesthetic */}
              <Button
                onClick={handleRunATSAnalysis}
                disabled={isScoring}
                className="w-full rounded-2xl h-12 font-black text-xs tracking-wider uppercase bg-white text-black hover:bg-zinc-200 border-none shadow-[0_12px_40px_-8px_rgba(255,255,255,0.15)] hover:shadow-[0_16px_48px_-4px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isScoring ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trophy className="h-4 w-4" />
                )}
                {isScoring ? "Executing Core Analysis..." : "Compute ATS Grade"}
              </Button>

              {/* Secondary Actions */}
              <div className="grid grid-cols-1 pt-1">
                <Button
                  onClick={handleOptimizeBullets}
                  disabled={isOptimizing}
                  variant="outline"
                  className="rounded-2xl border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-zinc-300 font-bold text-xs h-11 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {isOptimizing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  )}
                  AI Bullet Optimizer
                </Button>
              </div>
            </Card>

            {/* ATS Intelligence Display */}
            <Card className="border border-white/[0.06] bg-zinc-950/40 backdrop-blur-3xl rounded-[32px] overflow-hidden flex flex-col min-h-[480px] shadow-2xl">
              <div className="p-6 border-b border-white/[0.04] flex items-center gap-2.5 select-none bg-white/[0.01]">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <Trophy className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                </div>
                <h3 className="font-bold tracking-tight text-zinc-200 text-sm">
                  Diagnostic Feed
                </h3>
              </div>

              {!atsReport ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">
                      No Analysis Ran Yet
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Click "Compute ATS Grade" above to run an advanced LLM
                      verification score against our HR models.
                    </p>
                  </div>
                </div>
              ) : (
                <Tabs
                  defaultValue="overview"
                  className="w-full flex flex-col flex-1"
                >
                  <TabsList className="w-full bg-background/20 rounded-none border-b border-border/50 h-11">
                    <TabsTrigger
                      value="overview"
                      className="flex-1 text-xs font-bold data-[state=active]:bg-background/40 select-none tracking-tight"
                    >
                      ⚡ Analysis Hub
                    </TabsTrigger>
                    <TabsTrigger
                      value="upgrades"
                      className="flex-1 text-xs font-bold data-[state=active]:bg-background/40 select-none tracking-tight"
                    >
                      🚀 Neural Upgrades
                    </TabsTrigger>
                  </TabsList>

                  {/* ── Tab A: Analysis Hub (Simplified Overview & Aspect Cards) ── */}
                  <TabsContent
                    value="overview"
                    className="p-6 space-y-6 flex-1 mt-0 max-h-[650px] overflow-y-auto custom-scrollbar"
                  >
                    {/* MASSIVE CENTRALIZED GAUGE HERO */}
                    <div className="flex flex-col items-center justify-center py-4 select-none">
                      {(() => {
                        const score = atsReport.score || 0;

                        return (
                          <div className="relative h-32 w-32 flex items-center justify-center animate-in zoom-in-75 duration-500">
                            <div className="absolute inset-0 rounded-full bg-white/[0.02] blur-xl transition-all duration-700" />
                            <svg
                              className="h-full w-full -rotate-90 drop-shadow-[0_0_20px_rgba(168,85,247,0.3)] relative z-10"
                              viewBox="0 0 36 36"
                            >
                              <defs>
                                <linearGradient id="atsNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#a855f7" />
                                  <stop offset="50%" stopColor="#6366f1" />
                                  <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                              </defs>
                              <path
                                className="stroke-white/[0.03]"
                                strokeWidth="3.5"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <motion.path
                                stroke="url(#atsNeonGrad)"
                                strokeWidth="3.5"
                                strokeDasharray={`${score}, 100`}
                                strokeLinecap="round"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{
                                  duration: 1.5,
                                  ease: "easeOut",
                                }}
                              />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center text-center z-10 mt-0.5">
                              <span className="font-black text-4xl leading-none transition-all duration-500 text-white tracking-tighter">
                                {score}
                              </span>
                              <span className="text-[8px] font-bold text-zinc-500 tracking-widest uppercase mt-1 select-none">
                                ATS Index
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* 2X2 SIMPLIFIED METRICS GRID */}
                    <div className="grid grid-cols-2 gap-3.5 mt-3">
                      {Object.entries(atsReport.aspects).map(
                        ([key, aspect]: [string, any]) => {
                          const cleanName = key.replace("_", " ");

                          return (
                            <div
                              key={key}
                              className="border border-white/[0.04] bg-white/[0.01] rounded-[20px] p-4 transition-all duration-300 hover:bg-white/[0.02] hover:border-white/[0.08] text-left"
                            >
                              <div className="flex items-center justify-between mb-2.5 select-none">
                                <span className="capitalize font-bold text-[11px] text-zinc-400 tracking-tight leading-none font-mono">
                                  {cleanName}
                                </span>
                                <span className="text-xs font-black font-mono text-zinc-200 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded">
                                  {aspect.rating}
                                </span>
                              </div>
                              <p
                                className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2 select-none hover:line-clamp-none cursor-pointer transition-all duration-300 font-medium"
                                title={aspect.why}
                              >
                                {aspect.why}
                              </p>
                            </div>
                          );
                        },
                      )}
                    </div>

                    {/* Strategic Narrative */}
                    <div className="space-y-3 border-t border-white/[0.04] pt-5 mt-2">
                      <Label className="text-[10px] font-extrabold tracking-widest uppercase text-zinc-500 flex items-center gap-1.5 select-none ml-1">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />{" "}
                        Strategic Executive Summary
                      </Label>
                      <div className="text-xs leading-relaxed font-medium bg-white/[0.01] rounded-2xl p-4 border border-white/[0.04] text-zinc-400 text-left select-none shadow-sm">
                        {atsReport.general_feedback}
                      </div>
                    </div>
                  </TabsContent>

                  {/* ── Tab B: Neural Upgrades (Keywords + Recommendations Unified) ── */}
                  <TabsContent
                    value="upgrades"
                    className="p-6 space-y-6 flex-1 mt-0 max-h-[650px] overflow-y-auto custom-scrollbar"
                  >
                    {/* INTERACTIVE KEYWORDS DOCK */}
                    <div className="space-y-3 bg-white/[0.01] rounded-2xl p-5 border border-white/[0.04] relative overflow-hidden shadow-sm text-left">
                      <div className="space-y-1 relative z-10">
                        <h4 className="font-bold text-zinc-200 text-xs flex items-center gap-1.5 select-none font-mono uppercase tracking-wider">
                          🔍 Deficit Keyword Matrix
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                          Technical tokens missing from active node schemas. Tap classifier to inject automatically.
                        </p>
                      </div>

                      {atsReport.missing_keywords.length === 0 ? (
                        <div className="bg-white/[0.01] border border-dashed border-white/[0.06] rounded-xl p-4 text-xs text-emerald-400 text-center flex items-center justify-center gap-2 select-none font-mono">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 animate-pulse" />{" "}
                          Complete Ledger Coverage
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 pt-1 relative z-10">
                          {atsReport.missing_keywords.map((keyword, i) => {
                            const isAlreadyAdded =
                              injectedKeywords.includes(keyword);

                            return (
                              <Badge
                                key={i}
                                onClick={() => {
                                  if (isAlreadyAdded) return;

                                  setResumeData((prev) => {
                                    const nextSkills = [...prev.skills];
                                    if (nextSkills[0]) {
                                      nextSkills[0] = {
                                        ...nextSkills[0],
                                        items: Array.from(
                                          new Set([
                                            ...nextSkills[0].items,
                                            keyword,
                                          ]),
                                        ),
                                      };
                                    }
                                    return { ...prev, skills: nextSkills };
                                  });

                                  setInjectedKeywords((p) => [...p, keyword]);
                                  toast({
                                    title: `Injected "${keyword}"`,
                                    description:
                                      "Successfully appended keyword to Tech Skills.",
                                  });
                                }}
                                className={`transition-all duration-300 select-none px-2.5 py-1 rounded-lg flex items-center gap-1 text-[10px] border leading-none tracking-tight font-mono ${
                                  isAlreadyAdded
                                    ? "bg-white/[0.05] text-zinc-400 border-white/[0.06] cursor-default opacity-70"
                                    : "bg-white/[0.01] text-zinc-300 hover:bg-white hover:text-black hover:border-white border-white/[0.06] cursor-pointer active:scale-95 shadow-sm"
                                }`}
                              >
                                {isAlreadyAdded ? (
                                  <>
                                    <CheckCircle2 className="h-2.5 w-2.5 animate-in zoom-in" />{" "}
                                    Injected
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-2.5 w-2.5 opacity-40" />{" "}
                                    {keyword}
                                  </>
                                )}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* BULLET POINT REFACTORS FEED */}
                    {atsReport.bullet_point_suggestions.length > 0 && (
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between px-1">
                          <Label className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-500 flex items-center gap-1.5 select-none font-mono">
                            ✏️ Neural Optimization Feed
                          </Label>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              atsReport.bullet_point_suggestions.forEach(
                                (sug) => applyRefactor(sug.original, sug.improved)
                              );
                            }}
                            className="h-6 px-3 rounded-full text-[9px] font-black tracking-wider uppercase bg-white hover:bg-zinc-200 text-black border-none shrink-0 transition-all shadow-sm active:scale-95"
                          >
                            Batch Deploy ({atsReport.bullet_point_suggestions.length})
                          </Button>
                        </div>

                        <div className="space-y-3.5 pr-0.5 mt-2">
                          {atsReport.bullet_point_suggestions.map(
                            (sug, idx) => {
                              const norm = (s: string) =>
                                s
                                  .toLowerCase()
                                  .replace(/[^\w\s]/g, "")
                                  .replace(/\s+/g, " ")
                                  .trim();
                              const normalizedImproved = norm(sug.improved);

                              const isApplied =
                                appliedSuggestions.includes(normalizedImproved) ||
                                resumeData.experience.some((job) =>
                                  job.highlights.some(
                                    (h) => norm(h) === normalizedImproved,
                                  ),
                                ) ||
                                resumeData.projects.some((proj) =>
                                  (proj.highlights || []).some(
                                    (h) => norm(h) === normalizedImproved,
                                  ),
                                );

                              return (
                                <div
                                  key={idx}
                                  className={`border rounded-2xl overflow-hidden text-xs transition-all duration-500 group relative text-left ${
                                    isApplied
                                      ? "border-white/[0.15] bg-white/[0.02] shadow-inner"
                                      : "border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08]"
                                  }`}
                                >
                                  <div className="bg-white/[0.01] text-zinc-400 px-4 py-3.5 border-b border-white/[0.04] border-dashed flex gap-2 leading-relaxed font-medium text-[11px]">
                                    <span className="font-black uppercase text-[9px] text-zinc-600 shrink-0 pt-0.5 tracking-widest select-none font-mono">
                                      Original:
                                    </span>
                                    <span
                                      className={
                                        isApplied
                                          ? "line-through opacity-30 transition-opacity duration-500"
                                          : ""
                                      }
                                    >
                                      "{sug.original}"
                                    </span>
                                  </div>
                                  <div className="bg-transparent text-white px-4 py-3.5 flex items-start justify-between gap-4 leading-relaxed text-[11px] font-semibold">
                                    <div className="flex-1">
                                      <span className="font-black uppercase text-[9px] text-zinc-400 shrink-0 mr-1.5 tracking-widest select-none font-mono">
                                        Optimized:
                                      </span>
                                      <span className="text-zinc-200">
                                        "{sug.improved}"
                                      </span>
                                    </div>
                                    {isApplied ? (
                                      <Badge className="bg-white/[0.05] text-emerald-400 border border-emerald-500/20 text-[9px] font-bold shrink-0 select-none px-2.5 py-0.5 flex items-center gap-1 animate-in zoom-in-95 duration-300 rounded-lg font-mono">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />{" "}
                                        Deployed
                                      </Badge>
                                    ) : (
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() =>
                                          applyRefactor(
                                            sug.original,
                                            sug.improved,
                                          )
                                        }
                                        className="h-7 px-3.5 rounded-lg text-[10px] font-extrabold bg-white hover:bg-zinc-200 text-black border-none shrink-0 transition-all mt-0.5 shadow-sm active:scale-95 tracking-tight"
                                      >
                                        Apply
                                      </Button>
                                    )}
                                  </div>
                                  {sug.reason && (
                                    <div className="bg-white/[0.01] px-4 py-2.5 border-t border-white/[0.03] text-[10px] text-zinc-500 italic flex items-center gap-2 leading-relaxed font-medium select-none">
                                      <Sparkles className="h-3 w-3 text-indigo-400/70 shrink-0" />{" "}
                                      <span>{sug.reason}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
