// src/components/ui/loading-skeleton.tsx - ENHANCED LOADING SKELETONS
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "default" | "circular" | "text" | "card";
  animate?: boolean;
  count?: number;
}

export const LoadingSkeleton = ({
  className,
  variant = "default",
  animate = true,
  count = 1,
}: LoadingSkeletonProps) => {
  const baseClasses = cn("bg-muted", animate && "animate-pulse", className);

  const variantClasses = {
    default: "rounded-md",
    circular: "rounded-full",
    text: "rounded h-4",
    card: "rounded-lg",
  };

  const skeletonClass = cn(baseClasses, variantClasses[variant]);

  if (count === 1) {
    return (
      <div className={skeletonClass} role="status" aria-label="Loading..." />
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={skeletonClass}
          role="status"
          aria-label="Loading..."
        />
      ))}
    </>
  );
};

// Message skeleton for chat interface
export const MessageSkeleton = () => (
  <div
    className="flex gap-4 justify-start animate-fade-in"
    role="status"
    aria-label="Loading message"
  >
    <LoadingSkeleton variant="circular" className="w-8 h-8 flex-shrink-0" />
    <div className="flex-1 space-y-2 max-w-[85%]">
      <LoadingSkeleton className="h-4 w-24" />
      <div className="rounded-2xl px-4 py-3 bg-muted border border-border space-y-2">
        <LoadingSkeleton className="h-3 w-full" />
        <LoadingSkeleton className="h-3 w-5/6" />
        <LoadingSkeleton className="h-3 w-4/6" />
      </div>
    </div>
  </div>
);

// Agent card skeleton
export const AgentCardSkeleton = () => (
  <div
    className="p-3 rounded-lg border border-border space-y-2 animate-pulse"
    role="status"
    aria-label="Loading agent"
  >
    <div className="flex items-start gap-2">
      <LoadingSkeleton variant="circular" className="w-3 h-3 mt-1" />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton className="h-4 w-24" />
        <LoadingSkeleton className="h-3 w-full" />
        <LoadingSkeleton className="h-3 w-4/5" />
      </div>
    </div>
  </div>
);

// Conversation skeleton
export const ConversationSkeleton = () => (
  <div
    className="p-3 rounded-lg space-y-2 animate-pulse"
    role="status"
    aria-label="Loading conversation"
  >
    <div className="flex items-start gap-3">
      <LoadingSkeleton variant="circular" className="w-10 h-10" />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton className="h-4 w-32" />
        <LoadingSkeleton className="h-3 w-24" />
      </div>
    </div>
  </div>
);

// Table skeleton
export const TableSkeleton = ({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) => (
  <div className="space-y-2" role="status" aria-label="Loading table">
    {/* Header */}
    <div className="flex gap-4 pb-2 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <LoadingSkeleton key={`header-${i}`} className="h-4 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex gap-4 py-2">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <LoadingSkeleton
            key={`cell-${rowIndex}-${colIndex}`}
            className="h-4 flex-1"
          />
        ))}
      </div>
    ))}
  </div>
);

// Chart skeleton
export const ChartSkeleton = () => (
  <div className="space-y-4 p-4" role="status" aria-label="Loading chart">
    <LoadingSkeleton className="h-6 w-32" />
    <div className="flex items-end gap-2 h-48">
      {Array.from({ length: 7 }).map((_, i) => (
        <LoadingSkeleton
          key={i}
          className="flex-1"
          style={{ height: `${Math.random() * 100 + 50}px` }}
        />
      ))}
    </div>
    <div className="flex justify-between">
      {Array.from({ length: 7 }).map((_, i) => (
        <LoadingSkeleton key={i} className="h-3 w-8" />
      ))}
    </div>
  </div>
);

// Page skeleton
export const PageSkeleton = () => (
  <div
    className="space-y-6 p-6 animate-fade-in"
    role="status"
    aria-label="Loading page"
  >
    <div className="space-y-2">
      <LoadingSkeleton className="h-8 w-48" />
      <LoadingSkeleton className="h-4 w-96" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <LoadingSkeleton className="h-32 rounded-lg" count={3} />
    </div>
    <LoadingSkeleton className="h-96 rounded-lg" />
  </div>
);
