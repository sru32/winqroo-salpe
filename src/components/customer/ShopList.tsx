import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Star, Clock, Search, Loader2, ArrowLeft, AlertCircle, Map as MapIcon, List } from 'lucide-react';
import { getShops } from '@/services/mockQueueApi';
import { getActiveQueue } from '@/services/mockActiveQueueApi';
import { useAuth } from '@/hooks/useMockAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ActiveQueue from './ActiveQueue';
import { useGeolocation } from '@/hooks/useGeolocation';
import MapView from './MapView';

const ShopList = ({ onShopSelect, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [showActiveQueue, setShowActiveQueue] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { latitude, longitude, loading: locationLoading, error: locationError } = useGeolocation();

  useEffect(() => {
    // Require authentication
    if (!user) {
      toast.error('Please sign in to browse shops');
      navigate('/auth');
      return;
    }

    loadShops();
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    setCustomerName(user.name || user.email);
    
    // Check if user has an active queue
    const { data: queueData } = await getActiveQueue(user.name || user.email);
    if (queueData) {
      setShowActiveQueue(true);
    }
  };

  const loadShops = async () => {
    setLoading(true);
    const { data, error } = await getShops(searchQuery, latitude, longitude);
    if (!error && data) {
      setShops(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!locationLoading) {
      const timer = setTimeout(() => {
        loadShops();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, latitude, longitude, locationLoading]);

  const handleQueueCancelled = () => {
    setShowActiveQueue(false);
    loadUserProfile();
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Find A Barber</h1>
          <p className="text-xl text-muted-foreground">Browse nearby shops and check their queue status</p>
        </div>

        {/* Location Status */}
        {locationError && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {locationError} Showing shops with default distances.
            </AlertDescription>
          </Alert>
        )}

        {/* Active Queue Section */}
        {showActiveQueue && customerName && (
          <div className="mb-8">
            <ActiveQueue 
              customerName={customerName} 
              onQueueCancelled={handleQueueCancelled}
            />
          </div>
        )}

        {/* Search Bar and View Toggle */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg bg-card border-border"
            />
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="flex-1"
            >
              <List className="w-4 h-4 mr-2" />
              List View
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              onClick={() => setViewMode('map')}
              className="flex-1"
            >
              <MapIcon className="w-4 h-4 mr-2" />
              Map View
            </Button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No shops found matching your search.</p>
          </div>
        ) : viewMode === 'map' ? (
          <MapView 
            shops={shops}
            userLocation={{ latitude, longitude }}
            onShopSelect={onShopSelect}
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {shops.map((shop) => (
              <Card key={shop.id} className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{shop.name}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{shop.address}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span className="font-semibold">{shop.rating}</span>
                      {shop.distance !== null && (
                        <span className="text-muted-foreground ml-2">• {shop.distance} km</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 mb-4 py-4 px-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Wait Time</div>
                      <div className="font-bold">{shop.estimated_wait || 0} min</div>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border"></div>
                  <div>
                    <div className="text-sm text-muted-foreground">In Queue</div>
                    <div className="font-bold">{shop.currentQueue || 0} people</div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => onShopSelect(shop)}
                >
                  Join Queue
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopList;
