//side bar
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MessageSquare, Users, BarChart3, User, Download } from "lucide-react";

import { useTranslation } from "react-i18next";

const navigation = [
  { key: "chat", href: "/", icon: MessageSquare },
  { key: "agents", href: "/agents", icon: Users },
  { key: "analytics", href: "/analytics", icon: BarChart3 },
  { key: "profile", href: "/profile", icon: User },
];

export const Sidebar = () => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <aside className="w-72 2xl:w-96 border-r border-border bg-sidebar h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {t("sidebar.title")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {t("sidebar.subtitle")}
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.key}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "hover:bg-sidebar-accent text-sidebar-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-smooth",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                )}
              />
              <span className="font-medium">{t(`sidebar.${item.key}`)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-smooth text-sidebar-foreground group">
          <Download className="w-5 h-5 text-muted-foreground group-hover:text-sidebar-accent-foreground transition-smooth" />
          <span className="font-medium">{t("sidebar.exportData")}</span>
        </button>
      </div>
    </aside>
  );
};
