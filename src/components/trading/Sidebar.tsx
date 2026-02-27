import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Briefcase, 
  History, 
  Signal, 
  BarChart3, 
  Globe, 
  Activity,
  Bell,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/trading/overview', icon: LayoutDashboard, label: 'Overview' },
  { to: '/trading/live', icon: TrendingUp, label: 'Live Trading' },
  { to: '/trading/positions', icon: Briefcase, label: 'Positions' },
  { to: '/trading/history', icon: History, label: 'Trade History' },
  { to: '/trading/signals', icon: Signal, label: 'Signals' },
  { to: '/trading/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/trading/market', icon: Globe, label: 'Market' },
  { to: '/trading/system', icon: Activity, label: 'System' },
  { to: '/trading/alerts', icon: Bell, label: 'Alerts' },
  { to: '/trading/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white">Trading System</h1>
        <p className="text-sm text-slate-400 mt-1">Institutional Grade</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500">
          <div>Paper Trading Mode</div>
          <div className="mt-1">v1.0.0</div>
        </div>
      </div>
    </aside>
  );
}
