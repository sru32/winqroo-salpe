import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Clock, MapPin, Scissors, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getAppointmentsByUser, cancelAppointment as cancelAppointmentApi } from '@/services/mockQueueApi';
import { mockDb } from '@/services/mockData';

interface MyAppointmentsProps {
  onBack: () => void;
  userId: string;
}

const MyAppointments = ({ onBack, userId }: MyAppointmentsProps) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');

  useEffect(() => {
    loadAppointments();
  }, [userId]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      console.log(`📅 Loading appointments for user: ${userId}`);
      const { data, error } = await getAppointmentsByUser(userId);
      if (error) {
        console.error('Error loading appointments:', error);
        toast.error(error);
        setAppointments([]);
      } else {
        console.log(`📅 Received ${data?.length || 0} appointments`);
        // Backend returns appointments with populated shop/service, but handle both formats
        const enriched = (data || []).map((apt: any) => {
          // If shop is already populated (from backend), use it
          // Otherwise, try to get from mockDb
          const shop = apt.shop || (apt.shop_id ? mockDb.getShop(apt.shop_id) : null);
          
          // Transform backend format to component format
          return {
            id: apt._id || apt.id,
            shop_id: apt.shop?._id || apt.shop?.id || apt.shop_id,
            appointment_date: apt.scheduledDate 
              ? new Date(`${apt.scheduledDate}T${apt.scheduledTime || '00:00'}`).toISOString()
              : apt.appointment_date,
            status: apt.status || 'scheduled',
            services: apt.service 
              ? [{ name: apt.service.name || 'Service', price: apt.service.price || 0 }]
              : apt.services || [],
            shop: shop || apt.shop,
            payment_option: apt.payment_option,
            is_emergency: apt.is_emergency,
            emergency_reason: apt.emergency_reason,
          };
        });
        console.log(`📅 Enriched ${enriched.length} appointments`);
        setAppointments(enriched);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const { data, error } = await cancelAppointmentApi(appointmentId);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Appointment cancelled successfully');
        loadAppointments();
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  const getPaymentBadge = (paymentOption?: string) => {
    switch (paymentOption) {
      case 'pay_now':
        return <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800">Paid Online</Badge>;
      default:
        return <Badge variant="outline">Pay at Shop</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-blue-500">Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const now = new Date();
  
  const filteredAppointments = appointments.filter((apt: any) => {
    const aptDate = new Date(apt.appointment_date);
    
    switch (filter) {
      case 'upcoming':
        return apt.status !== 'cancelled' && apt.status !== 'completed' && aptDate >= now;
      case 'past':
        return apt.status === 'completed' || (aptDate < now && apt.status !== 'cancelled');
      case 'cancelled':
        return apt.status === 'cancelled';
      default:
        return true;
    }
  }).sort((a: any, b: any) => {
    return new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime();
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Button 
          variant="ghost" 
          className="mb-6 hover:bg-secondary"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 w-5 h-5" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Appointments</h1>
          <p className="text-xl text-muted-foreground">View and manage your appointments</p>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(value: any) => setFilter(value)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All ({appointments.length})</TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({appointments.filter((a: any) => {
                const aptDate = new Date(a.appointment_date);
                return a.status !== 'cancelled' && a.status !== 'completed' && aptDate >= now;
              }).length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({appointments.filter((a: any) => {
                const aptDate = new Date(a.appointment_date);
                return a.status === 'completed' || (aptDate < now && a.status !== 'cancelled');
              }).length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({appointments.filter((a: any) => a.status === 'cancelled').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <Card className="p-12 text-center bg-card border-border">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-xl text-muted-foreground mb-2">
              {filter === 'all' ? 'No appointments yet' : `No ${filter} appointments`}
            </p>
            <p className="text-sm text-muted-foreground">
              {filter === 'all' 
                ? 'Book an appointment to get started' 
                : `You don't have any ${filter} appointments`}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment: any) => {
              const appointmentDate = new Date(appointment.appointment_date);
              const isUpcoming = appointmentDate >= now && appointment.status !== 'cancelled' && appointment.status !== 'completed';
              const isPast = appointmentDate < now || appointment.status === 'completed';
              
              return (
                <Card key={appointment.id} className="p-6 bg-card border-border hover:border-primary/50 transition-all">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      {/* Shop Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Scissors className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{appointment.shop?.name || 'Shop'}</h3>
                          {appointment.shop?.address && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <MapPin className="w-3 h-3" />
                              <span>{appointment.shop.address}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span className="font-semibold">{format(appointmentDate, 'EEEE, MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span className="font-semibold">{format(appointmentDate, 'h:mm a')}</span>
                        </div>
                      </div>

                      {/* Services */}
                      {appointment.services && appointment.services.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-muted-foreground mb-2">Services:</p>
                          <div className="space-y-1">
                            {appointment.services.map((service: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{service.name}</span>
                                <span className="font-semibold">₹{service.price}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-2 mt-2 border-t">
                            <span className="font-bold">Total:</span>
                            <span className="text-lg font-bold text-primary">
                              ₹{appointment.services.reduce((sum: number, s: any) => sum + s.price, 0)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(appointment.status)}
                        {getPaymentBadge(appointment.payment_option)}
                        {appointment.is_emergency && (
                          <Badge variant="destructive">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Emergency
                          </Badge>
                        )}
                      </div>

                      {/* Emergency Reason */}
                      {appointment.is_emergency && appointment.emergency_reason && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                          <strong>Emergency Reason:</strong> {appointment.emergency_reason}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {isUpcoming && appointment.status === 'confirmed' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => cancelAppointment(appointment.id)}
                          className="w-full md:w-auto"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel Appointment
                        </Button>
                      )}
                      {isPast && appointment.status === 'completed' && (
                        <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          Completed
                        </div>
                      )}
                      {appointment.status === 'cancelled' && (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <X className="w-4 h-4" />
                          Cancelled
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;

