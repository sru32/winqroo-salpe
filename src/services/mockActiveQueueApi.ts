import { mockDb } from './mockData';

// Check if customer has an active queue entry
export const getActiveQueue = async (customerName: string) => {
  try {
    const queue = mockDb.getActiveQueue(customerName);
    
    if (!queue) {
      return { data: null, error: null };
    }

    // Get shop info
    const shop = mockDb.getShop(queue.shop_id);
    
    // Get queue services
    const queueServices = mockDb.getQueueServicesForQueue(queue.id);
    const allServices = mockDb.getServices();
    
    const services = queueServices.map((qs: any) => {
      const service = allServices.find((s: any) => s.id === qs.service_id);
      return service ? { services: service } : null;
    }).filter(Boolean);

    const enrichedQueue = {
      ...queue,
      shops: shop ? { name: shop.name } : null,
      queue_services: services
    };

    return { data: enrichedQueue, error: null };
  } catch (error: any) {
    console.error('Error fetching active queue:', error);
    return { data: null, error: error.message };
  }
};

// Update services in active queue
export const updateQueueServices = async (queueId: string, serviceIds: string[]) => {
  try {
    // Delete existing queue_services
    mockDb.deleteQueueServicesForQueue(queueId);

    // Insert new queue_services
    const queueServices = serviceIds.map(serviceId => ({
      queue_id: queueId,
      service_id: serviceId,
    }));
    mockDb.addQueueServices(queueServices);

    return { data: { success: true }, error: null };
  } catch (error: any) {
    console.error('Error updating queue services:', error);
    return { data: null, error: error.message };
  }
};
