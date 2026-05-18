import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { catApi } from "@/api/cat";
import {
  Resource,
  ResourceType,
  ResourceDifficulty,
  CreateResourcePayload,
} from "@/types/cat";
import { motion } from "framer-motion";
import {
  Video,
  Search,
  Plus,
  Star,
  ExternalLink,
  Loader2,
  BookOpen,
  FileText,
  GraduationCap,
  Sparkles,
  Filter,
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const resourceTypeIcons: Record<ResourceType, typeof Video> = {
  video: Video,
  article: FileText,
  pdf: BookOpen,
  course: GraduationCap,
  practice_set: Sparkles,
  other: BookOpen,
};

const difficultyColors: Record<ResourceDifficulty, string> = {
  beginner: "bg-emerald-500",
  intermediate: "bg-amber-500",
  advanced: "bg-red-500",
};

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ResourceType | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<
    ResourceDifficulty | "all"
  >("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: resources, isLoading } = useQuery({
    queryKey: [
      "cat-resources",
      searchQuery,
      typeFilter,
      difficultyFilter,
      freeOnly,
    ],
    queryFn: () =>
      catApi.searchResources({
        q: searchQuery || undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        difficulty: difficultyFilter !== "all" ? difficultyFilter : undefined,
        free: freeOnly ? true : undefined,
      }),
    staleTime: 2 * 60 * 1000,
  });

  const { data: recommended } = useQuery({
    queryKey: ["cat-resources-recommended"],
    queryFn: () => catApi.getRecommendedResources(),
    staleTime: 5 * 60 * 1000,
  });

  const rateMutation = useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) =>
      catApi.rateResource(id, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cat-resources"] });
      toast({ title: "Rating saved" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-7 w-7 text-primary" />
            Learning Resources
          </h1>
          <p className="text-muted-foreground">
            Curated content to boost your prep
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* AI Recommended */}
      {recommended && recommended.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Recommended for You
            </CardTitle>
            <CardDescription>Based on your weak areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recommended.slice(0, 4).map((res) => (
                <ResourceCard
                  key={res.id}
                  resource={res}
                  compact
                  onRate={(r) => rateMutation.mutate({ id: res.id, rating: r })}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as ResourceType | "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="article">Article</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="course">Course</SelectItem>
            <SelectItem value="practice_set">Practice Set</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={difficultyFilter}
          onValueChange={(v) =>
            setDifficultyFilter(v as ResourceDifficulty | "all")
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch checked={freeOnly} onCheckedChange={setFreeOnly} />
          <Label>Free only</Label>
        </div>
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="flex justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : resources && resources.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((res) => (
            <ResourceCard
              key={res.id}
              resource={res}
              onRate={(r) => rateMutation.mutate({ id: res.id, rating: r })}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No resources found</p>
        </div>
      )}

      <AddResourceDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["cat-resources"] });
          setAddDialogOpen(false);
        }}
      />
    </div>
  );
}

function ResourceCard({
  resource,
  onRate,
  compact,
}: {
  resource: Resource;
  onRate: (r: number) => void;
  compact?: boolean;
}) {
  const Icon = resourceTypeIcons[resource.resource_type] || BookOpen;
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(compact && "min-w-[280px]")}
    >
      <Card className="h-full">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium line-clamp-2">{resource.title}</p>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>{resource.source}</span>
                {resource.duration_minutes && (
                  <span>• {resource.duration_minutes}m</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-white text-xs",
                    difficultyColors[resource.difficulty],
                  )}
                >
                  {resource.difficulty}
                </Badge>
                {resource.is_free ? (
                  <Badge variant="secondary" className="text-xs">
                    Free
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Paid
                  </Badge>
                )}
              </div>
              {resource.rating !== undefined && (
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => onRate(s)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          s <= (resource.user_rating || 0)
                            ? "fill-amber-500 text-amber-500"
                            : s <= (resource.rating || 0)
                              ? "fill-amber-200 text-amber-200"
                              : "text-muted-foreground",
                        )}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({resource.rating_count || 0})
                  </span>
                </div>
              )}
            </div>
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              <Button size="icon" variant="ghost">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AddResourceDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<ResourceType>("video");
  const [source, setSource] = useState("");
  const [difficulty, setDifficulty] =
    useState<ResourceDifficulty>("intermediate");
  const [isFree, setIsFree] = useState(true);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (p: CreateResourcePayload) => catApi.createResource(p),
    onSuccess: () => {
      toast({ title: "Resource added" });
      setTitle("");
      setUrl("");
      onSuccess();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
          <DialogDescription>Share a helpful resource</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource title"
            />
          </div>
          <div>
            <Label>URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as ResourceType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="practice_set">Practice Set</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source</Label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="YouTube, Blog..."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as ResourceDifficulty)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={isFree} onCheckedChange={setIsFree} />
              <Label>Free</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              mutation.mutate({
                title,
                url,
                resource_type: type,
                source,
                difficulty,
                is_free: isFree,
              })
            }
            disabled={!title || !url || mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
