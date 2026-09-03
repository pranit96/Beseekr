// src/pages/dhet/components/Step3ProposalView.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  Terminal,
  Award,
  Palette,
  FileCode,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DhetDesignRecord } from "@/types/dhet";
import { AsciiWireframeViewer } from "./AsciiWireframeViewer";
import { DesignDecisionsViewer } from "./DesignDecisionsViewer";
import { DesignTokensViewer } from "./DesignTokensViewer";
import { PasteableSpecsViewer } from "./PasteableSpecsViewer";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Step3ProposalViewProps {
  design: DhetDesignRecord;
  onReset: () => void;
}

type SectionKey = "all" | "wireframe" | "decisions" | "tokens" | "specs";

export const Step3ProposalView: React.FC<Step3ProposalViewProps> = ({
  design,
  onReset,
}) => {
  const [activeFilter, setActiveFilter] = useState<SectionKey>("all");
  const [isExporting, setIsExporting] = useState(false);

  const proposal = design.proposal;

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      toast.info("Preparing PDF export...");
      const url = apiClient.getDhetExportPdfUrl(design.id);

      // Trigger download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `DHET_${design.title.replace(/\s+/g, "_")}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PDF download initiated");
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
      className="max-w-5xl mx-auto w-full px-4 py-6 md:py-10 flex flex-col gap-8"
    >
      {/* ── TOP ACTION & TITLE BAR ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border/80 shadow-xl relative overflow-hidden">
        {/* Subtle accent glow in background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-1.5 z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Design Proposal Generated & Saved</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground">
            {proposal.title || design.title || "Human-Centered Design Proposal"}
          </h1>
          {proposal.summary && (
            <p className="text-muted-foreground text-xs md:text-sm max-w-2xl leading-relaxed">
              {proposal.summary}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 z-10 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="rounded-xl flex items-center gap-1.5 text-xs h-9"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start New Design</span>
          </Button>

          <Button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="rounded-xl flex items-center gap-2 text-xs h-9 font-semibold shadow-md shadow-primary/20"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Exporting..." : "Export as PDF"}</span>
          </Button>
        </div>
      </div>

      {/* ── SECTION NAVIGATION PILLS ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: "all", label: "Full Proposal", icon: Layers },
          { key: "wireframe", label: "ASCII Wireframe", icon: Terminal },
          { key: "decisions", label: "UX Decisions", icon: Award },
          { key: "tokens", label: "Design Tokens", icon: Palette },
          { key: "specs", label: "Pasteable Specs", icon: FileCode },
        ].map((sec) => {
          const Icon = sec.icon;
          const isActive = activeFilter === sec.key;

          return (
            <button
              key={sec.key}
              type="button"
              onClick={() => setActiveFilter(sec.key as SectionKey)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground border-border/60"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── CONTENT SECTIONS ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-10">
        {/* Section 1: ASCII Wireframe */}
        {(activeFilter === "all" || activeFilter === "wireframe") && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span>1. Structural Layout & ASCII Wireframe</span>
              </h2>
            </div>
            <AsciiWireframeViewer wireframe={proposal.ascii_wireframe} />
          </section>
        )}

        {/* Section 2: UX Decisions */}
        {(activeFilter === "all" || activeFilter === "decisions") && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                <span>2. Foundational UX & Design Thinking Rationales</span>
              </h2>
            </div>
            <DesignDecisionsViewer decisions={proposal.design_decisions || []} />
          </section>
        )}

        {/* Section 3: Design Tokens */}
        {(activeFilter === "all" || activeFilter === "tokens") && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <span>3. Concrete System Tokens</span>
              </h2>
            </div>
            <DesignTokensViewer tokens={proposal.design_tokens} />
          </section>
        )}

        {/* Section 4: Pasteable Specs */}
        {(activeFilter === "all" || activeFilter === "specs") && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileCode className="w-4 h-4 text-primary" />
                <span>4. Ready-to-Paste Specifications</span>
              </h2>
            </div>
            <PasteableSpecsViewer
              aiImagePrompt={proposal.ai_image_prompt}
              plainTextSpec={proposal.plain_text_spec}
            />
          </section>
        )}
      </div>
    </motion.div>
  );
};
