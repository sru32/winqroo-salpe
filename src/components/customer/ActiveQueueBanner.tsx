import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Users } from 'lucide-react';
import { getActiveQueue } from '@/services/mockActiveQueueApi';
import { Button } from '@/components/ui/button';

interface ActiveQueueBannerProps {
  customerName: string;
  onQueueClick: (queueData: any, service: any, shop: any) => void;
}

const ActiveQueueBanner = ({ customerName, onQueueClick }: ActiveQueueBannerProps) => {
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveQueue();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(loadActiveQueue, 5000);
    return () => clearInterval(interval);
  }, [customerName]);

  const loadActiveQueue = async () => {
    try {
      const { data, error } = await getActiveQueue(customerName);
      if (!error && data) {
        setQueueData(data);
      } else {
        setQueueData(null);
      }
    } catch (error) {
      console.error('Error loading active queue:', error);
      setQueueData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !queueData) {
    return null;
  }

  const handleClick = () => {
    // Extract service and shop info
    const service = queueData.queue_services?.[0]?.services || null;
    const shop = {
      id: queueData.shop_id,
      name: queueData.shops?.name || 'Shop'
    };
    
    onQueueClick(queueData, service, shop);
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className="bg-primary/10 border-primary/30 hover:bg-primary/20 transition-all"
    >
      <div className="flex items-center gap-2">
        <Badge variant="default" className="font-bold">
          #{queueData.position}
        </Badge>
        <div className="flex items-center gap-1 text-xs">
          <Clock className="w-3 h-3" />
          <span>{queueData.estimated_wait}m</span>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {queueData.shops?.name}
        </span>
      </div>
    </Button>
  );
};

export default ActiveQueueBanner;
