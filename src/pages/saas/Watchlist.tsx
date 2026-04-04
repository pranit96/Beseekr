import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Bookmark,
  Trash2,
  TrendingUp,
  ThumbsUp,
  FileText,
  ArrowUpRight,
  Sparkles,
  Lock,
} from "lucide-react";
import { problemsApi } from "@/api/problems";
import type { WatchlistItem } from "@/types/problems";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function WatchlistSkeleton() {
  return (
    <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
      <div className="space-y-3 sm:space-y-4">
        <Skeleton className="h-5 sm:h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-3 sm:gap-4 pt-2">
          <Skeleton className="h-5 w-12 sm:w-16" />
          <Skeleton className="h-5 w-12 sm:w-16" />
        </div>
      </div>
    </div>
  );
}

function WatchlistCard({
  item,
  onRemove,
  index,
}: {
  item: WatchlistItem;
  onRemove: (id: string) => void;
  index: number;
}) {
  const navigate = useNavigate();

  const handleClick = () => navigate(`/dashboard/problems/${item.problem_id}`);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(item.problem_id);
  };

  const problem = item.problem;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
      onClick={handleClick}
      className={cn(
        "group relative cursor-pointer rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300",
        "bg-gradient-to-br from-background to-muted/30",
        "border border-border/50 hover:border-amber-500/30",
        "hover:shadow-xl hover:shadow-amber-500/5 active:scale-[0.98]",
      )}
    >
      {/* Bookmark indicator */}
      <div className="absolute -top-1.5 -left-1.5 sm:-top-2 sm:-left-2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm">
        <Bookmark className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 fill-amber-500" />
      </div>

      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 ml-3 sm:ml-4">
          {/* Title */}
          <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-amber-500 transition-colors line-clamp-1 mb-1.5 sm:mb-2">
            {problem?.title || "Untitled Problem"}
          </h3>

          {/* Summary */}
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 sm:mb-4 leading-relaxed">
            {problem?.summary || "No description available"}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="font-medium">
                {problem?.metrics?.frequency || 0}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
              <ThumbsUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="font-medium">
                {problem?.metrics?.upvote_score || 0}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="font-medium">
                {problem?.metrics?.source_count || 0}
              </span>
            </div>
            <span className="hidden sm:inline text-muted-foreground/50">•</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              Saved {new Date(item.added_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRemove}
            className="p-2 rounded-lg sm:rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.button>
          <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
        </div>
      </div>
    </motion.div>
  );
}

export function Watchlist() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: watchlistData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => problemsApi.getWatchlist(),
    enabled: !!user,
  });

  const watchlist = Array.isArray(watchlistData) ? watchlistData : [];

  const removeMutation = useMutation({
    mutationFn: problemsApi.removeFromWatchlist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  const handleRemove = (problemId: string) => {
    removeMutation.mutate(problemId);
  };

  // Auth check - show sign-in prompt for unauthenticated users
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 max-w-md mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <Lock className="h-10 w-10 text-amber-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground">
              Create an account to save problems to your watchlist and track
              opportunities.
            </p>
          </div>
          <Button
            onClick={() => navigate("/auth")}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 transition-opacity"
          >
            Sign In to Continue
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
        <p className="text-muted-foreground mb-6">
          {error instanceof Error ? error.message : "Failed to load watchlist"}
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl mx-auto px-2"
      >
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
          Your{" "}
          <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            Watchlist
          </span>
        </h1>
        <p className="text-sm sm:text-lg text-muted-foreground">
          Problems you're tracking. Build something that solves real pain.
        </p>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3 sm:space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <WatchlistSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && watchlist.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center py-12 sm:py-20 px-4"
        >
          <motion.div
            initial={{ y: 10 }}
            animate={{ y: [10, -10, 10] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center mx-auto mb-5 sm:mb-8 border border-amber-500/20"
          >
            <Bookmark className="h-8 w-8 sm:h-12 sm:w-12 text-amber-500" />
          </motion.div>
          <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3">
            No saved problems yet
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto">
            Discover problems worth solving and save them here to track your
            potential startup ideas.
          </p>
          <Button
            size="default"
            onClick={() => navigate("/dashboard/problems")}
            className="rounded-xl gap-2 h-11 sm:h-12 px-5 sm:px-6"
          >
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            Discover Problems
          </Button>
        </motion.div>
      )}

      {/* Watchlist Items */}
      {!isLoading && watchlist.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {watchlist.length} problem{watchlist.length !== 1 ? "s" : ""}{" "}
              saved
            </span>
          </div>
          <AnimatePresence mode="popLayout">
            {watchlist.map((item: WatchlistItem, index: number) => (
              <WatchlistCard
                key={item.problem_id}
                item={item}
                onRemove={handleRemove}
                index={index}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

export default Watchlist;
