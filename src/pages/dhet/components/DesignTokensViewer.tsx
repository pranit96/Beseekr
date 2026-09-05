// src/pages/dhet/components/DesignTokensViewer.tsx
import React, { useState } from "react";
import { DesignTokens } from "@/types/dhet";
import { Palette, Type, LayoutGrid, Check } from "lucide-react";
import { toast } from "sonner";

interface DesignTokensViewerProps {
  tokens: DesignTokens;
}

export const DesignTokensViewer: React.FC<DesignTokensViewerProps> = ({ tokens }) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopiedHex(value);
    toast.success(`Copied ${label}: ${value}`);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  const colors = tokens?.colors || {};
  const typography = tokens?.typography || {};
  const spacing = tokens?.spacing || {};
  const radius = tokens?.radius || {};
  const grid = tokens?.grid || {};

  return (
    <div className="flex flex-col gap-6">
      {/* ── COLOR PALETTE ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" style={{ color: "rgb(167,139,250)" }} />
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(214 32% 82%)" }}>
            Color Palette
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.1)", color: "rgba(167,139,250,0.7)" }}>
            {Object.keys(colors).length} tokens
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {Object.entries(colors).map(([key, hexVal]) => {
            const cleanHex = String(hexVal).startsWith("#") ? String(hexVal) : `#${hexVal}`;
            const isCopied = copiedHex === cleanHex;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleCopy(cleanHex, key)}
                className="flex flex-col gap-2 rounded-2xl overflow-hidden group transition-all duration-200"
                style={{
                  border: `1px solid ${isCopied ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.06)"}`,
                  background: "rgba(255,255,255,0.02)",
                  transform: "scale(1)",
                  boxShadow: isCopied ? "0 0 16px rgba(16,185,129,0.2)" : "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                  (e.currentTarget as HTMLElement).style.borderColor = isCopied ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.06)";
                }}
              >
                {/* Color swatch */}
                <div
                  className="w-full h-14 relative flex items-center justify-center"
                  style={{ backgroundColor: cleanHex }}
                >
                  {isCopied && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="px-2 pb-2 flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold capitalize truncate" style={{ color: "hsl(214 32% 80%)" }}>
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: "rgba(196,181,253,0.4)" }}>
                    {cleanHex}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TYPOGRAPHY ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4" style={{ color: "rgb(167,139,250)" }} />
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(214 32% 82%)" }}>
            Typography Architecture
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Heading Font", value: typography.heading_font || "Inter", scale: "2xl, xl, lg" },
            { label: "Body Font", value: typography.body_font || "Inter", scale: "base, sm, xs" },
            { label: "Monospace", value: typography.mono_font || "Courier", scale: "tokens, code, specs" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl flex flex-col gap-1.5 border"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(196,181,253,0.45)" }}>
                {item.label}
              </span>
              <span
                className="text-base font-bold leading-tight"
                style={{ color: "hsl(214 32% 91%)", fontFamily: idx === 2 ? "monospace" : "inherit" }}
              >
                {item.value}
              </span>
              <span className="text-[11px] font-mono" style={{ color: "rgba(196,181,253,0.3)" }}>
                scale: {item.scale}
              </span>
            </div>
          ))}
        </div>

        {typography.scale && (
          <div className="flex flex-wrap gap-2 pt-1">
            {Object.entries(typography.scale).map(([name, size]) => (
              <span
                key={name}
                className="px-2.5 py-1 rounded-lg text-xs font-mono border"
                style={{
                  background: "rgba(139,92,246,0.06)",
                  borderColor: "rgba(139,92,246,0.15)",
                  color: "rgba(196,181,253,0.6)",
                }}
              >
                <span className="font-bold" style={{ color: "rgb(167,139,250)" }}>{name}:</span>{" "}
                {String(size)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── SPACING & GRID ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spacing & Radii */}
        <div
          className="p-4 rounded-2xl flex flex-col gap-3 border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
        >
          <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "hsl(214 32% 80%)" }}>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Spacing & Radii
          </h4>
          <div className="flex flex-col gap-2 text-xs">
            {Object.keys(spacing).length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="font-semibold" style={{ color: "rgba(196,181,253,0.5)" }}>Spacing Scale:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(spacing).map(([k, v]) => (
                    <span key={k} className="px-2 py-0.5 rounded font-mono" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(196,181,253,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {k}: {String(v)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {Object.keys(radius).length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="font-semibold" style={{ color: "rgba(196,181,253,0.5)" }}>Corner Radii:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(radius).map(([k, v]) => (
                    <span key={k} className="px-2 py-0.5 rounded font-mono" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(196,181,253,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {k}: {String(v)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grid Architecture */}
        <div
          className="p-4 rounded-2xl flex flex-col gap-3 border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
        >
          <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "hsl(214 32% 80%)" }}>
            <LayoutGrid className="w-3.5 h-3.5" style={{ color: "rgb(52,211,153)" }} />
            Grid System
          </h4>
          <div className="flex flex-col gap-2 text-xs">
            {[
              { label: "Columns", value: `${grid.columns || 12} Col Layout` },
              { label: "Gutter Width", value: grid.gutter || "24px" },
              { label: "Max Container", value: grid.max_width || "1280px" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between p-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <span style={{ color: "rgba(196,181,253,0.5)" }}>{row.label}</span>
                <span className="font-mono font-bold" style={{ color: "hsl(214 32% 88%)" }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
