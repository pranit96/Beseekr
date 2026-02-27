import { useTradingWebSocket } from '@/hooks/useTradingWebSocket';
import { useAuth } from '@/contexts/AuthContext';
import { Wifi, WifiOff, AlertCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TopBar() {
  const { user } = useAuth();
  const { wsState, systemHealth, realtimePnL } = useTradingWebSocket();

  const getConnectionStatus = () => {
    if (wsState.reconnecting) {
      return { icon: AlertCircle, text: 'Reconnecting...', color: 'text-yellow-500' };
    }
    if (!wsState.connected) {
      return { icon: WifiOff, text: 'Disconnected', color: 'text-red-500' };
    }
    return { icon: Wifi, text: 'Connected', color: 'text-green-500' };
  };

  const status = getConnectionStatus();
  const StatusIcon = status.icon;

  const getZerodhaStatus = () => {
    if (!systemHealth) return { text: 'Unknown', color: 'text-slate-500' };
    
    const zerodha = systemHealth.services.zerodha;
    if (zerodha.status === 'healthy') {
      return { text: 'Connected', color: 'text-green-500' };
    }
    if (zerodha.status === 'degraded') {
      return { text: 'Degraded', color: 'text-yellow-500' };
    }
    return { text: 'Disconnected', color: 'text-red-500' };
  };

  const zerodhaStatus = getZerodhaStatus();

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        {/* WebSocket Status */}
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('h-4 w-4', status.color)} />
          <span className={cn('text-sm font-medium', status.color)}>
            {status.text}
          </span>
        </div>

        {/* Zerodha Status */}
        <div className="flex items-center gap-2 pl-6 border-l border-slate-700">
          <div className={cn('h-2 w-2 rounded-full', zerodhaStatus.color.replace('text-', 'bg-'))} />
          <span className="text-sm text-slate-400">
            Zerodha: <span className={zerodhaStatus.color}>{zerodhaStatus.text}</span>
          </span>
        </div>

        {/* Real-time P&L */}
        {realtimePnL && (
          <div className="flex items-center gap-4 pl-6 border-l border-slate-700">
            <div>
              <div className="text-xs text-slate-500">Today's P&L</div>
              <div className={cn(
                'text-sm font-bold',
                realtimePnL.total_pnl >= 0 ? 'text-green-500' : 'text-red-500'
              )}>
                ₹{realtimePnL.total_pnl.toFixed(2)} ({realtimePnL.total_pnl_percent.toFixed(2)}%)
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Portfolio Value</div>
              <div className="text-sm font-bold text-white">
                ₹{realtimePnL.total_value.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium text-white">{user?.email}</div>
          <div className="text-xs text-slate-500">Paper Trading</div>
        </div>
        <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
          <User className="h-5 w-5 text-slate-300" />
        </div>
      </div>
    </header>
  );
}
