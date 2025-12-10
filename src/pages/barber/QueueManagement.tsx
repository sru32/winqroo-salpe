import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockDb } from '@/services/mockData';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ArrowUp, ArrowDown, Loader2, Calendar, Users, Crown, AlertTriangle, Star } from 'lucide-react';
import { format } from 'date-fns';

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
  priority_score?: number;
  customer_type?: 'vip' | 'regular' | null;
  is_emergency?: boolean;
  emergency_reason?: string;
  payment_option?: 'pay_now' | 'pay_at_shop';
}

interface AppointmentEntry {
  id: string;
  customer_name: string;
  appointment_date: string;
  duration: number;
  status: string;
  services: Service[];
  customer_type?: 'vip' | 'regular' | null;
  is_emergency?: boolean;
  emergency_reason?: string;
  payment_option?: 'pay_now' | 'pay_at_shop';
}

const QueueManagement = () => {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [appointments, setAppointments] = useState<AppointmentEntry[]>([]);
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

      // Load queue entries
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

      // Sort by position (already sorted by priority in createQueue)
      enrichedQueues.sort((a: any, b: any) => a.position - b.position);

      setQueue(enrichedQueues as QueueEntry[]);

      // Load appointments
      const allAppointments = mockDb.getAppointmentsByShop(shopOwner.shop_id);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const upcomingAppointments = allAppointments
        .filter((a: any) => {
          const aptDate = new Date(a.appointment_date);
          return aptDate >= today && a.status !== 'cancelled' && a.status !== 'completed';
        })
        .slice(0, 20); // Limit to next 20 appointments

      const enrichedAppointments = upcomingAppointments.map((apt: any) => {
        const appointmentServices = mockDb.getAppointmentServicesForAppointment(apt.id);
        const services = appointmentServices.map((as: any) => {
          const service = mockDb.getService(as.service_id);
          return service;
        }).filter(Boolean);

        return {
          ...apt,
          services: services,
        };
      });

      // Sort by appointment date
      enrichedAppointments.sort((a: any, b: any) => 
        new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
      );

      setAppointments(enrichedAppointments as AppointmentEntry[]);
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

  const markAppointmentComplete = (appointmentId: string) => {
    try {
      mockDb.updateAppointment(appointmentId, { status: 'completed' });
      toast.success('Appointment marked as complete');
      loadQueue();
    } catch (error) {
      console.error('Error marking appointment complete:', error);
      toast.error('Failed to update appointment');
    }
  };

  const cancelAppointment = (appointmentId: string) => {
    try {
      mockDb.updateAppointment(appointmentId, { status: 'cancelled' });
      toast.success('Appointment cancelled');
      loadQueue();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  const getPriorityBadge = (entry: QueueEntry) => {
    if (entry.customer_type === 'vip') {
      return (
        <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
          <Crown className="w-3 h-3 mr-1" />
          VIP
        </Badge>
      );
    }
    if (entry.is_emergency) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Emergency
        </Badge>
      );
    }
    if (entry.customer_type === 'regular') {
      return (
        <Badge variant="secondary">
          <Star className="w-3 h-3 mr-1" />
          Regular
        </Badge>
      );
    }
    return null;
  };

  const getPaymentBadge = (paymentOption?: string) => {
    switch (paymentOption) {
      case 'pay_now':
        return <Badge variant="outline" className="bg-green-50">Paid</Badge>;
      default:
        return <Badge variant="outline">Pay at Shop</Badge>;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Queue & Appointments</h2>
        <p className="text-muted-foreground">Manage your customers waiting in queue and scheduled appointments</p>
      </div>

      <Tabs defaultValue="queue" className="w-full">
        <TabsList>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Queue ({queue.length})
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Appointments ({appointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-6">
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
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Badge variant="outline" className="text-lg font-bold">
                          #{entry.position}
                        </Badge>
                        <h3 className="text-xl font-bold">{entry.customer_name}</h3>
                        {getPriorityBadge(entry)}
                        {getPaymentBadge(entry.payment_option)}
                      </div>
                      
                      {entry.is_emergency && entry.emergency_reason && (
                        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          <strong>Emergency Reason:</strong> {entry.emergency_reason}
                        </div>
                      )}
                      
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
        </TabsContent>

        <TabsContent value="appointments" className="mt-6">
          {appointments.length === 0 ? (
            <Card className="p-12 text-center bg-card border-border">
              <p className="text-xl text-muted-foreground">No upcoming appointments</p>
              <p className="text-sm text-muted-foreground mt-2">Appointments will appear here when customers book</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <Card key={appointment.id} className="p-6 bg-card border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold">{appointment.customer_name}</h3>
                        {appointment.customer_type === 'vip' && (
                          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                            <Crown className="w-3 h-3 mr-1" />
                            VIP
                          </Badge>
                        )}
                        {appointment.is_emergency && (
                          <Badge variant="destructive">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Emergency
                          </Badge>
                        )}
                        {getPaymentBadge(appointment.payment_option)}
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                          <Calendar className="w-5 h-5" />
                          {format(new Date(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(appointment.appointment_date), 'h:mm a')}
                        </div>
                      </div>

                      {appointment.is_emergency && appointment.emergency_reason && (
                        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          <strong>Emergency Reason:</strong> {appointment.emergency_reason}
                        </div>
                      )}

                      <div className="space-y-1 text-muted-foreground">
                        <p className="font-semibold text-foreground mb-1">Services ({appointment.services?.length || 0}):</p>
                        {appointment.services?.map((service, idx) => (
                          <div key={idx} className="ml-2 mb-1">
                            <p>• {service.name} - {service.duration} min - ₹{service.price}</p>
                          </div>
                        ))}
                        <p className="font-semibold mt-2">
                          Total Duration: {appointment.duration} min
                        </p>
                        <p className="font-semibold">
                          Total Price: ₹{appointment.services?.reduce((sum, s) => sum + s.price, 0) || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => markAppointmentComplete(appointment.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => cancelAppointment(appointment.id)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QueueManagement;
