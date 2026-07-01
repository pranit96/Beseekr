import React, { memo, useState } from "react";
import { type NodeProps } from "@xyflow/react";
import { StickyNote, Edit2, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface NoteNodeData {
  label?: string; // used for title
  onLabelChange?: (val: string) => void;
  noteText?: string;
  onNoteTextChange?: (val: string) => void;
  noteColor?: string; // "yellow" | "blue" | "green" | "pink"
  onNoteColorChange?: (val: string) => void;
  [key: string]: unknown;
}

const COLORS = [
  {
    id: "yellow",
    bg: "bg-amber-500/10 hover:border-amber-500/50",
    border: "border-amber-500/40",
    text: "text-amber-300",
    badge: "bg-amber-500",
    label: "Yellow",
  },
  {
    id: "blue",
    bg: "bg-cyan-500/10 hover:border-cyan-500/50",
    border: "border-cyan-500/40",
    text: "text-cyan-300",
    badge: "bg-cyan-500",
    label: "Blue",
  },
  {
    id: "green",
    bg: "bg-emerald-500/10 hover:border-emerald-500/50",
    border: "border-emerald-500/40",
    text: "text-emerald-300",
    badge: "bg-emerald-500",
    label: "Green",
  },
  {
    id: "pink",
    bg: "bg-rose-500/10 hover:border-rose-500/50",
    border: "border-rose-500/40",
    text: "text-rose-300",
    badge: "bg-rose-500",
    label: "Pink",
  },
];

const NoteNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as NoteNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const colorId = d.noteColor || "yellow";
  const colorConfig = COLORS.find((c) => c.id === colorId) || COLORS[0];

  const noteText = d.noteText || "Double-click to edit this note...";
  const title = d.label || "Sticky Note";

  return (
    <div
      className={`group relative min-w-[280px] max-w-[340px] rounded-2xl border transition-all duration-300 ${
        selected
          ? `ring-2 ring-primary/40 ${colorConfig.border}`
          : `border-border/30`
      } ${colorConfig.bg} backdrop-blur-xl`}
      onDoubleClick={() => setIsEditing(true)}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border/10">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colorConfig.badge}`}
        >
          <StickyNote className="w-3.5 h-3.5 text-black" />
        </div>
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <input
              type="text"
              value={d.label || ""}
              onChange={(e) => d.onLabelChange?.(e.target.value)}
              placeholder="Sticky Note Title"
              className="w-full bg-background/50 border border-border/20 rounded px-1.5 py-0.5 text-xs text-foreground outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p className={`text-xs font-bold text-foreground truncate`}>
              {title}
            </p>
          )}
        </div>

        {/* Edit / Check Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(!isEditing);
          }}
          className="p-1 rounded-lg bg-background/25 hover:bg-background/40 transition-colors text-foreground"
        >
          {isEditing ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <Edit2 className="w-3 h-3 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Body / Content */}
      <div className="px-4 py-3 flex flex-col gap-2.5">
        {isEditing ? (
          <textarea
            value={d.noteText || ""}
            onChange={(e) => d.onNoteTextChange?.(e.target.value)}
            placeholder="Type notes here (supports markdown)..."
            rows={5}
            className="w-full bg-background/40 border border-border/20 rounded-lg px-2.5 py-2 text-[10px] text-foreground placeholder-muted-foreground/45 outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all font-mono resize-y"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="prose prose-invert max-w-none text-[10px] text-foreground/80 min-h-[60px] leading-relaxed break-words">
            <ReactMarkdown>{noteText}</ReactMarkdown>
          </div>
        )}

        {/* Color presets (only visible when editing) */}
        {isEditing && (
          <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-border/10">
            <span className="text-[8px] font-bold text-muted-foreground/60 uppercase mr-1">
              Color:
            </span>
            {COLORS.map((c) => (
              <button
                key={c.id}
                onClick={(e) => {
                  e.stopPropagation();
                  d.onNoteColorChange?.(c.id);
                }}
                className={`w-4.5 h-4.5 rounded-full border transition-transform ${
                  colorId === c.id
                    ? "scale-110 border-white"
                    : "border-transparent"
                } ${c.badge}`}
                title={c.label}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(NoteNode);
