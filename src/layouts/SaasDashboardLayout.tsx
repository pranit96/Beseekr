import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/AuthContext';
import {
    Compass,
    Sparkles,
    ClipboardCheck,
    Bookmark,
    Moon,
    Sun,
    User,
    LogOut,
    Settings,
    ArrowLeft,
    Zap,
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
    { name: 'Research', href: 'validate', icon: Zap, color: 'from-emerald-500 to-cyan-500', subtitle: 'Test your ideas' },
    { name: 'Watchlist', href: 'watchlist', icon: Bookmark, color: 'from-amber-500 to-orange-500' },
];

export function SaasDashboardLayout() {
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();

    // Get current page title
    const currentPage = navigation.find(n => location.pathname.includes(n.href));

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
            </div>

            {/* Floating Header */}
            <header className="sticky top-0 z-50 px-4 pt-4">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="mx-auto max-w-6xl"
                >
                    <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl px-6 py-3 shadow-lg shadow-black/5">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <motion.div
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
                            >
                                <Sparkles className="h-5 w-5 text-white" />
                            </motion.div>
                            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                                CreatuAI
                            </span>
                        </Link>

                        {/* Nav Pills */}
                        <nav className="flex items-center gap-1 p-1 rounded-xl bg-muted/50">
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
                                                'relative px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2',
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
                                                <item.icon className={cn(
                                                    "h-4 w-4 transition-colors",
                                                    isActive && `bg-gradient-to-r ${item.color} bg-clip-text`
                                                )}
                                                    style={isActive ? { color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text' } : {}}
                                                />
                                                {item.name}
                                            </span>
                                        </motion.div>
                                    </NavLink>
                                );
                            })}
                        </nav>

                        {/* Right Controls */}
                        <div className="flex items-center gap-2">

                            {/* Theme Toggle */}
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    className="rounded-xl"
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

                            {/* Profile - show for logged users, Login for guests */}
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button variant="ghost" size="icon" className="rounded-xl">
                                                <User className="h-5 w-5" />
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
                                        <Button className="rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
                                            Login / Sign Up
                                        </Button>
                                    </Link>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 px-4 py-8">
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
        </div>
    );
}

export default SaasDashboardLayout;
