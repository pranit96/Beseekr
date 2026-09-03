// src/pages/dhet/components/PasteableSpecsViewer.tsx
import React, { useState } from "react";
import { Copy, Check, Sparkles, FileCode, Columns, Link2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PasteableSpecsViewerProps {
  aiImagePrompt: string;
  plainTextSpec: string;
}

export const PasteableSpecsViewer: React.FC<PasteableSpecsViewerProps> = ({
  aiImagePrompt,
  plainTextSpec,
}) => {
  const [activeTab, setActiveTab] = useState<"side-by-side" | "image" | "spec">("side-by-side");
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyBoth = () => {
    const combined = `=== AI IMAGE GENERATION PROMPT (Midjourney / DALL-E) ===\n${aiImagePrompt}\n\n=== FIGMA & CHATGPT AUTO-LAYOUT SPECIFICATION ===\n${plainTextSpec}`;
    navigator.clipboard.writeText(combined);
    setCopied("both");
    toast.success("Both AI Image Prompt and Figma Spec copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── HEADER & PARITY BANNER ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Ready-to-Paste Specifications</span>
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Link2 className="w-3 h-3" />
              1:1 Parity Synced
            </span>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            The AI image render prompt and Figma auto-layout spec are twin synchronized blueprints — identical aspect ratios, colors, and layout order.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="p-1 rounded-xl bg-muted/60 border border-border/60 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("side-by-side")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                activeTab === "side-by-side"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Columns className="w-3.5 h-3.5 text-primary" />
              <span className="hidden md:inline">Side-by-Side</span>
              <span className="md:hidden">Split</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("image")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                activeTab === "image"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Image Prompt</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("spec")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                activeTab === "spec"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileCode className="w-3.5 h-3.5 text-primary" />
              <span>Figma Spec</span>
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyBoth}
            className="h-8 text-xs rounded-xl flex items-center gap-1.5 shrink-0"
          >
            {copied === "both" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">Copied All</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Both</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── SIDE-BY-SIDE SYNCED VIEW ────────────────────────────────────────── */}
      {activeTab === "side-by-side" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: AI Image Prompt */}
          <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Midjourney v6 / DALL-E 3
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(aiImagePrompt, "AI Image Prompt")}
                  className="h-7 text-xs rounded-lg px-2 flex items-center gap-1"
                >
                  {copied === "AI Image Prompt" ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>Copy</span>
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/40 text-xs md:text-sm text-foreground font-sans leading-relaxed select-text min-h-[220px]">
                {aiImagePrompt || "No image prompt provided."}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Includes photorealistic UI render cues, aspect ratio, and art direction</span>
            </div>
          </div>

          {/* Right: Figma / ChatGPT Spec */}
          <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-primary" />
                  Figma Auto-Layout & ChatGPT Spec
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(plainTextSpec, "Figma Spec")}
                  className="h-7 text-xs rounded-lg px-2 flex items-center gap-1"
                >
                  {copied === "Figma Spec" ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>Copy</span>
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-[#0B0F19] text-slate-300 font-mono text-xs md:text-sm leading-relaxed overflow-x-auto select-text whitespace-pre border border-slate-800 min-h-[220px]">
                {plainTextSpec || "No layout spec provided."}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Matches exact frames, paddings, color tokens, and section hierarchy</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 1: AI IMAGE PROMPT ALONE ───────────────────────────────────── */}
      {activeTab === "image" && (
        <div className="p-6 rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Midjourney v6 / DALL-E 3 Generation Prompt
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopy(aiImagePrompt, "AI Image Prompt")}
              className="rounded-xl h-8 text-xs flex items-center gap-1.5 shadow-sm"
            >
              {copied === "AI Image Prompt" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Image Prompt</span>
                </>
              )}
            </Button>
          </div>

          <div className="p-5 rounded-xl bg-muted/40 border border-border/40 text-sm text-foreground font-sans leading-relaxed select-text">
            {aiImagePrompt || "No image prompt provided."}
          </div>
        </div>
      )}

      {/* ── TAB 2: FIGMA SPEC ALONE ────────────────────────────────────────── */}
      {activeTab === "spec" && (
        <div className="p-6 rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Structured Layout Spec for Figma Auto-Layout & ChatGPT
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopy(plainTextSpec, "Figma Spec")}
              className="rounded-xl h-8 text-xs flex items-center gap-1.5 shadow-sm"
            >
              {copied === "Figma Spec" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Layout Spec</span>
                </>
              )}
            </Button>
          </div>

          <div className="p-5 rounded-xl bg-[#0B0F19] text-slate-300 font-mono text-xs md:text-sm leading-relaxed overflow-x-auto select-text whitespace-pre border border-slate-800">
            {plainTextSpec || "No layout spec provided."}
          </div>
        </div>
      )}
    </div>
  );
};
