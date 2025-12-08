import { useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/AuthContext';
import {
    Compass,
    Sparkles,
    Bookmark,
    Moon,
    Sun,
    User,
    LogOut,
    Settings,
    Zap,
    CreditCard,
    Menu,
    X,
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
    { name: 'Discover', href: 'problems', icon: Compass, color: 'from-violet-500 to-purple-600' },
    { name: 'Research', href: 'validate', icon: Zap, color: 'from-emerald-500 to-cyan-500' },
    { name: 'Watchlist', href: 'watchlist', icon: Bookmark, color: 'from-amber-500 to-orange-500' },
    { name: 'Pricing', href: 'pricing', icon: CreditCard, color: 'from-pink-500 to-rose-500' },
];

export function SaasDashboardLayout() {
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
            </div>

            {/* Floating Header */}
            <header className="sticky top-0 z-50 px-2 sm:px-4 pt-2 sm:pt-4">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="mx-auto max-w-6xl"
                >
                    <div className="flex items-center justify-between rounded-xl sm:rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl px-3 sm:px-6 py-2 sm:py-3 shadow-lg shadow-black/5">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
                            <motion.div
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
                            >
                                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </motion.div>
                            <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                                beseekr
                            </span>
                        </Link>

                        {/* Desktop Nav Pills - Hidden on mobile */}
                        <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-muted/50">
                            {navigation.map((item) => {
                                const isActive = location.pathname.includes(item.href);
                                return (
                                    <NavLink
                                        key={item.href}
                                        to={item.href}
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={cn(
                                                'relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2',
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
                                            <span className="relative z-10 flex items-center gap-2">
                                                <item.icon
                                                    className={cn(
                                                        "h-4 w-4 transition-colors",
                                                        isActive
                                                            ? "text-primary"
                                                            : "text-muted-foreground"
                                                    )}
                                                />
                                                {item.name}
                                            </span>
                                        </motion.div>
                                    </NavLink>
                                );
                            })}
                        </nav>

                        {/* Mobile Nav - Icon only */}
                        <nav className="flex md:hidden items-center gap-0.5 p-0.5 rounded-lg bg-muted/50">
                            {navigation.map((item) => {
                                const isActive = location.pathname.includes(item.href);
                                return (
                                    <NavLink
                                        key={item.href}
                                        to={item.href}
                                        className="relative"
                                    >
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
                                                    isActive
                                                        ? "text-primary"
                                                        : "text-muted-foreground"
                                                )}
                                            />
                                        </motion.div>
                                    </NavLink>
                                );
                            })}
                        </nav>

                        {/* Right Controls */}
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            {/* Theme Toggle */}
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    className="rounded-lg sm:rounded-xl h-8 w-8 sm:h-9 sm:w-9"
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

                            {/* Profile - show for logged users, Login for guests */}
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button variant="ghost" size="icon" className="rounded-lg sm:rounded-xl h-8 w-8 sm:h-9 sm:w-9">
                                                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                                            </Button>
                                        </motion.div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-xl">
                                        <div className="px-3 py-3">
                                            <p className="font-medium">{user.full_name || 'User'}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                            <Link to="/profile" className="flex items-center w-full">
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
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Link to="/auth">
                                        <Button
                                            size="sm"
                                            className="rounded-lg sm:rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9"
                                        >
                                            <span className="hidden sm:inline">Login / Sign Up</span>
                                            <span className="sm:hidden">Login</span>
                                        </Button>
                                    </Link>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 px-2 sm:px-4 py-4 sm:py-8 flex-1">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="mx-auto max-w-6xl"
                >
                    <Outlet />
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-border/50 bg-background/50 backdrop-blur-sm mt-8">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Left - Brand & Copyright */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span>© {new Date().getFullYear()} beseekr. All rights reserved.</span>
                        </div>

                        {/* Center - Links */}
                        <div className="flex items-center gap-4 sm:gap-6 text-sm">
                            <Link
                                to="/privacy"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Privacy Policy
                            </Link>
                            <Link
                                to="/dashboard/pricing"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Pricing
                            </Link>
                            <a
                                href="mailto:hello@beseekr.com"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Contact Us
                            </a>
                        </div>

                        {/* Right - Social/Extra */}
                        <div className="text-xs text-muted-foreground/60">
                            Made with ♥ in India
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default SaasDashboardLayout;
