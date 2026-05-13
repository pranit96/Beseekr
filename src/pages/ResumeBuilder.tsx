// src/pages/ResumeBuilder.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  UploadCloud,
  Sparkles,
  Trophy,
  Download,
  ChevronRight,
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
import { ResumeSchema, ATSAnalysis, resumeApi } from "@/api/resume";

const EMPTY_RESUME: ResumeSchema = {
  personal_info: {
    name: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    summary: "",
  },
  experience: [],
  education: [],
  skills: [{ category: "Technical Skills", items: [] }],
  projects: [],
  certifications: [],
};

const PRESET_TEMPLATE: ResumeSchema = {
  personal_info: {
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    phone: "(555) 123-4567",
    location: "San Francisco, CA",
    website: "linkedin.com/in/alexj",
    summary:
      "Result-driven software professional with 4 years of expertise constructing high-scalability web infrastructures and robust microservices. Adept at accelerating cross-functional delivery timelines using modern agile engineering principles.",
  },
  experience: [
    {
      company: "Stripe",
      position: "Software Engineer II",
      location: "San Francisco, CA",
      period: "Jan 2023 - Present",
      highlights: [
        "Architected redundant internal processing middleware, yielding a 12% reduction in latency overhead.",
        "Spearheaded refactoring initiative for merchant dashboard interface utilizing React, raising Lighthouse performance metrics from 72 to 95.",
      ],
    },
  ],
  education: [
    {
      institution: "Stanford University",
      degree: "Bachelor of Science in Computer Science",
      period: "Sept 2017 - June 2021",
    },
  ],
  skills: [
    {
      category: "Languages",
      items: ["JavaScript", "TypeScript", "Go", "Python", "SQL"],
    },
    {
      category: "Frameworks",
      items: ["React", "Node.js", "Next.js", "Express", "Tailwind CSS"],
    },
  ],
  projects: [
    {
      name: "Distributed Event Pipeline",
      description:
        "Engineered custom Pub/Sub streaming pipeline resolving payload delivery bottlenecks.",
      highlights: [
        "Safely process 50k payloads hourly with 99.98% fault-tolerance validation.",
      ],
    },
  ],
  certifications: ["AWS Solutions Architect Associate"],
};

