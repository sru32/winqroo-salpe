import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Clock, Users, Edit2, Save, X, Loader2, CheckCircle } from 'lucide-react';
import { getActiveQueue, updateQueueServices } from '@/services/mockActiveQueueApi';
import { getShopServices, cancelQueue } from '@/services/mockQueueApi';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
}

interface ActiveQueueProps {
  customerName: string;
  onQueueCancelled?: () => void;
}

const ActiveQueue = ({ customerName, onQueueCancelled }: ActiveQueueProps) => {
  const [queueData, setQueueData] = useState<any>(null);
  const [currentServices, setCurrentServices] = useState<Service[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadActiveQueue();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(loadActiveQueue, 5000);
    
    return () => clearInterval(interval);
  }, [customerName]);

  const loadActiveQueue = async () => {
    try {
      const { data: queue, error: queueError } = await getActiveQueue(customerName);

      if (queueError) throw new Error(queueError);

      if (!queue) {
        setQueueData(null);
        setLoading(false);
        return;
      }

      setQueueData(queue);

      // Extract services from queue_services
      const services = queue.queue_services?.map((qs: any) => qs.services) || [];
      setCurrentServices(services);
      setSelectedServiceIds(services.map((s: Service) => s.id));

      // Load all available services for this shop
      const { data: shopServices, error: servicesError } = await getShopServices(queue.shop_id);

      if (servicesError) throw new Error(servicesError);

      setAvailableServices(shopServices || []);
    } catch (error: any) {
      console.error('Error loading active queue:', error);
      toast.error('Failed to load queue information');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleSaveChanges = async () => {
    if (selectedServiceIds.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    setSaving(true);
    try {
      console.log('Starting service update for queue:', queueData.id);
      console.log('Selected service IDs:', selectedServiceIds);

      const { error } = await updateQueueServices(queueData.id, selectedServiceIds);

      if (error) {
        throw new Error(error);
      }

      console.log('Services updated successfully!');
      toast.success('Services updated successfully!');
      setIsEditing(false);
      await loadActiveQueue();
    } catch (error: any) {
      console.error('Error updating services:', error);
      toast.error(`Failed to update services: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelQueue = async () => {
    try {
      const { error } = await cancelQueue(queueData.id);

      if (error) throw new Error(error);

      toast.success('Queue entry cancelled');
      setQueueData(null);
      onQueueCancelled?.();
    } catch (error: any) {
      console.error('Error cancelling queue:', error);
      toast.error('Failed to cancel queue entry');
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (!queueData) {
    return null;
  }

  const getTotalDuration = () => {
    const services = isEditing 
      ? availableServices.filter(s => selectedServiceIds.includes(s.id))
      : currentServices;
    return services.reduce((sum, s) => sum + s.duration, 0);
  };

  const getTotalPrice = () => {
    const services = isEditing 
      ? availableServices.filter(s => selectedServiceIds.includes(s.id))
      : currentServices;
    return services.reduce((sum, s) => sum + s.price, 0);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold">You're in Queue!</h3>
          </div>
          <p className="text-muted-foreground">{queueData.shops.name}</p>
        </div>
        <Badge variant="outline" className="text-lg font-bold border-primary">
          #{queueData.position}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-background/50 rounded-lg">
          <Clock className="w-5 h-5 text-primary mb-1" />
          <div className="text-sm text-muted-foreground">Est. Wait</div>
          <div className="text-lg font-bold">{queueData.estimated_wait} min</div>
        </div>
        <div className="p-3 bg-background/50 rounded-lg">
          <Users className="w-5 h-5 text-primary mb-1" />
          <div className="text-sm text-muted-foreground">Status</div>
          <div className="text-lg font-bold capitalize">{queueData.status}</div>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="p-4 bg-background rounded-lg">
            <Label className="text-base font-semibold mb-3 block">Select Services:</Label>
            <div className="space-y-3">
              {availableServices.map(service => (
                <div key={service.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={service.id}
                    checked={selectedServiceIds.includes(service.id)}
                    onCheckedChange={() => handleToggleService(service.id)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={service.id}
                      className="font-medium cursor-pointer"
                    >
                      {service.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {service.duration} min • ₹{service.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-primary/10 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Duration</p>
                <p className="font-bold">{getTotalDuration()} min</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Price</p>
                <p className="text-xl font-bold text-primary">₹{getTotalPrice()}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSaveChanges}
              disabled={saving || selectedServiceIds.length === 0}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setSelectedServiceIds(currentServices.map(s => s.id));
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-background/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Your Services:</p>
            <div className="space-y-2">
              {currentServices.map(service => (
                <div key={service.id} className="flex justify-between items-center">
                  <span className="font-medium">{service.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {service.duration} min • ₹{service.price}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
              <span className="font-bold">Total</span>
              <span className="text-xl font-bold text-primary">₹{getTotalPrice()}</span>
            </div>
          </div>

          {queueData.status === 'waiting' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="flex-1"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Services
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelQueue}
              >
                Cancel Queue
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default ActiveQueue;
