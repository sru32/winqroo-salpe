import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Scissors, Loader2, Calendar, Users, AlertCircle } from 'lucide-react';
import { getShopServices, joinQueue } from '@/services/mockQueueApi';
import { getActiveQueue } from '@/services/mockActiveQueueApi';
import { useAuth } from '@/hooks/useMockAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ShopReviews from './ShopReviews';
import QueueRestrictionBanner from './QueueRestrictionBanner';
import AppointmentBooking from './AppointmentBooking';
import PaymentPage from './PaymentPage';

const ServiceSelection = ({ shop, onServiceSelect, onBack }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [joining, setJoining] = useState(false);
  const [existingQueue, setExistingQueue] = useState(null);
  const [bookingMode, setBookingMode] = useState<'queue' | 'appointment'>('queue');
  const [paymentOption, setPaymentOption] = useState<'pay_now' | 'pay_at_shop'>('pay_at_shop');
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [pendingQueue, setPendingQueue] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if priority (VIP or Emergency)
  const isPriority = isEmergency || user?.customer_type === 'vip';
  
  // Force pay_now for priority bookings
  useEffect(() => {
    if (isPriority) {
      setPaymentOption('pay_now');
    }
  }, [isPriority]);

  useEffect(() => {
    // Require authentication
    if (!user) {
      toast.error('Please sign in to join a queue');
      navigate('/auth');
      return;
    }
    
    loadServices();
    loadUserProfile();
    checkExistingQueue();
  }, [shop.id, user]);

  const loadUserProfile = async () => {
    if (!user) return;
    setCustomerName(user.name || user.email);
  };

  const checkExistingQueue = async () => {
    if (!user) return;
    
    const userName = user.name || user.email;
    const { data: queueData } = await getActiveQueue(userName);
    if (queueData && queueData.shop_id !== shop.id) {
      setExistingQueue(queueData);
    }
  };

  const loadServices = async () => {
    setLoading(true);
    const { data, error } = await getShopServices(shop.id);
    if (!error && data) {
      setServices(data);
    }
    setLoading(false);
  };

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const getTotalDuration = () => {
    return selectedServices.reduce((sum, service) => sum + service.duration, 0);
  };

  const getTotalPrice = () => {
    const basePrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
    // Apply 150% price hike for priority bookings (2.5x original price)
    return isPriority ? Math.round(basePrice * 2.5) : basePrice;
  };

  const getBasePrice = () => {
    return selectedServices.reduce((sum, service) => sum + service.price, 0);
  };

  const getPriceHike = () => {
    if (!isPriority) return 0;
    return Math.round(getBasePrice() * 1.5);
  };

  const handleJoinQueue = async () => {
    if (!user) {
      toast.error('Please sign in to join a queue');
      navigate('/auth');
      return;
    }

    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    if (isEmergency && !emergencyReason.trim()) {
      toast.error('Please provide a reason for emergency booking');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Unable to load your profile. Please try again.');
      return;
    }

    // If payment is "Pay Now", redirect to payment page first
    if (paymentOption === 'pay_now') {
      setPendingQueue({
        serviceIds: selectedServices.map(s => s.id),
        customerName: customerName.trim(),
        isEmergency,
        emergencyReason
      });
      setShowPayment(true);
      return;
    }

    // Otherwise, proceed with joining queue
    await completeQueueJoin();
  };

  const completeQueueJoin = async () => {
    if (!user || !customerName.trim()) return;

    setJoining(true);
    
    const queueData = pendingQueue || {
      serviceIds: selectedServices.map(s => s.id),
      customerName: customerName.trim(),
      isEmergency,
      emergencyReason
    };

    const { data, error } = await joinQueue(
      shop.id,
      queueData.serviceIds,
      queueData.customerName,
      user.id,
      {
        payment_option: paymentOption,
        is_emergency: queueData.isEmergency,
        emergency_reason: queueData.emergencyReason || null
      }
    );
    setJoining(false);

    if (error) {
      // Show more detailed error for existing queue
      if (error.includes('already have an active queue')) {
        toast.error(error, {
          duration: 5000,
        });
      } else {
        toast.error(error);
      }
      return;
    }

    toast.success(paymentOption === 'pay_now' ? 'Successfully joined the queue and payment completed!' : 'Successfully joined the queue!');
    onServiceSelect(selectedServices, data);
    setPendingQueue(null);
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    // Complete queue join after payment
    await completeQueueJoin();
  };

  const handleAppointmentComplete = (appointment: any) => {
    onServiceSelect(selectedServices, appointment);
  };

  // Show payment page if payment is required for queue
  if (showPayment && bookingMode === 'queue' && selectedServices.length > 0) {
    return (
      <PaymentPage
        amount={getTotalPrice()}
        shopName={shop.name}
        services={selectedServices}
        bookingType="queue"
        onPaymentSuccess={handlePaymentSuccess}
        onBack={() => {
          setShowPayment(false);
          setPendingQueue(null);
        }}
      />
    );
  }

  // If appointment mode and services selected, show appointment booking
  // Note: This early return means the sticky footer button below won't be rendered
  // The button is kept for potential future use or if the flow changes
  if (bookingMode === 'appointment' && selectedServices.length > 0) {
    return (
      <AppointmentBooking
        shop={shop}
        selectedServices={selectedServices}
        onBookingComplete={handleAppointmentComplete}
        onBack={() => {
          setBookingMode('queue');
          setSelectedServices([]);
        }}
        user={user}
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
          Back to Shops
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{shop.name}</h1>
          <p className="text-xl text-muted-foreground">Select services and booking type</p>
        </div>

        {/* Booking Mode Selection */}
        <Card className="p-6 mb-6">
          <Label className="text-lg font-bold mb-4 block">Choose Booking Type</Label>
          <RadioGroup value={bookingMode} onValueChange={(value: 'queue' | 'appointment') => setBookingMode(value)}>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="queue" id="queue" />
                <Label htmlFor="queue" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <div>
                      <div className="font-semibold">Walk-in Queue</div>
                      <div className="text-sm text-muted-foreground">Join the queue and wait for your turn</div>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="appointment" id="appointment" />
                <Label htmlFor="appointment" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <div>
                      <div className="font-semibold">Book Appointment</div>
                      <div className="text-sm text-muted-foreground">Schedule a specific date and time</div>
                    </div>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </Card>

        {/* Queue Restriction Warning */}
        {existingQueue && (
          <QueueRestrictionBanner shopName={existingQueue.shops?.name || 'another shop'} />
        )}

        {/* Reviews Section */}
        <div className="mb-8">
          <ShopReviews shopId={shop.id} shopRating={shop.rating || 4.5} />
        </div>

        {/* Service Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 mb-8">
              {services.map((service) => {
                const isSelected = selectedServices.some(s => s.id === service.id);
                return (
                  <Card 
                    key={service.id}
                    className={`p-6 cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'bg-primary/10 border-primary shadow-lg' 
                        : 'bg-card border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleServiceToggle(service)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'border-primary bg-primary' 
                              : 'border-border'
                          }`}>
                            {isSelected && (
                              <div className="w-3 h-3 text-primary-foreground">✓</div>
                            )}
                          </div>
                          <h3 className="text-xl font-bold">{service.name}</h3>
                        </div>
                        
                        <p className="text-muted-foreground mb-3 ml-9">{service.description}</p>
                        
                        <div className="flex items-center gap-6 ml-9">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{service.duration} min</span>
                          </div>
                          <div className="text-primary font-bold text-lg">
                            ₹{service.price}
                          </div>
                        </div>
                      </div>
                      
                      <Scissors className={`w-6 h-6 ${
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Confirm Section - Only show for queue mode */}
            {selectedServices.length > 0 && bookingMode === 'queue' && (
              <div className="sticky bottom-6 bg-card border border-border rounded-lg p-6 shadow-lg space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Selected Services ({selectedServices.length}):</p>
                  <div className="space-y-1 mb-3">
                    {selectedServices.map(service => (
                      <div key={service.id} className="flex justify-between items-center">
                        <span className="font-semibold">{service.name}</span>
                        <span className="text-sm text-muted-foreground">₹{service.price}</span>
                      </div>
                    ))}
                  </div>
                    <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Duration: {getTotalDuration()} min</p>
                        <p className="text-sm text-muted-foreground">
                          Estimated wait: ~{shop.currentQueue * getTotalDuration()} minutes
                        </p>
                        {isPriority && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-muted-foreground">Base Price: ₹{getBasePrice()}</p>
                            <p className="text-xs font-semibold text-yellow-600">Priority Fee (150%): +₹{getPriceHike()}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">₹{getTotalPrice()}</p>
                        {isPriority && (
                          <p className="text-xs text-muted-foreground mt-1">Priority booking</p>
                        )}
                      </div>
                    </div>
                </div>

                {/* Emergency Option for Queue */}
                <Card className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="emergency-queue"
                      checked={isEmergency}
                      onCheckedChange={(checked) => {
                        setIsEmergency(checked as boolean);
                        if (!checked) setEmergencyReason('');
                      }}
                    />
                    <Label htmlFor="emergency-queue" className="font-semibold cursor-pointer">
                      Emergency Booking (Same Day - Wedding, Interview, etc.)
                    </Label>
                  </div>
                  {isEmergency && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={emergencyReason}
                        onChange={(e) => setEmergencyReason(e.target.value)}
                        placeholder="Reason for emergency booking"
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                      />
                      <Badge variant="outline" className="mt-2 bg-yellow-50 border-yellow-200 text-yellow-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Emergency bookings get priority (150% price increase, online payment required)
                      </Badge>
                    </div>
                  )}
                </Card>

                {/* Payment Options for Queue */}
                <Card className="p-4">
                  <Label className="font-semibold mb-3 block">Payment Option</Label>
                  {isPriority && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
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
                    <div className="space-y-2">
                      <div className={`flex items-center space-x-2 ${isPriority ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <RadioGroupItem value="pay_at_shop" id="pay_at_shop_queue" disabled={isPriority} />
                        <Label htmlFor="pay_at_shop_queue" className={`${isPriority ? 'cursor-not-allowed' : 'cursor-pointer'} text-sm`}>
                          Pay at Shop
                          {isPriority && <span className="text-xs text-muted-foreground ml-1">(Not available)</span>}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pay_now" id="pay_now_queue" disabled={false} checked={paymentOption === 'pay_now'} />
                        <Label htmlFor="pay_now_queue" className="cursor-pointer text-sm">
                          Pay Now
                          {isPriority && <span className="text-xs text-primary ml-1 font-semibold">(Required)</span>}
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </Card>

                {/* Customer Type Indicator */}
                {user && (user.customer_type === 'vip' || user.customer_type === 'regular') && (
                  <Card className="p-4 bg-primary/10 border-primary/20">
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
                          Priority in queue
                        </span>
                      )}
                    </div>
                  </Card>
                )}

                <Button
                  onClick={handleJoinQueue}
                  className="w-full py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={joining || !!existingQueue}
                >
                  {joining ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Joining Queue...
                    </>
                  ) : existingQueue ? (
                    'Already in Another Queue'
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Join Queue
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Continue to Appointment Booking Button */}
            {selectedServices.length > 0 && bookingMode === 'appointment' && (
              <div className="sticky bottom-6 bg-card border border-border rounded-lg p-6 shadow-lg">
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Selected Services ({selectedServices.length}):</p>
                    <div className="space-y-1 mb-3">
                      {selectedServices.map(service => (
                        <div key={service.id} className="flex justify-between items-center">
                          <span className="font-semibold">{service.name}</span>
                          <span className="text-sm text-muted-foreground">₹{service.price}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Duration: {getTotalDuration()} min</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">₹{getTotalPrice()}</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      // Force state update to ensure AppointmentBooking component is shown
                      // The early return at line 221 will render AppointmentBooking when
                      // bookingMode === 'appointment' && selectedServices.length > 0
                      setBookingMode('appointment');
                      // Small delay to ensure state update propagates, then scroll
                      setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }, 0);
                    }}
                    className="w-full py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Continue to Book Appointment
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceSelection;
