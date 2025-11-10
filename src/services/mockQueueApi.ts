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
export const joinQueue = async (shopId: string, serviceIds: string[], customerName: string, userId: string | null = null) => {
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

    // Get current queue position
    const shopQueues = mockDb.getQueuesByShop(shopId);
    const waitingQueues = shopQueues.filter((q: any) => q.status === 'waiting');
    const position = waitingQueues.length + 1;

    // Get total duration for all selected services
    const services = mockDb.getServices().filter((s: any) => serviceIds.includes(s.id));
    const totalDuration = services.reduce((sum: number, service: any) => sum + service.duration, 0) || 30;
    const estimatedWait = position * totalDuration;

    // Insert queue entry
    const queueData = mockDb.createQueue({
      shop_id: shopId,
      service_id: serviceIds[0],
      customer_name: customerName,
      user_id: userId,
      position,
      estimated_wait: estimatedWait,
      status: 'waiting'
    });

    // Insert all services into queue_services
    const queueServices = serviceIds.map(serviceId => ({
      queue_id: queueData.id,
      service_id: serviceId
    }));
    mockDb.addQueueServices(queueServices);

    return { data: queueData, error: null };
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
    return { data: { success: true }, error: null };
  } catch (error: any) {
    console.error('Error submitting rating:', error);
    return { data: null, error: error.message };
  }
};
