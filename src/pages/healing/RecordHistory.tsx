// src/pages/healing/RecordHistory.tsx
// Searchable / filterable list of past thought records with export support

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, Filter, Download, ChevronRight, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import healingApi from "@/api/healing";
import type { ThoughtRecord, RecordStatus, EmotionLabel } from "@/api/healing";

const STATUS_LABELS: Record<RecordStatus, string> = { draft: "Draft", completed: "Completed" };
const STATUS_COLORS: Record<RecordStatus, string> = {
  draft: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

const EMOTION_OPTIONS: EmotionLabel[] = ["anxious", "afraid", "ashamed", "angry", "sad", "hopeless", "other"];

function RecordCard({ record, onOpen, onExport }: { record: ThoughtRecord; onOpen: () => void; onExport: (format: "json" | "pdf") => void }) {
  const { t } = useTranslation();
  const topEmotions = (record.emotions ?? []).slice(0, 2);
  const topTraps = record.traps.slice(0, 2);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        className="w-full text-left p-4 hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onOpen}
        aria-label={t("healing.history.open_record", { date: format(new Date(record.created_at), "MMM d") }, `Open record from ${format(new Date(record.created_at), "MMM d")}`)}
      >
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_COLORS[record.status])}>
                {t(`healing.record.status.${record.status}`, STATUS_LABELS[record.status])}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(record.created_at), "MMM d, yyyy")}
              </span>
            </div>

            {/* Situation preview */}
            {record.situation && (
              <p className="text-sm text-foreground line-clamp-2 mb-2">{record.situation}</p>
            )}

            {/* Emotion chips */}
            {topEmotions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {topEmotions.map((e) => (
                  <span key={e.emotion} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {e.emotion} {e.intensity_before}/10
                    {e.intensity_after != null ? ` → ${e.intensity_after}/10` : ""}
                  </span>
                ))}
                {(record.emotions?.length ?? 0) > 2 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    +{(record.emotions?.length ?? 0) - 2}
                  </span>
                )}
              </div>
            )}

            {/* Traps */}
            {topTraps.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {topTraps.map((trap) => (
                  <span key={trap} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary font-medium">
                    {trap.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}
          </div>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>
      </button>

      {/* Export actions */}
      {record.status === "completed" && (
        <div className="border-t border-border px-4 py-2 flex gap-2">
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
  const [status, setStatus] = useState<RecordStatus | undefined>();
  const [emotion, setEmotion] = useState<EmotionLabel | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["healing-records", status, emotion, page],
    queryFn: () => healingApi.listRecords({ status, emotion, page, limit: 20 }),
  });

  const records = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-10">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/healing")} aria-label={t("common.back", "Back")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-semibold text-foreground flex-1">
            {t("healing.history.title", "My Records")}
          </h1>

          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn("gap-1.5", hasFilters && "border-primary text-primary")}
                id="history-filter-btn"
              >
                <Filter className="h-3.5 w-3.5" />
                {t("healing.history.filter", "Filter")}
                {hasFilters && " •"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{t("healing.history.filter_status", "Status")}</DropdownMenuLabel>
              {(["completed", "draft"] as RecordStatus[]).map((s) => (
                <DropdownMenuItem key={s} onClick={() => { setStatus(status === s ? undefined : s); setPage(1); }}
                  className={cn(status === s && "bg-accent")}>
                  {STATUS_LABELS[s]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{t("healing.history.filter_emotion", "Emotion")}</DropdownMenuLabel>
              {EMOTION_OPTIONS.map((em) => (
                <DropdownMenuItem key={em} onClick={() => { setEmotion(emotion === em ? undefined : em); setPage(1); }}
                  className={cn(emotion === em && "bg-accent")}>
                  {em.charAt(0).toUpperCase() + em.slice(1)}
                </DropdownMenuItem>
              ))}
              {hasFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setStatus(undefined); setEmotion(undefined); setPage(1); }}
                    className="text-destructive">
                    {t("healing.history.clear_filters", "Clear filters")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* List */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && records.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">{t("healing.history.empty", "No records yet.")}</p>
            <Button className="mt-4 gap-2" onClick={() => navigate("/healing/thought-record")} id="history-start-btn">
              {t("healing.history.start_first", "Start your first thought record")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

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
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              {t("common.previous", "Previous")}
            </Button>
            <span className="text-sm text-muted-foreground self-center">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              {t("common.next", "Next")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
