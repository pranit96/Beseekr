import { useState } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  type: 'signal' | 'exit' | 'system' | 'info';
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function Alerts() {
  // Mock alerts - in production, these would come from WebSocket or API
  const [alerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'signal',
      severity: 'success',
      title: 'New Signal Generated',
      message: 'RELIANCE - BUY signal with 85% confidence',
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: '2',
      type: 'exit',
      severity: 'warning',
      title: 'Stop Loss Hit',
      message: 'TCS position closed at stop loss',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
    },
    {
      id: '3',
      type: 'system',
      severity: 'info',
      title: 'System Health Check',
      message: 'All systems operational',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true,
    },
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'signal': return TrendingUp;
      case 'exit': return AlertCircle;
      case 'system': return CheckCircle;
      default: return Info;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'text-green-500 bg-green-500/20 border-green-500/30';
      case 'warning': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
      case 'error': return 'text-red-500 bg-red-500/20 border-red-500/30';
      default: return 'text-blue-500 bg-blue-500/20 border-blue-500/30';
    }
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Alerts & Notifications</h1>
          <p className="text-slate-400 mt-1">Stay updated with trading events</p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg">
            <Bell className="h-5 w-5" />
            <span className="font-medium">{unreadCount} unread</span>
          </div>
        )}
      </div>

      {/* Alert Categories */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div className="text-sm text-slate-400">Signals</div>
          </div>
          <div className="text-2xl font-bold text-white">
            {alerts.filter(a => a.type === 'signal').length}
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <div className="text-sm text-slate-400">Exits</div>
          </div>
          <div className="text-2xl font-bold text-white">
            {alerts.filter(a => a.type === 'exit').length}
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            <div className="text-sm text-slate-400">System</div>
          </div>
          <div className="text-2xl font-bold text-white">
            {alerts.filter(a => a.type === 'system').length}
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="h-5 w-5 text-slate-400" />
            <div className="text-sm text-slate-400">Total</div>
          </div>
          <div className="text-2xl font-bold text-white">{alerts.length}</div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
            <Bell className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <div className="text-slate-400 mb-2">No alerts</div>
            <div className="text-sm text-slate-500">You're all caught up!</div>
          </div>
        ) : (
          alerts.map((alert) => {
            const Icon = getIcon(alert.type);
            return (
              <div
                key={alert.id}
                className={cn(
                  'bg-slate-900 rounded-lg border p-4 transition-opacity',
                  getSeverityColor(alert.severity),
                  alert.read && 'opacity-60'
                )}
              >
                <div className="flex items-start gap-4">
                  <Icon className="h-6 w-6 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="font-bold text-white mb-1">{alert.title}</div>
                        <div className="text-sm text-slate-300">{alert.message}</div>
                      </div>
                      {!alert.read && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <div className="font-medium text-blue-400 mb-1">Real-time Alerts</div>
            <div>
              Alerts are delivered in real-time via WebSocket. You'll be notified instantly when:
              new signals are generated, positions hit stop loss or target, system health changes,
              or important market events occur.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
