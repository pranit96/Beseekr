import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Edit3, Check, Flame, Star, Sun } from "lucide-react";
import { visionBoardApi, type BoardMonth } from "@/api/visionboard";
import { useToast } from "@/components/ui/use-toast";

interface ManifestationBannerProps {
  boardMonth: BoardMonth;
  year: number;
  month: number;
  onUpdate: (updates: Partial<BoardMonth>) => Promise<any>;
}

const MANIFESTATION_PRESETS = [
  "✨ I am operating with clarity, high energy, and unwavering focus.",
  "🌿 Every step I take brings me closer to peace, balance, and abundance.",
  "🚀 I execute relentlessly on my goals while staying present in the moment.",
  "🔥 I attract high-impact opportunities and embrace continuous growth.",
];

export function ManifestationBanner({ boardMonth, year, month, onUpdate }: ManifestationBannerProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const storageKey = `vb_manifestation_${year}_${month}`;

  const [statement, setStatement] = useState<string>(() => {
    return boardMonth.quote || localStorage.getItem(storageKey) || MANIFESTATION_PRESETS[0];
  });

  useEffect(() => {
    if (boardMonth.quote) {
      setStatement(boardMonth.quote);
    }
  }, [boardMonth.quote]);

  const handleSave = async (newText?: string) => {
    const textToSave = newText !== undefined ? newText : statement;
    setStatement(textToSave);
    try {
      localStorage.setItem(storageKey, textToSave);
      await onUpdate({ quote: textToSave });
      toast({
        title: "Manifestation Saved",
        description: "Your monthly intent has been set for the board.",
      });
      setIsEditing(false);
    } catch (e: any) {
      toast({
        title: "Error saving manifestation",
        description: e?.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="vb-manifestation-banner relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-amber-500/10 p-6 mb-6 backdrop-blur-md shadow-lg shadow-amber-500/5">
      {/* Ambient background glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow" /> Monthly Manifestation
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {month}/{year}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-3 pt-1">
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                className="w-full bg-background/80 border border-amber-500/40 rounded-xl p-3 text-sm font-serif text-foreground outline-none focus:ring-2 focus:ring-amber-500/50 resize-none min-h-[70px]"
                placeholder="Write your manifestation intent for this month..."
                autoFocus
              />
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-muted-foreground font-medium mr-1">Presets:</span>
                  {MANIFESTATION_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setStatement(preset)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 transition-colors"
                    >
                      Preset {idx + 1}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="vb-btn-ghost text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    className="vb-btn-primary text-xs"
                  >
                    <Check className="w-3.5 h-3.5" /> Save Manifestation
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="group cursor-pointer pt-1" onClick={() => setIsEditing(true)}>
              <h2 className="text-lg md:text-xl font-serif italic text-foreground tracking-tight leading-snug flex items-start gap-2">
                <span>"{statement}"</span>
                <Edit3 className="w-4 h-4 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
              </h2>
            </div>
          )}
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="vb-btn-ghost text-xs flex items-center gap-1.5 whitespace-nowrap self-end md:self-center"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-600" /> Edit Intention
          </button>
        )}
      </div>
    </div>
  );
}
