import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { catApi } from "@/api/cat";
import { Mistake, MistakeType } from "@/types/cat";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  AlertCircle,
  Search,
  Filter,
  MessageSquare,
  Loader2,
  CheckCircle2,
  Brain,
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const mistakeTypes: Record<MistakeType, { label: string; color: string }> = {
  concept: { label: "Concept Gap", color: "bg-red-500" },
  calculation: { label: "Calculation Error", color: "bg-amber-500" },
  silly_error: { label: "Silly Mistake", color: "bg-yellow-500" },
  time_pressure: { label: "Time Pressure", color: "bg-blue-500" },
  misread: { label: "Misread Question", color: "bg-purple-500" },
};

export default function Mistakes() {
  const [typeFilter, setTypeFilter] = useState<MistakeType | "all">("all");
  const [reviewedFilter, setReviewedFilter] = useState<
    "all" | "reviewed" | "unreviewed"
  >("all");
  const [reviewDialog, setReviewDialog] = useState<Mistake | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: mistakes, isLoading } = useQuery({
    queryKey: ["cat-mistakes", typeFilter, reviewedFilter],
    queryFn: () =>
      catApi.getMistakes({
        type: typeFilter !== "all" ? typeFilter : undefined,
        reviewed:
          reviewedFilter === "all" ? undefined : reviewedFilter === "reviewed",
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ["cat-mistakes-stats"],
    queryFn: () => catApi.getMistakeStats(),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      catApi.reviewMistake(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cat-mistakes"] });
      toast({ title: "Mistake reviewed" });
      setReviewDialog(null);
    },
  });

  const categorizeMutation = useMutation({
    mutationFn: (id: string) => catApi.categorizeMistake(id),
    onSuccess: (data) =>
      toast({ title: `Categorized as: ${mistakeTypes[data.type].label}` }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertCircle className="h-7 w-7 text-primary" />
            Mistake Journal
          </h1>
          <p className="text-muted-foreground">Learn from your errors</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Mistakes</p>
            </CardContent>
          </Card>
          <Card className={cn(stats.unreviewed > 0 && "border-amber-500/50")}>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-amber-500">
                {stats.unreviewed}
              </p>
              <p className="text-sm text-muted-foreground">Unreviewed</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-3">By Type</p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(stats.by_type) &&
                  stats.by_type.map((t) => (
                    <Badge
                      key={t.type}
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          mistakeTypes[t.type]?.color || "bg-gray-500",
                        )}
                      />
                      {mistakeTypes[t.type]?.label || t.type}: {t.count}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as MistakeType | "all")}
        >
          <SelectTrigger className="w-44">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(mistakeTypes).map(([val, cfg]) => (
              <SelectItem key={val} value={val}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={reviewedFilter}
          onValueChange={(v) => setReviewedFilter(v as any)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="unreviewed">Unreviewed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mistakes List */}
      {isLoading ? (
        <div className="flex justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : mistakes && mistakes.length > 0 ? (
        <div className="space-y-3">
          {mistakes.map((mistake) => (
            <MistakeCard
              key={mistake.id}
              mistake={mistake}
              onReview={() => setReviewDialog(mistake)}
              onCategorize={() => categorizeMutation.mutate(mistake.id)}
              isCategorizing={categorizeMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No mistakes recorded. Keep practicing!</p>
        </div>
      )}

      <ReviewMistakeDialog
        open={!!reviewDialog}
        mistake={reviewDialog}
        onOpenChange={(o) => !o && setReviewDialog(null)}
        onSubmit={(notes) =>
          reviewDialog && reviewMutation.mutate({ id: reviewDialog.id, notes })
        }
        isLoading={reviewMutation.isPending}
      />
    </div>
  );
}

function MistakeCard({
  mistake,
  onReview,
  onCategorize,
  isCategorizing,
}: {
  mistake: Mistake;
  onReview: () => void;
  onCategorize: () => void;
  isCategorizing: boolean;
}) {
  const typeConfig = mistakeTypes[mistake.mistake_type];
  return (
    <Card className={cn(!mistake.reviewed && "border-amber-500/30")}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn("text-white", typeConfig?.color)}>
                {typeConfig?.label || mistake.mistake_type}
              </Badge>
              <Badge variant={mistake.reviewed ? "secondary" : "outline"}>
                {mistake.reviewed ? "Reviewed" : "Pending"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {mistake.source} •{" "}
                {format(new Date(mistake.created_at), "MMM d")}
              </span>
            </div>
            <p className="font-medium mb-2">{mistake.question_text}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Your answer:</span>{" "}
                <span className="text-red-500">{mistake.user_answer}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Correct:</span>{" "}
                <span className="text-emerald-500">
                  {mistake.correct_answer}
                </span>
              </div>
            </div>
            {mistake.review_notes && (
              <p className="mt-3 text-sm bg-muted/50 p-2 rounded">
                {mistake.review_notes}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {!mistake.reviewed && (
              <Button size="sm" onClick={onReview}>
                <MessageSquare className="h-4 w-4 mr-1" />
                Review
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onCategorize}
              disabled={isCategorizing}
            >
              <Brain className="h-4 w-4 mr-1" />
              AI
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewMistakeDialog({
  open,
  mistake,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  mistake: Mistake | null;
  onOpenChange: (o: boolean) => void;
  onSubmit: (notes: string) => void;
  isLoading: boolean;
}) {
  const [notes, setNotes] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Mistake</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm">{mistake?.question_text}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label>Your Answer</Label>
              <p className="text-red-500">{mistake?.user_answer}</p>
            </div>
            <div>
              <Label>Correct</Label>
              <p className="text-emerald-500">{mistake?.correct_answer}</p>
            </div>
          </div>
          <div>
            <Label>What did you learn?</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write what you learned..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(notes)}
            disabled={!notes.trim() || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark Reviewed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
