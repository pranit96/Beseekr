import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { Info, Search, SlidersHorizontal, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AdminSettings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.getAdminConfig();
      if (res.success) {
        setSettings(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast({
        title: "Error",
        description: "Failed to load system configurations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, currentValue: boolean) => {
    setUpdating(key);
    try {
      const res = await apiClient.updateAdminConfig(key, { 
        value: !currentValue, 
        type: 'boolean' 
      });
      if (res.success) {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value_boolean: !currentValue } : s));
        toast({
          title: "Setting Updated",
          description: `${key} is now ${!currentValue ? 'ENABLED' : 'DISABLED'}.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleValueChange = async (key: string, value: string | number, type: string) => {
    setUpdating(key);
    try {
      const val = type === 'number' ? Number(value) : value;
      const res = await apiClient.updateAdminConfig(key, { value: val, type });
      if (res.success) {
        setSettings(prev => prev.map(s => s.key === key ? { 
          ...s, 
          value_string: type === 'string' ? val : s.value_string,
          value_number: type === 'number' ? val : s.value_number
        } : s));
        toast({
          title: "Setting Updated",
          description: `${key} value saved.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const filteredSettings = settings.filter(s => 
    s.key.toLowerCase().includes(search.toLowerCase()) || 
    s.category.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Array.from(new Set(settings.map(s => s.category)));

  if (loading) return <div className="space-y-4">
    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}
  </div>;

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search settings by name, category, or purpose..." 
          className="pl-10 bg-muted/50 border-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-8">
        {categories.map(category => {
          const catSettings = filteredSettings.filter(s => s.category === category);
          if (catSettings.length === 0) return null;

          return (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-semibold capitalize">{category}</h3>
                <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none">
                  {catSettings.length}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catSettings.map(setting => (
                  <Card key={setting.key} className="border-none shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Label className="text-sm font-bold truncate pr-4" title={setting.key}>
                          {setting.key.replace(/_/g, ' ')}
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help opacity-0 group-hover:opacity-100 transition-opacity" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs">{setting.description || 'No description provided.'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {setting.type === 'boolean' ? (
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs font-medium ${setting.value_boolean ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {setting.value_boolean ? 'Active' : 'Disabled'}
                          </span>
                          <Switch 
                            checked={setting.value_boolean} 
                            onCheckedChange={() => handleToggle(setting.key, setting.value_boolean)}
                            disabled={updating === setting.key}
                          />
                        </div>
                      ) : (
                        <div className="mt-1">
                          <Input 
                            type={setting.type === 'number' ? 'number' : 'text'}
                            defaultValue={setting.type === 'number' ? setting.value_number : setting.value_string}
                            onBlur={(e) => handleValueChange(setting.key, e.target.value, setting.type)}
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
              <p className="text-muted-foreground">Try adjusting your search or category filters.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
