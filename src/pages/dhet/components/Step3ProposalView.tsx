// src/pages/dhet/components/Step3ProposalView.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  RotateCcw,
  Sparkles,
  Terminal,
  FileCode,
  CheckCircle2,
  Palette,
  PenTool,
  Compass,
  ArrowRight,
  Lightbulb,
  Sliders,
  Type,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DhetDesignRecord } from "@/types/dhet";
import { AsciiWireframeViewer } from "./AsciiWireframeViewer";
import { PasteableSpecsViewer } from "./PasteableSpecsViewer";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Step3ProposalViewProps {
  design: DhetDesignRecord;
  onReset: () => void;
}

type MainTab = "blueprint" | "twin-specs";

export const Step3ProposalView: React.FC<Step3ProposalViewProps> = ({
  design,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<MainTab>("blueprint");
  const [isExporting, setIsExporting] = useState(false);

  const proposal = design.proposal;
  const decisions = proposal?.design_decisions || [];
  const tokens = proposal?.design_tokens;
  const colors: Record<string, string> = tokens?.colors || {};
  const typography = tokens?.typography || {};

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      toast.info("Compiling publication-grade LaTeX PDF report...");
      const url = apiClient.getDhetExportPdfUrl(design.id);

      // Trigger download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `DHET_${design.title.replace(/\s+/g, "_")}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("LaTeX PDF downloaded successfully!");
    } catch (err: any) {
      toast.error("Failed to export PDF: " + (err.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="max-w-7xl mx-auto w-full px-4 py-6 md:py-10 flex flex-col gap-8"
    >
      {/* ── TOP ACTION & TITLE BAR ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-6 rounded-3xl bg-card border border-border/80 shadow-xl relative overflow-hidden">
        {/* Subtle radial ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-2 z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Human-Centered Design Proposal Generated</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {proposal.title || design.title || "Human-Centered Design Solution"}
          </h1>

          {proposal.summary && (
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              {proposal.summary}
            </p>
          )}

          {/* Context Strip (Nielsen Heuristics: Recognition over Recall) */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {proposal.device_frame && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-semibold border border-primary/20">
                <span className="capitalize">{proposal.device_frame.device_type || "Desktop"}</span>
                <span className="opacity-40">•</span>
                <span>{proposal.device_frame.aspect_ratio || "16:9"}</span>
                {proposal.device_frame.viewport && (
                  <span className="text-[10px] opacity-75 font-mono">
                    ({proposal.device_frame.viewport.width} × {proposal.device_frame.viewport.height})
                  </span>
                )}
              </span>
            )}

            {design.initial_prompt && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-muted-foreground max-w-md truncate border border-border/50">
                <span className="font-semibold text-foreground shrink-0">Vision:</span>
                <span className="truncate italic">"{design.initial_prompt}"</span>
              </div>
            )}

            {design.selected_options && Object.keys(design.selected_options).length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {Object.entries(design.selected_options).map(([k, v]) => (
                  <span
                    key={k}
                    className="px-2 py-0.5 rounded-md bg-muted/60 text-[11px] text-muted-foreground border border-border/40 font-medium"
                  >
                    {v}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 z-10 flex-wrap self-start lg:self-center">
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="rounded-xl flex items-center gap-1.5 text-xs h-9"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start New</span>
          </Button>

          <Button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="rounded-xl flex items-center gap-2 text-xs h-9 font-semibold shadow-md shadow-primary/20 bg-primary hover:bg-primary/90"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Compiling LaTeX PDF..." : "Export LaTeX PDF"}</span>
          </Button>
        </div>
      </div>

      {/* ── TOP PRIMARY TABS: BLUEPRINT vs REAL-LIFE TWIN SPECS ───────────────── */}
      <div className="flex items-center justify-between border-b border-border/70 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-muted/50 border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("blueprint")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2",
              activeTab === "blueprint"
                ? "bg-background text-foreground shadow-md border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Terminal className="w-4 h-4 text-primary" />
            <span>1. Design Blueprint & Annotations</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("twin-specs")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2",
              activeTab === "twin-specs"
                ? "bg-background text-foreground shadow-md border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>2. Real-Life Twin: Figma & AI Image Prompt</span>
          </button>
        </div>

        <span className="text-xs text-muted-foreground hidden md:inline-flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Switch tabs to toggle between structural blueprint and production assets</span>
        </span>
      </div>

      {/* ── TAB 1: ASCII WIREFRAME CENTER STAGE WITH REVOLVING ANNOTATIONS ──── */}
      {activeTab === "blueprint" && (
        <div className="flex flex-col gap-8">
          {/* Main Layout: Center stage Wireframe + Flanking Margin Annotations */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Color Psychology & Palettes ("What colour suits and why") */}
            <div className="lg:col-span-3 flex flex-col gap-4 order-2 lg:order-1">
              <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col gap-4 relative">
                {/* Visual marker / sticky note header */}
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Color Reasoning
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    Token Harmony
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tailored specifically to this product's archetype and emotional tone:
                </p>

                {/* Color Swatch List with In-depth Explanations */}
                <div className="flex flex-col gap-3">
                  {Object.entries(colors).slice(0, 5).map(([role, hexValue]) => {
                    const hex: string = typeof hexValue === "string" ? hexValue : String(hexValue || "");
                    const isBg = role === "background" || role === "surface";
                    const isPrimary = role === "primary";

                    let reason = "Selected for accessibility and visual rhythm.";
                    if (isPrimary) {
                      reason = "Dominant interactive color, engineered for high affordance and unambiguous CTA signifiers.";
                    } else if (isBg) {
                      reason = "Canvas base that eliminates eye strain and provides generous breathing room.";
                    } else if (role === "accent") {
                      reason = "High-contrast spark for micro-milestones and status notifications.";
                    }

                    return (
                      <div
                        key={role}
                        className="p-3 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border border-black/20 shadow-inner"
                              style={{ backgroundColor: hex }}
                            />
                            <span className="text-xs font-semibold capitalize text-foreground">
                              {role.replace(/_/g, " ")}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-muted-foreground uppercase">
                            {hex}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {reason}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Typography Specs Card */}
              <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                  <Type className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Typographic Scale
                  </h3>
                </div>
                <div className="flex flex-col gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[11px]">Heading Font:</span>
                    <p className="font-semibold text-foreground">{typography.heading_font || "Inter, sans-serif"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px]">Body Text:</span>
                    <p className="font-semibold text-foreground">{typography.body_font || "Inter, system-ui"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px]">Monospace:</span>
                    <p className="font-mono font-medium text-foreground">{typography.mono_font || "JetBrains Mono"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER STAGE: ASCII WIREFRAME IN DEVICE VIEWPORT (Primary Focal Point) */}
            <div className="lg:col-span-6 flex flex-col gap-3 order-1 lg:order-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  <span>Center Stage Layout Blueprint</span>
                </h2>
                <span className="text-xs text-muted-foreground font-mono">
                  {proposal.device_frame?.aspect_ratio || "16:9"} • Monospace Vector
                </span>
              </div>

              {/* Responsive Center Wireframe with Device Aspect Toggles */}
              <AsciiWireframeViewer
                wireframe={proposal.ascii_wireframe}
                deviceFrame={proposal.device_frame}
              />
            </div>

            {/* RIGHT COLUMN: Hand-Written Style Heuristic Margin Notes (Norman, Rams, Nielsen) */}
            <div className="lg:col-span-3 flex flex-col gap-4 order-3">
              <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Designer Annotations
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                    Why Made
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Margin notes detailing why each structural decision was formed:
                </p>

                {/* Hand-Notated Decision Cards */}
                <div className="flex flex-col gap-3">
                  {decisions.slice(0, 5).map((decision, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] dark:bg-amber-500/[0.03] shadow-sm flex flex-col gap-1.5 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-foreground leading-tight">
                          {decision.title}
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">
                          {decision.attribution.split(" ")[0]}
                        </span>
                      </div>

                      <span className="text-[10px] font-semibold text-primary flex items-center gap-1">
                        <Compass className="w-3 h-3" />
                        {decision.principle}
                      </span>

                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        "{decision.rationale}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: FIGMA AUTO-LAYOUT & AI IMAGE PROMPT (Real-Life Twin) ──────── */}
      {activeTab === "twin-specs" && (
        <div className="flex flex-col gap-6">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">
                  Real-Life Twin Production Blueprints
                </span>
                <span className="text-xs text-muted-foreground">
                  Drop the prompt into Midjourney v6/DALL-E for a photorealistic screen render, or paste the Figma spec into ChatGPT to construct real auto-layout frames.
                </span>
              </div>
            </div>

            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              100% Wireframe Parity
            </span>
          </div>

          <PasteableSpecsViewer
            aiImagePrompt={proposal.ai_image_prompt}
            plainTextSpec={proposal.plain_text_spec}
          />
        </div>
      )}
    </motion.div>
  );
};
