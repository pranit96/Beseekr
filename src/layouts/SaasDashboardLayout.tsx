import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/AuthContext';
import {
    Compass,
    Search,
    Sparkles,
    ClipboardCheck,
    Bookmark,
    Menu,
    X,
    Moon,
    Sun,
    User,
    LogOut,
    Settings,
    HelpCircle,
    ArrowLeft,
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

const navigation = [
    { name: 'Discover', href: 'problems', icon: Compass, description: 'Find validated problems' },
    { name: 'Search', href: 'search', icon: Search, description: 'Search problems' },
    { name: 'Feed', href: 'feed', icon: Sparkles, description: 'Personalized for you' },
    { name: 'Validate', href: 'validate', icon: ClipboardCheck, description: 'Test your idea' },
    { name: 'Watchlist', href: 'watchlist', icon: Bookmark, description: 'Saved problems' },
];

export function SaasDashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();

    // Load sidebar preference
    useEffect(() => {
        const savedState = sessionStorage.getItem('dashboardSidebarOpen');
        if (savedState !== null) {
            setSidebarOpen(savedState !== 'false');
        }
    }, []);

    // Save sidebar preference
    useEffect(() => {
        sessionStorage.setItem('dashboardSidebarOpen', sidebarOpen.toString());
    }, [sidebarOpen]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyboard = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                setSidebarOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyboard);
        return () => window.removeEventListener('keydown', handleKeyboard);
    }, []);

    const toggleMobileNav = () => setMobileNavOpen(prev => !prev);

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-background">
            {/* Top Bar - Matching existing app style */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
                <div className="mx-auto w-full max-w-[2200px] flex h-16 items-center justify-between px-4 md:px-6">
                    {/* Left Section */}
                    <div className="flex items-center gap-3 min-w-[240px]">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="rounded-lg hover:bg-muted transition-all duration-300 hidden md:flex"
                            aria-label="Toggle sidebar"
                        >
                            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>

                        <Link to="/" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent" />
                            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                CreatuAI
                            </span>
                        </Link>

                        <span className="hidden md:inline-block text-muted-foreground">/</span>
                        <span className="hidden md:inline-block text-sm font-medium text-foreground">
                            Problems Discovery
                        </span>
                    </div>

                    {/* Center Section - Desktop Navigation */}
                    <nav className="hidden lg:flex items-center justify-center gap-1 flex-1">
                        {navigation.map((item) => {
                            const isActive = location.pathname.includes(item.href);
                            return (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2',
                                        isActive
                                            ? 'bg-secondary text-secondary-foreground'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </NavLink>
                            );
                        })}
                    </nav>

                    {/* Right Section */}
                    <div className="flex items-center justify-end gap-2 min-w-[240px]">
                        {/* Back to Chat */}
                        <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                            <Link to="/chat" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Chat
                            </Link>
                        </Button>

                        {/* Mobile Nav Toggle */}
                        <div className="lg:hidden">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleMobileNav}
                                className="rounded-lg hover:bg-muted transition-all duration-300"
                                aria-label="Toggle navigation"
                            >
                                {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>
                        </div>

                        {/* Help / Shortcuts */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.dispatchEvent(new CustomEvent('open-help'))}
                            title="Keyboard shortcuts & help"
                            className="rounded-lg"
                        >
                            <HelpCircle className="h-5 w-5" />
                        </Button>

                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="rounded-lg"
                        >
                            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </Button>

                        {/* Profile Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-lg">
                                    <User className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {user && (
                                    <div className="px-2 py-2">
                                        <p className="text-sm font-medium">{user.full_name || 'User'}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/profile" className="flex items-center w-full cursor-pointer">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Profile Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Animated Mobile Navigation */}
                <AnimatePresence>
                    {mobileNavOpen && (
                        <motion.div
                            key="mobile-nav"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="lg:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl px-4 py-2 shadow-sm"
                        >
                            <nav className="flex flex-col gap-2">
                                {navigation.map((item) => {
                                    const isActive = location.pathname.includes(item.href);
                                    return (
                                        <NavLink
                                            key={item.href}
                                            to={item.href}
                                            onClick={() => setMobileNavOpen(false)}
                                            className={cn(
                                                'px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2',
                                                isActive
                                                    ? 'bg-secondary text-secondary-foreground'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                            )}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.name}
                                        </NavLink>
                                    );
                                })}
                                <Link
                                    to="/chat"
                                    onClick={() => setMobileNavOpen(false)}
                                    className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Chat
                                </Link>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Desktop only */}
                <aside
                    className={cn(
                        'transition-all duration-300 ease-in-out border-r border-border bg-muted/30 flex-shrink-0 hidden md:block',
                        sidebarOpen ? 'w-64 2xl:w-72 opacity-100' : 'w-0 opacity-0'
                    )}
                >
                    <div className="p-4 h-full overflow-y-auto">
                        <div className="space-y-1">
                            {navigation.map((item) => {
                                const isActive = location.pathname.includes(item.href);
                                return (
                                    <NavLink
                                        key={item.href}
                                        to={item.href}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group',
                                            isActive
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                                        )}
                                    >
                                        <item.icon className={cn(
                                            'h-5 w-5 transition-colors',
                                            isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-secondary-foreground'
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                'font-medium text-sm',
                                                !isActive && 'group-hover:text-secondary-foreground'
                                            )}>{item.name}</p>
                                            <p className={cn(
                                                'text-xs truncate',
                                                isActive ? 'text-primary-foreground/70' : 'text-muted-foreground group-hover:text-secondary-foreground/70'
                                            )}>
                                                {item.description}
                                            </p>
                                        </div>
                                    </NavLink>
                                );
                            })}
                        </div>

                        {/* Back to Chat - Sidebar */}
                        <div className="mt-6 pt-6 border-t border-border">
                            <Link
                                to="/chat"
                                className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span className="font-medium text-sm">Back to Chat</span>
                            </Link>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto relative">
                    {/* Subtle background pattern */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                            backgroundSize: '40px 40px'
                        }} />
                    </div>

                    <div className="relative z-10 max-w-6xl mx-auto p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default SaasDashboardLayout;
