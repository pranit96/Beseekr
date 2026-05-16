import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { Info, Search, SlidersHorizontal, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [newSetting, setNewSetting] = useState({
    key: "",
    category: "general",
    description: "",
    value: "",
  });

  // Fetch all settings using TanStack Query
  const { data: settings = [], isLoading: loading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const response = await apiClient.getAdminConfig();
      return response.data || [];
    },
  });

  // Mutation for updating a setting
  const updateMutation = useMutation({
    mutationFn: async ({
      key,
      value,
      type,
    }: {
      key: string;
      value: any;
      type: string;
    }) => {
      setUpdating(key);
      return apiClient.updateAdminConfig(key, { value, type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast({
        title: "Setting updated",
        description: "System configuration has been refreshed.",
      });
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

  // Mutation for adding a new setting
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

  const handleAddSetting = () => {
    if (!newSetting.key) return;
    addMutation.mutate(newSetting);
  };

  const filteredSettings = useMemo(() => {
    return settings.filter(
      (s: any) =>
        s.key.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [settings, search]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(settings.map((s: any) => s.category)),
    ) as string[];
  }, [settings]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search flags by name, category, or purpose..."
            className="pl-10 bg-muted/50 border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>Add New Feature Flag</span>
        </Button>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="fixed left-1/2 top-[10vh] -translate-x-1/2 translate-y-0 max-w-2xl w-[95vw] z-[10001] p-8 bg-background border-2 border-primary/20 shadow-2xl shadow-primary/10">
            <DialogHeader className="mb-6 text-left">
              <DialogTitle className="text-3xl font-bold">Add System Flag</DialogTitle>
              <DialogDescription className="text-lg text-muted-foreground">
                Define a new operational flag or configuration parameter.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-8 py-4">
              <div className="grid grid-cols-4 items-center gap-8">
                <Label htmlFor="key" className="text-right text-base font-bold">
                  Key
                </Label>
                <div className="col-span-3">
                  <Input
                    id="key"
                    placeholder="enable_new_feature"
                    className="text-base h-12 bg-muted/30"
                    maxLength={64}
                    value={newSetting.key}
                    onChange={(e) =>
                      setNewSetting({
                        ...newSetting,
                        key: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, ""),
                      })
                    }
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Snake_case only. Max 64 chars.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-8">
                <Label htmlFor="category" className="text-right text-base font-bold">
                  Category
                </Label>
                <Input
                  id="category"
                  placeholder="ai, security, infrastructure..."
                  className="col-span-3 text-base h-12 bg-muted/30"
                  maxLength={32}
                  value={newSetting.category}
                  onChange={(e) =>
                    setNewSetting({ ...newSetting, category: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-8">
                <Label htmlFor="value" className="text-right text-base font-bold">
                  Value
                </Label>
                <div className="col-span-3">
                  <Input
                    id="value"
                    placeholder="true, 100, or some text"
                    className="text-base h-12 bg-muted/30"
                    maxLength={2048}
                    value={newSetting.value}
                    onChange={(e) =>
                      setNewSetting({ ...newSetting, value: e.target.value })
                    }
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Type is auto-detected (boolean, number, or string).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-8">
                <Label htmlFor="desc" className="text-right text-base font-bold">
                  Purpose
                </Label>
                <Input
                  id="desc"
                  placeholder="What does this flag do?"
                  className="col-span-3 text-base h-12 bg-muted/30"
                  maxLength={500}
                  value={newSetting.description}
                  onChange={(e) =>
                    setNewSetting({
                      ...newSetting,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter className="mt-10">
              <Button
                size="lg"
                className="w-full sm:w-auto px-16 h-12 text-lg font-bold"
                onClick={handleAddSetting}
                disabled={updating === "new" || !newSetting.key}
              >
                {updating === "new" ? "Creating..." : "Create Flag"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {categories.map((category) => {
            const catSettings = filteredSettings.filter(
              (s: any) => s.category === category,
            );
            if (catSettings.length === 0) return null;

            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-semibold capitalize">
                    {category}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-primary/10 text-primary border-none"
                  >
                    {catSettings.length}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catSettings.map((setting: any) => (
                    <Card
                      key={setting.key}
                      className="border-none shadow-sm hover:shadow-md transition-all duration-300 group"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <CardTitle className="text-sm font-mono flex items-center gap-2">
                              {setting.key}
                              {updating === setting.key && (
                                <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs line-clamp-1">
                              {setting.description || "System configuration"}
                            </CardDescription>
                          </div>
                          {setting.type === "boolean" && (
                            <Switch
                              checked={setting.value_boolean}
                              onCheckedChange={() =>
                                handleToggle(setting.key, setting.value_boolean)
                              }
                              disabled={updating === setting.key}
                            />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {setting.type !== "boolean" && (
                          <div className="flex gap-2 items-center mt-2">
                            <Input
                              defaultValue={
                                setting.type === "number"
                                  ? setting.value_number
                                  : setting.value_string
                              }
                              type={
                                setting.type === "number" ? "number" : "text"
                              }
                              className="h-8 text-xs bg-muted/30 border-none"
                              onBlur={(e) =>
                                handleValueChange(
                                  setting.key,
                                  e.target.value,
                                  setting.type,
                                )
                              }
                              disabled={updating === setting.key}
                            />
                            <div className="h-8 w-8 rounded-md bg-muted/50 flex items-center justify-center">
                              {setting.type === "number" ? (
                                <span className="text-[10px] font-bold">#</span>
                              ) : (
                                <span className="text-[10px] font-bold">
                                  Aa
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground italic">
                          <Info className="h-3 w-3" />
                          Last changed:{" "}
                          {new Date(setting.updated_at).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
