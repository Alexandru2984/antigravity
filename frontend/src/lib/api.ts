export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
export const listingsApi = {
  getAll: async () => {
    const res = await fetch(`${API_BASE_URL}/api/v1/listings`);
    return res.ok ? res.json() : [];
  },
  getById: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/listings/${id}`);
    return res.ok ? res.json() : null;
  },
  get: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/listings/${id}`);
    return res.ok ? res.json() : null;
  }
};
export const searchApi = {
  search: async (params: any) => {
    const query = typeof params === 'string' ? params : params.q || '';
    const res = await fetch(`${API_BASE_URL}/api/v1/search?q=${query}`);
    return res.ok ? res.json() : [];
  }
};
export const authApi = {
  login: async (email: any, password?: any) => ({ 
    user: { id: '1', email: typeof email === 'string' ? email : email.email, roles: ['user'] }, 
    access_token: 'mock-token',
    refresh_token: 'mock-refresh'
  }),
  register: async (email: any, password?: any) => ({ 
    user: { id: '1', email: typeof email === 'string' ? email : email.email, roles: ['user'] }, 
    access_token: 'mock-token',
    refresh_token: 'mock-refresh'
  }),
  me: async () => ({ id: '1', email: 'me@example.com', roles: ['user'] }),
  logout: async (token?: string) => ({ success: true })
};
