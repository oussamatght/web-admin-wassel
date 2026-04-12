'use client'

import { create } from 'zustand'
import { apiGet } from '@/lib/api'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
  updateUser: (data: Partial<User>) => void
  setLoading: (val: boolean) => void
  loadFromStorage: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    document.cookie = `accessToken=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
    set({ user, accessToken, isAuthenticated: true })
    connectSocket(accessToken)
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    document.cookie = 'accessToken=; path=/; max-age=0'
    document.cookie = 'refreshToken=; path=/; max-age=0'
    set({ user: null, accessToken: null, isAuthenticated: false })
    disconnectSocket()
  },

  updateUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),

  setLoading: (val) => set({ isLoading: val }),

  loadFromStorage: async () => {
    set({ isLoading: true })
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        document.cookie = 'accessToken=; path=/; max-age=0'
        set({ isLoading: false })
        return
      }
      const data = await apiGet<User>('/auth/me')
      if (data.role !== 'admin') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        document.cookie = 'accessToken=; path=/; max-age=0'
        set({ isLoading: false })
        return
      }
      document.cookie = `accessToken=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
      set({ user: data, accessToken: token, isAuthenticated: true })
      connectSocket(token)
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      document.cookie = 'accessToken=; path=/; max-age=0'
    } finally {
      set({ isLoading: false })
    }
  },
}))
