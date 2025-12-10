import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Calendar as CalendarIcon, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getAvailableTimeSlots, createAppointment } from '@/services/mockQueueApi';
import { mockDb } from '@/services/mockData';
import PaymentPage from './PaymentPage';

interface AppointmentBookingProps {
  shop: any;
  selectedServices: any[];
  onBookingComplete: (appointment: any) => void;
  onBack: () => void;
  user: any;
}

const AppointmentBooking = ({ shop, selectedServices, onBookingComplete, onBack, user }: AppointmentBookingProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [paymentOption, setPaymentOption] = useState<'pay_now' | 'pay_at_shop'>('pay_at_shop');
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<any>(null);

  const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0);
  const basePrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
  
  // Check if priority (VIP or Emergency)
  const isPriority = isEmergency || user?.customer_type === 'vip';
  
  // Apply 150% price hike for priority bookings (2.5x original price)
  const totalPrice = isPriority ? Math.round(basePrice * 2.5) : basePrice;
  const priceHike = isPriority ? basePrice * 1.5 : 0;
  
  // Force pay_now for priority bookings
  useEffect(() => {
    if (isPriority) {
      setPaymentOption('pay_now');
    }
  }, [isPriority]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
      setSelectedTime('');
    }
  }, [selectedDate]);

  const loadAvailableSlots = async () => {
    if (!selectedDate) return;
    
    setLoadingSlots(true);
    setSelectedTime('');
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { data, error } = await getAvailableTimeSlots(shop.id, dateStr, totalDuration);
    
    if (error) {
      toast.error(error);
      setAvailableSlots([]);
    } else {
      setAvailableSlots(data || []);
      if (data && data.length === 0) {
        toast.info('No available slots for this date. Please select another date.');
      }
    }
    
    setLoadingSlots(false);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select a date and time slot');
      return;
    }

    if (isEmergency && !emergencyReason.trim()) {
      toast.error('Please provide a reason for emergency booking');
      return;
    }

    if (!user) {
      toast.error('Please sign in to book an appointment');
      return;
    }

    // If payment is "Pay Now", redirect to payment page first
    if (paymentOption === 'pay_now') {
      setPendingBooking({
        selectedDate,
        selectedTime,
        isEmergency,
        emergencyReason
      });
      setShowPayment(true);
      return;
    }

    // Otherwise, proceed with booking
    await completeBooking();
  };

  const completeBooking = async () => {
    if (!user) return;

    const bookingData = pendingBooking || {
      selectedDate,
      selectedTime,
      isEmergency,
      emergencyReason
    };

    if (!bookingData.selectedDate || !bookingData.selectedTime) {
      toast.error('Please select a date and time slot');
      return;
    }

    setBooking(true);

    const dateStr = format(bookingData.selectedDate, 'yyyy-MM-dd');
    const serviceIds = selectedServices.map(s => s.id);
    const customerName = user.name || user.email;

    const { data, error } = await createAppointment(
      shop.id,
      serviceIds,
      dateStr,
      bookingData.selectedTime,
      customerName,
      user.id,
      {
        payment_option: paymentOption,
        is_emergency: bookingData.isEmergency || false,
        emergency_reason: bookingData.emergencyReason || null
      }
    );

    setBooking(false);
    setPendingBooking(null);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success(paymentOption === 'pay_now' ? 'Appointment booked and payment successful!' : 'Appointment booked successfully!');
    onBookingComplete(data);
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    // Update payment status and complete booking
    await completeBooking();
  };

  const isTodayOrFuture = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  // Show payment page if payment is required
  if (showPayment) {
    return (
      <PaymentPage
        amount={totalPrice}
        shopName={shop.name}
        services={selectedServices}
        bookingType="appointment"
        bookingData={pendingBooking}
        onPaymentSuccess={handlePaymentSuccess}
        onBack={() => {
          setShowPayment(false);
          setPendingBooking(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Button 
          variant="ghost" 
          className="mb-6 hover:bg-secondary"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 w-5 h-5" />
          Back to Services
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Book Appointment</h1>
          <p className="text-xl text-muted-foreground">{shop.name}</p>
        </div>

        {/* Selected Services Summary */}
        <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
          <h3 className="font-bold text-lg mb-4">Selected Services</h3>
          <div className="space-y-2 mb-4">
            {selectedServices.map(service => (
              <div key={service.id} className="flex justify-between">
                <span>{service.name}</span>
                <span className="font-semibold">₹{service.price}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Total Duration: {totalDuration} min</p>
              {isPriority && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">Base Price: ₹{basePrice}</p>
                  <p className="text-xs font-semibold text-yellow-600">Priority Fee (150%): +₹{priceHike}</p>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">₹{totalPrice}</p>
              {isPriority && (
                <p className="text-xs text-muted-foreground mt-1">Priority booking</p>
              )}
            </div>
          </div>
        </Card>

        {/* Calendar Selection */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Select Date</h3>
          </div>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => !isTodayOrFuture(date)}
              className="rounded-md border"
            />
          </div>
          {selectedDate && (
            <p className="text-center mt-4 text-sm text-muted-foreground">
              Selected: {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          )}
        </Card>

        {/* Time Slot Selection */}
        {selectedDate && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">Select Time</h3>
            </div>
            
            {loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading available slots...</span>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedTime === slot ? "default" : "outline"}
                    onClick={() => setSelectedTime(slot)}
                    className={selectedTime === slot ? "bg-primary text-primary-foreground" : ""}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No available time slots for this date</p>
                <p className="text-sm mt-1">Please select another date</p>
              </div>
            )}
          </Card>
        )}

        {/* Emergency Option */}
        <Card className="p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="emergency"
              checked={isEmergency}
              onCheckedChange={(checked) => {
                setIsEmergency(checked as boolean);
                if (!checked) setEmergencyReason('');
              }}
            />
            <Label htmlFor="emergency" className="font-bold text-lg cursor-pointer">
              Emergency Booking (Same Day - Wedding, Interview, etc.)
            </Label>
          </div>
          {isEmergency && (
            <div className="mt-4">
              <Label htmlFor="emergency-reason" className="text-sm text-muted-foreground">
                Reason for emergency booking
              </Label>
              <input
                id="emergency-reason"
                type="text"
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                placeholder="e.g., Wedding today, Job interview"
                className="mt-2 w-full px-3 py-2 border border-input rounded-md bg-background"
              />
              <Badge variant="outline" className="mt-2 bg-yellow-50 border-yellow-200 text-yellow-800">
                Emergency bookings have priority (150% price increase, online payment required)
              </Badge>
            </div>
          )}
        </Card>

        {/* Payment Options */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Payment Option</h3>
          </div>
          {isPriority && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Priority bookings require online payment</strong>
              </p>
            </div>
          )}
          <RadioGroup 
            value={paymentOption} 
            onValueChange={(value: any) => {
              if (!isPriority) {
                setPaymentOption(value);
              }
            }}
            disabled={isPriority}
          >
            <div className="space-y-4">
              <div className={`flex items-center space-x-2 p-4 border rounded-lg ${isPriority ? 'bg-primary/10 border-primary' : 'hover:bg-accent cursor-pointer'}`}>
                <RadioGroupItem value="pay_now" id="pay_now" disabled={false} checked={paymentOption === 'pay_now'} />
                <Label htmlFor="pay_now" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Pay Now</div>
                  <div className="text-sm text-muted-foreground">Pay online before the appointment</div>
                  {isPriority && (
                    <div className="text-xs text-primary mt-1 font-semibold">Required for priority bookings</div>
                  )}
                </Label>
              </div>
              <div className={`flex items-center space-x-2 p-4 border rounded-lg ${isPriority ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent cursor-pointer'}`}>
                <RadioGroupItem value="pay_at_shop" id="pay_at_shop" disabled={isPriority} />
                <Label htmlFor="pay_at_shop" className={`flex-1 ${isPriority ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <div className="font-semibold">Pay at Shop</div>
                  <div className="text-sm text-muted-foreground">Pay when you arrive at the shop</div>
                  {isPriority && (
                    <div className="text-xs text-muted-foreground mt-1">Not available for priority bookings</div>
                  )}
                </Label>
              </div>
            </div>
          </RadioGroup>
        </Card>

        {/* Customer Type Indicator */}
        {user && (user.customer_type === 'vip' || user.customer_type === 'regular') && (
          <Card className="p-4 mb-6 bg-primary/10 border-primary/20">
            <div className="flex items-center gap-2">
              <Badge variant={user.customer_type === 'vip' ? 'default' : 'secondary'}>
                {user.customer_type === 'vip' ? 'VIP Member' : 'Regular Customer'}
              </Badge>
              {user.loyalty_points && (
                <span className="text-sm text-muted-foreground">
                  {user.loyalty_points} loyalty points
                </span>
              )}
              {user.customer_type === 'vip' && (
                <span className="text-sm text-muted-foreground ml-auto">
                  You'll get priority in the queue
                </span>
              )}
            </div>
          </Card>
        )}

        {/* Book Button */}
        <Button
          onClick={handleBooking}
          disabled={!selectedDate || !selectedTime || booking}
          className="w-full py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {booking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Booking Appointment...
            </>
          ) : (
            <>
              <CalendarIcon className="w-4 h-4 mr-2" />
              Book Appointment
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AppointmentBooking;

