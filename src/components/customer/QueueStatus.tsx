import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Users, CheckCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import RatingDialog from './RatingDialog';
import { mockDb } from '@/services/mockData';

const QueueStatus = ({ queueData, service, shop, onBack }) => {
  const services = Array.isArray(service) ? service : [service];
  const [currentPosition, setCurrentPosition] = useState(queueData?.position || 1);
  const [estimatedWait, setEstimatedWait] = useState(queueData?.estimatedWait || 30);
  const [queueStatus, setQueueStatus] = useState(queueData?.status || 'waiting');
  const [hasRated, setHasRated] = useState(!!queueData?.rating);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [liveQueue, setLiveQueue] = useState([]);

  useEffect(() => {
    if (!queueData?.id || !shop?.id) return;

    // Load initial live queue
    loadLiveQueue();

    // Poll for updates every 3 seconds
    const interval = setInterval(() => {
      const queue = mockDb.getQueue(queueData.id);
      if (queue) {
        setCurrentPosition(queue.position);
        setEstimatedWait(queue.estimated_wait);
        setQueueStatus(queue.status);
        
        if (queue.position === 1 && queue.status === 'waiting') {
          toast.success("You're next! Please head to the shop.");
        }
        
        if (queue.status === 'completed' && !hasRated) {
          toast.success('Service completed! Please rate your experience.');
          setShowRatingDialog(true);
        }
      }
      loadLiveQueue();
    }, 3000);

    return () => clearInterval(interval);
  }, [queueData?.id, hasRated, shop?.id]);

  const loadLiveQueue = async () => {
    if (!shop?.id) return;

    try {
      const queues = mockDb.getQueuesByShop(shop.id);
      const waitingQueues = queues
        .filter((q: any) => q.status === 'waiting')
        .sort((a: any, b: any) => a.position - b.position);
      
      // Enrich with services info
      const enrichedQueues = waitingQueues.map((q: any) => {
        const queueServices = mockDb.getQueueServicesForQueue(q.id);
        const services = queueServices.map((qs: any) => {
          const service = mockDb.getService(qs.service_id);
          return { services: { name: service?.name || 'Service' } };
        });
        return {
          ...q,
          queue_services: services
        };
      });
      
      setLiveQueue(enrichedQueues);
    } catch (error) {
      console.error('Error loading live queue:', error);
    }
  };

  const getStatusMessage = () => {
    if (currentPosition === 1) {
      return "You're next! Please head to the shop.";
    } else if (currentPosition === 2) {
      return "Almost there! Get ready.";
    } else {
      return `${currentPosition - 1} people ahead of you`;
    }
  };

  const getStatusColor = () => {
    if (currentPosition === 1) return 'text-accent';
    if (currentPosition === 2) return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Button 
          variant="ghost" 
          className="mb-6 hover:bg-secondary"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 w-5 h-5" />
          Leave Queue
        </Button>

        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">You're in the queue!</h1>
          <p className="text-lg text-muted-foreground">{shop.name}</p>
        </div>

        {/* Position Card */}
        <Card className="p-8 mb-6 bg-card border-border text-center">
          <div className="mb-4">
            <div className="text-6xl md:text-8xl font-bold text-primary mb-2">
              #{currentPosition}
            </div>
            <p className={`text-xl ${getStatusColor()}`}>
              {getStatusMessage()}
            </p>
          </div>

          <div className="h-2 bg-secondary rounded-full overflow-hidden mb-6">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
              style={{ width: `${((queueData.position - currentPosition) / queueData.position) * 100}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-secondary/50 rounded-lg">
              <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">Est. Wait Time</div>
              <div className="text-2xl font-bold">{estimatedWait} min</div>
            </div>
            
            <div className="p-4 bg-secondary/50 rounded-lg">
              <Users className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">In Queue</div>
              <div className="text-2xl font-bold">{liveQueue.length}</div>
            </div>
          </div>
        </Card>

        {/* Live Queue Display */}
        <Card className="p-6 mb-6 bg-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Live Queue</h3>
            <Badge variant="outline" className="ml-auto">
              {liveQueue.length} {liveQueue.length === 1 ? 'person' : 'people'} waiting
            </Badge>
          </div>

          {liveQueue.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No one in queue</p>
          ) : (
            <div className="space-y-3">
              {liveQueue.map((entry, index) => {
                const isCurrentUser = entry.id === queueData.id;
                const services = entry.queue_services?.map((qs: any) => qs.services.name).join(', ') || 'Service';
                
                return (
                  <div 
                    key={entry.id}
                    className={`p-4 rounded-lg border transition-all duration-300 ${
                      isCurrentUser 
                        ? 'bg-primary/10 border-primary shadow-md' 
                        : 'bg-secondary/30 border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={isCurrentUser ? "default" : "outline"}
                          className="text-base font-bold min-w-[40px] justify-center"
                        >
                          #{entry.position}
                        </Badge>
                        <div>
                          <div className={`font-semibold ${isCurrentUser ? 'text-primary' : ''}`}>
                            {isCurrentUser ? 'You' : entry.customer_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {services}
                          </div>
                        </div>
                      </div>
                      
                      {isCurrentUser && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Service Info */}
        <Card className="p-6 mb-6 bg-card border-border">
          <h3 className="font-bold mb-4">{services.length > 1 ? 'Your Services' : 'Your Service'}</h3>
          <div className="space-y-4">
            {services.map((svc, index) => (
              <div key={index} className="flex justify-between items-center pb-4 border-b border-border last:border-0 last:pb-0">
                <div>
                  <div className="font-semibold text-lg">{svc.name}</div>
                  <div className="text-muted-foreground text-sm">{svc.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">₹{svc.price}</div>
                  <div className="text-sm text-muted-foreground">{svc.duration} min</div>
                </div>
              </div>
            ))}
            {services.length > 1 && (
              <div className="flex justify-between items-center pt-2 border-t-2 border-primary/20">
                <div className="font-bold text-lg">Total</div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    ₹{services.reduce((sum, s) => sum + s.price, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {services.reduce((sum, s) => sum + s.duration, 0)} min
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Notification Settings */}
        <div className="mt-6 text-center">
          <Button variant="outline" className="border-border hover:bg-secondary">
            Enable Notifications
          </Button>
        </div>

        {/* Rating Dialog */}
        {queueStatus === 'completed' && (
          <>
            {!hasRated && (
              <Card className="mt-6 p-6 bg-primary/10 border-primary">
                <div className="text-center">
                  <Star className="w-12 h-12 text-primary mx-auto mb-3" />
                  <h3 className="text-xl font-bold mb-2">Service Completed!</h3>
                  <p className="text-muted-foreground mb-4">
                    How was your experience? Your feedback helps us improve.
                  </p>
                  <Button 
                    onClick={() => setShowRatingDialog(true)}
                    size="lg"
                  >
                    Rate Your Experience
                  </Button>
                </div>
              </Card>
            )}
            
            {hasRated && (
              <Card className="mt-6 p-6 bg-secondary/30 border-border">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
                  <h3 className="text-xl font-bold mb-2">Thank You!</h3>
                  <p className="text-muted-foreground">
                    Your feedback has been submitted.
                  </p>
                </div>
              </Card>
            )}
          </>
        )}

        <RatingDialog
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
          queueId={queueData.id}
          shopName={shop.name}
          serviceName={services.map(s => s.name).join(', ')}
          onRatingSubmitted={() => setHasRated(true)}
        />
      </div>
    </div>
  );
};

export default QueueStatus;
