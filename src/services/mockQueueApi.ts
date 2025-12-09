import { mockDb } from './mockData';

// Get all shops with queue info and calculate distances
export const getShops = async (searchQuery = '', userLat: number | null = null, userLng: number | null = null) => {
  try {
    let shops = mockDb.getShops();

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      shops = shops.filter((shop: any) => 
        shop.name.toLowerCase().includes(query) || 
        shop.address.toLowerCase().includes(query)
      );
    }

    // Get current queue counts for each shop
    const shopsWithQueue = shops.map((shop: any) => {
      const queues = mockDb.getQueuesByShop(shop.id);
      const waitingQueues = queues.filter((q: any) => q.status === 'waiting');
      
      return {
        ...shop,
        currentQueue: waitingQueues.length,
      };
    });

    // Sort by distance
    const sortedShops = shopsWithQueue.sort((a: any, b: any) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    return { data: sortedShops, error: null };
  } catch (error: any) {
    console.error('Error fetching shops:', error);
    return { data: null, error: error.message };
  }
};

// Get shop by ID
export const getShop = async (shopId: string) => {
  try {
    const shop = mockDb.getShop(shopId);
    if (!shop) throw new Error('Shop not found');
    return { data: shop, error: null };
  } catch (error: any) {
    console.error('Error fetching shop:', error);
    return { data: null, error: error.message };
  }
};

// Get shop by QR code
export const getShopByQR = async (qrCode: string) => {
  try {
    const shop = mockDb.getShopByQR(qrCode);
    if (!shop) throw new Error('Shop not found');
    return { data: shop, error: null };
  } catch (error: any) {
    console.error('Error fetching shop by QR:', error);
    return { data: null, error: error.message };
  }
};

// Get services for a shop
export const getShopServices = async (shopId: string) => {
  try {
    const shopServices = mockDb.getShopServicesForShop(shopId);
    const allServices = mockDb.getServices();
    
    const services = shopServices.map((ss: any) => {
      const service = allServices.find((s: any) => s.id === ss.service_id);
      return service ? { ...service } : null;
    }).filter(Boolean);

    return { data: services, error: null };
  } catch (error: any) {
    console.error('Error fetching shop services:', error);
    return { data: null, error: error.message };
  }
};

// Join queue with multiple services
export const joinQueue = async (
  shopId: string, 
  serviceIds: string[], 
  customerName: string, 
  userId: string | null = null,
  options: {
    payment_option?: 'pay_now' | 'pay_at_shop' | 'pay_after_service';
    is_emergency?: boolean;
    emergency_reason?: string;
  } = {}
) => {
  try {
    // Check if customer already has an active queue entry in ANY shop
    const existingQueue = mockDb.getActiveQueue(customerName);
    
    if (existingQueue) {
      const shop = mockDb.getShop(existingQueue.shop_id);
      const shopName = shop?.name || 'another shop';
      return { 
        data: null, 
        error: `You already have an active queue at ${shopName}. Please complete or cancel it before joining another queue.` 
      };
    }

    // Get user info for customer type and loyalty points
    const user = userId ? mockDb.getUser(userId) : null;
    const customerType = user?.customer_type || null;
    const loyaltyPoints = user?.loyalty_points || 0;

    // Get total duration for all selected services
    const services = mockDb.getServices().filter((s: any) => serviceIds.includes(s.id));
    const totalDuration = services.reduce((sum: number, service: any) => sum + service.duration, 0) || 30;

    // Insert queue entry (position will be calculated by createQueue based on priority)
    const queueData = mockDb.createQueue({
      shop_id: shopId,
      service_id: serviceIds[0],
      customer_name: customerName,
      user_id: userId,
      position: 1, // Will be recalculated
      estimated_wait: 0, // Will be recalculated
      status: 'waiting',
      customer_type: customerType,
      loyalty_points: loyaltyPoints,
      is_emergency: options.is_emergency || false,
      emergency_reason: options.emergency_reason || null,
      payment_option: options.payment_option || 'pay_at_shop'
    });

    // Recalculate estimated wait based on final position
    const shopQueues = mockDb.getQueuesByShop(shopId);
    const waitingQueues = shopQueues.filter((q: any) => q.status === 'waiting' && q.id !== queueData.id);
    const finalPosition = queueData.position;
    const estimatedWait = Math.max(0, (finalPosition - 1) * totalDuration);
    
    mockDb.updateQueue(queueData.id, { estimated_wait: estimatedWait });

    // Insert all services into queue_services
    const queueServices = serviceIds.map(serviceId => ({
      queue_id: queueData.id,
      service_id: serviceId
    }));
    mockDb.addQueueServices(queueServices);

    return { data: { ...queueData, estimated_wait: estimatedWait }, error: null };
  } catch (error: any) {
    console.error('Error joining queue:', error);
    return { data: null, error: error.message };
  }
};

// Get queue status
export const getQueueStatus = async (queueId: string) => {
  try {
    const queue = mockDb.getQueue(queueId);
    if (!queue) throw new Error('Queue not found');
    return { data: queue, error: null };
  } catch (error: any) {
    console.error('Error fetching queue status:', error);
    return { data: null, error: error.message };
  }
};

// Cancel queue entry
export const cancelQueue = async (queueId: string) => {
  try {
    mockDb.updateQueue(queueId, { status: 'cancelled' });
    return { data: { success: true }, error: null };
  } catch (error: any) {
    console.error('Error cancelling queue:', error);
    return { data: null, error: error.message };
  }
};

