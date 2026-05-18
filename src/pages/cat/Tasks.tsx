import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { catApi } from "@/api/cat";
import {
  StudyTask,
  CreateTaskPayload,
  TaskType,
  TaskPriority,
  TaskStatus,
} from "@/types/cat";
import { motion, AnimatePresence } from "framer-motion";
import { format, isPast, isToday } from "date-fns";
import {
  ListTodo,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
  Calendar,
  Trash2,
  Pencil,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const taskTypeConfig: Record<TaskType, { label: string; color: string }> = {
  study: { label: "Study", color: "bg-blue-500" },
  practice: { label: "Practice", color: "bg-emerald-500" },
  revision: { label: "Revision", color: "bg-amber-500" },
  mock: { label: "Mock", color: "bg-violet-500" },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "text-muted-foreground" },
  medium: { label: "Medium", color: "text-blue-500" },
  high: { label: "High", color: "text-amber-500" },
  urgent: { label: "Urgent", color: "text-red-500" },
};

const statusConfig: Record<TaskStatus, { label: string; icon: typeof Circle }> =
  {
    pending: { label: "Pending", icon: Circle },
    in_progress: { label: "In Progress", icon: Clock },
    completed: { label: "Completed", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", icon: XCircle },
  };

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<TaskType | "all">("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<StudyTask | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["cat-tasks"],
    queryFn: () => catApi.getTasks({ limit: 100 }),
    staleTime: 1 * 60 * 1000,
  });

  const { data: subjects } = useQuery({
    queryKey: ["cat-subjects"],
    queryFn: () => catApi.getSubjects(),
    staleTime: 5 * 60 * 1000,
  });

  const tasks = tasksData?.items || [];

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      const matchesType = typeFilter === "all" || task.task_type === typeFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, typeFilter]);

  const completeMutation = useMutation({
    mutationFn: (id: string) => catApi.completeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cat-tasks"] });
      toast({ title: "Task completed! 🎉" });
    },
    onError: () => {
      toast({ title: "Failed to complete task", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => catApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cat-tasks"] });
      toast({ title: "Task deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete task", variant: "destructive" });
    },
  });

  const groupedTasks = useMemo(() => {
    const pending = filteredTasks.filter(
      (t) => t.status === "pending" || t.status === "in_progress",
    );
    const completed = filteredTasks.filter((t) => t.status === "completed");
    const overdue = pending.filter(
      (t) =>
        t.deadline &&
        isPast(new Date(t.deadline)) &&
        !isToday(new Date(t.deadline)),
    );
    const today = pending.filter(
      (t) => t.deadline && isToday(new Date(t.deadline)),
    );
    const upcoming = pending.filter(
      (t) =>
        !t.deadline ||
        (!isPast(new Date(t.deadline)) && !isToday(new Date(t.deadline))),
    );

    return { overdue, today, upcoming, completed };
  }, [filteredTasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ListTodo className="h-7 w-7 text-primary" />
            Study Tasks
          </h1>
          <p className="text-muted-foreground">Manage your study schedule</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as TaskStatus | "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(v) => setPriorityFilter(v as TaskPriority | "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {Object.entries(priorityConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as TaskType | "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(taskTypeConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task Groups */}
      <div className="space-y-6">
        {groupedTasks.overdue.length > 0 && (
          <TaskGroup
            title="Overdue"
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            tasks={groupedTasks.overdue}
            onComplete={(id) => completeMutation.mutate(id)}
            onEdit={setEditTask}
            onDelete={(id) => deleteMutation.mutate(id)}
            variant="destructive"
          />
        )}

        {groupedTasks.today.length > 0 && (
          <TaskGroup
            title="Today"
            icon={<Calendar className="h-5 w-5 text-amber-500" />}
            tasks={groupedTasks.today}
            onComplete={(id) => completeMutation.mutate(id)}
            onEdit={setEditTask}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        )}

        <TaskGroup
          title="Upcoming"
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          tasks={groupedTasks.upcoming}
          onComplete={(id) => completeMutation.mutate(id)}
          onEdit={setEditTask}
          onDelete={(id) => deleteMutation.mutate(id)}
          emptyMessage="No upcoming tasks. Add one to get started!"
        />

        {groupedTasks.completed.length > 0 && (
          <TaskGroup
            title="Completed"
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            tasks={groupedTasks.completed.slice(0, 10)}
            onComplete={() => {}}
            onEdit={setEditTask}
            onDelete={(id) => deleteMutation.mutate(id)}
            collapsible
            defaultCollapsed
          />
        )}
      </div>

      {/* Create/Edit Dialog */}
      <TaskDialog
        open={createDialogOpen || !!editTask}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditTask(null);
          }
        }}
        task={editTask}
        subjects={subjects || []}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["cat-tasks"] });
          setCreateDialogOpen(false);
          setEditTask(null);
        }}
      />
    </div>
  );
}

