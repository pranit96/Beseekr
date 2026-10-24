import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Building2,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Loader2,
} from "lucide-react";
import { InterviewSessionConfig } from "@/api/interviewer";
import { cn } from "@/lib/utils";

interface StartInterviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (config: InterviewSessionConfig) => Promise<void>;
  loading?: boolean;
}

interface PresetOption {
  id: string;
  title: string;
  company: string;
  role: string;
  type: string;
  badge: string;
  badgeColor: string;
  description: string;
  persona: string;
  defaultQuestions: number;
}

const PRESETS: PresetOption[] = [
  {
    id: "google-swe",
    title: "Google Distributed Systems",
    company: "Google",
    role: "Senior Backend Engineer",
    type: "System Design",
    badge: "Big Tech",
    badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
    description: "Thorough system design interview focusing on high throughput, caching, CAP tradeoffs, and resilience.",
    persona: "You are Alex, a Senior Staff Engineer at Google with 12 years of experience in distributed infrastructure. You are analytical, direct, and probe deeply into design tradeoffs, bottleneck mitigation, and latency constraints.",
    defaultQuestions: 6,
  },
  {
    id: "amazon-lp",
    title: "Amazon Leadership Principles",
    company: "Amazon",
    role: "Software Development Manager",
    type: "Behavioral",
    badge: "Bar Raiser",
    badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    description: "Rigorous STAR-method behavioral evaluation on Customer Obsession, Ownership, and Disagree & Commit.",
    persona: "You are Sarah, an Amazon Bar Raiser and Principal Leader. You evaluate leadership principles rigorously. You require candidates to use the STAR method with concrete metrics and probe follow-ups on failures and ambiguity.",
    defaultQuestions: 5,
  },
  {
    id: "stripe-fullstack",
    title: "Stripe API & Architecture",
    company: "Stripe",
    role: "Full-Stack Engineer",
    type: "Technical",
    badge: "Fintech",
    badgeColor: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30",
    description: "Focus on developer ergonomics, payment idempotency, robust API design, and edge cases.",
    persona: "You are Marcus, an Engineering Lead at Stripe. You value clean API design, idempotency, edge cases, error resilience, and pragmatism. You are collaborative yet hold a very high standard for software quality.",
    defaultQuestions: 6,
  },
  {
    id: "startup-lead",
    title: "YC AI Startup Core Team",
    company: "Stealth AI Startup",
    role: "Founding Engineer",
    type: "Technical",
    badge: "High Velocity",
    badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    description: "Rapid iteration, architectural independence, product velocity, and 0-to-1 building instincts.",
    persona: "You are David, CTO and Co-founder of a fast-growing YC AI startup. You look for extreme ownership, speed of execution, ability to build without specifications, and deep AI/LLM systems familiarity.",
    defaultQuestions: 5,
  },
];

