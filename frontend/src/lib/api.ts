import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        const { data } = await api.post('/auth/refresh', { refresh_token: refresh })
        localStorage.setItem('access_token',  data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth ───────────────────────────────────────────────────────
export const authApi = {
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }).then(r => r.data),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  logout: (refresh_token: string) =>
    api.post('/auth/logout', { refresh_token }),
}

// ── Listings ──────────────────────────────────────────────────
export const listingsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/listings', { params }).then(r => r.data),
  get: (id: string) =>
    api.get(`/listings/${id}`).then(r => r.data),
  create: (data: unknown) =>
    api.post('/listings', data).then(r => r.data),
  update: (id: string, data: unknown) =>
    api.put(`/listings/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/listings/${id}`),
  markSold: (id: string) =>
    api.post(`/listings/${id}/mark-sold`).then(r => r.data),
}

// ── Search ────────────────────────────────────────────────────
export const searchApi = {
  search: (params: Record<string, unknown>) =>
    api.get('/search', { params }).then(r => r.data),
}

// ── Profile ───────────────────────────────────────────────────
export const profileApi = {
  get: (userId: string) =>
    api.get(`/profiles/${userId}`).then(r => r.data),
  update: (data: unknown) =>
    api.put('/me/profile', data).then(r => r.data),
}
