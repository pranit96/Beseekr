// Simple API wrapper for backward compatibility
import { apiClient } from './api';

export const api = {
  get: async <T = any>(endpoint: string, customOptions?: any): Promise<T> => {
    let url = endpoint;
    const { params, ...options } = customOptions || {};
    if (params) {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined)
      ) as Record<string, string>;
      const searchParams = new URLSearchParams(cleanParams);
      if (searchParams.toString()) url += `?${searchParams.toString()}`;
    }
    return apiClient['request']<any>(url, { method: 'GET', ...options }) as unknown as Promise<T>;
  },

  post: async <T = any>(endpoint: string, data?: any, customOptions?: any): Promise<T> => {
    return apiClient['request']<any>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...customOptions
    }) as unknown as Promise<T>;
  },

  put: async <T = any>(endpoint: string, data?: any, customOptions?: any): Promise<T> => {
    return apiClient['request']<any>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...customOptions
    }) as unknown as Promise<T>;
  },

  delete: async <T = any>(endpoint: string, customOptions?: any): Promise<T> => {
    return apiClient['request']<any>(endpoint, { method: 'DELETE', ...customOptions }) as unknown as Promise<T>;
  },
};
