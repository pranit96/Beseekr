// src/pages/notebooks/components/NotebookCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Notebook list card — shows title, status, source type, and date.
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, FileText, Link as LinkIcon, Code, Loader2, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Notebook {
  id: string;
  title: string;
  description?: string;
  source_type: string;
  tags: string[];
  status: "draft" | "processing" | "ready" | "error";
  created_at: string;
  updated_at: string;
}

interface Props {
  notebook: Notebook;
  onDelete: (id: string) => void;
  index?: number;
}

const SOURCE_ICON: Record<string, React.ReactNode> = {
  text: <FileText className="h-4 w-4" />,
  url: <LinkIcon className="h-4 w-4" />,
  json: <Code className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  word: <FileText className="h-4 w-4" />,
  image: <FileText className="h-4 w-4" />,
};

const STATUS_CONFIG = {
  draft: { icon: <BookOpen className="h-3.5 w-3.5" />, label: "Draft", class: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800" },
  processing: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, label: "Generating...", class: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/40" },
  ready: { icon: <CheckCircle className="h-3.5 w-3.5" />, label: "Ready", class: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/40" },
  error: { icon: <AlertCircle className="h-3.5 w-3.5" />, label: "Error", class: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/40" },
};

const GRADIENT_CLASSES = [
  "from-indigo-500/10 to-purple-500/10",
  "from-blue-500/10 to-cyan-500/10",
  "from-violet-500/10 to-pink-500/10",
  "from-emerald-500/10 to-teal-500/10",
  "from-amber-500/10 to-orange-500/10",
];

export function NotebookCard({ notebook, onDelete, index = 0 }: Props) {
  const status = STATUS_CONFIG[notebook.status] || STATUS_CONFIG.draft;
  const gradient = GRADIENT_CLASSES[index % GRADIENT_CLASSES.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative"
    >
      <Link to={`/notebooks/${notebook.id}`} className="block">
        <div className={cn(
          "rounded-2xl border bg-gradient-to-br p-5 hover:shadow-md transition-all duration-200 cursor-pointer",
          "hover:border-indigo-300 dark:hover:border-indigo-700",
          gradient,
        )}>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                {SOURCE_ICON[notebook.source_type] || <BookOpen className="h-4 w-4" />}
              </div>
              <h3 className="font-semibold truncate">{notebook.title}</h3>
            </div>
            <Badge className={cn("shrink-0 gap-1 text-xs", status.class)}>
              {status.icon}
              {status.label}
            </Badge>
          </div>

          {/* Description */}
          {notebook.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{notebook.description}</p>
          )}

          {/* Tags */}
          {notebook.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {notebook.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-background/80 border text-xs text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notebook.updated_at), { addSuffix: true })}
            </p>
            <span className="text-xs text-muted-foreground capitalize">{notebook.source_type}</span>
          </div>
        </div>
      </Link>

      {/* Delete button (appears on hover) */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(notebook.id);
        }}
        className="absolute top-3 right-12 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </motion.div>
  );
}

