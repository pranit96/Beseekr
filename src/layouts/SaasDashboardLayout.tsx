import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    Compass,
    Search,
    Sparkles,
    ClipboardCheck,
    Bookmark,
    Menu,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navigation = [
    { name: 'Discover Problems', href: 'problems', icon: Compass },
    { name: 'Search', href: 'search', icon: Search },
    { name: 'Personalized Feed', href: 'feed', icon: Sparkles },
    { name: 'Validate Idea', href: 'validate', icon: ClipboardCheck },
    { name: 'Watchlist', href: 'watchlist', icon: Bookmark },
];

export function SaasDashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    return (
        <div className="min-h-screen bg-background">
            {/* Top Navigation */}
            <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-14 items-center px-4 gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                    <h1 className="text-lg font-semibold">Problems Discovery</h1>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside
                    className={cn(
                        'fixed inset-y-0 left-0 z-30 w-64 transform border-r border-border bg-background pt-14 transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:pt-0',
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    )}
                >
                    <nav className="flex flex-col gap-1 p-4">
                        {navigation.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    )
                                }
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                </aside>

                {/* Backdrop for mobile */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-20 bg-black/50 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default SaasDashboardLayout;
