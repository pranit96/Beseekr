// src/pages/dhet/components/AsciiWireframeViewer.tsx
import React, { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Smartphone,
  Monitor,
  Tablet,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  Sparkles,
  Download,
  Terminal,
  Columns,
  Eye,
  Layers,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
type DisplayMode = "blueprint" | "mockup" | "twin" | "terminal";

/**
 * High-fidelity architectural syntax highlighter for ASCII wireframes.
 * Colors borders in blueprint cyan, interactive buttons in glowing amber,
 * chips/selections in emerald, and headers in crisp contrast.
 */
function renderBlueprintLine(line: string, lineIdx: number) {
  // Regex patterns for interactive UI components inside ASCII wireframe
  // Matches buttons like [ FEED NOW ] or [Button]
  const buttonRegex = /(\[[^\]]+\])/g;
  // Matches chips like (● Option) or (○ Option)
  const chipRegex = /(\([●○][^)]+\))/g;
  // Matches status bar e.g. 09:41 or 5G or 98%
  const isStatusBar = /09:41|5G|\d{1,2}:\d{2}|[0-9]{2}%/.test(line);

  // Border characters
  const isBorderOnly = /^[+\-|\s┌─┐│└┘├┤┬┴┼═║━/\\()]+$/.test(line.trim());

  // Tokenize line into segments
  const parts: React.ReactNode[] = [];
  let remaining = line;
  let keyIdx = 0;

  // Split and style
  const segments = remaining.split(/(\[[^\]]+\]|\([●○][^)]+\))/g);

  segments.forEach((seg, sIdx) => {
    if (seg.startsWith("[") && seg.endsWith("]")) {
      // Interactive Button or Input field
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
      // Pill Chip or Radio Option
      const isSelected = seg.includes("●");
      parts.push(
        <span
          key={`chip-${sIdx}`}
          className={cn(
            "px-1 py-0.5 rounded text-[11px] font-semibold",
            isSelected
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold"
              : "text-neutral-400 border border-neutral-700/50 bg-neutral-800/40"
          )}
        >
          {seg}
        </span>
      );
    } else {
      // Segment with regular characters and borders
      // Color box border characters
      const charTokens: React.ReactNode[] = [];
      for (let i = 0; i < seg.length; i++) {
        const ch = seg[i];
        if (/[+\-|┌─┐│└┘├┤┬┴┼═║━\\/]/.test(ch)) {
          charTokens.push(
            <span key={i} className="text-sky-400/75 select-none font-light">
              {ch}
            </span>
          );
        } else if (/[0-9]/.test(ch) && isStatusBar) {
          charTokens.push(
            <span key={i} className="text-neutral-400 font-medium">
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
    <div key={lineIdx} className="leading-[1.25] tracking-tight hover:bg-sky-500/[0.04] transition-colors">
      {parts}
    </div>
  );
}

export const AsciiWireframeViewer: React.FC<AsciiWireframeViewerProps> = ({
  wireframe,
  deviceFrame,
  proposal,
}) => {
  // Normalize aspect ratio from proposal or default to 9:16 if mobile
  const initialAspect: AspectOption = (() => {
    const raw = deviceFrame?.aspect_ratio?.toLowerCase() || "";
    if (raw.includes("9:16") || raw.includes("mobile")) return "9:16";
    if (raw.includes("4:3") || raw.includes("tablet")) return "4:3";
    if (raw.includes("1:1")) return "1:1";
    return "9:16"; // Default to mobile for focused UI inspection
  })();

  const [aspect, setAspect] = useState<AspectOption>(initialAspect);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("twin");
  const [zoom, setZoom] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

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
    toast.success("ASCII Architectural Wireframe copied to clipboard");
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

  const handleZoomChange = (delta: number) => {
    setZoom((prev) => Math.min(140, Math.max(70, prev + delta)));
  };

  const lines = wireframe ? wireframe.split("\n") : ["No wireframe available."];

  return (
    <div className="flex flex-col gap-4">
      {/* ── TOOLBAR: DISPLAY MODES & CONTROLS ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border/80 shadow-md">
        {/* Left: 3-Way Mode Switcher (Blueprint, Live UI, Twin) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/60">
          <button
            type="button"
            onClick={() => setDisplayMode("twin")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              displayMode === "twin"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side Twin</span>
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode("blueprint")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              displayMode === "blueprint"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>ASCII Blueprint</span>
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode("mockup")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              displayMode === "mockup"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Live Rendered UI</span>
          </button>
        </div>

        {/* Middle: Aspect Ratio Presets */}
        <div className="hidden lg:flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
          <button
            type="button"
            onClick={() => setAspect("9:16")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1",
              aspect === "9:16"
                ? "bg-background text-foreground shadow-sm border border-border/60 font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>9:16 Mobile</span>
          </button>

          <button
            type="button"
            onClick={() => setAspect("16:9")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1",
              aspect === "16:9"
                ? "bg-background text-foreground shadow-sm border border-border/60 font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>16:9 Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setAspect("4:3")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1",
              aspect === "4:3"
                ? "bg-background text-foreground shadow-sm border border-border/60 font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>4:3 Tablet</span>
          </button>
        </div>

        {/* Right: Zoom, Download, Copy */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-muted/50 border border-border/60 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => handleZoomChange(-15)}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-medium px-1 text-muted-foreground select-none">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => handleZoomChange(15)}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Download TXT */}
          <button
            type="button"
            onClick={handleDownloadTxt}
            title="Download .txt wireframe"
            className="p-1.5 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Copy Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy ASCII</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── PARITY BANNER INDICATOR ────────────────────────────────────────── */}
      <div className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/15 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-foreground">
            Synchronized Wireframe & Live Simulation Twin
          </span>
        </div>
        <span className="text-muted-foreground text-[11px] hidden sm:inline">
          Every element in the ASCII blueprint directly drives the rendered UI
        </span>
      </div>

      {/* ── CANVAS & DEVICE VIEWPORT CONTAINER ─────────────────────────────── */}
      <div className="w-full bg-[#070A11] rounded-3xl p-4 sm:p-8 border border-neutral-800 shadow-2xl flex items-center justify-center overflow-x-auto min-h-[560px]">
        {/* ── TWIN VIEW: SIDE-BY-SIDE (Blueprint + Live UI) ─────────────────── */}
        {displayMode === "twin" && (
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full max-w-6xl">
            {/* LEFT: ARCHITECTURAL ASCII BLUEPRINT DEVICE */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-mono font-semibold text-sky-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>1. ASCII Architectural Blueprint</span>
              </span>

              {/* Mobile Phone Mockup (Blueprint) */}
              <div className="relative w-[340px] h-[640px] rounded-[48px] p-3 bg-gradient-to-b from-neutral-800 via-neutral-900 to-black shadow-2xl border border-neutral-700/60 ring-1 ring-white/10 flex flex-col transition-all duration-300">
                {/* Dynamic Island Cutout */}
                <div className="h-6 w-full flex items-center justify-center pt-1 z-10 select-none">
                  <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 border border-neutral-800 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-neutral-900 border border-neutral-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-900/60" />
                  </div>
                </div>

                {/* Inner Screen: High-Tech Monospace Blueprint Canvas */}
                <div
                  className="flex-1 rounded-[38px] overflow-hidden bg-[#0A0E17] border border-neutral-800/80 p-4 font-mono text-neutral-200 overflow-y-auto custom-scrollbar select-text whitespace-pre relative"
                  style={{
                    fontSize: `${(10.5 * zoom) / 100}px`,
                    backgroundImage:
                      "radial-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                >
                  {lines.map((line, idx) => renderBlueprintLine(line, idx))}
                </div>

                {/* Home Indicator Bar */}
                <div className="h-4 w-full flex items-center justify-center pb-1">
                  <div className="w-28 h-1 bg-white/30 rounded-full" />
                </div>
              </div>
            </div>

            {/* RIGHT: INTERACTIVE LIVE UI MOCKUP DEVICE */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>2. Interactive Live UI Simulation</span>
              </span>

              {/* Mobile Phone Mockup (Rendered UI) */}
              <div className="relative w-[340px] h-[640px] rounded-[48px] p-3 bg-gradient-to-b from-neutral-800 via-neutral-900 to-black shadow-2xl border border-neutral-700/60 ring-1 ring-white/10 flex flex-col transition-all duration-300">
                {/* Dynamic Island Cutout */}
                <div className="h-6 w-full flex items-center justify-center pt-1 z-10 select-none">
                  <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 border border-neutral-800 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-neutral-900 border border-neutral-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-900/60" />
                  </div>
                </div>

                {/* Inner Screen: Interactive Simulated UI */}
                <div className="flex-1 rounded-[38px] overflow-hidden bg-white shadow-inner flex flex-col">
                  {proposal ? (
                    <InteractiveMockupPreview proposal={proposal} deviceFrame={deviceFrame} />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-xs text-neutral-400">
                      Generating proposal...
                    </div>
                  )}
                </div>

                {/* Home Indicator Bar */}
                <div className="h-4 w-full flex items-center justify-center pb-1">
                  <div className="w-28 h-1 bg-white/30 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SINGLE VIEW: BLUEPRINT ONLY ────────────────────────────────────── */}
        {displayMode === "blueprint" && aspect === "9:16" && (
          <div className="relative w-[360px] h-[680px] rounded-[50px] p-3.5 bg-gradient-to-b from-neutral-800 via-neutral-900 to-black shadow-2xl border border-neutral-700/60 ring-1 ring-white/10 flex flex-col transition-all duration-300">
            {/* Dynamic Island */}
            <div className="h-6 w-full flex items-center justify-center pt-1 z-10 select-none">
              <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 border border-neutral-800">
                <div className="w-2 h-2 rounded-full bg-neutral-900 border border-neutral-700" />
                <div className="w-1.5 h-1.5 rounded-full bg-sky-900/60" />
              </div>
            </div>

            {/* Inner Blueprint Screen */}
            <div
              className="flex-1 rounded-[40px] overflow-hidden bg-[#0A0E17] border border-neutral-800/80 p-5 font-mono text-neutral-200 overflow-y-auto custom-scrollbar select-text whitespace-pre"
              style={{
                fontSize: `${(11 * zoom) / 100}px`,
                backgroundImage:
                  "radial-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            >
              {lines.map((line, idx) => renderBlueprintLine(line, idx))}
            </div>

            {/* Home Indicator */}
            <div className="h-4 w-full flex items-center justify-center pb-1">
              <div className="w-28 h-1 bg-white/30 rounded-full" />
            </div>
          </div>
        )}

        {/* ── SINGLE VIEW: LIVE UI MOCKUP ONLY ───────────────────────────────── */}
        {displayMode === "mockup" && aspect === "9:16" && (
          <div className="relative w-[360px] h-[680px] rounded-[50px] p-3.5 bg-gradient-to-b from-neutral-800 via-neutral-900 to-black shadow-2xl border border-neutral-700/60 ring-1 ring-white/10 flex flex-col transition-all duration-300">
            {/* Dynamic Island */}
            <div className="h-6 w-full flex items-center justify-center pt-1 z-10 select-none">
              <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 border border-neutral-800">
                <div className="w-2 h-2 rounded-full bg-neutral-900 border border-neutral-700" />
                <div className="w-1.5 h-1.5 rounded-full bg-sky-900/60" />
              </div>
            </div>

            {/* Inner UI Screen */}
            <div className="flex-1 rounded-[40px] overflow-hidden bg-white shadow-inner flex flex-col">
              {proposal ? (
                <InteractiveMockupPreview proposal={proposal} deviceFrame={deviceFrame} />
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-neutral-400">
                  No proposal available.
                </div>
              )}
            </div>

            {/* Home Indicator */}
            <div className="h-4 w-full flex items-center justify-center pb-1">
              <div className="w-28 h-1 bg-white/30 rounded-full" />
            </div>
          </div>
        )}

        {/* ── DESKTOP FRAME (16:9) ───────────────────────────────────────────── */}
        {(displayMode === "blueprint" || displayMode === "mockup") && aspect === "16:9" && (
          <div className="relative w-full max-w-4xl rounded-2xl border border-neutral-700/80 bg-[#0B0F19] shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
            {/* macOS Browser Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/90 border-b border-neutral-800 select-none">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="ml-3 px-3 py-0.5 rounded-md bg-neutral-800 border border-neutral-700/60 text-[11px] font-mono text-neutral-400">
                  dhet-studio://canvas • 1440 × 900
                </div>
              </div>

              <span className="text-[11px] font-mono text-neutral-400">
                {displayMode === "blueprint" ? "Monospace Blueprint" : "Live UI Preview"}
              </span>
            </div>

            {/* Canvas Viewport */}
            <div
              className={cn(
                "p-6 md:p-8 overflow-x-auto overflow-y-auto font-mono text-neutral-200 select-text whitespace-pre",
                isExpanded ? "max-h-none" : "max-h-[580px]"
              )}
              style={{
                fontSize: `${(11.5 * zoom) / 100}px`,
                backgroundImage:
                  "radial-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            >
              {lines.map((line, idx) => renderBlueprintLine(line, idx))}
            </div>
          </div>
        )}

        {/* ── TABLET FRAME (4:3) ─────────────────────────────────────────────── */}
        {(displayMode === "blueprint" || displayMode === "mockup") && aspect === "4:3" && (
          <div className="relative w-full max-w-[620px] rounded-[32px] p-4 bg-gradient-to-b from-neutral-800 to-black shadow-2xl border border-neutral-700/70 flex flex-col transition-all duration-300">
            <div className="h-4 w-full flex items-center justify-center select-none pb-1">
              <div className="w-2 h-2 rounded-full bg-neutral-700" />
            </div>

            <div
              className="p-6 overflow-x-auto overflow-y-auto max-h-[540px] custom-scrollbar text-neutral-200 font-mono text-xs leading-tight select-text whitespace-pre rounded-2xl bg-[#0A0E17] border border-neutral-800"
              style={{ fontSize: `${(11 * zoom) / 100}px` }}
            >
              {lines.map((line, idx) => renderBlueprintLine(line, idx))}
            </div>
          </div>
        )}

        {/* ── TERMINAL MODE (Pure Monospace Vector) ──────────────────────────── */}
        {displayMode === "terminal" && (
          <div className="w-full max-w-4xl p-6 overflow-x-auto font-mono text-xs md:text-sm text-neutral-200 bg-[#0A0E17] rounded-2xl border border-neutral-800 shadow-inner leading-tight select-text whitespace-pre">
            {lines.map((line, idx) => renderBlueprintLine(line, idx))}
          </div>
        )}
      </div>
    </div>
  );
};
