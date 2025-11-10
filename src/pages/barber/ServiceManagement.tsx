import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockDb } from '@/services/mockData';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  is_custom?: boolean;
  shop_id?: string | null;
  isOffered?: boolean;
  customPrice?: number;
  customDuration?: number;
  shopServiceId?: string;
}

const ServiceManagement = () => {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = () => {
    try {
      const shopOwners = mockDb.getShopOwners();
      if (!shopOwners || shopOwners.length === 0) {
        setLoading(false);
        return;
      }

      const shopOwner = shopOwners[0];
      setShopId(shopOwner.shop_id);

      // Get all available services (global + custom for this shop)
      const allServicesData = mockDb.getServices();
      const services = allServicesData.filter((s: any) => 
        !s.shop_id || s.shop_id === shopOwner.shop_id
      );

      // Get services offered by this shop with custom pricing
      const shopServices = mockDb.getShopServicesForShop(shopOwner.shop_id);
      const shopServiceMap = new Map(
        shopServices.map((s: any) => [s.service_id, s])
      );

      const servicesWithStatus = services.map((service: any) => {
        const shopService = shopServiceMap.get(service.id);
        return {
          ...service,
          isOffered: !!shopService,
          customPrice: shopService?.custom_price ?? undefined,
          customDuration: shopService?.custom_duration ?? undefined,
          shopServiceId: shopService?.id,
        };
      });

      // Sort by name
      servicesWithStatus.sort((a: any, b: any) => a.name.localeCompare(b.name));

      setAllServices(servicesWithStatus);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const addService = (serviceId: string) => {
    if (!shopId) return;

    try {
      mockDb.addShopService({ shop_id: shopId, service_id: serviceId });
      toast.success('Service added successfully');
      loadServices();
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service');
    }
  };

  const removeService = (serviceId: string) => {
    if (!shopId) return;

    try {
      mockDb.deleteShopService(shopId, serviceId);
      toast.success('Service removed successfully');
      loadServices();
    } catch (error) {
      console.error('Error removing service:', error);
      toast.error('Failed to remove service');
    }
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setEditPrice((service.customPrice ?? service.price).toString());
    setEditDuration((service.customDuration ?? service.duration).toString());
  };

  const saveServiceEdit = () => {
    if (!editingService?.shopServiceId) return;

    try {
      mockDb.updateShopService(editingService.shopServiceId, {
        custom_price: editPrice ? parseFloat(editPrice) : null,
        custom_duration: editDuration ? parseInt(editDuration) : null,
      });
      toast.success('Service updated successfully');
      setEditingService(null);
      loadServices();
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    }
  };

  const createCustomService = () => {
    if (!shopId || !newServiceName || !newServiceDuration || !newServicePrice) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const newService = mockDb.createService({
        name: newServiceName,
        description: newServiceDescription || `Custom ${newServiceName} service`,
        duration: parseInt(newServiceDuration),
        price: parseFloat(newServicePrice),
        is_custom: true,
        shop_id: shopId,
      });

      // Automatically add it to shop_services
      mockDb.addShopService({
        shop_id: shopId,
        service_id: newService.id,
      });

      toast.success('Custom service created successfully');
      setIsCreatingService(false);
      setNewServiceName('');
      setNewServiceDescription('');
      setNewServiceDuration('');
      setNewServicePrice('');
      loadServices();
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error('Failed to create service');
    }
  };

  const deleteCustomService = (serviceId: string) => {
    try {
      mockDb.deleteService(serviceId);
      toast.success('Custom service deleted successfully');
      loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
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
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold mb-2">Service Management</h2>
          <p className="text-muted-foreground">Manage the services your shop offers</p>
        </div>
        <Button onClick={() => setIsCreatingService(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Custom Service
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allServices.map((service) => (
          <Card key={service.id} className="p-6 bg-card border-border">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold">{service.name}</h3>
                {service.is_custom && (
                  <Badge variant="outline" className="mt-1">Custom</Badge>
                )}
              </div>
              {service.isOffered && (
                <Badge variant="default">Active</Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-semibold">
                  {service.customDuration ?? service.duration} min
                  {service.customDuration && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (default: {service.duration})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-semibold text-primary">
                  ₹{service.customPrice ?? service.price}
                  {service.customPrice && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (default: ₹{service.price})
                    </span>
                  )}
                </span>
              </div>
            </div>

            {service.isOffered ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditDialog(service)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    if (service.is_custom) {
                      deleteCustomService(service.id);
                    } else {
                      removeService(service.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {service.is_custom ? 'Delete' : 'Remove'}
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => addService(service.id)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Shop
              </Button>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Customize pricing and duration for {editingService?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder={`Default: ₹${editingService?.price}`}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default price (₹{editingService?.price})
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                placeholder={`Default: ${editingService?.duration} min`}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default duration ({editingService?.duration} min)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingService(null)}>
              Cancel
            </Button>
            <Button onClick={saveServiceEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreatingService} onOpenChange={setIsCreatingService}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Service</DialogTitle>
            <DialogDescription>
              Add a new service unique to your shop
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="e.g., Deluxe Spa Treatment"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newServiceDescription}
                onChange={(e) => setNewServiceDescription(e.target.value)}
                placeholder="Brief description of the service"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-duration">Duration (minutes) *</Label>
              <Input
                id="new-duration"
                type="number"
                value={newServiceDuration}
                onChange={(e) => setNewServiceDuration(e.target.value)}
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-price">Price (₹) *</Label>
              <Input
                id="new-price"
                type="number"
                step="0.01"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
                placeholder="25.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingService(false)}>
              Cancel
            </Button>
            <Button onClick={createCustomService}>Create Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceManagement;
