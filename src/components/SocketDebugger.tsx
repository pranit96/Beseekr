// Temporary debugging component for Socket.IO subscription issues
import { useEffect, useState } from 'react';
import { deepAnalyticsSocket } from '@/services/deepAnalyticsSocket';

export function SocketDebugger() {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentStats = deepAnalyticsSocket.getStats();
      setStats(currentStats);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-20), `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    // Log stats changes
    if (stats) {
      addLog(`Stats: connected=${stats.connected}, userId=${stats.userId}, subs=${stats.activeSubscriptions.length}`);
    }
  }, [stats]);

  if (!stats) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: 'rgba(0,0,0,0.9)',
      color: '#0f0',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '11px',
      fontFamily: 'monospace',
      maxWidth: '400px',
      maxHeight: '300px',
      overflow: 'auto',
      zIndex: 9999
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🔍 Socket Debugger</div>
      <div>Connected: {stats.connected ? '✅' : '❌'}</div>
      <div>Socket ID: {stats.socketId || 'N/A'}</div>
      <div>User ID: {stats.userId || 'N/A'}</div>
      <div>Tier: {stats.tier || 'N/A'}</div>
      <div>Active Subscriptions: {stats.activeSubscriptions.length}</div>
      {stats.activeSubscriptions.length > 0 && (
        <div style={{ marginTop: '5px' }}>
          Sessions:
          {stats.activeSubscriptions.map((sid: string) => (
            <div key={sid} style={{ marginLeft: '10px', fontSize: '10px' }}>
              • {sid.substring(0, 8)}...
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: '10px', borderTop: '1px solid #0f0', paddingTop: '5px' }}>
        <div style={{ fontWeight: 'bold' }}>Recent Logs:</div>
        {logs.slice(-5).map((log, i) => (
          <div key={i} style={{ fontSize: '9px', opacity: 0.8 }}>{log}</div>
        ))}
      </div>
    </div>
  );
}
