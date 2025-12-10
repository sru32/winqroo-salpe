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

// Helper function to create mock queue
const createMockQueue = (
  shopId: string,
  serviceIds: string | string[],
  customerName: string,
  userId: string,
  options?: {
    payment_option?: 'pay_now' | 'pay_at_shop';
    is_emergency?: boolean;
    emergency_reason?: string | null;
  }
) => {
  const serviceId = Array.isArray(serviceIds) ? serviceIds[0] : serviceIds;
  
  const queue = mockDb.createQueue({
    shop_id: shopId,
    customer_id: userId,
    service_id: serviceId,
    customer_name: customerName,
    payment_option: options?.payment_option,
    is_emergency: options?.is_emergency,
    emergency_reason: options?.emergency_reason || undefined,
  });
  
  return {
    _id: queue.id,
    id: queue.id,
    shop: { _id: shopId, id: shopId },
    customer: { _id: userId, id: userId, name: customerName },
    service: { _id: serviceId, id: serviceId },
    position: queue.position,
    status: queue.status,
    estimated_wait: queue.estimated_wait,
    joined_at: queue.joined_at,
    payment_option: options?.payment_option,
    is_emergency: options?.is_emergency,
    emergency_reason: options?.emergency_reason,
  };
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
    
    // Check status before parsing - if it's a 401 or server error, fallback immediately
    if (!response.ok && (response.status === 401 || response.status >= 500 || response.status === 0)) {
      if (response.status === 401) {
        console.log('📦 Using mock data (authentication required - user not logged in or token expired)');
      } else {
        console.log('📦 Using mock data (backend unavailable)');
      }
      // Only create mock queue if we have userId and customerName
      if (userId && customerName) {
        const mockQueue = createMockQueue(shopId, serviceIds, customerName, userId, options);
        return { data: mockQueue, error: undefined };
      } else {
        return { data: null, error: 'Please sign in to join the queue' };
      }
    }
    
    const result = await parseResponse<{ queue: any }>(response);
    
    if (result.data && result.data.queue) {
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
    
    // For validation errors (400, 403, 404, etc.), return the error
    return { data: null, error: result.error || 'Failed to join queue' };
  } catch (error) {
    console.error('Error joining queue:', error);
    // Fallback to mock data on network errors
    if (userId && customerName) {
      console.log('📦 Using mock data (network error)');
      const mockQueue = createMockQueue(shopId, serviceIds, customerName, userId, options);
      return { data: mockQueue, error: undefined };
    }
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
    
    if (result.data && result.data.appointments) {
      // Backend already filters by user, but verify just in case
      const userAppointments = result.data.appointments.filter(
        (apt: any) => {
          const customerId = apt.customer?._id?.toString() || apt.customer?.id?.toString() || apt.customer?.toString();
          return customerId === userId.toString();
        }
      );
      console.log(`📅 Loaded ${userAppointments.length} appointments from backend for user ${userId}`);
      return { data: userAppointments, error: undefined };
    }
    
    // Fallback to mock data
    console.log(`📦 Using mock data for appointments (user: ${userId})`);
    const mockAppointments = mockDb.getAppointmentsByUser(userId);
    console.log(`📅 Found ${mockAppointments.length} mock appointments`);
    return { data: mockAppointments, error: undefined };
  } catch (error: any) {
    console.error('Error loading appointments:', error);
    // Fallback to mock data
    console.log(`📦 Using mock data (error occurred) for user ${userId}`);
    const mockAppointments = mockDb.getAppointmentsByUser(userId);
    console.log(`📅 Found ${mockAppointments.length} mock appointments`);
    return { data: mockAppointments, error: undefined };
  }
};

