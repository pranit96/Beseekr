import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/trading/Sidebar';
import { TopBar } from '@/components/trading/TopBar';
import { useTradingWebSocket } from '@/hooks/useTradingWebSocket';
import { useEffect } from 'react';

export function TradingLayout() {
  const { subscribeToHealth, subscribeToPnL } = useTradingWebSocket();

  useEffect(() => {
    // Subscribe to essential real-time data
    subscribeToHealth();
    subscribeToPnL();
  }, [subscribeToHealth, subscribeToPnL]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
