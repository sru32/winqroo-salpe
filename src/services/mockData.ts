// Mock data store for fallback when backend is unavailable
interface Shop {
  id: string;
  name: string;
  address?: string;
  owner_id?: string;
  rating?: number;
  qr_code?: string;
  phone?: string;
  description?: string;
  opening_hours?: Record<string, string>;
  image?: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  shop_id?: string | null;
  description?: string;
  is_custom?: boolean;
}

interface Appointment {
  id: string;
  shop_id: string;
  customer_id: string;
  appointment_date: string;
  status: string;
  services?: Array<{ name: string; price: number }>;
  payment_option?: string;
  is_emergency?: boolean;
  emergency_reason?: string;
  customer_name?: string;
  duration?: number;
}

interface Queue {
  id: string;
  shop_id: string;
  customer_id: string;
  service_id: string;
  position: number;
  status: string;
  estimated_wait?: number;
  joined_at?: string;
  completed_at?: string;
  customer_name?: string;
}

interface ShopOwner {
  id: string;
  shop_id: string;
  user_id: string;
}

interface ShopService {
  id: string;
  shop_id: string;
  service_id: string;
  custom_price?: number;
  custom_duration?: number;
}

interface QueueService {
  id: string;
  queue_id: string;
  service_id: string;
}

interface AppointmentService {
  id: string;
  appointment_id: string;
  service_id: string;
}

class MockDb {
  private shops: Map<string, Shop> = new Map();
  private services: Map<string, Service> = new Map();
  private appointments: Map<string, Appointment> = new Map();
  private queues: Map<string, Queue> = new Map();
  private shopOwners: Map<string, ShopOwner> = new Map();
  private shopServices: Map<string, ShopService> = new Map();
  private queueServices: Map<string, QueueService> = new Map();
  private appointmentServices: Map<string, AppointmentService> = new Map();

  // Shop methods
  getShop(id: string): Shop | undefined {
    return this.shops.get(id);
  }

  getShops(): Shop[] {
    // Ensure default data is initialized
    if (this.shops.size === 0) {
      this.initializeDefaultData();
    }
    return Array.from(this.shops.values());
  }

  createShop(shopData: Partial<Shop>): Shop {
    const shop: Shop = {
      id: `shop_${Date.now()}`,
      name: shopData.name || 'My Shop',
      address: shopData.address || '',
      rating: shopData.rating || 0,
      qr_code: shopData.qr_code || `QR_${Date.now()}`,
      phone: shopData.phone || '',
      description: shopData.description || '',
      opening_hours: shopData.opening_hours || {},
      ...shopData,
    };
    this.shops.set(shop.id, shop);
    return shop;
  }

  updateShop(id: string, updates: Partial<Shop>): void {
    const shop = this.shops.get(id);
    if (shop) {
      this.shops.set(id, { ...shop, ...updates });
    }
  }

  // Shop Owner methods
  getShopOwners(): ShopOwner[] {
    // Ensure default data is initialized
    if (this.shopOwners.size === 0) {
      this.initializeDefaultData();
    }
    return Array.from(this.shopOwners.values());
  }

  createShopOwner(data: { shop_id: string; user_id: string }): ShopOwner {
    const shopOwner: ShopOwner = {
      id: `shopowner_${Date.now()}`,
      shop_id: data.shop_id,
      user_id: data.user_id,
    };
    this.shopOwners.set(shopOwner.id, shopOwner);
    return shopOwner;
  }

  // Service methods
  getService(id: string): Service | undefined {
    return this.services.get(id);
  }

  getServices(): Service[] {
    // Ensure default data is initialized
    if (this.services.size === 0) {
      this.initializeDefaultData();
    }
    return Array.from(this.services.values());
  }

  getServicesByShop(shopId: string): Service[] {
    return Array.from(this.services.values()).filter(s => s.shop_id === shopId);
  }

  createService(serviceData: Partial<Service>): Service {
    const service: Service = {
      id: `service_${Date.now()}`,
      name: serviceData.name || 'Service',
      price: serviceData.price || 0,
      duration: serviceData.duration || 30,
      description: serviceData.description || '',
      shop_id: serviceData.shop_id || null,
      is_custom: serviceData.is_custom || false,
      ...serviceData,
    };
    this.services.set(service.id, service);
    return service;
  }

  deleteService(id: string): void {
    this.services.delete(id);
  }

  // Shop Service methods
  getShopServicesForShop(shopId: string): ShopService[] {
    return Array.from(this.shopServices.values()).filter(ss => ss.shop_id === shopId);
  }

  addShopService(data: { shop_id: string; service_id: string }): ShopService {
    const shopService: ShopService = {
      id: `shopservice_${Date.now()}`,
      shop_id: data.shop_id,
      service_id: data.service_id,
    };
    this.shopServices.set(shopService.id, shopService);
    return shopService;
  }

