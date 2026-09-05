// src/pages/dhet/components/InteractiveMockupPreview.tsx
import React, { useState } from "react";
import {
  ChevronLeft,
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { DesignProposal, DeviceFrame } from "@/types/dhet";
import { toast } from "sonner";

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

  // Color tokens with intelligent high-fidelity fallbacks
  const primaryColor = colors.primary || "#4A7C6B";
  const secondaryColor = colors.secondary || "#A8D5BA";
  const accentColor = colors.accent || "#F4A261";
  const bgColor = colors.background || "#F7F7F8";
  const surfaceColor = colors.surface || "#FFFFFF";
  const borderColor = colors.border || "#E4E4E7";
  const textPrimary = colors.text_primary || "#18181B";
  const textSecondary = colors.text_secondary || "#71717A";

  const rawContext = `${proposal?.title || ""} ${proposal?.ai_image_prompt || ""} ${proposal?.plain_text_spec || ""}`.toLowerCase();

  const isSpoon = rawContext.includes("spoon") || rawContext.includes("horse") || rawContext.includes("equi");
  const isCoffee = rawContext.includes("coffee") || rawContext.includes("espresso") || rawContext.includes("brew");
  const isDashboard = rawContext.includes("dashboard") || rawContext.includes("analytics") || rawContext.includes("stats");

  const chipOptions = (() => {
    if (isSpoon) return ["Satin", "Pastel", "Ground", "Titanium"];
    if (isCoffee) return ["Dark Roast", "Medium", "Light", "Single"];
    if (isDashboard) return ["7 Days", "30 Days", "90 Days", "Custom"];
    return ["Option A", "Option B", "Option C", "Option D"];
  })();

  const [selectedChip, setSelectedChip] = useState<string>(chipOptions[0]);
  const [sliderVal, setSliderVal] = useState<number>(15);

  const ctaLabel = (() => {
    if (rawContext.includes("feed now")) return "Feed Now";
    if (rawContext.includes("subscribe")) return "Start Subscription";
    if (rawContext.includes("extract")) return "Log Extraction";
    if (rawContext.includes("save")) return "Save Settings";
    if (isDashboard) return "View Report";
    return "Confirm Action";
  })();

  const logEntries = (() => {
    if (isCoffee) return [
      { label: "Sep 4, 08:12 AM", value: "18g · 1:2 ratio" },
      { label: "Sep 3, 07:55 AM", value: "17g · 1:2.2 ratio" },
      { label: "Sep 2, 08:30 AM", value: "18g · 1:1.8 ratio" },
    ];
    if (isDashboard) return [
      { label: "Page Views", value: "12,483" },
      { label: "Unique Users", value: "3,847" },
      { label: "Bounce Rate", value: "28.4%" },
    ];
    return [
      { label: "Sep 4, 12:30 AM", value: "2.00 units" },
      { label: "Sep 3, 12:15 AM", value: "1.50 units" },
      { label: "Sep 2, 12:00 AM", value: "1.00 units" },
    ];
  })();

  const handleCtaClick = () => {
    toast.success(`Action Triggered: ${ctaLabel}`, {
      description: `Selected: ${selectedChip} · Param: ${sliderVal}`,
    });
  };

  return (
    <div
      className="w-full h-full flex flex-col font-sans select-none overflow-y-auto"
      style={{ backgroundColor: bgColor, color: textPrimary }}
    >
      {/* ── STATUS BAR ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[11px] font-semibold" style={{ color: textSecondary }}>
        <span>09:41</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono">5G</span>
          <div className="w-4 h-2 rounded-[2px] border p-[1.5px] flex items-center" style={{ borderColor: textSecondary }}>
            <div className="h-full w-3 rounded-[1px]" style={{ backgroundColor: textSecondary }} />
          </div>
        </div>
      </div>

      {/* ── NAV BAR ─────────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
        style={{
          backgroundColor: `${surfaceColor}F0`,
          borderBottom: `1px solid ${borderColor}`,
          backdropFilter: "blur(10px)",
        }}
      >
        <button
          type="button"
          onClick={() => toast.info("Navigation: Back pressed")}
          className="p-1.5 rounded-xl transition-colors"
          style={{ color: primaryColor, backgroundColor: `${primaryColor}12` }}
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <h2 className="text-sm font-bold tracking-tight text-center truncate max-w-[200px]" style={{ color: textPrimary }}>
          {proposal?.title || "Design Preview"}
        </h2>

        <button
          type="button"
          onClick={() => toast.info("Product Information & Heuristic Specs")}
          className="p-1.5 rounded-xl transition-colors"
          style={{ color: primaryColor, backgroundColor: `${primaryColor}12` }}
        >
          <Info className="w-4 h-4" />
        </button>
      </header>

      {/* ── BODY ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-3 p-4">
        {/* Hero schematic area */}
        <div
          className="rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-sm"
          style={{ backgroundColor: surfaceColor, border: `1px solid ${borderColor}` }}
        >
          <span
            className="absolute top-2.5 left-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
          >
            Form Factor
          </span>

          {isSpoon && (
            <div className="py-5 w-full flex items-center justify-center">
              <svg viewBox="0 0 320 80" className="w-full max-w-[280px] h-auto drop-shadow-md">
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
                <ellipse cx="48" cy="40" rx="38" ry="24" fill="url(#metalGrad)" filter="url(#subtleDrop)" stroke="#6B7280" strokeWidth="1" />
                <ellipse cx="48" cy="38" rx="31" ry="18" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" />
                <path d="M 84 37 Q 115 38 140 37 L 140 43 Q 115 42 84 43 Z" fill="url(#metalGrad)" stroke="#4B5563" strokeWidth="0.8" />
                <rect x="140" y="34" width="7" height="12" rx="2" fill={accentColor} stroke="#9A3412" strokeWidth="0.8" />
                <path d="M 147 35 C 180 32, 240 33, 290 35 C 302 36, 305 44, 290 45 C 240 47, 180 48, 147 45 Z" fill="url(#handleGrad)" filter="url(#subtleDrop)" stroke="#1E3A30" strokeWidth="1.2" />
                <ellipse cx="285" cy="40" rx="3.5" ry="2.5" fill="#E5E7EB" stroke="#1E3A30" strokeWidth="1" />
              </svg>
            </div>
          )}

          {isCoffee && (
            <div className="py-5 flex flex-col items-center gap-2">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-dashed shadow-inner"
                style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}10` }}
              >
                <Flame className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              <span className="text-[11px] font-semibold" style={{ color: textSecondary }}>
                Brew Ratio: 1:2 (18g In → 36g Out)
              </span>
            </div>
          )}

          {!isSpoon && !isCoffee && (
            <div className="py-5 flex flex-col items-center gap-2">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                {isDashboard ? (
                  <TrendingUp className="w-7 h-7 text-white" />
                ) : (
                  <Sparkles className="w-7 h-7 text-white" />
                )}
              </div>
              <span className="text-[11px] font-semibold" style={{ color: textSecondary }}>
                Optimal Architectural Layout
              </span>
            </div>
          )}
        </div>

        {/* Chip selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold" style={{ color: textPrimary }}>
            {isSpoon ? "Material" : isCoffee ? "Roast Profile" : isDashboard ? "Time Range" : "Selector"}
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {chipOptions.map((chip) => {
              const isActive = selectedChip === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSelectedChip(chip)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 border shrink-0"
                  style={{
                    backgroundColor: isActive ? secondaryColor : surfaceColor,
                    borderColor: isActive ? primaryColor : borderColor,
                    color: isActive ? "#1A382E" : textSecondary,
                    boxShadow: isActive ? `0 2px 8px ${primaryColor}25` : "none",
                  }}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slider */}
        <div
          className="p-3 rounded-2xl flex flex-col gap-2 shadow-sm"
          style={{ backgroundColor: surfaceColor, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold" style={{ color: textPrimary }}>
              {isSpoon ? "Handle Size" : isCoffee ? "Grind Size" : isDashboard ? "Threshold" : "Parameter"}
            </span>
            <span
              className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-lg"
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            >
              {sliderVal}{isSpoon ? " cm" : isCoffee ? " clicks" : isDashboard ? "%" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono" style={{ color: textSecondary }}>10</span>
            <input
              type="range"
              min={10}
              max={30}
              value={sliderVal}
              onChange={(e) => setSliderVal(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-lg cursor-pointer"
              style={{ accentColor: primaryColor }}
            />
            <span className="text-[10px] font-mono" style={{ color: textSecondary }}>30</span>
          </div>
        </div>

        {/* Usage log card */}
        <div
          className="rounded-2xl overflow-hidden shadow-sm"
          style={{ backgroundColor: surfaceColor, border: `1px solid ${borderColor}` }}
        >
          <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor }}>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              <span className="text-[11px] font-bold" style={{ color: textPrimary }}>
                {isDashboard ? "Key Metrics" : "Usage Log"}
              </span>
            </div>
            <span className="text-[10px]" style={{ color: textSecondary }}>Recent</span>
          </div>
          <div>
            {logEntries.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-4 py-2.5 text-[11px]"
                style={{ borderBottom: idx < logEntries.length - 1 ? `1px solid ${borderColor}` : "none" }}
              >
                <span style={{ color: textSecondary }}>{item.label}</span>
                <span className="font-semibold" style={{ color: textPrimary }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="pt-1 pb-2">
          <button
            type="button"
            onClick={handleCtaClick}
            className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 4px 16px ${accentColor}45`,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.06)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1)"; }}
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Home indicator */}
      <div className="h-4 flex items-center justify-center pb-2">
        <div className="w-28 h-1 rounded-full" style={{ backgroundColor: `${textSecondary}50` }} />
      </div>
    </div>
  );
};
