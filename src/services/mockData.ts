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
  latitude?: number | null;
  longitude?: number | null;
  distance?: number | null;
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

  constructor() {
    // Load appointments from localStorage on initialization
    this.loadAppointmentsFromStorage();
  }

  private loadAppointmentsFromStorage() {
    try {
      const stored = localStorage.getItem('winqroo_mock_appointments');
      if (stored) {
        const appointments = JSON.parse(stored);
        appointments.forEach((apt: Appointment) => {
          this.appointments.set(apt.id, apt);
        });
        console.log(`📦 Loaded ${appointments.length} appointments from localStorage`);
      }
    } catch (error) {
      console.error('Error loading appointments from storage:', error);
    }
  }

  private saveAppointmentsToStorage() {
    try {
      const appointments = Array.from(this.appointments.values());
      localStorage.setItem('winqroo_mock_appointments', JSON.stringify(appointments));
    } catch (error) {
      console.error('Error saving appointments to storage:', error);
    }
  }

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

  getQueue(id: string): Queue | undefined {
    return this.queues.get(id);
  }

  getActiveQueue(customerName: string): Queue | null {
    const allQueues = Array.from(this.queues.values());
    return allQueues.find(
      q => q.customer_name === customerName && (q.status === 'waiting' || q.status === 'in_progress')
    ) || null;
  }

  createQueue(data: {
    shop_id: string;
    customer_id: string;
    service_id: string;
    customer_name?: string;
    payment_option?: string;
    is_emergency?: boolean;
    emergency_reason?: string;
  }): Queue {
    // Calculate position based on existing queues for this shop
    const existingQueues = this.getQueuesByShop(data.shop_id).filter(
      q => q.status === 'waiting' || q.status === 'in_progress'
    );
    const position = existingQueues.length + 1;

    const queue: Queue = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      shop_id: data.shop_id,
      customer_id: data.customer_id,
      service_id: data.service_id,
      position,
      status: 'waiting',
      estimated_wait: position * 15, // Rough estimate: 15 min per person
      joined_at: new Date().toISOString(),
      customer_name: data.customer_name,
    };
    
    this.queues.set(queue.id, queue);
    
    // Add queue service
    const queueService: QueueService = {
      id: `queueservice_${Date.now()}`,
      queue_id: queue.id,
      service_id: data.service_id,
    };
    this.queueServices.set(queueService.id, queueService);
    
    return queue;
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
    const allAppointments = Array.from(this.appointments.values());
    // Try both string comparison and ensure we match the format
    const userAppointments = allAppointments.filter(a => {
      const customerId = a.customer_id?.toString() || '';
      const searchId = userId?.toString() || '';
      return customerId === searchId;
    });
    console.log(`🔍 Searching appointments for user ${userId}: Found ${userAppointments.length} out of ${allAppointments.length} total`);
    return userAppointments;
  }

  getAppointmentsByShop(shopId: string): Appointment[] {
    return Array.from(this.appointments.values()).filter(a => a.shop_id === shopId);
  }

  addAppointment(appointment: Appointment): void {
    this.appointments.set(appointment.id, appointment);
    this.saveAppointmentsToStorage(); // Persist to localStorage
    console.log(`✅ Appointment ${appointment.id} saved to mock DB`);
  }

  updateAppointment(id: string, updates: Partial<Appointment>): void {
    const appointment = this.appointments.get(id);
    if (appointment) {
      this.appointments.set(id, { ...appointment, ...updates });
      this.saveAppointmentsToStorage(); // Persist to localStorage
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

    // Create 7 Indian shops in Dharwad
    const dharwadShops: Shop[] = [
      {
        id: 'mock_shop_1',
        name: 'Raj Hair Salon',
        address: 'Station Road, Near City Bus Stand, Dharwad, Karnataka 580001',
        owner_id: 'mock_owner_1',
        rating: 4.5,
        qr_code: 'SHOP_RAJ_001',
        phone: '+91-836-2345678',
        description: 'Premium hair salon offering modern haircuts and styling services in Dharwad',
        latitude: 15.4589,
        longitude: 75.0078,
        distance: null,
        opening_hours: {
          monday: '9:00 AM - 7:00 PM',
          tuesday: '9:00 AM - 7:00 PM',
          wednesday: '9:00 AM - 7:00 PM',
          thursday: '9:00 AM - 7:00 PM',
          friday: '9:00 AM - 8:00 PM',
          saturday: '9:00 AM - 7:00 PM',
          sunday: '10:00 AM - 6:00 PM'
        },
      },
      {
        id: 'mock_shop_2',
        name: 'Kumar Hair Studio',
        address: 'KCD Circle, Near Hubli-Dharwad Road, Dharwad, Karnataka 580001',
        owner_id: 'mock_owner_2',
        rating: 4.3,
        qr_code: 'SHOP_KUMAR_002',
        phone: '+91-836-2456789',
        description: 'Modern salon with trendy cuts and styling in Dharwad',
        latitude: 15.4620,
        longitude: 75.0120,
        distance: null,
        opening_hours: {
          monday: '9:00 AM - 7:00 PM',
          tuesday: '9:00 AM - 7:00 PM',
          wednesday: '9:00 AM - 7:00 PM',
          thursday: '9:00 AM - 7:00 PM',
          friday: '9:00 AM - 8:00 PM',
          saturday: '9:00 AM - 7:00 PM',
          sunday: '10:00 AM - 6:00 PM'
        },
      },
      {
        id: 'mock_shop_3',
        name: 'Naik Barber Shop',
        address: 'Gandhi Chowk, Near Old Bus Stand, Dharwad, Karnataka 580001',
        owner_id: 'mock_owner_3',
        rating: 4.2,
        qr_code: 'SHOP_NAIK_003',
        phone: '+91-836-2567890',
        description: 'Classic barbershop with traditional charm in Dharwad',
        latitude: 15.4550,
        longitude: 75.0050,
        distance: null,
        opening_hours: {
          monday: '8:00 AM - 8:00 PM',
          tuesday: '8:00 AM - 8:00 PM',
          wednesday: '8:00 AM - 8:00 PM',
          thursday: '8:00 AM - 8:00 PM',
          friday: '8:00 AM - 8:00 PM',
          saturday: '8:00 AM - 7:00 PM',
          sunday: '9:00 AM - 6:00 PM'
        },
      },
      {
        id: 'mock_shop_4',
        name: 'Premium Cuts Dharwad',
        address: 'SDM College Road, Near Saptapur, Dharwad, Karnataka 580009',
        owner_id: 'mock_owner_4',
        rating: 4.7,
        qr_code: 'SHOP_PREMIUM_004',
        phone: '+91-836-2678901',
        description: 'Luxury grooming experience for the modern gentleman in Dharwad',
        latitude: 15.4650,
        longitude: 75.0150,
        distance: null,
        opening_hours: {
          monday: '10:00 AM - 8:00 PM',
          tuesday: '10:00 AM - 8:00 PM',
          wednesday: '10:00 AM - 8:00 PM',
          thursday: '10:00 AM - 8:00 PM',
          friday: '10:00 AM - 9:00 PM',
          saturday: '10:00 AM - 8:00 PM',
          sunday: '11:00 AM - 7:00 PM'
        },
      },
      {
        id: 'mock_shop_5',
        name: 'Quick Cuts Dharwad',
        address: 'Karnataka College Road, Near Market, Dharwad, Karnataka 580001',
        owner_id: 'mock_owner_5',
        rating: 4.0,
        qr_code: 'SHOP_QUICK_005',
        phone: '+91-836-2789012',
        description: 'Fast, affordable haircuts for everyone in Dharwad',
        latitude: 15.4600,
        longitude: 75.0100,
        distance: null,
        opening_hours: {
          monday: '8:00 AM - 8:00 PM',
          tuesday: '8:00 AM - 8:00 PM',
          wednesday: '8:00 AM - 8:00 PM',
          thursday: '8:00 AM - 8:00 PM',
          friday: '8:00 AM - 8:00 PM',
          saturday: '8:00 AM - 7:00 PM',
          sunday: '9:00 AM - 6:00 PM'
        },
      },
      {
        id: 'mock_shop_6',
        name: 'Urban Cuts Dharwad',
        address: 'Vidyagiri, Near BVB College, Dharwad, Karnataka 580004',
        owner_id: 'mock_owner_6',
        rating: 4.4,
        qr_code: 'SHOP_URBAN_006',
        phone: '+91-836-2890123',
        description: 'Trendy urban barbershop with modern techniques in Dharwad',
        latitude: 15.4630,
        longitude: 75.0080,
        distance: null,
        opening_hours: {
          monday: '9:00 AM - 7:00 PM',
          tuesday: '9:00 AM - 7:00 PM',
          wednesday: '9:00 AM - 7:00 PM',
          thursday: '9:00 AM - 7:00 PM',
          friday: '9:00 AM - 8:00 PM',
          saturday: '9:00 AM - 7:00 PM',
          sunday: '10:00 AM - 6:00 PM'
        },
      },
      {
        id: 'mock_shop_7',
        name: 'Gentleman\'s Groom Dharwad',
        address: 'HDMC Road, Near Court Circle, Dharwad, Karnataka 580001',
        owner_id: 'mock_owner_7',
        rating: 4.6,
        qr_code: 'SHOP_GENTLEMAN_007',
        phone: '+91-836-2901234',
        description: 'Premium grooming services for the distinguished gentleman in Dharwad',
        latitude: 15.4590,
        longitude: 75.0090,
        distance: null,
        opening_hours: {
          monday: '10:00 AM - 8:00 PM',
          tuesday: '10:00 AM - 8:00 PM',
          wednesday: '10:00 AM - 8:00 PM',
          thursday: '10:00 AM - 8:00 PM',
          friday: '10:00 AM - 9:00 PM',
          saturday: '10:00 AM - 8:00 PM',
          sunday: '11:00 AM - 7:00 PM'
        },
      },
    ];

    dharwadShops.forEach(shop => {
      this.shops.set(shop.id, shop);
    });

    // Create shop owner links
    dharwadShops.forEach((shop, index) => {
      const shopOwner: ShopOwner = {
        id: `mock_shopowner_${index + 1}`,
        shop_id: shop.id,
        user_id: shop.owner_id,
      };
      this.shopOwners.set(shopOwner.id, shopOwner);
    });

    // Create default services
    // Create services for all shops
    const defaultServices: Service[] = [
      // Services for Raj Hair Salon (shop_1)
      { id: 'mock_service_1', name: 'Classic Haircut', price: 150, duration: 30, shop_id: 'mock_shop_1', description: 'Traditional men\'s haircut with scissors and clippers', is_custom: false },
      { id: 'mock_service_2', name: 'Beard Trim', price: 80, duration: 20, shop_id: 'mock_shop_1', description: 'Professional beard trimming and shaping', is_custom: false },
      { id: 'mock_service_3', name: 'Haircut + Beard', price: 200, duration: 45, shop_id: 'mock_shop_1', description: 'Complete grooming package - haircut and beard trim', is_custom: false },
      { id: 'mock_service_4', name: 'Hot Towel Shave', price: 120, duration: 25, shop_id: 'mock_shop_1', description: 'Traditional hot towel straight razor shave', is_custom: false },
      // Services for Kumar Hair Studio (shop_2)
      { id: 'mock_service_5', name: 'Fade Cut', price: 180, duration: 35, shop_id: 'mock_shop_2', description: 'Modern fade haircut', is_custom: false },
      { id: 'mock_service_6', name: 'Hair Styling', price: 100, duration: 20, shop_id: 'mock_shop_2', description: 'Professional styling', is_custom: false },
      { id: 'mock_service_7', name: 'Hair Wash & Cut', price: 250, duration: 45, shop_id: 'mock_shop_2', description: 'Wash, cut, and style', is_custom: false },
      // Services for Naik Barber Shop (shop_3)
      { id: 'mock_service_8', name: 'Traditional Cut', price: 120, duration: 30, shop_id: 'mock_shop_3', description: 'Classic barbershop cut', is_custom: false },
      { id: 'mock_service_9', name: 'Straight Razor Shave', price: 100, duration: 30, shop_id: 'mock_shop_3', description: 'Traditional straight razor', is_custom: false },
      { id: 'mock_service_10', name: 'Mustache Trim', price: 60, duration: 15, shop_id: 'mock_shop_3', description: 'Precise mustache trimming', is_custom: false },
      // Services for Premium Cuts (shop_4)
      { id: 'mock_service_11', name: 'Executive Cut', price: 300, duration: 40, shop_id: 'mock_shop_4', description: 'Premium haircut for professionals', is_custom: false },
      { id: 'mock_service_12', name: 'Deluxe Grooming', price: 450, duration: 60, shop_id: 'mock_shop_4', description: 'Full grooming service', is_custom: false },
      { id: 'mock_service_13', name: 'Beard Styling', price: 150, duration: 25, shop_id: 'mock_shop_4', description: 'Professional beard styling', is_custom: false },
      { id: 'mock_service_14', name: 'Hair Treatment', price: 200, duration: 20, shop_id: 'mock_shop_4', description: 'Deep conditioning treatment', is_custom: false },
      // Services for Quick Cuts (shop_5)
      { id: 'mock_service_15', name: 'Quick Cut', price: 100, duration: 20, shop_id: 'mock_shop_5', description: 'Fast haircut service', is_custom: false },
      { id: 'mock_service_16', name: 'Beard Trim', price: 70, duration: 15, shop_id: 'mock_shop_5', description: 'Quick beard trim', is_custom: false },
      { id: 'mock_service_17', name: 'Student Discount Cut', price: 80, duration: 25, shop_id: 'mock_shop_5', description: 'Discounted cut for students', is_custom: false },
      // Services for Urban Cuts (shop_6)
      { id: 'mock_service_18', name: 'Urban Fade', price: 220, duration: 40, shop_id: 'mock_shop_6', description: 'Modern urban fade', is_custom: false },
      { id: 'mock_service_19', name: 'Design Cut', price: 250, duration: 45, shop_id: 'mock_shop_6', description: 'Creative design haircut', is_custom: false },
      { id: 'mock_service_20', name: 'Line Up', price: 110, duration: 20, shop_id: 'mock_shop_6', description: 'Precise line up service', is_custom: false },
      { id: 'mock_service_21', name: 'Color Touch Up', price: 350, duration: 30, shop_id: 'mock_shop_6', description: 'Hair color touch up', is_custom: false },
      // Services for Gentleman's Groom (shop_7)
      { id: 'mock_service_22', name: 'Signature Cut', price: 350, duration: 45, shop_id: 'mock_shop_7', description: 'Our signature haircut', is_custom: false },
      { id: 'mock_service_23', name: 'Royal Shave', price: 180, duration: 35, shop_id: 'mock_shop_7', description: 'Premium hot towel shave', is_custom: false },
      { id: 'mock_service_24', name: 'Complete Grooming', price: 500, duration: 75, shop_id: 'mock_shop_7', description: 'Full service grooming', is_custom: false },
      { id: 'mock_service_25', name: 'Beard Sculpting', price: 200, duration: 30, shop_id: 'mock_shop_7', description: 'Professional beard sculpting', is_custom: false },
      { id: 'mock_service_26', name: 'Hair & Scalp Treatment', price: 250, duration: 25, shop_id: 'mock_shop_7', description: 'Luxury hair treatment', is_custom: false },
    ];

    defaultServices.forEach(service => {
      this.services.set(service.id, service);
    });
  }
}

// Create instance and initialize with default data
export const mockDb = new MockDb();
mockDb.initializeDefaultData();
