import { useState } from "react";
import {
  Settings as SettingsIcon,
  Save,
  User,
  Shield,
  Bell,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    // Risk Management
    maxDrawdown: 20,
    maxPositionSize: 10,
    defaultRiskPercent: 2,

    // Notifications
    signalAlerts: true,
    exitAlerts: true,
    systemAlerts: true,
    emailNotifications: false,

    // Trading Preferences
    autoExecute: false,
    minConfidence: 60,
    preferredStrategies: [] as string[],
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In production, save to backend
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">
          Configure your trading preferences
        </p>
      </div>

      {/* Account Info */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-bold text-white">Account Information</h2>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-sm text-slate-400">Email</div>
            <div className="text-white font-medium">{user?.email}</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Account Type</div>
            <div className="text-white font-medium">Paper Trading</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">User ID</div>
            <div className="text-slate-500 text-sm font-mono">{user?.id}</div>
          </div>
        </div>
      </div>

      {/* Risk Management */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-6 w-6 text-red-500" />
          <h2 className="text-xl font-bold text-white">Risk Management</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Maximum Drawdown (%)
            </label>
            <input
              type="number"
              value={settings.maxDrawdown}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxDrawdown: Number(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
            />
            <div className="text-xs text-slate-500 mt-1">
              Trading will be restricted if portfolio drawdown exceeds this
              limit
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Maximum Position Size (% of portfolio)
            </label>
            <input
              type="number"
              value={settings.maxPositionSize}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxPositionSize: Number(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Default Risk Per Trade (%)
            </label>
            <input
              type="number"
              value={settings.defaultRiskPercent}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultRiskPercent: Number(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-6 w-6 text-yellow-500" />
          <h2 className="text-xl font-bold text-white">Notifications</h2>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-white">Signal Alerts</span>
            <input
              type="checkbox"
              checked={settings.signalAlerts}
              onChange={(e) =>
                setSettings({ ...settings, signalAlerts: e.target.checked })
              }
              className="w-5 h-5 rounded bg-slate-800 border-slate-700"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-white">Exit Alerts</span>
            <input
              type="checkbox"
              checked={settings.exitAlerts}
              onChange={(e) =>
                setSettings({ ...settings, exitAlerts: e.target.checked })
              }
              className="w-5 h-5 rounded bg-slate-800 border-slate-700"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-white">System Alerts</span>
            <input
              type="checkbox"
              checked={settings.systemAlerts}
              onChange={(e) =>
                setSettings({ ...settings, systemAlerts: e.target.checked })
              }
              className="w-5 h-5 rounded bg-slate-800 border-slate-700"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-white">Email Notifications</span>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  emailNotifications: e.target.checked,
                })
              }
              className="w-5 h-5 rounded bg-slate-800 border-slate-700"
            />
          </label>
        </div>
      </div>

      {/* Trading Preferences */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="h-6 w-6 text-green-500" />
          <h2 className="text-xl font-bold text-white">Trading Preferences</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Minimum Signal Confidence (%)
            </label>
            <input
              type="number"
              value={settings.minConfidence}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  minConfidence: Number(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
            />
            <div className="text-xs text-slate-500 mt-1">
              Only show signals with confidence above this threshold
            </div>
          </div>

          <label className="flex items-center justify-between">
            <div>
              <div className="text-white">Auto-Execute Trades</div>
              <div className="text-xs text-slate-500">
                Automatically execute signals (Paper Trading only)
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoExecute}
              onChange={(e) =>
                setSettings({ ...settings, autoExecute: e.target.checked })
              }
              className="w-5 h-5 rounded bg-slate-800 border-slate-700"
            />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {saved && (
          <div className="text-green-500 text-sm font-medium">
            Settings saved successfully!
          </div>
        )}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Save className="h-5 w-5" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
