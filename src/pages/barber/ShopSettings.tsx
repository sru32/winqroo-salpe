import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { mockDb } from '@/services/mockData';
import { toast } from 'sonner';
import { Loader2, Save, Store } from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  address: string;
  rating: number;
  qr_code: string;
  image: string;
  phone: string;
  description: string;
  opening_hours: Record<string, string>;
}

const ShopSettings = () => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = () => {
    try {
      const shopOwners = mockDb.getShopOwners();
      if (!shopOwners || shopOwners.length === 0) {
        setLoading(false);
        return;
      }

      const shopOwner = shopOwners[0];
      const shopData = mockDb.getShop(shopOwner.shop_id);
      
      if (shopData) {
        setShop(shopData as unknown as Shop);
      }
    } catch (error) {
      console.error('Error loading shop:', error);
      toast.error('Failed to load shop details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShop = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const qrCode = `SHOP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newShop = mockDb.createShop({
        name: 'My Barber Shop',
        address: '',
        qr_code: qrCode,
        rating: 4.5,
        phone: '',
        description: '',
        opening_hours: {
          monday: '9:00 AM - 6:00 PM',
          tuesday: '9:00 AM - 6:00 PM',
          wednesday: '9:00 AM - 6:00 PM',
          thursday: '9:00 AM - 6:00 PM',
          friday: '9:00 AM - 6:00 PM',
          saturday: '9:00 AM - 5:00 PM',
          sunday: 'Closed'
        }
      });

      // Link shop to current user (assuming user1 is shop owner)
      mockDb.createShopOwner({
        shop_id: newShop.id,
        user_id: 'user1',
      });

      toast.success('Shop created successfully!');
      setShop(newShop as unknown as Shop);
    } catch (error) {
      console.error('Error creating shop:', error);
      toast.error('Failed to create shop');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    setSaving(true);
    try {
      mockDb.updateShop(shop.id, {
        name: shop.name,
        address: shop.address,
        phone: shop.phone,
        description: shop.description,
        opening_hours: shop.opening_hours,
      });
      toast.success('Shop details updated successfully');
    } catch (error) {
      console.error('Error saving shop:', error);
      toast.error('Failed to update shop details');
    } finally {
      setSaving(false);
    }
  };

  const updateOpeningHours = (day: string, value: string) => {
    if (!shop) return;
    setShop({
      ...shop,
      opening_hours: {
        ...shop.opening_hours,
        [day]: value
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Shop Settings</h2>
          <p className="text-muted-foreground">Create your shop to get started</p>
        </div>

        <Card className="p-12 text-center bg-card border-border max-w-2xl">
          <Store className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h3 className="text-2xl font-bold mb-2">No Shop Found</h3>
          <p className="text-muted-foreground mb-6">
            You haven't created a shop yet. Create one now to start managing your barbershop.
          </p>
          <Button 
            onClick={handleCreateShop} 
            disabled={isCreating}
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Shop...
              </>
            ) : (
              <>
                <Store className="w-4 h-4 mr-2" />
                Create My Shop
              </>
            )}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Shop Settings</h2>
        <p className="text-muted-foreground">Update your shop information</p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card className="p-6 bg-card border-border">
          <h3 className="text-xl font-bold mb-4">Basic Information</h3>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name *</Label>
              <Input
                id="name"
                value={shop.name}
                onChange={(e) => setShop({ ...shop, name: e.target.value })}
                placeholder="Enter shop name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={shop.address}
                onChange={(e) => setShop({ ...shop, address: e.target.value })}
                placeholder="123 Main St, City, State ZIP"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={shop.phone || ''}
                onChange={(e) => setShop({ ...shop, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={shop.description || ''}
                onChange={(e) => setShop({ ...shop, description: e.target.value })}
                placeholder="Tell customers about your shop..."
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
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
          </form>
        </Card>

        <Card className="p-6 bg-card border-border">
          <h3 className="text-xl font-bold mb-4">Opening Hours</h3>
          <div className="space-y-4">
            {Object.entries(shop.opening_hours || {}).map(([day, hours]) => (
              <div key={day} className="flex items-center gap-4">
                <Label className="w-32 capitalize">{day}</Label>
                <Input
                  value={hours}
                  onChange={(e) => updateOpeningHours(day, e.target.value)}
                  placeholder="9:00 AM - 6:00 PM"
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <h3 className="text-xl font-bold mb-4">Shop Details</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">QR Code</Label>
              <div className="p-4 bg-secondary/50 rounded-lg mt-2">
                <p className="font-mono text-lg break-all">{shop.qr_code}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Customers can scan this code to join your queue
                </p>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Rating</Label>
              <div className="p-4 bg-secondary/50 rounded-lg mt-2">
                <p className="text-2xl font-bold text-primary">{shop.rating} ⭐</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ShopSettings;
