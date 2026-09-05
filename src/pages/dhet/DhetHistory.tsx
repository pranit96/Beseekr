// src/pages/dhet/DhetHistory.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Download,
  Trash2,
  ExternalLink,
  Plus,
  Loader2,
  Calendar,
  Sparkles,
  Layers,
} from "lucide-react";
import { DhetDesignRecord } from "@/types/dhet";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";

export const DhetHistory: React.FC = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<DhetDesignRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDesigns = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.getDhetDesigns(1, 50);
      if (res.success && res.data) setDesigns(res.data);
    } catch (err: any) {
      toast.error("Failed to load saved designs: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDesigns(); }, []);

  const executeDelete = async (id: string, title?: string) => {
    try {
      setDeletingId(id);
      await apiClient.deleteDhetDesign(id);
      setDesigns((prev) => prev.filter((d) => d.id !== id));
      toast.success(`"${title || "Design proposal"}" deleted successfully`);
    } catch (err: any) {
      toast.error("Failed to delete design: " + (err.message || "Unknown error"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (e: React.MouseEvent, design: DhetDesignRecord) => {
    e.stopPropagation();
    toast(`Delete "${design.title || "Design Proposal"}"?`, {
      description: "This design proposal will be permanently removed. This action cannot be undone.",
      duration: 10000,
      action: { label: "Delete", onClick: () => executeDelete(design.id, design.title) },
      cancel: { label: "Cancel", onClick: () => toast.info("Deletion canceled") },
      actionButtonStyle: { backgroundColor: "#dc2626", color: "#ffffff", fontWeight: "600" },
    });
  };

  const handleOpenInStudio = (design: DhetDesignRecord) => {
    navigate(`/dhet?id=${design.id}`, { state: { design } });
  };

  const handleExportPdf = (e: React.MouseEvent, id: string, title?: string) => {
    e.stopPropagation();
    const url = apiClient.getDhetExportPdfUrl(id);
    const link = document.createElement("a");
    link.href = url;
    const safeTitle = (title || "design_proposal").replace(/\s+/g, "_");
    link.setAttribute("download", `DHET_${safeTitle}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDesigns = designs.filter(
    (d) =>
      (d.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.initial_prompt || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "hsl(222 47% 3%)", color: "hsl(214 32% 91%)" }}>
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] z-0"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 70%)" }}
      />
      {/* Grain texture */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <GlobalHeader />

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 md:py-12 flex flex-col gap-8">
          {/* ── HEADER ────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex flex-col gap-1.5">
              {/* Studio label */}
              <div
                className="inline-flex items-center gap-2 text-xs font-semibold"
                style={{ color: "rgba(167,139,250,0.7)" }}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Design Everyday Things</span>
              </div>
              <h1
                className="text-3xl md:text-4xl font-black tracking-tighter"
                style={{ color: "hsl(214 32% 94%)" }}
              >
                Saved Proposals
              </h1>
              <p className="text-sm" style={{ color: "rgba(196,181,253,0.5)" }}>
                Review, re-open, or export your human-centered design specifications.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/dhet")}
              className="flex items-center gap-2 self-start sm:self-auto px-5 py-3 rounded-2xl text-sm font-bold transition-all"
              style={{
                background: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
                color: "#fff",
                boxShadow: "0 0 20px rgba(139,92,246,0.35)",
              }}
            >
              <Plus className="w-4 h-4" />
              <span>New Design</span>
            </motion.button>
          </div>

          {/* ── SEARCH BAR ──────────────────────────────────────────────── */}
          <div
            className="relative w-full max-w-sm rounded-2xl overflow-hidden border transition-all"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.07)",
            }}
          >
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "rgba(196,181,253,0.4)" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or prompt..."
              className="w-full bg-transparent pl-11 pr-4 py-3 text-sm outline-none placeholder:opacity-40"
              style={{ color: "hsl(214 32% 88%)" }}
            />
          </div>

          {/* ── DESIGNS GRID ────────────────────────────────────────────── */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "rgb(167,139,250)" }} />
              <span className="text-sm" style={{ color: "rgba(196,181,253,0.5)" }}>Loading design proposals...</span>
            </div>
          ) : filteredDesigns.length === 0 ? (
            <div
              className="py-20 border border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-5"
              style={{ borderColor: "rgba(139,92,246,0.15)", background: "rgba(139,92,246,0.03)" }}
            >
              {/* Empty state illustration */}
              <div className="relative w-20 h-20">
                <div
                  className="absolute inset-0 rounded-2xl animate-pulse"
                  style={{ background: "rgba(139,92,246,0.1)" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-10 h-10" style={{ color: "rgb(167,139,250)" }} />
                </div>
                {/* Orbiting dot */}
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2"
                  style={{ background: "rgb(167,139,250)", borderColor: "hsl(222 47% 3%)" }}
                />
              </div>

              <div className="flex flex-col gap-2 max-w-sm">
                <h3 className="font-bold text-xl" style={{ color: "hsl(214 32% 91%)" }}>
                  {searchQuery ? "No designs matched" : "No proposals yet"}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(196,181,253,0.5)" }}>
                  {searchQuery
                    ? "Try a different search term or clear your filter."
                    : "Describe your first product idea in the Studio and generate a full human-centered design specification."}
                </p>
              </div>

              <button
                onClick={() => navigate("/dhet")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all"
                style={{
                  background: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
                  color: "#fff",
                  boxShadow: "0 0 16px rgba(139,92,246,0.3)",
                }}
              >
                <Plus className="w-4 h-4" />
                <span>Launch Studio</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {filteredDesigns.map((design, idx) => {
                  const colors: Record<string, string> = design.proposal?.design_tokens?.colors || {};
                  const swatchEntries = Object.entries(colors).slice(0, 6);

                  return (
                    <motion.div
                      key={design.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      whileHover={{ y: -3 }}
                      onClick={() => handleOpenInStudio(design)}
                      className="relative rounded-2xl border flex flex-col justify-between gap-4 cursor-pointer group overflow-hidden transition-all"
                      style={{
                        background: "rgba(255,255,255,0.025)",
                        borderColor: "rgba(255,255,255,0.07)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.3)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(139,92,246,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "none";
                      }}
                    >
                      {/* Color swatch strip at top */}
                      {swatchEntries.length > 0 && (
                        <div className="flex h-1.5 w-full rounded-t-2xl overflow-hidden">
                          {swatchEntries.map(([role, hex]) => (
                            <div
                              key={role}
                              className="flex-1"
                              style={{ backgroundColor: String(hex) }}
                              title={`${role}: ${hex}`}
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex flex-col gap-2 p-5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-[11px] font-semibold flex items-center gap-1.5"
                            style={{ color: "rgba(196,181,253,0.4)" }}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(design.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
                          </span>

                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={{
                              background: "rgba(139,92,246,0.1)",
                              color: "rgb(167,139,250)",
                              border: "1px solid rgba(139,92,246,0.2)",
                            }}
                          >
                            Human-Centered UX
                          </span>
                        </div>

                        <h3
                          className="text-lg font-bold line-clamp-1 transition-colors"
                          style={{ color: "hsl(214 32% 91%)" }}
                        >
                          {design.title || "Untitled Design"}
                        </h3>

                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "rgba(196,181,253,0.45)" }}>
                          {design.initial_prompt}
                        </p>
                      </div>

                      {/* Card footer */}
                      <div
                        className="flex items-center justify-between px-5 py-3 border-t"
                        style={{ borderColor: "rgba(255,255,255,0.05)" }}
                      >
                        <div
                          className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                          style={{ color: "rgba(139,92,246,0.7)" }}
                        >
                          <span>Open in Studio</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleExportPdf(e, design.id, design.title)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                            style={{
                              background: "transparent",
                              borderColor: "rgba(255,255,255,0.06)",
                              color: "rgba(196,181,253,0.5)",
                            }}
                            onMouseEnter={(e) => { e.stopPropagation(); (e.currentTarget as HTMLElement).style.color = "rgb(167,139,250)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(196,181,253,0.5)"; }}
                          >
                            <Download className="w-3 h-3" />
                            <span className="hidden sm:inline">PDF</span>
                          </button>

                          <button
                            type="button"
                            disabled={deletingId === design.id}
                            onClick={(e) => handleDelete(e, design)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                            style={{
                              background: "transparent",
                              borderColor: "rgba(239,68,68,0.12)",
                              color: "rgba(252,165,165,0.5)",
                            }}
                            onMouseEnter={(e) => { e.stopPropagation(); (e.currentTarget as HTMLElement).style.color = "rgba(252,165,165,0.9)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(252,165,165,0.5)"; }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </main>

        <GlobalFooter />
      </div>
    </div>
  );
};

export default DhetHistory;