export default function ResumeBuilder() {
  const { toast } = useToast();

  // App flow state
  const [step, setStep] = useState<"start" | "loading" | "workspace">("start");
  const [loadingMsg, setLoadingMsg] = useState("Parsing Resume...");

  // Core functional state
  const [resumeData, setResumeData] = useState<ResumeSchema>(EMPTY_RESUME);
  const [jobDescription, setJobDescription] = useState("");
  const [atsReport, setAtsReport] = useState<ATSAnalysis | null>(null);
  const [injectedKeywords, setInjectedKeywords] = useState<string[]>([]);
  const [isScoring, setIsScoring] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Cloud Persistence & Auto-Save State
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // ── Effect: Fetch Persistent Draft on Mount ────────────────────────
  useEffect(() => {
    async function fetchDraft() {
      try {
        const draft = await resumeApi.getResumeDraft();
        if (
          draft &&
          draft.resume_data &&
          Object.keys(draft.resume_data.personal_info || {}).length > 0
        ) {
          setResumeData(draft.resume_data);
          setJobDescription(draft.job_description || "");
          setStep("workspace");
          setSaveStatus("saved");
          toast({
            title: "Welcome back!",
            description: "Successfully loaded your latest saved draft.",
          });
        }
      } catch (error) {
        console.error("Failed to load persistent draft:", error);
      } finally {
        setIsFirstLoad(false);
      }
    }
    fetchDraft();
  }, []);

  // ── Effect: Auto-Save Loop (Debounced) ──────────────────────────────
  useEffect(() => {
    // Prevent saving empty defaults during initial load boot
    if (isFirstLoad || step !== "workspace") return;

    setSaveStatus("saving");
    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsSaving(true);
        await resumeApi.saveResumeDraft(resumeData, jobDescription);
        setSaveStatus("saved");
      } catch (error) {
        console.error("Auto-save draft failed:", error);
        setSaveStatus("error");
      } finally {
        setIsSaving(false);
      }
    }, 2000); // 2 Second Debounce

    return () => clearTimeout(delayDebounceFn);
  }, [resumeData, jobDescription, isFirstLoad, step]);

  // ── Handlers: Step 1 Start ──────────────────────────────────────────
  const handleStartBlank = () => {
    setResumeData(PRESET_TEMPLATE);
    setStep("workspace");
    toast({
      title: "Template loaded!",
      description: "Go ahead and start editing.",
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingMsg("Reading document files...");
    setStep("loading");

    try {
      setLoadingMsg("Extracting content structures...");
      const parsed = await resumeApi.uploadAndParseResume(file);

      setLoadingMsg("Formatting parsed output schemas...");
      setResumeData(parsed);
      setStep("workspace");

      toast({
        title: "Resume extracted!",
        description: "Parsed flawlessly into the workspace editor.",
      });
    } catch (error: any) {
      setStep("start");
      toast({
        variant: "destructive",
        title: "Upload failure",
        description: error.message || "Check if file format is valid.",
      });
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
    // 1. Try matching inside regular professional experience
    let matched = false;
    setResumeData((prev) => {
      const updatedExp = prev.experience.map((job) => {
        const bulletIdx = job.highlights.findIndex(
          (h) =>
            h.toLowerCase().trim() === original.toLowerCase().trim() ||
            original.toLowerCase().trim().includes(h.toLowerCase().trim()),
        );
        if (bulletIdx !== -1) {
          matched = true;
          const newHighlights = [...job.highlights];
          newHighlights[bulletIdx] = improved;
          return { ...job, highlights: newHighlights };
        }
        return job;
      });

      // 2. Try matching inside key projects highlights
      const updatedProj = prev.projects.map((proj) => {
        const bulletIdx = (proj.highlights || []).findIndex(
          (h) =>
            h.toLowerCase().trim() === original.toLowerCase().trim() ||
            original.toLowerCase().trim().includes(h.toLowerCase().trim()),
        );
        if (bulletIdx !== -1) {
          matched = true;
          const newHighlights = [...proj.highlights];
          newHighlights[bulletIdx] = improved;
          return { ...proj, highlights: newHighlights };
        }
        return proj;
      });

      return { ...prev, experience: updatedExp, projects: updatedProj };
    });

    if (matched) {
      toast({
        title: "Refactor Applied!",
        description:
          "Successfully injected the optimized bullet into your resume.",
      });
    } else {
      // Manual copy fallback in case match string drifted
      navigator.clipboard.writeText(improved);
      toast({
        title: "Copied to Clipboard",
        description:
          "Could not automatically match exactly; copied text so you can paste manually!",
      });
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {/* ─── STEP 1: SELECTION VIEW ───────────────────────────────────── */}
        {step === "start" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto py-12"
          >
            <div className="text-center mb-12 space-y-4">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1 border-none select-none text-xs uppercase tracking-widest font-bold">
                ✨ Feature Beta
              </Badge>
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white via-white/90 to-white/50 bg-clip-text text-transparent leading-tight">
                ATS-Smart Resume Intelligence
              </h1>
              <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
                Upload an existing resume or start blank. Our agent scans,
                grades, and optimizes every bullet point to land interviews.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Card 1: Upload Scan */}
              <Card className="p-8 border border-border/50 bg-card/5 backdrop-blur-xl rounded-3xl flex flex-col items-center hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-500 group shadow-2xl shadow-black/20">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 group-hover:scale-105 transition-transform">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Scan & Score Existing
                </h3>
                <p className="text-muted-foreground text-sm text-center mb-8 flex-1 leading-relaxed">
                  Upload PDF/DOCX. We will instantly ingest content into the
                  editor, compute an ATS matching grade, and recommend
                  refactors.
                </p>
                <div className="w-full relative">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Button className="w-full rounded-2xl h-12 font-bold bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors">
                    Choose Resume File
                  </Button>
                </div>
              </Card>

              {/* Card 2: Blank Preset */}
              <Card className="p-8 border border-border/50 bg-card/5 backdrop-blur-xl rounded-3xl flex flex-col items-center hover:border-blue-500/40 hover:bg-blue-500/[0.02] transition-all duration-500 group shadow-2xl shadow-black/20">
                <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-105 transition-transform">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Build with AI Template
                </h3>
                <p className="text-muted-foreground text-sm text-center mb-8 flex-1 leading-relaxed">
                  No resume ready? Start from a single-column, ATS-optimized
                  industry template preset and easily enter your custom details.
                </p>
                <Button
                  onClick={handleStartBlank}
                  variant="secondary"
                  className="w-full rounded-2xl h-12 font-bold border border-border shadow-lg group-hover:bg-blue-500/10 transition-all"
                >
                  Start from Template{" "}
                  <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Card>
            </div>

            {/* Data Privacy Compliance Notice */}
            <div className="mt-12 flex items-center justify-center gap-2 px-6 py-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl max-w-2xl mx-auto">
              <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0 animate-pulse" />
              <p className="text-xs text-muted-foreground font-medium text-center leading-relaxed">
                <strong className="text-amber-400/90">
                  PII Data Retention Notice:
                </strong>{" "}
                In compliance with secure processing standards, all resume
                assets and live working drafts are permanently auto-deleted
                after{" "}
                <span className="text-white font-bold underline decoration-amber-500/50 underline-offset-2">
                  45 days
                </span>{" "}
                of inactivity.
              </p>
            </div>
          </motion.div>
        )}

        {/* ─── STEP 2: PROCESSING OVERLAY ────────────────────────────────── */}
        {step === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[60vh] flex flex-col items-center justify-center py-20 space-y-6"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-white animate-pulse">
                Multi-Agent Intelligence Active
              </h3>
              <p className="text-muted-foreground text-sm">{loadingMsg}</p>
            </div>
          </motion.div>
        )}

        {/* ─── STEP 3: SPLIT WORKSPACE ─────────────────────────────────────── */}
        {step === "workspace" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-12 gap-8 py-4"
          >
            {/* LEFT COLUMN: Workspace Editor & Data Form (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setStep("start")}
                    className="rounded-xl h-9 w-9 shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-2xl font-extrabold tracking-tight text-white">
                        Resume Editor Workspace
                      </h2>
                      {/* Cloud Sync Status Pill */}
                      {saveStatus === "saving" && (
                        <Badge className="bg-yellow-500/10 text-yellow-400 border-none px-2 py-0.5 text-[10px] animate-pulse font-semibold">
                          Saving Draft...
                        </Badge>
                      )}
                      {saveStatus === "saved" && (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-none px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Cloud Synced
                        </Badge>
                      )}
                      {saveStatus === "error" && (
                        <Badge className="bg-red-500/10 text-red-400 border-none px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                          <X className="h-2.5 w-2.5" /> Cloud Sync Error
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Modify fields dynamically. Auto-formatted for exports.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleExportPdf}
                  disabled={isDownloading}
                  className="rounded-xl font-bold shadow-md bg-emerald-600 hover:bg-emerald-500"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export PDF
                </Button>
              </div>

              {/* Job Description (Optional input box) */}
              <Card className="p-5 border-border/50 bg-card/5 backdrop-blur-xl rounded-2xl">
                <Label className="text-sm font-bold flex items-center gap-2 mb-2 text-white">
                  💼 Target Job Description{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (Optional but Recommended)
                  </span>
                </Label>
                <Textarea
                  placeholder="Paste the Target Job Listing copy here. We will scan it for required skills, compute an ATS matching ratio, and refactor your text keywords to match perfectly."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[100px] bg-background/40 resize-none rounded-xl border-border/50"
                />
              </Card>

              {/* Accordion Fields */}
              <Accordion
                type="multiple"
                defaultValue={["personal", "experience"]}
                className="space-y-4 border-none"
              >
                {/* Section Theme Styling */}
                <AccordionItem
                  value="styling"
                  className="border border-border/50 bg-gradient-to-r from-purple-500/5 via-card/5 to-card/5 backdrop-blur-xl rounded-2xl px-5 overflow-hidden"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 font-bold text-white">
                      <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />{" "}
                      🎨 Professional Styling Theme
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-2 pb-5">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label className="text-xs font-semibold text-muted-foreground">
                          Document Primary Color Theme
                        </Label>
                        <div className="flex items-center gap-3.5 py-1">
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
                                updateStyleConfig(
                                  "primaryColor",
                                  theme.primary,
                                );
                                updateStyleConfig("accentColor", theme.accent);
                              }}
                              className={`relative h-8 w-8 rounded-full border transition-all flex items-center justify-center ${
                                (resumeData.styles?.primaryColor ||
                                  "#1A365D") === theme.primary
                                  ? "border-white scale-110 ring-2 ring-white/20"
                                  : "border-border/50 hover:scale-105 hover:border-white/50"
                              }`}
                              style={{ backgroundColor: theme.primary }}
                            >
                              {(resumeData.styles?.primaryColor ||
                                "#1A365D") === theme.primary && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-white bg-black/20 rounded-full" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <Label className="text-xs font-semibold text-muted-foreground">
                          Typography Layout Font
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              updateStyleConfig("fontFamily", "Sans")
                            }
                            className={`rounded-xl h-9 font-medium text-xs ${
                              (resumeData.styles?.fontFamily || "Sans") ===
                              "Sans"
                                ? "border-primary bg-primary/5 text-white"
                                : "border-border/50"
                            }`}
                          >
                            Modern Sans-Serif
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              updateStyleConfig("fontFamily", "Serif")
                            }
                            className={`rounded-xl h-9 font-serif text-xs font-bold ${
                              resumeData.styles?.fontFamily === "Serif"
                                ? "border-primary bg-primary/5 text-white"
                                : "border-border/50"
                            }`}
                          >
                            Classic Serif (Times)
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Section A: Personal */}
                <AccordionItem
                  value="personal"
                  className="border border-border/50 bg-card/5 backdrop-blur-xl rounded-2xl px-5 overflow-hidden"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 font-bold text-white">
                      <User className="h-4 w-4 text-primary" /> Personal
                      Information
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2 pb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Full Name</Label>
                        <Input
                          value={resumeData.personal_info.name}
                          onChange={(e) =>
                            updatePersonalInfo("name", e.target.value)
                          }
                          placeholder="Full Name"
                          className="bg-background/30 rounded-lg border-border/50 h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Email Address</Label>
                        <Input
                          value={resumeData.personal_info.email}
                          onChange={(e) =>
                            updatePersonalInfo("email", e.target.value)
                          }
                          placeholder="Email"
                          className="bg-background/30 rounded-lg border-border/50 h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Phone Number</Label>
                        <Input
                          value={resumeData.personal_info.phone}
                          onChange={(e) =>
                            updatePersonalInfo("phone", e.target.value)
                          }
                          placeholder="Phone"
                          className="bg-background/30 rounded-lg border-border/50 h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Website / Link</Label>
                        <Input
                          value={resumeData.personal_info.website}
                          onChange={(e) =>
                            updatePersonalInfo("website", e.target.value)
                          }
                          placeholder="LinkedIn or Portfolio"
                          className="bg-background/30 rounded-lg border-border/50 h-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Professional Summary</Label>
                      <Textarea
                        value={resumeData.personal_info.summary}
                        onChange={(e) =>
                          updatePersonalInfo("summary", e.target.value)
                        }
                        placeholder="Write a brief 2-3 sentence professional snapshot."
                        className="bg-background/30 rounded-lg border-border/50 min-h-[80px]"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Section B: Experience */}
                <AccordionItem
                  value="experience"
                  className="border border-border/50 bg-card/5 backdrop-blur-xl rounded-2xl px-5 overflow-hidden"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 font-bold text-white">
                      <Briefcase className="h-4 w-4 text-blue-400" /> Work
                      Experience
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-2 pb-4">
                    {resumeData.experience.map((exp, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-background/30 border border-border/50 relative space-y-4"
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteExperience(idx)}
                          className="absolute top-2 right-2 text-muted-foreground hover:text-red-400 h-8 w-8 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Company</Label>
                            <Input
                              value={exp.company}
                              onChange={(e) =>
                                updateExperience(idx, "company", e.target.value)
                              }
                              placeholder="Company"
                              className="bg-background/50 rounded-lg h-9"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Position Title</Label>
                            <Input
                              value={exp.position}
                              onChange={(e) =>
                                updateExperience(
                                  idx,
                                  "position",
                                  e.target.value,
                                )
                              }
                              placeholder="Position Title"
                              className="bg-background/50 rounded-lg h-9"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Date Period</Label>
                            <Input
                              value={exp.period}
                              onChange={(e) =>
                                updateExperience(idx, "period", e.target.value)
                              }
                              placeholder="e.g. Jan 2022 - Present"
                              className="bg-background/50 rounded-lg h-9"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Location</Label>
                            <Input
                              value={exp.location}
                              onChange={(e) =>
                                updateExperience(
                                  idx,
                                  "location",
                                  e.target.value,
                                )
                              }
                              placeholder="Location"
                              className="bg-background/50 rounded-lg h-9"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold">
                            Impact Highlights (Bullet Points)
                          </Label>
                          {exp.highlights.map((bullet, bIdx) => (
                            <div key={bIdx} className="flex gap-2">
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
                                className="bg-background/50 border-border/50 min-h-[60px] text-sm rounded-lg py-1.5"
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
                                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-red-400 rounded-lg"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              updateExperience(idx, "highlights", [
                                ...exp.highlights,
                                "",
                              ])
                            }
                            className="text-xs text-primary font-bold p-0 hover:bg-transparent flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" /> Add Bullet
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={addExperience}
                      variant="outline"
                      className="w-full border-dashed border-border/60 rounded-xl text-xs font-bold text-muted-foreground"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Work Experience
                      Block
                    </Button>
                  </AccordionContent>
                </AccordionItem>

                {/* Section C: Skills */}
                <AccordionItem
                  value="skills"
                  className="border border-border/50 bg-card/5 backdrop-blur-xl rounded-2xl px-5 overflow-hidden"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 font-bold text-white">
                      <Cpu className="h-4 w-4 text-purple-400" /> Skills &
                      Proficiencies
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2 pb-4">
                    {resumeData.skills.map((skill, idx) => (
                      <div key={idx} className="flex gap-4 items-start">
                        <div className="w-1/3 space-y-1">
                          <Label className="text-xs">Category</Label>
                          <Input
                            value={skill.category}
                            onChange={(e) =>
                              updateSkillGroup(
                                idx,
                                e.target.value,
                                skill.items.join(", "),
                              )
                            }
                            placeholder="e.g., Languages"
                            className="bg-background/30 border-border/50 h-9 rounded-lg font-bold text-xs"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">
                            Items (Comma separated)
                          </Label>
                          <Input
                            value={skill.items.join(", ")}
                            onChange={(e) =>
                              updateSkillGroup(
                                idx,
                                skill.category,
                                e.target.value,
                              )
                            }
                            placeholder="React, Node.js, Go"
                            className="bg-background/30 border-border/50 h-9 rounded-lg text-xs"
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
                          className="mt-6 h-9 w-9 shrink-0 text-muted-foreground hover:text-red-400 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      onClick={addSkillCategory}
                      variant="outline"
                      className="w-full border-dashed border-border/60 rounded-xl text-xs font-bold text-muted-foreground"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Skills Category
                      Row
                    </Button>
                  </AccordionContent>
                </AccordionItem>

                {/* Section D: Education */}
                <AccordionItem
                  value="education"
                  className="border border-border/50 bg-card/5 backdrop-blur-xl rounded-2xl px-5 overflow-hidden"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 font-bold text-white">
                      <GraduationCap className="h-4 w-4 text-emerald-400" />{" "}
                      Education
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2 pb-4">
                    {resumeData.education.map((edu, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-background/30 border border-border/50 relative space-y-3"
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteEducation(idx)}
                          className="absolute top-2 right-2 text-muted-foreground hover:text-red-400 h-8 w-8 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs">
                              Institution / University
                            </Label>
                            <Input
                              value={edu.institution}
                              onChange={(e) =>
                                updateEducation(
                                  idx,
                                  "institution",
                                  e.target.value,
                                )
                              }
                              placeholder="University Name"
                              className="bg-background/50 h-9 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Degree / Major</Label>
                            <Input
                              value={edu.degree}
                              onChange={(e) =>
                                updateEducation(idx, "degree", e.target.value)
                              }
                              placeholder="Degree / Major"
                              className="bg-background/50 h-9 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Period</Label>
                            <Input
                              value={edu.period}
                              onChange={(e) =>
                                updateEducation(idx, "period", e.target.value)
                              }
                              placeholder="e.g. 2018 - 2022"
                              className="bg-background/50 h-9 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">
                              Location (Optional)
                            </Label>
                            <Input
                              value={edu.location}
                              onChange={(e) =>
                                updateEducation(idx, "location", e.target.value)
                              }
                              placeholder="e.g. Boston, MA"
                              className="bg-background/50 h-9 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      onClick={addEducation}
                      variant="outline"
                      className="w-full border-dashed border-border/60 rounded-xl text-xs font-bold text-muted-foreground"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Education Entry
                    </Button>
                  </AccordionContent>
                </AccordionItem>

                {/* Section E: Projects */}
                <AccordionItem
                  value="projects"
                  className="border border-border/50 bg-card/5 backdrop-blur-xl rounded-2xl px-5 overflow-hidden"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 font-bold text-white">
                      <FileText className="h-4 w-4 text-sky-400" /> Key Projects
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-2 pb-4">
                    {resumeData.projects.map((proj, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-background/30 border border-border/50 relative space-y-3"
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteProject(idx)}
                          className="absolute top-2 right-2 text-muted-foreground hover:text-red-400 h-8 w-8 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Project Name</Label>
                            <Input
                              value={proj.name}
                              onChange={(e) =>
                                updateProject(idx, "name", e.target.value)
                              }
                              placeholder="Project Title"
                              className="bg-background/50 h-9 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">
                              Project Link (Optional)
                            </Label>
                            <Input
                              value={proj.link}
                              onChange={(e) =>
                                updateProject(idx, "link", e.target.value)
                              }
                              placeholder="github.com/..."
                              className="bg-background/50 h-9 rounded-lg"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Description Summary</Label>
                          <Input
                            value={proj.description}
                            onChange={(e) =>
                              updateProject(idx, "description", e.target.value)
                            }
                            placeholder="Brief project scope overview"
                            className="bg-background/50 h-9 rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold">
                            Project Highlights (Bullets)
                          </Label>
                          {proj.highlights?.map((b, bIdx) => (
                            <div key={bIdx} className="flex gap-2">
                              <Input
                                value={b}
                                onChange={(e) => {
                                  const nextH = [...(proj.highlights || [])];
                                  nextH[bIdx] = e.target.value;
                                  updateProject(idx, "highlights", nextH);
                                }}
                                className="bg-background/50 h-9 text-sm rounded-lg"
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
                                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-red-400 rounded-lg"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              updateProject(idx, "highlights", [
                                ...(proj.highlights || []),
                                "",
                              ])
                            }
                            className="text-xs text-primary font-bold p-0 hover:bg-transparent flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" /> Add Project Bullet
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      onClick={addProject}
                      variant="outline"
                      className="w-full border-dashed border-border/60 rounded-xl text-xs font-bold text-muted-foreground"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Project Entry
                    </Button>
                  </AccordionContent>
                </AccordionItem>

                {/* Section F: Certifications */}
                <AccordionItem
                  value="certifications"
                  className="border border-border/50 bg-card/5 backdrop-blur-xl rounded-2xl px-5 overflow-hidden"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 font-bold text-white">
                      <Trophy className="h-4 w-4 text-amber-400" />{" "}
                      Certifications
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2 pb-4">
                    {resumeData.certifications.map((cert, idx) => (
                      <div key={idx} className="flex gap-3">
                        <Input
                          value={cert}
                          onChange={(e) =>
                            updateCertification(idx, e.target.value)
                          }
                          placeholder="e.g., AWS Solutions Architect"
                          className="bg-background/50 h-9 rounded-lg flex-1"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteCertification(idx)}
                          className="text-muted-foreground hover:text-red-400 h-9 w-9 rounded-lg shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      onClick={addCertification}
                      variant="outline"
                      className="w-full border-dashed border-border/60 rounded-xl text-xs font-bold text-muted-foreground"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Certification
                      Entry
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* RIGHT COLUMN: ATS Intelligence Hub & Actions (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="sticky top-24 space-y-6">
                {/* AI Action Pad */}
                <Card className="p-6 border border-primary/20 bg-gradient-to-b from-primary/[0.05] to-card/5 backdrop-blur-xl rounded-3xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" /> Agent
                      Workspace Toolkit
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleRunATSAnalysis}
                      disabled={isScoring}
                      variant="outline"
                      className="rounded-xl border-primary/30 hover:bg-primary/10 font-bold text-xs h-10 transition-all"
                    >
                      {isScoring ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Trophy className="h-3.5 w-3.5 mr-1.5 text-yellow-400" />
                      )}
                      Compute ATS Grade
                    </Button>
                    <Button
                      onClick={handleOptimizeBullets}
                      disabled={isOptimizing}
                      className="rounded-xl bg-primary hover:bg-primary/90 font-bold text-xs h-10 transition-all text-white shadow-lg shadow-primary/10"
                    >
                      {isOptimizing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      AI Optimize Copy
                    </Button>
                  </div>
                </Card>

                {/* ATS Intelligence Display */}
                <Card className="border border-border/50 bg-card/5 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col min-h-[450px]">
                  <div className="p-6 border-b border-border/50 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-extrabold text-white">
                      ATS Quality Analysis
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
                      <TabsList className="w-full bg-background/20 rounded-none border-b border-border/50 h-10">
                        <TabsTrigger
                          value="overview"
                          className="flex-1 text-xs font-bold"
                        >
                          Overview
                        </TabsTrigger>
                        <TabsTrigger
                          value="aspects"
                          className="flex-1 text-xs font-bold"
                        >
                          Aspect Details
                        </TabsTrigger>
                        <TabsTrigger
                          value="keywords"
                          className="flex-1 text-xs font-bold"
                        >
                          Keywords
                        </TabsTrigger>
                      </TabsList>

                      {/* Tab A: Overview */}
                      <TabsContent
                        value="overview"
                        className="p-6 space-y-6 flex-1 mt-0"
                      >
                        <div className="flex items-center gap-6">
                          {/* Interactive Gauge Graphic */}
                          {(() => {
                            const score = atsReport.score || 0;
                            const colorClass =
                              score >= 80
                                ? "emerald"
                                : score >= 60
                                  ? "amber"
                                  : "red";
                            const strokeHex =
                              score >= 80
                                ? "#10b981"
                                : score >= 60
                                  ? "#f59e0b"
                                  : "#ef4444";

                            return (
                              <div className="relative h-24 w-24 flex items-center justify-center shrink-0">
                                {/* Background Radial Glow */}
                                <div
                                  className={`absolute inset-0 rounded-full blur-xl opacity-20 transition-colors duration-500 ${
                                    colorClass === "emerald"
                                      ? "bg-emerald-500"
                                      : colorClass === "amber"
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                  }`}
                                />

                                <svg
                                  className="h-full w-full -rotate-90 drop-shadow-md relative z-10"
                                  viewBox="0 0 36 36"
                                >
                                  <path
                                    className="stroke-white/5"
                                    strokeWidth="3.5"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  />
                                  <motion.path
                                    stroke={strokeHex}
                                    strokeWidth="3.5"
                                    strokeDasharray={`${score}, 100`}
                                    strokeLinecap="round"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{
                                      duration: 1.2,
                                      ease: "easeOut",
                                    }}
                                    className="transition-all duration-500"
                                  />
                                </svg>
                                <div className="absolute flex flex-col items-center justify-center text-center z-10">
                                  <span
                                    className={`font-black text-2xl leading-none transition-colors duration-500 ${
                                      colorClass === "emerald"
                                        ? "text-emerald-400"
                                        : colorClass === "amber"
                                          ? "text-amber-400"
                                          : "text-red-400"
                                    }`}
                                  >
                                    {score}
                                  </span>
                                  <span className="text-[8px] text-muted-foreground font-bold tracking-wider uppercase mt-0.5">
                                    Index
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                          <div>
                            <h4 className="font-bold text-white text-base">
                              Overall Grade Index
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                              Derived from deep NLP vector correlations,
                              grammatical formatting fidelity, and target skill
                              densities.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-white">
                            Executive Narrative Summary
                          </Label>
                          <div className="text-xs bg-background/40 rounded-xl p-4 leading-relaxed border border-border/30 text-muted-foreground text-justify">
                            {atsReport.general_feedback}
                          </div>
                        </div>

                        {atsReport.bullet_point_suggestions.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-white">
                              High-Impact Refactors (Examples)
                            </Label>
                            <div className="space-y-3">
                              {atsReport.bullet_point_suggestions
                                .slice(0, 2)
                                .map((sug, idx) => (
                                  <div
                                    key={idx}
                                    className="border border-border/30 rounded-xl overflow-hidden text-xs"
                                  >
                                    <div className="bg-red-500/5 text-red-400/90 px-3 py-2 border-b border-border/20 flex gap-2">
                                      <span className="font-extrabold uppercase text-[10px] text-red-500 shrink-0 pt-0.5">
                                        Was:
                                      </span>
                                      "{sug.original}"
                                    </div>
                                    <div className="bg-emerald-500/5 text-emerald-400/90 px-3 py-2 flex items-center justify-between gap-3">
                                      <div className="flex-1 leading-relaxed">
                                        <span className="font-extrabold uppercase text-[10px] text-emerald-500 shrink-0 mr-1">
                                          Better:
                                        </span>
                                        "{sug.improved}"
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() =>
                                          applyRefactor(
                                            sug.original,
                                            sug.improved,
                                          )
                                        }
                                        className="h-6 px-2 rounded-md text-[9px] font-extrabold bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30 shrink-0 select-none transition-all"
                                      >
                                        Apply Now
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      {/* Tab B: Aspect Metrics */}
                      <TabsContent
                        value="aspects"
                        className="p-6 flex-1 mt-0 max-h-[500px] overflow-y-auto custom-scrollbar"
                      >
                        <Accordion
                          type="single"
                          collapsible
                          className="space-y-3 w-full border-none"
                        >
                          {Object.entries(atsReport.aspects).map(
                            ([key, aspect]: [string, any]) => (
                              <AccordionItem
                                key={key}
                                value={key}
                                className="border border-border/30 bg-background/20 rounded-xl px-4 overflow-hidden"
                              >
                                <AccordionTrigger className="hover:no-underline py-3.5">
                                  <div className="flex justify-between items-center w-full pr-3">
                                    <span className="capitalize font-bold text-white text-sm">
                                      {key.replace("_", " ")}
                                    </span>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs bg-background/60 border border-border/40"
                                    >
                                      {aspect.rating}/100
                                    </Badge>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 pb-4">
                                  <div className="space-y-1 text-[11px]">
                                    <div className="font-bold text-white flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3 text-yellow-500" />{" "}
                                      The Why:
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed pl-4">
                                      {aspect.why}
                                    </p>
                                  </div>
                                  <div className="space-y-1 text-[11px]">
                                    <div className="font-bold text-white flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />{" "}
                                      How to Optimize:
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed pl-4">
                                      {aspect.how_to_improve}
                                    </p>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ),
                          )}
                        </Accordion>
                      </TabsContent>

                      {/* Tab C: Keywords */}
                      <TabsContent
                        value="keywords"
                        className="p-6 space-y-4 flex-1 mt-0"
                      >
                        <div className="space-y-2">
                          <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                            🔍 Deficit Keyword Density
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            We scanned target requirements and found these
                            critical technical tags missing or weak in your
                            content. Clicking adds them to your primary skill
                            grid.
                          </p>
                        </div>

                        {atsReport.missing_keywords.length === 0 ? (
                          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-xs text-emerald-400 text-center">
                            Perfect keyword matching! No major skill deficits
                            detected.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 py-2">
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
                                      title: `Inserted "${keyword}"`,
                                      description:
                                        "Successfully injected into Technical Skills category.",
                                    });
                                  }}
                                  className={`transition-all duration-300 select-none px-3 py-1 rounded-lg flex items-center gap-1.5 border ${
                                    isAlreadyAdded
                                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 cursor-default shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                                      : "bg-background/50 hover:bg-primary/15 text-white hover:border-primary border-border/50 cursor-pointer"
                                  }`}
                                >
                                  {isAlreadyAdded ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 animate-in zoom-in duration-300" />{" "}
                                      Added
                                    </>
                                  ) : (
                                    <>+ {keyword}</>
                                  )}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  )}
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
