// Enhanced Section Tabs - Better UX for internal module navigation
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

export interface SectionTabItem {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
  badge?: number | string;
  badgeVariant?: "default" | "destructive" | "secondary";
}

interface SectionTabsProps {
  tabs: SectionTabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function SectionTabs({
  tabs,
  value,
  onValueChange,
  className,
}: SectionTabsProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Desktop: Card-style tabs with descriptions */}
      <div className="hidden md:flex items-stretch gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = value === tab.value;

          return (
            <motion.button
              key={tab.value}
              onClick={() => onValueChange(tab.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                isActive
                  ? "bg-primary/5 border-primary/30 shadow-sm"
                  : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border/50",
              )}
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  isActive ? "bg-primary/10" : "bg-muted",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "font-medium text-sm",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {tab.label}
                  </p>
                  {tab.badge !== undefined && (
                    <Badge
                      variant={tab.badgeVariant || "secondary"}
                      className="h-5 px-1.5 text-xs"
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {tab.description}
                </p>
              </div>
              {isActive && (
                <motion.div
                  layoutId="section-tab-indicator"
                  className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Mobile: Compact pill tabs */}
      <div className="md:hidden flex items-center gap-1 p-1 rounded-lg bg-muted/50 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = value === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => onValueChange(tab.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md transition-all whitespace-nowrap",
                isActive ? "bg-background shadow-sm" : "hover:bg-background/50",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {tab.label}
              </span>
              {tab.badge !== undefined && (
                <Badge
                  variant={tab.badgeVariant || "secondary"}
                  className="h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  {tab.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
