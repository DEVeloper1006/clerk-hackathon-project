import { useAuthStore } from '../stores/auth'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

const BASE_URL = import.meta.env.VITE_API_URL

export async function api<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = useAuthStore.getState().token
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
    const body = (await res.json()) as ApiResponse<T>
    if (res.status === 401) useAuthStore.getState().logout()
    return body
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}
