// src/pages/dhet/components/Step3ProposalView.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  RotateCcw,
  Sparkles,
  Terminal,
  Palette,
  PenTool,
  ChevronUp,
  ChevronDown,
  Trash2,
  CheckCircle2,
  FileCode,
  Layers,
} from "lucide-react";
import { DhetDesignRecord } from "@/types/dhet";
import { AsciiWireframeViewer } from "./AsciiWireframeViewer";
import { PasteableSpecsViewer } from "./PasteableSpecsViewer";
import { DesignTokensViewer } from "./DesignTokensViewer";
import { DesignDecisionsViewer } from "./DesignDecisionsViewer";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Step3ProposalViewProps {
  design: DhetDesignRecord;
  onReset: () => void;
}

type DrawerTab = "tokens" | "decisions" | "export";

export const Step3ProposalView: React.FC<Step3ProposalViewProps> = ({
  design,
  onReset,
}) => {
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("tokens");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const proposal = design?.proposal;
  const decisions = proposal?.design_decisions || [];
  const tokens = proposal?.design_tokens;
  const colors: Record<string, string> = tokens?.colors || {};

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      toast.info("Compiling publication-grade LaTeX PDF report...");
      const url = apiClient.getDhetExportPdfUrl(design.id);
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

  const handleDeleteProposal = () => {
    if (!design?.id) return;
    toast(`Delete "${proposal?.title || design?.title || "Design Proposal"}"?`, {
      description: "This design proposal will be permanently removed. This action cannot be undone.",
      duration: 10000,
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            setIsDeleting(true);
            await apiClient.deleteDhetDesign(design.id);
            toast.success("Design proposal deleted successfully");
            onReset();
          } catch (err: any) {
            toast.error("Failed to delete design: " + (err.message || "Unknown error"));
          } finally {
            setIsDeleting(false);
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => toast.info("Deletion canceled"),
      },
      actionButtonStyle: {
        backgroundColor: "#dc2626",
        color: "#ffffff",
        fontWeight: "600",
      },
    });
  };

  if (!proposal) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-6 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
          style={{ background: "rgba(139,92,246,0.1)" }}
        >
          <Sparkles className="w-8 h-8 animate-pulse" style={{ color: "rgb(167,139,250)" }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-bold" style={{ color: "hsl(214 32% 91%)" }}>
            Loading Proposal Details...
          </h2>
          <p className="text-sm max-w-sm" style={{ color: "rgba(196,181,253,0.5)" }}>
            Retrieving the complete design blueprint, heuristic decisions, and synchronized production specs.
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
          style={{
            background: "transparent",
            borderColor: "rgba(255,255,255,0.08)",
            color: "rgba(196,181,253,0.7)",
          }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Back to Studio
        </button>
      </div>
    );
  }

  const drawerTabs: { key: DrawerTab; label: string; icon: React.ElementType; accent: string }[] = [
    { key: "tokens", label: "Design Tokens", icon: Palette, accent: "rgb(139,92,246)" },
    { key: "decisions", label: "UX Decisions", icon: PenTool, accent: "rgb(245,158,11)" },
    { key: "export", label: "Export & Specs", icon: Sparkles, accent: "rgb(16,185,129)" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col w-full"
    >
      {/* ── TOP TITLE BAR ─────────────────────────────────────────────────── */}
      <div
        className="w-full px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(14,16,26,0.8)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "rgb(52,211,153)" }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Human-Centered Design Proposal</span>
            {proposal?.device_frame && (
              <>
                <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                <span
                  className="px-2 py-0.5 rounded font-semibold capitalize"
                  style={{ background: "rgba(139,92,246,0.12)", color: "rgb(167,139,250)" }}
                >
                  {proposal.device_frame.device_type || "Mobile"} · {proposal.device_frame.aspect_ratio || "9:16"}
                </span>
              </>
            )}
          </div>
          <h1
            className="text-xl md:text-2xl font-black tracking-tight truncate"
            style={{ color: "hsl(214 32% 94%)" }}
          >
            {proposal?.title || design?.title || "Human-Centered Design Solution"}
          </h1>
          {proposal?.summary && (
            <p className="text-sm line-clamp-1" style={{ color: "rgba(196,181,253,0.5)" }}>
              {proposal.summary}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all"
            style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(196,181,253,0.6)", background: "transparent" }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
              color: "#fff",
              boxShadow: "0 0 16px rgba(139,92,246,0.3)",
              opacity: isExporting ? 0.7 : 1,
            }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? "Compiling..." : "Export PDF"}</span>
          </button>

          {design?.id && (
            <button
              type="button"
              onClick={handleDeleteProposal}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
              style={{
                borderColor: "rgba(239,68,68,0.2)",
                color: "rgba(252,165,165,0.7)",
                background: "transparent",
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? "Deleting..." : "Delete"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── CANVAS: FULL-WIDTH WIREFRAME STAGE ────────────────────────────── */}
      <div
        className="w-full px-4 md:px-6 py-6"
        style={{ background: "hsl(222 47% 3%)" }}
      >
        {/* Canvas title overlay */}
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-4 h-4" style={{ color: "rgba(139,92,246,0.6)" }} />
          <span className="text-xs font-mono font-semibold" style={{ color: "rgba(196,181,253,0.4)" }}>
            canvas · {proposal?.device_frame?.viewport?.width || "390"}×{proposal?.device_frame?.viewport?.height || "844"}
          </span>
          {/* Color swatch strip */}
          <div className="flex items-center gap-1 ml-3">
            {Object.entries(colors).slice(0, 7).map(([role, hex]) => (
              <div
                key={role}
                title={`${role}: ${hex}`}
                className="w-4 h-4 rounded-full border border-black/30 cursor-pointer transition-transform hover:scale-125"
                style={{ backgroundColor: String(hex) }}
                onClick={() => {
                  navigator.clipboard.writeText(String(hex));
                  toast.success(`Copied ${role}: ${hex}`);
                }}
              />
            ))}
          </div>
        </div>

        <AsciiWireframeViewer
          wireframe={proposal?.ascii_wireframe || ""}
          deviceFrame={proposal?.device_frame}
          proposal={proposal}
        />
      </div>

      {/* ── INTELLIGENCE DRAWER ───────────────────────────────────────────── */}
      <div
        className="sticky bottom-0 z-30 flex flex-col"
        style={{
          background: "rgba(10,12,20,0.98)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
        }}
      >
        {/* Drawer toggle bar */}
        <button
          type="button"
          onClick={() => setDrawerOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 md:px-6 py-3 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4" style={{ color: "rgb(167,139,250)" }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(196,181,253,0.7)" }}>
              Intelligence Drawer
            </span>
            {/* Tab pills */}
            <div className="hidden sm:flex items-center gap-1">
              {drawerTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = drawerTab === tab.key && drawerOpen;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDrawerTab(tab.key);
                      setDrawerOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: isActive ? `${tab.accent}18` : "transparent",
                      color: isActive ? tab.accent : "rgba(196,181,253,0.4)",
                      border: `1px solid ${isActive ? `${tab.accent}40` : "transparent"}`,
                    }}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {drawerOpen ? (
            <ChevronDown className="w-4 h-4" style={{ color: "rgba(196,181,253,0.4)" }} />
          ) : (
            <ChevronUp className="w-4 h-4" style={{ color: "rgba(196,181,253,0.4)" }} />
          )}
        </button>

        {/* Mobile tab strip */}
        <div className="sm:hidden flex items-center gap-1 px-4 pb-2">
          {drawerTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = drawerTab === tab.key && drawerOpen;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setDrawerTab(tab.key); setDrawerOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 justify-center"
                style={{
                  background: isActive ? `${tab.accent}18` : "rgba(255,255,255,0.03)",
                  color: isActive ? tab.accent : "rgba(196,181,253,0.4)",
                  border: `1px solid ${isActive ? `${tab.accent}40` : "rgba(255,255,255,0.05)"}`,
                }}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden xs:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer content panel */}
        <AnimatePresence initial={false}>
          {drawerOpen && (
            <motion.div
              key="drawer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 md:px-6 py-6 max-h-[520px] overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                  {drawerTab === "tokens" && tokens && (
                    <motion.div
                      key="tokens"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
                      <DesignTokensViewer tokens={tokens} />
                    </motion.div>
                  )}

                  {drawerTab === "decisions" && (
                    <motion.div
                      key="decisions"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
                      <DesignDecisionsViewer decisions={decisions} />
                    </motion.div>
                  )}

                  {drawerTab === "export" && (
                    <motion.div
                      key="export"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="flex flex-col gap-4">
                        {/* Export info banner */}
                        <div
                          className="flex items-start gap-3 p-4 rounded-2xl border"
                          style={{
                            background: "rgba(16,185,129,0.05)",
                            borderColor: "rgba(16,185,129,0.2)",
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "rgba(16,185,129,0.12)" }}
                          >
                            <FileCode className="w-5 h-5" style={{ color: "rgb(52,211,153)" }} />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold" style={{ color: "hsl(214 32% 91%)" }}>
                              Real-Life Twin Production Blueprints
                            </span>
                            <span className="text-xs" style={{ color: "rgba(196,181,253,0.5)" }}>
                              Drop the prompt into Midjourney v6/DALL-E for a photorealistic render, or paste the Figma spec into ChatGPT to construct real auto-layout frames.
                            </span>
                          </div>
                          <span
                            className="text-xs font-mono font-semibold px-2 py-0.5 rounded-lg shrink-0"
                            style={{
                              background: "rgba(16,185,129,0.1)",
                              color: "rgb(52,211,153)",
                              border: "1px solid rgba(16,185,129,0.2)",
                            }}
                          >
                            1:1 Parity
                          </span>
                        </div>

                        <PasteableSpecsViewer
                          aiImagePrompt={proposal?.ai_image_prompt || ""}
                          plainTextSpec={proposal?.plain_text_spec || ""}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
