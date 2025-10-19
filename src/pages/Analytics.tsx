import { useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Activity, MessageSquare, Zap, DollarSign } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { useUsageStats } from '@/hooks/use-api-queries';

const Analytics = () => {
  const { toast } = useToast();

  const startDate = useMemo(() => {
    return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
  }, []);

  const { data: statsResponse, isLoading: loading, error } = useUsageStats({
    start_date: startDate,
  });

  const stats = statsResponse?.data;

  // Show error toast if query fails (only once)
  useEffect(() => {
    if (error) {
      toast({
        title: 'Failed to load analytics',
        description: (error as any).message,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  if (loading) {
    return (
      <>
        <TopBar />
        <div className="h-full flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
        </div>
      </>
    );
  }

  const statCards = [
    {
      title: 'Total Requests',
      value: stats?.totalRequests || 0,
      icon: Activity,
      color: 'hsl(var(--agent-1))',
    },
    {
      title: 'Messages Sent',
      value: stats?.actionBreakdown?.message_sent?.count || 0,
      icon: MessageSquare,
      color: 'hsl(var(--agent-2))',
    },
    {
      title: 'Orchestrations',
      value: stats?.actionBreakdown?.orchestration_executed?.count || 0,
      icon: Zap,
      color: 'hsl(var(--agent-3))',
    },
    {
      title: 'Total Cost',
      value: `$${(stats?.totalCost || 0).toFixed(4)}`,
      icon: DollarSign,
      color: 'hsl(var(--agent-4))',
    },
  ];

  return (
    <>
      <TopBar />
      <div className="mx-auto p-4 sm:p-6 md:p-8 max-w-[2200px]">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Track your usage and performance over the last 30 days
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {statCards.map((stat, index) => (
            <Card
              key={index}
              className="p-6 glass hover:shadow-glow transition-smooth"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.title}</div>
            </Card>
          ))}
        </div>

        {stats?.actionBreakdown && (
          <Card className="p-6 glass">
            <h2 className="text-xl font-semibold mb-4">Usage Breakdown</h2>
            <div className="space-y-4">
              {Object.entries(stats.actionBreakdown).map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div>
                    <div className="font-medium capitalize">{key.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-muted-foreground">
                      {value.tokens.toLocaleString()} tokens
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{value.count} requests</div>
                    <div className="text-sm text-muted-foreground">
                      ${value.cost.toFixed(4)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!stats?.totalRequests && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No usage data available yet. Start using agents to see analytics!</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Analytics;