function TaskGroup({
  title,
  icon,
  tasks,
  onComplete,
  onEdit,
  onDelete,
  variant,
  emptyMessage,
  collapsible,
  defaultCollapsed,
}: {
  title: string;
  icon: React.ReactNode;
  tasks: StudyTask[];
  onComplete: (id: string) => void;
  onEdit: (task: StudyTask) => void;
  onDelete: (id: string) => void;
  variant?: "destructive";
  emptyMessage?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed || false);

  if (tasks.length === 0 && !emptyMessage) return null;

  return (
    <Card className={cn(variant === "destructive" && "border-red-500/50")}>
      <CardHeader
        className={cn(
          "cursor-pointer",
          collapsible && "hover:bg-muted/50 transition-colors",
        )}
        onClick={() => collapsible && setCollapsed(!collapsed)}
      >
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
          <Badge variant="secondary" className="ml-2">
            {tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CardContent className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {emptyMessage}
                </p>
              ) : (
                tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onComplete={() => onComplete(task.id)}
                    onEdit={() => onEdit(task)}
                    onDelete={() => onDelete(task.id)}
                  />
                ))
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function TaskRow({
  task,
  onComplete,
  onEdit,
  onDelete,
}: {
  task: StudyTask;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const typeConfig = taskTypeConfig[task.task_type];
  const prioConfig = priorityConfig[task.priority];
  const isCompleted = task.status === "completed";

  return (
    <motion.div
      layout
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors",
        isCompleted && "opacity-60",
      )}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() => !isCompleted && onComplete()}
        disabled={isCompleted}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "font-medium truncate",
              isCompleted && "line-through",
            )}
          >
            {task.title}
          </p>
          <Badge className={cn("text-xs", typeConfig.color)}>
            {typeConfig.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span className={prioConfig.color}>{prioConfig.label}</span>
          {task.estimated_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.estimated_minutes}m
            </span>
          )}
          {task.deadline && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(task.deadline), "MMM d")}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function TaskDialog({
  open,
  onOpenChange,
  task,
  subjects,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: StudyTask | null;
  subjects: {
    id: string;
    name: string;
    topics: { id: string; title: string }[];
  }[];
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("study");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("60");
  const [deadline, setDeadline] = useState("");
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (payload: CreateTaskPayload) => catApi.createTask(payload),
    onSuccess: () => {
      toast({ title: task ? "Task updated" : "Task created" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to save task", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & Partial<CreateTaskPayload>) =>
      catApi.updateTask(id, payload),
    onSuccess: () => {
      toast({ title: "Task updated" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

  // Reset form when task changes
  useMemo(() => {
    if (task) {
      setTitle(task.title);
      setTaskType(task.task_type);
      setPriority(task.priority);
      setSubjectId(task.subject_id || "");
      setTopicId(task.topic_id || "");
      setEstimatedMinutes(String(task.estimated_minutes || 60));
      setDeadline(
        task.deadline ? format(new Date(task.deadline), "yyyy-MM-dd") : "",
      );
    } else {
      setTitle("");
      setTaskType("study");
      setPriority("medium");
      setSubjectId("");
      setTopicId("");
      setEstimatedMinutes("60");
      setDeadline("");
    }
  }, [task]);

  const selectedSubject = subjects.find((s) => s.id === subjectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateTaskPayload = {
      title: title.trim(),
      task_type: taskType,
      priority,
      subject_id: subjectId || undefined,
      topic_id: topicId || undefined,
      estimated_minutes: parseInt(estimatedMinutes) || undefined,
      deadline: deadline || undefined,
    };

    if (task) {
      updateMutation.mutate({ id: task.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update your study task" : "Add a new study task"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Practice Permutations"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={taskType}
                  onValueChange={(v) => setTaskType(v as TaskType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(taskTypeConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as TaskPriority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Subject (optional)</Label>
              <Select
                value={subjectId || "__none__"}
                onValueChange={(v) => {
                  const value = v === "__none__" ? "" : v;
                  setSubjectId(value);
                  setTopicId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSubject && (
              <div>
                <Label>Topic (optional)</Label>
                <Select
                  value={topicId || "__none__"}
                  onValueChange={(v) => setTopicId(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {selectedSubject.topics.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  min="5"
                  max="480"
                />
              </div>
              <div>
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {task ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
