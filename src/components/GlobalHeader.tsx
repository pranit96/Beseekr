import { useMemo, useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/AuthContext';
import { paymentsApi } from '@/api/payments';
import {
    Compass,
    Sparkles,
    Moon,
    Sun,
    User,
    LogOut,
    Settings,
    TrendingUp,
    CreditCard,
    Clock,
    Activity,
    MessageSquare,
    BookOpen,
    Home,
    Menu,
    X,
    Search,
    Bookmark,
    Zap,
    ChevronDown,
    Bot,
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

/* ─── Primary nav items (always visible on desktop) ─── */
const primaryNavigation = [
    { name: 'Home', href: '/', icon: Home, color: 'from-slate-500 to-zinc-600', exact: true },
    { name: 'Discover', href: '/dashboard/problems', icon: Compass, color: 'from-violet-500 to-purple-600' },
    // { name: 'Trading', href: '/trading', icon: TrendingUp, color: 'from-blue-500 to-indigo-500' },
    // { name: 'Wellness', href: '/wellness', icon: Activity, color: 'from-emerald-500 to-sky-500' },
    { name: 'AI Chat', href: '/chat', icon: MessageSquare, color: 'from-violet-500 to-fuchsia-500' },
    { name: 'Agents', href: '/agents', icon: Bot, color: 'from-cyan-500 to-blue-500' },
    { name: 'Blogs', href: '/blogs', icon: BookOpen, color: 'from-amber-500 to-orange-500' },
];

/* ─── Secondary items shown in "More" dropdown on desktop, always in mobile menu ─── */
const secondaryNavigation = [
    { name: 'Research', href: '/dashboard/validate', icon: Zap },
    { name: 'Watchlist', href: '/dashboard/watchlist', icon: Bookmark },
    { name: 'Pricing', href: '/dashboard/pricing', icon: CreditCard, premiumHide: true },
];

function isPathActive(pathname: string, href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
}

export function GlobalHeader() {
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Save current path so auth flow redirects back after login
    const saveAuthRedirect = () => {
        const currentPath = location.pathname + location.search;
        if (currentPath !== '/auth' && !currentPath.startsWith('/auth/')) {
            sessionStorage.setItem('auth-redirect', currentPath);
        }
    };

    // Fetch plans to get user subscription status
    const { data: plansData } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: () => paymentsApi.getPlans(),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    // Filter secondary nav — hide Pricing for premium users
    const secondaryItems = useMemo(() => {
        const isPremium = plansData?.user?.is_premium === true;
        if (isPremium) return secondaryNavigation.filter(item => !item.premiumHide);
        return secondaryNavigation;
    }, [plansData?.user?.is_premium]);

    const anySecondaryActive = secondaryItems.some(item =>
        isPathActive(location.pathname, item.href)
    );

    return (
        <>
            <header className="sticky top-0 z-50 px-2 sm:px-4 pt-2 sm:pt-3">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="mx-auto max-w-7xl"
                >
                    <div className="flex items-center justify-between rounded-xl sm:rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl px-3 sm:px-5 py-2 sm:py-2.5 shadow-lg shadow-black/5">
                        {/* ── Logo ── */}
                        <Logo className="text-xl sm:text-2xl" linkClassName="shrink-0" />

                        {/* ── Desktop Nav Pills ── */}
                        <nav className="hidden lg:flex items-center gap-0.5 p-1 rounded-xl bg-muted/50">
                            {primaryNavigation.map((item) => {
                                const isActive = isPathActive(location.pathname, item.href, item.exact);
                                return (
                                    <NavLink key={item.href} to={item.href}>
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={cn(
                                                'relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1.5',
                                                isActive
                                                    ? 'text-foreground'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeTab"
                                                    className="absolute inset-0 bg-background rounded-lg shadow-sm border border-border/50"
                                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}
                                            <span className="relative z-10 flex items-center gap-1.5">
                                                <item.icon
                                                    className={cn(
                                                        "h-3.5 w-3.5 transition-colors",
                                                        isActive ? "text-primary" : "text-muted-foreground"
                                                    )}
                                                />
                                                {item.name}
                                            </span>
                                        </motion.div>
                                    </NavLink>
                                );
                            })}

                            {/* More dropdown for secondary items */}
                            {secondaryItems.length > 0 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className={cn(
                                                'relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1 outline-none',
                                                anySecondaryActive
                                                    ? 'text-foreground bg-background shadow-sm border border-border/50'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            More
                                            <ChevronDown className="h-3 w-3" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                        {secondaryItems.map((item) => {
                                            const isActive = isPathActive(location.pathname, item.href);
                                            return (
                                                <DropdownMenuItem key={item.href} asChild className="rounded-lg cursor-pointer">
                                                    <Link to={item.href} className={cn(
                                                        "flex items-center gap-2 w-full",
                                                        isActive && "text-primary font-medium"
                                                    )}>
                                                        <item.icon className="h-4 w-4" />
                                                        {item.name}
                                                    </Link>
                                                </DropdownMenuItem>
                                            );
                                        })}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </nav>

                        {/* ── Tablet Nav (icons only, md–lg) ── */}
                        <nav className="hidden md:flex lg:hidden items-center gap-0.5 p-0.5 rounded-lg bg-muted/50">
                            {primaryNavigation.map((item) => {
                                const isActive = isPathActive(location.pathname, item.href, item.exact);
                                return (
                                    <NavLink key={item.href} to={item.href} className="relative" title={item.name}>
                                        <motion.div
                                            whileTap={{ scale: 0.95 }}
                                            className={cn(
                                                'relative p-2 rounded-md transition-all duration-200',
                                                isActive
                                                    ? 'bg-background shadow-sm border border-border/50'
                                                    : 'hover:bg-muted/50'
                                            )}
                                        >
                                            <item.icon
                                                className={cn(
                                                    "h-4 w-4 transition-colors",
                                                    isActive ? "text-primary" : "text-muted-foreground"
                                                )}
                                            />
                                        </motion.div>
                                    </NavLink>
                                );
                            })}
                        </nav>

                        {/* ── Right Controls ── */}
                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                            {/* Trial Badge */}
                            {user?.trial?.active && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20"
                                >
                                    <Clock className="h-3 w-3 text-primary" />
                                    <span className="text-xs font-medium text-primary">
                                        {user.trial.days_remaining} {user.trial.days_remaining === 1 ? 'day' : 'days'} left
                                    </span>
                                </motion.div>
                            )}

                            {/* Theme Toggle */}
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    className="rounded-lg sm:rounded-xl h-8 w-8 sm:h-9 sm:w-9"
                                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                                >
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={theme}
                                            initial={{ rotate: -90, opacity: 0 }}
                                            animate={{ rotate: 0, opacity: 1 }}
                                            exit={{ rotate: 90, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {theme === 'dark' ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
                                        </motion.div>
                                    </AnimatePresence>
                                </Button>
                            </motion.div>

                            {/* Profile / Login */}
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button variant="ghost" size="icon" className="rounded-lg sm:rounded-xl h-8 w-8 sm:h-9 sm:w-9" aria-label="User menu">
                                                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                                            </Button>
                                        </motion.div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-xl">
                                        <div className="px-3 py-3">
                                            <p className="font-medium">{user.full_name || user.name || 'User'}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                            {user.trial?.active && (
                                                <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 w-fit">
                                                    <Clock className="h-3 w-3 text-primary" />
                                                    <span className="text-xs font-medium text-primary">
                                                        Trial: {user.trial.days_remaining} {user.trial.days_remaining === 1 ? 'day' : 'days'} left
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                            <Link to="/dashboard/profile" className="flex items-center w-full">
                                                <Settings className="mr-2 h-4 w-4" />
                                                Settings
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={logout} className="rounded-lg cursor-pointer text-destructive focus:text-destructive">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Sign Out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="hidden sm:block">
                                    <Link to="/auth" onClick={saveAuthRedirect}>
                                        <Button
                                            size="sm"
                                            className="rounded-lg sm:rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9"
                                        >
                                            Login / Sign Up
                                        </Button>
                                    </Link>
                                </motion.div>
                            )}

                            {/* Mobile Hamburger */}
                            <motion.div whileTap={{ scale: 0.95 }} className="md:hidden">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setMobileOpen(prev => !prev)}
                                    className="rounded-lg h-8 w-8"
                                    aria-label="Toggle menu"
                                >
                                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </header>

            {/* ── Mobile Full-Screen Menu ── */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        key="mobile-nav-overlay"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="fixed inset-x-0 top-[56px] z-40 md:hidden border-b border-border/50 bg-background/95 backdrop-blur-xl shadow-xl max-h-[calc(100vh-56px)] overflow-y-auto"
                    >
                        <nav className="px-4 py-3 space-y-1">
                            {/* Primary items */}
                            {primaryNavigation.map((item) => {
                                const isActive = isPathActive(location.pathname, item.href, item.exact);
                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                                            isActive
                                                ? 'bg-primary/10 text-primary border border-primary/20'
                                                : 'text-foreground hover:bg-muted'
                                        )}
                                    >
                                        <div className={cn(
                                            'h-8 w-8 rounded-lg flex items-center justify-center',
                                            isActive
                                                ? `bg-gradient-to-br ${item.color} shadow-md`
                                                : 'bg-muted'
                                        )}>
                                            <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-muted-foreground")} />
                                        </div>
                                        {item.name}
                                        {isActive && (
                                            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                                        )}
                                    </Link>
                                );
                            })}

                            {/* Divider */}
                            <div className="border-t border-border/50 my-2" />

                            {/* Secondary items */}
                            {secondaryItems.map((item) => {
                                const isActive = isPathActive(location.pathname, item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                            isActive
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.name}
                                    </Link>
                                );
                            })}

                            {/* Login button for mobile guests */}
                            {!user && (
                                <>
                                    <div className="border-t border-border/50 my-2" />
                                    <Link
                                        to="/auth"
                                        onClick={() => { saveAuthRedirect(); setMobileOpen(false); }}
                                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-accent text-white shadow-md"
                                    >
                                        Login / Sign Up
                                    </Link>
                                </>
                            )}

                            {/* Logout for mobile users */}
                            {user && (
                                <>
                                    <div className="border-t border-border/50 my-2" />
                                    <button
                                        onClick={() => { logout(); setMobileOpen(false); }}
                                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign Out
                                    </button>
                                </>
                            )}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
