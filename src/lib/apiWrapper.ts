// Simple API wrapper for backward compatibility
import { apiClient } from './api';

export const api = {
  get: async (endpoint: string) => {
    return apiClient['request'](endpoint, { method: 'GET' });
  },
  
  post: async (endpoint: string, data?: any) => {
    return apiClient['request'](endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  
  put: async (endpoint: string, data?: any) => {
    return apiClient['request'](endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  
  delete: async (endpoint: string) => {
    return apiClient['request'](endpoint, { method: 'DELETE' });
  },
};
