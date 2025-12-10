import { apiRequest, parseResponse } from './api';
import { mockDb } from './mockData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Get current user's shop
export const getMyShop = async () => {
  try {
    const response = await apiRequest('/api/shops/owner/my-shop');
    const result = await parseResponse<{ shop: any }>(response);
    
    if (result.data) {
      return { data: result.data.shop, error: undefined };
    }
    
    // Fallback to mock data
    const shopOwners = mockDb.getShopOwners();
    if (shopOwners.length > 0) {
      const shop = mockDb.getShop(shopOwners[0].shop_id);
      return { data: shop || null, error: undefined };
    }
    
    return { data: null, error: undefined };
  } catch (error) {
    // Fallback to mock data
    const shopOwners = mockDb.getShopOwners();
    if (shopOwners.length > 0) {
      const shop = mockDb.getShop(shopOwners[0].shop_id);
      return { data: shop || null, error: undefined };
    }
    return { data: null, error: undefined };
  }
};

// Get shop queues
export const getShopQueues = async (shopId: string) => {
  try {
    const response = await apiRequest(`/api/queues/shop/${shopId}`);
    const result = await parseResponse<{ queues: any[] }>(response);
    
    if (result.data) {
      return { data: result.data.queues, error: undefined };
    }
    
    // Fallback to mock data
    return { data: mockDb.getQueuesByShop(shopId), error: undefined };
  } catch (error) {
    return { data: mockDb.getQueuesByShop(shopId), error: undefined };
  }
};

// Update queue status
export const updateQueueStatus = async (queueId: string, status: string) => {
  try {
    const response = await apiRequest(`/api/queues/${queueId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    
    if (response.ok) {
      return { data: true, error: undefined };
    }
    
    // Fallback to mock data
    mockDb.updateQueue(queueId, { status: status as any });
    return { data: true, error: undefined };
  } catch (error) {
    // Fallback to mock data
    mockDb.updateQueue(queueId, { status: status as any });
    return { data: true, error: undefined };
  }
};

// Get shop appointments
export const getShopAppointments = async (shopId: string) => {
  try {
    const response = await apiRequest('/api/appointments');
    const result = await parseResponse<{ appointments: any[] }>(response);
    
    if (result.data) {
      // Filter by shop
      const shopAppointments = result.data.appointments.filter(
        (apt: any) => apt.shop?.id === shopId || apt.shop?._id === shopId || apt.shop_id === shopId
      );
      return { data: shopAppointments, error: undefined };
    }
    
    // Fallback to mock data
    return { data: mockDb.getAppointmentsByShop(shopId), error: undefined };
  } catch (error) {
    return { data: mockDb.getAppointmentsByShop(shopId), error: undefined };
  }
};

// Update appointment status
export const updateAppointmentStatus = async (appointmentId: string, status: string) => {
  try {
    const response = await apiRequest(`/api/appointments/${appointmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    
    if (response.ok) {
      return { data: true, error: undefined };
    }
    
    // Fallback to mock data
    mockDb.updateAppointment(appointmentId, { status: status as any });
    return { data: true, error: undefined };
  } catch (error) {
    // Fallback to mock data
    mockDb.updateAppointment(appointmentId, { status: status as any });
    return { data: true, error: undefined };
  }
};

// Get shop services
export const getShopServices = async (shopId: string) => {
  try {
    const response = await apiRequest(`/api/services/shop/${shopId}`);
    const result = await parseResponse<{ services: any[] }>(response);
    
    if (result.data) {
      return { data: result.data.services, error: undefined };
    }
    
    // Fallback to mock data
    return { data: mockDb.getServicesByShop(shopId), error: undefined };
  } catch (error) {
    return { data: mockDb.getServicesByShop(shopId), error: undefined };
  }
};

// Create service
export const createService = async (serviceData: {
  shop: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
}) => {
  try {
    const response = await apiRequest('/api/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
    const result = await parseResponse<{ service: any }>(response);
    
    if (result.data) {
      return { data: result.data.service, error: undefined };
    }
    
    // Fallback to mock data
    const service = mockDb.createService({
      name: serviceData.name,
      duration: serviceData.duration,
      price: serviceData.price,
      description: serviceData.description,
      shop_id: serviceData.shop,
      is_custom: true,
    });
    return { data: service, error: undefined };
  } catch (error) {
    // Fallback to mock data
    const service = mockDb.createService({
      name: serviceData.name,
      duration: serviceData.duration,
      price: serviceData.price,
      description: serviceData.description,
      shop_id: serviceData.shop,
      is_custom: true,
    });
    return { data: service, error: undefined };
  }
};

// Update service
export const updateService = async (serviceId: string, updates: {
  name?: string;
  duration?: number;
  price?: number;
  description?: string;
}) => {
  try {
    const response = await apiRequest(`/api/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    if (response.ok) {
      return { data: true, error: undefined };
    }
    
    return { data: false, error: 'Failed to update service' };
  } catch (error) {
    return { data: false, error: 'Failed to update service' };
  }
};

// Delete service
export const deleteService = async (serviceId: string) => {
  try {
    const response = await apiRequest(`/api/services/${serviceId}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      return { data: true, error: undefined };
    }
    
    // Fallback to mock data
    mockDb.deleteService(serviceId);
    return { data: true, error: undefined };
  } catch (error) {
    // Fallback to mock data
    mockDb.deleteService(serviceId);
    return { data: true, error: undefined };
  }
};

// Create or update shop
export const saveShop = async (shopData: {
  name: string;
  address?: string;
  phone?: string;
  description?: string;
  openingHours?: Record<string, any>;
  location?: { coordinates: [number, number] };
}) => {
  try {
    // Try to get existing shop first
    const myShopResponse = await getMyShop();
    const existingShop = myShopResponse.data;

    let response: Response;
    if (existingShop) {
      // Update existing shop
      response = await apiRequest(`/api/shops/${existingShop.id || existingShop._id}`, {
        method: 'PUT',
        body: JSON.stringify(shopData),
      });
    } else {
      // Create new shop
      response = await apiRequest('/api/shops', {
        method: 'POST',
        body: JSON.stringify(shopData),
      });
    }

    const result = await parseResponse<{ shop: any }>(response);
    
    if (result.data) {
      return { data: result.data.shop, error: undefined };
    }
    
    // Fallback to mock data
    if (existingShop) {
      mockDb.updateShop(existingShop.id || existingShop._id, shopData as any);
      return { data: { ...existingShop, ...shopData }, error: undefined };
    } else {
      const shop = mockDb.createShop(shopData as any);
      // Create shop owner link
      const user = JSON.parse(localStorage.getItem('winqroo_user') || '{}');
      if (user.id) {
        mockDb.createShopOwner({ shop_id: shop.id, user_id: user.id });
      }
      return { data: shop, error: undefined };
    }
  } catch (error) {
    // Fallback to mock data
    const myShopResponse = await getMyShop();
    const existingShop = myShopResponse.data;
    
    if (existingShop) {
      mockDb.updateShop(existingShop.id || existingShop._id, shopData as any);
      return { data: { ...existingShop, ...shopData }, error: undefined };
    } else {
      const shop = mockDb.createShop(shopData as any);
      const user = JSON.parse(localStorage.getItem('winqroo_user') || '{}');
      if (user.id) {
        mockDb.createShopOwner({ shop_id: shop.id, user_id: user.id });
      }
      return { data: shop, error: undefined };
    }
  }
};