// Submit rating for completed service
export const submitRating = async (queueId: string, rating: number, reviewText = '') => {
  try {
    mockDb.updateQueue(queueId, { rating, review_text: reviewText });
    
    // Award loyalty points (1 point per rating star, bonus for 5 stars)
    const queue = mockDb.getQueue(queueId);
    if (queue && queue.user_id) {
      const user = mockDb.getUser(queue.user_id);
      if (user && user.role === 'customer') {
        const pointsToAdd = rating === 5 ? 6 : rating;
        mockDb.updateUser(queue.user_id, { 
          loyalty_points: (user.loyalty_points || 0) + pointsToAdd,
          customer_type: (user.loyalty_points || 0) + pointsToAdd >= 50 ? 'regular' : (user.customer_type || null)
        });
      }
    }
    
    return { data: { success: true }, error: null };
  } catch (error: any) {
    console.error('Error submitting rating:', error);
    return { data: null, error: error.message };
  }
};

// Appointment booking functions
export const getAvailableTimeSlots = async (shopId: string, date: string, duration: number) => {
  try {
    const shop = mockDb.getShop(shopId);
    if (!shop) throw new Error('Shop not found');

    // Parse opening hours (assuming format "HH:MM AM/PM - HH:MM AM/PM")
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const selectedDate = new Date(date);
    const dayName = dayNames[selectedDate.getDay()];
    const hours = shop.opening_hours?.[dayName] || '9:00 AM - 8:00 PM';
    
    const [openTime, closeTime] = hours.split(' - ');
    const parseTime = (timeStr: string) => {
      const [time, period] = timeStr.trim().split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;
      return hour24 * 60 + minutes; // minutes since midnight
    };

    const openMinutes = parseTime(openTime);
    const closeMinutes = parseTime(closeTime);

    // Generate 30-minute time slots
    const slots: string[] = [];
    for (let minutes = openMinutes; minutes + duration <= closeMinutes; minutes += 30) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      const timeSlot = `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
      
      // Check if slot is available
      const isAvailable = mockDb.checkTimeSlotAvailable(shopId, date, timeSlot, duration);
      if (isAvailable) {
        slots.push(timeSlot);
      }
    }

    return { data: slots, error: null };
  } catch (error: any) {
    console.error('Error fetching time slots:', error);
    return { data: null, error: error.message };
  }
};

export const createAppointment = async (
  shopId: string,
  serviceIds: string[],
  appointmentDate: string,
  appointmentTime: string,
  customerName: string,
  userId: string | null = null,
  options: {
    payment_option?: 'pay_now' | 'pay_at_shop' | 'pay_after_service';
    is_emergency?: boolean;
    emergency_reason?: string;
  } = {}
) => {
  try {
    // Check if customer already has an active appointment or queue
    const existingQueue = mockDb.getActiveQueue(customerName);
    if (existingQueue) {
      const shop = mockDb.getShop(existingQueue.shop_id);
      const shopName = shop?.name || 'another shop';
      return { 
        data: null, 
        error: `You already have an active booking at ${shopName}. Please complete or cancel it before booking another.` 
      };
    }

    // Get services and calculate duration
    const services = mockDb.getServices().filter((s: any) => serviceIds.includes(s.id));
    const totalDuration = services.reduce((sum: number, service: any) => sum + service.duration, 0) || 30;
    const totalPrice = services.reduce((sum: number, service: any) => sum + service.price, 0);

    // Combine date and time
    const appointmentDateTime = new Date(`${appointmentDate} ${appointmentTime}`);

    // Check if slot is still available
    const isAvailable = mockDb.checkTimeSlotAvailable(shopId, appointmentDate, appointmentTime, totalDuration);
    if (!isAvailable) {
      return { 
        data: null, 
        error: 'This time slot is no longer available. Please select another time.' 
      };
    }

    // Get user info
    const user = userId ? mockDb.getUser(userId) : null;
    const customerType = user?.customer_type || null;

    // Create appointment
    const appointment = mockDb.createAppointment({
      shop_id: shopId,
      service_id: serviceIds[0],
      appointment_date: appointmentDateTime.toISOString(),
      duration: totalDuration,
      price: totalPrice,
      customer_name: customerName,
      user_id: userId,
      customer_type: customerType,
      is_emergency: options.is_emergency || false,
      emergency_reason: options.emergency_reason || null,
      payment_option: options.payment_option || 'pay_at_shop'
    });

    // Add all services
    const appointmentServices = serviceIds.map(serviceId => ({
      appointment_id: appointment.id,
      service_id: serviceId
    }));
    mockDb.addAppointmentServices(appointmentServices);

    return { data: appointment, error: null };
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return { data: null, error: error.message };
  }
};

export const getAppointmentsByUser = async (userId: string) => {
  try {
    const allAppointments = mockDb.getAppointments();
    const userAppointments = allAppointments.filter((a: any) => a.user_id === userId);
    
    // Enrich with services
    const enriched = userAppointments.map((apt: any) => {
      const appointmentServices = mockDb.getAppointmentServicesForAppointment(apt.id);
      return {
        ...apt,
        services: appointmentServices.map((as: any) => {
          const service = mockDb.getService(as.service_id);
          return service;
        }).filter(Boolean)
      };
    });
    
    return { data: enriched, error: null };
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return { data: null, error: error.message };
  }
};
