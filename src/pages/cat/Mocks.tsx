import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { catApi } from "@/api/cat";
import { Mock, MockType, MockDifficulty } from "@/types/cat";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import {
  FileQuestion,
  Play,
  Clock,
  Target,
  TrendingUp,
  Loader2,
  Plus,
  BarChart3,
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
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const mockTypes: {
  value: MockType;
  label: string;
  desc: string;
  duration: string;
}[] = [
  {
    value: "full",
    label: "Full Mock",
    desc: "Complete CAT simulation",
    duration: "180 min",
  },
  {
    value: "sectional_quant",
    label: "Quant Sectional",
    desc: "Quantitative Aptitude only",
    duration: "60 min",
  },
  {
    value: "sectional_varc",
    label: "VARC Sectional",
    desc: "Verbal & Reading Comprehension",
    duration: "60 min",
  },
  {
    value: "sectional_dilr",
    label: "DILR Sectional",
    desc: "Data Interpretation & Logical Reasoning",
    duration: "60 min",
  },
];

export default function Mocks() {
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: mocksData, isLoading } = useQuery({
    queryKey: ["cat-mocks"],
    queryFn: () => catApi.getMocks({ limit: 20 }),
    staleTime: 1 * 60 * 1000,
  });

  const { data: performance } = useQuery({
    queryKey: ["cat-mocks-performance"],
    queryFn: () => catApi.getMockPerformance(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: weakAreas } = useQuery({
    queryKey: ["cat-weak-areas"],
    queryFn: () => catApi.getWeakAreas(),
    staleTime: 5 * 60 * 1000,
  });

  const mocks = mocksData?.items || [];
  const inProgress = mocks.find((m) => m.status === "in_progress");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileQuestion className="h-7 w-7 text-primary" />
            Mock Tests
          </h1>
          <p className="text-muted-foreground">
            Practice with full CAT simulations
          </p>
        </div>
        <div className="flex gap-2">
          {inProgress && (
            <Link to={`/cat/mocks/${inProgress.id}`}>
              <Button variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Resume Mock
              </Button>
            </Link>
          )}
          <Button
            onClick={() => setStartDialogOpen(true)}
            className="bg-gradient-to-r from-violet-500 to-purple-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Start New Mock
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      {performance && performance.total > 0 && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">
                  {performance.total}
                </p>
                <p className="text-sm text-muted-foreground">Total Mocks</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-500">
                  {performance.average_score.toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground">Avg Score</p>
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Score Trend</p>
              <div className="h-16 flex items-end gap-1">
                {performance.trend.slice(-10).map((p, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors"
                    style={{
                      height: `${Math.min((p.score / 200) * 100, 100)}%`,
                    }}
                    title={`${p.date}: ${p.score}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weak Areas */}
      {weakAreas && weakAreas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-500" />
              Focus Areas
            </CardTitle>
            <CardDescription>Topics with &lt;50% accuracy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {weakAreas.slice(0, 5).map((area) => (
                <Badge
                  key={area.topic_id}
                  variant="outline"
                  className="text-amber-500 border-amber-500"
                >
                  {area.topic_title} ({area.accuracy}%)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mock History */}
      <Card>
        <CardHeader>
          <CardTitle>Mock History</CardTitle>
          <CardDescription>Your recent mock attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : mocks.length > 0 ? (
            <div className="space-y-3">
              {mocks.map((mock) => (
                <MockRow key={mock.id} mock={mock} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No mocks taken yet. Start your first mock test!
            </div>
          )}
        </CardContent>
      </Card>

      <StartMockDialog
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
        onSuccess={(mockId) => {
          setStartDialogOpen(false);
          navigate(`/cat/mocks/${mockId}`);
        }}
      />
    </div>
  );
}

function MockRow({ mock }: { mock: Mock }) {
  const typeLabel =
    mockTypes.find((t) => t.value === mock.type)?.label || mock.type;
  const scorePercent =
    mock.score && mock.max_score ? (mock.score / mock.max_score) * 100 : 0;

  return (
    <Link to={`/cat/mocks/${mock.id}`}>
      <motion.div
        whileHover={{ x: 4 }}
        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center",
              mock.status === "completed"
                ? "bg-emerald-500/10"
                : mock.status === "in_progress"
                  ? "bg-amber-500/10"
                  : "bg-muted",
            )}
          >
            <FileQuestion
              className={cn(
                "h-5 w-5",
                mock.status === "completed"
                  ? "text-emerald-500"
                  : "text-amber-500",
              )}
            />
          </div>
          <div>
            <p className="font-medium">{typeLabel}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(mock.started_at), "MMM d, yyyy h:mm a")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {mock.status === "completed" && mock.score !== undefined && (
            <>
              <div className="text-right">
                <p className="font-semibold">
                  {mock.score}/{mock.max_score}
                </p>
                <p className="text-xs text-muted-foreground">
                  {mock.correct}/{mock.total_questions} correct
                </p>
              </div>
              <div className="w-20">
                <Progress value={scorePercent} className="h-2" />
              </div>
            </>
          )}
          <Badge
            variant={
              mock.status === "completed"
                ? "default"
                : mock.status === "in_progress"
                  ? "secondary"
                  : "outline"
            }
          >
            {mock.status === "completed"
              ? "Complete"
              : mock.status === "in_progress"
                ? "In Progress"
                : "Abandoned"}
          </Badge>
        </div>
      </motion.div>
    </Link>
  );
}

function StartMockDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess: (mockId: string) => void;
}) {
  const [mockType, setMockType] = useState<MockType>("full");
  const [difficulty, setDifficulty] = useState<MockDifficulty>("medium");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: () =>
      catApi.startMock({ type: mockType, difficulty, generate_new: false }),
    onSuccess: (data) => {
      toast({ title: "Mock started!" });
      onSuccess(data.id);
    },
    onError: () =>
      toast({ title: "Failed to start mock", variant: "destructive" }),
  });

  const selectedType = mockTypes.find((t) => t.value === mockType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Mock Test</DialogTitle>
          <DialogDescription>Choose your mock configuration</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Mock Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {mockTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setMockType(type.value)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-colors",
                    mockType === type.value
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted",
                  )}
                >
                  <p className="font-medium">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.desc}</p>
                  <p className="text-xs text-primary mt-1">⏱ {type.duration}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Difficulty</Label>
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as MockDifficulty)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy - Build confidence</SelectItem>
                <SelectItem value="medium">
                  Medium - Standard CAT level
                </SelectItem>
                <SelectItem value="hard">Hard - Challenge yourself</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-gradient-to-r from-violet-500 to-purple-600"
          >
            {mutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            <Play className="h-4 w-4 mr-2" />
            Start {selectedType?.duration}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
