import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle, CreditCard, AlertTriangle, Crown } from 'lucide-react';
import { format } from 'date-fns';

interface AppointmentConfirmationProps {
  appointment: any;
  shop: any;
  services: any[];
  onBack: () => void;
  onViewAppointments?: () => void;
}

const AppointmentConfirmation = ({ appointment, shop, services, onBack, onViewAppointments }: AppointmentConfirmationProps) => {
  const appointmentDate = appointment?.scheduledDate 
    ? new Date(`${appointment.scheduledDate}T${appointment.scheduledTime || '00:00'}`)
    : appointment?.appointment_date 
    ? new Date(appointment.appointment_date)
    : null;

  const totalPrice = services?.reduce((sum, s) => sum + (s.price || 0), 0) || 0;
  const totalDuration = services?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Button 
          variant="ghost" 
          className="mb-6 hover:bg-secondary"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Success Card */}
        <Card className="p-8 mb-6 border-green-200 bg-green-50/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-green-700">Appointment Confirmed!</h1>
              <p className="text-muted-foreground mt-1">Your appointment has been successfully booked</p>
            </div>
          </div>
        </Card>

        {/* Appointment Details */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6">Appointment Details</h2>
          
          <div className="space-y-4">
            {/* Shop Info */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Shop</p>
                <p className="font-semibold text-lg">{shop?.name || appointment?.shop?.name || 'N/A'}</p>
                {shop?.address && (
                  <p className="text-sm text-muted-foreground mt-1">{shop.address}</p>
                )}
              </div>
            </div>

            {/* Date & Time */}
            {appointmentDate && (
              <>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold">{format(appointmentDate, 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-semibold">{format(appointmentDate, 'h:mm a')}</p>
                  </div>
                </div>
              </>
            )}

            {/* Services */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Services ({services?.length || 0})</p>
              <div className="space-y-2">
                {services?.map((service, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-semibold">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.duration} min</p>
                    </div>
                    <p className="font-semibold">₹{service.price}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Badges */}
            <div className="flex flex-wrap gap-2">
              {appointment?.customer_type === 'vip' && (
                <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                  <Crown className="w-3 h-3 mr-1" />
                  VIP Customer
                </Badge>
              )}
              {appointment?.is_emergency && (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Emergency Booking
                </Badge>
              )}
              {appointment?.payment_option === 'pay_now' && (
                <Badge variant="outline" className="bg-green-50">
                  <CreditCard className="w-3 h-3 mr-1" />
                  Payment Completed
                </Badge>
              )}
            </div>

            {/* Emergency Reason */}
            {appointment?.is_emergency && appointment?.emergency_reason && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-semibold text-yellow-800">Emergency Reason:</p>
                <p className="text-sm text-yellow-700">{appointment.emergency_reason}</p>
              </div>
            )}

            {/* Summary */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <p className="text-muted-foreground">Total Duration</p>
                <p className="font-semibold">{totalDuration} minutes</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-bold text-xl">₹{totalPrice}</p>
              </div>
              {appointment?.payment_option === 'pay_at_shop' && (
                <p className="text-sm text-muted-foreground mt-2">Payment will be collected at the shop</p>
              )}
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onBack}
          >
            Book Another
          </Button>
          {onViewAppointments && (
            <Button 
              variant="default" 
              className="flex-1"
              onClick={onViewAppointments}
            >
              View My Appointments
            </Button>
          )}
        </div>

        {/* Info Card */}
        <Card className="p-4 mt-6 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> You will receive a reminder notification before your appointment. 
            You can view or cancel your appointment from the "My Appointments" section.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default AppointmentConfirmation;

