/**
 * VisionCollage.tsx — Vision card grid with Notice Board Pinning, Photo Zoom Lightbox & Slideshow Presentation
 */

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Search,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Pin,
  Eye,
} from "lucide-react";
import { visionBoardApi, type VisionCard } from "@/api/visionboard";
import { useToast } from "@/components/ui/use-toast";

const ACCENT_CLASSES: Record<string, string> = {
  terracotta: "vb-card-terracotta",
  sage: "vb-card-sage",
  taupe: "vb-card-taupe",
  ink: "vb-card-ink",
  blush: "vb-card-blush",
};

const CARD_TEMPLATES = [
  {
    emoji: "🌙",
    title: "Dream Life",
    colorAccent: "terracotta" as const,
    cardType: "dream" as const,
  },
  {
    emoji: "💪",
    title: "Motivation",
    colorAccent: "sage" as const,
    cardType: "motivation" as const,
  },
  {
    emoji: "💼",
    title: "Career Goal",
    colorAccent: "ink" as const,
    cardType: "career" as const,
  },
  {
    emoji: "🏡",
    title: "Future Home",
    colorAccent: "taupe" as const,
    cardType: "home" as const,
  },
];

const EMOJI_OPTIONS = [
  "✨",
  "🌙",
  "💪",
  "🎯",
  "💼",
  "🏡",
  "🌿",
  "📚",
  "🎨",
  "🚀",
  "❤️",
  "💰",
  "🌸",
  "⭐",
  "🦋",
  "🧘",
];

const QUICK_UNSPLASH_TERMS = [
  "Minimal",
  "Mountains",
  "Workspace",
  "Sunset",
  "Mindfulness",
  "Travel",
  "Architecture",
];

// ── Single Vision Card (Notice Board Pinned Card) ──────────────────────────────

interface CardTileProps {
  card: VisionCard;
  onDelete: (id: string) => void;
  onUpload: (id: string, file: File) => Promise<void>;
  onInspect: (card: VisionCard) => void;
}

function CardTile({ card, onDelete, onUpload, onInspect }: CardTileProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    setUploading(true);
    await onUpload(card.id, file);
    setUploading(false);
  }

  const hasPhoto = Boolean(card.file_url && card.file_url.trim().length > 0);

  return (
    <motion.div
      className={`vb-vision-card relative group overflow-visible ${ACCENT_CLASSES[card.color_accent] ?? "vb-card-terracotta"} ${dragging ? "vb-card-drag-over" : ""}`}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ scale: 1.03, y: -4 }}
      drag
      dragConstraints={{ left: -150, right: 150, top: -150, bottom: 150 }}
      dragSnapToOrigin
      whileDrag={{ scale: 1.08, zIndex: 50, cursor: "grabbing" }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        await handleFile(file);
      }}
    >
      {/* Notice Board Metallic Pushpin */}
      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-white shadow-md shadow-amber-950/40 border border-amber-300/60 pointer-events-none">
        <Pin size={11} className="rotate-45 fill-white" />
      </div>

      {/* Delete button */}
      <button
        className="vb-card-delete z-20"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(card.id);
        }}
        aria-label="Remove card"
      >
        <X size={11} />
      </button>

      {/* Inspect Zoom Trigger */}
      <button
        className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-black/60 text-white hover:bg-black/80"
        onClick={(e) => {
          e.stopPropagation();
          onInspect(card);
        }}
        title="Inspect & Zoom photo"
      >
        <Eye size={12} />
      </button>

      {/* Card Content & Polaroid Framing */}
      <div
        className="w-full h-full flex flex-col cursor-pointer"
        onClick={() => onInspect(card)}
      >
        {hasPhoto ? (
          <div className="vb-card-img-wrap relative flex-1 overflow-hidden rounded-t-lg">
            <img
              src={card.file_url}
              alt={card.file_name ?? card.title ?? "vision photo"}
              className="vb-card-img w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="vb-card-img-overlay bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 flex flex-col justify-end">
              <span className="vb-card-title text-white font-medium text-sm flex items-center gap-1">
                <span>{card.emoji}</span> {card.title}
              </span>
              <span className="text-[10px] text-amber-200/90 font-serif italic truncate">
                {card.card_type
                  ? `Vision: ${card.card_type}`
                  : "Added to manifest vision"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <span className="vb-card-emoji text-3xl mb-2">{card.emoji}</span>
            <span className="vb-card-title font-semibold text-sm leading-tight text-foreground">
              {card.title}
            </span>
            <span className="text-[11px] text-muted-foreground font-serif italic mt-1">
              {card.card_type
                ? `Focus: ${card.card_type}`
                : "Core Manifestation Goal"}
            </span>
          </div>
        )}
      </div>

      {/* Upload replace button */}
      <button
        className="vb-card-upload-replace z-20"
        onClick={(e) => {
          e.stopPropagation();
          fileRef.current?.click();
        }}
        disabled={uploading}
        title="Upload custom photo or file"
      >
        <Upload size={12} />
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf,.json,.txt,.md"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </motion.div>
  );
}

