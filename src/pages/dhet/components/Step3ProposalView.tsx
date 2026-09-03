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

type MainTab = "blueprint" | "heuristics" | "twin-specs";

export const Step3ProposalView: React.FC<Step3ProposalViewProps> = ({
  design,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<MainTab>("blueprint");
  const [isExporting, setIsExporting] = useState(false);

  const proposal = design?.proposal;
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
      const safeTitle = (design?.title || proposal?.title || "Design").replace(/\s+/g, "_");
      link.setAttribute("download", `DHET_${safeTitle}.pdf`);
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

  if (!proposal) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 py-20 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-foreground">Loading Proposal Details...</h2>
          <p className="text-xs md:text-sm text-muted-foreground max-w-md">
            Retrieving the complete design blueprint, heuristic decisions, and synchronized production specs.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onReset} className="rounded-xl mt-2">
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Back to Studio
        </Button>
      </div>
    );
  }

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
            {proposal?.title || design?.title || "Human-Centered Design Solution"}
          </h1>

          {proposal?.summary && (
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              {proposal.summary}
            </p>
          )}

          {/* Context Strip (Nielsen Heuristics: Recognition over Recall) */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {proposal?.device_frame && (
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

      {/* ── TOP PRIMARY TABS: BLUEPRINT, HEURISTICS, PRODUCTION TWIN ─────── */}
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
            <span>1. Architectural Blueprint & Visual Twin</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("heuristics")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2",
              activeTab === "heuristics"
                ? "bg-background text-foreground shadow-md border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <PenTool className="w-4 h-4 text-amber-500" />
            <span>2. Tokens & Heuristics</span>
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
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>3. Figma Specs & AI Prompt</span>
          </button>
        </div>

        <span className="text-xs text-muted-foreground hidden md:inline-flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Switch tabs to toggle between structural blueprints, heuristic rationales, and production specs</span>
        </span>
      </div>

      {/* ── TAB 1: ASCII WIREFRAME & LIVE UI TWIN CENTER STAGE ──────────────── */}
      {activeTab === "blueprint" && (
        <div className="flex flex-col gap-6">
          {/* Main Full-Width Stage for the Dual Viewer */}
          <AsciiWireframeViewer
            wireframe={proposal?.ascii_wireframe || ""}
            deviceFrame={proposal?.device_frame}
            proposal={proposal}
          />

          {/* Quick Context Summary Below Viewport */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Form Factor Constraints */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span className="flex items-center gap-1.5 text-primary">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Device Form Factor</span>
                </span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                  {proposal.device_frame?.device_type || "Mobile"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Aspect Ratio:</span>
                <span className="font-bold text-foreground font-mono">
                  {proposal.device_frame?.aspect_ratio || "9:16"}
                </span>
                <span>•</span>
                <span>Viewport:</span>
                <span className="font-bold text-foreground font-mono">
                  {proposal.device_frame?.viewport?.width || "390px"} × {proposal.device_frame?.viewport?.height || "844px"}
                </span>
              </div>
            </div>

            {/* Token Palette Preview */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span className="flex items-center gap-1.5 text-primary">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Brand Harmony</span>
                </span>
                <span className="text-[10px] text-muted-foreground">Click to inspect</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                {Object.entries(colors).slice(0, 6).map(([role, hex]) => (
                  <div
                    key={role}
                    title={`${role}: ${hex}`}
                    className="w-7 h-7 rounded-xl border border-black/20 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: String(hex) }}
                    onClick={() => {
                      navigator.clipboard.writeText(String(hex));
                      toast.success(`Copied ${role}: ${hex}`);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Core Heuristic Principle */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span className="flex items-center gap-1.5 text-amber-500">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Dominant Heuristic</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold">
                  {decisions[0]?.attribution?.split(" ")[0] || "Norman"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic line-clamp-2">
                "{decisions[0]?.rationale || "Immediate tactile confirmation eliminates doubt."}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: DESIGN TOKENS & HEURISTIC RATIONALE ───────────────────────── */}
      {activeTab === "heuristics" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Color Psychology & Design Tokens */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Color Reasoning & Semantics
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  Token Harmony
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {Object.entries(colors).map(([role, hexValue]) => {
                  const hex = String(hexValue || "");
                  return (
                    <div
                      key={role}
                      onClick={() => {
                        navigator.clipboard.writeText(hex);
                        toast.success(`Copied ${role}: ${hex}`);
                      }}
                      className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-5 h-5 rounded-full border border-black/20 shadow-inner"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="text-xs font-semibold capitalize text-foreground">
                          {role.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground uppercase font-medium">
                        {hex}
                      </span>
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
              <div className="flex flex-col gap-2.5 text-xs">
                <div>
                  <span className="text-muted-foreground text-[11px]">Heading Font:</span>
                  <p className="font-semibold text-foreground text-sm">{typography.heading_font || "Inter, sans-serif"}</p>
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

          {/* RIGHT: Heuristic Margin Notes */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Foundational UX & Heuristic Rationales
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  {decisions.length} Decisions Documented
                </span>
              </div>

              <div className="flex flex-col gap-3.5">
                {decisions.map((decision, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] dark:bg-amber-500/[0.03] shadow-sm flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                        {decision.title}
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded shrink-0">
                        {decision.attribution}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5" />
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
      )}

      {/* ── TAB 3: FIGMA AUTO-LAYOUT & AI IMAGE PROMPT (Real-Life Twin) ──────── */}
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
            aiImagePrompt={proposal?.ai_image_prompt || ""}
            plainTextSpec={proposal?.plain_text_spec || ""}
          />
        </div>
      )}
    </motion.div>
  );
};
