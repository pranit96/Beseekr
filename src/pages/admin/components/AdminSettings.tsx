import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import {
  Info,
  Search,
  Plus,
  Loader2,
  SlidersHorizontal,
  X,
  Pencil,
  Save,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const CATEGORY_COLORS: Record<string, string> = {
  ai: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  security: "text-red-400 bg-red-500/10 border-red-500/20",
  infrastructure: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  email: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  payments: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  general: "text-muted-foreground bg-zinc-500/10 border-zinc-500/20",
};

const getCategoryStyle = (cat: string) =>
  CATEGORY_COLORS[cat?.toLowerCase()] || CATEGORY_COLORS.general;

// Represents a single pending change with old + new values for the diff preview
interface PendingChange {
  key: string;
  type: string;
  oldValue: any;
  newValue: any;
}

const formatValue = (type: string, val: any): string => {
  if (val === null || val === undefined) return "—";
  if (type === "boolean") return String(val);
  return String(val);
};

export const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSavePreviewOpen, setIsSavePreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // key → pending change (staged but not yet saved)
  const [pendingChanges, setPendingChanges] = useState<Record<string, PendingChange>>({});

  const [newSetting, setNewSetting] = useState({
    key: "",
    category: "general",
    description: "",
    value: "",
  });
  const [editingSetting, setEditingSetting] = useState<{
    key: string;
    category: string;
    description: string;
    type: string;
    value: string;
  } | null>(null);

  const { data: settings = [], isLoading: loading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const response = await apiClient.getAdminConfig();
      return response.data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      key,
      value,
      type,
      category,
      description,
    }: {
      key: string;
      value?: any;
      type?: string;
      category?: string;
      description?: string;
    }) => apiClient.updateAdminConfig(key, { value, type, category, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Could not update setting",
        variant: "destructive",
      });
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: typeof newSetting) =>
      apiClient.updateAdminConfig(payload.key, {
        value: payload.value,
        category: payload.category,
        description: payload.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      setIsAddDialogOpen(false);
      setNewSetting({ key: "", category: "general", description: "", value: "" });
      toast({ title: "Flag created", description: "New system flag is now active." });
    },
    onError: (error: any) => {
      toast({
        title: "Creation failed",
        description: error.message || "Could not create flag",
        variant: "destructive",
      });
    },
  });

  // Stage a change locally — does NOT call the API
  const stageChange = (
    setting: any,
    newValue: any,
    type: string,
  ) => {
    const oldValue =
      type === "boolean"
        ? setting.value_boolean
        : type === "number"
        ? setting.value_number
        : setting.value_string;

    // If the new value equals the original, remove any pending change for this key
    if (String(newValue) === String(oldValue)) {
      setPendingChanges((prev) => {
        const next = { ...prev };
        delete next[setting.key];
        return next;
      });
      return;
    }

    setPendingChanges((prev) => ({
      ...prev,
      [setting.key]: { key: setting.key, type, oldValue, newValue },
    }));
  };

  // Commit all pending changes to the API
  const handleSaveAll = async () => {
    const changes = Object.values(pendingChanges);
    if (changes.length === 0) return;

    setIsSaving(true);
    setIsSavePreviewOpen(false);

    const results = await Promise.allSettled(
      changes.map((change) =>
        updateMutation.mutateAsync({
          key: change.key,
          value: change.newValue,
          type: change.type,
        }),
      ),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    const succeeded = results.length - failed;

    if (failed === 0) {
      toast({
        title: `${succeeded} change${succeeded > 1 ? "s" : ""} saved`,
        description: "All configuration updates applied successfully.",
      });
    } else {
      toast({
        title: `${succeeded} saved, ${failed} failed`,
        description: "Some changes could not be applied. Check the console.",
        variant: "destructive",
      });
    }

    setPendingChanges({});
    setIsSaving(false);
  };

  const handleDiscardAll = () => {
    setPendingChanges({});
    setIsSavePreviewOpen(false);
    // Force re-render of inputs back to original values by re-fetching
    queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
  };

  const handleStartEdit = (setting: any) => {
    let valStr = "";
    if (setting.type === "boolean") {
      valStr = String(setting.value_boolean);
    } else if (setting.type === "number") {
      valStr = String(setting.value_number ?? "");
    } else {
      valStr = setting.value_string ?? "";
    }
    setEditingSetting({
      key: setting.key,
      category: setting.category || "general",
      description: setting.description || "",
      type: setting.type || "string",
      value: valStr,
    });
    setIsEditDialogOpen(true);
  };

  const filteredSettings = useMemo(
    () =>
      settings.filter(
        (s: any) =>
          s.key.toLowerCase().includes(search.toLowerCase()) ||
          s.category.toLowerCase().includes(search.toLowerCase()) ||
          s.description?.toLowerCase().includes(search.toLowerCase()),
      ),
    [settings, search],
  );

  const categories = useMemo(
    () => Array.from(new Set(settings.map((s: any) => s.category))) as string[],
    [settings],
  );

  const pendingCount = Object.keys(pendingChanges).length;

  // Get the effective current value for display (pending overrides server value)
  const getEffectiveValue = (setting: any) => {
    const pending = pendingChanges[setting.key];
    if (pending) return pending.newValue;
    if (setting.type === "boolean") return setting.value_boolean;
    if (setting.type === "number") return setting.value_number;
    return setting.value_string;
  };

  return (
    <div className="space-y-5 pb-32">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          <Input
            placeholder="Search flags, categories..."
            className="pl-10 h-10 bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/50 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={() => setIsSavePreviewOpen(true)}
              className="flex items-center gap-1.5 px-3 h-10 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/15 transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {pendingCount} unsaved change{pendingCount > 1 ? "s" : ""}
            </button>
          )}
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-4 gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Flag
          </Button>
        </div>
      </div>

      {/* Settings grid */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 w-28 bg-white/[0.04] rounded-lg animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="h-24 bg-white/[0.02] border border-white/[0.06] rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-7">
          {categories.map((category) => {
            const catSettings = filteredSettings.filter(
              (s: any) => s.category === category,
            );
            if (catSettings.length === 0) return null;

            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground capitalize">
                    {category}
                  </span>
                  <Badge
                    className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold border ${getCategoryStyle(category)}`}
                  >
                    {catSettings.length}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catSettings.map((setting: any) => {
                    const hasPending = !!pendingChanges[setting.key];
                    const effectiveValue = getEffectiveValue(setting);
                    return (
                      <div
                        key={setting.key}
                        className={`group bg-white/[0.02] border rounded-2xl p-4 transition-all duration-300 ${
                          hasPending
                            ? "border-amber-500/40 bg-amber-500/[0.03] shadow-[0_0_0_1px_rgba(245,158,11,0.15)]"
                            : "border-white/[0.07] hover:border-white/[0.12]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono text-zinc-200 truncate">
                                {setting.key}
                              </code>
                              {hasPending && (
                                <span className="shrink-0 text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 rounded-full">
                                  Staged
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1 font-medium">
                              {setting.description || "System configuration"}
                            </p>
                          </div>
                          {setting.type === "boolean" && (
                            <Switch
                              checked={Boolean(effectiveValue)}
                              onCheckedChange={(checked) =>
                                stageChange(setting, checked, "boolean")
                              }
                              className="shrink-0"
                            />
                          )}
                        </div>

                        {setting.type !== "boolean" && (
                          <Input
                            key={`${setting.key}-${JSON.stringify(pendingChanges[setting.key])}`}
                            defaultValue={
                              pendingChanges[setting.key] !== undefined
                                ? String(pendingChanges[setting.key].newValue)
                                : setting.type === "number"
                                ? setting.value_number
                                : setting.value_string
                            }
                            type={setting.type === "number" ? "number" : "text"}
                            className={`h-8 text-xs bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/50 rounded-lg font-mono transition-colors ${
                              hasPending ? "border-amber-500/30 bg-amber-500/[0.05]" : ""
                            }`}
                            onBlur={(e) => stageChange(setting, e.target.value, setting.type)}
                          />
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                            <Info className="w-3 h-3 text-zinc-650" />
                            <span>
                              Updated{" "}
                              {new Date(setting.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-colors"
                            onClick={() => handleStartEdit(setting)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredSettings.length === 0 && (
            <div className="py-16 text-center border border-dashed border-white/[0.06] rounded-2xl">
              <p className="text-zinc-500 text-sm font-medium">
                No flags match "{search}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── STICKY SAVE BAR ─────────────────────────────────────────── */}
      {pendingCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-6 pb-5 pointer-events-none">
          <div
            className="pointer-events-auto w-full max-w-2xl bg-[#111113]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl px-5 py-3.5 shadow-[0_8px_40px_rgba(0,0,0,0.6)] flex items-center gap-4"
          >
            {/* Left: summary */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">
                {pendingCount} unsaved change{pendingCount > 1 ? "s" : ""}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                {Object.keys(pendingChanges).join(", ")}
              </p>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDiscardAll}
                className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Discard
              </button>
              <button
                onClick={() => setIsSavePreviewOpen(true)}
                className="flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20"
              >
                <Save className="w-3.5 h-3.5" />
                Review & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SAVE PREVIEW DIALOG ──────────────────────────────────────── */}
      <Dialog open={isSavePreviewOpen} onOpenChange={setIsSavePreviewOpen}>
        <DialogContent className="max-w-xl bg-[#111113] border border-white/[0.1] rounded-[28px] p-0 shadow-2xl overflow-hidden">
          <DialogHeader className="px-8 pt-8 pb-0">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2.5">
              <Save className="w-5 h-5 text-indigo-400" />
              Review Changes
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-sm mt-1">
              {pendingCount} setting{pendingCount > 1 ? "s" : ""} will be updated.
              Review the diff below before confirming.
            </DialogDescription>
          </DialogHeader>

          {/* Diff list */}
          <div className="px-8 py-6 space-y-3 max-h-[55vh] overflow-y-auto">
            {Object.values(pendingChanges).map((change) => (
              <div
                key={change.key}
                className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 space-y-2.5"
              >
                {/* Key + type badge */}
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-zinc-200 font-bold">
                    {change.key}
                  </code>
                  <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-500/10 border border-zinc-500/20 px-1.5 py-0.5 rounded-full">
                    {change.type}
                  </span>
                </div>

                {/* Old → New */}
                <div className="flex items-center gap-3 text-xs font-mono">
                  {/* Old */}
                  <div className="flex-1 min-w-0 bg-red-500/[0.08] border border-red-500/20 rounded-lg px-3 py-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-red-400/70 block mb-0.5">
                      Before
                    </span>
                    <span className="text-red-300 truncate block">
                      {formatValue(change.type, change.oldValue)}
                    </span>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

                  {/* New */}
                  <div className="flex-1 min-w-0 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-lg px-3 py-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400/70 block mb-0.5">
                      After
                    </span>
                    <span className="text-emerald-300 truncate block">
                      {formatValue(change.type, change.newValue)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="px-8 pb-8 pt-2 flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsSavePreviewOpen(false)}
              className="flex-1 text-zinc-500 hover:text-white rounded-xl h-11"
            >
              Back to editing
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-11 gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save {pendingCount} Change{pendingCount > 1 ? "s" : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ADD FLAG DIALOG ──────────────────────────────────────────── */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg bg-[#111113] border border-white/[0.1] rounded-[28px] p-8 shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-white">
              New Feature Flag
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-sm">
              Define a new operational flag or configuration parameter.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {[
              {
                id: "key",
                label: "Key",
                placeholder: "enable_new_feature",
                hint: "snake_case only · max 64 chars",
                value: newSetting.key,
                onChange: (v: string) =>
                  setNewSetting({
                    ...newSetting,
                    key: v.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  }),
              },
              {
                id: "category",
                label: "Category",
                placeholder: "ai, security, infrastructure...",
                hint: undefined,
                value: newSetting.category,
                onChange: (v: string) =>
                  setNewSetting({ ...newSetting, category: v }),
              },
              {
                id: "value",
                label: "Value",
                placeholder: "true, 100, or some-text",
                hint: "Type is auto-detected (boolean / number / string)",
                value: newSetting.value,
                onChange: (v: string) =>
                  setNewSetting({ ...newSetting, value: v }),
              },
              {
                id: "description",
                label: "Purpose",
                placeholder: "What does this flag control?",
                hint: undefined,
                value: newSetting.description,
                onChange: (v: string) =>
                  setNewSetting({ ...newSetting, description: v }),
              },
            ].map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  {field.label}
                </label>
                <Input
                  id={field.id}
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="h-10 bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/50 rounded-xl text-sm text-zinc-200 font-mono"
                  maxLength={field.id === "key" ? 64 : 500}
                />
                {field.hint && (
                  <p className="text-[10px] text-zinc-600">{field.hint}</p>
                )}
              </div>
            ))}
          </div>

          <DialogFooter className="mt-8 flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsAddDialogOpen(false)}
              className="flex-1 text-zinc-500 hover:text-white rounded-xl h-11"
            >
              Cancel
            </Button>
            <Button
              onClick={() => addMutation.mutate(newSetting)}
              disabled={addMutation.isPending || !newSetting.key}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-11"
            >
              {addMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create Flag"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT FLAG DIALOG ─────────────────────────────────────────── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg bg-[#111113] border border-white/[0.1] rounded-[28px] p-8 shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-white">
              Edit Setting
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-sm">
              Modify the configuration parameters or metadata for this flag.
            </DialogDescription>
          </DialogHeader>

          {editingSetting && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  Key
                </label>
                <Input
                  value={editingSetting.key}
                  disabled
                  className="h-10 bg-white/[0.01] border-white/[0.04] text-zinc-400 rounded-xl text-sm font-mono cursor-not-allowed"
                />
                <p className="text-[10px] text-zinc-600">
                  Keys cannot be renamed to preserve configuration references.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  Category
                </label>
                <Input
                  value={editingSetting.category}
                  onChange={(e) =>
                    setEditingSetting({ ...editingSetting, category: e.target.value })
                  }
                  placeholder="ai, security, infrastructure..."
                  className="h-10 bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/50 rounded-xl text-sm text-zinc-200 font-mono"
                  maxLength={32}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                    Type
                  </label>
                  <select
                    value={editingSetting.type}
                    onChange={(e) =>
                      setEditingSetting({
                        ...editingSetting,
                        type: e.target.value,
                        value: e.target.value === "boolean" ? "true" : editingSetting.value,
                      })
                    }
                    className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-[#1a1a1c] px-3 py-2 text-sm text-zinc-200 focus-visible:outline-none focus:border-indigo-500/50 font-mono"
                  >
                    <option value="string">string</option>
                    <option value="boolean">boolean</option>
                    <option value="number">number</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                    Value
                  </label>
                  {editingSetting.type === "boolean" ? (
                    <select
                      value={editingSetting.value}
                      onChange={(e) =>
                        setEditingSetting({ ...editingSetting, value: e.target.value })
                      }
                      className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-[#1a1a1c] px-3 py-2 text-sm text-zinc-200 focus-visible:outline-none focus:border-indigo-500/50 font-mono"
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <Input
                      type={editingSetting.type === "number" ? "number" : "text"}
                      value={editingSetting.value}
                      onChange={(e) =>
                        setEditingSetting({ ...editingSetting, value: e.target.value })
                      }
                      placeholder={editingSetting.type === "number" ? "0" : "value..."}
                      className="h-10 bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/50 rounded-xl text-sm text-zinc-200 font-mono"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  Purpose / Description
                </label>
                <textarea
                  value={editingSetting.description}
                  onChange={(e) =>
                    setEditingSetting({ ...editingSetting, description: e.target.value })
                  }
                  placeholder="Describe what this flag controls..."
                  className="flex min-h-[80px] w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-650 focus-visible:outline-none focus:border-indigo-500/50 font-sans"
                  maxLength={500}
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-8 flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsEditDialogOpen(false)}
              className="flex-1 text-zinc-500 hover:text-white rounded-xl h-11"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingSetting) {
                  let typedVal: any = editingSetting.value;
                  if (editingSetting.type === "boolean") {
                    typedVal = editingSetting.value === "true";
                  } else if (editingSetting.type === "number") {
                    typedVal = Number(editingSetting.value);
                  }
                  updateMutation.mutate({
                    key: editingSetting.key,
                    value: typedVal,
                    type: editingSetting.type,
                    category: editingSetting.category,
                    description: editingSetting.description,
                  });
                  setIsEditDialogOpen(false);
                }
              }}
              disabled={updateMutation.isPending || !editingSetting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-11"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