// ── Vision Collage Component ───────────────────────────────────────────────────

interface VisionCollageProps {
  cards: VisionCard[];
  onAdd: (payload: {
    title: string;
    emoji: string;
    colorAccent: VisionCard["color_accent"];
    cardType?: VisionCard["card_type"];
  }) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onUpload: (cardId: string, file: File) => Promise<any>;
}

export function VisionCollage({
  cards,
  onAdd,
  onDelete,
  onUpload,
}: VisionCollageProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<"unsplash" | "emoji">("unsplash");
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [color, setColor] = useState<VisionCard["color_accent"]>("terracotta");
  const [saving, setSaving] = useState(false);

  // Unsplash states
  const [unsplashQuery, setUnsplashQuery] = useState("inspiration");
  const [unsplashPhotos, setUnsplashPhotos] = useState<
    Array<{ id: string; url: string; thumb: string; alt: string }>
  >([]);
  const [selectedUnsplashUrl, setSelectedUnsplashUrl] = useState<string | null>(
    null,
  );
  const [searchingUnsplash, setSearchingUnsplash] = useState(false);

  // Zoom Lightbox states
  const [zoomCard, setZoomCard] = useState<VisionCard | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  // Slideshow states
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const handleSearchUnsplash = async (queryOverride?: string) => {
    const q = queryOverride || unsplashQuery || "inspiration";
    setSearchingUnsplash(true);
    try {
      const res = await visionBoardApi.searchUnsplash(q);
      const photos =
        (res as any)?.data?.data ||
        (Array.isArray((res as any)?.data) ? (res as any).data : []);
      if (Array.isArray(photos) && photos.length > 0) {
        setUnsplashPhotos(photos);
        if (!selectedUnsplashUrl) {
          setSelectedUnsplashUrl(photos[0].url);
        }
      }
    } catch (err: any) {
      console.warn("Unsplash search error:", err);
    } finally {
      setSearchingUnsplash(false);
    }
  };

  useEffect(() => {
    if (showForm && mode === "unsplash" && unsplashPhotos.length === 0) {
      handleSearchUnsplash("inspiration");
    }
  }, [showForm, mode]);

  // Slideshow auto-advance timer
  useEffect(() => {
    let timer: any;
    if (isSlideshowOpen && isPlaying && cards.length > 0) {
      timer = setInterval(() => {
        setSlideshowIndex((prev) => (prev + 1) % cards.length);
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isSlideshowOpen, isPlaying, cards.length]);

  // Keyboard navigation for slideshow & lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSlideshowOpen) {
        if (e.key === "ArrowRight")
          setSlideshowIndex((prev) => (prev + 1) % cards.length);
        if (e.key === "ArrowLeft")
          setSlideshowIndex((prev) => (prev - 1 + cards.length) % cards.length);
        if (e.key === " ") {
          e.preventDefault();
          setIsPlaying((prev) => !prev);
        }
        if (e.key === "Escape") setIsSlideshowOpen(false);
      } else if (zoomCard) {
        if (e.key === "Escape") setZoomCard(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSlideshowOpen, zoomCard, cards.length]);

  async function handleAdd() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const createdCard = await onAdd({
        title: title.trim(),
        emoji: mode === "emoji" ? emoji : "📷",
        colorAccent: color,
        cardType: "custom",
      });

      if (mode === "unsplash" && selectedUnsplashUrl && createdCard?.id) {
        try {
          const imgBlob = await fetch(selectedUnsplashUrl).then((r) =>
            r.blob(),
          );
          const file = new (window as any).File(
            [imgBlob],
            `unsplash_${Date.now()}.jpg`,
            { type: "image/jpeg" },
          ) as File;
          await onUpload(createdCard.id, file);
        } catch (imgErr) {
          console.warn("Error attaching Unsplash image:", imgErr);
        }
      }

      setTitle("");
      setEmoji("✨");
      setColor("terracotta");
      setSelectedUnsplashUrl(null);
      setShowForm(false);
    } catch (e: any) {
      toast({
        title: "Error creating vision card",
        description: e?.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const useTemplate = (tpl: (typeof CARD_TEMPLATES)[number]) => {
    onAdd(tpl);
  };

  return (
    <div className="vb-section vb-collage-section relative">
      {/* Section Header with Slideshow & Add buttons */}
      <div className="vb-section-header flex items-center justify-between mb-4">
        <div className="vb-section-label">
          <span>📌</span>
          <span>Notice Board & Vision Collage</span>
        </div>

        <div className="flex items-center gap-2">
          {cards.length > 0 && (
            <button
              onClick={() => {
                setSlideshowIndex(0);
                setIsPlaying(true);
                setIsSlideshowOpen(true);
              }}
              className="vb-chip-add text-xs flex items-center gap-1.5 bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-500/25"
              title="Play fullscreen vision slideshow"
            >
              <Play size={12} /> Play Slideshow
            </button>
          )}
          {cards.length < 12 && (
            <button
              onClick={() => setShowForm(true)}
              className="vb-chip-add text-xs flex items-center gap-1"
            >
              <Plus size={12} /> Add Vision
            </button>
          )}
        </div>
      </div>

      {/* Default Inline Slideshow Banner */}
      {cards.length > 0 && (
        <div className="relative mb-5 overflow-hidden rounded-2xl border border-amber-500/30 bg-black/60 shadow-xl group">
          <div className="relative h-48 md:h-56 w-full flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={cards[slideshowIndex]?.id || slideshowIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={() => {
                  if (cards[slideshowIndex]) {
                    setZoomCard(cards[slideshowIndex]);
                    setZoomScale(1);
                  }
                }}
              >
                {cards[slideshowIndex]?.file_url ? (
                  <img
                    src={cards[slideshowIndex].file_url}
                    alt={cards[slideshowIndex]?.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-opacity"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <span className="text-5xl mb-2">
                      {cards[slideshowIndex]?.emoji}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-end">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 font-mono mb-1 inline-block">
                        Slide {slideshowIndex + 1} of {cards.length}
                      </span>
                      <h3 className="text-lg font-serif font-bold text-white flex items-center gap-1.5">
                        <span>{cards[slideshowIndex]?.emoji}</span>{" "}
                        {cards[slideshowIndex]?.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSlideshowOpen(true);
                      }}
                      className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors"
                      title="Fullscreen Slideshow"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Prev / Next Banner Buttons */}
            <button
              type="button"
              onClick={() =>
                setSlideshowIndex(
                  (prev) => (prev - 1 + cards.length) % cards.length,
                )
              }
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() =>
                setSlideshowIndex((prev) => (prev + 1) % cards.length)
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/10 h-1">
            <motion.div
              className="bg-amber-400 h-full"
              animate={{
                width: `${((slideshowIndex + 1) / cards.length) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Notice Board Cards Grid */}
      <div className="vb-collage-grid">
        <AnimatePresence>
          {cards.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              onDelete={onDelete}
              onUpload={onUpload}
              onInspect={(c) => {
                setZoomCard(c);
                setZoomScale(1);
              }}
            />
          ))}

          {/* Add slot */}
          {cards.length < 12 && (
            <motion.button
              key="add-slot"
              className="vb-vision-card vb-card-add min-h-[160px]"
              onClick={() => setShowForm(true)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <Plus size={22} className="vb-add-icon" />
              <span className="vb-card-title">Add Vision</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Upload hint */}
      <p className="vb-area-hint" style={{ marginTop: 10 }}>
        Click any card to inspect & zoom. Drag cards to reorder on your notice
        board.
      </p>

      {/* Quick templates when empty */}
      {cards.length === 0 && (
        <div className="vb-templates">
          <p className="vb-templates-label">Quick start:</p>
          <div className="vb-templates-row">
            {CARD_TEMPLATES.map((t) => (
              <button
                key={t.title}
                className="vb-template-chip"
                onClick={() => useTemplate(t)}
              >
                {t.emoji} {t.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Zoom Lightbox Modal ── */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {zoomCard && (
              <motion.div
                className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setZoomCard(null)}
              >
                <motion.div
                  className="relative max-w-4xl w-full bg-card border border-amber-500/30 rounded-2xl p-6 shadow-2xl overflow-hidden"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Lightbox Header & Controls */}
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{zoomCard.emoji}</span>
                      <div>
                        <h3 className="font-serif font-bold text-lg text-foreground">
                          {zoomCard.title}
                        </h3>
                        <p className="text-xs text-muted-foreground italic">
                          {zoomCard.file_name
                            ? `File: ${zoomCard.file_name}`
                            : "Vision Board Card"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setZoomScale((s) => Math.min(3, s + 0.25))
                        }
                        className="p-1.5 rounded-lg bg-muted hover:bg-amber-500/20 text-foreground"
                        title="Zoom In"
                      >
                        <ZoomIn size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setZoomScale((s) => Math.max(0.5, s - 0.25))
                        }
                        className="p-1.5 rounded-lg bg-muted hover:bg-amber-500/20 text-foreground"
                        title="Zoom Out"
                      >
                        <ZoomOut size={16} />
                      </button>
                      <button
                        onClick={() => setZoomScale(1)}
                        className="p-1.5 rounded-lg bg-muted hover:bg-amber-500/20 text-foreground"
                        title="Reset Zoom"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        onClick={() => setZoomCard(null)}
                        className="p-1.5 rounded-lg bg-muted hover:bg-red-500/20 text-red-500"
                        title="Close (Esc)"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Lightbox Photo Preview */}
                  <div className="relative overflow-auto max-h-[70vh] flex items-center justify-center rounded-xl bg-black/40 p-4">
                    {zoomCard.file_url ? (
                      <motion.img
                        src={zoomCard.file_url}
                        alt={zoomCard.title}
                        className="max-h-[65vh] object-contain rounded-lg shadow-xl"
                        style={{
                          transform: `scale(${zoomScale})`,
                          transition: "transform 0.2s ease-out",
                        }}
                      />
                    ) : (
                      <div className="text-center py-16">
                        <span className="text-6xl mb-4 block">
                          {zoomCard.emoji}
                        </span>
                        <h4 className="text-xl font-bold font-serif text-foreground">
                          {zoomCard.title}
                        </h4>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* ── Fullscreen Slideshow Presentation Modal ── */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isSlideshowOpen && cards.length > 0 && (
              <motion.div
                className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-6 text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Top Toolbar */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow" />
                    <span className="font-serif font-bold text-base tracking-wide">
                      Vision Board Slideshow Presentation
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 font-mono">
                      {slideshowIndex + 1} / {cards.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying((p) => !p)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5"
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />}{" "}
                      {isPlaying ? "Pause" : "Play"}
                    </button>
                    <button
                      onClick={() => setIsSlideshowOpen(false)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Slide Viewer */}
                <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
                  <button
                    onClick={() =>
                      setSlideshowIndex(
                        (prev) => (prev - 1 + cards.length) % cards.length,
                      )
                    }
                    className="absolute left-4 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
                  >
                    <ChevronLeft size={24} />
                  </button>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={cards[slideshowIndex].id}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                      className="max-w-4xl w-full h-[70vh] flex flex-col items-center justify-center relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-6 backdrop-blur-lg"
                    >
                      {cards[slideshowIndex].file_url ? (
                        <img
                          src={cards[slideshowIndex].file_url}
                          alt={cards[slideshowIndex].title}
                          className="max-h-[55vh] w-auto object-contain rounded-xl shadow-2xl mb-4"
                        />
                      ) : (
                        <div className="text-7xl mb-6">
                          {cards[slideshowIndex].emoji}
                        </div>
                      )}

                      <div className="text-center">
                        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-white mb-1 flex items-center justify-center gap-2">
                          <span>{cards[slideshowIndex].emoji}</span>{" "}
                          {cards[slideshowIndex].title}
                        </h2>
                        <p className="text-sm text-amber-300/90 font-serif italic">
                          {cards[slideshowIndex].card_type
                            ? `Vision Category: ${cards[slideshowIndex].card_type}`
                            : "Core Manifestation Intention"}
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <button
                    onClick={() =>
                      setSlideshowIndex((prev) => (prev + 1) % cards.length)
                    }
                    className="absolute right-4 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>

                {/* Bottom Progress Bar */}
                <div className="w-full max-w-xl mx-auto bg-white/10 h-1 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-amber-400 h-full"
                    animate={{
                      width: `${((slideshowIndex + 1) / cards.length) * 100}%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* Add form modal */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showForm && (
              <motion.div
                className="vb-form-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowForm(false)}
              >
                <motion.div
                  className="vb-add-form !w-[480px] !max-w-[92vw] max-h-[85vh] overflow-y-auto"
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="vb-form-title flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-500" /> New
                      Vision Card
                    </h3>
                    <button
                      type="button"
                      className="vb-chip-x"
                      onClick={() => setShowForm(false)}
                    >
                      <X size={12} />
                    </button>
                  </div>

                  {/* Mode Tabs: Unsplash vs Emoji */}
                  <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                    <button
                      onClick={() => setMode("unsplash")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === "unsplash" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <ImageIcon size={14} /> Unsplash Photos
                    </button>
                    <button
                      onClick={() => setMode("emoji")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === "emoji" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Sparkles size={14} /> Emoji / Icon
                    </button>
                  </div>

                  {/* Title input */}
                  <input
                    type="text"
                    placeholder="Card Title (e.g. Paris Trip, Dream Office)..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="vb-form-input mb-4"
                    autoFocus
                  />

                  {/* Mode 1: Unsplash Picker */}
                  {mode === "unsplash" ? (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="relative flex-1 flex items-center">
                          <Search
                            size={14}
                            className="absolute left-3 text-amber-600/80 pointer-events-none z-10"
                          />
                          <input
                            type="text"
                            placeholder="Search Unsplash (e.g. sunset, workspace)..."
                            value={unsplashQuery}
                            onChange={(e) => setUnsplashQuery(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), handleSearchUnsplash())
                            }
                            className="vb-form-input !mb-0 text-xs !pl-9 w-full"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSearchUnsplash()}
                          className="vb-btn-ghost text-xs"
                        >
                          Search
                        </button>
                      </div>

                      {/* Quick Term Pills */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {QUICK_UNSPLASH_TERMS.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => {
                              setUnsplashQuery(term);
                              handleSearchUnsplash(term);
                            }}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-muted hover:bg-amber-500/15 hover:text-amber-700 transition-colors"
                          >
                            {term}
                          </button>
                        ))}
                      </div>

                      {/* Unsplash Thumbnails Grid */}
                      {searchingUnsplash ? (
                        <div className="text-center py-6 text-xs text-muted-foreground">
                          Searching Unsplash...
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-[180px] overflow-y-auto pr-1">
                          {unsplashPhotos.map((img) => (
                            <div
                              key={img.id}
                              className={`relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${selectedUnsplashUrl === img.url ? "border-amber-500 scale-95 shadow-md" : "border-transparent opacity-80 hover:opacity-100"}`}
                              onClick={() => setSelectedUnsplashUrl(img.url)}
                            >
                              <img
                                src={img.thumb}
                                alt={img.alt}
                                className="w-full h-full object-cover"
                              />
                              {selectedUnsplashUrl === img.url && (
                                <div className="absolute top-1 right-1 bg-amber-500 text-white rounded-full p-0.5">
                                  <Check size={10} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Mode 2: Emoji Picker */
                    <div className="vb-emoji-grid mb-4">
                      {EMOJI_OPTIONS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          className={`vb-emoji-btn ${emoji === em ? "vb-emoji-selected" : ""}`}
                          onClick={() => setEmoji(em)}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Color dots */}
                  <div className="vb-color-row mb-4">
                    {(
                      ["terracotta", "sage", "taupe", "ink", "blush"] as const
                    ).map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`vb-color-dot vb-dot-${c} ${color === c ? "vb-dot-selected" : ""}`}
                        onClick={() => setColor(c)}
                      />
                    ))}
                  </div>

                  {/* Form actions */}
                  <div className="vb-form-actions">
                    <button
                      type="button"
                      className="vb-btn-ghost"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="vb-btn-primary"
                      onClick={handleAdd}
                      disabled={saving || !title.trim()}
                    >
                      {saving ? "Saving…" : "Create Vision"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
