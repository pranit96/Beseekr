// src/pages/dhet/components/AsciiWireframeViewer.tsx
import React, { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Smartphone,
  Monitor,
  Tablet,
  ZoomIn,
  ZoomOut,
  Download,
  Terminal,
  Columns,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DeviceFrame, DesignProposal } from "@/types/dhet";
import { InteractiveMockupPreview } from "./InteractiveMockupPreview";

interface AsciiWireframeViewerProps {
  wireframe: string;
  deviceFrame?: DeviceFrame;
  proposal?: DesignProposal;
}

type AspectOption = "16:9" | "9:16" | "4:3" | "1:1";
type DisplayMode = "twin" | "blueprint" | "mockup";

/**
 * High-fidelity architectural syntax highlighter for ASCII wireframes.
 */
function renderBlueprintLine(line: string, lineIdx: number) {
  const isStatusBar = /09:41|5G|\d{1,2}:\d{2}|[0-9]{2}%/.test(line);
  const segments = line.split(/(\[[^\]]+\]|\([●○][^)]+\))/g);
  const parts: React.ReactNode[] = [];

  segments.forEach((seg, sIdx) => {
    if (seg.startsWith("[") && seg.endsWith("]")) {
      const isInput = seg.includes("____");
      parts.push(
        <span
          key={`btn-${sIdx}`}
          className={cn(
            "font-bold px-1 py-0.5 rounded transition-colors",
            isInput
              ? "bg-sky-500/10 text-sky-300 border border-sky-500/30"
              : "bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10"
          )}
        >
          {seg}
        </span>
      );
    } else if (seg.startsWith("(") && seg.endsWith(")")) {
      const isSelected = seg.includes("●");
      parts.push(
        <span
          key={`chip-${sIdx}`}
          className={cn(
            "px-1 py-0.5 rounded text-[11px] font-semibold",
            isSelected
              ? "bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold"
              : "text-neutral-400 border border-neutral-700/50 bg-neutral-800/40"
          )}
        >
          {seg}
        </span>
      );
    } else {
      const charTokens: React.ReactNode[] = [];
      for (let i = 0; i < seg.length; i++) {
        const ch = seg[i];
        if (/[+\-|┌─┐│└┘├┤┬┴┼═║━\\/]/.test(ch)) {
          charTokens.push(
            <span key={i} className="text-violet-400/60 select-none font-light">
              {ch}
            </span>
          );
        } else if (/[0-9]/.test(ch) && isStatusBar) {
          charTokens.push(
            <span key={i} className="text-neutral-500 font-medium">
              {ch}
            </span>
          );
        } else {
          charTokens.push(<span key={i}>{ch}</span>);
        }
      }
      parts.push(<span key={`txt-${sIdx}`}>{charTokens}</span>);
    }
  });

  return (
    <div key={lineIdx} className="leading-[1.25] tracking-tight hover:bg-violet-500/[0.03] transition-colors">
      {parts}
    </div>
  );
}

const ASPECT_CYCLE: AspectOption[] = ["9:16", "16:9", "4:3"];
const ASPECT_ICONS = { "9:16": Smartphone, "16:9": Monitor, "4:3": Tablet };
const ASPECT_LABELS = { "9:16": "9:16 Mobile", "16:9": "16:9 Desktop", "4:3": "4:3 Tablet" };

