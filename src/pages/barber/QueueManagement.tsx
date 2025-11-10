import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockDb } from '@/services/mockData';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

interface Service {
  name: string;
  duration: number;
  price: number;
}

interface QueueEntry {
  id: string;
  customer_name: string;
  position: number;
  estimated_wait: number;
  status: string;
  joined_at: string;
  services: Service;
  queue_services?: Array<{
    services: Service;
  }>;
}

const QueueManagement = () => {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
    // Poll for updates every 3 seconds
    const interval = setInterval(loadQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadQueue = () => {
    try {
      const shopOwners = mockDb.getShopOwners();
      if (!shopOwners || shopOwners.length === 0) {
        setLoading(false);
        return;
      }

      const shopOwner = shopOwners[0];
      setShopId(shopOwner.shop_id);

      const allQueues = mockDb.getQueuesByShop(shopOwner.shop_id);
      const waitingQueues = allQueues.filter((q: any) => q.status === 'waiting');

      // Enrich with services data
      const enrichedQueues = waitingQueues.map((q: any) => {
        const primaryService = mockDb.getService(q.service_id);
        const queueServices = mockDb.getQueueServicesForQueue(q.id);
        const services = queueServices.map((qs: any) => {
          const service = mockDb.getService(qs.service_id);
          return service ? { services: service } : null;
        }).filter(Boolean);

        return {
          ...q,
          services: primaryService,
          queue_services: services,
        };
      });

      // Sort by position
      enrichedQueues.sort((a: any, b: any) => a.position - b.position);

      setQueue(enrichedQueues as QueueEntry[]);
    } catch (error) {
      console.error('Error loading queue:', error);
      toast.error('Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  const markAsComplete = (queueId: string) => {
    try {
      mockDb.updateQueue(queueId, { status: 'completed', completed_at: new Date().toISOString() });
      toast.success('Customer marked as complete');
      loadQueue();
    } catch (error) {
      console.error('Error marking complete:', error);
      toast.error('Failed to update queue');
    }
  };

  const cancelEntry = (queueId: string) => {
    try {
      mockDb.updateQueue(queueId, { status: 'cancelled' });
      toast.success('Queue entry cancelled');
      loadQueue();
    } catch (error) {
      console.error('Error cancelling:', error);
      toast.error('Failed to cancel entry');
    }
  };

  const moveUp = (entry: QueueEntry) => {
    if (entry.position === 1) return;
    
    try {
      const prevEntry = queue.find(q => q.position === entry.position - 1);
      if (!prevEntry) return;

      mockDb.updateQueue(prevEntry.id, { position: entry.position });
      mockDb.updateQueue(entry.id, { position: entry.position - 1 });
      
      toast.success('Position updated');
      loadQueue();
    } catch (error) {
      console.error('Error moving up:', error);
      toast.error('Failed to update position');
    }
  };

  const moveDown = (entry: QueueEntry) => {
    if (entry.position === queue.length) return;
    
    try {
      const nextEntry = queue.find(q => q.position === entry.position + 1);
      if (!nextEntry) return;

      mockDb.updateQueue(nextEntry.id, { position: entry.position });
      mockDb.updateQueue(entry.id, { position: entry.position + 1 });
      
      toast.success('Position updated');
      loadQueue();
    } catch (error) {
      console.error('Error moving down:', error);
      toast.error('Failed to update position');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Queue Management</h2>
        <p className="text-muted-foreground">Manage your customers waiting in queue</p>
      </div>

      {queue.length === 0 ? (
        <Card className="p-12 text-center bg-card border-border">
          <p className="text-xl text-muted-foreground">No customers in queue</p>
          <p className="text-sm text-muted-foreground mt-2">Customers will appear here when they join your queue</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {queue.map((entry) => (
            <Card key={entry.id} className="p-6 bg-card border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="text-lg font-bold">
                      #{entry.position}
                    </Badge>
                    <h3 className="text-xl font-bold">{entry.customer_name}</h3>
                  </div>
                  
                  <div className="space-y-1 text-muted-foreground">
                    {entry.queue_services && entry.queue_services.length > 0 ? (
                      <>
                        <p className="font-semibold text-foreground mb-1">Services ({entry.queue_services.length}):</p>
                        {entry.queue_services.map((qs, idx) => (
                          <div key={idx} className="ml-2 mb-1">
                            <p>• {qs.services.name} - {qs.services.duration} min - ₹{qs.services.price}</p>
                          </div>
                        ))}
                        <p className="font-semibold mt-2">
                          Total: {entry.queue_services.reduce((sum, qs) => sum + qs.services.duration, 0)} min - 
                          ₹{entry.queue_services.reduce((sum, qs) => sum + qs.services.price, 0)}
                        </p>
                      </>
                    ) : entry.services ? (
                      <>
                        <p>Service: <span className="text-foreground font-semibold">{entry.services.name}</span></p>
                        <p>Duration: {entry.services.duration} min</p>
                        <p>Price: ₹{entry.services.price}</p>
                      </>
                    ) : null}
                    <p>Wait Time: ~{entry.estimated_wait} min</p>
                    <p className="text-sm">Joined: {new Date(entry.joined_at).toLocaleTimeString()}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveUp(entry)}
                      disabled={entry.position === 1}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveDown(entry)}
                      disabled={entry.position === queue.length}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => markAsComplete(entry.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => cancelEntry(entry.id)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QueueManagement;
