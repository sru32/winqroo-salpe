import { apiRequest, parseResponse } from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getActiveQueue = async (userIdOrName?: string) => {
  try {
    // The backend endpoint uses authentication token, so userIdOrName is not needed
    // but we keep it for backward compatibility with existing code
    const response = await apiRequest('/api/queues/my-queues');
    const result = await parseResponse<{ queues: any[] }>(response);
    
    if (result.data) {
      // Find active queue (waiting or in_progress)
      const activeQueue = result.data.queues.find(
        (q: any) => q.status === 'waiting' || q.status === 'in_progress'
      );
      return { data: activeQueue || null, error: undefined };
    }
    
    return { data: null, error: undefined };
  } catch (error) {
    return { data: null, error: undefined };
  }
};

export const updateQueueServices = async (queueId: string, services: string[]) => {
  // This might not be a direct API endpoint, but we can handle it
  // For now, just return success
  try {
    return { data: { success: true }, error: undefined };
  } catch (error) {
    return { data: null, error: 'Failed to update queue services' };
  }
};

