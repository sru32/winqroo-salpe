import { apiRequest, parseResponse } from './api';
import { mockDb } from './mockData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Shops
export const getShops = async (searchQuery?: string, lat?: number, lng?: number) => {
  try {
    const queryParams = new URLSearchParams();
    if (lat && lng) {
      queryParams.append('lat', lat.toString());
      queryParams.append('lng', lng.toString());
    }
    
    const response = await apiRequest(`/api/shops?${queryParams.toString()}`);
    
    // Check if response is ok
    if (response.ok) {
      const result = await parseResponse<{ shops: any[] }>(response);
      
      if (result.data && result.data.shops && Array.isArray(result.data.shops)) {
        // Transform backend shop format to frontend format
        const transformedShops = result.data.shops.map((shop: any) => ({
          id: shop._id || shop.id,
          name: shop.name,
          address: shop.address?.street 
            ? `${shop.address.street}, ${shop.address.city}, ${shop.address.state} ${shop.address.zipCode}`
            : shop.address || 'Address not available',
          rating: shop.rating?.average || shop.rating || 0,
          latitude: shop.location?.coordinates?.[1] || null,
          longitude: shop.location?.coordinates?.[0] || null,
          estimated_wait: 0, // Will be calculated from queue
          currentQueue: 0, // Will be calculated from queue
          distance: null, // Will be calculated if lat/lng provided
          description: shop.description,
          phone: shop.phone,
          email: shop.email,
        }));

        // Apply search filter if provided
        let filteredShops = transformedShops;
        if (searchQuery && searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filteredShops = transformedShops.filter((shop: any) =>
            shop.name.toLowerCase().includes(query) ||
            shop.address.toLowerCase().includes(query)
          );
        }

        console.log(`✅ Loaded ${filteredShops.length} shops from backend`);
        return { data: filteredShops, error: undefined };
      } else {
        console.warn('⚠️ Backend returned no shops or invalid format');
      }
    } else {
      console.warn(`⚠️ Backend request failed with status ${response.status}`);
    }
    
    // Fallback to mock data
    const mockShops = mockDb.getShops();
    let filteredMockShops = mockShops;
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredMockShops = mockShops.filter((shop: any) =>
        shop.name?.toLowerCase().includes(query) ||
        shop.address?.toLowerCase().includes(query)
      );
    }
    console.log(`📦 Using ${filteredMockShops.length} mock shops (backend unavailable or empty)`);
    return { data: filteredMockShops, error: undefined };
  } catch (error) {
    console.error('❌ Error fetching shops:', error);
    // Fallback to mock data
    const mockShops = mockDb.getShops();
    let filteredMockShops = mockShops;
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredMockShops = mockShops.filter((shop: any) =>
        shop.name?.toLowerCase().includes(query) ||
        shop.address?.toLowerCase().includes(query)
      );
    }
    console.log(`📦 Using ${filteredMockShops.length} mock shops (error occurred)`);
    return { data: filteredMockShops, error: undefined };
  }
};

// Services
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

// Queue
export const joinQueue = async (
  shopId: string,
  serviceIds: string | string[],
  customerName?: string,
  userId?: string,
  options?: {
    payment_option?: 'pay_now' | 'pay_at_shop';
    is_emergency?: boolean;
    emergency_reason?: string | null;
  }
) => {
  try {
    // Backend API only supports single service per queue entry
    // If multiple services provided, use the first one
    const serviceId = Array.isArray(serviceIds) ? serviceIds[0] : serviceIds;
    
    const response = await apiRequest('/api/queues', {
      method: 'POST',
      body: JSON.stringify({ 
        shop: shopId, 
        service: serviceId,
        // Note: customerName, userId, and options are not used by backend
        // as authentication is handled via token
        // These parameters are kept for backward compatibility
      }),
    });
    const result = await parseResponse<{ queue: any }>(response);
    
    if (result.data) {
      // Enrich response with additional data if provided
      const enrichedQueue = {
        ...result.data.queue,
        ...(options && {
          payment_option: options.payment_option,
          is_emergency: options.is_emergency,
          emergency_reason: options.emergency_reason,
        }),
      };
      return { data: enrichedQueue, error: undefined };
    }
    
    return { data: null, error: result.error || 'Failed to join queue' };
  } catch (error) {
    return { data: null, error: 'Failed to join queue' };
  }
};

export const cancelQueue = async (queueId: string) => {
  try {
    const response = await apiRequest(`/api/queues/${queueId}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      return { data: true, error: undefined };
    }
    
    return { data: false, error: 'Failed to cancel queue' };
  } catch (error) {
    return { data: false, error: 'Failed to cancel queue' };
  }
};

// Appointments
export const getAppointmentsByUser = async (userId: string) => {
  try {
    const response = await apiRequest('/api/appointments');
    const result = await parseResponse<{ appointments: any[] }>(response);
    
    if (result.data) {
      // Filter by user if needed (backend should handle this, but just in case)
      const userAppointments = result.data.appointments.filter(
        (apt: any) => apt.customer?.id === userId || apt.customer?._id === userId
      );
      return { data: userAppointments, error: undefined };
    }
    
    // Fallback to mock data
    return { data: mockDb.getAppointmentsByUser(userId), error: undefined };
  } catch (error) {
    return { data: mockDb.getAppointmentsByUser(userId), error: undefined };
  }
};

export const createAppointment = async (appointmentData: {
  shop: string;
  service: string;
  scheduledDate: string;
  scheduledTime: string;
}) => {
  try {
    const response = await apiRequest('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
    const result = await parseResponse<{ appointment: any }>(response);
    
    if (result.data) {
      return { data: result.data.appointment, error: undefined };
    }
    
    return { data: null, error: result.error || 'Failed to create appointment' };
  } catch (error) {
    return { data: null, error: 'Failed to create appointment' };
  }
};

export const getAvailableTimeSlots = async (shopId: string, date: string) => {
  // This is a simplified version - you might want to implement a proper endpoint
  // For now, generate time slots
  const slots = [];
  for (let hour = 9; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return { data: slots, error: undefined };
};

// Cancel appointment
export const cancelAppointment = async (appointmentId: string) => {
  try {
    const response = await apiRequest(`/api/appointments/${appointmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled' }),
    });
    
    if (response.ok) {
      return { data: true, error: undefined };
    }
    
    const result = await parseResponse(response);
    return { data: false, error: result.error || 'Failed to cancel appointment' };
  } catch (error) {
    // Fallback to mock data
    mockDb.updateAppointment(appointmentId, { status: 'cancelled' });
    return { data: true, error: undefined };
  }
};

// Ratings
export const submitRating = async (shopId: string, rating: number, comment?: string) => {
  // This endpoint might not exist yet, so we'll just return success for now
  try {
    // You can implement this when you add a ratings endpoint
    return { data: { success: true }, error: undefined };
  } catch (error) {
    return { data: null, error: 'Failed to submit rating' };
  }
};

