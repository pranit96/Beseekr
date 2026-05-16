import { useState, useEffect, useMemo } from "react";
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
import { Info, Search, SlidersHorizontal, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Plus } from "lucide-react";

export function AdminSettings() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSetting, setNewSetting] = useState({
    key: "",
    category: "general",
    description: "",
    value: "",
  });

  const {
    data: settingsData,
    isLoading: loading,
    refetch: fetchSettings,
  } = useQuery({
    queryKey: ["admin", "config"],
    queryFn: () => apiClient.getAdminConfig(),
    select: (res) => (res.success ? res.data : []),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const settings = settingsData || [];

  const updateMutation = useMutation({
    mutationFn: ({ key, payload }: { key: string; payload: any }) =>
      apiClient.updateAdminConfig(key, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "config"] });
      toast({
        title: "Success",
        description: `Setting ${variables.key} updated.`,
      });
      setUpdating(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
      setUpdating(null);
    },
  });

  const handleToggle = async (key: string, currentValue: boolean) => {
    setUpdating(key);
    updateMutation.mutate({
      key,
      payload: { value: !currentValue, type: "boolean" },
    });
  };

  const handleValueChange = async (
    key: string,
    value: string | number,
    type: string,
  ) => {
    setUpdating(key);
    const val = type === "number" ? Number(value) : value;
    updateMutation.mutate({
      key,
      payload: { value: val, type },
    });
  };

  const handleAddSetting = async () => {
    if (!newSetting.key) return;

    setUpdating("new");
    updateMutation.mutate(
      {
        key: newSetting.key,
        payload: {
          value: newSetting.value,
          category: newSetting.category,
          description: newSetting.description,
        },
      },
      {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          setNewSetting({
            key: "",
            category: "general",
            description: "",
            value: "",
          });
        },
      },
    );
  };

  const filteredSettings = settings.filter(
    (s) =>
      s.key.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const categories = Array.from(
    new Set(settings.map((s) => s.category)),
  ) as string[];

  if (loading)
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search settings by name, category, or purpose..."
            className="pl-10 bg-muted/50 border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Setting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add System Setting</DialogTitle>
              <DialogDescription>
                Define a new operational flag or configuration parameter.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="key" className="text-right text-xs">
                  Key
                </Label>
                <div className="col-span-3">
                  <Input
                    id="key"
                    placeholder="enable_new_feature"
                    className="text-xs"
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
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Snake_case only. Max 64 chars.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right text-xs">
                  Category
                </Label>
                <Input
                  id="category"
                  placeholder="ai, security, infrastructure..."
                  className="col-span-3 text-xs"
                  maxLength={32}
                  value={newSetting.category}
                  onChange={(e) =>
                    setNewSetting({ ...newSetting, category: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="value" className="text-right text-xs">
                  Value
                </Label>
                <div className="col-span-3">
                  <Input
                    id="value"
                    placeholder="true, 100, or some text"
                    className="text-xs"
                    maxLength={2048}
                    value={newSetting.value}
                    onChange={(e) =>
                      setNewSetting({ ...newSetting, value: e.target.value })
                    }
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Type is auto-detected (boolean, number, or string).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="desc" className="text-right text-xs">
                  Purpose
                </Label>
                <Input
                  id="desc"
                  placeholder="What does this flag do?"
                  className="col-span-3 text-xs"
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
            <DialogFooter>
              <Button
                onClick={handleAddSetting}
                disabled={updating === "new" || !newSetting.key}
              >
                {updating === "new" ? "Creating..." : "Create Setting"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {categories.map((category) => {
          const catSettings = filteredSettings.filter(
            (s) => s.category === category,
          );
          if (catSettings.length === 0) return null;

          return (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-semibold capitalize">{category}</h3>
                <Badge
                  variant="secondary"
                  className="ml-2 bg-primary/10 text-primary border-none"
                >
                  {catSettings.length}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catSettings.map((setting) => (
                  <Card
                    key={setting.key}
                    className="border-none shadow-sm hover:shadow-md transition-all duration-300 group"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Label
                          className="text-sm font-bold truncate pr-4"
                          title={setting.key}
                        >
                          {setting.key.replace(/_/g, " ")}
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help opacity-0 group-hover:opacity-100 transition-opacity" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs">
                                {setting.description ||
                                  "No description provided."}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {setting.type === "boolean" ? (
                        <div className="flex items-center justify-between mt-2">
                          <span
                            className={`text-xs font-medium ${setting.value_boolean ? "text-green-500" : "text-muted-foreground"}`}
                          >
                            {setting.value_boolean ? "Active" : "Disabled"}
                          </span>
                          <Switch
                            checked={setting.value_boolean}
                            onCheckedChange={() =>
                              handleToggle(setting.key, setting.value_boolean)
                            }
                            disabled={updating === setting.key}
                          />
                        </div>
                      ) : (
                        <div className="mt-1">
                          <Input
                            type={setting.type === "number" ? "number" : "text"}
                            defaultValue={
                              setting.type === "number"
                                ? setting.value_number
                                : setting.value_string
                            }
                            onBlur={(e) =>
                              handleValueChange(
                                setting.key,
                                e.target.value,
                                setting.type,
                              )
                            }
                            disabled={updating === setting.key}
                            className="h-8 text-xs bg-muted/30 border-none focus-visible:ring-1"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {filteredSettings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground/30" />
            <div>
              <h3 className="text-lg font-medium">No settings found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or category filters.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
