import { defineStore } from 'pinia'
import { api } from '../boot/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('auth_user') || 'null') as any,
    token: localStorage.getItem('auth_token') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    setSession(token: string, user: any) {
      this.token = token
      this.user = user
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))
    },

    clearSession() {
      this.token = null
      this.user = null
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    },

    async login(email: string, password: string) {
      const response = await api.post('/auth/login', { email, password })
      const payload = response.data.data ?? response.data
      this.setSession(payload.token, payload.user)
    },

    async register(data: any) {
      const response = await api.post('/auth/signup', data)
      const payload = response.data.data ?? response.data
      this.setSession(payload.token, payload.user)
    },

    async logout() {
      try {
        if (this.token) {
          await api.post('/account/logout')
        }
      } finally {
        this.clearSession()
      }
    },
  },
})