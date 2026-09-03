// src/pages/dhet/components/InteractiveMockupPreview.tsx
import React, { useState } from "react";
import {
  ChevronLeft,
  Info,
  Sliders,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Flame,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { DesignProposal, DeviceFrame } from "@/types/dhet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InteractiveMockupPreviewProps {
  proposal: DesignProposal;
  deviceFrame?: DeviceFrame;
}

export const InteractiveMockupPreview: React.FC<InteractiveMockupPreviewProps> = ({
  proposal,
  deviceFrame,
}) => {
  const tokens = proposal.design_tokens;
  const colors = tokens?.colors || {};

  // Color tokens with intelligent, high-fidelity fallbacks
  const primaryColor = colors.primary || "#4A7C6B";
  const secondaryColor = colors.secondary || "#A8D5BA";
  const accentColor = colors.accent || "#F4A261";
  const bgColor = colors.background || "#F5F5F5";
  const surfaceColor = colors.surface || "#FFFFFF";
  const borderColor = colors.border || "#E0E0E0";
  const textPrimary = colors.text_primary || "#212121";
  const textSecondary = colors.text_secondary || "#666666";

  const rawContext = `${proposal.title} ${proposal.ai_image_prompt} ${proposal.plain_text_spec}`.toLowerCase();

  // Dynamic context detection
  const isSpoon = rawContext.includes("spoon") || rawContext.includes("horse") || rawContext.includes("equi");
  const isCoffee = rawContext.includes("coffee") || rawContext.includes("espresso") || rawContext.includes("brew");
  const isDashboard = rawContext.includes("dashboard") || rawContext.includes("analytics") || rawContext.includes("stats");

  // Dynamic Chips
  const chipOptions = (() => {
    if (isSpoon) return ["Sateal", "Pastal", "Grinde", "Titanium"];
    if (isCoffee) return ["Dark Roast", "Medium", "Light", "Single Origin"];
    return ["Option A", "Option B", "Option C", "Option D"];
  })();
  const [selectedChip, setSelectedChip] = useState<string>(chipOptions[0]);

  // Dynamic Slider
  const [sliderVal, setSliderVal] = useState<number>(15);

  // Dynamic CTA button label
  const ctaLabel = (() => {
    if (rawContext.includes("feed now")) return "Feed Now";
    if (rawContext.includes("subscribe")) return "Start Subscription";
    if (rawContext.includes("extract")) return "Log Extraction";
    if (rawContext.includes("save")) return "Save Settings";
    return "Confirm Action";
  })();

  const handleCtaClick = () => {
    toast.success(`Action Triggered: ${ctaLabel}`, {
      description: `Parameters recorded: ${selectedChip} • Size: ${sliderVal} cm`,
    });
  };

  return (
    <div
      className="w-full h-full flex flex-col font-sans select-none overflow-y-auto custom-scrollbar"
      style={{
        backgroundColor: bgColor,
        color: textPrimary,
      }}
    >
      {/* ── STATUS BAR ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 pt-3 pb-2 text-[11px] font-semibold text-neutral-500">
        <span>09:41</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono">5G</span>
          <div className="w-4 h-2 rounded-[2px] border border-neutral-400 p-[1px] flex items-center">
            <div className="h-full w-3 bg-neutral-600 rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* ── TOP NAVIGATION BAR ──────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-10 backdrop-blur-sm"
        style={{
          backgroundColor: `${surfaceColor}E6`,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <button
          type="button"
          onClick={() => toast.info("Navigation: Back pressed")}
          className="p-1 rounded-full hover:bg-neutral-200/50 transition-colors"
          style={{ color: primaryColor }}
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <h2
          className="text-sm font-bold tracking-tight text-center truncate max-w-[200px]"
          style={{ color: textPrimary }}
        >
          {proposal.title || "EquiSpoon Companion"}
        </h2>

        <button
          type="button"
          onClick={() => toast.info("Product Information & Heuristic Specs")}
          className="p-1 rounded-full hover:bg-neutral-200/50 transition-colors"
          style={{ color: primaryColor }}
        >
          <Info className="w-4 h-4" />
        </button>
      </header>

      {/* ── MAIN SCROLLABLE CONTENT BODY ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-4 p-4">
        {/* HERO SECTION: Dynamic Contoured Illustration / Schematic */}
        <div
          className="rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden transition-all shadow-sm"
          style={{
            backgroundColor: surfaceColor,
            border: `1px solid ${borderColor}`,
          }}
        >
          <span
            className="absolute top-2 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${primaryColor}15`,
              color: primaryColor,
            }}
          >
            Form Factor Blueprint
          </span>

          {/* Render Realistic Spoon Schematic if Spoon context */}
          {isSpoon && (
            <div className="py-5 w-full flex items-center justify-center">
              <svg
                viewBox="0 0 320 80"
                className="w-full max-w-[280px] h-auto drop-shadow-md filter"
              >
                <defs>
                  <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="40%" stopColor="#D8DCE0" />
                    <stop offset="70%" stopColor="#9AA2A9" />
                    <stop offset="100%" stopColor="#737C84" />
                  </linearGradient>
                  <linearGradient id="handleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={secondaryColor} />
                    <stop offset="50%" stopColor={primaryColor} />
                    <stop offset="100%" stopColor="#2A483E" />
                  </linearGradient>
                  <filter id="subtleDrop" x="-10%" y="-10%" width="120%" height="130%">
                    <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.25" />
                  </filter>
                </defs>

                {/* Spoon Bowl (Deep elliptical contour) */}
                <ellipse
                  cx="48"
                  cy="40"
                  rx="38"
                  ry="24"
                  fill="url(#metalGrad)"
                  filter="url(#subtleDrop)"
                  stroke="#6B7280"
                  strokeWidth="1"
                />
                <ellipse
                  cx="48"
                  cy="38"
                  rx="31"
                  ry="18"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  opacity="0.8"
                />

                {/* Transition Neck (Polished stainless steel) */}
                <path
                  d="M 84 37 Q 115 38 140 37 L 140 43 Q 115 42 84 43 Z"
                  fill="url(#metalGrad)"
                  stroke="#4B5563"
                  strokeWidth="0.8"
                />

                {/* Collar Ring (Brass/copper accent ring) */}
                <rect
                  x="140"
                  y="34"
                  width="7"
                  height="12"
                  rx="2"
                  fill={accentColor}
                  stroke="#9A3412"
                  strokeWidth="0.8"
                />

                {/* Ergonomic Contoured Grip Handle */}
                <path
                  d="M 147 35 C 180 32, 240 33, 290 35 C 302 36, 305 44, 290 45 C 240 47, 180 48, 147 45 Z"
                  fill="url(#handleGrad)"
                  filter="url(#subtleDrop)"
                  stroke="#1E3A30"
                  strokeWidth="1.2"
                />

                {/* Grip Hanging Hole / Eyelet */}
                <ellipse
                  cx="285"
                  cy="40"
                  rx="3.5"
                  ry="2.5"
                  fill="#E5E7EB"
                  stroke="#1E3A30"
                  strokeWidth="1"
                />
              </svg>
            </div>
          )}

          {/* Render Coffee / Ratio Schematic */}
          {isCoffee && (
            <div className="py-6 flex flex-col items-center gap-2">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-dashed shadow-inner"
                style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}10` }}
              >
                <Flame className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                Brew Ratio: 1:2 (18g In → 36g Out)
              </span>
            </div>
          )}

          {/* Render Dashboard / General Schematic */}
          {!isSpoon && !isCoffee && (
            <div className="py-6 flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                Optimal Architectural Layout
              </span>
            </div>
          )}
        </div>

        {/* ── SECTION: MATERIAL SELECTOR CHIPS ───────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold" style={{ color: textPrimary }}>
            Material Selector
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {chipOptions.map((chip) => {
              const isActive = selectedChip === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSelectedChip(chip)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border shrink-0"
                  style={{
                    backgroundColor: isActive ? secondaryColor : surfaceColor,
                    borderColor: isActive ? primaryColor : borderColor,
                    color: isActive ? "#1A382E" : textSecondary,
                    boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SECTION: HANDLE SIZE SLIDER ────────────────────────────────────── */}
        <div
          className="p-3.5 rounded-2xl flex flex-col gap-2 shadow-sm"
          style={{
            backgroundColor: surfaceColor,
            border: `1px solid ${borderColor}`,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: textPrimary }}>
              Handle Size
            </span>
            <span
              className="text-xs font-bold font-mono px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
              }}
            >
              {sliderVal} cm
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono">10cm</span>
            <input
              type="range"
              min={10}
              max={30}
              value={sliderVal}
              onChange={(e) => setSliderVal(Number(e.target.value))}
              className="flex-1 accent-current h-1.5 rounded-lg cursor-pointer"
              style={{ accentColor: primaryColor }}
            />
            <span className="text-[10px] text-muted-foreground font-mono">30cm</span>
          </div>
        </div>

        {/* ── SECTION: USAGE LOG CARD ────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden shadow-sm flex flex-col"
          style={{
            backgroundColor: surfaceColor,
            border: `1px solid ${borderColor}`,
          }}
        >
          <div
            className="px-4 py-2.5 border-b flex items-center justify-between"
            style={{ borderColor }}
          >
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              <span className="text-xs font-bold" style={{ color: textPrimary }}>
                Usage Log
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">Recent Feeds</span>
          </div>

          <div className="divide-y" style={{ borderColor }}>
            {[
              { date: "Sep 28, 2023, 12:30 AM", amount: "2.00 feed" },
              { date: "Sep 28, 2023, 12:15 AM", amount: "1.50 feed" },
              { date: "Sep 28, 2023, 12:15 AM", amount: "1.00 feed" },
              { date: "Sep 18, 2023, 12:30 AM", amount: "3.00 feed" },
              { date: "Sep 18, 2023, 12:30 AM", amount: "1.00 feed" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-xs">
                <span className="text-[11px]" style={{ color: textSecondary }}>
                  {item.date}
                </span>
                <span className="font-semibold text-[11px]" style={{ color: textPrimary }}>
                  {item.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION: PRIMARY CTA BUTTON ────────────────────────────────────── */}
        <div className="pt-1 pb-3">
          <button
            type="button"
            onClick={handleCtaClick}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 4px 14px ${accentColor}40`,
            }}
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── HOME INDICATOR BAR ──────────────────────────────────────────────── */}
      <div className="h-4 flex items-center justify-center pb-2">
        <div className="w-28 h-1 rounded-full bg-neutral-400/60" />
      </div>
    </div>
  );
};
