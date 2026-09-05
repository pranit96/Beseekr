// src/pages/dhet/components/DesignDecisionsViewer.tsx
import React, { useState } from "react";
import { DesignDecision } from "@/types/dhet";
import { ChevronDown, ChevronRight, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DesignDecisionsViewerProps {
  decisions: DesignDecision[];
}

const AUTHOR_CONFIG: Record<string, { color: string; bg: string; stripe: string; initials: string }> = {
  "Don Norman": {
    color: "rgb(251,191,36)",
    bg: "rgba(245,158,11,0.12)",
    stripe: "rgba(245,158,11,0.7)",
    initials: "DN",
  },
  "Dieter Rams": {
    color: "rgb(96,165,250)",
    bg: "rgba(59,130,246,0.12)",
    stripe: "rgba(59,130,246,0.7)",
    initials: "DR",
  },
  "Jakob Nielsen": {
    color: "rgb(52,211,153)",
    bg: "rgba(16,185,129,0.12)",
    stripe: "rgba(16,185,129,0.7)",
    initials: "JN",
  },
  "Steve Krug": {
    color: "rgb(196,181,253)",
    bg: "rgba(139,92,246,0.12)",
    stripe: "rgba(139,92,246,0.7)",
    initials: "SK",
  },
  "Alan Cooper": {
    color: "rgb(103,232,249)",
    bg: "rgba(6,182,212,0.12)",
    stripe: "rgba(6,182,212,0.7)",
    initials: "AC",
  },
  "Susan Weinschenk": {
    color: "rgb(253,164,175)",
    bg: "rgba(239,68,68,0.12)",
    stripe: "rgba(239,68,68,0.7)",
    initials: "SW",
  },
};

const getAuthorConfig = (attribution: string) => {
  for (const [key, val] of Object.entries(AUTHOR_CONFIG)) {
    if (attribution?.includes(key.split(" ")[1] || key)) return val;
  }
  return {
    color: "rgb(167,139,250)",
    bg: "rgba(139,92,246,0.1)",
    stripe: "rgba(139,92,246,0.6)",
    initials: (attribution || "UX").slice(0, 2).toUpperCase(),
  };
};

export const DesignDecisionsViewer: React.FC<DesignDecisionsViewerProps> = ({ decisions }) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(214 32% 82%)" }}>
          Foundational UX & Heuristic Decisions
        </h3>
        <span
          className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-lg"
          style={{
            background: "rgba(139,92,246,0.1)",
            color: "rgb(167,139,250)",
            border: "1px solid rgba(139,92,246,0.2)",
          }}
        >
          {decisions.length} documented
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {decisions.map((decision, idx) => {
          const config = getAuthorConfig(decision.attribution || "");
          const isExpanded = expandedIdx === idx;

          return (
            <div
              key={idx}
              className="rounded-2xl overflow-hidden border transition-all duration-200"
              style={{
                background: isExpanded ? config.bg : "rgba(255,255,255,0.02)",
                borderColor: isExpanded ? `${config.stripe}50` : "rgba(255,255,255,0.06)",
                boxShadow: isExpanded ? `0 0 20px ${config.stripe}12` : "none",
              }}
            >
              {/* Card header — always visible */}
              <button
                type="button"
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                className="w-full flex items-start gap-4 p-4 text-left group"
              >
                {/* Left color stripe */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl transition-all"
                  style={{ background: isExpanded ? config.stripe : "transparent" }}
                />

                {/* Author avatar circle */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-black"
                  style={{ background: config.bg, color: config.color, border: `1px solid ${config.stripe}40` }}
                >
                  {config.initials}
                </div>

                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-sm font-bold leading-tight"
                      style={{ color: "hsl(214 32% 91%)" }}
                    >
                      {decision.title || `Decision ${idx + 1}`}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0"
                      style={{ background: config.bg, color: config.color }}
                    >
                      {decision.attribution}
                    </span>
                  </div>

                  <span className="text-xs flex items-center gap-1" style={{ color: config.color, opacity: 0.8 }}>
                    <Compass className="w-3 h-3 shrink-0" />
                    {decision.principle}
                  </span>
                </div>

                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "rgba(196,181,253,0.4)" }} />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "rgba(196,181,253,0.3)" }} />
                )}
              </button>

              {/* Accordion body */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p
                      className="px-4 pb-4 text-sm leading-relaxed italic pl-[calc(1rem+36px+1rem)]"
                      style={{ color: "rgba(196,181,253,0.6)" }}
                    >
                      "{decision.rationale}"
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
