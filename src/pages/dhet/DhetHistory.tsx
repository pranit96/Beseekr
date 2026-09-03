// src/pages/dhet/DhetHistory.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Layers,
  Search,
  Download,
  Trash2,
  ExternalLink,
  Plus,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      if (res.success && res.data) {
        setDesigns(res.data);
      }
    } catch (err: any) {
      toast.error("Failed to load saved designs: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, []);

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
      action: {
        label: "Delete",
        onClick: () => executeDelete(design.id, design.title),
      },
      cancel: {
        label: "Cancel",
        onClick: () => {
          toast.info("Deletion canceled");
        },
      },
      actionButtonStyle: {
        backgroundColor: "#dc2626",
        color: "#ffffff",
        fontWeight: "600",
      },
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <GlobalHeader />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 md:py-12 flex flex-col gap-8">
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <Layers className="w-7 h-7 text-primary" />
              <span>Saved Design Proposals</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Review, re-open, or export your human-centered design specifications.
            </p>
          </div>

          <Button
            onClick={() => navigate("/dhet")}
            className="rounded-xl flex items-center gap-2 self-start sm:self-auto font-semibold shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Design</span>
          </Button>
        </div>

        {/* ── SEARCH BAR ───────────────────────────────────────────────────── */}
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or prompt..."
            className="pl-10 rounded-xl bg-card border-border/70"
          />
        </div>

        {/* ── DESIGNS GRID ─────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm">Loading design proposals...</span>
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="py-20 border border-dashed border-border/70 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 bg-card/30">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="font-bold text-lg text-foreground">No designs found</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                {searchQuery
                  ? "No design matched your search filter."
                  : "You haven't generated any design proposals yet. Describe your first product idea in the Studio."}
              </p>
            </div>
            <Button
              onClick={() => navigate("/dhet")}
              className="rounded-xl flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Studio</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDesigns.map((design) => (
              <motion.div
                key={design.id}
                whileHover={{ y: -2 }}
                onClick={() => handleOpenInStudio(design)}
                className="p-5 rounded-2xl border border-border/60 bg-card hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between gap-4 cursor-pointer group"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(design.created_at).toLocaleDateString("en-US", {
                        dateStyle: "medium",
                      })}
                    </span>

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                      Human-Centered UX
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {design.title || "Untitled Design"}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {design.initial_prompt}
                  </p>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50 gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:underline">
                    <span>Open in Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleExportPdf(e, design.id, design.title)}
                      className="h-8 text-xs rounded-lg px-2 flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">PDF</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === design.id}
                      onClick={(e) => handleDelete(e, design)}
                      className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <GlobalFooter />
    </div>
  );
};

export default DhetHistory;
