import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api'

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRedirecting = false

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    // Skip retry on login/refresh calls or if already retried
    const skipUrls = ['/auth/refresh', '/auth/admin-login', '/auth/login']
    if (error.response?.status === 401 && !original._retry && !skipUrls.includes(original.url)) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')
        const res = await axios.post(BASE_URL + '/auth/refresh', { refreshToken })
        const { accessToken, refreshToken: newRefresh } = res.data.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefresh)
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        document.cookie = 'accessToken=; path=/; max-age=0'
        useAuthStore.getState().logout()
        if (!isRedirecting) {
          isRedirecting = true
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get<{ success: boolean; data: T }>(url, config)
  return res.data.data
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  const res = await api.post<{ success: boolean; data: T }>(url, data)
  return res.data.data
}

export async function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  const res = await api.patch<{ success: boolean; data: T }>(url, data)
  return res.data.data
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await api.delete<{ success: boolean; data: T }>(url)
  return res.data.data
}

export async function apiPostForm<T>(url: string, formData: FormData): Promise<T> {
  const res = await api.post<{ success: boolean; data: T }>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}
