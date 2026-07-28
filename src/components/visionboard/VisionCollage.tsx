/**
 * VisionCollage.tsx — Vision card grid with file upload
 *
 * Supports:
 *  - Emoji-only cards (instant creation)
 *  - File attachment per card: image (shown as bg), PDF, JSON, text, .md
 *  - Drop zone or click-to-upload after card creation
 *  - File type badge + name display
 *  - Quick templates for empty state
 */

import { useState, useRef } from "react";
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
} from "lucide-react";
import type { VisionCard } from "@/api/visionboard";

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
];

const ACCEPTED_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf,application/json,text/plain,text/markdown,.md,.json,.txt";

function FileTypeIcon({ type }: { type: string | null }) {
  if (!type) return null;
  if (type === "image") return <FileImage size={13} />;
  if (type === "pdf") return <FileText size={13} />;
  if (type === "json") return <FileJson size={13} />;
  return <File size={13} />;
}

function CardFilePreview({ card }: { card: VisionCard }) {
  if (!card.file_url) return null;

  if (card.file_type === "image") {
    return (
      <div className="vb-card-img-wrap">
        <img
          src={card.file_url}
          alt={card.file_name ?? "attachment"}
          className="vb-card-img"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <a
      href={card.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="vb-card-file-badge"
      onClick={(e) => e.stopPropagation()}
    >
      <FileTypeIcon type={card.file_type} />
      <span className="vb-card-file-name" title={card.file_name ?? ""}>
        {card.file_name ?? card.file_type}
      </span>
    </a>
  );
}

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

      {/* Image as background preview */}
      {card.file_type === "image" && card.file_url ? (
        <div className="vb-card-img-wrap">
          <img
            src={card.file_url}
            alt={card.file_name ?? "image"}
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

      {/* Non-image file badge */}
      {card.file_type && card.file_type !== "image" && (
        <a
          href={card.file_url!}
          target="_blank"
          rel="noopener noreferrer"
          className="vb-card-file-badge"
          onClick={(e) => e.stopPropagation()}
        >
          <FileTypeIcon type={card.file_type} />
          <span className="vb-card-file-name" title={card.file_name ?? ""}>
            {card.file_name ?? card.file_type}
          </span>
        </a>
      )}

      {/* Upload button (shows if no file yet, or as overlay) */}
      <button
        className={`vb-card-upload-btn ${card.file_url ? "vb-card-upload-replace" : ""}`}
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title={card.file_url ? "Replace file" : "Upload image / PDF / text"}
      >
        {uploading ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            ✦
          </motion.span>
        ) : (
          <Upload size={11} />
        )}
        {!card.file_url && <span>{uploading ? "Uploading…" : "Upload"}</span>}
      </button>

      {/* Drag hint */}
      {dragging && <div className="vb-card-drop-hint">Drop to attach</div>}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_TYPES}
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

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
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [color, setColor] = useState<VisionCard["color_accent"]>("terracotta");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!title.trim()) return;
    setSaving(true);
    await onAdd({
      title: title.trim(),
      emoji,
      colorAccent: color,
      cardType: "custom",
    });
    setTitle("");
    setEmoji("✨");
    setColor("terracotta");
    setShowForm(false);
    setSaving(false);
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
        <span>Your Vision</span>
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
          {cards.length < 8 && (
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
        Drop or upload images, PDFs, JSON, text, .md on any card
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
              className="vb-add-form"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="vb-form-title">New Vision Card</h3>
              <p className="vb-form-hint">
                You can upload a file after creating the card.
              </p>

              {/* Emoji picker */}
              <div className="vb-emoji-grid">
                {EMOJI_OPTIONS.map((em) => (
                  <button
                    key={em}
                    className={`vb-emoji-btn ${emoji === em ? "vb-emoji-selected" : ""}`}
                    onClick={() => setEmoji(em)}
                  >
                    {em}
                  </button>
                ))}
              </div>

              <input
                className="vb-form-input"
                placeholder="e.g. Dream Apartment, Europe Trip…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                autoFocus
              />

              <div className="vb-color-row">
                {(["terracotta", "sage", "taupe", "ink", "blush"] as const).map(
                  (c) => (
                    <button
                      key={c}
                      className={`vb-color-dot vb-dot-${c} ${color === c ? "vb-dot-selected" : ""}`}
                      onClick={() => setColor(c)}
                      aria-label={c}
                    />
                  ),
                )}
              </div>

              <div className="vb-form-actions">
                <button
                  className="vb-btn-ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  className="vb-btn-primary"
                  onClick={handleAdd}
                  disabled={saving || !title.trim()}
                >
                  {saving ? "Creating…" : "Create Card"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
