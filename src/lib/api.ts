import { useAuthStore } from '../stores/authStore.js';

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = useAuthStore.getState().token;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    const response = await fetch(`/api${endpoint}`, config);
    
    if (response.status === 401) {
      // Token expirado ou inválido
      useAuthStore.getState().logout();
      throw new Error('Sessão expirada');
    }

    return response;
  },

  get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  },
}; 