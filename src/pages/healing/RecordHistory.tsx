// src/pages/healing/RecordHistory.tsx
// Searchable / filterable list of past thought records with export support

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  ChevronRight,
  Loader2,
  FileText,
} from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import healingApi from "@/api/healing";
import type { ThoughtRecord, RecordStatus, EmotionLabel } from "@/api/healing";

const STATUS_LABELS: Record<RecordStatus, string> = {
  draft: "Draft",
  completed: "Completed",
};
const STATUS_COLORS: Record<RecordStatus, string> = {
  draft:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

const EMOTION_OPTIONS: EmotionLabel[] = [
  "anxious",
  "afraid",
  "ashamed",
  "angry",
  "sad",
  "hopeless",
  "other",
];

function RecordCard({
  record,
  onOpen,
  onExport,
}: {
  record: ThoughtRecord;
  onOpen: () => void;
  onExport: (format: "json" | "pdf") => void;
}) {
  const { t } = useTranslation();
  const topEmotions = (record.emotions ?? []).slice(0, 2);
  const topTraps = record.traps.slice(0, 2);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm overflow-hidden shadow-sm">
      <button
        type="button"
        className="w-full text-left p-4 hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onOpen}
        aria-label={t(
          "healing.history.open_record",
          `Open record from ${format(new Date(record.created_at), "MMM d")}`,
          { date: format(new Date(record.created_at), "MMM d") },
        )}
      >
        <div className="flex items-start gap-3">
          <FileText
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  STATUS_COLORS[record.status],
                )}
              >
                {t(
                  `healing.record.status.${record.status}`,
                  STATUS_LABELS[record.status],
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(record.created_at), "MMM d, yyyy")}
              </span>
            </div>

            {/* Situation snippet */}
            {record.situation && (
              <p className="text-sm font-medium text-foreground truncate">
                {record.situation}
              </p>
            )}

            {/* Thought snippet */}
            {record.thought && (
              <p className="text-xs text-muted-foreground italic truncate mt-0.5">
                "{record.thought}"
              </p>
            )}

            {/* Emotions */}
            {topEmotions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {topEmotions.map((e) => (
                  <span
                    key={e.emotion}
                    className="rounded-full bg-secondary/80 px-2 py-0.5 text-[10px] text-secondary-foreground"
                  >
                    {e.emotion} ({e.intensity_before}/10)
                  </span>
                ))}
                {record.belief_before != null && record.belief_after != null && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                    Belief: {record.belief_before}% &rarr; {record.belief_after}%
                  </span>
                )}
              </div>
            )}

            {/* Traps */}
            {topTraps.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {topTraps.map((trap) => (
                  <span
                    key={trap}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary font-medium"
                  >
                    {trap.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}
          </div>
          <ChevronRight
            className="mt-1 h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Export actions */}
      {record.status === "completed" && (
        <div className="border-t border-border/40 px-4 py-2 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground"
            onClick={() => onExport("json")}
            aria-label={t("healing.history.export_json", "Export as JSON")}
          >
            <Download className="h-3 w-3" />
            JSON
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground"
            onClick={() => onExport("pdf")}
            aria-label={t("healing.history.export_pdf", "Export as PDF")}
          >
            <Download className="h-3 w-3" />
            PDF
          </Button>
        </div>
      )}
    </div>
  );
}

export default function RecordHistory() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<RecordStatus | undefined>();
  const [emotion, setEmotion] = useState<EmotionLabel | undefined>();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["healing-records", { page, status, emotion, search }],
    queryFn: () =>
      healingApi.listRecords({
        page,
        limit: 10,
        status,
        emotion,
        q: search || undefined,
      }),
  });

  const records = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.limit)
    : 1;

  const handleExport = async (id: string, fmt: "json" | "pdf") => {
    try {
      const res = await healingApi.exportRecord(id, fmt);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `thought-record-${id.slice(0, 8)}.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* silent */
    }
  };

  const hasFilters = status !== undefined || emotion !== undefined;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-rose-500/20">
      <GlobalHeader />

      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Breadcrumb & Sub Navigation Bar */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/healing")}
              className="gap-2 text-muted-foreground hover:text-foreground -ml-2 h-9 px-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Healing</span>
            </Button>
            <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Healing / <strong className="text-foreground">My Records</strong>
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("healing.history.title", "Thought Records Archive")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Browse, review, and export all encrypted reflections
            </p>
          </div>

          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "gap-1.5 self-start sm:self-auto",
                  hasFilters && "border-primary text-primary",
                )}
                id="history-filter-btn"
              >
                <Filter className="h-3.5 w-3.5" />
                {t("healing.history.filter", "Filter")}
                {hasFilters && " •"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                {t("healing.history.filter_status", "Status")}
              </DropdownMenuLabel>
              {(["completed", "draft"] as RecordStatus[]).map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => {
                    setStatus(status === s ? undefined : s);
                    setPage(1);
                  }}
                  className={cn(status === s && "bg-accent")}
                >
                  {STATUS_LABELS[s]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>
                {t("healing.history.filter_emotion", "Emotion")}
              </DropdownMenuLabel>
              {EMOTION_OPTIONS.map((em) => (
                <DropdownMenuItem
                  key={em}
                  onClick={() => {
                    setEmotion(emotion === em ? undefined : em);
                    setPage(1);
                  }}
                  className={cn(emotion === em && "bg-accent")}
                >
                  {em}
                </DropdownMenuItem>
              ))}
              {hasFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setStatus(undefined);
                      setEmotion(undefined);
                      setPage(1);
                    }}
                    className="text-muted-foreground"
                  >
                    {t("healing.history.clear_filters", "Clear filters")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t(
              "healing.history.search_placeholder",
              "Search situation or thought...",
            )}
            className="pl-9 rounded-2xl bg-card/60 border-border/60"
            id="history-search-input"
            aria-label={t(
              "healing.history.search_placeholder",
              "Search situation or thought...",
            )}
          />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && records.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm">
              {hasFilters || search
                ? t("healing.history.no_matches", "No records match your filters.")
                : t("healing.history.empty", "No thought records saved yet.")}
            </p>
            {!hasFilters && !search && (
              <Button
                onClick={() => navigate("/healing/thought-record")}
                size="sm"
                className="mt-4"
              >
                Start First Session
              </Button>
            )}
          </div>
        )}

        {/* Records list */}
        <div className="space-y-3">
          {records.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              onOpen={() => navigate(`/healing/thought-record?id=${record.id}`)}
              onExport={(fmt) => handleExport(record.id, fmt)}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t("common.previous", "Previous")}
            </Button>
            <span className="text-sm text-muted-foreground self-center">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("common.next", "Next")}
            </Button>
          </div>
        )}
      </main>

      <GlobalFooter />
    </div>
  );
}