export const AsciiWireframeViewer: React.FC<AsciiWireframeViewerProps> = ({
  wireframe,
  deviceFrame,
  proposal,
}) => {
  const initialAspect: AspectOption = (() => {
    const raw = deviceFrame?.aspect_ratio?.toLowerCase() || "";
    if (raw.includes("9:16") || raw.includes("mobile")) return "9:16";
    if (raw.includes("4:3") || raw.includes("tablet")) return "4:3";
    if (raw.includes("1:1")) return "1:1";
    return "9:16";
  })();

  const [aspect, setAspect] = useState<AspectOption>(initialAspect);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("twin");
  const [zoom, setZoom] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (deviceFrame?.aspect_ratio) {
      const raw = deviceFrame.aspect_ratio.toLowerCase();
      if (raw.includes("9:16")) setAspect("9:16");
      else if (raw.includes("4:3")) setAspect("4:3");
      else if (raw.includes("1:1")) setAspect("1:1");
      else if (raw.includes("16:9")) setAspect("16:9");
    }
  }, [deviceFrame?.aspect_ratio]);

  const handleCopy = () => {
    navigator.clipboard.writeText(wireframe);
    setCopied(true);
    toast.success("ASCII Wireframe copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([wireframe], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wireframe_${proposal?.title ? proposal.title.toLowerCase().replace(/\s+/g, "_") : "layout"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Wireframe downloaded as .txt");
  };

  const cycleAspect = () => {
    const current = ASPECT_CYCLE.indexOf(aspect as any);
    const next = ASPECT_CYCLE[(current + 1) % ASPECT_CYCLE.length];
    setAspect(next);
  };

  const handleZoom = (delta: number) => setZoom((p) => Math.min(140, Math.max(70, p + delta)));
  const lines = wireframe ? wireframe.split("\n") : ["No wireframe available."];

  const CurrentAspectIcon = ASPECT_ICONS[aspect as keyof typeof ASPECT_ICONS] || Smartphone;

  return (
    <div className="flex flex-col gap-4">
      {/* ── TOOLBAR ────────────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl border"
        style={{
          background: "rgba(14,16,26,0.8)",
          backdropFilter: "blur(8px)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        {/* Mode switcher: Blueprint ↔ Live UI ↔ Twin */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {(["twin", "blueprint", "mockup"] as DisplayMode[]).map((mode) => {
            const Icon = mode === "twin" ? Columns : mode === "blueprint" ? Terminal : Sparkles;
            const label = mode === "twin" ? "Side-by-Side" : mode === "blueprint" ? "Blueprint" : "Live UI";
            const isActive = displayMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setDisplayMode(mode)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: isActive ? "linear-gradient(135deg, #6d28d9, #8b5cf6)" : "transparent",
                  color: isActive ? "#fff" : "rgba(196,181,253,0.45)",
                  boxShadow: isActive ? "0 0 12px rgba(139,92,246,0.3)" : "none",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Aspect cycle button */}
          <button
            type="button"
            onClick={cycleAspect}
            title={`Switch to next aspect (current: ${ASPECT_LABELS[aspect as keyof typeof ASPECT_LABELS]})`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.06)",
              color: "rgba(196,181,253,0.6)",
            }}
          >
            <CurrentAspectIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{ASPECT_LABELS[aspect as keyof typeof ASPECT_LABELS]}</span>
          </button>

          {/* Zoom controls */}
          <div
            className="flex items-center gap-0.5 p-0.5 rounded-xl border"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <button
              type="button"
              onClick={() => handleZoom(-10)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "rgba(196,181,253,0.5)" }}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 select-none" style={{ color: "rgba(196,181,253,0.4)" }}>
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(10)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "rgba(196,181,253,0.5)" }}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownloadTxt}
            title="Download .txt wireframe"
            className="p-2 rounded-xl border transition-all"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.06)",
              color: "rgba(196,181,253,0.5)",
            }}
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Copy */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
            style={{
              background: copied ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
              borderColor: copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)",
              color: copied ? "rgb(52,211,153)" : "rgba(196,181,253,0.6)",
            }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy ASCII"}</span>
          </button>
        </div>
      </div>

      {/* ── SYNC BADGE ─────────────────────────────────────────────────────── */}
      <div
        className="px-4 py-2 rounded-xl flex items-center justify-between text-xs"
        style={{
          background: "rgba(139,92,246,0.05)",
          border: "1px solid rgba(139,92,246,0.12)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="font-semibold" style={{ color: "hsl(214 32% 82%)" }}>
            Synchronized Wireframe & Live Simulation Twin
          </span>
        </div>
        <span className="hidden sm:block" style={{ color: "rgba(196,181,253,0.4)" }}>
          Every element in the ASCII blueprint directly drives the rendered UI
        </span>
      </div>

      {/* ── CANVAS VIEWPORT ────────────────────────────────────────────────── */}
      <div
        className="w-full rounded-3xl p-4 sm:p-8 border flex items-center justify-center overflow-x-auto min-h-[560px]"
        style={{
          background: "#060810",
          borderColor: "rgba(139,92,246,0.12)",
          boxShadow: "0 0 0 1px rgba(139,92,246,0.06), inset 0 0 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* TWIN: Side-by-Side */}
        {displayMode === "twin" && (
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full max-w-6xl">
            {/* LEFT: Blueprint device */}
            <div className="flex flex-col items-center gap-3">
              <span className="text-xs font-mono font-semibold flex items-center gap-1.5" style={{ color: "rgba(139,92,246,0.7)" }}>
                <Terminal className="w-3.5 h-3.5" />
                <span>ASCII Architectural Blueprint</span>
              </span>
              <PhoneFrame>
                <div
                  className="flex-1 rounded-[38px] overflow-hidden p-4 font-mono overflow-y-auto custom-scrollbar select-text whitespace-pre relative"
                  style={{
                    fontSize: `${(10.5 * zoom) / 100}px`,
                    background: "#0A0E17",
                    color: "rgba(226,232,240,0.9)",
                    backgroundImage: "radial-gradient(rgba(139,92,246,0.04) 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                    border: "1px solid rgba(139,92,246,0.12)",
                  }}
                >
                  {lines.map((line, idx) => renderBlueprintLine(line, idx))}
                </div>
              </PhoneFrame>
            </div>

            {/* RIGHT: Live UI device */}
            <div className="flex flex-col items-center gap-3">
              <span className="text-xs font-mono font-semibold flex items-center gap-1.5" style={{ color: "rgba(16,185,129,0.7)" }}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interactive Live UI Simulation</span>
              </span>
              <PhoneFrame accentColor="rgba(16,185,129,0.3)">
                <div className="flex-1 rounded-[38px] overflow-hidden bg-white shadow-inner flex flex-col">
                  {proposal ? (
                    <InteractiveMockupPreview proposal={proposal} deviceFrame={deviceFrame} />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-xs text-neutral-400">
                      Generating proposal...
                    </div>
                  )}
                </div>
              </PhoneFrame>
            </div>
          </div>
        )}

        {/* BLUEPRINT only */}
        {displayMode === "blueprint" && aspect === "9:16" && (
          <PhoneFrame>
            <div
              className="flex-1 rounded-[40px] overflow-hidden p-5 font-mono overflow-y-auto custom-scrollbar select-text whitespace-pre"
              style={{
                fontSize: `${(11 * zoom) / 100}px`,
                background: "#0A0E17",
                color: "rgba(226,232,240,0.9)",
                backgroundImage: "radial-gradient(rgba(139,92,246,0.04) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
                border: "1px solid rgba(139,92,246,0.12)",
              }}
            >
              {lines.map((line, idx) => renderBlueprintLine(line, idx))}
            </div>
          </PhoneFrame>
        )}

        {/* MOCKUP only */}
        {displayMode === "mockup" && aspect === "9:16" && (
          <PhoneFrame>
            <div className="flex-1 rounded-[40px] overflow-hidden bg-white shadow-inner flex flex-col">
              {proposal ? (
                <InteractiveMockupPreview proposal={proposal} deviceFrame={deviceFrame} />
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-neutral-400">
                  No proposal available.
                </div>
              )}
            </div>
          </PhoneFrame>
        )}

        {/* DESKTOP FRAME (16:9) */}
        {(displayMode === "blueprint" || displayMode === "mockup") && aspect === "16:9" && (
          <div
            className="relative w-full max-w-4xl rounded-2xl border overflow-hidden flex flex-col transition-all duration-300"
            style={{ background: "#0B0F19", borderColor: "rgba(139,92,246,0.15)", boxShadow: "0 0 40px rgba(0,0,0,0.6)" }}
          >
            {/* macOS browser chrome */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b select-none"
              style={{ background: "rgba(14,16,26,0.9)", borderColor: "rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div
                className="ml-2 px-3 py-0.5 rounded-md text-[11px] font-mono"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(196,181,253,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                dhet-studio://canvas · 1440 × 900
              </div>
            </div>

            <div
              className="p-6 md:p-8 overflow-x-auto overflow-y-auto font-mono select-text whitespace-pre max-h-[580px]"
              style={{
                fontSize: `${(11.5 * zoom) / 100}px`,
                color: "rgba(226,232,240,0.9)",
                backgroundImage: "radial-gradient(rgba(139,92,246,0.03) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            >
              {lines.map((line, idx) => renderBlueprintLine(line, idx))}
            </div>
          </div>
        )}

        {/* TABLET FRAME (4:3) */}
        {(displayMode === "blueprint" || displayMode === "mockup") && aspect === "4:3" && (
          <div
            className="relative w-full max-w-[620px] rounded-[32px] p-4 flex flex-col transition-all duration-300 border"
            style={{
              background: "linear-gradient(180deg, #1a1d2e 0%, #0c0e18 100%)",
              borderColor: "rgba(139,92,246,0.15)",
              boxShadow: "0 0 40px rgba(0,0,0,0.6)",
            }}
          >
            <div className="h-4 w-full flex items-center justify-center select-none pb-1">
              <div className="w-2 h-2 rounded-full bg-neutral-700" />
            </div>
            <div
              className="p-6 overflow-x-auto overflow-y-auto max-h-[540px] custom-scrollbar font-mono text-xs leading-tight select-text whitespace-pre rounded-2xl"
              style={{
                fontSize: `${(11 * zoom) / 100}px`,
                color: "rgba(226,232,240,0.9)",
                background: "#0A0E17",
                border: "1px solid rgba(139,92,246,0.1)",
              }}
            >
              {lines.map((line, idx) => renderBlueprintLine(line, idx))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Shared Phone Frame Component ──────────────────────────────────────────── */
function PhoneFrame({
  children,
  accentColor = "rgba(139,92,246,0.3)",
}: {
  children: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div
      className="relative w-[340px] h-[640px] rounded-[48px] p-3 flex flex-col transition-all duration-300"
      style={{
        background: "linear-gradient(180deg, #1a1d2e 0%, #0c0e18 100%)",
        border: `1px solid ${accentColor}`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 32px 64px rgba(0,0,0,0.6), 0 0 40px ${accentColor.replace("0.3", "0.08")}`,
      }}
    >
      {/* Dynamic Island */}
      <div className="h-6 w-full flex items-center justify-center pt-1 z-10 select-none">
        <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 border border-neutral-800 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-neutral-900 border border-neutral-700" />
          <div className="w-1.5 h-1.5 rounded-full bg-violet-900/60" />
        </div>
      </div>

      {children}

      {/* Home indicator */}
      <div className="h-4 w-full flex items-center justify-center pb-1">
        <div className="w-28 h-1 bg-white/20 rounded-full" />
      </div>
    </div>
  );
}