  deleteShopService(shopId: string, serviceId: string): void {
    const shopService = Array.from(this.shopServices.values()).find(
      ss => ss.shop_id === shopId && ss.service_id === serviceId
    );
    if (shopService) {
      this.shopServices.delete(shopService.id);
    }
  }

  updateShopService(id: string, updates: Partial<ShopService>): void {
    const shopService = this.shopServices.get(id);
    if (shopService) {
      this.shopServices.set(id, { ...shopService, ...updates });
    }
  }

  // Queue methods
  getQueuesByShop(shopId: string): Queue[] {
    return Array.from(this.queues.values()).filter(q => q.shop_id === shopId);
  }

  updateQueue(id: string, updates: Partial<Queue>): void {
    const queue = this.queues.get(id);
    if (queue) {
      this.queues.set(id, { ...queue, ...updates });
    }
  }

  getQueueServicesForQueue(queueId: string): QueueService[] {
    return Array.from(this.queueServices.values()).filter(qs => qs.queue_id === queueId);
  }

  // Appointment methods
  getAppointment(id: string): Appointment | undefined {
    return this.appointments.get(id);
  }

  getAppointmentsByUser(userId: string): Appointment[] {
    return Array.from(this.appointments.values()).filter(a => a.customer_id === userId);
  }

  getAppointmentsByShop(shopId: string): Appointment[] {
    return Array.from(this.appointments.values()).filter(a => a.shop_id === shopId);
  }

  addAppointment(appointment: Appointment): void {
    this.appointments.set(appointment.id, appointment);
  }

  updateAppointment(id: string, updates: Partial<Appointment>): void {
    const appointment = this.appointments.get(id);
    if (appointment) {
      this.appointments.set(id, { ...appointment, ...updates });
    }
  }

  getAppointmentServicesForAppointment(appointmentId: string): AppointmentService[] {
    return Array.from(this.appointmentServices.values()).filter(
      as => as.appointment_id === appointmentId
    );
  }

  // Initialize with default data for fallback when backend is unavailable
  initializeDefaultData(): void {
    // Only initialize if empty (to avoid overwriting existing data)
    if (this.shops.size > 0) return;

    // Create a default shop owner user ID
    const defaultShopOwnerId = 'mock_shop_owner_1';
    const defaultShopId = 'mock_shop_1';

    // Create default shop
    const defaultShop: Shop = {
      id: defaultShopId,
      name: 'Elite Barbershop',
      address: '123 Main Street, New York, NY 10001',
      owner_id: defaultShopOwnerId,
      rating: 4.5,
      qr_code: 'QR_ELITE_001',
      phone: '+1-555-0100',
      description: 'Premium barbershop offering top-notch haircuts and grooming services',
      opening_hours: {
        monday: '9:00 AM - 6:00 PM',
        tuesday: '9:00 AM - 6:00 PM',
        wednesday: '9:00 AM - 6:00 PM',
        thursday: '9:00 AM - 6:00 PM',
        friday: '9:00 AM - 7:00 PM',
        saturday: '9:00 AM - 5:00 PM',
        sunday: '10:00 AM - 4:00 PM',
      },
    };
    this.shops.set(defaultShop.id, defaultShop);

    // Create shop owner link
    const shopOwner: ShopOwner = {
      id: 'mock_shopowner_1',
      shop_id: defaultShopId,
      user_id: defaultShopOwnerId,
    };
    this.shopOwners.set(shopOwner.id, shopOwner);

    // Create default services
    const defaultServices: Service[] = [
      {
        id: 'mock_service_1',
        name: 'Classic Haircut',
        price: 25.00,
        duration: 30,
        shop_id: defaultShopId,
        description: 'Traditional men\'s haircut with scissors and clippers',
        is_custom: false,
      },
      {
        id: 'mock_service_2',
        name: 'Beard Trim',
        price: 15.00,
        duration: 20,
        shop_id: defaultShopId,
        description: 'Professional beard trimming and shaping',
        is_custom: false,
      },
      {
        id: 'mock_service_3',
        name: 'Haircut + Beard',
        price: 35.00,
        duration: 45,
        shop_id: defaultShopId,
        description: 'Complete grooming package - haircut and beard trim',
        is_custom: false,
      },
      {
        id: 'mock_service_4',
        name: 'Hot Towel Shave',
        price: 30.00,
        duration: 25,
        shop_id: defaultShopId,
        description: 'Traditional hot towel straight razor shave',
        is_custom: false,
      },
    ];

    defaultServices.forEach(service => {
      this.services.set(service.id, service);
    });
  }
}

// Create instance and initialize with default data
export const mockDb = new MockDb();
mockDb.initializeDefaultData();
