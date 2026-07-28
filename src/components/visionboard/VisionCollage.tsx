/**
 * VisionCollage.tsx — Vision card grid with Unsplash photo search & file upload
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Sparkles,
  Upload,
  FileText,
  FileJson,
  FileImage,
  File,
  Image as ImageIcon,
  Search,
  Check,
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
  "✨", "🌙", "💪", "🎯", "💼", "🏡", "🌿", "📚",
  "🎨", "🚀", "❤️", "💰", "🌸", "⭐", "🦋", "🧘",
];

const QUICK_UNSPLASH_TERMS = [
  "Minimal", "Mountains", "Workspace", "Sunset", "Mindfulness", "Travel", "Architecture"
];

// ── Single Vision Card ─────────────────────────────────────────────────────────

interface CardTileProps {
  card: VisionCard;
  onDelete: (id: string) => void;
  onUpload: (id: string, file: File) => Promise<void>;
}

function CardTile({ card, onDelete, onUpload }: CardTileProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    setUploading(true);
    await onUpload(card.id, file);
    setUploading(false);
  }

  return (
    <motion.div
      className={`vb-vision-card ${ACCENT_CLASSES[card.color_accent] ?? "vb-card-terracotta"} ${dragging ? "vb-card-drag-over" : ""}`}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ scale: 1.03, rotate: 0.4 }}
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
      {/* Delete */}
      <button
        className="vb-card-delete"
        onClick={() => onDelete(card.id)}
        aria-label="Remove card"
      >
        <X size={11} />
      </button>

      {/* Image preview (either uploaded file or selected Unsplash photo) */}
      {(card.file_type === "image" || card.file_url?.includes("unsplash")) && card.file_url ? (
        <div className="vb-card-img-wrap">
          <img
            src={card.file_url}
            alt={card.file_name ?? card.title ?? "vision photo"}
            className="vb-card-img"
            loading="lazy"
            decoding="async"
          />
          <div className="vb-card-img-overlay">
            <span className="vb-card-title">{card.title}</span>
          </div>
        </div>
      ) : (
        <>
          <span className="vb-card-emoji">{card.emoji}</span>
          <span className="vb-card-title">{card.title}</span>
        </>
      )}

      {/* Upload hover action */}
      <button
        className="vb-card-upload-replace"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title="Upload custom image/file"
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
    cardType: VisionCard["card_type"];
  }) => Promise<VisionCard | any>;
  onDelete: (cardId: string) => Promise<any>;
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
  const [mode, setMode] = useState<"emoji" | "unsplash">("unsplash");
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [color, setColor] = useState<VisionCard["color_accent"]>("terracotta");
  const [saving, setSaving] = useState(false);

  // Unsplash search state
  const [unsplashQuery, setUnsplashQuery] = useState("inspiration");
  const [unsplashPhotos, setUnsplashPhotos] = useState<Array<{ id: string; url: string; thumb: string; alt: string }>>([]);
  const [selectedUnsplashUrl, setSelectedUnsplashUrl] = useState<string | null>(null);
  const [searchingUnsplash, setSearchingUnsplash] = useState(false);

  // Fetch Unsplash photos
  const handleSearchUnsplash = async (term?: string) => {
    const q = term || unsplashQuery || "nature";
    setSearchingUnsplash(true);
    try {
      const res = await visionBoardApi.searchUnsplash(q);
      const photos = (res as any)?.data?.data || (Array.isArray((res as any)?.data) ? (res as any).data : []);
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

      // If an Unsplash photo was selected, attach it as an image to the newly created card!
      if (mode === "unsplash" && selectedUnsplashUrl && createdCard?.id) {
        try {
          // Convert Unsplash image URL to a File object or attach url via helper
          const imgBlob = await fetch(selectedUnsplashUrl).then((r) => r.blob());
          const file = new (window as any).File([imgBlob], `unsplash_${Date.now()}.jpg`, { type: "image/jpeg" }) as File;

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

  async function useTemplate(t: (typeof CARD_TEMPLATES)[number]) {
    await onAdd({
      title: t.title,
      emoji: t.emoji,
      colorAccent: t.colorAccent,
      cardType: t.cardType,
    });
  }

  return (
    <div className="vb-section vb-collage">
      <div className="vb-section-label">
        <Sparkles size={13} />
        <span>Your Vision Collage & Photos</span>
      </div>

      <div className="vb-collage-grid">
        <AnimatePresence>
          {cards.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              onDelete={onDelete}
              onUpload={onUpload}
            />
          ))}

          {/* Add slot */}
          {cards.length < 12 && (
            <motion.button
              key="add-slot"
              className="vb-vision-card vb-card-add"
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
        Pick photos from Unsplash, or drop custom files (JPG, PNG, PDF, JSON, MD)
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

      {/* Add form modal */}
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
              className="vb-add-form !w-[480px]"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="vb-form-title text-lg font-semibold m-0">New Vision Card</h3>
                <button className="vb-chip-x" onClick={() => setShowForm(false)}>
                  <X size={16} />
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
                      <Search size={14} className="absolute left-3 text-amber-600/80 pointer-events-none z-10" />
                      <input
                        type="text"
                        placeholder="Search Unsplash (e.g. sunset, workspace)..."
                        value={unsplashQuery}
                        onChange={(e) => setUnsplashQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearchUnsplash())}
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
                    <div className="text-center py-6 text-xs text-muted-foreground">Searching Unsplash...</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-[180px] overflow-y-auto pr-1">
                      {unsplashPhotos.map((img) => (
                        <div
                          key={img.id}
                          className={`relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${selectedUnsplashUrl === img.url ? "border-amber-500 scale-95 shadow-md" : "border-transparent opacity-80 hover:opacity-100"}`}
                          onClick={() => setSelectedUnsplashUrl(img.url)}
                        >
                          <img src={img.thumb} alt={img.alt} className="w-full h-full object-cover" />
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
                {(["terracotta", "sage", "taupe", "ink", "blush"] as const).map(
                  (c) => (
                    <button
                      key={c}
                      type="button"
                      className={`vb-color-dot vb-dot-${c} ${color === c ? "vb-dot-selected" : ""}`}
                      onClick={() => setColor(c)}
                    />
                  ),
                )}
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
                  {saving ? "Creating..." : "Add to Collage"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
