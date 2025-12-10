import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { mockDb } from '@/services/mockData';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Calendar as CalendarIcon, Clock, Crown, AlertTriangle, Search, Filter, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AppointmentEntry {
  id: string;
  customer_name: string;
  appointment_date: string;
  duration: number;
  status: string;
  services: any[];
  shop_id: string;
  customer_type?: 'vip' | 'regular' | null;
  is_emergency?: boolean;
  emergency_reason?: string;
  payment_option?: 'pay_now' | 'pay_at_shop';
}

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState<AppointmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'past' | 'cancelled'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAppointments();
    const interval = setInterval(loadAppointments, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [filter, selectedDate]);

  const loadAppointments = () => {
    try {
      const shopOwners = mockDb.getShopOwners();
      if (!shopOwners || shopOwners.length === 0) {
        setLoading(false);
        return;
      }

      const shopOwner = shopOwners[0];
      setShopId(shopOwner.shop_id);

      let allAppointments = mockDb.getAppointmentsByShop(shopOwner.shop_id);

      // Apply date filter
      if (selectedDate) {
        const dateStr = selectedDate.toDateString();
        allAppointments = allAppointments.filter((apt: any) => {
          const aptDate = new Date(apt.appointment_date).toDateString();
          return aptDate === dateStr;
        });
      }

      // Apply status filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (filter) {
        case 'today':
          allAppointments = allAppointments.filter((apt: any) => {
            const aptDate = new Date(apt.appointment_date);
            aptDate.setHours(0, 0, 0, 0);
            return aptDate.getTime() === today.getTime() && apt.status !== 'cancelled';
          });
          break;
        case 'upcoming':
          allAppointments = allAppointments.filter((apt: any) => {
            const aptDate = new Date(apt.appointment_date);
            return aptDate >= new Date() && apt.status !== 'cancelled' && apt.status !== 'completed';
          });
          break;
        case 'past':
          allAppointments = allAppointments.filter((apt: any) => {
            const aptDate = new Date(apt.appointment_date);
            return aptDate < new Date() || apt.status === 'completed';
          });
          break;
        case 'cancelled':
          allAppointments = allAppointments.filter((apt: any) => apt.status === 'cancelled');
          break;
      }

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        allAppointments = allAppointments.filter((apt: any) =>
          apt.customer_name.toLowerCase().includes(query)
        );
      }

      // Enrich with services
      const enriched = allAppointments.map((apt: any) => {
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
      enriched.sort((a: any, b: any) =>
        new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
      );

      setAppointments(enriched as AppointmentEntry[]);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const markAppointmentComplete = (appointmentId: string) => {
    try {
      mockDb.updateAppointment(appointmentId, { status: 'completed' });
      toast.success('Appointment marked as complete');
      loadAppointments();
    } catch (error) {
      console.error('Error marking appointment complete:', error);
      toast.error('Failed to update appointment');
    }
  };

  const cancelAppointment = (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      mockDb.updateAppointment(appointmentId, { status: 'cancelled' });
      toast.success('Appointment cancelled');
      loadAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  const getPriorityBadge = (appointment: AppointmentEntry) => {
    if (appointment.customer_type === 'vip') {
      return (
        <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
          <Crown className="w-3 h-3 mr-1" />
          VIP
        </Badge>
      );
    }
    if (appointment.is_emergency) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Emergency
        </Badge>
      );
    }
    if (appointment.customer_type === 'regular') {
      return (
        <Badge variant="secondary">
          Regular
        </Badge>
      );
    }
    return null;
  };

  const getPaymentBadge = (paymentOption?: string) => {
    switch (paymentOption) {
      case 'pay_now':
        return <Badge variant="outline" className="bg-green-50">Paid Online</Badge>;
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
        <h2 className="text-3xl font-bold mb-2">Appointment Management</h2>
        <p className="text-muted-foreground">Manage and track all customer appointments</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by customer name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                loadAppointments();
              }}
              className="pl-10"
            />
          </div>

          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full md:w-[280px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  if (!date) {
                    loadAppointments();
                  }
                }}
                initialFocus
              />
              {selectedDate && (
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedDate(undefined);
                      loadAppointments();
                    }}
                  >
                    Clear Date
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
          <TabsList>
            <TabsTrigger value="all">All ({appointments.length})</TabsTrigger>
            <TabsTrigger value="today">
              Today ({mockDb.getAppointmentsByShop(shopId || '').filter((apt: any) => {
                const aptDate = new Date(apt.appointment_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                aptDate.setHours(0, 0, 0, 0);
                return aptDate.getTime() === today.getTime() && apt.status !== 'cancelled';
              }).length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({mockDb.getAppointmentsByShop(shopId || '').filter((apt: any) => {
                return new Date(apt.appointment_date) >= new Date() && apt.status !== 'cancelled' && apt.status !== 'completed';
              }).length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({mockDb.getAppointmentsByShop(shopId || '').filter((apt: any) => {
                return new Date(apt.appointment_date) < new Date() || apt.status === 'completed';
              }).length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({mockDb.getAppointmentsByShop(shopId || '').filter((apt: any) => apt.status === 'cancelled').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <Card className="p-12 text-center bg-card border-border">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-xl text-muted-foreground mb-2">No appointments found</p>
          <p className="text-sm text-muted-foreground">
            {filter === 'all' 
              ? 'Appointments will appear here when customers book' 
              : `No ${filter} appointments`}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => {
            const appointmentDate = new Date(appointment.appointment_date);
            const isUpcoming = appointmentDate >= new Date() && appointment.status !== 'cancelled' && appointment.status !== 'completed';
            
            return (
              <Card key={appointment.id} className="p-6 bg-card border-border">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-xl font-bold">{appointment.customer_name}</h3>
                      {getPriorityBadge(appointment)}
                      {getStatusBadge(appointment.status)}
                      {getPaymentBadge(appointment.payment_option)}
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="font-semibold">{format(appointmentDate, 'EEEE, MMMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold">{format(appointmentDate, 'h:mm a')}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Duration: {appointment.duration} min
                      </div>
                    </div>

                    {/* Services */}
                    {appointment.services && appointment.services.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-muted-foreground mb-2">Services ({appointment.services.length}):</p>
                        <div className="space-y-1">
                          {appointment.services.map((service: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>• {service.name}</span>
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
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => markAppointmentComplete(appointment.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelAppointment(appointment.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {appointment.status === 'completed' && (
                      <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </div>
                    )}
                    {appointment.status === 'cancelled' && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <XCircle className="w-4 h-4" />
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
  );
};

export default AppointmentManagement;

