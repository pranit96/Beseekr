// src/pages/dhet/components/PasteableSpecsViewer.tsx
import React, { useState } from "react";
import { Copy, Check, Sparkles, FileCode, Columns, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    setTimeout(() => setCopied(null), 2200);
  };

  const handleCopyBoth = () => {
    const combined = `=== AI IMAGE GENERATION PROMPT (Midjourney / DALL-E) ===\n${aiImagePrompt}\n\n=== FIGMA & CHATGPT AUTO-LAYOUT SPECIFICATION ===\n${plainTextSpec}`;
    navigator.clipboard.writeText(combined);
    setCopied("both");
    toast.success("Both AI Image Prompt and Figma Spec copied!");
    setTimeout(() => setCopied(null), 2200);
  };

  const tabs = [
    { key: "side-by-side" as const, label: "Split View", icon: Columns },
    { key: "image" as const, label: "Image Prompt", icon: Sparkles },
    { key: "spec" as const, label: "Figma Spec", icon: FileCode },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-bold" style={{ color: "hsl(214 32% 88%)" }}>
            Ready-to-Paste Specifications
          </h3>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{
              background: "rgba(16,185,129,0.1)",
              color: "rgb(52,211,153)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <Link2 className="w-3 h-3" />
            1:1 Parity Synced
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: isActive ? "rgba(139,92,246,0.2)" : "transparent",
                    color: isActive ? "rgb(196,181,253)" : "rgba(196,181,253,0.4)",
                    border: isActive ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
                  }}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Copy both */}
          <button
            type="button"
            onClick={handleCopyBoth}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
            style={{
              background: copied === "both" ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
              borderColor: copied === "both" ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.07)",
              color: copied === "both" ? "rgb(52,211,153)" : "rgba(196,181,253,0.6)",
            }}
          >
            {copied === "both" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied === "both" ? "Copied All" : "Copy Both"}</span>
          </button>
        </div>
      </div>

      {/* ── CONTENT PANELS ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === "side-by-side" && (
          <motion.div
            key="side-by-side"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            <CodeBlock
              label="Midjourney v6 / DALL-E 3"
              labelIcon={<Sparkles className="w-3.5 h-3.5" style={{ color: "rgb(251,191,36)" }} />}
              content={aiImagePrompt || "No image prompt provided."}
              copyLabel="AI Image Prompt"
              copied={copied}
              onCopy={() => handleCopy(aiImagePrompt, "AI Image Prompt")}
              isCode={false}
              footerNote="Includes photorealistic UI render cues, aspect ratio, and art direction"
            />
            <CodeBlock
              label="Figma Auto-Layout & ChatGPT Spec"
              labelIcon={<FileCode className="w-3.5 h-3.5" style={{ color: "rgb(167,139,250)" }} />}
              content={plainTextSpec || "No layout spec provided."}
              copyLabel="Figma Spec"
              copied={copied}
              onCopy={() => handleCopy(plainTextSpec, "Figma Spec")}
              isCode={true}
              footerNote="Matches exact frames, paddings, color tokens, and section hierarchy"
            />
          </motion.div>
        )}

        {activeTab === "image" && (
          <motion.div
            key="image"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <CodeBlock
              label="Midjourney v6 / DALL-E 3 Generation Prompt"
              labelIcon={<Sparkles className="w-3.5 h-3.5" style={{ color: "rgb(251,191,36)" }} />}
              content={aiImagePrompt || "No image prompt provided."}
              copyLabel="AI Image Prompt"
              copied={copied}
              onCopy={() => handleCopy(aiImagePrompt, "AI Image Prompt")}
              isCode={false}
              large
            />
          </motion.div>
        )}

        {activeTab === "spec" && (
          <motion.div
            key="spec"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <CodeBlock
              label="Figma Auto-Layout & ChatGPT Spec"
              labelIcon={<FileCode className="w-3.5 h-3.5" style={{ color: "rgb(167,139,250)" }} />}
              content={plainTextSpec || "No layout spec provided."}
              copyLabel="Figma Spec"
              copied={copied}
              onCopy={() => handleCopy(plainTextSpec, "Figma Spec")}
              isCode={true}
              large
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Internal CodeBlock component ─────────────────────────────────────────── */
function CodeBlock({
  label,
  labelIcon,
  content,
  copyLabel,
  copied,
  onCopy,
  isCode,
  footerNote,
  large,
}: {
  label: string;
  labelIcon: React.ReactNode;
  content: string;
  copyLabel: string;
  copied: string | null;
  onCopy: () => void;
  isCode: boolean;
  footerNote?: string;
  large?: boolean;
}) {
  const isCopied = copied === copyLabel;

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl overflow-hidden border"
      style={{
        background: "rgba(255,255,255,0.02)",
        borderColor: isCopied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)",
        transition: "border-color 0.3s",
        boxShadow: isCopied ? "0 0 16px rgba(16,185,129,0.1)" : "none",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-4"
      >
        <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "rgba(196,181,253,0.5)" }}>
          {labelIcon}
          {label}
        </span>

        <motion.button
          type="button"
          onClick={onCopy}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: isCopied ? "rgba(16,185,129,0.15)" : "rgba(139,92,246,0.12)",
            color: isCopied ? "rgb(52,211,153)" : "rgb(167,139,250)",
            border: `1px solid ${isCopied ? "rgba(16,185,129,0.3)" : "rgba(139,92,246,0.25)"}`,
          }}
        >
          <AnimatePresence mode="wait">
            {isCopied ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1.5"
              >
                <Check className="w-3 h-3" />
                <span>Copied!</span>
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1.5"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Code/text block */}
      <div
        className={cn(
          "mx-4 rounded-xl border overflow-auto select-text",
          large ? "min-h-[300px]" : "min-h-[200px]",
          isCode ? "font-mono text-xs leading-relaxed whitespace-pre" : "font-sans text-sm leading-relaxed"
        )}
        style={{
          background: isCode ? "rgba(6,8,16,0.6)" : "rgba(255,255,255,0.025)",
          borderColor: "rgba(255,255,255,0.05)",
          color: "rgba(226,232,240,0.85)",
          padding: "16px",
          maxHeight: large ? "400px" : "260px",
        }}
      >
        {/* Line numbers for code */}
        {isCode ? (
          <div className="flex gap-4">
            <div className="flex flex-col" style={{ color: "rgba(196,181,253,0.2)", userSelect: "none", minWidth: "28px" }}>
              {content.split("\n").map((_, i) => (
                <span key={i} className="leading-[1.6] text-right">{i + 1}</span>
              ))}
            </div>
            <div className="flex-1" style={{ color: "rgba(196,181,253,0.75)" }}>
              {content}
            </div>
          </div>
        ) : (
          <p style={{ color: "rgba(226,232,240,0.8)" }}>{content}</p>
        )}
      </div>

      {/* Footer note */}
      {footerNote && (
        <div
          className="flex items-center gap-1.5 px-4 pb-3 text-[11px]"
          style={{ color: "rgba(196,181,253,0.35)" }}
        >
          <Check className="w-3 h-3" style={{ color: "rgb(52,211,153)" }} />
          <span>{footerNote}</span>
        </div>
      )}
    </div>
  );
}
