// Mock database with localStorage persistence
const STORAGE_KEYS = {
  SHOPS: 'barberqueue_shops',
  QUEUES: 'barberqueue_queues',
  SERVICES: 'barberqueue_services',
  SHOP_SERVICES: 'barberqueue_shop_services',
  QUEUE_SERVICES: 'barberqueue_queue_services',
  USERS: 'barberqueue_users',
  SHOP_OWNERS: 'barberqueue_shop_owners',
  DATA_VERSION: 'barberqueue_data_version',
};

// Data version - increment this to force data refresh
const DATA_VERSION = '2.0.0';

// Helper functions
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Generate UUID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Initialize default data
const initializeData = () => {
  // Default services - Indian barbershop services
  const defaultServices = [
    { id: 's1', name: 'Classic Haircut', duration: 30, price: 250, description: 'Traditional haircut with scissors', is_custom: false, shop_id: null },
    { id: 's2', name: 'Beard Trim & Shape', duration: 15, price: 150, description: 'Professional beard trimming and shaping', is_custom: false, shop_id: null },
    { id: 's3', name: 'Traditional Shave', duration: 45, price: 200, description: 'Classic straight razor shave with hot towel', is_custom: false, shop_id: null },
    { id: 's4', name: 'Hair Color', duration: 60, price: 500, description: 'Professional hair coloring', is_custom: false, shop_id: null },
    { id: 's5', name: 'Head Massage', duration: 20, price: 180, description: 'Relaxing Indian head massage with oil', is_custom: false, shop_id: null },
    { id: 's6', name: 'Royal Grooming Package', duration: 90, price: 800, description: 'Haircut, beard trim, shave, and head massage', is_custom: false, shop_id: null },
    { id: 's7', name: 'Kids Haircut', duration: 20, price: 180, description: 'Haircut for children under 12', is_custom: false, shop_id: null },
    { id: 's8', name: 'Hair Spa Treatment', duration: 45, price: 600, description: 'Deep conditioning and scalp treatment', is_custom: false, shop_id: null },
    { id: 's9', name: 'Facial & Cleanup', duration: 40, price: 400, description: 'Professional facial and skin cleanup', is_custom: false, shop_id: null },
  ];

  // Barbershops in Hubli-Dharwad
  const defaultShops = [
    {
      id: 'shop1',
      name: 'Sharma Hair Studio',
      address: 'Shop 12, Saptapur, Dharwad, Karnataka',
      rating: 4.5,
      qr_code: 'SHOP_DHARWAD_QR001',
      image: '/placeholder.svg',
      phone: '+91 98765 43210',
      description: 'Premier barbershop in the heart of Dharwad offering modern styles and traditional grooming',
      latitude: 15.4589,
      longitude: 75.0078,
      distance: 1.93,
      current_queue: 3,
      estimated_wait: 45,
      opening_hours: {
        monday: '10:00 AM - 8:00 PM',
        tuesday: '10:00 AM - 8:00 PM',
        wednesday: '10:00 AM - 8:00 PM',
        thursday: '10:00 AM - 8:00 PM',
        friday: '10:00 AM - 8:00 PM',
        saturday: '9:00 AM - 9:00 PM',
        sunday: '9:00 AM - 9:00 PM'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'shop2',
      name: 'Royal Cuts Hubli',
      address: 'Gokul Road, Hubli, Karnataka',
      rating: 4.8,
      qr_code: 'SHOP_HUBLI_QR002',
      image: '/placeholder.svg',
      phone: '+91 98123 45678',
      description: 'Luxury grooming experience with expert stylists in Gokul Road, Hubli',
      latitude: 15.3647,
      longitude: 75.1240,
      distance: 4.02,
      current_queue: 5,
      estimated_wait: 60,
      opening_hours: {
        monday: '11:00 AM - 9:00 PM',
        tuesday: '11:00 AM - 9:00 PM',
        wednesday: '11:00 AM - 9:00 PM',
        thursday: '11:00 AM - 9:00 PM',
        friday: '11:00 AM - 10:00 PM',
        saturday: '10:00 AM - 10:00 PM',
        sunday: '10:00 AM - 10:00 PM'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'shop3',
      name: 'Singh Brothers Salon',
      address: 'Vidyanagar, Hubli, Karnataka',
      rating: 4.6,
      qr_code: 'SHOP_HUBLI_QR003',
      image: '/placeholder.svg',
      phone: '+91 98765 11111',
      description: 'Traditional barbershop with modern amenities and expert barbers in Vidyanagar',
      latitude: 15.3750,
      longitude: 75.1150,
      distance: 1.29,
      current_queue: 2,
      estimated_wait: 30,
      opening_hours: {
        monday: '9:00 AM - 8:00 PM',
        tuesday: '9:00 AM - 8:00 PM',
        wednesday: '9:00 AM - 8:00 PM',
        thursday: '9:00 AM - 8:00 PM',
        friday: '9:00 AM - 8:00 PM',
        saturday: '9:00 AM - 9:00 PM',
        sunday: '9:00 AM - 7:00 PM'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'shop4',
      name: 'Gentlemen\'s Lounge Hubli',
      address: 'Deshpande Nagar, Hubli, Karnataka',
      rating: 4.7,
      qr_code: 'SHOP_HUBLI_QR004',
      image: '/placeholder.svg',
      phone: '+91 98765 22222',
      description: 'Upscale men\'s grooming lounge in trendy Deshpande Nagar, Hubli',
      latitude: 15.3500,
      longitude: 75.1300,
      distance: 4.99,
      current_queue: 4,
      estimated_wait: 50,
      opening_hours: {
        monday: '10:00 AM - 9:00 PM',
        tuesday: '10:00 AM - 9:00 PM',
        wednesday: '10:00 AM - 9:00 PM',
        thursday: '10:00 AM - 9:00 PM',
        friday: '10:00 AM - 10:00 PM',
        saturday: '9:00 AM - 10:00 PM',
        sunday: '9:00 AM - 9:00 PM'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'shop5',
      name: 'Kumar\'s Classic Cuts',
      address: 'Keshwapur, Hubli, Karnataka',
      rating: 4.4,
      qr_code: 'SHOP_HUBLI_QR005',
      image: '/placeholder.svg',
      phone: '+91 98765 33333',
      description: 'Family-friendly salon serving Hubli-Dharwad for over 20 years',
      latitude: 15.3400,
      longitude: 75.1100,
      distance: 2.41,
      current_queue: 1,
      estimated_wait: 20,
      opening_hours: {
        monday: '9:00 AM - 8:00 PM',
        tuesday: '9:00 AM - 8:00 PM',
        wednesday: '9:00 AM - 8:00 PM',
        thursday: '9:00 AM - 8:00 PM',
        friday: '9:00 AM - 8:00 PM',
        saturday: '8:00 AM - 9:00 PM',
        sunday: '8:00 AM - 8:00 PM'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'shop6',
      name: 'Patel Hair & Beard Studio',
      address: 'Station Road, Hubli, Karnataka',
      rating: 4.9,
      qr_code: 'SHOP_HUBLI_QR006',
      image: '/placeholder.svg',
      phone: '+91 98765 44444',
      description: 'Award-winning salon specializing in beard artistry and contemporary styles',
      latitude: 15.3600,
      longitude: 75.1200,
      distance: 0.97,
      current_queue: 6,
      estimated_wait: 75,
      opening_hours: {
        monday: '10:00 AM - 9:00 PM',
        tuesday: '10:00 AM - 9:00 PM',
        wednesday: '10:00 AM - 9:00 PM',
        thursday: '10:00 AM - 9:00 PM',
        friday: '10:00 AM - 10:00 PM',
        saturday: '9:00 AM - 10:00 PM',
        sunday: '9:00 AM - 10:00 PM'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'shop7',
      name: 'The Groom Room Dharwad',
      address: 'Vidyanagar, Dharwad, Karnataka',
      rating: 4.5,
      qr_code: 'SHOP_DHARWAD_QR007',
      image: '/placeholder.svg',
      phone: '+91 98765 55555',
      description: 'Modern grooming studio with traditional hospitality in Vidyanagar, Dharwad',
      latitude: 15.4500,
      longitude: 75.0100,
      distance: 4.51,
      current_queue: 2,
      estimated_wait: 35,
      opening_hours: {
        monday: '10:00 AM - 8:00 PM',
        tuesday: '10:00 AM - 8:00 PM',
        wednesday: '10:00 AM - 8:00 PM',
        thursday: '10:00 AM - 8:00 PM',
        friday: '10:00 AM - 9:00 PM',
        saturday: '9:00 AM - 9:00 PM',
        sunday: '9:00 AM - 8:00 PM'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'shop8',
      name: 'Mehta Salon Hubli',
      address: 'Old Hubli, Hubli, Karnataka',
      rating: 4.3,
      qr_code: 'SHOP_HUBLI_QR008',
      image: '/placeholder.svg',
      phone: '+91 98765 66666',
      description: 'Heritage salon in Old Hubli serving Hubli-Dharwad since 1985',
      latitude: 15.3700,
      longitude: 75.1250,
      distance: 3.06,
      current_queue: 3,
      estimated_wait: 40,
      opening_hours: {
        monday: '9:00 AM - 8:00 PM',
        tuesday: '9:00 AM - 8:00 PM',
        wednesday: '9:00 AM - 8:00 PM',
        thursday: '9:00 AM - 8:00 PM',
        friday: '9:00 AM - 9:00 PM',
        saturday: '8:00 AM - 9:00 PM',
        sunday: '8:00 AM - 8:00 PM'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Indian users
  const defaultUsers = [
    { id: 'user1', email: 'shop@demo.com', role: 'shop_owner', name: 'Rajesh Sharma' },
    { id: 'user2', email: 'customer@demo.com', role: 'customer', name: 'Arjun Kumar' },
    { id: 'user3', email: 'owner2@demo.com', role: 'shop_owner', name: 'Vikram Singh' },
    { id: 'user4', email: 'owner3@demo.com', role: 'shop_owner', name: 'Amit Patel' },
    { id: 'user5', email: 'customer2@demo.com', role: 'customer', name: 'Priya Mehta' },
    { id: 'user6', email: 'customer3@demo.com', role: 'customer', name: 'Rahul Verma' },
  ];

  // Check data version - if it doesn't match, update all data
  const currentVersion = localStorage.getItem(STORAGE_KEYS.DATA_VERSION);
  const shouldUpdateData = currentVersion !== DATA_VERSION;

  if (shouldUpdateData || !localStorage.getItem(STORAGE_KEYS.SERVICES)) {
    saveToStorage(STORAGE_KEYS.SERVICES, defaultServices);
  }
  if (shouldUpdateData || !localStorage.getItem(STORAGE_KEYS.SHOPS)) {
    saveToStorage(STORAGE_KEYS.SHOPS, defaultShops);
  }
  if (shouldUpdateData || !localStorage.getItem(STORAGE_KEYS.USERS)) {
    saveToStorage(STORAGE_KEYS.USERS, defaultUsers);
  }
  if (shouldUpdateData || !localStorage.getItem(STORAGE_KEYS.SHOP_OWNERS)) {
    saveToStorage(STORAGE_KEYS.SHOP_OWNERS, [
      { id: 'so1', user_id: 'user1', shop_id: 'shop1' },
      { id: 'so2', user_id: 'user3', shop_id: 'shop2' },
      { id: 'so3', user_id: 'user4', shop_id: 'shop3' },
    ]);
  }
  if (shouldUpdateData || !localStorage.getItem(STORAGE_KEYS.SHOP_SERVICES)) {
    saveToStorage(STORAGE_KEYS.SHOP_SERVICES, [
      // Sharma Hair Studio services
      { id: 'ss1', shop_id: 'shop1', service_id: 's1', custom_price: null, custom_duration: null },
      { id: 'ss2', shop_id: 'shop1', service_id: 's2', custom_price: null, custom_duration: null },
      { id: 'ss3', shop_id: 'shop1', service_id: 's3', custom_price: null, custom_duration: null },
      { id: 'ss4', shop_id: 'shop1', service_id: 's5', custom_price: null, custom_duration: null },
      // Royal Cuts Mumbai services
      { id: 'ss5', shop_id: 'shop2', service_id: 's1', custom_price: 300, custom_duration: null },
      { id: 'ss6', shop_id: 'shop2', service_id: 's2', custom_price: 200, custom_duration: null },
      { id: 'ss7', shop_id: 'shop2', service_id: 's6', custom_price: null, custom_duration: null },
      { id: 'ss8', shop_id: 'shop2', service_id: 's9', custom_price: null, custom_duration: null },
      // Singh Brothers Salon services
      { id: 'ss9', shop_id: 'shop3', service_id: 's1', custom_price: null, custom_duration: null },
      { id: 'ss10', shop_id: 'shop3', service_id: 's2', custom_price: null, custom_duration: null },
      { id: 'ss11', shop_id: 'shop3', service_id: 's7', custom_price: null, custom_duration: null },
      // Gentlemen's Lounge services
      { id: 'ss12', shop_id: 'shop4', service_id: 's1', custom_price: 350, custom_duration: null },
      { id: 'ss13', shop_id: 'shop4', service_id: 's6', custom_price: null, custom_duration: null },
      { id: 'ss14', shop_id: 'shop4', service_id: 's8', custom_price: null, custom_duration: null },
      // Kumar's Classic Cuts services
      { id: 'ss15', shop_id: 'shop5', service_id: 's1', custom_price: null, custom_duration: null },
      { id: 'ss16', shop_id: 'shop5', service_id: 's2', custom_price: null, custom_duration: null },
      { id: 'ss17', shop_id: 'shop5', service_id: 's7', custom_price: 150, custom_duration: null },
      // Patel Hair & Beard Studio services
      { id: 'ss18', shop_id: 'shop6', service_id: 's1', custom_price: null, custom_duration: null },
      { id: 'ss19', shop_id: 'shop6', service_id: 's2', custom_price: 180, custom_duration: 20 },
      { id: 'ss20', shop_id: 'shop6', service_id: 's3', custom_price: null, custom_duration: null },
      { id: 'ss21', shop_id: 'shop6', service_id: 's6', custom_price: null, custom_duration: null },
      // The Groom Room services
      { id: 'ss22', shop_id: 'shop7', service_id: 's1', custom_price: null, custom_duration: null },
      { id: 'ss23', shop_id: 'shop7', service_id: 's2', custom_price: null, custom_duration: null },
      { id: 'ss24', shop_id: 'shop7', service_id: 's8', custom_price: null, custom_duration: null },
      // Mehta Salon services
      { id: 'ss25', shop_id: 'shop8', service_id: 's1', custom_price: null, custom_duration: null },
      { id: 'ss26', shop_id: 'shop8', service_id: 's3', custom_price: null, custom_duration: null },
      { id: 'ss27', shop_id: 'shop8', service_id: 's5', custom_price: null, custom_duration: null },
    ]);
  }
  if (shouldUpdateData || !localStorage.getItem(STORAGE_KEYS.QUEUES)) {
    saveToStorage(STORAGE_KEYS.QUEUES, []);
  }
  if (shouldUpdateData || !localStorage.getItem(STORAGE_KEYS.QUEUE_SERVICES)) {
    saveToStorage(STORAGE_KEYS.QUEUE_SERVICES, []);
  }
  
  // Save the current data version
  if (shouldUpdateData) {
    saveToStorage(STORAGE_KEYS.DATA_VERSION, DATA_VERSION);
  }
};

// Initialize on import
initializeData();

export const mockDb = {
  // Shops
  getShops: () => getFromStorage(STORAGE_KEYS.SHOPS, []),
  getShop: (id: string) => getFromStorage(STORAGE_KEYS.SHOPS, []).find((s: any) => s.id === id),
  getShopByQR: (qrCode: string) => getFromStorage(STORAGE_KEYS.SHOPS, []).find((s: any) => s.qr_code === qrCode),
  updateShop: (id: string, updates: any) => {
    const shops = getFromStorage(STORAGE_KEYS.SHOPS, []);
    const index = shops.findIndex((s: any) => s.id === id);
    if (index !== -1) {
      shops[index] = { ...shops[index], ...updates, updated_at: new Date().toISOString() };
      saveToStorage(STORAGE_KEYS.SHOPS, shops);
    }
    return shops[index];
  },
  createShop: (shop: any) => {
    const shops = getFromStorage(STORAGE_KEYS.SHOPS, []);
    const newShop = { ...shop, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    shops.push(newShop);
    saveToStorage(STORAGE_KEYS.SHOPS, shops);
    return newShop;
  },

  // Services
  getServices: () => getFromStorage(STORAGE_KEYS.SERVICES, []),
  getService: (id: string) => getFromStorage(STORAGE_KEYS.SERVICES, []).find((s: any) => s.id === id),
  createService: (service: any) => {
    const services = getFromStorage(STORAGE_KEYS.SERVICES, []);
    const newService = { ...service, id: generateId() };
    services.push(newService);
    saveToStorage(STORAGE_KEYS.SERVICES, services);
    return newService;
  },
  deleteService: (id: string) => {
    const services = getFromStorage(STORAGE_KEYS.SERVICES, []);
    const filtered = services.filter((s: any) => s.id !== id);
    saveToStorage(STORAGE_KEYS.SERVICES, filtered);
  },

  // Shop Services
  getShopServices: () => getFromStorage(STORAGE_KEYS.SHOP_SERVICES, []),
  getShopServicesForShop: (shopId: string) => 
    getFromStorage(STORAGE_KEYS.SHOP_SERVICES, []).filter((ss: any) => ss.shop_id === shopId),
  addShopService: (shopService: any) => {
    const shopServices = getFromStorage(STORAGE_KEYS.SHOP_SERVICES, []);
    const newShopService = { ...shopService, id: generateId() };
    shopServices.push(newShopService);
    saveToStorage(STORAGE_KEYS.SHOP_SERVICES, shopServices);
    return newShopService;
  },
  updateShopService: (id: string, updates: any) => {
    const shopServices = getFromStorage(STORAGE_KEYS.SHOP_SERVICES, []);
    const index = shopServices.findIndex((ss: any) => ss.id === id);
    if (index !== -1) {
      shopServices[index] = { ...shopServices[index], ...updates };
      saveToStorage(STORAGE_KEYS.SHOP_SERVICES, shopServices);
    }
    return shopServices[index];
  },
  deleteShopService: (shopId: string, serviceId: string) => {
    const shopServices = getFromStorage(STORAGE_KEYS.SHOP_SERVICES, []);
    const filtered = shopServices.filter((ss: any) => !(ss.shop_id === shopId && ss.service_id === serviceId));
    saveToStorage(STORAGE_KEYS.SHOP_SERVICES, filtered);
  },

  // Queues
  getQueues: () => getFromStorage(STORAGE_KEYS.QUEUES, []),
  getQueue: (id: string) => getFromStorage(STORAGE_KEYS.QUEUES, []).find((q: any) => q.id === id),
  getQueuesByShop: (shopId: string) => 
    getFromStorage(STORAGE_KEYS.QUEUES, []).filter((q: any) => q.shop_id === shopId),
  getActiveQueue: (customerName: string) =>
    getFromStorage(STORAGE_KEYS.QUEUES, []).find((q: any) => 
      q.customer_name === customerName && ['waiting', 'in_progress'].includes(q.status)
    ),
  createQueue: (queue: any) => {
    const queues = getFromStorage(STORAGE_KEYS.QUEUES, []);
    const newQueue = { 
      ...queue, 
      id: generateId(), 
      joined_at: new Date().toISOString(),
      status: 'waiting'
    };
    queues.push(newQueue);
    saveToStorage(STORAGE_KEYS.QUEUES, queues);
    return newQueue;
  },
  updateQueue: (id: string, updates: any) => {
    const queues = getFromStorage(STORAGE_KEYS.QUEUES, []);
    const index = queues.findIndex((q: any) => q.id === id);
    if (index !== -1) {
      queues[index] = { ...queues[index], ...updates };
      saveToStorage(STORAGE_KEYS.QUEUES, queues);
    }
    return queues[index];
  },
  deleteQueue: (id: string) => {
    const queues = getFromStorage(STORAGE_KEYS.QUEUES, []);
    const filtered = queues.filter((q: any) => q.id !== id);
    saveToStorage(STORAGE_KEYS.QUEUES, filtered);
  },

  // Queue Services
  getQueueServices: () => getFromStorage(STORAGE_KEYS.QUEUE_SERVICES, []),
  getQueueServicesForQueue: (queueId: string) =>
    getFromStorage(STORAGE_KEYS.QUEUE_SERVICES, []).filter((qs: any) => qs.queue_id === queueId),
  addQueueServices: (queueServices: any[]) => {
    const current = getFromStorage(STORAGE_KEYS.QUEUE_SERVICES, []);
    const newServices = queueServices.map(qs => ({ ...qs, id: generateId() }));
    saveToStorage(STORAGE_KEYS.QUEUE_SERVICES, [...current, ...newServices]);
    return newServices;
  },
  deleteQueueServicesForQueue: (queueId: string) => {
    const queueServices = getFromStorage(STORAGE_KEYS.QUEUE_SERVICES, []);
    const filtered = queueServices.filter((qs: any) => qs.queue_id !== queueId);
    saveToStorage(STORAGE_KEYS.QUEUE_SERVICES, filtered);
  },

  // Users
  getUsers: () => getFromStorage(STORAGE_KEYS.USERS, []),
  getUser: (id: string) => getFromStorage(STORAGE_KEYS.USERS, []).find((u: any) => u.id === id),
  getUserByEmail: (email: string) => getFromStorage(STORAGE_KEYS.USERS, []).find((u: any) => u.email === email),
  createUser: (user: any) => {
    const users = getFromStorage(STORAGE_KEYS.USERS, []);
    const newUser = { ...user, id: generateId() };
    users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  },
  updateUser: (id: string, updates: any) => {
    const users = getFromStorage(STORAGE_KEYS.USERS, []);
    const index = users.findIndex((u: any) => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      saveToStorage(STORAGE_KEYS.USERS, users);
      return users[index];
    }
    return null;
  },

  // Shop Owners
  getShopOwners: () => getFromStorage(STORAGE_KEYS.SHOP_OWNERS, []),
  getShopOwnerByUser: (userId: string) => 
    getFromStorage(STORAGE_KEYS.SHOP_OWNERS, []).find((so: any) => so.user_id === userId),
  createShopOwner: (shopOwner: any) => {
    const shopOwners = getFromStorage(STORAGE_KEYS.SHOP_OWNERS, []);
    const newShopOwner = { ...shopOwner, id: generateId() };
    shopOwners.push(newShopOwner);
    saveToStorage(STORAGE_KEYS.SHOP_OWNERS, shopOwners);
    return newShopOwner;
  },
};
