import React from "react";
import { TopicStatus } from "@/types/education";
import { CheckCircle2, Clock, PlayCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopicStatusBadgeProps {
  status: TopicStatus | "locked";
  className?: string;
}

export function TopicStatusBadge({ status, className }: TopicStatusBadgeProps) {
  const config = {
    locked: {
      label: "Locked",
      icon: Lock,
      classes: "bg-muted/30 text-muted-foreground/60 border-border/40",
    },
    pending: {
      label: "Pending",
      icon: Clock,
      classes: "bg-muted/50 text-muted-foreground border-border",
    },
    in_progress: {
      label: "In Progress",
      icon: PlayCircle,
      classes: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
    completed: {
      label: "Completed",
      icon: CheckCircle2,
      classes: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    },
  };

  const { label, icon: Icon, classes } = config[status] || config.pending;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        classes,
        className,
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
}
