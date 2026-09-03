// src/pages/dhet/components/PasteableSpecsViewer.tsx
import React, { useState } from "react";
import { Copy, Check, Sparkles, FileCode } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"image" | "spec">("image");
  const [copied, setCopied] = useState<"image" | "spec" | null>(null);

  const handleCopy = (text: string, type: "image" | "spec") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(
      type === "image"
        ? "AI Image Prompt copied to clipboard"
        : "Figma/ChatGPT layout spec copied"
    );
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>Ready-to-Paste Specifications</span>
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Directly drop these prompts into Midjourney, DALL-E, Figma, or ChatGPT to materialize your design.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="p-1 rounded-xl bg-muted/60 border border-border/60 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("image")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
              activeTab === "image"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>AI Image Prompt</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("spec")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
              activeTab === "spec"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileCode className="w-3.5 h-3.5 text-primary" />
            <span>Figma / LLM Spec</span>
          </button>
        </div>
      </div>

      {/* Tab Content 1: AI Image Prompt */}
      {activeTab === "image" && (
        <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Midjourney v6 / DALL-E 3 Generation Prompt
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopy(aiImagePrompt, "image")}
              className="rounded-lg h-7 text-xs flex items-center gap-1.5"
            >
              {copied === "image" ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Image Prompt</span>
                </>
              )}
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border/40 text-xs md:text-sm text-foreground font-sans leading-relaxed select-text">
            {aiImagePrompt || "No image prompt provided."}
          </div>
        </div>
      )}

      {/* Tab Content 2: Plain Text Spec */}
      {activeTab === "spec" && (
        <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Structured Layout Spec for Figma Auto-Layout & ChatGPT
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopy(plainTextSpec, "spec")}
              className="rounded-lg h-7 text-xs flex items-center gap-1.5"
            >
              {copied === "spec" ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Layout Spec</span>
                </>
              )}
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0F19] text-slate-300 font-mono text-xs md:text-sm leading-relaxed overflow-x-auto select-text whitespace-pre border border-slate-800">
            {plainTextSpec || "No layout spec provided."}
          </div>
        </div>
      )}
    </div>
  );
};
