import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { catApi } from "@/api/cat";
import { Revision } from "@/types/cat";
import { motion } from "framer-motion";
import {
  format,
  isToday,
  isPast,
  isFuture,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import {
  RotateCcw,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Revisions() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [completeDialog, setCompleteDialog] = useState<Revision | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: revisions, isLoading } = useQuery({
    queryKey: ["cat-revisions"],
    queryFn: () => catApi.getRevisions(),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      catApi.completeRevision(id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cat-revisions"] });
      toast({ title: "Revision completed!" });
      setCompleteDialog(null);
    },
  });

  const grouped = useMemo(() => {
    if (!revisions || !Array.isArray(revisions))
      return { overdue: [], today: [], upcoming: [], completed: [] };
    return {
      overdue: revisions.filter((r) => r.status === "overdue"),
      today: revisions.filter(
        (r) => r.status === "pending" && isToday(new Date(r.scheduled_date)),
      ),
      upcoming: revisions.filter(
        (r) => r.status === "pending" && isFuture(new Date(r.scheduled_date)),
      ),
      completed: revisions.filter((r) => r.status === "completed").slice(0, 10),
    };
  }, [revisions]);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const revisionsByDate = useMemo(() => {
    if (!revisions || !Array.isArray(revisions)) return {};
    const map: Record<string, Revision[]> = {};
    revisions.forEach((r) => {
      const key = format(new Date(r.scheduled_date), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [revisions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RotateCcw className="h-7 w-7 text-primary" />
            Revisions
          </h1>
          <p className="text-muted-foreground">Spaced repetition schedule</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            List
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("calendar")}
          >
            Calendar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={cn(grouped.overdue.length > 0 && "border-red-500/50")}>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-red-500">
              {grouped.overdue.length}
            </p>
            <p className="text-sm text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card className={cn(grouped.today.length > 0 && "border-amber-500/50")}>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-amber-500">
              {grouped.today.length}
            </p>
            <p className="text-sm text-muted-foreground">Due Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">
              {grouped.upcoming.length}
            </p>
            <p className="text-sm text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : view === "list" ? (
        <div className="space-y-6">
          {grouped.overdue.length > 0 && (
            <RevisionGroup
              title="Overdue"
              icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
              revisions={grouped.overdue}
              onComplete={setCompleteDialog}
              variant="destructive"
            />
          )}
          {grouped.today.length > 0 && (
            <RevisionGroup
              title="Due Today"
              icon={<Clock className="h-5 w-5 text-amber-500" />}
              revisions={grouped.today}
              onComplete={setCompleteDialog}
            />
          )}
          <RevisionGroup
            title="Upcoming"
            icon={<Calendar className="h-5 w-5 text-primary" />}
            revisions={grouped.upcoming}
            onComplete={setCompleteDialog}
            emptyMessage="No upcoming revisions"
          />
          {grouped.completed.length > 0 && (
            <RevisionGroup
              title="Recently Completed"
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              revisions={grouped.completed}
              onComplete={() => {}}
            />
          )}
        </div>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentMonth(
                    (d) => new Date(d.getFullYear(), d.getMonth() - 1),
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentMonth(
                    (d) => new Date(d.getFullYear(), d.getMonth() + 1),
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-2 font-medium text-muted-foreground">
                  {d}
                </div>
              ))}
              {calendarDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayRevisions = revisionsByDate[key] || [];
                const hasOverdue = dayRevisions.some(
                  (r) => r.status === "overdue",
                );
                const hasPending = dayRevisions.some(
                  (r) => r.status === "pending",
                );
                return (
                  <div
                    key={key}
                    className={cn(
                      "p-2 min-h-[60px] border rounded-lg",
                      isToday(day) && "bg-primary/5 border-primary",
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm",
                        isToday(day) && "font-bold text-primary",
                      )}
                    >
                      {format(day, "d")}
                    </p>
                    {dayRevisions.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {dayRevisions.slice(0, 3).map((r) => (
                          <div
                            key={r.id}
                            className={cn(
                              "w-2 h-2 rounded-full",
                              r.status === "overdue"
                                ? "bg-red-500"
                                : r.status === "completed"
                                  ? "bg-emerald-500"
                                  : "bg-amber-500",
                            )}
                          />
                        ))}
                        {dayRevisions.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{dayRevisions.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <CompleteRevisionDialog
        open={!!completeDialog}
        revision={completeDialog}
        onOpenChange={(o) => !o && setCompleteDialog(null)}
        onComplete={(notes) =>
          completeDialog &&
          completeMutation.mutate({ id: completeDialog.id, notes })
        }
        isLoading={completeMutation.isPending}
      />
    </div>
  );
}

function RevisionGroup({
  title,
  icon,
  revisions,
  onComplete,
  variant,
  emptyMessage,
}: {
  title: string;
  icon: React.ReactNode;
  revisions: Revision[];
  onComplete: (r: Revision) => void;
  variant?: "destructive";
  emptyMessage?: string;
}) {
  if (revisions.length === 0 && !emptyMessage) return null;
  return (
    <Card className={cn(variant === "destructive" && "border-red-500/50")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
          <Badge variant="secondary" className="ml-2">
            {revisions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {revisions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-2">
            {revisions.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div>
                  <p className="font-medium">{r.topic?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Revision #{r.revision_number} •{" "}
                    {format(new Date(r.scheduled_date), "MMM d")}
                  </p>
                </div>
                {r.status !== "completed" && (
                  <Button size="sm" onClick={() => onComplete(r)}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Complete
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CompleteRevisionDialog({
  open,
  revision,
  onOpenChange,
  onComplete,
  isLoading,
}: {
  open: boolean;
  revision: Revision | null;
  onOpenChange: (o: boolean) => void;
  onComplete: (notes?: string) => void;
  isLoading: boolean;
}) {
  const [notes, setNotes] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Revision</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p>
            Mark <strong>{revision?.topic?.title}</strong> as revised?
          </p>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onComplete(notes)} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
