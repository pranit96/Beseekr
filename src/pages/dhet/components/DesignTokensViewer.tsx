// src/pages/dhet/components/DesignTokensViewer.tsx
import React, { useState } from "react";
import { DesignTokens } from "@/types/dhet";
import { Palette, Type, LayoutGrid, Check, Copy } from "lucide-react";
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
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <span>Concrete Design Tokens</span>
        </h3>
        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
          Real, production-ready values for design systems, stylesheets, and Figma variables.
        </p>
      </div>

      {/* ── COLORS ──────────────────────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col gap-3">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>Color Palette (Hex Tokens)</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(colors).map(([key, hexVal]) => {
            const cleanHex = String(hexVal).startsWith("#") ? String(hexVal) : `#${hexVal}`;
            const isCopied = copiedHex === cleanHex;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleCopy(cleanHex, key)}
                className="p-2.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/50 hover:border-primary/40 transition-all flex flex-col gap-2 text-left group"
              >
                <div
                  className="w-full h-12 rounded-lg border border-black/10 shadow-inner flex items-center justify-center transition-transform group-hover:scale-[1.02]"
                  style={{ backgroundColor: cleanHex }}
                >
                  {isCopied && (
                    <span className="p-1 rounded-full bg-black/60 text-white backdrop-blur-sm">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground capitalize truncate">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground group-hover:text-primary transition-colors">
                    {cleanHex}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TYPOGRAPHY ──────────────────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col gap-3">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Type className="w-4 h-4 text-primary" />
          <span>Typography Architecture</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Heading Font</span>
            <span className="text-base font-bold text-foreground">{typography.heading_font || "Inter"}</span>
            <span className="text-xs text-muted-foreground font-mono">scale: 2xl, xl, lg</span>
          </div>

          <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Body Font</span>
            <span className="text-base font-bold text-foreground">{typography.body_font || "Inter"}</span>
            <span className="text-xs text-muted-foreground font-mono">base, sm, xs</span>
          </div>

          <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monospace Font</span>
            <span className="text-base font-bold text-foreground">{typography.mono_font || "Courier"}</span>
            <span className="text-xs text-muted-foreground font-mono">tokens, code, specs</span>
          </div>
        </div>

        {/* Font Scale if available */}
        {typography.scale && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
            {Object.entries(typography.scale).map(([name, size]) => (
              <span key={name} className="px-2.5 py-1 rounded-md bg-muted/40 text-xs font-mono text-muted-foreground border border-border/40">
                <span className="font-semibold text-foreground mr-1">{name}:</span>
                {String(size)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── SPACING & GEOMETRY ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spacing & Radius */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col gap-3">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Spacing & Radii</span>
          </h4>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Spacing Scale:</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(spacing).map(([k, v]) => (
                <span key={k} className="px-2 py-0.5 rounded bg-muted text-xs font-mono text-foreground border border-border/50">
                  {k}: {String(v)}
                </span>
              ))}
            </div>

            <span className="text-xs font-semibold text-muted-foreground mt-2">Corner Radii:</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(radius).map(([k, v]) => (
                <span key={k} className="px-2 py-0.5 rounded bg-muted text-xs font-mono text-foreground border border-border/50">
                  {k}: {String(v)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Grid Architecture */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col gap-3">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-emerald-500" />
            <span>Grid System</span>
          </h4>

          <div className="flex flex-col gap-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <span className="text-muted-foreground font-sans">Columns:</span>
              <span className="font-bold text-foreground">{grid.columns || 12} Col Layout</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <span className="text-muted-foreground font-sans">Gutter Width:</span>
              <span className="font-bold text-foreground">{grid.gutter || "24px"}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <span className="text-muted-foreground font-sans">Max Container Width:</span>
              <span className="font-bold text-foreground">{grid.max_width || "1280px"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
