import { Card } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, MessageSquare } from 'lucide-react';

const Analytics = () => {
  const stats = [
    {
      label: 'Total Messages',
      value: '1,247',
      change: '+12.3%',
      icon: MessageSquare,
    },
    {
      label: 'Active Agents',
      value: '8',
      change: '+2',
      icon: Users,
    },
    {
      label: 'Success Rate',
      value: '94.2%',
      change: '+2.1%',
      icon: TrendingUp,
    },
    {
      label: 'Avg Response Time',
      value: '1.4s',
      change: '-0.3s',
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your agent performance and usage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card
              key={stat.label}
              className="p-6 glass shadow-soft hover:shadow-medium transition-smooth"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `hsl(var(--agent-${(index % 5) + 1}) / 0.15)`,
                  }}
                >
                  <stat.icon
                    className="w-5 h-5"
                    style={{ color: `hsl(var(--agent-${(index % 5) + 1}))` }}
                  />
                </div>
                <span
                  className={`text-sm font-medium ${
                    stat.change.startsWith('+')
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-8 glass shadow-soft">
          <h2 className="text-xl font-semibold mb-4">Usage Overview</h2>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chart visualization coming soon</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