export const StartInterviewModal: React.FC<StartInterviewModalProps> = ({
  open,
  onOpenChange,
  onStart,
  loading = false,
}) => {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [selectedPreset, setSelectedPreset] = useState<PresetOption>(PRESETS[0]);

  // Custom Form Fields
  const [role, setRole] = useState("Senior Full-Stack Engineer");
  const [company, setCompany] = useState("Google");
  const [interviewType, setInterviewType] = useState("Technical");
  const [persona, setPersona] = useState(
    "You are a Senior Engineering Manager at Google. You are friendly yet thorough, asking challenging technical questions and probing deep into architecture and fundamentals.",
  );
  const [totalQuestions, setTotalQuestions] = useState(6);
  const [jdContext, setJdContext] = useState("");
  const [resumeContext, setResumeContext] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (mode === "preset") {
      await onStart({
        persona: selectedPreset.persona,
        interviewType: selectedPreset.type,
        role: selectedPreset.role,
        company: selectedPreset.company,
        totalQuestions: selectedPreset.defaultQuestions,
        jdContext: jdContext.trim() || undefined,
        resumeContext: resumeContext.trim() || undefined,
      });
    } else {
      await onStart({
        persona: persona.trim(),
        interviewType,
        role: role.trim(),
        company: company.trim(),
        totalQuestions,
        jdContext: jdContext.trim() || undefined,
        resumeContext: resumeContext.trim() || undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar border-border/50 bg-background/95 backdrop-blur-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              Configure Mock Interview
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm">
            Choose an industry-calibrated preset or customize your target company, role, and interviewer persona.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-muted/40 p-1 border border-border/40 mt-2">
          <button
            type="button"
            onClick={() => setMode("preset")}
            className={cn(
              "flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all",
              mode === "preset"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Curated Presets
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={cn(
              "flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all",
              mode === "custom"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Custom Persona
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {mode === "preset" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset)}
                    className={cn(
                      "p-4 rounded-2xl border cursor-pointer transition-all duration-200 text-left relative flex flex-col justify-between",
                      isSelected
                        ? "border-violet-600 dark:border-violet-500 bg-violet-500/[0.08] shadow-md shadow-violet-500/10 ring-1 ring-violet-500/50"
                        : "border-border/50 bg-card hover:border-border text-foreground",
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] uppercase font-bold", preset.badgeColor)}
                        >
                          {preset.badge}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {preset.defaultQuestions} Qs • {preset.type}
                        </span>
                      </div>

                      <h4 className="font-bold text-foreground text-sm tracking-tight mb-1">
                        {preset.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span>{preset.role}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Target Role
                  </label>
                  <Input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    required
                    className="bg-card"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Company
                  </label>
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Google, Stripe, OpenAI"
                    className="bg-card"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Interview Type
                  </label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-card border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Technical" className="bg-background text-foreground">Technical / Coding</option>
                    <option value="System Design" className="bg-background text-foreground">System Design & Architecture</option>
                    <option value="Behavioral" className="bg-background text-foreground">Behavioral (STAR Method)</option>
                    <option value="HR" className="bg-background text-foreground">HR & Culture Fit</option>
                    <option value="Leadership" className="bg-background text-foreground">Leadership & Management</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Number of Questions</span>
                    <span className="text-foreground font-mono">{totalQuestions} questions</span>
                  </div>
                  <div className="pt-2">
                    <Slider
                      value={[totalQuestions]}
                      onValueChange={([val]) => setTotalQuestions(val)}
                      min={3}
                      max={12}
                      step={1}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Interviewer Persona
                </label>
                <Textarea
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  rows={3}
                  placeholder="Describe the interviewer's tone, seniority, and areas of focus..."
                  required
                  className="bg-card/50 text-sm leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Optional JD / Resume context toggle */}
          <div className="border border-border/40 rounded-xl p-3.5 bg-card/30">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <span className="flex items-center gap-1.5 font-semibold">
                <FileText className="w-3.5 h-3.5 text-violet-400" />
                Add Job Description or Resume Context (Optional)
              </span>
              <span className="text-[11px] underline">
                {showAdvanced ? "Hide Context" : "Customize Questions"}
              </span>
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/30">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Job Description snippet
                  </label>
                  <Textarea
                    value={jdContext}
                    onChange={(e) => setJdContext(e.target.value)}
                    rows={3}
                    placeholder="Paste key responsibilities or tech stack from the job posting..."
                    className="text-xs bg-background/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Resume / Experience snippet
                  </label>
                  <Textarea
                    value={resumeContext}
                    onChange={(e) => setResumeContext(e.target.value)}
                    rows={3}
                    placeholder="Paste your key experiences or accomplishments so questions target your background..."
                    className="text-xs bg-background/50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Security & Encryption notice */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/80 bg-muted/20 px-3.5 py-2.5 rounded-xl border border-border/30">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              All audio recordings and session transcripts are protected with hardware-grade <strong>AES-256-GCM</strong> encryption at rest.
            </span>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-violet-500/20 px-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Initializing Room...
                </>
              ) : (
                <>
                  Start Interview
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