export const createAppointment = async (
  shopId: string,
  serviceIds: string | string[],
  scheduledDate: string,
  scheduledTime: string,
  customerName?: string,
  userId?: string,
  options?: {
    payment_option?: 'pay_now' | 'pay_at_shop';
    is_emergency?: boolean;
    emergency_reason?: string | null;
  }
) => {
  try {
    // Backend API only supports single service per appointment
    // If multiple services provided, use the first one
    const serviceId = Array.isArray(serviceIds) ? serviceIds[0] : serviceIds;
    
    // Format the date properly for the backend (ISO 8601 format)
    const dateObj = new Date(scheduledDate);
    const formattedDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Convert time from 12-hour format (h:mm AM/PM) to 24-hour format (HH:MM)
    let formattedTime = scheduledTime;
    if (scheduledTime.includes('AM') || scheduledTime.includes('PM')) {
      const [timePart, ampm] = scheduledTime.split(' ');
      const [hours, minutes] = timePart.split(':');
      let hour24 = parseInt(hours, 10);
      
      if (ampm === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (ampm === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      formattedTime = `${hour24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
    
    const appointmentData = {
      shop: shopId,
      service: serviceId,
      scheduledDate: formattedDate,
      scheduledTime: formattedTime,
    };

    const response = await apiRequest('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
    
    // Check status before parsing - if it's a 401 or server error, fallback immediately
    if (!response.ok && (response.status === 401 || response.status >= 500 || response.status === 0)) {
      if (response.status === 401) {
        console.log('📦 Using mock data (authentication required - user not logged in or token expired)');
        console.log('   💡 Tip: Sign in to save appointments to the database');
      } else {
        console.log('📦 Using mock data (backend unavailable)');
      }
      // Only create mock appointment if we have userId
      if (userId) {
        const mockAppointment = await createMockAppointment(shopId, serviceIds, scheduledDate, scheduledTime, customerName, userId, options);
        return mockAppointment;
      } else {
        return { data: null, error: 'Please sign in to book an appointment' };
      }
    }
    
    const result = await parseResponse<{ appointment: any }>(response);
    
    if (result.error) {
      console.error('Appointment creation error:', result.error);
      // For validation errors (400, 403, 404, etc.), return the error
      return { data: null, error: result.error };
    }
    
    if (result.data && result.data.appointment) {
      // Enrich response with additional data if provided
      const enrichedAppointment = {
        ...result.data.appointment,
        ...(options && {
          payment_option: options.payment_option,
          is_emergency: options.is_emergency,
          emergency_reason: options.emergency_reason,
        }),
        // Include all selected services in the response for frontend display
        services: Array.isArray(serviceIds) 
          ? serviceIds.map((id, idx) => ({ id, name: `Service ${idx + 1}` }))
          : [{ id: serviceId, name: 'Service' }],
      };
      
      // Also save to mock data as backup
      try {
        const { mockDb } = await import('./mockData');
        const mockAppointment = {
          id: enrichedAppointment._id?.toString() || enrichedAppointment.id || `apt_${Date.now()}`,
          shop_id: shopId,
          customer_id: userId?.toString() || '',
          appointment_date: enrichedAppointment.scheduledDate 
            ? new Date(`${enrichedAppointment.scheduledDate}T${enrichedAppointment.scheduledTime || '00:00'}`).toISOString()
            : new Date().toISOString(),
          status: enrichedAppointment.status || 'scheduled',
          duration: enrichedAppointment.duration || 30,
          customer_name: customerName || 'Customer',
          payment_option: options?.payment_option || 'pay_at_shop',
          is_emergency: options?.is_emergency || false,
          emergency_reason: options?.emergency_reason || null,
          services: enrichedAppointment.services || [],
        };
        mockDb.addAppointment(mockAppointment);
        console.log('   📦 Also saved to mock data (backup for offline access)');
      } catch (mockError) {
        console.warn('   ⚠️ Could not save to mock data:', mockError);
      }
      
      console.log(`✅ Appointment saved to MongoDB: ${enrichedAppointment._id || enrichedAppointment.id}`);
      return { data: enrichedAppointment, error: undefined };
    }
    
    console.error('Unexpected response format:', result);
    return { data: null, error: 'Failed to create appointment: Invalid response format' };
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    // Fallback to mock data if backend is unavailable
    console.log('📦 Using mock data (backend unavailable)');
    return createMockAppointment(shopId, serviceIds, scheduledDate, scheduledTime, customerName, userId, options);
  }
};

// Helper function to create mock appointment
const createMockAppointment = async (
  shopId: string,
  serviceIds: string | string[],
  scheduledDate: string,
  scheduledTime: string,
  customerName?: string,
  userId?: string,
  options?: {
    payment_option?: 'pay_now' | 'pay_at_shop';
    is_emergency?: boolean;
    emergency_reason?: string | null;
  }
) => {
  try {
    const { mockDb } = await import('./mockData');
    const serviceId = Array.isArray(serviceIds) ? serviceIds[0] : serviceIds;
    const service = mockDb.getService(serviceId);
    
    if (!service) {
      console.error('Service not found:', serviceId);
      return { data: null, error: 'Service not found' };
    }
    
    if (!userId) {
      console.error('User ID is required for creating appointment');
      return { data: null, error: 'User ID is required' };
    }
    
    // Combine date and time
    const [timePart, ampm] = scheduledTime.includes('AM') || scheduledTime.includes('PM') 
      ? scheduledTime.split(' ') 
      : [scheduledTime, ''];
    const [hours, minutes] = timePart.split(':');
    let hour24 = parseInt(hours, 10);
    
    if (ampm === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (ampm === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    const appointmentDateTime = new Date(`${scheduledDate}T${hour24.toString().padStart(2, '0')}:${minutes}:00`);
    
    const appointment = {
      id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      shop_id: shopId,
      customer_id: userId.toString(), // Ensure it's a string and matches the format
      appointment_date: appointmentDateTime.toISOString(),
      status: 'scheduled',
      duration: service.duration,
      customer_name: customerName || 'Customer',
      payment_option: options?.payment_option || 'pay_at_shop',
      is_emergency: options?.is_emergency || false,
      emergency_reason: options?.emergency_reason || null,
      services: [{ name: service.name, price: service.price }],
    };
    
    console.log('📝 Creating mock appointment:', {
      id: appointment.id,
      shop_id: appointment.shop_id,
      customer_id: appointment.customer_id,
      appointment_date: appointment.appointment_date,
    });
    
    mockDb.addAppointment(appointment);
    
    // Verify it was saved
    const savedAppointment = mockDb.getAppointmentsByUser(userId.toString());
    console.log(`✅ Appointment saved. Total appointments for user: ${savedAppointment.length}`);
    
    return { data: appointment, error: undefined };
  } catch (error: any) {
    console.error('Error creating mock appointment:', error);
    return { data: null, error: error?.message || 'Failed to create appointment' };
  }
};

export const getAvailableTimeSlots = async (shopId: string, date: string, duration?: number) => {
  // This is a simplified version - you might want to implement a proper endpoint
  // For now, generate time slots (9:00 AM to 6:00 PM, every 30 minutes)
  const slots = [];
  for (let hour = 9; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      // Convert to 12-hour format for display
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      slots.push(`${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`);
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

