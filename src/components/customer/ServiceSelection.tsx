import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Scissors, Loader2 } from 'lucide-react';
import { getShopServices, joinQueue } from '@/services/mockQueueApi';
import { getActiveQueue } from '@/services/mockActiveQueueApi';
import { useAuth } from '@/hooks/useMockAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ShopReviews from './ShopReviews';
import QueueRestrictionBanner from './QueueRestrictionBanner';

const ServiceSelection = ({ shop, onServiceSelect, onBack }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [joining, setJoining] = useState(false);
  const [existingQueue, setExistingQueue] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

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
    return selectedServices.reduce((sum, service) => sum + service.price, 0);
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

    if (!customerName.trim()) {
      toast.error('Unable to load your profile. Please try again.');
      return;
    }

    setJoining(true);
    const serviceIds = selectedServices.map(s => s.id);
    const { data, error } = await joinQueue(
      shop.id,
      serviceIds,
      customerName.trim(),
      user.id
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

    toast.success('Successfully joined the queue!');
    onServiceSelect(selectedServices, data);
  };

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
          <p className="text-xl text-muted-foreground">Select a service to join the queue</p>
        </div>

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

            {/* Confirm Section */}
            {selectedServices.length > 0 && (
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
                        <p className="text-sm text-muted-foreground">
                          Estimated wait: ~{shop.currentQueue * getTotalDuration()} minutes
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">₹{getTotalPrice()}</p>
                      </div>
                    </div>
                  </div>

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
                      'Join Queue'
                    )}
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
