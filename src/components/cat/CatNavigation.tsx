// CAT Module Navigation - Unified navigation for CAT Prep sections
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    BookOpen,
    Target,
    LineChart,
    FileQuestion,
} from 'lucide-react';

const catModules = [
    {
        name: 'Home',
        href: '/cat/dashboard',
        icon: LayoutDashboard,
        description: 'Overview & Tasks',
        color: 'text-violet-500',
    },
    {
        name: 'Learn',
        href: '/cat/learn',
        icon: BookOpen,
        description: 'Topics & Concepts',
        color: 'text-blue-500',
    },
    {
        name: 'Practice',
        href: '/cat/practice',
        icon: Target,
        description: 'Problems & Mistakes',
        color: 'text-emerald-500',
    },
    {
        name: 'Review',
        href: '/cat/review',
        icon: LineChart,
        description: 'Analytics & Revisions',
        color: 'text-amber-500',
    },
    {
        name: 'Assess',
        href: '/cat/assess',
        icon: FileQuestion,
        description: 'Mocks & Exams',
        color: 'text-rose-500',
    },
];

export function CatNavigation() {
    const location = useLocation();

    return (
        <nav className="mb-6">
            {/* Desktop: Horizontal tabs with descriptions */}
            <div className="hidden md:flex items-center gap-2 p-1.5 rounded-xl bg-muted/50 border border-border/30">
                {catModules.map((module) => {
                    const Icon = module.icon;
                    const isActive = location.pathname === module.href ||
                        (module.href !== '/cat/dashboard' && location.pathname.startsWith(module.href));

                    return (
                        <NavLink
                            key={module.href}
                            to={module.href}
                            className="flex-1"
                        >
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all",
                                    isActive
                                        ? "bg-background shadow-md"
                                        : "hover:bg-background/50"
                                )}
                            >
                                <Icon className={cn(
                                    "h-5 w-5 flex-shrink-0",
                                    isActive ? module.color : "text-muted-foreground"
                                )} />
                                <div className="min-w-0">
                                    <p className={cn(
                                        "font-medium text-sm truncate",
                                        isActive ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        {module.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {module.description}
                                    </p>
                                </div>
                                {isActive && (
                                    <motion.div
                                        layoutId="cat-nav-indicator"
                                        className={cn("absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full", module.color.replace('text-', 'bg-'))}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </motion.div>
                        </NavLink>
                    );
                })}
            </div>

            {/* Mobile: Compact icon tabs */}
            <div className="md:hidden flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border/30 overflow-x-auto">
                {catModules.map((module) => {
                    const Icon = module.icon;
                    const isActive = location.pathname === module.href ||
                        (module.href !== '/cat/dashboard' && location.pathname.startsWith(module.href));

                    return (
                        <NavLink
                            key={module.href}
                            to={module.href}
                            className="flex-1 min-w-0"
                        >
                            <div className={cn(
                                "flex flex-col items-center gap-1 px-2 py-2 rounded-md transition-colors",
                                isActive
                                    ? "bg-background shadow-sm"
                                    : "hover:bg-background/50"
                            )}>
                                <Icon className={cn(
                                    "h-5 w-5",
                                    isActive ? module.color : "text-muted-foreground"
                                )} />
                                <span className={cn(
                                    "text-[10px] font-medium truncate w-full text-center",
                                    isActive ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {module.name}
                                </span>
                            </div>
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
}
