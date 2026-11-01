// src/pages/notebooks/index.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Notebooks list page — shows all user notebooks, allows creating new ones.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen, Search, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { NotebookCard } from "./components/NotebookCard";
import { CreateNotebookModal } from "./components/CreateNotebookModal";
import { useNavigate } from "react-router-dom";

export default function NotebooksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["notebooks", search],
    queryFn: () => apiClient.listNotebooks({ search: search || undefined, limit: 50 }),
    staleTime: 30_000,
  });

  const notebooks = data?.data?.notebooks || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => apiClient.createNotebook(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["notebooks"] });
      toast({ title: "Notebook created!", description: "Add content and generate learning materials." });
      if (res?.data?.id) navigate(`/notebooks/${res.data.id}`);
    },
    onError: (err: any) => {
      toast({ title: "Failed to create", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteNotebook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notebooks"] });
      toast({ title: "Notebook deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const handleCreate = useCallback(async (data: any) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const tier = user?.tier || "free";
  const isUltra = tier === "ultra";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
              <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="font-semibold text-lg leading-none">Notebooks</h1>
              <p className="text-xs text-muted-foreground">AI-powered learning from any content</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isUltra && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full font-medium">
                <Sparkles className="h-3 w-3" />
                Claude Sonnet 4.6
              </div>
            )}
            <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> New Notebook
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero (shown when empty) */}
        {!isLoading && notebooks.length === 0 && !search && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 space-y-6"
          >
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-2xl" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold">Turn Any Content Into Mastery</h2>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto text-base leading-relaxed">
                Paste articles, JSON, or documents. Get AI-generated flashcards, quizzes, interview questions, and a visual mind map — instantly.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto text-sm">
              {[
                { emoji: "🃏", label: "Flashcards" },
                { emoji: "📝", label: "Quizzes" },
                { emoji: "💼", label: "Interview Prep" },
                { emoji: "🗺️", label: "Mind Maps" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border bg-card p-3 text-center">
                  <div className="text-2xl mb-1">{item.emoji}</div>
                  <div className="font-medium text-xs">{item.label}</div>
                </div>
              ))}
            </div>

            <Button onClick={() => setCreateOpen(true)} size="lg" className="gap-2 mt-4">
              <Plus className="h-5 w-5" /> Create Your First Notebook
            </Button>
          </motion.div>
        )}

        {/* Search + grid */}
        {(notebooks.length > 0 || search) && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notebooks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-sm text-muted-foreground shrink-0">
                {notebooks.length} notebook{notebooks.length !== 1 ? "s" : ""}
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {notebooks.map((nb: any, i: number) => (
                    <NotebookCard
                      key={nb.id}
                      notebook={nb}
                      index={i}
                      onDelete={(id) => deleteMutation.mutate(id)}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}

            {!isLoading && notebooks.length === 0 && search && (
              <div className="text-center py-16 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No notebooks match "{search}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateNotebookModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}

