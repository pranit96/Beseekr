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

export const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
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
    }) => {
      setUpdating(key);
      return apiClient.updateAdminConfig(key, {
        value,
        type,
        category,
        description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      setIsEditDialogOpen(false);
      toast({ title: "Saved", description: "Configuration updated." });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Could not update setting",
        variant: "destructive",
      });
    },
    onSettled: () => setUpdating(null),
  });

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

  const addMutation = useMutation({
    mutationFn: async (payload: typeof newSetting) => {
      setUpdating("new");
      return apiClient.updateAdminConfig(payload.key, {
        value: payload.value,
        category: payload.category,
        description: payload.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      setIsAddDialogOpen(false);
      setNewSetting({
        key: "",
        category: "general",
        description: "",
        value: "",
      });
      toast({
        title: "Flag created",
        description: "New system flag is now active.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation failed",
        description: error.message || "Could not create flag",
        variant: "destructive",
      });
    },
    onSettled: () => setUpdating(null),
  });

  const handleToggle = (key: string, currentValue: boolean) => {
    updateMutation.mutate({ key, value: !currentValue, type: "boolean" });
  };

  const handleValueChange = (key: string, value: string, type: string) => {
    updateMutation.mutate({ key, value, type });
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

  return (
    <div className="space-y-5">
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
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-4 gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Flag
        </Button>
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
                  {catSettings.map((setting: any) => (
                    <div
                      key={setting.key}
                      className={`group bg-white/[0.02] border rounded-2xl p-4 transition-all duration-300 ${
                        updating === setting.key
                          ? "border-indigo-500/30 bg-indigo-500/[0.03]"
                          : "border-white/[0.07] hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono text-zinc-200 truncate">
                              {setting.key}
                            </code>
                            {updating === setting.key && (
                              <Loader2 className="w-3 h-3 text-indigo-400 animate-spin shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1 font-medium">
                            {setting.description || "System configuration"}
                          </p>
                        </div>
                        {setting.type === "boolean" && (
                          <Switch
                            checked={setting.value_boolean}
                            onCheckedChange={() =>
                              handleToggle(setting.key, setting.value_boolean)
                            }
                            disabled={updating === setting.key}
                            className="shrink-0"
                          />
                        )}
                      </div>

                      {setting.type !== "boolean" && (
                        <Input
                          defaultValue={
                            setting.type === "number"
                              ? setting.value_number
                              : setting.value_string
                          }
                          type={setting.type === "number" ? "number" : "text"}
                          className="h-8 text-xs bg-white/[0.03] border-white/[0.08] focus:border-indigo-500/50 rounded-lg font-mono"
                          onBlur={(e) =>
                            handleValueChange(
                              setting.key,
                              e.target.value,
                              setting.type,
                            )
                          }
                          disabled={updating === setting.key}
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
                  ))}
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

      {/* Add Flag Dialog */}
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
              disabled={updating === "new" || !newSetting.key}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-11"
            >
              {updating === "new" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create Flag"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Flag Dialog */}
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
                <p className="text-[10px] text-zinc-600">Keys cannot be renamed to preserve configuration references.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  Category
                </label>
                <Input
                  value={editingSetting.category}
                  onChange={(e) =>
                    setEditingSetting({
                      ...editingSetting,
                      category: e.target.value,
                    })
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
                        setEditingSetting({
                          ...editingSetting,
                          value: e.target.value,
                        })
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
                        setEditingSetting({
                          ...editingSetting,
                          value: e.target.value,
                        })
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
                    setEditingSetting({
                      ...editingSetting,
                      description: e.target.value,
                    })
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
                }
              }}
              disabled={updating === editingSetting?.key || !editingSetting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-11"
            >
              {updating === editingSetting?.key ? (
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
