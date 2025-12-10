// API base URL - remove /api suffix if present since endpoints already include it
const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  // Remove trailing /api if present to avoid double /api/api/ in URLs
  return url.replace(/\/api\/?$/, '');
};
const API_URL = getApiUrl();

// Get auth token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('winqroo_token');
};

// Make API request with authentication
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};

// Helper to parse JSON response
export const parseResponse = async <T>(response: Response): Promise<{ data?: T; error?: string }> => {
  try {
    // Check if response has content
    const contentType = response.headers.get('content-type');
    const text = await response.text();
    
    // If response is empty, return appropriate error
    if (!text || text.trim() === '') {
      if (!response.ok) {
        return { error: `Request failed with status ${response.status}` };
      }
      return { data: {} as T };
    }
    
    // Check if response is JSON
    if (!contentType || !contentType.includes('application/json')) {
      // If it's an error response, try to extract error message
      if (!response.ok) {
        return { error: text || `Request failed with status ${response.status}` };
      }
      // If it's not JSON but OK, return the text as data
      return { data: text as any };
    }
    
    // Parse JSON
    const json = JSON.parse(text);
    
    if (!response.ok) {
      return { error: json.error || json.message || `Request failed with status ${response.status}` };
    }
    
    return { data: json };
  } catch (error: any) {
    // If it's a network error or connection refused, provide better error message
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return { error: 'Network error: Unable to connect to server' };
    }
    // For JSON parse errors, provide more context
    if (error instanceof SyntaxError) {
      return { error: 'Invalid response format from server' };
    }
    return { error: error?.message || 'Failed to parse response' };
  }
};

