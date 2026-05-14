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
                            updateStyleConfig("primaryColor", theme.primary);
                            updateStyleConfig("accentColor", theme.accent);
                          }}
                          className={`relative h-8 w-8 rounded-full border transition-all flex items-center justify-center ${
                            (resumeData.styles?.primaryColor || "#1A365D") ===
                            theme.primary
                              ? "border-white scale-110 ring-2 ring-white/20"
                              : "border-border/50 hover:scale-105 hover:border-white/50"
                          }`}
                          style={{ backgroundColor: theme.primary }}
                        >
                          {(resumeData.styles?.primaryColor || "#1A365D") ===
                            theme.primary && (
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
                        onClick={() => updateStyleConfig("fontFamily", "Sans")}
                        className={`rounded-xl h-9 font-medium text-xs ${
                          (resumeData.styles?.fontFamily || "Sans") === "Sans"
                            ? "border-primary bg-primary/5 text-white"
                            : "border-border/50"
                        }`}
                      >
                        Modern Sans-Serif
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => updateStyleConfig("fontFamily", "Serif")}
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
                  <User className="h-4 w-4 text-primary" /> Personal Information
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
                            updateExperience(idx, "position", e.target.value)
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
                            updateExperience(idx, "location", e.target.value)
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
                      <Label className="text-xs">Items (Comma separated)</Label>
                      <Input
                        value={skill.items.join(", ")}
                        onChange={(e) =>
                          updateSkillGroup(idx, skill.category, e.target.value)
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
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Skills Category Row
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
                            updateEducation(idx, "institution", e.target.value)
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
                        <Label className="text-xs">Location (Optional)</Label>
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
                  <Trophy className="h-4 w-4 text-amber-400" /> Certifications
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-4">
                {resumeData.certifications.map((cert, idx) => (
                  <div key={idx} className="flex gap-3">
                    <Input
                      value={cert}
                      onChange={(e) => updateCertification(idx, e.target.value)}
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
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Certification Entry
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* RIGHT COLUMN: ATS Intelligence Hub & Actions (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 space-y-6">
            {/* Job Description + ATS Trigger */}
            <Card className="p-5 border border-primary/20 bg-gradient-to-b from-primary/[0.05] to-card/5 backdrop-blur-xl rounded-3xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <h3 className="text-sm font-extrabold text-white">
                  ATS Score Engine
                </h3>
              </div>

              {/* JD Input */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground pl-0.5">
                  🎯 Target Job Description{" "}
                  <span className="text-[9px] font-normal opacity-60">
                    (paste for custom scoring)
                  </span>
                </Label>
                <Textarea
                  placeholder="Paste job description here to score your resume against specific keywords and requirements..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[80px] bg-background/30 border-border/40 focus:border-primary/50 focus:ring-0 text-xs text-white resize-none rounded-xl px-3 py-2.5 leading-relaxed placeholder:text-muted-foreground/40 transition-colors"
                />
              </div>

              {/* Primary ATS Button — Full Width, Impossible to Miss */}
              <Button
                onClick={handleRunATSAnalysis}
                disabled={isScoring}
                className="w-full rounded-xl h-11 font-extrabold text-sm bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-400 hover:via-amber-400 hover:to-orange-400 text-black shadow-lg shadow-amber-500/20 transition-all duration-300"
              >
                {isScoring ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trophy className="h-4 w-4 mr-2" />
                )}
                {isScoring ? "Analyzing Resume..." : "Compute ATS Score"}
              </Button>

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleOptimizeBullets}
                  disabled={isOptimizing}
                  variant="outline"
                  className="rounded-xl border-primary/30 hover:bg-primary/10 font-bold text-xs h-10 transition-all"
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
                              className="h-full w-full -rotate-90 drop-shadow-2xl relative z-10"
                              viewBox="0 0 36 36"
                            >
                              <path
                                className="stroke-zinc-900"
                                strokeWidth="3.5"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <motion.path
                                stroke="#ffffff"
                                strokeWidth="3"
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
                    <div className="grid grid-cols-2 gap-3.5">
                      {Object.entries(atsReport.aspects).map(
                        ([key, aspect]: [string, any]) => {
                          const cleanName = key.replace("_", " ");

                          return (
                            <div
                              key={key}
                              className="border border-zinc-800 bg-zinc-900/10 backdrop-blur-sm rounded-2xl p-3.5 transition-all duration-300 hover:scale-[1.01] hover:border-zinc-700"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="capitalize font-bold text-xs text-zinc-200 tracking-tight leading-none">
                                  {cleanName}
                                </span>
                                <span className="text-xs font-black font-mono text-white">
                                  {aspect.rating}
                                </span>
                              </div>
                              <p
                                className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2 select-none hover:line-clamp-none cursor-pointer transition-all duration-300"
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
                    <div className="space-y-2.5 border-t border-zinc-800/60 pt-5">
                      <Label className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-white" />{" "}
                        Strategic Narrative
                      </Label>
                      <div className="text-xs bg-zinc-950/40 rounded-2xl p-4 leading-relaxed border border-zinc-800 text-zinc-400 text-justify select-none shadow-inner selection:bg-white/10">
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
                    <div className="space-y-3 bg-zinc-950/20 rounded-2xl p-4 border border-zinc-800 relative overflow-hidden shadow-lg">
                      <div className="space-y-1 relative z-10">
                        <h4 className="font-bold text-white text-xs flex items-center gap-1.5 select-none">
                          🔍 Deficit Keyword Matching
                        </h4>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          Technical tags missing in your profile. Tap key to
                          auto-inject into Skills ledger.
                        </p>
                      </div>

                      {atsReport.missing_keywords.length === 0 ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 text-center flex items-center justify-center gap-1.5 select-none font-mono">
                          <CheckCircle2 className="h-3.5 w-3.5 text-white animate-bounce" />{" "}
                          Perfect match! No technical skill gaps detected.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 pt-1 relative z-10">
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
                                    ? "bg-zinc-800 text-zinc-300 border-zinc-700 cursor-default opacity-90"
                                    : "bg-zinc-950 text-zinc-400 hover:bg-white hover:text-black hover:border-white border-zinc-800 cursor-pointer active:scale-95"
                                }`}
                              >
                                {isAlreadyAdded ? (
                                  <>
                                    <CheckCircle2 className="h-2.5 w-2.5 animate-in zoom-in" />{" "}
                                    Added
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-2.5 w-2.5 opacity-50" />{" "}
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
                      <div className="space-y-3.5 pt-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            ✏️ AI Quality Refactors
                          </Label>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              atsReport.bullet_point_suggestions.forEach(
                                (sug) => applyRefactor(sug.original, sug.improved)
                              );
                            }}
                            className="h-6 px-3 rounded-full text-[9px] font-extrabold bg-white hover:bg-zinc-200 text-black border-none shrink-0 transition-all shadow-md active:scale-95 tracking-tight"
                          >
                            Batch Apply ({atsReport.bullet_point_suggestions.length})
                          </Button>
                        </div>

                        <div className="space-y-3 pr-0.5">
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
                                  className={`border rounded-2xl overflow-hidden text-xs transition-all duration-500 group relative ${
                                    isApplied
                                      ? "border-zinc-600 bg-zinc-900/20 shadow-lg"
                                      : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"
                                  }`}
                                >
                                  <div className="bg-zinc-950/80 text-zinc-400 px-4 py-3 border-b border-zinc-800/50 border-dashed flex gap-2 leading-relaxed text-left">
                                    <span className="font-extrabold uppercase text-[9px] text-zinc-500 shrink-0 pt-0.5 tracking-widest select-none font-mono">
                                      Original:
                                    </span>
                                    <span
                                      className={
                                        isApplied
                                          ? "line-through opacity-40 transition-opacity duration-500"
                                          : ""
                                      }
                                    >
                                      "{sug.original}"
                                    </span>
                                  </div>
                                  <div className="bg-zinc-900/10 text-white px-4 py-3 flex items-start justify-between gap-3 text-left">
                                    <div className="flex-1 leading-relaxed">
                                      <span className="font-extrabold uppercase text-[9px] text-zinc-400 shrink-0 mr-1.5 tracking-widest select-none font-mono">
                                        Optimized:
                                      </span>
                                      <span className="text-zinc-100 font-medium">
                                        "{sug.improved}"
                                      </span>
                                    </div>
                                    {isApplied ? (
                                      <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[9px] font-bold shrink-0 select-none px-2.5 py-0.5 flex items-center gap-1 animate-in zoom-in-95 duration-300 rounded-lg font-mono">
                                        <CheckCircle2 className="h-3 w-3 text-zinc-300" />{" "}
                                        Applied
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
                                        className="h-7 px-3.5 rounded-lg text-[10px] font-extrabold bg-white hover:bg-zinc-200 text-black border-none shrink-0 transition-all mt-0.5 shadow-md active:scale-95 tracking-tight"
                                      >
                                        Apply
                                      </Button>
                                    )}
                                  </div>
                                  {sug.reason && (
                                    <div className="bg-zinc-950/30 px-4 py-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 italic flex items-center gap-1.5 leading-relaxed text-left select-none">
                                      <Sparkles className="h-3 w-3 text-zinc-400 shrink-0" />{" "}
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
