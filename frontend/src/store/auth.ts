import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/lib/api'

interface User {
  id: string
  email: string
  roles: string[]
}

interface AuthState {
  user:          User | null
  accessToken:   string | null
  refreshToken:  string | null
  isLoading:     boolean
  login:         (email: string, password: string) => Promise<void>
  register:      (email: string, password: string) => Promise<void>
  logout:        () => Promise<void>
  fetchMe:       () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      isLoading:    false,

      login: async (email, password) => {
        set({ isLoading: true })
        const data = await authApi.login(email, password)
        localStorage.setItem('access_token',  data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        set({ user: data.user, accessToken: data.access_token, refreshToken: data.refresh_token, isLoading: false })
      },

      register: async (email, password) => {
        set({ isLoading: true })
        const data = await authApi.register(email, password)
        localStorage.setItem('access_token',  data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        set({ user: data.user, accessToken: data.access_token, refreshToken: data.refresh_token, isLoading: false })
      },

      logout: async () => {
        const { refreshToken } = get()
        if (refreshToken) await authApi.logout(refreshToken).catch(() => {})
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null })
      },

      fetchMe: async () => {
        try {
          const user = await authApi.me()
          set({ user })
        } catch {
          set({ user: null, accessToken: null, refreshToken: null })
        }
      },
    }),
    { name: 'polymarket-auth', partialize: (s) => ({ refreshToken: s.refreshToken }) }
  )
)
