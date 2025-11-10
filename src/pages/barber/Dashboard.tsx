import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockDb } from '@/services/mockData';
import { Users, Clock, CheckCircle, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalQueue: 0,
    avgWaitTime: 0,
    completedToday: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadStats();

    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = () => {
    try {
      const shopOwners = mockDb.getShopOwners();
      if (!shopOwners || shopOwners.length === 0) return;
      
      const shopOwner = shopOwners[0];
      const allQueues = mockDb.getQueuesByShop(shopOwner.shop_id);

      const waitingQueues = allQueues.filter((q: any) => q.status === 'waiting');
      const completedToday = allQueues.filter((q: any) => {
        if (q.status !== 'completed' || !q.completed_at) return false;
        const completedDate = new Date(q.completed_at);
        const today = new Date();
        return completedDate.toDateString() === today.toDateString();
      });

      const allServices = mockDb.getServices();
      let revenue = 0;
      completedToday.forEach((queue: any) => {
        const queueServices = mockDb.getQueueServicesForQueue(queue.id);
        queueServices.forEach((qs: any) => {
          const service = allServices.find((s: any) => s.id === qs.service_id);
          if (service) revenue += service.price;
        });
      });

      const avgWaitTime = waitingQueues.length > 0
        ? Math.round(waitingQueues.reduce((sum: number, q: any) => sum + (q.estimated_wait || 0), 0) / waitingQueues.length)
        : 0;

      setStats({
        totalQueue: waitingQueues.length,
        avgWaitTime,
        completedToday: completedToday.length,
        revenue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back! Here's your shop overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{stats.totalQueue}</p>
            <p className="text-sm text-muted-foreground">Current Queue</p>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{stats.avgWaitTime} min</p>
            <p className="text-sm text-muted-foreground">Avg. Wait Time</p>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{stats.completedToday}</p>
            <p className="text-sm text-muted-foreground">Completed Today</p>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">₹{stats.revenue}</p>
            <p className="text-sm text-muted-foreground">Today's Revenue</p>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6 bg-card border-border">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="ghost"
            className="p-4 h-auto bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors flex flex-col items-start"
            onClick={() => navigate('/dashboard/queue')}
          >
            <Users className="w-6 h-6 text-primary mb-2" />
            <h4 className="font-semibold">Manage Queue</h4>
            <p className="text-sm text-muted-foreground">View and update customer queue</p>
          </Button>
          <Button
            variant="ghost"
            className="p-4 h-auto bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors flex flex-col items-start"
            onClick={() => navigate('/dashboard/services')}
          >
            <TrendingUp className="w-6 h-6 text-primary mb-2" />
            <h4 className="font-semibold">Update Services</h4>
            <p className="text-sm text-muted-foreground">Manage service offerings</p>
          </Button>
          <Button
            variant="ghost"
            className="p-4 h-auto bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors flex flex-col items-start"
            onClick={() => navigate('/dashboard/shop')}
          >
            <CheckCircle className="w-6 h-6 text-primary mb-2" />
            <h4 className="font-semibold">Shop Settings</h4>
            <p className="text-sm text-muted-foreground">Update shop information</p>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
