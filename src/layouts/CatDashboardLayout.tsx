import { useState, useMemo } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/AuthContext';
import { catApi } from '@/api/cat';
import {
    LayoutDashboard,
    BookOpen,
    ListTodo,
    StickyNote,
    Layers,
    FileQuestion,
    Target,
    RotateCcw,
    AlertCircle,
    Bookmark,
    Video,
    BarChart3,
    Settings,
    Moon,
    Sun,
    User,
    LogOut,
    ChevronLeft,
    Menu,
    X,
    Trophy,
    Flame,
    Clock,
    GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import FloatingAITutor from '@/components/cat/FloatingAITutor';

const navigation = [
    { name: 'Dashboard', href: 'dashboard', icon: LayoutDashboard, description: 'Overview & Tasks' },
    { name: 'Learn', href: 'learn', icon: BookOpen, description: 'Topics, Notes & Cards' },
    { name: 'Practice', href: 'practice', icon: Target, description: 'Problems & Mistakes' },
    { name: 'Assess', href: 'assess', icon: FileQuestion, description: 'Mocks & Exams' },
    { name: 'Review', href: 'review', icon: BarChart3, description: 'Analytics & Revisions' },
    { name: 'Resources', href: 'resources', icon: Video, description: 'Study Materials' },
    { name: 'Settings', href: 'settings', icon: Settings, description: 'Preferences' },
];

export function CatDashboardLayout() {
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Fetch quick stats for header
    const { data: dashboard } = useQuery({
        queryKey: ['cat-dashboard-quick'],
        queryFn: () => catApi.getDashboard(),
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });

    // Get due revisions count
    const { data: revisions } = useQuery({
        queryKey: ['cat-revisions-due'],
        queryFn: () => catApi.getRevisions(),
        staleTime: 2 * 60 * 1000,
    });

    const dueRevisions = useMemo(() => {
        if (!revisions || !Array.isArray(revisions)) return 0;
        return revisions.filter(r => r.status === 'pending' || r.status === 'overdue').length;
    }, [revisions]);

    const streak = dashboard?.settings?.current_streak || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl" />
            </div>

            {/* Mobile sidebar backdrop */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 bg-background/95 backdrop-blur-xl border-r border-border/50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between p-4 border-b border-border/50">
                        <Link to="/cat" className="flex items-center gap-3 group">
                            <motion.div
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg"
                            >
                                <GraduationCap className="h-5 w-5 text-white" />
                            </motion.div>
                            <div>
                                <span className="text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                                    CAT Prep
                                </span>
                                <p className="text-xs text-muted-foreground">Master your prep</p>
                            </div>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Quick Stats */}
                    <div className="p-4 border-b border-border/50">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10">
                                <Flame className="h-4 w-4 text-amber-500" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Streak</p>
                                    <p className="text-sm font-semibold">{streak} days</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10">
                                <Clock className="h-4 w-4 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Due</p>
                                    <p className="text-sm font-semibold">{dueRevisions} revisions</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-2 overflow-y-auto">
                        <div className="space-y-1">
                            {navigation.map((item) => {
                                const isActive = location.pathname.includes(`/cat/${item.href}`);
                                return (
                                    <NavLink
                                        key={item.href}
                                        to={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <motion.div
                                            whileHover={{ x: 4 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={cn(
                                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                                isActive
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                            )}
                                        >
                                            <item.icon className={cn('h-4 w-4', isActive && 'text-primary')} />
                                            {item.name}
                                            {item.name === 'Revisions' && dueRevisions > 0 && (
                                                <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">
                                                    {dueRevisions}
                                                </Badge>
                                            )}
                                        </motion.div>
                                    </NavLink>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Back to Main */}
                    <div className="p-4 border-t border-border/50">
                        <Link to="/dashboard/problems">
                            <Button variant="outline" className="w-full justify-start gap-2">
                                <ChevronLeft className="h-4 w-4" />
                                Back to beseekr
                            </Button>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-semibold">
                                    {navigation.find((n) => location.pathname.includes(`/cat/${n.href}`))?.name || 'Dashboard'}
                                </h1>
                            </div>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-2">
                            {/* Countdown to CAT */}
                            {dashboard?.settings?.target_date && (
                                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                    <GraduationCap className="h-4 w-4 text-amber-500" />
                                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                        {Math.max(
                                            0,
                                            Math.ceil(
                                                (new Date(dashboard.settings.target_date).getTime() - Date.now()) /
                                                (1000 * 60 * 60 * 24)
                                            )
                                        )}{' '}
                                        days to CAT
                                    </span>
                                </div>
                            )}

                            {/* Theme Toggle */}
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    className="rounded-lg"
                                >
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={theme}
                                            initial={{ rotate: -90, opacity: 0 }}
                                            animate={{ rotate: 0, opacity: 1 }}
                                            exit={{ rotate: 90, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                        </motion.div>
                                    </AnimatePresence>
                                </Button>
                            </motion.div>

                            {/* Profile */}
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button variant="ghost" size="icon" className="rounded-lg">
                                                <User className="h-5 w-5" />
                                            </Button>
                                        </motion.div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-xl">
                                        <div className="px-3 py-3">
                                            <p className="font-medium">{user.full_name || user.name || 'User'}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                            <Link to="/cat/settings" className="flex items-center w-full">
                                                <Settings className="mr-2 h-4 w-4" />
                                                CAT Settings
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={logout}
                                            className="rounded-lg cursor-pointer text-destructive focus:text-destructive"
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Sign Out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Link to="/auth">
                                    <Button
                                        size="sm"
                                        className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90"
                                    >
                                        Login
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-7xl mx-auto"
                    >
                        <Outlet />
                    </motion.div>
                </main>

                {/* Footer */}
                <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm p-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
                        <span>© {new Date().getFullYear()} CAT Prep by beseekr</span>
                        <div className="flex items-center gap-4">
                            <Link to="/dashboard/problems" className="hover:text-foreground transition-colors">
                                Main Dashboard
                            </Link>
                            <Link to="/contact" className="hover:text-foreground transition-colors">
                                Support
                            </Link>
                        </div>
                    </div>
                </footer>

                {/* Floating AI Tutor */}
                <FloatingAITutor />
            </div>
        </div>
    );
}

export default CatDashboardLayout;
