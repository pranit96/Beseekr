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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DeviceFrame } from "@/types/dhet";

interface AsciiWireframeViewerProps {
  wireframe: string;
  deviceFrame?: DeviceFrame;
}

type AspectOption = "16:9" | "9:16" | "4:3" | "1:1";

export const AsciiWireframeViewer: React.FC<AsciiWireframeViewerProps> = ({
  wireframe,
  deviceFrame,
}) => {
  // Normalize aspect ratio from proposal or default to 16:9
  const initialAspect: AspectOption = (() => {
    const raw = deviceFrame?.aspect_ratio?.toLowerCase() || "";
    if (raw.includes("9:16") || raw.includes("mobile")) return "9:16";
    if (raw.includes("4:3") || raw.includes("tablet")) return "4:3";
    if (raw.includes("1:1")) return "1:1";
    return "16:9";
  })();

  const [aspect, setAspect] = useState<AspectOption>(initialAspect);
  const [viewMode, setViewMode] = useState<"device" | "terminal">("device");
  const [zoom, setZoom] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (deviceFrame?.aspect_ratio) {
      const raw = deviceFrame.aspect_ratio.toLowerCase();
      if (raw.includes("9:16")) setAspect("9:16");
      else if (raw.includes("4:3")) setAspect("4:3");
      else if (raw.includes("1:1")) setAspect("1:1");
      else setAspect("16:9");
    }
  }, [deviceFrame?.aspect_ratio]);

  const handleCopy = () => {
    navigator.clipboard.writeText(wireframe);
    setCopied(true);
    toast.success("ASCII Wireframe copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomChange = (delta: number) => {
    setZoom((prev) => Math.min(140, Math.max(70, prev + delta)));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ── ASPECT RATIO & CONTROLS TOOLBAR ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border/80 shadow-sm">
        {/* Left: Device & Aspect Ratio Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Aspect Ratio:</span>
          </span>

          <button
            type="button"
            onClick={() => setAspect("16:9")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border",
              aspect === "16:9"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop 16:9</span>
          </button>

          <button
            type="button"
            onClick={() => setAspect("9:16")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border",
              aspect === "9:16"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
            )}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile 9:16</span>
          </button>

          <button
            type="button"
            onClick={() => setAspect("4:3")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border",
              aspect === "4:3"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
            )}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet 4:3</span>
          </button>
        </div>

        {/* Right: Mode, Zoom & Copy */}
        <div className="flex items-center gap-2">
          {/* Zoom Buttons */}
          <div className="hidden sm:flex items-center gap-1 bg-muted/40 border border-border/50 rounded-lg p-0.5">
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

          {/* View Mode Toggle */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "device" ? "terminal" : "device")}
            className="text-xs px-2.5 py-1 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted text-foreground transition-all"
          >
            {viewMode === "device" ? "Raw Terminal" : "Device Frame"}
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
                <span>Copy Wireframe</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── CANVAS & DEVICE FRAME CONTAINER ──────────────────────────────── */}
      <div className="w-full bg-muted/40 dark:bg-muted/10 rounded-3xl p-4 sm:p-8 border border-border/80 shadow-2xl flex items-center justify-center overflow-hidden min-h-[440px]">
        {/* MOBILE FRAME (9:16) */}
        {viewMode === "device" && aspect === "9:16" && (
          <div className="relative w-full max-w-[360px] rounded-[44px] border-[6px] border-muted-foreground/30 bg-card shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
            {/* Phone Speaker & Dynamic Island */}
            <div className="h-6 w-full bg-muted/60 border-b border-border/50 flex items-center justify-center pt-2 select-none">
              <div className="w-20 h-4 bg-background/80 rounded-full flex items-center justify-end px-2 border border-border/40">
                <div className="w-2 h-2 rounded-full bg-foreground/40" />
              </div>
            </div>

            {/* Screen Content */}
            <div
              className="p-4 overflow-x-auto overflow-y-auto max-h-[580px] custom-scrollbar text-foreground font-mono text-[11px] leading-tight select-text whitespace-pre flex-1"
              style={{ fontSize: `${(11 * zoom) / 100}px` }}
            >
              {wireframe || "No wireframe generated."}
            </div>

            {/* Home Indicator Bar */}
            <div className="h-5 w-full bg-muted/60 border-t border-border/50 flex items-center justify-center pb-1.5 select-none">
              <div className="w-28 h-1 bg-muted-foreground/40 rounded-full" />
            </div>
          </div>
        )}

        {/* DESKTOP BROWSER FRAME (16:9 or Default) */}
        {viewMode === "device" && aspect === "16:9" && (
          <div className="relative w-full max-w-4xl rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
            {/* Desktop Window Titlebar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/60 dark:bg-muted/30 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="ml-3 px-3 py-0.5 rounded-md bg-background border border-border/60 text-[11px] font-mono text-muted-foreground select-none">
                  viewport: 1440x900 • 16:9
                </div>
              </div>

              <span className="text-[11px] font-mono text-muted-foreground select-none">
                Desktop Web Canvas
              </span>
            </div>

            {/* Canvas Viewport */}
            <div
              className={cn(
                "p-5 md:p-7 overflow-x-auto overflow-y-auto transition-all font-mono text-foreground leading-tight select-text whitespace-pre",
                isExpanded ? "max-h-none" : "max-h-[550px]"
              )}
              style={{ fontSize: `${(12 * zoom) / 100}px` }}
            >
              {wireframe || "No wireframe generated."}
            </div>
          </div>
        )}

        {/* TABLET FRAME (4:3) */}
        {viewMode === "device" && aspect === "4:3" && (
          <div className="relative w-full max-w-[620px] rounded-[32px] border-[6px] border-muted-foreground/30 bg-card shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
            {/* Tablet Camera dot */}
            <div className="h-5 w-full bg-muted/60 border-b border-border/50 flex items-center justify-center select-none">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
            </div>

            {/* Screen Content */}
            <div
              className="p-6 overflow-x-auto overflow-y-auto max-h-[540px] custom-scrollbar text-foreground font-mono text-xs leading-tight select-text whitespace-pre"
              style={{ fontSize: `${(11.5 * zoom) / 100}px` }}
            >
              {wireframe || "No wireframe generated."}
            </div>

            {/* Bottom Margin */}
            <div className="h-4 w-full bg-muted/60 border-t border-border/50 flex items-center justify-center select-none" />
          </div>
        )}

        {/* SQUARE (1:1) */}
        {viewMode === "device" && aspect === "1:1" && (
          <div className="relative w-full max-w-[500px] aspect-square rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
            <div className="px-4 py-2 bg-muted/60 border-b border-border text-xs font-mono text-muted-foreground">
              smart_display_1x1.txt
            </div>
            <div
              className="p-5 overflow-auto flex-1 font-mono text-xs text-foreground leading-tight whitespace-pre select-text"
              style={{ fontSize: `${(11.5 * zoom) / 100}px` }}
            >
              {wireframe || "No wireframe generated."}
            </div>
          </div>
        )}

        {/* TERMINAL MODE (Pure Monospace, No Bezel) */}
        {viewMode === "terminal" && (
          <div className="w-full max-w-4xl p-4 md:p-6 overflow-x-auto font-mono text-xs md:text-sm text-foreground bg-muted/30 dark:bg-card/40 rounded-2xl border border-border shadow-inner leading-tight select-text whitespace-pre">
            {wireframe || "No wireframe generated."}
          </div>
        )}
      </div>
    </div>
  );
};
