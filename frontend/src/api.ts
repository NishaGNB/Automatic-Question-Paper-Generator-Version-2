export const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

export async function api(path: string, opts: RequestInit = {}, token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers: { ...headers, ...(opts.headers || {}) } })
    if (!res.ok) {
      // If it's a 401 Unauthorized error, it might be due to token expiration
      if (res.status === 401) {
        // Clear the token from localStorage
        localStorage.removeItem('token')
        // Dispatch a custom event to notify the app about token expiration
        window.dispatchEvent(new CustomEvent('tokenExpired'))
      }
      
      const errorMessage = await res.text()
      throw new Error(errorMessage || `HTTP error! status: ${res.status}`)
    }
    return res.json()
  } catch (error) {
    console.error(`API call failed for ${API_BASE}${path}:`, error)
    throw error
  }
}