import axios from 'axios'

// Backend responses look like { ok: true, data } or { ok: false, error: { code, message, details } }.
const TOKEN_KEY = 'skillbridge_token'
export const AUTH_EXPIRED = 'skillbridge:auth-expired'
export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export const setToken = (t) => {
  try { localStorage.setItem(TOKEN_KEY, t) } catch { /* storage unavailable: stay signed in for this tab only */ }
}
export const clearToken = () => {
  try { localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 300000, // project + rubric = 2 AI calls, each may retry once
})

http.interceptors.request.use((cfg) => {
  const t = getToken()
  if (t) cfg.headers.Authorization = `Token ${t}`
  else if (cfg.headers?.delete) cfg.headers.delete('Authorization')
  return cfg
})

// A stale token makes the API answer 401 even on public endpoints. Drop it and retry once as a guest.
http.interceptors.response.use(
  (r) => r,
  (error) => {
    const cfg = error.config
    const isAuthCall = /\/auth\/(login|register)/.test(cfg?.url || '')
    if (error.response?.status === 401 && cfg && !cfg._retried && getToken() && !isAuthCall) {
      clearToken()
      window.dispatchEvent(new Event(AUTH_EXPIRED))
      cfg._retried = true
      if (cfg.headers?.delete) cfg.headers.delete('Authorization')
      return http.request(cfg)
    }
    return Promise.reject(error)
  },
)

export class ApiError extends Error {
  constructor(message, code = 'error', details = null, status = 0) {
    super(message)
    this.code = code
    this.details = details
    this.status = status
  }
}

async function call(request) {
  try {
    const res = await request
    return res.data.data
  } catch (e) {
    const body = e.response?.data?.error
    if (body) throw new ApiError(body.message, body.code, body.details, e.response.status)
    if (e.response) throw new ApiError('The server returned an unexpected error. Check the Django terminal for details.', 'server_error', null, e.response.status)
    if (e.code === 'ECONNABORTED') throw new ApiError('The request took too long.', 'timeout')
    throw new ApiError('Cannot reach the server. Check that the backend is running on port 8000.', 'network')
  }
}

export const api = {
  demo: () => call(http.get('/demo/')),
  register: (body) => call(http.post('/auth/register/', body)),
  login: (body) => call(http.post('/auth/login/', body)),
  logout: () => call(http.post('/auth/logout/')),
  me: () => call(http.get('/auth/me/')),
  myPlans: () => call(http.get('/my/plans/')),
  health: () => call(http.get('/health/')),
  createProfile: (body) => call(http.post('/profiles/', body)),
  analyze: (profile_id) => call(http.post('/analyze/', { profile_id })),
  getAnalysis: (id) => call(http.get(`/analyses/${id}/`)),
  generateProject: (body) => call(http.post('/projects/generate/', body)),
  getProject: (id) => call(http.get(`/projects/${id}/`)),
  submit: (body) => call(http.post('/submissions/', body)),
  getResults: (id) => call(http.get(`/submissions/${id}/results/`)),
}

// Flatten DRF field errors into readable lines.
export function describeDetails(details) {
  if (!details || typeof details !== 'object') return []
  return Object.entries(details).map(([field, msg]) => {
    const text = Array.isArray(msg) ? msg.join(' ') : String(msg)
    return `${field.replace(/_/g, ' ')}: ${text}`
  })
}
